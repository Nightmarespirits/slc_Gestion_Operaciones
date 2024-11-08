const ConfigRoutes = {
    path:'configuracion',
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
    ]
}

export default ConfigRoutes