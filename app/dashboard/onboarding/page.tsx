"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { descargarCertificado } from "@/lib/certificado";
import DashboardHero from "@/components/ui/DashboardHero";
import { Trophy } from "lucide-react";

// ── Helpers (mismo patrón que formacion/page.tsx) ─────────────────────────────
const TIPOS_ONBOARDING = new Set(["ONBOARDING"]);

function leerPorcentajeLS(moduloId: string): number | null {
  try {
    const raw = localStorage.getItem(`egm_modulo_${moduloId}`);
    if (!raw) return null;
    const { completados, total } = JSON.parse(raw) as { completados: string[]; total?: number };
    const totalItems = total ?? 5;
    if (totalItems === 0) return 0;
    return Math.min(100, Math.round((completados.length / totalItems) * 100));
  } catch { return null; }
}

type ModuloEnriquecido = ModuloConProgreso & { duracion: string; porcentaje: number };

function enriquecer(m: ModuloConProgreso): ModuloEnriquecido {
  const pctLS = leerPorcentajeLS(m.moduloId);
  const porcentaje = pctLS !== null ? pctLS
    : m.status === "completado" ? 100 : m.status === "en progreso" ? 50 : 0;
  const status = pctLS !== null
    ? (pctLS >= 100 ? "completado" : pctLS > 0 ? "en progreso" : "pendiente")
    : m.status;
  return { ...m, status, duracion: "30 min", porcentaje };
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { usuario } = useAuth();

  const [modulos, setModulos]   = useState<ModuloEnriquecido[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getModulosConProgreso(usuario?.empresaId)
      .then((data) => {
        const onboarding = data
          .filter((m) => TIPOS_ONBOARDING.has(m.tipoModulo))
          .sort((a, b) => a.orden - b.orden)
          .map(enriquecer);
        setModulos(onboarding);
      })
      .catch(() => setModulos([]))
      .finally(() => setLoading(false));
  }, []);

  const totalModulos     = modulos.length;
  const completados      = modulos.filter((m) => m.status === "completado").length;
  const todoCompletado   = totalModulos > 0 && completados === totalModulos;
  const progresoGlobal   = totalModulos === 0 ? 0 : Math.round((completados / totalModulos) * 100);

  // Índice del primer módulo no completado (el "activo")
  const indexActivo = modulos.findIndex((m) => m.status !== "completado");

  return (
    <div>
      {/* ── Hero — protege el header transparente ───────────────────────────── */}
      <DashboardHero
        prefijo="Tu ruta de"
        titulo="Incorporación"
        imagenFondo="/background-formacion-empleado.webp"
        objectPosition="center 30%"
        variante="seccion"
      />

    <div className="pt-12 pb-20 px-4 sm:px-8 lg:px-16 max-w-3xl mx-auto">

      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="mb-10 text-center">
        <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
          Sigue estos pasos para completar tu llegada a{" "}
          <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>
            {usuario?.nombreEmpresa || "la empresa"}
          </span>
          .
        </p>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-7 h-7 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }}
          />
        </div>
      )}

      {/* ── Sin módulos ─────────────────────────────────────────────────────── */}
      {!loading && totalModulos === 0 && (
        <div
          className="rounded-2xl flex flex-col items-center gap-5 py-20 px-8 text-center"
          style={{ background: "var(--blanco)", border: "2px dashed var(--gris-borde)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold mb-1" style={{ color: "var(--texto-primario)" }}>
              Onboarding pendiente de configuración
            </p>
            <p className="text-sm max-w-xs mx-auto" style={{ color: "var(--texto-muted)" }}>
              Tu empresa configurará próximamente el programa de incorporación. Vuelve pronto.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/formacion")}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
          >
            Ver formación disponible
          </button>
        </div>
      )}

      {/* ── Progreso global ──────────────────────────────────────────────────── */}
      {!loading && totalModulos > 0 && (
        <>
          <div
            className="rounded-2xl p-6 mb-10 flex items-center gap-5"
            style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
          >
            {/* Anillo de progreso */}
            <div className="relative shrink-0 w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--gris-borde)" strokeWidth="7" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke={todoCompletado ? "var(--exito, #16a34a)" : "var(--azul-egm)"}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - progresoGlobal / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-base font-extrabold"
                style={{ color: todoCompletado ? "var(--exito, #16a34a)" : "var(--azul-egm)" }}
              >
                {progresoGlobal}%
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--texto-muted)" }}>
                Progreso general
              </p>
              <p className="text-base font-bold leading-snug" style={{ color: "var(--texto-primario)" }}>
                {todoCompletado
                  ? "¡Onboarding completado!"
                  : `${completados} de ${totalModulos} módulos completados`}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                {todoCompletado
                  ? "Ya formas parte del equipo. Accede a toda la formación disponible."
                  : indexActivo >= 0
                    ? `Siguiente: ${modulos[indexActivo].nombre}`
                    : "Revisa tus módulos completados."}
              </p>
            </div>

            {todoCompletado && (
              <button
                onClick={() => router.push("/dashboard/formacion")}
                className="shrink-0 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
              >
                Ver formación →
              </button>
            )}
          </div>

          {/* ── Línea de tiempo ─────────────────────────────────────────────── */}
          <div className="relative">
            {/* Línea vertical conectora */}
            <div
              className="absolute top-5 bottom-5 w-0.5"
              style={{ left: "1.4rem", background: "var(--gris-borde)" }}
            />

            <div className="space-y-5">
              {modulos.map((m, i) => {
                const isCompletado = m.status === "completado";
                const isActivo     = i === indexActivo;
                const isPendiente  = !isCompletado && !isActivo;

                return (
                  <StepCard
                    key={m.moduloId}
                    modulo={m}
                    index={i}
                    isCompletado={isCompletado}
                    isActivo={isActivo}
                    isPendiente={isPendiente}
                    usuario={usuario}
                    onNavigate={() => router.push(`/dashboard/formacion/${m.moduloId}`)}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Estado completado ────────────────────────────────────────────── */}
          {todoCompletado && (
            <div
              className="mt-10 rounded-2xl p-8 text-center flex flex-col items-center gap-4"
              style={{
                background: "linear-gradient(135deg, var(--azul-egm-light) 0%, #f0fdf4 100%)",
                border: "1px solid var(--azul-egm)",
              }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--texto-primario)", fontFamily: "var(--font-raleway), sans-serif" }}>
                  ¡Bienvenido/a al equipo!
                </h2>
                <p className="text-sm max-w-md mx-auto" style={{ color: "var(--texto-muted)" }}>
                  Has completado todo el proceso de incorporación. Ya eres parte oficial de{" "}
                  <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>
                    {usuario?.nombreEmpresa || "la empresa"}
                  </span>
                  . Ahora puedes acceder a toda la formación continua.
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/formacion")}
                className="mt-2 text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
              >
                Ir a Formación continua →
              </button>
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}

// ── Tarjeta de paso ───────────────────────────────────────────────────────────
function StepCard({
  modulo, index, isCompletado, isActivo, isPendiente, usuario, onNavigate,
}: {
  modulo: ModuloEnriquecido;
  index: number;
  isCompletado: boolean;
  isActivo: boolean;
  isPendiente: boolean;
  usuario: ReturnType<typeof useAuth>["usuario"];
  onNavigate: () => void;
}) {
  const handleCertificado = (e: React.MouseEvent) => {
    e.stopPropagation();
    descargarCertificado({
      nombreEmpleado:   usuario?.nombre    ?? "Empleado",
      apellidosEmpleado: usuario?.apellidos,
      nombreModulo:     modulo.nombre,
      tipoModulo:       MODULO_TIPO_LABEL[modulo.tipoModulo] ?? modulo.tipoModulo,
      nombreEmpresa:    usuario?.nombreEmpresa,
      fechaCompletado:  new Date(),
    });
  };

  return (
    <div className="relative flex items-start gap-5">
      {/* Icono de paso */}
      <div
        className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-4 transition-all"
        style={{
          borderColor:     "var(--fondo, #F7F6F3)",
          background:      isCompletado ? "var(--exito, #16a34a)" : isActivo ? "var(--azul-egm)" : "var(--gris-superficie)",
          color:           isCompletado || isActivo ? "#fff" : "var(--texto-muted)",
          boxShadow:       isActivo ? "0 0 0 3px rgba(27,63,126,0.18)" : "none",
        }}
      >
        {isCompletado ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-sm font-extrabold tabular-nums">{index + 1}</span>
        )}
      </div>

      {/* Tarjeta de contenido */}
      <div
        className="flex-1 rounded-2xl overflow-hidden transition-all"
        style={{
          background:  "var(--blanco)",
          border:      isActivo
            ? "1.5px solid var(--azul-egm)"
            : "1px solid var(--gris-borde)",
          opacity:     isPendiente ? 0.65 : 1,
          boxShadow:   isActivo ? "0 4px 20px rgba(27,63,126,0.10)" : "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(163,181,53,0.15)", color: "#6b7a1a" }}
                >
                  Onboarding
                </span>
                {isActivo && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
                  >
                    En curso
                  </span>
                )}
                {isCompletado && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: "#f0fdf4", color: "var(--exito, #16a34a)" }}
                  >
                    Completado
                  </span>
                )}
              </div>
              <h3
                className="text-sm font-bold leading-snug"
                style={{ color: isPendiente ? "var(--texto-muted)" : "var(--texto-primario)" }}
              >
                {modulo.nombre}
              </h3>
            </div>
            <span
              className="text-sm font-extrabold tabular-nums shrink-0 mt-0.5"
              style={{ color: isCompletado ? "var(--exito, #16a34a)" : isActivo ? "var(--azul-egm)" : "var(--texto-muted)" }}
            >
              {modulo.porcentaje}%
            </span>
          </div>

          {/* Descripción */}
          {modulo.descripcion && (
            <p className="text-xs mb-4 line-clamp-2" style={{ color: "var(--texto-muted)" }}>
              {modulo.descripcion}
            </p>
          )}

          {/* Barra de progreso */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--gris-borde)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${modulo.porcentaje}%`,
                  background: isCompletado
                    ? "var(--exito, #16a34a)"
                    : "linear-gradient(90deg, var(--azul-egm), var(--verde-oliva))",
                }}
              />
            </div>
          </div>

          {/* Botones */}
          {isCompletado ? (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCertificado}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                style={{ background: "var(--azul-egm)", color: "#fff" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar certificado
              </button>
              <button
                onClick={onNavigate}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-borde)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
              >
                Revisar módulo
              </button>
            </div>
          ) : isActivo ? (
            <button
              onClick={onNavigate}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              style={{ background: "var(--azul-egm)", color: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
            >
              {modulo.porcentaje > 0 ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Continuar
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                  </svg>
                  Comenzar ahora
                </>
              )}
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
              style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pendiente
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
