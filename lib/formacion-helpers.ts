import type { ModuloConProgreso } from "@/lib/types/modulos";

export const TIPO_GRADIENT: Record<string, string> = {
  IDENTIDAD: "linear-gradient(135deg, #1B3F7E 0%, #2A5298 100%)",
  BASICA: "linear-gradient(135deg, #0D1B2E 0%, #1B3F7E 100%)",
  ESPECIFICA: "linear-gradient(135deg, #8B9A2D 0%, #A3B535 100%)",
  DESARROLLO: "linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)",
  RECOMPENSAS: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
  COMUNIDAD: "linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)",
};

const FORMACION_IMG_BY_NAME: Array<{ keywords: string[]; imagen: string }> = [
  { keywords: ["incorporac", "bienvenid"], imagen: "/background-formacion-empleado.webp" },
  { keywords: ["comunicac", "efectiva"], imagen: "/comunicacion-trabajo.webp" },
  { keywords: ["herramienta", "digital", "colaborat"], imagen: "/herramientas-digitales.webp" },
  { keywords: ["negociaci", "habilidad", "directiv"], imagen: "/negociacion-habilidades.webp" },
  { keywords: ["cibersegur", "datos", "rgpd"], imagen: "/ciberseguridad-datos.webp" },
  { keywords: ["metodolog", "agil", "scrum", "kanban"], imagen: "/metodologias-agiles.webp" },
  { keywords: ["diversidad", "inclusi"], imagen: "/diversidad.webp" },
];

export function getFormacionImg(_moduloId: string, nombre: string, imagenPortadaUrl?: string | null): string | undefined {
  // Ignorar URLs placeholder de ejemplo que no resuelven
  if (imagenPortadaUrl && !imagenPortadaUrl.includes("storage.example.com")) return imagenPortadaUrl;
  const lower = nombre.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  return FORMACION_IMG_BY_NAME.find((e) => e.keywords.some((kw) => lower.includes(kw)))?.imagen;
}

export type ModuloEnriquecido = ModuloConProgreso & { duracion: string; porcentaje: number };
