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
      
      <v-btn
        icon="mdi-refresh"
        variant="outlined"
        :loading="loading"
        @click="refreshDashboard"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading && !dashboardData" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <div class="text-h6 mt-4">Cargando métricas...</div>
    </div>

    <!-- Error state -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      <template #title>Error al cargar datos</template>
      {{ error }}
      <template #append>
        <v-btn variant="text" @click="refreshDashboard">Reintentar</v-btn>
      </template>
    </v-alert>

    <!-- Dashboard content -->
    <div v-else-if="dashboardData">
      <!-- KPIs Principales -->
      <div class="mb-6">
        <h2 class="text-h6 font-weight-medium mb-4">Métricas Principales</h2>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card class="kpi-card">
              <v-card-text class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-primary mb-2">
                  {{ dashboardData.kpis.operacionesActivas }}
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  Operaciones Activas
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card class="kpi-card">
              <v-card-text class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-success mb-2">
                  {{ dashboardData.kpis.completadasHoy }}
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  Completadas Hoy
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card class="kpi-card">
              <v-card-text class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-info mb-2">
                  {{ dashboardData.kpis.tiempoPromedio.toFixed(1) }}h
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  Tiempo Promedio
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" sm="6" md="3">
            <v-card class="kpi-card">
              <v-card-text class="text-center pa-4">
                <div class="text-h4 font-weight-bold text-warning mb-2">
                  {{ dashboardData.kpis.eficienciaGeneral }}%
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  Eficiencia General
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Distribución de Procesos -->
      <div class="mb-6">
        <h2 class="text-h6 font-weight-medium mb-4">Distribución de Procesos</h2>
        <v-row>
          <v-col v-for="(count, process) in dashboardData.distribution" :key="process" cols="12" sm="6" md="3">
            <v-card class="process-card">
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-h6 font-weight-medium text-capitalize">{{ process }}</div>
                    <div class="text-h4 font-weight-bold mt-1">{{ count }}</div>
                  </div>
                  <v-avatar :color="getProcessColor(process)" size="48">
                    <v-icon color="white">{{ getProcessIcon(process) }}</v-icon>
                  </v-avatar>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Tendencias Diarias -->
      <div class="mb-6">
        <h2 class="text-h6 font-weight-medium mb-4">Tendencias Diarias</h2>
        <v-card>
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="text-subtitle-1 font-weight-medium">Operaciones por Día</div>
              <div class="text-caption text-medium-emphasis">
                Últimos {{ dashboardData.trends.daily.length }} días
              </div>
            </div>
            
            <!-- Simple chart representation -->
            <div class="trend-chart">
              <div 
                v-for="(day, index) in dashboardData.trends.daily" 
                :key="day.date"
                class="trend-bar-container"
              >
                <div class="trend-bar-wrapper">
                  <div 
                    class="trend-bar"
                    :style="{ height: `${(day.count / maxDailyCount) * 100}%` }"
                  ></div>
                </div>
                <div class="trend-label">
                  <div class="text-caption font-weight-medium">{{ day.count }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatShortDate(day.date) }}
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

// Estado reactivo
const dashboardData = ref(null);
const loading = ref(false);
const error = ref(null);
const refreshInterval = ref(null);

// Computed properties
const maxDailyCount = computed(() => {
  if (!dashboardData.value?.trends?.daily) return 1;
  return Math.max(...dashboardData.value.trends.daily.map(d => d.count));
});

// Métodos
async function fetchDashboardMetrics() {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await axios.get('http://localhost:8085/operacion/dashboard/metrics');
    dashboardData.value = response.data;
  } catch (err) {
    console.error('Error fetching dashboard metrics:', err);
    error.value = 'No se pudieron cargar las métricas del dashboard';
  } finally {
    loading.value = false;
  }
}

async function refreshDashboard() {
  await fetchDashboardMetrics();
}

function getProcessColor(process) {
  const colors = {
    lavado: 'blue',
    secado: 'orange',
    doblado: 'green',
    tenido: 'purple',
    planchado: 'red'
  };
  return colors[process] || 'grey';
}

function getProcessIcon(process) {
  const icons = {
    lavado: 'mdi-washing-machine',
    secado: 'mdi-tumble-dryer',
    doblado: 'mdi-tshirt-crew',
    tenido: 'mdi-palette',
    planchado: 'mdi-iron'
  };
  return icons[process] || 'mdi-cog';
}

function formatShortDate(dateString) {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  } catch (error) {
    return dateString.slice(-5); // Fallback to last 5 chars
  }
}

function setupAutoRefresh() {
  // Refrescar cada 30 segundos
  refreshInterval.value = setInterval(() => {
    fetchDashboardMetrics();
  }, 30000);
}

function clearAutoRefresh() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
}

// Lifecycle
onMounted(async () => {
  await fetchDashboardMetrics();
  setupAutoRefresh();
});

onUnmounted(() => {
  clearAutoRefresh();
});
</script>

<style scoped>
.kpi-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
}

.process-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.process-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
}

.trend-chart {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 120px;
  padding: 0 8px;
  gap: 4px;
}

.trend-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.trend-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: end;
  width: 100%;
  min-height: 60px;
}

.trend-bar {
  width: 100%;
  background: linear-gradient(to top, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.7));
  border-radius: 4px 4px 0 0;
  min-height: 8px;
  transition: all 0.3s ease;
}

.trend-bar:hover {
  background: linear-gradient(to top, rgb(var(--v-theme-primary)), rgb(var(--v-theme-primary)));
}

.trend-label {
  margin-top: 8px;
  text-align: center;
  min-height: 40px;
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}

.text-success {
  color: rgb(var(--v-theme-success)) !important;
}

.text-info {
  color: rgb(var(--v-theme-info)) !important;
}

.text-warning {
  color: rgb(var(--v-theme-warning)) !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .trend-chart {
    height: 100px;
    gap: 2px;
  }
  
  .trend-bar-wrapper {
    min-height: 40px;
  }
  
  .trend-label {
    min-height: 30px;
  }
}
</style>
