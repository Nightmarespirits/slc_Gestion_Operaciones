<template>
  <div class="alerts-panel">
    <!-- Header con controles -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center">
        <h3 class="text-h6 font-weight-medium">
          <v-icon class="mr-2" :color="getSystemStatusColor()">
            {{ getSystemStatusIcon() }}
          </v-icon>
          Sistema de Alertas
        </h3>
        <v-chip
          v-if="criticalCount > 0"
          color="error"
          size="small"
          class="ml-2"
        >
          {{ criticalCount }} críticas
        </v-chip>
      </div>
      
      <div class="d-flex align-center gap-2">
        <!-- Filtros de severidad -->
        <v-btn-toggle
          v-model="selectedSeverity"
          variant="outlined"
          density="compact"
          multiple
        >
          <v-btn value="critical" size="small" color="error">
            <v-icon size="small">mdi-alert-circle</v-icon>
          </v-btn>
          <v-btn value="warning" size="small" color="warning">
            <v-icon size="small">mdi-alert</v-icon>
          </v-btn>
          <v-btn value="info" size="small" color="info">
            <v-icon size="small">mdi-information</v-icon>
          </v-btn>
        </v-btn-toggle>
        
        <v-btn
          icon="mdi-refresh"
          variant="outlined"
          size="small"
          :loading="loading.alerts"
          @click="refreshAlerts"
        />
      </div>
    </div>

    <!-- Alertas críticas destacadas -->
    <div v-if="criticalAlerts.length > 0" class="mb-4">
      <v-alert
        v-for="alert in criticalAlerts.slice(0, 2)"
        :key="alert.id"
        :type="alert.severidad === 'critical' ? 'error' : 'warning'"
        variant="tonal"
        prominent
        border="start"
        closable
        class="mb-2"
        @click:close="dismissAlert(alert.id)"
      >
        <template #title>
          <div class="d-flex align-center justify-space-between">
            <span>{{ alert.titulo }}</span>
            <v-chip size="small" :color="getSeverityColor(alert.severidad)">
              {{ getSeverityLabel(alert.severidad) }}
            </v-chip>
          </div>
        </template>
        
        <div class="mt-2">
          <p>{{ alert.descripcion }}</p>
          <div class="d-flex align-center justify-space-between mt-3">
            <span class="text-caption text-medium-emphasis">
              {{ formatAlertTime(alert.timestamp) }}
            </span>
            <div class="d-flex gap-2">
              <v-btn
                v-if="alert.operacionId"
                size="small"
                variant="outlined"
                @click="viewOperation(alert.operacionId)"
              >
                Ver Operación
              </v-btn>
              <v-btn
                v-if="alert.maquinaId"
                size="small"
                variant="outlined"
                @click="viewMachine(alert.maquinaId)"
              >
                Ver Máquina
              </v-btn>
            </div>
          </div>
        </div>
      </v-alert>
    </div>

    <!-- Lista de todas las alertas -->
    <v-card class="alerts-list">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        Todas las Alertas ({{ filteredAlerts.length }})
      </v-card-title>
      
      <v-card-text v-if="loading.alerts" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-subtitle-2 mt-2">Cargando alertas...</div>
      </v-card-text>
      
      <v-list v-else-if="filteredAlerts.length > 0" class="py-0">
        <template v-for="(alert, index) in filteredAlerts" :key="alert.id">
          <v-list-item
            :class="['alert-item', `alert-${alert.severidad}`]"
            @click="expandAlert(alert.id)"
          >
            <template #prepend>
              <v-avatar
                :color="getSeverityColor(alert.severidad)"
                size="32"
              >
                <v-icon color="white" size="16">
                  {{ getSeverityIcon(alert.severidad) }}
                </v-icon>
              </v-avatar>
            </template>
            
            <v-list-item-title class="font-weight-medium">
              {{ alert.titulo }}
            </v-list-item-title>
            
            <v-list-item-subtitle class="mt-1">
              {{ alert.descripcion }}
            </v-list-item-subtitle>
            
            <template #append>
              <div class="d-flex flex-column align-end">
                <v-chip
                  :color="getSeverityColor(alert.severidad)"
                  size="x-small"
                  variant="tonal"
                >
                  {{ getSeverityLabel(alert.severidad) }}
                </v-chip>
                <span class="text-caption text-medium-emphasis mt-1">
                  {{ formatAlertTime(alert.timestamp) }}
                </span>
              </div>
            </template>
          </v-list-item>
          
          <v-divider v-if="index < filteredAlerts.length - 1" />
        </template>
      </v-list>
      
      <v-card-text v-else class="text-center py-8">
        <v-icon size="48" color="success" class="mb-2">mdi-check-circle</v-icon>
        <div class="text-subtitle-2">No hay alertas activas</div>
        <div class="text-caption text-medium-emphasis">
          El sistema está funcionando correctamente
        </div>
      </v-card-text>
    </v-card>

    <!-- Modal de detalles de alerta -->
    <v-dialog v-model="alertDetailDialog" max-width="600px">
      <v-card v-if="selectedAlert">
        <v-card-title class="d-flex align-center">
          <v-icon 
            :color="getSeverityColor(selectedAlert.severidad)" 
            class="mr-2"
          >
            {{ getSeverityIcon(selectedAlert.severidad) }}
          </v-icon>
          {{ selectedAlert.titulo }}
        </v-card-title>
        
        <v-card-text>
          <div class="mb-4">
            <v-chip
              :color="getSeverityColor(selectedAlert.severidad)"
              variant="tonal"
              class="mb-2"
            >
              {{ getSeverityLabel(selectedAlert.severidad) }}
            </v-chip>
            <div class="text-caption text-medium-emphasis">
              {{ formatAlertTime(selectedAlert.timestamp) }}
            </div>
          </div>
          
          <p class="mb-4">{{ selectedAlert.descripcion }}</p>
          
          <!-- Información adicional -->
          <div v-if="selectedAlert.operacionId || selectedAlert.maquinaId">
            <v-divider class="mb-3" />
            <h4 class="text-subtitle-2 mb-2">Información Relacionada</h4>
            <div v-if="selectedAlert.operacionId" class="mb-2">
              <strong>Operación:</strong> {{ selectedAlert.operacionId }}
            </div>
            <div v-if="selectedAlert.maquinaId" class="mb-2">
              <strong>Máquina:</strong> {{ selectedAlert.maquinaId }}
            </div>
          </div>
          
          <!-- Recomendaciones -->
          <div v-if="getAlertRecommendations(selectedAlert).length > 0">
            <v-divider class="mb-3" />
            <h4 class="text-subtitle-2 mb-2">Recomendaciones</h4>
            <v-list density="compact">
              <v-list-item
                v-for="(rec, index) in getAlertRecommendations(selectedAlert)"
                :key="index"
                class="px-0"
              >
                <template #prepend>
                  <v-icon size="small" color="info">mdi-lightbulb-outline</v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ rec }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="alertDetailDialog = false"
          >
            Cerrar
          </v-btn>
          <v-btn
            v-if="selectedAlert.operacionId"
            color="primary"
            variant="outlined"
            @click="viewOperation(selectedAlert.operacionId)"
          >
            Ver Operación
          </v-btn>
          <v-btn
            color="error"
            variant="outlined"
            @click="dismissAlert(selectedAlert.id)"
          >
            Descartar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDashboardMetrics } from '../../composables/useDashboardMetrics';

const router = useRouter();

const props = defineProps({
  maxVisible: {
    type: Number,
    default: 10
  },
  autoRefresh: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['alert-action', 'alert-dismissed']);

// Usar el composable de métricas
const {
  alerts,
  criticalAlerts,
  loading,
  refreshMetric
} = useDashboardMetrics();

// Estado local
const selectedSeverity = ref(['critical', 'warning', 'info']);
const alertDetailDialog = ref(false);
const selectedAlert = ref(null);

// Computed properties
const criticalCount = computed(() => criticalAlerts.value.length);

const filteredAlerts = computed(() => {
  if (!alerts.value) return [];
  
  return alerts.value
    .filter(alert => selectedSeverity.value.includes(alert.severidad))
    .slice(0, props.maxVisible)
    .sort((a, b) => {
      // Ordenar por severidad y luego por timestamp
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      const severityDiff = severityOrder[b.severidad] - severityOrder[a.severidad];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp - a.timestamp;
    });
});

// Métodos
function getSeverityColor(severity) {
  const colorMap = {
    critical: 'error',
    warning: 'warning',
    info: 'info',
    success: 'success'
  };
  return colorMap[severity] || 'grey';
}

function getSeverityIcon(severity) {
  const iconMap = {
    critical: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
    success: 'mdi-check-circle'
  };
  return iconMap[severity] || 'mdi-help-circle';
}

function getSeverityLabel(severity) {
  const labelMap = {
    critical: 'Crítica',
    warning: 'Advertencia',
    info: 'Información',
    success: 'Éxito'
  };
  return labelMap[severity] || severity;
}

function getSystemStatusColor() {
  if (criticalCount.value > 0) return 'error';
  if (alerts.value?.some(a => a.severidad === 'warning')) return 'warning';
  return 'success';
}

function getSystemStatusIcon() {
  if (criticalCount.value > 0) return 'mdi-alert-circle';
  if (alerts.value?.some(a => a.severidad === 'warning')) return 'mdi-alert';
  return 'mdi-check-circle';
}

function formatAlertTime(timestamp) {
  if (!timestamp) return '';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days} días`;
  
  return new Date(timestamp).toLocaleDateString('es-ES');
}

function getAlertRecommendations(alert) {
  const recommendations = {
    retraso: [
      'Revisar la asignación de recursos para esta operación',
      'Verificar si hay cuellos de botella en el proceso',
      'Considerar reasignar personal disponible'
    ],
    maquina: [
      'Verificar el estado físico de la máquina',
      'Revisar el mantenimiento programado',
      'Considerar redistribuir la carga de trabajo'
    ],
    eficiencia: [
      'Analizar los procesos con menor rendimiento',
      'Revisar la capacitación del personal',
      'Optimizar la secuencia de operaciones'
    ]
  };
  
  return recommendations[alert.tipo] || [
    'Revisar los detalles de la situación',
    'Contactar al supervisor responsable',
    'Documentar las acciones tomadas'
  ];
}

async function refreshAlerts() {
  try {
    await refreshMetric('alerts', true);
  } catch (error) {
    console.error('Error refreshing alerts:', error);
  }
}

function expandAlert(alertId) {
  selectedAlert.value = alerts.value.find(a => a.id === alertId);
  alertDetailDialog.value = true;
}

function dismissAlert(alertId) {
  // TODO: Implementar lógica para descartar alerta
  console.log('Dismissing alert:', alertId);
  emit('alert-dismissed', alertId);
  alertDetailDialog.value = false;
}

function viewOperation(operacionId) {
  emit('alert-action', { type: 'view-operation', id: operacionId });
  router.push(`/app/operaciones/todas?highlight=${operacionId}`);
}

function viewMachine(maquinaId) {
  emit('alert-action', { type: 'view-machine', id: maquinaId });
  // TODO: Navegar a vista de máquinas cuando esté disponible
  console.log('View machine:', maquinaId);
}

// Lifecycle
onMounted(() => {
  refreshAlerts();
});
</script>

<style scoped>
.alerts-panel {
  width: 100%;
}

.alerts-list {
  border-radius: 12px;
}

.alert-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.alert-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.alert-critical {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.alert-warning {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.alert-info {
  border-left: 4px solid rgb(var(--v-theme-info));
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
  .v-btn-toggle .v-btn {
    min-width: 40px !important;
  }
  
  .alert-item .v-list-item-title {
    font-size: 0.875rem !important;
  }
  
  .alert-item .v-list-item-subtitle {
    font-size: 0.75rem !important;
  }
}

/* Animaciones */
.v-alert {
  transition: all 0.3s ease;
}

.v-list-item {
  transition: all 0.2s ease;
}

/* Mejoras visuales */
.v-chip {
  font-weight: 500;
}

.text-caption {
  opacity: 0.7;
}
</style>