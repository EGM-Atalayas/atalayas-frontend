"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import type { Noticia, Comunicado } from "@/lib/types/noticias";
import StaggeredMenu from "@/components/ui/StaggeredMenu";
import type { StaggeredMenuHandle } from "@/components/ui/StaggeredMenu";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://atalayas-backend-c25d.onrender.com/api/v1";

// ── helpers ──────────────────────────────────────────────────────────────────

type TabKey = "todos" | "noticias" | "eventos" | "comunicados" | "blog";

interface UnifiedItem {
  id: string;
  titulo: string;
  extracto: string;
  imagenUrl?: string | null;
  fecha: string;
  categoria: string;
  tab: Exclude<TabKey, "todos">;
  destacado?: boolean;
}

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: "todos",       label: "Todos" },
  { key: "noticias",    label: "Noticias" },
  { key: "eventos",     label: "Eventos" },
  { key: "comunicados", label: "Comunicados" },
  { key: "blog",        label: "Blog" },
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
    Blog: "blog",
    Evento: "eventos",
    Noticia: "noticias",
  };
  return {
    id:        n.anuncioId,
    titulo:    n.titulo,
    extracto:  n.contenido.slice(0, 120) + (n.contenido.length > 120 ? "…" : ""),
    imagenUrl: n.imagenUrl,
    fecha:     n.creadoEn,
    categoria: cat,
    tab:       tabMap[cat] ?? "noticias",
    destacado: n.fijado,
  };
}

function comunicadoToUnified(c: Comunicado): UnifiedItem {
  const cat = c.categoria ?? "Comunicado";
  const tabMap: Record<string, Exclude<TabKey, "todos">> = {
    Evento:     "eventos",
    Novedad:    "comunicados",
    Aviso:      "comunicados",
    General:    "comunicados",
    Comunicado: "comunicados",
  };
  return {
    id:        c.comunicadoId,
    titulo:    c.titulo,
    extracto:  c.mensaje.slice(0, 120) + (c.mensaje.length > 120 ? "…" : ""),
    imagenUrl: c.imagenUrl,
    fecha:     c.fechaPublicacion ?? c.actualizadoEn ?? new Date().toISOString(),
    categoria: cat,
    tab:       tabMap[cat] ?? "comunicados",
    destacado: c.destacado,
  };
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function NoticiaModal({ item, onClose }: { item: UnifiedItem; onClose: () => void }) {
  const tagColor = TAG_COLORS[item.categoria] ?? { bg: "#F1F5F9", color: "#475569" };
  const { full } = formatDate(item.fecha);

  // Cerrar con Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{ background: "white", fontFamily: "'Instrument Sans', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image header */}
        {item.imagenUrl ? (
          <div className="relative w-full h-56 sm:h-72 shrink-0 rounded-t-3xl sm:rounded-t-2xl overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imagenUrl} alt={item.titulo} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)" }} />
          </div>
        ) : (
          <div className="w-full h-24 shrink-0 rounded-t-3xl sm:rounded-t-2xl" style={{ background: "linear-gradient(135deg, hsl(220,70%,28%), hsl(210,75%,42%))" }} />
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)", color: "white" }}
          aria-label="Cerrar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8 flex flex-col gap-4">
          {/* Tag + date */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: tagColor.bg, color: tagColor.color }}>
              {item.categoria}
            </span>
            {item.destacado && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600">★ Destacado</span>
            )}
            {full && (
              <span className="text-xs ml-auto" style={{ color: "var(--texto-muted, #6b7280)" }}>{full}</span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold leading-snug" style={{ color: "var(--texto-primario, #111827)", letterSpacing: "-0.02em" }}>
            {item.titulo}
          </h2>

          {/* Body */}
          <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: "var(--texto-muted, #374151)" }}>
            {item.extracto}
          </p>

          {/* CTA */}
          <div className="pt-2 flex items-center gap-3 border-t mt-2" style={{ borderColor: "var(--gris-borde, #e5e7eb)" }}>
            <Link
              href="/login"
              className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] inline-flex items-center gap-2"
              style={{ background: "var(--azul-egm, #1B3F7E)" }}
              onClick={onClose}
            >
              Ver más en la plataforma
              <span>↗</span>
            </Link>
            <button
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm font-medium border transition-colors"
              style={{ borderColor: "var(--gris-borde, #e5e7eb)", color: "var(--texto-muted, #6b7280)" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bento card sizes ──────────────────────────────────────────────────────────
// Pattern repeats every 7 items: large, medium, small, small, medium, small, small
const BENTO_PATTERN: Array<"large" | "medium" | "small"> = [
  "large", "medium", "small", "small", "medium", "small", "small",
];

type CardSize = "large" | "medium" | "small";

function BentoCard({ item, size, onClick }: { item: UnifiedItem; size: CardSize; onClick: () => void }) {
  const tagColor = TAG_COLORS[item.categoria] ?? { bg: "#F1F5F9", color: "#475569" };
  const { day, month, year, full } = formatDate(item.fecha);
  const hasImage = !!item.imagenUrl;

  const sizeClasses: Record<CardSize, string> = {
    large:  "col-span-2 row-span-2 min-h-[300px]",
    medium: "col-span-2 row-span-1 min-h-[180px] md:col-span-1 md:row-span-2",
    small:  "col-span-2 row-span-1 min-h-[160px] md:col-span-1",
  };

  return (
    <article
      className={`relative rounded-2xl overflow-hidden group cursor-pointer flex flex-col justify-between ${sizeClasses[size]}`}
      style={{
        background: hasImage ? "#0f1423" : "var(--gris-superficie, #f1f5f9)",
        border: hasImage ? "none" : "1px solid var(--gris-borde, #e5e7eb)",
      }}
      onClick={onClick}
    >
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imagenUrl!} alt={item.titulo} className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105" />
      )}
      {hasImage && (
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)" }} />
      )}

      {/* Top — tag */}
      <div className="relative z-10 p-5 pb-0 flex items-start justify-between">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
          style={{
            background:     hasImage ? "rgba(255,255,255,0.15)" : tagColor.bg,
            color:          hasImage ? "rgba(255,255,255,0.9)"  : tagColor.color,
            backdropFilter: hasImage ? "blur(4px)" : "none",
          }}
        >
          {item.categoria}
        </span>
        {item.destacado && (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-400/20 text-yellow-500">★</span>
        )}
      </div>

      {/* Bottom — text */}
      <div className="relative z-10 p-5 pt-3">
        <h3
          className={`font-semibold leading-snug group-hover:underline ${size === "large" ? "text-xl sm:text-2xl" : "text-sm sm:text-base"}`}
          style={{ color: hasImage ? "white" : "var(--texto-primario, #111827)" }}
        >
          {item.titulo}
        </h3>
        {size !== "small" && (
          <p className={`text-sm mt-1.5 leading-relaxed ${size === "large" ? "line-clamp-3" : "line-clamp-2"}`}
            style={{ color: hasImage ? "rgba(255,255,255,0.65)" : "var(--texto-muted, #6b7280)" }}>
            {item.extracto}
          </p>
        )}
        <p className="text-xs mt-2" style={{ color: hasImage ? "rgba(255,255,255,0.45)" : "var(--texto-muted, #6b7280)" }}>
          {size === "large" ? full : `${day} ${month} ${year}`}
        </p>
      </div>

      {/* Arrow on hover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{ background: hasImage ? "rgba(255,255,255,0.2)" : "rgba(27,63,126,0.1)", color: hasImage ? "white" : "#1B3F7E", backdropFilter: "blur(4px)" }}>
          ↗
        </div>
      </div>
    </article>
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
  const [selectedItem,    setSelectedItem]    = useState<UnifiedItem | null>(null);
  const staggeredMenuRef = useRef<StaggeredMenuHandle>(null);

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
          src="/background-invitado.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 z-[1]" style={{ background: "rgba(0,0,0,0.55)" }} />

        {/* Nav — flotante sobre la imagen, sin borde */}
        <nav className="relative z-[60] w-full px-8 py-6 flex flex-row items-center justify-between md:grid md:grid-cols-3">
          <Link href="/">
            <Image src={logo} alt="Atalayas EGM" className="h-14 w-auto brightness-0 invert" />
          </Link>

          <div className="hidden md:flex items-center justify-center gap-8">
            <Link href="/" className="text-2xl font-medium text-white/50 hover:text-white transition-colors">Inicio</Link>
            <span className="text-2xl font-medium text-white cursor-default">Noticias</span>
            <Link href="/#comunidad" className="text-2xl font-medium text-white/50 hover:text-white transition-colors">Comunidad</Link>
            <Link href="/#colaboradores" className="text-2xl font-medium text-white/50 hover:text-white transition-colors">Colaboradores</Link>
          </div>

          <div className="hidden md:flex items-center justify-end">
            <Link
              href="/login"
              className="liquid-glass rounded-full px-6 py-2.5 text-base font-semibold text-white hover:scale-[1.03] transition-transform inline-flex items-center justify-center"
              style={{ background: "rgba(59, 130, 246, 0.25)" }}
            >
              Iniciar sesión
            </Link>
          </div>

          {/* Hamburguesa móvil */}
          <button
            className="md:hidden flex flex-col justify-center items-center gap-[5px] p-2 ml-auto"
            onClick={() => { staggeredMenuRef.current?.toggle(); setMobileMenuOpen((v) => !v); }}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
          >
            <span className={`block w-6 h-0.5 rounded transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-[7px] bg-black" : "bg-white"}`} />
            <span className={`block w-6 h-0.5 rounded transition-all duration-300 ${mobileMenuOpen ? "opacity-0 bg-black" : "bg-white"}`} />
            <span className={`block w-6 h-0.5 rounded transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px] bg-black" : "bg-white"}`} />
          </button>
        </nav>

        {/* Hero text */}
        <div className="relative z-20 flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 pb-20 pt-10">
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

      {/* Mobile StaggeredMenu */}
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

      {/* ── Filters bar ──────────────────────────────────────────────────── */}
      <div
        className="sticky top-[65px] z-40 w-full px-6 sm:px-12 lg:px-20 py-5 mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3"
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all whitespace-nowrap shrink-0"
                style={{
                  background:   active ? "var(--azul-egm, #1B3F7E)" : "white",
                  color:        active ? "white" : "var(--texto-muted, #6b7280)",
                  borderColor:  active ? "var(--azul-egm, #1B3F7E)" : "var(--gris-borde, #e5e7eb)",
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

            {/* Bento grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] gap-4">
              {filtered.map((item, idx) => (
                <BentoCard
                  key={item.id}
                  item={item}
                  size={BENTO_PATTERN[idx % BENTO_PATTERN.length]}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {selectedItem && (
        <NoticiaModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

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
