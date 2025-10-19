<template>
  <div class="process-progress-chart">
    <v-chart
      ref="chartRef"
      :option="chartOption"
      :style="{ height: height, width: '100%' }"
      autoresize
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

// Registrar componentes de ECharts
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  type: {
    type: String,
    default: 'bar', // 'bar', 'line', 'mixed'
    validator: (value) => ['bar', 'line', 'mixed'].includes(value)
  },
  height: {
    type: String,
    default: '200px'
  },
  title: {
    type: String,
    default: ''
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  colors: {
    type: Array,
    default: () => ['#1976d2', '#4caf50', '#ff9800', '#f44336', '#9c27b0']
  }
});

const chartRef = ref(null);

const chartOption = computed(() => {
  if (!props.data || props.data.length === 0) {
    return getEmptyChartOption();
  }

  const baseOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let result = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].axisValue}</div>`;
        params.forEach(param => {
          const value = typeof param.value === 'number' ? 
            param.value.toFixed(1) : param.value;
          result += `<div style="display: flex; align-items: center; margin: 2px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
            ${param.seriesName}: <strong>${value}</strong>
          </div>`;
        });
        return result;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: props.title ? '15%' : '10%',
      containLabel: true
    }
  };

  if (props.title) {
    baseOption.title = {
      text: props.title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold'
      }
    };
  }

  if (props.showLegend) {
    baseOption.legend = {
      top: props.title ? 35 : 10,
      left: 'center'
    };
  }

  // Configurar según el tipo de gráfico
  switch (props.type) {
    case 'bar':
      return { ...baseOption, ...getBarChartConfig() };
    case 'line':
      return { ...baseOption, ...getLineChartConfig() };
    case 'mixed':
      return { ...baseOption, ...getMixedChartConfig() };
    default:
      return { ...baseOption, ...getBarChartConfig() };
  }
});

function getBarChartConfig() {
  const categories = props.data.map(item => item.name || item.label);
  const values = props.data.map(item => item.value || item.count || 0);

  return {
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: categories.some(cat => cat.length > 8) ? 45 : 0,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: 'Cantidad',
      nameLocation: 'middle',
      nameGap: 30
    },
    series: [
      {
        type: 'bar',
        data: values.map((value, index) => ({
          value,
          itemStyle: {
            color: props.colors[index % props.colors.length],
            borderRadius: [4, 4, 0, 0]
          }
        })),
        barWidth: '60%',
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.3)'
          }
        }
      }
    ]
  };
}

function getLineChartConfig() {
  const categories = props.data.map(item => item.name || item.label);
  const values = props.data.map(item => item.value || item.count || 0);

  return {
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: 'Valor',
      nameLocation: 'middle',
      nameGap: 30
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        lineStyle: {
          color: props.colors[0],
          width: 3
        },
        itemStyle: {
          color: props.colors[0]
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${props.colors[0]}40` },
              { offset: 1, color: `${props.colors[0]}10` }
            ]
          }
        }
      }
    ]
  };
}

function getMixedChartConfig() {
  // Para gráficos mixtos, esperamos datos con estructura específica
  const categories = props.data.map(item => item.name || item.label);
  const barData = props.data.map(item => item.bar || item.count || 0);
  const lineData = props.data.map(item => item.line || item.percentage || 0);

  return {
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: [
      {
        type: 'value',
        name: 'Cantidad',
        position: 'left'
      },
      {
        type: 'value',
        name: 'Porcentaje',
        position: 'right',
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: 'Cantidad',
        type: 'bar',
        data: barData,
        itemStyle: {
          color: props.colors[0]
        },
        barWidth: '50%'
      },
      {
        name: 'Porcentaje',
        type: 'line',
        yAxisIndex: 1,
        data: lineData,
        lineStyle: {
          color: props.colors[1],
          width: 3
        },
        itemStyle: {
          color: props.colors[1]
        },
        smooth: true
      }
    ]
  };
}

function getEmptyChartOption() {
  return {
    title: {
      text: 'No hay datos disponibles',
      left: 'center',
      top: 'middle',
      textStyle: {
        color: '#999',
        fontSize: 14
      }
    }
  };
}

function resize() {
  if (chartRef.value) {
    chartRef.value.resize();
  }
}

// Watchers
watch(() => props.data, () => {
  nextTick(() => resize());
}, { deep: true });

// Exponer métodos
defineExpose({
  resize
});
</script>

<style scoped>
.process-progress-chart {
  width: 100%;
}

:deep(.echarts) {
  border-radius: 8px;
}
</style>