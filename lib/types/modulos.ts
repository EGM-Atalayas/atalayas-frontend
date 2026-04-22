/**
 * Tipos del módulo formativo tal como los devuelve /api/v1/modulos
 * Reemplaza el tipo Formacion que usaba datos mock
 */

export type ModuloStatus = "completado" | "en progreso" | "pendiente";

// Valores que devuelve el backend en tipoModulo
export type ModuloTipo =
  | "IDENTIDAD"
  | "BASICA"
  | "ESPECIFICA"
  | "DESARROLLO"
  | "RECOMPENSAS"
  | "COMUNIDAD";

// Etiqueta legible para el frontend por cada tipo
export const MODULO_TIPO_LABEL: Record<ModuloTipo, string> = {
  IDENTIDAD:   "Identidad Corporativa",
  BASICA:      "Formación Básica",
  ESPECIFICA:  "Formación Específica",
  DESARROLLO:  "Desarrollo Profesional",
  RECOMPENSAS: "Recompensas y Ventajas",
  COMUNIDAD:   "Comunidad",
};

// Respuesta de GET /api/v1/modulos
export interface Modulo {
  moduloId: string;
  nombre: string;
  descripcion: string;
  tipoModulo: ModuloTipo;
  orden: number;
  activo: boolean;
  empresaId: string | null;
  esEspecializadoIa: boolean;
  idioma?: string;
  duracion?: string;
  audiencia?: string;
  departamentos?: string;
  testPreguntas?: string;
  imagenPortadaUrl?: string | null;
  tiposSalida?: string;
  scriptPodcast?: string | null;
  scriptVideo?: string | null;
  podcastAudioUrl?: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

// Respuesta de GET /api/v1/progreso/me
export interface ProgresoItem {
  registroId: string;
  usuarioId: string;
  contenidoId: string;
  empresaId: string;
  completado: boolean;
  fechaCompletado: string | null;
  tiempoSegundos: number;
  estado: ModuloStatus;
  actualizadoEn: string;
}

/**
 * Tipo enriquecido que combina Modulo + status derivado del progreso
 * Es lo que consumen los componentes de UI — compatible con el diseño actual
 */
export interface ModuloConProgreso extends Modulo {
  status: ModuloStatus;
}