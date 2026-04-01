"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import ModuloForm from "@/components/ModuloForm";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { NAV_ROUTES } from "@/lib/routes";


// ── CONSTANTES ────────────────────────────────────────────────────────────────
const EMPTY_ANUNCIO: NoticiaInput = {
  titulo: "",
  mensaje: "",
  esGlobal: false,
  empresaId: null,
};


// ── ROOT CON SUSPENSE (necesario por useSearchParams) ─────────────────────────
export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center"><p className="text-sm text-gray-400">Cargando panel...</p></div>}>
      <AdminContent />
    </Suspense>
  );
}


// ── CONTENIDO PRINCIPAL ───────────────────────────────────────────────────────
function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<"anuncios" | "formaciones">("anuncios");

  // ── ESTADOS ANUNCIOS ──────────────────────────────────────────────────────
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [showFormAnuncio, setShowFormAnuncio] = useState(false);
  const [editingAnuncioId, setEditingAnuncioId] = useState<string | null>(null);
  const [formAnuncio, setFormAnuncio] = useState<NoticiaInput>(EMPTY_ANUNCIO);

  // ── ESTADOS MÓDULOS ───────────────────────────────────────────────────────
  const [formaciones, setFormaciones] = useState<ModuloConProgreso[]>([]);
  const [showFormModulo, setShowFormModulo] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloConProgreso | null>(null);

  // ── DATA ──────────────────────────────────────────────────────────────────

  const refreshData = async () => {
    if (!usuario?.empresaId) return;
    const [news, modulos] = await Promise.all([
      getNoticias(usuario.empresaId),
      getModulosConProgreso(),
    ]);
    setNoticias(news);
    setFormaciones(modulos);
  };

  // ── EFFECTS ───────────────────────────────────────────────────────────────

  // Protección de ruta - empleados e invitados no acceden
  useEffect(() => {
    if (
      usuario &&
      (usuario.codigoRol === "ROLE_EMPLEADO" || usuario.codigoRol === "INVITADO")
    ) {
      router.replace("/dashboard");
    }
  }, [usuario, router]);

  // Carga inicial de datos
  useEffect(() => {
    if (usuario?.empresaId) {
      refreshData();
    }
  }, [usuario?.empresaId]);

  // Query params - tab y edición desde URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "formaciones") setActiveTab("formaciones");

    const editId = searchParams.get("edit");
    if (editId && formaciones.length > 0) {
      const f = formaciones.find((x) => x.moduloId === editId);
      if (f) {
        setEditingModulo(f);
        setShowFormModulo(true);
      }
    }
  }, [searchParams, formaciones]);

  // ── HANDLERS ANUNCIO ─────────────────────────────────────────────────────

  const resetFormAnuncio = () => {
    setFormAnuncio({ ...EMPTY_ANUNCIO, empresaId: usuario?.empresaId ?? null });
    setEditingAnuncioId(null);
    setShowFormAnuncio(false);
  };

  const handleSaveAnuncio = async () => {
    if (!formAnuncio.titulo.trim() || !formAnuncio.mensaje.trim()) return;
    try {
      if (editingAnuncioId) {
        await editarNoticia(editingAnuncioId, formAnuncio);
      } else {
        await crearNoticia({ ...formAnuncio, empresaId: usuario?.empresaId ?? null });
      }
      await refreshData();
      resetFormAnuncio();
    } catch {
      console.error("Error al guardar anuncio");
    }
  };

  const handleEditAnuncio = (n: Noticia) => {
    setFormAnuncio({
      titulo: n.titulo,
      mensaje: n.mensaje,
      esGlobal: n.esGlobal,
      empresaId: n.empresaId,
    });
    setEditingAnuncioId(n.anuncioId);
    setShowFormAnuncio(true);
  };

  const handleDeleteAnuncio = async (id: string) => {
    try {
      await desactivarNoticia(id);
      await refreshData();
    } catch {
      console.error("Error al desactivar anuncio");
    }
  };

  // ── HANDLERS MÓDULOS ──────────────────────────────────────────────────────

  const resetFormModulo = () => {
    setEditingModulo(null);
    setShowFormModulo(false);
  };

  const handleEditModulo = (f: ModuloConProgreso) => {
    setEditingModulo(f);
    setShowFormModulo(true);
  };

  const handleDeleteModulo = async (moduloId: string) => {
    try {
      const { apiFetch } = await import("@/lib/api");
      const { API_URL } = await import("@/lib/api");
      await apiFetch(`${API_URL}/modulos/${moduloId}/desactivar`, { method: "PATCH" });
      await refreshData();
    } catch {
      console.error("Error al desactivar módulo");
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <Header
        defaultActive="Administración"
        onNavChange={(item) => router.push(NAV_ROUTES[item])}
        logoEmpresa={usuario?.logoEmpresaUrl}
      />

      <main className="max-w-5xl mx-auto px-8 py-10">

        {/* Tabs */}
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          {(["anuncios", "formaciones"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-semibold transition-colors relative capitalize ${
                activeTab === tab ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "anuncios" ? "Anuncios" : "Módulos formativos"}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* ── ANUNCIOS ── */}
        {activeTab === "anuncios" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  Gestión de Anuncios
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Comunica novedades a todos los empleados
                </p>
              </div>
              <button
                onClick={() => { resetFormAnuncio(); setShowFormAnuncio(true); }}
                className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                + Nuevo anuncio
              </button>
            </div>

            {/* Formulario anuncio */}
            {showFormAnuncio && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">
                  {editingAnuncioId ? "Editar anuncio" : "Crear anuncio"}
                </h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Título</label>
                    <input
                      type="text"
                      value={formAnuncio.titulo}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, titulo: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Título del anuncio"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Contenido</label>
                    <textarea
                      value={formAnuncio.mensaje}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, mensaje: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Escribe el contenido del anuncio..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormAnuncio({ ...formAnuncio, esGlobal: !formAnuncio.esGlobal })}
                      className={`relative w-9 h-5 rounded-full transition-colors ${formAnuncio.esGlobal ? "bg-gray-900" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${formAnuncio.esGlobal ? "left-4" : "left-0.5"}`} />
                    </button>
                    <label className="text-xs text-gray-600">Visible para todos (global)</label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={resetFormAnuncio}
                      className="text-xs font-medium text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveAnuncio}
                      className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingAnuncioId ? "Guardar cambios" : "Publicar anuncio"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista anuncios */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">Anuncios publicados</h2>
              {noticias.filter((n) => n.activo).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No hay anuncios publicados todavía.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {noticias.filter((n) => n.activo).map((n) => (
                    <div
                      key={n.anuncioId}
                      className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {n.esGlobal && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                              Global
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-800">{n.titulo}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.mensaje}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <button
                          onClick={() => handleEditAnuncio(n)}
                          className="text-[11px] text-blue-600 font-medium hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteAnuncio(n.anuncioId)}
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
          </>
        )}

        {/* ── MÓDULOS FORMATIVOS ── */}
        {activeTab === "formaciones" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  Gestión de Módulos
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Administra los módulos formativos de tu empresa
                </p>
              </div>
              <button
                onClick={() => { resetFormModulo(); setShowFormModulo(true); }}
                className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                + Nuevo módulo
              </button>
            </div>

            {showFormModulo && (
              <ModuloForm
                editando={editingModulo}
                empresaId={usuario?.empresaId}
                onSave={() => { resetFormModulo(); refreshData(); }}
                onCancel={resetFormModulo}
              />
            )}

            {/* Lista módulos */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">Módulos activos</h2>
              {formaciones.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No hay módulos creados todavía.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {formaciones.map((f) => (
                    <div
                      key={f.moduloId}
                      className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100">
                            {MODULO_TIPO_LABEL[f.tipoModulo] ?? f.tipoModulo}
                          </span>
                          {f.empresaId === null ? (
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full italic">
                              Global
                            </span>
                          ) : (
                            <span className="text-[10px] text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full italic">
                              Empresa
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-800">{f.nombre}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{f.descripcion}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        {f.empresaId !== null ? (
                          <>
                            <button
                              onClick={() => handleEditModulo(f)}
                              className="text-[11px] text-blue-600 font-medium hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteModulo(f.moduloId)}
                              className="text-[11px] text-red-500 font-medium hover:underline"
                            >
                              Desactivar
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            Solo lectura (Global)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seguimiento de empleados — conectar con /api/v1/progreso/empresa/{id} en siguiente paso */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mt-8">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">Seguimiento de Empleados</h2>
              <p className="text-xs text-gray-400 text-center py-8">
                Próximamente — datos reales de progreso por empleado.
              </p>
            </div>
          </>
        )}

      </main>
    </div>
  );
}