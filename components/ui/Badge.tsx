"use client";

import type { ReactNode, CSSProperties } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Badge — componente reutilizable para etiquetas/chips en todo el proyecto
//
// Variantes:
//   glass  — fondo oscuro semitransparente + blur (para usar sobre imágenes/gradientes)
//   solid  — fondo opaco de color + texto blanco
//   soft   — fondo tintado muy suave + texto del mismo color (default)
//   outline — borde + fondo levísimo + texto del color
//
// Uso básico:
//   <Badge>Texto</Badge>
//   <Badge variant="glass">NÓMINA</Badge>
//   <Badge variant="solid" color="#0F766E">Próximo</Badge>
//   <Badge variant="soft" color="#1B3F7E" icon={<Globe size={9} />}>EGM Global</Badge>
//   <Badge variant="outline" color="#dc2626">Crítica</Badge>
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeVariant = "soft" | "solid" | "glass" | "outline";
export type BadgeSize    = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Color del texto (hex o var()). */
  color?: string;
  /** Fondo explícito — útil cuando color es una var() y no se puede calcular automáticamente. */
  bg?: string;
  icon?: ReactNode;
  size?: BadgeSize;
  className?: string;
  style?: CSSProperties;
}

export function Badge({
  children,
  variant = "soft",
  color = "#4E6D7E",
  bg,
  icon,
  size = "sm",
  className = "",
  style,
}: BadgeProps) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: size === "md" ? "0.875rem" : "0.625rem",  // md=14px, sm=10px
    fontWeight: 700,
    letterSpacing: "0.02em",
    lineHeight: 1,
    padding: size === "md" ? "6px 12px" : "4px 8px",
    borderRadius: 9999,
    whiteSpace: "nowrap",
  };

  let variantStyle: CSSProperties = {};

  if (variant === "glass") {
    variantStyle = {
      background: "rgba(0,0,0,0.28)",
      color: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.18)",
    };
  } else if (variant === "solid") {
    variantStyle = {
      background: color,
      color: "#ffffff",
      border: "none",
    };
  } else if (variant === "soft") {
    variantStyle = {
      background: bg ?? `${color}22`,
      color: color,
      border: "none",
    };
  } else if (variant === "outline") {
    variantStyle = {
      background: bg ?? `${color}0d`,
      color: color,
      border: `1px solid ${color}40`,
    };
  }

  return (
    <span
      className={className}
      style={{ ...base, ...variantStyle, ...style }}
    >
      {icon && <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>}
      {children}
    </span>
  );
}
