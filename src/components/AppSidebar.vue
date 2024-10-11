<template>
    <v-navigation-drawer v-model="drawerModel" app expand-on-hover>
      <v-list>
        <v-list-item
          prepend-avatar="../assets/icon.ico"
          title="SW Panel"
          subtitle="Gestion de Operaciones"
        ></v-list-item>
      </v-list>
  
      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-home" title="Inicio" to="/" value="home"></v-list-item>
      </v-list>

      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-water-pump" title="Lavado" to="/lavado" value="lavado"></v-list-item>
        <v-list-item prepend-icon="mdi-thermometer-lines" title="Secado" to="/secado" value="secado"></v-list-item>
        <v-list-item prepend-icon="mdi-hanger" title="Doblado" to="/doblado" value="doblado"></v-list-item>
        <v-list-item prepend-icon="mdi-temperature-fahrenheit" title="Planchado" to="/planchado" value="planchado"></v-list-item>
        <v-list-item prepend-icon="mdi-water" title="Teñido" to="/tenido" value="planchado"></v-list-item>
        <v-list-item prepend-icon="mdi-check-circle-outline" title="Finalizados" to="/finalizado" value="planchado"></v-list-item>
      </v-list>
    </v-navigation-drawer>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps(['modelValue']);
  const emit = defineEmits(['update:modelValue']);
  
  const drawerModel = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
  });
  </script>