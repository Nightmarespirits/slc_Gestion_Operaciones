<template>
    <v-container>  
        <h1>Nuevo Proceso {{ typeProcess }}</h1>
		<!--Componente de Alerta  para insercion de datos el formulario-->
		<v-alert
			v-model="showGlobalAlert"
			border="start"
			close-label="Close Alert"
			color="deep-purple-accent-4"
			variant="tonal"
			closable
		>
			{{ globalAlertMsg }}
		</v-alert>
		
        <form @submit.prevent="submit">
            <v-container>
                <v-row justify="center"align="center">
                    <v-col>
                        <v-select 
						v-model="selectLocal.value.value" 
						:error-messages="selectLocal.errorMessage.value" 
						:items="itemsLocal" 
						item-value="_id"
						item-title="nombre"
						label="Local" 
						>
                        </v-select>
                    </v-col>
                    <v-col>
                        <v-select 
						v-model="selectResponsable.value.value" 
						:error-messages="selectResponsable.errorMessage.value" 
						:items="itemsResponsable" 
						item-value="_id"
						item-title="nombres"
						label="Responsable" 
						></v-select>                                  
                    </v-col>
                    <v-col class="d-flex justify-center align-center">
                        <v-dialog v-model="dialog_addDetails" transition="dialog-bottom-transition" fullscreen>
                            <template v-slot:activator="{ props: activatorProps }">
                                
                                <v-text-field
                                append-inner-icon="mdi-open-in-new"
                                @click="openDialog"
								label="Detalles"
								v-model="detallesField.value.value"
								:error-messages="detallesField.errorMessage.value"
								style="cursor:copy !important;"
                                >
								</v-text-field>
                            </template>
                            <v-card>
                                <v-toolbar>
                                <v-btn
                                    icon="mdi-close"
                                    @click="dialog_addDetails = false"
                                ></v-btn>

                                <v-toolbar-title>Detalles de Proceso</v-toolbar-title>

                                <v-spacer></v-spacer>

                                <v-toolbar-items>
                                    <v-btn
                                    text="Guardar"
                                    variant="text"
                                    @click="saveDetails"
                                    ></v-btn>
                                </v-toolbar-items>
                                </v-toolbar>
                                
                                <DetallesComponent :typeProcess="title" :datos="detalles"></DetallesComponent>
                            </v-card>
                                
                        </v-dialog>
                    </v-col>
                    <v-col class="d-flex justify-center align-bottom">
                        <v-checkbox
                            class="ma-0 pa-0"
                            v-model="checkEstadoOperacion"
                            label="Finalizado"
                        ></v-checkbox>
                    </v-col>
                    <v-col class="d-flex justify-center align-center">
                        <v-btn type="submit" class="ma-0"
                        color="success"
                        append-icon="mdi-content-save"
                        >
                        Guardar
                        <template v-slot:append>
                            <v-icon></v-icon>
                        </template>
                        </v-btn>
                        
                        
                        
                    </v-col>
                    
                </v-row>
            </v-container>
        </form>
        <Table @open-dialog="dialog_addDetails = true" :title="title" :dataHeaders="dataHeaders" :dataItems="dataItems"</Table>
    </v-container>
    
</template>
<script setup>
import { ref } from 'vue'
import { defineProps, onMounted} from 'vue';
import Table from './TableDataTemplate.vue';
import DetallesComponent from './DetallesComponent.vue';
import { useField, useForm } from 'vee-validate'
import axios from 'axios';

//Definicion de las propiedades de el componente
const props = defineProps({
	//Propiedad que especifica el tipo de proceso actual
    typeProcess: {
        type: String,
        required: true
    }
})
const detalles = ref([])

//Variables para el Dialog component
const dialog_addDetails = ref(false)
const checkEstadoOperacion = ref(false)

//Variables para la Alerta de formulario 
const showGlobalAlert = ref(false)
const globalAlertMsg = ref('')

//Variables para definir componente
const title = props.typeProcess


//Configuracion del validador de formulario de agregacion
const { handleSubmit, handleReset } = useForm({
    validationSchema: {
		detallesField (value) {
			if (value === undefined || value === null) {
				return 'Agrega los detalles del Proceso';
			}
  			return true; // Es válido si no está vacío
        },
        local(value) {
        if (value) return true

        return 'Seleccione Local de Operacion'
        },
        responsable(value) {
        if (value) return true

        return 'Seleccione Responsable de Proceso'
        },
    },
})

const selectLocal = useField('local')
const selectResponsable = useField('responsable')
const detallesField = useField('detallesField')
const estado = checkEstadoOperacion.value

//Verificar Si se han seleccionado Responsable y Local
const canOpenDialog = () => {
  return selectLocal.value.value  && selectResponsable.value.value;
}
const openDialog = () => {
	if (canOpenDialog()) {
	detallesField.value.value = "67086f7270b2ca27453d2b71" // algo como un id
    dialog_addDetails.value = true; // Disparador que abre el Dialogo 
  } else {
    globalAlertMsg.value = 'Por favor, seleccione un Local y un Responsable antes de continuar.';
    showGlobalAlert.value = true; // Muestra el alert
	setTimeout(() => {
		showGlobalAlert.value = false
	}, 3000)
  }
}


//Variables de los datos de items
//Select components Items  declaration
const itemsLocal = ref([])

const itemsResponsable = ref([])


const cargarLocales = async () => {
    try {
    	const response = await axios.get('http://localhost:5000/sede');
        itemsLocal.value = response.data;
    } catch (error) {
        console.error('Error al cargar locales:', error);
    }
};

const cargarResponsables = async () => {
	try {
		const response = await axios.get('http://localhost:5000/empleado')
		itemsResponsable.value = response.data
	} catch (error) {
		console.error('Error al cargar Responsables:', error);
	}
	
};



//Envio del formulario con todos los datos de la operacion
const submit = handleSubmit(values => {
	let now = new Date();
	values.fecha = now.toLocaleDateString()
	values.hora = now.toLocaleTimeString()
	values.detalles = detalles.value
	values.estado = estado.value
	//Agregar a la tabla // solo debe agregar a la BD
	dataItems.unshift(values)
	alert(JSON.stringify(values))
})

//Metodo para guardar detalles en input detalles
const saveDetails = handleSubmit(values =>{
	dialog_addDetails.value = false
})

//CAbeceras Data 
const dataHeaders = [
  { align: 'start', key: 'fecha', title: 'Fecha' },
  { key: 'hora', title: 'Hora' },
  { key: 'sede', title: 'Sede' },
  { key: 'responsable', title: 'Responsable' },
  { key: 'details', title: 'Detalles' },
  { key: 'estado', title: 'Estado' }
]

//ItemsData
const dataItems = ref([])

const cargarRegistros = async () => {
	try {
		const response = await axios.get('http://localhost:5000/procesos')
		dataItems.value = response.data
	} catch (error) {
		console.log("Error al Cargar los datos de Registros" + error)
	}
	
}

onMounted(() => {
	cargarLocales();
	cargarResponsables();
	cargarRegistros();
})
</script>