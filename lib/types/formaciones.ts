// lib/types/formaciones.ts
export type FormacionStatus = "completado" | "en progreso" | "pendiente";
export type FormacionCategory = "Onboarding" | "Básica" | "Específica";

export interface Formacion {
  id: number;
  name: string;
  category: FormacionCategory;
  status: FormacionStatus;
  description: string;
  empresa_id?: string | null;
}
