"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
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
        .filter((c) => c.activo && !estaExpirado(c.fechaExpiracion))
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
      setAnuncios(data.filter((n) => n.activo));
    } catch { setAnuncios([]); }
    finally { setLoadingAnuncios(false); }
  }

  // ── HANDLERS FORMULARIO ────────────────────────────────────────────────────
  function abrirCrear() {
    setForm({ ...EMPTY_FORM, empresaId: usuario?.empresaId ?? null });
    setEditando(null); setShowForm(true); setFormError(null);
  }

  function abrirEditar(n: Noticia) {
    setForm({ titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal, empresaId: n.empresaId, imagenUrl: n.imagenUrl ?? null });
    setEditando(n); setShowForm(true); setFormError(null);
  }

  function cerrarForm() {
    setShowForm(false); setEditando(null); setForm(EMPTY_FORM); setFormError(null);
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
    fuente: "egm", categoria: c.categoria, destacado: c.destacado,
    esNuevoItem: esNuevo(c.fechaPublicacion), _raw: c,
  }));

  const feedEmpresa: FeedItem[] = anuncios.map((n) => ({
    id: n.anuncioId, titulo: n.titulo, descripcion: n.contenido,
    imagenUrl: n.imagenUrl, fecha: n.creadoEn,
    fuente: "empresa", categoria: null, destacado: false,
    esNuevoItem: esNuevo(n.creadoEn), _raw: n,
  }));

  const feedCompleto = ordenarFeed([...feedEGM, ...feedEmpresa], "reciente");

  const topItems = [...feedEGM, ...feedEmpresa]
    .sort((a, b) => {
      if (a.destacado && !b.destacado) return -1;
      if (!a.destacado && b.destacado) return 1;
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
        .featured-card-large { height: 280px; width: 100%; }
        @media (min-width: 768px) { .featured-card-large { height: 420px; flex: 0 0 55%; width: auto; } }
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
              <FormField label="Título" required>
                <input type="text" value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Recordatorio reunión de equipo"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-colors"
                  style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                />
              </FormField>
              <FormField label="Contenido" required>
                <textarea value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  placeholder="Escribe el contenido del anuncio..."
                  rows={4}
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none resize-none transition-colors"
                  style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                />
              </FormField>
              <FormField label="Imagen (URL opcional)">
                <input type="url" value={form.imagenUrl ?? ""}
                  onChange={(e) => setForm({ ...form, imagenUrl: e.target.value || null })}
                  placeholder="https://..."
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                />
              </FormField>
            </div>

            {formError && <p className="text-sm mt-3" style={{ color: "var(--error)" }}>{formError}</p>}

            <div className="flex gap-2 justify-end pt-5 mt-2" style={{ borderTop: "1px solid var(--gris-borde)" }}>
              <button onClick={cerrarForm}
                className="text-sm px-4 py-2 rounded-xl transition-colors"
                style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}>
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
                style={{ background: GRAD_BTN, color: "#fff" }}>
                {submitting ? "Guardando..." : editando ? "Guardar cambios" : "Publicar anuncio"}
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

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      {modalItem && (
        <Modal onClose={() => setModalItem(null)}>
          <div className="relative w-full rounded-t-2xl overflow-hidden" style={{ height: "200px" }}>
            {modalItem.imagenUrl ? (
              <img src={modalItem.imagenUrl} alt={modalItem.titulo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: modalItem.fuente === "egm" ? GRAD_EGM : GRAD_EMP }} />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,15,35,0.82) 0%, transparent 55%)" }} />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 flex items-center gap-2 flex-wrap">
              <Badge fuente={modalItem.fuente} nombreEmpresa={usuario?.nombreEmpresa} destacado={modalItem.destacado} esNuevoItem={modalItem.esNuevoItem} />
              <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.5)" }}>{formatDate(modalItem.fecha)}</span>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 leading-snug" style={{ color: "var(--texto-primario)" }}>{modalItem.titulo}</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texto-secundario)" }}>{modalItem.descripcion}</p>
          </div>
        </Modal>
      )}
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
        <>
          <div className="absolute top-5 right-6">
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)", textShadow: SHADOW_TXT }}>
              {formatDate(item.fecha)}
            </span>
          </div>
          <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-10">
            <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
              <Badge fuente={item.fuente} categoria={item.categoria} destacado={item.destacado} esNuevoItem={item.esNuevoItem} />
            </div>
            <h2 className="text-white leading-tight mb-2 md:mb-3 max-w-xl"
              style={{ fontWeight: 800, fontSize: "clamp(1.1rem, 4vw, 2.1rem)", letterSpacing: "-0.02em", textShadow: SHADOW_TXT }}>
              {item.titulo}
            </h2>
            <p className="text-sm md:text-base leading-relaxed line-clamp-2 max-w-lg"
              style={{ color: "rgba(255,255,255,0.7)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              {item.descripcion}
            </p>
            <div className="mt-3 md:mt-6 flex items-center gap-2 transition-opacity opacity-55 group-hover:opacity-100">
              <span className="text-sm font-semibold text-white" style={{ textShadow: SHADOW_TXT }}>Leer más</span>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </div>
          </div>
        </>
      )}

      {/* ── Pequeña ─────────────────────────────────────────────────────── */}
      {!isLarge && (
        <div className="absolute inset-0 flex flex-col justify-end p-4 gap-1.5" style={{ paddingBottom: "14px" }}>
          <span className="absolute top-3.5 right-4 text-xs font-semibold"
            style={{ color: "rgba(255,255,255,0.82)", textShadow: SHADOW_TXT }}>
            {formatDate(item.fecha)}
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
            <Badge fuente={item.fuente} categoria={item.categoria} esNuevoItem={item.esNuevoItem} size="sm" />
          </div>
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-white leading-tight line-clamp-2 flex-1 min-w-0"
              style={{ fontWeight: 800, fontSize: "clamp(0.88rem, 1.2vw, 1.05rem)", letterSpacing: "-0.02em", textShadow: SHADOW_TXT }}>
              {item.titulo}
            </h2>
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-70 group-hover:opacity-100 group-hover:scale-110"
              style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.32)" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </div>
          </div>
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
          <button onClick={onEdit} className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            Editar
          </button>
          <button onClick={onDelete} className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--error)", border: "1px solid var(--error-light)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--error-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            Eliminar
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
