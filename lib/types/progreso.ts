export type ActividadTipo = "completado" | "inicio" | "logro" | "grupo" | "nuevo";

export interface ActividadItem {
  tipo: ActividadTipo;
  texto: string;
  timestamp: string;
}

export interface ProgresoModulo {
    moduloId: string;
    nombreModulo: string;
    porcentaje: number;
}

export interface ProgresoEmpleado {
    usuarioId: string;
    nombre: string;
    apellidos: string;
    modulos: ProgresoModulo[];
}