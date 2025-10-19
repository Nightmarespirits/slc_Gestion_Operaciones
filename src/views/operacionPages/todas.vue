<template>
    <div class="operaciones-todas">
        <div class="page-header">
            <h1 class="text-h4 font-weight-bold text-primary">Todas las Operaciones</h1>
            <v-chip
                v-if="operacionesStore.stats.total > 0"
                variant="outlined"
                color="primary"
                size="small"
            >
                {{ operacionesStore.stats.total }} operaciones
            </v-chip>
        </div>

        <v-container fluid>
            <!-- Alerta de notificación -->
            <v-alert
                v-model="alert"
                :text="alertMsg"
                type="success"
                closable
                variant="tonal"
                class="mb-4"
            />

            <!-- Alerta de operaciones urgentes -->
            <v-alert
                v-if="urgentCount > 0"
                type="warning"
                variant="tonal"
                class="mb-4"
                prominent
            >
                <template #title>
                    <v-icon class="mr-2">mdi-alert-circle</v-icon>
                    Operaciones Urgentes Detectadas
                </template>
                Hay {{ urgentCount }} operaciones que requieren atención inmediata por tiempo transcurrido.
                <template #append>
                    <v-btn
                        variant="outlined"
                        size="small"
                        @click="filterUrgentOperations"
                    >
                        Ver Urgentes
                    </v-btn>
                </template>
            </v-alert>

            <!-- Tabla Optimizada con Lazy Loading -->
            <LazyDataTable
                ref="dataTableRef"
                :fetch-function="fetchOperaciones"
                :headers="dataHeaders"
                :initial-limit="50"
                :load-more-limit="50"
                title="Operaciones"
                search-placeholder="Buscar por N° de Orden..."
                :search-debounce="300"
                :show-filters="true"
                :initial-filters="initialFilters"
                :table-height="600"
                :skeleton-rows="10"
                :sort-by="[{ key: 'fechas.fecCreacion', order: 'desc' }]"
                :enable-cache="true"
                cache-key="todas-operaciones"
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
                        <v-col cols="12" sm="6" md="2">
                            <v-select
                                :model-value="filters.priority"
                                :items="priorityOptions"
                                label="Prioridad"
                                variant="outlined"
                                density="compact"
                                clearable
                                hide-details
                                @update:model-value="updateFilter('priority', $event)"
                            >
                                <template #prepend-inner>
                                    <v-icon size="small">mdi-priority-high</v-icon>
                                </template>
                            </v-select>
                        </v-col>
                        <v-col cols="12" sm="6" md="2">
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
                        <v-col cols="12" sm="12" md="2">
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

                <!-- Template para los tickets -->
                <template #item.ordenes="{ item }">
                    <div class="ordenes-container">
                        <v-chip
                            v-for="ticket in item.ordenes.slice(0, 3)"
                            :key="ticket"
                            variant="flat"
                            class="ma-1"
                            size="small"
                            label
                            color="primary"
                        >
                            <template #prepend>
                                <v-icon size="small" class="pr-1">mdi-ticket</v-icon>
                            </template>
                            {{ ticket }}
                        </v-chip>
                        <v-chip
                            v-if="item.ordenes.length > 3"
                            variant="outlined"
                            class="ma-1"
                            size="small"
                            label
                            color="grey"
                        >
                            +{{ item.ordenes.length - 3 }} más
                        </v-chip>
                    </div>
                </template>

                <!-- Template para los procesos -->
                <template #item.procesos="{ item }">
                    <div class="procesos-container">
                        <v-chip
                            v-for="proceso in item.procesos.slice(0, 2)"
                            :key="proceso.id"
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
                                    Responsable: {{ proceso.responsable }}<br>
                                    Fecha: {{ proceso.fecha }}
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
                <template #item.inicio="{ item }">
                    <div class="fecha-container">
                        <span class="text-caption">
                            {{ formatDate(item.fechas.inicio) }}
                        </span>
                    </div>
                </template>
                
                <template #item.final="{ item }">
                    <div class="fecha-container">
                        <span class="text-caption">
                            {{ formatDate(item.fechas.final) }}
                        </span>
                    </div>
                </template>

                <!-- Template para tiempo transcurrido -->
                <template #item.timeElapsed="{ item }">
                    <div class="time-elapsed-container">
                        <v-chip
                            :color="getTimeElapsedColor(item.timeElapsed)"
                            size="small"
                            variant="flat"
                        >
                            <template #prepend>
                                <v-icon size="small" class="pr-1">mdi-clock-outline</v-icon>
                            </template>
                            {{ formatTimeElapsed(item.timeElapsed) }}
                        </v-chip>
                    </div>
                </template>

                <!-- Template para prioridad -->
                <template #item.priority="{ item }">
                    <div class="priority-container">
                        <v-chip
                            :color="getPriorityColor(item.priority)"
                            size="small"
                            variant="flat"
                        >
                            <template #prepend>
                                <v-icon size="small" class="pr-1">
                                    {{ getPriorityIcon(item.priority) }}
                                </v-icon>
                            </template>
                            {{ getPriorityText(item.priority) }}
                        </v-chip>
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
                            :loading="loadingDetails === item.id"
                            @click="showDetails(item)"
                        >
                            <v-icon>mdi-eye</v-icon>
                            <v-tooltip activator="parent" location="top">
                                Ver detalles
                            </v-tooltip>
                        </v-btn>
                        <v-btn
                            v-if="!item.estadoOperacion && item.priority !== 'urgent'"
                            icon
                            size="small"
                            color="warning"
                            variant="text"
                            @click="markAsUrgent(item)"
                        >
                            <v-icon>mdi-flag</v-icon>
                            <v-tooltip activator="parent" location="top">
                                Marcar como urgente
                            </v-tooltip>
                        </v-btn>
                        <v-btn
                            icon
                            size="small"
                            color="error"
                            variant="text"
                            @click="btnDeleteClicked(item)"
                        >
                            <v-icon>mdi-delete</v-icon>
                            <v-tooltip activator="parent" location="top">
                                Eliminar operación
                            </v-tooltip>
                        </v-btn>
                    </div>
                </template>

                <!-- Estado sin datos personalizado -->
                <template #no-data>
                    <div class="text-center pa-8">
                        <v-icon size="64" color="grey-lighten-1" class="mb-4">
                            mdi-clipboard-search-outline
                        </v-icon>
                        <div class="text-h6 text-grey-darken-1 mb-2">
                            No hay operaciones disponibles
                        </div>
                        <div class="text-body-2 text-grey">
                            Las operaciones aparecerán aquí cuando se creen o ajusta los filtros de búsqueda
                        </div>
                    </div>
                </template>

                <!-- Indicador de carga personalizado -->
                <template #loading-more>
                    <div class="text-center pa-4">
                        <v-progress-circular
                            indeterminate
                            color="primary"
                            size="24"
                            class="mr-2"
                        />
                        <span class="text-body-2">Cargando más operaciones...</span>
                    </div>
                </template>
            </LazyDataTable>

            <!-- Confirm Dialog COMPONENT -->
            <v-dialog
                v-model="confirmDialog"
                max-width="400"
                persistent
            >
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
                        Confirmar Eliminación
                    </v-card-title>
                    <v-card-subtitle>
                        Necesitará permisos de Administrador
                    </v-card-subtitle>
                    <v-card-text>
                        <p class="mb-4">¿Está seguro de que desea eliminar esta operación?</p>
                        <v-text-field
                            v-model="confirmPassword"
                            type="password"
                            label="Contraseña de administrador"
                            variant="outlined"
                            density="compact"
                            :error="passwordError"
                            :error-messages="passwordErrorMessage"
                            @keydown.enter="doDeleteItem"
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn
                            variant="text"
                            @click="cancelDelete"
                        >
                            Cancelar
                        </v-btn>
                        <v-btn
                            color="error"
                            variant="flat"
                            :loading="deletingItem"
                            @click="doDeleteItem"
                        >
                            Eliminar
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- Modal de detalles mejorado -->
            <OperacionDetailModal
                v-model="dialog"
                :operacion-id="selectedOperacionId"
                @operacion-updated="handleOperacionUpdated"
            />
        </v-container>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useOperacionesStore } from '../../store/operaciones'
import { useAuthStore } from '../../store/auth'
import LazyDataTable from '../../components/common/LazyDataTable.vue'
import SkeletonLoader from '../../components/common/SkeletonLoader.vue'
import OperacionDetailModal from '../../components/operaciones/OperacionDetailModal.vue'
import { dateTimeZConverter } from '../../utils/dateTimeZConverter'
import axios from 'axios'

// Stores
const operacionesStore = useOperacionesStore()
const authStore = useAuthStore()

// Referencias reactivas
const dataTableRef = ref(null)
const dialog = ref(false)
const alert = ref(false)
const alertMsg = ref('')
const selectedItem = ref(null)
const selectedOperacionId = ref(null)
const loadingDetails = ref(null)

// Estados del diálogo de confirmación
const confirmDialog = ref(false)
const confirmPassword = ref('')
const operacionID = ref('')
const deletingItem = ref(false)
const passwordError = ref(false)
const passwordErrorMessage = ref('')

// Configuración de filtros iniciales
const initialFilters = ref({
    estado: null, // null = todas, true = finalizadas, false = pendientes
    currentStage: null
})

// Estados adicionales para filtros
const dateRangeMenu = ref(false)
const dateRange = ref([])
const urgentCount = ref(0)

// Opciones para filtros
const estadoOptions = [
    { title: 'Todas', value: null },
    { title: 'Pendientes', value: false },
    { title: 'Finalizadas', value: true }
]

const priorityOptions = [
    { title: 'Todas las prioridades', value: null },
    { title: 'Normal', value: 'normal' },
    { title: 'Alta', value: 'high' },
    { title: 'Urgente', value: 'urgent' }
]

const stageOptions = computed(() => {
    const stages = new Set()
    operacionesStore.paginatedItems.forEach(item => {
        if (item.currentStage) {
            stages.add(item.currentStage)
        }
    })
    
    return [
        { title: 'Todas las etapas', value: null },
        ...Array.from(stages).map(stage => ({ title: stage, value: stage }))
    ]
})

const dateRangeText = computed(() => {
    if (!dateRange.value || dateRange.value.length === 0) return ''
    if (dateRange.value.length === 1) return formatDate(dateRange.value[0])
    return `${formatDate(dateRange.value[0])} - ${formatDate(dateRange.value[1])}`
})

// Headers de la tabla optimizados
const dataHeaders = [
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
        key: 'inicio',
        title: 'Fecha de Inicio',
        width: '12%',
        sortable: true
    },
    { 
        align: 'center',
        key: 'final',
        title: 'Fecha de Finalización',
        width: '12%',
        sortable: true
    },
    { 
        align: 'center',
        key: 'timeElapsed',
        title: 'Tiempo Transcurrido',
        width: '12%',
        sortable: true
    },
    { 
        align: 'center',
        key: 'priority',
        title: 'Prioridad',
        width: '10%',
        sortable: true
    },
    { 
        align: 'center',
        key: 'estadoOperacion',
        title: 'Estado',
        width: '10%',
        sortable: true
    },
    {
        align: 'center',
        key: 'actions',
        title: 'Acciones',
        width: '6%',
        sortable: false
    }
]

// Función de fetch para LazyDataTable
const fetchOperaciones = async (params) => {
    try {
        const { page, limit, search, sortBy, sortOrder, ...filters } = params
        
        // Construir filtros para el store
        const storeFilters = {
            search: search || '',
            ...filters
        }
        
        // Si es la primera página, usar fetchOperaciones, sino loadMore
        if (page === 1) {
            const result = await operacionesStore.fetchOperaciones({
                page,
                limit,
                filters: storeFilters,
                forceRefresh: false
            })
            
            // Enriquecer datos con prioridad y tiempo transcurrido
            const enrichedData = result.map(item => enrichOperacionData(item))
            
            // Calcular operaciones urgentes
            urgentCount.value = enrichedData.filter(item => item.priority === 'urgent').length
            
            return {
                data: enrichedData,
                total: operacionesStore.pagination.total,
                hasMore: operacionesStore.pagination.hasMore
            }
        } else {
            await operacionesStore.loadMore()
            const enrichedData = operacionesStore.paginatedItems.map(item => enrichOperacionData(item))
            
            return {
                data: enrichedData,
                total: operacionesStore.pagination.total,
                hasMore: operacionesStore.pagination.hasMore
            }
        }
    } catch (error) {
        console.error('Error fetching operaciones:', error)
        throw error
    }
}

// Función para enriquecer datos de operación con prioridad y tiempo
const enrichOperacionData = (operacion) => {
    const now = new Date()
    const createdAt = new Date(operacion.fechas.fecCreacion)
    const timeElapsed = now - createdAt
    
    // Calcular prioridad basada en tiempo transcurrido y estado
    let priority = 'normal'
    if (!operacion.estadoOperacion) { // Solo para pendientes
        const hoursElapsed = timeElapsed / (1000 * 60 * 60)
        if (hoursElapsed > 72) { // Más de 3 días
            priority = 'urgent'
        } else if (hoursElapsed > 24) { // Más de 1 día
            priority = 'high'
        }
    }
    
    return {
        ...operacion,
        timeElapsed,
        priority,
        // Agregar métricas adicionales para finalizadas
        completionTime: operacion.estadoOperacion && operacion.fechas.final 
            ? new Date(operacion.fechas.final) - createdAt 
            : null
    }
}

// Funciones auxiliares para el manejo de procesos
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

// Funciones auxiliares para prioridad
const getPriorityColor = (priority) => {
    const colores = {
        'normal': 'grey',
        'high': 'orange',
        'urgent': 'red'
    }
    return colores[priority] || 'grey'
}

const getPriorityIcon = (priority) => {
    const iconos = {
        'normal': 'mdi-minus',
        'high': 'mdi-arrow-up',
        'urgent': 'mdi-alert'
    }
    return iconos[priority] || 'mdi-minus'
}

const getPriorityText = (priority) => {
    const textos = {
        'normal': 'Normal',
        'high': 'Alta',
        'urgent': 'Urgente'
    }
    return textos[priority] || 'Normal'
}

// Funciones auxiliares para tiempo transcurrido
const getTimeElapsedColor = (timeElapsed) => {
    const hours = timeElapsed / (1000 * 60 * 60)
    if (hours > 72) return 'error'
    if (hours > 24) return 'warning'
    return 'success'
}

const formatTimeElapsed = (timeElapsed) => {
    const hours = Math.floor(timeElapsed / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
        return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
        return `${hours}h`
    } else {
        const minutes = Math.floor(timeElapsed / (1000 * 60))
        return `${minutes}m`
    }
}

// Función para formatear fechas
const formatDate = (dateString) => {
    if (!dateString) return '---'
    
    try {
        const converted = dateTimeZConverter(dateString)
        if (converted) return converted
        
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '---'
        
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (error) {
        console.error('Error formatting date:', error)
        return '---'
    }
}

// Handlers de eventos
const handleSearchChange = (searchTerm) => {
    // El LazyDataTable ya maneja el debounce
    console.log('Search changed:', searchTerm)
}

const handleFilterChange = (filters) => {
    console.log('Filters changed:', filters)
}

const handleSortChange = (sortInfo) => {
    console.log('Sort changed:', sortInfo)
}

const clearAllFilters = async () => {
    dateRange.value = []
    if (dataTableRef.value) {
        await dataTableRef.value.reset()
        await operacionesStore.clearFilters()
    }
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

// Función para marcar como urgente
const markAsUrgent = async (item) => {
    try {
        // Aquí podrías implementar la lógica para marcar como urgente
        // Por ejemplo, actualizar en el backend o en el store
        activeAlert(`Operación ${item.id} marcada como urgente`)
        
        // Refrescar la tabla
        if (dataTableRef.value) {
            await dataTableRef.value.refresh()
        }
    } catch (error) {
        console.error('Error marking as urgent:', error)
        activeAlert('Error al marcar como urgente')
    }
}

// Función para filtrar operaciones urgentes
const filterUrgentOperations = () => {
    if (dataTableRef.value) {
        dataTableRef.value.updateFilter('priority', 'urgent')
        dataTableRef.value.updateFilter('estado', false) // Solo pendientes
    }
}

// Función para mostrar detalles
const showDetails = async (item) => {
    try {
        loadingDetails.value = item.id
        selectedOperacionId.value = item.id
        dialog.value = true
    } catch (error) {
        console.error('Error loading details:', error)
        activeAlert('Error al cargar los detalles de la operación')
    } finally {
        loadingDetails.value = null
    }
}

// Manejar actualizaciones de operación desde el modal
const handleOperacionUpdated = (operacionData) => {
    // Actualizar la operación en el store
    operacionesStore.updateOperacion(operacionData.id, operacionData)
    
    // Mostrar mensaje de éxito
    activeAlert('Operación actualizada correctamente')
    
    // Refrescar la tabla si es necesario
    if (dataTableRef.value) {
        dataTableRef.value.refresh()
    }
}

// Funciones de eliminación
const btnDeleteClicked = (item) => {
    operacionID.value = item.id
    confirmDialog.value = true
    passwordError.value = false
    passwordErrorMessage.value = ''
}

const cancelDelete = () => {
    confirmDialog.value = false
    confirmPassword.value = ''
    operacionID.value = ''
    passwordError.value = false
    passwordErrorMessage.value = ''
}

const doDeleteItem = async () => {
    if (!confirmPassword.value.trim()) {
        passwordError.value = true
        passwordErrorMessage.value = 'La contraseña es requerida'
        return
    }
    
    try {
        deletingItem.value = true
        passwordError.value = false
        passwordErrorMessage.value = ''
        
        // Verificar contraseña
        const isValidPassword = await authStore.comparePassword(confirmPassword.value)
        
        if (!isValidPassword) {
            passwordError.value = true
            passwordErrorMessage.value = 'Contraseña incorrecta'
            return
        }
        
        // Eliminar operación
        const response = await axios.delete(
            `${import.meta.env.VITE_API_URL}/operacion/${operacionID.value}`
        )
        
        // Actualizar store
        operacionesStore.removeOperacion(operacionID.value)
        
        // Refrescar tabla
        if (dataTableRef.value) {
            await dataTableRef.value.refresh()
        }
        
        // Cerrar diálogo y mostrar mensaje
        confirmDialog.value = false
        activeAlert(response.data.message || 'Operación eliminada correctamente')
        
        // Limpiar estado
        confirmPassword.value = ''
        operacionID.value = ''
        
    } catch (error) {
        console.error('Error al eliminar operación:', error)
        passwordError.value = true
        passwordErrorMessage.value = 'Error al eliminar la operación'
    } finally {
        deletingItem.value = false
    }
}

// Función para mostrar alertas
const activeAlert = (msg) => {
    alertMsg.value = msg
    alert.value = true
    setTimeout(() => {
        alert.value = false
    }, 5000)
}

// Mantener posición de scroll durante navegación
let scrollPosition = 0

const saveScrollPosition = () => {
    const tableContainer = document.querySelector('.lazy-data-table__table .v-data-table-virtual__wrapper')
    if (tableContainer) {
        scrollPosition = tableContainer.scrollTop
    }
}

const restoreScrollPosition = async () => {
    await nextTick()
    const tableContainer = document.querySelector('.lazy-data-table__table .v-data-table-virtual__wrapper')
    if (tableContainer && scrollPosition > 0) {
        tableContainer.scrollTop = scrollPosition
    }
}

// Lifecycle hooks
onMounted(async () => {
    // Restaurar posición de scroll si existe
    await restoreScrollPosition()
})

onUnmounted(() => {
    // Guardar posición de scroll
    saveScrollPosition()
})

// Exponer métodos para debugging
defineExpose({
    refresh: () => dataTableRef.value?.refresh(),
    reset: () => dataTableRef.value?.reset(),
    store: operacionesStore
})
</script>

<style scoped>
.operaciones-todas {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 1);
}

.page-header h1 {
  margin: 0;
  flex-grow: 1;
}

/* Contenedores de celdas optimizados */
.ordenes-container,
.procesos-container,
.fecha-container,
.estado-container,
.actions-container,
.time-elapsed-container,
.priority-container {
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

.time-elapsed-container,
.priority-container {
  justify-content: center;
}

.priority-container .v-chip {
  font-weight: 600;
}

/* Optimizaciones de rendimiento */
.lazy-data-table :deep(.v-data-table-virtual__wrapper) {
  /* Optimizar scrolling */
  will-change: transform;
  contain: layout style paint;
}

.lazy-data-table :deep(.v-data-table__tr) {
  /* Optimizar rendering de filas */
  contain: layout style;
}

/* Transiciones suaves */
.lazy-data-table :deep(.v-chip) {
  transition: all 0.2s ease;
}

.lazy-data-table :deep(.v-btn) {
  transition: all 0.2s ease;
}

/* Estados de hover mejorados */
.lazy-data-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Skeleton loader personalizado */
.lazy-data-table :deep(.v-skeleton-loader) {
  background: transparent;
}

.lazy-data-table :deep(.v-skeleton-loader__bone) {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

/* Responsive design */
@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .ordenes-container,
  .procesos-container {
    max-width: none;
  }
  
  .actions-container {
    flex-direction: column;
    gap: 4px;
  }
}

@media (max-width: 600px) {
  .page-header {
    padding: 12px 16px;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
}

/* Mejoras de accesibilidad */
.lazy-data-table :deep(.v-btn:focus-visible) {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.lazy-data-table :deep(.v-chip:focus-visible) {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

/* Indicadores de carga */
.lazy-data-table :deep(.v-progress-linear) {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* Optimización de memoria para listas grandes */
.lazy-data-table :deep(.v-virtual-scroll__item) {
  contain: layout style paint;
}

/* Estados de error */
.lazy-data-table :deep(.v-alert) {
  margin: 16px;
}

/* Personalización del diálogo de detalles */
.v-dialog :deep(.v-card-title.bg-primary) {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* Animaciones de entrada */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.operaciones-todas {
  animation: fadeInUp 0.3s ease-out;
}

/* Optimización para modo oscuro */
@media (prefers-color-scheme: dark) {
  .page-header {
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }
  
  .lazy-data-table :deep(.v-data-table__tr:hover) {
    background-color: rgba(255, 255, 255, 0.04);
  }
}

/* Print styles */
@media print {
  .actions-container,
  .page-header .v-chip {
    display: none;
  }
  
  .lazy-data-table :deep(.v-data-table) {
    box-shadow: none;
  }
}
</style>