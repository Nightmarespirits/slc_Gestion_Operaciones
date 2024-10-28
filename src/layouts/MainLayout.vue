<template>
    <v-app>
        <AppSidebar/>
        <app-navbar/>
        <v-main>
            <router-view />
        </v-main>
        <AppFooter v-if="!isConfigPage"/>
    </v-app>

</template>

<script setup>
    import AppNavbar from '../components/AppNavbar.vue';
    import AppSidebar from '../components/AppSidebar.vue';
    import AppFooter from '../components/AppFooter.vue';
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';

    const route = useRoute();

    // Computed properties to determine which route we're on
    const isConfigPage = computed(() => route.path.startsWith('/app/configuracion'))
</script>
  
  