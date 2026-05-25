"use client";

import React, { useState } from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** "glass"   → sobre fondos oscuros/gradiente (modales, headers)
   *  "surface" → sobre fondos claros (cards, paneles)
   *  "danger"  → eliminar / acción destructiva */
  variant?: "glass" | "surface" | "danger";
  size?:    "sm" | "md";
  label?:   string;
}

const SIZES = {
  sm: { wh: "32px", radius: "9px",  icon: 16 },
  md: { wh: "38px", radius: "11px", icon: 18 },
};

// ── Estilos por variante y estado ─────────────────────────────────────────────
function getStyles(
  variant: "glass" | "surface" | "danger",
  hovered: boolean,
  pressed: boolean,
): React.CSSProperties {
  if (variant === "danger") {
    return {
      background: pressed
        ? "#b91c1c"
        : hovered
        ? "#dc2626"
        : "#fee2e2",
      border:     pressed || hovered
        ? "1px solid #dc2626"
        : "1px solid rgba(220,38,38,0.20)",
      color:      hovered || pressed ? "#fff" : "#dc2626",
      boxShadow:  hovered && !pressed
        ? "0 4px 14px rgba(220,38,38,0.35), 0 0 0 3px rgba(220,38,38,0.15)"
        : "none",
      transform:  pressed ? "scale(0.88)" : hovered ? "scale(1.05)" : "scale(1)",
    };
  }

  if (variant === "glass") {
    return {
      background: pressed
        ? "rgba(0,0,0,0.28)"
        : hovered
        ? "rgba(0,0,0,0.20)"
        : "rgba(255,255,255,0.14)",
      border:     "1px solid rgba(255,255,255,0.28)",
      color:      pressed ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.90)",
      boxShadow:  hovered && !pressed
        ? "0 4px 14px rgba(0,0,0,0.30), 0 0 0 3px rgba(0,0,0,0.12)"
        : "0 2px 6px rgba(0,0,0,0.18)",
      transform:  pressed ? "scale(0.88)" : hovered ? "scale(1.10)" : "scale(1)",
    };
  }

  // surface
  return {
    background: pressed
      ? "rgba(0,0,0,0.10)"
      : hovered
      ? "rgba(0,0,0,0.06)"
      : "transparent",
    border:     "1px solid rgba(0,0,0,0.10)",
    color:      pressed ? "var(--texto-primario)" : "var(--texto-muted)",
    boxShadow:  hovered && !pressed
      ? "0 2px 8px rgba(0,0,0,0.08), 0 0 0 3px rgba(0,0,0,0.05)"
      : "none",
    transform:  pressed ? "scale(0.88)" : hovered ? "scale(1.10)" : "scale(1)",
  };
}

// ── Componente ────────────────────────────────────────────────────────────────
export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant  = "glass",
  size     = "md",
  label    = "Cerrar",
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...props
}) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const { wh, radius, icon } = SIZES[size];

  const computedStyle: React.CSSProperties = {
    width:          wh,
    height:         wh,
    borderRadius:   variant === "danger" ? "50%" : radius,
    flexShrink:     0,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    cursor:         disabled ? "not-allowed" : "pointer",
    willChange:     "transform",
    transition:     [
      "background 0.15s ease",
      "color 0.15s ease",
      `box-shadow 0.18s var(--ease-spring)`,
      `transform 0.18s var(--ease-spring)`,
    ].join(", "),
    opacity: disabled ? 0.45 : 1,
    ...getStyles(variant, hovered && !disabled, pressed && !disabled),
    ...style,
  };

  return (
    <button
      aria-label={label}
      className={variant === "danger" ? "danger-icon-hover" : undefined}
      style={computedStyle}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) setHovered(true);  onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); setPressed(false); onMouseLeave?.(e); }}
      onMouseDown={(e)  => { if (!disabled) setPressed(true);  onMouseDown?.(e); }}
      onMouseUp={(e)    => { if (!disabled) setPressed(false); onMouseUp?.(e); }}
      {...props}
    >
      {children ?? (
        <svg width={icon} height={icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
};
