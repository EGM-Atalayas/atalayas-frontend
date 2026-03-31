"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { getFormaciones, crearFormacion, editarFormacion, desactivarFormacion } from "@/lib/api/formaciones";
import { Noticia, NoticiaInput } from "@/lib/types/noticias";
import { Formacion, FormacionCategory } from "@/lib/types/formaciones";
import { NAV_ROUTES } from "@/lib/routes";

const FORMACION_CATEGORIES: FormacionCategory[] = ["Onboarding", "Básica", "Específica"];

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Cargando panel...</div>}>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();
  const [activeTab, setActiveTab] = useState<"anuncios" | "formaciones">("anuncios");

  // --- States Anuncios ---
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [showFormAnuncio, setShowFormAnuncio] = useState(false);
  const [editingAnuncioId, setEditingAnuncioId] = useState<string | null>(null);
  const [errorAnuncio, setErrorAnuncio] = useState("");
  const [formAnuncio, setFormAnuncio] = useState<NoticiaInput>({
    titulo: "",
    contenido: "",
    es_global: false,
    empresa_id: null,
  });

  // --- States Formaciones ---
  const [formaciones, setFormaciones] = useState<Formacion[]>([]);
  const [showFormFormacion, setShowFormFormacion] = useState(false);
  const [editingFormacionId, setEditingFormacionId] = useState<number | null>(null);
  const [formFormacion, setFormFormacion] = useState<Partial<Formacion>>({
    name: "",
    category: "Específica",
    description: "",
    pdfUrl: "",
  });

  // --- Logic Functions ---
  const refreshData = async () => {
    if (!usuario?.empresaId) return;
    const [news, trainings] = await Promise.all([
      getNoticias(usuario.empresaId),
      getFormaciones(usuario.empresaId),
    ]);
    setNoticias(news);
    setFormaciones(trainings);
  };

  const resetFormAnuncio = () => {
    setFormAnuncio({ titulo: "", contenido: "", es_global: false, empresa_id: usuario?.empresaId ?? null });
    setEditingAnuncioId(null);
    setShowFormAnuncio(false);
    setErrorAnuncio("");
  };

  const handleSaveAnuncio = async () => {
    if (!formAnuncio.titulo.trim() || !formAnuncio.contenido.trim()) return;
    const payload: NoticiaInput = { ...formAnuncio, empresa_id: usuario?.empresaId ?? null };
    try {
      setErrorAnuncio("");
      if (editingAnuncioId) {
        await editarNoticia(editingAnuncioId, payload);
      } else {
        await crearNoticia(payload);
      }
      await refreshData();
      resetFormAnuncio();
    } catch (err: any) {
      setErrorAnuncio(err.message);
    }
  };

  const handleEditAnuncio = (n: Noticia) => {
    setFormAnuncio({ titulo: n.titulo, contenido: n.contenido, es_global: n.es_global, empresa_id: n.empresa_id });
    setEditingAnuncioId(n.anuncio_id);
    setShowFormAnuncio(true);
  };

  const handleDeleteAnuncio = async (id: string) => {
    try {
      await desactivarNoticia(id);
      await refreshData();
    } catch (err: any) {
      setErrorAnuncio(err.message);
    }
  };

  const resetFormFormacion = () => {
    setFormFormacion({ name: "", category: "Específica", description: "", pdfUrl: "", empresa_id: usuario?.empresaId ?? null });
    setEditingFormacionId(null);
    setShowFormFormacion(false);
  };

  const handleSaveFormacion = async () => {
    if (!formFormacion.name?.trim()) return;
    const payload = { ...formFormacion, empresa_id: usuario?.empresaId ?? null };
    if (editingFormacionId) {
      await editarFormacion(editingFormacionId, payload);
    } else {
      await crearFormacion(payload);
    }
    refreshData();
    resetFormFormacion();
  };

  const handleEditFormacion = (f: Formacion) => {
    setFormFormacion({ name: f.name, category: f.category, description: f.description, pdfUrl: f.pdfUrl || "", empresa_id: f.empresa_id });
    setEditingFormacionId(f.id);
    setShowFormFormacion(true);
  };

  const handleDeleteFormacion = async (id: number) => {
    await desactivarFormacion(id);
    refreshData();
  };

  // --- Effects ---
  useEffect(() => {
    if (usuario && (usuario.codigoRol === "ROLE_EMPLEADO" || usuario.codigoRol === "INVITADO")) {
      router.replace("/dashboard");
    }
  }, [usuario, router]);

  useEffect(() => {
    if (usuario?.empresaId) {
      refreshData();
    }
  }, [usuario?.empresaId]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "formaciones") {
      setActiveTab("formaciones");
    }
    const editId = searchParams.get("edit");
    if (editId && formaciones.length > 0) {
      const f = formaciones.find(x => x.id === Number(editId));
      if (f) handleEditFormacion(f);
    }
  }, [searchParams, formaciones]);

  const isEditingGlobal = !!(showFormFormacion && editingFormacionId && formaciones.find(f => f.id === editingFormacionId)?.empresa_id === null);

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <Header
        defaultActive="Administración"
        onNavChange={(item) => router.push(NAV_ROUTES[item])}
        logoEmpresa={usuario?.logoEmpresaUrl}
      />

      <main className="max-w-5xl mx-auto px-8 py-10">
        {/* Tab Navigation */}
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("anuncios")}
            className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === "anuncios" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            Anuncios
            {activeTab === "anuncios" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
          </button>
          <button
            onClick={() => setActiveTab("formaciones")}
            className={`pb-4 text-sm font-semibold transition-colors relative ${activeTab === "formaciones" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            Formaciones
            {activeTab === "formaciones" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
          </button>
        </div>

        {/* --- ANUNCIOS VIEW --- */}
        {activeTab === "anuncios" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Gestión de Anuncios</h1>
                <p className="text-sm text-gray-400 mt-1">Comunica novedades a todos los empleados</p>
              </div>
              <button
                onClick={() => { resetFormAnuncio(); setShowFormAnuncio(true); }}
                className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                + Nuevo anuncio
              </button>
            </div>

            {errorAnuncio && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <p className="text-xs text-red-600 flex-1">{errorAnuncio}</p>
                <button onClick={() => setErrorAnuncio("")} className="text-red-400 hover:text-red-600">✕</button>
              </div>
            )}

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
                      value={formAnuncio.contenido}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, contenido: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Escribe el contenido del anuncio..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="es_global"
                      checked={formAnuncio.es_global}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, es_global: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="es_global" className="text-xs text-gray-600">Visible para todos (anuncio global)</label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={resetFormAnuncio} className="text-xs font-medium text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleSaveAnuncio} className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      {editingAnuncioId ? "Guardar cambios" : "Publicar anuncio"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">Anuncios publicados</h2>
              {noticias.filter((n) => n.activo).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No hay anuncios publicados todavía.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {noticias.filter((n) => n.activo).map((n, idx) => (
                    <div key={n.anuncio_id ?? idx} className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {n.es_global && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">Global</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-800">{n.titulo}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.contenido}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <button onClick={() => handleEditAnuncio(n)} className="text-[11px] text-blue-600 font-medium hover:underline">Editar</button>
                        <button onClick={() => handleDeleteAnuncio(n.anuncio_id)} className="text-[11px] text-red-500 font-medium hover:underline">Desactivar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* --- FORMACIONES VIEW --- */}
        {activeTab === "formaciones" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Gestión de Formaciones</h1>
                <p className="text-sm text-gray-400 mt-1">Administra los módulos formativos y adjunta material PDF</p>
              </div>
              <button
                onClick={() => { resetFormFormacion(); setShowFormFormacion(true); }}
                className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                + Nueva formación
              </button>
            </div>

            {showFormFormacion && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">
                  {isEditingGlobal ? "Detalles de formación (Global)" : editingFormacionId ? "Editar formación" : "Crear formación"}
                </h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Nombre del módulo</label>
                    <input
                      type="text"
                      disabled={isEditingGlobal}
                      value={formFormacion.name}
                      onChange={(e) => setFormFormacion({ ...formFormacion, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                      placeholder="Ej: PRL Avanzado"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Descripción / Objetivo</label>
                    <textarea
                      value={formFormacion.description}
                      disabled={isEditingGlobal}
                      onChange={(e) => setFormFormacion({ ...formFormacion, description: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
                      placeholder="Describe qué aprenderá el empleado..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Categoría</label>
                      <select
                        value={formFormacion.category}
                        disabled={isEditingGlobal}
                        onChange={(e) => setFormFormacion({ ...formFormacion, category: e.target.value as FormacionCategory })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        {FORMACION_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">URL del PDF (Material)</label>
                      <input
                        type="text"
                        disabled={isEditingGlobal}
                        value={formFormacion.pdfUrl || ""}
                        onChange={(e) => setFormFormacion({ ...formFormacion, pdfUrl: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                        placeholder="https://ejemplo.com/archivo.pdf"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={resetFormFormacion} className="text-xs font-medium text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      {isEditingGlobal ? "Cerrar" : "Cancelar"}
                    </button>
                    {!isEditingGlobal && (
                      <button onClick={handleSaveFormacion} className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        {editingFormacionId ? "Guardar cambios" : "Crear módulo"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">Módulos activos</h2>
              {formaciones.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No hay formaciones creadas todavía.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {formaciones.map((f) => (
                    <div key={f.id} className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100">{f.category}</span>
                          {f.empresa_id === null ? (
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full italic">Global</span>
                          ) : (
                            <span className="text-[10px] text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full italic">Empresa</span>
                          )}
                          {f.pdfUrl && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">PDF Adjunto</span>}
                        </div>
                        <p className="text-xs font-medium text-gray-800">{f.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{f.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        {f.empresa_id !== null ? (
                          <>
                            <button onClick={() => handleEditFormacion(f)} className="text-[11px] text-blue-600 font-medium hover:underline">Editar</button>
                            <button onClick={() => handleDeleteFormacion(f.id)} className="text-[11px] text-red-500 font-medium hover:underline">Eliminar</button>
                          </>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Solo lectura (Global)</span>
                            <button onClick={() => handleEditFormacion(f)} className="text-[10px] text-gray-400 font-medium hover:underline">Ver detalles</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seguimiento de Empleados */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mt-8">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">Seguimiento de Empleados</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs table-auto">
                  <thead>
                    <tr className="text-gray-400 font-medium border-b border-gray-50">
                      <th className="pb-3 pr-4 min-w-[160px]">Empleado</th>
                      <th className="pb-3 pr-4 min-w-[200px]">Formación</th>
                      <th className="pb-3 pr-4 min-w-[140px]">Estado</th>
                      <th className="pb-3 text-right min-w-[100px]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    {[
                      { emp: "Juan Pérez", form: "Identidad Corporativa", status: "Completado" },
                      { emp: "María García", form: "PRL Avanzado", status: "En proceso" },
                      { emp: "Carlos Ruiz", form: "Bienvenida EGM", status: "Pendiente" },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                        <td className="py-3 pr-4 font-medium text-gray-800">{row.emp}</td>
                        <td className="py-3 pr-4 italic">{row.form}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap ${row.status === "Completado" ? "bg-emerald-50 text-emerald-600" :
                            row.status === "En proceso" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => alert(`Editando formación de ${row.emp}...`)}
                            className="text-blue-600 font-medium hover:underline whitespace-nowrap ml-4"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
