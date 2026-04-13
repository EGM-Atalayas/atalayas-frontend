// lib/api.ts
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://atalayas-backend-production-4777.up.railway.app/api/v1";

/**
 * Wrapper de fetch que incluye credentials: "include" para enviar
 * automáticamente la cookie HttpOnly de autenticación en cada petición
 * No necesita token manual, el backend lo lee de la cookie
 */
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    // ¡ESTA ES LA LÍNEA QUE SALVARÁ TU VIDA!
    credentials: "include", 
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};