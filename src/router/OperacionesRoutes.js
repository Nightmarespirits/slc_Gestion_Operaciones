const OperacionesRoutes = {
    path: 'operaciones',
    name: 'Operaciones',
    component: () => import('../views/operaciones.vue'),
    children: [
        {
            path:'',
            name:'Todas',
            component: () => import('../views/OperacionPages/todas.vue')
        },
        {
            path: 'finalizadas',
            name: 'Finalizadas',
            component: () => import('../views/OperacionPages/finalizados.vue')
        },
        {
            path: 'pendientes',
            name: 'Pendientes',
            component: () => import('../views/OperacionPages/pendientes.vue')
        }
    ]
}

export default OperacionesRoutes