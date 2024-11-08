<template>
    <v-container>
        <!-- Alerta de notificación -->
        <v-alert
            v-model="alert"
            :text="alertMsg"
            type="success"
            closable
            variant="tonal"
        ></v-alert>

        <!-- Tabla de Operaciones -->
        <v-data-table
            :headers="dataHeaders"
            :items="formattedData"
            :items-per-page="50"
            :sort-by="[{ key: 'fechas.inicio', order: 'desc' }]"
            hover
        >
            <!-- Template para los tickets -->
            <template #item.ordenes="{ item }">
                <v-chip
                    v-for="ticket in item.ordenes"
                    :key="ticket"
                    variant="flat"
                    class="ma-1"
                    size="small"
                    label
                >
                    <template #prepend>
                        <v-icon size="small" class="pr-1">mdi-ticket</v-icon>
                    </template>
                    {{ ticket }}
                </v-chip>
            </template>

            <!-- Template para los procesos -->
            <template #item.procesos="{ item }">
                <v-chip
                    v-for="proceso in item.procesos"
                    :key="proceso.id"
                    variant="flat"
                    class="ma-1"
                    size="small"
                    :color="getProcesoColor(proceso.tipo)"
                    label
                >
                    <template #prepend>
                        <v-icon size="small" class="pr-1">{{ getProcesoIcon(proceso.tipo) }}</v-icon>
                    </template>
                    {{ proceso.tipo }}
                    <template #append>
                        <v-tooltip activator="parent" location="top">
                            {{ proceso.responsable }}
                        </v-tooltip>
                    </template>
                </v-chip>
            </template>

            <!-- Template para las fechas -->
            <template #item.fechas="{ item }">
                <div class="d-flex flex-column align-center">
                    <span class="text-caption">
                        Inicio: {{ item.fechas.inicio || '---' }}
                    </span>
                    <span class="text-caption">
                        Final: {{ item.fechas.final || '---' }}
                    </span>
                </div>
            </template>

            <!-- Template para el estado -->
            <template #item.estadoOperacion="{ item }">
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
                <div class="text-caption mt-1">
                    Etapa: {{ item.currentStage }}
                </div>
            </template>

            <!-- Template para acciones -->
            <template #item.actions="{ item }">
                <v-btn
                    icon
                    size="small"
                    color="primary"
                    variant="text"
                    @click="showDetails(item)"
                >
                    <v-icon>mdi-eye</v-icon>
                </v-btn>
            </template>
        </v-data-table>

        <!-- Diálogo para ver detalles -->
        <v-dialog v-model="dialog" max-width="800px">
            <v-card>
                <v-card-title class="text-h5 grey lighten-2">
                    Detalles de la Operación
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-col cols="12" sm="6">
                                <strong>ID Operación:</strong> {{ selectedItem?.id }}
                            </v-col>
                            <v-col cols="12" sm="6">
                                <strong>Estado:</strong> 
                                {{ selectedItem?.estadoOperacion ? 'Finalizado' : 'Pendiente' }}
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12">
                                <strong>Procesos:</strong>
                                <div class="mt-2">
                                    <v-chip
                                        v-for="proceso in selectedItem?.procesos"
                                        :key="proceso.id"
                                        :color="getProcesoColor(proceso.tipo)"
                                        class="ma-1"
                                        label
                                    >
                                        {{ proceso.tipo }} - {{ proceso.responsable }}
                                    </v-chip>
                                </div>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="dialog = false">
                        Cerrar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { ref, onMounted} from 'vue';
import axios from 'axios';


// Estados reactivos
const formattedData = ref([]);
const dialog = ref(false);
const alert = ref(false);
const alertMsg = ref('');
const selectedItem = ref(null);

// Definición de headers para la tabla
const dataHeaders = [
    { 
        align: 'start',
        key: 'ordenes',
        title: 'N° Orden (Tickets)',
        width: '25%'
    },
    { 
        align: 'center',
        key: 'procesos',
        title: 'Procesos',
        width: '30%'
    },
    { 
        align: 'center',
        key: 'fechas',
        title: 'Fechas',
        width: '20%'
    },
    { 
        align: 'center',
        key: 'estadoOperacion',
        title: 'Estado',
        width: '15%'
    },
    {
        align: 'center',
        key: 'actions',
        title: 'Acciones',
        width: '10%',
        sortable: false
    }
];

// Funciones auxiliares para el manejo de procesos
const getProcesoColor = (tipo) => {
    const colores = {
        'lavado': 'blue',
        'secado': 'orange',
        'doblado': 'green',
        'planchado': 'purple',
        'cc': 'red',
        'tenido': 'brown'
    };
    return colores[tipo] || 'grey';
};

const getProcesoIcon = (tipo) => {
    const iconos = {
        'lavado': 'mdi-washing-machine',
        'secado': 'mdi-tumble-dryer',
        'doblado': 'mdi-format-columns',
        'planchado': 'mdi-iron',
        'cc': 'mdi-check-decagram',
        'tenido': 'mdi-palette'
    };
    return iconos[tipo] || 'mdi-cog';
};

// Función para obtener todos los tickets únicos de una operación
const getAllTickets = (operacion) => {
    const tickets = new Set();
    
    operacion.procesos?.forEach(proceso => {
        proceso.detalles?.forEach(detalle => {
            if (detalle.numOrden) {
                tickets.add(detalle.numOrden);
            }
        });
    });
    
    return Array.from(tickets);
};

// Función para formatear los datos
const formatOperacionesData = (operaciones) => {
    return operaciones.map(operacion => ({
        id: operacion._id,
        ordenes: getAllTickets(operacion),
        procesos: operacion.procesos?.map(proceso => ({
            id: proceso._id,
            tipo: proceso.tipo,
            fecha: proceso.fecha,
            responsable: proceso.responsable ? 
                `${proceso.responsable.nombres} ${proceso.responsable.apellidos}` : 
                'No asignado'
        })),
        fechas: {
            inicio: operacion.fecInicio || '',
            final: operacion.fecFinal || ''
        },
        estadoOperacion: operacion.estadoOperacion,
        currentStage: operacion.currentStage
    }));
};

// Funciones de manejo de eventos
const showDetails = (item) => {
    selectedItem.value = item;
    dialog.value = true;
};

const activeAlert = (msg) => {
    alertMsg.value = msg;
    alert.value = true;
    setTimeout(() => {
        alert.value = false;
    }, 3000);
};

// Función para cargar los datos
const cargarRegistros = async () => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/operacion/estado/${true}`);
        formattedData.value = formatOperacionesData(response.data);
    } catch (error) {
        console.error("Error al Cargar los datos de Registros:", error);
        activeAlert('Error al cargar los datos');
    }
};

// Ciclo de vida
onMounted(() => {
    cargarRegistros();
});
</script>

<style scoped>
.v-data-table {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.v-data-table :deep(.v-data-table-header) {
    background: #f5f5f5;
}

.text-caption {
    font-size: 0.75rem;
    color: rgba(0,0,0,0.6);
}
</style>