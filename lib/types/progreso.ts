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