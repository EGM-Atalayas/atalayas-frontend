// src/lib/api/empresas.ts
import { API_URL, apiFetch } from "../api";
import { EmpresaDB } from "@/components/pages/GestionEmpresas";

// Obtener todas las empresas
export async function getEmpresas(): Promise<EmpresaDB[]> {
  const response = await apiFetch(`${API_URL}/empresas`);
  
  if (!response.ok) {
    throw new Error("Error al obtener la lista de empresas");
  }
  
  return response.json();
}

// Actualizar el estado de una empresa (solo para cambios de solicitud: PENDIENTE/APROBADA/RECHAZADA)
export async function actualizarEstadoEmpresa(id: string, estadoAEnviar: string): Promise<void> {
  const estadoNormalizado = String(estadoAEnviar).toUpperCase();
  let estadoParaBackend = "PENDIENTE";

  if (estadoNormalizado === "APROBADA") estadoParaBackend = "APROBADA";
  else if (estadoNormalizado === "RECHAZADA") estadoParaBackend = "RECHAZADA";

  const response = await apiFetch(`${API_URL}/empresas/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nuevoEstado: estadoParaBackend }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al actualizar el estado");
  }
}

// Activar / desactivar una empresa aprobada (toggle de activo)
export async function toggleActivacionEmpresa(id: string): Promise<void> {
  const response = await apiFetch(`${API_URL}/empresas/${id}/activacion`, {
    method: "PATCH",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al cambiar la activación de la empresa");
  }
}