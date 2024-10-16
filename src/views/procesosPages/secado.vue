<template>
    <v-breadcrumbs :items="breadcumbItems">
        <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
        </template>
    </v-breadcrumbs>

    <!--Template-->
    <ProcesoSecadoTemplate/>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProcesoSecadoTemplate from '../../components/proceso/ProcesoSecadoTemplate.vue';

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
    title: 'Secado',
    disabled: true,
    href: '/secado',
    }
])
</script>

