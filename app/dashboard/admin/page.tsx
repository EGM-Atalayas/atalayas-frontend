"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import ModuloForm from "@/components/ModuloForm";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { apiFetch, API_URL } from "@/lib/api";

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{
              borderColor:    "var(--gris-borde)",
              borderTopColor: "var(--azul-egm)",
            }}
          />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}

// ── CONTENIDO PRINCIPAL ───────────────────────────────────────────────────────
function AdminContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { usuario }  = useAuth();

  const [activeTab, setActiveTab] = useState<"anuncios" | "formaciones">("anuncios");

  // ── ESTADOS ANUNCIOS ──────────────────────────────────────────────────────
  const [noticias, setNoticias]               = useState<Noticia[]>([]);
  const [showFormAnuncio, setShowFormAnuncio] = useState(false);
  const [editingAnuncioId, setEditingAnuncioId] = useState<string | null>(null);
  const [formAnuncio, setFormAnuncio]         = useState<NoticiaInput>(EMPTY_ANUNCIO);

  // ── ESTADOS MÓDULOS ───────────────────────────────────────────────────────
  const [formaciones, setFormaciones]     = useState<ModuloConProgreso[]>([]);
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

  // Protección de ruta — empleados e invitados no acceden
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

  // Sincronización con query params
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

  // ── HANDLERS ANUNCIO ──────────────────────────────────────────────────────
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
      titulo:    n.titulo,
      mensaje:   n.mensaje,
      esGlobal:  n.esGlobal,
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
      await apiFetch(`${API_URL}/modulos/${moduloId}/desactivar`, { method: "PATCH" });
      await refreshData();
    } catch {
      console.error("Error al desactivar módulo");
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
  <>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-8"
          style={{ borderBottom: "1px solid var(--gris-borde)" }}
        >
          {(["anuncios", "formaciones"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="pb-4 px-2 text-sm font-medium transition-colors relative"
              style={{
                color: activeTab === tab
                  ? "var(--azul-egm)"
                  : "var(--texto-muted)",
              }}
            >
              {tab === "anuncios" ? "Anuncios" : "Módulos formativos"}
              {activeTab === tab && (
                <div
                  className="absolute bottom-0 left-0 w-full h-0.5 rounded-full"
                  style={{ background: "var(--azul-egm)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── TAB ANUNCIOS ── */}
        {activeTab === "anuncios" && (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1
                  className="text-xl font-semibold"
                  style={{ color: "var(--texto-primario)" }}
                >
                  Gestión de Anuncios
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
                  Comunica novedades a todos los empleados
                </p>
              </div>
              <button
                onClick={() => { resetFormAnuncio(); setShowFormAnuncio(true); }}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                style={{
                  background: "var(--azul-egm)",
                  color:      "var(--blanco)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                + Nuevo anuncio
              </button>
            </div>

            {/* Formulario anuncio */}
            {showFormAnuncio && (
              <div
                className="rounded-xl p-6 mb-6"
                style={{
                  background: "var(--blanco)",
                  border:     "1px solid var(--gris-borde)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                    {editingAnuncioId ? "Editar anuncio" : "Crear anuncio"}
                  </h2>
                  <button
                    onClick={resetFormAnuncio}
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
                      value={formAnuncio.titulo}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, titulo: e.target.value })}
                      placeholder="Ej: Actualización del protocolo de acceso"
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
                      Contenido <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <textarea
                      value={formAnuncio.mensaje}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, mensaje: e.target.value })}
                      rows={4}
                      placeholder="Escribe el contenido del anuncio..."
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
                      onClick={() => setFormAnuncio({ ...formAnuncio, esGlobal: !formAnuncio.esGlobal })}
                      className="relative w-9 h-5 rounded-full transition-colors"
                      style={{ background: formAnuncio.esGlobal ? "var(--azul-egm)" : "var(--gris-superficie)" }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                        style={{ left: formAnuncio.esGlobal ? "calc(100% - 18px)" : "2px" }}
                      />
                    </button>
                    <label className="text-xs" style={{ color: "var(--texto-secundario)" }}>
                      Visible para todos (global)
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end pt-2" style={{ borderTop: "1px solid var(--gris-superficie)" }}>
                    <button
                      onClick={resetFormAnuncio}
                      className="text-sm px-4 py-2 rounded-lg transition-colors"
                      style={{ color: "var(--texto-secundario)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveAnuncio}
                      className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
                    >
                      {editingAnuncioId ? "Guardar cambios" : "Publicar anuncio"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista anuncios */}
            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
              }}
            >
              <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--texto-primario)" }}>
                Anuncios publicados
              </h2>
              {noticias.filter((n) => n.activo).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                    No hay anuncios publicados todavía
                  </p>
                  <button
                    onClick={() => { resetFormAnuncio(); setShowFormAnuncio(true); }}
                    className="mt-2 text-xs font-medium hover:underline"
                    style={{ color: "var(--azul-egm)" }}
                  >
                    Crear el primero →
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {noticias.filter((n) => n.activo).map((n) => (
                    <div
                      key={n.anuncioId}
                      className="flex items-start justify-between rounded-lg px-4 py-3 transition-colors"
                      style={{
                        border:     "1px solid var(--gris-borde)",
                        background: "var(--gris-pagina)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {n.esGlobal && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: "var(--azul-egm-light)",
                                color:      "var(--azul-egm)",
                              }}
                            >
                              Global
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>
                          {n.titulo}
                        </p>
                        <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>
                          {n.mensaje}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <button
                          onClick={() => handleEditAnuncio(n)}
                          className="text-[11px] font-medium hover:underline"
                          style={{ color: "var(--azul-egm)" }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteAnuncio(n.anuncioId)}
                          className="text-[11px] font-medium hover:underline"
                          style={{ color: "var(--error)" }}
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

        {/* ── TAB MÓDULOS FORMATIVOS ── */}
        {activeTab === "formaciones" && (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1
                  className="text-xl font-semibold"
                  style={{ color: "var(--texto-primario)" }}
                >
                  Gestión de Módulos
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
                  Administra los módulos formativos de tu empresa
                </p>
              </div>
              <button
                onClick={() => { resetFormModulo(); setShowFormModulo(true); }}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                style={{
                  background: "var(--azul-egm)",
                  color:      "var(--blanco)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                + Nuevo módulo
              </button>
            </div>

            {showFormModulo && (
              <div className="mb-6">
                <ModuloForm
                  editando={editingModulo}
                  empresaId={usuario?.empresaId}
                  onSave={() => { resetFormModulo(); refreshData(); }}
                  onCancel={resetFormModulo}
                />
              </div>
            )}

            {/* Lista módulos */}
            <div
              className="rounded-xl p-6"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
              }}
            >
              <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--texto-primario)" }}>
                Módulos activos
              </h2>
              {formaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                    No hay módulos creados todavía
                  </p>
                  <button
                    onClick={() => { resetFormModulo(); setShowFormModulo(true); }}
                    className="mt-2 text-xs font-medium hover:underline"
                    style={{ color: "var(--azul-egm)" }}
                  >
                    Crear el primero →
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {formaciones.map((f) => (
                    <div
                      key={f.moduloId}
                      className="flex items-start justify-between rounded-lg px-4 py-3 transition-colors"
                      style={{
                        border:     "1px solid var(--gris-borde)",
                        background: "var(--gris-pagina)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: "var(--azul-egm-light)",
                              color:      "var(--azul-egm)",
                            }}
                          >
                            {MODULO_TIPO_LABEL[f.tipoModulo] ?? f.tipoModulo}
                          </span>
                          {f.empresaId === null ? (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full italic"
                              style={{
                                background: "var(--gris-superficie)",
                                color:      "var(--texto-muted)",
                              }}
                            >
                              EGM Global
                            </span>
                          ) : (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{
                                background: "var(--verde-oliva-light)",
                                color:      "var(--verde-oliva)",
                              }}
                            >
                              Tu empresa
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>
                          {f.nombre}
                        </p>
                        <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>
                          {f.descripcion}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        {f.empresaId !== null ? (
                          <>
                            <button
                              onClick={() => handleEditModulo(f)}
                              className="text-[11px] font-medium hover:underline"
                              style={{ color: "var(--azul-egm)" }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteModulo(f.moduloId)}
                              className="text-[11px] font-medium hover:underline"
                              style={{ color: "var(--error)" }}
                            >
                              Desactivar
                            </button>
                          </>
                        ) : (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded"
                            style={{
                              background: "var(--gris-superficie)",
                              color:      "var(--texto-muted)",
                              border:     "1px solid var(--gris-borde)",
                            }}
                          >
                            Solo lectura
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seguimiento empleados — pendiente backend */}
            <div
              className="rounded-xl p-6 mt-6"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
              }}
            >
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--texto-primario)" }}>
                Seguimiento de empleados
              </h2>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                  Próximamente — progreso por empleado
                </p>
              </div>
            </div>
          </>
        )}

      </>
);
}