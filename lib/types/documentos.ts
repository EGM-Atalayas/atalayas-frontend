// Tipos para gestión documental

export type TipoDocumento =
  | "NOMINA"
  | "CONTRATO"
  | "CERTIFICADO"
  | "POLITICA"
  | "OTRO";

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  NOMINA:      "Nómina",
  CONTRATO:    "Contrato",
  CERTIFICADO: "Certificado",
  POLITICA:    "Política",
  OTRO:        "Otro",
};

export const TIPO_DOCUMENTO_COLOR: Record<TipoDocumento, { bg: string; text: string }> = {
  NOMINA:      { bg: "#DBEAFE", text: "#1D4ED8" },
  CONTRATO:    { bg: "#EDE9FE", text: "#6B21A8" },
  CERTIFICADO: { bg: "#D1FAE5", text: "#065F46" },
  POLITICA:    { bg: "#FEF3E2", text: "#92400E" },
  OTRO:        { bg: "#F3F4F6", text: "#374151" },
};

export interface Documento {
  documentoId: string;
  empresaId: string;
  titulo: string;
  descripcion?: string | null;
  tipo: TipoDocumento;
  archivoUrl: string;
  archivoNombre: string;
  mimeType?: string | null;
  tamanoBytes?: number | null;
  subidoPor: string;
  subidoPorNombre?: string | null;
  requiereFirma: boolean;
  activo: boolean;
  fechaSubida: string;

  // Solo en /documentos/me
  asignacionId?: string;
  visto?: boolean;
  fechaVisto?: string | null;
  firmado?: boolean;
  fechaFirma?: string | null;
  firmaUrl?: string | null;

  // Solo en /documentos (admin)
  totalAsignados?: number;
  totalVistos?: number;
  totalFirmados?: number;
}

export interface AsignacionDetalle {
  asignacionId: string;
  usuarioId: string;
  nombre: string;
  apellidos: string;
  departamento?: string | null;
  fechaAsignacion: string;
  visto: boolean;
  fechaVisto?: string | null;
  firmado: boolean;
  fechaFirma?: string | null;
}

export interface SubirDocumentoInput {
  titulo: string;
  descripcion?: string;
  tipo: TipoDocumento;
  requiereFirma: boolean;
  asignarATodos: boolean;
  usuariosIds?: string[];
  departamentos?: string[];
  notificar: boolean;
  file: File;
}
