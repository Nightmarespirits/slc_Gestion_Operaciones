<template>
  <div class="d-flex align-center justify-center min-vh-100">
    <!-- Main container -->
    <v-container>
      <!-- Logo -->
      <v-img
        class="mx-auto my-4"
        max-width="340"
        src="/slc_logo.png"
      ></v-img>

      <!-- Card principal -->
      <v-card
        class="mx-auto p-5"
        elevation="5"
        max-width="380"
        rounded="lg"
        :disabled="!apiStore.stateAPI"  

      >
        <!-- Progress bar que se muestra solo durante la carga -->
        <v-progress-linear
          v-if="!apiStore.stateAPI"
          indeterminate
          color="blue"
          class="mb-0"
        ></v-progress-linear>

        <div class="text-subtitle-1 text-medium-emphasis px-6 pt-6">
          Cuenta
        </div>

        <!-- Campo de correo -->
        <v-text-field
          v-model="account"
          density="compact"
          placeholder="Correo de empresa"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          class="mx-6"
        ></v-text-field>

        <!-- Sección de contraseña con link de recuperación -->
        <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between px-6">
          Contraseña
          <a
            class="text-caption text-decoration-none text-blue"
            href="#"
            rel="noopener noreferrer"
            target="_blank"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <!-- Campo de contraseña -->
        <v-text-field
          v-model="password"
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          density="compact"
          placeholder="Contraseña de la empresa"
          prepend-inner-icon="mdi-lock-outline"
          variant="outlined"
          class="mx-6"
          @click:append-inner="visible = !visible"
        ></v-text-field>

        <!-- Mensaje de estado -->
        <v-card-text class="text-medium-emphasis text-caption px-6">
          {{ msg }}
        </v-card-text>

        <!-- Botón de inicio de sesión -->
         <v-row class="d-flex align-center justify-center">
          <v-btn
          class="my-2"
          color="blue"
          size="large"
          variant="tonal"
          @click="handleLogin"
        >
          Iniciar Sesión
        </v-btn>

         </v-row>
        
        <!-- Link de registro -->
        <v-card-text class="text-center pb-6">
          <router-link
            class="text-blue text-decoration-none"
            rel="noopener noreferrer"
            to="/register"
          >
            Registrarse <v-icon icon="mdi-chevron-right"></v-icon>
          </router-link>
        </v-card-text>
      </v-card>
    </v-container>
      

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from './store/auth';
import { useTestApiStore } from './store/testApi';
import router from './router';

// Stores
const authStore = useAuthStore();
const apiStore = useTestApiStore();

// Estado local
const account = ref('demo');
const password = ref('demo');
const visible = ref(false);
const loginStatus = ref('');

// Computed property para el mensaje de estado
const msg = computed(() => {
  return loginStatus.value
    ? "Inicio de Sesión Exitoso"
    : loginStatus.value === false
    ? "No se pudo iniciar sesión. Compruebe sus credenciales."
    : "MODO DEMO: Utilice usuario 'demo' y contraseña 'demo'";
});

// Manejador del inicio de sesión
const handleLogin = async () => {
  const loggedIn = await authStore.login(account.value, password.value);
  
  if (loggedIn) {
    router.push('/app');
    loginStatus.value = true;
  } else {
    loginStatus.value = false;
  }
};
</script>