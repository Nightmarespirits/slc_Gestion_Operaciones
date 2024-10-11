<template>
  <v-app>
    <AppSidebar v-model="drawer"/>
    <app-navbar @toggle-drawer="toggleDrawer"/>
    <v-main>
      <router-view />
    </v-main>
    <AppFooter />
  </v-app>
</template>


<script setup>
import AppNavbar from './components/AppNavbar.vue';
import AppSidebar from './components/AppSidebar.vue';
import AppFooter from './components/AppFooter.vue';
import { ref } from 'vue';

const drawer = ref(false);
const toggleDrawer = (value) => {
  drawer.value = value;
};

</script>
