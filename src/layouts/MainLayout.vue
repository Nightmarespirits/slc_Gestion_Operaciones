<template>
    <v-app>
        <AppSidebar/>
        <app-navbar/>
        <v-main>
            <router-view />
        </v-main>
        <AppFooter/>
    </v-app>

</template>

<script setup>
    import AppNavbar from '../components/AppNavbar.vue';
    import AppSidebar from '../components/AppSidebar.vue';
    import AppFooter from '../components/AppFooter.vue';
</script>
  
  