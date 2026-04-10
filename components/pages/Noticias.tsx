"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "../../lib/api/noticias";
import { apiFetch, API_URL } from "@/lib/api";
import type { Noticia, NoticiaInput } from "../../lib/types/noticias";

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface Comunicado {
  comunicadoId:     string;
  titulo:           string;
  mensaje:          string;
  fechaPublicacion: string;
  activo:           boolean;
  imagenUrl?:       string | null;
}

const EMPTY_FORM: NoticiaInput = {
  titulo:    "",
  mensaje:   "",
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
    <>
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--texto-primario)" }}>
          Comunicación
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          Comunicados del parque y anuncios de tu empresa
        </p>
      </div>

      {/* Selector de sección */}
      <div className="flex gap-1 mb-8" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
        <SeccionTab
          label="Comunicados EGM"
          badge={comunicados.length}
          activo={seccion === "egm"}
          onClick={() => setSeccion("egm")}
        />
        {esAdmin && (
          <SeccionTab
            label="Anuncios de tu empresa"
            badge={anuncios.length}
            activo={seccion === "empresa"}
            onClick={() => setSeccion("empresa")}
          />
        )}
      </div>

      {/* ── SECCIÓN COMUNICADOS EGM ── */}
      {seccion === "egm" && (
        <>
          {/* Descripción */}
          <div
            className="flex items-start gap-3 rounded-xl px-5 py-4 mb-6"
            style={{
              background: "var(--azul-egm-light)",
              borderLeft: "3px solid var(--azul-egm)",
              border:     "1px solid rgba(27,63,126,0.15)",
            }}
          >       
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2} style={{ color: "var(--azul-egm)" }}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "var(--azul-egm)" }}>
              Comunicados oficiales publicados por EGM Atalayas Ciudad Empresarial para todas las empresas del parque.
            </p>
          </div>

          {loadingComunicados ? (
            <Spinner />
          ) : comunicados.length === 0 ? (
            <EstadoVacio
              titulo="Sin comunicados por ahora"
              descripcion="EGM Atalayas publicará aquí avisos oficiales, eventos y novedades del parque empresarial."
              icono={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {comunicados.map((c) => (
                <div
                  key={c.comunicadoId}
                  className="rounded-xl px-6 py-5"
                  style={{
                    background:  "var(--blanco)",
                    border:      "1px solid var(--gris-borde)",
                    borderLeft:  "3px solid var(--azul-egm)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                          style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                        >
                          EGM Atalayas
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--texto-muted)" }}>
                          {formatDate(c.fechaPublicacion)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold mb-1.5" style={{ color: "var(--texto-primario)" }}>
                        {c.titulo}
                      </h3>
                      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--texto-secundario)" }}>
                        {c.mensaje}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SECCIÓN ANUNCIOS EMPRESA ── */}
      {seccion === "empresa" && esAdmin && (
        <>
          {/* Cabecera sección */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
                Anuncios de {usuario?.nombreEmpresa ?? "tu empresa"}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                Visibles solo para los empleados de tu empresa
              </p>
            </div>
            <button
              onClick={abrirCrear}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
                <h3 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                  {editando ? "Editar anuncio" : "Nuevo anuncio"}
                </h3>
                <button onClick={cerrarForm} className="text-lg leading-none"
                  style={{ color: "var(--texto-muted)" }}>×</button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--texto-secundario)" }}>
                    Título <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Recordatorio reunión de equipo"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--texto-secundario)" }}>
                    Contenido <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <textarea
                    value={form.contenido}
                    onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                    placeholder="Escribe el contenido del anuncio..."
                    rows={4}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                  />
                </div>
              </div>
              {error && <p className="text-xs mt-3" style={{ color: "var(--error)" }}>{error}</p>}
              <div className="flex gap-2 justify-end pt-4 mt-2"
                style={{ borderTop: "1px solid var(--gris-superficie)" }}>
                <button onClick={cerrarForm} className="text-sm px-4 py-2 rounded-lg"
                  style={{ color: "var(--texto-secundario)" }}>
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-50 transition-colors"
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
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}
                        >
                          {usuario?.nombreEmpresa ?? "Tu empresa"}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--texto-muted)" }}>
                          {formatDate(n.creadoEn)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold mb-1.5" style={{ color: "var(--texto-primario)" }}>
                        {n.titulo}
                      </h3>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--texto-secundario)" }}>
                        {n.contenido}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
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
      className="relative flex items-center gap-2 pb-4 px-3 text-sm font-medium transition-colors"
      style={{ color: activo ? "var(--azul-egm)" : "var(--texto-muted)" }}
    >
      {label}
      {badge > 0 && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
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
      <p className="text-sm font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
        {titulo}
      </p>
      <p className="text-xs max-w-xs leading-relaxed" style={{ color: "var(--texto-muted)" }}>
        {descripcion}
      </p>
      {accion && onAccion && (
        <button
          onClick={onAccion}
          className="mt-4 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
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