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
