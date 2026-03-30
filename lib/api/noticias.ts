// lib/api/noticias.ts
import { API_URL } from "@/lib/api";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import { MOCK_NOTICIAS as mockData } from "../mocks/noticias.mock";

// ─── GET noticias ─────────────────────────────────────────────────────────────

/**
 * Admin General: devuelve todas las noticias.
 * Admin Empresa: devuelve solo las de su empresa (filtra por empresa_id).
 * Intenta backend primero; si falla, usa mock data solo para lectura.
 */
export async function getNoticias(empresaId?: string): Promise<Noticia[]> {
  try {
    const url = empresaId
      ? `${API_URL}/anuncios?empresa_id=${empresaId}`
      : `${API_URL}/anuncios`;

    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Backend error");
    return res.json();
  } catch {
    // Fallback a mock data solo para lectura
    if (empresaId !== undefined) {
      return mockData.filter(
        (n) => n.empresa_id === empresaId || n.empresa_id === null
      );
    }
    return mockData;
  }
}

// ─── GET noticia por ID ───────────────────────────────────────────────────────

export async function getNoticiaById(id: number): Promise<Noticia> {
  try {
    const res = await fetch(`${API_URL}/anuncios/${id}`, { credentials: "include" });
    if (!res.ok) throw new Error("Backend error");
    return res.json();
  } catch {
    const noticia = mockData.find((n) => n.anuncio_id === id);
    if (!noticia) throw new Error("Noticia no encontrada");
    return noticia;
  }
}

// ─── POST crear noticia ───────────────────────────────────────────────────────

export async function crearNoticia(data: NoticiaInput): Promise<Noticia> {
  // Siempre intenta guardar en backend (no fallback a mock)
  const res = await fetch(`${API_URL}/anuncios`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al crear anuncio. Verifica tu conexión e intenta de nuevo.");
  }

  return res.json();
}

// ─── PUT editar noticia ───────────────────────────────────────────────────────

export async function editarNoticia(id: number, data: Partial<NoticiaInput>): Promise<Noticia> {
  // Siempre intenta guardar en backend (no fallback a mock)
  const res = await fetch(`${API_URL}/anuncios/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al editar anuncio. Verifica tu conexión e intenta de nuevo.");
  }

  return res.json();
}

// ─── DELETE (desactivar) noticia ──────────────────────────────────────────────

export async function desactivarNoticia(id: number): Promise<void> {
  // Siempre intenta eliminar en backend (no fallback a mock)
  const res = await fetch(`${API_URL}/anuncios/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Error al desactivar anuncio. Verifica tu conexión e intenta de nuevo.");
  }
}
