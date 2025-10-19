<template>
  <div class="trend-charts">
    <!-- Filtros de tiempo -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h3 class="text-h6 font-weight-medium">Tendencias y Análisis</h3>
      <div class="d-flex align-center gap-2">
        <v-btn-toggle
          v-model="selectedPeriod"
          variant="outlined"
          density="compact"
          mandatory
          @update:model-value="handlePeriodChange"
        >
          <v-btn value="7d" size="small">7 días</v-btn>
          <v-btn value="30d" size="small">30 días</v-btn>
          <v-btn value="90d" size="small">90 días</v-btn>
        </v-btn-toggle>
        
        <v-btn
          icon="mdi-refresh"
          variant="outlined"
          size="small"
          :loading="loading.trends"
          @click="refreshCharts"
        />
      </div>
    </div>

    <v-row>
      <!-- Gráfico de líneas - Tendencias de operaciones -->
      <v-col cols="12" lg="8">
        <v-card class="chart-card">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
            Tendencia de Operaciones
          </v-card-title>
          <v-card-text>
            <div v-if="loading.trends" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <div class="text-subtitle-2 mt-2">Cargando datos...</div>
            </div>
            <v-chart
              v-else
              ref="operationsTrendChart"
              :option="operationsTrendOption"
              :style="{ height: '300px' }"
              autoresize
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Gráfico de barras - Distribución por proceso -->
      <v-col cols="12" lg="4">
        <v-card class="chart-card">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="success">mdi-chart-bar</v-icon>
            Distribución por Proceso
          </v-card-title>
          <v-card-text>
            <div v-if="loading.processDistribution" class="text-center py-8">
              <v-progress-circular indeterminate color="success" />
              <div class="text-subtitle-2 mt-2">Cargando datos...</div>
            </div>
            <v-chart
              v-else
              ref="processDistributionChart"
              :option="processDistributionOption"
              :style="{ height: '300px' }"
              autoresize
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Gráfico de área - Productividad por empleado -->
      <v-col cols="12" lg="6">
        <v-card class="chart-card">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="info">mdi-chart-areaspline</v-icon>
            Productividad por Empleado
          </v-card-title>
          <v-card-text>
            <div v-if="loading.employeeMetrics" class="text-center py-8">
              <v-progress-circular indeterminate color="info" />
              <div class="text-subtitle-2 mt-2">Cargando datos...</div>
            </div>
            <v-chart
              v-else
              ref="employeeProductivityChart"
              :option="employeeProductivityOption"
              :style="{ height: '300px' }"
              autoresize
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Gráfico de tiempo promedio por proceso -->
      <v-col cols="12" lg="6">
        <v-card class="chart-card">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="warning">mdi-clock-outline</v-icon>
            Tiempo Promedio por Proceso
          </v-card-title>
          <v-card-text>
            <div v-if="loading.trends" class="text-center py-8">
              <v-progress-circular indeterminate color="warning" />
              <div class="text-subtitle-2 mt-2">Cargando datos...</div>
            </div>
            <v-chart
              v-else
              ref="processTimeChart"
              :option="processTimeOption"
              :style="{ height: '300px' }"
              autoresize
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import { useDashboardMetrics } from '../../composables/useDashboardMetrics';

// Registrar componentes de ECharts
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent
]);

const props = defineProps({
  autoRefresh: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['period-change', 'chart-refresh']);

// Usar el composable de métricas
const {
  trends,
  processDistribution,
  employeeMetrics,
  loading,
  refreshMetric,
  setTimeFilter
} = useDashboardMetrics();

// Estado local
const selectedPeriod = ref('7d');
const operationsTrendChart = ref(null);
const processDistributionChart = ref(null);
const employeeProductivityChart = ref(null);
const processTimeChart = ref(null);

// Opciones para el gráfico de tendencias de operaciones
const operationsTrendOption = computed(() => {
  const trendData = trends.value;
  if (!trendData || !trendData.operacionesPorDia) {
    return getEmptyChartOption('No hay datos de tendencias disponibles');
  }

  const data = trendData.operacionesPorDia;
  const dates = data.map(item => formatChartDate(item.date));
  const operaciones = data.map(item => item.operaciones || 0);
  const completadas = data.map(item => item.completadas || 0);

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        let result = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].axisValue}</div>`;
        params.forEach(param => {
          result += `<div style="display: flex; align-items: center; margin: 2px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
            ${param.seriesName}: <strong>${param.value}</strong>
          </div>`;
        });
        return result;
      }
    },
    legend: {
      data: ['Total Operaciones', 'Completadas'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Cantidad',
      nameLocation: 'middle',
      nameGap: 40
    },
    series: [
      {
        name: 'Total Operaciones',
        type: 'line',
        data: operaciones,
        smooth: true,
        lineStyle: {
          color: '#1976d2',
          width: 3
        },
        itemStyle: {
          color: '#1976d2'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(25, 118, 210, 0.3)' },
              { offset: 1, color: 'rgba(25, 118, 210, 0.05)' }
            ]
          }
        }
      },
      {
        name: 'Completadas',
        type: 'line',
        data: completadas,
        smooth: true,
        lineStyle: {
          color: '#4caf50',
          width: 3
        },
        itemStyle: {
          color: '#4caf50'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(76, 175, 80, 0.3)' },
              { offset: 1, color: 'rgba(76, 175, 80, 0.05)' }
            ]
          }
        }
      }
    ]
  };
});

// Opciones para el gráfico de distribución por proceso
const processDistributionOption = computed(() => {
  const distribution = processDistribution.value;
  if (!distribution || distribution.length === 0) {
    return getEmptyChartOption('No hay datos de distribución disponibles');
  }

  const data = distribution.map(item => ({
    name: item.tipo,
    value: item.total || 0
  }));

  const colors = ['#1976d2', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: 'Procesos',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: colors[index % colors.length]
          }
        }))
      }
    ]
  };
});

// Opciones para el gráfico de productividad por empleado
const employeeProductivityOption = computed(() => {
  const metrics = employeeMetrics.value;
  if (!metrics || metrics.length === 0) {
    return getEmptyChartOption('No hay datos de empleados disponibles');
  }

  const names = metrics.map(emp => emp.nombre);
  const operaciones = metrics.map(emp => emp.operaciones || 0);
  const eficiencia = metrics.map(emp => emp.eficiencia || 0);

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['Operaciones', 'Eficiencia (%)'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Operaciones',
        position: 'left'
      },
      {
        type: 'value',
        name: 'Eficiencia (%)',
        position: 'right',
        max: 100
      }
    ],
    series: [
      {
        name: 'Operaciones',
        type: 'bar',
        data: operaciones,
        itemStyle: {
          color: '#2196f3'
        },
        barWidth: '40%'
      },
      {
        name: 'Eficiencia (%)',
        type: 'line',
        yAxisIndex: 1,
        data: eficiencia,
        lineStyle: {
          color: '#4caf50',
          width: 3
        },
        itemStyle: {
          color: '#4caf50'
        },
        smooth: true
      }
    ]
  };
});

// Opciones para el gráfico de tiempo promedio por proceso
const processTimeOption = computed(() => {
  const trendData = trends.value;
  if (!trendData || !trendData.tiemposPorProceso) {
    return getEmptyChartOption('No hay datos de tiempos disponibles');
  }

  const data = trendData.tiemposPorProceso;
  const procesos = data.map(item => item.proceso);
  const tiempos = data.map(item => item.tiempo || 0);

  return {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const param = params[0];
        return `${param.name}<br/>Tiempo promedio: <strong>${param.value.toFixed(1)}h</strong>`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: procesos,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Tiempo (horas)',
      nameLocation: 'middle',
      nameGap: 40
    },
    series: [
      {
        type: 'bar',
        data: tiempos.map((tiempo, index) => ({
          value: tiempo,
          itemStyle: {
            color: getTimeColor(tiempo)
          }
        })),
        barWidth: '60%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };
});

// Funciones auxiliares
function getEmptyChartOption(message) {
  return {
    title: {
      text: message,
      left: 'center',
      top: 'middle',
      textStyle: {
        color: '#999',
        fontSize: 14
      }
    }
  };
}

function formatChartDate(dateString) {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  } catch (error) {
    return dateString;
  }
}

function getTimeColor(tiempo) {
  if (tiempo <= 2) return '#4caf50'; // Verde para tiempos buenos
  if (tiempo <= 3.5) return '#ff9800'; // Naranja para tiempos regulares
  return '#f44336'; // Rojo para tiempos altos
}

async function handlePeriodChange(newPeriod) {
  emit('period-change', newPeriod);
  
  // Mapear período a filtro de tiempo
  const filterMap = {
    '7d': 'week',
    '30d': 'month',
    '90d': 'quarter'
  };
  
  const timeFilter = filterMap[newPeriod] || 'week';
  await setTimeFilter(timeFilter);
  
  // Refrescar gráficos
  await refreshCharts();
}

async function refreshCharts() {
  try {
    await Promise.allSettled([
      refreshMetric('trends', true),
      refreshMetric('processDistribution', true),
      refreshMetric('employeeMetrics', true)
    ]);
    
    emit('chart-refresh');
    
    // Forzar re-render de los gráficos
    await nextTick();
    resizeCharts();
  } catch (error) {
    console.error('Error refreshing charts:', error);
  }
}

function resizeCharts() {
  const charts = [
    operationsTrendChart.value,
    processDistributionChart.value,
    employeeProductivityChart.value,
    processTimeChart.value
  ];
  
  charts.forEach(chart => {
    if (chart) {
      chart.resize();
    }
  });
}

// Watchers
watch(() => trends.value, () => {
  nextTick(() => resizeCharts());
}, { deep: true });

watch(() => processDistribution.value, () => {
  nextTick(() => resizeCharts());
}, { deep: true });

watch(() => employeeMetrics.value, () => {
  nextTick(() => resizeCharts());
}, { deep: true });

// Lifecycle
onMounted(async () => {
  // Cargar datos iniciales
  await refreshCharts();
  
  // Configurar resize listener
  window.addEventListener('resize', resizeCharts);
});

// Cleanup
onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts);
});

// Exponer métodos
defineExpose({
  refreshCharts,
  resizeCharts
});
</script>

<style scoped>
.trend-charts {
  width: 100%;
}

.chart-card {
  height: 100%;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
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
    min-width: 60px !important;
  }
  
  .chart-card .v-card-title {
    font-size: 1rem !important;
  }
}

/* Mejoras visuales para los gráficos */
:deep(.echarts) {
  border-radius: 8px;
}

/* Loading states */
.v-progress-circular {
  margin: 0 auto;
}
</style>