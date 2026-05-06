"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import logo from "@/public/logo.webp";
import type { Noticia, Comunicado } from "@/lib/types/noticias";
import StaggeredMenu from "@/components/ui/StaggeredMenu";
import type { StaggeredMenuHandle } from "@/components/ui/StaggeredMenu";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://atalayas-backend-c25d.onrender.com/api/v1";

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  Noticia:    { bg: "#EFF6FF", color: "#1B3F7E" },
  Evento:     { bg: "#F0FDF4", color: "#166534" },
  Comunicado: { bg: "#FFF7ED", color: "#9A3412" },
  Blog:       { bg: "#FAF5FF", color: "#6B21A8" },
  Novedad:    { bg: "#FFF7ED", color: "#9A3412" },
  Aviso:      { bg: "#FEF2F2", color: "#991B1B" },
  General:    { bg: "#F1F5F9", color: "#475569" },
};

function formatFull(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return ""; }
}

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
      out.push(<h3 key={i} style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827", margin: "16px 0 6px" }}>{parsInline(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      out.push(<h2 key={i} style={{ fontWeight: 800, fontSize: "1.25rem", color: "#111827", margin: "18px 0 6px" }}>{parsInline(line.slice(2))}</h2>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(<li key={i} style={{ marginLeft: "20px", listStyleType: "disc" }}>{parsInline(lines[i].slice(2))}</li>);
        i++;
      }
      out.push(<ul key={`ul${i}`} style={{ margin: "6px 0 10px" }}>{items}</ul>);
      continue;
    } else if (line.trim() === "") {
      out.push(<div key={i} style={{ height: "10px" }} />);
    } else {
      out.push(<p key={i} style={{ margin: "3px 0", lineHeight: 1.8 }}>{parsInline(line)}</p>);
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

interface UnifiedItem {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl?: string | null;
  fecha: string;
  categoria: string;
  destacado?: boolean;
  enlaceUrl?: string | null;
  enlaceTexto?: string | null;
  videoUrl?: string | null;
  adjuntoUrl?: string | null;
  adjuntoNombre?: string | null;
}

export default function NoticiaDetallePage() {
  const params = useParams();
  const id = params?.id as string;

  const [item, setItem] = useState<UnifiedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const staggeredMenuRef = useRef<StaggeredMenuHandle>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API_URL}/anuncios`).then((r) => r.ok ? r.json() : []),
      fetch(`${API_URL}/comunicados`).then((r) => r.ok ? r.json() : []),
    ]).then(([noticias, comunicados]: [Noticia[], Comunicado[]]) => {
      const noticia = noticias.find((n) => n.anuncioId === id);
      if (noticia) {
        setItem({
          id: noticia.anuncioId,
          titulo: noticia.titulo,
          contenido: noticia.contenido,
          imagenUrl: noticia.imagenUrl,
          fecha: noticia.creadoEn,
          categoria: noticia.categoria ?? "Noticia",
          destacado: noticia.fijado,
          enlaceUrl: noticia.enlaceUrl,
          enlaceTexto: noticia.enlaceTexto,
          videoUrl: noticia.videoUrl,
          adjuntoUrl: noticia.adjuntoUrl,
          adjuntoNombre: noticia.adjuntoNombre,
        });
        return;
      }
      const comunicado = comunicados.find((c) => c.comunicadoId === id);
      if (comunicado) {
        setItem({
          id: comunicado.comunicadoId,
          titulo: comunicado.titulo,
          contenido: comunicado.mensaje,
          imagenUrl: comunicado.imagenUrl,
          fecha: comunicado.fechaPublicacion ?? comunicado.actualizadoEn ?? new Date().toISOString(),
          categoria: comunicado.categoria ?? "Comunicado",
          destacado: comunicado.destacado,
          enlaceUrl: comunicado.enlaceUrl,
          enlaceTexto: comunicado.enlaceTexto,
          videoUrl: comunicado.videoUrl,
          adjuntoUrl: comunicado.adjuntoUrl,
          adjuntoNombre: comunicado.adjuntoNombre,
        });
        return;
      }
      setNotFound(true);
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const tagColor = item ? (TAG_COLORS[item.categoria] ?? { bg: "#F1F5F9", color: "#475569" }) : null;
  const embedUrl = item?.videoUrl ? getVideoEmbedUrl(item.videoUrl) : null;

  return (
    <div className="min-h-screen" style={{ background: "#f9fafb", fontFamily: "'Instrument Sans', sans-serif" }}>

      {/* ── Header desktop ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 w-full px-8 py-5 hidden md:grid md:grid-cols-3 items-center transition-all duration-300"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center justify-end gap-8 pr-10">
          <Link href="/" className="text-lg font-medium text-white/50 hover:text-white transition-colors">Inicio</Link>
          <Link href="/#colaboradores" className="text-lg font-medium text-white/50 hover:text-white transition-colors">Colaboradores</Link>
        </div>
        <div className="flex justify-center">
          <Link href="/"><Image src={logo} alt="Atalayas EGM" className="h-12 w-auto brightness-0 invert" /></Link>
        </div>
        <div className="flex items-center justify-start gap-8 pl-10">
          <Link href="/#comunidad" className="text-lg font-medium text-white/50 hover:text-white transition-colors">Comunidad</Link>
          <Link href="/noticias" className="text-lg font-medium text-white cursor-default">Noticias</Link>
        </div>
      </nav>

      {/* ── Header móvil ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 w-full px-6 py-5 flex items-center justify-between transition-all duration-300"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/"><Image src={logo} alt="Atalayas EGM" className="h-10 w-auto brightness-0 invert" /></Link>
        <button
          className="flex flex-col justify-center items-center gap-[5px] p-2"
          onClick={() => { staggeredMenuRef.current?.toggle(); setMobileMenuOpen((v) => !v); }}
          aria-label="Menú"
        >
          <span className="block w-6 h-0.5 rounded bg-white transition-all duration-300" />
          <span className="block w-6 h-0.5 rounded bg-white transition-all duration-300" />
          <span className="block w-6 h-0.5 rounded bg-white transition-all duration-300" />
        </button>
      </div>

      <StaggeredMenu
        ref={staggeredMenuRef}
        position="right"
        colors={["#1B3F7E", "#0d1b2e"]}
        accentColor="#A3B535"
        displayItemNumbering={true}
        closeOnClickAway={true}
        onMenuClose={() => setMobileMenuOpen(false)}
        items={[
          { label: "Inicio",        ariaLabel: "Ir al inicio",       link: "/" },
          { label: "Noticias",      ariaLabel: "Noticias",           link: "/noticias" },
          { label: "Comunidad",     ariaLabel: "Ir a Comunidad",     link: "/#comunidad" },
          { label: "Colaboradores", ariaLabel: "Ir a Colaboradores", link: "/#colaboradores" },
          { label: "Entrar",        ariaLabel: "Iniciar sesión",     link: "/login" },
        ]}
      />

      {/* ── Contenido ── */}
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        </div>
      )}

      {!loading && notFound && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
          <p className="text-2xl font-bold" style={{ color: "#111827" }}>Publicación no encontrada</p>
          <Link href="/noticias" className="text-sm font-semibold underline" style={{ color: "#1B3F7E" }}>
            ← Volver a noticias
          </Link>
        </div>
      )}

      {!loading && item && (
        <>
          <main className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 pt-32 pb-16">

            {/* Imagen */}
            {item.imagenUrl && (
              <div className="w-full rounded-2xl overflow-hidden mb-8" style={{ aspectRatio: "16/9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imagenUrl} alt={item.titulo} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Categoría + fecha */}
            <div className="flex items-center gap-3 mb-4">
              {tagColor && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: tagColor.bg, color: tagColor.color }}>
                  {item.categoria}
                </span>
              )}
              <span className="text-sm" style={{ color: "#9ca3af" }}>{formatFull(item.fecha)}</span>
            </div>

            {/* Título */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-8" style={{ color: "#111827" }}>
              {item.titulo}
            </h1>

            {/* Divisor */}
            <div className="mb-8" style={{ borderTop: "1px solid #e5e7eb" }} />

            {/* Contenido */}
            <div style={{ fontSize: "1rem", color: "#374151", lineHeight: 1.85, overflowWrap: "break-word" }}>
              {renderMarkdown(item.contenido)}
            </div>

            {/* Recursos */}
            {(embedUrl || item.adjuntoUrl || item.enlaceUrl) && (
              <div className="mt-10 pt-8 flex flex-col gap-4" style={{ borderTop: "1px solid #e5e7eb" }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Recursos adjuntos</p>
                {embedUrl && (
                  <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen style={{ border: "none" }} />
                  </div>
                )}
                {item.adjuntoUrl && (
                  <a href={item.adjuntoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "#f1f5f9", border: "1px solid #e5e7eb", textDecoration: "none" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#dbeafe" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#2563eb" }}>{item.adjuntoNombre ?? "Ver documento"}</span>
                  </a>
                )}
                {item.enlaceUrl && (
                  <a href={item.enlaceUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "#f1f5f9", border: "1px solid #e5e7eb", textDecoration: "none" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#dbeafe" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#2563eb" }}>{item.enlaceTexto ?? "Ver enlace"}</span>
                  </a>
                )}
              </div>
            )}

            {/* Volver */}
            <div className="mt-12">
              <Link href="/noticias"
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-opacity hover:opacity-80"
                style={{ background: "#1B3F7E", color: "white" }}>
                ← Volver a noticias
              </Link>
            </div>
          </main>
        </>
      )}


      {/* Footer */}
      <footer className="w-full px-6 sm:px-12 py-10 mt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderColor: "#e5e7eb", background: "white" }}>
        <p className="text-sm" style={{ color: "#6b7280" }}>© {new Date().getFullYear()} EGM Atalayas Ciudad Empresarial</p>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm hover:underline" style={{ color: "#6b7280" }}>Iniciar sesión</Link>
          <Link href="/privacidad" className="text-sm hover:underline" style={{ color: "#6b7280" }}>Privacidad</Link>
        </div>
      </footer>
    </div>
  );
}
