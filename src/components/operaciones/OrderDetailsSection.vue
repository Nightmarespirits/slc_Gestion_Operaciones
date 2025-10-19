<template>
  <v-card class="order-details-section" variant="outlined">
    <!-- Section Header -->
    <v-card-title class="d-flex align-center pa-4 bg-grey-lighten-5">
      <v-icon class="mr-2" color="primary">mdi-ticket-outline</v-icon>
      <span class="text-h6">Detalles por Orden</span>
      <v-spacer />
      <v-chip size="small" variant="outlined" color="primary">
        {{ ordenes?.length || 0 }} órdenes
      </v-chip>
    </v-card-title>
    
    <!-- Loading State -->
    <div v-if="loading" class="pa-4">
      <SkeletonLoader variant="list" :rows="3" animation="wave" />
    </div>
    
    <!-- Orders Content -->
    <v-card-text v-else-if="ordenes && ordenes.length > 0" class="pa-0">
      <v-expansion-panels 
        v-model="expandedPanels"
        multiple
        variant="accordion"
        class="order-expansion-panels"
      >
        <v-expansion-panel
          v-for="(orden, index) in ordenes"
          :key="orden"
          :value="index"
          class="order-panel"
        >
          <!-- Panel Header -->
          <v-expansion-panel-title class="order-panel-header">
            <div class="d-flex align-items-center w-100">
              <div class="flex-grow-1">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary" size="small">
                    mdi-ticket
                  </v-icon>
                  <span class="text-subtitle-1 font-weight-bold">
                    Orden {{ orden }}
                  </span>
                  
                  <!-- Progress indicator -->
                  <v-chip
                    :color="getOrderProgressColor(orden)"
                    size="small"
                    variant="flat"
                    class="ml-2"
                  >
                    {{ getOrderProgressText(orden) }}
                  </v-chip>
                </div>
                
                <!-- Quick stats -->
                <div class="text-caption text-grey-darken-1 mt-1">
                  {{ getOrderStats(orden) }}
                </div>
              </div>
              
              <!-- Status icon -->
              <v-icon 
                :color="getOrderStatusColor(orden)"
                class="mr-2"
              >
                {{ getOrderStatusIcon(orden) }}
              </v-icon>
            </div>
          </v-expansion-panel-title>
          
          <!-- Panel Content -->
          <v-expansion-panel-text class="order-panel-content">
            <LazyOrderDetails
              :orden="orden"
              :operacion-id="operacionId"
              :loading="orderDetailsLoading[orden]"
              @details-loaded="handleOrderDetailsLoaded"
              @progress-updated="handleProgressUpdated"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
    
    <!-- Empty State -->
    <div v-else class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">
        mdi-ticket-outline
      </v-icon>
      <div class="text-h6 text-grey-darken-1 mb-2">
        No hay órdenes disponibles
      </div>
      <div class="text-body-2 text-grey">
        Las órdenes aparecerán aquí cuando se agreguen a la operación
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import SkeletonLoader from '../common/SkeletonLoader.vue'
import LazyOrderDetails from './LazyOrderDetails.vue'

// Props
const props = defineProps({
  operacionId: {
    type: String,
    required: true
  },
  ordenes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['order-updated', 'order-details-loaded'])

// Reactive state
const expandedPanels = ref([])
const orderDetailsLoading = ref({})
const orderDetails = ref({})
const orderProgress = ref({})

// Computed
const hasOrders = computed(() => props.ordenes && props.ordenes.length > 0)

// Methods
const getOrderProgressColor = (orden) => {
  const progress = orderProgress.value[orden] || 0
  
  if (progress === 100) return 'success'
  if (progress > 50) return 'info'
  if (progress > 0) return 'warning'
  return 'grey'
}

const getOrderProgressText = (orden) => {
  const progress = orderProgress.value[orden] || 0
  return `${progress}%`
}

const getOrderStats = (orden) => {
  const details = orderDetails.value[orden]
  if (!details) return 'Cargando...'
  
  const total = details.procesos?.length || 0
  const completed = details.procesos?.filter(p => p.completed).length || 0
  
  return `${completed} de ${total} procesos completados`
}

const getOrderStatusColor = (orden) => {
  const progress = orderProgress.value[orden] || 0
  
  if (progress === 100) return 'success'
  if (progress > 0) return 'info'
  return 'grey'
}

const getOrderStatusIcon = (orden) => {
  const progress = orderProgress.value[orden] || 0
  
  if (progress === 100) return 'mdi-check-circle'
  if (progress > 0) return 'mdi-progress-clock'
  return 'mdi-clock-outline'
}

const handleOrderDetailsLoaded = (data) => {
  const { orden, details } = data
  
  orderDetails.value[orden] = details
  orderProgress.value[orden] = calculateOrderProgress(details)
  
  emit('order-details-loaded', data)
}

const handleProgressUpdated = (data) => {
  const { orden, progress } = data
  
  orderProgress.value[orden] = progress
  emit('order-updated', data)
}

const calculateOrderProgress = (details) => {
  if (!details.procesos || details.procesos.length === 0) return 0
  
  const completed = details.procesos.filter(p => p.completed).length
  return Math.round((completed / details.procesos.length) * 100)
}

const expandAllOrders = () => {
  expandedPanels.value = props.ordenes.map((_, index) => index)
}

const collapseAllOrders = () => {
  expandedPanels.value = []
}

// Initialize order loading states
const initializeOrderStates = () => {
  props.ordenes.forEach(orden => {
    if (!orderDetailsLoading.value[orden]) {
      orderDetailsLoading.value[orden] = false
    }
    if (!orderProgress.value[orden]) {
      orderProgress.value[orden] = 0
    }
  })
}

// Watchers
watch(() => props.ordenes, (newOrdenes) => {
  if (newOrdenes) {
    initializeOrderStates()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  initializeOrderStates()
})

// Expose methods for parent component
defineExpose({
  expandAllOrders,
  collapseAllOrders,
  orderProgress: computed(() => orderProgress.value),
  orderDetails: computed(() => orderDetails.value)
})
</script>

<style scoped>
.order-details-section {
  border-radius: 8px;
}

.order-expansion-panels {
  border-radius: 0;
}

.order-panel {
  border-bottom: 1px solid #e0e0e0;
}

.order-panel:last-child {
  border-bottom: none;
}

.order-panel-header {
  padding: 16px 20px;
  min-height: 64px;
}

.order-panel-content {
  padding: 0;
}

/* Custom expansion panel styling */
:deep(.v-expansion-panel-title) {
  padding: 16px 20px;
}

:deep(.v-expansion-panel-title__overlay) {
  background-color: transparent;
}

:deep(.v-expansion-panel-title:hover .v-expansion-panel-title__overlay) {
  background-color: rgba(0, 0, 0, 0.04);
}

:deep(.v-expansion-panel--active .v-expansion-panel-title) {
  background-color: rgba(25, 118, 210, 0.04);
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .order-panel-header {
    padding: 12px 16px;
    min-height: 56px;
  }
  
  :deep(.v-expansion-panel-title) {
    padding: 12px 16px;
  }
}
</style>