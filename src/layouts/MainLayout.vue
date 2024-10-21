<template>
    <v-app>
        <AppSidebar v-model="drawer"/>
        <app-navbar @toggle-drawer="toggleDrawer"/>
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
    import { ref, computed } from 'vue';
    import { useRoute } from 'vue-router';

    const drawer = ref(false);
    const toggleDrawer = (value) => {
    drawer.value = value;
    };

    const route = useRoute();

    // Computed properties to determine which route we're on
    const isConfigPage = computed(() => route.path.startsWith('/app/configuracion'))
</script>
  
  