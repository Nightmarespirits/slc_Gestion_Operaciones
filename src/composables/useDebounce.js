import { ref, watch, unref, readonly } from 'vue'

/**
 * Composable para implementar debounce en búsquedas y optimizar consultas
 * Cumple con requisitos 1.3, 2.3, 3.3
 */
export function useDebounce(value, delay = 300, options = {}) {
  const {
    immediate = false,
    maxWait = null,
    leading = false,
    trailing = true
  } = options

  const debouncedValue = ref(unref(value))
  const isDebouncing = ref(false)
  
  let timeoutId = null
  let maxTimeoutId = null
  let lastCallTime = null
  let lastInvokeTime = 0

  /**
   * Cancela el debounce actual
   */
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId)
      maxTimeoutId = null
    }
    isDebouncing.value = false
    lastCallTime = null
  }

  /**
   * Ejecuta la actualización del valor
   */
  const invokeFunc = (newValue) => {
    lastInvokeTime = Date.now()
    debouncedValue.value = newValue
    isDebouncing.value = false
  }

  /**
   * Función principal de debounce
   */
  const debounceFunc = (newValue) => {
    const now = Date.now()
    const timeSinceLastCall = lastCallTime ? now - lastCallTime : 0
    const timeSinceLastInvoke = now - lastInvokeTime

    lastCallTime = now

    // Si es la primera llamada y leading es true
    if (leading && timeSinceLastInvoke >= delay) {
      invokeFunc(newValue)
      return
    }

    // Cancelar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    isDebouncing.value = true

    // Configurar nuevo timeout
    timeoutId = setTimeout(() => {
      if (trailing) {
        invokeFunc(newValue)
      }
      timeoutId = null
    }, delay)

    // Configurar maxWait si está definido
    if (maxWait && !maxTimeoutId) {
      maxTimeoutId = setTimeout(() => {
        invokeFunc(newValue)
        cancel()
      }, maxWait)
    }
  }

  /**
   * Fuerza la ejecución inmediata
   */
  const flush = () => {
    if (timeoutId) {
      invokeFunc(unref(value))
      cancel()
    }
  }

  // Watcher para el valor
  const stopWatcher = watch(
    () => unref(value),
    (newValue) => {
      debounceFunc(newValue)
    },
    { immediate }
  )

  // Cleanup al desmontar
  const cleanup = () => {
    cancel()
    stopWatcher()
  }

  return {
    debouncedValue: readonly(debouncedValue),
    isDebouncing: readonly(isDebouncing),
    cancel,
    flush,
    cleanup
  }
}

/**
 * Composable específico para búsquedas con funcionalidades adicionales
 */
export function useSearchDebounce(searchTerm, delay = 300, options = {}) {
  const {
    minLength = 0,
    onSearch = null,
    onClear = null,
    trimWhitespace = true,
    caseSensitive = false
  } = options

  const searchValue = ref(unref(searchTerm))
  const isSearching = ref(false)
  const searchHistory = ref([])
  const maxHistorySize = 10

  // Debounce del término de búsqueda
  const { debouncedValue, isDebouncing, cancel, flush } = useDebounce(
    searchValue,
    delay,
    { trailing: true }
  )

  /**
   * Procesa el término de búsqueda
   */
  const processSearchTerm = (term) => {
    let processed = term
    
    if (trimWhitespace) {
      processed = processed.trim()
    }
    
    if (!caseSensitive) {
      processed = processed.toLowerCase()
    }
    
    return processed
  }

  /**
   * Agrega término al historial
   */
  const addToHistory = (term) => {
    if (!term || term.length < minLength) return
    
    const processed = processSearchTerm(term)
    
    // Remover si ya existe
    const existingIndex = searchHistory.value.findIndex(
      item => processSearchTerm(item) === processed
    )
    
    if (existingIndex !== -1) {
      searchHistory.value.splice(existingIndex, 1)
    }
    
    // Agregar al inicio
    searchHistory.value.unshift(term)
    
    // Mantener tamaño máximo
    if (searchHistory.value.length > maxHistorySize) {
      searchHistory.value = searchHistory.value.slice(0, maxHistorySize)
    }
  }

  /**
   * Ejecuta la búsqueda
   */
  const executeSearch = async (term) => {
    if (term.length < minLength) {
      if (onClear) {
        await onClear()
      }
      return
    }

    try {
      isSearching.value = true
      
      if (onSearch) {
        await onSearch(term)
      }
      
      addToHistory(term)
    } catch (error) {
      console.error('Error en búsqueda:', error)
      throw error
    } finally {
      isSearching.value = false
    }
  }

  // Watcher para el valor debounced
  watch(debouncedValue, async (newValue) => {
    await executeSearch(newValue)
  })

  /**
   * Actualiza el término de búsqueda
   */
  const updateSearch = (term) => {
    searchValue.value = term
  }

  /**
   * Limpia la búsqueda
   */
  const clearSearch = () => {
    searchValue.value = ''
    cancel()
    if (onClear) {
      onClear()
    }
  }

  /**
   * Búsqueda inmediata (sin debounce)
   */
  const searchImmediate = async (term = null) => {
    const searchTerm = term !== null ? term : searchValue.value
    await executeSearch(searchTerm)
  }

  /**
   * Limpia el historial
   */
  const clearHistory = () => {
    searchHistory.value = []
  }

  /**
   * Obtiene sugerencias basadas en el historial
   */
  const getSuggestions = (currentTerm = '') => {
    if (!currentTerm) return searchHistory.value.slice(0, 5)
    
    const processed = processSearchTerm(currentTerm)
    
    return searchHistory.value
      .filter(item => 
        processSearchTerm(item).includes(processed) && 
        processSearchTerm(item) !== processed
      )
      .slice(0, 5)
  }

  return {
    // Estado
    searchValue,
    debouncedValue: readonly(debouncedValue),
    isSearching: readonly(isSearching),
    isDebouncing: readonly(isDebouncing),
    searchHistory: readonly(searchHistory),
    
    // Métodos
    updateSearch,
    clearSearch,
    searchImmediate,
    clearHistory,
    getSuggestions,
    cancel,
    flush
  }
}

/**
 * Composable para debounce de funciones genéricas
 */
export function useDebouncedFunction(func, delay = 300, options = {}) {
  const {
    leading = false,
    trailing = true,
    maxWait = null
  } = options

  const isExecuting = ref(false)
  let timeoutId = null
  let maxTimeoutId = null
  let lastCallTime = null
  let lastInvokeTime = 0
  let lastArgs = null

  /**
   * Cancela la ejecución pendiente
   */
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId)
      maxTimeoutId = null
    }
    isExecuting.value = false
    lastCallTime = null
    lastArgs = null
  }

  /**
   * Ejecuta la función
   */
  const invokeFunc = async (...args) => {
    lastInvokeTime = Date.now()
    isExecuting.value = true
    
    try {
      const result = await func(...args)
      return result
    } finally {
      isExecuting.value = false
    }
  }

  /**
   * Función debounced
   */
  const debouncedFunc = (...args) => {
    const now = Date.now()
    const timeSinceLastCall = lastCallTime ? now - lastCallTime : 0
    const timeSinceLastInvoke = now - lastInvokeTime

    lastCallTime = now
    lastArgs = args

    // Si es la primera llamada y leading es true
    if (leading && timeSinceLastInvoke >= delay) {
      return invokeFunc(...args)
    }

    // Cancelar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Configurar nuevo timeout
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        if (trailing) {
          try {
            const result = await invokeFunc(...lastArgs)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }
        timeoutId = null
      }, delay)

      // Configurar maxWait si está definido
      if (maxWait && !maxTimeoutId) {
        maxTimeoutId = setTimeout(async () => {
          try {
            const result = await invokeFunc(...lastArgs)
            resolve(result)
          } catch (error) {
            reject(error)
          }
          cancel()
        }, maxWait)
      }
    })
  }

  /**
   * Ejecuta inmediatamente
   */
  const flush = () => {
    if (timeoutId && lastArgs) {
      const result = invokeFunc(...lastArgs)
      cancel()
      return result
    }
  }

  return {
    debouncedFunc,
    isExecuting: readonly(isExecuting),
    cancel,
    flush
  }
}