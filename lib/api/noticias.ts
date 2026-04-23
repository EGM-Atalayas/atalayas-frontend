import { API_URL, apiFetch } from "@/lib/api";
import type { Noticia, NoticiaInput, Comunicado, ComunicadoInput } from "@/lib/types/noticias";

// ── ANUNCIOS (empresa) ────────────────────────────────────────────────────────

export async function getNoticias(empresaId?: string | null): Promise<Noticia[]> {
  const url = empresaId
    ? `${API_URL}/anuncios?empresaId=${empresaId}`
    : `${API_URL}/anuncios`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Error al cargar anuncios");
  return res.json();
}

export async function crearNoticia(data: NoticiaInput): Promise<Noticia> {
  const res = await apiFetch(`${API_URL}/anuncios`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear anuncio");
  return res.json();
}

export async function editarNoticia(id: string, data: Partial<NoticiaInput>): Promise<Noticia> {
  const res = await apiFetch(`${API_URL}/anuncios/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar anuncio");
  return res.json();
}

export async function desactivarNoticia(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/anuncios/${id}/desactivar`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al desactivar anuncio");
}

// ── COMUNICADOS EGM ───────────────────────────────────────────────────────────

export async function getComunicados(): Promise<Comunicado[]> {
  const res = await apiFetch(`${API_URL}/comunicados`);
  if (!res.ok) throw new Error("Error al cargar comunicados");
  return res.json();
}

export async function crearComunicado(data: ComunicadoInput): Promise<Comunicado> {
  const res = await apiFetch(`${API_URL}/comunicados`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear comunicado");
  return res.json();
}

export async function editarComunicado(id: string, data: Partial<ComunicadoInput>): Promise<Comunicado> {
  const res = await apiFetch(`${API_URL}/comunicados/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar comunicado");
  return res.json();
}

export async function desactivarComunicado(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/comunicados/${id}/desactivar`, { method: "PATCH" });
  if (!res.ok) throw new Error("Error al desactivar comunicado");
}
