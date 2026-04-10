"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";

export default function FormacionPage() {
  const router      = useRouter();
  const { usuario } = useAuth();

  const [modules, setModules] = useState<ModuloConProgreso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Silenciamos el error 500 del backend — mostramos estado vacío en su lugar
    getModulosConProgreso()
      .then((data) => setModules(data.sort((a, b) => a.orden - b.orden)))
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin =
    usuario?.codigoRol !== "ROLE_EMPLEADO" &&
    usuario?.codigoRol !== "INVITADO";

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--texto-primario)" }}
          >
            Centro de Formación
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
            Accede a tus cursos y materiales de capacitación técnica y normativa.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => router.push("/dashboard/admin?tab=formaciones")}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{
              background: "var(--blanco)",
              border:     "1px solid var(--gris-borde)",
              color:      "var(--texto-secundario)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blanco)")}
          >
            ⚙️ Gestionar módulos
          </button>
        )}
      </div>

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
      {!loading && modules.length === 0 && (
        <div
          className="rounded-xl px-6 py-16 text-center flex flex-col items-center"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: "var(--verde-oliva-light)" }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              style={{ color: "var(--verde-oliva)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          {isAdmin ? (
            <>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
                Aún no hay módulos de formación
              </p>
              <p className="text-xs mb-4 max-w-xs" style={{ color: "var(--texto-muted)" }}>
                Crea el primer módulo formativo para que tu equipo pueda empezar a formarse.
              </p>
              <button
                onClick={() => router.push("/dashboard/admin?tab=formaciones")}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                Crear primer módulo
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
                Sin módulos disponibles todavía
              </p>
              <p className="text-xs max-w-xs" style={{ color: "var(--texto-muted)" }}>
                Tu empresa publicará próximamente los módulos de formación asignados a tu puesto.
              </p>
            </>
          )}
        </div>
      )}

      {/* Grid de módulos */}
      {!loading && modules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => (
            <div
              key={m.moduloId}
              className="rounded-xl p-6 flex flex-col group relative transition-shadow hover:shadow-sm"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
              }}
            >
              {/* Botón editar — solo admin, visible al hover */}
              {isAdmin && (
                <button
                  onClick={() =>
                    router.push(`/dashboard/admin?tab=formaciones&edit=${m.moduloId}`)
                  }
                  className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: "var(--azul-egm-light)",
                    color:      "var(--azul-egm)",
                    border:     "1px solid var(--gris-borde)",
                  }}
                >
                  Editar
                </button>
              )}

              {/* Tipo + estado */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: "var(--azul-egm-light)",
                    color:      "var(--azul-egm)",
                  }}
                >
                  {MODULO_TIPO_LABEL[m.tipoModulo] ?? m.tipoModulo}
                </span>
                <StatusBadge status={m.status} />
              </div>

              {/* Nombre y descripción */}
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: "var(--texto-primario)" }}
              >
                {m.nombre}
              </h3>
              <p
                className="text-xs mb-6 flex-1 leading-snug"
                style={{ color: "var(--texto-muted)" }}
              >
                {m.descripcion}
              </p>


              {/* CTA */}
              <button
                className="w-full py-2.5 rounded-lg text-xs font-medium transition-colors"
                style={
                  m.status === "completado"
                    ? {
                        background: "var(--gris-superficie)",
                        color:      "var(--texto-muted)",
                        cursor:     "default",
                      }
                    : {
                        background: "var(--azul-egm)",
                        color:      "var(--blanco)",
                      }
                }
                onMouseEnter={(e) => {
                  if (m.status !== "completado")
                    e.currentTarget.style.background = "var(--azul-egm-hover)";
                }}
                onMouseLeave={(e) => {
                  if (m.status !== "completado")
                    e.currentTarget.style.background = "var(--azul-egm)";
                }}
              >
                {m.status === "completado"
                  ? "✓ Completado"
                  : m.status === "en progreso"
                  ? "Continuar →"
                  : "Comenzar módulo →"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SUBCOMPONENTE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const estilos: Record<string, { bg: string; color: string }> = {
    completado:    { bg: "var(--exito-light)",     color: "var(--exito)" },
    "en progreso": { bg: "var(--azul-egm-light)",  color: "var(--azul-egm)" },
    pendiente:     { bg: "var(--gris-superficie)", color: "var(--texto-muted)" },
  };

  const estilo = estilos[status] ?? estilos.pendiente;

  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: estilo.bg, color: estilo.color }}
    >
      {status}
    </span>
  );
}