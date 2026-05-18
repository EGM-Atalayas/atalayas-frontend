import { API_URL, apiFetch } from "../api";

export interface ModuloProgresoResponse {
  moduloId:              string;
  contenidosCompletados: number;
  totalContenidos:       number;
  porcentaje:            number;
  completado:            boolean;
  fechaInicio?:          string | null;
  fechaCompletado?:      string | null;
  actualizadoEn?:        string | null;
}

/**
 * Guarda (upsert monótono) el progreso del usuario en un módulo.
 * El backend nunca permite que el % baje y dispara la generación del
 * certificado cuando se alcanza el 100 %.
 */
export async function guardarProgresoModulo(
  moduloId: string,
  contenidosCompletados: number,
  totalContenidos: number,
): Promise<ModuloProgresoResponse | null> {
  try {
    const res = await apiFetch(`${API_URL}/modulos/${moduloId}/progreso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenidosCompletados, totalContenidos }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Devuelve todos los progresos del usuario autenticado. */
export async function getMisProgresosModulo(): Promise<ModuloProgresoResponse[]> {
  try {
    const res = await apiFetch(`${API_URL}/modulos/me/progreso`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/** Devuelve el progreso del usuario en un módulo concreto. */
export async function getMiProgresoModulo(moduloId: string): Promise<ModuloProgresoResponse | null> {
  try {
    const res = await apiFetch(`${API_URL}/modulos/${moduloId}/progreso/me`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
