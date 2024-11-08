const ProcesosRoutes = {
    path: 'proceso',
    name: 'Proceso',
    component: () => import('../views/procesos.vue'),
    children: [
        {
            path: 'lavado',
            name: 'Lavado',
            component: () => import('../views/procesosPages/lavado.vue')
        },
        {
            path: 'secado',
            name: 'Secado',
            component: () => import('../views/procesosPages/secado.vue')
        },
        {
            path: 'planchado',
            name: 'Planchado',
            component: () => import('../views/procesosPages/planchado.vue')
        },
        {
            path: 'doblado',
            name: 'Doblado',
            component: () => import('../views/procesosPages/doblado.vue')
        },
        {
            path: 'tenido',
            name: 'Tenido',
            component: () => import('../views/procesosPages/tenido.vue')
        }
    ]
}

export default ProcesosRoutes