// ── ANUNCIOS DE EMPRESA ───────────────────────────────────────────────────────
export interface Noticia {
  anuncioId:      string;
  titulo:         string;
  contenido:      string;
  esGlobal:       boolean;
  activo:         boolean;
  creadoPor:      string;
  empresaId:      string | null;
  imagenUrl?:     string | null;
  creadoEn:       string;
  actualizadoEn:  string;
  // Campos nuevos
  enlaceUrl?:     string | null;
  enlaceTexto?:   string | null;
  videoUrl?:      string | null;
  adjuntoUrl?:    string | null;
  adjuntoNombre?: string | null;
  estado?:        string | null;   // 'publicado' | 'borrador'
  fijado?:        boolean;
  vistas?:        number;
}

export interface NoticiaInput {
  titulo:        string;
  contenido:     string;
  esGlobal:      boolean;
  empresaId?:    string | null;
  imagenUrl?:    string | null;
  // Campos nuevos
  enlaceUrl?:     string | null;
  enlaceTexto?:   string | null;
  videoUrl?:      string | null;
  adjuntoUrl?:    string | null;
  adjuntoNombre?: string | null;
  estado?:        string;
  fijado?:        boolean;
}

// ── COMUNICADOS EGM ───────────────────────────────────────────────────────────
export type CategoriaComunicado = "Novedad" | "Aviso" | "Evento" | "General";

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
  // Campos nuevos
  enlaceUrl?:     string | null;
  enlaceTexto?:   string | null;
  videoUrl?:      string | null;
  adjuntoUrl?:    string | null;
  adjuntoNombre?: string | null;
  estado?:        string | null;   // 'publicado' | 'borrador'
  vistas?:        number;
}

export interface ComunicadoInput {
  titulo:            string;
  mensaje:           string;
  imagenUrl?:        string | null;
  categoria:         CategoriaComunicado;
  destacado:         boolean;
  fechaPublicacion?: string | null;
  fechaExpiracion?:  string | null;
  // Campos nuevos
  enlaceUrl?:     string | null;
  enlaceTexto?:   string | null;
  videoUrl?:      string | null;
  adjuntoUrl?:    string | null;
  adjuntoNombre?: string | null;
  estado?:        string;
}
