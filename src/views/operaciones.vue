<template>
    <v-breadcrumbs :items="breadcumbItems">
        <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
        </template>
    </v-breadcrumbs>
    <!--Contenido de la pagina-->
    <container>
        <RouterView></RouterView>
    </container>
    <!--Fin del Contenido de la pagina-->
</template>

<script setup>
import { ref} from 'vue';
import { RouterView } from 'vue-router';

//Breadcumb
const breadcumbItems = ref([
    {
    title: 'Dashboard',
    disabled: false,
    to: '/app/',
    },
    {
    title: 'Operaciones',
    disabled: false,
    to: '/app/operaciones',
    }
])

</script>
