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
  creado_por: number;       // usuario_id del creador
  empresa_id: number | null; // null = noticia global (Admin General)
  creado_en: string;        // ISO date
  actualizado_en: string;   // ISO date
}

export interface NoticiaInput {
  titulo: string;
  cuerpo: string;
  tag: TagNoticia;
  visible_invitados: boolean;
  empresa_id?: number | null;
}