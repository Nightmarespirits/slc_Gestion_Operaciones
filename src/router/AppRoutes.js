import ConfigRoutes from './ConfigRoutes'
import OperacionesRoutes from './OperacionesRoutes'
import ProcesosRoutes from './ProcesosRoutes'

const AppRoutes = {
    path: '/app',
    name:'App',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
        {
            path: '',
            name: 'Home',
            component: () => import('../views/home.vue'),
        },
        OperacionesRoutes,
        ProcesosRoutes,
        ConfigRoutes
    ]
}

export default AppRoutes