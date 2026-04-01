import { API_URL, apiFetch } from "@/lib/api";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";


// ── GET /api/v1/anuncios ──────────────────────────────────────────────────────
/**
 * Devuelve los anuncios visibles para el usuario autenticado
 * El backend filtra por empresa y rol automáticamente
 * empresaId es opcional - si no se pasa devuelve todos los del usuario
 */
export async function getNoticias(empresaId?: string): Promise<Noticia[]> {
  const url = empresaId
    ? `${API_URL}/anuncios?empresaId=${empresaId}`
    : `${API_URL}/anuncios`;

  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Error al cargar anuncios");
  return res.json();
}


// ── POST /api/v1/anuncios ─────────────────────────────────────────────────────

export async function crearNoticia(data: NoticiaInput): Promise<Noticia> {
  const res = await apiFetch(`${API_URL}/anuncios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear anuncio");
  return res.json();
}


// ── PUT /api/v1/anuncios/{id} ─────────────────────────────────────────────────

export async function editarNoticia(
  id: string,
  data: Partial<NoticiaInput>
): Promise<Noticia> {
  const res = await apiFetch(`${API_URL}/anuncios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar anuncio");
  return res.json();
}


// ── PATCH /api/v1/anuncios/{id}/desactivar ────────────────────────────────────

export async function desactivarNoticia(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/anuncios/${id}/desactivar`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Error al desactivar anuncio");
}