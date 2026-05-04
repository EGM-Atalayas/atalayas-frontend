export interface Servicio {
  servicioId: string;
  nombre: string;
  descripcion: string | null;
  url: string | null;
  activo: boolean;
  icono: string | null;
  orden: number;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface ServicioInput {
  nombre: string;
  descripcion?: string | null;
  url?: string | null;
  activo?: boolean;
  icono?: string | null;
  orden?: number;
}
