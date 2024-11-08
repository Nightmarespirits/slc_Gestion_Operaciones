<template>
    <form class="m-0 py-0">
        <v-container fluid class="my-0 py-0">
            <v-row class="my-0 py-0" align="center" justify="center">
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
                        @click="cleanForm"
                        text="Nuevo"
                        ></v-btn>
                    </v-col>
                    <!-- Botón Guardar/Actualizar -->
                    <v-col cols="12" sm="4" md="3">
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
                    <v-col
                    cols="12" sm="4" md="3" 
                    class="d-flex justify-center mb-0"
                    v-if="title != 'Planchado'"
                    >
                        <v-switch 
                        v-model="isSequential"
                        :color="isSequential ? 'green' : ''"
                        :label="isSequential ? 'Seguimiento de Proceso' : 'Sin Seguimiento' "
                        >
                        </v-switch>
                    </v-col>
            </v-row>

            <v-card
            variant="elevated"
            elevation="2"
            class="mb-10 py-4 px-2"
            >

            
                <v-row v-if="editionMode" class="align-center">
                    <v-col cols="6">
                        <p class="text-body-2"> [Editando] Proceso: <span class="font-weight-black">{{ id }}</span> </p>
                    </v-col>
                    <v-col v-if="!isMobile" cols="6">
                        <v-chip 
                        v-for="detail in details" 
                        variant="flat" 
                        class="ma-1" 
                        size="small" 
                        :color="evalColor(detail?.colorMarcado || '')"
                        label>
                        <v-icon class="pr-3">mdi-more</v-icon>
                        {{detail.numOrden }}
                        </v-chip>
                    </v-col>
                    
                </v-row>

                <v-row class="my-0 py-0"  justify="space-betwen">
                    <v-col cols="12" sm="3" md="3">
                        <v-select
                        v-model="sede.value.value"
                        :error-messages="sede.errorMessage.value" 
                        :items="sedeItems" 
                        @update:modelValue="cargarMaquinas"
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
                        size="small"
                        class="pa-4 rounded-lg" 
                        variant="outlined"
                        prepend-icon="mdi-shape-square-plus"
                        height="52"
                        min-width="164"
                        color="success"
                        @click="openDialogDetails(item)"
                        :text="btnAddDetalles"
                        >
                        </v-btn>
                        <v-dialog v-model="dialog" transition="dialog-bottom-transition" fullscreen>
                        <v-card>
                            <v-toolbar>
                                <v-btn icon="mdi-window-minimize" @click="dialog = false"></v-btn>
                                <v-toolbar-title>Detalles de Proceso</v-toolbar-title>
                                <v-spacer></v-spacer>
                                <v-toolbar-items>
                                    <v-btn text="cerrar" variant="text" @click="dialog = false"></v-btn>
                                </v-toolbar-items>
                            </v-toolbar>
                            <v-container>
                            <!--Buttons-->
                            <v-row>
                                <v-col>
                                    <v-btn @click="cleanDetailsForm">
                                        Nuevo
                                    </v-btn>
                                </v-col>
                                
                                <v-col>
                                    <v-btn @click.stop="appendOrUptdateDetails">{{detailBtnAppendOrUpdate}}</v-btn>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col cols="12" sm="3" md="3">
                                    <v-text-field 
                                    label="Numero Orden(s)" 
                                    v-model="numOrden.value.value" 
                                    :error-messages="numOrden.errorMessage.value" 
                                    />
                                </v-col>
                                
                                <v-col cols="12" sm="3" md="2">
                                    <v-select 
                                    label="Maquina" 
                                    v-model="maquina.value.value" 
                                    :error-messages="maquina.errorMessage.value" 
                                    :items="maquinaItems" 
                                    item-value="_id"
                                    item-title="nombre"
                                    return-object
                                    />
                                </v-col>
                                
                                <v-col cols="12" sm="3" md="2">
                                    <v-text-field 
                                    label="Conteo(cantidad)" 
                                    v-model="cantidad.value.value" 
                                    hint="Mantente concentrado(a)" 
                                    :error-messages="cantidad.errorMessage.value" 
                                    />
                                </v-col>
                                
                                <v-col cols="12" sm="3" md="2">
                                    <v-select 
                                    label="Identificador" 
                                    v-model="colorMarcado.value.value" 
                                    :error-messages="colorMarcado.errorMessage.value" 
                                    :items="colorItems" 
                                    item-value="value" 
                                    item-title="text" 
                                    />
                                </v-col>
                                
                                <v-col cols="12" sm="12" md="3">
                                    <v-text-field 
                                    label="Observaciones" 
                                    v-model="obs.value.value" 
                                    hint="Opcional" 
                                    :error-messages="obs.errorMessage.value" 
                                    />
                                </v-col>
                                
                            </v-row>
                            <v-table hover>
                                <thead>
                                <tr>
                                    <th class="text-center">N° ORDEN</th>
                                    <th class="text-center">MAQUINA</th>
                                    <th class="text-center">CONTEO</th>
                                    <th class="text-center">IDENTIFICADOR</th>
                                    <th class="text-center">OBSERVACIONES</th>
                                    <th class="text-center">ACCIONES</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr v-for="(item) in details" :key="item.numOrden">
                                    <td class="text-center">{{ item?.numOrden || '[Sin agregar]'}}</td>
                                    <td class="text-center">{{ item?.maquina?.nombre || '[Sin Agregar]' }}</td>
                                    <td class="text-center">{{ item?.cantidad || '[Sin Agregar]' }}</td>
                                    <td class="text-center">
                                    <v-chip :color="evalColor(item?.colorMarcado || '[Sin Agregar]')" class="text-lowercase" size="large" label>
                                        {{ item.colorMarcado || '[Sin Agregar]'}}
                                    </v-chip>
                                    </td>
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
                        <v-checkbox 
                        size="small"
                        class="ma-0 pa-0" 
                        v-model="estado" 
                        :color="`${estado ? 'green' : 'red'}`"
                        :label="`${estado ? 'Finalizado' : 'Pendiente'}`"
                        ></v-checkbox>
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
import { evalColor } from '../../utils/evalColor';

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
const {handleSubmit, resetForm} = useForm({
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
        maquina(value) {
        if (value) return true

        return 'Seleccione Maquina'
        },
        colorMarcado(value) {
        if (value) return true

        return 'Seleccione Un identificador'
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
const sedeItems = ref([])
const responsableItems = ref([])
const maquinaItems = ref([])
const colorItems = ref(['Rojo', 'Verde', 'Azul', 'Amarillo', 'Ninguno'])
const dialog = ref(false)
const details = ref([])

//datos de los campos
const id = ref('')
const sede = useField('local')
const responsable = useField('responsable')
const estado = ref(false)

const numOrden = useField('numOrden')
const maquina = useField('maquina')
const cantidad = useField('cantidad')
const colorMarcado = useField('colorMarcado')
const obs = useField('obs')

//Usages Booleans for details screen form
const detailEditingId = ref(null); // Índice del detalle en edición
const detailIsEditing = ref(false) // Verificar si estamos en modo edición
const detailBtnAppendOrUpdate = ref('Agregar'); // Texto dinámico del botón de detalles del dialogo

//Usage booleans for all Form
const isSequential = ref(true);
const editionMode = ref(false)
const btnAddDetalles = ref('Agregar Detalles')
const btnSaveOrUpdateForm = ref('Guardar')

//Observar si el titulo es planchado desactivar tipo proceso secuencial
watch(() => props.tipoProceso,
(value) => {
    if(value == 'Planchado'){
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

//Observar el cambio de el valor id del select sede
// Observa cambios en `sede.value.value` y ejecuta `cargarMaquinas` cuando cambia
watch(() => sede.value.value, async (newValue) => {
    if (newValue !== null) {
    await cargarMaquinas(newValue);
    }
},
{ deep: true});

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
  maquina.value.value = item.maquina;
  cantidad.value.value = item.cantidad;
  colorMarcado.value.value = item.colorMarcado;
  obs.value.value = item.obs;
  detailEditingId.value = item?.id ?? item?._id ?? 'no hallado' ; // Guardar el índice del item en edición
  detailIsEditing.value = true
  detailBtnAppendOrUpdate.value = 'Actualizar'; // Cambiar el texto del botón a "Actualizar"
};


const appendOrUptdateDetails = handleSubmit((values) => {
    if(detailIsEditing.value){
        updateDetail(values);
    }else{
        appendDetail(values)
    }
})

const appendDetail = (values) => {
  const detail = {
    id: detailIsEditing.value ? detailEditingId.value : details.value.length + 1,
    numOrden: values.numOrden,
    maquina: {
      _id: values.maquina._id,
      nombre: values.maquina.nombre,
    },
    cantidad: values.cantidad,
    colorMarcado: values.colorMarcado,
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
        maquina: {
            _id: values.maquina._id,
            nombre: values.maquina.nombre,
        },
        cantidad: values.cantidad,
        colorMarcado: values.colorMarcado,
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
  maquina.value.value = '';
  cantidad.value.value = '';
  colorMarcado.value.value = '';
  obs.value.value = '';
  detailEditingId.value = null; // Resetear el índice de edición
  detailIsEditing.value = false
  detailBtnAppendOrUpdate.value = 'Agregar'; // Restaurar el texto del botón
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
        tipo: title.toLowerCase(),
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
    try {
        const response = await axios.post( `${import.meta.env.VITE_API_URL}/procesos/`, data)
        emit('showAlert', response.data.message)
        emit('onRegAdded')            
    } catch (error) {
        console.error('Error al enviar datos:', error);
    }
    cleanForm()
}

const actualizarData = async(data) => {
    try {
        const response = await axios.put( `${import.meta.env.VITE_API_URL}/procesos/${id.value}`, data)
        emit('showAlert', response.data.message)
        emit('onRegAdded')            
    } catch (error) {
        console.error('Error al intentar Actualizar datos:', error);
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

const cargarMaquinas = async (sedeID) => {
    try {
        let tipoMaquina = ''
        switch (title) {
            case 'Lavado':
                tipoMaquina = 'Lavadora'
                break;
            case 'Secado':
                tipoMaquina = 'Secadora'
                break;
            case 'Planchado':
                tipoMaquina = 'Plancha'
                break;
            default:
                break;
        }
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/maquina/filter`, {
            params:{
                sede: sedeID,
                tipo: tipoMaquina
            }
        })

        maquinaItems.value = response.data
    } catch (error) {
        console.error('Error al cargar maquinas:', error);
    }
}

onMounted(()=>{
    cargarSedes()
    cargarResponsables()
})

//Otras funciones
const cleanForm = () => {
    editionMode.value = false
    sede.value.value = '';
    responsable.value.value = '';
    estado.value = false;
    details.value = [] ;
    numOrden.value.value = ''
    maquina.value.value = ''
    cantidad.value.value = ''
    colorMarcado.value.value = ''
    obs.value.value = ''
    btnSaveOrUpdateForm.value = 'Guardar'
    detailIsEditing.value = false
    detailBtnAppendOrUpdate.value = 'Agregar'
    emit('onRegAdded') 
}
const cleanDetailsForm = () => {
    numOrden.value.value = ''
    maquina.value.value = ''
    cantidad.value.value = ''
    colorMarcado.value.value = ''
    obs.value.value = ''
    detailIsEditing.value = false
    detailBtnAppendOrUpdate.value = 'Agregar'
}
</script>