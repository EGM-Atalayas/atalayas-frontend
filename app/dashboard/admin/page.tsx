"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { Noticia, NoticiaInput } from "@/lib/types/noticias";
import { NAV_ROUTES } from "@/lib/routes";

export default function AdminPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<NoticiaInput>({
    titulo: "",
    contenido: "",
    es_global: false,
    empresa_id: null,
  });

  useEffect(() => {
    if (usuario) {
      cargarAnuncios();
    }
  }, [usuario?.empresaId]);

  async function cargarAnuncios() {
    setLoading(true);
    try {
      const data = await getNoticias(usuario?.empresaId);
      setNoticias(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setForm({ titulo: "", contenido: "", es_global: false, empresa_id: usuario?.empresaId ?? null });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSaveAnuncio = async () => {
    if (!form.titulo.trim() || !form.contenido.trim()) return;
    const payload: NoticiaInput = { ...form, empresa_id: usuario?.empresaId ?? null };

    try {
      setError("");
      setLoading(true);
      if (editingId) {
        await editarNoticia(editingId, payload);
      } else {
        await crearNoticia(payload);
      }
      await cargarAnuncios();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (n: Noticia) => {
    setForm({ titulo: n.titulo, contenido: n.contenido, es_global: n.es_global, empresa_id: n.empresa_id });
    setEditingId(n.anuncio_id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setError("");
      setLoading(true);
      await desactivarNoticia(id);
      await cargarAnuncios();
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
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Escribe el contenido del anuncio..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="es_global"
                  checked={form.es_global}
                  onChange={(e) => setForm({ ...form, es_global: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="es_global" className="text-xs text-gray-600">Visible para todos (anuncio global)</label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={resetForm}
                  className="text-xs font-medium text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAnuncio}
                  disabled={loading}
                  className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-8">Cargando...</p>
          ) : noticias.filter((n) => n.activo).length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No hay anuncios publicados todavía.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {noticias.filter((n) => n.activo).map((n) => (
                <div key={n.anuncio_id} className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {n.es_global && (
                        <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">Global</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-800">{n.titulo}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.contenido}</p>
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
