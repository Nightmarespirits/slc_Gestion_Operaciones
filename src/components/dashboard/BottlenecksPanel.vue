<template>
  <div class="bottlenecks-panel">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center">
        <h3 class="text-h6 font-weight-medium">
          <v-icon class="mr-2" color="warning">mdi-traffic-cone</v-icon>
          Cuellos de Botella
        </h3>
        <v-chip
          v-if="bottlenecks.length > 0"
          :color="getBottleneckSeverityColor()"
          size="small"
          class="ml-2"
        >
          {{ bottlenecks.length }} detectados
        </v-chip>
      </div>
      
      <div class="d-flex align-center gap-2">
        <v-btn
          icon="mdi-refresh"
          variant="outlined"
          size="small"
          :loading="loading.bottlenecks"
          @click="refreshBottlenecks"
        />
        
        <v-btn
          icon="mdi-cog"
          variant="outlined"
          size="small"
          @click="showSettings"
        />
      </div>
    </div>

    <!-- Resumen de estado -->
    <v-row class="mb-4">
      <v-col cols="12" sm="4">
        <v-card variant="outlined" class="text-center pa-3">
          <div class="text-h5 font-weight-bold text-error">
            {{ criticalBottlenecks.length }}
          </div>
          <div class="text-caption text-medium-emphasis">Críticos</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card variant="outlined" class="text-center pa-3">
          <div class="text-h5 font-weight-bold text-warning">
            {{ warningBottlenecks.length }}
          </div>
          <div class="text-caption text-medium-emphasis">Advertencias</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card variant="outlined" class="text-center pa-3">
          <div class="text-h5 font-weight-bold text-success">
            {{ systemEfficiency }}%
          </div>
          <div class="text-caption text-medium-emphasis">Eficiencia</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Lista de cuellos de botella -->
    <v-card class="bottlenecks-list">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        Análisis Detallado
      </v-card-title>
      
      <v-card-text v-if="loading.bottlenecks" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-subtitle-2 mt-2">Analizando sistema...</div>
      </v-card-text>
      
      <v-expansion-panels v-else-if="bottlenecks.length > 0" variant="accordion">
        <v-expansion-panel
          v-for="bottleneck in bottlenecks"
          :key="bottleneck.id || bottleneck.proceso"
          :class="['bottleneck-panel', `bottleneck-${bottleneck.severidad}`]"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center justify-space-between w-100">
              <div class="d-flex align-center">
                <v-avatar
                  :color="getSeverityColor(bottleneck.severidad)"
                  size="32"
                  class="mr-3"
                >
                  <v-icon color="white" size="16">
                    {{ getBottleneckIcon(bottleneck.tipo) }}
                  </v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">
                    {{ getBottleneckTitle(bottleneck) }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ bottleneck.descripcion }}
                  </div>
                </div>
              </div>
              
              <div class="d-flex align-center mr-4">
                <v-chip
                  :color="getSeverityColor(bottleneck.severidad)"
                  size="small"
                  variant="tonal"
                >
                  {{ getSeverityLabel(bottleneck.severidad) }}
                </v-chip>
              </div>
            </div>
          </v-expansion-panel-title>
          
          <v-expansion-panel-text>
            <div class="bottleneck-details">
              <!-- Métricas del cuello de botella -->
              <div class="mb-4">
                <h4 class="text-subtitle-2 mb-2">Métricas</h4>
                <v-row>
                  <v-col v-if="bottleneck.eficiencia" cols="6" sm="3">
                    <div class="metric-card">
                      <div class="text-h6" :class="getEfficiencyColor(bottleneck.eficiencia)">
                        {{ bottleneck.eficiencia }}%
                      </div>
                      <div class="text-caption">Eficiencia</div>
                    </div>
                  </v-col>
                  <v-col v-if="bottleneck.utilizacion" cols="6" sm="3">
                    <div class="metric-card">
                      <div class="text-h6" :class="getUtilizationColor(bottleneck.utilizacion)">
                        {{ bottleneck.utilizacion }}%
                      </div>
                      <div class="text-caption">Utilización</div>
                    </div>
                  </v-col>
                  <v-col v-if="bottleneck.tiempoPromedio" cols="6" sm="3">
                    <div class="metric-card">
                      <div class="text-h6 text-info">
                        {{ formatTime(bottleneck.tiempoPromedio) }}
                      </div>
                      <div class="text-caption">Tiempo Promedio</div>
                    </div>
                  </v-col>
                  <v-col v-if="bottleneck.cola" cols="6" sm="3">
                    <div class="metric-card">
                      <div class="text-h6 text-warning">
                        {{ bottleneck.cola }}
                      </div>
                      <div class="text-caption">En Cola</div>
                    </div>
                  </v-col>
                </v-row>
              </div>
              
              <!-- Impacto -->
              <div class="mb-4">
                <h4 class="text-subtitle-2 mb-2">Impacto en el Sistema</h4>
                <v-progress-linear
                  :model-value="getImpactLevel(bottleneck)"
                  :color="getImpactColor(bottleneck)"
                  height="8"
                  rounded
                  class="mb-2"
                />
                <div class="text-caption text-medium-emphasis">
                  {{ getImpactDescription(bottleneck) }}
                </div>
              </div>
              
              <!-- Recomendaciones -->
              <div class="mb-4">
                <h4 class="text-subtitle-2 mb-2">Recomendaciones</h4>
                <v-list density="compact" class="py-0">
                  <v-list-item
                    v-for="(recommendation, index) in getRecommendations(bottleneck)"
                    :key="index"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon size="small" color="success">mdi-lightbulb-outline</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">
                      {{ recommendation }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
              
              <!-- Acciones -->
              <div class="d-flex gap-2">
                <v-btn
                  size="small"
                  color="primary"
                  variant="outlined"
                  @click="viewDetails(bottleneck)"
                >
                  Ver Detalles
                </v-btn>
                <v-btn
                  size="small"
                  color="success"
                  variant="outlined"
                  @click="optimizeBottleneck(bottleneck)"
                >
                  Optimizar
                </v-btn>
                <v-btn
                  size="small"
                  color="info"
                  variant="outlined"
                  @click="createAlert(bottleneck)"
                >
                  Crear Alerta
                </v-btn>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      
      <v-card-text v-else class="text-center py-8">
        <v-icon size="48" color="success" class="mb-2">mdi-check-circle</v-icon>
        <div class="text-subtitle-2">No se detectaron cuellos de botella</div>
        <div class="text-caption text-medium-emphasis">
          El sistema está funcionando de manera óptima
        </div>
      </v-card-text>
    </v-card>

    <!-- Gráfico de análisis de flujo -->
    <v-card v-if="bottlenecks.length > 0" class="mt-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="info">mdi-chart-sankey</v-icon>
        Análisis de Flujo de Procesos
      </v-card-title>
      <v-card-text>
        <ProcessFlowChart :bottlenecks="bottlenecks" />
      </v-card-text>
    </v-card>

    <!-- Modal de configuración -->
    <v-dialog v-model="settingsDialog" max-width="500px">
      <v-card>
        <v-card-title>Configuración de Detección</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="settings.efficiencyThreshold"
              label="Umbral de Eficiencia (%)"
              type="number"
              min="0"
              max="100"
              hint="Eficiencia mínima antes de considerar cuello de botella"
            />
            
            <v-text-field
              v-model="settings.utilizationThreshold"
              label="Umbral de Utilización (%)"
              type="number"
              min="0"
              max="100"
              hint="Utilización máxima antes de considerar sobrecarga"
            />
            
            <v-text-field
              v-model="settings.queueThreshold"
              label="Umbral de Cola"
              type="number"
              min="0"
              hint="Número máximo de elementos en cola"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="settingsDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" @click="saveSettings">
            Guardar
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
import ProcessFlowChart from './ProcessFlowChart.vue';

const router = useRouter();

const props = defineProps({
  autoRefresh: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['bottleneck-action', 'optimization-requested']);

// Usar el composable de métricas
const {
  bottlenecks,
  loading,
  refreshMetric
} = useDashboardMetrics();

// Estado local
const settingsDialog = ref(false);
const settings = ref({
  efficiencyThreshold: 70,
  utilizationThreshold: 90,
  queueThreshold: 10
});

// Computed properties
const criticalBottlenecks = computed(() => 
  bottlenecks.value.filter(b => b.severidad === 'critical')
);

const warningBottlenecks = computed(() => 
  bottlenecks.value.filter(b => b.severidad === 'warning')
);

const systemEfficiency = computed(() => {
  if (!bottlenecks.value.length) return 100;
  
  const avgEfficiency = bottlenecks.value.reduce((sum, b) => 
    sum + (b.eficiencia || 0), 0) / bottlenecks.value.length;
  
  return Math.round(avgEfficiency);
});

// Métodos
function getSeverityColor(severity) {
  const colorMap = {
    critical: 'error',
    warning: 'warning',
    info: 'info'
  };
  return colorMap[severity] || 'grey';
}

function getSeverityLabel(severity) {
  const labelMap = {
    critical: 'Crítico',
    warning: 'Advertencia',
    info: 'Información'
  };
  return labelMap[severity] || severity;
}

function getBottleneckSeverityColor() {
  if (criticalBottlenecks.value.length > 0) return 'error';
  if (warningBottlenecks.value.length > 0) return 'warning';
  return 'success';
}

function getBottleneckIcon(tipo) {
  const iconMap = {
    proceso_lento: 'mdi-clock-alert',
    sobrecarga: 'mdi-gauge-full',
    cola_larga: 'mdi-format-list-numbered',
    maquina: 'mdi-cog-off',
    personal: 'mdi-account-alert'
  };
  return iconMap[tipo] || 'mdi-alert-circle';
}

function getBottleneckTitle(bottleneck) {
  const titleMap = {
    proceso_lento: `Proceso Lento: ${bottleneck.proceso}`,
    sobrecarga: `Sobrecarga: ${bottleneck.proceso}`,
    cola_larga: `Cola Extensa: ${bottleneck.proceso}`,
    maquina: `Problema de Máquina: ${bottleneck.maquina}`,
    personal: `Problema de Personal: ${bottleneck.area}`
  };
  return titleMap[bottleneck.tipo] || bottleneck.descripcion;
}

function getEfficiencyColor(efficiency) {
  if (efficiency >= 90) return 'text-success';
  if (efficiency >= 75) return 'text-warning';
  return 'text-error';
}

function getUtilizationColor(utilization) {
  if (utilization <= 80) return 'text-success';
  if (utilization <= 95) return 'text-warning';
  return 'text-error';
}

function formatTime(minutes) {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}

function getImpactLevel(bottleneck) {
  // Calcular nivel de impacto basado en severidad y métricas
  const severityWeight = {
    critical: 100,
    warning: 60,
    info: 30
  };
  
  let impact = severityWeight[bottleneck.severidad] || 30;
  
  // Ajustar por eficiencia
  if (bottleneck.eficiencia) {
    impact = Math.max(impact, 100 - bottleneck.eficiencia);
  }
  
  // Ajustar por utilización
  if (bottleneck.utilizacion && bottleneck.utilizacion > 90) {
    impact = Math.max(impact, bottleneck.utilizacion);
  }
  
  return Math.min(impact, 100);
}

function getImpactColor(bottleneck) {
  const impact = getImpactLevel(bottleneck);
  if (impact >= 80) return 'error';
  if (impact >= 60) return 'warning';
  return 'info';
}

function getImpactDescription(bottleneck) {
  const impact = getImpactLevel(bottleneck);
  if (impact >= 80) return 'Impacto crítico en el flujo de operaciones';
  if (impact >= 60) return 'Impacto moderado en la eficiencia del sistema';
  return 'Impacto menor, monitoreo recomendado';
}

function getRecommendations(bottleneck) {
  const recommendationMap = {
    proceso_lento: [
      'Revisar la asignación de personal especializado',
      'Verificar el estado y mantenimiento de equipos',
      'Considerar optimización del flujo de trabajo',
      'Evaluar la necesidad de capacitación adicional'
    ],
    sobrecarga: [
      'Redistribuir la carga de trabajo',
      'Considerar turnos adicionales o personal temporal',
      'Revisar la planificación de operaciones',
      'Evaluar la capacidad de equipos alternativos'
    ],
    cola_larga: [
      'Implementar sistema de priorización',
      'Aumentar la capacidad de procesamiento',
      'Revisar los tiempos de setup entre operaciones',
      'Considerar procesamiento en paralelo'
    ],
    maquina: [
      'Programar mantenimiento preventivo',
      'Verificar disponibilidad de repuestos',
      'Considerar equipos de respaldo',
      'Revisar protocolos de operación'
    ],
    personal: [
      'Evaluar la disponibilidad de personal',
      'Considerar redistribución de tareas',
      'Revisar programas de capacitación',
      'Implementar incentivos de productividad'
    ]
  };
  
  return recommendationMap[bottleneck.tipo] || [
    'Analizar la situación en detalle',
    'Consultar con el supervisor del área',
    'Documentar las acciones tomadas',
    'Monitorear la evolución del problema'
  ];
}

async function refreshBottlenecks() {
  try {
    await refreshMetric('bottlenecks', true);
  } catch (error) {
    console.error('Error refreshing bottlenecks:', error);
  }
}

function showSettings() {
  settingsDialog.value = true;
}

function saveSettings() {
  // TODO: Guardar configuración en el store o backend
  console.log('Saving settings:', settings.value);
  settingsDialog.value = false;
}

function viewDetails(bottleneck) {
  emit('bottleneck-action', { type: 'view-details', bottleneck });
  
  // Navegar según el tipo de cuello de botella
  if (bottleneck.proceso) {
    router.push(`/app/proceso/${bottleneck.proceso.toLowerCase()}`);
  }
}

function optimizeBottleneck(bottleneck) {
  emit('optimization-requested', bottleneck);
  // TODO: Implementar lógica de optimización automática
  console.log('Optimizing bottleneck:', bottleneck);
}

function createAlert(bottleneck) {
  emit('bottleneck-action', { type: 'create-alert', bottleneck });
  // TODO: Crear alerta basada en el cuello de botella
  console.log('Creating alert for bottleneck:', bottleneck);
}

// Lifecycle
onMounted(() => {
  refreshBottlenecks();
});
</script>

<style scoped>
.bottlenecks-panel {
  width: 100%;
}

.bottlenecks-list {
  border-radius: 12px;
}

.bottleneck-panel {
  transition: all 0.2s ease;
}

.bottleneck-critical {
  border-left: 4px solid rgb(var(--v-theme-error));
}

.bottleneck-warning {
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.bottleneck-info {
  border-left: 4px solid rgb(var(--v-theme-info));
}

.bottleneck-details {
  padding: 8px 0;
}

.metric-card {
  text-align: center;
  padding: 8px;
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
  .metric-card {
    padding: 4px;
  }
  
  .metric-card .text-h6 {
    font-size: 1.25rem !important;
  }
}

/* Animaciones */
.v-expansion-panel {
  transition: all 0.3s ease;
}

.v-progress-linear {
  transition: all 0.3s ease;
}

/* Mejoras visuales */
.v-chip {
  font-weight: 500;
}

.text-caption {
  opacity: 0.7;
}
</style>