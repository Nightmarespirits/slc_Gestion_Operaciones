import { ref, reactive, computed, watch, readonly } from 'vue'

/**
 * Composable para implementar lazy loading con paginación y carga incremental
 * Cumple con requisitos 1.1, 1.2, 1.4, 3.1, 3.3
 */

// Cache Global simple en memoria
const globalCache = new Map()

export function useLazyLoading(options = {}) {
  const {
    initialLimit = 50,
    loadMoreLimit = 50,
    fetchFunction = null, //Hace la llamada a la api para obtener datos
    cacheKey = null,
    enableCache = true
  } = options

  // Estado reactivo
  const state = reactive({
    items: [],
    loading: {
      initial: false,
      loadMore: false,
      search: false
    },
    pagination: {
      page: 1,
      limit: initialLimit,
      total: 0,
      hasMore: true
    },
    filters: {
      search: '',
      sortBy: null,
      sortOrder: 'asc'
    },
    error: null,
    lastFetch: null
  })

  //Instanciando cache global
  const cache = globalCache

  // Computed properties
  const hasItems = computed(() => state.items.length > 0)
  const isLoading = computed(() => 
    state.loading.initial || state.loading.loadMore || state.loading.search
  )
  const canLoadMore = computed(() => 
    state.pagination.hasMore && !isLoading.value
  )

  /**
   * Genera clave de cache basada en filtros actuales
   */
  const getCacheKey = () => {
    if (!cacheKey) return null
    const filterKey = JSON.stringify({
      search: state.filters.search,
      sortBy: state.filters.sortBy,
      sortOrder: state.filters.sortOrder
    })
    return `${cacheKey}_${filterKey}`
  }

  /**
   * Obtiene datos del cache si están disponibles
   */
  const getFromCache = (key) => {
    if (!enableCache || !key) return null
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutos TTL
      return cached.data
    }
    return null
  }

  /**
   * Guarda datos en cache
   */
  const saveToCache = (key, data) => {
    if (!enableCache || !key) return
    cache.set(key, {
      data: { ...data },
      timestamp: Date.now()
    })
  }

  /**
   * Carga inicial de datos
   */
  const loadInitial = async (resetPagination = true) => {
    if (!fetchFunction) {
      console.warn('useLazyLoading: fetchFunction no proporcionada')
      return
    }

    try {
      state.loading.initial = true
      state.error = null

      if (resetPagination) {
        state.pagination.page = 1
        state.items = []
      }

      // Verificar cache
      const cacheKey = getCacheKey()
      const cachedData = getFromCache(cacheKey)
      
      if (cachedData && resetPagination) {
        state.items = cachedData.items
        state.pagination = { ...state.pagination, ...cachedData.pagination }
        state.loading.initial = false
        return cachedData
      }

      const params = {
        page: state.pagination.page,
        limit: state.pagination.limit,
        search: state.filters.search,
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder
      }

      const response = await fetchFunction(params)
      
      // Validar respuesta
      if (!response) {
        console.warn('useLazyLoading: respuesta vacía de fetchFunction');
        return { data: [], total: 0, hasMore: false };
      }
      
      // Manejar diferentes estructuras de respuesta
      let newItems = [];
      let total = 0;
      let hasMore = false;
      
      if (response.data) {
        newItems = Array.isArray(response.data) ? response.data : [];
        total = response.total || newItems.length;
        hasMore = response.hasMore || (newItems.length === state.pagination.limit);
      } else if (Array.isArray(response)) {
        newItems = response;
        total = newItems.length;
        hasMore = newItems.length === state.pagination.limit;
      } else {
        console.warn('useLazyLoading: estructura de respuesta no reconocida:', response);
        newItems = [];
        total = 0;
        hasMore = false;
      }
      
      if (resetPagination) {
        state.items = newItems
      } else {
        state.items.push(...newItems)
      }

      // Actualizar paginación con valores seguros
      state.pagination.total = total;
      state.pagination.hasMore = hasMore;
      state.lastFetch = Date.now();

      // Guardar en cache
      if (resetPagination) {
        saveToCache(cacheKey, {
          items: state.items,
          pagination: state.pagination
        })
      }

      return {
        data: newItems,
        total: total,
        hasMore: hasMore
      };
    } catch (error) {
      console.error('Error en loadInitial:', error)
      state.error = error.message || 'Error al cargar datos'
      throw error
    } finally {
      state.loading.initial = false
    }
  }

  /**
   * Carga más datos (paginación)
   */
  const loadMore = async () => {
    if (!canLoadMore.value || !fetchFunction) return

    try {
      state.loading.loadMore = true
      state.error = null

      state.pagination.page += 1
      state.pagination.limit = loadMoreLimit

      const params = {
        page: state.pagination.page,
        limit: state.pagination.limit,
        search: state.filters.search,
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder
      }

      const response = await fetchFunction(params)
      
      if (response && response.data) {
        const newItems = Array.isArray(response.data) ? response.data : []
        state.items.push(...newItems)
        
        // Actualizar estado de hasMore
        state.pagination.hasMore = newItems.length === state.pagination.limit
        state.pagination.total = response.total || state.pagination.total
        
        return response
      }
    } catch (error) {
      console.error('Error en loadMore:', error)
      state.error = error.message || 'Error al cargar más datos'
      // Revertir página en caso de error
      state.pagination.page -= 1
      throw error
    } finally {
      state.loading.loadMore = false
    }
  }

  /**
   * Buscar con filtros
   */
  const search = async (searchTerm = '', additionalFilters = {}) => {
    try {
      state.loading.search = true
      state.error = null

      // Actualizar filtros
      state.filters.search = searchTerm
      Object.assign(state.filters, additionalFilters)

      // Resetear paginación y cargar
      await loadInitial(true)
    } catch (error) {
      console.error('Error en search:', error)
      state.error = error.message || 'Error en la búsqueda'
      throw error
    } finally {
      state.loading.search = false
    }
  }

  /**
   * Actualizar ordenamiento
   */
  const updateSort = async (sortBy, sortOrder = 'asc') => {
    state.filters.sortBy = sortBy
    state.filters.sortOrder = sortOrder
    await loadInitial(true)
  }

  /**
   * Refrescar datos
   */
  const refresh = async () => {
    // Limpiar cache
    if (enableCache) {
      const key = getCacheKey()
      if (key) cache.delete(key)
    }
    await loadInitial(true)
  }

  /**
   * Limpiar estado
   */
  const reset = () => {
    state.items = []
    state.pagination.page = 1
    state.pagination.hasMore = true
    state.pagination.total = 0
    state.filters.search = ''
    state.filters.sortBy = null
    state.filters.sortOrder = 'asc'
    state.error = null
    state.loading.initial = false
    state.loading.loadMore = false
    state.loading.search = false
  }

  /**
   * Obtener item por ID
   */
  const getItemById = (id) => {
    return state.items.find(item => item.id === id)
  }

  /**
   * Actualizar item existente
   */
  const updateItem = (id, updates) => {
    const index = state.items.findIndex(item => item.id === id)
    if (index !== -1) {
      state.items[index] = { ...state.items[index], ...updates }
    }
  }

  /**
   * Eliminar item
   */
  const removeItem = (id) => {
    const index = state.items.findIndex(item => item.id === id)
    if (index !== -1) {
      state.items.splice(index, 1)
      state.pagination.total = Math.max(0, state.pagination.total - 1)
    }
  }

  /**
   * Agregar nuevo item
   */
  const addItem = (item, prepend = false) => {
    if (prepend) {
      state.items.unshift(item)
    } else {
      state.items.push(item)
    }
    state.pagination.total += 1
  }

  return {
    // Estado
    state: readonly(state),
    
    // Computed
    hasItems,
    isLoading,
    canLoadMore,
    
    // Métodos principales
    loadInitial,
    loadMore,
    search,
    updateSort,
    refresh,
    reset,
    
    // Métodos de manipulación
    getItemById,
    updateItem,
    removeItem,
    addItem
  }
}