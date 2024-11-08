<template>
  <v-container>
    <h1 class="text-h4 mb-5">Página de Inicio</h1>
    
    <v-row>
      <!-- Tarjetas de acción -->
      <v-col v-for="action in actions" :key="action.title" cols="12" sm="6" md="4">
        <v-card @click="navigateTo(action.route)" class="text-center">
          <v-card-text class="d-flex align-center justify-center flex-column" style="height: 150px;">
            <v-icon color="green" size="60">{{ action.icon }}</v-icon> <!-- Ícono centrado y en color naranja -->
            <div class="text-h6 mt-2">{{ action.title }}</div>
          </v-card-text>
        </v-card>

      </v-col>
    </v-row>

    <v-row class="mt-6">
      <!-- Tabla de últimas operaciones -->
      <v-col cols="12">
        <v-card>
          <v-card-title>Últimas Operaciones</v-card-title>
          <v-table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="operation in recentOperations" :key="operation.id">
                <td>{{ operation.title }}</td>
                <td>{{ operation.date }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Definición de acciones
const actions = ref([
  { title: 'Agregar Nuevo Proceso', icon: 'mdi-plus-circle', route: '/app/proceso/lavado' },
  { title: 'Configurar Aplicación', icon: 'mdi-cog', route: '/app/configuracion' },
  { title: 'Ver Procesos Pendientes', icon: 'mdi-clock', route: '/app/operaciones/pendientes' },
  { title: 'Ver Procesos Finalizados', icon: 'mdi-check-circle', route: '/app/operaciones/finalizadas' },
]);

// Navegar a una ruta específica
const navigateTo = (route) => {
  router.push(route);
};

// Datos de las últimas operaciones
const recentOperations = ref([
  { id: 1, title: 'Proceso A iniciado', date: '2024-11-01' },
  { id: 2, title: 'Proceso B completado', date: '2024-10-30' },
  { id: 3, title: 'Configuración cambiada', date: '2024-10-28' },
  { id: 4, title: 'Nuevo usuario registrado', date: '2024-10-27' },
]);
</script>

<style scoped>
.v-card {
  cursor: pointer;
  transition: transform 0.2s;
}
.v-card:hover {
  transform: scale(1.05);
}
</style>
