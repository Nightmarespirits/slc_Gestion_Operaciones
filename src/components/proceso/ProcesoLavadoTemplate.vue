<template>
    <v-container>
        <h1>Nuevo Proceso Lavado</h1>

        <!--Alert-->
        <v-alert
        v-model="alert"
        border="start"		
        close-label="Close Alert"
        color="deep-purple-accent-4"
        variant="tonal"
        closable
        >
        {{ alertMsg }}
        </v-alert>

        <!--formulario-->
        <FormComponent 
        @showAlert="activeAlert"
        @onRegAdded="cargarRegistros"
        :tipoProceso="title"
        :selectedItem="selectedItem"
        ></FormComponent>

        <!--Dialog-->
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

                <v-toolbar-title>Detalles de Proceso {{ procesoID }} </v-toolbar-title>

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
                    <v-col>
                        <p class="text-h5 my-6 ">Responsable</p>
                        <p>{{ procesoResponsable }}</p>
                    </v-col>
                    <v-col>
                        <p class="text-h5 my-6 ">Local</p>
                        <p>{{ procesoResponsable }}</p>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <p class="text-h5 my-6 ">Estado del Proceso</p>
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
                            {{ item.numOrden }}
                        </td>
                        
                        <!-- MAQUINA con rowspan -->
                        <td
                            v-if="item.rowspan2 > 0"
                            :rowspan="item.rowspan2"
                            class="text-center"
                        >
                            {{ item.maquina }}
                        </td>
                        
                        <td class="text-center">{{ item.cantidad }}</td>
                        <td class="text-center">{{ item.colorMarcado }}</td>
                        <td class="text-center">{{ item.obs }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-container>
            <!--Fin de contenido del Dialog-->
        </v-card>
        </v-dialog>
        <!--Fin del dialog Component-->

        <!--Tabla Procesos-->
        <TableDataComponent
        @open-dialog="showDetails" 
        @item-selected="handleItemSelected"
        :title="title" 
        :dataHeaders="dataHeaders" 
        :dataItems="dataItems">
        </TableDataComponent>
        
    </v-container>
</template>
<script setup>
    
    import { onMounted, ref } from 'vue'
    import TableDataComponent from './TableDataComponent.vue';
    import axios from 'axios';
    import FormComponent from './FormComponent.vue';
import { mergeTableData } from '../../utils/mergeTableData';
    
    const selectedItem = ref(null)
    
    const mergedDetails = ref([])
    const procesoData = ref(null)
    const title = ref('Lavado')

    const dialog = ref(false)
    const alert = ref(false)
    const alertMsg = ref('')
    const dataItems = ref([])
    const dataHeaders = [
        {align: 'start', key:'_id', title: 'ID'},
        { align: 'center', key: 'fecha', title: 'Fecha' },
        { align: 'center', key: 'hora', title: 'Hora' },
        { align: 'center', key: 'estado', title: 'Estado' },
        { align: 'end', key: 'acciones', title: 'Acciones'}
    ]

    //del boton editar
    const handleItemSelected = (item) => {
        selectedItem.value = item
        console.log(item)
    }

    //Datos para el modo ver Registro de proceso
    const procesoResponsable = ref('')
    const procesoSede = ref('')
    const procesoID = ref('')
    const procesoEstado = ref(false)
    //Del boton ver detalles
    const showDetails = (item) => {
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
    const cargarRegistros = async () => {
        try {
            const response = await axios.get( `${import.meta.env.VITE_API_URL}/procesos`)
            dataItems.value = response.data
        } catch (error) {
            console.log("Error al Cargar los datos de Registros" + error)
        }
    }
    onMounted(()=>{
        cargarRegistros()
    })
</script>