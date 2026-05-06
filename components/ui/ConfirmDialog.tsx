"use client";

import { useEffect, useRef } from "react";

interface Props {
  titulo:    string;
  mensaje:   string;
  labelOk?:  string;          // texto botón confirmar  (default "Confirmar")
  peligro?:  boolean;         // botón rojo si es acción destructiva
  onOk:      () => void;
  onCerrar:  () => void;
}

export default function ConfirmDialog({
  titulo,
  mensaje,
  labelOk  = "Confirmar",
  peligro  = false,
  onOk,
  onCerrar,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Animación de entrada
  useEffect(() => {
    overlayRef.current?.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 160, easing: "ease", fill: "forwards" },
    );
    panelRef.current?.animate(
      [{ opacity: 0, transform: "scale(0.95)" },
       { opacity: 1, transform: "scale(1)"    }],
      { duration: 200, easing: "cubic-bezier(0.34,1.20,0.64,1)", fill: "forwards" },
    );
  }, []);

  // Escape para cerrar
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCerrar(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  function onOverlay(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onCerrar();
  }

  return (
    <div
      ref={overlayRef}
      onClick={onOverlay}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.40)", backdropFilter: "blur(2px)" }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "#ffffff",
          boxShadow:  "0 20px 48px rgba(0,0,0,0.16)",
        }}
      >
        {/* Cabecera */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold" style={{ color: "#111827" }}>
            {titulo}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#6b7280" }}>
            {mensaje}
          </p>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4">
          <button
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "transparent",
              color:      "#6b7280",
              border:     "1px solid rgba(0,0,0,0.12)",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Cancelar
          </button>

          <button
            onClick={() => { onOk(); onCerrar(); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{
              background: peligro ? "#dc2626" : "var(--azul-egm)",
              transition: "opacity 0.12s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            {labelOk}
          </button>
        </div>
      </div>
    </div>
  );
}
