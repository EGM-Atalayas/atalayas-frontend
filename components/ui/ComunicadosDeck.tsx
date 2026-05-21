"use client";

import { useState } from "react";
import Link from "next/link";
import type { ComunicadoItem } from "./ComunicadosCarousel";

interface Props {
  items: ComunicadoItem[];
  minHeight?: number;
}

// Paleta unificada en azul para todas las comunicaciones
const AZUL = { from: "#1E3A8A", to: "#0EA5E9", chip: "#DBEAFE" };
const PALETA: Record<string, { from: string; to: string; chip: string }> = {
  Novedades: AZUL,
  Eventos:   AZUL,
  Avisos:    AZUL,
  Default:   AZUL,
};

function getAcento(categoria?: string) {
  if (categoria && PALETA[categoria]) return PALETA[categoria];
  return PALETA.Default;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default function ComunicadosDeck({ items, minHeight = 460 }: Props) {
  const [topIdx, setTopIdx] = useState(0);
  const total = items.length;

  if (total === 0) {
    return (
      <div className="rounded-3xl flex items-center justify-center text-sm"
        style={{ minHeight, background: "var(--blanco)", border: "1px dashed var(--gris-borde)", color: "var(--texto-muted)" }}>
        Sin comunicaciones por ahora
      </div>
    );
  }

  // Mostrar máximo 3 cartas en el deck
  const visibleCount = Math.min(3, total);
  const cards = Array.from({ length: visibleCount }, (_, i) => {
    const idx = (topIdx + i) % total;
    return { item: items[idx], stackPos: i };
  });

  const advance = () => setTopIdx((p) => (p + 1) % total);

  return (
    <div className="relative" style={{ minHeight: minHeight + 24 }}>
      {/* Pila de tarjetas */}
      <div className="relative" style={{ height: minHeight }}>
        {cards.slice().reverse().map(({ item, stackPos }) => {
          const ac = getAcento(item.categoria);
          // stackPos 0 = front, 1 = middle, 2 = back
          const offsetY = stackPos * 14;
          const scale   = 1 - stackPos * 0.05;
          const opacity = 1 - stackPos * 0.15;
          const zIndex  = 10 - stackPos;
          const isFront = stackPos === 0;

          return (
            <div
              key={`${item.id}-${stackPos}`}
              onClick={isFront ? advance : undefined}
              className={`absolute inset-0 rounded-3xl overflow-hidden transition-all duration-500 ${isFront ? "cursor-pointer hover:-translate-y-1" : "pointer-events-none"}`}
              style={{
                transform: `translateY(${offsetY}px) scale(${scale})`,
                opacity,
                zIndex,
                background: item.imagenUrl
                  ? `url(${item.imagenUrl}) center/cover no-repeat, linear-gradient(135deg, ${ac.from} 0%, ${ac.to} 100%)`
                  : `linear-gradient(135deg, ${ac.from} 0%, ${ac.to} 100%)`,
                boxShadow: isFront
                  ? `0 20px 50px -15px ${ac.from}88, 0 4px 12px rgba(0,0,0,0.1)`
                  : `0 10px 24px -8px ${ac.from}55`,
              }}
            >
              {/* Overlay degradado para legibilidad: tinte del color de la categoría arriba + oscuro abajo */}
              {item.imagenUrl ? (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `linear-gradient(180deg, ${ac.from}66 0%, transparent 30%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.78) 100%)`,
                  }} />
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `linear-gradient(135deg, ${ac.from}33 0%, transparent 50%, ${ac.to}33 100%)`,
                    mixBlendMode: "overlay",
                  }} />
                </>
              ) : (
                <>
                  <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "320px", height: "320px", borderRadius: "50%", background: "rgba(255,255,255,0.10)", filter: "blur(2px)" }} />
                  <div style={{ position: "absolute", bottom: "-60px", left: "10%", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                </>
              )}

              {/* Contenido */}
              <div className="relative z-10 h-full flex flex-col p-6 sm:p-8">
                {/* Header: categoria + tipo + contador */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.22)", color: "#ffffff", backdropFilter: "blur(6px)" }}>
                      {item.categoria || "Comunicación"}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                      · {item.tipo === "egm" ? "EGM Atalayas" : "Tu empresa"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold tabular-nums px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.35)", color: "#ffffff", backdropFilter: "blur(6px)" }}>
                    {(topIdx + 1)} / {total}
                  </span>
                </div>

                {/* Texto al fondo sobre el degradado oscuro */}
                <div className="flex-1 flex flex-col justify-end min-h-0">
                  <h3 className="text-3xl sm:text-4xl font-bold text-white leading-[1.1] mb-3 line-clamp-3"
                    style={{ fontFamily: "var(--font-poppins), sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.55)", letterSpacing: "-0.01em" }}>
                    {item.titulo}
                  </h3>
                  <p className="text-base sm:text-lg leading-snug line-clamp-2" style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 1px 6px rgba(0,0,0,0.55)" }}>
                    {item.mensaje}
                  </p>
                </div>

                {/* Footer: fecha + acciones */}
                <div className="mt-4 pt-4 flex items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.25)" }}>
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatFecha(item.fecha)}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/comunicacion`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-bold px-3.5 py-2 rounded-xl transition-all hover:scale-105"
                      style={{ background: "rgba(255,255,255,0.95)", color: ac.from, textDecoration: "none" }}
                    >
                      Ver detalle
                    </Link>
                    {total > 1 && isFront && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); advance(); }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(255,255,255,0.22)", color: "#ffffff", backdropFilter: "blur(6px)" }}
                        aria-label="Siguiente"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
