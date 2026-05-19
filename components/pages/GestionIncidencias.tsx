"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getIncidencias, cambiarEstadoIncidencia } from "@/lib/api/incidencias";
import type { Incidencia } from "@/lib/types/incidencias";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Clock, CheckCircle2, ChevronDown, RefreshCw } from "lucide-react";

// ── Paleta de estados ────────────────────────────────────────────────────────
const ESTADOS = [
  { value: "ABIERTA",  label: "Abierta",  color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", Icon: AlertTriangle },
  { value: "EN_CURSO", label: "En curso", color: "#d97706", bg: "#fef3c7", border: "#fcd34d", Icon: Clock        },
  { value: "CERRADA",  label: "Cerrada",  color: "#16a34a", bg: "#dcfce7", border: "#86efac", Icon: CheckCircle2 },
] as const;

// ── Paleta de prioridad ──────────────────────────────────────────────────────
const PRIORIDAD: Record<string, { label: string; color: string; bg: string; border: string }> = {
  NORMAL:  { label: "Normal",  color: "#4b5563", bg: "#f3f4f6", border: "#d1d5db" },
  CRITICA: { label: "Crítica", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
};

interface Props {
  empresaId?: string | null;
  esSuperadmin?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });

const estadoConf = (v: string) => ESTADOS.find(e => e.value === v) ?? ESTADOS[0];

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 sm:p-5 animate-pulse"
      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg shrink-0" style={{ width: 36, height: 36, background: "var(--gris-borde)" }} />
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <div className="h-3.5 rounded-full w-40" style={{ background: "var(--gris-borde)" }} />
            <div className="h-4 rounded-full w-14" style={{ background: "var(--gris-borde)" }} />
            <div className="h-4 rounded-full w-14" style={{ background: "var(--gris-borde)" }} />
          </div>
          <div className="h-3 rounded-full w-full" style={{ background: "var(--gris-borde)" }} />
          <div className="h-3 rounded-full w-3/4" style={{ background: "var(--gris-borde)" }} />
          <div className="flex gap-4 mt-1">
            <div className="h-3 rounded-full w-24" style={{ background: "var(--gris-borde)" }} />
            <div className="h-3 rounded-full w-20" style={{ background: "var(--gris-borde)" }} />
          </div>
        </div>
        <div className="rounded-lg shrink-0 h-8 w-28" style={{ background: "var(--gris-borde)" }} />
      </div>
    </div>
  );
}

// ── Estado selector ───────────────────────────────────────────────────────────
function EstadoSelector({ incidenciaId, estadoActual, onChange }: {
  incidenciaId: string;
  estadoActual: string;
  onChange: (id: string, estado: string) => void;
}) {
  const conf = estadoConf(estadoActual);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
        style={{
          background: conf.bg,
          color: conf.color,
          border: `1px solid ${conf.border}`,
          cursor: "pointer",
          minWidth: 110,
          justifyContent: "space-between",
          transition: "opacity 0.15s",
        }}
      >
        <span className="flex items-center gap-1.5">
          <conf.Icon size={11} strokeWidth={2.5} />
          {conf.label}
        </span>
        <ChevronDown size={11} strokeWidth={2.5}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden"
              style={{
                background: "var(--blanco)",
                border: "1px solid var(--gris-borde)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                minWidth: 130,
              }}
            >
              {ESTADOS.map(e => (
                <button
                  key={e.value}
                  onClick={() => { onChange(incidenciaId, e.value); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left"
                  style={{
                    color: e.value === estadoActual ? e.color : "var(--texto-primario)",
                    background: e.value === estadoActual ? e.bg : "transparent",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={ev => { if (e.value !== estadoActual) (ev.currentTarget as HTMLButtonElement).style.background = "var(--gris-superficie)"; }}
                  onMouseLeave={ev => { if (e.value !== estadoActual) (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <e.Icon size={12} strokeWidth={2.5} />
                  {e.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Demo data — visible cuando no hay incidencias reales ─────────────────────
const DEMO: Incidencia[] = [
  {
    incidenciaId: "demo-1",
    titulo: "Fallo en el sistema de climatización planta 2",
    descripcion: "Desde el lunes el aire acondicionado de la planta 2 no funciona correctamente, la temperatura supera los 30°C y está afectando al rendimiento del equipo.",
    prioridad: "CRITICA",
    estado: "ABIERTA",
    creadoPor: "usr-demo",
    nombreCreador: "Laura Martínez",
    emailCreador: "laura@empresa.com",
    empresaId: "demo",
    creadoEn: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    actualizadoEn: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    incidenciaId: "demo-2",
    titulo: "Problemas con el acceso al portal de RRHH",
    descripcion: "Varios empleados del departamento de administración no pueden iniciar sesión en el portal interno de RRHH. El error aparece al introducir las credenciales.",
    prioridad: "NORMAL",
    estado: "EN_CURSO",
    creadoPor: "usr-demo2",
    nombreCreador: "Carlos Pérez",
    emailCreador: "carlos@empresa.com",
    empresaId: "demo",
    creadoEn: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    actualizadoEn: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    incidenciaId: "demo-3",
    titulo: "Impresora de recepción sin papel y con error de red",
    descripcion: "La impresora principal de recepción muestra un error de conexión de red y además se ha quedado sin papel. Se ha reportado dos veces sin resolución.",
    prioridad: "NORMAL",
    estado: "CERRADA",
    creadoPor: "usr-demo3",
    nombreCreador: "Ana Gómez",
    emailCreador: "ana@empresa.com",
    empresaId: "demo",
    creadoEn: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    actualizadoEn: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function GestionIncidencias({ empresaId, esSuperadmin }: Props) {
  const queryClient = useQueryClient();
  const [filtro, setFiltro]       = useState<string>("todas");
  const [errorMut, setErrorMut]   = useState<string | null>(null);

  const { data: rawIncidencias = [], isLoading: cargando, isError, refetch } = useQuery<Incidencia[]>({
    queryKey: ["incidencias", empresaId],
    queryFn: () => getIncidencias(empresaId),
    enabled: !!empresaId,
  });

  // Usar demo si no hay datos reales (solo en desarrollo / sin incidencias)
  const esDemo = !cargando && !isError && rawIncidencias.length === 0;
  const incidencias = esDemo ? DEMO : rawIncidencias;

  const handleEstado = async (id: string, nuevoEstado: string) => {
    if (esDemo) return; // no mutamos datos demo
    setErrorMut(null);
    queryClient.setQueryData<Incidencia[]>(["incidencias", empresaId], prev =>
      prev?.map(i => i.incidenciaId === id ? { ...i, estado: nuevoEstado as Incidencia["estado"] } : i) ?? []
    );
    try {
      await cambiarEstadoIncidencia(id, nuevoEstado);
    } catch (e: any) {
      setErrorMut(e.message || "Error al cambiar el estado");
      refetch();
    }
  };

  const filtradas = filtro === "todas"
    ? incidencias
    : incidencias.filter(i => i.estado === filtro);

  // Contadores por estado
  const contadores = ESTADOS.reduce((acc, e) => {
    acc[e.value] = incidencias.filter(i => i.estado === e.value).length;
    return acc;
  }, {} as Record<string, number>);

  const totalPendientes = (contadores["ABIERTA"] ?? 0) + (contadores["EN_CURSO"] ?? 0);

  return (
    <div>
      {/* ── Título ── */}
      <div className="mb-6 sm:mb-8">
        <h1 style={{
          fontFamily: "var(--font-raleway), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)",
          color: "var(--texto-primario)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          Incidencias
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {cargando
            ? "Cargando incidencias…"
            : isError
            ? "Error al cargar"
            : esDemo
            ? <span style={{ color: "var(--texto-muted)" }}>Vista previa · <span style={{ color: "#d97706" }}>datos de ejemplo</span></span>
            : incidencias.length === 0
            ? "No hay incidencias registradas"
            : <>
                {incidencias.length} incidencia{incidencias.length !== 1 ? "s" : ""}
                {totalPendientes > 0 && (
                  <span className="font-semibold" style={{ color: "#dc2626" }}>
                    {" · "}{totalPendientes} pendiente{totalPendientes !== 1 ? "s" : ""}
                  </span>
                )}
              </>
          }
        </p>
      </div>

      {/* ── Filtros ── */}
      {!cargando && !isError && (
        <div className="mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            {/* Todas */}
            <motion.button
              onClick={() => setFiltro("todas")}
              className="relative text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none whitespace-nowrap shrink-0"
              style={{ color: filtro === "todas" ? "#fff" : "var(--texto-muted)", transition: "color 0.15s ease", zIndex: 1, cursor: "pointer" }}
              whileTap={{ scale: 0.94 }}
            >
              {filtro === "todas" && (
                <motion.span layoutId="inc-filtro-pill" className="absolute inset-0 rounded-lg"
                  style={{ background: "var(--azul-egm)", zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }} />
              )}
              Todas {incidencias.length > 0 && `(${incidencias.length})`}
            </motion.button>

            {ESTADOS.map(e => (
              <motion.button
                key={e.value}
                onClick={() => setFiltro(e.value)}
                className="relative text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none whitespace-nowrap shrink-0"
                style={{ color: filtro === e.value ? e.color : "var(--texto-muted)", transition: "color 0.15s ease", zIndex: 1, cursor: "pointer" }}
                whileTap={{ scale: 0.94 }}
              >
                {filtro === e.value && (
                  <motion.span layoutId="inc-filtro-pill" className="absolute inset-0 rounded-lg"
                    style={{ background: e.bg, border: `1px solid ${e.border}`, zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }} />
                )}
                {e.label}{contadores[e.value] > 0 ? ` (${contadores[e.value]})` : ""}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ── Error de mutación ── */}
      <AnimatePresence>
        {errorMut && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-4 text-sm font-semibold"
            style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}
          >
            <span>{errorMut}</span>
            <button onClick={() => setErrorMut(null)} style={{ cursor: "pointer", opacity: 0.7 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contenido ── */}
      {cargando ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>

      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl text-center"
          style={{ background: "var(--blanco)", border: "1px solid #fca5a5" }}>
          <div className="rounded-2xl p-4" style={{ background: "#fee2e2" }}>
            <AlertTriangle size={28} style={{ color: "#dc2626" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--texto-primario)" }}>No se pudieron cargar las incidencias</p>
            <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>Comprueba tu conexión e inténtalo de nuevo</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ background: "#dc2626", color: "white", cursor: "pointer" }}
          >
            <RefreshCw size={13} />
            Reintentar
          </button>
        </div>

      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 rounded-2xl text-center"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          <div className="rounded-2xl p-5" style={{ background: "var(--gris-superficie)" }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} style={{ color: "var(--texto-muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-bold text-base" style={{ color: "var(--texto-primario)" }}>
              {filtro === "todas"
                ? "Todavía no hay incidencias"
                : `Sin incidencias ${ESTADOS.find(e => e.value === filtro)?.label.toLowerCase()}`}
            </p>
            <p className="text-sm" style={{ color: "var(--texto-muted)", maxWidth: 280, margin: "0 auto" }}>
              {filtro === "todas"
                ? "Los empleados aún no han reportado ninguna incidencia"
                : "Prueba a cambiar el filtro de estado para ver otras incidencias"}
            </p>
          </div>
          {filtro !== "todas" && (
            <button
              onClick={() => setFiltro("todas")}
              className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl"
              style={{ background: "var(--azul-egm)", color: "white", cursor: "pointer" }}
            >
              Ver todas las incidencias
            </button>
          )}
        </div>

      ) : (
        <div className="flex flex-col gap-2.5">
          {filtradas.map(inc => {
            const est      = estadoConf(inc.estado);
            const esCritica = inc.prioridad === "CRITICA";

            return (
              <div
                key={inc.incidenciaId}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--blanco)",
                  border: "1px solid var(--gris-borde)",
                  borderLeft: esCritica ? `3px solid #dc2626` : `3px solid ${est.border}`,
                  transition: "box-shadow 0.18s, border-color 0.18s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}
              >
                {/* Fila principal */}
                <div className="flex items-start gap-4 px-5 pt-4 pb-3">

                  {/* Icono estado */}
                  <div className="rounded-xl shrink-0 flex items-center justify-center"
                    style={{ width: 40, height: 40, background: est.bg, color: est.color, border: `1px solid ${est.border}`, marginTop: 1 }}>
                    <est.Icon size={18} strokeWidth={2} />
                  </div>

                  {/* Contenido principal */}
                  <div className="flex-1 min-w-0">
                    {/* Título + badge crítica */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold leading-snug" style={{ color: "var(--texto-primario)" }}>
                        {inc.titulo}
                      </span>
                      {esCritica && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                          <AlertTriangle size={9} strokeWidth={2.5} />
                          Crítica
                        </span>
                      )}
                    </div>

                    {/* Descripción — color explícito para no heredar estilos link */}
                    <p className="text-xs line-clamp-2" style={{ color: "#6b7280", lineHeight: 1.6, fontStyle: "normal", textDecoration: "none" }}>
                      {inc.descripcion}
                    </p>
                  </div>

                  {/* Selector — visible en sm+ en la misma fila */}
                  <div className="hidden sm:block shrink-0">
                    <EstadoSelector
                      incidenciaId={inc.incidenciaId}
                      estadoActual={inc.estado}
                      onChange={handleEstado}
                    />
                  </div>
                </div>

                {/* Fila meta + selector móvil */}
                <div className="flex items-center justify-between gap-3 px-5 pb-3.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]" style={{ color: "#9ca3af" }}>
                    <span>
                      Por <strong style={{ color: "var(--texto-primario)", fontWeight: 600 }}>{inc.nombreCreador}</strong>
                    </span>
                    {esSuperadmin && inc.nombreEmpresa && (
                      <span>· <strong style={{ color: "var(--texto-primario)", fontWeight: 600 }}>{inc.nombreEmpresa}</strong></span>
                    )}
                    <span>{formatFecha(inc.creadoEn)}</span>
                  </div>

                  {/* Selector solo en móvil */}
                  <div className="sm:hidden shrink-0">
                    <EstadoSelector
                      incidenciaId={inc.incidenciaId}
                      estadoActual={inc.estado}
                      onChange={handleEstado}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
