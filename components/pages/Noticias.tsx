"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { subirImagenModulo, subirAdjunto } from "@/lib/supabase";
import {
  getComunicados,
  getNoticias,
  crearNoticia,
  editarNoticia,
  desactivarNoticia,
} from "../../lib/api/noticias";
import type { Comunicado, Noticia, NoticiaInput } from "../../lib/types/noticias";
import DashboardHero from "@/components/ui/DashboardHero";

// ── TIPOS ──────────────────────────────────────────────────────────────────────
interface FeedItem {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string | null;
  fecha: string;
  fuente: "egm" | "empresa";
  categoria?: string | null;
  destacado: boolean;
  esNuevoItem: boolean;
  _raw: Comunicado | Noticia;
  // Nuevos campos
  videoUrl?:      string | null;
  adjuntoUrl?:    string | null;
  adjuntoNombre?: string | null;
  enlaceUrl?:     string | null;
  enlaceTexto?:   string | null;
  estado?:        string | null;
  fijado?:        boolean;
  vistas?:        number;
}

type FiltroFuente = "todos" | "egm" | "empresa";
type Orden = "reciente" | "antiguo";

// ── CONSTANTES ─────────────────────────────────────────────────────────────────
const ORDEN_LABELS: Record<Orden, string> = {
  reciente: "Más reciente",
  antiguo:  "Más antiguo",
};

const EMPTY_FORM: NoticiaInput = {
  titulo: "", contenido: "", esGlobal: false, empresaId: null, imagenUrl: null,
  enlaceUrl: null, enlaceTexto: null, videoUrl: null,
  adjuntoUrl: null, adjuntoNombre: null, estado: "publicado", fijado: false,
};

const GRAD_BTN  = "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)";
const GRAD_EGM  = "linear-gradient(135deg, #1b3f7e 0%, #0d1b2e 100%)";
const GRAD_EMP  = "linear-gradient(135deg, #2d5a3d 0%, #1a3a26 100%)";

// Colores activos por filtro (fondo, sombra)
const FILTRO_STYLES: Record<FiltroFuente, { bg: string; shadow: string }> = {
  todos:   { bg: GRAD_BTN,  shadow: "0 2px 8px rgba(37,99,235,0.25)" },
  egm:     { bg: GRAD_EGM,  shadow: "0 2px 8px rgba(27,63,126,0.30)" },
  empresa: { bg: GRAD_EMP,  shadow: "0 2px 8px rgba(45,90,61,0.30)"  },
};
const SHADOW_TXT = "0 2px 8px rgba(0,0,0,0.65)";

const MEGAPHONE = "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z";

// Colores para fondos OSCUROS (cards con overlay)
const CATEGORIA_COLORS_DARK: Record<string, { bg: string; text: string; border: string }> = {
  Novedad: { bg: "rgba(34,197,94,0.22)",  text: "#bbf7d0", border: "rgba(34,197,94,0.3)"   },
  Aviso:   { bg: "rgba(251,191,36,0.22)", text: "#fde68a", border: "rgba(251,191,36,0.32)" },
  Evento:  { bg: "rgba(167,139,250,0.2)", text: "#ddd6fe", border: "rgba(167,139,250,0.3)" },
  General: { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.78)", border: "rgba(255,255,255,0.16)" },
};

// Colores para fondos CLAROS (feed list sobre blanco)
const CATEGORIA_COLORS_LIGHT: Record<string, { bg: string; text: string; border: string }> = {
  Novedad: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  Aviso:   { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  Evento:  { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  General: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

// ── HELPERS ────────────────────────────────────────────────────────────────────
function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function esNuevo(iso?: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function estaExpirado(iso?: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

/** Convierte una URL de YouTube o Vimeo en URL de embed, o devuelve null */
function getVideoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/** Renderiza texto con Markdown básico: **negrita**, ## títulos, - listas */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      out.push(<h3 key={i} style={{ fontWeight: 700, fontSize: "1rem", color: "var(--texto-primario)", margin: "12px 0 4px" }}>{parsInline(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      out.push(<h2 key={i} style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--texto-primario)", margin: "14px 0 4px" }}>{parsInline(line.slice(2))}</h2>);
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

function parsInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith("**") && p.endsWith("**")
    ? <strong key={i}>{p.slice(2, -2)}</strong>
    : p
  )}</>;
}

function ordenarFeed(items: FeedItem[], orden: Orden): FeedItem[] {
  return [...items].sort((a, b) =>
    orden === "antiguo"
      ? new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      : new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}

// ── SUBCOMPONENTES REUTILIZABLES ───────────────────────────────────────────────
function MegaphoneIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1} style={{ opacity: 0.2 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={MEGAPHONE} />
    </svg>
  );
}

function Badge({ fuente, nombreEmpresa, categoria, destacado, esNuevoItem, size = "md", dark = true }: {
  fuente: "egm" | "empresa";
  nombreEmpresa?: string | null;
  categoria?: string | null;
  destacado?: boolean;
  esNuevoItem?: boolean;
  size?: "sm" | "md";
  dark?: boolean; // true = sobre fondo oscuro, false = sobre fondo claro
}) {
  const sm = size === "sm";
  const cls = `font-semibold rounded-full shrink-0 ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-0.5"}`;
  const CATS = dark ? CATEGORIA_COLORS_DARK : CATEGORIA_COLORS_LIGHT;

  return (
    <>
      {fuente === "egm" ? (
        <span className={cls} style={dark
          ? { background: "rgba(27,63,126,0.42)", color: "#bfdbfe", border: "1px solid rgba(147,197,253,0.3)" }
          : { background: "#dbeafe", color: "#1e3a8a", border: "1px solid #93c5fd" }}>
          EGM Atalayas
        </span>
      ) : (
        <span className={cls} style={dark
          ? { background: "rgba(45,90,61,0.55)", color: "#bbf7d0", border: "1px solid rgba(134,239,172,0.3)" }
          : { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)", border: "1px solid #c8d97a" }}>
          {nombreEmpresa ?? "Empresa"}
        </span>
      )}
      {fuente === "egm" && categoria && (() => {
        const col = CATS[categoria] ?? CATS.General;
        return (
          <span className={cls} style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
            {categoria}
          </span>
        );
      })()}
      {destacado && (
        <span className={cls} style={dark
          ? { background: "rgba(251,191,36,0.22)", color: "#fde68a", border: "1px solid rgba(251,191,36,0.32)" }
          : { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" }}>
          ★ Destacado
        </span>
      )}
      {esNuevoItem && (
        <span className={cls} style={dark
          ? { background: "rgba(34,197,94,0.22)", color: "#bbf7d0", border: "1px solid rgba(34,197,94,0.3)" }
          : { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" }}>
          Nuevo
        </span>
      )}
    </>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────────
export default function ComunicacionPage() {
  const { usuario } = useAuth();

  const esAdmin = usuario?.codigoRol === "ROLE_ADMIN_EMPRESA";

  // Datos
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [anuncios, setAnuncios]       = useState<Noticia[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);
  const [loadingAnuncios, setLoadingAnuncios]       = useState(true);

  // UI
  const [filtroFuente, setFiltroFuente] = useState<FiltroFuente>("todos");
  const [orden, setOrden]               = useState<Orden>("reciente");
  const [showOrden, setShowOrden]       = useState(false);
  const [modalItem, setModalItem]       = useState<FeedItem | null>(null);
  const [esMobil, setEsMobil]           = useState(false);
  const [visibles, setVisibles]         = useState(6);

  // Formulario
  const [showForm, setShowForm]     = useState(false);
  const [editando, setEditando]     = useState<Noticia | null>(null);
  const [form, setForm]             = useState<NoticiaInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  // Image upload & IA
  const [imagenModo, setImagenModo]       = useState<"url" | "upload">("url");
  const [uploadingImg, setUploadingImg]   = useState(false);
  const [aiLoading, setAiLoading]         = useState<"titulo" | "contenido" | null>(null);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  // Adjunto (PDF)
  const [uploadingAdj, setUploadingAdj]  = useState(false);
  const adjuntoRef                       = useRef<HTMLInputElement>(null);

  // Preview antes de publicar
  const [previewItem, setPreviewItem]    = useState<FeedItem | null>(null);

  useEffect(() => {
    const check = () => setEsMobil(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!showOrden) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".orden-dropdown")) setShowOrden(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showOrden]);

  // ── CARGA ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    cargarComunicados();
    if (usuario?.empresaId) cargarAnuncios();
    else setLoadingAnuncios(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.empresaId]);

  async function cargarComunicados() {
    setLoadingComunicados(true);
    try {
      const data = await getComunicados();
      const activos = data
        .filter((c) => c.activo && !estaExpirado(c.fechaExpiracion) && (c.estado ?? "publicado") === "publicado")
        .sort((a, b) => {
          if (a.destacado && !b.destacado) return -1;
          if (!a.destacado && b.destacado) return 1;
          return new Date(b.fechaPublicacion ?? "").getTime() - new Date(a.fechaPublicacion ?? "").getTime();
        });
      setComunicados(activos);
    } catch { setComunicados([]); }
    finally { setLoadingComunicados(false); }
  }

  async function cargarAnuncios() {
    setLoadingAnuncios(true);
    try {
      const data = await getNoticias(usuario?.empresaId);
      setAnuncios(data.filter((n) => n.activo && (n.estado ?? "publicado") === "publicado"));
    } catch { setAnuncios([]); }
    finally { setLoadingAnuncios(false); }
  }

  // ── HANDLERS FORMULARIO ────────────────────────────────────────────────────
  function abrirCrear() {
    setForm({ ...EMPTY_FORM, empresaId: usuario?.empresaId ?? null });
    setEditando(null); setShowForm(true); setFormError(null);
  }

  function abrirEditar(n: Noticia) {
    setForm({
      titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal,
      empresaId: n.empresaId, imagenUrl: n.imagenUrl ?? null,
      enlaceUrl: n.enlaceUrl ?? null, enlaceTexto: n.enlaceTexto ?? null,
      videoUrl: n.videoUrl ?? null,
      adjuntoUrl: n.adjuntoUrl ?? null, adjuntoNombre: n.adjuntoNombre ?? null,
      estado: n.estado ?? "publicado", fijado: n.fijado ?? false,
    });
    setEditando(n); setShowForm(true); setFormError(null); setImagenModo("url");
  }

  function cerrarForm() {
    setShowForm(false); setEditando(null); setForm(EMPTY_FORM); setFormError(null);
    setImagenModo("url"); setPreviewItem(null);
  }

  async function handleAdjuntoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAdj(true);
    try {
      const { url, nombre } = await subirAdjunto(file);
      setForm((f) => ({ ...f, adjuntoUrl: url, adjuntoNombre: nombre }));
    } catch {
      setFormError("Error al subir el documento. Inténtalo de nuevo.");
    } finally {
      setUploadingAdj(false);
      if (adjuntoRef.current) adjuntoRef.current.value = "";
    }
  }

  function abrirPreview() {
    const item: FeedItem = {
      id: "preview",
      titulo: form.titulo || "(Sin título)",
      descripcion: form.contenido,
      imagenUrl: form.imagenUrl,
      fecha: new Date().toISOString(),
      fuente: "empresa",
      categoria: null,
      destacado: form.fijado ?? false,
      esNuevoItem: true,
      videoUrl: form.videoUrl,
      adjuntoUrl: form.adjuntoUrl,
      adjuntoNombre: form.adjuntoNombre,
      enlaceUrl: form.enlaceUrl,
      enlaceTexto: form.enlaceTexto,
      estado: form.estado,
      _raw: {} as Noticia,
    };
    setPreviewItem(item);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await subirImagenModulo(file);
      setForm((f) => ({ ...f, imagenUrl: url }));
      setImagenModo("url");
    } catch {
      setFormError("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function sugerirConIA(campo: "titulo" | "contenido") {
    const base = campo === "titulo" ? (form.contenido.trim() || form.titulo.trim()) : form.contenido.trim();
    if (!base) { setFormError("Escribe algo antes de usar la IA."); return; }
    setAiLoading(campo); setFormError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: campo === "titulo"
            ? `Sugiere un título corto (máximo 80 caracteres), claro y atractivo para un anuncio de empresa con el siguiente contenido. Devuelve SOLO el título, sin comillas ni explicaciones.\n\nContenido: ${base}`
            : `Mejora la redacción de este anuncio de empresa. Hazlo más claro y profesional. Devuelve SOLO el texto mejorado, sin comentarios adicionales.\n\nTexto original: ${base}`
          }],
          context: {},
        }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader(); const dec = new TextDecoder(); let out = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; out += dec.decode(value); }
      if (campo === "titulo") setForm((f) => ({ ...f, titulo: out.trim() }));
      else setForm((f) => ({ ...f, contenido: out.trim() }));
    } catch { setFormError("La IA no está disponible en este momento."); }
    finally { setAiLoading(null); }
  }

  async function handleSubmit() {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      setFormError("El título y el contenido son obligatorios");
      return;
    }
    setSubmitting(true); setFormError(null);
    try {
      if (editando) await editarNoticia(editando.anuncioId, form);
      else await crearNoticia(form);
      await cargarAnuncios();
      cerrarForm();
    } catch { setFormError("Error al guardar. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  }

  async function handleDesactivar(id: string) {
    if (!confirm("¿Seguro que quieres eliminar este anuncio?")) return;
    try { await desactivarNoticia(id); await cargarAnuncios(); } catch {}
  }

  // ── FEED ───────────────────────────────────────────────────────────────────
  const feedEGM: FeedItem[] = comunicados.map((c) => ({
    id: c.comunicadoId, titulo: c.titulo, descripcion: c.mensaje,
    imagenUrl: c.imagenUrl, fecha: c.fechaPublicacion ?? "",
    fuente: "egm" as const, categoria: c.categoria, destacado: c.destacado,
    esNuevoItem: esNuevo(c.fechaPublicacion), _raw: c,
    videoUrl: c.videoUrl, adjuntoUrl: c.adjuntoUrl, adjuntoNombre: c.adjuntoNombre,
    enlaceUrl: c.enlaceUrl, enlaceTexto: c.enlaceTexto,
    estado: c.estado, vistas: c.vistas,
  }));

  const feedEmpresa: FeedItem[] = anuncios.map((n) => ({
    id: n.anuncioId, titulo: n.titulo, descripcion: n.contenido,
    imagenUrl: n.imagenUrl, fecha: n.creadoEn,
    fuente: "empresa" as const, categoria: null, destacado: n.fijado ?? false,
    esNuevoItem: esNuevo(n.creadoEn), _raw: n,
    videoUrl: n.videoUrl, adjuntoUrl: n.adjuntoUrl, adjuntoNombre: n.adjuntoNombre,
    enlaceUrl: n.enlaceUrl, enlaceTexto: n.enlaceTexto,
    estado: n.estado, vistas: n.vistas, fijado: n.fijado,
  }));

  const feedCompleto = ordenarFeed([...feedEGM, ...feedEmpresa], "reciente");

  const topItems = [...feedEGM, ...feedEmpresa]
    .sort((a, b) => {
      // fijado de empresa > destacado EGM > reciente
      if ((a.fijado || a.destacado) && !(b.fijado || b.destacado)) return -1;
      if (!(a.fijado || a.destacado) && (b.fijado || b.destacado)) return 1;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    })
    .slice(0, 4);

  const topIds   = new Set(topItems.map((i) => i.id));
  const feedResto = feedCompleto.filter((i) => !topIds.has(i.id));

  const feedFiltrado = ordenarFeed(
    filtroFuente === "todos" ? feedResto : feedCompleto.filter((i) => i.fuente === filtroFuente),
    orden
  );

  const cargando = loadingComunicados || loadingAnuncios;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <style>{`
        .featured-card-large { height: 300px; width: 100%; }
        @media (min-width: 768px) { .featured-card-large { height: 460px; flex: 0 0 58%; width: auto; } }
        .group:hover .card-img { transform: scale(1.04); }
        .card-img { transition: transform 0.4s ease; }
      `}</style>

      <DashboardHero prefijo="Centro de " titulo="Comunicación." imagenFondo="/background-comunicacion-empleado.jpg" />

      <div className="px-6 md:px-10 lg:px-16 pt-8 md:pt-12 pb-20">

        {/* ── BARRA FILTROS ───────────────────────────────────────────────── */}
        {!cargando && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2 md:gap-3">
            <div className="flex items-center gap-2" style={{ overflowX: esMobil ? "auto" : "visible", scrollbarWidth: "none" }}>
              {([
                { key: "todos",   label: "Todos" },
                { key: "egm",     label: "EGM Atalayas" },
                ...(usuario?.empresaId ? [{ key: "empresa", label: usuario.nombreEmpresa ?? "Tu empresa" }] : []),
              ] as { key: FiltroFuente; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltroFuente(key)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: filtroFuente === key ? FILTRO_STYLES[key].bg : "var(--blanco)",
                    color:      filtroFuente === key ? "#fff" : "var(--texto-secundario)",
                    border:     `1.5px solid ${filtroFuente === key ? "transparent" : "var(--gris-borde)"}`,
                    boxShadow:  filtroFuente === key ? FILTRO_STYLES[key].shadow : "none",
                  }}
                >
                  {label}
                  {key === "todos" && feedCompleto.length > 0 && (
                    <span className="ml-1.5 text-xs opacity-70">({feedCompleto.length})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 md:ml-auto self-end md:self-auto">
              {/* Ordenar */}
              <div className="relative orden-dropdown">
                <button
                  onClick={() => setShowOrden((v) => !v)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={{
                    background: showOrden ? GRAD_BTN : orden !== "reciente" ? "#eff6ff" : "var(--blanco)",
                    color: showOrden ? "#fff" : orden !== "reciente" ? "#2563eb" : "var(--texto-secundario)",
                    border: `1.5px solid ${showOrden ? "transparent" : orden !== "reciente" ? "#2563eb" : "var(--gris-borde)"}`,
                    boxShadow: showOrden ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
                  }}
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M6 12h12M10 17h4" />
                  </svg>
                  <span>Ordenar</span>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    style={{ transition: "transform 0.2s", transform: showOrden ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showOrden && (
                  <div className="absolute right-0 top-full mt-2 z-20 rounded-xl py-1 overflow-hidden"
                    style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: "190px" }}>
                    {(Object.entries(ORDEN_LABELS) as [Orden, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => { setOrden(key); setShowOrden(false); setVisibles(6); }}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                        style={{
                          background: orden === key ? "#eff6ff" : "transparent",
                          color: orden === key ? "#2563eb" : "var(--texto-primario)",
                          fontWeight: orden === key ? 600 : 400,
                        }}
                        onMouseEnter={(e) => { if (orden !== key) e.currentTarget.style.background = "var(--gris-superficie)"; }}
                        onMouseLeave={(e) => { if (orden !== key) e.currentTarget.style.background = "transparent"; }}
                      >
                        {label}
                        {orden === key && (
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {esAdmin && (
                <button
                  onClick={abrirCrear}
                  className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                  style={{ background: GRAD_BTN, color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}
                >
                  + Nuevo anuncio
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── FORMULARIO INLINE (admin) ────────────────────────────────────── */}
        {showForm && esAdmin && (
          <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
                {editando ? "Editar anuncio" : "Nuevo anuncio de empresa"}
              </h3>
              <button onClick={cerrarForm}
                className="w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none transition-colors"
                style={{ color: "var(--texto-muted)", background: "var(--gris-superficie)" }}>
                ×
              </button>
            </div>

            <div className="flex flex-col gap-4">

              {/* Título + IA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--texto-secundario)" }}>
                    Título <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <button type="button" onClick={() => sugerirConIA("titulo")}
                    disabled={aiLoading === "titulo"}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all disabled:opacity-60"
                    style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                    onMouseEnter={(e) => !aiLoading && (e.currentTarget.style.background = "#dbeafe")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                  >
                    {aiLoading === "titulo"
                      ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                      : <span>✨</span>}
                    {aiLoading === "titulo" ? "Generando..." : "Sugerir título"}
                  </button>
                </div>
                <input type="text" value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Recordatorio reunión de equipo"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-colors"
                  style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                />
              </div>

              {/* Contenido + IA + contador */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--texto-secundario)" }}>
                    Descripción <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--texto-muted)" }}>{form.contenido.length} car.</span>
                    <button type="button" onClick={() => sugerirConIA("contenido")}
                      disabled={aiLoading === "contenido" || !form.contenido.trim()}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all disabled:opacity-50"
                      style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                      onMouseEnter={(e) => !aiLoading && form.contenido.trim() && (e.currentTarget.style.background = "#dbeafe")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                    >
                      {aiLoading === "contenido"
                        ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                        : <span>✨</span>}
                      {aiLoading === "contenido" ? "Mejorando..." : "Mejorar con IA"}
                    </button>
                  </div>
                </div>
                <textarea value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  placeholder="Escribe el contenido del anuncio..."
                  rows={4}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none resize-none transition-colors"
                  style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                />
              </div>

              {/* Imagen: URL o subir archivo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--texto-secundario)" }}>Imagen (opcional)</label>
                  <div className="flex gap-0 rounded-lg overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                    {(["url", "upload"] as const).map((modo) => (
                      <button key={modo} type="button" onClick={() => setImagenModo(modo)}
                        className="text-xs px-3 py-1 font-medium transition-all"
                        style={{ background: imagenModo === modo ? GRAD_BTN : "transparent", color: imagenModo === modo ? "#fff" : "var(--texto-secundario)" }}
                      >
                        {modo === "url" ? "URL" : "Subir archivo"}
                      </button>
                    ))}
                  </div>
                </div>

                {imagenModo === "url" ? (
                  <>
                    <input type="url" value={form.imagenUrl ?? ""}
                      onChange={(e) => setForm({ ...form, imagenUrl: e.target.value || null })}
                      placeholder="https://..."
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                      style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                    />
                    {form.imagenUrl && (
                      <div className="relative mt-2">
                        <img src={form.imagenUrl} alt="preview" className="rounded-xl w-full object-cover"
                          style={{ height: "130px", objectFit: "cover" }}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <button type="button" onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>×</button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}
                      className="w-full flex flex-col items-center justify-center gap-2 rounded-xl py-5 text-sm transition-colors disabled:opacity-60"
                      style={{ border: "2px dashed var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-muted)" }}
                      onMouseEnter={(e) => !uploadingImg && (e.currentTarget.style.borderColor = "#93c5fd")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
                    >
                      {uploadingImg ? (
                        <><span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Subiendo...</span></>
                      ) : (
                        <><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span>Seleccionar imagen</span>
                        <span className="text-xs">JPG, PNG, WebP</span></>
                      )}
                    </button>
                    {form.imagenUrl && (
                      <div className="relative mt-2">
                        <img src={form.imagenUrl} alt="preview" className="rounded-xl w-full object-cover" style={{ height: "130px", objectFit: "cover" }} />
                        <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.85)", color: "#fff" }}>✓ Subida</span>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>×</button>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                  Video (YouTube o Vimeo, opcional)
                </label>
                <input type="url" value={form.videoUrl ?? ""}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value || null })}
                  placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                />
                {form.videoUrl && getVideoEmbedUrl(form.videoUrl) && (
                  <div className="mt-2 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe src={getVideoEmbedUrl(form.videoUrl)!} className="w-full h-full" allowFullScreen />
                  </div>
                )}
              </div>

              {/* Adjunto PDF */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                  Documento adjunto (PDF, opcional)
                </label>
                <input ref={adjuntoRef} type="file" accept=".pdf,.doc,.docx" onChange={handleAdjuntoUpload} className="hidden" />
                {form.adjuntoUrl ? (
                  <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                    style={{ border: "1.5px solid #86efac", background: "#f0fdf4" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm flex-1 truncate" style={{ color: "#166534" }}>{form.adjuntoNombre ?? "Documento"}</span>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, adjuntoUrl: null, adjuntoNombre: null }))}
                      className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--error)", background: "var(--error-light)" }}>
                      Quitar
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => adjuntoRef.current?.click()} disabled={uploadingAdj}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
                    style={{ border: "1.5px dashed var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-muted)" }}
                    onMouseEnter={(e) => !uploadingAdj && (e.currentTarget.style.borderColor = "#93c5fd")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}>
                    {uploadingAdj ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Subiendo...</span></> :
                      <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg><span>Adjuntar documento (PDF, Word...)</span></>}
                  </button>
                )}
              </div>

              {/* Enlace externo / CTA */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                  Enlace externo (opcional)
                </label>
                <div className="flex flex-col gap-2">
                  <input type="url" value={form.enlaceUrl ?? ""}
                    onChange={(e) => setForm({ ...form, enlaceUrl: e.target.value || null })}
                    placeholder="https://..."
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                    style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                  />
                  {form.enlaceUrl && (
                    <input type="text" value={form.enlaceTexto ?? ""}
                      onChange={(e) => setForm({ ...form, enlaceTexto: e.target.value || null })}
                      placeholder='Texto del botón (ej: "Más información", "Inscríbete")'
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                      style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                    />
                  )}
                </div>
              </div>

              {/* Opciones: fijado + estado */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={form.fijado ?? false}
                    onChange={(e) => setForm({ ...form, fijado: e.target.checked })}
                    className="w-4 h-4 rounded" style={{ accentColor: "#2563eb" }} />
                  <span className="text-sm" style={{ color: "var(--texto-secundario)" }}>
                    📌 Fijar en la parte superior
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={form.estado === "borrador"}
                    onChange={(e) => setForm({ ...form, estado: e.target.checked ? "borrador" : "publicado" })}
                    className="w-4 h-4 rounded" style={{ accentColor: "#2563eb" }} />
                  <span className="text-sm" style={{ color: "var(--texto-secundario)" }}>
                    Guardar como borrador (no visible para empleados)
                  </span>
                </label>
              </div>

            {formError && <p className="text-sm mt-1" style={{ color: "var(--error)" }}>{formError}</p>}

            <div className="flex gap-2 justify-end pt-5 mt-2" style={{ borderTop: "1px solid var(--gris-borde)" }}>
              <button onClick={cerrarForm}
                className="text-sm px-4 py-2 rounded-xl transition-colors"
                style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}>
                Cancelar
              </button>
              <button type="button" onClick={abrirPreview}
                className="text-sm px-4 py-2 rounded-xl transition-colors"
                style={{ color: "#2563eb", border: "1px solid #bfdbfe", background: "#eff6ff" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}>
                Previsualizar
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
                style={{ background: GRAD_BTN, color: "#fff" }}>
                {submitting ? "Guardando..." : editando ? "Guardar cambios" : form.estado === "borrador" ? "Guardar borrador" : "Publicar anuncio"}
              </button>
            </div>
          </div>
        )}

        {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────────────── */}
        {cargando ? (
          <Spinner />
        ) : feedCompleto.length === 0 ? (
          <EstadoVacio
            titulo="Sin comunicados publicados"
            descripcion="Cuando EGM Atalayas o tu empresa publiquen comunicados aparecerán aquí."
            accion={esAdmin ? "Crear primer anuncio" : undefined}
            onAccion={esAdmin ? abrirCrear : undefined}
          />
        ) : filtroFuente === "todos" ? (
          <>
            {/* Grid 1 grande + pequeñas */}
            {topItems.length > 0 && (
              <div className="mb-10">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className={topItems.length === 1 ? "w-full" : "featured-card-large"}>
                    <FeaturedCard item={topItems[0]} size="large" onOpen={() => setModalItem(topItems[0])} fill
                      esAdmin={esAdmin}
                      onEdit={() => abrirEditar(topItems[0]._raw as Noticia)}
                      onDelete={() => handleDesactivar((topItems[0]._raw as Noticia).anuncioId)}
                    />
                  </div>
                  {topItems.length > 1 && (
                    <div className="hidden md:flex flex-col gap-3"
                      style={{ flex: 1, justifyContent: topItems.length < 4 ? "flex-start" : "stretch" }}>
                      {topItems.slice(1, 4).map((item) => (
                        <div key={item.id} style={{ flex: topItems.length < 4 ? "0 0 auto" : 1, height: topItems.length < 4 ? "120px" : undefined }}>
                          <FeaturedCard item={item} size="small" onOpen={() => setModalItem(item)} fill
                            esAdmin={esAdmin}
                            onEdit={() => abrirEditar(item._raw as Noticia)}
                            onDelete={() => handleDesactivar((item._raw as Noticia).anuncioId)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feed — items no mostrados en el grid */}
            {feedResto.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-semibold uppercase" style={{ color: "var(--texto-muted)", letterSpacing: "0.07em" }}>
                    Más publicaciones
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--gris-borde)" }} />
                </div>
                <FeedList
                  items={feedResto.slice(0, visibles)}
                  esAdmin={esAdmin}
                  esMobil={esMobil}
                  nombreEmpresa={usuario?.nombreEmpresa}
                  onOpen={setModalItem}
                  onEdit={(item) => abrirEditar(item._raw as Noticia)}
                  onDelete={(item) => handleDesactivar((item._raw as Noticia).anuncioId)}
                />
                {feedResto.length > visibles && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setVisibles((v) => v + 6)}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: GRAD_BTN, color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.22)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      Ver más publicaciones
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : feedFiltrado.length === 0 ? (
          <EstadoVacio
            titulo={`Sin publicaciones de ${filtroFuente === "egm" ? "EGM Atalayas" : (usuario?.nombreEmpresa ?? "tu empresa")}`}
            descripcion="Prueba con el filtro Todos para ver todas las publicaciones."
          />
        ) : (
          <FeedList
            items={feedFiltrado}
            esAdmin={esAdmin}
            esMobil={esMobil}
            nombreEmpresa={usuario?.nombreEmpresa}
            onOpen={setModalItem}
            onEdit={(item) => abrirEditar(item._raw as Noticia)}
            onDelete={(item) => handleDesactivar((item._raw as Noticia).anuncioId)}
          />
        )}
      </div>

      {/* ── MODAL (contenido real o preview) ─────────────────────────────── */}
      {(modalItem || previewItem) && (() => {
        const item = previewItem ?? modalItem!;
        const isPreview = !!previewItem;
        const onClose = isPreview ? () => setPreviewItem(null) : () => setModalItem(null);
        const embedUrl = item.videoUrl ? getVideoEmbedUrl(item.videoUrl) : null;
        return (
          <Modal onClose={onClose}>
            {isPreview && (
              <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold"
                style={{ background: "#fef9c3", color: "#854d0e", borderBottom: "1px solid #fde047" }}>
                <span>👁</span> Vista previa — así verán los usuarios este anuncio
              </div>
            )}

            {/* Cabecera imagen / gradiente */}
            <div className="relative w-full overflow-hidden" style={{ height: "240px" }}>
              {item.imagenUrl ? (
                <img src={item.imagenUrl} alt={item.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: item.fuente === "egm" ? GRAD_EGM : GRAD_EMP }}>
                  <MegaphoneIcon size={64} />
                </div>
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,10,28,0.92) 0%, rgba(3,10,28,0.3) 50%, transparent 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 flex items-end justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge fuente={item.fuente} nombreEmpresa={usuario?.nombreEmpresa} categoria={item.categoria} destacado={item.destacado} esNuevoItem={item.esNuevoItem} />
                </div>
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)", textShadow: SHADOW_TXT }}>
                  {formatDate(item.fecha)}
                </span>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 md:p-8">
              <h2 className="font-bold leading-tight mb-4"
                style={{ fontSize: "clamp(1.2rem, 3vw, 1.55rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em" }}>
                {item.titulo}
              </h2>

              {/* Texto con Markdown */}
              <div style={{ fontSize: "0.95rem", color: "var(--texto-secundario)" }}>
                {renderMarkdown(item.descripcion)}
              </div>

              {/* Video embed */}
              {embedUrl && (
                <div className="mt-6 rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                    style={{ border: "none" }} />
                </div>
              )}

              {/* Adjunto */}
              {item.adjuntoUrl && (
                <a href={item.adjuntoUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                  style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: "#2563eb" }}>
                    {item.adjuntoNombre ?? "Ver documento adjunto"}
                  </span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              )}

              {/* CTA externo */}
              {item.enlaceUrl && (
                <a href={item.enlaceUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-opacity"
                  style={{ background: GRAD_BTN, color: "#fff", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                  {item.enlaceTexto ?? "Más información"}
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
              )}

              {/* Vistas */}
              {!isPreview && item.vistas !== undefined && item.vistas > 0 && (
                <p className="text-xs mt-5" style={{ color: "var(--texto-muted)" }}>
                  {item.vistas} {item.vistas === 1 ? "visualización" : "visualizaciones"}
                </p>
              )}

              <div className="mt-6 pt-4 flex justify-end" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                <button onClick={onClose}
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  {isPreview ? "Cerrar vista previa" : "Cerrar"}
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ── FEED LIST ─────────────────────────────────────────────────────────────────
function FeedList({ items, esAdmin, esMobil, nombreEmpresa, onOpen, onEdit, onDelete }: {
  items: FeedItem[];
  esAdmin: boolean;
  esMobil: boolean;
  nombreEmpresa?: string | null;
  onOpen: (item: FeedItem) => void;
  onEdit: (item: FeedItem) => void;
  onDelete: (item: FeedItem) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
      {items.map((item, i) => (
        <FeedRow
          key={item.id}
          item={item}
          isLast={i === items.length - 1}
          esAdmin={esAdmin}
          esMobil={esMobil}
          nombreEmpresa={nombreEmpresa}
          onOpen={() => onOpen(item)}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      ))}
    </div>
  );
}

// ── FEATURED CARD ─────────────────────────────────────────────────────────────
function FeaturedCard({ item, size, onOpen, fill = false, esAdmin, onEdit, onDelete }: {
  item: FeedItem; size: "large" | "small"; onOpen: () => void; fill?: boolean;
  esAdmin?: boolean; onEdit?: () => void; onDelete?: () => void;
}) {
  const isLarge   = size === "large";
  const bgGradient = item.fuente === "egm" ? GRAD_EGM : GRAD_EMP;

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        minHeight: (isLarge && !fill) ? "420px" : undefined,
        height: fill ? "100%" : undefined,
        outline: "1.5px solid transparent",
        boxShadow: "0 0 0 rgba(0,0,0,0)",
        transition: "outline-color 0.25s, box-shadow 0.25s",
      }}
      onClick={onOpen}
      onMouseEnter={(e) => {
        e.currentTarget.style.outline = "1.5px solid rgba(255,255,255,0.22)";
        e.currentTarget.style.boxShadow = isLarge
          ? "0 8px 32px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.1)"
          : "0 4px 18px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.outline = "1.5px solid transparent";
        e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
      }}
    >
      {/* Fondo */}
      {item.imagenUrl ? (
        <img src={item.imagenUrl} alt={item.titulo} className="card-img absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: bgGradient }}>
          <MegaphoneIcon size={isLarge ? 72 : 36} />
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.38) 100%)" }} />
      <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0" style={{ background: "rgba(0,0,0,0.15)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(3,10,25,0.52) 0%, transparent 32%)" }} />
      <div className="absolute inset-0" style={{ background: isLarge
        ? "linear-gradient(to top, rgba(3,10,25,0.97) 30%, rgba(3,10,25,0.18) 62%, transparent 100%)"
        : "linear-gradient(to top, rgba(3,10,25,0.97) 42%, rgba(3,10,25,0.12) 72%, transparent 100%)" }} />

      {/* ── Botones admin (empresa) ────────────────────────────────────── */}
      {esAdmin && item.fuente === "empresa" && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", backdropFilter: "blur(4px)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}>
            Editar
          </button>
          <button onClick={onDelete}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
            style={{ background: "rgba(200,75,49,0.55)", color: "#fff", border: "1px solid rgba(200,75,49,0.6)", backdropFilter: "blur(4px)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,75,49,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(200,75,49,0.55)")}>
            Eliminar
          </button>
        </div>
      )}

      {/* ── Grande ─────────────────────────────────────────────────────── */}
      {isLarge && (
        <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-8">
          <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
            <Badge fuente={item.fuente} categoria={item.categoria} destacado={item.destacado} esNuevoItem={item.esNuevoItem} />
            <span className="text-sm font-medium ml-auto" style={{ color: "rgba(255,255,255,0.75)", textShadow: SHADOW_TXT }}>
              {formatDate(item.fecha)}
            </span>
          </div>
          <h2 className="text-white leading-tight mb-2 md:mb-3 max-w-xl"
            style={{ fontWeight: 800, fontSize: "clamp(1.1rem, 4vw, 2.1rem)", letterSpacing: "-0.02em", textShadow: SHADOW_TXT }}>
            {item.titulo}
          </h2>
          <p className="text-sm md:text-base leading-relaxed line-clamp-2 max-w-lg"
            style={{ color: "rgba(255,255,255,0.7)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            {item.descripcion}
          </p>
          <div className="mt-3 md:mt-5 flex items-center gap-2 transition-opacity opacity-55 group-hover:opacity-100">
            <span className="text-sm font-semibold text-white" style={{ textShadow: SHADOW_TXT }}>Leer más</span>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Pequeña ─────────────────────────────────────────────────────── */}
      {!isLarge && (
        <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ paddingBottom: "14px" }}>
          {/* Fecha arriba-izquierda — lejos de los botones admin (arriba-derecha) */}
          <span className="absolute top-3.5 left-4 text-xs font-semibold"
            style={{ color: "rgba(255,255,255,0.82)", textShadow: SHADOW_TXT, letterSpacing: "0.01em" }}>
            {formatDate(item.fecha)}
          </span>
          {/* Flecha arriba-derecha solo si no es admin empresa */}
          {!(esAdmin && item.fuente === "empresa") && (
            <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.32)" }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden mb-1.5">
            <Badge fuente={item.fuente} categoria={item.categoria} esNuevoItem={item.esNuevoItem} size="sm" />
          </div>
          <h2 className="text-white leading-tight line-clamp-2 pr-2"
            style={{ fontWeight: 800, fontSize: "clamp(0.88rem, 1.2vw, 1.05rem)", letterSpacing: "-0.02em", textShadow: SHADOW_TXT }}>
            {item.titulo}
          </h2>
        </div>
      )}
    </div>
  );
}

// ── FEED ROW ──────────────────────────────────────────────────────────────────
function FeedRow({ item, isLast, esAdmin, esMobil, nombreEmpresa, onOpen, onEdit, onDelete }: {
  item: FeedItem; isLast: boolean; esAdmin: boolean; esMobil: boolean;
  nombreEmpresa?: string | null;
  onOpen: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const accentColor = item.fuente === "egm" ? "var(--azul-accion)" : "var(--verde-oliva)";

  return (
    <div
      className="flex items-center gap-3 md:gap-5 cursor-pointer transition-colors"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--gris-borde)",
        background: hovered ? "var(--gris-superficie)" : "transparent",
        paddingTop: esMobil ? "12px" : "20px",
        paddingBottom: esMobil ? "12px" : "20px",
        paddingLeft: 0,
        paddingRight: esMobil ? "12px" : "20px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      {/* Acento izquierdo: borde en desktop, margen en móvil */}
      <div
        className="self-stretch shrink-0 rounded-full"
        style={{
          width: esMobil ? "12px" : "3px",
          background: (!esMobil && hovered) ? accentColor : "transparent",
          transition: "background 0.2s",
          marginLeft: esMobil ? 0 : "16px",
        }}
      />

      {/* Thumbnail */}
      <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: esMobil ? "76px" : "160px", height: esMobil ? "60px" : "110px" }}>
        {item.imagenUrl ? (
          <img src={item.imagenUrl} alt={item.titulo}
            className="w-full h-full object-cover transition-transform duration-400"
            style={{ transform: hovered ? "scale(1.04)" : "scale(1)" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: item.fuente === "egm" ? GRAD_EGM : GRAD_EMP }}>
            <MegaphoneIcon size={esMobil ? 20 : 32} />
          </div>
        )}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ gap: esMobil ? "3px" : "6px" }}>
        <div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
          <span className="text-[10px] font-medium shrink-0" style={{ color: "var(--texto-muted)" }}>{formatDate(item.fecha)}</span>
          <span className="shrink-0" style={{ color: "var(--gris-borde)" }}>·</span>
          <Badge fuente={item.fuente} nombreEmpresa={nombreEmpresa} categoria={item.categoria} esNuevoItem={item.esNuevoItem} size="sm" dark={false} />
        </div>

        <h3 className="font-bold leading-snug line-clamp-2 transition-colors"
          style={{ fontSize: esMobil ? "0.82rem" : "1.05rem", color: hovered ? "var(--azul-accion)" : "var(--texto-primario)" }}>
          {item.titulo}
        </h3>

        {!esMobil && (
          <p className="text-sm line-clamp-1 leading-relaxed" style={{ color: "var(--texto-muted)" }}>
            {item.descripcion}
          </p>
        )}
      </div>

      {/* Acciones admin */}
      {esAdmin && item.fuente === "empresa" && (
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit}
            className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
            style={{ color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
            </svg>
            {!esMobil && "Editar"}
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
            style={{ color: "var(--error)", background: "var(--error-light)", border: "1px solid #f5c6bb" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fad4cc")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--error-light)")}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {!esMobil && "Eliminar"}
          </button>
        </div>
      )}

      {/* Flecha */}
      {!(esAdmin && item.fuente === "empresa") && (
        <div className="shrink-0 transition-opacity" style={{ opacity: hovered ? 0.7 : 0.35 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── SUBCOMPONENTES ─────────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "var(--blanco)", maxHeight: "88vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-base transition-colors"
          style={{ background: "rgba(0,0,0,0.1)", color: "var(--texto-primario)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
        {label} {required && <span style={{ color: "var(--error)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
    </div>
  );
}

function EstadoVacio({ titulo, descripcion, accion, onAccion }: {
  titulo: string; descripcion: string; accion?: string; onAccion?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
      style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(27,63,126,0.08)", color: "var(--azul-egm)" }}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={MEGAPHONE} />
        </svg>
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: "var(--texto-primario)" }}>{titulo}</p>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: "var(--texto-muted)" }}>{descripcion}</p>
      {accion && onAccion && (
        <button onClick={onAccion} className="mt-5 text-sm font-semibold px-5 py-2.5 rounded-xl"
          style={{ background: GRAD_BTN, color: "#fff" }}>
          {accion}
        </button>
      )}
    </div>
  );
}
