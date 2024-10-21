import 'vuetify/styles'  // Importa los estilos globales de Vuetify
import '@mdi/font/css/materialdesignicons.css'  // Iconos opcionales

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import router from './router'

import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()
const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
    },
})

app.use(router)
app.use(pinia)
app.use(vuetify)

app.mount('#app')
