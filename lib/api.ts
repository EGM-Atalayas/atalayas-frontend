// src/lib/api.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://atalayas-backend-production-4777.up.railway.app/api/v1";

console.log("API_URL:", API_URL); // ← añade esto