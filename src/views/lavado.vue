<template>
    <v-breadcrumbs :items="breadcumbItems">
        <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
        </template>
    </v-breadcrumbs>

    <!--Template-->
    <ProcesoComponent :typeProcess="tipo"></ProcesoComponent>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProcesoComponent from '../components/ProcesoComponent.vue';
const tipo = "Lavado"
//Breadcumb
const breadcumbItems = ref([
    {
    title: 'Dashboard',
    disabled: false,
    href: '/',
    },
    {
    title: 'Operaciones',
    disabled: false,
    href: '/operaciones',
    },
    {
    title: 'Lavado',
    disabled: true,
    href: '/lavado',
    }
])
</script>

