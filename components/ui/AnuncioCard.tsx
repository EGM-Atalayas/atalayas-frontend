"use client";

import React from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import type { Noticia } from "@/lib/types/noticias";

// ── Paletas por estado ────────────────────────────────────────────────────────
const COLOR_PUBLICADO = {
  bg:     "linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)",
  text:   "#0284C7",
  shadow: "#0284C7",
};
const COLOR_BORRADOR = {
  bg:     "linear-gradient(135deg, #92400e 0%, #d97706 100%)",
  text:   "#d97706",
  shadow: "#d97706",
};

const CATEGORIA_COLORS: Record<string, { bg: string; text: string }> = {
  General:   { bg: "#f3f4f6",  text: "#374151" },
  Aviso:     { bg: "#fee2e2",  text: "#991b1b" },
  Evento:    { bg: "#ffedd5",  text: "#9a3412" },
  Formacion: { bg: "#dbeafe",  text: "#1d4ed8" },
  Seguridad: { bg: "#fee2e2",  text: "#991b1b" },
  Empresa:   { bg: "#d1fae5",  text: "#065f46" },
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
  const color = esBorrador ? COLOR_BORRADOR : COLOR_PUBLICADO;

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden cursor-pointer h-full"
      style={{
        background: "var(--blanco)",
        border: "1px solid var(--gris-borde)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease",
      }}
      onClick={() => abrirEditar(n)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 28px ${color.shadow}22, 0 2px 8px rgba(0,0,0,0.06)`;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = `${color.shadow}35`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--gris-borde)";
      }}
    >
      {/* ── Cabecera coloreada ── */}
      <div
        className="relative overflow-hidden shrink-0"
        style={{ height: 100, background: color.bg }}
      >
        {/* Imagen de fondo si existe */}
        {n.imagenUrl && (
          <img
            src={n.imagenUrl}
            alt={n.titulo}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Overlay suave encima de la imagen */}
        {n.imagenUrl && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, transparent 45%)" }} />
        )}

        {/* Círculo decorativo — esquina superior izquierda */}
        <div className="pointer-events-none absolute" style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(255,255,255,0.14)",
          top: -28, left: -22,
        }} />

        {/* Icono gigante translúcido — bottom-right */}
        <div className="pointer-events-none absolute flex items-center justify-center" style={{
          right: -18, bottom: -40, width: 140, height: 140,
          opacity: 0.16, color: "#fff",
        }}>
          <Megaphone size={100} strokeWidth={1} />
        </div>

        {/* Badge estado — izquierda */}
        <span className="absolute top-2.5 left-3 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.22)",
            color: "#fff",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.32)",
          }}>
          <Megaphone size={9} strokeWidth={2.5} />
          {esBorrador ? "Borrador" : "Publicado"}
        </span>

        {/* Badge derecha — Nuevo / Fijado / categoría */}
        <div className="absolute top-2.5 right-3">
          {!esBorrador && esNuevo(n.creadoEn) ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.22)", color: "#fff", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.32)" }}>
              ✦ Nuevo
            </span>
          ) : n.fijado && !esBorrador ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.22)", color: "#fff", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.32)" }}>
              ★ Fijado
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex flex-col flex-1 px-3 pt-3 pb-3 gap-2">
        {/* Fecha + categoría */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--texto-muted)" }}>
            {new Date(n.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {n.categoria && n.categoria !== "General" && (() => {
            const col = CATEGORIA_COLORS[n.categoria] ?? CATEGORIA_COLORS.General;
            return (
              <>
                <span style={{ color: "var(--gris-borde)", fontSize: 10 }}>·</span>
                <span className="text-[10px] font-semibold px-1.5 py-px rounded-md"
                  style={{ background: col.bg, color: col.text }}>
                  {n.categoria}
                </span>
              </>
            );
          })()}
        </div>

        {/* Título */}
        <h3 className="font-extrabold text-base leading-snug line-clamp-2" style={{ color: "var(--texto-primario)" }}>
          {n.titulo || "(Sin título)"}
        </h3>

        {/* Contenido */}
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--texto-secundario)" }}>
          {n.contenido
            ? n.contenido.replace(/[#*_`>]/g, "").trim().slice(0, 110) + (n.contenido.length > 110 ? "…" : "")
            : <span style={{ color: "var(--texto-muted)", fontStyle: "italic" }}>Sin contenido</span>}
        </p>

        {/* Acciones */}
        <div className="flex items-center gap-2 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="primary" size="md" className="flex-1 justify-center"
            style={{ background: "var(--azul-egm)", color: "#fff", border: "none" }}
            onClick={() => abrirEditar(n)}>
            Editar
          </Button>

          {esBorrador ? (
            <>
              <Button variant="success" size="md" className="flex-1 justify-center"
                disabled={publicandoId === n.anuncioId}
                onClick={() => publicarBorrador(n)}>
                {publicandoId === n.anuncioId ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : "Publicar"}
              </Button>
              <IconButton variant="danger" size="md" label="Eliminar borrador"
                onClick={() => handleEliminarBorrador(n.anuncioId)}>
                <Trash2 size={16} strokeWidth={2} />
              </IconButton>
            </>
          ) : (
            <Button variant="danger" size="md" className="flex-1 justify-center"
              onClick={() => handleDesactivarAnuncio(n.anuncioId)}>
              Desactivar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
