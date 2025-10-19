const OperacionesRoutes = {
    path: 'operaciones',
    name: 'Operaciones',
    component: () => import('../views/operaciones.vue'),
    children: [
        {
            path: '',
            name: 'Todas',
            component: () => import('../views/operacionPages/todas.vue')
        },
    ]
}

export default OperacionesRoutes