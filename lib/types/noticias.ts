// lib/types/noticias.ts

export type TagNoticia =
  | "Evento"
  | "Formación"
  | "Ventajas"
  | "Comunidad"
  | "Institucional";

export interface Noticia {
  anuncio_id: number;
  titulo: string;
  cuerpo: string;
  tag: TagNoticia;
  visible_invitados: boolean;
  activo: boolean;
  creado_por: number;
  empresa_id: string | null; // ← cambiado a string
  creado_en: string;
  actualizado_en: string;
}

export interface NoticiaInput {
  titulo: string;
  cuerpo: string;
  tag: TagNoticia;
  visible_invitados: boolean;
  empresa_id?: string | null; // ← cambiado a string
}