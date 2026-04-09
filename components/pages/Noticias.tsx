"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "../../lib/api/noticias";
import type { Noticia, NoticiaInput } from "../../lib/types/noticias";

// ── CONSTANTES ────────────────────────────────────────────────────────────────
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
export default function NoticiasPage() {
  const { usuario } = useAuth();

  const [noticias, setNoticias]   = useState<Noticia[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editando, setEditando]   = useState<Noticia | null>(null);
  const [form, setForm]           = useState<NoticiaInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const esAdminGeneral = usuario?.codigoRol === "ROLE_ADMIN";
  const esAdmin        = esAdminGeneral || usuario?.codigoRol === "ROLE_ADMIN_EMPRESA";

  useEffect(() => {
    cargarNoticias();
  }, []);

  async function cargarNoticias() {
    setLoading(true);
    try {
      const empresaId = esAdminGeneral ? undefined : usuario?.empresaId;
      const data      = await getNoticias(empresaId);
      setNoticias(data.filter((n) => n.activo));
    } catch {
      setError("No se pudieron cargar las noticias");
    } finally {
      setLoading(false);
    }
  }

  function abrirCrear() {
    setForm({ ...EMPTY_FORM, empresaId: esAdminGeneral ? null : usuario?.empresaId ?? null });
    setEditando(null);
    setShowForm(true);
  }

  function abrirEditar(noticia: Noticia) {
    setForm({
      titulo:    noticia.titulo,
      mensaje:   noticia.mensaje,
      esGlobal:  noticia.esGlobal,
      empresaId: noticia.empresaId,
    });
    setEditando(noticia);
    setShowForm(true);
  }

  function cerrarForm() {
    setShowForm(false);
    setEditando(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit() {
    if (!form.titulo.trim() || !form.mensaje.trim()) {
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
      await cargarNoticias();
      cerrarForm();
    } catch {
      setError("Error al guardar la noticia. Inténtalo de nuevo");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDesactivar(id: string) {
    if (!confirm("¿Seguro que quieres eliminar esta noticia?")) return;
    try {
      await desactivarNoticia(id);
      await cargarNoticias();
    } catch {
      setError("Error al eliminar la noticia.");
    }
  }

  return (
    <>
      {/* Cabecera */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--texto-primario)" }}
          >
            Comunicación
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
            {esAdminGeneral
              ? "Todos los comunicados del parque empresarial"
              : `Comunicados de ${usuario?.nombreEmpresa ?? "tu empresa"}`}
          </p>
        </div>
        {esAdmin && (
          <button
            onClick={abrirCrear}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
          >
            + Nuevo anuncio
          </button>
        )}
      </div>

      {/* Error global */}
      {error && !showForm && (
        <div
          className="mb-6 text-xs px-4 py-3 rounded-lg"
          style={{
            background: "var(--error-light)",
            border:     "1px solid var(--error)",
            color:      "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div
          className="rounded-xl p-6 mb-8"
          style={{
            background: "var(--blanco)",
            border:     "1px solid var(--gris-borde)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
              {editando ? "Editar noticia" : "Nueva noticia"}
            </h2>
            <button
              onClick={cerrarForm}
              className="text-lg leading-none"
              style={{ color: "var(--texto-muted)" }}
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                Título <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Jornada de puertas abiertas"
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                style={{
                  border:     "1px solid var(--gris-borde)",
                  background: "var(--blanco)",
                  color:      "var(--texto-primario)",
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                Descripción <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <textarea
                value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                placeholder="Escribe el contenido del comunicado..."
                rows={4}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none transition-colors"
                style={{
                  border:     "1px solid var(--gris-borde)",
                  background: "var(--blanco)",
                  color:      "var(--texto-primario)",
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, esGlobal: !form.esGlobal })}
                className="relative w-9 h-5 rounded-full transition-colors"
                style={{ background: form.esGlobal ? "var(--azul-egm)" : "var(--gris-superficie)" }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                  style={{ left: form.esGlobal ? "calc(100% - 18px)" : "2px" }}
                />
              </button>
              <label className="text-xs" style={{ color: "var(--texto-secundario)" }}>
                Visible para todos (anuncio global)
              </label>
            </div>
          </div>

          {error && (
            <p className="text-xs mt-3" style={{ color: "var(--error)" }}>
              {error}
            </p>
          )}

          <div
            className="flex items-center justify-end gap-3 pt-4 mt-4"
            style={{ borderTop: "1px solid var(--gris-superficie)" }}
          >
            <button
              onClick={cerrarForm}
              className="text-sm px-3 py-1.5 transition-colors"
              style={{ color: "var(--texto-secundario)" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
            >
              {submitting ? "Guardando..." : editando ? "Guardar cambios" : "Publicar noticia"}
            </button>
          </div>
        </div>
      )}

      {/* Estado cargando */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{
              borderColor:    "var(--gris-borde)",
              borderTopColor: "var(--azul-egm)",
            }}
          />
        </div>
      )}

      {/* Estado vacío */}
      {!loading && noticias.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{
            background: "var(--blanco)",
            border:     "1px solid var(--gris-borde)",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--texto-muted)" }}>
            No hay noticias publicadas
          </p>
          {esAdmin && (
            <button
              onClick={abrirCrear}
              className="mt-3 text-xs font-medium hover:underline"
              style={{ color: "var(--azul-egm)" }}
            >
              Crea la primera →
            </button>
          )}
        </div>
      )}

      {/* Lista de noticias */}
      {!loading && noticias.length > 0 && (
        <div className="flex flex-col gap-4">
          {noticias.map((n) => (
            <div
              key={n.anuncioId}
              className="rounded-xl px-6 py-4 transition-colors"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gris-superficie)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {n.esGlobal && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--azul-egm-light)",
                          color:      "var(--azul-egm)",
                        }}
                      >
                        EGM Atalayas
                      </span>
                    )}
                    {!n.esGlobal && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--verde-oliva-light)",
                          color:      "var(--verde-oliva)",
                        }}
                      >
                        Tu empresa
                      </span>
                    )}
                    {esAdminGeneral && n.empresaId && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--gris-superficie)",
                          color:      "var(--texto-muted)",
                          border:     "1px solid var(--gris-borde)",
                        }}
                      >
                        Empresa #{n.empresaId.slice(0, 8)}
                      </span>
                    )}
                    <span
                      className="text-[11px] ml-auto"
                      style={{ color: "var(--texto-muted)" }}
                    >
                      {formatDate(n.creadoEn)}
                    </span>
                  </div>
                  <h3
                    className="text-sm font-semibold mb-1 truncate"
                    style={{ color: "var(--texto-primario)" }}
                  >
                    {n.titulo}
                  </h3>
                  <p
                    className="text-xs leading-relaxed line-clamp-2"
                    style={{ color: "var(--texto-secundario)" }}
                  >
                    {n.mensaje}
                  </p>
                </div>

                {esAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => abrirEditar(n)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        color:      "var(--texto-secundario)",
                        border:     "1px solid var(--gris-borde)",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDesactivar(n.anuncioId)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        color:      "var(--error)",
                        border:     "1px solid var(--error-light)",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--error-light)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}