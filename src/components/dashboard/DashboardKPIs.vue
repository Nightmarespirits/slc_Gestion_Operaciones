<template>
  <v-row>
    <!-- KPI Cards -->
    <v-col v-for="kpi in kpis" :key="kpi.key" cols="12" sm="6" md="3">
      <v-card 
        :class="['kpi-card', { 'kpi-loading': loading }]"
        elevation="2"
        @click="kpi.onClick && kpi.onClick()"
        :style="{ cursor: kpi.onClick ? 'pointer' : 'default' }"
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-center">
            <div class="flex-grow-1">
              <!-- Valor principal -->
              <div 
                class="text-h4 font-weight-bold mb-1" 
                :class="kpi.valueColor"
              >
                <v-skeleton-loader
                  v-if="loading"
                  type="text"
                  width="80px"
                  height="32px"
                />
                <span v-else>{{ formatValue(kpi.value, kpi.format) }}</span>
              </div>
              
              <!-- Título -->
              <div class="text-subtitle-2 text-medium-emphasis mb-2">
                {{ kpi.title }}
              </div>
              
              <!-- Indicador de tendencia -->
              <div 
                v-if="!loading && kpi.trend" 
                class="d-flex align-center"
                :class="kpi.trend.color"
              >
                <v-icon size="small" class="mr-1">
                  {{ kpi.trend.icon }}
                </v-icon>
                <span class="text-caption font-weight-medium">
                  {{ kpi.trend.text }}
                </span>
              </div>
              
              <v-skeleton-loader
                v-else-if="loading"
                type="text"
                width="60px"
                height="16px"
              />
            </div>
            
            <!-- Ícono del KPI -->
            <div class="ml-3">
              <v-avatar 
                :color="loading ? 'grey-lighten-3' : kpi.color" 
                size="56"
                class="elevation-1"
              >
                <v-icon 
                  color="white" 
                  size="28"
                  :icon="loading ? 'mdi-loading' : kpi.icon"
                  :class="{ 'rotating': loading }"
                />
              </v-avatar>
            </div>
          </div>
          
          <!-- Información adicional -->
          <div v-if="!loading && kpi.subtitle" class="mt-3">
            <v-divider class="mb-2" />
            <div class="text-caption text-medium-emphasis">
              {{ kpi.subtitle }}
            </div>
          </div>
        </v-card-text>
        
        <!-- Indicador de actualización -->
        <v-progress-linear
          v-if="refreshing && !loading"
          indeterminate
          color="primary"
          height="2"
        />
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDashboardStore } from '../../store/dashboard';

const props = defineProps({
  autoRefresh: {
    type: Boolean,
    default: true
  },
  refreshInterval: {
    type: Number,
    default: 30000 // 30 segundos
  }
});

const emit = defineEmits(['kpi-click', 'refresh']);

const dashboardStore = useDashboardStore();
const refreshing = ref(false);
let refreshTimer = null;

// Computed para obtener KPIs del store
const kpis = computed(() => {
  const mainKPIs = dashboardStore.mainKPIs;
  
  if (!mainKPIs) {
    return getDefaultKPIs();
  }
  
  return [
    {
      key: 'operacionesActivas',
      title: 'Operaciones Activas',
      value: mainKPIs.operacionesActivas,
      format: 'number',
      icon: 'mdi-cog-play',
      color: 'primary',
      valueColor: 'text-primary',
      trend: getTrendData(mainKPIs.tendencias?.operacionesActivas),
      subtitle: 'En proceso actualmente',
      onClick: () => handleKPIClick('operacionesActivas')
    },
    {
      key: 'completadasHoy',
      title: 'Completadas Hoy',
      value: mainKPIs.completadasHoy,
      format: 'number',
      icon: 'mdi-check-circle',
      color: 'success',
      valueColor: 'text-success',
      trend: getTrendData(mainKPIs.tendencias?.completadasHoy),
      subtitle: 'Finalizadas en el día',
      onClick: () => handleKPIClick('completadasHoy')
    },
    {
      key: 'tiempoPromedio',
      title: 'Tiempo Promedio',
      value: mainKPIs.tiempoPromedio,
      format: 'time',
      icon: 'mdi-clock-outline',
      color: 'info',
      valueColor: 'text-info',
      trend: getTrendData(mainKPIs.tendencias?.tiempoPromedio),
      subtitle: 'Duración por operación',
      onClick: () => handleKPIClick('tiempoPromedio')
    },
    {
      key: 'eficienciaGeneral',
      title: 'Eficiencia General',
      value: mainKPIs.eficienciaGeneral,
      format: 'percentage',
      icon: 'mdi-speedometer',
      color: getEfficiencyColor(mainKPIs.eficienciaGeneral),
      valueColor: getEfficiencyTextColor(mainKPIs.eficienciaGeneral),
      trend: getTrendData(mainKPIs.tendencias?.eficienciaGeneral),
      subtitle: 'Rendimiento del sistema',
      onClick: () => handleKPIClick('eficienciaGeneral')
    }
  ];
});

const loading = computed(() => dashboardStore.loading.kpis);

// Funciones auxiliares
function getDefaultKPIs() {
  return [
    {
      key: 'operacionesActivas',
      title: 'Operaciones Activas',
      value: 0,
      format: 'number',
      icon: 'mdi-cog-play',
      color: 'primary',
      valueColor: 'text-primary'
    },
    {
      key: 'completadasHoy',
      title: 'Completadas Hoy',
      value: 0,
      format: 'number',
      icon: 'mdi-check-circle',
      color: 'success',
      valueColor: 'text-success'
    },
    {
      key: 'tiempoPromedio',
      title: 'Tiempo Promedio',
      value: 0,
      format: 'time',
      icon: 'mdi-clock-outline',
      color: 'info',
      valueColor: 'text-info'
    },
    {
      key: 'eficienciaGeneral',
      title: 'Eficiencia General',
      value: 0,
      format: 'percentage',
      icon: 'mdi-speedometer',
      color: 'grey',
      valueColor: 'text-grey'
    }
  ];
}

function getTrendData(trendInfo) {
  if (!trendInfo) return null;
  
  const { change, trend } = trendInfo;
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  
  return {
    icon: isPositive ? 'mdi-trending-up' : isNegative ? 'mdi-trending-down' : 'mdi-trending-neutral',
    color: isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-grey',
    text: `${Math.abs(change)}% vs período anterior`
  };
}

function getEfficiencyColor(efficiency) {
  if (efficiency >= 90) return 'success';
  if (efficiency >= 75) return 'warning';
  if (efficiency >= 60) return 'orange';
  return 'error';
}

function getEfficiencyTextColor(efficiency) {
  if (efficiency >= 90) return 'text-success';
  if (efficiency >= 75) return 'text-warning';
  if (efficiency >= 60) return 'text-orange';
  return 'text-error';
}

function formatValue(value, format) {
  if (value === null || value === undefined) return '-';
  
  switch (format) {
    case 'number':
      return new Intl.NumberFormat('es-ES').format(value);
    case 'percentage':
      return `${value}%`;
    case 'time':
      if (value < 1) {
        return `${Math.round(value * 60)}min`;
      }
      return `${value.toFixed(1)}h`;
    default:
      return value.toString();
  }
}

function handleKPIClick(kpiKey) {
  emit('kpi-click', kpiKey);
}

async function refreshKPIs() {
  if (refreshing.value) return;
  
  refreshing.value = true;
  try {
    await dashboardStore.fetchKPIs(true);
    emit('refresh', 'kpis');
  } catch (error) {
    console.error('Error refreshing KPIs:', error);
  } finally {
    refreshing.value = false;
  }
}

function setupAutoRefresh() {
  if (!props.autoRefresh) return;
  
  refreshTimer = setInterval(refreshKPIs, props.refreshInterval);
}

function clearAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// Watchers
watch(() => props.autoRefresh, (newValue) => {
  if (newValue) {
    setupAutoRefresh();
  } else {
    clearAutoRefresh();
  }
});

// Lifecycle
onMounted(async () => {
  // Cargar KPIs iniciales
  await dashboardStore.fetchKPIs();
  
  // Configurar auto-refresh
  setupAutoRefresh();
});

onUnmounted(() => {
  clearAutoRefresh();
});

// Exponer métodos para uso externo
defineExpose({
  refresh: refreshKPIs
});
</script>

<style scoped>
.kpi-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

.kpi-card.kpi-loading {
  opacity: 0.8;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .kpi-card .text-h4 {
    font-size: 1.5rem !important;
  }
}

@media (max-width: 600px) {
  .kpi-card .v-avatar {
    width: 48px !important;
    height: 48px !important;
  }
  
  .kpi-card .v-icon {
    font-size: 24px !important;
  }
}
</style>