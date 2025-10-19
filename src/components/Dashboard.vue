<template>
  <v-container fluid class="pa-4">
    <!-- Header con título y controles -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">Dashboard</h1>
        <p class="text-subtitle-1 text-medium-emphasis mt-1">
          Resumen de operaciones y métricas del sistema
        </p>
      </div>
      
      <div class="d-flex align-center gap-2">
        <!-- Filtro de tiempo -->
        <v-select
          v-model="selectedTimeFilter"
          :items="timeFilterOptions"
          item-title="label"
          item-value="key"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 150px;"
          @update:model-value="handleTimeFilterChange"
        />
        
        <!-- Botón de refresh -->
        <v-btn
          icon="mdi-refresh"
          variant="outlined"
          :loading="isRefreshing"
          @click="refreshDashboard"
        />
      </div>
    </div>

    <!-- KPIs Principales -->
    <div class="mb-6">
      <h2 class="text-h6 font-weight-medium mb-4">Métricas Principales</h2>
      <DashboardKPIs 
        :auto-refresh="true"
        :refresh-interval="30000"
        @kpi-click="handleKPIClick"
        @refresh="handleKPIRefresh"
      />
    </div>

    <!-- Alertas críticas -->
    <div v-if="criticalAlerts.length > 0" class="mb-6">
      <v-alert
        type="error"
        variant="tonal"
        prominent
        border="start"
        closable
      >
        <template #title>
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-alert-circle</v-icon>
            Alertas Críticas ({{ criticalAlerts.length }})
          </div>
        </template>
        
        <div class="mt-2">
          <div v-for="alert in criticalAlerts.slice(0, 3)" :key="alert.id" class="mb-1">
            • {{ alert.descripcion }}
          </div>
          <v-btn
            v-if="criticalAlerts.length > 3"
            variant="text"
            size="small"
            class="mt-2"
            @click="showAllAlerts"
          >
            Ver todas las alertas ({{ criticalAlerts.length }})
          </v-btn>
        </div>
      </v-alert>
    </div>

    <!-- Acciones rápidas -->
    <div class="mb-6">
      <h2 class="text-h6 font-weight-medium mb-4">Acciones Rápidas</h2>
      <v-row>
        <v-col v-for="action in actions" :key="action.title" cols="12" sm="6" md="4" lg="3">
          <v-card 
            @click="navigateTo(action.route)" 
            class="text-center action-card"
            elevation="2"
          >
            <v-card-text class="d-flex align-center justify-center flex-column pa-6">
              <v-avatar :color="action.color" size="64" class="mb-3">
                <v-icon color="white" size="32">{{ action.icon }}</v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-medium">{{ action.title }}</div>
              <div class="text-caption text-medium-emphasis mt-1">{{ action.description }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Gráficos de tendencias -->
    <div class="mb-6">
      <TrendCharts 
        :auto-refresh="true"
        @period-change="handlePeriodChange"
        @chart-refresh="handleChartRefresh"
      />
    </div>

    <!-- Sistema de alertas y cuellos de botella -->
    <v-row class="mb-6">
      <v-col cols="12" lg="8">
        <AlertsPanel 
          :auto-refresh="true"
          :max-visible="8"
          @alert-action="handleAlertAction"
          @alert-dismissed="handleAlertDismissed"
        />
      </v-col>
      <v-col cols="12" lg="4">
        <MachineStatus 
          :auto-refresh="true"
          @machine-action="handleMachineAction"
        />
      </v-col>
    </v-row>

    <!-- Cuellos de botella -->
    <div class="mb-6">
      <BottlenecksPanel 
        :auto-refresh="true"
        @bottleneck-action="handleBottleneckAction"
        @optimization-requested="handleOptimizationRequest"
      />
    </div>

    <!-- Resumen de operaciones recientes -->
    <div>
      <div class="d-flex align-center justify-space-between mb-4">
        <h2 class="text-h6 font-weight-medium">Actividad Reciente</h2>
        <v-btn
          variant="text"
          append-icon="mdi-arrow-right"
          @click="navigateTo('/app/operaciones/todas')"
        >
          Ver todas
        </v-btn>
      </div>
      
      <v-card>
        <v-card-text v-if="loading.initial" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <div class="text-subtitle-2 mt-2">Cargando operaciones...</div>
        </v-card-text>
        
        <v-table v-else-if="recentOperations.length > 0">
          <thead>
            <tr>
              <th>Operación</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Progreso</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="operation in recentOperations" :key="operation.id">
              <td>
                <div class="font-weight-medium">{{ operation.title }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ operation.ordenes.length }} órdenes
                </div>
              </td>
              <td>
                <v-chip
                  :color="operation.estadoOperacion ? 'success' : 'warning'"
                  size="small"
                  variant="tonal"
                >
                  {{ operation.estadoOperacion ? 'Finalizada' : 'En Proceso' }}
                </v-chip>
              </td>
              <td>{{ formatDate(operation.fecha) }}</td>
              <td>
                <div class="d-flex align-center">
                  <v-progress-linear
                    :model-value="operation.progreso"
                    height="6"
                    rounded
                    :color="operation.estadoOperacion ? 'success' : 'primary'"
                    class="mr-2"
                    style="min-width: 60px;"
                  />
                  <span class="text-caption">{{ operation.progreso }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
        
        <v-card-text v-else class="text-center py-8">
          <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-clipboard-text-outline</v-icon>
          <div class="text-subtitle-2 text-medium-emphasis">No hay operaciones recientes</div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DashboardKPIs from './dashboard/DashboardKPIs.vue';
import TrendCharts from './dashboard/TrendCharts.vue';
import AlertsPanel from './dashboard/AlertsPanel.vue';
import BottlenecksPanel from './dashboard/BottlenecksPanel.vue';
import MachineStatus from './dashboard/MachineStatus.vue';
import { useDashboardMetrics } from '../composables/useDashboardMetrics';
import { useOperacionesStore } from '../store/operaciones';

const router = useRouter();
const operacionesStore = useOperacionesStore();

// Usar el composable de métricas del dashboard
const {
  isRefreshing,
  criticalAlerts,
  loading,
  refreshAllMetrics,
  setTimeFilter
} = useDashboardMetrics({
  autoRefresh: true,
  refreshInterval: 30000
});

// Estado local
const selectedTimeFilter = ref('today');

// Opciones de filtro de tiempo
const timeFilterOptions = ref([
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta Semana' },
  { key: 'month', label: 'Este Mes' },
  { key: 'quarter', label: 'Trimestre' }
]);

// Definición de acciones mejoradas
const actions = ref([
  { 
    title: 'Nuevo Proceso', 
    description: 'Iniciar proceso de lavado',
    icon: 'mdi-plus-circle', 
    color: 'primary',
    route: '/app/proceso/lavado' 
  },
  { 
    title: 'Configuración', 
    description: 'Ajustar parámetros del sistema',
    icon: 'mdi-cog', 
    color: 'secondary',
    route: '/app/configuracion' 
  },
  { 
    title: 'Operaciones Activas', 
    description: 'Ver procesos en curso',
    icon: 'mdi-clock', 
    color: 'warning',
    route: '/app/operaciones/todas?filter=pendientes' 
  },
  { 
    title: 'Historial', 
    description: 'Revisar operaciones completadas',
    icon: 'mdi-check-circle', 
    color: 'success',
    route: '/app/operaciones/todas?filter=finalizadas' 
  },
]);

// Computed para operaciones recientes
const recentOperations = computed(() => {
  const operations = Array.from(operacionesStore.items.values())
    .slice(0, 5)
    .map(op => ({
      id: op.id,
      title: `Operación ${op.id}`,
      ordenes: op.ordenes || [],
      estadoOperacion: op.estadoOperacion,
      fecha: op.fechas.fecCreacion,
      progreso: calculateProgress(op)
    }));
  
  return operations;
});

// Métodos
function navigateTo(route) {
  router.push(route);
}

function calculateProgress(operacion) {
  if (operacion.estadoOperacion) return 100;
  
  const totalProcesos = operacion.procesos?.length || 0;
  if (totalProcesos === 0) return 0;
  
  // Calcular progreso basado en procesos completados (simulado)
  const completedProcesos = operacion.procesos?.filter(p => p.estado === 'completado').length || 0;
  return Math.round((completedProcesos / totalProcesos) * 100);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    return dateString;
  }
}

async function handleTimeFilterChange(newFilter) {
  try {
    await setTimeFilter(newFilter);
  } catch (error) {
    console.error('Error changing time filter:', error);
  }
}

async function refreshDashboard() {
  try {
    await refreshAllMetrics(true);
    // También refrescar operaciones recientes
    await operacionesStore.fetchOperaciones({ forceRefresh: true });
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
  }
}

function handleKPIClick(kpiKey) {
  // Navegar a vista específica según el KPI clickeado
  const routeMap = {
    operacionesActivas: '/app/operaciones/todas?filter=pendientes',
    completadasHoy: '/app/operaciones/todas?filter=finalizadas',
    tiempoPromedio: '/app/operaciones/todas',
    eficienciaGeneral: '/app/operaciones/todas'
  };
  
  const route = routeMap[kpiKey];
  if (route) {
    navigateTo(route);
  }
}

function handleKPIRefresh(metricType) {
  console.log(`KPI ${metricType} refreshed`);
}

function handlePeriodChange(period) {
  console.log(`Period changed to: ${period}`);
}

function handleChartRefresh() {
  console.log('Charts refreshed');
}

function handleAlertAction(action) {
  console.log('Alert action:', action);
  // Manejar acciones de alertas (ver operación, ver máquina, etc.)
}

function handleAlertDismissed(alertId) {
  console.log('Alert dismissed:', alertId);
  // Manejar descarte de alertas
}

function handleBottleneckAction(action) {
  console.log('Bottleneck action:', action);
  // Manejar acciones de cuellos de botella
}

function handleOptimizationRequest(bottleneck) {
  console.log('Optimization requested for:', bottleneck);
  // Manejar solicitudes de optimización
}

function handleMachineAction(action) {
  console.log('Machine action:', action);
  // Manejar acciones de máquinas
}

function showAllAlerts() {
  // TODO: Implementar modal o vista de todas las alertas
  console.log('Show all alerts');
}

// Lifecycle
onMounted(async () => {
  // Cargar operaciones recientes
  try {
    await operacionesStore.fetchOperaciones({ limit: 10 });
  } catch (error) {
    console.error('Error loading recent operations:', error);
  }
});
</script>

<style scoped>
.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
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
  .action-card .v-avatar {
    width: 48px !important;
    height: 48px !important;
  }
  
  .action-card .v-icon {
    font-size: 24px !important;
  }
  
  .action-card .v-card-text {
    padding: 16px !important;
  }
}

/* Animaciones suaves */
.v-progress-linear {
  transition: all 0.3s ease;
}

.v-chip {
  transition: all 0.2s ease;
}

/* Mejoras visuales */
.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}

.v-table th {
  font-weight: 600 !important;
  color: rgba(var(--v-theme-on-surface), 0.87) !important;
}
</style>
