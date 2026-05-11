import { API_URL, apiFetch } from "../api";
import type { Servicio, ServicioInput, CategoriaServicio } from "@/lib/types/servicios";

export async function getServicios(categoria?: CategoriaServicio): Promise<Servicio[]> {
  const url = categoria
    ? `${API_URL}/servicios?categoria=${categoria}`
    : `${API_URL}/servicios`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Error al obtener los servicios");
  return res.json();
}

export async function crearServicio(data: ServicioInput): Promise<Servicio> {
  const res = await apiFetch(`${API_URL}/servicios`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el servicio");
  return res.json();
}

export async function editarServicio(id: string, data: ServicioInput): Promise<Servicio> {
  const res = await apiFetch(`${API_URL}/servicios/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar el servicio");
  return res.json();
}

export async function desactivarServicio(id: string): Promise<Servicio> {
  const res = await apiFetch(`${API_URL}/servicios/${id}/desactivar`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Error al desactivar el servicio");
  return res.json();
}
