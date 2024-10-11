<template>
    <v-container>
      <h1 class="text-h4 mb-5">Dashboard</h1>
      
      <v-row>
        <!-- Tarjetas de estadísticas -->
        <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="text-overline mb-1">
                {{ stat.title }}
              </div>
              <div class="text-h4 mb-1">
                {{ stat.value }}
              </div>
              <div class="text-caption font-weight-bold text-success">
                <v-icon icon="mdi-arrow-up-bold" size="small"></v-icon>
                {{ stat.change }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
  
      <v-row class="mt-6">
        <!-- Gráfico -->
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>Ventas Mensuales</v-card-title>
            <v-card-text>
              <v-chart class="chart" :option="chartOption" />
            </v-card-text>
          </v-card>
        </v-col>
  
        <!-- Lista de actividades recientes -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Actividades Recientes</v-card-title>
            <v-list>
              <v-list-item v-for="activity in recentActivities" :key="activity.id">
                <v-list-item-title>{{ activity.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ activity.time }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { use } from "echarts/core"
  
  import { CanvasRenderer } from "echarts/renderers"
  import { LineChart } from "echarts/charts"
  import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components"
  import VChart, { THEME_KEY } from "vue-echarts"
  import { provide } from 'vue'
  
  use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])
  
  provide(THEME_KEY, "light")
  
  const stats = ref([
    { title: 'Usuarios Totales', value: '1,284', change: '12%' },
    { title: 'Ventas Mensuales', value: '$34,543', change: '23%' },
    { title: 'Tareas Completadas', value: '815', change: '18%' },
    { title: 'Tickets Pendientes', value: '24', change: '-8%' },
  ])
  
  const chartOption = ref({
    xAxis: {
      type: 'category',
      data: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330, 1320, 1450, 1500, 1600, 1700, 1800],
      type: 'line',
      smooth: true
    }],
    tooltip: {
      trigger: 'axis'
    }
  })
  
  const recentActivities = ref([
    { id: 1, title: 'Nuevo usuario registrado', time: 'Hace 5 minutos' },
    { id: 2, title: 'Tarea #45 completada', time: 'Hace 20 minutos' },
    { id: 3, title: 'Actualización del sistema', time: 'Hace 1 hora' },
    { id: 4, title: 'Nuevo pedido recibido', time: 'Hace 2 horas' },
  ])
  </script>
  
  <style scoped>
  .chart {
    height: 300px;
  }
  </style>