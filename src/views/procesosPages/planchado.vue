<template>
    <v-breadcrumbs :items="breadcumbItems">
        <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
        </template>
    </v-breadcrumbs>

    <!--Template-->
    <ProcesoTemplate :tipoProceso="tipo">
    </ProcesoTemplate>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProcesoTemplate from '../../components/proceso/ProcesoTemplate.vue';
const tipo = "Planchado"
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
    title: 'Planchado',
    disabled: true,
    href: '/planchado',
    }
])
</script>

