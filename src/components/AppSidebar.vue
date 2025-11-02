<template>
  <v-navigation-drawer 
    left
    v-model="customizer.Sidebar_drawer"
    elevation="0"
    rail-width="60"
    mobile-breakpoint="lg"
    app
    class="leftSidebar"
    :rail="customizer.mini_sidebar"
    expand-on-hover
  >
    <v-list>
      <v-list-item
        prepend-avatar="../assets/icon.ico"
        title="SLC Panel"
        subtitle="Gestión de Operaciones"
      ></v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list density="compact" nav color="primary">
      <v-list-item 
        prepend-icon="mdi-home" 
        title="Inicio" 
        :to="{ path: '/app' }"
        active-class="v-list-item--active"
        exact
      ></v-list-item>

      <v-list-item 
        prepend-icon="mdi-plus-thick" 
        title="Agregar Operación" 
        :to="{ path: '/app/proceso/lavado' }"
        active-class="v-list-item--active"
        exact
      ></v-list-item>

      <v-list-item 
        prepend-icon="mdi-table-edit" 
        title="Operaciones" 
        :to="{ path: '/app/operaciones' }"
        active-class="v-list-item--active"
        exact
      ></v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list density="compact" nav color="primary">
      <v-list-subheader>CICLO DE PROCESOS</v-list-subheader>

      <v-list-item 
        prepend-icon="mdi-washing-machine" 
        title="Lavado" 
        :to="{ path: '/app/proceso/lavado' }"
        active-class="v-list-item--active"
        exact
      ></v-list-item>

      <v-list-item 
        prepend-icon="mdi-tumble-dryer" 
        title="Secado" 
        :to="{ path: '/app/proceso/secado' }"
        active-class="v-list-item--active"
        exact

      ></v-list-item>

      <v-list-item 
        prepend-icon="mdi-format-columns" 
        title="Doblado" 
        :to="{ path: '/app/proceso/doblado' }"
        active-class="v-list-item--active"
        exact
      ></v-list-item>        
    </v-list>

    <v-list density="compact" nav color="primary">
      <v-list-subheader>OTROS PROCESOS</v-list-subheader>

      <v-list-item 
        prepend-icon="mdi-iron" 
        title="Planchado" 
        :to="{ path: '/app/proceso/planchado' }"
        active-class="v-list-item--active"
        exact
      ></v-list-item>

      <v-list-item 
        prepend-icon="mdi-water" 
        title="Teñido" 
        :to="{ path: '/app/proceso/tenido' }"
        active-class="v-list-item--active"
        exact
      ></v-list-item>        
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from 'vue';
import { useCustomizerStore } from '../store/customizer';

const customizer = useCustomizerStore();
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);
</script>
