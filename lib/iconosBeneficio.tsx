import React from "react";

// ── Mapa de iconos predefinidos para ventajas ────────────────────────────────
// Clave: valor guardado en iconoUrl  |  label: texto mostrado en el picker

export interface IconoBeneficio {
  key:   string;
  label: string;
  svg:   React.ReactNode;
}

function Ico({ d, d2 }: { d: string; d2?: string }) {
  return (
    <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
      {d2 && <path d={d2} />}
    </svg>
  );
}

export const ICONOS_BENEFICIO: IconoBeneficio[] = [
  {
    key:   "parking",
    label: "Aparcamiento",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 010 6H9"/></svg>,
  },
  {
    key:   "descuento",
    label: "Descuento",
    svg:   <Ico d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />,
  },
  {
    key:   "restaurante",
    label: "Restaurante",
    svg:   <Ico d="M3 11l19-9-9 19-2-8-8-2z" />,
  },
  {
    key:   "deporte",
    label: "Deporte",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c0 0 4 4 4 9s-4 9-4 9M12 3c0 0-4 4-4 9s4 9 4 9M3 12h18"/></svg>,
  },
  {
    key:   "transporte",
    label: "Transporte",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM19.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>,
  },
  {
    key:   "salud",
    label: "Salud",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  },
  {
    key:   "formacion",
    label: "Formación",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  },
  {
    key:   "ocio",
    label: "Ocio",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14"/><rect x="1" y="6" width="15" height="12" rx="2"/></svg>,
  },
  {
    key:   "cafe",
    label: "Café",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  },
  {
    key:   "compras",
    label: "Compras",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  },
  {
    key:   "seguro",
    label: "Seguro",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    key:   "regalo",
    label: "Regalo",
    svg:   <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
  },
];

// ── Helper: devuelve el SVG por key, o el icono genérico si no existe ─────────
export function getIconoBeneficio(key: string | null | undefined): React.ReactNode {
  if (!key) return null;
  // Si parece una URL, no es un icono predefinido
  if (key.startsWith("http")) return null;
  return ICONOS_BENEFICIO.find(i => i.key === key)?.svg ?? null;
}
