"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import DashboardHero from "@/components/ui/DashboardHero";
import { descargarCertificado } from "@/lib/certificado";
import { obtenerCertificadoModulo } from "@/lib/api/documentos";
import { CourseCard } from "@/components/formacion/CourseCard";
import { TIPO_GRADIENT, getFormacionImg, type ModuloEnriquecido } from "@/lib/formacion-helpers";

// Gradientes por tipo de módulo para las miniaturas (fallback)
function leerPorcentajeLS(moduloId: string, esAdmin: boolean): number | null {
  try {
    const raw = localStorage.getItem(esAdmin ? `egm_modulo_admin_${moduloId}` : `egm_modulo_${moduloId}`);
    if (!raw) return null;
    const { completados, total } = JSON.parse(raw) as { completados: string[]; total?: number };
    const totalItems = total ?? 5; // fallback para datos legacy
    if (totalItems === 0) return 0;
    return Math.min(100, Math.round((completados.length / totalItems) * 100));
  } catch { return null; }
}

const DURACION_POR_TIPO: Record<string, string> = {
  IDENTIDAD: "20 min",
  BASICA: "35 min",
  ESPECIFICA: "50 min",
  DESARROLLO: "45 min",
  COMUNIDAD: "25 min",
  RECOMPENSAS: "15 min",
  CUMPLIMIENTO: "30 min",
  LIDERAZGO: "45 min",
  TECNICO: "40 min",
  SOFT_SKILLS: "35 min",
};

// Tipos que pertenecen al bloque "Onboarding" — el resto va a "Formación continua"
const TIPOS_ONBOARDING = new Set(["ONBOARDING"]);

function enriquecer(m: ModuloConProgreso, esAdmin: boolean): ModuloEnriquecido {
  const pctLS = leerPorcentajeLS(m.moduloId, esAdmin);
  const porcentaje = pctLS !== null ? pctLS
    : m.status === "completado" ? 100 : m.status === "en progreso" ? 50 : 0;
  const status = pctLS !== null
    ? (pctLS >= 100 ? "completado" : pctLS > 0 ? "en progreso" : "pendiente")
    : m.status;
  const duracion = DURACION_POR_TIPO[m.tipoModulo] ?? "30 min";
  return { ...m, status, duracion, porcentaje };
}

// ── Tipos de filtro ───────────────────────────────────────────────────────────
type FiltroEstado = "todos" | "pendiente" | "en progreso" | "completado";

const ESTADO_LABELS: { value: FiltroEstado; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en progreso", label: "En progreso" },
  { value: "completado", label: "Completado" },
];

export default function FormacionPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const esAdmin = usuario?.codigoRol === "ROLE_ADMIN_EMPRESA" || usuario?.codigoRol === "ROLE_ADMIN";

  const [modules, setModules] = useState<ModuloEnriquecido[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroOpen, setFiltroOpen] = useState(false);
  const filtroRef = useRef<HTMLDivElement>(null);

  // Cierra el desplegable al hacer clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) {
        setFiltroOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    getModulosConProgreso(usuario?.empresaId)
      .then((data) => {
        const sorted = data.sort((a, b) => a.orden - b.orden);
        setModules(sorted.map((m) => enriquecer(m, esAdmin)));
      })
      .catch(() => setModules([]))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = usuario?.codigoRol !== "ROLE_EMPLEADO" && usuario?.codigoRol !== "INVITADO";

  // Todos los tipos de Formación continua (excluye ONBOARDING), con al menos 1 módulo o definidos en el label
  const modulosContinua = modules.filter((m) => !TIPOS_ONBOARDING.has(m.tipoModulo));
  const tiposDisponibles = (Object.keys(MODULO_TIPO_LABEL) as (keyof typeof MODULO_TIPO_LABEL)[])
    .filter((t) => !TIPOS_ONBOARDING.has(t));

  // Módulo "continuar": el primero en progreso (según progreso real de localStorage)
  const continuar = modules.find((m) => m.status === "en progreso" && m.porcentaje < 100);

  const hayFiltrosActivos =
    busqueda !== "" || filtroEstado !== "todos" || filtroTipo !== "todos";

  // ── Aplicar filtros (solo sobre módulos de Formación continua) ───────────
  const modulosFiltrados = modules.filter((m) => {
    if (TIPOS_ONBOARDING.has(m.tipoModulo)) return false;           // excluir onboarding
    if (busqueda && !m.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroEstado !== "todos" && m.status !== filtroEstado) return false;
    if (filtroTipo !== "todos" && m.tipoModulo !== filtroTipo) return false;
    return true;
  });

  return (
    <div className="w-full">
      <DashboardHero prefijo="Centro de " titulo="Formación" imagenFondo="/background-formacion-empleado.webp" />

      <div className="px-4 sm:px-10 lg:px-16 pt-14 pb-16">
        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
          </div>
        )}

        {!loading && (
          <>
            {/* ── SECCIÓN ONBOARDING ───────────────────────────────────── */}
            {(() => {
              const modulosOnboarding = modules.filter((m) => TIPOS_ONBOARDING.has(m.tipoModulo));
              return (
                <section id="onboarding" className="mb-14 scroll-mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-start gap-3">
                      <span aria-hidden style={{ display: "inline-block", width: 6, height: "1.3em", borderRadius: 999, background: "linear-gradient(180deg, #0F766E 0%, #06B6D4 100%)", boxShadow: "0 2px 8px rgba(6,182,212,0.35)", marginTop: "0.25em" }} />
                      <div>
                        <h2 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                          Onboarding
                        </h2>
                        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                          Tu programa de incorporación a la empresa
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {modulosOnboarding.length > 0 && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                          {modulosOnboarding.filter((m) => m.status === "completado").length} / {modulosOnboarding.length} completados
                        </span>
                      )}
                      {/* Buscador */}
                      <div className="relative w-full sm:w-[260px]">
                        <svg
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          style={{ color: "var(--texto-muted)" }}
                        >
                          <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Buscar formación..."
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 rounded-xl text-sm outline-none"
                          style={{
                            background: "var(--blanco)",
                            border: "1px solid var(--gris-borde)",
                            color: "var(--texto-primario)",
                            fontSize: "14px",
                            height: "38px",
                          }}
                        />
                        {busqueda && (
                          <button
                            onClick={() => setBusqueda("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: "var(--texto-muted)" }}
                          >
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Pills de estado inline */}
                      <div className="flex items-center gap-1.5">
                        {ESTADO_LABELS.map(({ value, label }) => {
                          const active = filtroEstado === value;
                          const count = value === "todos" ? modules.length : modules.filter((m) => m.status === value).length;
                          const colors: Record<string, { bg: string; color: string; border: string }> = {
                            todos: { bg: active ? "var(--azul-egm)" : "var(--blanco)", color: active ? "#fff" : "var(--texto-muted)", border: active ? "var(--azul-egm)" : "var(--gris-borde)" },
                            pendiente: { bg: active ? "var(--gris-superficie)" : "var(--blanco)", color: active ? "var(--texto-primario)" : "var(--texto-muted)", border: active ? "var(--texto-primario)" : "var(--gris-borde)" },
                            "en progreso": { bg: active ? "var(--azul-egm-light)" : "var(--blanco)", color: active ? "var(--azul-egm)" : "var(--texto-muted)", border: active ? "var(--azul-egm)" : "var(--gris-borde)" },
                            completado: { bg: active ? "var(--exito-light)" : "var(--blanco)", color: active ? "var(--exito)" : "var(--texto-muted)", border: active ? "var(--exito)" : "var(--gris-borde)" },
                          };
                          const c = colors[value] ?? colors.todos;
                          return (
                            <button
                              key={value}
                              onClick={() => setFiltroEstado(value)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                              style={{ background: c.bg, color: c.color, borderColor: c.border, height: "32px", whiteSpace: "nowrap" }}
                            >
                              {label}
                              <span className="tabular-nums opacity-60 text-[10px]">{count}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Botón Filtros con desplegable */}
                      <div className="relative" ref={filtroRef}>
                        <button
                          onClick={() => setFiltroOpen((v) => !v)}
                          title="Filtros"
                          className="relative flex items-center justify-center rounded-xl border transition-colors"
                          style={{
                            background: filtroOpen || filtroTipo !== "todos" ? "var(--azul-egm)" : "var(--blanco)",
                            borderColor: filtroOpen || filtroTipo !== "todos" ? "var(--azul-egm)" : "var(--gris-borde)",
                            color: filtroOpen || filtroTipo !== "todos" ? "#ffffff" : "var(--texto-primario)",
                            width: "38px", height: "38px",
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                          </svg>
                          {filtroTipo !== "todos" && (
                            <span
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                              style={{ background: "var(--azul-egm)", color: "#fff", border: "2px solid var(--blanco)" }}
                            >
                              1
                            </span>
                          )}
                        </button>

                        {/* Desplegable */}
                        {filtroOpen && (
                          <div
                            className="absolute right-0 top-full mt-2 z-50 rounded-2xl shadow-xl p-4 flex flex-col gap-4"
                            style={{
                              background: "var(--blanco)",
                              border: "1px solid var(--gris-borde)",
                              width: "320px",
                            }}
                          >
                            {/* Tipo */}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--texto-muted)" }}>
                                Tipo de módulo
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <PillFiltro label="Todos" active={filtroTipo === "todos"} onClick={() => setFiltroTipo("todos")} count={modulosContinua.length} />
                                {tiposDisponibles.map((tipo) => (
                                  <PillFiltro
                                    key={tipo}
                                    label={MODULO_TIPO_LABEL[tipo] ?? tipo}
                                    active={filtroTipo === tipo}
                                    onClick={() => setFiltroTipo(tipo)}
                                    count={modulosContinua.filter((m) => m.tipoModulo === tipo).length}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Limpiar */}
                            {filtroTipo !== "todos" && (
                              <button
                                onClick={() => { setFiltroTipo("todos"); }}
                                className="text-xs font-medium text-left flex items-center gap-1 pt-1"
                                style={{ color: "var(--azul-egm)" }}
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Limpiar filtros
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Contador resultados */}
                      {hayFiltrosActivos && (
                        <span className="text-xs ml-1" style={{ color: "var(--texto-muted)" }}>
                          {modulosFiltrados.length} resultado{modulosFiltrados.length !== 1 ? "s" : ""}
                        </span>
                      )}

                      {/* Botones admin */}
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          {/* Crear módulo */}
                          <button
                            onClick={() => router.push("/dashboard/admin/modulos/crear")}
                            title="Crear módulo"
                            className="flex items-center justify-center rounded-xl border transition-colors"
                            style={{
                              width: "38px", height: "38px",
                              background: "var(--blanco)",
                              borderColor: "var(--gris-borde)",
                              color: "var(--texto-primario)",
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>

                          {/* Gestión de módulos */}
                          <button
                            onClick={() => router.push("/dashboard/admin?tab=formaciones")}
                            title="Gestión de módulos"
                            className="flex items-center justify-center rounded-xl border transition-colors"
                            style={{
                              width: "38px", height: "38px",
                              background: "var(--blanco)",
                              borderColor: "var(--gris-borde)",
                              color: "var(--texto-primario)",
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {modulosOnboarding.length === 0 ? (
                  /* Placeholder cuando no hay módulos de onboarding */
                  <div className="rounded-2xl flex flex-col items-center justify-center gap-4 py-16 px-8 text-center"
                    style={{ background: "var(--blanco)", border: "2px dashed var(--gris-borde)" }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-bold mb-1" style={{ color: "var(--texto-primario)" }}>
                        Módulo de onboarding pendiente de asignación
                      </p>
                      <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                        Tu empresa configurará próximamente el programa de incorporación
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {(() => {
                      const PALETA_OB = [
                        { from: "#4338CA", to: "#0EA5E9" }, // Indigo → Cielo
                        { from: "#0891B2", to: "#10B981" }, // Cian → Verde
                        { from: "#6B21A8", to: "#7C3AED" }, // Púrpura → Violeta
                        { from: "#0F766E", to: "#06B6D4" }, // Teal → Cian
                      ];
                      return modulosOnboarding.map((m, idx) => {
                      const ac = PALETA_OB[idx % PALETA_OB.length];
                      const img = getFormacionImg(m.moduloId, m.nombre, m.imagenPortadaUrl);
                      const isCompletadoOnboarding = m.status === "completado";
                      const isEnProgresoOnboarding = m.status === "en progreso";
                      return (
                        <div key={m.moduloId}
                          className="rounded-2xl overflow-hidden group transition-all cursor-pointer flex flex-col relative"
                          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: `0 3px 14px -8px ${ac.from}66` }}
                          onClick={() => router.push(`/dashboard/formacion/${m.moduloId}`)}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 10px 28px -10px ${ac.from}99`; e.currentTarget.style.transform = "translateY(-3px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 3px 14px -8px ${ac.from}66`; e.currentTarget.style.transform = "translateY(0)"; }}>

                          {/* Banda superior de color */}
                          <div className="absolute top-0 left-0 right-0 pointer-events-none z-10" style={{ height: 3, background: `linear-gradient(90deg, ${ac.from} 0%, ${ac.to} 100%)` }} />

                          {/* Botón editar admin */}
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/admin?tab=formaciones&edit=${m.moduloId}`); }}
                              className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                              style={{
                                background: `linear-gradient(135deg, ${ac.from} 0%, ${ac.to} 100%)`,
                                color: "#fff",
                                boxShadow: `0 4px 12px -3px ${ac.from}88`,
                              }}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Editar
                            </button>
                          )}

                          {/* Imagen */}
                          <div className="relative overflow-hidden aspect-[16/10]">
                            {img ? (
                              <img src={img} alt={m.nombre}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                            ) : (
                              <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1B3F7E 0%, #2A5298 100%)" }} />
                            )}

                            {/* Check verde si completado (esquina superior izquierda) */}
                            {isCompletadoOnboarding && (
                              <div className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: "var(--exito, #16a34a)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Info debajo de la imagen */}
                          <div className="p-4 flex flex-col flex-1 gap-2">
                            {/* Fila: tipo (chip) + duración */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                style={{ background: `${ac.from}1a`, color: ac.from }}>
                                {isCompletadoOnboarding ? "Completado" : isEnProgresoOnboarding ? "En curso" : "Onboarding"}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--texto-muted)" }}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <circle cx="12" cy="12" r="10" />
                                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                                </svg>
                                {m.duracion}
                              </span>
                            </div>

                            {/* Título */}
                            <h3 className="text-base font-bold leading-snug line-clamp-2"
                              style={{ color: "var(--texto-primario)", minHeight: "2.6em" }}>
                              {m.nombre}
                            </h3>

                            {/* Barra de progreso si hay progreso */}
                            {(isEnProgresoOnboarding || isCompletadoOnboarding) && (
                              <div className="flex items-center gap-2 mt-auto pt-2">
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--gris-borde)" }}>
                                  <div className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${m.porcentaje}%`, background: `linear-gradient(90deg, ${ac.from} 0%, ${ac.to} 100%)`, boxShadow: `0 0 8px ${ac.to}88` }} />
                                </div>
                                <span className="text-[11px] font-bold tabular-nums" style={{ color: ac.from }}>
                                  {m.porcentaje}%
                                </span>
                              </div>
                            )}

                            {/* Botón certificado si completado */}
                            {isCompletadoOnboarding && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <OnboardingCertificadoBtn modulo={m} />
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      });
                    })()}
                    </div>
                  )}
                </section>
              );
            })()}

            {/* ── Formación continua heading ───────────────────────────── */}
            <div className="mb-10 flex items-center gap-3">
              <span aria-hidden style={{ display: "inline-block", width: 6, height: "1.3em", borderRadius: 999, background: "linear-gradient(180deg, #4338CA 0%, #0EA5E9 100%)", boxShadow: "0 2px 8px rgba(14,165,233,0.35)" }} />
              <h2 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                Formación continua
              </h2>
            </div>

            {/* ── Continue Learning card — gradiente lleno colorido ─────── */}
            {continuar && (
              <div
                className="w-full rounded-3xl flex flex-col sm:flex-row items-stretch overflow-hidden relative transition-transform hover:-translate-y-1 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #4338CA 0%, #7C3AED 50%, #0EA5E9 100%)",
                  marginBottom: "2.5rem",
                  boxShadow: "0 18px 40px -14px rgba(67,56,202,0.6)",
                }}
                onClick={() => router.push(`/dashboard/formacion/${continuar.moduloId}`)}
              >
                {/* Halos decorativos */}
                <div style={{ position: "absolute", top: -80, right: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                <div style={{ position: "absolute", bottom: -60, left: "30%", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

                {(() => {
                  const img = getFormacionImg(continuar.moduloId, continuar.nombre, continuar.imagenPortadaUrl);
                  return img ? (
                    <div className="w-full sm:w-56 h-40 sm:h-auto shrink-0 relative overflow-hidden">
                      <img src={img} alt={continuar.nombre} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(67,56,202,0.5), rgba(14,165,233,0.3))" }} />
                    </div>
                  ) : null;
                })()}
                <div className="relative z-10 flex-1 px-6 py-5 flex flex-col justify-center gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full inline-block mb-2"
                      style={{ background: "rgba(255,255,255,0.22)", color: "#fff", backdropFilter: "blur(8px)" }}>
                      Continuar aprendiendo
                    </span>
                    <h2 className="text-2xl font-bold leading-snug text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                      {continuar.nombre}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-xs h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.22)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${continuar.porcentaje}%`, background: "linear-gradient(90deg, #FFFFFF 0%, #67E8F9 100%)", boxShadow: "0 0 10px rgba(255,255,255,0.5)" }} />
                    </div>
                    <span className="text-sm font-bold shrink-0 text-white tabular-nums">
                      {continuar.porcentaje}%
                    </span>
                  </div>
                </div>
                <div className="relative z-10 px-6 py-5 flex items-center shrink-0">
                  <span
                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2"
                    style={{ background: "rgba(255,255,255,0.95)", color: "#4338CA", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
                  >
                    Continuar
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            )}

          {/* ── Grid de módulos (2 columnas estilo curso) ──────────────── */}
          {modulosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {modulosFiltrados.map((m, idx) => (
                <CourseCard key={m.moduloId} m={m} idx={idx} isAdmin={isAdmin} router={router} />
              ))}
            </div>
          )}

          {/* ── Estado vacío ─────────────────────────────────────────── */}
          {modulosFiltrados.length === 0 && !hayFiltrosActivos && (
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

// ── Pill de filtro ────────────────────────────────────────────────────────────
function PillFiltro({ label, active, onClick, count }: {
  label: string; active: boolean; onClick: () => void; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
      style={
        active
          ? { background: "var(--azul-egm)", color: "#ffffff", borderColor: "var(--azul-egm)" }
          : { background: "var(--gris-superficie)", color: "var(--texto-muted)", borderColor: "var(--gris-borde)" }
      }
    >
      {label}
      <span
        className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
        style={
          active
            ? { background: "rgba(255,255,255,0.25)", color: "#ffffff" }
            : { background: "var(--gris-borde)", color: "var(--texto-muted)" }
        }
      >
        {count}
      </span>
    </button>
  );
}

// ── Botón certificado para onboarding ──────────────────────────────────────────
function OnboardingCertificadoBtn({ modulo }: { modulo: ModuloEnriquecido }) {
  const { usuario } = useAuth();
  const [descargando, setDescargando] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDescargando(true);
    try {
      const url = await obtenerCertificadoModulo(modulo.moduloId);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        setDescargando(false);
        return;
      }
    } catch { /* fallback */ }

    descargarCertificado({
      nombreEmpleado: usuario?.nombre ?? "Empleado",
      apellidosEmpleado: usuario?.apellidos,
      nombreModulo: modulo.nombre,
      tipoModulo: MODULO_TIPO_LABEL[modulo.tipoModulo] ?? modulo.tipoModulo,
      nombreEmpresa: usuario?.nombreEmpresa,
      fechaCompletado: new Date(),
    });
    setDescargando(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={descargando}
      className="w-full py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70"
      style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
      onMouseEnter={(e) => { if (!descargando) e.currentTarget.style.background = "var(--azul-egm-hover)"; }}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
    >
      {descargando ? (
        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {descargando ? "Obteniendo..." : "Descargar certificado"}
    </button>
  );
}
