<template>
    <v-container class="mt-0 pt-0">
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
        <v-card>
            <v-card-title>
                <div class="d-flex flex-column flex-sm-row justify-space-between align-center w-100">
                    <span>Configurar Máquinas</span>
                    <v-card-actions class="d-flex flex-column flex-sm-row justify-space-between">
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
                                                v-model="editedMaquina.nombre"
                                                label="Nombre"
                                                ></v-text-field>
                                            </v-col>

                                            <v-col
                                            cols="12"
                                            md="4"
                                            sm="6"
                                            >
                                                <v-select
                                                v-model="editedMaquina.tipo"
                                                :items="['Lavadora', 'Secadora', 'Plancha']"
                                                label="Tipo"
                                                ></v-select>
                                            </v-col>

                                            <v-col
                                            cols="12"
                                            md="4"
                                            sm="6"
                                            >
                                                <v-text-field
                                                v-model="editedMaquina.marca"
                                                label="Marca"
                                                ></v-text-field>
                                            </v-col>

                                            <v-col
                                            cols="12"
                                            md="4"
                                            sm="6"
                                            >
                                            <v-select 
                                            v-model="editedMaquina.sede" 
                                            label="Sucursal"
                                            :items="sedeItems" 
                                            item-value="_id"
                                            item-title="nombre"
                                            >

                                            </v-select>
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
                    </v-card-actions>
                </div>
            </v-card-title>
            <v-card-text>
                <!--Dialog delete elemento-->
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

                <!--Data table-->
                <v-data-table
                :headers="tableHeaders"
                :items="maquinas"
                :sort-by="[{ key: 'createdAt', order: 'desc' }]"
                hide-default-footer
                hover
                >
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
                        Reset
                    </v-btn>
                    </template>
                </v-data-table>
            </v-card-text>
        </v-card>
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
    { title: 'Nombre', align: 'start', sortable: false, key: 'nombre' },
    { title: 'Tipo', key: 'tipo' },
    { title: 'Marca', key: 'marca' },
    { title: 'Sede', key: 'sede.nombre'},
    { title: 'Acciones', key: 'actions', sortable: false },
])
const sedeItems = ref([])
const maquinas = ref([])
const editedIndexMaquina = ref(-1)
const editedMaquina = ref({
    nombre: '',
    tipo: '',
    modelo: '',
    marca: '',
    codigoFabrica: '',
    sede: {}
})
const defaultSede = ref({
    nombre: '',
    tipo: '',
    modelo: '',
    marca: '',
    codigoFabrica: '',
    sede: {}
})

const formTitle = computed(()=>{
    return editedIndexMaquina.value === -1 ? 'Nuevo Registro': 'Editar Registro'
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
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/maquina`)
        maquinas.value = response.data
    } catch (error) {
        console.error('Error al cargar Maquina:', error);
    }
}

const editItem = (item) => {

    editedIndexMaquina.value = maquinas.value.indexOf(item)
    editedMaquina.value = Object.assign({}, item)
    dialog.value = true
}
const deleteItem = (item) => {
    editedIndexMaquina.value = item?._id
    editedMaquina.value = Object.assign({}, item)
    dialogDelete.value = true
}
const doDeleteItem =  async () => {
    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/maquina/${editedIndexMaquina.value}`)
        activeAlert(response.data.message)
    } catch (error) {
        console.error('Error al intentar eliminar el registro de maquina' ,  error)
    }
    initializeTable()
    closeDeleteDialog()
}
const closeDialog = () => {
    dialog.value = false
    nextTick(() => {
        editedMaquina.value = Object.assign({}, defaultSede)
        editedIndexMaquina.value = -1
    })
}
const closeDeleteDialog = () => {
    dialogDelete.value = false
    nextTick(() => {
        editedMaquina.value = Object.assign({}, defaultSede)
        editedIndexMaquina.value = -1
    })
}
const saveOrUpdate = async () => {
    if(editedIndexMaquina.value > -1){
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/maquina/${editedMaquina.value?._id}`, editedMaquina.value)
            activeAlert(response.data.message)
        } catch (error) {
            console.error('Error Guardar sede', error);
        }
    }else{
       
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/maquina`, editedMaquina.value)
            activeAlert(response.data.message)
        } catch (error) {
            console.error('Error Guardar sede', error);
        }
    }
    initializeTable()
    closeDialog()
}
const cargarSedes = async () => {
    try {
    	const response = await axios.get( `${import.meta.env.VITE_API_URL}/sede`);
        sedeItems.value = response.data;
    } catch (error) {
        console.error('Error al cargar Sedes:', error);
    }
};
onMounted(() => {
    cargarSedes();
})
const activeAlert = (msg) => {
    alertMsg.value = msg
    alert.value = true
    setTimeout(() => {
        alert.value = false
    }, 3000)
}
</script>