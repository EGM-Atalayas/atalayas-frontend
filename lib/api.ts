// src/lib/api.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://atalayas-backend-production-4777.up.railway.app/api/v1";

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
