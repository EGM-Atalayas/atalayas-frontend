// lib/api/noticias.ts
import { API_URL } from "@/lib/api";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import { MOCK_NOTICIAS as mockData } from "../mocks/noticias.mock";

const USE_MOCK = true; // ← cambia a false cuando el backend esté listo

// ─── GET noticias ─────────────────────────────────────────────────────────────

/**
 * Admin General: devuelve todas las noticias.
 * Admin Empresa: devuelve solo las de su empresa (filtra por empresa_id).
 */
export async function getNoticias(empresaId?: string): Promise<Noticia[]> {
  if (USE_MOCK) {
    if (empresaId !== undefined) {
      return mockData.filter(
        (n) => n.empresa_id === empresaId || n.empresa_id === null
      );
    }
    return mockData;
  }

  const url = empresaId
    ? `${API_URL}/anuncios?empresa_id=${empresaId}`
    : `${API_URL}/anuncios`;

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Error al obtener noticias");
  return res.json();
}

// ─── GET noticia por ID ───────────────────────────────────────────────────────

export async function getNoticiaById(id: number): Promise<Noticia> {
  if (USE_MOCK) {
    const noticia = mockData.find((n) => n.anuncio_id === id);
    if (!noticia) throw new Error("Noticia no encontrada");
    return noticia;
  }

  // TODO: conectar con backend
  const res = await fetch(`${API_URL}/anuncios/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Error al obtener la noticia");
  return res.json();
}

// ─── POST crear noticia ───────────────────────────────────────────────────────

export async function crearNoticia(data: NoticiaInput): Promise<Noticia> {
  if (USE_MOCK) {
    const nueva: Noticia = {
      anuncio_id: Date.now(),
      ...data,
      empresa_id: data.empresa_id ?? null,
      activo: true,
      creado_por: 1,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
    mockData.unshift(nueva);
    return nueva;
  }

  // TODO: conectar con backend
  const res = await fetch(`${API_URL}/anuncios`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear la noticia");
  return res.json();
}

// ─── PUT editar noticia ───────────────────────────────────────────────────────

export async function editarNoticia(id: number, data: Partial<NoticiaInput>): Promise<Noticia> {
  if (USE_MOCK) {
    const idx = mockData.findIndex((n) => n.anuncio_id === id);
    if (idx === -1) throw new Error("Noticia no encontrada");
    mockData[idx] = {
      ...mockData[idx],
      ...data,
      actualizado_en: new Date().toISOString(),
    };
    return mockData[idx];
  }

  // TODO: conectar con backend
  const res = await fetch(`${API_URL}/anuncios/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al editar la noticia");
  return res.json();
}

// ─── DELETE (desactivar) noticia ──────────────────────────────────────────────

export async function desactivarNoticia(id: number): Promise<void> {
  if (USE_MOCK) {
    const idx = mockData.findIndex((n) => n.anuncio_id === id);
    if (idx !== -1) mockData[idx].activo = false;
    return;
  }

  // TODO: conectar con backend
  const res = await fetch(`${API_URL}/anuncios/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al desactivar la noticia");
}