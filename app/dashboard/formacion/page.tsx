"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function FormacionPage() {
  const router      = useRouter();
  const { usuario } = useAuth();

  const [modules, setModules] = useState<ModuloConProgreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getModulosConProgreso()
      .then((data) => setModules(data.sort((a, b) => a.orden - b.orden)))
      .catch(() => setError("No se pudieron cargar los módulos. Inténtalo de nuevo."))
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

      {/* Estado error */}
      {error && (
        <div
          className="rounded-xl px-6 py-4 text-sm"
          style={{
            background: "var(--error-light)",
            border:     "1px solid var(--error)",
            color:      "var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && modules.length === 0 && (
        <div
          className="rounded-xl px-6 py-16 text-center"
          style={{
            background: "var(--blanco)",
            border:     "1px solid var(--gris-borde)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
            No hay módulos disponibles aún. El administrador los publicará pronto.
          </p>
        </div>
      )}

      {/* Grid de módulos */}
      {!loading && !error && modules.length > 0 && (
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
                  onClick={() => router.push(`/dashboard/admin?tab=formaciones&edit=${m.moduloId}`)}
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
                {m.status === "completado" ? "Repasar contenido" : "Comenzar módulo →"}
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