<template>
    <div>
      <v-img
        class="mx-auto my-6"
        max-width="228"
        src="/slc_logo.png"
      ></v-img>
  
      <v-card
        class="mx-auto pa-12 pb-8"
        elevation="8"
        max-width="448"
        rounded="lg"
      >
        <div class="text-subtitle-1 text-medium-emphasis">Cuenta</div>
  
        <v-text-field
          v-model="account"
          density="compact"
          placeholder="Correo de empresa"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
        ></v-text-field>
  
        <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between">
          Contraseña
  
          <a
            class="text-caption text-decoration-none text-blue"
            href="#"
            rel="noopener noreferrer"
            target="_blank"
          >
            Olvidaste tu contraseña?</a>
        </div>
  
        <v-text-field
          v-model="password"
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          density="compact"
          placeholder="Contraseña de la empresa"
          prepend-inner-icon="mdi-lock-outline"
          variant="outlined"
          @click:append-inner="visible = !visible"
        ></v-text-field>
        <v-card-text class="text-medium-emphasis text-caption">
            {{ msg }}
        </v-card-text>
        <v-btn
          class="mb-8"
          color="blue"
          size="large"
          variant="tonal"
          block
          @click="handleLogin"
        >
          Iniciar Sesion
        </v-btn>
  
        <v-card-text class="text-center">
          <a
            class="text-blue text-decoration-none"
            href="/app/register"
            rel="noopener noreferrer"
          >
            Registrarse <v-icon icon="mdi-chevron-right"></v-icon>
          </a>
        </v-card-text>
      </v-card>
    </div>
</template>
<script setup>
import { ref } from 'vue';
import { computed } from 'vue';
import { useAuthStore } from './store/auth';
import router from './router';

const authStore = useAuthStore()
const account = ref('')
const password = ref('')
const visible = ref(false)
const loginStatus = ref('')

const msg = computed(()=>{
  return loginStatus.value? "Inicio de Sesion Exitoso"
          :loginStatus.value === false ? "No se pudo iniciar sesion compruebe sus creadenciales"
          : ""
})

const handleLogin = async () => {
  const loggedIn = await authStore.login(account.value, password.value)

  if(loggedIn){
    router.push('/app/home')
    loginStatus.value = true
  }else{
    loginStatus.value = false
  }
}
</script>