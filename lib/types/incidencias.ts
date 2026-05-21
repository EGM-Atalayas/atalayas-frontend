export interface Incidencia {
  incidenciaId: string;
  titulo: string;
  descripcion: string;
  prioridad: 'NORMAL' | 'CRITICA';
  estado: 'ABIERTA' | 'EN_CURSO' | 'CERRADA';
  creadoPor: string;
  nombreCreador: string;
  emailCreador: string;
  empresaId: string;
  nombreEmpresa?: string;
  creadoEn: string;
  actualizadoEn: string;
  comentarios?: ComentarioIncidencia[];
}

export interface ComentarioIncidencia {
  comentarioId: string;
  incidenciaId: string;
  texto: string;
  creadoPor: string;
  nombreCreador: string;
  creadoEn: string;
}

export interface IncidenciaInput {
  titulo: string;
  descripcion: string;
  prioridad: 'NORMAL' | 'CRITICA';
  empresaId: string | null;
}
