import { ref, computed, reactive, watch, nextTick, onMounted, onUnmounted, readonly } from 'vue'

/**
 * Composable para implementar virtualización de listas grandes con windowing
 * Cumple con requisitos 1.1, 1.2, 1.4, 1.5
 */
export function useVirtualization(options = {}) {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5, // elementos extra a renderizar fuera del viewport
    scrollDebounce = 16, // ~60fps
    estimatedItemHeight = null,
    getItemHeight = null, // función para obtener altura dinámica
    horizontal = false
  } = options

  // Estado reactivo
  const state = reactive({
    scrollTop: 0,
    scrollLeft: 0,
    containerSize: horizontal ? containerHeight : containerHeight,
    isScrolling: false,
    scrollDirection: 'down'
  })

  const containerRef = ref(null)
  const items = ref([])
  const itemHeights = ref(new Map()) // cache de alturas para items dinámicos
  
  let scrollTimer = null
  let resizeObserver = null
  let lastScrollTop = 0

  /**
   * Calcula la altura de un item
   */
  const getItemSize = (index) => {
    if (getItemHeight) {
      const cachedHeight = itemHeights.value.get(index)
      if (cachedHeight !== undefined) {
        return cachedHeight
      }
      
      const height = getItemHeight(items.value[index], index)
      itemHeights.value.set(index, height)
      return height
    }
    
    return estimatedItemHeight || itemHeight
  }

  /**
   * Calcula el offset total hasta un índice
   */
  const getOffsetForIndex = (index) => {
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += getItemSize(i)
    }
    return offset
  }

  /**
   * Encuentra el índice del primer item visible
   */
  const getStartIndex = computed(() => {
    if (!items.value.length) return 0
    
    const scrollPosition = horizontal ? state.scrollLeft : state.scrollTop
    
    if (getItemHeight) {
      // Búsqueda binaria para alturas dinámicas
      let low = 0
      let high = items.value.length - 1
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        const offset = getOffsetForIndex(mid)
        
        if (offset < scrollPosition) {
          low = mid + 1
        } else {
          high = mid - 1
        }
      }
      
      return Math.max(0, high)
    } else {
      // Cálculo simple para alturas fijas
      return Math.floor(scrollPosition / itemHeight)
    }
  })

  /**
   * Calcula cuántos items caben en el viewport
   */
  const getVisibleCount = computed(() => {
    if (getItemHeight) {
      // Para alturas dinámicas, estimamos basado en altura promedio
      const avgHeight = estimatedItemHeight || itemHeight
      return Math.ceil(state.containerSize / avgHeight) + overscan * 2
    } else {
      return Math.ceil(state.containerSize / itemHeight) + overscan * 2
    }
  })

  /**
   * Índice del último item visible
   */
  const getEndIndex = computed(() => {
    return Math.min(
      items.value.length - 1,
      getStartIndex.value + getVisibleCount.value
    )
  })

  /**
   * Items visibles en el viewport
   */
  const visibleItems = computed(() => {
    const start = Math.max(0, getStartIndex.value - overscan)
    const end = Math.min(items.value.length, getEndIndex.value + overscan)
    
    return items.value.slice(start, end + 1).map((item, index) => ({
      item,
      index: start + index,
      offset: getOffsetForIndex(start + index),
      size: getItemSize(start + index)
    }))
  })

  /**
   * Altura total del contenido virtual
   */
  const totalSize = computed(() => {
    if (!items.value.length) return 0
    
    if (getItemHeight) {
      return getOffsetForIndex(items.value.length)
    } else {
      return items.value.length * itemHeight
    }
  })

  /**
   * Offset del primer item visible
   */
  const offsetY = computed(() => {
    const start = Math.max(0, getStartIndex.value - overscan)
    return getOffsetForIndex(start)
  })

  /**
   * Maneja el evento de scroll
   */
  const handleScroll = (event) => {
    const element = event.target
    const newScrollTop = element.scrollTop
    const newScrollLeft = element.scrollLeft
    
    // Detectar dirección del scroll
    state.scrollDirection = newScrollTop > lastScrollTop ? 'down' : 'up'
    lastScrollTop = newScrollTop
    
    state.scrollTop = newScrollTop
    state.scrollLeft = newScrollLeft
    state.isScrolling = true

    // Debounce para detectar fin del scroll
    if (scrollTimer) {
      clearTimeout(scrollTimer)
    }
    
    scrollTimer = setTimeout(() => {
      state.isScrolling = false
    }, scrollDebounce)
  }

  /**
   * Actualiza la altura de un item específico
   */
  const updateItemHeight = (index, height) => {
    if (getItemHeight) {
      itemHeights.value.set(index, height)
    }
  }

  /**
   * Scroll hacia un índice específico
   */
  const scrollToIndex = (index, align = 'auto') => {
    if (!containerRef.value || index < 0 || index >= items.value.length) {
      return
    }

    const offset = getOffsetForIndex(index)
    const itemSize = getItemSize(index)
    
    let scrollPosition = offset

    if (align === 'center') {
      scrollPosition = offset - (state.containerSize - itemSize) / 2
    } else if (align === 'end') {
      scrollPosition = offset - state.containerSize + itemSize
    } else if (align === 'auto') {
      const currentScroll = horizontal ? state.scrollLeft : state.scrollTop
      const itemStart = offset
      const itemEnd = offset + itemSize
      const viewportStart = currentScroll
      const viewportEnd = currentScroll + state.containerSize

      if (itemStart < viewportStart) {
        scrollPosition = itemStart
      } else if (itemEnd > viewportEnd) {
        scrollPosition = itemEnd - state.containerSize
      } else {
        return // Ya está visible
      }
    }

    if (horizontal) {
      containerRef.value.scrollLeft = Math.max(0, scrollPosition)
    } else {
      containerRef.value.scrollTop = Math.max(0, scrollPosition)
    }
  }

  /**
   * Scroll hacia un item específico
   */
  const scrollToItem = (item, align = 'auto') => {
    const index = items.value.findIndex(i => i === item || i.id === item.id)
    if (index !== -1) {
      scrollToIndex(index, align)
    }
  }

  /**
   * Obtiene el rango visible actual
   */
  const getVisibleRange = () => {
    return {
      start: Math.max(0, getStartIndex.value - overscan),
      end: Math.min(items.value.length - 1, getEndIndex.value + overscan),
      startVisible: getStartIndex.value,
      endVisible: getEndIndex.value
    }
  }

  /**
   * Verifica si un índice está visible
   */
  const isIndexVisible = (index) => {
    const range = getVisibleRange()
    return index >= range.startVisible && index <= range.endVisible
  }

  /**
   * Resetea el cache de alturas
   */
  const resetHeightCache = () => {
    itemHeights.value.clear()
  }

  /**
   * Actualiza el tamaño del contenedor
   */
  const updateContainerSize = () => {
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      state.containerSize = horizontal ? rect.width : rect.height
    }
  }

  /**
   * Inicializa el resize observer
   */
  const initializeResizeObserver = () => {
    if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        updateContainerSize()
      })
      resizeObserver.observe(containerRef.value)
    }
  }

  /**
   * Limpia los recursos
   */
  const cleanup = () => {
    if (scrollTimer) {
      clearTimeout(scrollTimer)
      scrollTimer = null
    }
    
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  // Watchers
  watch(() => items.value.length, () => {
    resetHeightCache()
  })

  watch(containerRef, (newRef) => {
    if (newRef) {
      nextTick(() => {
        updateContainerSize()
        initializeResizeObserver()
      })
    }
  })

  // Lifecycle
  onMounted(() => {
    nextTick(() => {
      updateContainerSize()
      initializeResizeObserver()
    })
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // Referencias
    containerRef,
    
    // Estado
    state: readonly(state),
    items,
    
    // Computed
    visibleItems,
    totalSize,
    offsetY,
    getStartIndex,
    getEndIndex,
    getVisibleCount,
    
    // Métodos
    handleScroll,
    updateItemHeight,
    scrollToIndex,
    scrollToItem,
    getVisibleRange,
    isIndexVisible,
    resetHeightCache,
    updateContainerSize,
    
    // Cleanup
    cleanup
  }
}

/**
 * Composable específico para tablas virtualizadas
 */
export function useVirtualTable(options = {}) {
  const {
    rowHeight = 50,
    headerHeight = 56,
    footerHeight = 0,
    ...virtualOptions
  } = options

  const tableContainerRef = ref(null)
  const headerRef = ref(null)
  const footerRef = ref(null)
  
  // Ajustar altura del contenedor para header y footer
  const adjustedContainerHeight = computed(() => {
    return (virtualOptions.containerHeight || 400) - headerHeight - footerHeight
  })

  const virtualization = useVirtualization({
    ...virtualOptions,
    itemHeight: rowHeight,
    containerHeight: adjustedContainerHeight.value
  })

  /**
   * Sincroniza el scroll horizontal entre header y contenido
   */
  const syncHorizontalScroll = (event) => {
    const scrollLeft = event.target.scrollLeft
    
    if (headerRef.value) {
      headerRef.value.scrollLeft = scrollLeft
    }
    
    if (footerRef.value) {
      footerRef.value.scrollLeft = scrollLeft
    }
    
    virtualization.handleScroll(event)
  }

  /**
   * Obtiene las filas visibles con información adicional para tabla
   */
  const visibleRows = computed(() => {
    return virtualization.visibleItems.value.map(({ item, index, offset, size }) => ({
      data: item,
      index,
      offset,
      height: size,
      isEven: index % 2 === 0,
      isOdd: index % 2 === 1
    }))
  })

  return {
    ...virtualization,
    
    // Referencias específicas de tabla
    tableContainerRef,
    headerRef,
    footerRef,
    
    // Computed específicos
    visibleRows,
    adjustedContainerHeight,
    
    // Métodos específicos
    syncHorizontalScroll,
    
    // Configuración
    rowHeight,
    headerHeight,
    footerHeight
  }
}

/**
 * Composable para listas virtualizadas con grupos
 */
export function useVirtualGroupedList(options = {}) {
  const {
    groupHeaderHeight = 40,
    getGroupKey = (item) => item.group,
    ...virtualOptions
  } = options

  const virtualization = useVirtualization(virtualOptions)
  
  // Procesar items en grupos
  const groupedItems = computed(() => {
    const groups = new Map()
    
    virtualization.items.value.forEach((item, index) => {
      const groupKey = getGroupKey(item)
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          items: [],
          startIndex: index
        })
      }
      
      groups.get(groupKey).items.push({ item, originalIndex: index })
    })
    
    return Array.from(groups.values())
  })

  // Crear lista plana con headers de grupo
  const flattenedItems = computed(() => {
    const flattened = []
    
    groupedItems.value.forEach(group => {
      // Agregar header del grupo
      flattened.push({
        type: 'group-header',
        data: group.key,
        height: groupHeaderHeight
      })
      
      // Agregar items del grupo
      group.items.forEach(({ item, originalIndex }) => {
        flattened.push({
          type: 'item',
          data: item,
          originalIndex,
          height: virtualOptions.itemHeight || 50
        })
      })
    })
    
    return flattened
  })

  // Actualizar items de virtualización
  watch(flattenedItems, (newItems) => {
    virtualization.items.value = newItems
  }, { immediate: true })

  return {
    ...virtualization,
    
    // Datos específicos de grupos
    groupedItems,
    flattenedItems,
    
    // Configuración
    groupHeaderHeight
  }
}