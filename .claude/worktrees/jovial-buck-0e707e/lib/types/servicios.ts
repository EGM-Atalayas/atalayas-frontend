export type CategoriaServicio = "MOVILIDAD" | "INSTALACIONES" | "INICIATIVAS" | "COMUNES";

export interface Servicio {
  servicioId:   string;
  titulo:       string;
  descripcion:  string | null;
  categoria:    CategoriaServicio;
  iconoUrl:     string | null;
  urlInfo:      string | null;
  telefono:     string | null;
  comoAcceder:  string | null;
  creadoPor:    string | null;
  activo:       boolean;
  creadoEn:     string;
  actualizadoEn: string;
}

export interface ServicioInput {
  titulo:       string;
  descripcion?: string | null;
  categoria:    CategoriaServicio;
  iconoUrl?:    string | null;
  urlInfo?:     string | null;
  telefono?:    string | null;
  comoAcceder?: string | null;
}
