"use client";

// ============================================================
// IAButton — Botón exclusivo para acciones de Inteligencia Artificial
//
// Usa el efecto "star border": un brillo animado recorre el borde
// de forma constante (sin alternancia) para indicar que la acción
// está impulsada por IA.
//
// Props:
//   children     — Texto / contenido del botón
//   onClick      — Handler del click
//   disabled     — Desactiva el botón
//   loading      — Muestra spinner + loadingLabel
//   loadingLabel — Texto mientras carga (default: "Generando…")
//   type         — "button" | "submit" | "reset" (default: "button")
//   color        — Color del destello (default: "#a78bfa" violeta)
//   speed        — Duración de la animación (default: "4s")
//   size         — "sm" | "md" | "lg" (default: "md")
//   className    — Clases extra para el wrapper
// ============================================================

import React from "react";
import { Sparkles } from "lucide-react";

interface IAButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  type?: "button" | "submit" | "reset";
  color?: string;
  speed?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

const SIZE = {
  sm: { py: "8px",  px: "14px", text: "12px", gap: "6px",  iconSize: 13 },
  md: { py: "10px", px: "20px", text: "14px", gap: "8px",  iconSize: 15 },
  lg: { py: "13px", px: "26px", text: "15px", gap: "10px", iconSize: 16 },
};

export function IAButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingLabel = "Generando…",
  type = "button",
  color = "#a78bfa",
  speed = "4s",
  size = "md",
  className = "",
  style,
}: IAButtonProps) {
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`relative inline-flex overflow-hidden rounded-2xl transition-opacity ${className}`}
      style={{
        padding: "1px 0",
        opacity: isDisabled ? 0.45 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {/* ── Destello inferior (derecha → izquierda) ── */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-bottom pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />

      {/* ── Destello superior (izquierda → derecha) ── */}
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-top pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />

      {/* ── Contenido ── */}
      <div
        className="relative z-10 flex items-center justify-center font-semibold text-white rounded-2xl border border-[#4c1d95] select-none"
        style={{
          background: "linear-gradient(135deg, #3b0764 0%, #6d28d9 50%, #7c3aed 100%)",
          padding: `${s.py} ${s.px}`,
          fontSize: s.text,
          gap: s.gap,
          letterSpacing: "0.01em",
        }}
      >
        {loading ? (
          <>
            <span
              className="rounded-full border-2 border-white border-t-transparent animate-spin shrink-0"
              style={{ width: s.iconSize, height: s.iconSize }}
            />
            {loadingLabel}
          </>
        ) : (
          <>
            <Sparkles style={{ width: s.iconSize, height: s.iconSize, flexShrink: 0 }} />
            {children}
          </>
        )}
      </div>
    </button>
  );
}
