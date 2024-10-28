<template>
  <v-container>
    <v-form @submit="sendData">
      <v-card class="mx-auto" max-width="344" title="REGISTRO DE EMPRESA">
        <v-container>
          <v-text-field
            v-model="nombreLegal.value.value"
            :error-messages="nombreLegal.errorMessage.value"
            color="primary"
            label="Nombre Legal"
            variant="underlined"
            clearable
            prepend-icon="mdi-domain"
          ></v-text-field>

          <v-text-field
            v-model="ruc.value.value"
            :error-messages="ruc.errorMessage.value"
            color="primary"
            label="RUC"
            variant="underlined"
            clearable
            prepend-icon="mdi-identifier"
          ></v-text-field>

          <v-text-field
            v-model="companyName.value.value"
            :error-messages="companyName.errorMessage.value"
            color="primary"
            label="Cuenta"
            variant="underlined"
            clearable
            prepend-icon="mdi-account"
          ></v-text-field>

          <v-text-field
            v-model="companyPassword.value.value"
            :error-messages="companyPassword.errorMessage.value"
            color="primary"
            label="Contraseña"
            placeholder="Crea una contraseña"
            variant="underlined"
            :type="showPassword ? 'text' : 'password'"
            clearable
            prepend-icon="mdi-lock"
            :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="togglePasswordVisibility"
          ></v-text-field>

          <v-text-field
            v-model="licenceKey.value.value"
            :error-messages="licenceKey.errorMessage.value"
            color="primary"
            label="Llave de acceso"
            variant="underlined"
            clearable
            prepend-icon="mdi-key"
            placeholder="Si no tiene una llave de acceso comuníquese con SLC"
          ></v-text-field>

          <v-checkbox
            v-model="terms.value.value"
            :error-messages="terms.errorMessage.value"
            color="secondary"
            label="Acepto los términos y condiciones"
            prepend-icon="mdi-checkbox-marked-outline"
          ></v-checkbox>
        </v-container>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" type="submit">
            Completar registro
            <v-icon icon="mdi-chevron-right" end></v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useForm, useField } from 'vee-validate';
import axios from 'axios';

// Configuración del formulario y validaciones
const { handleSubmit } = useForm();

const nombreLegal = useField('nombreLegal');
const ruc = useField('ruc');
const companyName = useField('companyName');
const companyPassword = useField('companyPassword');
const licenceKey = useField('licenceKey');
const terms = useField('terms');

// Mostrar/ocultar contraseña
const showPassword = ref(false);
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Envío de datos a la API
const sendData = handleSubmit(async (values) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/register`,
      JSON.stringify(values)
    );
    console.log('data', response.data);
  } catch (error) {
    console.error(error);
  }
});
</script>
