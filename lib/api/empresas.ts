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

// Actualizar el estado de una empresa
export async function actualizarEstadoEmpresa(id: string, estadoAEnviar: string): Promise<void> {
  
  // 1. EL TRADUCTOR: Convertimos el idioma del frontend al idioma de César (Enum estricto)
  let estadoParaCesar = "PENDIENTE"; // Valor por defecto seguro
  
  // Pasamos lo que llegue a mayúsculas por seguridad ("activa" -> "ACTIVA")
  const estadoNormalizado = String(estadoAEnviar).toUpperCase();

  if (estadoNormalizado === "ACTIVA" || estadoNormalizado === "APROBADA" || estadoNormalizado === "TRUE") {
    estadoParaCesar = "APROBADA";
  } else if (estadoNormalizado === "INACTIVA" || estadoNormalizado === "RECHAZADA" || estadoNormalizado === "FALSE") {
    estadoParaCesar = "RECHAZADA";
  } else {
    estadoParaCesar = "PENDIENTE";
  }

  // 2. EL ENVÍO: Mandamos el paquete exacto que no rompe el servidor
  const response = await apiFetch(`${API_URL}/empresas/${id}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nuevoEstado: estadoParaCesar }), 
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("🚨 RESPUESTA DEL BACKEND:", errorData);
    throw new Error(errorData.message || errorData.error || "Error al actualizar el estado en el servidor");
  }
}