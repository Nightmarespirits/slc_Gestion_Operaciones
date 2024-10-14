<template>
    <form>
        <v-container>
            <v-row>
                <v-container>
                    <v-btn
                    append-icon="mdi-autorenew"
                    text="Nuevo"
                    @click="cleanForm"
                    color="teal-lighten-5"
                    ></v-btn>
                </v-container>
            </v-row>
            
            <v-row>
                <v-col>
                    <v-select
                    v-model="sede.value.value"
                    :error-messages="sede.errorMessage.value" 
                    :items="sedeItems" 
                    item-value="_id"
                    item-title="nombre"
                    label="Sede" 
                    >
                    </v-select>
                </v-col>
                <v-col>
                    <v-select
                    v-model="responsable.value.value"
                    :error-messages="responsable.errorMessage.value" 
                    :items="responsableItems" 
                    item-value="_id"
                    item-title="nombres"
                    label="Responsable"
                    >
                    </v-select>
                </v-col>
                <v-col>
                    <v-btn
                    append-icon="mdi-open-in-new"
                    size="large"
                    text="Detalles"
                    @click="openDialogDetails"
                    ></v-btn>
                    <!--Dialog Detalles-->
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

                        <v-toolbar-title>Detalles de Proceso</v-toolbar-title>

                        <v-spacer></v-spacer>

                        <v-toolbar-items>
                        <v-btn
                        text="Guardar"
                        variant="text"
                        @click="comprobarDatos"
                        ></v-btn>
                        </v-toolbar-items>
                        </v-toolbar>
                        <!--Contenido de el Dialog-->
                        <v-container>
                            <v-row>
                                <v-col>
                                    <v-text-field label="Numero Orden(s)" v-model="numOrden.value.value"  :error-messages="numOrden.errorMessage.value"></v-text-field>
                                </v-col>
                                <v-col>
                                    <v-select label="Maquina" v-model="maquina.value.value" :error-messages="maquina.errorMessage.value" :items="maquinaItems"  ></v-select>
                                    
                                </v-col>
                                <v-col>
                                    <v-text-field label="Conteo(cantidad)" v-model="cantidad.value.value" hint="Mantente concentrado(a)" :error-messages="cantidad.errorMessage.value"></v-text-field>
                                </v-col>
                                <v-col>
                                    <v-select label="Identificador" v-model="colorMarcado.value.value"  :error-messages="colorMarcado.errorMessage.value"  :items="colorItems"></v-select>
                                </v-col>
                                <v-col>
                                    <v-text-field label="Observaciones" v-model="obs.value.value" hint="Opcional"  :error-messages="obs.errorMessage.value"></v-text-field>
                                </v-col>
                                <v-col>
                                <v-btn @click="appendDetail"> Agregar</v-btn>
                                </v-col>
                            </v-row>
                            <v-table>
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
                                    <td class="text-center">
                                        <v-btn>
                                        eliminar
                                        </v-btn>
                                    </td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-container>
                        <!--Fin de contenido del Dialog-->
                    </v-card>
                    </v-dialog>
                    <!--Fin del Dialog Detalles-->
                </v-col>
                <v-col>
                    <v-checkbox
                    class="ma-0 pa-0"
                    v-model="estado"
                    :label="`${estado ? 'Finalizado' : 'Pendiente'}`"
                    ></v-checkbox>
                </v-col>
                <v-col>
                    <v-btn  class="ma-0"
                    color="success"
                    append-icon="mdi-content-save"
                    @click="saveData"
                    >
                    {{btnSave}}
                    <template v-slot:append>
                        <v-icon></v-icon>
                    </template>
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </form>
</template>
<script setup>
import { ref , defineProps, defineEmits, onMounted, computed, watch} from 'vue';
import { useField, useForm } from 'vee-validate';
import axios from 'axios';

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

//Validador
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
const maquinaItems = ref(['M1', 'M2'])
const colorItems = ref(['Rojo', 'Azul', 'Verde'])
const dialog = ref(false)
const details = ref([])
//details combinado
const mergedDetails = computed(() => {
    return mergeTableData(details.value)
})
const sede = useField('local')
const responsable = useField('responsable')
const estado = ref(false)

const numOrden = useField('numOrden')
const maquina = useField('maquina')
const cantidad = useField('cantidad')
const colorMarcado = useField('colorMarcado')
const obs = useField('obs')
const btnSave = ref('Guardar')
//Observador de seleccion de la tabla de procesos
watch(() => props.selectedItem, (newItem) => {
  if (newItem) {

    sede.value.value = newItem.sede._id;
    responsable.value.value = newItem.responsable._id;
    estado.value = newItem.estado;
    details.value = newItem.detalles;
    btnSave.value = 'Actualizar'
  }
}, { deep: true, immediate: true });


//Verificar Campos Sede y Empleado
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

const appendDetail = handleSubmit(values => {
    details.value.unshift({
        numOrden: values.numOrden,
        maquina : values.maquina,
        cantidad : values.cantidad,
        colorMarcado : values.colorMarcado,
        obs : values.obs
    })
    
    limpiarCamposDetails()
    console.log(details.value)
})
const limpiarCamposDetails = () => {
    numOrden.value.value = ''
    maquina.value.value = ''
    cantidad.value.value = ''
    colorMarcado.value.value = ''
    obs.value.value = ''
}
//Procesar tabla (Merge)
const mergeTableData = (data) => {
  const mergedData = [];
  let prevEncabezado1 = null,
    prevEncabezado2 = null;
  let rowspan1 = 0,
    rowspan2 = 0;

  data.forEach((row) => {
    const newRow = { ...row, rowspan1: 0, rowspan2: 0 };

    // Combine numOrden
    if (row.numOrden === prevEncabezado1) {
      mergedData[rowspan1].rowspan1 += 1;
      newRow.rowspan1 = -1;  // Se omite esta fila
    } else {
      newRow.rowspan1 = 1;
      prevEncabezado1 = row.numOrden;
      rowspan1 = mergedData.length;
    }

    // Combine maquina
    if (row.maquina === prevEncabezado2) {
      mergedData[rowspan2].rowspan2 += 1;
      newRow.rowspan2 = -1;  // Se omite esta fila
    } else {
      newRow.rowspan2 = 1;
      prevEncabezado2 = row.maquina;
      rowspan2 = mergedData.length;
    }

    mergedData.push(newRow);
  });

  return mergedData;
};

const cleanForm = () => {
    sede.value.value = '';
    responsable.value.value = '';
    estado.value = false;
    details.value = [] ;
    btnSave.value = 'Guardar'
}
//http requests
const saveData = async() => {
    if(details.value.length != 0){
        try {
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
            const response = await axios.post('http://localhost:5000/procesos', data)
            emit('showAlert', response.data.message)
            emit('onRegAdded')
        } catch (error) {
            console.error('Error al enviar datos:', error);
        }
        const local = sede.value.value
        console.log(local)
    }else{
        let msg = "Asegurese de agregar los detalles correctamente"
        emit('showAlert', msg)  
    }
    
}

const cargarSedes = async () => {
    try {
    	const response = await axios.get('http://localhost:5000/sede');
        sedeItems.value = response.data;
    } catch (error) {
        console.error('Error al cargar locales:', error);
    }
};

const cargarResponsables = async () => {
	try {
		const response = await axios.get('http://localhost:5000/empleado')
		responsableItems.value = response.data
	} catch (error) {
		console.error('Error al cargar Responsables:', error);
	}
	
};

onMounted(()=>{
    cargarSedes()
    cargarResponsables()
})
watch(() => props.selectedSede, (value) => {
    console.log('changed')
    console.log( value )
    fillForm()
}, )
</script>