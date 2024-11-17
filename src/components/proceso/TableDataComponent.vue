<script setup>
/**COMPONENTE PRINCIPAL EN LAS PAGINAS DE PROCESOS
 * Recibe las props:
 * @title -> El tipo de proceso: [lavado, secado, planchado]
 * @dataHeaders -> Las cabeceras de las columnas, pueden variar ligeramente
 * @dataItems -> los items, contenido de la tabla, formato json
 */
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify';
import { evalColor } from '../../utils/evalColor';
import { dateTimeZConverter } from '../../utils/dateTimeZConverter';
// Usamos el helper 'useDisplay' para manejar breakpoints
const { xs } = useDisplay();

// Definimos 'isMobile' usando computed
const isMovil = computed(() => xs.value);

const search = ref('')

const emit = defineEmits(['onFullscreenItem', 'onEditItem'])

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
            variant="elevated"
            class="ma-1"
            size="small"
            label
          >
            <template #prepend>
              <v-icon class="pr-3">mdi-more</v-icon>
            </template>
            {{ detalle?.numOrden || '[Editar]'}}
          </v-chip>
        </template>

        <template #item.fechaYHora="{ item }">
          {{ ` ${dateTimeZConverter(item?.fecha) || (item?.fecha + ' ' + item?.hora) || '[Editar]'} `}}
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
          >
          <template #prepend>
                <v-icon size="small" class="pr-3">
                    {{ item.estado ? 'mdi-checkbox-marked-circle-outline' : 'mdi-clock-outline' }}
                </v-icon>
            </template>
        </v-chip>
        </template>

        <template #item.acciones="{ item }">
          <v-btn class="ma-1"
          icon="mdi-eye" 
          @click="btnFullscreenClicked(item)"
          color="primary"
          variant="plain"
          size="large"
          ></v-btn>

          <v-btn
            variant="plain"
            color="success"
            @click="btnEditClicked(item)"
            icon="mdi-pencil"
            size="large"
            v-if="title!='Finalizado'"
          ></v-btn>

        </template>
      </v-data-table>
  </v-container>
  </v-card>
</template>