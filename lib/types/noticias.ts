// ── ANUNCIOS DE EMPRESA ───────────────────────────────────────────────────────
// Respuesta de GET /api/v1/anuncios
export interface Noticia {
  anuncioId:     string;
  titulo:        string;
  contenido:     string;
  esGlobal:      boolean;
  activo:        boolean;
  creadoPor:     string;
  empresaId:     string | null;
  imagenUrl?:    string | null;
  creadoEn:      string;
  actualizadoEn: string;
}

// Payload de POST/PUT /api/v1/anuncios
export interface NoticiaInput {
  titulo:     string;
  contenido:  string;
  esGlobal:   boolean;
  empresaId?: string | null;
  imagenUrl?: string | null;
}

// ── COMUNICADOS EGM ───────────────────────────────────────────────────────────
export type CategoriaComunicado = "Novedad" | "Aviso" | "Evento" | "General";

// Respuesta de GET /api/v1/comunicados
export interface Comunicado {
  comunicadoId:      string;
  titulo:            string;
  mensaje:           string;
  imagenUrl?:        string | null;
  categoria?:        CategoriaComunicado | string | null;
  destacado:         boolean;
  activo:            boolean;
  fechaPublicacion?: string | null;
  fechaExpiracion?:  string | null;
  creadoPor?:        string | null;
  actualizadoEn?:    string | null;
}

// Payload de POST/PUT /api/v1/comunicados
export interface ComunicadoInput {
  titulo:            string;
  mensaje:           string;
  imagenUrl?:        string | null;
  categoria:         CategoriaComunicado;
  destacado:         boolean;
  fechaPublicacion?: string | null;
  fechaExpiracion?:  string | null;
}
