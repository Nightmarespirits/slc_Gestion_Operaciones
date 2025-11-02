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
            class="my-2 mx-4"
        >
            {{ alertMsg }}
        </v-alert>

        <!--Optimized Details Modal-->
        <OptimizedOperacionDetailsModal 
            v-model="dialog" 
            :operacion-id="operacionID" 
            :operacion-data="operacionData"
            @operacion-updated="handleOperacionUpdated" 
        />
        <!--Fin del Dialog Component-->

        <!--Confirm Dialog COMPONENT-->
        <v-dialog v-model="confirmDialog" max-width="400" persistent>
            <v-card 
                prepend-icon="mdi-alert" 
                text="¿Seguro que desea eliminar esta operación?"
                title="Mensaje de Confirmación"
            >
                <template v-slot:actions>
                    <v-spacer></v-spacer>

                    <v-btn @click="confirmDialog = false">
                        Cancelar
                    </v-btn>

                    <v-btn @click="doDeleteItem" color="error">
                        Eliminar
                    </v-btn>
                </template>
            </v-card>
        </v-dialog>
        <!--Fin del Confirm Dialog COMPONENT-->

        <!--Tabla Operaciones Optimizada-->
        <OptimizedOperacionTable 
            @onFullscreenItem="showDetails" 
            @onEditItem="handleItemSelected"
            @onDeleteItem="openConfirmDialog" 
            :title="title"
        />
        <!--Fin de la tabla operaciones -->

    </v-container>
    <!--Fin del Contenido de la pagina-->
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import OptimizedOperacionTable from '../../components/operaciones/OptimizedOperacionTable.vue'
import OptimizedOperacionDetailsModal from '../../components/operaciones/OptimizedOperacionDetailsModal.vue'
import { useOperacionesStore } from '../../store/operaciones'

const title = ref('Todas las Operaciones')

// Store
const operacionesStore = useOperacionesStore()

// Referencias reactivas
const selectedItem = ref(null)
const operacionData = ref(null)
const dialog = ref(false)
const confirmDialog = ref(false)
const itemID = ref('')
const alert = ref(false)
const alertMsg = ref('')

// Datos para el modo ver Registro de operación
const operacionID = ref('')

// Del botón editar
const handleItemSelected = (item) => {
    selectedItem.value = item
    // Aquí podrías abrir un modal de edición si lo necesitas
    activeAlert('Función de edición no implementada aún')
}

// Del botón eliminar
const openConfirmDialog = (item) => {
    itemID.value = item._id
    confirmDialog.value = true
}

const doDeleteItem = async () => {
    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/operacion/${itemID.value}`)
        confirmDialog.value = false
        
        // Invalidar caché del store para refrescar los datos
        operacionesStore.invalidateCache('delete_operation')
        
        activeAlert(response.data.message || 'Operación eliminada correctamente')
    } catch (error) {
        console.error('Error al intentar eliminar operación:', error)
        activeAlert('Error al eliminar la operación')
    }
}

// Del botón ver detalles
const showDetails = async (item) => {
    try {
        operacionID.value = item._id || item.id || 'Ver'
        
        // Obtener detalles completos desde el store
        const fullDetails = await operacionesStore.fetchOperacionDetails(item._id || item.id)
        operacionData.value = fullDetails
        
        dialog.value = true
    } catch (error) {
        console.error('Error loading operation details:', error)
        activeAlert('Error al cargar los detalles de la operación')
    }
}

const handleOperacionUpdated = (updatedOperacion) => {
    operacionData.value = updatedOperacion
    
    // Actualizar en el store
    operacionesStore.updateOperacion(updatedOperacion.id, updatedOperacion)
    
    activeAlert('Operación actualizada correctamente')
}

const activeAlert = (msg) => {
    alertMsg.value = msg
    alert.value = true
    setTimeout(() => {
        alert.value = false
    }, 3000)
}

onMounted(() => {
    console.log('Todas las operaciones component mounted')
})
</script>

<style scoped>
/* Estilos específicos si son necesarios */
</style>