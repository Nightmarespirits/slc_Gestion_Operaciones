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
          subtitle="Gestion de Operaciones"
        ></v-list-item>
      </v-list>
  
      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-home" title="Inicio" to="/app/home" value="home"></v-list-item>
        <v-list-item prepend-icon="mdi-cogs" title="Todas las Operaciones" to="/app/operaciones" value="operaciones"></v-list-item>
        <v-list-item prepend-icon="mdi-check-circle-outline" title="Procesos Finalizados" to="/app/finalizado" value="finalizado"></v-list-item>
      </v-list>

      <v-divider></v-divider>
      
      <v-list density="compact" nav color="primary">
        <v-list-subheader>CICLO DE PROCESOS</v-list-subheader>
        <v-list-item prepend-icon="mdi-water-pump" title="Lavado" to="/app/lavado" value="lavado"></v-list-item>
        <v-list-item prepend-icon="mdi-thermometer-lines" title="Secado" to="/app/secado" value="secado"></v-list-item>
        <v-list-item prepend-icon="mdi-hanger" title="Doblado" to="/app/doblado" value="doblado"></v-list-item>        
      </v-list>

      <v-list density="compact" nav color="primary">
        <v-list-subheader>OTROS PROCESOS</v-list-subheader>
        <v-list-item prepend-icon="mdi-temperature-fahrenheit" title="Planchado" to="/app/planchado" value="planchado"></v-list-item>
        <v-list-item prepend-icon="mdi-water" title="Teñido" to="/app/tenido" value="tenido"></v-list-item>        
      </v-list>
    </v-navigation-drawer>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { useCustomizerStore } from '../store/customizer';
  
  const customizer = useCustomizerStore();
  const props = defineProps(['modelValue']);
  const emit = defineEmits(['update:modelValue']);
  
  const drawerModel = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
  });
  </script>