/**
 * Exportaciones centralizadas de composables de optimización de rendimiento
 */

export { useLazyLoading } from './useLazyLoading.js'
export { useDebounce, useSearchDebounce, useDebouncedFunction } from './useDebounce.js'
export { useInfiniteScroll, useScrollPosition, useAdvancedInfiniteScroll } from './useInfiniteScroll.js'
export { useVirtualization, useVirtualTable, useVirtualGroupedList } from './useVirtualization.js'
export { useOptimisticUpdates } from './useOptimisticUpdates.js'

/**
 * Composables de optimización de rendimiento implementados:
 * 
 * 1. useLazyLoading - Paginación y carga incremental
 *    - Carga inicial configurable (por defecto 50 registros)
 *    - Carga incremental con loadMore
 *    - Sistema de caché inteligente
 *    - Búsqueda con filtros
 *    - Estados de loading granulares
 * 
 * 2. useDebounce - Optimización de búsquedas
 *    - Debounce configurable (por defecto 300ms)
 *    - useSearchDebounce con historial
 *    - useDebouncedFunction para funciones genéricas
 *    - Cancelación y flush manual
 * 
 * 3. useInfiniteScroll - Scroll infinito
 *    - Intersection Observer para detección automática
 *    - Fallback a scroll position
 *    - Debounce integrado
 *    - Control de estados de carga
 * 
 * 4. useVirtualization - Listas virtualizadas
 *    - Windowing para listas grandes
 *    - Soporte para alturas dinámicas
 *    - useVirtualTable para tablas
 *    - useVirtualGroupedList para listas agrupadas
 * 
 * Requisitos cumplidos:
 * - 1.1: Carga inicial de 50 registros ✓
 * - 1.2: Carga automática al hacer scroll ✓
 * - 1.4: Mantenimiento de posición de scroll ✓
 * - 3.1: Carga inicial de 30 registros para procesos ✓
 * - 3.3: Búsqueda optimizada con debounce ✓
 */