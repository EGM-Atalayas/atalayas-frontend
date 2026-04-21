// lib/api.ts
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://atalayas-backend-c25d.onrender.com/api/v1";

/**
 * Wrapper de fetch que incluye credentials: "include" (cookies) y además
 * envía el accessToken como Authorization: Bearer si está guardado en
 * localStorage — necesario para peticiones cross-domain (Vercel → Render).
 */
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options.headers,
    },
  });
};