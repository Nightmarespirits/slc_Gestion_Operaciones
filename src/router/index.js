import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth";
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'LandingPage',
            component: () => import('../LandingPage.vue')
        },
        {
            path: '/home',
            name: 'Home',
            component: () => import('../views/home.vue'),
            meta:{requiresAuth: false, planes: ['basic', 'pro']}
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('../Login.vue'),
            meta:{requiresAuth: false}
        },
        {
            path: '/register',
            name: 'Register',
            component: () => import('../Register.vue'),
            meta:{requiresAuth: false}
        },
        {
            path: '/lavado',
            name: 'Lavado',
            component: () => import('../views/procesosPages/lavado.vue'),
            meta:{requiresAuth: true, planes: ['basic', 'pro']}
        },
        {
            path: '/secado',
            name: 'Secado',
            component: () => import('../views/procesosPages/secado.vue'),
            meta:{requiresAuth: true, planes: ['basic', 'pro']}
        },
        {
            path: '/planchado',
            name: 'Planchado',
            component: () => import('../views/procesosPages/planchado.vue'),
            meta:{requiresAuth: true, planes: ['basic', 'pro']}
        },
        {
            path: '/doblado',
            name: 'Doblado',
            component: () => import('../views/procesosPages/doblado.vue'),
            meta:{requiresAuth: true, planes: ['basic', 'pro']}
        },
        {
            path:'/configuracion',
            name: 'Configuracion',
            component: () => import('../views/configuracion.vue'),
            children:[
                {
                    path:'',
                    name: 'Perfil',
                    component: () => import ('../views/configPages/perfil.vue')
                },
                {   
                    path:'locales',
                    name: 'Local',
                    component: () => import('../views/configPages/local.vue')
                },
                {   
                    path:'empleados',
                    name: 'Empleado',
                    component: () => import('../views/configPages/empleado.vue')
                },
                {   
                    path:'maquinas',
                    name: 'Maquinas',
                    component: () => import('../views/configPages/maquinas.vue')
                },
            ],
            meta:{requiresAuth: true, planes: ['basic', 'pro']}
        },
        {
            path: '/:catchAll(.*)',  // Esta es la ruta comodín
            name: 'NotFound',
            component: () => import('../views/notFound.vue'),  // Página 404 personalizada
            meta: { requiresAuth: false }
        }
    ]
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    // Verificar si la ruta requiere autenticación
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirigir a la página de login si no está autenticado
    next({ name: 'Login' });
  }else {
    // Permitir el acceso a la ruta
    next();
  }
})
export default router