// lib/types/noticias.ts

export interface Noticia {
  anuncio_id: string;
  titulo: string;
  contenido: string;
  es_global: boolean;
  activo: boolean;
  creado_por: string;
  empresa_id: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface NoticiaInput {
  titulo: string;
  contenido: string;
  es_global: boolean;
  empresa_id?: string | null;
}
