/**
 * Exportaciones centralizadas de componentes comunes reutilizables
 * Optimizados para rendimiento del sistema de gestión de lavandería
 */

export { default as SkeletonLoader } from './SkeletonLoader.vue'
export { default as LazyDataTable } from './LazyDataTable.vue'
export { default as SearchField } from './SearchField.vue'

/**
 * Componentes comunes implementados:
 * 
 * 1. SkeletonLoader - Loader personalizable para diferentes tipos de contenido
 *    - Variantes: table, card, modal, list, dashboard, custom
 *    - Animaciones suaves: wave, pulse, none
 *    - Configuración flexible de filas/columnas
 *    - Requisitos cumplidos: 2.1
 * 
 * 2. LazyDataTable - Tabla con virtualización y lazy loading
 *    - Virtualización usando v-data-table-virtual de Vuetify
 *    - Lazy loading con intersection observer
 *    - Skeleton loading states durante carga inicial
 *    - Búsqueda con debounce y filtros reactivos
 *    - Scroll infinito automático
 *    - Sistema de caché inteligente
 *    - Requisitos cumplidos: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2
 * 
 * 3. SearchField - Campo de búsqueda optimizado
 *    - Debounce configurable (por defecto 300ms)
 *    - Indicadores de carga durante búsqueda
 *    - Sugerencias y autocompletado
 *    - Historial de búsquedas
 *    - Navegación por teclado
 *    - Estados de error y loading
 *    - Requisitos cumplidos: 1.3, 2.3, 3.3
 * 
 * Uso recomendado:
 * 
 * ```vue
 * <template>
 *   <!-- Skeleton Loader -->
 *   <SkeletonLoader 
 *     variant="table" 
 *     :rows="10" 
 *     animation="wave" 
 *   />
 * 
 *   <!-- Lazy Data Table -->
 *   <LazyDataTable
 *     :headers="headers"
 *     :fetch-function="fetchOperaciones"
 *     title="Operaciones"
 *     :initial-limit="50"
 *     cache-key="operaciones"
 *     @item-click="handleItemClick"
 *   >
 *     <template #item.actions="{ item }">
 *       <v-btn @click="viewDetails(item)">Ver</v-btn>
 *     </template>
 *   </LazyDataTable>
 * 
 *   <!-- Search Field -->
 *   <SearchField
 *     v-model="searchTerm"
 *     placeholder="Buscar operaciones..."
 *     :search-function="handleSearch"
 *     enable-suggestions
 *     enable-history
 *     @search="onSearch"
 *   />
 * </template>
 * 
 * <script setup>
 * import { SkeletonLoader, LazyDataTable, SearchField } from '@/components/common'
 * </script>
 * ```
 */