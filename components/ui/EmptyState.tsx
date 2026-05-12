"use client";

import React from "react";

interface EmptyStateProps {
  /** Icono SVG a mostrar — si no se pasa usa el de carpeta vacía por defecto */
  icon?:        React.ReactNode;
  title:        string;
  description?: string;
  action?:      React.ReactNode;
  /** Tamaño del contenedor — "sm" para tablas/listas, "md" para páginas completas */
  size?:        "sm" | "md";
}

const IconDefault = () => (
  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293L10.414 6.5A1 1 0 0011.121 6.793H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  size = "md",
}) => {
  const padding = size === "sm" ? "py-10 px-6" : "py-16 px-8";
  const iconSize = size === "sm" ? 36 : 48;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${padding}`}
      style={{ width: "100%" }}
    >
      {/* Icono con fondo suave */}
      <div
        style={{
          width:          iconSize + 24,
          height:         iconSize + 24,
          borderRadius:   "50%",
          background:     "var(--gris-superficie)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          color:          "var(--texto-muted)",
          marginBottom:   "16px",
          flexShrink:     0,
        }}
      >
        {icon ?? <IconDefault />}
      </div>

      {/* Título */}
      <p style={{
        fontSize:   size === "sm" ? "0.9375rem" : "1rem",
        fontWeight: 600,
        color:      "var(--texto-primario)",
        marginBottom: description ? "6px" : action ? "16px" : 0,
      }}>
        {title}
      </p>

      {/* Descripción */}
      {description && (
        <p style={{
          fontSize:     "0.875rem",
          color:        "var(--texto-muted)",
          maxWidth:     "360px",
          lineHeight:   1.6,
          marginBottom: action ? "20px" : 0,
        }}>
          {description}
        </p>
      )}

      {/* Acción opcional */}
      {action && (
        <div style={{ marginTop: description ? 0 : "4px" }}>
          {action}
        </div>
      )}
    </div>
  );
};
