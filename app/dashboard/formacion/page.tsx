"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import DashboardHero from "@/components/ui/DashboardHero";

// Mock data para demostrar el diseño cuando el backend no devuelve módulos
const MOCK_MODULES: ModuloConProgreso[] = [
  { moduloId: "1", nombre: "Incorporación y Bienvenida a Atalayas",       descripcion: "Conoce la empresa, sus valores y procedimientos de incorporación.", tipoModulo: "IDENTIDAD",  orden: 1, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "2", nombre: "Comunicación Efectiva en el Trabajo",          descripcion: "Estrategias para mejorar la comunicación interna y externa.",        tipoModulo: "DESARROLLO", orden: 2, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "3", nombre: "Introducción a Herramientas Digitales",        descripcion: "Uso de las plataformas digitales del área empresarial.",            tipoModulo: "BASICA",     orden: 3, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "4", nombre: "Negociación y Habilidades Directivas",         descripcion: "Técnicas avanzadas de negociación para entornos empresariales.",      tipoModulo: "ESPECIFICA", orden: 4, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "5", nombre: "Ciberseguridad y Protección de Datos",         descripcion: "Buenas prácticas de seguridad informática y RGPD.",                   tipoModulo: "BASICA",     orden: 5, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "6", nombre: "Gestión de Proyectos con Metodologías Ágiles", descripcion: "Scrum, Kanban y otras metodologías para gestionar tu equipo.",        tipoModulo: "DESARROLLO", orden: 6, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "7", nombre: "Diversidad e Inclusión en la Empresa",         descripcion: "Cultura inclusiva y gestión de la diversidad en el entorno laboral.", tipoModulo: "COMUNIDAD",  orden: 7, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
];

// Gradientes por tipo de módulo para las miniaturas (fallback)
const TIPO_GRADIENT: Record<string, string> = {
  IDENTIDAD:   "linear-gradient(135deg, #1B3F7E 0%, #2A5298 100%)",
  BASICA:      "linear-gradient(135deg, #0D1B2E 0%, #1B3F7E 100%)",
  ESPECIFICA:  "linear-gradient(135deg, #8B9A2D 0%, #A3B535 100%)",
  DESARROLLO:  "linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)",
  RECOMPENSAS: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
  COMUNIDAD:   "linear-gradient(135deg, #0f766e 0%, #2dd4bf 100%)",
};

// Imágenes por moduloId (mock) y por keywords del nombre (módulos reales)
const FORMACION_IMG_BY_ID: Record<string, string> = {
  "1": "/background-formacion-empleado.webp",
  "2": "/comunicacion-trabajo.webp",
  "3": "/herramientas-digitales.webp",
  "4": "/negociacion-habilidades.webp",
  "5": "/ciberseguridad-datos.webp",
  "6": "/metodologias-agiles.webp",
  "7": "/diversidad.webp",
};

const FORMACION_IMG_BY_NAME: Array<{ keywords: string[]; imagen: string }> = [
  { keywords: ["incorporac", "bienvenid"],              imagen: "/background-formacion-empleado.webp" },
  { keywords: ["comunicac", "efectiva"],                imagen: "/comunicacion-trabajo.webp" },
  { keywords: ["herramienta", "digital", "colaborat"],  imagen: "/herramientas-digitales.webp" },
  { keywords: ["negociaci", "habilidad", "directiv"],   imagen: "/negociacion-habilidades.webp" },
  { keywords: ["cibersegur", "datos", "rgpd"],          imagen: "/ciberseguridad-datos.webp" },
  { keywords: ["metodolog", "agil", "scrum", "kanban"], imagen: "/metodologias-agiles.webp" },
  { keywords: ["diversidad", "inclusi"],                imagen: "/diversidad.webp" },
];

function getFormacionImg(moduloId: string, nombre: string, imagenPortadaUrl?: string | null): string | undefined {
  if (imagenPortadaUrl) return imagenPortadaUrl;
  if (FORMACION_IMG_BY_ID[moduloId]) return FORMACION_IMG_BY_ID[moduloId];
  const lower = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return FORMACION_IMG_BY_NAME.find((e) => e.keywords.some((kw) => lower.includes(kw)))?.imagen;
}

type ModuloEnriquecido = ModuloConProgreso & { duracion: string; porcentaje: number };

function leerPorcentajeLS(moduloId: string): number | null {
  try {
    const raw = localStorage.getItem(`egm_modulo_${moduloId}`);
    if (!raw) return null;
    const { completados, total } = JSON.parse(raw) as { completados: string[]; total?: number };
    const totalItems = total ?? 5; // fallback para datos legacy
    if (totalItems === 0) return 0;
    return Math.min(100, Math.round((completados.length / totalItems) * 100));
  } catch { return null; }
}

const DURACION_POR_TIPO: Record<string, string> = {
  IDENTIDAD:    "20 min",
  BASICA:       "35 min",
  ESPECIFICA:   "50 min",
  DESARROLLO:   "45 min",
  COMUNIDAD:    "25 min",
  RECOMPENSAS:  "15 min",
  CUMPLIMIENTO: "30 min",
  LIDERAZGO:    "45 min",
  TECNICO:      "40 min",
  SOFT_SKILLS:  "35 min",
};

// Tipos que pertenecen al bloque "Onboarding" — el resto va a "Formación continua"
const TIPOS_ONBOARDING = new Set(["ONBOARDING"]);

function enriquecer(m: ModuloConProgreso): ModuloEnriquecido {
  const pctLS = leerPorcentajeLS(m.moduloId);
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
  { value: "todos",       label: "Todos" },
  { value: "pendiente",   label: "Pendiente" },
  { value: "en progreso", label: "En progreso" },
  { value: "completado",  label: "Completado" },
];

export default function FormacionPage() {
  const router      = useRouter();
  const { usuario } = useAuth();

  const [modules,    setModules]    = useState<ModuloEnriquecido[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [busqueda,     setBusqueda]     = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [filtroTipo,   setFiltroTipo]   = useState<string>("todos");
  const [filtroOpen,   setFiltroOpen]   = useState(false);
  const [gestionOpen,  setGestionOpen]  = useState(false);
  const filtroRef  = useRef<HTMLDivElement>(null);
  const gestionRef = useRef<HTMLDivElement>(null);

  // Cierra los desplegables al hacer clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) {
        setFiltroOpen(false);
      }
      if (gestionRef.current && !gestionRef.current.contains(e.target as Node)) {
        setGestionOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    getModulosConProgreso()
      .then((data) => {
        const sorted = data.sort((a, b) => a.orden - b.orden);
        setModules(sorted.length > 0 ? sorted.map(enriquecer) : MOCK_MODULES.map(enriquecer));
      })
      .catch(() => setModules(MOCK_MODULES.map(enriquecer)))
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

      <div className="px-10 lg:px-16 pt-14 pb-16">
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
                  <div>
                    <h2 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                      Onboarding
                    </h2>
                    <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                      Tu programa de incorporación a la empresa
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {modulosOnboarding.length > 0 && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full"
                        style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                        {modulosOnboarding.filter((m) => m.status === "completado").length} / {modulosOnboarding.length} completados
                      </span>
                    )}
                  {/* Buscador */}
                  <div className="relative" style={{ width: "260px" }}>
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
                        border:     "1px solid var(--gris-borde)",
                        color:      "var(--texto-primario)",
                        fontSize:   "14px",
                        height:     "38px",
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
                        todos:        { bg: active ? "var(--azul-egm)"        : "var(--blanco)",          color: active ? "#fff"                  : "var(--texto-muted)",   border: active ? "var(--azul-egm)"        : "var(--gris-borde)" },
                        pendiente:    { bg: active ? "var(--gris-superficie)" : "var(--blanco)",          color: active ? "var(--texto-primario)"  : "var(--texto-muted)",   border: active ? "var(--texto-primario)"  : "var(--gris-borde)" },
                        "en progreso":{ bg: active ? "var(--azul-egm-light)"  : "var(--blanco)",          color: active ? "var(--azul-egm)"        : "var(--texto-muted)",   border: active ? "var(--azul-egm)"        : "var(--gris-borde)" },
                        completado:   { bg: active ? "var(--exito-light)"     : "var(--blanco)",          color: active ? "var(--exito)"           : "var(--texto-muted)",   border: active ? "var(--exito)"           : "var(--gris-borde)" },
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
                        background:  filtroOpen || filtroTipo !== "todos" ? "var(--azul-egm)" : "var(--blanco)",
                        borderColor: filtroOpen || filtroTipo !== "todos" ? "var(--azul-egm)" : "var(--gris-borde)",
                        color:       filtroOpen || filtroTipo !== "todos" ? "#ffffff" : "var(--texto-primario)",
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
                          border:     "1px solid var(--gris-borde)",
                          width:      "320px",
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

                  {/* Botón gestión — solo admin */}
                  {isAdmin && (
                    <div className="relative" ref={gestionRef}>
                      <button
                        onClick={() => setGestionOpen((v) => !v)}
                        title="Gestión de módulos"
                        className="flex items-center justify-center rounded-xl border transition-colors"
                        style={{
                          width: "38px", height: "38px",
                          background:  gestionOpen ? "var(--azul-egm)" : "var(--blanco)",
                          borderColor: gestionOpen ? "var(--azul-egm)" : "var(--gris-borde)",
                          color:       gestionOpen ? "#ffffff" : "var(--texto-primario)",
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>

                      {gestionOpen && (
                        <div
                          className="absolute right-0 top-full mt-2 z-50 rounded-2xl shadow-xl overflow-hidden"
                          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", minWidth: "200px" }}
                        >
                          <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Gestión de módulos</p>
                          </div>
                          <div className="p-1.5 flex flex-col gap-0.5">
                            <button
                              onClick={() => { setGestionOpen(false); router.push("/dashboard/admin/modulos/crear"); }}
                              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
                              style={{ color: "var(--texto-primario)" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-pagina)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                              <span className="font-medium">Nuevo módulo</span>
                            </button>
                            <button
                              onClick={() => { setGestionOpen(false); router.push("/dashboard/admin?tab=formaciones"); }}
                              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
                              style={{ color: "var(--texto-primario)" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-pagina)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                              </div>
                              <span className="font-medium">Gestionar módulos</span>
                            </button>
                          </div>
                        </div>
                      )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {modulosOnboarding.map((m) => {
                      const img = getFormacionImg(m.moduloId, m.nombre, m.imagenPortadaUrl);
                      const pct = m.porcentaje;
                      const statusColor = m.status === "completado" ? "var(--exito)" : m.status === "en progreso" ? "var(--azul-egm)" : "var(--texto-muted)";
                      const statusLabel = m.status === "completado" ? "Completado" : m.status === "en progreso" ? "En progreso" : "Pendiente";
                      return (
                        <div key={m.moduloId}
                          className="rounded-2xl overflow-hidden cursor-pointer group transition-all"
                          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                          onClick={() => router.push(`/dashboard/formacion/${m.moduloId}`)}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                          {/* Imagen */}
                          <div className="relative overflow-hidden" style={{ height: "140px" }}>
                            {img ? (
                              <img src={img} alt={m.nombre}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                style={{ objectPosition: "center 30%" }} />
                            ) : (
                              <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #1B3F7E 0%, #2A5298 100%)" }} />
                            )}
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
                            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                              style={{ background: "rgba(163,181,53,0.85)", color: "#fff" }}>
                              Onboarding
                            </span>
                          </div>
                          {/* Info */}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-sm font-bold leading-snug flex-1" style={{ color: "var(--texto-primario)" }}>{m.nombre}</h3>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                                style={{ background: m.status === "completado" ? "var(--exito-light)" : m.status === "en progreso" ? "var(--azul-egm-light)" : "var(--gris-superficie)", color: statusColor }}>
                                {statusLabel}
                              </span>
                            </div>
                            {m.descripcion && (
                              <p className="text-xs mb-4 line-clamp-2" style={{ color: "var(--texto-muted)" }}>{m.descripcion}</p>
                            )}
                            {/* Progreso */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--gris-borde)" }}>
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--azul-egm), var(--verde-oliva))" }} />
                              </div>
                              <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--texto-muted)" }}>{pct}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })()}

          {/* ── Formación continua heading ───────────────────────────── */}
          <div className="mb-10">
            <h2 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Formación continua
            </h2>
          </div>

          {/* ── Continue Learning card ───────────────────────────────── */}
          {continuar && (
            <div
              className="w-full rounded-2xl flex flex-col sm:flex-row items-stretch overflow-hidden"
              style={{ border: "2px solid var(--azul-egm)", background: "var(--blanco)", marginBottom: "2.5rem" }}
            >
              {(() => {
                const img = getFormacionImg(continuar.moduloId, continuar.nombre, continuar.imagenPortadaUrl);
                return img ? (
                  <div className="w-full sm:w-48 h-36 sm:h-auto shrink-0 relative overflow-hidden">
                    <img src={img} alt={continuar.nombre} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "rgba(10,20,40,0.25)" }} />
                  </div>
                ) : (
                  <div className="w-full sm:w-48 h-36 sm:h-auto shrink-0"
                    style={{ background: TIPO_GRADIENT[continuar.tipoModulo] }} />
                );
              })()}
              <div className="flex-1 px-6 py-5 flex flex-col justify-center gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--azul-egm)" }}>
                    Continuar aprendiendo
                  </p>
                  <h2 className="text-xl font-bold leading-snug" style={{ color: "var(--texto-primario)" }}>
                    {continuar.nombre}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-xs h-2 rounded-full overflow-hidden" style={{ background: "var(--gris-borde)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${continuar.porcentaje}%`, background: "var(--azul-egm)" }} />
                  </div>
                  <span className="text-sm font-semibold shrink-0" style={{ color: "var(--azul-egm)" }}>
                    {continuar.porcentaje}%
                  </span>
                  <span className="text-sm shrink-0 px-2 py-0.5 rounded-full font-medium" style={{ background: "#FFF3CD", color: "#856404" }}>
                    En progreso
                  </span>
                </div>
              </div>
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
          {modulosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {modulosFiltrados.map((m) => (
                <CourseCard key={m.moduloId} m={m} isAdmin={isAdmin} router={router} />
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

          {/* Sin resultados con filtros activos */}
          {modulosFiltrados.length === 0 && hayFiltrosActivos && (
            <div
              className="rounded-xl px-6 py-14 text-center flex flex-col items-center gap-3"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
            >
              <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--texto-muted)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
              </svg>
              <p className="text-base font-medium" style={{ color: "var(--texto-primario)" }}>
                Sin resultados
              </p>
              <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                Prueba con otros filtros o{" "}
                <button
                  onClick={() => { setBusqueda(""); setFiltroEstado("todos"); setFiltroTipo("todos"); }}
                  className="underline font-medium"
                  style={{ color: "var(--azul-egm)" }}
                >
                  limpia la búsqueda
                </button>
              </p>
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
      {(() => {
        const img = getFormacionImg(m.moduloId, m.nombre, m.imagenPortadaUrl);
        return img ? (
          <div className="w-full h-40 relative overflow-hidden">
            <img src={img} alt={m.nombre} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(10,20,40,0.30)" }} />
          </div>
        ) : (
          <div className="w-full h-40" style={{ background: TIPO_GRADIENT[m.tipoModulo] }} />
        );
      })()}

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
        <div className="flex items-center gap-2 flex-wrap">
          {MODULO_TIPO_LABEL[m.tipoModulo] && (
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded self-start"
              style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
            >
              {MODULO_TIPO_LABEL[m.tipoModulo]}
            </span>
          )}
          {m.esEspecializadoIa && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded self-start"
              style={{ background: "#f3e8ff", color: "#7c3aed" }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.09 7.26L22 12l-7.91 2.74L12 22l-2.09-7.26L2 12l7.91-2.74z" />
              </svg>
              IA
            </span>
          )}
        </div>

        {/* CTA button */}
        <button
          className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          onClick={() => router.push(`/dashboard/formacion/${m.moduloId}`)}
          style={
            isCompletado
              ? { background: "#D1FAE5", color: "#065F46", border: "1px solid #6ee7b7" }
              : isEnProgreso
              ? { background: "var(--blanco)", border: "1px solid var(--gris-borde)", color: "var(--texto-primario)" }
              : { background: "var(--azul-egm)", color: "var(--blanco)" }
          }
          onMouseEnter={(e) => {
            if (isCompletado) e.currentTarget.style.background = "#bbf7d0";
            else if (isEnProgreso) e.currentTarget.style.background = "var(--gris-superficie)";
            else e.currentTarget.style.background = "var(--azul-egm-hover)";
          }}
          onMouseLeave={(e) => {
            if (isCompletado) e.currentTarget.style.background = "#D1FAE5";
            else if (isEnProgreso) e.currentTarget.style.background = "var(--blanco)";
            else e.currentTarget.style.background = "var(--azul-egm)";
          }}
        >
          {isCompletado && (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {isCompletado ? "Completado — Revisar" : isEnProgreso ? "Continuar" : "Empezar"}
        </button>
      </div>
    </div>
  );
}
