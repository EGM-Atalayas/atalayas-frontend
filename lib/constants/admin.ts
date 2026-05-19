import type { NoticiaInput } from "@/lib/types/noticias";
import type { NuevoEmpleadoForm } from "@/lib/types/usuario";

export const ROL_EMPLEADO_ID = "ff7abc21-9380-4e51-a55c-e2427d2a4e2d";

export const DEPARTAMENTOS: { id: string; label: string }[] = [
  { id: "PRODUCCION",    label: "Producción" },
  { id: "RRHH",          label: "RRHH" },
  { id: "LOGISTICA",     label: "Logística" },
  { id: "CALIDAD",       label: "Calidad" },
  { id: "MANTENIMIENTO", label: "Mantenimiento" },
  { id: "VENTAS",        label: "Ventas" },
  { id: "ADMINISTRACION",label: "Administración" },
  { id: "IT",            label: "IT" },
  { id: "SEGURIDAD",     label: "Seguridad" },
  { id: "FORMACION",     label: "Formación" },
];

export const EMPTY_ANUNCIO: NoticiaInput = {
  titulo: "", contenido: "", esGlobal: false, empresaId: null, imagenUrl: null,
  enlaceUrl: null, enlaceTexto: null, videoUrl: null,
  adjuntoUrl: null, adjuntoNombre: null, estado: "publicado", fijado: false,
  categoria: null,
};

export const EMPTY_EMPLEADO: NuevoEmpleadoForm = {
  nombre: "", apellidos: "", email: "", password: "", puestoTrabajo: "", departamento: "",
};
