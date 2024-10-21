<template>
    <v-app-bar app>
      <v-app-bar-nav-icon @click="toggleDrawer">
        <v-icon>{{ drawerOpen ? 'mdi-close' : 'mdi-menu' }}</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title>Speed Wash S.A.</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn to="/app/home" text>Inicio</v-btn>
      <v-btn to="/app/about" text>Acerca De</v-btn>
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
  
  const authStore = useAuthStore();

  const theme = useTheme();
  const search = ref('');
  const drawerOpen = ref(false); 
  const isDark = computed(() => theme.global.current.value.dark);
  
  const toggleTheme = () => {
    theme.global.name.value = isDark.value ? 'light' : 'dark';
  };
  const toggleDrawer = () => {
    drawerOpen.value = !drawerOpen.value;
    emit('toggle-drawer', drawerOpen.value);
  };

  const emit = defineEmits(['toggle-drawer']);
  const logout = () => {
    authStore.logout()
    window.location.href = '/login'
  }
  onMounted(()=>{
    
    authStore.checkcAuth(); 
  })
  </script>