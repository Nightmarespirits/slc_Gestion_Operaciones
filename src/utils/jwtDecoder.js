import { jwtDecode } from "jwt-decode";

//Se ve un poco innesesario
export const decoderJWT = (token) => {
    try {
        const decoded = jwtDecode(token)
        return{
            "id": decoded.companyId,
            "nombreLegal": decoded.nombreLegal,
            "ruc": decoded.ruc,
            "nombreEmpresa" : decoded.companyName,
            "planes": decoded.plan
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
