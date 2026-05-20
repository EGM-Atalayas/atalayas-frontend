import { apiFetch, API_URL } from "../api";
import type { Incidencia, IncidenciaInput } from "../types/incidencias";

async function parseApiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data.fieldErrors) return Object.values(data.fieldErrors as Record<string, string>).join(", ");
    if (data.message) return data.message;
  } catch { /* noop */ }
  return `Error del servidor (${res.status})`;
}

export async function getIncidencias(empresaId?: string | null): Promise<Incidencia[]> {
  const url = empresaId ? `${API_URL}/incidencias?empresaId=${empresaId}` : `${API_URL}/incidencias`;
  const res = await apiFetch(url);
  if (!res.ok) {
    const msg = await parseApiError(res);
    throw new Error(msg);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function crearIncidencia(data: IncidenciaInput): Promise<Incidencia> {
  const res = await apiFetch(`${API_URL}/incidencias`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await parseApiError(res);
    throw new Error(msg);
  }
  return res.json();
}

export async function cambiarEstadoIncidencia(incidenciaId: string, estado: string): Promise<Incidencia> {
  const res = await apiFetch(`${API_URL}/incidencias/${incidenciaId}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) {
    const msg = await parseApiError(res);
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteIncidencia(incidenciaId: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/incidencias/${incidenciaId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const msg = await parseApiError(res);
    throw new Error(msg);
  }
}
