import { apiFetch, API_URL } from "@/lib/api";
import type { ProgresoEmpleado } from "@/lib/types/progreso";

export async function getProgresoEmpresa(empresaId: string): Promise<ProgresoEmpleado[]> {
  const res = await apiFetch(`${API_URL}/progreso/empresa/${empresaId}`);
  if (!res.ok) throw new Error("Error al cargar progreso");
  return res.json();
}