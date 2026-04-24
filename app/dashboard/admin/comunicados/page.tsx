"use client";

import { useState, useEffect } from "react";

const GRAD_BTN = "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)";
import DashboardHero from "@/components/ui/DashboardHero";
import {
  getComunicados,
  crearComunicado,
  editarComunicado,
  desactivarComunicado,
} from "@/lib/api/noticias";
import type { Comunicado, ComunicadoInput, CategoriaComunicado } from "@/lib/types/noticias";

// ── CONSTANTES ─────────────────────────────────────────────────────────────────
const CATEGORIAS: CategoriaComunicado[] = ["Novedad", "Aviso", "Evento", "General"];

const CATEGORIA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Novedad: { bg: "#e8f5ee", text: "#1a6b3a", border: "#9dcdb3" },
  Aviso:   { bg: "#fef3c7", text: "#92400e", border: "#fbbf24" },
  Evento:  { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  General: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

const EMPTY_FORM: ComunicadoInput = {
  titulo:           "",
  mensaje:          "",
  imagenUrl:        null,
  categoria:        "General",
  destacado:        false,
  fechaPublicacion: null,
  fechaExpiracion:  null,
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function toInputDate(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ── COMPONENTE ─────────────────────────────────────────────────────────────────
export default function ComunicadosAdminPage() {
  const [comunicados, setComunicados]     = useState<Comunicado[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [editando, setEditando]           = useState<Comunicado | null>(null);
  const [form, setForm]                   = useState<ComunicadoInput>(EMPTY_FORM);
  const [submitting, setSubmitting]       = useState(false);
  const [formError, setFormError]         = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado]   = useState<"todos" | "activos" | "expirados">("activos");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await getComunicados();
      data.sort((a, b) => new Date(b.fechaPublicacion ?? "").getTime() - new Date(a.fechaPublicacion ?? "").getTime());
      setComunicados(data);
    } catch {
      setComunicados([]);
    } finally {
      setLoading(false);
    }
  }

  function abrirCrear() {
    setForm({ ...EMPTY_FORM, fechaPublicacion: new Date().toISOString().slice(0, 10) });
    setEditando(null);
    setShowForm(true);
    setFormError(null);
  }

  function abrirEditar(c: Comunicado) {
    setForm({
      titulo:           c.titulo,
      mensaje:          c.mensaje,
      imagenUrl:        c.imagenUrl ?? null,
      categoria:        (c.categoria as CategoriaComunicado) ?? "General",
      destacado:        c.destacado,
      fechaPublicacion: toInputDate(c.fechaPublicacion),
      fechaExpiracion:  toInputDate(c.fechaExpiracion),
    });
    setEditando(c);
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
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      setFormError("El título y el mensaje son obligatorios.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: ComunicadoInput = {
        ...form,
        imagenUrl:        form.imagenUrl?.trim() || null,
        fechaPublicacion: form.fechaPublicacion || null,
        fechaExpiracion:  form.fechaExpiracion  || null,
      };
      if (editando) {
        await editarComunicado(editando.comunicadoId, payload);
      } else {
        await crearComunicado(payload);
      }
      await cargar();
      cerrarForm();
    } catch {
      setFormError("Error al guardar. Comprueba la conexión e inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDesactivar(id: string) {
    if (!confirm("¿Desactivar este comunicado? Dejará de ser visible para los usuarios.")) return;
    try {
      await desactivarComunicado(id);
      await cargar();
    } catch {}
  }

  // Filtrado
  const ahora = Date.now();
  const lista = comunicados.filter((c) => {
    if (filtroEstado === "activos")   return c.activo && (!c.fechaExpiracion || new Date(c.fechaExpiracion).getTime() > ahora);
    if (filtroEstado === "expirados") return !c.activo || (!!c.fechaExpiracion && new Date(c.fechaExpiracion).getTime() <= ahora);
    return true;
  });

  return (
    <>
      <DashboardHero prefijo="Panel de " titulo="Comunicados." imagenFondo="/background-comunicacion-empleado.jpg" />

      <div className="px-6 md:px-10 lg:px-16 pt-10 pb-16">

        {/* Cabecera con acciones */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--texto-primario)" }}>Comunicados EGM</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
              Visibles para todos los usuarios de la plataforma
            </p>
          </div>
          <button
            onClick={abrirCrear}
            className="text-sm font-semibold px-4 py-2.5 rounded-lg"
            style={{ background: GRAD_BTN, color: "#fff" }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
          >
            + Nuevo comunicado
          </button>
        </div>

        {/* Filtro estado */}
        <div className="flex gap-2 mb-6">
          {(["activos", "expirados", "todos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className="px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all"
              style={{
                background: filtroEstado === f ? GRAD_BTN : "var(--gris-superficie)",
                color:      filtroEstado === f ? "#fff"   : "var(--texto-secundario)",
                border:     `1.5px solid ${filtroEstado === f ? "transparent" : "var(--gris-borde)"}`,
                boxShadow:  filtroEstado === f ? "0 2px 8px rgba(37,99,235,0.22)" : "none",
              }}
            >
              {f === "activos" ? "Activos" : f === "expirados" ? "Expirados / Inactivos" : "Todos"}
            </button>
          ))}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="rounded-xl p-6 mb-6" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: "var(--texto-primario)" }}>
                {editando ? "Editar comunicado" : "Nuevo comunicado"}
              </h2>
              <button onClick={cerrarForm} className="text-xl leading-none" style={{ color: "var(--texto-muted)" }}>×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="md:col-span-2">
                <FormField label="Título" required>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Apertura del nuevo espacio de coworking"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                  />
                </FormField>
              </div>

              {/* Mensaje */}
              <div className="md:col-span-2">
                <FormField label="Mensaje" required>
                  <textarea
                    value={form.mensaje}
                    onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                    placeholder="Escribe el contenido completo del comunicado..."
                    rows={5}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                  />
                </FormField>
              </div>

              {/* URL imagen */}
              <div className="md:col-span-2">
                <FormField label="Imagen (URL, opcional)">
                  <input
                    type="url"
                    value={form.imagenUrl ?? ""}
                    onChange={(e) => setForm({ ...form, imagenUrl: e.target.value || null })}
                    placeholder="https://..."
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                  />
                  {form.imagenUrl && (
                    <img src={form.imagenUrl} alt="preview" className="mt-2 rounded-lg object-cover" style={{ height: "120px", width: "100%", objectFit: "cover" }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                </FormField>
              </div>

              {/* Categoría */}
              <FormField label="Categoría">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIAS.map((cat) => {
                    const activo = form.categoria === cat;
                    const col = CATEGORIA_COLORS[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({ ...form, categoria: cat })}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: activo ? col.bg    : "var(--gris-superficie)",
                          color:      activo ? col.text  : "var(--texto-secundario)",
                          border:     `1.5px solid ${activo ? col.border : "var(--gris-borde)"}`,
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              {/* Destacado */}
              <FormField label="Opciones">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.destacado}
                    onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "var(--azul-egm)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--texto-secundario)" }}>
                    ★ Marcar como destacado (aparece siempre arriba)
                  </span>
                </label>
              </FormField>

              {/* Fecha publicación */}
              <FormField label="Fecha de publicación">
                <input
                  type="date"
                  value={form.fechaPublicacion ?? ""}
                  onChange={(e) => setForm({ ...form, fechaPublicacion: e.target.value || null })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                />
              </FormField>

              {/* Fecha expiración */}
              <FormField label="Fecha de expiración (opcional)">
                <input
                  type="date"
                  value={form.fechaExpiracion ?? ""}
                  onChange={(e) => setForm({ ...form, fechaExpiracion: e.target.value || null })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>
                  Tras esta fecha el comunicado deja de mostrarse automáticamente.
                </p>
              </FormField>
            </div>

            {formError && (
              <p className="text-sm mt-4" style={{ color: "var(--error)" }}>{formError}</p>
            )}

            <div className="flex gap-2 justify-end pt-4 mt-4" style={{ borderTop: "1px solid var(--gris-superficie)" }}>
              <button onClick={cerrarForm} className="text-sm px-4 py-2 rounded-lg" style={{ color: "var(--texto-secundario)" }}>
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
                style={{ background: GRAD_BTN, color: "#fff" }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                {submitting ? "Guardando..." : editando ? "Guardar cambios" : "Publicar comunicado"}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <Spinner />
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl text-center"
            style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <p className="text-base font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
              {filtroEstado === "activos" ? "No hay comunicados activos" : "No hay comunicados en este filtro"}
            </p>
            <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
              {filtroEstado === "activos" ? "Crea el primer comunicado para que aparezca en la plataforma." : "Prueba con otro filtro."}
            </p>
            {filtroEstado === "activos" && (
              <button onClick={abrirCrear} className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: GRAD_BTN, color: "#fff" }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                Crear primer comunicado
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {lista.map((c) => {
              const expirado = c.fechaExpiracion && new Date(c.fechaExpiracion).getTime() <= ahora;
              const col = CATEGORIA_COLORS[c.categoria ?? "General"] ?? CATEGORIA_COLORS.General;
              return (
                <div
                  key={c.comunicadoId}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background:  "var(--blanco)",
                    border:      "1px solid var(--gris-borde)",
                    borderLeft:  `3px solid ${!c.activo || expirado ? "var(--gris-borde)" : "var(--azul-egm)"}`,
                    opacity:     !c.activo || expirado ? 0.65 : 1,
                  }}
                >
                  {c.imagenUrl && (
                    <div style={{ height: "120px", overflow: "hidden" }}>
                      <img src={c.imagenUrl} alt={c.titulo} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {c.destacado && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fbbf24" }}>★ Destacado</span>
                          )}
                          {c.categoria && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                              {c.categoria}
                            </span>
                          )}
                          {(!c.activo || expirado) && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>
                              {!c.activo ? "Inactivo" : "Expirado"}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--texto-primario)" }}>{c.titulo}</h3>
                        <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: "var(--texto-muted)" }}>{c.mensaje}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                            Publicado: {formatDate(c.fechaPublicacion)}
                          </span>
                          {c.fechaExpiracion && (
                            <span className="text-xs" style={{ color: expirado ? "var(--error)" : "var(--texto-muted)" }}>
                              Expira: {formatDate(c.fechaExpiracion)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => abrirEditar(c)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          Editar
                        </button>
                        {c.activo && !expirado && (
                          <button
                            onClick={() => handleDesactivar(c.comunicadoId)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: "var(--error)", border: "1px solid var(--error-light)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--error-light)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
    </div>
  );
}
