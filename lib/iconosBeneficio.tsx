import React from "react";

// ── Iconos de Bootstrap Icons (font) ──────────────────────────────────────────
// Usamos el icon font oficial (importado en app/layout.tsx) para garantizar que
// los glyphs son idénticos a los de https://icons.getbootstrap.com/
//
// Cada entrada tiene un `bi` con el nombre del icono (sin el prefijo "bi-").
// El `key` es lo que se guarda en BD y se usa para buscar el icono.

export interface IconoBeneficio {
  key:   string;
  label: string;
  /** Nombre del icono en Bootstrap Icons (sin prefijo `bi-`) */
  bi:    string;
}

/** Wrapper estándar — hereda tamaño y color del padre.
 *  Le aplicamos style font-size 1em para que escale con el `scale()` del padre. */
function BiIcon({ name }: { name: string }) {
  return <i className={`bi bi-${name}`} style={{ fontSize: "36px", lineHeight: 1 }} />;
}

export const ICONOS_BENEFICIO: IconoBeneficio[] = [
  { key: "parking",         label: "Aparcamiento", bi: "p-square-fill" },
  { key: "descuento",       label: "Descuento",    bi: "tag-fill" },
  { key: "restaurante",     label: "Restaurante",  bi: "egg-fried" },
  { key: "deporte",         label: "Deporte",      bi: "trophy-fill" },
  { key: "transporte",      label: "Transporte",   bi: "bus-front" },   // alias legacy → bus-front
  { key: "salud",           label: "Salud",        bi: "heart-pulse-fill" },
  { key: "formacion",       label: "Formación",    bi: "mortarboard-fill" },
  { key: "ocio",            label: "Ocio",         bi: "play-btn-fill" },
  { key: "cafe",            label: "Café",         bi: "cup-hot-fill" },
  { key: "compras",         label: "Compras",      bi: "bag-fill" },
  { key: "seguro",          label: "Seguro",       bi: "shield-check" },
  { key: "regalo",          label: "Regalo",       bi: "gift-fill" },
  { key: "bus-front",       label: "Autobús",      bi: "bus-front" },
  { key: "car-front-fill",  label: "Coche",        bi: "car-front-fill" },
  { key: "p-circle",        label: "Aparcamiento", bi: "p-circle" },
  { key: "people-fill",     label: "Personas",     bi: "people-fill" },
  { key: "box-seam-fill",   label: "Paquetería",   bi: "box-seam-fill" },
];

// ── Helper: devuelve el componente JSX del icono ─────────────────────────────
export function getIconoBeneficio(key: string | null | undefined): React.ReactNode {
  if (!key) return null;
  if (key.startsWith("http")) return null;          // Si es URL, no es predefinido
  const entry = ICONOS_BENEFICIO.find(i => i.key === key);
  if (!entry) return null;
  return <BiIcon name={entry.bi} />;
}

/** Para usar el icon font en componentes propios (picker, etc.) sin pasar por la lookup */
export function BootstrapIcon({ name, size = 36 }: { name: string; size?: number }) {
  return <i className={`bi bi-${name}`} style={{ fontSize: `${size}px`, lineHeight: 1 }} />;
}
