import { ref, onMounted, onUnmounted, nextTick, readonly } from 'vue'

/**
 * Composable para implementar scroll infinito con intersection observer
 * Cumple con requisitos 1.1, 1.2, 1.4
 */
export function useInfiniteScroll(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    loadMoreFunction = null,
    canLoadMore = () => true,
    debounceDelay = 100,
    direction = 'vertical' // 'vertical' | 'horizontal'
  } = options

  const targetElement = ref(null)
  const isLoading = ref(false)
  const hasError = ref(false)
  const errorMessage = ref('')
  
  let observer = null
  let debounceTimer = null

  /**
   * Función debounced para cargar más datos
   */
  const debouncedLoadMore = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    debounceTimer = setTimeout(async () => {
      if (isLoading.value || !canLoadMore() || !loadMoreFunction) {
        return
      }

      try {
        isLoading.value = true
        hasError.value = false
        errorMessage.value = ''
        
        await loadMoreFunction()
      } catch (error) {
        console.error('Error en infinite scroll:', error)
        hasError.value = true
        errorMessage.value = error.message || 'Error al cargar más datos'
      } finally {
        isLoading.value = false
      }
    }, debounceDelay)
  }

  /**
   * Callback del intersection observer
   */
  const handleIntersection = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        debouncedLoadMore()
      }
    })
  }

  /**
   * Inicializa el intersection observer
   */
  const initializeObserver = () => {
    if (!targetElement.value) return

    observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    })

    observer.observe(targetElement.value)
  }

  /**
   * Desconecta el observer
   */
  const disconnectObserver = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  /**
   * Reinicia el observer
   */
  const resetObserver = async () => {
    disconnectObserver()
    await nextTick()
    initializeObserver()
  }

  /**
   * Pausa el observer temporalmente
   */
  const pauseObserver = () => {
    if (observer && targetElement.value) {
      observer.unobserve(targetElement.value)
    }
  }

  /**
   * Reanuda el observer
   */
  const resumeObserver = () => {
    if (observer && targetElement.value) {
      observer.observe(targetElement.value)
    }
  }

  /**
   * Fuerza la carga de más datos
   */
  const forceLoadMore = () => {
    debouncedLoadMore()
  }

  // Lifecycle hooks
  onMounted(() => {
    nextTick(() => {
      initializeObserver()
    })
  })

  onUnmounted(() => {
    disconnectObserver()
  })

  return {
    targetElement,
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),
    errorMessage: readonly(errorMessage),
    resetObserver,
    pauseObserver,
    resumeObserver,
    forceLoadMore,
    disconnect: disconnectObserver
  }
}

/**
 * Composable para scroll infinito basado en posición de scroll
 * Útil cuando no se puede usar intersection observer
 */
export function useScrollPosition(options = {}) {
  const {
    threshold = 100, // píxeles desde el final
    loadMoreFunction = null,
    canLoadMore = () => true,
    debounceDelay = 100,
    direction = 'vertical',
    container = null // elemento contenedor, null para window
  } = options

  const isLoading = ref(false)
  const hasError = ref(false)
  const errorMessage = ref('')
  const scrollPosition = ref(0)
  const containerElement = ref(container)
  
  let debounceTimer = null

  /**
   * Obtiene el elemento de scroll
   */
  const getScrollElement = () => {
    return containerElement.value || window
  }

  /**
   * Obtiene las dimensiones de scroll
   */
  const getScrollDimensions = () => {
    const element = containerElement.value
    
    if (element) {
      return {
        scrollTop: element.scrollTop,
        scrollLeft: element.scrollLeft,
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth
      }
    } else {
      return {
        scrollTop: window.pageYOffset || document.documentElement.scrollTop,
        scrollLeft: window.pageXOffset || document.documentElement.scrollLeft,
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientHeight: window.innerHeight,
        clientWidth: window.innerWidth
      }
    }
  }

  /**
   * Verifica si debe cargar más datos
   */
  const shouldLoadMore = () => {
    const dimensions = getScrollDimensions()
    
    if (direction === 'vertical') {
      const distanceFromBottom = dimensions.scrollHeight - 
        (dimensions.scrollTop + dimensions.clientHeight)
      return distanceFromBottom <= threshold
    } else {
      const distanceFromRight = dimensions.scrollWidth - 
        (dimensions.scrollLeft + dimensions.clientWidth)
      return distanceFromRight <= threshold
    }
  }

  /**
   * Función debounced para cargar más datos
   */
  const debouncedLoadMore = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    debounceTimer = setTimeout(async () => {
      if (isLoading.value || !canLoadMore() || !loadMoreFunction) {
        return
      }

      if (!shouldLoadMore()) {
        return
      }

      try {
        isLoading.value = true
        hasError.value = false
        errorMessage.value = ''
        
        await loadMoreFunction()
      } catch (error) {
        console.error('Error en scroll position:', error)
        hasError.value = true
        errorMessage.value = error.message || 'Error al cargar más datos'
      } finally {
        isLoading.value = false
      }
    }, debounceDelay)
  }

  /**
   * Handler del evento scroll
   */
  const handleScroll = () => {
    const dimensions = getScrollDimensions()
    scrollPosition.value = direction === 'vertical' 
      ? dimensions.scrollTop 
      : dimensions.scrollLeft
    
    debouncedLoadMore()
  }

  /**
   * Inicia el listener de scroll
   */
  const startListening = () => {
    const element = getScrollElement()
    element.addEventListener('scroll', handleScroll, { passive: true })
  }

  /**
   * Detiene el listener de scroll
   */
  const stopListening = () => {
    const element = getScrollElement()
    element.removeEventListener('scroll', handleScroll)
    
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  /**
   * Scroll hacia una posición específica
   */
  const scrollTo = (position, smooth = true) => {
    const element = containerElement.value
    const scrollOptions = {
      behavior: smooth ? 'smooth' : 'auto'
    }

    if (direction === 'vertical') {
      scrollOptions.top = position
    } else {
      scrollOptions.left = position
    }

    if (element) {
      element.scrollTo(scrollOptions)
    } else {
      window.scrollTo(scrollOptions)
    }
  }

  /**
   * Scroll hacia el final
   */
  const scrollToEnd = (smooth = true) => {
    const dimensions = getScrollDimensions()
    const position = direction === 'vertical' 
      ? dimensions.scrollHeight 
      : dimensions.scrollWidth
    
    scrollTo(position, smooth)
  }

  /**
   * Scroll hacia el inicio
   */
  const scrollToTop = (smooth = true) => {
    scrollTo(0, smooth)
  }

  // Lifecycle hooks
  onMounted(() => {
    startListening()
  })

  onUnmounted(() => {
    stopListening()
  })

  return {
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),
    errorMessage: readonly(errorMessage),
    scrollPosition: readonly(scrollPosition),
    containerElement,
    startListening,
    stopListening,
    scrollTo,
    scrollToEnd,
    scrollToTop,
    shouldLoadMore
  }
}

/**
 * Composable híbrido que combina intersection observer y scroll position
 * Proporciona la mejor experiencia según el contexto
 */
export function useAdvancedInfiniteScroll(options = {}) {
  const {
    preferIntersectionObserver = true,
    fallbackToScrollPosition = true,
    ...restOptions
  } = options

  const supportsIntersectionObserver = typeof IntersectionObserver !== 'undefined'
  const useIntersectionObserver = preferIntersectionObserver && supportsIntersectionObserver

  // Usar intersection observer si está disponible y es preferido
  if (useIntersectionObserver) {
    const infiniteScroll = useInfiniteScroll(restOptions)
    
    return {
      ...infiniteScroll,
      method: 'intersection-observer'
    }
  }
  
  // Fallback a scroll position si está habilitado
  if (fallbackToScrollPosition) {
    const scrollPosition = useScrollPosition(restOptions)
    
    return {
      ...scrollPosition,
      method: 'scroll-position',
      targetElement: scrollPosition.containerElement
    }
  }

  // Si no hay soporte, retornar implementación básica
  console.warn('useAdvancedInfiniteScroll: No hay soporte para infinite scroll')
  
  return {
    targetElement: ref(null),
    containerElement: ref(null),
    isLoading: ref(false),
    hasError: ref(false),
    errorMessage: ref(''),
    scrollPosition: ref(0),
    method: 'none',
    resetObserver: () => {},
    pauseObserver: () => {},
    resumeObserver: () => {},
    forceLoadMore: () => {},
    disconnect: () => {},
    startListening: () => {},
    stopListening: () => {},
    scrollTo: () => {},
    scrollToEnd: () => {},
    scrollToTop: () => {},
    shouldLoadMore: () => false
  }
}