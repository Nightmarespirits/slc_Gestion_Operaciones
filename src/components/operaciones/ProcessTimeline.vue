<template>
  <div class="process-timeline">
    <!-- Loading State -->
    <div v-if="loading" class="text-center pa-4">
      <v-progress-circular indeterminate color="primary" />
      <div class="text-body-2 mt-2">Cargando timeline...</div>
    </div>
    
    <!-- Timeline Content -->
    <v-timeline 
      v-else-if="procesos && procesos.length > 0"
      align="start" 
      density="compact"
      class="custom-timeline"
    >
      <v-timeline-item
        v-for="(proceso, index) in processedProcesos"
        :key="proceso.id"
        :dot-color="proceso.status.color"
        size="large"
        class="timeline-item"
        @click="handleProcesoClick(proceso)"
      >
        <!-- Timeline Icon -->
        <template #icon>
          <v-icon 
            :color="proceso.status.iconColor" 
            size="small"
          >
            {{ getProcesoIcon(proceso.tipo) }}
          </v-icon>
        </template>
        
        <!-- Timeline Content -->
        <v-card 
          :class="['timeline-card', { 'timeline-card--clickable': true }]"
          variant="outlined"
          @click="handleProcesoClick(proceso)"
        >
          <!-- Card Header -->
          <v-card-title class="d-flex align-center pa-3">
            <div class="flex-grow-1">
              <div class="text-subtitle-1 font-weight-bold">
                {{ proceso.tipo }}
              </div>
              <div class="text-caption text-grey-darken-1">
                Proceso {{ index + 1 }} de {{ procesos.length }}
              </div>
            </div>
            
            <!-- Status Chip -->
            <v-chip
              :color="proceso.status.color"
              size="small"
              variant="flat"
              class="ml-2"
            >
              <v-icon start size="x-small">{{ proceso.status.icon }}</v-icon>
              {{ proceso.status.text }}
            </v-chip>
          </v-card-title>
          
          <!-- Card Content -->
          <v-card-text class="pa-3 pt-0">
            <v-row dense>
              <!-- Responsable -->
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" class="mr-2" color="grey-darken-1">
                    mdi-account-outline
                  </v-icon>
                  <div>
                    <div class="text-caption text-grey-darken-1">Responsable</div>
                    <div class="text-body-2 font-weight-medium">
                      {{ proceso.responsable || 'No asignado' }}
                    </div>
                  </div>
                </div>
              </v-col>
              
              <!-- Fecha -->
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" class="mr-2" color="grey-darken-1">
                    mdi-calendar-outline
                  </v-icon>
                  <div>
                    <div class="text-caption text-grey-darken-1">Fecha</div>
                    <div class="text-body-2 font-weight-medium">
                      {{ formatDate(proceso.fecha) }}
                    </div>
                  </div>
                </div>
              </v-col>
              
              <!-- Duración -->
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" class="mr-2" color="grey-darken-1">
                    mdi-timer-outline
                  </v-icon>
                  <div>
                    <div class="text-caption text-grey-darken-1">Duración</div>
                    <div class="text-body-2 font-weight-medium">
                      {{ proceso.duration }}
                    </div>
                  </div>
                </div>
              </v-col>
              
              <!-- Progreso -->
              <v-col cols="12" sm="6">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" class="mr-2" color="grey-darken-1">
                    mdi-progress-check
                  </v-icon>
                  <div class="flex-grow-1">
                    <div class="text-caption text-grey-darken-1">Progreso</div>
                    <div class="d-flex align-center">
                      <v-progress-linear
                        :model-value="proceso.progress"
                        :color="proceso.status.color"
                        height="6"
                        rounded
                        class="mr-2"
                      />
                      <span class="text-body-2 font-weight-medium">
                        {{ proceso.progress }}%
                      </span>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
            
            <!-- Tiempo de espera (si aplica) -->
            <div 
              v-if="proceso.waitTime && proceso.waitTime > 0" 
              class="mt-2 pa-2 bg-warning-lighten-4 rounded"
            >
              <div class="d-flex align-center">
                <v-icon size="small" color="warning" class="mr-2">
                  mdi-clock-alert-outline
                </v-icon>
                <div class="text-body-2">
                  <strong>Tiempo de espera:</strong> {{ formatWaitTime(proceso.waitTime) }}
                </div>
              </div>
            </div>
            
            <!-- Problemas/Retrasos -->
            <div 
              v-if="proceso.issues && proceso.issues.length > 0" 
              class="mt-2"
            >
              <v-alert
                type="warning"
                variant="tonal"
                density="compact"
                class="mb-0"
              >
                <template #title>
                  <span class="text-body-2 font-weight-bold">Problemas detectados</span>
                </template>
                <ul class="text-body-2 mt-1 mb-0">
                  <li v-for="issue in proceso.issues" :key="issue">
                    {{ issue }}
                  </li>
                </ul>
              </v-alert>
            </div>
          </v-card-text>
          
          <!-- Tooltip for detailed info -->
          <v-tooltip activator="parent" location="top" :disabled="!showTooltips">
            <div class="tooltip-content">
              <div class="font-weight-bold mb-1">{{ proceso.tipo }}</div>
              <div><strong>Responsable:</strong> {{ proceso.responsable }}</div>
              <div><strong>Inicio:</strong> {{ formatDateTime(proceso.startTime) }}</div>
              <div v-if="proceso.endTime">
                <strong>Fin:</strong> {{ formatDateTime(proceso.endTime) }}
              </div>
              <div><strong>Estado:</strong> {{ proceso.status.text }}</div>
              <div v-if="proceso.notes">
                <strong>Notas:</strong> {{ proceso.notes }}
              </div>
            </div>
          </v-tooltip>
        </v-card>
        
        <!-- Connection line with duration -->
        <div 
          v-if="index < procesos.length - 1" 
          class="timeline-connection"
        >
          <div class="connection-duration">
            <v-chip 
              size="x-small" 
              variant="outlined" 
              color="grey"
            >
              {{ getTimeBetweenProcesses(proceso, procesos[index + 1]) }}
            </v-chip>
          </div>
        </div>
      </v-timeline-item>
    </v-timeline>
    
    <!-- Empty State -->
    <div v-else class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-timeline-outline
      </v-icon>
      <div class="text-h6 text-grey-darken-1 mb-2">
        No hay procesos disponibles
      </div>
      <div class="text-body-2 text-grey">
        Los procesos aparecerán aquí cuando se agreguen a la operación
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps({
  procesos: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  showTooltips: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['proceso-click'])

// Computed
const processedProcesos = computed(() => {
  if (!props.procesos) return []
  
  return props.procesos.map((proceso, index) => {
    const progress = calculateProgress(proceso)
    const status = getProcesoStatus(proceso, progress)
    const duration = calculateDuration(proceso)
    const waitTime = calculateWaitTime(proceso, index)
    const issues = detectIssues(proceso, progress, waitTime)
    
    return {
      ...proceso,
      progress,
      status,
      duration,
      waitTime,
      issues,
      startTime: proceso.startTime || proceso.fecha,
      endTime: proceso.endTime
    }
  })
})

// Methods
const calculateProgress = (proceso) => {
  if (!proceso.detalles || proceso.detalles.length === 0) return 0
  
  const completed = proceso.detalles.filter(detalle => detalle.completed).length
  return Math.round((completed / proceso.detalles.length) * 100)
}

const getProcesoStatus = (proceso, progress) => {
  if (progress === 100) {
    return {
      color: 'success',
      iconColor: 'white',
      icon: 'mdi-check-circle',
      text: 'Completado'
    }
  } else if (progress > 0) {
    return {
      color: 'info',
      iconColor: 'white',
      icon: 'mdi-progress-clock',
      text: 'En Progreso'
    }
  } else {
    return {
      color: 'grey',
      iconColor: 'white',
      icon: 'mdi-clock-outline',
      text: 'Pendiente'
    }
  }
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

const calculateDuration = (proceso) => {
  if (!proceso.startTime) return 'No iniciado'
  
  const start = new Date(proceso.startTime)
  const end = proceso.endTime ? new Date(proceso.endTime) : new Date()
  
  const diff = end - start
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const calculateWaitTime = (proceso, index) => {
  if (index === 0) return 0
  
  const previousProceso = props.procesos[index - 1]
  if (!previousProceso.endTime || !proceso.startTime) return 0
  
  const waitTime = new Date(proceso.startTime) - new Date(previousProceso.endTime)
  return Math.max(0, waitTime)
}

const detectIssues = (proceso, progress, waitTime) => {
  const issues = []
  
  // Detectar retrasos
  if (waitTime > 30 * 60 * 1000) { // Más de 30 minutos
    issues.push('Tiempo de espera excesivo entre procesos')
  }
  
  // Detectar procesos estancados
  if (progress > 0 && progress < 100) {
    const timeSinceStart = new Date() - new Date(proceso.startTime || proceso.fecha)
    if (timeSinceStart > 4 * 60 * 60 * 1000) { // Más de 4 horas
      issues.push('Proceso en progreso por tiempo prolongado')
    }
  }
  
  // Detectar falta de responsable
  if (!proceso.responsable) {
    issues.push('No hay responsable asignado')
  }
  
  return issues
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

const formatDateTime = (date) => {
  if (!date) return 'No definida'
  
  return new Date(date).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatWaitTime = (waitTime) => {
  const hours = Math.floor(waitTime / (1000 * 60 * 60))
  const minutes = Math.floor((waitTime % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const getTimeBetweenProcesses = (currentProceso, nextProceso) => {
  if (!currentProceso.endTime || !nextProceso.startTime) {
    return 'N/A'
  }
  
  const diff = new Date(nextProceso.startTime) - new Date(currentProceso.endTime)
  const minutes = Math.floor(diff / (1000 * 60))
  
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return `${hours}h ${remainingMinutes}m`
}

const handleProcesoClick = (proceso) => {
  emit('proceso-click', proceso)
}
</script>

<style scoped>
.process-timeline {
  position: relative;
}

.custom-timeline {
  padding-left: 0;
}

.timeline-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.timeline-card {
  transition: all 0.2s ease;
  border-radius: 8px;
}

.timeline-card--clickable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.timeline-connection {
  position: relative;
  margin: 8px 0;
  padding-left: 32px;
}

.connection-duration {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  padding: 0 4px;
}

.tooltip-content {
  max-width: 300px;
}

/* Custom timeline styling */
:deep(.v-timeline-item__body) {
  padding-bottom: 16px;
}

:deep(.v-timeline-item__opposite) {
  display: none;
}

/* Progress bar styling */
:deep(.v-progress-linear__background) {
  opacity: 0.3;
}

/* Alert styling */
:deep(.v-alert) {
  border-radius: 6px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .timeline-card {
    margin-left: -8px;
    margin-right: -8px;
  }
  
  .connection-duration {
    left: 8px;
  }
}
</style>