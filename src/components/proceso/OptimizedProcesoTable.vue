<template>
  <div class="optimized-proceso-table">
    <!-- Usar directamente el store sin LazyDataTable -->
    <v-card>
      <!-- Header con búsqueda y filtros -->
      <v-card-title v-if="showHeader" class="d-flex align-center">
        <slot name="title">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-clipboard-outline</v-icon>
            <span>Registros de Proceso {{ title }}</span>
          </div>
        </slot>
        <v-spacer />
        <v-chip v-if="showItemCount" variant="outlined" size="small" color="primary">
          {{ totalItems }} elementos
        </v-chip>
      </v-card-title>

      <!-- Search and Filters Section -->
      <v-card v-if="showSearch || showFilters" flat class="mb-0">
        <v-card-text>
          <v-row align="center">
            <!-- Search Field -->
            <v-col v-if="showSearch" cols="12" md="6">
              <v-text-field
                v-model="searchTerm"
                :placeholder="`Buscar por N° Orden o Responsable en ${title}`"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                clearable
                hide-details
                :loading="isSearching"
                @click:clear="clearSearch"
              >
                <template #append-inner>
                  <v-fade-transition>
                    <v-progress-circular v-if="isSearching" size="20" width="2" indeterminate color="primary" />
                  </v-fade-transition>
                </template>
              </v-text-field>
            </v-col>

            <!-- Custom Filters -->
            <v-col v-if="showFilters" cols="12" md="6">
              <v-row dense>
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="filters.responsable"
                    :items="responsableOptions"
                    label="Responsable"
                    variant="outlined"
                    density="compact"
                    clearable
                    hide-details
                  >
                    <template #prepend-inner>
                      <v-icon size="small">mdi-account</v-icon>
                    </template>
                  </v-select>
                </v-col>
                
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="filters.estado"
                    :items="estadoOptions"
                    label="Estado"
                    variant="outlined"
                    density="compact"
                    clearable
                    hide-details
                  >
                    <template #prepend-inner>
                      <v-icon size="small">mdi-check-circle</v-icon>
                    </template>
                  </v-select>
                </v-col>
                
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="filters.sede"
                    :items="sedeOptions"
                    label="Sede"
                    variant="outlined"
                    density="compact"
                    clearable
                    hide-details
                  >
                    <template #prepend-inner>
                      <v-icon size="small">mdi-map-marker</v-icon>
                    </template>
                  </v-select>
                </v-col>
              </v-row>
            </v-col>

            <!-- Actions -->
            <v-col cols="12" md="auto">
              <slot name="actions">
                <v-btn
                  color="primary"
                  variant="outlined"
                  size="small"
                  @click="refreshData"
                  :loading="isRefreshing"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Actualizar
                </v-btn>
              </slot>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Skeleton Loader for Initial Loading -->
      <div v-if="isInitialLoading" class="pa-4">
        <v-skeleton-loader
          type="table-row@10"
          class="mx-auto"
        />
      </div>

      <!-- Data Table -->
      <template v-else>
        <!-- Virtualized Data Table -->
        <v-data-table-virtual
          :headers="computedHeaders"
          :items="displayedItems"
          :loading="isLoadingMore"
          :height="tableHeight"
          :item-value="itemValue"
          :sort-by="sortBy"
          :multi-sort="multiSort"
          :must-sort="mustSort"
          :items-per-page="-1"
          :hide-default-footer="true"
          class="optimized-table"
          @update:sort-by="handleSortUpdate"
        >
          <!-- Pass through all slots -->
          <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
            <slot v-if="!['title', 'filters', 'actions', 'loading-more', 'no-data', 'error'].includes(slotName)"
              :name="slotName" v-bind="slotProps" />
          </template>

          <!-- Detalles column with optimized rendering -->
          <template #item.detalles="{ item }">
            <div class="detalles-container">
              <v-chip
                v-for="(detalle, index) in getVisibleDetalles(item.detalles)"
                :key="`${item.id}-${detalle.numOrden}-${index}`"
                :color="evalColor(detalle?.colorMarcado || '')"
                variant="elevated"
                class="ma-1"
                size="small"
                label
              >
                <template #prepend>
                  <v-icon class="pr-2" size="small">mdi-more</v-icon>
                </template>
                {{ detalle?.numOrden || '[Editar]' }}
              </v-chip>
              
              <!-- Show more indicator -->
              <v-chip
                v-if="item.detalles && item.detalles.length > maxVisibleDetalles"
                variant="outlined"
                size="small"
                class="ma-1"
                @click="showAllDetalles(item)"
              >
                +{{ item.detalles.length - maxVisibleDetalles }} más
              </v-chip>
            </div>
          </template>

          <!-- Fecha y Hora column -->
          <template #item.fechaYHora="{ item }">
            <div class="fecha-container">
              <div class="text-body-2">
                {{ formatDateTime(item.createdAt) }}
              </div>
              <div class="text-caption text-grey">
                {{ formatHora(item.createdAt) }}
              </div>
            </div>
          </template>

          <!-- Responsable column -->
          <template #item.responsable="{ item }">
            <div class="responsable-container">
              <v-avatar size="24" class="mr-2">
                <v-icon size="small">mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2">
                  {{ getResponsableName(item.responsable) }}
                </div>
                <div class="text-caption text-grey">
                  {{ item.sede?.nombre || 'Sin sede' }}
                </div>
              </div>
            </div>
          </template>

          <!-- Estado column with progress indicator -->
          <template #item.estado="{ item }">
            <div class="estado-container">
              <v-chip
                :color="getProcessStatus(item) ? 'green' : 'red'"
                :text="getProcessStatus(item) ? 'Finalizado' : 'Pendiente'"
                class="text-uppercase mb-1"
                size="small"
                label
              >
                <template #prepend>
                  <v-icon size="small" class="pr-2">
                    {{ getProcessStatus(item) ? 'mdi-checkbox-marked-circle-outline' : 'mdi-clock-outline' }}
                  </v-icon>
                </template>
              </v-chip>
              
              <!-- Progress indicator -->
              <div v-if="item.detalles && item.detalles.length > 0" class="progress-container">
                <v-progress-linear
                  :model-value="getCompletionPercentage(item)"
                  :color="getProgressColor(item)"
                  height="4"
                  rounded
                  class="mb-1"
                />
                <div class="text-caption text-center">
                  {{ getCompletedDetailsCount(item) }}/{{ item.detalles.length }}
                </div>
              </div>
            </div>
          </template>

          <!-- Acciones column -->
          <template #item.acciones="{ item }">
            <div class="acciones-container">
              <v-btn
                icon="mdi-eye"
                variant="plain"
                color="primary"
                size="small"
                @click.stop="handleViewDetails(item)"
                :loading="loadingDetails[item.id]"
              >
                <v-icon>mdi-eye</v-icon>
                <v-tooltip activator="parent" location="top">
                  Ver detalles
                </v-tooltip>
              </v-btn>

              <v-btn
                v-if="title !== 'Finalizado'"
                icon="mdi-pencil"
                variant="plain"
                color="success"
                size="small"
                @click.stop="handleEdit(item)"
              >
                <v-icon>mdi-pencil</v-icon>
                <v-tooltip activator="parent" location="top">
                  Editar proceso
                </v-tooltip>
              </v-btn>
            </div>
          </template>
        </v-data-table-virtual>
      </template>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useProcesosStore } from '../../store/procesos'
import { evalColor } from '../../utils/evalColor'
import { dateTimeZConverter, formatTimeAgo } from '../../utils/dateTimeZConverter'
import { useSearchDebounce } from '../../composables/useDebounce'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  // Props adicionales para compatibilidad
  showSearch: {
    type: Boolean,
    default: true
  },
  showFilters: {
    type: Boolean,
    default: true
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showItemCount: {
    type: Boolean,
    default: true
  },
  tableHeight: {
    type: [String, Number],
    default: 600
  },
  itemValue: {
    type: String,
    default: 'id'
  },
  sortBy: {
    type: Array,
    default: () => [{ key: 'createdAt', order: 'desc' }]
  },
  multiSort: {
    type: Boolean,
    default: false
  },
  mustSort: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'onFullscreenItem',
  'onEditItem', 
  'onDeleteItem'
])

// Store
const procesosStore = useProcesosStore()

// State
const searchTerm = ref('')
const filters = ref({
  responsable: null,
  estado: null,
  sede: null
})
const isRefreshing = ref(false)
const loadingDetails = ref({})
const maxVisibleDetalles = ref(3)
const currentPage = ref(1)
const pageSize = ref(30)
const hasError = ref(false)
const errorMessage = ref('')

// Search debounce
const { isSearching } = useSearchDebounce(
  searchTerm,
  300,
  {
    onSearch: (term) => handleSearch(term),
    onClear: () => handleSearch('')
  }
)

// Computed
const computedHeaders = computed(() => [
  { 
    align: 'start', 
    key: 'detalles', 
    title: 'N° Orden (Tickets)', 
    width: '25%',
    sortable: false
  },
  { 
    align: 'center', 
    key: 'fechaYHora', 
    title: 'Fecha y Hora', 
    width: '20%',
    sortable: true
  },
  { 
    align: 'center', 
    key: 'responsable', 
    title: 'Responsable', 
    width: '20%',
    sortable: true
  },
  { 
    align: 'center', 
    key: 'estado', 
    title: 'Estado', 
    width: '15%',
    sortable: true
  },
  { 
    align: 'center', 
    key: 'acciones', 
    title: 'Acciones', 
    width: '20%',
    sortable: false
  }
])

const displayedItems = computed(() => {
  // Aplicar filtros usando el store
  procesosStore.applyFilters({
    tipo: props.title.toLowerCase(),
    search: searchTerm.value,
    ...filters.value
  })
  
  // Paginación local
  const start = 0
  const end = currentPage.value * pageSize.value
  return procesosStore.filteredProcesos.slice(start, end)
})

const totalItems = computed(() => procesosStore.filteredProcesos.length)
const isInitialLoading = computed(() => procesosStore.loading.initial)
const isLoadingMore = computed(() => procesosStore.loading.loadMore)

const canLoadMore = computed(() => {
  const totalFiltered = procesosStore.filteredProcesos.length
  const displayed = displayedItems.value.length
  return displayed < totalFiltered
})

const remainingItems = computed(() => {
  return totalItems.value - displayedItems.value.length
})

// Options para filtros
const responsableOptions = computed(() => {
  const options = procesosStore.getFilterOptions(props.title.toLowerCase())
  return options.responsables.map(nombre => ({
    title: nombre,
    value: nombre
  }))
})

const estadoOptions = computed(() => [
  { title: 'Pendiente', value: false },
  { title: 'Finalizado', value: true }
])

const sedeOptions = computed(() => {
  const options = procesosStore.getFilterOptions(props.title.toLowerCase())
  return options.sedes.map(nombre => ({
    title: nombre,
    value: nombre
  }))
})

// Methods
const handleSearch = async (term) => {
  await procesosStore.searchProcesos(term, props.title.toLowerCase())
}

const clearSearch = () => {
  searchTerm.value = ''
}

const loadMore = () => {
  currentPage.value += 1
}

const refreshData = async () => {
  try {
    isRefreshing.value = true
    procesosStore.invalidateTypeCache(props.title.toLowerCase())
    await procesosStore.loadProcesosByType(props.title.toLowerCase(), { 
      forceRefresh: true 
    })
  } catch (error) {
    console.error('Error refreshing data:', error)
    hasError.value = true
    errorMessage.value = error.message || 'Error al cargar datos'
  } finally {
    isRefreshing.value = false
  }
}

const retry = () => {
  hasError.value = false
  errorMessage.value = ''
  refreshData()
}

const getVisibleDetalles = (detalles) => {
  if (!detalles) return []
  return detalles.slice(0, maxVisibleDetalles.value)
}

const showAllDetalles = (item) => {
  handleViewDetails(item)
}

const formatDateTime = (fecha) => {
  return dateTimeZConverter(fecha)
}

const formatHora = (fecha) => {
  return formatTimeAgo(fecha)
}

const getResponsableName = (responsable) => {
  if (!responsable) return '[Sin asignar]'
  return `${responsable.nombres || '[Editar]'} ${responsable.apellidos || '[Editar]'}`
}

const getProcessStatus = (item) => {
  if (!item.detalles || item.detalles.length === 0) {
    return item.estado
  }
  return item.detalles.every(detalle => detalle.estado === true)
}

const getCompletedDetailsCount = (item) => {
  if (!item.detalles || item.detalles.length === 0) return 0
  return item.detalles.filter(detalle => detalle.estado === true).length
}

const getCompletionPercentage = (item) => {
  if (!item.detalles || item.detalles.length === 0) return 0
  const completed = getCompletedDetailsCount(item)
  return Math.round((completed / item.detalles.length) * 100)
}

const getProgressColor = (item) => {
  const percentage = getCompletionPercentage(item)
  if (percentage === 100) return 'green'
  if (percentage >= 70) return 'orange'
  if (percentage >= 30) return 'yellow'
  return 'red'
}

const handleItemClick = (item) => {
  handleViewDetails(item)
}

const handleViewDetails = async (item) => {
  try {
    loadingDetails.value[item.id] = true
    
    // Fetch detailed information if not already loaded
    await procesosStore.fetchProcesoDetails(item.id)
    
    emit('onFullscreenItem', item)
  } catch (error) {
    console.error('Error loading details:', error)
  } finally {
    loadingDetails.value[item.id] = false
  }
}

const handleEdit = (item) => {
  emit('onEditItem', item)
}

const handleDelete = (item) => {
  emit('onDeleteItem', item)
}

const handleSortUpdate = async (sortItems) => {
  // Implementar ordenamiento si es necesario
  console.log('Sort update:', sortItems)
}

// Watchers para filtros
watch(filters, () => {
  currentPage.value = 1 // Reset pagination when filters change
}, { deep: true })

// Lifecycle
onMounted(async () => {
  try {
    // Establecer el tipo en los filtros activos
    procesosStore.applyFilters({ tipo: props.title.toLowerCase() })
    
    // Cargar datos si no están en cache
    if (!procesosStore.isCacheValid(props.title.toLowerCase())) {
      await procesosStore.loadProcesosByType(props.title.toLowerCase())
    }
  } catch (error) {
    console.error('Error loading initial data:', error)
    hasError.value = true
    errorMessage.value = error.message || 'Error al cargar datos iniciales'
  }
})
</script>

<style scoped>
.optimized-proceso-table {
  width: 100%;
}

.detalles-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  max-width: 300px;
}

.fecha-container {
  text-align: center;
}

.responsable-container {
  display: flex;
  align-items: center;
  min-width: 150px;
}

.estado-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 120px;
}

.progress-container {
  width: 100%;
  min-width: 80px;
}

.acciones-container {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .detalles-container {
    max-width: 200px;
  }
  
  .responsable-container {
    min-width: 120px;
  }
  
  .estado-container {
    min-width: 100px;
  }
}

/* Performance optimizations */
.optimized-proceso-table :deep(.v-data-table-virtual__wrapper) {
  /* Enable hardware acceleration */
  transform: translateZ(0);
  will-change: transform;
}

.optimized-proceso-table :deep(.v-chip) {
  /* Optimize chip rendering */
  contain: layout style paint;
}

.optimized-proceso-table :deep(.v-progress-linear) {
  /* Optimize progress bar rendering */
  contain: layout style paint;
}
</style>