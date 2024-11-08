<template>
    <v-breadcrumbs :items="breadcumbItems">
        <template v-slot:prepend>
            <v-icon icon="mdi-home" size="small"></v-icon>
        </template>
    </v-breadcrumbs>
    <p class="text-h4 pl-8 mt-2">Registro de Operaciones {{title}}</p>
    <!--Contenido de la pagina-->
    <container>
        <RouterView></RouterView>
    </container>
    <!--Fin del Contenido de la pagina-->
</template>

<script setup>
import { ref, watch } from 'vue';
import { RouterView } from 'vue-router';
import { useRoute } from 'vue-router' 

const route = useRoute()
const title = ref(route.name)
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
    },
    {
    title: `${title.value}`,
    disabled: true,
    to: `/app/${title.value}`,
    }
])

watch(
() => route.name,
(newPath) => {
    title.value  = newPath
}
)
</script>
