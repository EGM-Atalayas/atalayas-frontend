import { API_URL, apiFetch } from "@/lib/api";
import { getMisProgresosModulo } from "@/lib/api/moduloProgreso";
import type { Modulo, ModuloConProgreso, ProgresoItem } from "@/lib/types/modulos";
import type { ModuloProgresoResponse } from "@/lib/api/moduloProgreso";


// ── GET /api/v1/modulos ───────────────────────────────────────────────────────
/**
 * Devuelve los módulos visibles para el usuario autenticado
 * El backend ya aplica el filtro por empresa y rol.
 * @param empresaId opcional — si se pasa, filtra client-side para mantener solo módulos
 * de la empresa (empresaId === empresaId) o globales (empresaId === null).
 */
export async function getModulos(empresaId?: string | null): Promise<Modulo[]> {
  const url = empresaId
    ? `${API_URL}/modulos?empresaId=${empresaId}`
    : `${API_URL}/modulos`;
  const res = await apiFetch(url);

  if (!res.ok) throw new Error("Error al cargar módulos");
  const modulos: Modulo[] = await res.json();
  if (!empresaId) return modulos;
  return modulos.filter((m) => m.empresaId === null || m.empresaId === empresaId);
}



// ── GET /api/v1/progreso/me ───────────────────────────────────────────────────
/**
 * Devuelve el progreso del usuario autenticado sobre todos sus contenidos
 */
export async function getMiProgreso(): Promise<ProgresoItem[]> {
  const res = await apiFetch(`${API_URL}/progreso/me`);
  if (!res.ok) throw new Error("Error al cargar progreso");
  return res.json();
}


// ── MÓDULOS + PROGRESO COMBINADOS ─────────────────────────────────────────────
/**
 * Combina módulos con su estado de progreso derivado
 *
 * La lógica de estado es:
 *   - Si algún contenido del módulo está completado → "en progreso" o "completado"
 *   - El backend no devuelve progreso por módulo sino por contenido,
 *     así que usamos una heurística: si el usuario tiene algún registro
 *     de progreso relacionado con este módulo -"en progreso"
 *   - Sin datos de progreso - "pendiente"
 */

export async function getModulosConProgreso(empresaId?: string | null): Promise<ModuloConProgreso[]> {
  const [modulos, progresosModulo] = await Promise.all([
    getModulos(empresaId),
    getMisProgresosModulo(),
  ]);

  const progresoMap = new Map<string, ModuloProgresoResponse>();
  for (const p of progresosModulo) {
    progresoMap.set(p.moduloId, p);
  }

  return modulos.map((modulo): ModuloConProgreso => {
    const prog = progresoMap.get(modulo.moduloId);

    let status: ModuloConProgreso["status"] = "pendiente";
    if (prog) {
      if (prog.completado) status = "completado";
      else if (prog.porcentaje > 0) status = "en progreso";
    }

    return { ...modulo, status };
  });
}


// ── POST /api/v1/progreso ─────────────────────────────────────────────────────
/**
 * Registra o actualiza el progreso de un contenido concreto
 * Se llama cuando el empleado abre o completa un contenido
 */
export async function registrarProgreso(payload: {
  usuarioId: string;
  contenidoId: string;
  empresaId: string;
  tiempoSegundos: number;
  completado: boolean;
}): Promise<ProgresoItem> {
  const res = await apiFetch(`${API_URL}/progreso`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error al registrar progreso");
  return res.json();
}