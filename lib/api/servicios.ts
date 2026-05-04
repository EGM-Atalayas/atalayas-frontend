import { API_URL, apiFetch } from "../api";
import type { Servicio, ServicioInput } from "@/lib/types/servicios";

export async function getServicios(): Promise<Servicio[]> {
  const response = await apiFetch(`${API_URL}/servicios`);
  if (!response.ok) {
    throw new Error("Error al obtener los servicios");
  }
  return response.json();
}

export async function crearServicio(data: ServicioInput): Promise<Servicio> {
  const response = await apiFetch(`${API_URL}/servicios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Error al crear el servicio");
  }
  return response.json();
}

export async function editarServicio(id: string, data: ServicioInput): Promise<Servicio> {
  const response = await apiFetch(`${API_URL}/servicios/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Error al editar el servicio");
  }
  return response.json();
}

export async function toggleServicio(id: string): Promise<void> {
  const response = await apiFetch(`${API_URL}/servicios/${id}/toggle`, {
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error("Error al cambiar el estado del servicio");
  }
}

export async function eliminarServicio(id: string): Promise<void> {
  const response = await apiFetch(`${API_URL}/servicios/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Error al eliminar el servicio");
  }
}
