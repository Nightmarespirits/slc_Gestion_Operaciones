<template>
    <v-app-bar app>
      <v-app-bar-nav-icon @click.stop="customizer.SET_SIDEBAR_DRAWER">
        <v-icon>{{ drawerOpen ? 'mdi-close' : 'mdi-menu' }}</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>Speed Wash</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn to="/app/home" text>Inicio</v-btn>
      <v-menu
        transition="scale-transition"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            color="primary"
            v-bind="props"
          >
            Cuenta
          </v-btn>
        </template>

        <v-list>
          <v-list-item title="Configuracion" to="/app/configuracion" value="configuracion"></v-list-item>
          <v-list-item title="Cerrar Sesion" @click="logout" ></v-list-item>
        </v-list>

        
      </v-menu>
      <v-btn @click="toggleTheme" icon>
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>
  </template>
  
  <script setup>
  import { ref, computed, onMounted} from 'vue';
  import { useTheme } from 'vuetify';
  import { useAuthStore } from '../store/auth';
  import { useCustomizerStore } from '../store/customizer';
  import router from '../router';

  const customizer = useCustomizerStore();
  const authStore = useAuthStore();

  const theme = useTheme();
  const search = ref('');
  const drawerOpen = ref(false); 
  const isDark = computed(() => theme.global.current.value.dark);
  
  const toggleTheme = () => {
    theme.global.name.value = isDark.value ? 'light' : 'dark';
  };
  
  const logout = () => {
    authStore.logout()
    router.push('/login')
  }
  onMounted(()=>{
    
    authStore.checkcAuth(); 
  })
  </script>