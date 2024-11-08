import axios from "axios";
import { defineStore } from "pinia";

export const useTestApiStore = defineStore({
    id: 'testApi',
    state: () => ({
        stateAPI: false,
        apiMsg: '',
        intervalId: null,
    }),
    actions: {
        async initializeAPI() {
            this.pollAPI();
        },
        async pollAPI() {
            // Limpiar cualquier intervalo existente
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }

            // Función para verificar la API
            const checkAPI = async () => {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_API_URL}`);
                    this.apiMsg = response.data;
                    this.stateAPI = true 
                    clearInterval(this.intervalId); // Detén el polling si la API responde
                } catch (error) {
                    console.error('Error en cargar API', error);
                }
            };

            // Configura un intervalo para verificar la API
            this.intervalId = setInterval(checkAPI, 5000); // Intenta cada 5 segundos
        },
        // Para limpiar el intervalo si es necesario
        clearPolling() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        },
    },
});
