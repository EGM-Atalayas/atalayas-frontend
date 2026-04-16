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
  { moduloId: "3", nombre: "Introducción a Herramientas Digitales",        descripcion: "Uso de las plataformas digitales del parque empresarial.",            tipoModulo: "BASICA",     orden: 3, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "4", nombre: "Negociación y Habilidades Directivas",         descripcion: "Técnicas avanzadas de negociación para entornos empresariales.",      tipoModulo: "ESPECIFICA", orden: 4, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "5", nombre: "Ciberseguridad y Protección de Datos",         descripcion: "Buenas prácticas de seguridad informática y RGPD.",                   tipoModulo: "BASICA",     orden: 5, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "6", nombre: "Gestión de Proyectos con Metodologías Ágiles", descripcion: "Scrum, Kanban y otras metodologías para gestionar tu equipo.",        tipoModulo: "DESARROLLO", orden: 6, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
  { moduloId: "7", nombre: "Diversidad e Inclusión en la Empresa",         descripcion: "Cultura inclusiva y gestión de la diversidad en el entorno laboral.", tipoModulo: "COMUNIDAD",  orden: 7, activo: true, empresaId: null, esEspecializadoIa: false, creadoEn: "", actualizadoEn: "", status: "pendiente" },
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

const TOTAL_ITEMS_POR_MODULO = 5; // igual que en la página de detalle

function leerPorcentajeLS(moduloId: string): number | null {
  try {
    const raw = localStorage.getItem(`egm_modulo_${moduloId}`);
    if (!raw) return null;
    const { completados } = JSON.parse(raw) as { completados: string[] };
    return Math.round((completados.length / TOTAL_ITEMS_POR_MODULO) * 100);
  } catch { return null; }
}

function enriquecer(m: ModuloConProgreso): ModuloEnriquecido {
  const pctLS = leerPorcentajeLS(m.moduloId);
  const porcentaje = pctLS !== null ? pctLS
    : m.status === "completado" ? 100 : m.status === "en progreso" ? 50 : 0;
  const status = pctLS !== null
    ? (pctLS >= 100 ? "completado" : pctLS > 0 ? "en progreso" : "pendiente")
    : m.status;
  return { ...m, status, duracion: "—", porcentaje };
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
  const [soloIA,       setSoloIA]       = useState(false);
  const [filtroOpen,   setFiltroOpen]   = useState(false);
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
    getModulosConProgreso()
      .then((data) => {
        const sorted = data.sort((a, b) => a.orden - b.orden);
        setModules(sorted.length > 0 ? sorted.map(enriquecer) : MOCK_MODULES.map(enriquecer));
      })
      .catch(() => setModules(MOCK_MODULES.map(enriquecer)))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = usuario?.codigoRol !== "ROLE_EMPLEADO" && usuario?.codigoRol !== "INVITADO";

  // Tipos únicos disponibles en los módulos cargados
  const tiposDisponibles = Array.from(new Set(modules.map((m) => m.tipoModulo)));

  // Módulo "continuar": el primero en progreso (según progreso real de localStorage)
  const continuar = modules.find((m) => m.status === "en progreso" && m.porcentaje < 100);

  const hayFiltrosActivos =
    busqueda !== "" || filtroEstado !== "todos" || filtroTipo !== "todos" || soloIA;

  // ── Aplicar filtros ───────────────────────────────────────────────────────
  const modulosFiltrados = modules.filter((m) => {
    if (busqueda && !m.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroEstado !== "todos" && m.status !== filtroEstado) return false;
    if (filtroTipo !== "todos" && m.tipoModulo !== filtroTipo) return false;
    if (soloIA && !m.esEspecializadoIa) return false;
    return true;
  });

  return (
    <div className="w-full">
      <DashboardHero prefijo="Centro de " titulo="Formación." imagenFondo="/background-formacion-empleado.jpg" />

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
          {/* ── Barra de búsqueda + filtros ──────────────────────────── */}
          <div className="flex items-center justify-end gap-2 mb-10">
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

            {/* Botón Filtros con desplegable */}
            <div className="relative" ref={filtroRef}>
              <button
                onClick={() => setFiltroOpen((v) => !v)}
                className="flex items-center gap-2 px-3.5 rounded-xl text-sm font-semibold border transition-colors"
                style={{
                  background:  filtroOpen || hayFiltrosActivos ? "var(--azul-egm)" : "var(--blanco)",
                  borderColor: filtroOpen || hayFiltrosActivos ? "var(--azul-egm)" : "var(--gris-borde)",
                  color:       filtroOpen || hayFiltrosActivos ? "#ffffff" : "var(--texto-primario)",
                  height:      "38px",
                }}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Filtros
                {hayFiltrosActivos && (
                  <span
                    className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.3)" }}
                  >
                    {(filtroEstado !== "todos" ? 1 : 0) + (filtroTipo !== "todos" ? 1 : 0) + (soloIA ? 1 : 0)}
                  </span>
                )}
                <svg
                  className={`w-3 h-3 shrink-0 transition-transform duration-200 ${filtroOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
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
                  {/* Estado */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--texto-muted)" }}>
                      Estado
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ESTADO_LABELS.map(({ value, label }) => (
                        <PillFiltro
                          key={value}
                          label={label}
                          active={filtroEstado === value}
                          onClick={() => setFiltroEstado(value)}
                          count={value === "todos" ? modules.length : modules.filter((m) => m.status === value).length}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tipo */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--texto-muted)" }}>
                      Tipo de módulo
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <PillFiltro label="Todos" active={filtroTipo === "todos"} onClick={() => setFiltroTipo("todos")} count={modules.length} />
                      {tiposDisponibles.map((tipo) => (
                        <PillFiltro
                          key={tipo}
                          label={MODULO_TIPO_LABEL[tipo] ?? tipo}
                          active={filtroTipo === tipo}
                          onClick={() => setFiltroTipo(tipo)}
                          count={modules.filter((m) => m.tipoModulo === tipo).length}
                        />
                      ))}
                    </div>
                  </div>

                  {/* IA */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--texto-muted)" }}>
                      Especialización
                    </p>
                    <button
                      onClick={() => setSoloIA((v) => !v)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                      style={
                        soloIA
                          ? { background: "#7c3aed", color: "#ffffff", borderColor: "#7c3aed" }
                          : { background: "var(--gris-superficie)", color: "var(--texto-muted)", borderColor: "var(--gris-borde)" }
                      }
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Solo especializados IA
                    </button>
                  </div>

                  {/* Limpiar */}
                  {hayFiltrosActivos && (
                    <button
                      onClick={() => { setFiltroEstado("todos"); setFiltroTipo("todos"); setSoloIA(false); }}
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
          </div>

          {/* ── Continue Learning card ───────────────────────────────── */}
          {continuar && (
            <div
              className="w-full rounded-2xl flex flex-col sm:flex-row items-stretch overflow-hidden"
              style={{ border: "2px solid var(--azul-egm)", background: "var(--blanco)", marginBottom: "2.5rem" }}
            >
              <div
                className="w-full sm:w-48 h-36 sm:h-auto shrink-0"
                style={{ background: TIPO_GRADIENT[continuar.tipoModulo] }}
              />
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
                  onClick={() => { setBusqueda(""); setFiltroEstado("todos"); setFiltroTipo("todos"); setSoloIA(false); }}
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
