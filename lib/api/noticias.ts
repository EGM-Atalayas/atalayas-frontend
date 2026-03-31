// lib/api/noticias.ts
import { API_URL, apiFetch } from "@/lib/api";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import { MOCK_NOTICIAS as mockData } from "../mocks/noticias.mock";

// ─── GET noticias ─────────────────────────────────────────────────────────────

export async function getNoticias(empresaId?: string): Promise<Noticia[]> {
  try {
    const url = empresaId
      ? `${API_URL}/anuncios?empresa_id=${empresaId}`
      : `${API_URL}/anuncios`;

    const res = await apiFetch(url);
    if (!res.ok) throw new Error("Backend error");
    return res.json();
  } catch {
    if (empresaId !== undefined) {
      return mockData.filter(
        (n) => n.empresa_id === empresaId || n.empresa_id === null
      );
    }
    return mockData;
  }
}

// ─── POST crear anuncio ───────────────────────────────────────────────────────

export async function crearNoticia(data: NoticiaInput): Promise<Noticia> {
  const res = await apiFetch(`${API_URL}/anuncios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al crear anuncio. Verifica tu conexión e intenta de nuevo.");
  }

  return res.json();
}

// ─── PUT editar anuncio ───────────────────────────────────────────────────────

export async function editarNoticia(id: string, data: Partial<NoticiaInput>): Promise<Noticia> {
  const res = await apiFetch(`${API_URL}/anuncios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al editar anuncio. Verifica tu conexión e intenta de nuevo.");
  }

  return res.json();
}

// ─── DELETE (desactivar) anuncio ──────────────────────────────────────────────

export async function desactivarNoticia(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/anuncios/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Error al desactivar anuncio. Verifica tu conexión e intenta de nuevo.");
  }
}
