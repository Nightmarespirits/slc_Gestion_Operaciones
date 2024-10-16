<template>
    <v-breadcrumbs :items="breadcumbItems">
        <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
        </template>
    </v-breadcrumbs>

    <!--Template-->
    <ProcesoLavadoTemplate/>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProcesoLavadoTemplate from '../../components/proceso/ProcesoLavadoTemplate.vue';
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

