import { API_URL, apiFetch } from "../api";
import type { Beneficio, BeneficioInput } from "@/lib/types/beneficios";

export async function getBeneficios(): Promise<Beneficio[]> {
  const res = await apiFetch(`${API_URL}/beneficios`);
  if (!res.ok) throw new Error("Error al obtener los beneficios");
  return res.json();
}

export async function crearBeneficio(data: BeneficioInput): Promise<Beneficio> {
  const res = await apiFetch(`${API_URL}/beneficios`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el beneficio");
  return res.json();
}

export async function editarBeneficio(id: string, data: BeneficioInput): Promise<Beneficio> {
  const res = await apiFetch(`${API_URL}/beneficios/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar el beneficio");
  return res.json();
}

export async function desactivarBeneficio(id: string): Promise<Beneficio> {
  const res = await apiFetch(`${API_URL}/beneficios/${id}/desactivar`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Error al desactivar el beneficio");
  return res.json();
}
