import { jwtDecode } from "jwt-decode";

export const decoderJWT = (token) => {
    try {
        const decoded = jwtDecode(token)
        return{
            "company" : decoded.companyName
        }
    } catch (error) {
        return null;
    }
}

export const isTokenValid = (token) => {
    try {
        const decoded = jwtDecode(token);
        return decoded.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};
