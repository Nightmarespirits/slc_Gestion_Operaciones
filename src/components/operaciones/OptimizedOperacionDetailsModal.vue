<template>
  <v-dialog 
    v-model="dialog" 
    max-width="1200px" 
    scrollable
    persistent
    transition="dialog-transition"
  >
    <v-card class="operacion-detail-modal">
      <!-- Header -->
      <v-card-title class="d-flex align-center bg-primary pa-4">
        <v-icon class="mr-3" color="white" size="large">mdi-clipboard-text</v-icon>
        <div class="text-white">
          <div class="text-h5 font-weight-bold">Operación {{ operacionData?.id || operacionId }}</div>
          <div class="text-caption opacity-80">Detalles completos de la operación</div>
        </div>
        <v-spacer />
        <v-chip 
          v-if="operacionData"
          :color="operacionData.estadoOperacion ? 'success' : 'warning'"
          label
          size="large"
          class="mr-3"
        >
          <v-icon start size="small">
            {{ operacionData.estadoOperacion ? 'mdi-check-circle' : 'mdi-clock-outline' }}
          </v-icon>
          {{ operacionData.estadoOperacion ? 'Finalizada' : 'En Proceso' }}
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
        <div v-else-if="operacionData" class="pa-6">
          <!-- Información General -->
          <v-row class="mb-6">
            <v-col cols="12">
              <h3 class="text-h6 mb-4">
                <v-icon class="mr-2">mdi-information</v-icon>
                Información General
              </h3>
              <v-card variant="outlined">
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="4">
                      <div class="text-subtitle-2 text-grey-darken-1">ID de Operación</div>
                      <div class="text-body-1 font-weight-medium">{{ operacionData.id }}</div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-subtitle-2 text-grey-darken-1">Fecha de Inicio</div>
                      <div class="text-body-1">{{ formatDate(operacionData.fechas?.inicio) }}</div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-subtitle-2 text-grey-darken-1">Fecha de Finalización</div>
                      <div class="text-body-1">{{ formatDate(operacionData.fechas?.final) }}</div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-subtitle-2 text-grey-darken-1">Estado</div>
                      <v-chip 
                        :color="operacionData.estadoOperacion ? 'success' : 'warning'"
                        size="small"
                        label
                      >
                        {{ operacionData.estadoOperacion ? 'Finalizada' : 'En Proceso' }}
                      </v-chip>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-subtitle-2 text-grey-darken-1">Etapa Actual</div>
                      <div class="text-body-1">{{ operacionData.currentStage || 'No definida' }}</div>
                    </v-col>
                    <v-col cols="12" md="4">
                      <div class="text-subtitle-2 text-grey-darken-1">Total de Procesos</div>
                      <div class="text-body-1">{{ operacionData.procesos?.length || 0 }}</div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Números de Orden -->
          <v-row class="mb-6" v-if="orderNumbers.length > 0">
            <v-col cols="12">
              <h3 class="text-h6 mb-4">
                <v-icon class="mr-2">mdi-ticket</v-icon>
                Números de Orden ({{ orderNumbers.length }})
              </h3>
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="orden in orderNumbers"
                  :key="orden"
                  color="primary"
                  variant="flat"
                  size="small"
                  label
                >
                  <v-icon start size="small">mdi-ticket</v-icon>
                  {{ orden }}
                </v-chip>
              </div>
            </v-col>
          </v-row>

          <!-- Procesos -->
          <v-row class="mb-6" v-if="operacionData.procesos && operacionData.procesos.length > 0">
            <v-col cols="12">
              <h3 class="text-h6 mb-4">
                <v-icon class="mr-2">mdi-cog</v-icon>
                Procesos ({{ operacionData.procesos.length }})
              </h3>
              <v-expansion-panels variant="accordion" multiple>
                <v-expansion-panel
                  v-for="(proceso, index) in operacionData.procesos"
                  :key="proceso.id"
                  :title="`${proceso.tipo} - ${proceso.responsable}`"
                >
                  <template #text>
                    <v-card variant="outlined" class="mb-4">
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" md="6">
                            <div class="text-subtitle-2 text-grey-darken-1">Tipo de Proceso</div>
                            <v-chip 
                              :color="getProcesoColor(proceso.tipo)"
                              size="small"
                              label
                            >
                              <v-icon start size="small">{{ getProcesoIcon(proceso.tipo) }}</v-icon>
                              {{ proceso.tipo }}
                            </v-chip>
                          </v-col>
                          <v-col cols="12" md="6">
                            <div class="text-subtitle-2 text-grey-darken-1">Responsable</div>
                            <div class="text-body-1">{{ proceso.responsable }}</div>
                          </v-col>
                          <v-col cols="12" md="6">
                            <div class="text-subtitle-2 text-grey-darken-1">Fecha</div>
                            <div class="text-body-1">{{ formatDate(proceso.fecha) }}</div>
                          </v-col>
                          <v-col cols="12" md="6">
                            <div class="text-subtitle-2 text-grey-darken-1">Estado</div>
                            <v-chip 
                              :color="proceso.estado ? 'success' : 'warning'"
                              size="small"
                              label
                            >
                              {{ proceso.estado ? 'Completado' : 'Pendiente' }}
                            </v-chip>
                          </v-col>
                        </v-row>

                        <!-- Detalles del proceso -->
                        <div v-if="proceso.detalles && proceso.detalles.length > 0" class="mt-4">
                          <div class="text-subtitle-2 text-grey-darken-1 mb-2">Detalles</div>
                          <v-data-table
                            :headers="detalleHeaders"
                            :items="proceso.detalles"
                            density="compact"
                            hide-default-footer
                            :items-per-page="-1"
                          >
                            <template #item.estado="{ item }">
                              <v-chip 
                                :color="item.estado ? 'success' : 'warning'"
                                size="x-small"
                                label
                              >
                                {{ item.estado ? 'Completado' : 'Pendiente' }}
                              </v-chip>
                            </template>
                            <template #item.colorMarcado="{ item }">
                              <v-chip 
                                v-if="item.colorMarcado && item.colorMarcado !== 'Ninguno'"
                                :color="getColorChip(item.colorMarcado)"
                                size="x-small"
                                label
                              >
                                {{ item.colorMarcado }}
                              </v-chip>
                              <span v-else class="text-grey">{{ item.colorMarcado || 'N/A' }}</span>
                            </template>
                          </v-data-table>
                        </div>
                      </v-card-text>
                    </v-card>
                  </template>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="pa-6 text-center">
          <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
          <div class="text-h6 text-error mb-2">Error al cargar los detalles</div>
          <div class="text-body-2 text-grey mb-4">{{ error }}</div>
          <v-btn color="primary" @click="loadOperacionDetails">
            <v-icon start>mdi-refresh</v-icon>
            Reintentar
          </v-btn>
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="closeModal"
        >
          Cerrar
        </v-btn>
        <v-btn
          v-if="operacionData && !operacionData.estadoOperacion"
          color="success"
          variant="flat"
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
import { ref, computed, watch } from 'vue'
import { useOperacionesStore } from '../../store/operaciones'
import SkeletonLoader from '../common/SkeletonLoader.vue'
import { dateTimeZConverter } from '../../utils/dateTimeZConverter'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  operacionId: {
    type: String,
    default: ''
  },
  operacionData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'operacion-updated'])

// Store
const operacionesStore = useOperacionesStore()

// Referencias reactivas
const loading = ref(false)
const error = ref('')

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const orderNumbers = computed(() => {
  if (!props.operacionData?.procesos) return []
  
  const ordenes = new Set()
  props.operacionData.procesos.forEach(proceso => {
    if (proceso.detalles && Array.isArray(proceso.detalles)) {
      proceso.detalles.forEach(detalle => {
        if (detalle.numOrden) {
          ordenes.add(detalle.numOrden)
        }
      })
    }
  })
  
  return Array.from(ordenes)
})

// Headers para la tabla de detalles
const detalleHeaders = [
  { title: 'N° Orden', key: 'numOrden', align: 'start' },
  { title: 'Cantidad', key: 'cantidad', align: 'center' },
  { title: 'Color Marcado', key: 'colorMarcado', align: 'center' },
  { title: 'Observaciones', key: 'obs', align: 'start' },
  { title: 'Estado', key: 'estado', align: 'center' }
]

// Métodos
const closeModal = () => {
  dialog.value = false
}

const loadOperacionDetails = async () => {
  if (!props.operacionId) return
  
  loading.value = true
  error.value = ''
  
  try {
    const details = await operacionesStore.fetchOperacionDetails(props.operacionId)
    emit('operacion-updated', details)
  } catch (err) {
    console.error('Error loading operation details:', err)
    error.value = err.message || 'Error al cargar los detalles'
  } finally {
    loading.value = false
  }
}

const markAsCompleted = async () => {
  // Implementar lógica para marcar como completada
  console.log('Marcar operación como completada:', props.operacionId)
}

// Funciones auxiliares
const formatDate = (dateString) => {
  if (!dateString || dateString === 'Por Finalizar' || dateString === 'Pendiente') {
    return dateString || '---'
  }
  
  try {
    const converted = dateTimeZConverter(dateString)
    if (converted) return converted
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString || '---'
  }
}

const getProcesoColor = (tipo) => {
  const colores = {
    'lavado': 'blue',
    'secado': 'orange',
    'doblado': 'green',
    'planchado': 'purple',
    'cc': 'red',
    'tenido': 'brown'
  }
  return colores[tipo] || 'grey'
}

const getProcesoIcon = (tipo) => {
  const iconos = {
    'lavado': 'mdi-washing-machine',
    'secado': 'mdi-tumble-dryer',
    'doblado': 'mdi-format-columns',
    'planchado': 'mdi-iron',
    'cc': 'mdi-check-decagram',
    'tenido': 'mdi-water'
  }
  return iconos[tipo] || 'mdi-cog'
}

const getColorChip = (color) => {
  const colores = {
    'rojo': 'red',
    'verde': 'green',
    'azul': 'blue',
    'amarillo': 'yellow',
    'negro': 'grey-darken-4',
    'blanco': 'grey-lighten-2'
  }
  return colores[color?.toLowerCase()] || 'grey'
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue && props.operacionId && !props.operacionData?.hasFullDetails) {
    loadOperacionDetails()
  }
})
</script>

<style scoped>
.operacion-detail-modal {
  max-height: 90vh;
}

.operacion-detail-modal :deep(.v-card-text) {
  max-height: calc(90vh - 200px);
  overflow-y: auto;
}

/* Mejoras visuales */
.gap-2 {
  gap: 8px;
}

/* Transiciones suaves */
.v-expansion-panel {
  transition: all 0.3s ease;
}

/* Responsive */
@media (max-width: 960px) {
  .operacion-detail-modal {
    margin: 16px;
    max-width: calc(100vw - 32px);
  }
}
</style>