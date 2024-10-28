<template>
    <v-app>
      <v-container fluid class="content-container">
        <!-- Breadcrumbs -->
        <v-breadcrumbs :items="breadcumbItems">
          <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
          </template>
        </v-breadcrumbs>
  
        <!-- Contenido principal -->
        <v-container class="mt-0 pt-0 content-container">
          <router-view />
        </v-container>
      </v-container>
  
      <!-- Bottom Navigation -->
      <v-bottom-navigation
        app
        color="primary"
        v-model="value"
        style="position: fixed;"
      >
        <v-btn to="/app/configuracion" value="perfil">
          <v-icon>mdi-domain</v-icon>
          <span>Empresa</span>
        </v-btn>
  
        <v-btn to="/app/configuracion/locales" value="locales">
          <v-icon>mdi-store</v-icon>
          Locales
        </v-btn>
  
        <v-btn to="/app/configuracion/empleados" value="empleados">
          <v-icon>mdi-account-group</v-icon>
          Empleados
        </v-btn>
  
        <v-btn to="/app/configuracion/maquinas" value="maquinas">
          <v-icon>mdi-amplifier</v-icon>
          <span>Máquinas</span>
        </v-btn>
      </v-bottom-navigation>
    </v-app>
  </template>
<script setup lang="ts">
import { ref } from 'vue';

const value = ref(0); // Estado del bottom-navigation

// Items de Breadcrumbs
const breadcumbItems = ref([
  {
    title: 'Dashboard',
    disabled: false,
    to: '/app/home',
  },
  {
    title: 'Cuenta',
    disabled: false,
    to: '/app/cuenta',
  },
  {
    title: 'Configuración',
    disabled: true,
    to: '/app/configuracion',
  },
]);
</script>
<style scoped>
/* Aseguramos que el contenedor sea scrollable sin cubrir el bottom-navigation */
.content-container {
  padding-bottom: 56px; /* Espacio para evitar que el contenido cubra la barra inferior */
  min-height: calc(100vh - 56px); /* Altura mínima para llenar la pantalla */
  overflow-y: auto; /* Scroll vertical si el contenido excede la pantalla */
}
</style>
  