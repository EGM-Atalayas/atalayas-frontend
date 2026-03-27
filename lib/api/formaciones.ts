// lib/api/formaciones.ts
import { API_URL } from "@/lib/api";
import { Formacion } from "../types/formaciones";
import { MOCK_FORMACIONES } from "../mocks/formaciones.mock";

const USE_MOCK = true;

export async function getFormaciones(empresaId?: string): Promise<Formacion[]> {
  if (USE_MOCK) {
    if (empresaId) {
      return MOCK_FORMACIONES.filter(f => f.empresa_id === empresaId || f.empresa_id === null);
    }
    return MOCK_FORMACIONES;
  }

  const url = empresaId 
    ? `${API_URL}/formaciones?empresa_id=${empresaId}` 
    : `${API_URL}/formaciones`;

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Error fetching formaciones");
  return res.json();
}
