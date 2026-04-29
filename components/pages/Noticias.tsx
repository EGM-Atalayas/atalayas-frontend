"use client";

import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getComunicados,
  getNoticias,
  crearNoticia,
  editarNoticia,
  desactivarNoticia,
  crearComunicado,
  editarComunicado,
  desactivarComunicado,
  registrarVistaNoticia,
  subirImagenBackend,
  subirAdjuntoBackend,
} from "../../lib/api/noticias";
import type { Comunicado, Noticia, NoticiaInput, ComunicadoInput } from "../../lib/types/noticias";
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

const EMPTY_FORM_COMUNICADO: ComunicadoInput = {
  titulo: "", mensaje: "", imagenUrl: null, categoria: "General", destacado: false,
  enlaceUrl: null, enlaceTexto: null, videoUrl: null,
  adjuntoUrl: null, adjuntoNombre: null, estado: "publicado",
};

const EMPTY_FORM: NoticiaInput = {
  titulo: "", contenido: "", esGlobal: false, empresaId: null, imagenUrl: null,
  enlaceUrl: null, enlaceTexto: null, videoUrl: null,
  adjuntoUrl: null, adjuntoNombre: null, estado: "publicado", fijado: false,
  categoria: null,
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
  Aviso:   { bg: "rgba(220,38,38,0.22)",  text: "#fca5a5", border: "rgba(220,38,38,0.32)"  },
  Evento:  { bg: "rgba(167,139,250,0.2)", text: "#ddd6fe", border: "rgba(167,139,250,0.3)" },
  General: { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.78)", border: "rgba(255,255,255,0.16)" },
};

// Colores para fondos CLAROS (feed list sobre blanco)
const CATEGORIA_COLORS_LIGHT: Record<string, { bg: string; text: string; border: string }> = {
  Aviso:   { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  Evento:  { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  General: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

// ── HELPERS ────────────────────────────────────────────────────────────────────
function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function formatRelative(iso?: string | null): string {
  if (!iso) return "";
  const diff   = Date.now() - new Date(iso).getTime();
  const min    = Math.floor(diff / 60000);
  const hrs    = Math.floor(diff / 3600000);
  const days   = Math.floor(diff / 86400000);
  const weeks  = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (min < 1)      return "Ahora mismo";
  if (min < 60)     return `Hace ${min} min`;
  if (hrs < 24)     return `Hace ${hrs} h`;
  if (days < 7)     return `Hace ${days} día${days > 1 ? "s" : ""}`;
  if (weeks < 5)    return `Hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
  if (months < 12)  return `Hace ${months} mes${months > 1 ? "es" : ""}`;
  return formatDate(iso);
}

function esNuevo(iso?: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 3 * 24 * 60 * 60 * 1000;
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
  return [...items].sort((a, b) => {
    // Fijados siempre primero
    if ((b.fijado ? 1 : 0) !== (a.fijado ? 1 : 0)) return (b.fijado ? 1 : 0) - (a.fijado ? 1 : 0);
    // Luego por fecha
    return orden === "antiguo"
      ? new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      : new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });
}

// ── SUBCOMPONENTES REUTILIZABLES ───────────────────────────────────────────────
function MegaphoneIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1} style={{ opacity: 0.2 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d={MEGAPHONE} />
    </svg>
  );
}

function Badge({ fuente, nombreEmpresa, categoria, destacado, esNuevoItem, size = "md", dark = true, topBar = false }: {
  fuente: "egm" | "empresa";
  nombreEmpresa?: string | null;
  categoria?: string | null;
  destacado?: boolean;
  esNuevoItem?: boolean;
  size?: "sm" | "md";
  dark?: boolean;
  topBar?: boolean;
}) {
  const sm = size === "sm";
  const pill: React.CSSProperties = topBar
    ? { backdropFilter: "blur(6px)", borderRadius: "999px" }
    : {};
  const cls = topBar
    ? "font-semibold rounded-full shrink-0 px-2.5 py-1"
    : `font-semibold rounded-full shrink-0 ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-0.5"}`;
  const CATS = dark ? CATEGORIA_COLORS_DARK : CATEGORIA_COLORS_LIGHT;

  return (
    <>
      {fuente === "egm" ? (
        <span className={cls} style={{ ...pill, ...(dark
          ? { background: "rgba(27,63,126,0.55)", color: "#bfdbfe", border: "1px solid rgba(147,197,253,0.3)" }
          : { background: "#dbeafe", color: "#1e3a8a", border: "1px solid #93c5fd" }) }}>
          EGM Atalayas
        </span>
      ) : (
        /* Empresa — verde esmeralda, corporativo */
        <span className={cls} style={{ ...pill, ...(dark
          ? { background: "rgba(16,185,129,0.22)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.32)" }
          : { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }) }}>
          {nombreEmpresa ?? "Empresa"}
        </span>
      )}
      {categoria && categoria !== "General" && (() => {
        const col = CATS[categoria] ?? CATS.General;
        return (
          <span className={cls} style={{ ...pill, background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
            {categoria}
          </span>
        );
      })()}
      {destacado && (
        /* Pin fijado — índigo (distinto del violeta de Evento) */
        <span className={cls} style={{ ...pill, display: "inline-flex", alignItems: "center", gap: "3px", ...(dark
          ? { background: "rgba(79,70,229,0.32)", color: "#c7d2fe", border: "1px solid rgba(79,70,229,0.42)" }
          : { background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc" }) }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
          </svg>
          Fijado
        </span>
      )}
      {esNuevoItem && (
        /* "Nuevo" — verde menta, fresco y positivo */
        <span className={cls} style={{ ...pill, ...(dark
          ? { background: "rgba(52,211,153,0.22)", color: "#a7f3d0", border: "1px solid rgba(52,211,153,0.32)" }
          : { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }) }}>
          Nuevo
        </span>
      )}
    </>
  );
}

// ── PANEL BORRADORES ──────────────────────────────────────────────────────────
function BorradoresPanel({ borradores, show, onToggle, onEditar, onPublicar, onEliminar }: {
  borradores: Noticia[];
  show: boolean;
  onToggle: () => void;
  onEditar: (n: Noticia) => void;
  onPublicar: (n: Noticia) => void;
  onEliminar: (id: string) => void;
}) {
  return (
    <div className="mb-6 rounded-2xl overflow-hidden"
      style={{ border: "1.5px solid #fcd34d", background: "#fffbeb" }}>

      {/* Cabecera colapsable */}
      <button onClick={onToggle} className="w-full flex items-center gap-2.5 px-4 py-3"
        style={{ background: "none", border: "none", cursor: "pointer" }}>
        {/* Pill "Borrador" */}
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: "#fde68a", color: "#92400e", border: "1px solid #fcd34d" }}>
          Borrador
        </span>
        <span className="text-sm font-semibold flex-1 text-left" style={{ color: "var(--texto-primario)" }}>
          {borradores.length} {borradores.length === 1 ? "anuncio pendiente" : "anuncios pendientes"}
        </span>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2.5}
          style={{ transition: "transform 0.2s", transform: show ? "rotate(0deg)" : "rotate(-90deg)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Lista */}
      {show && (
        <div className="flex flex-col" style={{ borderTop: "1px solid #bfdbfe" }}>
          {borradores.map((n, i) => (
            <div key={n.anuncioId}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: i > 0 ? "1px solid #dbeafe" : undefined, background: "var(--blanco)" }}>

              {/* Miniatura */}
              {n.imagenUrl
                ? <img src={n.imagenUrl} alt="" className="rounded-xl object-cover shrink-0" style={{ width: 44, height: 44 }} />
                : <div className="rounded-xl shrink-0 flex items-center justify-center"
                    style={{ width: 44, height: 44, background: "#eff6ff" }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
              }

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
                  {n.titulo || "(Sin título)"}
                </p>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>
                  {n.contenido ? n.contenido.replace(/[#*_`>]/g, "").slice(0, 90) + (n.contenido.length > 90 ? "…" : "") : "Sin contenido"}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => onEditar(n)}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                  style={{ background: "var(--blanco)", color: "#2563eb", border: "1px solid #bfdbfe", transition: "background 0.18s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                  Editar
                </button>
                <button onClick={() => onPublicar(n)}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#fff", border: "none", boxShadow: "0 2px 6px rgba(22,163,74,0.25)", transition: "opacity 0.18s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                  Publicar
                </button>
                <button onClick={() => onEliminar(n.anuncioId)}
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 28, height: 28, background: "transparent", border: "1px solid var(--gris-borde)", cursor: "pointer", transition: "background 0.18s ease, border-color 0.18s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                  title="Eliminar borrador">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="var(--texto-muted)" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────────
export default function ComunicacionPage() {
  const { usuario } = useAuth();

  const esAdmin        = usuario?.codigoRol === "ROLE_ADMIN_EMPRESA";
  const esAdminGeneral = usuario?.codigoRol === "ROLE_ADMIN";

  // Datos
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [anuncios, setAnuncios]       = useState<Noticia[]>([]);
  const [borradores, setBorradores]   = useState<Noticia[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);
  const [loadingAnuncios, setLoadingAnuncios]       = useState(true);

  // UI
  const [filtroFuente, setFiltroFuente]       = useState<FiltroFuente>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todos");
  const [orden, setOrden]                     = useState<Orden>("reciente");
  const [showOrden, setShowOrden]       = useState(false);
  const [modalItem, setModalItem]       = useState<FeedItem | null>(null);
  const [esMobil, setEsMobil]           = useState(false);
  const [visibles, setVisibles]         = useState(6);
  const [busqueda, setBusqueda]         = useState("");

  // Formulario
  const [showForm, setShowForm]               = useState(false);
  const [showFormComunicado, setShowFormComunicado] = useState(false);
  const [confirmDelete, setConfirmDelete]     = useState<{ id: string; tipo: "anuncio" | "comunicado" } | null>(null);
  const [editando, setEditando]               = useState<Noticia | null>(null);
  const [editandoComunicado, setEditandoComunicado] = useState<Comunicado | null>(null);
  const [initialForm, setInitialForm]         = useState<NoticiaInput>(EMPTY_FORM);
  const [initialFormComunicado, setInitialFormComunicado] = useState<ComunicadoInput>(EMPTY_FORM_COMUNICADO);
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState<string | null>(null);

  // Preview antes de publicar
  const [previewItem, setPreviewItem] = useState<FeedItem | null>(null);
  const [showBorradores, setShowBorradores] = useState(true);

  // Toast de confirmación
  const [toast, setToast] = useState<string | null>(null);
  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  // Índice de navegación en el modal de detalle
  const [modalIndex, setModalIndex] = useState<number | null>(null);

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
      setBorradores(data.filter((n) => n.activo && n.estado === "borrador"));
    } catch { setAnuncios([]); setBorradores([]); }
    finally { setLoadingAnuncios(false); }
  }

  // ── ABRIR DETALLE ──────────────────────────────────────────────────────────
  const abrirDetalle = useCallback((item: FeedItem, index?: number) => {
    setModalItem(item);
    setModalIndex(index ?? null);
    if (item.fuente === "empresa" && item.id) {
      registrarVistaNoticia(item.id);
    }
  }, []);

  // ── HANDLERS FORMULARIO ────────────────────────────────────────────────────
  function abrirCrear() {
    setInitialForm({ ...EMPTY_FORM, empresaId: usuario?.empresaId ?? null });
    setEditando(null); setShowForm(true); setFormError(null);
  }

  const abrirEditar = useCallback((n: Noticia) => {
    setInitialForm({
      titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal,
      empresaId: n.empresaId, imagenUrl: n.imagenUrl ?? null,
      enlaceUrl: n.enlaceUrl ?? null, enlaceTexto: n.enlaceTexto ?? null,
      videoUrl: n.videoUrl ?? null,
      adjuntoUrl: n.adjuntoUrl ?? null, adjuntoNombre: n.adjuntoNombre ?? null,
      estado: n.estado ?? "publicado", fijado: n.fijado ?? false,
      categoria: n.categoria ?? null,
    });
    setEditando(n); setShowForm(true); setFormError(null);
  }, []);

  const cerrarForm = useCallback(() => {
    setShowForm(false); setEditando(null); setInitialForm(EMPTY_FORM); setFormError(null);
    setPreviewItem(null);
  }, []);

  const cerrarModal   = useCallback(() => { setModalItem(null); setPreviewItem(null); setModalIndex(null); }, []);
  const confirmarEliminar = useCallback((id: string, tipo: "anuncio" | "comunicado" = "anuncio") => setConfirmDelete({ id, tipo }), []);

  async function handleSubmit(data: NoticiaInput) {
    setSubmitting(true); setFormError(null);
    try {
      if (editando) await editarNoticia(editando.anuncioId, data);
      else await crearNoticia(data);
      await cargarAnuncios();
      cerrarForm();
      mostrarToast(editando ? "Anuncio actualizado correctamente" : data.estado === "borrador" ? "Borrador guardado" : "Anuncio publicado correctamente");
    } catch { setFormError("Error al guardar. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  }

  async function handleDesactivar(id: string, tipo: "anuncio" | "comunicado" = "anuncio") {
    try {
      if (tipo === "comunicado") { await desactivarComunicado(id); await cargarComunicados(); }
      else { await desactivarNoticia(id); await cargarAnuncios(); }
    } catch {}
    finally { setConfirmDelete(null); }
  }

  const abrirEditarComunicado = useCallback((c: Comunicado) => {
    setInitialFormComunicado({
      titulo: c.titulo, mensaje: c.mensaje ?? "", imagenUrl: c.imagenUrl ?? null,
      categoria: (c.categoria as ComunicadoInput["categoria"]) ?? "General",
      destacado: c.destacado ?? false,
      fechaPublicacion: c.fechaPublicacion ?? null, fechaExpiracion: c.fechaExpiracion ?? null,
      enlaceUrl: c.enlaceUrl ?? null, enlaceTexto: c.enlaceTexto ?? null,
      videoUrl: c.videoUrl ?? null, adjuntoUrl: c.adjuntoUrl ?? null,
      adjuntoNombre: c.adjuntoNombre ?? null, estado: c.estado ?? "publicado",
    });
    setEditandoComunicado(c);
    setShowFormComunicado(true);
    setShowForm(false);
  }, []);

  const cerrarFormComunicado = useCallback(() => {
    setShowFormComunicado(false); setEditandoComunicado(null);
    setInitialFormComunicado(EMPTY_FORM_COMUNICADO); setFormError(null);
  }, []);

  async function handleSubmitComunicado(data: ComunicadoInput) {
    setSubmitting(true); setFormError(null);
    try {
      if (editandoComunicado) await editarComunicado(editandoComunicado.comunicadoId, data);
      else await crearComunicado(data);
      await cargarComunicados();
      cerrarFormComunicado();
      mostrarToast(editandoComunicado ? "Comunicado actualizado" : data.estado === "borrador" ? "Borrador guardado" : "Comunicado publicado");
    } catch { setFormError("Error al guardar. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  }

  async function publicarBorrador(n: Noticia) {
    try {
      await editarNoticia(n.anuncioId, {
        titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal,
        empresaId: n.empresaId, imagenUrl: n.imagenUrl ?? null,
        enlaceUrl: n.enlaceUrl ?? null, enlaceTexto: n.enlaceTexto ?? null,
        videoUrl: n.videoUrl ?? null, adjuntoUrl: n.adjuntoUrl ?? null,
        adjuntoNombre: n.adjuntoNombre ?? null, fijado: n.fijado ?? false,
        categoria: n.categoria ?? null, estado: "publicado",
      });
      await cargarAnuncios();
      mostrarToast("Anuncio publicado correctamente");
    } catch { mostrarToast("Error al publicar el anuncio"); }
  }

  // Reset categoría al cambiar fuente
  useEffect(() => { setFiltroCategoria("Todos"); setVisibles(6); }, [filtroFuente]);

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
    fuente: "empresa" as const, categoria: n.categoria ?? null, destacado: n.fijado ?? false,
    esNuevoItem: esNuevo(n.creadoEn), _raw: n,
    videoUrl: n.videoUrl, adjuntoUrl: n.adjuntoUrl, adjuntoNombre: n.adjuntoNombre,
    enlaceUrl: n.enlaceUrl, enlaceTexto: n.enlaceTexto,
    estado: n.estado, vistas: n.vistas, fijado: n.fijado,
  }));

  const feedCompleto = ordenarFeed([...feedEGM, ...feedEmpresa], "reciente");

  // Búsqueda
  const q = busqueda.trim().toLowerCase();
  const filtrarBusqueda = (items: FeedItem[]) =>
    q ? items.filter((i) => i.titulo.toLowerCase().includes(q) || i.descripcion.toLowerCase().includes(q)) : items;

  const feedCompletoBuscado   = filtrarBusqueda(feedCompleto);
  const feedEmpresaBuscado    = filtrarBusqueda(feedEmpresa);

  // "Todos": 3 tarjetas grandes siempre las más recientes, lista respeta orden
  const todosTop   = feedCompletoBuscado.slice(0, 3);
  const todosResto = ordenarFeed(feedCompletoBuscado.slice(3), orden);

  // ── EGM: categorías únicas presentes ──────────────────────────────────────
  const categoriasEGM = ["Todos", ...Array.from(new Set(
    feedEGM.map((i) => i.categoria).filter(Boolean)
  )) as string[]];

  const feedEGMFiltrado = ordenarFeed(
    filtrarBusqueda(
      filtroCategoria === "Todos" ? feedEGM : feedEGM.filter((i) => i.categoria === filtroCategoria)
    ),
    orden
  );

  const feedEmpresaOrdenado = ordenarFeed(feedEmpresaBuscado, orden);

  // Feed navegable en el modal — respeta el filtro activo para que las flechas
  // no salten entre EGM y empresa cuando estás en una vista filtrada
  const feedNavegable = filtroFuente === "egm"
    ? feedEGMFiltrado
    : filtroFuente === "empresa"
      ? feedEmpresaOrdenado
      : feedCompletoBuscado;

  const cargando = loadingComunicados || loadingAnuncios;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <style>{`
        .todos-card-large { height: 210px; width: 100%; }
        @media (min-width: 768px) { .todos-card-large { height: 380px; flex: 1; width: auto; } }
        .group:hover .card-img { transform: scale(1.04); }
        .card-img { transition: transform 0.4s ease; }
        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stagger-item { animation: staggerIn 0.35s ease both; }
        .nav-btn {
          background: rgba(255,255,255,0.12);
          border: 1.5px solid rgba(255,255,255,0.25);
          transform: scale(1);
          transition: background 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
        }
        .nav-btn:hover {
          background: rgba(37,99,235,0.75) !important;
          border-color: rgba(147,197,253,0.5) !important;
          transform: scale(1.1) !important;
        }
        .nav-btn:active {
          transform: scale(0.95) !important;
        }
      `}</style>

      <DashboardHero prefijo="Centro de " titulo="Comunicación." imagenFondo="/background-comunicacion-empleado.webp" />

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
              {/* Nuevo comunicado — solo superadmin */}
              {esAdminGeneral && (
                <button
                  onClick={() => { setShowFormComunicado(true); setShowForm(false); }}
                  className="text-sm font-semibold px-4 py-2 rounded-xl shrink-0"
                  style={{ background: GRAD_EGM, color: "#fff", boxShadow: "0 2px 8px rgba(27,63,126,0.3)", transition: "opacity 0.18s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}>
                  + Nuevo comunicado
                </button>
              )}
              {/* Nuevo anuncio — solo admin empresa */}
              {esAdmin && (
                <button
                  onClick={abrirCrear}
                  className="text-sm font-semibold px-4 py-2 rounded-xl shrink-0"
                  style={{ background: GRAD_BTN, color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.25)", transition: "opacity 0.18s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}>
                  + Nuevo anuncio
                </button>
              )}

              {/* Búsqueda */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ color: "var(--texto-muted)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setVisibles(6); }}
                  placeholder="Buscar..."
                  className="pl-8 pr-3 py-1.5 rounded-full text-sm focus:outline-none"
                  style={{
                    width: busqueda ? "180px" : "120px",
                    background: "var(--blanco)",
                    border: `1.5px solid ${busqueda ? "#2563eb" : "var(--gris-borde)"}`,
                    color: "var(--texto-primario)",
                    transition: "width 0.25s ease, border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.width = "180px"; e.currentTarget.style.borderColor = "#93c5fd"; }}
                  onBlur={(e) => { if (!busqueda) e.currentTarget.style.width = "120px"; e.currentTarget.style.borderColor = busqueda ? "#2563eb" : "var(--gris-borde)"; }}
                />
                {busqueda && (
                  <button onClick={() => setBusqueda("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all"
                    style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--texto-muted)", color: "#fff" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--error)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--texto-muted)"; }}>
                    <IconX size={10} />
                  </button>
                )}
              </div>

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
                      <button key={key}
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
            </div>
          </div>
        )}

        {/* ── FORMULARIO INLINE (admin) ────────────────────────────────────── */}
        {showForm && esAdmin && (
          <FormAnuncio
            initialValues={initialForm}
            editando={editando}
            submitting={submitting}
            formError={formError}
            onClose={cerrarForm}
            onSubmit={handleSubmit}
            onPreview={(item) => setPreviewItem(item)}
          />
        )}

        {showFormComunicado && esAdminGeneral && (
          <FormComunicado
            initialValues={initialFormComunicado}
            editando={editandoComunicado}
            submitting={submitting}
            formError={formError}
            onClose={cerrarFormComunicado}
            onSubmit={handleSubmitComunicado}
            onPreview={(item) => setPreviewItem(item)}
          />
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
        ) : feedCompletoBuscado.length === 0 ? (
          <EstadoVacio
            titulo={`Sin resultados para "${busqueda}"`}
            descripcion="Prueba con otras palabras."
          />
        ) : filtroFuente === "todos" ? (
          <>
            {/* 1 grande + 2 pequeñas */}
            {todosTop.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-col md:flex-row gap-4" style={{ height: esMobil ? undefined : "380px" }}>
                  {/* Tarjeta grande */}
                  <div className="todos-card-large">
                    <FeaturedCard item={todosTop[0]} size="large" onOpen={() => abrirDetalle(todosTop[0], 0)} fill prominent
                      puedeEditar={(todosTop[0].fuente === "empresa" && esAdmin) || (todosTop[0].fuente === "egm" && esAdminGeneral)}
                      onEdit={() => todosTop[0].fuente === "egm" ? abrirEditarComunicado(todosTop[0]._raw as Comunicado) : abrirEditar(todosTop[0]._raw as Noticia)}
                      onDelete={() => confirmarEliminar(todosTop[0].fuente === "egm" ? (todosTop[0]._raw as Comunicado).comunicadoId : (todosTop[0]._raw as Noticia).anuncioId, todosTop[0].fuente === "egm" ? "comunicado" : "anuncio")}
                    />
                  </div>
                  {/* 2 pequeñas apiladas */}
                  {todosTop.length > 1 && (
                    <div className="hidden md:flex flex-col gap-4 flex-1">
                      {todosTop.slice(1, 3).map((item, idx) => (
                        <div key={item.id} style={{ flex: 1 }}>
                          <FeaturedCard item={item} size="large" onOpen={() => abrirDetalle(item, idx + 1)} fill compact
                            puedeEditar={(item.fuente === "empresa" && esAdmin) || (item.fuente === "egm" && esAdminGeneral)}
                            onEdit={() => item.fuente === "egm" ? abrirEditarComunicado(item._raw as Comunicado) : abrirEditar(item._raw as Noticia)}
                            onDelete={() => confirmarEliminar(item.fuente === "egm" ? (item._raw as Comunicado).comunicadoId : (item._raw as Noticia).anuncioId, item.fuente === "egm" ? "comunicado" : "anuncio")}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lista del resto */}
            {todosResto.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-semibold uppercase" style={{ color: "var(--texto-muted)", letterSpacing: "0.07em" }}>
                    Más publicaciones
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--gris-borde)" }} />
                </div>
                <FeedList
                  items={todosResto.slice(0, visibles)}
                  esAdmin={esAdmin || esAdminGeneral}
                  getPuedeEditar={(item) => (item.fuente === "empresa" && esAdmin) || (item.fuente === "egm" && esAdminGeneral)}
                  esMobil={esMobil}
                  nombreEmpresa={usuario?.nombreEmpresa}
                  onOpen={abrirDetalle}
                  onEdit={(item) => abrirEditar(item._raw as Noticia)}
                  onDelete={(item) => confirmarEliminar(item.fuente === "egm" ? (item._raw as Comunicado).comunicadoId : (item._raw as Noticia).anuncioId, item.fuente === "egm" ? "comunicado" : "anuncio")}
                />
                {todosResto.length > visibles && (
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
        ) : filtroFuente === "egm" ? (
          /* ── VISTA EGM: 2 tarjetas iguales + lista ── */
          feedEGM.length === 0 ? (
            <EstadoVacio titulo="Sin comunicados de EGM Atalayas" descripcion="Cuando EGM publique comunicados aparecerán aquí." />
          ) : (
            <SourceView
              items={feedEGMFiltrado}
              orden={orden}
              visibles={visibles}
              setVisibles={setVisibles}
              esAdmin={esAdminGeneral}
              esMobil={esMobil}
              nombreEmpresa={usuario?.nombreEmpresa}
              gradColor={GRAD_EGM}
              seccionLabel="Más comunicados"
              verMasLabel="Ver más comunicados"
              onOpen={abrirDetalle}
              onEdit={(item) => item.fuente === "egm" ? abrirEditarComunicado(item._raw as Comunicado) : abrirEditar(item._raw as Noticia)}
              onDelete={(item) => confirmarEliminar(item.fuente === "egm" ? (item._raw as Comunicado).comunicadoId : (item._raw as Noticia).anuncioId, item.fuente === "egm" ? "comunicado" : "anuncio")}
              abrirEditar={abrirEditar}
              handleDesactivar={handleDesactivar}
            />
          )

        ) : filtroFuente === "empresa" ? (
          feedEmpresaOrdenado.length === 0 && borradores.length === 0 ? (
            <EstadoVacio
              titulo={`Sin publicaciones de ${usuario?.nombreEmpresa ?? "tu empresa"}`}
              descripcion="Aún no hay anuncios publicados."
              accion={esAdmin ? "Crear primer anuncio" : undefined}
              onAccion={esAdmin ? abrirCrear : undefined}
            />
          ) : feedEmpresaOrdenado.length === 0 ? (
            /* Solo hay borradores, no hay publicados */
            (esAdmin || esAdminGeneral) ? (
              <BorradoresPanel
                borradores={borradores}
                show={showBorradores}
                onToggle={() => setShowBorradores((v) => !v)}
                onEditar={abrirEditar}
                onPublicar={publicarBorrador}
                onEliminar={(id) => confirmarEliminar(id, "anuncio")}
              />
            ) : (
              <EstadoVacio
                titulo={`Sin publicaciones de ${usuario?.nombreEmpresa ?? "tu empresa"}`}
                descripcion="Aún no hay anuncios publicados."
              />
            )
          ) : (
            <SourceView
              items={feedEmpresaOrdenado}
              orden={orden}
              visibles={visibles}
              setVisibles={setVisibles}
              esAdmin={esAdmin}
              esMobil={esMobil}
              nombreEmpresa={usuario?.nombreEmpresa}
              gradColor={GRAD_EMP}
              seccionLabel="Más anuncios"
              verMasLabel="Ver más anuncios"
              onOpen={abrirDetalle}
              onEdit={(item) => item.fuente === "egm" ? abrirEditarComunicado(item._raw as Comunicado) : abrirEditar(item._raw as Noticia)}
              onDelete={(item) => confirmarEliminar(item.fuente === "egm" ? (item._raw as Comunicado).comunicadoId : (item._raw as Noticia).anuncioId, item.fuente === "egm" ? "comunicado" : "anuncio")}
              abrirEditar={abrirEditar}
              handleDesactivar={(id) => confirmarEliminar(id, "anuncio")}
              borradoresSlot={(esAdmin || esAdminGeneral) && borradores.length > 0 ? (
                <BorradoresPanel
                  borradores={borradores}
                  show={showBorradores}
                  onToggle={() => setShowBorradores((v) => !v)}
                  onEditar={abrirEditar}
                  onPublicar={publicarBorrador}
                  onEliminar={(id) => confirmarEliminar(id, "anuncio")}
                />
              ) : undefined}
            />
          )
        ) : null}

      </div>

      {/* ── CONFIRMACIÓN ELIMINAR ────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(6px)", animation: "modalBgIn 0.2s ease" }}
          onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-xs flex flex-col gap-5 p-6 rounded-2xl"
            style={{
              background: "var(--blanco)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid var(--gris-borde)",
              animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onClick={(e) => e.stopPropagation()}>

            {/* Icono + texto */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--texto-primario)" }}>
                  {confirmDelete?.tipo === "comunicado" ? "¿Eliminar este comunicado?" : "¿Eliminar este anuncio?"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>Esta acción no se puede deshacer.</p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 text-sm font-medium py-2 rounded-xl"
                style={{
                  background: "transparent", color: "var(--texto-secundario)",
                  border: "1px solid var(--gris-borde)",
                  transition: "background 0.18s ease, transform 0.18s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}>
                Cancelar
              </button>
              <button onClick={() => confirmDelete && handleDesactivar(confirmDelete.id, confirmDelete.tipo)}
                className="flex-1 text-sm font-semibold py-2 rounded-xl"
                style={{
                  background: "#dc2626", color: "#fff",
                  border: "1px solid #dc2626",
                  transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
                  boxShadow: "0 2px 12px rgba(220,38,38,0.25)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#b91c1c"; e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(220,38,38,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(220,38,38,0.25)"; }}
                onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[300] flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ transform: "translateX(-50%)", background: "linear-gradient(135deg, #1b3f7e 0%, #2563eb 100%)", color: "#fff", animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
          <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(12px) scale(0.95); } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }`}</style>
        </div>
      )}

      {/* ── MODAL (contenido real o preview) ─────────────────────────────── */}
      {(modalItem || previewItem) && (
        <DetalleModal
          item={previewItem ?? modalItem!}
          isPreview={!!previewItem}
          navItems={feedNavegable}
          navIndex={modalIndex ?? feedNavegable.findIndex((i) => i.id === (previewItem ?? modalItem!).id)}
          nombreEmpresa={usuario?.nombreEmpresa}
          puedeEditar={!previewItem && ((( previewItem ?? modalItem!).fuente === "empresa" && esAdmin) || ((previewItem ?? modalItem!).fuente === "egm" && esAdminGeneral))}
          onClose={cerrarModal}
          onNavigate={abrirDetalle}
          onEditar={(item) => {
            cerrarModal();
            if (item.fuente === "egm") abrirEditarComunicado(item._raw as Comunicado);
            else abrirEditar(item._raw as Noticia);
          }}
          onEliminar={(id) => {
            const item = previewItem ?? modalItem!;
            cerrarModal();
            confirmarEliminar(id, item.fuente === "egm" ? "comunicado" : "anuncio");
          }}
        />
      )}
    </div>
  );
}

// ── DETALLE MODAL ─────────────────────────────────────────────────────────────
const DetalleModal = memo(function DetalleModal({ item, isPreview, navItems, navIndex, nombreEmpresa, puedeEditar,
  onClose, onNavigate, onEditar, onEliminar }: {
  item: FeedItem;
  isPreview: boolean;
  navItems: FeedItem[];
  navIndex: number;
  nombreEmpresa?: string | null;
  puedeEditar: boolean;
  onClose: () => void;
  onNavigate: (item: FeedItem, idx: number) => void;
  onEditar: (item: FeedItem) => void;
  onEliminar: (id: string) => void;
}) {
  const embedUrl     = useMemo(() => item.videoUrl ? getVideoEmbedUrl(item.videoUrl) : null, [item.videoUrl]);
  const contenidoMd  = useMemo(() => renderMarkdown(item.descripcion), [item.descripcion]);
  const hasPrev   = !isPreview && navIndex > 0;
  const hasNext   = !isPreview && navIndex < navItems.length - 1;
  const zIdx      = isPreview ? 220 : 150;
  const modalRef  = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState<"next" | "prev" | null>(null);

  function goNext() { setDir(null); requestAnimationFrame(() => { setDir("next"); onNavigate(navItems[navIndex + 1], navIndex + 1); }); }
  function goPrev() { setDir(null); requestAnimationFrame(() => { setDir("prev"); onNavigate(navItems[navIndex - 1], navIndex - 1); }); }

  // Teclado ← →
  useEffect(() => {
    if (isPreview) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && hasNext) goNext();
      if (e.key === "ArrowLeft"  && hasPrev) goPrev();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navIndex, hasPrev, hasNext, isPreview]);

  // Focus trap
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first?.focus(); } }
    }
    document.addEventListener("keydown", trap);
    first?.focus();
    return () => document.removeEventListener("keydown", trap);
  }, []);

  return (
    <>
      <Modal onClose={onClose} zIndex={zIdx} maxWidth="42rem" modalRef={modalRef}
        navPrev={hasPrev ? goPrev : undefined}
        navNext={hasNext  ? goNext : undefined}>
        {/* Imagen / cabecera — no scrollea */}
        {item.imagenUrl ? (
          /* ── Con imagen: aspect ratio normal ── */
          <div className="relative w-full shrink-0 overflow-hidden rounded-t-2xl"
            style={{ aspectRatio: "16/9", maxHeight: "260px" }}>
            {isPreview && (
              <div className="absolute top-3 left-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ transform: "translateX(-50%)", background: "rgba(0,0,0,0.55)", color: "#fde68a", backdropFilter: "blur(8px)", border: "1px solid rgba(253,230,138,0.35)", whiteSpace: "nowrap" }}>
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                Vista previa
              </div>
            )}
            <img src={item.imagenUrl} alt={item.titulo} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,10,28,0.95) 0%, rgba(3,10,28,0.25) 55%, transparent 100%)" }} />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 flex items-end justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge fuente={item.fuente} nombreEmpresa={nombreEmpresa} categoria={item.categoria} size="sm" />
                {item.fijado && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(79,70,229,0.45)", color: "#c7d2fe", backdropFilter: "blur(6px)" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                    Fijado
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.88)", textShadow: SHADOW_TXT }}>{formatRelative(item.fecha)}</p>
            </div>
          </div>
        ) : (
          /* ── Sin imagen: cabecera compacta con título superpuesto ── */
          <div className="relative w-full shrink-0 overflow-hidden rounded-t-2xl"
            style={{ height: 150, background: item.fuente === "egm" ? GRAD_EGM : GRAD_EMP }}>
            {isPreview && (
              <div className="absolute top-3 left-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ transform: "translateX(-50%)", background: "rgba(0,0,0,0.45)", color: "#fde68a", backdropFilter: "blur(8px)", border: "1px solid rgba(253,230,138,0.35)", whiteSpace: "nowrap" }}>
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                Vista previa
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.07) 0%, transparent 55%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 flex items-end justify-between gap-3">
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge fuente={item.fuente} nombreEmpresa={nombreEmpresa} categoria={item.categoria} size="sm" />
                  {item.fijado && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(79,70,229,0.45)", color: "#c7d2fe", backdropFilter: "blur(6px)" }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                      Fijado
                    </span>
                  )}
                </div>
                <h2 className="leading-tight line-clamp-2"
                  style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.15rem, 2.5vw, 1.45rem)", letterSpacing: "-0.02em", color: "#fff", textShadow: SHADOW_TXT, margin: 0 }}>
                  {item.titulo}
                </h2>
              </div>
              <p className="text-xs font-semibold shrink-0 self-end" style={{ color: "rgba(255,255,255,0.75)", textShadow: SHADOW_TXT }}>{formatRelative(item.fecha)}</p>
            </div>
          </div>
        )}

        {/* Contenido scrolleable */}
        <div className={`modal-scroll${dir ? ` modal-slide-${dir}` : ""} overflow-y-auto flex-1 flex flex-col`}
          style={{ background: "var(--blanco)" }}>
          <div className="flex-1 px-6 pb-5 md:px-8 flex flex-col gap-4"
            style={{ paddingTop: item.imagenUrl ? "1.5rem" : "1.25rem" }}>

            {/* Título — solo si hay imagen (sin imagen ya está en la cabecera) */}
            {item.imagenUrl && (
              <h2 className="leading-tight"
                style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.4rem, 3vw, 1.85rem)", letterSpacing: "-0.02em", color: "var(--texto-primario)" }}>
                {item.titulo}
              </h2>
            )}

            {/* Contenido */}
            <div style={{ fontSize: "0.94rem", color: "#4b5563", lineHeight: 1.85, overflowWrap: "break-word", wordBreak: "break-word" }}>
              {contenidoMd}
            </div>

            {/* ── Recursos adjuntos ── */}
            {(embedUrl || item.adjuntoUrl || item.enlaceUrl) && (
              <div className="flex flex-col gap-3" style={{ borderTop: "1px solid var(--gris-borde)", paddingTop: "1.25rem" }}>

                <div className="flex items-center gap-1.5">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--texto-muted)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                  <p className="text-xs font-semibold uppercase" style={{ color: "var(--texto-muted)", letterSpacing: "0.08em" }}>Recursos adjuntos</p>
                </div>

                {/* Vídeo embed */}
                {embedUrl && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--texto-muted)" }}>Vídeo</span>
                    <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <iframe src={embedUrl} className="w-full h-full" allowFullScreen style={{ border: "none" }} />
                    </div>
                  </div>
                )}

                {/* Adjunto PDF/doc */}
                {item.adjuntoUrl && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--texto-muted)" }}>Documento adjunto</span>
                    <a href={item.adjuntoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", textDecoration: "none", transition: "background 0.18s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dbeafe" }}>
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      </div>
                      <span className="text-sm font-medium flex-1 truncate" style={{ color: "#2563eb" }}>{item.adjuntoNombre ?? "Ver documento adjunto"}</span>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </a>
                  </div>
                )}

                {/* Enlace externo */}
                {item.enlaceUrl && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--texto-muted)" }}>Enlace externo</span>
                    <a href={item.enlaceUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", textDecoration: "none", transition: "background 0.18s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; }}>
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

            {/* Fecha al pie del contenido — sutil */}
            <p className="text-xs mt-auto pt-1 text-right" style={{ color: "var(--texto-muted)" }}>
              Publicado el {formatDate(item.fecha)}
            </p>

          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-6 py-4 md:px-8" style={{ borderTop: "1px solid var(--gris-borde)" }}>
              {isPreview && (
                <button onClick={onClose}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-xl"
                  style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", cursor: "pointer", transition: "background 0.18s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  Volver a editar
                </button>
              )}
              {!isPreview && puedeEditar && item.vistas !== undefined && item.vistas > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--texto-muted)" }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  {item.vistas} {item.vistas === 1 ? "vista" : "vistas"}
                </span>
              )}
              {puedeEditar && (
                <div className="flex items-center gap-2 ml-auto">
                  {/* Editar — pill azul con scale */}
                  <button onClick={() => { onClose(); onEditar(item); }}
                    className="text-sm font-semibold px-4 py-1.5 rounded-xl"
                    style={{ color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}>
                    Editar
                  </button>
                  <button onClick={() => { onClose(); onEliminar((item._raw as Noticia).anuncioId); }}
                    className="text-sm font-semibold px-4 py-1.5 rounded-xl"
                    style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", transition: "background 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.border = "1px solid #fca5a5"; e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(220,38,38,0.18)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.border = "1px solid var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
      </Modal>
    </>
  );
});

// ── SOURCE VIEW (EGM / Empresa): 2 tarjetas iguales + lista ──────────────────
function SourceView({ items, orden, visibles, setVisibles, esAdmin, esMobil, nombreEmpresa,
  gradColor, seccionLabel, verMasLabel, onOpen, onEdit, onDelete, abrirEditar, handleDesactivar,
  borradoresSlot }: {
  items: FeedItem[];
  orden: Orden;
  visibles: number;
  setVisibles: React.Dispatch<React.SetStateAction<number>>;
  esAdmin: boolean;
  esMobil: boolean;
  nombreEmpresa?: string | null;
  gradColor: string;
  seccionLabel: string;
  verMasLabel: string;
  onOpen: (item: FeedItem) => void;
  onEdit: (item: FeedItem) => void;
  onDelete: (item: FeedItem) => void;
  abrirEditar: (n: Noticia) => void;
  handleDesactivar: (id: string) => void;
  borradoresSlot?: React.ReactNode;
}) {
  // Las tarjetas destacadas SIEMPRE muestran las más recientes
  const itemsByReciente = ordenarFeed(items, "reciente");
  const top  = itemsByReciente.slice(0, 2);
  // El listado respeta el orden elegido por el usuario
  const rest = ordenarFeed(itemsByReciente.slice(2), orden);

  return (
    <>
      {/* Grid: 2 tarjetas iguales */}
      {top.length > 0 && (
        <div className="mb-8">
          <div className={`grid gap-4 ${top.length === 1 ? "" : "md:grid-cols-2"}`} style={{ height: esMobil ? "210px" : "380px" }}>
            {top.map((item, idx) => (
              <div key={item.id} className={idx === 1 ? "hidden md:block" : ""} style={{ height: "100%" }}>
                <FeaturedCard
                  item={item}
                  size="large"
                  onOpen={() => onOpen(item)}
                  fill
                  puedeEditar={esAdmin}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel borradores (entre tarjetas y lista) */}
      {borradoresSlot}

      {/* Lista del resto */}
      {rest.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold uppercase" style={{ color: "var(--texto-muted)", letterSpacing: "0.07em" }}>
              {seccionLabel}
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--gris-borde)" }} />
          </div>
          <FeedList
            items={rest.slice(0, visibles)}
            esAdmin={esAdmin}
            esMobil={esMobil}
            nombreEmpresa={nombreEmpresa}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          {rest.length > visibles && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setVisibles((v) => v + 6)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: gradColor, color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {verMasLabel}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── FEED LIST ─────────────────────────────────────────────────────────────────
function FeedList({ items, esAdmin, getPuedeEditar, esMobil, nombreEmpresa, onOpen, onEdit, onDelete }: {
  items: FeedItem[];
  esAdmin: boolean;
  getPuedeEditar?: (item: FeedItem) => boolean;
  esMobil: boolean;
  nombreEmpresa?: string | null;
  onOpen: (item: FeedItem) => void;
  onEdit: (item: FeedItem) => void;
  onDelete: (item: FeedItem) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
      {items.map((item, i) => (
        <div key={item.id} className="stagger-item" style={{ animationDelay: `${i * 55}ms` }}>
          <FeedRow
            item={item}
            isLast={i === items.length - 1}
            puedeEditar={getPuedeEditar ? getPuedeEditar(item) : esAdmin}
            esMobil={esMobil}
            nombreEmpresa={nombreEmpresa}
            onOpen={() => onOpen(item)}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
          />
        </div>
      ))}
    </div>
  );
}

// ── FEATURED CARD ─────────────────────────────────────────────────────────────
const FeaturedCard = memo(function FeaturedCard({ item, size, onOpen, fill = false, puedeEditar, onEdit, onDelete, prominent = false, compact = false }: {
  item: FeedItem; size: "large" | "small"; onOpen: () => void; fill?: boolean;
  puedeEditar?: boolean; onEdit?: () => void; onDelete?: () => void; prominent?: boolean; compact?: boolean;
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
        isolation: "isolate",
        transform: "translateZ(0)",
        willChange: "transform",
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
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: bgGradient, paddingBottom: isLarge ? "80px" : "40px" }}>
          <MegaphoneIcon size={isLarge ? 64 : 32} />
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.28) 100%)" }} />
      <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0" style={{ background: "rgba(0,0,0,0.08)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(3,10,25,0.55) 0%, transparent 30%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,10,25,0.96) 0%, rgba(3,10,25,0.78) 35%, rgba(3,10,25,0.08) 62%, transparent 100%)" }} />


      {/* ── Grande ─────────────────────────────────────────────────────── */}
      {isLarge && (
        <>
          {/* Top bar: badges izquierda + fecha derecha */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-nowrap min-w-0 overflow-hidden"
              style={{ fontSize: compact ? "0.68rem" : prominent ? "0.82rem" : "0.75rem" }}>
              <Badge fuente={item.fuente} categoria={item.categoria} destacado={item.destacado} esNuevoItem={item.esNuevoItem} topBar />
            </div>
            <span className="shrink-0 font-semibold px-2.5 py-1 rounded-full"
              style={{ fontSize: compact ? "0.68rem" : prominent ? "0.82rem" : "0.75rem", background: "rgba(0,0,0,0.42)", color: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.13)" }}>
              {formatDate(item.fecha)}
            </span>
          </div>

          {/* Contenido — anclado al fondo */}
          <div className="absolute inset-0 flex flex-col justify-end px-5 pb-5 md:px-6 md:pb-6">
            {/* Título */}
            <h2 className="text-white leading-tight line-clamp-2 overflow-hidden"
              style={{
                fontWeight: 800,
                fontSize: compact ? "clamp(1.05rem, 1.6vw, 1.3rem)" : prominent ? "clamp(1.5rem, 2.6vw, 2.1rem)" : "clamp(1.2rem, 2vw, 1.65rem)",
                letterSpacing: "-0.025em",
                textShadow: SHADOW_TXT,
                marginBottom: compact ? "10px" : "8px",
              }}>
              {item.titulo}
            </h2>

            {/* Descripción — oculta en compact */}
            {!compact && (
              <p className="leading-relaxed line-clamp-2 mb-5"
                style={{ fontSize: prominent ? "1rem" : "0.875rem", color: "rgba(255,255,255,0.75)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                {item.descripcion}
              </p>
            )}

            {/* Indicadores multimedia */}
            {(item.videoUrl || item.adjuntoUrl || item.enlaceUrl) && (
              <div className="flex items-center gap-1.5 mb-2">
                {item.videoUrl && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.42)", color: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)" }}>
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="5,3 19,12 5,21"/></svg>
                    Vídeo
                  </span>
                )}
                {item.adjuntoUrl && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.42)", color: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)" }}>
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    PDF
                  </span>
                )}
                {item.enlaceUrl && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.42)", color: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)" }}>
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/><path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1"/></svg>
                    Enlace
                  </span>
                )}
              </div>
            )}

            {/* Leer más + botones admin en la misma fila */}
            <div className="flex items-center justify-between gap-2 transition-opacity opacity-55 group-hover:opacity-100">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white tracking-wide"
                  style={{ fontSize: compact ? "0.75rem" : prominent ? "0.9rem" : "0.8rem", textShadow: SHADOW_TXT }}>
                  Leer más
                </span>
                <svg width={compact ? 11 : prominent ? 14 : 12} height={compact ? 11 : prominent ? 14 : 12} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </div>
              {puedeEditar && (
                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button onClick={onEdit}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                    style={{ color: "rgba(255,255,255,0.82)", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", transition: "background 0.18s ease, transform 0.18s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.55)"; e.currentTarget.style.transform = "scale(1.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "scale(1)"; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                    Editar
                  </button>
                  <button onClick={onDelete}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                    style={{ color: "rgba(255,255,255,0.82)", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", transition: "background 0.18s ease, transform 0.18s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.6)"; e.currentTarget.style.transform = "scale(1.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "scale(1)"; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
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
          {!puedeEditar && (
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
});

// ── FEED ROW ──────────────────────────────────────────────────────────────────
const FeedRow = memo(function FeedRow({ item, isLast, puedeEditar, esMobil, nombreEmpresa, onOpen, onEdit, onDelete }: {
  item: FeedItem; isLast: boolean; puedeEditar: boolean; esMobil: boolean;
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
        paddingTop: esMobil ? "10px" : "16px",
        paddingBottom: esMobil ? "10px" : "16px",
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
      <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: esMobil ? "80px" : "140px", height: esMobil ? "64px" : "96px" }}>
        {item.imagenUrl ? (
          <img src={item.imagenUrl} alt={item.titulo}
            className="w-full h-full object-cover transition-transform duration-400"
            style={{ transform: hovered ? "scale(1.04)" : "scale(1)" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: item.fuente === "egm" ? GRAD_EGM : GRAD_EMP }}>
            <MegaphoneIcon size={esMobil ? 22 : 28} />
          </div>
        )}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ gap: esMobil ? "4px" : "5px" }}>
        <div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
          <span className="text-[11px] font-medium shrink-0" style={{ color: "var(--texto-muted)" }}>{formatDate(item.fecha)}</span>
          <span className="shrink-0 text-xs" style={{ color: "var(--gris-borde)" }}>·</span>
          <Badge fuente={item.fuente} nombreEmpresa={nombreEmpresa} categoria={item.categoria} esNuevoItem={item.esNuevoItem} size="sm" dark={false} />
        </div>

        <div className="flex items-center gap-1.5">
          {item.fijado && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2.5} className="shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
          )}
          <h3 className="font-bold leading-snug line-clamp-2 transition-colors"
            style={{ fontSize: esMobil ? "0.875rem" : "1rem", color: hovered ? "var(--azul-accion)" : "var(--texto-primario)" }}>
            {item.titulo}
          </h3>
        </div>

        {!esMobil && (
          <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: "var(--texto-muted)" }}>
            {item.descripcion}
          </p>
        )}

        {/* Indicadores multimedia */}
        {(item.videoUrl || item.adjuntoUrl || item.enlaceUrl) && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {item.videoUrl && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polygon points="5,3 19,12 5,21"/></svg>
                Vídeo
              </span>
            )}
            {item.adjuntoUrl && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac" }}>
                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                PDF
              </span>
            )}
            {item.enlaceUrl && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #c4b5fd" }}>
                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/><path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1"/></svg>
                Enlace
              </span>
            )}
          </div>
        )}
      </div>

      {/* Acciones admin */}
      {puedeEditar && (
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", transition: "background 0.18s ease, transform 0.18s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1)"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}>
            Editar
          </button>
          <button onClick={onDelete}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}>
            Eliminar
          </button>
        </div>
      )}

      {/* Flecha */}
      {!puedeEditar && (
        <div className="shrink-0 transition-opacity" style={{ opacity: hovered ? 0.7 : 0.35 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
});

// ── SUBCOMPONENTES ─────────────────────────────────────────────────────────────
function Modal({ children, onClose, zIndex = 50, maxWidth = "42rem", modalRef, navPrev, navNext }: {
  children: React.ReactNode; onClose: () => void; zIndex?: number; maxWidth?: string;
  modalRef?: React.RefObject<HTMLDivElement | null>;
  navPrev?: () => void; navNext?: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const NavBtn = ({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="nav-btn flex items-center justify-center shrink-0"
      style={{ width: 44, height: 44, borderRadius: "50%", color: "#fff", cursor: "pointer", alignSelf: "center" }}>
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === "prev" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );

  return (
    /* Overlay: flex row — [prevBtn] [card] [nextBtn] siempre dentro del viewport */
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex, background: "rgba(0,0,0,0.58)", animation: "modalBgIn 0.2s ease", gap: 12, padding: "16px 12px" }}
      onClick={onClose}>
      {/* Botón prev — ocupa espacio fijo a la izquierda */}
      <div style={{ width: 44, flexShrink: 0 }}>
        {navPrev && <NavBtn dir="prev" onClick={navPrev} />}
      </div>
      <div ref={modalRef} className="relative w-full flex flex-col"
        style={{ maxWidth, maxHeight: "calc(100vh - 32px)", flex: 1, minWidth: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-3 right-3 z-20 flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", cursor: "pointer", transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.75)"; e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.35)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
          title="Cerrar (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="flex flex-col rounded-2xl overflow-hidden w-full h-full"
          style={{ background: "#0d1b2e", boxShadow: "0 32px 80px rgba(0,0,0,0.28)", animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)", transform: "translateZ(0)", isolation: "isolate" }}>
          {children}
        </div>
      </div>
      {/* Botón next — ocupa espacio fijo a la derecha */}
      <div style={{ width: 44, flexShrink: 0 }}>
        {navNext && <NavBtn dir="next" onClick={navNext} />}
      </div>
      <style>{`
        @keyframes modalBgIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.94) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-slide-next { animation: slideInRight 0.28s cubic-bezier(0.34,1.2,0.64,1) both; }
        .modal-slide-prev { animation: slideInLeft  0.28s cubic-bezier(0.34,1.2,0.64,1) both; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.25); border-radius: 4px; }
        .modal-scroll::-webkit-scrollbar-thumb:hover { background: rgba(37,99,235,0.5); }
      `}</style>
    </div>
  );
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconSparkle({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ── ACCORDION HEADER ─────────────────────────────────────────────────────────
function AccordionHeader({ label, open, badge, onClick }: {
  label: string; open: boolean; badge: number; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left rounded-2xl transition-colors"
      style={{ padding: "12px 14px", background: open ? "var(--gris-superficie)" : "transparent" }}
      onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "var(--gris-superficie)"; }}
      onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}>
      <div className="flex items-center gap-3.5">
        {/* Icono */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: label === "Multimedia" ? "#eff6ff" : "#f0fdf4", border: `1px solid ${label === "Multimedia" ? "#bfdbfe" : "#bbf7d0"}` }}>
          {label === "Multimedia"
            ? <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={label === "Multimedia" ? "#2563eb" : "#16a34a"} strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/></svg>
            : <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/></svg>
          }
        </div>
        {/* Texto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--texto-primario)", letterSpacing: "-0.01em" }}>
              {label}
            </span>
            {badge > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
            {label === "Multimedia" ? "Imagen, vídeo o documento adjunto" : "Enlace externo, visibilidad y estado"}
          </p>
        </div>
        {/* Flecha */}
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          style={{ transition: "transform 0.22s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--texto-muted)", flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
  );
}

// ── TOGGLE ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, color = "#2563eb" }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="shrink-0 transition-all"
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: checked ? color : "var(--gris-borde)",
        border: "none", cursor: "pointer", padding: 3,
        transition: "background 0.2s ease",
        position: "relative", display: "flex", alignItems: "center",
      }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
        transform: checked ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.2s ease",
        display: "block",
      }} />
    </button>
  );
}

// ── CAMPO LABEL WRAPPER ───────────────────────────────────────────────────────
function FieldLabel({ label, required, right }: { label: string; required?: boolean; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2.5" style={{ minHeight: 32 }}>
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)", letterSpacing: "0.07em" }}>
        {label}
        {required && (
          <span className="relative inline-block ml-1 group" style={{ verticalAlign: "middle" }}>
            <span style={{ color: "var(--error)", fontWeight: 700, cursor: "default" }}>*</span>
            <span className="pointer-events-none absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2
              opacity-0 group-hover:opacity-100 transition-opacity duration-150
              whitespace-nowrap text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-lg"
              style={{ background: "rgba(15,23,42,0.92)", letterSpacing: "0.01em", zIndex: 200 }}>
              Campo obligatorio
              <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent"
                style={{ borderTopColor: "rgba(15,23,42,0.92)" }} />
            </span>
          </span>
        )}
      </label>
      {right}
    </div>
  );
}

// ── ESTILOS COMPARTIDOS DE INPUT ──────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  border: "1.5px solid var(--gris-borde)",
  background: "var(--blanco)",
  color: "var(--texto-primario)",
  transition: "border-color 0.15s",
};
function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "#93c5fd";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(147,197,253,0.18)";
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "var(--gris-borde)";
  e.currentTarget.style.boxShadow = "none";
}

// ── BOTÓN IA ──────────────────────────────────────────────────────────────────
function AIButton({ loading, disabled, label, loadingLabel, onClick }: {
  loading: boolean; disabled?: boolean; label: string; loadingLabel: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={loading || disabled}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
      style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", color: "#1d4ed8", border: "1px solid #bfdbfe", boxShadow: "0 1px 6px rgba(37,99,235,0.15)" }}
      onMouseEnter={(e) => { if (!loading && !disabled) { e.currentTarget.style.background = "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(37,99,235,0.25)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
      onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(37,99,235,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : <IconSparkle size={15} />}
      {loading ? loadingLabel : label}
    </button>
  );
}

// ── FORMULARIO COMUNICADO ─────────────────────────────────────────────────────
function FormComunicado({
  initialValues, editando, submitting, formError,
  onClose, onSubmit, onPreview,
}: {
  initialValues: ComunicadoInput;
  editando: Comunicado | null;
  submitting: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (data: ComunicadoInput) => void;
  onPreview: (item: FeedItem) => void;
}) {
  type Tab = "contenido" | "multimedia" | "publicacion";
  const [tab, setTab]         = useState<Tab>("contenido");
  const visitedTabs           = useRef<Set<Tab>>(new Set(["contenido"]));
  const [touched, setTouched] = useState(false);
  const [form, setForm]       = useState<ComunicadoInput>({ ...EMPTY_FORM_COMUNICADO, ...initialValues });
  const initialSnapshot       = useRef<string>(JSON.stringify(initialValues));
  const isDirty               = JSON.stringify(form) !== initialSnapshot.current;
  const canSubmit             = form.titulo.trim().length > 0 && form.mensaje.trim().length > 0;

  const [confirmClose, setConfirmClose] = useState(false);
  const handleRequestClose = () => { if (isDirty) setConfirmClose(true); else onClose(); };

  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingAdj, setUploadingAdj] = useState(false);
  const [aiLoading, setAiLoading]       = useState<"titulo" | "mensaje" | null>(null);
  const [localError, setLocalError]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adjuntoRef   = useRef<HTMLInputElement>(null);
  const errorMsg     = localError ?? formError;

  const tituloError  = touched && !form.titulo.trim();
  const mensajeError = touched && !form.mensaje.trim();

  const badgeMult = useMemo(() => [form.imagenUrl, form.videoUrl, form.adjuntoUrl].filter(Boolean).length, [form.imagenUrl, form.videoUrl, form.adjuntoUrl]);
  const badgePub  = useMemo(() => [form.enlaceUrl, form.destacado].filter(Boolean).length, [form.enlaceUrl, form.destacado]);
  const badgeCont = useMemo(() => touched ? [!form.titulo.trim(), !form.mensaje.trim()].filter(Boolean).length : 0, [touched, form.titulo, form.mensaje]);
  const embedUrl  = useMemo(() => form.videoUrl ? getVideoEmbedUrl(form.videoUrl) : null, [form.videoUrl]);

  const TABS = useMemo<{ id: Tab; label: string; badge?: number; error?: boolean }[]>(() => [
    { id: "contenido",   label: "Contenido",   badge: badgeCont || undefined, error: badgeCont > 0 },
    { id: "multimedia",  label: "Multimedia",  badge: badgeMult || undefined },
    { id: "publicacion", label: "Publicación", badge: badgePub  || undefined },
  ], [badgeCont, badgeMult, badgePub]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleRequestClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isDirty]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingImg(true); setLocalError(null);
    try { const url = await subirImagenBackend(file); setForm((f) => ({ ...f, imagenUrl: url })); }
    catch { setLocalError("Error al subir la imagen."); }
    finally { setUploadingImg(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  async function handleAdjuntoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAdj(true); setLocalError(null);
    try { const { url, nombre } = await subirAdjuntoBackend(file); setForm((f) => ({ ...f, adjuntoUrl: url, adjuntoNombre: nombre })); }
    catch { setLocalError("Error al subir el adjunto."); }
    finally { setUploadingAdj(false); if (adjuntoRef.current) adjuntoRef.current.value = ""; }
  }

  async function sugerirConIA(campo: "titulo" | "mensaje") {
    const base = campo === "titulo" ? (form.mensaje.trim() || form.titulo.trim()) : form.mensaje.trim();
    if (!base) { setLocalError("Escribe algo antes de usar la IA."); return; }
    setAiLoading(campo); setLocalError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: campo === "titulo"
            ? `Sugiere un título corto (máximo 80 caracteres), claro y atractivo para un comunicado de empresa con el siguiente contenido. Devuelve SOLO el título, sin comillas ni explicaciones.\n\nContenido: ${base}`
            : `Mejora la redacción de este comunicado de empresa. Hazlo más claro y profesional. Devuelve SOLO el texto mejorado, sin comentarios adicionales.\n\nTexto original: ${base}`
          }],
          context: {},
        }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader(); const dec = new TextDecoder(); let out = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; out += dec.decode(value); }
      if (campo === "titulo") setForm((f) => ({ ...f, titulo: out.trim() }));
      else setForm((f) => ({ ...f, mensaje: out.trim() }));
    } catch { setLocalError("La IA no está disponible en este momento."); }
    finally { setAiLoading(null); }
  }

  function handlePreview() {
    const item: FeedItem = {
      id: "preview", titulo: form.titulo || "(Sin título)", descripcion: form.mensaje,
      imagenUrl: form.imagenUrl ?? null, fecha: new Date().toISOString(),
      fuente: "egm", categoria: form.categoria, destacado: form.destacado,
      esNuevoItem: true, _raw: {} as Comunicado,
      videoUrl: form.videoUrl ?? null, adjuntoUrl: form.adjuntoUrl ?? null,
      adjuntoNombre: form.adjuntoNombre ?? null,
      enlaceUrl: form.enlaceUrl ?? null, enlaceTexto: form.enlaceTexto ?? null,
      estado: "publicado",
    };
    onPreview(item);
  }

  const CATS_COM = ["General", "Novedad", "Aviso", "Evento"];

  return (
    <>
    {/* Overlay */}
    <div className="fixed inset-0 flex items-start justify-center"
      style={{ zIndex: 160, background: "rgba(0,0,0,0.52)", paddingTop: 96, paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}
      onClick={handleRequestClose}>

      <div className="relative w-full flex flex-col"
        style={{
          maxWidth: 660,
          height: "auto",
          maxHeight: "calc(100vh - 112px)",
          background: "var(--blanco)",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
          isolation: "isolate",
          animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={(e) => e.stopPropagation()}>

        {/* ── Cabecera ── */}
        <div className="relative shrink-0 overflow-hidden" style={{ background: GRAD_EGM }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 90% 10%, rgba(255,255,255,0.07) 0%, transparent 55%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 0% 120%, rgba(37,99,235,0.18) 0%, transparent 50%)" }} />
          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <h3 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.65rem, 4vw, 2.1rem)", lineHeight: 1.1, letterSpacing: "-0.03em", color: "#ffffff", margin: 0, textShadow: "0 1px 12px rgba(0,0,0,0.18)" }}>
                {editando ? "Editar comunicado" : "Nuevo comunicado"}
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
                {editando ? "Modifica el comunicado y guarda los cambios." : "Visible para todos los empleados de la plataforma."}
              </p>
            </div>
            <button onClick={handleRequestClose}
              className="shrink-0 flex items-center justify-center"
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", cursor: "pointer", transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
              title="Cerrar (Esc)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="shrink-0 relative" style={{ background: "var(--gris-superficie)", borderBottom: "1px solid var(--gris-borde)" }}>
          <div className="flex">
            {TABS.map(({ id, label, badge, error }) => (
              <button key={id} type="button" onClick={() => { visitedTabs.current.add(id); setTab(id); }}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors"
                style={{ color: tab === id ? (error ? "var(--error)" : "var(--azul-accion)") : "var(--texto-muted)", background: "none" }}>
                {label}
                {badge ? (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{ background: error ? "var(--error)" : tab === id ? "var(--azul-accion)" : "#d1d5db", color: error || tab === id ? "#fff" : "var(--texto-muted)", minWidth: 18, textAlign: "center" }}>
                    {badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div style={{
            position: "absolute", bottom: 0, left: 0,
            width: `${100 / TABS.length}%`, height: 2,
            borderRadius: "2px 2px 0 0",
            background: TABS.find((t) => t.id === tab)?.error ? "var(--error)" : "var(--azul-accion)",
            transform: `translateX(${TABS.findIndex((t) => t.id === tab) * 100}%)`,
            transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease",
          }} />
        </div>

        {/* ── Cuerpo con scroll ── */}
        <div className="overflow-y-auto" style={{ background: "var(--gris-superficie)" }}>

          {/* ── TAB: Contenido ── */}
          <div style={{ display: tab === "contenido" ? "block" : "none" }}>
          <div className="flex flex-col gap-6" style={{ padding: "28px 32px" }}>
            <div>
              <FieldLabel label="Título" required
                right={
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs tabular-nums" style={{ color: form.titulo.length > 80 ? "var(--error)" : "var(--texto-muted)" }}>{form.titulo.length}/80</span>
                    <AIButton loading={aiLoading === "titulo"} label="Sugerir título" loadingLabel="Generando..." onClick={() => sugerirConIA("titulo")} />
                  </div>
                }
              />
              <input type="text" value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Networking Day — Viernes 25 de abril"
                className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                style={{ ...inputStyle, ...(tituloError ? { borderColor: "var(--error)", boxShadow: "0 0 0 3px rgba(239,68,68,0.12)" } : {}) }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {tituloError && <p className="text-xs mt-1.5" style={{ color: "var(--error)" }}>El título es obligatorio</p>}
            </div>

            <div>
              <FieldLabel label="Contenido" required
                right={
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs tabular-nums" style={{ color: "var(--texto-muted)" }}>{form.mensaje.length} car.</span>
                    <AIButton loading={aiLoading === "mensaje"} disabled={!form.mensaje.trim()} label="Mejorar con IA" loadingLabel="Mejorando..." onClick={() => sugerirConIA("mensaje")} />
                  </div>
                }
              />
              <textarea value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                placeholder="Escribe el contenido. Puedes usar **negrita** y - listas."
                className="w-full rounded-xl px-4 py-3 text-base focus:outline-none resize-none"
                style={{ ...inputStyle, minHeight: 180, lineHeight: 1.7, ...(mensajeError ? { borderColor: "var(--error)", boxShadow: "0 0 0 3px rgba(239,68,68,0.12)" } : {}) }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {mensajeError && <p className="text-xs mt-1.5" style={{ color: "var(--error)" }}>El contenido es obligatorio</p>}
            </div>

            <div>
              <FieldLabel label="Categoría" />
              <div className="flex gap-2 flex-wrap">
                {CATS_COM.map((cat) => {
                  const active = (form.categoria ?? "General") === cat;
                  const col = CATEGORIA_COLORS_LIGHT[cat] ?? CATEGORIA_COLORS_LIGHT.General;
                  return (
                    <button key={cat} type="button"
                      onClick={() => setForm({ ...form, categoria: cat as ComunicadoInput["categoria"] })}
                      className="text-sm font-semibold px-4 py-1.5 rounded-full transition-all"
                      style={{
                        background: active ? col.bg : "var(--blanco)",
                        color: active ? col.text : "var(--texto-muted)",
                        border: `1.5px solid ${active ? col.border : "var(--gris-borde)"}`,
                        boxShadow: active ? `0 2px 8px ${col.border}60` : "none",
                      }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div></div>

          {/* ── TAB: Multimedia ── */}
          {visitedTabs.current.has("multimedia") && (
          <div style={{ display: tab === "multimedia" ? "block" : "none" }}>
          <div className="flex flex-col gap-6" style={{ padding: "28px 32px" }}>
            {/* Imagen */}
            <div>
              <FieldLabel label="Imagen de portada" />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {form.imagenUrl ? (
                <div className="relative mt-1">
                  <img src={form.imagenUrl} alt="preview" className="rounded-xl w-full object-cover" style={{ height: "160px" }} />
                  <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(22,163,74,0.9)", color: "#fff" }}>Subida correctamente</span>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                    className="absolute top-2 right-2 flex items-center justify-center transition-all"
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.8)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.transform = "scale(1)"; }}
                    title="Quitar imagen"><IconX size={12} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}
                  className="w-full flex flex-col items-center justify-center gap-2 rounded-xl py-8 text-sm transition-all disabled:opacity-60"
                  style={{ border: "2px dashed var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-muted)" }}
                  onMouseEnter={(e) => { if (!uploadingImg) { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.background = "#f0f7ff"; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--blanco)"; }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--blanco)"; }}
                  onDrop={(e) => {
                    e.preventDefault(); e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--blanco)";
                    const file = e.dataTransfer.files?.[0];
                    if (file?.type.startsWith("image/")) handleImageUpload({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                  }}>
                  {uploadingImg
                    ? <><span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Subiendo...</span></>
                    : <><IconUpload /><span className="font-medium">Arrastra o selecciona imagen</span><span className="text-xs opacity-70">JPG, PNG, WebP</span></>}
                </button>
              )}
            </div>

            {/* Vídeo */}
            <div>
              <FieldLabel label="Vídeo (YouTube o Vimeo)" />
              {embedUrl ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      <span className="text-xs font-semibold truncate max-w-[220px]" style={{ color: "#166534" }}>{form.videoUrl}</span>
                    </div>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, videoUrl: null }))}
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0"
                      style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>Quitar</button>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", maxHeight: 200 }}>
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen style={{ border: "none" }} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <input type="url" value={form.videoUrl || ""}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value || null })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                  {form.videoUrl && (
                    <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#b45309" }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                      Solo se pueden incrustar vídeos de YouTube o Vimeo
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Adjunto */}
            <div>
              <FieldLabel label="Documento adjunto" />
              <input ref={adjuntoRef} type="file" accept=".pdf,.doc,.docx" onChange={handleAdjuntoUpload} className="hidden" />
              {form.adjuntoUrl ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: "1.5px solid #86efac", background: "#f0fdf4" }}>
                  <span style={{ color: "#16a34a" }}><IconDoc /></span>
                  <span className="text-sm flex-1 truncate font-medium" style={{ color: "#166534" }}>{form.adjuntoNombre ?? "Documento"}</span>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, adjuntoUrl: null, adjuntoNombre: null }))}
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>Quitar</button>
                </div>
              ) : (
                <button type="button" onClick={() => adjuntoRef.current?.click()} disabled={uploadingAdj}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
                  style={{ border: "1.5px dashed var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-muted)" }}
                  onMouseEnter={(e) => { if (!uploadingAdj) e.currentTarget.style.borderColor = "#93c5fd"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; }}>
                  {uploadingAdj
                    ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Subiendo...</span></>
                    : <><IconDoc /><span className="font-medium">Adjuntar PDF o Word</span></>}
                </button>
              )}
            </div>
          </div></div>
          )}

          {/* ── TAB: Publicación ── */}
          {visitedTabs.current.has("publicacion") && (
          <div style={{ display: tab === "publicacion" ? "block" : "none" }}>
          <div className="flex flex-col gap-6" style={{ padding: "28px 32px" }}>
            {/* Enlace externo */}
            <div>
              <FieldLabel label="Enlace externo" />
              <div className="flex flex-col gap-2">
                <input type="url" value={form.enlaceUrl || ""}
                  onChange={(e) => setForm({ ...form, enlaceUrl: e.target.value || null })}
                  placeholder="https://..."
                  className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
                {form.enlaceUrl && (
                  <>
                    <input type="text" value={form.enlaceTexto || ""}
                      onChange={(e) => setForm({ ...form, enlaceTexto: e.target.value || null })}
                      placeholder='Texto del enlace — ej: "Más información"'
                      className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                      style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                    <div className="flex flex-col gap-1.5 pt-1">
                      <p className="text-xs font-medium" style={{ color: "var(--texto-muted)" }}>Así se verá en el comunicado</p>
                      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dbeafe" }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                          </div>
                          <span className="text-sm font-medium truncate" style={{ color: "#2563eb" }}>{form.enlaceTexto?.trim() || "Ver enlace"}</span>
                        </div>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, enlaceUrl: null, enlaceTexto: null }))}
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0"
                          style={{ color: "var(--texto-secundario)", background: "var(--blanco)", border: "1px solid var(--gris-borde)", transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.06)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>Quitar</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Estado: fijar + borrador */}
            <div>
              <FieldLabel label="Estado" />
              <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${form.destacado ? "#bfdbfe" : "var(--gris-borde)"}`, transition: "border-color 0.18s" }}>
                {/* Fila: Fijar */}
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 cursor-pointer"
                  style={{ background: form.destacado ? "#dbeafe" : "var(--blanco)", transition: "background 0.18s" }}
                  onClick={() => setForm({ ...form, destacado: !form.destacado })}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: form.destacado ? "#bfdbfe" : "var(--gris-superficie)", transition: "background 0.18s" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={form.destacado ? "#1d4ed8" : "var(--texto-muted)"} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: form.destacado ? "#1d4ed8" : "var(--texto-primario)" }}>Fijar en la parte superior</p>
                      <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--texto-muted)" }}>Aparece siempre el primero en el listado</p>
                    </div>
                  </div>
                  <Toggle checked={form.destacado} onChange={(v) => setForm({ ...form, destacado: v })} color="#2563eb" />
                </div>

                {/* Separador */}
                {!form.destacado && form.estado !== "borrador" && (
                  <div style={{ height: 1, background: "var(--gris-borde)" }} />
                )}

                {/* Fila: Borrador — solo al crear, no al editar un publicado */}
                {!(editando && editando.estado !== "borrador") && (
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 cursor-pointer"
                  style={{ background: form.estado === "borrador" ? "#fffbeb" : "var(--blanco)", transition: "background 0.18s" }}
                  onClick={() => setForm({ ...form, estado: form.estado === "borrador" ? "publicado" : "borrador" })}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: form.estado === "borrador" ? "#fde68a" : "var(--gris-superficie)", transition: "background 0.18s" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={form.estado === "borrador" ? "#d97706" : "var(--texto-muted)"} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: form.estado === "borrador" ? "#92400e" : "var(--texto-primario)" }}>Guardar como borrador</p>
                      <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--texto-muted)" }}>No visible hasta que lo publiques manualmente</p>
                    </div>
                  </div>
                  <Toggle checked={form.estado === "borrador"} onChange={(v) => setForm({ ...form, estado: v ? "borrador" : "publicado" })} color="#d97706" />
                </div>
                )}
              </div>
            </div>
          </div></div>
          )}

        </div>{/* fin scroll */}

        {/* ── Footer ── */}
        <div className="px-8 py-5 flex items-center justify-between gap-3 shrink-0"
          style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
          <div className="flex-1 min-w-0">
            {errorMsg && <p className="text-sm truncate" style={{ color: "var(--error)" }}>{errorMsg}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleRequestClose}
              className="text-sm px-4 py-2 rounded-xl font-medium"
              style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)", background: "transparent", transition: "background 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}>
              Cancelar
            </button>
            <button type="button" onClick={handlePreview}
              className="text-sm px-4 py-2 rounded-xl font-medium"
              style={{ color: "#2563eb", border: "1px solid #bfdbfe", background: "#eff6ff", transition: "background 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}>
              Previsualizar
            </button>
            {(() => {
              const active = canSubmit && (!editando || isDirty);
              const bg = active ? GRAD_EGM : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
              return (
                <button
                  onClick={() => { if (!active) { setTouched(true); return; } onSubmit(form); }}
                  disabled={submitting}
                  title={!canSubmit ? "Título y contenido son obligatorios" : editando && !isDirty ? "No has cambiado nada aún" : undefined}
                  className="text-sm font-semibold px-5 py-2 rounded-xl"
                  style={{ background: bg, color: "#fff", boxShadow: active ? "0 2px 8px rgba(27,63,126,0.3)" : "none", cursor: active ? "pointer" : "not-allowed", opacity: submitting ? 0.5 : 1, transition: "background 0.2s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { if (active) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; }}}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = submitting ? "0.5" : "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { if (active) e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { if (active) e.currentTarget.style.transform = "scale(1.04)"; }}>
                  {submitting ? "Guardando..." : editando ? "Guardar cambios" : "Publicar comunicado"}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>

    {/* Diálogo confirmar cierre */}
    {confirmClose && (
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: "rgba(0,0,0,0.45)" }}>
        <div className="w-full max-w-xs flex flex-col gap-5 p-6 rounded-2xl"
          style={{ background: "var(--blanco)", boxShadow: "0 32px 80px rgba(0,0,0,0.22)", border: "1px solid var(--gris-borde)", animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div className="flex justify-center">
            <div className="flex items-center justify-center rounded-full" style={{ width: 52, height: 52, background: "#fef9c3", border: "1.5px solid #fde047" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ca8a04" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
            </div>
          </div>
          <div className="text-center flex flex-col gap-1">
            <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>¿Descartar los cambios?</p>
            <p className="text-sm" style={{ color: "var(--texto-muted)" }}>Tienes cambios sin guardar. Si sales ahora los perderás.</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setConfirmClose(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: GRAD_EGM, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(27,63,126,0.3)", transition: "opacity 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}>
              Seguir editando
            </button>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)", cursor: "pointer", transition: "background 0.18s ease, color 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}>
              Descartar cambios
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// ── FORMULARIO ANUNCIO (modal + secciones colapsables) ───────────────────────
function FormAnuncio({
  initialValues, editando, submitting, formError,
  onClose, onSubmit, onPreview,
}: {
  initialValues: NoticiaInput;
  editando: Noticia | null;
  submitting: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (data: NoticiaInput) => void;
  onPreview: (item: FeedItem) => void;
}) {
  type Tab = "contenido" | "multimedia" | "publicacion";
  const [tab, setTab]         = useState<Tab>("contenido");
  const visitedTabs           = useRef<Set<Tab>>(new Set(["contenido"]));
  const [touched, setTouched] = useState(false);
  const [form, setForm]       = useState<NoticiaInput>({ ...EMPTY_FORM, ...initialValues });
  // Snapshot inmutable para detectar si el usuario cambió algo
  const initialSnapshot = useRef<string>(JSON.stringify(initialValues));
  const isDirty   = JSON.stringify(form) !== initialSnapshot.current;
  const canSubmit = form.titulo.trim().length > 0 && form.contenido.trim().length > 0;

  const [confirmClose, setConfirmClose] = useState(false);
  const handleRequestClose = () => { if (isDirty) setConfirmClose(true); else onClose(); };

  const [imagenModo, setImagenModo]     = useState<"url" | "upload">("url");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingAdj, setUploadingAdj] = useState(false);
  const [aiLoading, setAiLoading]       = useState<"titulo" | "contenido" | null>(null);
  const [localError, setLocalError]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adjuntoRef   = useRef<HTMLInputElement>(null);

  const errorMsg = localError ?? formError;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true); setLocalError(null);
    try {
      const url = await subirImagenBackend(file);
      setForm((f) => ({ ...f, imagenUrl: url }));
      setImagenModo("url");
    } catch (err) { setLocalError(`Error al subir la imagen: ${err instanceof Error ? err.message : String(err)}`); }
    finally { setUploadingImg(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  async function handleAdjuntoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAdj(true); setLocalError(null);
    try {
      const { url, nombre } = await subirAdjuntoBackend(file);
      setForm((f) => ({ ...f, adjuntoUrl: url, adjuntoNombre: nombre }));
    } catch { setLocalError("Error al subir el documento. Inténtalo de nuevo."); }
    finally { setUploadingAdj(false); if (adjuntoRef.current) adjuntoRef.current.value = ""; }
  }

  async function sugerirConIA(campo: "titulo" | "contenido") {
    const base = campo === "titulo" ? (form.contenido.trim() || form.titulo.trim()) : form.contenido.trim();
    if (!base) { setLocalError("Escribe algo antes de usar la IA."); return; }
    setAiLoading(campo); setLocalError(null);
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
    } catch { setLocalError("La IA no está disponible en este momento."); }
    finally { setAiLoading(null); }
  }

  function handlePreview() {
    const item: FeedItem = {
      id: "preview",
      titulo: form.titulo || "(Sin título)",
      descripcion: form.contenido,
      imagenUrl: form.imagenUrl,
      fecha: new Date().toISOString(),
      fuente: "empresa",
      categoria: form.categoria ?? null,
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
    onPreview(item);
  }

  const tituloError    = touched && !form.titulo.trim();
  const contenidoError = touched && !form.contenido.trim();

  const badgeMult = useMemo(() => [form.imagenUrl, form.videoUrl, form.adjuntoUrl].filter(Boolean).length, [form.imagenUrl, form.videoUrl, form.adjuntoUrl]);
  const badgePub  = useMemo(() => [form.enlaceUrl, form.fijado, form.estado === "borrador"].filter(Boolean).length, [form.enlaceUrl, form.fijado, form.estado]);
  const embedUrl  = useMemo(() => form.videoUrl ? getVideoEmbedUrl(form.videoUrl) : null, [form.videoUrl]);
  const badgeCont = useMemo(() => touched ? [!form.titulo.trim(), !form.contenido.trim()].filter(Boolean).length : 0, [touched, form.titulo, form.contenido]);

  const TABS = useMemo<{ id: Tab; label: string; badge?: number; error?: boolean }[]>(() => [
    { id: "contenido",   label: "Contenido",   badge: badgeCont || undefined, error: badgeCont > 0 },
    { id: "multimedia",  label: "Multimedia",  badge: badgeMult },
    { id: "publicacion", label: "Publicación", badge: badgePub  },
  ], [badgeCont, badgeMult, badgePub]);


  // Bloquear scroll del body (solo la página de fondo, el modal scrollea internamente)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Cierre con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const CATEGORIAS = ["General", "Aviso", "Evento"];

  return (
    <>
    {/* Overlay */}
    <div className="fixed inset-0 flex items-start justify-center"
      style={{ zIndex: 160, background: "rgba(0,0,0,0.52)", paddingTop: 96, paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}
      onClick={handleRequestClose}>

      {/* Card — altura automática con límite máximo */}
      <div className="relative w-full flex flex-col"
        style={{
          maxWidth: 660,
          height: "auto",
          maxHeight: "calc(100vh - 112px)",
          background: "var(--blanco)",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
          isolation: "isolate",
        }}
        onClick={(e) => e.stopPropagation()}>

        {/* ── Cabecera ── */}
        <div className="relative shrink-0 overflow-hidden" style={{ background: GRAD_EGM }}>
          {/* Textura de profundidad — destello sutil arriba a la derecha */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 90% 10%, rgba(255,255,255,0.07) 0%, transparent 55%)" }} />
          {/* Viñeta inferior izquierda */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 0% 120%, rgba(37,99,235,0.18) 0%, transparent 50%)" }} />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <h3 style={{
                fontFamily: "var(--font-raleway), sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.65rem, 4vw, 2.1rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                margin: 0,
                textShadow: "0 1px 12px rgba(0,0,0,0.18)",
              }}>
                {editando ? "Editar anuncio" : "Nuevo anuncio"}
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
                {editando ? "Modifica los datos y guarda los cambios." : "Visible para todos los empleados de tu empresa."}
              </p>
            </div>
            <button onClick={handleRequestClose}
              className="shrink-0 flex items-center justify-center"
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", cursor: "pointer", transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
              title="Cerrar (Esc)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="shrink-0 relative" style={{ background: "var(--gris-superficie)", borderBottom: "1px solid var(--gris-borde)" }}>
          <div className="flex">
            {TABS.map(({ id, label, badge, error }) => (
              <button key={id} type="button" onClick={() => { visitedTabs.current.add(id); setTab(id); }}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors"
                style={{
                  color: tab === id ? (error ? "var(--error)" : "var(--azul-accion)") : "var(--texto-muted)",
                  background: "none",
                }}>
                {label}
                {badge ? (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{
                      background: error ? "var(--error)" : tab === id ? "var(--azul-accion)" : "#d1d5db",
                      color: error || tab === id ? "#fff" : "var(--texto-muted)",
                      minWidth: 18, textAlign: "center",
                    }}>
                    {badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          {/* Línea indicadora animada */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: `${100 / TABS.length}%`,
            height: 2,
            borderRadius: "2px 2px 0 0",
            background: TABS.find((t) => t.id === tab)?.error ? "var(--error)" : "var(--azul-accion)",
            transform: `translateX(${TABS.findIndex((t) => t.id === tab) * 100}%)`,
            transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease",
          }} />
        </div>

        {/* ── Cuerpo con scroll ── */}
        <div className="overflow-y-auto" style={{ background: "var(--gris-superficie)" }}>

          {/* ── TAB: Contenido — siempre visible, es el default ── */}
          <div style={{ display: tab === "contenido" ? "block" : "none" }}>
          <div className="flex flex-col gap-6" style={{ padding: "28px 32px" }}>
            <div>
              <FieldLabel label="Título" required
                right={
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs tabular-nums" style={{ color: form.titulo.length > 80 ? "var(--error)" : "var(--texto-muted)" }}>{form.titulo.length}/80</span>
                    <AIButton loading={aiLoading === "titulo"} label="Sugerir título" loadingLabel="Generando..." onClick={() => sugerirConIA("titulo")} />
                  </div>
                }
              />
              <input type="text" value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Recordatorio reunión de equipo"
                className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                style={{ ...inputStyle, ...(tituloError ? { borderColor: "var(--error)", boxShadow: "0 0 0 3px rgba(239,68,68,0.12)" } : {}) }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {tituloError && <p className="text-xs mt-1.5" style={{ color: "var(--error)" }}>El título es obligatorio</p>}
            </div>

            <div>
              <FieldLabel label="Descripción" required
                right={
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs tabular-nums" style={{ color: "var(--texto-muted)" }}>{form.contenido.length} car.</span>
                    <AIButton loading={aiLoading === "contenido"} disabled={!form.contenido.trim()}
                      label="Mejorar con IA" loadingLabel="Mejorando..." onClick={() => sugerirConIA("contenido")} />
                  </div>
                }
              />
              <textarea value={form.contenido}
                onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                placeholder="Escribe la descripción. Puedes usar **negrita** y - listas."
                className="w-full rounded-xl px-4 py-3 text-base focus:outline-none resize-none"
                style={{ ...inputStyle, minHeight: 180, ...(contenidoError ? { borderColor: "var(--error)", boxShadow: "0 0 0 3px rgba(239,68,68,0.12)" } : {}) }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {contenidoError && <p className="text-xs mt-1.5" style={{ color: "var(--error)" }}>La descripción es obligatoria</p>}
            </div>

            <div>
              <FieldLabel label="Categoría" />
              <div className="flex gap-2 flex-wrap">
                {CATEGORIAS.map((cat) => {
                  const active = (form.categoria ?? "General") === cat;
                  const col = CATEGORIA_COLORS_LIGHT[cat] ?? CATEGORIA_COLORS_LIGHT.General;
                  return (
                    <button key={cat} type="button"
                      onClick={() => setForm({ ...form, categoria: cat === "General" ? null : cat })}
                      className="text-sm font-semibold px-4 py-1.5 rounded-full transition-all"
                      style={{
                        background: active ? col.bg : "var(--blanco)",
                        color: active ? col.text : "var(--texto-muted)",
                        border: `1.5px solid ${active ? col.border : "var(--gris-borde)"}`,
                        boxShadow: active ? `0 2px 8px ${col.border}60` : "none",
                      }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div></div>

          {/* ── TAB: Multimedia — montaje lazy ── */}
          {visitedTabs.current.has("multimedia") && (
          <div style={{ display: tab === "multimedia" ? "block" : "none" }}>
          <div className="flex flex-col gap-6" style={{ padding: "28px 32px" }}>
            <div>
              <FieldLabel label="Imagen"
                right={
                  <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                    {(["url", "upload"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setImagenModo(m)}
                        className="text-xs px-3 py-1.5 font-semibold transition-all"
                        style={{ background: imagenModo === m ? GRAD_BTN : "transparent", color: imagenModo === m ? "#fff" : "var(--texto-secundario)" }}>
                        {m === "url" ? "URL" : "Subir"}
                      </button>
                    ))}
                  </div>
                }
              />
              {imagenModo === "url" ? (
                <>
                  <input type="url" value={form.imagenUrl || ""}
                    onChange={(e) => setForm({ ...form, imagenUrl: e.target.value || null })}
                    placeholder="https://..."
                    className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                  {form.imagenUrl && (
                    <div className="relative mt-3">
                      <img src={form.imagenUrl} alt="preview" className="rounded-xl w-full object-cover"
                        style={{ height: "160px" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                        className="absolute top-2 right-2 flex items-center justify-center transition-all"
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.8)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.transform = "scale(1)"; }}
                        title="Quitar imagen">
                        <IconX size={12} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl py-8 text-sm transition-all disabled:opacity-60"
                    style={{ border: "2px dashed var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-muted)" }}
                    onMouseEnter={(e) => { if (!uploadingImg) { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.background = "#f0f7ff"; }}}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--blanco)"; }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--blanco)"; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "var(--gris-borde)";
                      e.currentTarget.style.background = "var(--blanco)";
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        handleImageUpload({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                      }
                    }}>
                    {uploadingImg
                      ? <><span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Subiendo...</span></>
                      : <><IconUpload /><span className="font-medium">Arrastra o selecciona imagen</span><span className="text-xs opacity-70">JPG, PNG, WebP</span></>}
                  </button>
                  {form.imagenUrl && (
                    <div className="relative mt-3">
                      <img src={form.imagenUrl} alt="preview" className="rounded-xl w-full object-cover" style={{ height: "160px" }} />
                      <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(22,163,74,0.9)", color: "#fff" }}>Subida correctamente</span>
                      <button type="button" onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                        className="absolute top-2 right-2 flex items-center justify-center transition-all"
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.8)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.transform = "scale(1)"; }}
                        title="Quitar imagen">
                        <IconX size={12} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <FieldLabel label="Vídeo (YouTube o Vimeo)" />
              {embedUrl ? (
                /* Vídeo válido — previsualización con chip y botón quitar */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      <span className="text-xs font-semibold truncate max-w-[220px]" style={{ color: "#166534" }}>{form.videoUrl}</span>
                    </div>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, videoUrl: null }))}
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0"
                      style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                      Quitar
                    </button>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", maxHeight: 200 }}>
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen style={{ border: "none" }} />
                  </div>
                </div>
              ) : (
                /* Sin vídeo o URL inválida */
                <div className="flex flex-col gap-1.5">
                  <input type="url" value={form.videoUrl || ""}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value || null })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                  {form.videoUrl && (
                    <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#b45309" }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                      Solo se pueden incrustar vídeos de YouTube o Vimeo
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <FieldLabel label="Documento adjunto" />
              <input ref={adjuntoRef} type="file" accept=".pdf,.doc,.docx" onChange={handleAdjuntoUpload} className="hidden" />
              {form.adjuntoUrl ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ border: "1.5px solid #86efac", background: "#f0fdf4" }}>
                  <span style={{ color: "#16a34a" }}><IconDoc /></span>
                  <span className="text-sm flex-1 truncate font-medium" style={{ color: "#166534" }}>
                    {form.adjuntoNombre ?? "Documento"}
                  </span>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, adjuntoUrl: null, adjuntoNombre: null }))}
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                    Quitar
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => adjuntoRef.current?.click()} disabled={uploadingAdj}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
                  style={{ border: "1.5px dashed var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-muted)" }}
                  onMouseEnter={(e) => { if (!uploadingAdj) e.currentTarget.style.borderColor = "#93c5fd"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; }}>
                  {uploadingAdj
                    ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Subiendo...</span></>
                    : <><IconDoc /><span className="font-medium">Adjuntar PDF o Word</span></>}
                </button>
              )}
            </div>
          </div></div>
          )}

          {/* ── TAB: Publicación — montaje lazy ── */}
          {visitedTabs.current.has("publicacion") && (
          <div style={{ display: tab === "publicacion" ? "block" : "none" }}>
          <div className="flex flex-col gap-6" style={{ padding: "28px 32px" }}>
            <div style={{ width: "100%" }}>
              <FieldLabel label="Enlace externo" />
              <div className="flex flex-col gap-2">
                <input type="url" value={form.enlaceUrl || ""}
                  onChange={(e) => setForm({ ...form, enlaceUrl: e.target.value || null })}
                  placeholder="https://..."
                  className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
                {form.enlaceUrl && (
                  <>
                    <input type="text" value={form.enlaceTexto || ""}
                      onChange={(e) => setForm({ ...form, enlaceTexto: e.target.value || null })}
                      placeholder='Texto del enlace — ej: "Más información"'
                      className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                      style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                    {/* Previsualización de cómo quedará */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <p className="text-xs font-medium" style={{ color: "var(--texto-muted)" }}>Así se verá en el anuncio</p>
                      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                        style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dbeafe" }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                          </div>
                          <span className="text-sm font-medium truncate" style={{ color: "#2563eb" }}>
                            {form.enlaceTexto?.trim() || "Ver enlace"}
                          </span>
                        </div>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, enlaceUrl: null, enlaceTexto: null }))}
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0"
                          style={{ color: "var(--texto-secundario)", background: "var(--blanco)", border: "1px solid var(--gris-borde)", transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.18s ease" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.06)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                          Quitar
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Visibilidad ── */}
            <div>
              <FieldLabel label="Estado" />
              <div className="rounded-2xl overflow-hidden" style={{
                border: `1.5px solid ${form.fijado ? "#bfdbfe" : "var(--gris-borde)"}`,
                transition: "border-color 0.18s",
              }}>

                {/* Fila: Fijar */}
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 cursor-pointer"
                  style={{ background: form.fijado ? "#dbeafe" : "var(--blanco)", transition: "background 0.18s" }}
                  onClick={() => setForm({ ...form, fijado: !form.fijado })}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: form.fijado ? "#bfdbfe" : "var(--gris-superficie)", transition: "background 0.18s" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={form.fijado ? "#1d4ed8" : "var(--texto-muted)"} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: form.fijado ? "#1d4ed8" : "var(--texto-primario)" }}>Fijar en la parte superior</p>
                      <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--texto-muted)" }}>Aparece siempre el primero en el listado</p>
                    </div>
                  </div>
                  <Toggle checked={form.fijado ?? false} onChange={(v) => setForm({ ...form, fijado: v })} color="#2563eb" />
                </div>

                {/* Separador — desaparece si alguno está activo o si la fila borrador está oculta */}
                {!form.fijado && form.estado !== "borrador" && !(editando && editando.estado !== "borrador") && (
                  <div style={{ height: 1, background: "var(--gris-borde)" }} />
                )}

                {/* Fila: Borrador — oculta cuando ya se editando un anuncio publicado */}
                {!(editando && editando.estado !== "borrador") && (
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 cursor-pointer"
                  style={{ background: form.estado === "borrador" ? "#fffbeb" : "var(--blanco)", transition: "background 0.18s" }}
                  onClick={() => setForm({ ...form, estado: form.estado === "borrador" ? "publicado" : "borrador" })}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: form.estado === "borrador" ? "#fde68a" : "var(--gris-superficie)", transition: "background 0.18s" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={form.estado === "borrador" ? "#d97706" : "var(--texto-muted)"} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: form.estado === "borrador" ? "#92400e" : "var(--texto-primario)" }}>Guardar como borrador</p>
                      <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--texto-muted)" }}>No visible hasta que lo publiques manualmente</p>
                    </div>
                  </div>
                  <Toggle checked={form.estado === "borrador"} onChange={(v) => setForm({ ...form, estado: v ? "borrador" : "publicado" })} color="#d97706" />
                </div>
                )}

              </div>
            </div>
          </div>
          </div>
          )}

        </div>

        {/* ── Footer fijo ── */}
        <div className="px-8 py-5 flex items-center justify-between gap-3 shrink-0"
          style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
          <div className="flex-1 min-w-0">
            {errorMsg && <p className="text-sm truncate" style={{ color: "var(--error)" }}>{errorMsg}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleRequestClose}
              className="text-sm px-4 py-2 rounded-xl font-medium"
              style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)", background: "transparent", transition: "background 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}>
              Cancelar
            </button>
            <button type="button" onClick={handlePreview}
              className="text-sm px-4 py-2 rounded-xl font-medium"
              style={{ color: "#2563eb", border: "1px solid #bfdbfe", background: "#eff6ff", transition: "background 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}>
              Previsualizar
            </button>
            {/* Guardar cambios — izquierda, editar borrador */}
            {editando && editando.estado === "borrador" && (() => {
              const active = isDirty && canSubmit;
              return (
                <button onClick={() => { if (!active) return; setTouched(true); onSubmit(form); }}
                  disabled={submitting}
                  title={!canSubmit ? "Título y contenido son obligatorios" : !isDirty ? "No has cambiado nada aún" : undefined}
                  className="text-sm font-semibold px-5 py-2 rounded-xl transition-all"
                  style={{
                    background: active ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)" : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
                    color: "#fff",
                    boxShadow: active ? "0 2px 8px rgba(217,119,6,0.35)" : "none",
                    cursor: active ? "pointer" : "not-allowed",
                    opacity: submitting ? 0.5 : 1,
                    transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.18s ease",
                  }}
                  onMouseEnter={(e) => { if (active) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = submitting ? "0.5" : "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { if (active) e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { if (active) e.currentTarget.style.transform = "scale(1.04)"; }}>
                  {submitting ? "Guardando..." : "Guardar cambios"}
                </button>
              );
            })()}

            {/* Botón principal — crear o editar publicado */}
            {!(editando && editando.estado === "borrador") && (() => {
              const esBorrador = form.estado === "borrador" && !editando;
              const active = canSubmit && (!editando || isDirty);
              const bg = active
                ? esBorrador ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)" : GRAD_BTN
                : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
              const shadow = active
                ? esBorrador ? "0 2px 8px rgba(217,119,6,0.35)" : "0 2px 8px rgba(37,99,235,0.3)"
                : "none";
              const tip = !canSubmit
                ? "Título y contenido son obligatorios"
                : editando && !isDirty
                  ? "No has cambiado nada aún"
                  : undefined;
              return (
                <button onClick={() => { if (!active) return; setTouched(true); onSubmit(form); }}
                  disabled={submitting}
                  title={tip}
                  className="text-sm font-semibold px-5 py-2 rounded-xl transition-all"
                  style={{ background: bg, color: "#fff", boxShadow: shadow, cursor: active ? "pointer" : "not-allowed", opacity: submitting ? 0.5 : 1, transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { if (active) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = submitting ? "0.5" : "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { if (active) e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { if (active) e.currentTarget.style.transform = "scale(1.04)"; }}>
                  {submitting ? "Guardando..." : editando ? "Guardar cambios" : esBorrador ? "Guardar borrador" : "Publicar anuncio"}
                </button>
              );
            })()}

            {/* Publicar ahora — derecha, solo al editar borrador */}
            {editando && editando.estado === "borrador" && (() => {
              const active = canSubmit;
              return (
                <button onClick={() => { if (!active) return; setTouched(true); onSubmit({ ...form, estado: "publicado" }); }}
                  disabled={submitting}
                  title={!canSubmit ? "Título y contenido son obligatorios" : undefined}
                  className="text-sm font-semibold px-5 py-2 rounded-xl transition-all"
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#fff", boxShadow: active ? "0 2px 8px rgba(22,163,74,0.3)" : "none", cursor: active ? "pointer" : "not-allowed", opacity: submitting ? 0.5 : !active ? 0.5 : 1, transition: "opacity 0.18s ease, transform 0.18s ease" }}
                  onMouseEnter={(e) => { if (active) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = submitting || !active ? "0.5" : "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { if (active) e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { if (active) e.currentTarget.style.transform = "scale(1.04)"; }}>
                  {submitting ? "Publicando..." : "Publicar ahora"}
                </button>
              );
            })()}
          </div>
        </div>

      </div>
    </div>

    {/* ── Diálogo confirmar cierre con cambios ── */}
    {confirmClose && (
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: "rgba(0,0,0,0.45)" }}>
        <div className="w-full max-w-xs flex flex-col gap-5 p-6 rounded-2xl"
          style={{
            background: "var(--blanco)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
            border: "1px solid var(--gris-borde)",
            animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
          {/* Icono */}
          <div className="flex justify-center">
            <div className="flex items-center justify-center rounded-full" style={{ width: 52, height: 52, background: "#fef9c3", border: "1.5px solid #fde047" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ca8a04" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
          </div>
          {/* Texto */}
          <div className="text-center flex flex-col gap-1">
            <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>¿Descartar los cambios?</p>
            <p className="text-sm" style={{ color: "var(--texto-muted)" }}>Tienes cambios sin guardar. Si sales ahora los perderás.</p>
          </div>
          {/* Botones */}
          <div className="flex flex-col gap-2">
            <button onClick={() => setConfirmClose(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: GRAD_BTN, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.3)", transition: "opacity 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}>
              Seguir editando
            </button>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)", cursor: "pointer", transition: "background 0.18s ease, color 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}>
              Descartar cambios
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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
    <div className="flex flex-col gap-4">
      {/* Fila de 3 tarjetas grandes */}
      <div className="flex gap-4" style={{ height: 380 }}>
        <div className="flex-1 rounded-2xl animate-pulse" style={{ background: "var(--gris-superficie)" }} />
        <div className="hidden md:flex flex-col gap-4 flex-1">
          <div className="flex-1 rounded-2xl animate-pulse" style={{ background: "var(--gris-superficie)" }} />
          <div className="flex-1 rounded-2xl animate-pulse" style={{ background: "var(--gris-superficie)" }} />
        </div>
      </div>
      {/* Filas de lista */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-5 px-5 py-4"
            style={{ borderBottom: i < 3 ? "1px solid var(--gris-borde)" : "none" }}>
            <div className="rounded-xl animate-pulse shrink-0" style={{ width: 140, height: 96, background: "var(--gris-superficie)" }} />
            <div className="flex-1 flex flex-col gap-2.5">
              <div className="rounded animate-pulse" style={{ height: 12, width: "30%", background: "var(--gris-superficie)" }} />
              <div className="rounded animate-pulse" style={{ height: 16, width: "70%", background: "var(--gris-superficie)" }} />
              <div className="rounded animate-pulse" style={{ height: 13, width: "90%", background: "var(--gris-superficie)" }} />
            </div>
          </div>
        ))}
      </div>
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
