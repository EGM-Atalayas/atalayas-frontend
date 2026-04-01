// Respuesta de GET /api/v1/anuncios — camelCase como devuelve el backend
export interface Noticia {
  anuncioId: string;
  titulo: string;
  mensaje: string;
  esGlobal: boolean;
  activo: boolean;
  creadoPor: string;
  empresaId: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

// Payload de POST /api/v1/anuncios
export interface NoticiaInput {
  titulo: string;
  mensaje: string;
  esGlobal: boolean;
  empresaId?: string | null;
} 