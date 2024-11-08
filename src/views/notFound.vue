<template>
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col class="text-center">
          <div class="svg-container">
            <v-img
              src="/emoticon-confused-outline.svg" 
              max-width="300"
              alt="Página no encontrada"
            ></v-img>
          </div> 
          <h1 class="display-1 font-weight-bold">404</h1>
          <h2 class="font-weight-light">Página no encontrada</h2>
          <p class="mb-4">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
          <v-btn color="primary" @click="goHome">Volver a la página de inicio</v-btn>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  const goHome = () => {
    router.push({ name: 'App' });
  };
  </script>
  
  <style scoped>
  .fill-height {
    min-height: 100vh;
  }
  .svg-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  </style>