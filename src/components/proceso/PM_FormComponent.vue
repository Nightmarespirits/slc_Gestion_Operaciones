<template>
    <form class="m-0 py-0">
        <!--Barra de progresion linear-->
        <v-progress-linear
          v-show="isLoading"
          indeterminate
          rounded
          class="mt-2"
        ></v-progress-linear>

        <v-container fluid class="my-0 py-0">
            <v-row class="my-0 py-0 pt-3" align="center" justify="center"> 
                <!-- Botón Nuevo -->
                <v-col 
                cols="12" sm="4" md="3" 
                class="d-flex justify-center mb-0"
                >
                <v-btn
                variant="elevated"
                append-icon="mdi-autorenew"
                height="52"
                min-width="164"
                text="Nuevo"
                @click="cleanForm"
                ></v-btn>
                </v-col>
                <!-- Botón Guardar/Actualizar -->
                <v-col 
                    cols="12" sm="4" md="3" 
                    class="d-flex justify-center mb-0"
                >
                    <v-btn
                    variant="elevated"
                    append-icon="mdi-content-save"
                    height="52"
                    min-width="164"
                    @click="saveOrUpdateData"
                    >
                    {{ btnSaveOrUpdateForm }}
                    </v-btn>
                </v-col>
                <!-- Switch Seguimiento de Ciclo -->
                
            </v-row>
            
            <v-row v-if="editionMode" class="align-center">
                <v-col cols="6">
                    <p class="text-body-2"> [Editando] Proceso: <span class="font-weight-black">{{ id }}</span> </p>
                </v-col>
                <v-col v-if="!isMobile" cols="6">
                    <v-chip 
                    variant="elevated" 
                    label  
                    prepend-icon="mdi-pin"
                    v-for="detail in details" 
                    class="ma-1" 
                    size="small"
                    >
                    <v-icon class="pr-3">mdi-more</v-icon>
                    {{detail.numOrden }}
                    </v-chip>
                </v-col>
                
            </v-row>

            <v-card
            variant="elevated"
            elevation="2"
            class="mb-10 py-4 px-2"
            >
                <v-row>
                    <v-col cols="12" sm="3" md="3">
                        <v-select
                        v-model="sede.value.value"
                        :error-messages="sede.errorMessage.value" 
                        :items="sedeItems" 
                        item-value="_id"
                        item-title="nombre"
                        label="Sede" 
                        />
                    </v-col>
                    
                    <v-col cols="12" sm="3" md="3">
                        <v-select
                        v-model="responsable.value.value"
                        :error-messages="responsable.errorMessage.value" 
                        :items="responsableItems" 
                        item-value="_id"
                        item-title="nombres"
                        label="Responsable"
                        />
                    </v-col>
                    
                    <v-col cols="12" sm="3" md="3">
                        <v-btn 
                        variant="plain" 
                        prepend-icon="mdi-shape-square-plus" 
                        @click="openDialogDetails(item)"
                        color="success"
                        height="52"
                        min-width="164"
                        > 
                        {{btnAddDetalles}}
                        <v-icon></v-icon>
                        </v-btn>
                        <v-dialog v-model="dialog" transition="dialog-bottom-transition" fullscreen>
                        <v-card>
                            <v-toolbar>
                            <v-btn icon="mdi-close" @click="dialog = false"></v-btn>
                            <v-toolbar-title>Detalles de Proceso</v-toolbar-title>
                            <v-spacer></v-spacer>
                            <v-toolbar-items>
                                <v-btn text="Cerrar" variant="text" @click="dialog = false"></v-btn>
                            </v-toolbar-items>
                            </v-toolbar>
                            <v-container>
                            <v-row>
                            <v-col>
                                <v-btn @click="cleanDetailsForm">
                                    Nuevo
                                </v-btn>
                            </v-col>
                            </v-row>
                            <v-row>
                                <v-col cols="12" sm="6" md="2">
                                    <v-text-field 
                                    label="Numero Orden(s)" 
                                    v-model="numOrden.value.value" 
                                    :error-messages="numOrden.errorMessage.value" 
                                    />
                                </v-col>

                                
                                <v-col cols="12" sm="6" md="2">
                                    <v-text-field 
                                    label="Conteo(cantidad)" 
                                    v-model="cantidad.value.value" 
                                    hint="Mantente concentrado(a)" 
                                    :error-messages="cantidad.errorMessage.value" 
                                    />
                                </v-col>
                                <v-col cols="12" sm="6" md="2">
                                    <v-text-field 
                                    label="Observaciones" 
                                    v-model="obs.value.value" 
                                    hint="Opcional" 
                                    :error-messages="obs.errorMessage.value" 
                                    />
                                </v-col>
                                
                                <v-col cols="12" sm="6" md="2">
                                    <v-btn @click="appendOrUptdateDetails">{{detailBtnAppendOrUpdate}}</v-btn>
                                </v-col>
                            </v-row>
                            <v-table hover>
                                <thead>
                                <tr>
                                    <th class="text-center">N° ORDEN</th>
                                    <th class="text-center">CONTEO</th>
                                    <th class="text-center">OBSERVACIONES</th>
                                    <th class="text-center">ACCIONES</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr v-for="(item) in details" :key="item.numOrden">
                                    <td class="text-center">{{ item?.numOrden || '[Sin agregar]'}}</td>
                                    <td class="text-center">{{ item?.cantidad || '[Sin Agregar]' }}</td>
                                    <td class="text-center">{{ item?.obs || '[Sin Agregar]' }}</td>
                                    <td class="text-center">
                                    <v-btn variant="plain" icon="mdi-pencil" @click="fillDetail(item)" color="blue-darken-1"></v-btn>
                                    <v-btn variant="plain" icon="mdi-delete" @click="deleteDetail(item)" color="red-darken-1"></v-btn>

                                    </td>
                                </tr>
                                </tbody>
                            </v-table>
                            </v-container>
                        </v-card>
                        </v-dialog>
                    </v-col>
                    <v-col cols="12" sm="3" md="3">
                        <v-checkbox class="ma-0 pa-0" v-model="estado" :label="`${estado ? 'Finalizado' : 'Pendiente'}`"></v-checkbox>
                    </v-col>
                </v-row>
            </v-card>
        </v-container>
    </form>
</template>
<script setup>
import { ref , defineProps, defineEmits, onMounted, computed, watch, nextTick} from 'vue';
import { useField, useForm } from 'vee-validate';
import axios from 'axios';
import { useDisplay } from 'vuetify';

const { xs } = useDisplay();
const isMobile = computed(() => xs.value);
//Props
const props = defineProps({
    tipoProceso:{
        type: String, 
        required: true
    },
    selectedItem:{
        type: Object,
        default: () => ({})
    }
})

//Emits
const emit = defineEmits(['showAlert', 'onRegAdded'])

//Validador general
const {handleSubmit} = useForm({
    validationSchema: {
        local(value) {
        if (value) return true

        return 'Seleccione Local de Operacion'
        },
        responsable(value) {
        if (value) return true

        return 'Seleccione Responsable de Proceso'
        },
        numOrden (value) {
        if (/^[0-9-]{6,}$/.test(value)) return true
        return 'El Numero de orden debe  ser como minimo 6 digitos'
        },
        cantidad (value) {
        if (/^[0-9]+$/.test(value)) return true

        return 'Ingrese la cantidad en numeros'
        },
        obs(value){
            if(/[a-z]/.test(value) || value == '') return true

            return 'Solo se permite contenido textual'
        }
    },
})

const title = props.tipoProceso
const isLoading = ref(false)
const sedeItems = ref([])
const responsableItems = ref([])
const dialog = ref(false)
const details = ref([])

//datos de los campos
const id = ref('')
const sede = useField('local')
const responsable = useField('responsable')
const estado = ref(false)

const numOrden = useField('numOrden')
const cantidad = useField('cantidad')
const obs = useField('obs')

//Usages Booleans for details screen form
const detailEditingId = ref(null); // Índice del detalle en edición
const detailIsEditing = ref(false) // Verificar si estamos en modo edición
const detailBtnAppendOrUpdate = ref('Agregar'); // Texto dinámico del botón de detalles del dialogo

//Usage booleans for all Form
/**IMPORTANTE !!!!
 *  -Para el proceso de doblado es nesesario que la variable @isSequential este activa (true)
 *   para que pueda continuar el ciclo y finalizar la operacion
 *  - El page planchado usa el FormCompontent y el page teñido usa el PM_FormComponent -> procesoManual
 */
const isSequential = ref(true);
const editionMode = ref(false)
const btnAddDetalles = ref('Agregar Detalles')
const btnSaveOrUpdateForm = ref('Guardar')

//Observar si el titulo es Teñido desactivar tipo proceso secuencial (para insertar proceso teñido)
/**IMPORTANTE 
 * -Este watcher es nesesario para que se guarde como no secuencial en caso de que el proceso sea teñido
 * (para evitar errores de continuidad de procesos)
*/
watch(() => props.tipoProceso,
(value) => {
    if(value == 'Teñido'){
        isSequential.value = false;
    }else{
        isSequential.value = true;
    }
},
{ deep: true, immediate: true })

//Observador de seleccion de la tabla de procesos
watch(() => props.selectedItem, 
(newItem) => {
  if (newItem) {
    id.value = newItem?._id
    sede.value.value = newItem?.sede?._id || null;
    responsable.value.value = newItem?.responsable?._id || null;
    estado.value = newItem?.estado || false;
    details.value = newItem?.detalles || '';
    editionMode.value = true
    btnSaveOrUpdateForm.value = 'Actualizar';
  }

}, 
{ deep: true, immediate: true });

//Obeservador si existen detalles para cambiar texto de botones dinamicamente
watch(() => details.value, 
(value) => {
    if(details.value.length > 0){
        btnAddDetalles.value = "Ver Detalles"
    }else{
        btnAddDetalles.value = "Agregar Detalles"
    }
},
{ deep: true, immediate: true });


//Control de DialogoDetails (fullScreen)
const canOpenDialog = () => {
  return sede.value.value  && responsable.value.value;
}
const openDialogDetails = () => {
	if (canOpenDialog()) {
        dialog.value = true; 
    } else {
        let msg = 'Por favor, seleccione una Sede y un Responsable antes de Agregar los detalles'
        emit('showAlert' , msg)
    }
}

//Metodos para control de la tabla detalles
const fillDetail = (item) => {
  // Rellenar los campos del formulario con los datos del item seleccionado
  numOrden.value.value = item.numOrden;
  cantidad.value.value = item.cantidad;
  obs.value.value = item.obs;
  detailEditingId.value = item?.id ?? item?._id ?? 'no hallado' ; // Guardar el índice del item en edición
  detailIsEditing.value = true
  detailBtnAppendOrUpdate.value = 'Actualizar'; // Cambiar el texto del botón a "Actualizar"
};


const appendOrUptdateDetails = handleSubmit((values) => {
    if(detailIsEditing.value){
        updateDetail(values);
        return;
    }
    appendDetail(values)
})
const appendDetail = (values) => {
  const detail = {
    id: detailIsEditing.value ? detailEditingId.value : details.value.length + 1,
    numOrden: values.numOrden,
    cantidad: values.cantidad,
    obs: values.obs,
  };
  details.value.unshift(detail);

  limpiarCamposDetails(); // Limpiar los campos después de agregar o actualizar
};

const updateDetail = (values) => {
    const index = details.value.findIndex(obj => (obj?.id ?? obj?._id ?? '') === detailEditingId.value);
    
    // Crear una copia del array
    const updatedDetails = [...details.value];
    
    // Actualizar el elemento específico
    updatedDetails[index] = {
        id: detailEditingId.value,
        numOrden: values.numOrden,
        cantidad: values.cantidad,
        obs: values.obs,
    };
    
    // Asignar el nuevo array
    details.value = updatedDetails;
    
    detailEditingId.value = null;
    detailBtnAppendOrUpdate.value = 'Agregar';
    cleanDetailsForm();
}

const limpiarCamposDetails = () => {
  numOrden.value.value = '';
  cantidad.value.value = '';
  obs.value.value = '';
  detailEditingId.value = null; // Resetear el índice de edición
  detailIsEditing.value = false
  detailBtnAppendOrUpdate.value = 'Agregar Detalles'; // Restaurar el texto del botón
};

const deleteDetail = (item) => {
    if(item?.id){
        details.value.splice(details.value.findIndex(obj => obj.id === item.id),1 )
    }else if( item?._id){
        details.value.splice(details.value.findIndex(obj => obj._id === item._id), 1)
    }
}

//Metodos solicitudes a la API
const saveOrUpdateData = () => {
    if(details.value.length === 0){
        let msg = "Asegurese de agregar los detalles correctamente"
        emit('showAlert', msg)  
        return;
    }

    const data = {
        tipo: title!= 'Teñido' ? title.toLowerCase() : 'tenido',
        sede: {
            _id : sede.value.value
        },
        responsable: {
            _id : responsable.value.value
        },
        detalles: details.value,
        estado: estado.value,
        isSequential: isSequential.value
    }
    if(editionMode.value){
        actualizarData(data)
       
    }else{
        guardarData(data)
    }
}

const guardarData = async(data) => {
    isLoading.value = true; // Activa el indicador de carga
    try {
        const response = await axios.post( `${import.meta.env.VITE_API_URL}/procesos/`, data)
        emit('showAlert', response.data.message)
        emit('onRegAdded')            
    } catch (error) {
        console.error('Error al enviar datos:', error);
    }finally{
        cleanForm()
        isLoading.value=false; //Desactiva el indicador de carga
    }
   
}

const actualizarData = async(data) => {
    isLoading.value = true;
    try {
        const response = await axios.put( `${import.meta.env.VITE_API_URL}/procesos/${id.value}`, data)
        emit('showAlert', response.data.message)
        emit('onRegAdded')            
    } catch (error) {
        console.error('Error al intentar Actualizar datos:', error);
    }finally{
        cleanForm()
        isLoading.value = false;
    }
}
const cargarSedes = async () => {
    try {
    	const response = await axios.get( `${import.meta.env.VITE_API_URL}/sede`);
        sedeItems.value = response.data;
    } catch (error) {
        console.error('Error al cargar locales:', error);
    }
};

const cargarResponsables = async () => {
	try {
		const response = await axios.get( `${import.meta.env.VITE_API_URL}/empleado`)
		responsableItems.value = response.data
	} catch (error) {
		console.error('Error al cargar Responsables:', error);
	}
	
};

onMounted(()=>{
    cargarSedes()
    cargarResponsables()
})

const cleanForm = () => {
    editionMode.value = false
    sede.value.value = '';
    responsable.value.value = '';
    estado.value = false;
    details.value = [] ;
    numOrden.value.value = ''
    cantidad.value.value = ''
    obs.value.value = ''
    btnSaveOrUpdateForm.value = 'Guardar'
    detailIsEditing.value = false
    detailBtnAppendOrUpdate.value = 'Agregar'
    emit('onRegAdded') 
}
const cleanDetailsForm = () => {
    numOrden.value.value = ''
    cantidad.value.value = ''
    obs.value.value = ''
    detailIsEditing.value = false
    detailBtnAppendOrUpdate.value = 'Agregar'
}
</script>