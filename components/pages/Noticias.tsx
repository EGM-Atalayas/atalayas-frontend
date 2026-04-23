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
import type {
  Comunicado,
  CategoriaComunicado,
  Noticia,
  NoticiaInput,
} from "../../lib/types/noticias";
import DashboardHero from "@/components/ui/DashboardHero";

// ── CONSTANTES ─────────────────────────────────────────────────────────────────
const CATEGORIAS: CategoriaComunicado[] = ["Novedad", "Aviso", "Evento", "General"];

const CATEGORIA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Novedad: { bg: "#e8f5ee", text: "#1a6b3a", border: "#9dcdb3" },
  Aviso:   { bg: "#fef3c7", text: "#92400e", border: "#fbbf24" },
  Evento:  { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  General: { bg: "var(--gris-superficie)", text: "var(--texto-secundario)", border: "var(--gris-borde)" },
};

const EMPTY_FORM: NoticiaInput = {
  titulo:    "",
  contenido: "",
  esGlobal:  false,
  empresaId: null,
  imagenUrl: null,
};

// ── HELPERS ────────────────────────────────────────────────────────────────────
function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function esNuevo(iso?: string | null): boolean {
  if (!iso) return false;
  const diff = Date.now() - new Date(iso).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

function estaExpirado(iso?: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

function ordenarComunicados(lista: Comunicado[], orden: string): Comunicado[] {
  const copia = [...lista];
  if (orden === "reciente") return copia.sort((a, b) => new Date(b.fechaPublicacion ?? b.comunicadoId).getTime() - new Date(a.fechaPublicacion ?? a.comunicadoId).getTime());
  if (orden === "antiguo")  return copia.sort((a, b) => new Date(a.fechaPublicacion ?? a.comunicadoId).getTime() - new Date(b.fechaPublicacion ?? b.comunicadoId).getTime());
  if (orden === "az")       return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  return copia;
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────────
export default function ComunicacionPage() {
  const { usuario } = useAuth();

  const esAdmin    = usuario?.codigoRol === "ROLE_ADMIN_EMPRESA";
  const esSuperAdmin = usuario?.codigoRol === "ROLE_ADMIN";

  const [seccion, setSeccion] = useState<"egm" | "empresa">("egm");

  // Comunicados EGM
  const [comunicados, setComunicados]               = useState<Comunicado[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);
  const [categoriaActiva, setCategoriaActiva]       = useState<"Todos" | CategoriaComunicado>("Todos");
  const [orden, setOrden]                           = useState("reciente");
  const [modalComunicado, setModalComunicado]       = useState<Comunicado | null>(null);

  // Anuncios empresa
  const [anuncios, setAnuncios]               = useState<Noticia[]>([]);
  const [loadingAnuncios, setLoadingAnuncios] = useState(true);
  const [showForm, setShowForm]               = useState(false);
  const [editando, setEditando]               = useState<Noticia | null>(null);
  const [form, setForm]                       = useState<NoticiaInput>(EMPTY_FORM);
  const [submitting, setSubmitting]           = useState(false);
  const [formError, setFormError]             = useState<string | null>(null);
  const [modalAnuncio, setModalAnuncio]       = useState<Noticia | null>(null);

  // ── CARGA ─────────────────────────────────────────────────────────────────────
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
      const activos = data.filter((c) => c.activo && !estaExpirado(c.fechaExpiracion));
      // Destacados primero, luego por fecha
      activos.sort((a, b) => {
        if (a.destacado && !b.destacado) return -1;
        if (!a.destacado && b.destacado) return 1;
        return new Date(b.fechaPublicacion ?? "").getTime() - new Date(a.fechaPublicacion ?? "").getTime();
      });
      setComunicados(activos);
    } catch {
      setComunicados([]);
    } finally {
      setLoadingComunicados(false);
    }
  }

  async function cargarAnuncios() {
    setLoadingAnuncios(true);
    try {
      const data = await getNoticias(usuario?.empresaId);
      setAnuncios(data.filter((n) => n.activo));
    } catch {
      setAnuncios([]);
    } finally {
      setLoadingAnuncios(false);
    }
  }

  // ── HANDLERS ANUNCIOS ─────────────────────────────────────────────────────────
  function abrirCrear() {
    setForm({ ...EMPTY_FORM, empresaId: usuario?.empresaId ?? null });
    setEditando(null);
    setShowForm(true);
    setFormError(null);
  }

  function abrirEditar(n: Noticia) {
    setForm({
      titulo:    n.titulo,
      contenido: n.contenido,
      esGlobal:  n.esGlobal,
      empresaId: n.empresaId,
      imagenUrl: n.imagenUrl ?? null,
    });
    setEditando(n);
    setShowForm(true);
    setFormError(null);
  }

  function cerrarForm() {
    setShowForm(false);
    setEditando(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      setFormError("El título y el contenido son obligatorios");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (editando) {
        await editarNoticia(editando.anuncioId, form);
      } else {
        await crearNoticia(form);
      }
      await cargarAnuncios();
      cerrarForm();
    } catch {
      setFormError("Error al guardar. Inténtalo de nuevo.");
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

  // ── DATOS FILTRADOS ───────────────────────────────────────────────────────────
  const comunicadosFiltrados = (() => {
    let lista = categoriaActiva === "Todos"
      ? comunicados
      : comunicados.filter((c) => c.categoria === categoriaActiva);
    // Destacados siempre primero dentro del filtro
    const dest  = lista.filter((c) => c.destacado);
    const resto = ordenarComunicados(lista.filter((c) => !c.destacado), orden);
    return [...dest, ...resto];
  })();

  const [destacado, ...restoComunicados] = comunicadosFiltrados;

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <DashboardHero
        prefijo="Centro de "
        titulo="Comunicación."
        imagenFondo="/background-comunicacion-empleado.jpg"
      />

      <div className="px-6 md:px-10 lg:px-16 pt-14 pb-16">
        {/* Pestañas */}
        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: "var(--gris-borde)" }}>
          <SeccionTab
            label="Noticias EGM"
            badge={comunicados.length}
            activo={seccion === "egm"}
            onClick={() => setSeccion("egm")}
          />
          {usuario?.empresaId && (
            <SeccionTab
              label={`Anuncios de ${usuario.nombreEmpresa ?? "tu empresa"}`}
              badge={anuncios.length}
              activo={seccion === "empresa"}
              onClick={() => setSeccion("empresa")}
            />
          )}
        </div>

        {/* ══ SECCIÓN EGM ═══════════════════════════════════════════════════════ */}
        {seccion === "egm" && (
          <>
            {/* Filtros */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium mr-1" style={{ color: "var(--texto-muted)" }}>
                  Categoría:
                </span>
                {(["Todos", ...CATEGORIAS] as const).map((cat) => {
                  const activo = categoriaActiva === cat;
                  const colores = cat !== "Todos" ? CATEGORIA_COLORS[cat] : null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoriaActiva(cat)}
                      className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        background:  activo ? (colores?.bg  ?? "var(--azul-egm)") : "var(--gris-superficie)",
                        color:       activo ? (colores?.text ?? "#fff")            : "var(--texto-secundario)",
                        border:      `1.5px solid ${activo ? (colores?.border ?? "var(--azul-egm)") : "var(--gris-borde)"}`,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "var(--texto-muted)" }}>Ordenar:</span>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ border: "1.5px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                >
                  <option value="reciente">Más reciente</option>
                  <option value="az">A–Z por título</option>
                  <option value="antiguo">Más antiguo</option>
                </select>
              </div>
            </div>

            {loadingComunicados ? (
              <Spinner />
            ) : comunicadosFiltrados.length === 0 ? (
              <EstadoVacio
                titulo={categoriaActiva === "Todos" ? "Sin comunicados publicados" : `Sin comunicados de tipo "${categoriaActiva}"`}
                descripcion={categoriaActiva === "Todos"
                  ? "Cuando EGM Atalayas publique comunicados aparecerán aquí."
                  : "Prueba con otra categoría o selecciona Todos."}
                icono={<IconMegaphone />}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Tarjeta destacada / primera */}
                {destacado && (
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer group"
                    style={{ minHeight: "420px" }}
                    onClick={() => setModalComunicado(destacado)}
                  >
                    {destacado.imagenUrl ? (
                      <img
                        src={destacado.imagenUrl}
                        alt={destacado.titulo}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1b3f7e 0%, #0d1b2e 100%)" }} />
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,20,40,0.92) 40%, rgba(10,20,40,0.1) 100%)" }} />
                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {destacado.destacado && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)" }}>
                            ★ Destacado
                          </span>
                        )}
                        {esNuevo(destacado.fechaPublicacion) && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(71,141,98,0.25)", color: "#3aad66", border: "1px solid rgba(71,141,98,0.4)" }}>
                            Nuevo
                          </span>
                        )}
                        {destacado.categoria && (
                          <BadgeCategoria categoria={destacado.categoria} dark />
                        )}
                        <div className="w-4 h-px ml-1" style={{ background: "rgba(255,255,255,0.4)" }} />
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {formatDate(destacado.fechaPublicacion)}
                        </span>
                      </div>
                      <h2 className="text-2xl font-semibold leading-snug mb-3 text-white">
                        {destacado.titulo}
                      </h2>
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.65)" }}>
                        {destacado.mensaje}
                      </p>
                      <div className="mt-4 flex items-center justify-end">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de resto */}
                <div className="flex flex-col gap-5">
                  {restoComunicados.map((c) => (
                    <div
                      key={c.comunicadoId}
                      className="flex gap-4 group cursor-pointer"
                      onClick={() => setModalComunicado(c)}
                    >
                      <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: "110px", height: "80px" }}>
                        {c.imagenUrl ? (
                          <img src={c.imagenUrl} alt={c.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1b3f7e 0%, #0d1b2e 100%)" }} />
                        )}
                      </div>
                      <div className="flex flex-col justify-center min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {c.destacado && (
                            <span className="text-[10px] font-semibold" style={{ color: "#f59e0b" }}>★</span>
                          )}
                          {esNuevo(c.fechaPublicacion) && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#e8f5ee", color: "#1a6b3a", border: "1px solid #9dcdb3" }}>
                              Nuevo
                            </span>
                          )}
                          {c.categoria && <BadgeCategoria categoria={c.categoria} />}
                          <span className="text-xs ml-auto" style={{ color: "var(--texto-muted)" }}>
                            {formatDate(c.fechaPublicacion)}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold leading-snug line-clamp-2 transition-opacity group-hover:opacity-70" style={{ color: "var(--texto-primario)" }}>
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
        )}

        {/* ══ SECCIÓN EMPRESA ═══════════════════════════════════════════════════ */}
        {seccion === "empresa" && usuario?.empresaId && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--texto-primario)" }}>
                  Anuncios de {usuario.nombreEmpresa ?? "tu empresa"}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
                  {esAdmin ? "Visibles solo para los empleados de tu empresa" : "Comunicados internos de tu empresa"}
                </p>
              </div>
              {esAdmin && (
                <button
                  onClick={abrirCrear}
                  className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  style={{ background: "var(--azul-egm)", color: "#fff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
                >
                  + Nuevo anuncio
                </button>
              )}
            </div>

            {/* Formulario inline (solo admin) */}
            {showForm && esAdmin && (
              <div className="rounded-xl p-6 mb-6" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
                    {editando ? "Editar anuncio" : "Nuevo anuncio"}
                  </h3>
                  <button onClick={cerrarForm} className="text-xl leading-none" style={{ color: "var(--texto-muted)" }}>×</button>
                </div>
                <div className="flex flex-col gap-4">
                  <FormField label="Título" required>
                    <input
                      type="text"
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      placeholder="Ej: Recordatorio reunión de equipo"
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                    />
                  </FormField>
                  <FormField label="Contenido" required>
                    <textarea
                      value={form.contenido}
                      onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                      placeholder="Escribe el contenido del anuncio..."
                      rows={4}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                    />
                  </FormField>
                  <FormField label="Imagen (URL opcional)">
                    <input
                      type="url"
                      value={form.imagenUrl ?? ""}
                      onChange={(e) => setForm({ ...form, imagenUrl: e.target.value || null })}
                      placeholder="https://..."
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                    />
                  </FormField>
                </div>
                {formError && <p className="text-sm mt-3" style={{ color: "var(--error)" }}>{formError}</p>}
                <div className="flex gap-2 justify-end pt-4 mt-2" style={{ borderTop: "1px solid var(--gris-superficie)" }}>
                  <button onClick={cerrarForm} className="text-sm px-4 py-2 rounded-lg" style={{ color: "var(--texto-secundario)" }}>
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
                    style={{ background: "var(--azul-egm)", color: "#fff" }}
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
                descripcion={
                  esAdmin
                    ? "Crea el primer anuncio para que tus empleados estén al día."
                    : "Tu empresa aún no ha publicado ningún anuncio."
                }
                icono={<IconMegaphone />}
                accion={esAdmin ? "Crear primer anuncio" : undefined}
                onAccion={esAdmin ? abrirCrear : undefined}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {anuncios.map((n) => (
                  <div
                    key={n.anuncioId}
                    className="rounded-xl overflow-hidden cursor-pointer group"
                    style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", borderLeft: "3px solid var(--verde-oliva)" }}
                    onClick={() => !showForm && setModalAnuncio(n)}
                  >
                    {/* Imagen si existe */}
                    {n.imagenUrl && (
                      <div className="w-full overflow-hidden" style={{ height: "160px" }}>
                        <img src={n.imagenUrl} alt={n.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    )}
                    <div className="px-6 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                              {usuario.nombreEmpresa ?? "Tu empresa"}
                            </span>
                            {esNuevo(n.creadoEn) && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#e8f5ee", color: "#1a6b3a", border: "1px solid #9dcdb3" }}>
                                Nuevo
                              </span>
                            )}
                            <span className="text-xs ml-auto" style={{ color: "var(--texto-muted)" }}>
                              {formatDate(n.creadoEn)}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold mb-1.5" style={{ color: "var(--texto-primario)" }}>{n.titulo}</h3>
                          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--texto-secundario)" }}>{n.contenido}</p>
                        </div>
                        {esAdmin && (
                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => abrirEditar(n)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDesactivar(n.anuncioId)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              style={{ color: "var(--error)", border: "1px solid var(--error-light)" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--error-light)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ MODAL COMUNICADO EGM ══════════════════════════════════════════════════ */}
      {modalComunicado && (
        <Modal onClose={() => setModalComunicado(null)}>
          {modalComunicado.imagenUrl && (
            <div className="w-full overflow-hidden rounded-t-2xl" style={{ height: "220px" }}>
              <img src={modalComunicado.imagenUrl} alt={modalComunicado.titulo} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {modalComunicado.destacado && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fbbf24" }}>★ Destacado</span>
              )}
              {esNuevo(modalComunicado.fechaPublicacion) && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#e8f5ee", color: "#1a6b3a", border: "1px solid #9dcdb3" }}>Nuevo</span>
              )}
              {modalComunicado.categoria && <BadgeCategoria categoria={modalComunicado.categoria} />}
              <span className="text-xs ml-auto" style={{ color: "var(--texto-muted)" }}>{formatDate(modalComunicado.fechaPublicacion)}</span>
            </div>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--texto-primario)" }}>{modalComunicado.titulo}</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texto-secundario)" }}>{modalComunicado.mensaje}</p>
          </div>
        </Modal>
      )}

      {/* ══ MODAL ANUNCIO EMPRESA ═════════════════════════════════════════════════ */}
      {modalAnuncio && (
        <Modal onClose={() => setModalAnuncio(null)}>
          {modalAnuncio.imagenUrl && (
            <div className="w-full overflow-hidden rounded-t-2xl" style={{ height: "200px" }}>
              <img src={modalAnuncio.imagenUrl} alt={modalAnuncio.titulo} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                {usuario?.nombreEmpresa ?? "Tu empresa"}
              </span>
              <span className="text-xs ml-auto" style={{ color: "var(--texto-muted)" }}>{formatDate(modalAnuncio.creadoEn)}</span>
            </div>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--texto-primario)" }}>{modalAnuncio.titulo}</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texto-secundario)" }}>{modalAnuncio.contenido}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── SUBCOMPONENTES ────────────────────────────────────────────────────────────

function SeccionTab({ label, badge, activo, onClick }: {
  label: string; badge: number; activo: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 pb-4 px-3 text-sm font-medium transition-colors"
      style={{ color: activo ? "var(--azul-egm)" : "var(--texto-muted)" }}
    >
      {label}
      {badge > 0 && (
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
          style={{
            background: activo ? "var(--azul-egm)" : "var(--gris-superficie)",
            color:      activo ? "#fff"             : "var(--texto-muted)",
          }}>
          {badge}
        </span>
      )}
      {activo && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-full" style={{ background: "var(--azul-egm)" }} />
      )}
    </button>
  );
}

function BadgeCategoria({ categoria, dark = false }: { categoria: string; dark?: boolean }) {
  const colores = CATEGORIA_COLORS[categoria] ?? CATEGORIA_COLORS.General;
  if (dark) {
    return (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
        style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.1)" }}>
        {categoria}
      </span>
    );
  }
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: colores.bg, color: colores.text, border: `1px solid ${colores.border}` }}>
      {categoria}
    </span>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "var(--blanco)", maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-base font-bold"
          style={{ background: "rgba(0,0,0,0.12)", color: "var(--texto-primario)" }}
        >
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
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
    </div>
  );
}

function EstadoVacio({ titulo, descripcion, icono, accion, onAccion }: {
  titulo: string; descripcion: string; icono: React.ReactNode; accion?: string; onAccion?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl"
      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
        {icono}
      </div>
      <p className="text-base font-medium mb-1" style={{ color: "var(--texto-primario)" }}>{titulo}</p>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: "var(--texto-muted)" }}>{descripcion}</p>
      {accion && onAccion && (
        <button onClick={onAccion} className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "var(--azul-egm)", color: "#fff" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
        >
          {accion}
        </button>
      )}
    </div>
  );
}

function IconMegaphone() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}
