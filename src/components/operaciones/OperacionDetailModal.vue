<template>
  <v-dialog 
    v-model="dialog" 
    max-width="1200px" 
    scrollable
    persistent
    transition="dialog-transition"
    :attach="false"
  >
    <v-card class="operacion-detail-modal">
      <!-- Header -->
      <v-card-title class="d-flex align-center bg-primary pa-4">
        <v-icon class="mr-3" color="white" size="large">mdi-clipboard-text</v-icon>
        <div class="text-white">
          <div class="text-h5 font-weight-bold">Operación {{ operacion?.id }}</div>
          <div class="text-caption opacity-80">Detalles completos de la operación</div>
        </div>
        <v-spacer />
        <v-chip 
          :color="operacion?.estadoOperacion ? 'success' : 'warning'"
          label
          size="large"
          class="mr-3"
        >
          <v-icon start size="small">
            {{ operacion?.estadoOperacion ? 'mdi-check-circle' : 'mdi-clock-outline' }}
          </v-icon>
          {{ operacion?.estadoOperacion ? 'Finalizada' : 'En Proceso' }}
        </v-chip>
        <v-btn
          icon
          variant="text"
          color="white"
          size="large"
          @click="closeModal"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text class="pa-0">
        <!-- Loading State -->
        <div v-if="loading" class="pa-6">
          <SkeletonLoader 
            variant="modal" 
            :rows="8" 
            animation="wave"
          />
        </div>
        
        <!-- Content -->
        <div v-else-if="operacion" class="pa-6">
          <!-- KPIs Section -->
          <v-row class="mb-6">
            <v-col cols="12" sm="6" md="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h3 text-primary font-weight-bold">
                  {{ operacion.ordenes?.length || 0 }}
                </div>
                <div class="text-subtitle-2 text-grey-darken-1">Órdenes Totales</div>
                <v-icon color="primary" size="small" class="mt-1">mdi-ticket-outline</v-icon>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h3 text-info font-weight-bold">
                  {{ operacion.procesos?.length || 0 }}
                </div>
                <div class="text-subtitle-2 text-grey-darken-1">Procesos</div>
                <v-icon color="info" size="small" class="mt-1">mdi-cog-outline</v-icon>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h3 text-success font-weight-bold">
                  {{ calculateDuration() }}
                </div>
                <div class="text-subtitle-2 text-grey-darken-1">Duración</div>
                <v-icon color="success" size="small" class="mt-1">mdi-timer-outline</v-icon>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card variant="outlined" class="text-center pa-4">
                <div class="text-h3 font-weight-bold" :class="getEfficiencyColor()">
                  {{ calculateEfficiency() }}%
                </div>
                <div class="text-subtitle-2 text-grey-darken-1">Eficiencia</div>
                <v-icon :color="getEfficiencyColor(true)" size="small" class="mt-1">
                  mdi-speedometer
                </v-icon>
              </v-card>
            </v-col>
          </v-row>

          <!-- Timeline Section -->
          <v-card class="mb-6" variant="outlined">
            <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-5">
              <v-icon class="mr-2" color="primary">mdi-timeline-outline</v-icon>
              <span class="text-h6">Timeline de Procesos</span>
              <v-spacer />
              <v-chip size="small" variant="outlined">
                {{ getCompletedProcesses() }} de {{ operacion.procesos?.length || 0 }} completados
              </v-chip>
            </v-card-title>
            
            <v-card-text class="pa-4">
              <ProcessTimeline 
                :procesos="operacion.procesos" 
                :loading="timelineLoading"
                @proceso-click="handleProcesoClick"
              />
            </v-card-text>
          </v-card>

          <!-- Progress Chart Section -->
          <v-card class="mb-6" variant="outlined">
            <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-5">
              <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
              <span class="text-h6">Progreso por Proceso</span>
            </v-card-title>
            
            <v-card-text class="pa-4">
              <ProcessProgressChart 
                :data="chartData" 
                :height="300"
                @chart-click="handleChartClick"
              />
            </v-card-text>
          </v-card>

          <!-- Orders Section -->
          <OrderDetailsSection 
            :operacion-id="operacion.id"
            :ordenes="operacion.ordenes"
            :loading="ordersLoading"
            @order-updated="handleOrderUpdate"
          />
        </div>
        
        <!-- Error State -->
        <div v-else class="pa-6 text-center">
          <v-icon size="64" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
          <div class="text-h6 text-error mb-2">Error al cargar los detalles</div>
          <div class="text-body-2 text-grey mb-4">
            No se pudieron cargar los detalles de la operación
          </div>
          <v-btn color="primary" @click="retryLoad">
            <v-icon start>mdi-refresh</v-icon>
            Reintentar
          </v-btn>
        </div>
      </v-card-text>
      
      <!-- Actions -->
      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="closeModal"
        >
          Cerrar
        </v-btn>
        <v-btn
          v-if="!operacion?.estadoOperacion"
          color="success"
          variant="flat"
          :loading="updatingStatus"
          @click="markAsCompleted"
        >
          <v-icon start>mdi-check</v-icon>
          Marcar como Finalizada
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useOperacionesStore } from '../../store/operaciones'
import SkeletonLoader from '../common/SkeletonLoader.vue'
import ProcessTimeline from './ProcessTimeline.vue'
import ProcessProgressChart from './ProcessProgressChart.vue'
import OrderDetailsSection from './OrderDetailsSection.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  operacionId: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'operacion-updated'])

// Store
const operacionesStore = useOperacionesStore()

// Reactive state
const loading = ref(false)
const timelineLoading = ref(false)
const ordersLoading = ref(false)
const updatingStatus = ref(false)
const operacion = ref(null)

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const chartData = computed(() => {
  if (!operacion.value?.procesos || !Array.isArray(operacion.value.procesos)) return []
  
  return operacion.value.procesos.map(proceso => ({
    name: proceso.tipo || 'Proceso sin nombre',
    value: calculateProcesoProgress(proceso),
    color: getProcesoColor(proceso.tipo),
    responsable: proceso.responsable || 'No asignado',
    fecha: proceso.fecha || new Date().toISOString()
  })).filter(item => item.name && typeof item.value === 'number')
})

// Methods
const loadOperacionDetails = async () => {
  if (!props.operacionId) return
  
  loading.value = true
  try {
    // Primero intentar obtener de caché
    let operacionData = operacionesStore.getById(props.operacionId)
    
    if (!operacionData || !operacionData.hasFullDetails) {
      // Si no está en caché o no tiene detalles completos, cargar desde API
      operacionData = await operacionesStore.fetchOperacionDetails(props.operacionId)
    }
    
    // Asegurar estructura de datos válida
    operacion.value = {
      id: operacionData.id,
      ordenes: operacionData.ordenes || [],
      procesos: Array.isArray(operacionData.procesos) ? operacionData.procesos.map(proceso => ({
        id: proceso.id,
        tipo: proceso.tipo || 'Proceso sin nombre',
        responsable: proceso.responsable || 'No asignado',
        fecha: proceso.fecha || new Date().toISOString(),
        detalles: Array.isArray(proceso.detalles) ? proceso.detalles : []
      })) : [],
      fechas: operacionData.fechas || {
        fecCreacion: new Date().toISOString(),
        inicio: null,
        final: null
      },
      estadoOperacion: operacionData.estadoOperacion || false,
      currentStage: operacionData.currentStage || null
    }
  } catch (error) {
    console.error('Error loading operacion details:', error)
    operacion.value = null
  } finally {
    loading.value = false
  }
}

const calculateDuration = () => {
  if (!operacion.value?.fechas) return '0h'
  
  const inicio = operacion.value.fechas.inicio
  const final = operacion.value.fechas.final || new Date()
  
  if (!inicio) return '0h'
  
  const diff = new Date(final) - new Date(inicio)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const calculateEfficiency = () => {
  if (!operacion.value?.procesos) return 0
  
  const totalProcesos = operacion.value.procesos.length
  const completedProcesos = getCompletedProcesses()
  
  if (totalProcesos === 0) return 0
  
  return Math.round((completedProcesos / totalProcesos) * 100)
}

const getEfficiencyColor = (returnString = false) => {
  const efficiency = calculateEfficiency()
  
  if (efficiency >= 80) {
    return returnString ? 'success' : 'text-success'
  } else if (efficiency >= 60) {
    return returnString ? 'warning' : 'text-warning'
  } else {
    return returnString ? 'error' : 'text-error'
  }
}

const getCompletedProcesses = () => {
  if (!operacion.value?.procesos || !Array.isArray(operacion.value.procesos)) return 0
  
  return operacion.value.procesos.filter(proceso => 
    proceso && calculateProcesoProgress(proceso) === 100
  ).length
}

const calculateProcesoProgress = (proceso) => {
  if (!proceso || !proceso.detalles || !Array.isArray(proceso.detalles) || proceso.detalles.length === 0) return 0
  
  const completed = proceso.detalles.filter(detalle => detalle && detalle.completed).length
  return Math.round((completed / proceso.detalles.length) * 100)
}

const getProcesoColor = (tipo) => {
  const colors = {
    'Lavado': '#2196F3',
    'Secado': '#FF9800',
    'Planchado': '#4CAF50',
    'Doblado': '#9C27B0',
    'Teñido': '#F44336'
  }
  return colors[tipo] || '#757575'
}

const handleProcesoClick = (proceso) => {
  // Handle proceso click - could open detailed view
  console.log('Proceso clicked:', proceso)
}

const handleChartClick = (data) => {
  // Handle chart click
  console.log('Chart clicked:', data)
}

const handleOrderUpdate = (orderData) => {
  // Handle order update
  emit('operacion-updated', orderData)
}

const markAsCompleted = async () => {
  updatingStatus.value = true
  try {
    // Update operacion status
    await operacionesStore.updateOperacion(operacion.value.id, {
      estadoOperacion: true,
      fechas: {
        ...operacion.value.fechas,
        final: new Date().toISOString()
      }
    })
    
    // Reload details
    await loadOperacionDetails()
    emit('operacion-updated', operacion.value)
  } catch (error) {
    console.error('Error updating operacion status:', error)
  } finally {
    updatingStatus.value = false
  }
}

const closeModal = () => {
  dialog.value = false
}

const retryLoad = () => {
  loadOperacionDetails()
}

// Watchers
watch(() => props.operacionId, (newId) => {
  if (newId && dialog.value) {
    loadOperacionDetails()
  }
})

watch(dialog, (isOpen) => {
  if (isOpen && props.operacionId) {
    nextTick(() => {
      loadOperacionDetails()
    })
  }
})
</script>

<style scoped>
.operacion-detail-modal {
  max-height: 90vh;
}

.operacion-detail-modal .v-card-text {
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

/* Custom scrollbar */
.operacion-detail-modal .v-card-text::-webkit-scrollbar {
  width: 6px;
}

.operacion-detail-modal .v-card-text::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.operacion-detail-modal .v-card-text::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.operacion-detail-modal .v-card-text::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>