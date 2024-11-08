const OperacionesRoutes = {
    path: 'operaciones',
    name: 'Operaciones',
    component: () => import('../views/operaciones.vue'),
    children: [
        {
            path:'',
            name:'Todas',
            component: () => import('../views/operacionPages/todas.vue')
        },
        {
            path: 'finalizadas',
            name: 'Finalizadas',
            component: () => import('../views/operacionPages/finalizados.vue')
        },
        {
            path: 'pendientes',
            name: 'Pendientes',
            component: () => import('../views/operacionPages/pendientes.vue')
        }
    ]
}

export default OperacionesRoutes