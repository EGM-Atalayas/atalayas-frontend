import { API_URL, apiFetch } from "../api";
import type { Documento, AsignacionDetalle, SubirDocumentoInput } from "../types/documentos";

// ── ADMIN ──────────────────────────────────────────────────────────────────

export async function subirDocumento(input: SubirDocumentoInput): Promise<Documento> {
  const fd = new FormData();
  fd.append("file", input.file);
  fd.append("titulo", input.titulo);
  if (input.descripcion) fd.append("descripcion", input.descripcion);
  fd.append("tipo", input.tipo);
  fd.append("requiereFirma", String(input.requiereFirma));
  fd.append("asignarATodos", String(input.asignarATodos));
  fd.append("notificar", String(input.notificar));
  for (const id of input.usuariosIds ?? []) fd.append("usuariosIds", id);
  for (const d of input.departamentos ?? []) fd.append("departamentos", d);

  const res = await apiFetch(`${API_URL}/documentos`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo subir el documento");
  }
  return res.json();
}

export async function listarDocumentosEmpresa(): Promise<Documento[]> {
  const res = await apiFetch(`${API_URL}/documentos`);
  if (!res.ok) throw new Error("Error al cargar documentos");
  return res.json();
}

export async function listarAsignaciones(documentoId: string): Promise<AsignacionDetalle[]> {
  const res = await apiFetch(`${API_URL}/documentos/${documentoId}/asignaciones`);
  if (!res.ok) throw new Error("Error al cargar asignaciones");
  return res.json();
}

export async function desasignarDocumento(
  documentoId: string,
  asignacionIds: string[]
): Promise<void> {
  const res = await apiFetch(`${API_URL}/documentos/${documentoId}/asignaciones`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ asignacionIds }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo desasignar");
  }
}

export async function asignarDocumento(
  documentoId: string,
  data: { asignarATodos: boolean; usuariosIds?: string[]; departamentos?: string[]; notificar: boolean }
): Promise<void> {
  const res = await apiFetch(`${API_URL}/documentos/${documentoId}/asignaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo asignar el documento");
  }
}

export async function editarDocumento(
  documentoId: string,
  data: { titulo: string; descripcion?: string | null; tipo: string; requiereFirma: boolean }
): Promise<Documento> {
  const res = await apiFetch(`${API_URL}/documentos/${documentoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo editar el documento");
  }
  return res.json();
}

export async function desactivarDocumento(documentoId: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/documentos/${documentoId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar documento");
}

// ── EMPLEADO ───────────────────────────────────────────────────────────────

export async function listarMisDocumentos(): Promise<Documento[]> {
  const res = await apiFetch(`${API_URL}/documentos/me`);
  if (!res.ok) throw new Error("Error al cargar tus documentos");
  return res.json();
}

export async function marcarDocumentoVisto(documentoId: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/documentos/me/${documentoId}/visto`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Error al marcar visto");
}

/**
 * Devuelve la URL del certificado auto-generado (guardado en Supabase) para un módulo.
 * El frontend la usa para priorizar la versión persistida sobre la generada localmente con jsPDF.
 * Devuelve null si aún no se ha generado (módulo no completado o proceso async pendiente).
 */
/**
 * Envía la firma (PNG en base64) al backend para que la estampe sobre el PDF.
 * El backend devuelve la URL del nuevo PDF firmado.
 */
export async function firmarDocumento(documentoId: string, firmaBase64: string): Promise<{ firmaUrl: string }> {
  const res = await apiFetch(`${API_URL}/documentos/me/${documentoId}/firmar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firmaBase64 }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo procesar la firma");
  }
  return res.json();
}

/**
 * Llama al backend para generar el certificado cuando el empleado completa un módulo.
 * Si ya existe lo devuelve directamente. Devuelve la URL del PDF en Supabase.
 */
export async function generarCertificadoModulo(moduloId: string): Promise<string | null> {
  try {
    const res = await apiFetch(`${API_URL}/documentos/me/certificado/${moduloId}`, {
      method: "POST",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

export async function obtenerCertificadoModulo(moduloId: string): Promise<string | null> {
  try {
    const res = await apiFetch(`${API_URL}/documentos/me/certificado/${moduloId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}
