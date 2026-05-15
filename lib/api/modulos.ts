import { API_URL, apiFetch } from "@/lib/api";
import type { Modulo, ModuloConProgreso, ProgresoItem } from "@/lib/types/modulos";


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
  // Llamadas en paralelo para minimizar tiempo de carga
  const [modulos, progreso] = await Promise.all([
    getModulos(empresaId),
    getMiProgreso().catch(() => [] as ProgresoItem[]), // si falla el progreso no bloqueamos
  ]);


  // Índice rápido: moduloId - mejor estado derivado de sus contenidos
  // Por ahora agrupamos por empresaId como aproximación hasta tener endpoint de módulo
  // El estado se resuelve así: COMPLETADO > EN_PROGRESO > PENDIENTE
  const progresoMap = new Map<string, ProgresoItem[]>();
  for (const p of progreso) {
    const key = p.empresaId;
    if (!progresoMap.has(key)) progresoMap.set(key, []);
    progresoMap.get(key)!.push(p);
  }

  return modulos.map((modulo): ModuloConProgreso => {
    // Buscamos registros de progreso que correspondan a este módulo
    // Hasta tener moduloId en ProgresoItem, usamos empresaId como proxy
    const registros = modulo.empresaId
      ? (progresoMap.get(modulo.empresaId) ?? [])
      : [];

    let status: ModuloConProgreso["status"] = "pendiente";

    if (registros.length > 0) {
      const hayCompletado = registros.some((r) => r.completado);
      const hayEnProgreso = registros.some((r) => r.tiempoSegundos > 0 && !r.completado);
      if (hayCompletado) status = "completado";
      else if (hayEnProgreso) status = "en progreso";
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