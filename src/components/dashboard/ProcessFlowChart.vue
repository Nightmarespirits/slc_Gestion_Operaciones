<template>
  <div class="process-flow-chart">
    <v-chart
      ref="chartRef"
      :option="chartOption"
      :style="{ height: '300px', width: '100%' }"
      autoresize
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { SankeyChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

// Registrar componentes de ECharts
use([
  CanvasRenderer,
  SankeyChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
]);

const props = defineProps({
  bottlenecks: {
    type: Array,
    default: () => []
  }
});

const chartRef = ref(null);

const chartOption = computed(() => {
  if (!props.bottlenecks || props.bottlenecks.length === 0) {
    return getEmptyChartOption();
  }

  // Crear datos para el diagrama de flujo
  const { nodes, links } = generateFlowData();

  return {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: function(params) {
        if (params.dataType === 'node') {
          const node = params.data;
          return `
            <div style="font-weight: bold; margin-bottom: 5px;">${node.name}</div>
            <div>Eficiencia: <strong>${node.efficiency || 'N/A'}%</strong></div>
            <div>Estado: <strong>${node.status || 'Normal'}</strong></div>
          `;
        } else if (params.dataType === 'edge') {
          const link = params.data;
          return `
            <div style="font-weight: bold; margin-bottom: 5px;">Flujo: ${link.source} → ${link.target}</div>
            <div>Volumen: <strong>${link.value}</strong></div>
          `;
        }
      }
    },
    series: [
      {
        type: 'sankey',
        data: nodes,
        links: links,
        emphasis: {
          focus: 'adjacency'
        },
        lineStyle: {
          color: 'gradient',
          curveness: 0.5
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#aaa'
        },
        label: {
          position: 'right',
          formatter: '{b}',
          fontSize: 12
        },
        levels: [
          {
            depth: 0,
            itemStyle: {
              color: '#1976d2'
            }
          },
          {
            depth: 1,
            itemStyle: {
              color: '#4caf50'
            }
          },
          {
            depth: 2,
            itemStyle: {
              color: '#ff9800'
            }
          },
          {
            depth: 3,
            itemStyle: {
              color: '#f44336'
            }
          }
        ]
      }
    ]
  };
});

function generateFlowData() {
  // Procesos típicos de lavandería
  const processes = ['Recepción', 'Lavado', 'Secado', 'Planchado', 'Doblado', 'Entrega'];
  
  // Crear nodos
  const nodes = processes.map((process, index) => {
    const bottleneck = props.bottlenecks.find(b => 
      b.proceso && b.proceso.toLowerCase().includes(process.toLowerCase())
    );
    
    let efficiency = 100;
    let status = 'Normal';
    let color = '#4caf50';
    
    if (bottleneck) {
      efficiency = bottleneck.eficiencia || 70;
      status = bottleneck.severidad === 'critical' ? 'Crítico' : 
               bottleneck.severidad === 'warning' ? 'Advertencia' : 'Normal';
      color = bottleneck.severidad === 'critical' ? '#f44336' :
              bottleneck.severidad === 'warning' ? '#ff9800' : '#4caf50';
    }
    
    return {
      name: process,
      efficiency,
      status,
      itemStyle: {
        color: color
      }
    };
  });
  
  // Crear enlaces entre procesos
  const links = [];
  for (let i = 0; i < processes.length - 1; i++) {
    const sourceBottleneck = props.bottlenecks.find(b => 
      b.proceso && b.proceso.toLowerCase().includes(processes[i].toLowerCase())
    );
    
    // El valor del enlace representa el flujo (menor si hay cuello de botella)
    let value = 100;
    if (sourceBottleneck) {
      value = sourceBottleneck.eficiencia || 70;
    }
    
    links.push({
      source: processes[i],
      target: processes[i + 1],
      value: value,
      lineStyle: {
        color: value < 70 ? '#f44336' : value < 85 ? '#ff9800' : '#4caf50',
        opacity: 0.6
      }
    });
  }
  
  return { nodes, links };
}

function getEmptyChartOption() {
  return {
    title: {
      text: 'No hay datos de flujo disponibles',
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
watch(() => props.bottlenecks, () => {
  nextTick(() => resize());
}, { deep: true });

// Exponer métodos
defineExpose({
  resize
});
</script>

<style scoped>
.process-flow-chart {
  width: 100%;
}

:deep(.echarts) {
  border-radius: 8px;
}
</style>