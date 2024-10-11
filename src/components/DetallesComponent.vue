<template>
    <v-form @submit="addToTable">
        <v-container>
            <v-row>
                <v-col>
                    <v-text-field label="Numero Orden(s)" v-model="numOrden.value.value"  :error-messages="numOrden.errorMessage.value"></v-text-field>
                </v-col>
                <v-col>
                    <v-select label="Maquina" v-model="maquina.value.value" :error-messages="maquina.errorMessage.value" :items="itemsMaquina"  ></v-select>
                    
                </v-col>
                <v-col>
                    <v-text-field label="Conteo(cantidad)" v-model="cantidad.value.value" hint="Mantente concentrado(a)" :error-messages="cantidad.errorMessage.value"></v-text-field>
                </v-col>
                <v-col>
                    <v-select label="Identificador" v-model="colorMarcado.value.value"  :error-messages="colorMarcado.errorMessage.value"  :items="itemsIdentificador"></v-select>
                </v-col>
                <v-col>
                    <v-text-field label="Observaciones" v-model="obs.value.value" hint="Opcional"  :error-messages="obs.errorMessage.value"></v-text-field>
                </v-col>
            </v-row>
        </v-container>
        <v-container>
            <v-row>
                <v-btn type="submit"> Agregar</v-btn>
            </v-row>
            
        </v-container>
    </v-form>

    <v-container>
    <v-table>
      <thead>
        <tr>
          <th class="text-center">N° ORDEN</th>
          <th class="text-center">MAQUINA</th>
          <th class="text-center">CONTEO</th>
          <th class="text-center">IDENTIFICADOR</th>
          <th class="text-center">OBSERVACIONES</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in combinedData" :key="index">
          <!-- NUMORDEN con rowspan -->
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

          <!-- Otras columnas -->
          <td class="text-center">{{ item.cantidad }}</td>
          <td class="text-center">{{ item.colorMarcado }}</td>
          <td class="text-center">{{ item.obs }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
    
</template>
<script setup>
import { ref, computed } from 'vue'
import { defineProps } from 'vue';
import { useField, useForm } from 'vee-validate'

const props = defineProps({
    typeProcess: {
        type: String,
        required: true
    },
    datos:{
        type: Object,
        required: true
    }
})


const emit = defineEmits(['envioData'])

//Configuracion del validador de formulario de agregacion
const { handleSubmit, handleReset } = useForm({
    validationSchema: {
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
const numOrden = useField('numOrden')
const maquina = useField('maquina')
const cantidad = useField('cantidad')
const colorMarcado = useField('colorMarcado')
const obs = useField('obs')

const itemsMaquina = ref([
'L1',
'L2',
'L3',
'L4',
])

const itemsIdentificador = ref([
'Rojo',
'Azul',
'Amarillo',
'Verde',
])

const addToTable = handleSubmit(values => {

tableData.value.unshift(values)
})





// Datos de ejemplo
const tableData = ref(props.datos)
// Calculo de datos combinados con rowspan
const combinedData = computed(() => {
  return mergeTableData(tableData.value);
});

// Función para combinar los datos de la tabla
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

console.log("Estas es la data" , props.datos)
</script>