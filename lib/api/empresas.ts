// src/lib/api/empresas.ts
import { API_URL, apiFetch } from "../api";
import { EmpresaDB } from "@/components/pages/GestionEmpresas";

export interface SolicitudDetalle {
  empresaId: string;
  nombreEmpresa: string;
  cif: string;
  emailContacto: string;
  nombre?: string;
  apellidos?: string;
  emailAdmin?: string;
  fechaSolicitud?: string;
  estadoSolicitud?: string;
  emailEnviado?: boolean;
  [key: string]: any;
}

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

// Rechazar una solicitud de empresa pendiente (endpoint específico del backend)
export async function rechazarSolicitudEmpresa(id: string): Promise<void> {
  const response = await apiFetch(`${API_URL}/empresas/${id}/solicitud`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion: "rechazar" }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al rechazar la solicitud");
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

// Solicitudes pendientes con datos del admin provisional (endpoint dedicado)
export async function getSolicitudesPendientes(): Promise<SolicitudDetalle[]> {
  const response = await apiFetch(`${API_URL}/empresas/solicitudes`);
  if (!response.ok) {
    // Fallback: usar /empresas y filtrar client-side
    const all = await apiFetch(`${API_URL}/empresas`);
    if (!all.ok) throw new Error("Error al obtener solicitudes");
    const data: any[] = await all.json();
    return data.filter((e) => String(e.estadoSolicitud || "").toUpperCase() === "PENDIENTE");
  }
  return response.json();
}

// Aprobar solicitud de empresa
export async function aprobarSolicitudEmpresa(id: string): Promise<void> {
  const response = await apiFetch(`${API_URL}/empresas/${id}/solicitud`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion: "aprobar" }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al aprobar la solicitud");
  }
}

// Reenviar email de aprobación
export async function reenviarEmailAprobacion(id: string): Promise<void> {
  const response = await apiFetch(`${API_URL}/empresas/${id}/reenviar-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo: "aprobacion" }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al reenviar el email");
  }
}

// Obtener datos de una empresa por ID
export async function getEmpresaById(id: string): Promise<EmpresaDB> {
  const response = await apiFetch(`${API_URL}/empresas/${id}`);

  if (!response.ok) {
    throw new Error("Error al obtener los datos de la empresa");
  }

  return response.json();
}

// Actualizar datos de una empresa
export async function actualizarEmpresa(
  id: string,
  data: Partial<{
    nombreEmpresa: string;
    cif: string;
    emailContacto: string;
  }>
): Promise<EmpresaDB> {
  const response = await apiFetch(`${API_URL}/empresas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al actualizar la empresa");
  }

  return response.json();
}

// Subir logo de empresa (sube a upload/imagen y devuelve la URL pública)
// Nota: el backend no expone endpoint para persistir logoEmpresaUrl, se actualiza localmente en el AuthContext
export async function subirLogoEmpresa(id: string, file: File): Promise<{ logoEmpresaUrl: string }> {
  const fd = new FormData();
  fd.append("file", file);

  const uploadRes = await apiFetch(`${API_URL}/upload/imagen`, {
    method: "POST",
    body: fd,
  });

  if (!uploadRes.ok) {
    const errBody = await uploadRes.text().catch(() => "");
    throw new Error(`Error al subir la imagen del logo (HTTP ${uploadRes.status}): ${errBody}`);
  }

  const uploadData = await uploadRes.json();
  return { logoEmpresaUrl: uploadData.url as string };
}