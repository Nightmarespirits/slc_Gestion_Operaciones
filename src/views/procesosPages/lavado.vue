<template>
    <!--Contenido de la pagina-->
    <v-container class="my-0 py-0 mx-0 px-0">
        <!--Alert-->
        <v-alert v-model="alert" border="start" close-label="Close Alert" color="blue-darken-1" variant="tonal" closable
            class="my-2 mx-4">
            {{ alertMsg }}
        </v-alert>

        <!--formulario-->
        <FormComponent @showAlert="activeAlert" :tipoProceso="title" :selectedItem="selectedItem" @onRegAdded="refreshData"></FormComponent>

        <!--Optimized Details Modal-->
        <OptimizedProcesoDetailsModal v-model="dialog" :proceso-id="procesoID" :proceso-data="procesoData"
            @proceso-updated="handleProcesoUpdated" />
        <!--Fin del Dialog Component-->

        <!--Confirm Dialog COMPONENT-->
        <v-dialog v-model="confirmDialog" max-width="400" persistent>
            <v-card prepend-icon="mdi-alert" text="Seguro que desea eliminar Este registro?"
                title="Mesaje de Confirmacion">
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

        <!--Tabla Procesos Optimizada-->
        <OptimizedProcesoTable 
            @onFullscreenItem="showDetails" 
            @onEditItem="handleItemSelected"
            @onDeleteItem="openConfirmDialog" 
            :title="title"
        />
        <!--Fin de la tabla procesos -->

    </v-container>
    <!--Fin del Contenido de la pagina-->
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios';
import OptimizedProcesoTable from '../../components/proceso/OptimizedProcesoTable.vue';
import OptimizedProcesoDetailsModal from '../../components/proceso/OptimizedProcesoDetailsModal.vue';
import FormComponent from '../../components/proceso/FormComponent.vue';
import { mergeTableData } from '../../utils/mergeTableData.js';
import procesoService from '../../services/procesoService.js';

const title = ref('Lavado')

const selectedItem = ref(null)

const mergedDetails = ref([])
const procesoData = ref(null)

const dialog = ref(false)
const confirmDialog = ref(false)
const itemID = ref('')
const alert = ref(false)
const alertMsg = ref('')

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
    // Data will be automatically refreshed by the OptimizedProcesoTable component
}
//Datos para el modo ver Registro de proceso
const operacionID = ref('')
const procesoResponsable = ref('')
const procesoSede = ref('')
const procesoID = ref('')
const procesoEstado = ref(false)
//Del boton ver detalles
const showDetails = (item) => {
    procesoID.value = item?._id || item?.id || 'Editar'
    procesoData.value = item
    dialog.value = true
}

const handleProcesoUpdated = (updatedProceso) => {
    procesoData.value = updatedProceso
    // The OptimizedProcesoTable will automatically refresh its data
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
const refreshData = () => {
    console.log("Refrescando la data de la tabla..........")
    // Data loading is now handled by OptimizedProcesoTable component
    // No need for manual cargarRegistros function
}

onMounted(() => {
    // Component initialization if needed
})
</script>
