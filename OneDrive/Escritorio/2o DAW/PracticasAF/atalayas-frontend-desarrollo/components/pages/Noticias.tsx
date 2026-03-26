"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getNoticias,
  crearNoticia,
  editarNoticia,
  desactivarNoticia,
} from "../../lib/api/noticias";
import type { Noticia, NoticiaInput, TagNoticia } from "../../lib/types/noticias";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const TAGS: TagNoticia[] = [
  "Evento",
  "Formación",
  "Ventajas",
  "Comunidad",
  "Institucional",
];

const tagColor: Record<TagNoticia, string> = {
  Evento: "bg-blue-50 text-blue-600 border-blue-100",
  Formación: "bg-indigo-50 text-indigo-600 border-indigo-100",
  Ventajas: "bg-amber-50 text-amber-700 border-amber-100",
  Comunidad: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Institucional: "bg-gray-100 text-gray-600 border-gray-200",
};

const EMPTY_FORM: NoticiaInput = {
  titulo: "",
  cuerpo: "",
  tag: "Institucional",
  visible_invitados: false,
  empresa_id: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NoticiasPage() {
  const { usuario } = useAuth();

  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Noticia | null>(null);
  const [form, setForm] = useState<NoticiaInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esAdminGeneral = usuario?.codigoRol === "ROLE_ADMIN";
  const esAdmin = esAdminGeneral || usuario?.codigoRol === "ROLE_ADMIN_EMPRESA";

  const router = useRouter();

  const NAV_ROUTES: Record<string, string> = {
    "Inicio": "/dashboard",
    "Onboarding": "/dashboard/onboarding",
    "Formación": "/dashboard/formacion",
    "Comunicación": "/dashboard/noticias",
    "Administración": "/dashboard/administracion",
  };

  // ── Carga inicial ──────────────────────────────────────────────────────────

  useEffect(() => {
    cargarNoticias();
  }, []);

  async function cargarNoticias() {
    setLoading(true);
    try {
      // Admin Empresa solo ve las suyas; Admin General ve todas
      const empresaId = esAdminGeneral ? undefined : (usuario as any)?.empresaId;
      const data = await getNoticias(empresaId);
      setNoticias(data.filter((n) => n.activo));
    } catch {
      setError("No se pudieron cargar las noticias.");
    } finally {
      setLoading(false);
    }
  }

  // ── Formulario ─────────────────────────────────────────────────────────────

  function abrirCrear() {
    setForm({
      ...EMPTY_FORM,
      empresa_id: esAdminGeneral ? null : (usuario as any)?.empresaId ?? null,
    });
    setEditando(null);
    setShowForm(true);
  }

  function abrirEditar(noticia: Noticia) {
    setForm({
      titulo: noticia.titulo,
      cuerpo: noticia.cuerpo,
      tag: noticia.tag,
      visible_invitados: noticia.visible_invitados,
      empresa_id: noticia.empresa_id,
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
    if (!form.titulo.trim() || !form.cuerpo.trim()) {
      setError("El título y el cuerpo son obligatorios.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editando) {
        await editarNoticia(editando.anuncio_id, form);
      } else {
        await crearNoticia(form);
      }
      await cargarNoticias();
      cerrarForm();
    } catch {
      setError("Error al guardar la noticia. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDesactivar(id: number) {
    if (!confirm("¿Seguro que quieres eliminar esta noticia?")) return;
    try {
      await desactivarNoticia(id);
      await cargarNoticias();
    } catch {
      setError("Error al eliminar la noticia.");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Header de página */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Noticias y comunicados
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {esAdminGeneral
                ? "Todos los comunicados del parque empresarial"
                : `Comunicados de ${usuario?.nombreEmpresa ?? "tu empresa"}`}
            </p>
          </div>
          {esAdmin && (
            <button
              onClick={abrirCrear}
              className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              + Nueva noticia
            </button>
          )}
        </div>

        {/* Error global */}
        {error && !showForm && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ── Formulario (crear / editar) ── */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-800">
                {editando ? "Editar noticia" : "Nueva noticia"}
              </h2>
              <button
                onClick={cerrarForm}
                className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Título */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Jornada de puertas abiertas"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              {/* Cuerpo */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Descripción <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.cuerpo}
                  onChange={(e) => setForm({ ...form, cuerpo: e.target.value })}
                  placeholder="Escribe el contenido del comunicado..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                />
              </div>

              {/* Tag */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Categoría
                </label>
                <select
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value as TagNoticia })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors bg-white"
                >
                  {TAGS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Visible para invitados */}
              <div className="flex items-center gap-3 pt-5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, visible_invitados: !form.visible_invitados })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${form.visible_invitados ? "bg-gray-900" : "bg-gray-200"
                    }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form.visible_invitados ? "left-4.5" : "left-0.5"
                      }`}
                  />
                </button>
                <label className="text-xs text-gray-600">
                  Visible para invitados (sin sesión)
                </label>
              </div>
            </div>

            {/* Error formulario */}
            {error && (
              <p className="text-xs text-red-500 mb-3">{error}</p>
            )}

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50">
              <button
                onClick={cerrarForm}
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gray-900 text-white text-xs font-medium px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {submitting
                  ? "Guardando..."
                  : editando
                    ? "Guardar cambios"
                    : "Publicar noticia"}
              </button>
            </div>
          </div>
        )}

        {/* ── Lista de noticias ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">Cargando noticias...</p>
          </div>
        ) : noticias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
            <p className="text-sm font-medium text-gray-400">No hay noticias publicadas</p>
            {esAdmin && (
              <button
                onClick={abrirCrear}
                className="mt-3 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Crea la primera →
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {noticias.map((n) => (
              <div
                key={n.anuncio_id}
                className="bg-white rounded-xl border border-gray-100 px-6 py-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Meta */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagColor[n.tag]}`}
                      >
                        {n.tag}
                      </span>
                      {n.visible_invitados && (
                        <span className="text-[10px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
                          Visible para invitados
                        </span>
                      )}
                      {esAdminGeneral && n.empresa_id && (
                        <span className="text-[10px] text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
                          Empresa #{n.empresa_id}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400 ml-auto">
                        {formatDate(n.creado_en)}
                      </span>
                    </div>

                    {/* Contenido */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {n.titulo}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {n.cuerpo}
                    </p>
                  </div>

                  {/* Acciones (solo admins) */}
                  {esAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => abrirEditar(n)}
                        className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDesactivar(n.anuncio_id)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
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
    </main>
  );
}