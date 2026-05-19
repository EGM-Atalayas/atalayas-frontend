"use client";

// ============================================================
// FormacionesAdminTab — tab del panel admin para gestionar
// módulos formativos. Lista, activa/desactiva y elimina módulos.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LibraryBig, Plus, RefreshCw } from "lucide-react";
import { QK } from "@/lib/queryKeys";
import { apiFetch, API_URL } from "@/lib/api";
import type { Modulo } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { Button } from "@/components/ui/Button";
import { ModalConfirm } from "@/components/ui/ModalConfirm";

// Accent colors per modulo tipo for top strip
const tipoAccentColor: Record<string, string> = {
  PREVENCION: "var(--error)",
  CALIDAD: "var(--azul-egm)",
  MEDIO_AMBIENTE: "var(--verde-oliva)",
  FORMACION_BASICA: "var(--exito)",
};

interface Props {
  formaciones: Modulo[];
  cargandoModulos: boolean;
  empresaId?: string | null;
  onToast: (msg: string, tipo?: "ok" | "error") => void;
}

export function FormacionesAdminTab({
  formaciones,
  cargandoModulos,
  empresaId,
  onToast,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [confirmModulo, setConfirmModulo] = useState<{ modulo: Modulo } | null>(null);
  const [confirmEliminarModulo, setConfirmEliminarModulo] = useState<{
    moduloId: string;
    nombre: string;
  } | null>(null);

  const handleDesactivarModulo = (modulo: Modulo) => {
    setConfirmModulo({ modulo });
  };

  const ejecutarToggleModulo = async () => {
    if (!confirmModulo) return;
    const { modulo } = confirmModulo;
    const estaActivo = modulo.activo;
    try {
      let res;
      if (estaActivo) {
        res = await apiFetch(`${API_URL}/modulos/${modulo.moduloId}/desactivar`, {
          method: "PATCH",
        });
      } else {
        res = await apiFetch(`${API_URL}/modulos/${modulo.moduloId}`, {
          method: "PUT",
          body: JSON.stringify({
            nombre: modulo.nombre,
            descripcion: modulo.descripcion,
            tipoModulo: modulo.tipoModulo,
            audiencia: modulo.audiencia ?? "todos",
            activo: true,
            empresaId: modulo.empresaId,
            imagenPortadaUrl: modulo.imagenPortadaUrl ?? null,
          }),
        });
      }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        onToast(e.message ?? "Error al cambiar el estado del módulo", "error");
        return;
      }
      queryClient.invalidateQueries({ queryKey: QK.modulos(empresaId) });
    } catch {
      onToast("Error al cambiar el estado del módulo", "error");
    } finally {
      setConfirmModulo(null);
    }
  };

  const handleEliminarModulo = (moduloId: string, nombre: string) => {
    setConfirmEliminarModulo({ moduloId, nombre });
  };

  const ejecutarEliminarModulo = async () => {
    if (!confirmEliminarModulo) return;
    try {
      const res = await apiFetch(
        `${API_URL}/modulos/${confirmEliminarModulo.moduloId}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) {
        onToast("Error al eliminar el módulo", "error");
        return;
      }
      queryClient.invalidateQueries({ queryKey: QK.modulos(empresaId) });
    } catch {
      onToast("Error al eliminar el módulo", "error");
    } finally {
      setConfirmEliminarModulo(null);
    }
  };

  const handleEditModulo = (f: Modulo) => {
    router.push(`/dashboard/admin/modulos/crear?edit=${f.moduloId}`);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            style={{
              fontFamily: "var(--font-raleway), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)",
              color: "var(--texto-primario)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            Gestión de Módulos
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
            {cargandoModulos
              ? "Cargando módulos…"
              : `${formaciones.filter((f) => f.activo).length} módulo${
                  formaciones.filter((f) => f.activo).length !== 1 ? "s" : ""
                } activo${
                  formaciones.filter((f) => f.activo).length !== 1 ? "s" : ""
                }`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key?.startsWith("egm_modulo_admin_")) localStorage.removeItem(key);
              }
              queryClient.invalidateQueries({ queryKey: QK.modulos(empresaId) });
              onToast("Progreso de admin reiniciado");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: "var(--blanco)",
              color: "var(--texto-muted)",
              border: "1px solid var(--gris-borde)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--gris-superficie)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--blanco)")
            }
            title="Reiniciar progreso de admin"
          >
            <RefreshCw size={16} />
            Reiniciar
          </button>
          <button
            onClick={() => router.push("/dashboard/admin/modulos/crear")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--azul-egm-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--azul-egm)")
            }
          >
            <Plus size={16} />
            Nuevo módulo
          </button>
        </div>
      </div>

      {/* Grid de módulos */}
      {formaciones.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-14 sm:py-20 px-6 text-center mb-6"
          style={{
            background: "var(--blanco)",
            border: "1px solid var(--gris-borde)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "#EDE9FE" }}
          >
            <LibraryBig size={30} strokeWidth={1.5} style={{ color: "#7B4A85" }} />
          </div>
          <p
            className="text-lg font-bold mb-1.5"
            style={{ color: "var(--texto-primario)" }}
          >
            No hay módulos creados todavía
          </p>
          <p
            className="text-sm mb-6 max-w-xs"
            style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}
          >
            Crea el primer módulo formativo para tus empleados
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push("/dashboard/admin/modulos/crear")}
          >
            <Plus size={14} /> Crear módulo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {formaciones.map((f) => {
            const accentColor =
              tipoAccentColor[f.tipoModulo] ?? "var(--azul-egm)";
            return (
              <div
                key={f.moduloId}
                className="rounded-2xl overflow-hidden flex flex-col transition-shadow"
                style={{
                  background: f.activo ? "var(--blanco)" : "var(--gris-pagina)",
                  border: `1px solid var(--gris-borde)`,
                  opacity: f.activo ? 1 : 0.65,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow = "none")
                }
              >
                {/* Imagen de portada o franja de color */}
                {f.imagenPortadaUrl ? (
                  <div className="w-full h-36 relative overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.imagenPortadaUrl}
                      alt={f.nombre}
                      className="w-full h-full object-cover"
                      style={{ filter: f.activo ? "none" : "grayscale(100%)" }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "rgba(10,20,40,0.18)" }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-2 shrink-0"
                    style={{
                      background: f.activo ? accentColor : "var(--gris-borde)",
                    }}
                  />
                )}

                <div className="p-5 flex flex-col flex-1">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {MODULO_TIPO_LABEL[f.tipoModulo] && (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: "var(--azul-egm-light)",
                          color: "var(--azul-egm)",
                        }}
                      >
                        {MODULO_TIPO_LABEL[f.tipoModulo]}
                      </span>
                    )}
                    {f.empresaId === null ? (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full italic"
                        style={{
                          background: "var(--gris-superficie)",
                          color: "var(--texto-muted)",
                        }}
                      >
                        EGM Global
                      </span>
                    ) : (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: "var(--verde-oliva-light)",
                          color: "var(--verde-oliva)",
                        }}
                      >
                        Tu empresa
                      </span>
                    )}
                    {!f.activo && (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: "#f3f4f6",
                          color: "#6b7280",
                          border: "1px solid #d1d5db",
                        }}
                      >
                        Desactivado
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <p
                    className="text-base font-semibold mt-3 mb-1"
                    style={{ color: "var(--texto-primario)" }}
                  >
                    {f.nombre}
                  </p>
                  <p
                    className="text-sm line-clamp-2 flex-1"
                    style={{ color: "var(--texto-muted)" }}
                  >
                    {f.descripcion}
                  </p>

                  {/* Actions */}
                  <div
                    className="flex items-center justify-end gap-2 mt-4 pt-3"
                    style={{ borderTop: "1px solid var(--gris-borde)" }}
                  >
                    {f.empresaId !== null ? (
                      <>
                        <button
                          onClick={() =>
                            router.push(`/dashboard/formacion/${f.moduloId}`)
                          }
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{
                            background: "var(--verde-oliva-light)",
                            color: "var(--verde-oliva)",
                          }}
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEditModulo(f)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{
                            background: "var(--azul-egm-light)",
                            color: "var(--azul-egm)",
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDesactivarModulo(f)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{ background: "#fef9c3", color: "#854d0e" }}
                        >
                          {f.activo ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => handleEliminarModulo(f.moduloId, f.nombre)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{
                            background: "var(--error-light)",
                            color: "var(--error)",
                          }}
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-lg"
                        style={{
                          background: "var(--gris-superficie)",
                          color: "var(--texto-muted)",
                          border: "1px solid var(--gris-borde)",
                        }}
                      >
                        Solo lectura
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal toggle módulo */}
      <ModalConfirm
        abierto={!!confirmModulo}
        titulo={
          confirmModulo?.modulo.activo ? "¿Desactivar módulo?" : "¿Activar módulo?"
        }
        descripcion={
          confirmModulo?.modulo.activo
            ? "Dejará de ser visible para los empleados."
            : "Volverá a ser visible para los empleados."
        }
        textoConfirmar={
          confirmModulo?.modulo.activo ? "Desactivar módulo" : "Activar módulo"
        }
        variante={confirmModulo?.modulo.activo ? "warning" : "success"}
        onConfirmar={ejecutarToggleModulo}
        onCancelar={() => setConfirmModulo(null)}
      />

      {/* Modal eliminar módulo */}
      <ModalConfirm
        abierto={!!confirmEliminarModulo}
        titulo="¿Eliminar módulo?"
        descripcion={`"${confirmEliminarModulo?.nombre}" se eliminará permanentemente. Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar módulo"
        variante="danger"
        onConfirmar={ejecutarEliminarModulo}
        onCancelar={() => setConfirmEliminarModulo(null)}
      />
    </>
  );
}
