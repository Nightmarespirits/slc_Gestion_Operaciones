<template>
  <v-app>
    <AppSidebar 
      v-if="!isNotFound && !isLogin && !isRegister &&!isLandingPage"
      v-model="drawer"
  />
  <app-navbar 
    v-if="!isNotFound && !isLogin && !isRegister && !isLandingPage"
    @toggle-drawer="toggleDrawer"
  />
  <v-main>
      <router-view />
    </v-main>
  <AppFooter 
      v-if="!isNotFound && !isLogin && !isRegister"
    />
  </v-app>
  
</template>

<script setup>
import AppNavbar from './components/AppNavbar.vue';
import AppSidebar from './components/AppSidebar.vue';
import AppFooter from './components/AppFooter.vue';
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const drawer = ref(false);
const toggleDrawer = (value) => {
  drawer.value = value;
};

const route = useRoute();

// Computed properties to determine which route we're on
const isLandingPage = computed(()=> route.name === 'LandingPage')
const isNotFound = computed(() => route.name === 'NotFound');  // Asegúrate de usar el nombre correcto de la ruta
const isLogin = computed(() => route.name === 'Login');        // Nombre correcto para la ruta de login
const isRegister = computed(() => route.name === 'Register');  // Nombre correcto para la ruta de register

</script>

