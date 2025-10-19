<template>
  <div class="process-progress-chart">
    <!-- Chart Container -->
    <div 
      ref="chartContainer" 
      :style="{ height: `${height}px` }"
      class="chart-container"
    />
    
    <!-- Loading Overlay -->
    <div v-if="loading" class="chart-loading">
      <v-progress-circular indeterminate color="primary" />
      <div class="text-body-2 mt-2">Cargando gráfico...</div>
    </div>
    
    <!-- Error State -->
    <div v-if="error" class="chart-error text-center pa-4">
      <v-icon size="48" color="error" class="mb-2">mdi-chart-line-variant</v-icon>
      <div class="text-body-2 text-error">Error al cargar el gráfico</div>
      <v-btn size="small" variant="outlined" color="error" class="mt-2" @click="initChart">
        Reintentar
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

// Props
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  height: {
    type: Number,
    default: 400
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['chart-click', 'chart-ready'])

// Reactive state
const chartContainer = ref(null)
const chartInstance = ref(null)
const error = ref(false)

// Chart configuration
const getChartOption = () => {
  if (!props.data || props.data.length === 0) {
    return getEmptyChartOption()
  }

  return {
    title: {
      text: 'Progreso por Proceso',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976d2'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const data = params.data
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
            <div>Progreso: <strong>${data.value}%</strong></div>
            <div>Responsable: <strong>${data.responsable || 'No asignado'}</strong></div>
            <div>Fecha: <strong>${formatDate(data.fecha)}</strong></div>
          </div>
        `
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      data: props.data.map(item => item.name),
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: 'Progreso',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{c}%',
          fontSize: 11,
          fontWeight: 'bold'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10
        },
        data: props.data.filter(item => item && item.name).map(item => ({
          name: item.name || 'Sin nombre',
          value: typeof item.value === 'number' ? item.value : 0,
          itemStyle: {
            color: item.color || getDefaultColor(item.name || 'default')
          },
          responsable: item.responsable || 'No asignado',
          fecha: item.fecha || new Date().toISOString()
        }))
      }
    ],
    graphic: props.data.length > 0 ? [] : [
      {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: 'No hay datos disponibles',
          fontSize: 16,
          fill: '#999'
        }
      }
    ]
  }
}

const getEmptyChartOption = () => ({
  title: {
    text: 'Progreso por Proceso',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1976d2'
    }
  },
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: 'No hay datos disponibles',
        fontSize: 16,
        fill: '#999'
      }
    }
  ]
})

const getDefaultColor = (processName) => {
  const colors = {
    'Lavado': '#2196F3',
    'Secado': '#FF9800',
    'Planchado': '#4CAF50',
    'Doblado': '#9C27B0',
    'Teñido': '#F44336'
  }
  return colors[processName] || '#757575'
}

const formatDate = (date) => {
  if (!date) return 'No definida'
  
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Chart methods
const initChart = async () => {
  if (!chartContainer.value) return
  
  try {
    error.value = false
    
    // Dispose existing chart
    if (chartInstance.value) {
      chartInstance.value.dispose()
    }
    
    // Create new chart instance
    chartInstance.value = echarts.init(chartContainer.value, null, {
      renderer: 'canvas',
      useDirtyRect: false
    })
    
    // Set chart option
    const option = getChartOption()
    chartInstance.value.setOption(option, true)
    
    // Add click event listener
    chartInstance.value.on('click', (params) => {
      emit('chart-click', {
        name: params.name,
        value: params.value,
        data: params.data
      })
    })
    
    // Add resize listener
    window.addEventListener('resize', handleResize)
    
    emit('chart-ready', chartInstance.value)
    
  } catch (err) {
    console.error('Error initializing chart:', err)
    error.value = true
  }
}

const updateChart = () => {
  if (!chartInstance.value) return
  
  try {
    const option = getChartOption()
    chartInstance.value.setOption(option, true)
  } catch (err) {
    console.error('Error updating chart:', err)
    error.value = true
  }
}

const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

const disposeChart = () => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  window.removeEventListener('resize', handleResize)
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  initChart()
})

onUnmounted(() => {
  disposeChart()
})

// Watchers
watch(() => props.data, () => {
  if (chartInstance.value) {
    updateChart()
  }
}, { deep: true })

watch(() => props.height, () => {
  if (chartInstance.value) {
    nextTick(() => {
      chartInstance.value.resize()
    })
  }
})
</script>

<style scoped>
.process-progress-chart {
  position: relative;
  width: 100%;
}

.chart-container {
  width: 100%;
  min-height: 300px;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.chart-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .chart-container {
    min-height: 250px;
  }
}
</style>