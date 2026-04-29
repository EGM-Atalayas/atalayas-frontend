"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-[60] w-full px-8 py-5 flex flex-row items-center justify-between md:grid md:grid-cols-3 border-b"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderColor: "var(--gris-borde, #e5e7eb)" }}
      >
        {/* Logo */}
        <Link href="/">
          <Image src={logo} alt="Atalayas EGM" className="h-12 w-auto" />
        </Link>

        {/* Nav links — desktop only */}
        <div className="hidden md:flex items-center justify-center gap-8">
          <Link href="/" className="text-2xl font-medium text-black/50 hover:text-black transition-colors">Inicio</Link>
          <span className="text-2xl font-medium text-black cursor-default transition-colors">Noticias</span>
          <Link href="/#comunidad" className="text-2xl font-medium text-black/50 hover:text-black transition-colors">Comunidad</Link>
          <Link href="/#colaboradores" className="text-2xl font-medium text-black/50 hover:text-black transition-colors">Colaboradores</Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center justify-end">
          <Link
            href="/login"
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
            style={{ background: "var(--azul-egm, #1B3F7E)" }}
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Botón hamburguesa — solo móvil */}
        <button
          className="md:hidden flex flex-col justify-center items-center gap-[5px] p-2 ml-auto"
          onClick={() => {
            staggeredMenuRef.current?.toggle();
            setMobileMenuOpen((v) => !v);
          }}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
        >
          <span className={`block w-6 h-0.5 rounded transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-[7px] bg-black" : "bg-black"}`} />
          <span className={`block w-6 h-0.5 rounded transition-all duration-300 ${mobileMenuOpen ? "opacity-0 bg-black" : "bg-black"}`} />
          <span className={`block w-6 h-0.5 rounded transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px] bg-black" : "bg-black"}`} />
        </button>
      </nav>

      {/* Mobile StaggeredMenu overlay */}
      <StaggeredMenu
        ref={staggeredMenuRef}
        position="right"
        colors={["#1B3F7E", "#0d1b2e"]}
        accentColor="#A3B535"
        displayItemNumbering={true}
        closeOnClickAway={true}
        onMenuClose={() => setMobileMenuOpen(false)}
        items={[
          { label: "Inicio",        ariaLabel: "Ir al inicio",        link: "/" },
          { label: "Noticias",      ariaLabel: "Noticias",            link: "/noticias" },
          { label: "Comunidad",     ariaLabel: "Ir a Comunidad",      link: "/#comunidad" },
          { label: "Colaboradores", ariaLabel: "Ir a Colaboradores",  link: "/#colaboradores" },
          { label: "Entrar",        ariaLabel: "Iniciar sesión",      link: "/login" },
        ]}
      />

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="w-full px-6 sm:px-12 lg:px-20 pt-14 pb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-px" style={{ background: "var(--azul-egm, #1B3F7E)" }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--texto-muted, #6b7280)" }}>
            Blog · Noticias · Eventos · Comunicados
          </p>
        </div>
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-none"
          style={{ color: "var(--texto-primario, #111827)", letterSpacing: "-0.03em" }}
        >
          Mantente al día
          <br />
          <span style={{ color: "var(--azul-egm, #1B3F7E)" }}>con Atalayas</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: "var(--texto-muted, #6b7280)" }}>
          Toda la actualidad del Área Empresarial de Atalayas: noticias, eventos, comunicados y más — en un solo lugar y sin necesidad de cuenta.
        </p>
      </header>

      {/* ── Filters bar ──────────────────────────────────────────────────── */}
      <div
        className="sticky top-[65px] z-40 w-full px-6 sm:px-12 lg:px-20 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b"
        style={{ background: "rgba(249,250,251,0.95)", backdropFilter: "blur(8px)", borderColor: "var(--gris-borde, #e5e7eb)" }}
      >
        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 flex-nowrap">
          {TAB_LABELS.map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap shrink-0"
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
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Featured */}
            <div className="lg:w-[44%] shrink-0">
              {featured && <FeaturedCard item={featured} />}
              {/* Count info */}
              <p className="mt-4 text-xs" style={{ color: "var(--texto-muted, #6b7280)" }}>
                Mostrando {filtered.length} {filtered.length === 1 ? "publicación" : "publicaciones"}
                {activeTab !== "todos" && ` en ${TAB_LABELS.find((t) => t.key === activeTab)?.label}`}
                {search && ` para «${search}»`}
              </p>
            </div>

            {/* List */}
            <div className="flex-1 min-w-0">
              {rest.length === 0 && featured && (
                <p className="text-sm py-8 text-center" style={{ color: "var(--texto-muted, #6b7280)" }}>
                  Solo hay una publicación en esta categoría.
                </p>
              )}
              {rest.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>

          </div>
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
