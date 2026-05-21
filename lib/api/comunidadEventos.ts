import { API_URL, apiFetch } from "../api";

export interface ComunidadEvento {
  eventoId: string;
  titulo: string;
  descripcion?: string;
  fechaInicio: string; // OffsetDateTime ISO
  fechaFin?: string;
  esGlobal: boolean;
  activo: boolean;
  empresaId?: string;
  nombreEmpresa?: string;
  creadoEn: string;
}

export interface ComunidadEventoInput {
  titulo: string;
  fechaInicio: string; // ISO OffsetDateTime
  fechaFin?: string;
  esGlobal?: boolean;
  descripcion?: string;
}

export async function getComunidadEventos(): Promise<ComunidadEvento[]> {
  const res = await apiFetch(`${API_URL}/comunidad/eventos`);
  if (!res.ok) throw new Error("Error al obtener los eventos de comunidad");
  return res.json();
}

export async function getComunidadEvento(id: string): Promise<ComunidadEvento> {
  const res = await apiFetch(`${API_URL}/comunidad/eventos/${id}`);
  if (!res.ok) throw new Error("Error al obtener el evento");
  return res.json();
}

export async function crearComunidadEvento(data: ComunidadEventoInput): Promise<ComunidadEvento> {
  const res = await apiFetch(`${API_URL}/comunidad/eventos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el evento de comunidad");
  return res.json();
}

export async function editarComunidadEvento(id: string, data: ComunidadEventoInput): Promise<ComunidadEvento> {
  const res = await apiFetch(`${API_URL}/comunidad/eventos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar el evento de comunidad");
  return res.json();
}

export async function desactivarComunidadEvento(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/comunidad/eventos/${id}/desactivar`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Error al desactivar el evento de comunidad");
}

