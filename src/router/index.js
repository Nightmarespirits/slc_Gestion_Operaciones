import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth";
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'Home',
            component: () => import('../views/home.vue'),
            meta:{requiresAuth: true, planes: ['basic', 'pro']}
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('../login.vue'),
            meta:{requiresAuth: false}
        },
        {
            path: '/register',
            name: 'Register',
            component: () => import('../register.vue'),
            meta:{requiresAuth: false}
        },
        {
            path: '/lavado',
            name: 'Lavado',
            component: () => import('../views/lavado.vue'),
            meta:{requiresAuth: true, planes: ['basic', 'pro']}
        },
        {
            path:'/configuracion',
            name: 'Configuracion',
            component: () => import('../views/configuracion.vue'),
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
    window.location.href = '/login'
  }else {
    // Permitir el acceso a la ruta
    next();
  }
})
export default router