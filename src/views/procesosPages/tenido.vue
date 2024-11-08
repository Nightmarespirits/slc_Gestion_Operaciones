<template>
    <!--Contenido de la pagina-->
    <v-container class="my-0 py-0 mx-0 px-0">
        <!--Alert-->
        <v-alert
        v-model="alert"
        border="start"		
        close-label="Close Alert"
        color="blue-darken-1"
        variant="tonal"
        closable
        >
        {{ alertMsg }}
        </v-alert>

        <!--formulario-->
        <PM_FormComponent
        @showAlert="activeAlert"
        @onRegAdded="cargarRegistros"
        :tipoProceso="title"
        :selectedItem="selectedItem"
        >

        </PM_FormComponent>

        <!--Dialog Component-->
        <v-dialog
        v-model="dialog"
        transition="dialog-bottom-transition" 
        fullscreen
        >
        <v-card>
            <v-toolbar>
                <v-btn
                    icon="mdi-close"
                    @click="dialog = false"
                ></v-btn>

                <v-toolbar-title>Proceso {{ procesoID }} </v-toolbar-title>

                <v-spacer></v-spacer>

                <v-toolbar-items>
                    <v-btn
                    text="Cerrar"
                    variant="text"
                    @click="dialog=false"
                    ></v-btn>
                </v-toolbar-items>
            </v-toolbar>
            <!--Contenido de el Dialog-->
            <v-container>
                <v-row>
                    <v-col cols="12" sm="6" md="6" lg="3">
                        <p class="text-h5 my-6">Operación ID:</p>
                        <p>{{ operacionID }}</p>
                    </v-col>

                    <v-col cols="12" sm="6" md="6" lg="3">
                        <p class="text-h5 my-6">Responsable:</p>
                        <p>{{ procesoResponsable }}</p>
                    </v-col>

                    <v-col cols="12" sm="6" md="6" lg="3">
                        <p class="text-h5 my-6">Local:</p>
                        <p>{{ procesoSede }}</p>
                    </v-col>

                    <v-col cols="12" sm="6" md="6" lg="3">
                        <p class="text-h5 my-6">Estado del Proceso:</p>
                        <div>
                        Proceso
                        <v-chip
                            :color="procesoEstado ? 'green' : 'red'"
                            :text="procesoEstado ? 'Finalizado' : 'Pendiente'"
                            class="text-uppercase"
                            size="small"
                            label
                        ></v-chip>
                        </div>
                    </v-col>
                </v-row>

                
                <p class="text-h5 my-6 ">Detalles de Proceso</p>
                <v-table>
                    
                    <thead>
                        <tr>
                        <th class="text-center">N° ORDEN</th>
                        <th class="text-center">MAQUINA</th>
                        <th class="text-center">CONTEO</th>
                        <th class="text-center">IDENTIFICADOR</th>
                        <th class="text-center">OBSERVACIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item) in mergedDetails" :key="item.numOrden">
                        <!-- NUMORDEN con rowspan-->
                        <td 
                            v-if="item.rowspan1 > 0"
                            :rowspan="item.rowspan1"
                            class="text-center"
                        >
                            {{ item?.numOrden || '[Editar]' }}
                        </td>
                        
                        <!-- MAQUINA con rowspan -->
                        <td
                            v-if="item.rowspan2 > 0"
                            :rowspan="item.rowspan2"
                            class="text-center"
                        >
                            {{ item?.maquina?.nombre || '[Editar]'}}
                        </td>
                        
                        <td class="text-center">{{item.cantidad}}</td>
                        <td class="text-center">
                            <v-chip :color="evalColor(item.colorMarcado || '[Sin Agregar]')" class="text-lowercase" size="large" label>
                                {{ item?.colorMarcado || '[Sin Agregar]'}}
                            </v-chip>
                        </td>
                        <td class="text-center">{{item.obs}}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-container>
            <!--Fin de contenido del Dialog-->
        </v-card>
        </v-dialog>
        <!--Fin del Dialog Component-->

        <!--Confirm Dialog COMPONENT-->
        <v-dialog
        v-model="confirmDialog"
        max-width="400"
        persistent
        >
        <v-card
            prepend-icon="mdi-alert"
            text="Seguro que desea eliminar Este registro?"
            title="Mesaje de Confirmacion"
        >
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

        <!--Tabla Procesos-->
        <TableDataComponent
        @onFullscreenItem="showDetails" 
        @onEditItem="handleItemSelected"
        @onDeleteItem="openConfirmDialog"
        :title="title" 
        :dataHeaders="dataHeaders" 
        :dataItems="dataItems">
        </TableDataComponent>
        <!--Fin de la tabla procesos -->

    </v-container>
    <!--Fin del Contenido de la pagina-->
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios';
import TableDataComponent from '../../components/proceso/TableDataComponent.vue';
import PM_FormComponent from '../../components/proceso/PM_FormComponent.vue';
import { mergeTableData } from '../../utils/mergeTableData.js';

const title = ref('Teñido')

const selectedItem = ref(null)

const mergedDetails = ref([])
const procesoData = ref(null)

const dialog = ref(false)
const confirmDialog = ref(false)
const itemID = ref('')
const alert = ref(false)
const alertMsg = ref('')
const dataItems = ref([])
const dataHeaders = [
    { align: 'start', key:'detalles', title: 'N° Orden (Tickets)'},
    { align: 'center', key: 'fechaYHora', title: 'Fecha y Hora' },
    { align: 'center', key:'responsable', title: 'Responsable'},
    { align: 'center', key: 'estado', title: 'Estado' },
    { align: 'center', key: 'acciones', title: 'Acciones', width: '250px'}
]

//del boton editar
const handleItemSelected = (item) => {
    selectedItem.value = item
}
const openConfirmDialog = (item) => {
    itemID.value = item._id
    confirmDialog.value = true;
}
const doDeleteItem = async () => {
    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/procesos/${itemID.value}`)
        confirmDialog.value = false;
        activeAlert(response.data.message)
    } catch (error) {
        console.error('Error al intentar eliminar datos:', error);
    }
    cargarRegistros()
}
//Datos para el modo ver Registro de proceso
const operacionID = ref('')
const procesoResponsable = ref('')
const procesoSede = ref('')
const procesoID = ref('')
const procesoEstado = ref(false)
//Del boton ver detalles
const showDetails = (item) => {
    operacionID.value = item?.operacion || '[Editar]'
    procesoResponsable.value = `${item?.responsable?.apellidos || '[Editar]'} ${item?.responsable?.nombres || '[Editar]'} `
    procesoSede.value = item?.sede?.nombre || 'Editar'
    procesoID.value = item?._id || 'Editar'
    procesoEstado.value = item?.estado
    procesoData.value = item
    mergedDetails.value = mergeTableData(item.detalles)
    dialog.value = true
}
const activeAlert = (msg) => {
    alertMsg.value = msg
    alert.value = true
    setTimeout(() => {
        alert.value = false
    }, 3000)
}

const evalColor = color => {
    switch (color.toLowerCase()) {
        case 'rojo':
            return 'red';
        case 'verde':
            return 'green'
        case 'azul':
            return 'blue'
        case 'amarillo':
            return 'yellow'
        default:
            break;
    }
}

const cargarRegistros = async () => {
    try {
        const response = await axios.get( `${import.meta.env.VITE_API_URL}/procesos/filter`, {
            params: {
                tipo: 'tenido'
            }
        })
        dataItems.value = response.data
    } catch (error) {
        console.error("Error al Cargar los datos de Registros" + error)
    }
}
onMounted(()=>{
    cargarRegistros()
})
</script>

