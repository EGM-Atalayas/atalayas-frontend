import { API_URL, apiFetch } from "../api";
import type { Evento, EventoInput } from "@/lib/types/eventos";

export async function getEventos(): Promise<Evento[]> {
  const res = await apiFetch(`${API_URL}/eventos`);
  if (!res.ok) throw new Error("Error al obtener los eventos");
  return res.json();
}

export async function crearEvento(data: EventoInput): Promise<Evento> {
  const res = await apiFetch(`${API_URL}/eventos`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el evento");
  return res.json();
}

export async function editarEvento(id: string, data: EventoInput): Promise<Evento> {
  const res = await apiFetch(`${API_URL}/eventos/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar el evento");
  return res.json();
}

export async function desactivarEvento(id: string): Promise<Evento> {
  const res = await apiFetch(`${API_URL}/eventos/${id}/desactivar`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Error al desactivar el evento");
  return res.json();
}
