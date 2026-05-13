"use client";

import React, { useState } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?:    "sm" | "md" | "lg";
}

const SIZES: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
};

const BASE: Record<string, React.CSSProperties> = {
  primary: {
    background:           "rgba(38,82,158,0.90)",
    color:                "#ffffff",
    border:               "1px solid rgba(255,255,255,0.18)",
    boxShadow:            "none",
    backdropFilter:       "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  secondary: {
    background: "transparent",
    color:      "var(--texto-label)",
    border:     "1px solid rgba(0,0,0,0.12)",
    boxShadow:  "none",
  },
  danger: {
    background: "transparent",
    color:      "#dc2626",
    border:     "1.5px solid #dc2626",
    boxShadow:  "none",
  },
  ghost: {
    background: "transparent",
    color:      "var(--azul-egm)",
    border:     "1px solid rgba(0,0,0,0.12)",
    boxShadow:  "none",
  },
};

const HOVER: Record<string, React.CSSProperties> = {
  primary: {
    background:           "rgba(27,63,126,0.95)",
    color:                "#ffffff",
    border:               "1px solid rgba(255,255,255,0.22)",
    boxShadow:            "inset 0 1px 0 rgba(255,255,255,0.22), 0 6px 20px rgba(27,63,126,0.38)",
    backdropFilter:       "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  secondary: {
    background: "rgba(0,0,0,0.06)",
    color:      "var(--texto-primario)",
    border:     "1px solid rgba(0,0,0,0.25)",
    boxShadow:  "0 4px 14px rgba(0,0,0,0.10), 0 0 0 3px rgba(0,0,0,0.06)",
  },
  danger: {
    background: "#dc2626",
    color:      "#ffffff",
    border:     "1.5px solid #dc2626",
    boxShadow:  "0 8px 24px rgba(220,38,38,0.38), 0 0 0 3px rgba(220,38,38,0.22)",
  },
  ghost: {
    background: "rgba(27,63,126,0.07)",
    color:      "var(--azul-egm)",
    border:     "1px solid rgba(27,63,126,0.35)",
    boxShadow:  "0 4px 14px rgba(27,63,126,0.12), 0 0 0 3px rgba(27,63,126,0.08)",
  },
};

const PRESSED: Record<string, React.CSSProperties> = {
  primary: {
    background:           "rgba(27,63,126,1)",
    color:                "#ffffff",
    border:               "1px solid rgba(255,255,255,0.14)",
    boxShadow:            "inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 4px rgba(27,63,126,0.20)",
    backdropFilter:       "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  secondary: {
    background: "rgba(0,0,0,0.10)",
    color:      "var(--texto-primario)",
    border:     "1px solid rgba(0,0,0,0.25)",
    boxShadow:  "none",
  },
  danger: {
    background: "#b91c1c",
    color:      "#ffffff",
    border:     "1.5px solid #b91c1c",
    boxShadow:  "none",
  },
  ghost: {
    background: "rgba(27,63,126,0.12)",
    color:      "var(--azul-egm)",
    border:     "1px solid rgba(27,63,126,0.35)",
    boxShadow:  "none",
  },
};

const DISABLED: Record<string, React.CSSProperties> = {
  primary:   { background: "linear-gradient(160deg, #3d6ec4 0%, #1b3f7e 100%)", color: "#ffffff",            border: "none" },
  secondary: { background: "transparent",                                        color: "var(--texto-muted)", border: "1px solid rgba(0,0,0,0.12)" },
  danger:    { background: "transparent",                                        color: "#dc2626",            border: "1.5px solid #dc2626" },
  ghost:     { background: "transparent",                                        color: "var(--azul-egm)",    border: "1px solid rgba(0,0,0,0.12)" },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant   = "primary",
  size      = "md",
  className = "",
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

  const stateStyles: React.CSSProperties =
    disabled ? { ...DISABLED[variant], opacity: 0.45, cursor: "not-allowed", filter: "none" }
    : pressed  ? PRESSED[variant]
    : hovered  ? HOVER[variant]
    : BASE[variant];

  const computedStyle: React.CSSProperties = {
    ...stateStyles,
    borderRadius: "var(--radius-btn)",
    fontWeight:   600,
    transition:   [
      "background 0.18s ease",
      "color 0.15s ease",
      "border-color 0.15s ease",
      "box-shadow 0.22s var(--ease-spring)",
    ].join(", "),
    outline: "none",
    cursor:  disabled ? "not-allowed" : "pointer",
    ...style,
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold focus:outline-none ${SIZES[size]} ${className}`}
      style={computedStyle}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) setHovered(true);  onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); setPressed(false); onMouseLeave?.(e); }}
      onMouseDown={(e)  => { if (!disabled) setPressed(true);  onMouseDown?.(e); }}
      onMouseUp={(e)    => { if (!disabled) setPressed(false); onMouseUp?.(e); }}
      {...props}
    >
      {children}
    </button>
  );
};
