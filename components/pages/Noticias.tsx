"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "../../lib/api/noticias";
import { apiFetch, API_URL } from "@/lib/api";
import type { Noticia, NoticiaInput } from "../../lib/types/noticias";
import DashboardHero from "@/components/ui/DashboardHero";

// ── MOCK DATA ──────────────────────────────────────────────────────────────────
const MOCK_COMUNICADOS: Comunicado[] = [
  {
    comunicadoId: "m1",
    titulo: "Apertura del nuevo espacio de coworking en el Edificio A",
    mensaje: "EGM Atalayas anuncia la apertura del nuevo espacio de coworking en la planta baja del Edificio A. El espacio cuenta con 40 puestos de trabajo, salas de reuniones y zona de descanso. Disponible desde el 1 de mayo.",
    fechaPublicacion: "2026-04-10T09:00:00Z",
    activo: true,
    imagenUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
    categoria: "Novedades",
  },
  {
    comunicadoId: "m2",
    titulo: "Jornada de networking: Empresas del Área — Mayo 2026",
    mensaje: "Os invitamos a la jornada de networking entre empresas del área. Se celebrará el próximo 15 de mayo en el Salón de Actos del Edificio Central a partir de las 18:00h. Confirmad asistencia antes del 10 de mayo.",
    fechaPublicacion: "2026-04-08T10:30:00Z",
    activo: true,
    imagenUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    categoria: "Eventos",
  },
  {
    comunicadoId: "m3",
    titulo: "Mantenimiento programado del parking — 20 de abril",
    mensaje: "El próximo lunes 20 de abril se realizarán trabajos de mantenimiento en el parking exterior entre las 08:00 y las 14:00h. Durante ese horario las plazas de la zona B estarán inhabilitadas. Disculpad las molestias.",
    fechaPublicacion: "2026-04-05T08:00:00Z",
    activo: true,
    imagenUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80",
    categoria: "Avisos",
  },
  {
    comunicadoId: "m4",
    titulo: "Nueva cafetería disponible en el Edificio C",
    mensaje: "A partir del 1 de abril el Edificio C cuenta con una nueva cafetería en la planta baja. Horario de 07:30 a 16:30h, de lunes a viernes. Menú del día disponible con descuento para empleados del área.",
    fechaPublicacion: "2026-03-28T11:00:00Z",
    activo: true,
    imagenUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    categoria: "Novedades",
  },
  {
    comunicadoId: "m5",
    titulo: "Actualización del protocolo de acceso con tarjeta",
    mensaje: "Informamos de que a partir del próximo 25 de abril se actualizará el sistema de control de acceso. Todos los empleados deberán solicitar la renovación de su tarjeta en recepción antes de esa fecha.",
    fechaPublicacion: "2026-03-20T09:00:00Z",
    activo: true,
    imagenUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    categoria: "Avisos",
  },
];

const CATEGORIAS = ["Todos", "Novedades", "Eventos", "Avisos"] as const;
type Categoria = typeof CATEGORIAS[number];

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface Comunicado {
  comunicadoId:     string;
  titulo:           string;
  mensaje:          string;
  fechaPublicacion: string;
  activo:           boolean;
  imagenUrl?:       string | null;
  categoria?:       string;
}

const EMPTY_FORM: NoticiaInput = {
  titulo:    "",
  contenido: "",
  esGlobal:  false,
  empresaId: null,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function ComunicacionPage() {
  const { usuario } = useAuth();

  // Sección activa — comunicados EGM o anuncios empresa
  const [seccion, setSeccion] = useState<"egm" | "empresa">("egm");

  // Comunicados EGM (solo lectura)
  const [comunicados, setComunicados]         = useState<Comunicado[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);

  // Anuncios empresa
  const [anuncios, setAnuncios]               = useState<Noticia[]>([]);
  const [loadingAnuncios, setLoadingAnuncios] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>("Todos");
  const [showForm, setShowForm]               = useState(false);
  const [editando, setEditando]               = useState<Noticia | null>(null);
  const [form, setForm]                       = useState<NoticiaInput>(EMPTY_FORM);
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const esAdmin = usuario?.codigoRol === "ROLE_ADMIN_EMPRESA" || usuario?.codigoRol === "ROLE_ADMIN";

  // ── CARGA DE DATOS ────────────────────────────────────────────────────────
  useEffect(() => {
    cargarComunicados();
    if (esAdmin && usuario?.empresaId) cargarAnuncios();
  }, [usuario?.empresaId]);

  async function cargarComunicados() {
    setLoadingComunicados(true);
    try {
      const res = await apiFetch(`${API_URL}/comunicados`);
      if (res.ok) {
        const data = await res.json();
        setComunicados(data.filter((c: Comunicado) => c.activo));
      }
    } catch {}
    finally { setLoadingComunicados(false); }
  }

  async function cargarAnuncios() {
    setLoadingAnuncios(true);
    try {
      const data = await getNoticias(usuario?.empresaId);
      setAnuncios(data.filter((n) => n.activo));
    } catch {}
    finally { setLoadingAnuncios(false); }
  }

  // ── HANDLERS ANUNCIOS ─────────────────────────────────────────────────────
  function abrirCrear() {
    setForm({ ...EMPTY_FORM, empresaId: usuario?.empresaId ?? null });
    setEditando(null);
    setShowForm(true);
    setError(null);
  }

  function abrirEditar(n: Noticia) {
    setForm({ titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal, empresaId: n.empresaId });
    setEditando(n);
    setShowForm(true);
    setError(null);
  }

  function cerrarForm() {
    setShowForm(false);
    setEditando(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit() {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      setError("El título y el contenido son obligatorios");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editando) {
        await editarNoticia(editando.anuncioId, form);
      } else {
        await crearNoticia(form);
      }
      await cargarAnuncios();
      cerrarForm();
    } catch {
      setError("Error al guardar. Inténtalo de nuevo");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDesactivar(id: string) {
    if (!confirm("¿Seguro que quieres eliminar este anuncio?")) return;
    try {
      await desactivarNoticia(id);
      await cargarAnuncios();
    } catch {}
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <DashboardHero prefijo="Centro de " titulo="Comunicación." imagenFondo="/background-comunicacion-empleado.jpg" />

      <div className="px-10 lg:px-16 pt-14 pb-16">
      {/* Selector de sección — solo visible para admins */}
      {esAdmin && (
        <div className="flex gap-1 mb-8">
          <SeccionTab
            label="Comunicados EGM"
            badge={comunicados.length}
            activo={seccion === "egm"}
            onClick={() => setSeccion("egm")}
          />
          <SeccionTab
            label="Anuncios de tu empresa"
            badge={anuncios.length}
            activo={seccion === "empresa"}
            onClick={() => setSeccion("empresa")}
          />
        </div>
      )}

      {/* ── SECCIÓN COMUNICADOS EGM ── */}
      {seccion === "egm" && (() => {
        const fuente = loadingComunicados ? [] : comunicados.length > 0 ? comunicados : MOCK_COMUNICADOS;
        const filtrados = categoriaActiva === "Todos"
          ? fuente
          : fuente.filter((c) => c.categoria === categoriaActiva);
        const [destacado, ...resto] = filtrados;

        return (
          <>
            {/* Filtros + orden */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium mr-1" style={{ color: "var(--texto-muted)" }}>
                  Categorías:
                </span>
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaActiva(cat)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: categoriaActiva === cat ? "var(--azul-egm)" : "var(--gris-superficie)",
                      color:      categoriaActiva === cat ? "#fff" : "var(--texto-secundario)",
                      border:     categoriaActiva === cat ? "1.5px solid var(--azul-egm)" : "1.5px solid var(--gris-borde)",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "var(--texto-muted)" }}>Ordenar:</span>
                <select
                  className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ border: "1.5px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                >
                  <option>Más reciente</option>
                  <option>A–Z por título</option>
                  <option>Más antiguo</option>
                </select>
              </div>
            </div>

            {loadingComunicados ? (
              <Spinner />
            ) : filtrados.length === 0 ? (
              <EstadoVacio
                titulo="Sin comunicados en esta categoría"
                descripcion="Prueba con otra categoría o consulta todos los comunicados."
                icono={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                }
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Tarjeta destacada */}
                {destacado && (
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer group"
                    style={{ minHeight: "420px" }}
                  >
                    {destacado.imagenUrl ? (
                      <img
                        src={destacado.imagenUrl}
                        alt={destacado.titulo}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0" style={{ background: "var(--azul-egm)" }} />
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,20,40,0.92) 40%, rgba(10,20,40,0.1) 100%)" }} />
                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-px" style={{ background: "rgba(255,255,255,0.6)" }} />
                        <span className="text-xs font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {formatDate(destacado.fechaPublicacion)}
                        </span>
                        {destacado.categoria && (
                          <span
                            className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                            style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)" }}
                          >
                            {destacado.categoria}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-semibold leading-snug mb-3 text-white">
                        {destacado.titulo}
                      </h2>
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.65)" }}>
                        {destacado.mensaje}
                      </p>
                      <div className="mt-4 flex items-center justify-end">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de artículos */}
                <div className="flex flex-col gap-5">
                  {resto.map((c) => (
                    <div
                      key={c.comunicadoId}
                      className="flex gap-4 group cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: "110px", height: "80px" }}>
                        {c.imagenUrl ? (
                          <img
                            src={c.imagenUrl}
                            alt={c.titulo}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full" style={{ background: "var(--azul-egm-light)" }} />
                        )}
                      </div>
                      {/* Texto */}
                      <div className="flex flex-col justify-center min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-4 h-px" style={{ background: "var(--azul-egm)" }} />
                          <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                            {formatDate(c.fechaPublicacion)}
                          </span>
                          {c.categoria && (
                            <span
                              className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}
                            >
                              {c.categoria}
                            </span>
                          )}
                        </div>
                        <h3
                          className="text-base font-semibold leading-snug line-clamp-2 transition-colors group-hover:opacity-70"
                          style={{ color: "var(--texto-primario)" }}
                        >
                          {c.titulo}
                        </h3>
                        <p className="text-sm mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--texto-muted)" }}>
                          {c.mensaje}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* ── SECCIÓN ANUNCIOS EMPRESA ── */}
      {seccion === "empresa" && esAdmin && (
        <>
          {/* Cabecera sección */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--texto-primario)" }}>
                Anuncios de {usuario?.nombreEmpresa ?? "tu empresa"}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
                Visibles solo para los empleados de tu empresa
              </p>
            </div>
            <button
              onClick={abrirCrear}
              className="text-base font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
            >
              + Nuevo anuncio
            </button>
          </div>

          {/* Formulario */}
          {showForm && (
            <div
              className="rounded-xl p-6 mb-6"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
                  {editando ? "Editar anuncio" : "Nuevo anuncio"}
                </h3>
                <button onClick={cerrarForm} className="text-xl leading-none"
                  style={{ color: "var(--texto-muted)" }}>×</button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--texto-secundario)" }}>
                    Título <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Recordatorio reunión de equipo"
                    className="w-full rounded-lg px-3 py-2 text-base focus:outline-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--texto-secundario)" }}>
                    Contenido <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <textarea
                    value={form.contenido}
                    onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                    placeholder="Escribe el contenido del anuncio..."
                    rows={4}
                    className="w-full rounded-lg px-3 py-2 text-base focus:outline-none resize-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                  />
                </div>
              </div>
              {error && <p className="text-sm mt-3" style={{ color: "var(--error)" }}>{error}</p>}
              <div className="flex gap-2 justify-end pt-4 mt-2"
                style={{ borderTop: "1px solid var(--gris-superficie)" }}>
                <button onClick={cerrarForm} className="text-base px-4 py-2 rounded-lg"
                  style={{ color: "var(--texto-secundario)" }}>
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="text-base font-medium px-5 py-2 rounded-lg disabled:opacity-50 transition-colors"
                  style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
                >
                  {submitting ? "Guardando..." : editando ? "Guardar cambios" : "Publicar anuncio"}
                </button>
              </div>
            </div>
          )}

          {loadingAnuncios ? (
            <Spinner />
          ) : anuncios.length === 0 ? (
            <EstadoVacio
              titulo="Sin anuncios publicados"
              descripcion="Crea el primer anuncio para que tus empleados estén al día de las novedades de la empresa."
              accion="Crear primer anuncio"
              onAccion={abrirCrear}
              icono={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {anuncios.map((n) => (
                <div
                  key={n.anuncioId}
                  className="rounded-xl px-6 py-5"
                  style={{
                    background:  "var(--blanco)",
                    border:      "1px solid var(--gris-borde)",
                    borderLeft:  "3px solid var(--verde-oliva)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}
                        >
                          {usuario?.nombreEmpresa ?? "Tu empresa"}
                        </span>
                        <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                          {formatDate(n.creadoEn)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold mb-1.5" style={{ color: "var(--texto-primario)" }}>
                        {n.titulo}
                      </h3>
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--texto-secundario)" }}>
                        {n.contenido}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => abrirEditar(n)}
                        className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDesactivar(n.anuncioId)}
                        className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--error)", border: "1px solid var(--error-light)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--error-light)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

// ── SUBCOMPONENTES ────────────────────────────────────────────────────────────

function SeccionTab({
  label, badge, activo, onClick,
}: {
  label:   string;
  badge:   number;
  activo:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 pb-4 px-3 text-base font-medium transition-colors"
      style={{ color: activo ? "var(--azul-egm)" : "var(--texto-muted)" }}
    >
      {label}
      {badge > 0 && (
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
          style={{
            background: activo ? "var(--azul-egm)" : "var(--gris-superficie)",
            color:      activo ? "var(--blanco)"   : "var(--texto-muted)",
          }}
        >
          {badge}
        </span>
      )}
      {activo && (
        <div
          className="absolute bottom-0 left-0 w-full h-0.5 rounded-full"
          style={{ background: "var(--azul-egm)" }}
        />
      )}
    </button>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }}
      />
    </div>
  );
}

function EstadoVacio({
  titulo, descripcion, icono, accion, onAccion,
}: {
  titulo:       string;
  descripcion:  string;
  icono:        React.ReactNode;
  accion?:      string;
  onAccion?:    () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center rounded-xl"
      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
      >
        {icono}
      </div>
      <p className="text-base font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
        {titulo}
      </p>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: "var(--texto-muted)" }}>
        {descripcion}
      </p>
      {accion && onAccion && (
        <button
          onClick={onAccion}
          className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
        >
          {accion}
        </button>
      )}
    </div>
  );
}