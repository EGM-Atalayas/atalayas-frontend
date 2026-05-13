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
