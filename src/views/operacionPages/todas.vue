<template>
    <p class="text-h4 pl-8 mt-2">Todas las Operaciones</p>
    <v-container>
        <!-- Alerta de notificación -->
        <v-alert
            v-model="alert"
            :text="alertMsg"
            type="success"
            closable
            variant="tonal"
        ></v-alert>

        <!--Buscador de la tabla-->
        <v-text-field
        v-model="search"
        density="compact"
        label="Buscar N° de Orden"
        prepend-inner-icon="mdi-magnify"
        variant="solo-filled"
        flat
        hide-details
        single-line
        ></v-text-field>

        <!--Confirm Dialog COMPONENT-->
        <v-dialog
        v-model="confirmDialog"
        max-width="400"
        persistent
        >
            <v-card
            prepend-icon="mdi-alert"
            title="Confirmar Eliminacion de Registro"
            subtitle="Nesecitara permisos de Administrador"
            >
            <v-card-text>
                <v-text>Ingrese la contraseña</v-text>
                <v-text-field
                v-model="confirmPassword"
                type="password"
                required
                variant="underlined"
              ></v-text-field>
            </v-card-text>

                <template v-slot:actions>
                    <v-spacer></v-spacer>

                    <v-btn @click="confirmDialog = false">
                        Cancelar
                    </v-btn>

                    <v-btn @click="doDeleteItem">
                        Eliminar
                    </v-btn>
                </template>
            </v-card>
        </v-dialog>
        <!--Fin del Confirm Dialog COMPONENT-->

        <!-- Tabla de Operaciones -->
        <v-data-table
            :headers="dataHeaders"
            :items="filteredItems"
            :items-per-page="10"
            :sort-by="[{ key: 'fechas.fecCreacion', order: 'desc' }]"
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
                        <v-icon size="small" class="pr-3">mdi-more</v-icon>
                    </template>
                    {{ ticket }}
                </v-chip>
            </template>

            <!-- Template para los procesos -->
            <template #item.procesos="{ item }">
                <v-chip
                    v-for="proceso in item.procesos"
                    :key="proceso.id"
                    variant="outlined"
                    class="ma-1"
                    size="small"
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
            <template #item.inicio="{ item }">
                <span class="text-caption">
                    {{ item.fechas.inicio || '---' }}
                </span>
            </template>
            <template #item.final="{item}">
                <span class="text-caption">
                    {{ item.fechas.final || '---' }}
                </span>
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
                        <v-icon size="small" class="pr-3">
                            {{ item.estadoOperacion ? 'mdi-checkbox-marked-circle-outline' : 'mdi-clock-outline' }}
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
                <v-btn
                    variant="plain"
                    color="red-accent-4"
                    @click="btnDeleteClicked(item)"
                    icon="mdi-delete" 
                    size="large"
                ></v-btn>
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
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../store/auth';
import axios from 'axios';
import { dateTimeZConverter } from '../../utils/dateTimeZConverter';
// Estados reactivos
const authStore = useAuthStore()
const formattedData = ref([]);
const dialog = ref(false);
const alert = ref(false);
const alertMsg = ref('');
const selectedItem = ref(null);

const search = ref('')
const operacionID = ref('')
const confirmDialog = ref(false)
const confirmPassword = ref('')

// Definición de headers para la tabla
const dataHeaders = [
    { 
        align: 'start',
        key: 'ordenes',
        title: 'N° Orden',
        width: '25%'
    },
    { 
        align: 'center',
        key: 'procesos',
        title: 'Procesos',
        width: '25%'
    },
    { 
        align: 'center',
        key: 'inicio',
        title: 'Fecha de Inicio',
        width: '15%'
    },
    { 
        align: 'center',
        key: 'final',
        title: 'Fecha de Finalizacion',
        width: '15%'
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
        width: '15%',
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
        'tenido': 'mdi-water'
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
            fecha: dateTimeZConverter(proceso.fecha) || proceso.fecha,
            responsable: proceso.responsable ? 
                `${proceso.responsable.nombres} ${proceso.responsable.apellidos}` : 
                'No asignado'
        })),
        fechas: {
            fecCreacion: operacion?.createdAt || '',
            inicio: dateTimeZConverter(operacion?.fecInicio) || operacion.fecInicio || '',
            final: dateTimeZConverter(operacion?.fecFinal) || operacion.fecFinal || ''
        },
        estadoOperacion: operacion.estadoOperacion,
        currentStage: operacion.currentStage
    }));
};

//Funcion para filtrar segun el Buscador
const filteredItems = computed(() => {
    if(!search.value) return formattedData.value

    const searchTerm = search.value.toString().toLowerCase()

    return formattedData.value.filter(item => item.ordenes.toString().toLowerCase().includes(searchTerm))
})
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


const openConfirmDialog = (item) => {
    operacionID.value = item.id; 
    confirmDialog.value = true;
}
//Fucion para eliminar Operacion
const doDeleteItem = async () => {
    if(await authStore.comparePassword(confirmPassword.value)){
        try {
            const response = await axios.delete(`${import.meta.env.VITE_API_URL}/operacion/${operacionID.value}`)
            confirmDialog.value = false;
            activeAlert(response.data.message)
            confirmPassword.value = ''
            cargarRegistros()

        } catch (error) {
            console.error('Error al intentar eliminar datos:', error);
        }
    }else{
        confirmDialog.value = false;
        activeAlert("Contraseña Incorrecta, No se Elimino el Registro")
        confirmPassword.value = ''
    }
    
    
}
// Función para cargar los datos
const cargarRegistros = async () => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/operacion/all`);
        formattedData.value = formatOperacionesData(response.data);
    } catch (error) {
        console.error("Error al Cargar los datos de Registros:", error);
        activeAlert('Error al cargar los datos');
    }
};

const btnDeleteClicked = (item) => {
    openConfirmDialog(item)
}

// Ciclo de vida
onMounted(() => {
    cargarRegistros();
});
</script>

