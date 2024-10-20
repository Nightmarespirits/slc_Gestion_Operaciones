<template>
  <v-card flat>
    <v-card-title class="d-flex align-center pe-2">
      <v-icon icon="mdi-clipboard-outline"></v-icon> &nbsp;
      Registros de Proceso {{title}}

      <v-spacer></v-spacer>

      <v-text-field
        v-model="search"
        density="compact"
        label="Buscar responsable"
        prepend-inner-icon="mdi-magnify"
        variant="solo-filled"
        flat
        hide-details
        single-line
      ></v-text-field>
    </v-card-title>

    <v-divider></v-divider>

    <v-data-table
      :mobile-breakpoint="600"
      :search="search"
      :headers="dataHeaders"
      :items="dataItems"
      :items-per-page="10" 
      :sort-by="[{ key: 'fecha', order: 'desc' }]"
      :filter-keys="['responsable.apellidos', 'responsable.nombres']"
      hover      
    >
      <template v-slot:item.responsable="{item}">
        {{ `${ item?.responsable?.apellidos || '[editar]'} ${item?.responsable?.nombres || '[editar]'}` }}
      </template>
      <template v-slot:item.estado="{ item }">
          <div>
            <v-chip
              :color="item?.estado ? 'green' : 'red'"
              :text="item?.estado ? 'Finalizado' : 'Pendiente'"
              class="text-uppercase"
              size="small"
              label
            ></v-chip>
          </div>
      </template>
      <template v-slot:item.acciones="{ item }">
        
          <v-btn 
          variant="plain" 
          icon="mdi-open-in-new" 
          @click="openDialog(item)"
          color="warning"
          >
          </v-btn>
        
          <v-btn 
          variant="plain" 
          icon="mdi-pencil" 
          @click="rowSelected(item)"
          color="success"
          >  
          </v-btn>
      </template>
    </v-data-table>
  </v-card>
</template>


<script setup>
import { ref } from 'vue';
import { defineProps } from 'vue';
import { defineEmits } from 'vue';
// Modelo de búsqueda
const search = ref('');
const emit = defineEmits(['open-dialog', 'item-selected']);
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  dataHeaders:{
    type: Array,
    required: true
  },
  dataItems: {
    type: Array,
    required: true
  },
})

// Método para abrir el diálogo y emitir el evento al componente padre
const openDialog = (item) => {
  // Emitir evento personalizado
  emit('open-dialog', item);
};

//Metodo para ver en modo edicion el item
const rowSelected = (item) => {
  emit('item-selected', item);

}

</script>
