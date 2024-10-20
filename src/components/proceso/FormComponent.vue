<template>
    <form>
        <v-container>
            <v-row>
                <v-col class="d-flex justify-center" xs="12" sm="6">
                    <v-btn
                    variant="elevated"
                    append-icon="mdi-autorenew"
                    height="52"
                    min-width="164"
                    text="Nuevo"
                    @click="cleanForm"
                    ></v-btn>
                </v-col>

                <v-col class="d-flex justify-center" xs="12" sm="6">
                    <v-btn
                    variant="elevated"
                    append-icon="mdi-content-save"
                    height="52"
                    min-width="164"
                    @click="saveOrUpdateData"
                    >
                    {{btnSaveOrUpdateForm}}
                    <template v-slot:append>
                        <v-icon></v-icon>
                    </template>
                    </v-btn>
                </v-col>
            </v-row>
            
            <v-row>
                <v-col cols="12" sm="6" md="3">
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
                
                <v-col cols="12" sm="6" md="3">
                    <v-select
                    v-model="responsable.value.value"
                    :error-messages="responsable.errorMessage.value" 
                    :items="responsableItems" 
                    item-value="_id"
                    item-title="nombres"
                    label="Responsable"
                    />
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
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
                            <v-col cols="12" sm="6" md="4">
                                <v-text-field 
                                label="Numero Orden(s)" 
                                v-model="numOrden.value.value" 
                                :error-messages="numOrden.errorMessage.value" 
                                />
                            </v-col>
                            
                            <v-col cols="12" sm="6" md="4">
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
                            
                            <v-col cols="12" sm="6" md="4">
                                <v-text-field 
                                label="Conteo(cantidad)" 
                                v-model="cantidad.value.value" 
                                hint="Mantente concentrado(a)" 
                                :error-messages="cantidad.errorMessage.value" 
                                />
                            </v-col>
                            
                            <v-col cols="12" sm="6" md="4">
                                <v-select 
                                label="Identificador" 
                                v-model="colorMarcado.value.value" 
                                :error-messages="colorMarcado.errorMessage.value" 
                                :items="colorItems" 
                                item-value="value" 
                                item-title="text" 
                                />
                            </v-col>
                            
                            <v-col cols="12" sm="6" md="4">
                                <v-text-field 
                                label="Observaciones" 
                                v-model="obs.value.value" 
                                hint="Opcional" 
                                :error-messages="obs.errorMessage.value" 
                                />
                            </v-col>
                            
                            <v-col cols="12" sm="6" md="4">
                                <v-btn @click="appendOrUptdateDetails">{{detailBtnAppendOrUpdate}}</v-btn>
                            </v-col>
                        </v-row>
                        <v-table hover>
                            <thead>
                            <tr>
                                <th class="text-center">ID</th>
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
                                <td>{{ item._id || item.id || '[Sin Agregar]' }}</td>
                                <td class="text-center">{{ item.numOrden }}</td>
                                <td class="text-center">{{ item.maquina?.nombre || '[Sin Agregar]' }}</td>
                                <td class="text-center">{{ item.cantidad || '[Sin Agregar]' }}</td>
                                <td class="text-center">
                                <v-chip :color="evalColor(item.colorMarcado || '[Sin Agregar]')" class="text-lowercase" size="large" label>
                                    {{ item.colorMarcado || '[Sin Agregar]'}}
                                </v-chip>
                                </td>
                                <td class="text-center">{{ item.obs || '[Sin Agregar]' }}</td>
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
                <v-col cols="12" sm="6" md="3">
                    <v-checkbox class="ma-0 pa-0" v-model="estado" :label="`${estado ? 'Finalizado' : 'Pendiente'}`"></v-checkbox>
                </v-col>
            </v-row>

        </v-container>
    </form>
</template>
<script setup>
import { ref , defineProps, defineEmits, onMounted, computed, watch} from 'vue';
import { useField, useForm } from 'vee-validate';
import axios from 'axios';
import { mergeTableData } from '../../utils/mergeTableData';
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
const colorItems = ref(['Rojo', 'Verde', 'Azul', 'Amarillo'])
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


//Observador de seleccion de la tabla de procesos
watch(() => props.selectedItem, 
(newItem) => {
  if (newItem) {
    id.value = newItem._id
    sede.value.value = newItem.sede?._id || null;
    responsable.value.value = newItem.responsable?._id || null;
    estado.value = newItem.estado || false;
    details.value = newItem.detalles || '';
    editionMode.value = true
    btnSaveOrUpdateForm.value = 'Actualizar';
    
  }

}, { deep: true, immediate: true });

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
        return;
    }
    appendDetail(values)
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

    let index = details.value.findIndex(obj => (obj?.id ?? obj?._id ?? '') === detailEditingId.value)
    details.value[index] = {
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
    detailEditingId.value = null; // Resetear el modo edición
    detailBtnAppendOrUpdate.value = 'Agregar Detalles'; // Restaurar el texto del botón
}

const limpiarCamposDetails = () => {
  numOrden.value.value = '';
  maquina.value.value = '';
  cantidad.value.value = '';
  colorMarcado.value.value = '';
  obs.value.value = '';
  detailEditingId.value = null; // Resetear el índice de edición
  detailIsEditing.value = false
  detailBtnAppendOrUpdate.value = 'Agregar Detalles'; // Restaurar el texto del botón
};

const deleteDetail = (item) => {
    if(item?.id){
        details.value.splice(details.value.findIndex(obj => obj.id === item.id))
    }else if( item?._id){
        details.value.splice(details.value.findIndex(obj => obj._id === item._id))
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
        estado: estado.value
    }

    if(editionMode.value){
        actualizarData(data)
       
    }else{
        guardarData(data)
    }
}

const guardarData = async(data) => {
    try {
        const response = await axios.post( `${import.meta.env.VITE_API_URL}/procesos${isSequential.value ? '/sequential' : ''}`, data)
        emit('showAlert', response.data.message)
        emit('onRegAdded')            
    } catch (error) {
        console.error('Error al enviar datos:', error);
    }
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
        console.error('Error al cargar locales:', error);
    }
}

onMounted(()=>{
    cargarSedes()
    cargarResponsables()
})

//Otras funciones
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
}

</script>