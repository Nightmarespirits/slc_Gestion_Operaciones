<template>
    <v-breadcrumbs :items="breadcumbItems">
        <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
        </template>
    </v-breadcrumbs>
    
    <v-container>
        <v-row>
        <!-- Sección de Información de la Cuenta -->
        <v-col cols="12" md="6">
            <v-card>
            <v-card-title>
                Datos de La Empresa
                <v-spacer></v-spacer>
                <v-btn @click="toggleEdit" color="primary" outlined>
                {{ isEditing ? 'Cancelar' : 'Editar datos de empresa' }}
                </v-btn>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" v-model="valid">
                <!-- Foto de Perfil -->
                <v-row align="center">
                    <v-col cols="12" class="text-center">
                    <v-avatar size="100">
                        <v-img :src="profileImage" alt="Foto de Perfil" />
                    </v-avatar>
                    </v-col>
                    <v-col cols="12" class="text-center">
                    <v-btn
                        v-if="isEditing"
                        @click="changeProfileImage"
                        color="primary"
                        outlined
                    >
                        Cambiar Logo
                    </v-btn>
                    </v-col>
                </v-row>

                <!-- Nombre de Usuario -->
                <v-text-field
                    v-model="user.username"
                    label="Nombre de Usuario"
                    :readonly="!isEditing"
                    outlined
                ></v-text-field>

                <!-- Contraseña -->
                <v-text-field
                    v-model="user.password"
                    label="Contraseña"
                    type="password"
                    :readonly="!isEditing"
                    outlined
                ></v-text-field>
                
                <!-- Nombres -->
                <v-text-field
                    v-model="user.firstName"
                    label="Nombres"
                    :readonly="!isEditing"
                    outlined
                ></v-text-field>

                <!-- Apellidos -->
                <v-text-field
                    v-model="user.lastName"
                    label="Apellidos"
                    :readonly="!isEditing"
                    outlined
                ></v-text-field>

                <!-- Correo Electrónico -->
                <v-text-field
                    v-model="user.email"
                    label="Correo Electrónico"
                    :readonly="!isEditing"
                    outlined
                ></v-text-field>
                
                
                </v-form>

            </v-card-text>
            </v-card>
        </v-col>

        <!-- Sección de Información Personal -->
        <v-col cols="12" md="6">
            <v-card>
            <v-card-title> Datos de la cuenta</v-card-title>
            <v-list>
                <v-list-item prepend-icon="mdi-store" title="Locales" to="/locales" value="locales"></v-list-item>
                <v-list-item prepend-icon="mdi-account-group" title="Empleados" to="/empleados" value="empleados"></v-list-item>
                <v-list-item prepend-icon="mdi-amplifier" title="Maquinas" to="/maquinas" value="maquinas"></v-list-item>
                <v-list-item prepend-icon="mdi-tools" title="Mas" to="/mas" value="mas"></v-list-item>
            </v-list>
            </v-card>
        </v-col>
        </v-row>

        <!-- Botones de Guardar -->
        <v-row v-if="isEditing">
        <v-col cols="12" class="text-center">
            <v-btn :disabled="!valid" @click="saveChanges" color="primary">
            Guardar Cambios
            </v-btn>
            <v-btn @click="resetForm" color="secondary" outlined> Cancelar </v-btn>
        </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
//Breadcumb
const breadcumbItems = ref([
    {
    title: 'Dashboard',
    disabled: false,
    href: '/',
    },
    {
    title: 'Cuenta',
    disabled: false,
    href: '/Cuenta',
    },
    {
    title: 'Configuracion',
    disabled: true,
    href: '/configuracion',
    }
])

  const valid = ref(false)
  const isEditing = ref(false) // Estado de edición
  const user = ref({
    profileImage: 'https://example.com/profile.jpg', // URL de imagen de perfil
    username: 'usuario123',
    password: '',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
  })

  const rules = {
    required: value => !!value || 'Campo requerido',
    email: value => /.+@.+\..+/.test(value) || 'Correo inválido',
  }

  const profileImage = user.value.profileImage

  const toggleEdit = () => {
    isEditing.value = !isEditing.value
  }

  const changeProfileImage = () => {
    // Lógica para cambiar la imagen de perfil (input file o similar)
    console.log('Cambiar imagen de perfil')
  }

  const saveChanges = () => {
    // Guardar los cambios de la cuenta
    console.log('Guardar cambios:', user.value)
    isEditing.value = false
  }

  const resetForm = () => {
    // Reiniciar los cambios hechos
    console.log('Reiniciar formulario')
    isEditing.value = false
  }
</script>

<style scoped>
.v-avatar {
  cursor: pointer;
}
</style>