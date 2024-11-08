import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth";
import AppRoutes from "./AppRoutes";
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [

        {
            path: '/',
            name: 'LandingPage',
            component: () => import('../LandingPage.vue')
        },
        {
            path: '/:catchAll(.*)',  // Esta es la ruta comodín
            name: 'NotFound',
            component: () => import('../views/notFound.vue'),  //Página 404 personalizada
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('../Login.vue'),
        },
        {
            path: '/register',
            name: 'Register',
            component: () => import('../Register.vue')
        },
        AppRoutes
        
    ]
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
  
    // Verificar si la ruta requiere autenticación y evitar redirección infinita
    if (!authStore.checkcAuth() && to.name !== 'Login') {
        // Redirigir a la página de login si no está autenticado y la ruta no es login
        next({ name: 'Login' });
    }else{
        //Permitir el acceso a la ruta
        next();
    }
  });
  

export default router