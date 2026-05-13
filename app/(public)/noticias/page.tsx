"use client";

import React, { useEffect, useLayoutEffect, useState, useMemo, useRef } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import type { Noticia, Comunicado } from "@/lib/types/noticias";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://atalayas-backend-1.onrender.com/api/v1";

// ── helpers ──────────────────────────────────────────────────────────────────

type TabKey = "todos" | "noticias" | "eventos" | "comunicados" | "blog";

interface UnifiedItem {
  id: string;
  titulo: string;
  extracto: string;
  contenido: string;
  imagenUrl?: string | null;
  fecha: string;
  categoria: string;
  tab: Exclude<TabKey, "todos">;
  destacado?: boolean;
  enlaceUrl?:     string | null;
  enlaceTexto?:   string | null;
  videoUrl?:      string | null;
  adjuntoUrl?:    string | null;
  adjuntoNombre?: string | null;
}

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: "todos",       label: "Todos" },
  { key: "noticias",    label: "Noticias" },
  { key: "eventos",     label: "Eventos" },
  { key: "comunicados", label: "Comunicados" },
];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  Noticia:      { bg: "#EFF6FF", color: "#1B3F7E" },
  Evento:       { bg: "#F0FDF4", color: "#166534" },
  Comunicado:   { bg: "#FFF7ED", color: "#9A3412" },
  Blog:         { bg: "#FAF5FF", color: "#6B21A8" },
  Novedad:      { bg: "#FFF7ED", color: "#9A3412" },
  Aviso:        { bg: "#FEF2F2", color: "#991B1B" },
  General:      { bg: "#F1F5F9", color: "#475569" },
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return {
      day:   d.getDate().toString().padStart(2, "0"),
      month: d.toLocaleString("es-ES", { month: "short" }).replace(".", "").toUpperCase(),
      year:  d.getFullYear().toString(),
      full:  d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
    };
  } catch {
    return { day: "--", month: "---", year: "----", full: "" };
  }
}

function noticiaToUnified(n: Noticia): UnifiedItem {
  const cat = n.categoria ?? "Noticia";
  const tabMap: Record<string, Exclude<TabKey, "todos">> = {
    Blog: "blog", Evento: "eventos", Noticia: "noticias",
  };
  return {
    id:           n.anuncioId,
    titulo:       n.titulo,
    contenido:    n.contenido,
    extracto:     n.contenido.slice(0, 120) + (n.contenido.length > 120 ? "…" : ""),
    imagenUrl:    n.imagenUrl,
    fecha:        n.creadoEn,
    categoria:    cat,
    tab:          tabMap[cat] ?? "noticias",
    destacado:    n.fijado,
    enlaceUrl:    n.enlaceUrl,
    enlaceTexto:  n.enlaceTexto,
    videoUrl:     n.videoUrl,
    adjuntoUrl:   n.adjuntoUrl,
    adjuntoNombre: n.adjuntoNombre,
  };
}

function comunicadoToUnified(c: Comunicado): UnifiedItem {
  const cat = c.categoria ?? "Comunicado";
  const tabMap: Record<string, Exclude<TabKey, "todos">> = {
    Evento: "eventos", Novedad: "comunicados", Aviso: "comunicados",
    General: "comunicados", Comunicado: "comunicados",
  };
  return {
    id:           c.comunicadoId,
    titulo:       c.titulo,
    contenido:    c.mensaje,
    extracto:     c.mensaje.slice(0, 120) + (c.mensaje.length > 120 ? "…" : ""),
    imagenUrl:    c.imagenUrl,
    fecha:        c.fechaPublicacion ?? c.actualizadoEn ?? new Date().toISOString(),
    categoria:    cat,
    tab:          tabMap[cat] ?? "comunicados",
    destacado:    c.destacado,
    enlaceUrl:    c.enlaceUrl,
    enlaceTexto:  c.enlaceTexto,
    videoUrl:     c.videoUrl,
    adjuntoUrl:   c.adjuntoUrl,
    adjuntoNombre: c.adjuntoNombre,
  };
}

// ── Markdown renderer (basic: headings, bold, lists) ─────────────────────────

function parsInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p)}</>;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      out.push(<h3 key={i} style={{ fontWeight: 700, fontSize: "1rem", color: "var(--texto-primario, #111827)", margin: "12px 0 4px" }}>{parsInline(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      out.push(<h2 key={i} style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--texto-primario, #111827)", margin: "14px 0 4px" }}>{parsInline(line.slice(2))}</h2>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(<li key={i} style={{ marginLeft: "18px", listStyleType: "disc" }}>{parsInline(lines[i].slice(2))}</li>);
        i++;
      }
      out.push(<ul key={`ul${i}`} style={{ margin: "4px 0 8px" }}>{items}</ul>);
      continue;
    } else if (line.trim() === "") {
      out.push(<div key={i} style={{ height: "8px" }} />);
    } else {
      out.push(<p key={i} style={{ margin: "2px 0", lineHeight: 1.75 }}>{parsInline(line)}</p>);
    }
    i++;
  }
  return <>{out}</>;
}

function getVideoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function NoticiaModal({ item, onClose }: { item: UnifiedItem; onClose: () => void }) {
  const tagColor    = TAG_COLORS[item.categoria] ?? { bg: "#F1F5F9", color: "#475569" };
  const { full }    = formatDate(item.fecha);
  const embedUrl    = React.useMemo(() => item.videoUrl ? getVideoEmbedUrl(item.videoUrl) : null, [item.videoUrl]);
  const contenidoMd = React.useMemo(() => renderMarkdown(item.contenido), [item.contenido]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 200, background: "rgba(0,0,0,0.58)", animation: "nm-bgIn 0.2s ease", padding: "16px 12px" }}
        onClick={onClose}
      >
        {/* Modal card */}
        <div
          className="relative w-full flex flex-col"
          style={{ maxWidth: "42rem", maxHeight: "calc(100vh - 32px)", flex: 1, minWidth: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button onClick={onClose} title="Cerrar (Esc)"
            className="absolute top-3 right-3 z-20 flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", cursor: "pointer", transition: "background 0.18s ease, transform 0.18s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.75)"; e.currentTarget.style.transform = "scale(1.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Inner card */}
          <div className="flex flex-col rounded-2xl overflow-hidden w-full h-full"
            style={{ background: "#0d1b2e", boxShadow: "0 32px 80px rgba(0,0,0,0.28)", animation: "nm-in 0.22s cubic-bezier(0.34,1.56,0.64,1)", maxHeight: "calc(100vh - 32px)" }}>

            {/* ── Imagen / cabecera ── */}
            {item.imagenUrl ? (
              <div className="relative w-full shrink-0 overflow-hidden rounded-t-2xl" style={{ aspectRatio: "16/9", maxHeight: "260px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imagenUrl} alt={item.titulo} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,10,28,0.95) 0%, rgba(3,10,28,0.25) 55%, transparent 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 flex items-end justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: tagColor.bg, color: tagColor.color }}>{item.categoria}</span>
                    {item.destacado && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(79,70,229,0.45)", color: "#c7d2fe" }}>★ Destacado</span>}
                  </div>
                  {full && <p className="text-xs font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.88)" }}>{full}</p>}
                </div>
              </div>
            ) : (
              <div className="relative w-full shrink-0 overflow-hidden rounded-t-2xl"
                style={{ height: 150, background: "linear-gradient(135deg, hsl(220,70%,28%), hsl(210,75%,42%))" }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.07) 0%, transparent 55%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 flex items-end justify-between gap-3">
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: tagColor.bg, color: tagColor.color }}>{item.categoria}</span>
                      {item.destacado && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(79,70,229,0.45)", color: "#c7d2fe" }}>★ Destacado</span>}
                    </div>
                    <h2 className="leading-tight line-clamp-2"
                      style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.15rem, 2.5vw, 1.45rem)", letterSpacing: "-0.02em", color: "#fff", margin: 0 }}>
                      {item.titulo}
                    </h2>
                  </div>
                  {full && <p className="text-xs font-semibold shrink-0 self-end" style={{ color: "rgba(255,255,255,0.75)" }}>{full}</p>}
                </div>
              </div>
            )}

            {/* ── Contenido scrolleable ── */}
            <div className="nm-scroll overflow-y-auto flex-1 flex flex-col" style={{ background: "var(--blanco, #fff)" }}>
              <div className="flex-1 px-6 pb-5 md:px-8 flex flex-col gap-4" style={{ paddingTop: item.imagenUrl ? "1.5rem" : "1.25rem" }}>

                {/* Título — solo si hay imagen */}
                {item.imagenUrl && (
                  <h2 className="leading-tight"
                    style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.4rem, 3vw, 1.85rem)", letterSpacing: "-0.02em", color: "var(--texto-primario, #111827)" }}>
                    {item.titulo}
                  </h2>
                )}

                {/* Contenido markdown */}
                <div style={{ fontSize: "0.94rem", color: "#4b5563", lineHeight: 1.85, overflowWrap: "break-word", wordBreak: "break-word" }}>
                  {contenidoMd}
                </div>

                {/* Recursos adjuntos */}
                {(embedUrl || item.adjuntoUrl || item.enlaceUrl) && (
                  <div className="flex flex-col gap-3" style={{ borderTop: "1px solid var(--gris-borde, #e5e7eb)", paddingTop: "1.25rem" }}>
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--texto-muted, #6b7280)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                      <p className="text-xs font-semibold uppercase" style={{ color: "var(--texto-muted, #6b7280)", letterSpacing: "0.08em" }}>Recursos adjuntos</p>
                    </div>
                    {embedUrl && (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium" style={{ color: "var(--texto-muted, #6b7280)" }}>Vídeo</span>
                        <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                          <iframe src={embedUrl} className="w-full h-full" allowFullScreen style={{ border: "none" }} />
                        </div>
                      </div>
                    )}
                    {item.adjuntoUrl && (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium" style={{ color: "var(--texto-muted, #6b7280)" }}>Documento adjunto</span>
                        <a href={item.adjuntoUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl"
                          style={{ background: "var(--gris-superficie, #f1f5f9)", border: "1px solid var(--gris-borde, #e5e7eb)", textDecoration: "none", transition: "background 0.18s ease" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gris-superficie, #f1f5f9)")}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dbeafe" }}>
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                          </div>
                          <span className="text-sm font-medium flex-1 truncate" style={{ color: "#2563eb" }}>{item.adjuntoNombre ?? "Ver documento adjunto"}</span>
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        </a>
                      </div>
                    )}
                    {item.enlaceUrl && (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium" style={{ color: "var(--texto-muted, #6b7280)" }}>Enlace externo</span>
                        <a href={item.enlaceUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl"
                          style={{ background: "var(--gris-superficie, #f1f5f9)", border: "1px solid var(--gris-borde, #e5e7eb)", textDecoration: "none", transition: "background 0.18s ease" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gris-superficie, #f1f5f9)")}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dbeafe" }}>
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                          </div>
                          <span className="text-sm font-medium flex-1 truncate" style={{ color: "#2563eb" }}>{item.enlaceTexto ?? "Ver enlace"}</span>
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Fecha al pie */}
                <p className="text-xs mt-auto pt-1 text-right" style={{ color: "var(--texto-muted, #6b7280)" }}>
                  Publicado el {full}
                </p>
              </div>

              {/* ── Footer ── */}
              <div className="flex items-center gap-3 px-6 py-4 md:px-8" style={{ borderTop: "1px solid var(--gris-borde, #e5e7eb)" }}>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl text-white"
                  style={{ background: "var(--azul-egm, #1B3F7E)", transition: "background 0.18s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                >
                  Ver en la plataforma
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </Link>
                <button onClick={onClose}
                  className="text-sm font-semibold px-4 py-1.5 rounded-xl"
                  style={{ color: "var(--texto-secundario, #374151)", background: "var(--gris-superficie, #f1f5f9)", border: "1px solid var(--gris-borde, #e5e7eb)", transition: "background 0.18s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-borde, #e5e7eb)"; e.currentTarget.style.transform = "scale(1.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie, #f1f5f9)"; e.currentTarget.style.transform = "scale(1)"; }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes nm-bgIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nm-in { from { opacity: 0; transform: scale(0.94) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .nm-scroll::-webkit-scrollbar { width: 4px; }
        .nm-scroll::-webkit-scrollbar-track { background: transparent; }
        .nm-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 99px; }
      `}</style>
    </>
  );
}

function NewsCard({ item }: { item: UnifiedItem }) {
  const tagColor = TAG_COLORS[item.categoria] ?? { bg: "#F1F5F9", color: "#475569" };
  const { full } = formatDate(item.fecha);

  return (
    <Link href={`/noticias/${item.id}`} style={{ textDecoration: "none" }}>
    <article
      className="group cursor-pointer rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: "#fff", border: "1px solid #e5e7eb", transition: "box-shadow 0.2s ease, transform 0.2s ease" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.10)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      {/* Imagen */}
      <div className="w-full overflow-hidden shrink-0" style={{ aspectRatio: "16/9", background: "#f1f5f9" }}>
        {item.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imagenUrl}
            alt={item.titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-4 4 4"/>
            </svg>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-5 gap-2">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full self-start"
          style={{ background: tagColor.bg, color: tagColor.color }}
        >
          {item.categoria}
        </span>
        <h3 className="font-bold text-base leading-snug line-clamp-3" style={{ color: "#111827" }}>
          {item.titulo}
        </h3>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#6b7280" }}>
          {item.extracto}
        </p>
        {full && (
          <p className="text-xs mt-auto pt-1" style={{ color: "#9ca3af" }}>{full}</p>
        )}
      </div>
    </article>
    </Link>
  );
}

// ── Components ────────────────────────────────────────────────────────────────

function ItemCard({ item }: { item: UnifiedItem }) {
  const { day, month, year } = formatDate(item.fecha);
  const tagColor = TAG_COLORS[item.categoria] ?? { bg: "#F1F5F9", color: "#475569" };

  return (
    <article className="flex gap-5 py-6 group items-start border-b last:border-b-0" style={{ borderColor: "var(--gris-borde, #e5e7eb)" }}>
      <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
        {item.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imagenUrl} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-4 4 4"/>
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="text-xs font-semibold mb-2 px-2.5 py-1 rounded-full inline-block"
          style={{ background: tagColor.bg, color: tagColor.color }}
        >
          {item.categoria}
        </span>
        <h3
          className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 mt-1 group-hover:underline cursor-pointer"
          style={{ color: "var(--texto-primario, #111827)" }}
        >
          {item.titulo}
        </h3>
        <p className="text-sm mt-1.5 line-clamp-2" style={{ color: "var(--texto-muted, #6b7280)" }}>
          {item.extracto}
        </p>
      </div>
      <div className="shrink-0 text-right ml-2 mt-1">
        <p className="text-2xl font-bold leading-none" style={{ color: "var(--texto-primario, #111827)" }}>{day}</p>
        <p className="text-xs mt-1 uppercase font-medium" style={{ color: "var(--texto-muted, #6b7280)" }}>{month}</p>
        <p className="text-xs" style={{ color: "var(--texto-muted, #6b7280)" }}>{year}</p>
      </div>
    </article>
  );
}

function FeaturedCard({ item }: { item: UnifiedItem }) {
  const tagColor = TAG_COLORS[item.categoria] ?? { bg: "#F1F5F9", color: "#475569" };
  const { full } = formatDate(item.fecha);

  return (
    <article className="relative rounded-2xl overflow-hidden min-h-[400px] sm:min-h-[520px] group flex flex-col justify-end"
      style={{ background: "#1B3F7E" }}>
      {item.imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imagenUrl} alt={item.titulo} className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105" />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)" }} />
      <div className="relative z-10 p-8 sm:p-10">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
            style={{ background: tagColor.bg, color: tagColor.color }}
          >
            {item.categoria}
          </span>
          {item.destacado && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block bg-yellow-400/20 text-yellow-300">
              ★ Destacado
            </span>
          )}
        </div>
        <h2 className="text-white text-2xl sm:text-3xl font-bold leading-snug max-w-md mb-3">
          {item.titulo}
        </h2>
        <p className="text-white/70 text-sm leading-relaxed max-w-sm line-clamp-3 mb-4">
          {item.extracto}
        </p>
        {full && (
          <p className="text-white/50 text-xs">{full}</p>
        )}
      </div>
      <div className="absolute top-5 right-5">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white text-base">↗</div>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NoticiasPublicasPage() {
  const [noticias,      setNoticias]      = useState<Noticia[]>([]);
  const [comunicados,   setComunicados]   = useState<Comunicado[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState<TabKey>("todos");
  const [search,        setSearch]        = useState("");
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [scrolled,        setScrolled]        = useState(false);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (menuPanelRef.current) gsap.set(menuPanelRef.current, { xPercent: 100 });
    if (menuOverlayRef.current) gsap.set(menuOverlayRef.current, { opacity: 0, pointerEvents: "none" });
  }, []);

  const abrirMenu = () => {
    setMobileMenuOpen(true);
    const panel = menuPanelRef.current;
    const overlay = menuOverlayRef.current;
    if (!panel || !overlay) return;
    gsap.set(overlay, { pointerEvents: "auto" });
    gsap.to(overlay, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(panel, { xPercent: 0, duration: 0.45, ease: "power4.out" });
  };

  const cerrarMenu = () => {
    const panel = menuPanelRef.current;
    const overlay = menuOverlayRef.current;
    if (!panel || !overlay) return;
    const tl = gsap.timeline({ onComplete: () => setMobileMenuOpen(false) });
    tl.to(panel, { xPercent: 100, duration: 0.35, ease: "power3.in" });
    tl.to(overlay, { opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => { gsap.set(overlay, { pointerEvents: "none" }); } }, 0);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${API_URL}/anuncios`,     { signal: controller.signal }).then((r) => r.ok ? r.json() : []),
      fetch(`${API_URL}/comunicados`,  { signal: controller.signal }).then((r) => r.ok ? r.json() : []),
    ])
      .then(([n, c]) => {
        setNoticias(Array.isArray(n) ? n : []);
        setComunicados(Array.isArray(c) ? c : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const allItems: UnifiedItem[] = useMemo(() => {
    const items = [
      ...noticias.filter((n) => n.activo !== false && n.estado !== "borrador").map(noticiaToUnified),
      ...comunicados.filter((c) => c.activo !== false && c.estado !== "borrador").map(comunicadoToUnified),
    ];
    // Sort by date descending
    return items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [noticias, comunicados]);

  const filtered = useMemo(() => {
    let items = activeTab === "todos" ? allItems : allItems.filter((i) => i.tab === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) =>
        i.titulo.toLowerCase().includes(q) || i.extracto.toLowerCase().includes(q) || i.categoria.toLowerCase().includes(q)
      );
    }
    return items;
  }, [allItems, activeTab, search]);

  const featured = useMemo(
    () => filtered.find((i) => i.destacado) ?? filtered[0] ?? null,
    [filtered]
  );
  const rest = useMemo(
    () => (featured ? filtered.filter((i) => i.id !== featured.id) : filtered),
    [filtered, featured]
  );

  const counts = useMemo(() => {
    const map: Record<TabKey, number> = { todos: allItems.length, noticias: 0, eventos: 0, comunicados: 0, blog: 0 };
    allItems.forEach((i) => { map[i.tab] = (map[i.tab] ?? 0) + 1; });
    return map;
  }, [allItems]);

  return (
    <div className="min-h-screen" style={{ background: "var(--fondo-pagina, #f9fafb)", fontFamily: "'Instrument Sans', sans-serif" }}>

      {/* ── Hero + Nav unificados ─────────────────────────────────────────── */}
      <section className="relative w-full min-h-[60vh] flex flex-col overflow-hidden">

        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/noticias-hero.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 z-[1]" style={{ background: "rgba(0,0,0,0.55)" }} />

        {/* Nav desktop — fixed, transparente en top, blur al scroll */}
        <nav
          className="fixed top-0 left-0 right-0 z-[60] w-full px-8 py-5 hidden md:grid md:grid-cols-3 items-center transition-all duration-300"
          style={{ background: scrolled ? "rgba(0,0,0,0.45)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none" }}
        >
          {/* Izquierda: Inicio + Colaboradores */}
          <div className="flex items-center justify-end gap-8 pr-10">
            <Link href="/" className="text-lg font-medium text-white/50 hover:text-white transition-colors">Inicio</Link>
            <Link href="/#colaboradores" className="text-lg font-medium text-white/50 hover:text-white transition-colors">Colaboradores</Link>
          </div>

          {/* Centro: Logo */}
          <div className="flex justify-center">
            <Link href="/">
              <Image src={logo} alt="Atalayas EGM" className="h-12 w-auto brightness-0 invert" />
            </Link>
          </div>

          {/* Derecha: Comunidad + Noticias */}
          <div className="flex items-center justify-start gap-8 pl-10">
            <Link href="/#comunidad" className="text-lg font-medium text-white/50 hover:text-white transition-colors">Comunidad</Link>
            <span className="text-lg font-medium text-white cursor-default">Noticias</span>
          </div>
        </nav>

        {/* Mobile nav */}
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-[60] w-full px-6 py-5 flex items-center justify-between transition-all duration-300"
          style={{ background: scrolled ? "rgba(0,0,0,0.45)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none" }}
        >
          <Link href="/">
            <Image src={logo} alt="Atalayas EGM" className="h-10 w-auto brightness-0 invert" />
          </Link>
          <button className="p-1 flex items-center justify-center" onClick={abrirMenu} aria-label="Abrir menú">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Hero text */}
        <div className="relative z-20 flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 pb-20 pt-40">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-4">
            Blog · Noticias · Eventos · Comunicados
          </p>
          <h1
            className="text-5xl sm:text-7xl md:text-8xl text-white font-normal leading-[0.95] max-w-4xl"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-2px" }}
          >
            Mantente al día con Atalayas.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">
            Toda la actualidad del Área Empresarial: noticias, eventos, comunicados y más.
          </p>
        </div>

      </section>

      {/* Mobile menu panel */}
      <div className="md:hidden">
        <div ref={menuOverlayRef} onClick={cerrarMenu} className="fixed inset-0 z-[57]" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
        <div ref={menuPanelRef} className="fixed top-0 right-0 h-full z-[58] flex flex-col" style={{ width: "100%", background: "#fff" }}>
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <Image src={logo} alt="Atalayas EGM" className="h-10 w-auto" />
            <button onClick={cerrarMenu} aria-label="Cerrar menú" className="p-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col px-6 py-8 gap-1">
            <Link href="/" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3" style={{ color: "#111", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>Inicio</Link>
            <Link href="/noticias" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3" style={{ color: "#111", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>Noticias</Link>
            <a href="/#comunidad" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3" style={{ color: "#111", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>Comunidad</a>
            <a href="/#colaboradores" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3" style={{ color: "#111", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>Colaboradores</a>
            <Link href="/login" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3 mt-2" style={{ color: "var(--azul-egm)" }}>Entrar →</Link>
          </div>
        </div>
      </div>

      {/* ── Filters bar ──────────────────────────────────────────────────── */}
      <div
        className="w-full px-6 sm:px-12 lg:px-20 py-5 mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        style={{ background: "var(--fondo-pagina, #f9fafb)" }}
      >
        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 flex-nowrap">
          {TAB_LABELS.map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all whitespace-nowrap shrink-0${active ? " liquid-glass" : ""}`}
                style={{
                  background:  active ? "rgba(27,63,126,0.25)" : "white",
                  color:       active ? "#1B3F7E" : "var(--texto-muted, #6b7280)",
                  borderColor: active ? "rgba(27,63,126,0.3)" : "var(--gris-borde, #e5e7eb)",
                  boxShadow:   active ? "0 2px 12px rgba(27,63,126,0.15)" : "none",
                }}
              >
                {label}
                <span className="opacity-60 tabular-nums" style={{ fontSize: "10px" }}>
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full text-sm border outline-none transition-all"
            style={{
              background:  "white",
              borderColor: "var(--gris-borde, #e5e7eb)",
              color:       "var(--texto-primario, #111827)",
              fontFamily:  "'Instrument Sans', sans-serif",
            }}
          />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="w-full px-6 sm:px-12 lg:px-20 py-12">

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <p className="text-sm" style={{ color: "var(--texto-muted, #6b7280)" }}>Cargando contenido…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="text-lg font-semibold" style={{ color: "var(--texto-primario, #111827)" }}>Sin resultados</p>
            <p className="text-sm" style={{ color: "var(--texto-muted, #6b7280)" }}>
              {search ? "Prueba con otra búsqueda." : "No hay publicaciones en esta categoría todavía."}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <p className="mb-6 text-xs" style={{ color: "var(--texto-muted, #6b7280)" }}>
              Mostrando {filtered.length} {filtered.length === 1 ? "publicación" : "publicaciones"}
              {activeTab !== "todos" && ` en ${TAB_LABELS.find((t) => t.key === activeTab)?.label}`}
              {search && ` para «${search}»`}
            </p>

            {/* Grid 3 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        className="w-full px-6 sm:px-12 py-10 mt-16 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderColor: "var(--gris-borde, #e5e7eb)", background: "white" }}
      >
        <p className="text-sm" style={{ color: "var(--texto-muted, #6b7280)" }}>
          © {new Date().getFullYear()} EGM Atalayas Ciudad Empresarial
        </p>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm transition-colors hover:underline" style={{ color: "var(--texto-muted, #6b7280)" }}>
            Iniciar sesión
          </Link>
          <Link href="/register-empresa" className="text-sm transition-colors hover:underline" style={{ color: "var(--texto-muted, #6b7280)" }}>
            Registrar empresa
          </Link>
          <Link href="/privacidad" className="text-sm transition-colors hover:underline" style={{ color: "var(--texto-muted, #6b7280)" }}>
            Privacidad
          </Link>
        </div>
      </footer>
    </div>
  );
}
