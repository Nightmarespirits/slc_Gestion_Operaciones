<template>
    <v-breadcrumbs :items="breadcumbItems">
        <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
        </template>
    </v-breadcrumbs>
    <v-container class="mt-0 pt-0">
        <router-view/>
        <v-bottom-navigation
            color="primary"
        >   
            <v-btn to="/configuracion" value="perfil">
                <v-icon>mdi-domain</v-icon>
                <span>Empresa</span>
            </v-btn>
            <v-btn to="/configuracion/locales" value="locales">
            <v-icon>mdi-store</v-icon>
            Locales
            </v-btn>

            <v-btn to="/configuracion/empleados" value="empleados">
            <v-icon>mdi-account-group</v-icon>
            Empleados
            </v-btn>

            <v-btn to="/configuracion/maquinas" value="maquinas">
            <v-icon>mdi-amplifier</v-icon>

            <span>Mauinas</span>
            </v-btn>
            <v-btn to="/configuracion/mas" value="mas">
            <v-icon>mdi-tools</v-icon>

            Más
            </v-btn>
            
    </v-bottom-navigation>
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

</script>

