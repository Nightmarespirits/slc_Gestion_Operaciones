<template>
    <v-container>
        <h1>Nuevo Proceso Secado</h1>

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

            <v-toolbar-title>Detalles de Proceso </v-toolbar-title>

            <v-spacer></v-spacer>

            <v-toolbar-items>
                <v-btn
                text="Cerrar"
                variant="text"
                @click="dialog=false"
                ></v-btn>
            </v-toolbar-items>
            </v-toolbar>
        </v-card>
        </v-dialog>
        <!--Fin del dialog Component-->

        <!--Tabla Procesos-->
        <TableDataComponent
        @open-dialog="dialog = true" 
        @item-selected="handleItemSelected"
        :title="title" 
        :dataHeaders="dataHeaders" 
        :dataItems="dataItems">
        </TableDataComponent>
        
    </v-container>
</template>
<script setup>
    
    import { onMounted, ref , watchEffect } from 'vue'
    import TableDataComponent from './TableDataComponent.vue';
    import axios from 'axios';
    import FormComponent from './FormComponent.vue';
    
    const selectedItem = ref(null)

    const title = ref('Secado')

    const dialog = ref(false)
    const alert = ref(false)
    const alertMsg = ref('')
    const dataItems = ref([])
    const dataHeaders = [
        {align: 'start', key:'_id', title: 'ID'},
        { align: 'center', key: 'fecha', title: 'Fecha' },
        { key: 'hora', title: 'Hora' },
        { key: 'sede', title: 'Sede' },
        { key: 'responsable', title: 'Responsable' },
        { key: 'details', title: 'Detalles' },
        { key: 'estado', title: 'Estado' }
    ]

    const handleItemSelected = (item) => {
        selectedItem.value = item
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