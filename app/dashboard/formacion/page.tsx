"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import DashboardHero from "@/components/ui/DashboardHero";

// Mock data para demostrar el diseño cuando el backend no devuelve módulos
const MOCK_MODULES: (ModuloConProgreso & { duracion: string; porcentaje: number })[] = [
  { moduloId: "1", nombre: "Incorporación y Bienvenida a Atalayas", descripcion: "Conoce la empresa, sus valores y procedimientos de incorporación.", tipoModulo: "IDENTIDAD",   orden: 1, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "en progreso", duracion: "45 min",  porcentaje: 60  },
  { moduloId: "2", nombre: "Comunicación Efectiva en el Trabajo",   descripcion: "Estrategias para mejorar la comunicación interna y externa.",     tipoModulo: "DESARROLLO",   orden: 2, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente",   duracion: "1 h",    porcentaje: 0   },
  { moduloId: "3", nombre: "Introducción a Herramientas Digitales",  descripcion: "Uso de las plataformas digitales del parque empresarial.",         tipoModulo: "BASICA",       orden: 3, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "en progreso", duracion: "2 h",    porcentaje: 30  },
  { moduloId: "4", nombre: "Negociación y Habilidades Directivas",   descripcion: "Técnicas avanzadas de negociación para entornos empresariales.",   tipoModulo: "ESPECIFICA",   orden: 4, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "completado",  duracion: "1.5 h",  porcentaje: 100 },
  { moduloId: "5", nombre: "Ciberseguridad y Protección de Datos",   descripcion: "Buenas prácticas de seguridad informática y RGPD.",                tipoModulo: "BASICA",       orden: 5, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente",   duracion: "30 min", porcentaje: 0   },
  { moduloId: "6", nombre: "Gestión de Proyectos con Metodologías Ágiles", descripcion: "Scrum, Kanban y otras metodologías para gestionar tu equipo.", tipoModulo: "DESARROLLO",   orden: 6, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente",   duracion: "2.5 h",  porcentaje: 0   },
  { moduloId: "7", nombre: "Diversidad e Inclusión en la Empresa",   descripcion: "Cultura inclusiva y gestión de la diversidad en el entorno laboral.", tipoModulo: "COMUNIDAD", orden: 7, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "en progreso", duracion: "1 h",    porcentaje: 80  },
];

// Gradientes por tipo de módulo para las miniaturas
const TIPO_GRADIENT: Record<string, string> = {
  IDENTIDAD:   "linear-gradient(135deg, #1B3F7E 0%, #2A5298 100%)",
  BASICA:      "linear-gradient(135deg, #0D1B2E 0%, #1B3F7E 100%)",
  ESPECIFICA:  "linear-gradient(135deg, #8B9A2D 0%, #A3B535 100%)",
  DESARROLLO:  "linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)",
  RECOMPENSAS: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
  COMUNIDAD:   "linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)",
};

type ModuloEnriquecido = ModuloConProgreso & { duracion: string; porcentaje: number };

function enriquecer(m: ModuloConProgreso): ModuloEnriquecido {
  const porcentaje = m.status === "completado" ? 100 : m.status === "en progreso" ? 50 : 0;
  return { ...m, duracion: "—", porcentaje };
}

export default function FormacionPage() {
  const router      = useRouter();
  const { usuario } = useAuth();

  const [modules, setModules] = useState<ModuloEnriquecido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModulosConProgreso()
      .then((data) => {
        const sorted = data.sort((a, b) => a.orden - b.orden);
        setModules(sorted.length > 0 ? sorted.map(enriquecer) : MOCK_MODULES);
      })
      .catch(() => setModules(MOCK_MODULES))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = usuario?.codigoRol !== "ROLE_EMPLEADO" && usuario?.codigoRol !== "INVITADO";

  // Módulo "continuar": el primero en progreso
  const continuar = modules.find((m) => m.status === "en progreso");

  return (
    <div className="w-full">
      <DashboardHero prefijo="Centro de " titulo="Formación." />

      <div className="px-10 lg:px-16 pt-14 pb-16">
      {isAdmin && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push("/dashboard/admin?tab=formaciones")}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", color: "var(--texto-secundario)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blanco)")}
          >
            ⚙️ Gestionar módulos
          </button>
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
        </div>
      )}

      {!loading && (
        <>
          {/* ── Continue Learning card ───────────────────────────────── */}
          {continuar && (
            <div
              className="w-full rounded-2xl mb-10 flex flex-col sm:flex-row items-stretch overflow-hidden"
              style={{ border: "2px solid var(--azul-egm)", background: "var(--blanco)" }}
            >
              {/* Thumbnail */}
              <div
                className="w-full sm:w-48 h-36 sm:h-auto shrink-0"
                style={{ background: TIPO_GRADIENT[continuar.tipoModulo] }}
              />

              {/* Info */}
              <div className="flex-1 px-6 py-5 flex flex-col justify-center gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--azul-egm)" }}>
                    Continuar aprendiendo
                  </p>
                  <h2 className="text-xl font-bold leading-snug" style={{ color: "var(--texto-primario)" }}>
                    {continuar.nombre}
                  </h2>
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--texto-muted)" }}>
                      <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                    </svg>
                    <span className="text-sm" style={{ color: "var(--texto-muted)" }}>{continuar.duracion}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-full max-w-xs h-2 rounded-full overflow-hidden" style={{ background: "var(--gris-borde)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${continuar.porcentaje}%`, background: "var(--azul-egm)" }} />
                    </div>
                    <span className="text-sm font-semibold ml-3 shrink-0" style={{ color: "var(--azul-egm)" }}>
                      {continuar.porcentaje}%
                    </span>
                    <span className="text-sm ml-2 shrink-0 px-2 py-0.5 rounded-full font-medium" style={{ background: "#FFF3CD", color: "#856404" }}>
                      En progreso
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 py-5 flex items-center shrink-0">
                <button
                  onClick={() => router.push(`/dashboard/formacion/${continuar.moduloId}`)}
                  className="px-6 py-2.5 rounded-lg text-base font-semibold transition-colors"
                  style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blanco)")}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* ── Grid de módulos ──────────────────────────────────────── */}
          {modules.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((m) => (
                <CourseCard key={m.moduloId} m={m} isAdmin={isAdmin} router={router} />
              ))}
            </div>
          )}

          {/* ── Estado vacío ─────────────────────────────────────────── */}
          {modules.length === 0 && (
            <div
              className="rounded-xl px-6 py-16 text-center flex flex-col items-center"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
            >
              <p className="text-base font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
                {isAdmin ? "Aún no hay módulos de formación" : "Sin módulos disponibles todavía"}
              </p>
              <p className="text-sm max-w-xs" style={{ color: "var(--texto-muted)" }}>
                {isAdmin
                  ? "Crea el primer módulo formativo para que tu equipo pueda empezar."
                  : "Tu empresa publicará próximamente los módulos de formación."}
              </p>
              {isAdmin && (
                <button
                  onClick={() => router.push("/dashboard/admin?tab=formaciones")}
                  className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg"
                  style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                >
                  Crear primer módulo
                </button>
              )}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

// ── Tarjeta de curso ──────────────────────────────────────────────────────────
function CourseCard({
  m, isAdmin, router,
}: {
  m: ModuloEnriquecido;
  isAdmin: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const isCompletado  = m.status === "completado";
  const isEnProgreso  = m.status === "en progreso";

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col group relative transition-shadow hover:shadow-md"
      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
    >
      {/* Botón editar admin */}
      {isAdmin && (
        <button
          onClick={() => router.push(`/dashboard/admin?tab=formaciones&edit=${m.moduloId}`)}
          className="absolute top-3 right-3 z-10 text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "1px solid var(--gris-borde)" }}
        >
          Editar
        </button>
      )}

      {/* Thumbnail */}
      <div
        className="w-full h-40"
        style={{ background: TIPO_GRADIENT[m.tipoModulo] }}
      />

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Título y duración */}
        <div>
          <h3 className="text-base font-bold leading-snug mb-1" style={{ color: "var(--texto-primario)" }}>
            {m.nombre}
          </h3>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--texto-muted)" }}>
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
            </svg>
            <span className="text-sm" style={{ color: "var(--texto-muted)" }}>{m.duracion}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--gris-borde)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${m.porcentaje}%`,
                background: isCompletado ? "var(--exito, #16a34a)" : "var(--azul-egm)",
              }}
            />
          </div>
          <span className="text-sm font-medium shrink-0" style={{ color: "var(--texto-muted)" }}>
            {m.porcentaje}%
          </span>
        </div>

        {/* Tipo badge */}
        <span
          className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded self-start"
          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
        >
          {MODULO_TIPO_LABEL[m.tipoModulo] ?? m.tipoModulo}
        </span>

        {/* CTA button */}
        <button
          className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
          onClick={() => !isCompletado && router.push(`/dashboard/formacion/${m.moduloId}`)}
          style={
            isCompletado
              ? { background: "#D1FAE5", color: "#065F46", cursor: "default" }
              : isEnProgreso
              ? { background: "var(--blanco)", border: "1px solid var(--gris-borde)", color: "var(--texto-primario)" }
              : { background: "var(--azul-egm)", color: "var(--blanco)" }
          }
          onMouseEnter={(e) => {
            if (!isCompletado && isEnProgreso) e.currentTarget.style.background = "var(--gris-superficie)";
            if (!isCompletado && !isEnProgreso) e.currentTarget.style.background = "var(--azul-egm-hover)";
          }}
          onMouseLeave={(e) => {
            if (!isCompletado && isEnProgreso) e.currentTarget.style.background = "var(--blanco)";
            if (!isCompletado && !isEnProgreso) e.currentTarget.style.background = "var(--azul-egm)";
          }}
        >
          {isCompletado ? "✓ Completado" : isEnProgreso ? "Continuar" : "Empezar"}
        </button>
      </div>
    </div>
  );
}
