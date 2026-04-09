"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getNoticias } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { Noticia } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Empleado() {
  const router      = useRouter();
  const { usuario } = useAuth();

  const [noticias, setNoticias]       = useState<Noticia[]>([]);
  const [formaciones, setFormaciones] = useState<ModuloConProgreso[]>([]);
  const [cargando, setCargando]       = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [noticiasData, modulosData] = await Promise.all([
          getNoticias(usuario?.empresaId).catch(() => []),
          getModulosConProgreso().catch(() => []),
        ]);
        setNoticias((noticiasData as Noticia[]).slice(0, 3));
        setFormaciones(
          (modulosData as ModuloConProgreso[]).sort((a, b) => a.orden - b.orden)
        );
      } finally {
        setCargando(false);
      }
    }

    if (usuario) cargarDatos();
  }, [usuario]);

  const completados = formaciones.filter((m) => m.status === "completado").length;
  const totalProgress =
    formaciones.length > 0
      ? Math.round((completados / formaciones.length) * 100)
      : 0;

  const siguientePaso = formaciones.find((f) => f.status !== "completado");

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{
            borderColor:    "var(--gris-borde)",
            borderTopColor: "var(--azul-egm)",
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Saludo */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--texto-primario)" }}
        >
          Hola, {usuario?.nombre ?? "Empleado"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {usuario?.nombreEmpresa ?? "Mi empresa"} ·{" "}
          {new Date().toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Itinerario de formación */}
        <div
          className="lg:col-span-2 rounded-xl p-6"
          style={{
            background: "var(--blanco)",
            border:     "1px solid var(--gris-borde)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
              Mi itinerario de formación
            </h2>
            <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
              {completados} de {formaciones.length} módulos
            </span>
          </div>

          {/* Barra de progreso */}
          <div
            className="h-1.5 rounded-full overflow-hidden mb-5"
            style={{ background: "var(--gris-superficie)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width:      `${totalProgress}%`,
                background: "var(--verde-oliva)",
              }}
            />
          </div>

          {/* Siguiente paso */}
          {siguientePaso && (
            <div
              className="mb-5 rounded-xl p-4 flex items-center justify-between"
              style={{
                background: "var(--azul-egm-light)",
                border:     "1px solid var(--gris-borde)",
              }}
            >
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: "var(--azul-egm)" }}
                >
                  Tu siguiente paso
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                  {siguientePaso.nombre}
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/formacion")}
                className="text-xs font-medium px-4 py-2 rounded-lg transition-colors shrink-0 ml-4"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                Continuar →
              </button>
            </div>
          )}

          {/* Lista de módulos */}
          {formaciones.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: "var(--texto-muted)" }}>
              No hay módulos asignados todavía.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {formaciones.map((m) => (
                <div
                  key={m.moduloId}
                  className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors"
                  style={{
                    border:     "1px solid var(--gris-borde)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background:
                          m.status === "completado"
                            ? "var(--exito)"
                            : m.status === "en progreso"
                            ? "var(--azul-egm)"
                            : "var(--gris-borde)",
                      }}
                    />
                    <p className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>
                      {m.nombre}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="flex flex-col gap-6">

          {/* Mis servicios */}
          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--blanco)",
              border:     "1px solid var(--gris-borde)",
            }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--texto-primario)" }}>
              Mis servicios
            </h2>
            <div className="flex flex-col gap-2">
              {[
                { label: "Coche compartido",  desc: "Coordina rutas con compañeros" },
                { label: "Descuentos locales", desc: "Precios especiales en el parque" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    border:     "1px solid var(--gris-borde)",
                    background: "var(--gris-pagina)",
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>
                    {s.label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--texto-muted)" }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mis carnés */}
          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--blanco)",
              border:     "1px solid var(--gris-borde)",
            }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--texto-primario)" }}>
              Mis carnés
            </h2>
            <div
              className="flex items-center gap-3 rounded-lg p-3"
              style={{
                background: "var(--gris-pagina)",
                border:     "1px solid var(--gris-borde)",
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-sm shrink-0"
                style={{
                  background: "var(--blanco)",
                  border:     "1px solid var(--gris-borde)",
                }}
              >
                🗝️
              </div>
              <div>
                <p className="text-[11px] font-semibold" style={{ color: "var(--texto-primario)" }}>
                  P.R.L. Alturas
                </p>
                <p className="text-[10px]" style={{ color: "var(--exito)" }}>
                  Todo en orden
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Últimas noticias */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "var(--blanco)",
          border:     "1px solid var(--gris-borde)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
            Últimas noticias
          </h2>
          <Link
            href="/dashboard/noticias"
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--azul-egm)" }}
          >
            Ver todas →
          </Link>
        </div>

        {noticias.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
            No hay noticias publicadas aún.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {noticias.map((n) => (
              <div
                key={n.anuncioId}
                className="flex items-start justify-between rounded-lg px-4 py-3 transition-colors"
                style={{
                  border:     "1px solid var(--gris-borde)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex-1 min-w-0">
                  {n.esGlobal && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--azul-egm-light)",
                        color:      "var(--azul-egm)",
                      }}
                    >
                      EGM Atalayas
                    </span>
                  )}
                  <p className="text-xs font-medium mt-1 truncate" style={{ color: "var(--texto-primario)" }}>
                    {n.titulo}
                  </p>
                  <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>
                    {n.mensaje}
                  </p>
                </div>
                <span className="text-[10px] ml-4 shrink-0" style={{ color: "var(--texto-muted)" }}>
                  {new Date(n.creadoEn).toLocaleDateString("es-ES", {
                    day:   "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SUBCOMPONENTE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const estilos: Record<string, { bg: string; color: string }> = {
    completado:    { bg: "var(--exito-light)",      color: "var(--exito)" },
    "en progreso": { bg: "var(--azul-egm-light)",   color: "var(--azul-egm)" },
    pendiente:     { bg: "var(--gris-superficie)",  color: "var(--texto-muted)" },
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