<template>
    <v-container class="mt-0 pt-0">
        <h2 class="mb-2">Configurar Locales</h2>
        <!--Alert-->
        <v-alert
        v-model="alert"
        border="start"		
        close-label="Close Alert"
        color="orange-darken-4"
        variant="tonal"
        closable
        >
        {{ alertMsg }}
        </v-alert>
        <v-data-table
            :headers="tableHeaders"
            :items="sedes"
            :sort-by="[{ key: 'nombre', order: 'asc' }]"
            hide-default-footer
            hover
        >
            <template v-slot:top>
            <v-toolbar
                flat
            >
                <v-toolbar-title>Speed Wash sedes </v-toolbar-title>
                <v-divider
                class="mx-4"
                inset
                vertical
                ></v-divider>
                <v-spacer></v-spacer>
                
                <!--Edit Dialog-->
                <v-dialog
                v-model="dialog"
                max-width="500px"
                >
                <template v-slot:activator="{ props }">
                    <v-btn
                    class="mb-2"
                    color="primary"
                    dark
                    v-bind="props"
                    >
                    Agregar
                    </v-btn>
                </template>
                <v-card>
                    <v-card-title>
                    <span class="text-h5">{{ formTitle }}</span>
                    </v-card-title>

                    <v-card-text>
                    <v-container>
                        <v-row>
                        <v-col
                            cols="12"
                            md="4"
                            sm="6"
                        >
                            <v-text-field
                            v-model="editedSede.nombre"
                            label="Nombre de la Sede"
                            ></v-text-field>
                        </v-col>
                        <v-col
                            cols="12"
                            md="4"
                            sm="6"
                        >
                            <v-text-field
                            v-model="editedSede.direccion"
                            label="Direccion"
                            ></v-text-field>
                        </v-col>
                        <v-col
                            cols="12"
                            md="4"
                            sm="6"
                        >
                            <v-text-field
                            v-model="editedSede.telefono"
                            label="Telefono"
                            ></v-text-field>
                        </v-col>
                        
                        </v-row>
                    </v-container>
                    </v-card-text>

                    <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        color="blue-darken-1"
                        variant="text"
                        @click="closeDialog"
                    >
                        Cancelar
                    </v-btn>
                    <v-btn
                        color="blue-darken-1"
                        variant="text"
                        @click="saveOrUpdate"
                    >
                        Guardar
                    </v-btn>
                    </v-card-actions>
                </v-card>
                </v-dialog>
                <!--Fin del Edit Dialog-->
                <v-dialog v-model="dialogDelete" max-width="500px">
                <v-card>
                    <v-card-title class="text-h5">Seguro que desea eliminar este item?</v-card-title>
                    <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue-darken-1" variant="text" @click="closeDeleteDialog">Cancelar</v-btn>
                    <v-btn color="blue-darken-1" variant="text" @click="doDeleteItem">OK</v-btn>
                    <v-spacer></v-spacer>
                    </v-card-actions>
                </v-card>
                </v-dialog>
            </v-toolbar>
            </template>
            <template v-slot:item.actions="{ item }">
                <v-btn 
                variant="plain" 
                icon="mdi-pencil" 
                @click="editItem(item)"
                color="success"
                >  
                </v-btn>
                
                <v-btn 
                variant="plain" 
                icon="mdi-delete" 
                @click="deleteItem(item)"
                color="red"
                >  
                </v-btn>
            </template>
            <template v-slot:no-data>
            <v-btn
                color="primary"
                @click="initializeTable"
            >
                Actualizar
            </v-btn>
            </template>
        </v-data-table>
    </v-container>
</template>
<script setup>
import axios from 'axios';
import { computed, onMounted, ref, watch } from 'vue';
import { nextTick } from 'vue';

const dialog = ref(false)
const dialogDelete = ref(false)
const alert = ref(false)
const alertMsg = ref('')
const tableHeaders = ref([
    {title: 'Nombre', align: 'start', sortable: false, key: 'nombre' },
    { title: 'Direcccion', key: 'direccion' },
    { title: 'Telefono', key: 'telefono' },
    { title: 'Actions', key: 'actions', sortable: false },
])
const sedes = ref([])
const editedIndexSede = ref(-1)
const editedSede = ref({
    nombre: '',
    direccion: '',
    telefono: ''
})
const defaultSede = ref({
    nombre: '',
    direccion: '',
    telefono: ''
})

const formTitle = computed(()=>{
    return editedIndexSede.value === -1 ? 'Nuevo Item': 'Editar Item'
})

watch(dialog, (val) => {
    if(!val) closeDialog()
})

watch(dialogDelete, (val) => {
    if(!val) closeDeleteDialog()
})

onMounted(() => {
    initializeTable()
})

//API requests
const initializeTable = async () => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/sede`)
        sedes.value = response.data
    } catch (error) {
        console.error('Error al cargar locales:', error);
    }
}

const editItem = (item) => {

    editedIndexSede.value = sedes.value.indexOf(item)
    editedSede.value = Object.assign({}, item)
    dialog.value = true
}
const deleteItem = (item) => {
    editedIndexSede.value = item?._id
    editedSede.value = Object.assign({}, item)
    dialogDelete.value = true
}
const doDeleteItem =  async () => {
    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/sede/${editedIndexSede.value}`)
        activeAlert(response.data.message)
    } catch (error) {
        console.error('Error al intentar eliminar el registro' ,  error)
    }
    initializeTable()
    closeDeleteDialog()
}
const closeDialog = () => {
    dialog.value = false
    nextTick(() => {
        editedSede.value = Object.assign({}, defaultSede)
        editedIndexSede.value = -1
    })
}
const closeDeleteDialog = () => {
    dialogDelete.value = false
    nextTick(() => {
        editedSede.value = Object.assign({}, defaultSede)
        editedIndexSede.value = -1
    })
}
const saveOrUpdate = async () => {
    if(editedIndexSede.value > -1){
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/sede/${editedSede.value?._id}`, editedSede.value)
            activeAlert(response.data.message)
        } catch (error) {
            console.error('Error Guardar sede', error);
        }
    }else{
       
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/sede`, editedSede.value)
            activeAlert(response.data.message)
        } catch (error) {
            console.error('Error Guardar sede', error);
        }
    }
    initializeTable()
    closeDialog()
}

const activeAlert = (msg) => {
    alertMsg.value = msg
    alert.value = true
    setTimeout(() => {
        alert.value = false
    }, 3000)
}
</script>