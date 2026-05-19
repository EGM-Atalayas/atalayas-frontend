export interface Usuario {
  usuarioId: string;
  nombre: string;
  apellidos: string;
  email: string;
  codigoRol: string;
  nombreRol: string;
  puestoTrabajo: string | null;
  departamento: string | null;
  activo: boolean;
  fechaRegistro: string;
  fechaBaja?: string | null;
}

export interface NuevoEmpleadoForm {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  puestoTrabajo: string;
  departamento: string;
}
