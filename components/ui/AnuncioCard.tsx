"use client";

import React from "react";
import { motion } from "motion/react";
import { Megaphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Noticia } from "@/lib/types/noticias";

// ── Constantes internas — no necesitan salir del componente ──────────────────
const GRAD_ANN = "linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)";

const CATEGORIA_COLORS_LIGHT: Record<string, { bg: string; text: string }> = {
  General:   { bg: "#f3f4f6", text: "#374151" },
  Aviso:     { bg: "#fee2e2", text: "#991b1b" },
  Evento:    { bg: "#ffedd5", text: "#9a3412" },
  Formacion: { bg: "#dbeafe", text: "#1d4ed8" },
  Seguridad: { bg: "#fee2e2", text: "#991b1b" },
  Empresa:   { bg: "#d1fae5", text: "#065f46" },
};

function esNuevo(fecha: string) {
  return Date.now() - new Date(fecha).getTime() < 48 * 3600000;
}

interface AnuncioCardProps {
  n: Noticia;
  esBorrador?: boolean;
  publicandoId: string | null;
  abrirEditar: (anuncio: Noticia) => void;
  publicarBorrador: (anuncio: Noticia) => void;
  handleEliminarBorrador: (id: string) => void;
  handleDesactivarAnuncio: (id: string) => void;
}

export const AnuncioCard = ({
  n,
  esBorrador = false,
  publicandoId,
  abrirEditar,
  publicarBorrador,
  handleEliminarBorrador,
  handleDesactivarAnuncio,
}: AnuncioCardProps) => {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: "var(--blanco)",
        border: "1px solid var(--gris-borde)",
        borderTop: esBorrador ? "3px solid #d97706" : "1px solid var(--gris-borde)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onClick={() => abrirEditar(n)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Cabecera */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "16/6", background: esBorrador ? "linear-gradient(135deg, #92400e, #d97706)" : GRAD_ANN }}
      >
        <Megaphone
          size={32}
          strokeWidth={1}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ color: "white", opacity: 0.15 }}
        />
        {n.imagenUrl && (
          <img
            src={n.imagenUrl}
            alt={n.titulo}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, transparent 45%)" }} />

        {/* Badge */}
        <div className="absolute top-2 right-2">
          {esBorrador ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(253,230,138,0.96)", color: "#78350f", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
              Borrador
            </span>
          ) : esNuevo(n.creadoEn) ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--exito)", color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
              Nuevo
            </span>
          ) : n.fijado ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF9C3", color: "#854D0E", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", border: "1px solid #FDE047" }}>
              ★ Fijado
            </span>
          ) : null}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
            {new Date(n.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {n.categoria && n.categoria !== "General" && (() => {
            const col = CATEGORIA_COLORS_LIGHT[n.categoria] ?? CATEGORIA_COLORS_LIGHT.General;
            return (
              <>
                <span style={{ color: "#D1D5DB", fontSize: 10 }}>·</span>
                <span className="text-[10px] font-semibold px-1.5 py-px rounded-md" style={{ background: col.bg, color: col.text }}>
                  {n.categoria}
                </span>
              </>
            );
          })()}
        </div>

        <h3 className="font-bold leading-snug line-clamp-2" style={{ fontSize: "0.875rem", color: "#0F1923", minHeight: "2.6em" }}>
          {n.titulo || "(Sin título)"}
        </h3>

        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#6B7A8D", minHeight: "2.6em" }}>
          {n.contenido
            ? n.contenido.replace(/[#*_`>]/g, "").trim().slice(0, 110) + (n.contenido.length > 110 ? "…" : "")
            : "Sin contenido"}
        </p>

        <div className="flex items-center gap-1.5 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="primary"
            size="sm"
            className="flex-1 justify-center"
            onClick={() => abrirEditar(n)}
          >
            Editar
          </Button>

          {esBorrador ? (
            <>
              <Button
                variant="success"
                size="sm"
                className="flex-1 justify-center"
                disabled={publicandoId === n.anuncioId}
                onClick={() => publicarBorrador(n)}
              >
                {publicandoId === n.anuncioId ? (
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  "Publicar"
                )}
              </Button>

              <motion.button
                title="Eliminar borrador"
                onClick={() => handleEliminarBorrador(n.anuncioId)}
                whileTap={{ scale: 0.88 }}
                className="flex items-center justify-center w-8 h-8 shrink-0 cursor-pointer"
                style={{
                  borderRadius: "50%",
                  background: "var(--error-light)",
                  color: "var(--error)",
                  border: "1px solid rgba(220,38,38,0.15)",
                  transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.18s var(--ease-spring)",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--error)"; el.style.color = "#fff"; el.style.borderColor = "var(--error)"; el.style.boxShadow = "0 4px 14px rgba(220,38,38,0.35), 0 0 0 3px rgba(220,38,38,0.15)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--error-light)"; el.style.color = "var(--error)"; el.style.borderColor = "rgba(220,38,38,0.15)"; el.style.boxShadow = "none"; }}
              >
                <Trash2 size={13} strokeWidth={2.2} />
              </motion.button>
            </>
          ) : (
            <Button
              variant="danger"
              size="sm"
              className="flex-1 justify-center"
              onClick={() => handleDesactivarAnuncio(n.anuncioId)}
            >
              Desactivar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
