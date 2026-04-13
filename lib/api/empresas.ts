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

export async function actualizarEstadoEmpresa(id: string, estadoAEnviar: string): Promise<void> {
  const response = await apiFetch(`${API_URL}/empresas/${id}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nuevoEstado: estadoAEnviar }), 
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("🚨 RESPUESTA DEL BACKEND:", errorData);
    throw new Error(errorData.message || errorData.error || "Error al actualizar el estado en el servidor");
  }
}