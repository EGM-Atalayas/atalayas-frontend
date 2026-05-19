import { API_URL, apiFetch } from "../api";

/**
 * Evento de comunidad: visible para empleados de una empresa (o global EGM).
 * Esquema devuelto por GET /api/v1/comunidad/eventos
 */
export interface ComunidadEvento {
  eventoId:      string;
  empresaId:     string | null;
  creadoPor:     string | null;
  titulo:        string;
  descripcion:   string | null;
  esGlobal:      boolean;
  activo:        boolean;
  fechaInicio:   string;          // ISO datetime con timezone
  fechaFin:      string | null;
  /** Dirección o nombre del lugar (texto libre) */
  lugar?:        string | null;
  /** Coordenada para mapa (decimales) */
  latitud?:      number | null;
  longitud?:     number | null;
  /** URL pública de la imagen de portada (subida a Supabase) */
  imagenUrl?:    string | null;
  creadoEn:      string;
  actualizadoEn: string;
}

/**
 * Devuelve los eventos de comunidad visibles para el usuario.
 * El backend filtra por rol: empleado ve activos de su empresa + globales.
 */
export async function getEventosComunidad(): Promise<ComunidadEvento[]> {
  try {
    const res = await apiFetch(`${API_URL}/comunidad/eventos`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export interface ComunidadEventoInput {
  titulo:       string;
  descripcion?: string | null;
  fechaInicio:  string;          // ISO datetime
  fechaFin?:    string | null;
  esGlobal?:    boolean;         // solo aplica si quien crea es ROLE_ADMIN
  lugar?:       string | null;
  latitud?:     number | null;
  longitud?:    number | null;
  imagenUrl?:   string | null;
}

/**
 * Sube una imagen al bucket de Supabase y devuelve la URL pública.
 * Wrapper sobre el endpoint genérico POST /upload/imagen.
 */
export async function subirImagenEvento(file: File): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiFetch(`${API_URL}/upload/imagen`, { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Crea un nuevo evento de comunidad.
 * - ADMIN_EMPRESA: lo crea para su empresa (esGlobal se ignora)
 * - ADMIN (superadmin): puede crearlo global o por empresa
 */
export async function crearEventoComunidad(data: ComunidadEventoInput): Promise<ComunidadEvento> {
  const res = await apiFetch(`${API_URL}/comunidad/eventos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Error al crear el evento");
  }
  return res.json();
}

/**
 * Actualiza un evento existente. Mismas reglas de permisos que crear.
 */
export async function actualizarEventoComunidad(id: string, data: ComunidadEventoInput): Promise<ComunidadEvento> {
  const res = await apiFetch(`${API_URL}/comunidad/eventos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar el evento");
  return res.json();
}

/**
 * Desactiva (soft delete) un evento de comunidad.
 */
export async function desactivarEventoComunidad(id: string): Promise<ComunidadEvento> {
  const res = await apiFetch(`${API_URL}/comunidad/eventos/${id}/desactivar`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Error al desactivar el evento");
  return res.json();
}
