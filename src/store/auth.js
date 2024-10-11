import { defineStore } from "pinia";
import axios from "axios"
import { decoderJWT, isTokenValid } from "../utils/jwtDecoder";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: null,
        company: null
    }),
    getters:{
        isAuthenticated: (state) => !!state.token && isTokenValid(state.token),
        companyLegalname: (state) => state.company ? `${state.company.nombreLegal}`: 'No Definido',
        companyPlanes: (state) => state.company? state.company.planes : ['basic'],
        companyObj: (state) => state.company

    },
    actions:{
        async login(companyName, companyPassword){
            try {
                const response = await axios.post('http://localhost:5000/auth/login',{ companyName, companyPassword})

                this.token = response.data.token
                this.company = decoderJWT(response.data.token)

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
            this.company = null
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
            return true
        },

        checkcAuth(){
            const token = localStorage.getItem('token')

            if(token && isTokenValid(token)){
                this.token = token
                this.company = decoderJWT(token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
                return true
            }

            return false
        }

    }
})
