import { API_URL, apiFetch } from "../api";

export type EstadoSugerencia = "PENDIENTE" | "VISTA" | "RESUELTA";
export type DestinatarioSugerencia = "EMPRESA" | "EGM";

export interface Sugerencia {
  sugerenciaId: string;
  mensaje: string;
  nombreUsuario: string;
  emailUsuario: string;
  estado: EstadoSugerencia;
  destinatario: DestinatarioSugerencia;
  creadoEn: string;
}

export interface EnviarSugerenciaInput {
  mensaje: string;
  destinatario: DestinatarioSugerencia;
}

// Empleado — enviar sugerencia
export async function enviarSugerencia(data: EnviarSugerenciaInput): Promise<void> {
  const res = await apiFetch(`${API_URL}/sugerencias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al enviar la sugerencia");
}

// Admin — listar sugerencias de su empresa/EGM
export async function getSugerencias(): Promise<Sugerencia[]> {
  const res = await apiFetch(`${API_URL}/sugerencias`);
  if (!res.ok) throw new Error("Error al cargar las sugerencias");
  return res.json();
}

