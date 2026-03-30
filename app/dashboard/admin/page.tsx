"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { Noticia, NoticiaInput, TagNoticia } from "@/lib/types/noticias";
import { NAV_ROUTES } from "@/lib/routes";

const TAGS: TagNoticia[] = ["Evento", "Formación", "Ventajas", "Comunidad", "Institucional"];

const tagStyle: Record<string, string> = {
  Evento: "bg-blue-50 text-blue-600 border-blue-100",
  Comunidad: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Formación: "bg-indigo-50 text-indigo-600 border-indigo-100",
  Institucional: "bg-gray-100 text-gray-600 border-gray-200",
  Ventajas: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function AdminPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<NoticiaInput>({
    titulo: "",
    cuerpo: "",
    tag: "Evento",
    visible_invitados: false,
    empresa_id: null,
  });

  useEffect(() => {
    if (usuario?.empresaId) {
      setLoading(true);
      getNoticias(usuario.empresaId)
        .then(setNoticias)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [usuario?.empresaId]);

  const resetForm = () => {
    setForm({ titulo: "", cuerpo: "", tag: "Evento", visible_invitados: false, empresa_id: usuario?.empresaId ?? null });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.cuerpo.trim()) return;
    const payload = { ...form, empresa_id: usuario?.empresaId ?? null };

    try {
      setError("");
      setLoading(true);
      if (editingId) {
        await editarNoticia(editingId, payload);
      } else {
        await crearNoticia(payload);
      }

      const updated = await getNoticias(usuario?.empresaId);
      setNoticias(updated);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (n: Noticia) => {
    setForm({ titulo: n.titulo, cuerpo: n.cuerpo, tag: n.tag, visible_invitados: n.visible_invitados, empresa_id: n.empresa_id });
    setEditingId(n.anuncio_id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setError("");
      setLoading(true);
      await desactivarNoticia(id);
      const updated = await getNoticias(usuario?.empresaId);
      setNoticias(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <Header
        defaultActive="Administración"
        onNavChange={(item) => router.push(NAV_ROUTES[item])}
        logoEmpresa={usuario?.logoEmpresaUrl}
      />

      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Gestión de Anuncios</h1>
            <p className="text-sm text-gray-400 mt-1">Crea, edita o desactiva anuncios para tu empresa</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + Nuevo anuncio
          </button>
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              {editingId ? "Editar anuncio" : "Crear anuncio"}
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título del anuncio"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Contenido</label>
                <textarea
                  value={form.cuerpo}
                  onChange={(e) => setForm({ ...form, cuerpo: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Escribe el contenido del anuncio..."
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Categoría</label>
                  <select
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value as TagNoticia })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TAGS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input
                    type="checkbox"
                    id="visible_invitados"
                    checked={form.visible_invitados}
                    onChange={(e) => setForm({ ...form, visible_invitados: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="visible_invitados" className="text-xs text-gray-600">Visible para invitados</label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={resetForm}
                  className="text-xs font-medium text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? "Guardar cambios" : "Publicar anuncio"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de anuncios */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-5">Anuncios publicados</h2>
          {noticias.filter((n) => n.activo).length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No hay anuncios publicados todavía.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {noticias.filter((n) => n.activo).map((n) => (
                <div key={n.anuncio_id} className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagStyle[n.tag]}`}>
                        {n.tag}
                      </span>
                      {n.visible_invitados && (
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Público</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-800">{n.titulo}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.cuerpo}</p>
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(n.creado_en).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => handleEdit(n)}
                      className="text-[11px] text-blue-600 font-medium hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(n.anuncio_id)}
                      className="text-[11px] text-red-500 font-medium hover:underline"
                    >
                      Desactivar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
