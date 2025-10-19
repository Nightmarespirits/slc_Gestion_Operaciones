<template>
  <div class="optimized-proceso-table">
    <LazyDataTable
      :fetch-function="fetchProcesos"
      :headers="tableHeaders"
      :title="`Registros de Proceso ${title}`"
      :initial-limit="30"
      :load-more-limit="30"
      :search-placeholder="`Buscar por N° Orden o Responsable en ${title}`"
      :enable-cache="true"
      :cache-key="`procesos-${title.toLowerCase()}`"
      :table-height="600"
      :skeleton-rows="10"
      :sort-by="[{ key: 'fechaYHora', order: 'desc' }]"
      @item-click="handleItemClick"
      @search-change="handleSearchChange"
      @sort-change="handleSortChange"
    >
      <!-- Custom title with icon -->
      <template #title>
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-clipboard-outline</v-icon>
          <span>Registros de Proceso {{ title }}</span>
        </div>
      </template>

      <!-- Custom actions -->
      <template #actions>
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
      </template>

      <!-- Custom filters -->
      <template #filters="{ filters, updateFilter }">
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <v-select
              :model-value="filters.responsable"
              :items="responsableOptions"
              label="Responsable"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @update:model-value="updateFilter('responsable', $event)"
            >
              <template #prepend-inner>
                <v-icon size="small">mdi-account</v-icon>
              </template>
            </v-select>
          </v-col>
          
          <v-col cols="12" sm="6" md="4">
            <v-select
              :model-value="filters.estado"
              :items="estadoOptions"
              label="Estado"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @update:model-value="updateFilter('estado', $event)"
            >
              <template #prepend-inner>
                <v-icon size="small">mdi-check-circle</v-icon>
              </template>
            </v-select>
          </v-col>
          
          <v-col cols="12" sm="6" md="4">
            <v-select
              :model-value="filters.sede"
              :items="sedeOptions"
              label="Sede"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @update:model-value="updateFilter('sede', $event)"
            >
              <template #prepend-inner>
                <v-icon size="small">mdi-map-marker</v-icon>
              </template>
            </v-select>
          </v-col>
        </v-row>
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
            {{ formatDateTime(item.fecha) }}
          </div>
          <div class="text-caption text-grey">
            {{ formatTimeAgo(item.fecha) }}
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

          <v-btn
            v-if="title !== 'Finalizado'"
            icon="mdi-delete"
            variant="plain"
            color="error"
            size="small"
            @click.stop="handleDelete(item)"
          >
            <v-icon>mdi-delete</v-icon>
            <v-tooltip activator="parent" location="top">
              Eliminar proceso
            </v-tooltip>
          </v-btn>
        </div>
      </template>

      <!-- Custom no data state -->
      <template #no-data>
        <div class="text-center pa-8">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">
            mdi-clipboard-search-outline
          </v-icon>
          <div class="text-h6 text-grey-darken-1 mb-2">
            No hay procesos de {{ title.toLowerCase() }}
          </div>
          <div class="text-body-2 text-grey">
            Los procesos aparecerán aquí cuando sean creados
          </div>
        </div>
      </template>

      <!-- Custom error state -->
      <template #error="{ error, retry }">
        <div class="text-center pa-4">
          <v-icon size="48" color="error" class="mb-2">mdi-alert-circle</v-icon>
          <div class="text-body-1 mb-2">{{ error }}</div>
          <v-btn color="error" variant="outlined" @click="retry">
            <v-icon start>mdi-refresh</v-icon>
            Reintentar
          </v-btn>
        </div>
      </template>
    </LazyDataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProcesosStore } from '../../store/procesos'
import { evalColor } from '../../utils/evalColor'
import { dateTimeZConverter } from '../../utils/dateTimeZConverter'
import LazyDataTable from '../common/LazyDataTable.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
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
const isRefreshing = ref(false)
const loadingDetails = ref({})
const maxVisibleDetalles = ref(3)

// Computed
const tableHeaders = computed(() => [
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

const responsableOptions = computed(() => {
  return procesosStore.uniqueResponsables.map(nombre => ({
    title: nombre,
    value: nombre
  }))
})

const estadoOptions = computed(() => [
  { title: 'Pendiente', value: false },
  { title: 'Finalizado', value: true }
])

const sedeOptions = computed(() => {
  return procesosStore.uniqueSedes.map(nombre => ({
    title: nombre,
    value: nombre
  }))
})

// Methods
const fetchProcesos = async (params) => {
  try {
    const { page, limit, search, sortBy, sortOrder, ...filters } = params
    
    // Use store method for optimized fetching
    const result = await procesosStore.fetchProcesosByType(props.title.toLowerCase(), {
      page,
      limit
    })
    
    // Apply search and filters if provided
    if (search || Object.keys(filters).length > 0) {
      procesosStore.applyFilters({
        tipo: props.title.toLowerCase(),
        numOrden: search || '',
        ...filters
      })
    }
    
    const filteredData = procesosStore.filteredProcesos
    
    return {
      data: filteredData.slice((page - 1) * limit, page * limit),
      total: filteredData.length,
      hasMore: filteredData.length > page * limit
    }
  } catch (error) {
    console.error('Error fetching procesos:', error)
    throw error
  }
}

const getVisibleDetalles = (detalles) => {
  if (!detalles) return []
  return detalles.slice(0, maxVisibleDetalles.value)
}

const showAllDetalles = (item) => {
  // Emit event to show details modal
  handleViewDetails(item)
}

const formatDateTime = (fecha) => {
  return dateTimeZConverter(fecha) || fecha
}

const formatTimeAgo = (fecha) => {
  const now = new Date()
  const date = new Date(fecha)
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
  } else if (diffHours > 0) {
    return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  } else {
    return 'hace poco'
  }
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

const handleSearchChange = (searchTerm) => {
  // Search is handled by the LazyDataTable component
  // This is just for additional processing if needed
}

const handleSortChange = (sortInfo) => {
  // Sort is handled by the LazyDataTable component
  // This is just for additional processing if needed
}

const refreshData = async () => {
  try {
    isRefreshing.value = true
    procesosStore.invalidateTypeCache(props.title.toLowerCase())
    // The LazyDataTable will automatically refresh when cache is invalidated
  } catch (error) {
    console.error('Error refreshing data:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Initial load is handled by LazyDataTable
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