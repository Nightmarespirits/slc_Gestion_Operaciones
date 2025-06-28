export const users = [
  {
    companyName: "demo",
    companyPassword: "demo",
    id: "1",
    token: "demo_token_12345",
    nombreEmpresa: "Demo Company",
    role: "admin"
  }
];

export function generateToken(user) {
  // En una aplicación real, esto sería un JWT
  return {
    token: `demo_token_${Date.now()}`
  };
}

export function decodeToken(token) {
  // Simular la decodificación de un token
  return {
    id: "1",
    nombreEmpresa: "Demo Company",
    role: "admin"
  };
}