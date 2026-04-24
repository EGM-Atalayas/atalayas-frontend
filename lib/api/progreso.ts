import { apiFetch, API_URL } from "@/lib/api";
import type { ProgresoEmpleado, ActividadItem } from "@/lib/types/progreso";

export async function getProgresoEmpresa(empresaId: string): Promise<ProgresoEmpleado[]> {
  const res = await apiFetch(`${API_URL}/progreso/empresa/${empresaId}`);
  if (!res.ok) throw new Error("Error al cargar progreso");
  return res.json();
}

export async function getActividadReciente(limit = 5): Promise<ActividadItem[]> {
  const res = await apiFetch(`${API_URL}/dashboard/admin/actividad?limit=${limit}`);
  if (!res.ok) throw new Error("Error al cargar actividad reciente");
  return res.json();
}
