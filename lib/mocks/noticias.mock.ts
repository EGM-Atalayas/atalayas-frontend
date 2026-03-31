import type { Noticia } from "@/lib/types/noticias";

export const MOCK_NOTICIAS: Noticia[] = [
  {
    anuncio_id: "1",
    titulo: "Jornada de puertas abiertas — 28 de marzo",
    contenido: "EGM Atalayas Ciudad Empresarial celebra su jornada anual. Empresas del parque, futuros colaboradores y comunidad local están invitados.",
    es_global: true,
    activo: true,
    creado_por: "00000000-0000-0000-0000-000000000001",
    empresa_id: null,
    creado_en: "2026-03-20T10:00:00Z",
    actualizado_en: "2026-03-20T10:00:00Z",
  },
  {
    anuncio_id: "2",
    titulo: "Nueva iniciativa de coche compartido",
    contenido: "Desde este mes, los empleados pueden coordinarse para compartir desplazamientos.",
    es_global: true,
    activo: true,
    creado_por: "00000000-0000-0000-0000-000000000001",
    empresa_id: null,
    creado_en: "2026-03-18T09:00:00Z",
    actualizado_en: "2026-03-18T09:00:00Z",
  },
  {
    anuncio_id: "3",
    titulo: "Actualización del módulo de PRL",
    contenido: "El módulo de Prevención de Riesgos ha sido actualizado con nueva normativa vigente.",
    es_global: false,
    activo: true,
    creado_por: "8dea9ed5-2803-4f32-b08d-82676e028c52",
    empresa_id: "8dea9ed5-2803-4f32-b08d-82676e028c52",
    creado_en: "2026-03-15T08:00:00Z",
    actualizado_en: "2026-03-15T08:00:00Z",
  },
];
