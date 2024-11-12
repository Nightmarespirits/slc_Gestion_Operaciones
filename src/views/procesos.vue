<template>
    <v-sheet elevation="3" rounded="lg">
      <v-tabs
        v-model="currentTab"
        color="red"
        height="60"   
      >
        <v-divider></v-divider>
        
        <v-tab
          prepend-icon="mdi-washing-machine"
          text="Lavado"
          value="/app/proceso/lavado"
          class="text-none"
          :to="{ path: '/app/proceso/lavado' }"
        ></v-tab>
        <v-divider></v-divider>
        <v-tab
          prepend-icon="mdi-tumble-dryer"
          text="Secado"
          value="/app/proceso/secado"
          class="text-none"
          :to="{ path: '/app/proceso/secado' }"
        ></v-tab>
        <v-divider></v-divider>
        <v-tab
          prepend-icon="mdi-format-columns"
          text="Doblado"
          value="/app/proceso/doblado"
          class="text-none"
          :to="{ path: '/app/proceso/doblado' }"
        ></v-tab>

        <v-divider></v-divider>
        <v-tab
          prepend-icon="mdi-iron"
          text="Planchado"
          value="/app/proceso/planchado"
          class="text-none"
          :to="{ path: '/app/proceso/planchado' }"
        ></v-tab>

        <v-divider></v-divider>
        <v-tab
          prepend-icon="mdi-water"
          text="Teñido"
          value="/app/proceso/tenido"
          class="text-none"
          :to="{ path: '/app/proceso/tenido' }"
        ></v-tab>
        <v-divider></v-divider>
      </v-tabs>
  
      <v-container class="mt-0 pt-0 mx-0 px-0 content-container">
        <router-view />
      </v-container>
    </v-sheet>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  
  const route = useRoute()
  const currentTab = ref(route.path) // Sincroniza el tab con la ruta actual
  
  // Observa los cambios en la ruta y actualiza el tab seleccionado
  watch(
    () => route.path,
    (newPath) => {
      currentTab.value = newPath
    }
  )
  </script>
  