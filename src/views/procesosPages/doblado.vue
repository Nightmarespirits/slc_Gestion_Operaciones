<template>
    <v-breadcrumbs :items="breadcumbItems">
        <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
        </template>
    </v-breadcrumbs>

    <!--Template-->
    <ProcesoDobladoTemplate/>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProcesoDobladoTemplate from '../../components/proceso/ProcesoDobladoTemplate.vue';

const tipo = ref('Doblado')
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
    title: 'Doblado',
    disabled: true,
    href: '/doblado',
    }
])
</script>

