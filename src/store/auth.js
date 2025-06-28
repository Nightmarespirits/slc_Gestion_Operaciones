import { defineStore } from "pinia";
import axios from "axios"
import { decoderJWT, isTokenValid } from "../utils/jwtDecoder";
import { users, generateToken, decodeToken } from "../mockData/users";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: null,
        empresaObj: null
    }),
    getters:{

    },
    actions:{
        async login(companyName, companyPassword){
            try {
                // Demo mode: usar datos locales en lugar de API
                const user = users.find(u => u.companyName === companyName && u.companyPassword === companyPassword);
                
                if (!user) {
                    throw new Error('Credenciales inválidas');
                }
                
                const response = generateToken(user);
                
                this.token = response.token;
                this.empresaObj = decodeToken(response.token);
                
                localStorage.setItem('token', this.token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                
                return true;
                
            } catch (error) {
                console.error('Error de login:', error);
                return false;
            }
        },

        logout(){
            this.token = null
            this.empresaObj = null
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
            return true
        },

        checkcAuth(){
            const token = localStorage.getItem('token')

            if(token){
                // En modo demo, consideramos cualquier token válido
                this.token = token
                this.empresaObj = decodeToken(token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
                return true
            }

            return false
        },

        async comparePassword(password){
            try {
                // Modo demo: verificar si la contraseña es la misma que la demo
                if (password === "demo") {
                    return true;
                }
                return false;
            } catch (error) {
                console.error("Error en la validacion de contraseña useAuthStore", error)
                return false;
            }
        }
    }
})
