<template>
  <v-card flat>
    <v-card-title class="d-flex align-center pe-2">
      <v-row>
        <v-col cols="12" sm="6" md="6">
          <v-icon>mdi-clipboard-outline</v-icon>
          <span class="ml-2">Registros de Proceso {{ title }}</span>
          <v-spacer></v-spacer>
        </v-col>
        <v-col cols="12" sm="6" md="6">
          <v-text-field
            v-model="search"
            density="compact"
            label="N° Orden (ticket) o Responsable "
            prepend-inner-icon="mdi-magnify"
            variant="solo-filled"
            flat
            hide-details
            single-line
          ></v-text-field>
        </v-col>
        
      </v-row>
    </v-card-title>

    <v-divider></v-divider>
    <v-container fluid>
      <v-data-table
        :headers="dataHeaders"
        :items="filteredItems"
        :items-per-page="10"
        :sort-by="[{ key: 'createdAt', order: 'desc' }]"
        :mobile="isMovil"
        hover
      >
        <template #item.detalles="{ item }">

          <v-chip
            v-for="detalle in item.detalles"
            :key="detalle.numOrden"
            :color="evalColor(detalle?.colorMarcado || '')"
            variant="flat"
            class="ma-1"
            size="small"
            label
          >
            <template #prepend>
              <v-icon>mdi-label</v-icon>
            </template>
            {{ detalle?.numOrden || '[Editar]'}}
          </v-chip>
        </template>

        <template #item.fechaYHora="{ item }">
          {{ `${item?.fecha || '[Editar]'} ${item?.hora || '[Editar]'}` }}
        </template>

        <template #item.responsable="{ item }">
          {{ `${item?.responsable?.nombres || '[Editar]'} ${item?.responsable?.apellidos || '[Editar]'}` }}
        </template>

        <template #item.estado="{ item }">
          <v-chip
            :color="item?.estado ? 'green' : 'red'"
            :text="item?.estado ? 'Finalizado' : 'Pendiente'"
            class="text-uppercase"
            size="small"
            label
          ></v-chip>
        </template>

        <template #item.acciones="{ item }">
          <v-btn class="ma-1"
          append-icon="mdi-open-in-new" 
          @click="btnFullscreenClicked(item)"
          color="warning"
          variant="plain"
          size="small"
          rounded="s"
          elevation="1"
          > 
          Más
          </v-btn>

          <v-btn class="ma-1"
            variant="plain"
            rounded="s"
            elevation="1"
            color="success"
            @click="btnEditClicked(item)"
            append-icon="mdi-pencil"
            size="small"
            v-if="title!='Finalizado'"
          >Editar
          </v-btn>

          <v-btn class="ma-1"
            color="red-accent-4"
            @click="btnDeleteClicked(item)"
            append-icon="mdi-delete"
            variant="plain"
            size="small"
            rounded="s"
            elevation="1"
            v-if="title!='Finalizado'"
          >Eliminar
          </v-btn>

          
        </template>
      </v-data-table>
  </v-container>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify';
import { evalColor } from '../../utils/evalColor';
// Usamos el helper 'useDisplay' para manejar breakpoints
const { xs } = useDisplay();

// Definimos 'isMobile' usando computed
const isMovil = computed(() => xs.value);

const search = ref('')

const emit = defineEmits(['onFullscreenItem', 'onEditItem', 'onDeleteItem'])

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  dataHeaders: {
    type: Array,
    required: true
  },
  dataItems: {
    type: Array,
    required: true
  }
})


const filteredItems = computed(() => {
  if (!search.value) return props.dataItems

  const searchTerm = search.value.toString().toLowerCase()
  
  return props.dataItems.filter(item => {
    const matchResponsable = 
      item.responsable?.apellidos?.toLowerCase().includes(searchTerm) ||
      item.responsable?.nombres?.toLowerCase().includes(searchTerm)

    const matchNumOrden = item.detalles?.some(detalle => 
      detalle.numOrden?.toString().toLowerCase().includes(searchTerm)
    )

    return matchResponsable || matchNumOrden
  })
})

const btnFullscreenClicked = (item) => {
  emit('onFullscreenItem', item)
}

const btnEditClicked = (item) => {
  emit('onEditItem', item)
}

const btnDeleteClicked = (item) => {
  emit('onDeleteItem', item)
}
// Detectar cambio de tamaño de pantalla para activar vista móvil
onMounted(() => {
  window.addEventListener('resize', () => {
    if( window.innerWidth <= 600){
      isMovil.value = true;
    }else{
      isMovil.value = false;
    }
  })

  return () => {
    window.removeEventListener('resize', updateMobileView)
  }
})


</script>