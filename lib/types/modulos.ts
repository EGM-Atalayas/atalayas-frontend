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
  | "COMUNIDAD"
  | "CUMPLIMIENTO"
  | "LIDERAZGO"
  | "TECNICO"
  | "SOFT_SKILLS"
  | "ONBOARDING"
  | "GENERAL"
  | "ESPECIALIZADO"
  | "ESPECIALIZADO_IA"
  // Variantes largas que devuelve el backend Java
  | "IDENTIDAD_CORPORATIVA"
  | "FORMACION_BASICA"
  | "FORMACION_ESPECIFICA"
  | "DESARROLLO_PROFESIONAL"
  | "RECOMPENSAS_VENTAJAS";

// Mapeo de valores del frontend a los que espera el backend (Java Enum)
export const MODULO_TIPO_TO_BACKEND: Record<string, string> = {
  IDENTIDAD: "IDENTIDAD_CORPORATIVA",
  BASICA: "FORMACION_BASICA",
  ESPECIFICA: "FORMACION_ESPECIFICA",
  DESARROLLO: "DESARROLLO_PROFESIONAL",
  RECOMPENSAS: "RECOMPENSAS_VENTAJAS",
};

export function mapTipoToBackend(value: string): string {
  return MODULO_TIPO_TO_BACKEND[value] ?? value;
}

// Etiqueta legible para el frontend por cada tipo
export const MODULO_TIPO_LABEL: Record<ModuloTipo, string> = {
  // Claves cortas (frontend)
  IDENTIDAD:              "Identidad Corporativa",
  BASICA:                 "Formación Básica",
  ESPECIFICA:             "Formación Específica",
  DESARROLLO:             "Desarrollo Profesional",
  RECOMPENSAS:            "Recompensas y Ventajas",
  COMUNIDAD:              "Comunidad",
  CUMPLIMIENTO:           "Cumplimiento",
  LIDERAZGO:              "Liderazgo",
  TECNICO:                "Técnico",
  SOFT_SKILLS:            "Soft Skills",
  ONBOARDING:             "Onboarding",
  GENERAL:                "General",
  ESPECIALIZADO:          "Especializado",
  ESPECIALIZADO_IA:       "Especializado IA",
  // Variantes largas del backend Java (mismo label)
  IDENTIDAD_CORPORATIVA:  "Identidad Corporativa",
  FORMACION_BASICA:       "Formación Básica",
  FORMACION_ESPECIFICA:   "Formación Específica",
  DESARROLLO_PROFESIONAL: "Desarrollo Profesional",
  RECOMPENSAS_VENTAJAS:   "Recompensas y Ventajas",
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
  contenidoMarkdown?: string | null;
  scriptPodcast?: string | null;
  scriptVideo?: string | null;
  podcastAudioUrl?: string | null;
  adjuntoUrl?: string | null;
  adjuntoNombre?: string | null;
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