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

// Cambiar estado de una empresa (Activar/Desactivar)
export async function actualizarEstadoEmpresa(id: string, nuevoEstado: boolean): Promise<void> {
  const response = await apiFetch(`${API_URL}/empresas/${id}/estado`, {
    method: "PATCH", // O PUT, dependiendo de cómo lo hayas definido en tu backend
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ activo: nuevoEstado }),
  });

  if (!response.ok) {
    throw new Error("Error al cambiar el estado de la empresa");
  }
}