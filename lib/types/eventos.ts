export type EstadoEvento = "PROXIMO" | "EN_CURSO" | "FINALIZADO" | "CANCELADO";

export interface Evento {
  eventoId:     string;
  titulo:       string;
  descripcion:  string | null;
  fecha:        string;           // ISO date YYYY-MM-DD
  horaInicio:   string | null;    // HH:mm
  horaFin:      string | null;    // HH:mm
  lugar:        string | null;
  urlInfo:      string | null;
  imagenUrl:    string | null;
  estado:       EstadoEvento;
  creadoPor:    string | null;
  activo:       boolean;
  creadoEn:     string;
  actualizadoEn: string;
}

export interface EventoInput {
  titulo:       string;
  descripcion?: string | null;
  fecha:        string;
  horaInicio?:  string | null;
  horaFin?:     string | null;
  lugar?:       string | null;
  urlInfo?:     string | null;
  imagenUrl?:   string | null;
}
