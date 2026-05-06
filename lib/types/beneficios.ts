export interface Beneficio {
  beneficioId: string;
  empresaId:   string | null;
  creadoPor:   string | null;
  titulo:      string;
  descripcion: string | null;
  urlInfo:     string | null;
  iconoUrl:    string | null;
  comoAcceder: string | null;
  fechaFin:    string | null; // ISO string, null = sin caducidad
  activo:      boolean;
  creadoEn:    string;
  actualizadoEn: string;
}

export interface BeneficioInput {
  titulo:      string;
  descripcion?: string | null;
  urlInfo?:    string | null;
  iconoUrl?:   string | null;
  comoAcceder?: string | null;
  fechaFin?:   string | null;
  empresaId?:  string | null;
}
