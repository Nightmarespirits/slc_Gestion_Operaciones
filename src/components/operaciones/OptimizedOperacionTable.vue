<template>
  <div class="optimized-operacion-table">
    <!-- Tabla con LazyDataTable -->
    <LazyDataTable
      ref="dataTableRef"
      :fetch-function="fetchOperaciones"
      :headers="headers"
      :initial-limit="50"
      :load-more-limit="50"
      :title="title"
      search-placeholder="Buscar por N° de Orden..."
      :search-debounce="300"
      :show-filters="true"
      :initial-filters="initialFilters"
      :table-height="600"
      :skeleton-rows="10"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      :enable-cache="true"
      cache-key="operaciones-table"
      :enable-infinite-scroll="true"
      no-data-text="No hay operaciones disponibles"
      no-data-subtext="Las operaciones aparecerán aquí cuando se creen"
      @search-change="handleSearchChange"
      @filter-change="handleFilterChange"
      @sort-change="handleSortChange"
    >
      <!-- Filtros personalizados -->
      <template #filters="{ filters, updateFilter }">
        <v-row align="center" dense>
          <v-col cols="12" sm="6" md="3">
            <v-select
              :model-value="filters.estado"
              :items="estadoOptions"
              label="Estado"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @update:model-value="updateFilter('estado', $event)"
            >
              <template #prepend-inner>
                <v-icon size="small">mdi-filter-variant</v-icon>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              :model-value="filters.currentStage"
              :items="stageOptions"
              label="Etapa Actual"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @update:model-value="updateFilter('currentStage', $event)"
            >
              <template #prepend-inner>
                <v-icon size="small">mdi-progress-clock</v-icon>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-menu
              v-model="dateRangeMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template #activator="{ props }">
                <v-text-field
                  :model-value="dateRangeText"
                  label="Rango de Fechas"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="compact"
                  readonly
                  clearable
                  hide-details
                  v-bind="props"
                  @click:clear="clearDateRange"
                />
              </template>
              <v-date-picker
                v-model="dateRange"
                range
                @update:model-value="updateDateRange"
              />
            </v-menu>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              variant="outlined"
              color="secondary"
              size="small"
              @click="clearAllFilters"
            >
              <v-icon start>mdi-filter-remove</v-icon>
              Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </template>

      <!-- Template para los números de orden -->
      <template #item.ordenes="{ item }">
        <div class="ordenes-container">
          <v-chip
            v-for="orden in getOrderNumbers(item).slice(0, 3)"
            :key="orden"
            variant="flat"
            class="ma-1"
            size="small"
            label
            color="primary"
          >
            <template #prepend>
              <v-icon size="small" class="pr-1">mdi-ticket</v-icon>
            </template>
            {{ orden }}
          </v-chip>
          <v-chip
            v-if="getOrderNumbers(item).length > 3"
            variant="outlined"
            class="ma-1"
            size="small"
            label
            color="grey"
          >
            +{{ getOrderNumbers(item).length - 3 }} más
          </v-chip>
        </div>
      </template>

      <!-- Template para los procesos -->
      <template #item.procesos="{ item }">
        <div class="procesos-container">
          <v-chip
            v-for="proceso in item.procesos.slice(0, 2)"
            :key="proceso._id"
            variant="outlined"
            class="ma-1"
            size="small"
            label
            :color="getProcesoColor(proceso.tipo)"
          >
            <template #prepend>
              <v-icon size="small" class="pr-1">{{ getProcesoIcon(proceso.tipo) }}</v-icon>
            </template>
            {{ proceso.tipo }}
            <v-tooltip activator="parent" location="top">
              <div>
                <strong>{{ proceso.tipo }}</strong><br>
                Responsable: {{ getResponsableName(proceso.responsable) }}<br>
                Sede: {{ getSedeName(proceso.sede) }}<br>
                Fecha: {{ formatDate(proceso.createdAt) }}
              </div>
            </v-tooltip>
          </v-chip>
          <v-chip
            v-if="item.procesos.length > 2"
            variant="text"
            class="ma-1"
            size="small"
            label
            color="grey"
          >
            +{{ item.procesos.length - 2 }}
          </v-chip>
        </div>
      </template>

      <!-- Template para las fechas -->
      <template #item.fecInicio="{ item }">
        <div class="fecha-container">
          <span class="text-caption">
            {{ formatDate(item.fecInicio) }}
          </span>
        </div>
      </template>
      
      <template #item.fecFinal="{ item }">
        <div class="fecha-container">
          <span class="text-caption">
            {{ formatDate(item.fecFinal) }}
          </span>
        </div>
      </template>

      <!-- Template para el estado -->
      <template #item.estadoOperacion="{ item }">
        <div class="estado-container">
          <v-chip
            :color="item.estadoOperacion ? 'success' : 'warning'"
            :text="item.estadoOperacion ? 'Finalizado' : 'Pendiente'"
            class="text-uppercase"
            size="small"
            label
          >
            <template #prepend>
              <v-icon size="small" class="pr-1">
                {{ item.estadoOperacion ? 'mdi-check-circle' : 'mdi-clock-outline' }}
              </v-icon>
            </template>
          </v-chip>
          <div class="text-caption mt-1 text-grey-darken-1">
            Etapa: {{ item.currentStage || 'No definida' }}
          </div>
        </div>
      </template>

      <!-- Template para acciones -->
      <template #item.actions="{ item }">
        <div class="actions-container">
          <v-btn
            icon
            size="small"
            color="primary"
            variant="text"
            @click="$emit('onFullscreenItem', item)"
          >
            <v-icon>mdi-eye</v-icon>
            <v-tooltip activator="parent" location="top">
              Ver detalles
            </v-tooltip>
          </v-btn>
          <v-btn
            icon
            size="small"
            color="warning"
            variant="text"
            @click="$emit('onEditItem', item)"
          >
            <v-icon>mdi-pencil</v-icon>
            <v-tooltip activator="parent" location="top">
              Editar operación
            </v-tooltip>
          </v-btn>
          <v-btn
            icon
            size="small"
            color="error"
            variant="text"
            @click="$emit('onDeleteItem', item)"
          >
            <v-icon>mdi-delete</v-icon>
            <v-tooltip activator="parent" location="top">
              Eliminar operación
            </v-tooltip>
          </v-btn>
        </div>
      </template>
    </LazyDataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOperacionesStore } from '../../store/operaciones'
import LazyDataTable from '../common/LazyDataTable.vue'
import { dateTimeZConverter } from '../../utils/dateTimeZConverter'

const props = defineProps({
  title: {
    type: String,
    default: 'Operaciones'
  }
})

const emit = defineEmits(['onFullscreenItem', 'onEditItem', 'onDeleteItem'])

// Store
const operacionesStore = useOperacionesStore()

// Referencias reactivas
const dataTableRef = ref(null)
const dateRangeMenu = ref(false)
const dateRange = ref([])

// Configuración de filtros iniciales
const initialFilters = ref({
  estado: null,
  currentStage: null,
  dateRange: null
})

// Headers de la tabla
const headers = [
  { 
    align: 'start',
    key: 'ordenes',
    title: 'N° Orden',
    width: '18%',
    sortable: false
  },
  { 
    align: 'center',
    key: 'procesos',
    title: 'Procesos',
    width: '20%',
    sortable: false
  },
  { 
    align: 'center',
    key: 'fecInicio',
    title: 'Fecha de Inicio',
    width: '15%',
    sortable: true
  },
  { 
    align: 'center',
    key: 'fecFinal',
    title: 'Fecha de Finalización',
    width: '15%',
    sortable: true
  },
  { 
    align: 'center',
    key: 'estadoOperacion',
    title: 'Estado',
    width: '15%',
    sortable: true
  },
  {
    align: 'center',
    key: 'actions',
    title: 'Acciones',
    width: '17%',
    sortable: false
  }
]

// Opciones para filtros
const estadoOptions = [
  { title: 'Todas', value: null },
  { title: 'Pendientes', value: false },
  { title: 'Finalizadas', value: true }
]

const stageOptions = [
  { title: 'Todas las etapas', value: null },
  { title: 'Lavado', value: 'lavado' },
  { title: 'Secado', value: 'secado' },
  { title: 'Doblado', value: 'doblado' },
  { title: 'Planchado', value: 'planchado' },
  { title: 'CC', value: 'cc' },
  { title: 'Teñido', value: 'tenido' },
  { title: 'Finalizado', value: 'finalizado' }
]

// Computed para el texto del rango de fechas
const dateRangeText = computed(() => {
  if (!dateRange.value || dateRange.value.length === 0) return ''
  if (dateRange.value.length === 1) return formatDate(dateRange.value[0])
  return `${formatDate(dateRange.value[0])} - ${formatDate(dateRange.value[1])}`
})

// Función de fetch para LazyDataTable
const fetchOperaciones = async (params) => {
  try {
    const { page = 1, limit = 50, search = '', sortBy = 'createdAt', sortOrder = 'desc', ...filters } = params
    
    console.log('OptimizedOperacionTable fetchOperaciones params:', { page, limit, search, sortBy, sortOrder, filters })
    
    // Usar el store para obtener las operaciones
    const result = await operacionesStore.fetchOperaciones({
      page,
      limit,
      filters: {
        search: search.trim(),
        ...filters
      }
    })
    
    console.log('Store result:', result)
    console.log('Store pagination:', operacionesStore.pagination)
    
    return {
      data: result || [],
      total: operacionesStore.pagination.total || 0,
      hasMore: operacionesStore.pagination.hasMore || false
    }
  } catch (error) {
    console.error('Error fetching operaciones:', error)
    return {
      data: [],
      total: 0,
      hasMore: false
    }
  }
}

// Funciones auxiliares
const getOrderNumbers = (operacion) => {
  if (!operacion.procesos || !Array.isArray(operacion.procesos)) return []
  
  const ordenes = new Set()
  operacion.procesos.forEach(proceso => {
    if (proceso.detalles && Array.isArray(proceso.detalles)) {
      proceso.detalles.forEach(detalle => {
        if (detalle.numOrden) {
          ordenes.add(detalle.numOrden)
        }
      })
    }
  })
  
  return Array.from(ordenes)
}

const getProcesoColor = (tipo) => {
  const colores = {
    'lavado': 'blue',
    'secado': 'orange',
    'doblado': 'green',
    'planchado': 'purple',
    'cc': 'red',
    'tenido': 'brown'
  }
  return colores[tipo] || 'grey'
}

const getProcesoIcon = (tipo) => {
  const iconos = {
    'lavado': 'mdi-washing-machine',
    'secado': 'mdi-tumble-dryer',
    'doblado': 'mdi-format-columns',
    'planchado': 'mdi-iron',
    'cc': 'mdi-check-decagram',
    'tenido': 'mdi-water'
  }
  return iconos[tipo] || 'mdi-cog'
}

const getResponsableName = (responsable) => {
  if (!responsable) return 'Sin asignar'
  if (typeof responsable === 'string') return responsable
  return `${responsable.nombres || ''} ${responsable.apellidos || ''}`.trim() || 'Sin nombre'
}

const getSedeName = (sede) => {
  if (!sede) return 'Sin sede'
  if (typeof sede === 'string') return sede
  return sede.nombre || 'Sin nombre'
}

const formatDate = (dateString) => {
  if (!dateString || dateString === 'Por Finalizar' || dateString === 'Pendiente') {
    return dateString || '---'
  }
  
  try {
    const converted = dateTimeZConverter(dateString)
    if (converted) return converted
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString || '---'
  }
}

// Handlers de eventos
const handleSearchChange = (searchTerm) => {
  console.log('Search changed:', searchTerm)
}

const handleFilterChange = (filters) => {
  console.log('Filters changed:', filters)
}

const handleSortChange = (sortInfo) => {
  console.log('Sort changed:', sortInfo)
}

// Funciones para manejar filtros de fecha
const updateDateRange = (newRange) => {
  dateRange.value = newRange
  dateRangeMenu.value = false
  
  if (dataTableRef.value) {
    dataTableRef.value.updateFilter('dateRange', newRange)
  }
}

const clearDateRange = () => {
  dateRange.value = []
  if (dataTableRef.value) {
    dataTableRef.value.updateFilter('dateRange', null)
  }
}

const clearAllFilters = async () => {
  dateRange.value = []
  if (dataTableRef.value) {
    await dataTableRef.value.reset()
    await operacionesStore.clearFilters()
  }
}

// Exponer métodos para el componente padre
defineExpose({
  refresh: () => dataTableRef.value?.refresh(),
  reset: () => dataTableRef.value?.reset()
})

// Lifecycle
onMounted(() => {
  console.log('OptimizedOperacionTable mounted')
})
</script>

<style scoped>
.optimized-operacion-table {
  width: 100%;
}

/* Contenedores de celdas */
.ordenes-container,
.procesos-container,
.fecha-container,
.estado-container,
.actions-container {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 40px;
}

.ordenes-container {
  flex-wrap: wrap;
  max-width: 200px;
}

.procesos-container {
  flex-wrap: wrap;
  max-width: 250px;
}

.estado-container {
  flex-direction: column;
  align-items: flex-start;
}

.actions-container {
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

/* Transiciones suaves */
.optimized-operacion-table :deep(.v-chip) {
  transition: all 0.2s ease;
}

.optimized-operacion-table :deep(.v-btn) {
  transition: all 0.2s ease;
}

/* Estados de hover */
.optimized-operacion-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Responsive design */
@media (max-width: 960px) {
  .ordenes-container,
  .procesos-container {
    max-width: none;
  }
  
  .actions-container {
    flex-direction: column;
    gap: 4px;
  }
}
</style>