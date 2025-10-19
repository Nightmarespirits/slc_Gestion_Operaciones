<template>
  <v-dialog
    v-model="isOpen"
    transition="dialog-bottom-transition"
    fullscreen
    persistent
    :retain-focus="false"
  >
    <v-card>
      <!-- Header with loading state -->
      <v-toolbar color="primary" dark>
        <v-btn
          icon="mdi-close"
          @click="closeModal"
          :disabled="isLoading"
        />

        <v-toolbar-title>
          <div class="d-flex align-center">
            <span>Proceso {{ procesoId }}</span>
            <v-progress-circular
              v-if="isLoading"
              indeterminate
              size="20"
              width="2"
              class="ml-2"
            />
          </div>
        </v-toolbar-title>

        <v-spacer />

        <v-toolbar-items>
          <v-btn
            text="Actualizar"
            variant="text"
            @click="refreshData"
            :loading="isRefreshing"
            :disabled="isLoading"
          >
            <v-icon start>mdi-refresh</v-icon>
            Actualizar
          </v-btn>
          
          <v-btn
            text="Cerrar"
            variant="text"
            @click="closeModal"
            :disabled="isLoading"
          />
        </v-toolbar-items>
      </v-toolbar>

      <!-- Content with skeleton loading -->
      <v-container v-if="isLoading && !procesoData" class="pa-6">
        <SkeletonLoader variant="modal" :rows="6" />
      </v-container>

      <!-- Main content -->
      <v-container v-else-if="procesoData" class="pa-6">
        <!-- Process Overview -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-information-outline</v-icon>
                Información General
              </v-card-title>
              
              <v-card-text>
                <v-row>
                  <v-col cols="12" sm="6" md="3">
                    <div class="info-item">
                      <div class="text-caption text-grey">Operación ID</div>
                      <div class="text-h6">{{ procesoData.operacion || '[Sin asignar]' }}</div>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6" md="3">
                    <div class="info-item">
                      <div class="text-caption text-grey">Responsable</div>
                      <div class="text-h6">{{ getResponsableName(procesoData.responsable) }}</div>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6" md="3">
                    <div class="info-item">
                      <div class="text-caption text-grey">Sede</div>
                      <div class="text-h6">{{ procesoData.sede?.nombre || '[Sin asignar]' }}</div>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6" md="3">
                    <div class="info-item">
                      <div class="text-caption text-grey">Estado del Proceso</div>
                      <v-chip
                        :color="getProcessStatus() ? 'green' : 'red'"
                        :text="getProcessStatus() ? 'Finalizado' : 'Pendiente'"
                        class="text-uppercase"
                        size="small"
                        label
                      >
                        <template #prepend>
                          <v-icon size="small" class="pr-2">
                            {{ getProcessStatus() ? 'mdi-checkbox-marked-circle-outline' : 'mdi-clock-outline' }}
                          </v-icon>
                        </template>
                      </v-chip>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Progress Charts -->
        <v-row class="mb-6">
          <v-col cols="12" md="8">
            <v-card variant="outlined">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-chart-donut</v-icon>
                Progreso por Detalle
              </v-card-title>
              
              <v-card-text>
                <div ref="progressChartRef" style="height: 300px;"></div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-speedometer</v-icon>
                Métricas de Eficiencia
              </v-card-title>
              
              <v-card-text>
                <div class="metrics-container">
                  <div class="metric-item mb-4">
                    <div class="text-caption text-grey">Progreso Total</div>
                    <v-progress-circular
                      :model-value="getCompletionPercentage()"
                      :color="getProgressColor()"
                      size="80"
                      width="8"
                      class="my-2"
                    >
                      <span class="text-h6">{{ getCompletionPercentage() }}%</span>
                    </v-progress-circular>
                  </div>

                  <div class="metric-item mb-4">
                    <div class="text-caption text-grey">Detalles Completados</div>
                    <div class="text-h5">{{ getCompletedCount() }}/{{ getTotalCount() }}</div>
                  </div>

                  <div class="metric-item mb-4">
                    <div class="text-caption text-grey">Tiempo Estimado</div>
                    <div class="text-body-1">{{ getEstimatedTime() }}</div>
                  </div>

                  <div class="metric-item">
                    <div class="text-caption text-grey">Eficiencia</div>
                    <v-chip
                      :color="getEfficiencyColor()"
                      size="small"
                      label
                    >
                      {{ getEfficiencyLabel() }}
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Process Details Table -->
        <v-row>
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
                  Detalles de Proceso
                  <v-chip
                    variant="outlined"
                    size="small"
                    class="ml-2"
                  >
                    {{ paginatedDetalles.length }} de {{ totalDetalles }}
                  </v-chip>
                </div>

                <!-- Search and filters -->
                <div class="d-flex align-center gap-2">
                  <v-text-field
                    v-model="searchTerm"
                    placeholder="Buscar por N° Orden..."
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    style="max-width: 250px;"
                  />
                  
                  <v-select
                    v-model="statusFilter"
                    :items="statusFilterOptions"
                    placeholder="Estado"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    style="max-width: 150px;"
                  />
                </div>
              </v-card-title>

              <!-- Loading state for details -->
              <div v-if="isLoadingDetails" class="pa-4">
                <SkeletonLoader variant="table" :rows="5" />
              </div>

              <!-- Details table -->
              <v-data-table
                v-else
                :headers="detailsHeaders"
                :items="paginatedDetalles"
                :items-per-page="itemsPerPage"
                :page="currentPage"
                :items-length="filteredDetalles.length"
                :loading="isLoadingDetails"
                class="details-table"
                @update:page="currentPage = $event"
                @update:items-per-page="itemsPerPage = $event"
              >
                <!-- N° Orden column -->
                <template #item.numOrden="{ item }">
                  <div class="d-flex align-center">
                    <v-chip
                      :color="evalColor(item.colorMarcado || '')"
                      variant="elevated"
                      size="small"
                      label
                      class="mr-2"
                    >
                      {{ item.numOrden || '[Sin asignar]' }}
                    </v-chip>
                  </div>
                </template>

                <!-- Máquina column -->
                <template #item.maquina="{ item }">
                  <div class="d-flex align-center">
                    <v-icon size="small" class="mr-2">mdi-cog</v-icon>
                    {{ item.maquina?.nombre || '[Sin asignar]' }}
                  </div>
                </template>

                <!-- Cantidad column -->
                <template #item.cantidad="{ item }">
                  <v-chip
                    variant="outlined"
                    size="small"
                    color="primary"
                  >
                    {{ item.cantidad || 0 }}
                  </v-chip>
                </template>

                <!-- Identificador column -->
                <template #item.colorMarcado="{ item }">
                  <v-chip
                    :color="evalColor(item.colorMarcado || '')"
                    class="text-lowercase"
                    size="large"
                    label
                  >
                    {{ item.colorMarcado || '[Sin agregar]' }}
                  </v-chip>
                </template>

                <!-- Observaciones column -->
                <template #item.obs="{ item }">
                  <div class="obs-container">
                    <span v-if="item.obs && item.obs.length <= 50">
                      {{ item.obs }}
                    </span>
                    <div v-else-if="item.obs">
                      <span>{{ item.obs.substring(0, 50) }}...</span>
                      <v-tooltip :text="item.obs" location="top">
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            icon="mdi-information-outline"
                            size="x-small"
                            variant="text"
                            class="ml-1"
                          />
                        </template>
                      </v-tooltip>
                    </div>
                    <span v-else class="text-grey">Sin observaciones</span>
                  </div>
                </template>

                <!-- Estado column with progress -->
                <template #item.estado="{ item }">
                  <div class="estado-detail-container">
                    <v-chip
                      :color="item.estado ? 'green' : 'red'"
                      :text="item.estado ? 'Finalizado' : 'Pendiente'"
                      class="text-uppercase mb-1"
                      size="small"
                      label
                    >
                      <template #prepend>
                        <v-icon size="small" class="pr-2">
                          {{ item.estado ? 'mdi-checkbox-marked-circle-outline' : 'mdi-clock-outline' }}
                        </v-icon>
                      </template>
                    </v-chip>
                    
                    <!-- Time tracking -->
                    <div class="text-caption text-grey">
                      {{ getDetailTimeInfo(item) }}
                    </div>
                  </div>
                </template>

                <!-- Actions column -->
                <template #item.acciones="{ item }">
                  <div class="actions-container">
                    <v-btn
                      :icon="item.estado ? 'mdi-undo' : 'mdi-check'"
                      :color="item.estado ? 'orange' : 'green'"
                      variant="text"
                      size="small"
                      @click="toggleDetailStatus(item)"
                      :loading="updatingDetails[item._id]"
                    >
                      <v-tooltip
                        :text="item.estado ? 'Marcar como pendiente' : 'Marcar como completado'"
                        location="top"
                      >
                        <template #activator="{ props }">
                          <v-icon v-bind="props">
                            {{ item.estado ? 'mdi-undo' : 'mdi-check' }}
                          </v-icon>
                        </template>
                      </v-tooltip>
                    </v-btn>
                  </div>
                </template>

                <!-- No data state -->
                <template #no-data>
                  <div class="text-center pa-8">
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">
                      mdi-clipboard-search-outline
                    </v-icon>
                    <div class="text-h6 text-grey-darken-1 mb-2">
                      No hay detalles disponibles
                    </div>
                    <div class="text-body-2 text-grey">
                      Los detalles del proceso aparecerán aquí
                    </div>
                  </div>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Error state -->
      <v-container v-else-if="hasError" class="pa-6">
        <v-alert
          type="error"
          variant="tonal"
          class="mb-4"
        >
          <template #title>Error al cargar detalles del proceso</template>
          {{ errorMessage }}
          <div class="mt-2">
            <v-btn
              color="error"
              variant="outlined"
              @click="loadProcesoData"
            >
              <v-icon start>mdi-refresh</v-icon>
              Reintentar
            </v-btn>
          </div>
        </v-alert>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useProcesosStore } from '../../store/procesos'
import { evalColor } from '../../utils/evalColor'
import { dateTimeZConverter } from '../../utils/dateTimeZConverter'
import SkeletonLoader from '../common/SkeletonLoader.vue'
import * as echarts from 'echarts'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  procesoId: {
    type: String,
    default: ''
  },
  procesoData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'proceso-updated'])

// Store
const procesosStore = useProcesosStore()

// State
const isLoading = ref(false)
const isRefreshing = ref(false)
const isLoadingDetails = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const procesoData = ref(null)
const updatingDetails = ref({})

// Search and filters
const searchTerm = ref('')
const statusFilter = ref(null)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Chart
const progressChartRef = ref(null)
let progressChart = null

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const detailsHeaders = computed(() => [
  { align: 'center', key: 'numOrden', title: 'N° ORDEN', width: '15%' },
  { align: 'center', key: 'maquina', title: 'MÁQUINA', width: '15%' },
  { align: 'center', key: 'cantidad', title: 'CONTEO', width: '10%' },
  { align: 'center', key: 'colorMarcado', title: 'IDENTIFICADOR', width: '15%' },
  { align: 'center', key: 'obs', title: 'OBSERVACIONES', width: '25%' },
  { align: 'center', key: 'estado', title: 'ESTADO', width: '15%' },
  { align: 'center', key: 'acciones', title: 'ACCIONES', width: '5%', sortable: false }
])

const statusFilterOptions = computed(() => [
  { title: 'Todos', value: null },
  { title: 'Pendiente', value: false },
  { title: 'Finalizado', value: true }
])

const filteredDetalles = computed(() => {
  if (!procesoData.value?.detalles) return []
  
  let filtered = procesoData.value.detalles
  
  // Apply search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(detalle => 
      detalle.numOrden?.toString().toLowerCase().includes(search) ||
      detalle.maquina?.nombre?.toLowerCase().includes(search) ||
      detalle.obs?.toLowerCase().includes(search)
    )
  }
  
  // Apply status filter
  if (statusFilter.value !== null) {
    filtered = filtered.filter(detalle => detalle.estado === statusFilter.value)
  }
  
  return filtered
})

const paginatedDetalles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredDetalles.value.slice(start, end)
})

const totalDetalles = computed(() => procesoData.value?.detalles?.length || 0)

// Methods
const getResponsableName = (responsable) => {
  if (!responsable) return '[Sin asignar]'
  return `${responsable.nombres || ''} ${responsable.apellidos || ''}`.trim() || '[Sin nombre]'
}

const getProcessStatus = () => {
  if (!procesoData.value?.detalles || procesoData.value.detalles.length === 0) {
    return procesoData.value?.estado || false
  }
  return procesoData.value.detalles.every(detalle => detalle.estado === true)
}

const getCompletionPercentage = () => {
  if (!procesoData.value?.detalles || procesoData.value.detalles.length === 0) return 0
  const completed = procesoData.value.detalles.filter(d => d.estado === true).length
  return Math.round((completed / procesoData.value.detalles.length) * 100)
}

const getCompletedCount = () => {
  if (!procesoData.value?.detalles) return 0
  return procesoData.value.detalles.filter(d => d.estado === true).length
}

const getTotalCount = () => {
  return procesoData.value?.detalles?.length || 0
}

const getProgressColor = () => {
  const percentage = getCompletionPercentage()
  if (percentage === 100) return 'green'
  if (percentage >= 70) return 'orange'
  if (percentage >= 30) return 'yellow'
  return 'red'
}

const getEstimatedTime = () => {
  const total = getTotalCount()
  const completed = getCompletedCount()
  const remaining = total - completed
  
  if (remaining === 0) return 'Completado'
  
  // Estimate 15 minutes per detail (this could be configurable)
  const estimatedMinutes = remaining * 15
  const hours = Math.floor(estimatedMinutes / 60)
  const minutes = estimatedMinutes % 60
  
  if (hours > 0) {
    return `~${hours}h ${minutes}m restantes`
  } else {
    return `~${minutes}m restantes`
  }
}

const getEfficiencyColor = () => {
  const percentage = getCompletionPercentage()
  if (percentage >= 80) return 'green'
  if (percentage >= 50) return 'orange'
  return 'red'
}

const getEfficiencyLabel = () => {
  const percentage = getCompletionPercentage()
  if (percentage >= 80) return 'Alta'
  if (percentage >= 50) return 'Media'
  return 'Baja'
}

const getDetailTimeInfo = (detalle) => {
  if (detalle.fechaActualizacion) {
    const date = new Date(detalle.fechaActualizacion)
    return `Actualizado: ${date.toLocaleDateString()}`
  } else if (detalle.fechaCreacion) {
    const date = new Date(detalle.fechaCreacion)
    return `Creado: ${date.toLocaleDateString()}`
  }
  return 'Sin fecha'
}

const loadProcesoData = async () => {
  if (!props.procesoId) return
  
  try {
    isLoading.value = true
    hasError.value = false
    errorMessage.value = ''
    
    // Use store method to fetch detailed process data
    const data = await procesosStore.fetchProcesoDetails(props.procesoId)
    procesoData.value = data
    
    // Initialize chart after data is loaded
    await nextTick()
    initializeChart()
    
  } catch (error) {
    console.error('Error loading proceso data:', error)
    hasError.value = true
    errorMessage.value = error.message || 'Error al cargar los datos del proceso'
  } finally {
    isLoading.value = false
  }
}

const refreshData = async () => {
  try {
    isRefreshing.value = true
    
    // Invalidate cache and reload
    procesosStore.invalidateTypeCache(procesoData.value?.tipo)
    await loadProcesoData()
    
    emit('proceso-updated', procesoData.value)
  } catch (error) {
    console.error('Error refreshing data:', error)
  } finally {
    isRefreshing.value = false
  }
}

const toggleDetailStatus = async (detalle) => {
  try {
    updatingDetails.value[detalle._id] = true
    
    const newStatus = !detalle.estado
    await procesosStore.updateDetailStatus(props.procesoId, detalle._id, newStatus)
    
    // Update local data
    detalle.estado = newStatus
    
    // Update chart
    updateChart()
    
    emit('proceso-updated', procesoData.value)
    
  } catch (error) {
    console.error('Error updating detail status:', error)
  } finally {
    updatingDetails.value[detalle._id] = false
  }
}

const initializeChart = () => {
  if (!progressChartRef.value || !procesoData.value?.detalles) return
  
  // Dispose existing chart
  if (progressChart) {
    progressChart.dispose()
  }
  
  progressChart = echarts.init(progressChartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!progressChart || !procesoData.value?.detalles) return
  
  const completed = getCompletedCount()
  const pending = getTotalCount() - completed
  
  const option = {
    title: {
      text: `${getCompletionPercentage()}%`,
      subtext: 'Completado',
      left: 'center',
      top: 'center',
      textStyle: {
        fontSize: 24,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      left: 'center'
    },
    series: [
      {
        name: 'Estado de Detalles',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: [
          {
            value: completed,
            name: 'Completados',
            itemStyle: { color: '#4CAF50' }
          },
          {
            value: pending,
            name: 'Pendientes',
            itemStyle: { color: '#F44336' }
          }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: false
        }
      }
    ]
  }
  
  progressChart.setOption(option)
}

const closeModal = () => {
  isOpen.value = false
  
  // Reset state
  procesoData.value = null
  searchTerm.value = ''
  statusFilter.value = null
  currentPage.value = 1
  hasError.value = false
  errorMessage.value = ''
  
  // Dispose chart
  if (progressChart) {
    progressChart.dispose()
    progressChart = null
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue && props.procesoId) {
    // Use provided data if available, otherwise load from store
    if (props.procesoData) {
      procesoData.value = props.procesoData
      nextTick(() => initializeChart())
    } else {
      loadProcesoData()
    }
  }
})

watch(() => props.procesoData, (newData) => {
  if (newData && props.modelValue) {
    procesoData.value = newData
    nextTick(() => initializeChart())
  }
})

// Handle window resize for chart
const handleResize = () => {
  if (progressChart) {
    progressChart.resize()
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (progressChart) {
    progressChart.dispose()
  }
})
</script>

<style scoped>
.info-item {
  padding: 8px 0;
}

.metrics-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-item {
  width: 100%;
}

.details-table {
  /* Optimize table rendering */
  contain: layout style paint;
}

.obs-container {
  max-width: 200px;
  word-wrap: break-word;
}

.estado-detail-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.actions-container {
  display: flex;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .obs-container {
    max-width: 150px;
  }
}

/* Performance optimizations */
.optimized-proceso-details-modal :deep(.v-data-table) {
  /* Enable hardware acceleration */
  transform: translateZ(0);
  will-change: transform;
}

.optimized-proceso-details-modal :deep(.v-chip) {
  /* Optimize chip rendering */
  contain: layout style paint;
}

.optimized-proceso-details-modal :deep(.v-progress-circular) {
  /* Optimize progress rendering */
  contain: layout style paint;
}
</style>