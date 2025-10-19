<template>
  <div class="machine-status">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h3 class="text-h6 font-weight-medium">
        <v-icon class="mr-2" color="info">mdi-cog</v-icon>
        Estado de Máquinas
      </h3>
      
      <div class="d-flex align-center gap-2">
        <v-chip
          :color="getOverallStatusColor()"
          size="small"
          variant="tonal"
        >
          {{ operationalMachines.length }}/{{ machines.length }} Operativas
        </v-chip>
        
        <v-btn
          icon="mdi-refresh"
          variant="outlined"
          size="small"
          :loading="loading.machineStatus"
          @click="refreshMachines"
        />
      </div>
    </div>

    <!-- Resumen de estado -->
    <v-row class="mb-4">
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="text-center pa-3 status-card operational">
          <div class="text-h5 font-weight-bold text-success">
            {{ operationalMachines.length }}
          </div>
          <div class="text-caption text-medium-emphasis">Operativas</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="text-center pa-3 status-card maintenance">
          <div class="text-h5 font-weight-bold text-warning">
            {{ maintenanceMachines.length }}
          </div>
          <div class="text-caption text-medium-emphasis">Mantenimiento</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="text-center pa-3 status-card offline">
          <div class="text-h5 font-weight-bold text-error">
            {{ offlineMachines.length }}
          </div>
          <div class="text-caption text-medium-emphasis">Fuera de Servicio</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="text-center pa-3 status-card utilization">
          <div class="text-h5 font-weight-bold" :class="getUtilizationColor(averageUtilization)">
            {{ averageUtilization }}%
          </div>
          <div class="text-caption text-medium-emphasis">Utilización Promedio</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Lista de máquinas -->
    <v-card class="machines-list">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        Detalle por Máquina
      </v-card-title>
      
      <v-card-text v-if="loading.machineStatus" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-subtitle-2 mt-2">Cargando estado de máquinas...</div>
      </v-card-text>
      
      <v-list v-else-if="machines.length > 0" class="py-0">
        <template v-for="(machine, index) in machines" :key="machine.id">
          <v-list-item
            :class="['machine-item', `machine-${machine.estado}`]"
            @click="showMachineDetails(machine)"
          >
            <template #prepend>
              <v-avatar
                :color="getMachineStatusColor(machine.estado)"
                size="40"
              >
                <v-icon color="white" size="20">
                  {{ getMachineIcon(machine.tipo) }}
                </v-icon>
              </v-avatar>
            </template>
            
            <div class="machine-info">
              <v-list-item-title class="font-weight-medium">
                {{ machine.id }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="mt-1">
                {{ getMachineTypeLabel(machine.tipo) }}
              </v-list-item-subtitle>
              
              <!-- Barra de utilización -->
              <div class="d-flex align-center mt-2">
                <v-progress-linear
                  :model-value="machine.utilizacion"
                  :color="getUtilizationBarColor(machine.utilizacion)"
                  height="6"
                  rounded
                  class="mr-2"
                  style="min-width: 100px;"
                />
                <span class="text-caption">{{ machine.utilizacion }}%</span>
              </div>
            </div>
            
            <template #append>
              <div class="d-flex flex-column align-end">
                <v-chip
                  :color="getMachineStatusColor(machine.estado)"
                  size="small"
                  variant="tonal"
                  class="mb-1"
                >
                  {{ getMachineStatusLabel(machine.estado) }}
                </v-chip>
                
                <!-- Indicadores de alerta -->
                <div class="d-flex gap-1">
                  <v-icon
                    v-if="machine.utilizacion > 90"
                    size="small"
                    color="error"
                    title="Alta utilización"
                  >
                    mdi-alert-circle
                  </v-icon>
                  <v-icon
                    v-if="needsMaintenance(machine)"
                    size="small"
                    color="warning"
                    title="Mantenimiento próximo"
                  >
                    mdi-wrench
                  </v-icon>
                  <v-icon
                    v-if="machine.estado === 'offline'"
                    size="small"
                    color="error"
                    title="Fuera de servicio"
                  >
                    mdi-power-off
                  </v-icon>
                </div>
              </div>
            </template>
          </v-list-item>
          
          <v-divider v-if="index < machines.length - 1" />
        </template>
      </v-list>
      
      <v-card-text v-else class="text-center py-8">
        <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-cog-off</v-icon>
        <div class="text-subtitle-2 text-medium-emphasis">No hay máquinas registradas</div>
      </v-card-text>
    </v-card>

    <!-- Modal de detalles de máquina -->
    <v-dialog v-model="machineDetailDialog" max-width="600px">
      <v-card v-if="selectedMachine">
        <v-card-title class="d-flex align-center">
          <v-avatar
            :color="getMachineStatusColor(selectedMachine.estado)"
            size="32"
            class="mr-3"
          >
            <v-icon color="white" size="16">
              {{ getMachineIcon(selectedMachine.tipo) }}
            </v-icon>
          </v-avatar>
          {{ selectedMachine.id }}
        </v-card-title>
        
        <v-card-text>
          <!-- Estado y tipo -->
          <div class="mb-4">
            <v-row>
              <v-col cols="6">
                <div class="text-subtitle-2 mb-1">Estado</div>
                <v-chip
                  :color="getMachineStatusColor(selectedMachine.estado)"
                  variant="tonal"
                >
                  {{ getMachineStatusLabel(selectedMachine.estado) }}
                </v-chip>
              </v-col>
              <v-col cols="6">
                <div class="text-subtitle-2 mb-1">Tipo</div>
                <div>{{ getMachineTypeLabel(selectedMachine.tipo) }}</div>
              </v-col>
            </v-row>
          </div>
          
          <!-- Métricas -->
          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">Métricas de Rendimiento</div>
            <v-row>
              <v-col cols="6">
                <div class="metric-card">
                  <div class="text-h6" :class="getUtilizationColor(selectedMachine.utilizacion)">
                    {{ selectedMachine.utilizacion }}%
                  </div>
                  <div class="text-caption">Utilización</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="metric-card">
                  <div class="text-h6 text-info">
                    {{ selectedMachine.horasOperacion || 0 }}h
                  </div>
                  <div class="text-caption">Horas de Operación</div>
                </div>
              </v-col>
            </v-row>
          </div>
          
          <!-- Mantenimiento -->
          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">Información de Mantenimiento</div>
            <div class="d-flex align-center mb-2">
              <v-icon size="small" class="mr-2" color="info">mdi-calendar</v-icon>
              <span class="text-body-2">
                Último mantenimiento: {{ formatDate(selectedMachine.ultimoMantenimiento) }}
              </span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2" color="warning">mdi-calendar-clock</v-icon>
              <span class="text-body-2">
                Próximo mantenimiento: {{ formatDate(selectedMachine.proximoMantenimiento) }}
              </span>
            </div>
          </div>
          
          <!-- Alertas específicas -->
          <div v-if="getMachineAlerts(selectedMachine).length > 0">
            <div class="text-subtitle-2 mb-2">Alertas Activas</div>
            <v-alert
              v-for="alert in getMachineAlerts(selectedMachine)"
              :key="alert.type"
              :type="alert.severity"
              variant="tonal"
              density="compact"
              class="mb-2"
            >
              {{ alert.message }}
            </v-alert>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="machineDetailDialog = false">
            Cerrar
          </v-btn>
          <v-btn
            v-if="selectedMachine.estado === 'offline'"
            color="success"
            variant="outlined"
            @click="activateMachine(selectedMachine)"
          >
            Activar
          </v-btn>
          <v-btn
            v-if="selectedMachine.estado === 'operativa'"
            color="warning"
            variant="outlined"
            @click="scheduleMaintenance(selectedMachine)"
          >
            Programar Mantenimiento
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDashboardMetrics } from '../../composables/useDashboardMetrics';

const props = defineProps({
  autoRefresh: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['machine-action']);

// Usar el composable de métricas
const {
  machineStatus: machines,
  loading,
  refreshMetric
} = useDashboardMetrics();

// Estado local
const machineDetailDialog = ref(false);
const selectedMachine = ref(null);

// Computed properties
const operationalMachines = computed(() => 
  machines.value.filter(m => m.estado === 'operativa')
);

const maintenanceMachines = computed(() => 
  machines.value.filter(m => m.estado === 'mantenimiento')
);

const offlineMachines = computed(() => 
  machines.value.filter(m => m.estado === 'offline')
);

const averageUtilization = computed(() => {
  if (!machines.value.length) return 0;
  
  const total = machines.value.reduce((sum, m) => sum + (m.utilizacion || 0), 0);
  return Math.round(total / machines.value.length);
});

// Métodos
function getMachineStatusColor(estado) {
  const colorMap = {
    operativa: 'success',
    mantenimiento: 'warning',
    offline: 'error'
  };
  return colorMap[estado] || 'grey';
}

function getMachineStatusLabel(estado) {
  const labelMap = {
    operativa: 'Operativa',
    mantenimiento: 'Mantenimiento',
    offline: 'Fuera de Servicio'
  };
  return labelMap[estado] || estado;
}

function getMachineIcon(tipo) {
  const iconMap = {
    lavado: 'mdi-washing-machine',
    secado: 'mdi-tumble-dryer',
    planchado: 'mdi-iron',
    doblado: 'mdi-folder',
    tenido: 'mdi-palette'
  };
  return iconMap[tipo] || 'mdi-cog';
}

function getMachineTypeLabel(tipo) {
  const labelMap = {
    lavado: 'Máquina de Lavado',
    secado: 'Secadora',
    planchado: 'Plancha Industrial',
    doblado: 'Dobladora',
    tenido: 'Máquina de Teñido'
  };
  return labelMap[tipo] || tipo;
}

function getOverallStatusColor() {
  const operational = operationalMachines.value.length;
  const total = machines.value.length;
  
  if (total === 0) return 'grey';
  
  const percentage = (operational / total) * 100;
  if (percentage >= 90) return 'success';
  if (percentage >= 70) return 'warning';
  return 'error';
}

function getUtilizationColor(utilization) {
  if (utilization <= 70) return 'text-success';
  if (utilization <= 90) return 'text-warning';
  return 'text-error';
}

function getUtilizationBarColor(utilization) {
  if (utilization <= 70) return 'success';
  if (utilization <= 90) return 'warning';
  return 'error';
}

function needsMaintenance(machine) {
  if (!machine.proximoMantenimiento) return false;
  
  const nextMaintenance = new Date(machine.proximoMantenimiento);
  const now = new Date();
  const daysUntilMaintenance = Math.ceil((nextMaintenance - now) / (1000 * 60 * 60 * 24));
  
  return daysUntilMaintenance <= 7; // Alerta si el mantenimiento es en 7 días o menos
}

function getMachineAlerts(machine) {
  const alerts = [];
  
  if (machine.utilizacion > 90) {
    alerts.push({
      type: 'high-utilization',
      severity: 'warning',
      message: 'Utilización muy alta. Considere redistribuir la carga de trabajo.'
    });
  }
  
  if (needsMaintenance(machine)) {
    alerts.push({
      type: 'maintenance-due',
      severity: 'info',
      message: 'Mantenimiento programado próximamente.'
    });
  }
  
  if (machine.estado === 'offline') {
    alerts.push({
      type: 'offline',
      severity: 'error',
      message: 'Máquina fuera de servicio. Requiere atención inmediata.'
    });
  }
  
  return alerts;
}

function formatDate(dateString) {
  if (!dateString) return 'No disponible';
  
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
}

async function refreshMachines() {
  try {
    await refreshMetric('machineStatus', true);
  } catch (error) {
    console.error('Error refreshing machine status:', error);
  }
}

function showMachineDetails(machine) {
  selectedMachine.value = machine;
  machineDetailDialog.value = true;
}

function activateMachine(machine) {
  emit('machine-action', { type: 'activate', machine });
  // TODO: Implementar lógica para activar máquina
  console.log('Activating machine:', machine.id);
  machineDetailDialog.value = false;
}

function scheduleMaintenance(machine) {
  emit('machine-action', { type: 'schedule-maintenance', machine });
  // TODO: Implementar lógica para programar mantenimiento
  console.log('Scheduling maintenance for machine:', machine.id);
  machineDetailDialog.value = false;
}

// Lifecycle
onMounted(() => {
  refreshMachines();
});
</script>

<style scoped>
.machine-status {
  width: 100%;
}

.machines-list {
  border-radius: 12px;
}

.machine-item {
  transition: all 0.2s ease;
  cursor: pointer;
  padding: 12px 16px;
}

.machine-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.machine-operativa {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.machine-mantenimiento {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.machine-offline {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.machine-info {
  flex: 1;
  min-width: 0;
}

.status-card {
  transition: all 0.2s ease;
  cursor: pointer;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
}

.status-card.operational:hover {
  border-color: rgb(var(--v-theme-success));
}

.status-card.maintenance:hover {
  border-color: rgb(var(--v-theme-warning));
}

.status-card.offline:hover {
  border-color: rgb(var(--v-theme-error));
}

.status-card.utilization:hover {
  border-color: rgb(var(--v-theme-info));
}

.metric-card {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}

.gap-2 {
  gap: 8px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .d-flex.align-center.gap-2 {
    align-self: stretch;
    justify-content: flex-end;
  }
}

@media (max-width: 600px) {
  .machine-item {
    padding: 8px 12px;
  }
  
  .machine-item .v-avatar {
    width: 32px !important;
    height: 32px !important;
  }
  
  .machine-item .v-icon {
    font-size: 16px !important;
  }
  
  .metric-card {
    padding: 8px;
  }
  
  .metric-card .text-h6 {
    font-size: 1.25rem !important;
  }
}

/* Animaciones */
.v-progress-linear {
  transition: all 0.3s ease;
}

.v-chip {
  transition: all 0.2s ease;
}

/* Mejoras visuales */
.v-list-item-title {
  font-weight: 500 !important;
}

.text-caption {
  opacity: 0.7;
}
</style>