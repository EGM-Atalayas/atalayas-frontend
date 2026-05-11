"use client";

import React, { useState } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?:    "sm" | "md" | "lg";
}

// ── Tamaños ───────────────────────────────────────────────────────────────────
const SIZES: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

// ── Estilos por variante y estado hover ───────────────────────────────────────
function getStyles(variant: string, hovered: boolean, disabled: boolean): React.CSSProperties {
  if (disabled) {
    const base: React.CSSProperties = {
      opacity:    0.45,
      cursor:     "not-allowed",
      transform:  "none",
      boxShadow:  "none",
    };
    switch (variant) {
      case "primary":   return { ...base, background: "var(--azul-egm)",      color: "#ffffff" };
      case "secondary": return { ...base, background: "transparent",           color: "#6b7280", border: "1px solid rgba(0,0,0,0.12)" };
      case "danger":    return { ...base, background: "#dc2626",               color: "#ffffff" };
      case "ghost":     return { ...base, background: "transparent",           color: "var(--azul-egm)", border: "1px solid rgba(0,0,0,0.12)" };
      default:          return base;
    }
  }

  switch (variant) {
    case "primary":
      return {
        background: hovered ? "var(--azul-egm-hover)" : "var(--azul-egm)",
        color:      "#ffffff",
        boxShadow:  hovered ? "0 4px 14px rgba(27,63,126,0.30)" : "none",
      };

    case "secondary":
      return {
        background:  hovered ? "rgba(0,0,0,0.04)" : "transparent",
        color:       "#374151",
        border:      "1px solid rgba(0,0,0,0.12)",
        boxShadow:   "none",
        transform:   "none",
      };

    case "danger":
      return {
        background: hovered ? "#b91c1c" : "#dc2626",
        color:      "#ffffff",
        boxShadow:  hovered ? "0 4px 14px rgba(220,38,38,0.28)" : "none",
      };

    case "ghost":
      return {
        background:  hovered ? "var(--azul-egm-light)" : "transparent",
        color:       "var(--azul-egm)",
        border:      hovered
          ? "1px solid rgba(27,63,126,0.20)"
          : "1px solid rgba(0,0,0,0.12)",
        boxShadow:   "none",
        transform:   "none",
      };

    default:
      return {};
  }
}

// ── Componente ────────────────────────────────────────────────────────────────
export const Button: React.FC<ButtonProps> = ({
  children,
  variant   = "primary",
  size      = "md",
  className = "",
  style,
  disabled,
  ...props
}) => {
  const [hovered, setHovered] = useState(false);

  const computedStyle: React.CSSProperties = {
    ...getStyles(variant, hovered && !disabled, !!disabled),
    borderRadius: "12px",
    fontWeight:   600,
    transition:   "background 0.15s ease, box-shadow 0.18s ease, border-color 0.15s ease",
    outline:      "none",
    cursor:       disabled ? "not-allowed" : "pointer",
    ...style,
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold focus:outline-none ${SIZES[size]} ${className}`}
      style={computedStyle}
      disabled={disabled}
      onMouseEnter={() => { if (!disabled) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
};
