import { defineStore } from "pinia";
import axios from "axios"
import { decoderJWT, isTokenValid } from "../utils/jwtDecoder";

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
                const response = await axios.post( `${import.meta.env.VITE_API_URL}/auth/login`,{ companyName, companyPassword})

                this.token = response.data.token
                this.empresaObj = decoderJWT(response.data.token)

                localStorage.setItem('token', this.token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

                return true
                
            } catch (error) {
                console.error('Error de login:', error)
                return false
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

            if(token && isTokenValid(token)){
                this.token = token
                this.empresaObj = decoderJWT(token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
                return true
            }

            return false
        },

        async comparePassword(password){
            try {
                await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
                     companyName: this.empresaObj.nombreEmpresa, 
                     companyPassword: password
                    })
                return true;
            } catch (error) {
                console.error("Error en la validacion de contraseña useAuthStore", error)
                return false;
            }
        }
    }
})
