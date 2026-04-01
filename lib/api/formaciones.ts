// lib/api/formaciones.ts
import { API_URL, apiFetch } from "@/lib/api";
import { Formacion } from "../types/formaciones";
import { MOCK_FORMACIONES as mockData } from "../mocks/formaciones.mock";

export async function getFormaciones(empresaId?: string): Promise<Formacion[]> {
  try {
    const url = empresaId
      ? `${API_URL}/formaciones?empresa_id=${empresaId}`
      : `${API_URL}/formaciones`;

    const res = await apiFetch(url);
    if (!res.ok) throw new Error("Backend error");
    return res.json();
  } catch {
    if (empresaId !== undefined) {
      return mockData.filter(
        (f) => f.empresa_id === empresaId || f.empresa_id === null
      );
    }
    return mockData;
  }
}

export async function crearFormacion(data: Partial<Formacion>): Promise<Formacion> {
  const res = await apiFetch(`${API_URL}/formaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) throw new Error("No se pudo crear la formación en el servidor");
  return res.json();
}

export async function editarFormacion(id: number, data: Partial<Formacion>): Promise<Formacion> {
  const res = await apiFetch(`${API_URL}/formaciones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("No se pudo editar la formación en el servidor");
  return res.json();
}

export async function desactivarFormacion(id: number): Promise<void> {
  const res = await apiFetch(`${API_URL}/formaciones/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("No se pudo eliminar la formación del servidor");
}
