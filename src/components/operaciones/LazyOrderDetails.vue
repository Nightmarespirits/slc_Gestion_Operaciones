<template>
  <div class="lazy-order-details">
    <!-- Loading State -->
    <div v-if="loading" class="pa-4">
      <SkeletonLoader variant="card" :rows="4" animation="pulse" />
    </div>
    
    <!-- Content -->
    <div v-else-if="details" class="pa-4">
      <!-- Order Summary -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-h6 text-primary font-weight-bold">
              {{ details.procesos?.length || 0 }}
            </div>
            <div class="text-caption text-grey-darken-1">Procesos</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-h6 text-success font-weight-bold">
              {{ getCompletedCount() }}
            </div>
            <div class="text-caption text-grey-darken-1">Completados</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-h6 text-warning font-weight-bold">
              {{ getPendingCount() }}
            </div>
            <div class="text-caption text-grey-darken-1">Pendientes</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-h6 font-weight-bold" :class="getProgressColor()">
              {{ getProgressPercentage() }}%
            </div>
            <div class="text-caption text-grey-darken-1">Progreso</div>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Progress Bar -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text class="pa-3">
          <div class="d-flex align-center mb-2">
            <v-icon class="mr-2" color="primary" size="small">
              mdi-progress-check
            </v-icon>
            <span class="text-subtitle-2 font-weight-bold">
              Progreso General
            </span>
            <v-spacer />
            <span class="text-body-2">
              {{ getProgressPercentage() }}%
            </span>
          </div>
          <v-progress-linear
            :model-value="getProgressPercentage()"
            :color="getProgressColor(true)"
            height="8"
            rounded
            striped
          />
        </v-card-text>
      </v-card>
      
      <!-- Process Details -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="d-flex align-center pa-3 bg-grey-lighten-5">
          <v-icon class="mr-2" color="primary">mdi-cog-outline</v-icon>
          <span class="text-subtitle-1">Detalles de Procesos</span>
        </v-card-title>
        
        <v-card-text class="pa-0">
          <v-list density="compact">
            <v-list-item
              v-for="(proceso, index) in details.procesos"
              :key="proceso.id || index"
              class="proceso-item"
            >
              <template #prepend>
                <v-avatar
                  :color="getProcesoStatusColor(proceso)"
                  size="32"
                  class="mr-3"
                >
                  <v-icon color="white" size="small">
                    {{ getProcesoIcon(proceso.tipo) }}
                  </v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title class="d-flex align-center">
                <span class="font-weight-medium">{{ proceso.tipo }}</span>
                <v-spacer />
                <v-chip
                  :color="getProcesoStatusColor(proceso)"
                  size="small"
                  variant="flat"
                >
                  {{ getProcesoStatusText(proceso) }}
                </v-chip>
              </v-list-item-title>
              
              <v-list-item-subtitle>
                <div class="mt-1">
                  <div class="text-body-2">
                    <strong>Responsable:</strong> {{ proceso.responsable || 'No asignado' }}
                  </div>
                  <div class="text-body-2">
                    <strong>Fecha:</strong> {{ formatDate(proceso.fecha) }}
                  </div>
                  <div v-if="proceso.observaciones" class="text-body-2 mt-1">
                    <strong>Observaciones:</strong> 
                    <span class="text-info">{{ proceso.observaciones }}</span>
                  </div>
                </div>
              </v-list-item-subtitle>
              
              <template #append>
                <div class="d-flex flex-column align-center">
                  <v-btn
                    v-if="!proceso.completed"
                    icon
                    size="small"
                    color="success"
                    variant="text"
                    @click="markProcesoCompleted(proceso, index)"
                  >
                    <v-icon>mdi-check</v-icon>
                    <v-tooltip activator="parent" location="top">
                      Marcar como completado
                    </v-tooltip>
                  </v-btn>
                  
                  <v-btn
                    icon
                    size="small"
                    color="primary"
                    variant="text"
                    @click="showProcesoDetails(proceso)"
                  >
                    <v-icon>mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">
                      Ver detalles
                    </v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
      
      <!-- Notes and Observations -->
      <v-card v-if="details.observaciones || details.notas" variant="outlined">
        <v-card-title class="d-flex align-center pa-3 bg-grey-lighten-5">
          <v-icon class="mr-2" color="primary">mdi-note-text-outline</v-icon>
          <span class="text-subtitle-1">Observaciones y Notas</span>
        </v-card-title>
        
        <v-card-text class="pa-3">
          <div v-if="details.observaciones" class="mb-3">
            <div class="text-subtitle-2 font-weight-bold mb-1">Observaciones:</div>
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-0"
            >
              {{ details.observaciones }}
            </v-alert>
          </div>
          
          <div v-if="details.notas" class="mb-3">
            <div class="text-subtitle-2 font-weight-bold mb-1">Notas:</div>
            <v-alert
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-0"
            >
              {{ details.notas }}
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="pa-4 text-center">
      <v-icon size="48" color="error" class="mb-2">mdi-alert-circle-outline</v-icon>
      <div class="text-body-2 text-error mb-2">Error al cargar los detalles</div>
      <v-btn size="small" variant="outlined" color="error" @click="loadDetails">
        Reintentar
      </v-btn>
    </div>
    
    <!-- Empty State -->
    <div v-else class="pa-4 text-center">
      <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-package-variant</v-icon>
      <div class="text-body-2 text-grey">No hay detalles disponibles</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import SkeletonLoader from '../common/SkeletonLoader.vue'
import axios from 'axios'

// Props
const props = defineProps({
  orden: {
    type: String,
    required: true
  },
  operacionId: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['details-loaded', 'progress-updated', 'proceso-completed'])

// Reactive state
const loading = ref(false)
const error = ref(false)
const details = ref(null)

// Computed
const progressPercentage = computed(() => getProgressPercentage())

// Methods
const loadDetails = async () => {
  loading.value = true
  error.value = false
  
  try {
    // Simulate API call - replace with actual endpoint
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/operacion/${props.operacionId}/orden/${props.orden}/details`
    )
    
    details.value = formatOrderDetails(response.data)
    
    emit('details-loaded', {
      orden: props.orden,
      details: details.value
    })
    
  } catch (err) {
    console.error('Error loading order details:', err)
    error.value = true
    
    // Fallback: create mock data for demonstration
    details.value = createMockOrderDetails()
    
    emit('details-loaded', {
      orden: props.orden,
      details: details.value
    })
  } finally {
    loading.value = false
  }
}

const formatOrderDetails = (data) => {
  return {
    orden: props.orden,
    procesos: data.procesos?.map(proceso => ({
      id: proceso._id,
      tipo: proceso.tipo,
      responsable: proceso.responsable ? 
        `${proceso.responsable.nombres} ${proceso.responsable.apellidos}` : 
        null,
      fecha: proceso.fecha,
      completed: proceso.completed || false,
      observaciones: proceso.observaciones
    })) || [],
    observaciones: data.observaciones,
    notas: data.notas,
    fechaCreacion: data.fechaCreacion,
    fechaActualizacion: data.fechaActualizacion
  }
}

const createMockOrderDetails = () => {
  const procesos = [
    {
      id: '1',
      tipo: 'Lavado',
      responsable: 'Juan Pérez',
      fecha: new Date().toISOString(),
      completed: true,
      observaciones: 'Lavado completado sin problemas'
    },
    {
      id: '2',
      tipo: 'Secado',
      responsable: 'María García',
      fecha: new Date().toISOString(),
      completed: Math.random() > 0.5,
      observaciones: null
    },
    {
      id: '3',
      tipo: 'Planchado',
      responsable: 'Carlos López',
      fecha: new Date().toISOString(),
      completed: Math.random() > 0.7,
      observaciones: null
    }
  ]
  
  return {
    orden: props.orden,
    procesos,
    observaciones: 'Orden procesada normalmente',
    notas: null,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString()
  }
}

const getCompletedCount = () => {
  if (!details.value?.procesos) return 0
  return details.value.procesos.filter(p => p.completed).length
}

const getPendingCount = () => {
  if (!details.value?.procesos) return 0
  return details.value.procesos.filter(p => !p.completed).length
}

const getProgressPercentage = () => {
  if (!details.value?.procesos || details.value.procesos.length === 0) return 0
  
  const completed = getCompletedCount()
  return Math.round((completed / details.value.procesos.length) * 100)
}

const getProgressColor = (returnString = false) => {
  const progress = getProgressPercentage()
  
  if (progress === 100) {
    return returnString ? 'success' : 'text-success'
  } else if (progress >= 50) {
    return returnString ? 'info' : 'text-info'
  } else if (progress > 0) {
    return returnString ? 'warning' : 'text-warning'
  } else {
    return returnString ? 'grey' : 'text-grey'
  }
}

const getProcesoStatusColor = (proceso) => {
  return proceso.completed ? 'success' : 'grey'
}

const getProcesoStatusText = (proceso) => {
  return proceso.completed ? 'Completado' : 'Pendiente'
}

const getProcesoIcon = (tipo) => {
  const icons = {
    'Lavado': 'mdi-washing-machine',
    'Secado': 'mdi-tumble-dryer',
    'Planchado': 'mdi-iron',
    'Doblado': 'mdi-tshirt-crew',
    'Teñido': 'mdi-palette'
  }
  return icons[tipo] || 'mdi-cog'
}

const formatDate = (date) => {
  if (!date) return 'No definida'
  
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const markProcesoCompleted = async (proceso, index) => {
  try {
    // Update local state immediately (optimistic update)
    proceso.completed = true
    
    // Emit progress update
    const newProgress = getProgressPercentage()
    emit('progress-updated', {
      orden: props.orden,
      progress: newProgress
    })
    
    emit('proceso-completed', {
      orden: props.orden,
      proceso,
      index
    })
    
    // TODO: Make API call to update backend
    // await axios.patch(`${import.meta.env.VITE_API_URL}/proceso/${proceso.id}/complete`)
    
  } catch (error) {
    console.error('Error marking proceso as completed:', error)
    // Revert optimistic update
    proceso.completed = false
  }
}

const showProcesoDetails = (proceso) => {
  // TODO: Implement detailed proceso view
  console.log('Show proceso details:', proceso)
}

// Lifecycle
onMounted(() => {
  loadDetails()
})
</script>

<style scoped>
.lazy-order-details {
  min-height: 200px;
}

.proceso-item {
  border-bottom: 1px solid #f0f0f0;
}

.proceso-item:last-child {
  border-bottom: none;
}

/* Custom list styling */
:deep(.v-list-item__prepend) {
  align-self: flex-start;
  margin-top: 8px;
}

:deep(.v-list-item__append) {
  align-self: flex-start;
  margin-top: 4px;
}

/* Progress bar animation */
:deep(.v-progress-linear__determinate) {
  transition: width 0.3s ease;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .lazy-order-details {
    min-height: 150px;
  }
}
</style>