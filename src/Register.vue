<template>
    <v-container>
      <v-form @submit="sendData">
        <v-card
        class="mx-auto"
        max-width="344"
        title="REGISTRO DE EMPRESA"
      >

      <v-container>
        <v-text-field
          v-model="nombreLegal.value.value"
          :error-messages="nombreLegal.errorMessage.value"
          color="primary"
          label="Nombre Legal"
          variant="underlined"
        ></v-text-field>
  
        <v-text-field
          v-model="ruc.value.value"
          :error-messages="ruc.errorMessage.value"
          color="primary"
          label="RUC"
          variant="underlined"
        ></v-text-field>
  
        <v-text-field
          v-model="companyName.value.value"
          :error-messages="companyName.errorMessage.value"
          color="primary"
          label="cuenta"
          variant="underlined"
        ></v-text-field>
  
        <v-text-field
          v-model="companyPassword.value.value"
          :error-messages="companyPassword.errorMessage.value"
          color="primary"
          label="Contraseña"
          placeholder="Crea una contraseña"
          variant="underlined"
        ></v-text-field>

        <v-text-field
          v-model="licenceKey.value.value"
          :error-messages="licenceKey.errorMessage.value"
          color="primary"
          label="Llave de acceso"
          variant="underlined"
          placeholder="Si no tiene una llave de acceso comuniquese con SLC"
        ></v-text-field>

        <v-checkbox
          v-model="terms.value.value"
          :error-messages="terms.errorMessage.value"
          color="secondary"
          label="Acepto los terminos y condiciones"
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
import { useForm, useField } from 'vee-validate';
import axios from 'axios';

const {handleSubmit} = useForm({
  validationSchema: {
    nombreLegal(value){
      if(value== undefined || value == null) return 'Campo Obligatorio'
      return true
    },
    ruc(value){
      if(/^[0-9-]{12,}$/.test(value)) return true
      return 'Ingrese un RUC valido'
    },
    companyName(value){
      if(/[a-z]/.test(value) || value == '') return true
      return 'Solo se permite contenido textual'
    },
    companyPassword(value){
      if(/[a-z]/.test(value) || value == '') return true
      return 'Ingrese contraseña segura'
    },
    licenceKey(value){
      if(/[a-z]/.test(value) || value == '') return true
      return 'Ingrese su llave de acceso'
    },
    terms(value){
      if(value) return true
      return 'Acepte los terminos y condiciones'
    }
  }
})

const nombreLegal = useField('nombreLegal')
const ruc = useField('ruc')
const companyName = useField('companyName')
const companyPassword = useField('companyPassword')
const licenceKey = useField('licenceKey')
const terms = useField('terms')

const sendData = handleSubmit( async (values) => {
  try {
        console.log(JSON.stringify(values))
        const response = await axios.post(  `${import.meta.env.VITE_API_URL}/register`, JSON.stringify(values))
        console.log("data " + response.data);
        
  } catch (error) {
    console.log(error)
  }
})
</script> 