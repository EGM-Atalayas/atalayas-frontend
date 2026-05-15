"use client";

import React, { useEffect, useState, useRef, useMemo, useTransition, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { getModulos } from "@/lib/api/modulos";
import { getProgresoEmpresa } from "@/lib/api/progreso";
import { QK } from "@/lib/queryKeys";
import { BarChart3, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Eye, EyeOff, FileText, GraduationCap, LibraryBig, Megaphone, Plus, RefreshCw, Search, SlidersHorizontal, TriangleAlert, Upload, Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import Grainient from "@/components/ui/Grainient";
import FormAnuncio from "@/components/ui/FormAnuncio";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import type { Modulo } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL, type ModuloTipo } from "@/lib/types/modulos";
import { apiFetch, API_URL } from "@/lib/api";
import DashboardHero from "@/components/ui/DashboardHero";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList,
} from "recharts";
import { getEstadisticasAdminEmpresa, type EstadisticasEmpresaResponse, type FiltrosEstadisticas } from "@/lib/api/estadisticas";
import { exportStats, type ExportFormat, type StatsSection } from "@/lib/utils/statsExport";
import GestionIncidencias from "@/components/pages/GestionIncidencias";
import { DocumentosAdminTab } from "@/components/documentos/DocumentosAdminTab";
import ExcelJS from "exceljs";

const EMPTY_ANUNCIO: NoticiaInput = {
  titulo: "", contenido: "", esGlobal: false, empresaId: null, imagenUrl: null,
  enlaceUrl: null, enlaceTexto: null, videoUrl: null,
  adjuntoUrl: null, adjuntoNombre: null, estado: "publicado", fijado: false,
  categoria: null,
};

const ROL_EMPLEADO_ID = "ff7abc21-9380-4e51-a55c-e2427d2a4e2d";

const GRAD_EMP = "linear-gradient(135deg, #2d5a3d 0%, #3b8256 100%)";
const SHADOW_TXT = "0 1px 4px rgba(0,0,0,0.35), 0 0 2px rgba(0,0,0,0.5)";
const CATEGORIA_COLORS_DARK: Record<string, { bg: string; text: string; border: string }> = {
  General: { bg: "rgba(255,255,255,0.15)", text: "#e5e7eb", border: "rgba(255,255,255,0.25)" },
  Formacion: { bg: "rgba(59,130,246,0.45)", text: "#bfdbfe", border: "rgba(59,130,246,0.55)" },
  Seguridad: { bg: "rgba(239,68,68,0.45)", text: "#fca5a5", border: "rgba(239,68,68,0.55)" },
  Evento: { bg: "rgba(168,85,247,0.45)", text: "#d8b4fe", border: "rgba(168,85,247,0.55)" },
  Empresa: { bg: "rgba(52,211,153,0.45)", text: "#a7f3d0", border: "rgba(52,211,153,0.55)" },
};
const CATEGORIA_COLORS_LIGHT: Record<string, { bg: string; text: string; border: string }> = {
  General: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  Formacion: { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  Seguridad: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  Evento: { bg: "#ede9fe", text: "#6b21a8", border: "#c4b5fd" },
  Empresa: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
};

function esNuevo(fecha: string) {
  return Date.now() - new Date(fecha).getTime() < 48 * 3600000;
}

const DEPARTAMENTOS = [
  { id: "PRODUCCION", label: "Producción" },
  { id: "RRHH", label: "RRHH" },
  { id: "LOGISTICA", label: "Logística" },
  { id: "CALIDAD", label: "Calidad" },
  { id: "MANTENIMIENTO", label: "Mantenimiento" },
  { id: "VENTAS", label: "Ventas" },
  { id: "ADMINISTRACION", label: "Administración" },
  { id: "IT", label: "IT" },
  { id: "SEGURIDAD", label: "Seguridad" },
  { id: "FORMACION", label: "Formación" },
];

interface Usuario {
  usuarioId: string;
  nombre: string;
  apellidos: string;
  email: string;
  codigoRol: string;
  nombreRol: string;
  puestoTrabajo: string | null;
  departamento: string | null;
  activo: boolean;
  fechaRegistro: string;
  fechaBaja?: string | null;
}

export interface NuevoEmpleadoForm {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  puestoTrabajo: string;
  departamento: string;
}

const EMPTY_EMPLEADO: NuevoEmpleadoForm = {
  nombre: "", apellidos: "", email: "", password: "", puestoTrabajo: "", departamento: "",
};

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}

function DonutDepartamentos({ data, total, palette }: {
  data: { nombre: string; total: number }[];
  total: number;
  palette: string[];
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const active    = activeIdx !== null ? data[activeIdx]                  : null;
  const activeColor = activeIdx !== null ? palette[activeIdx % palette.length] : null;

  return (
    <div className="flex-1 flex flex-col sm:flex-row gap-6 items-center min-h-[260px]">
      {/* Donut */}
      <div style={{ width: 240, height: 240, flexShrink: 0, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="nombre"
              cx="50%" cy="50%"
              innerRadius={74} outerRadius={108}
              paddingAngle={2}
              animationDuration={400}
              animationEasing="ease-out"
              onMouseEnter={(_, i) => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={palette[i % palette.length]}
                  stroke="none"
                  opacity={activeIdx === null || activeIdx === i ? 1 : 0.25}
                  style={{ cursor: "pointer", transition: "opacity 0.18s ease" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centro con fade suave */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", padding: "0 16px" }}>
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div key={activeIdx}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontFamily: "var(--font-raleway), sans-serif", fontSize: "1.7rem", fontWeight: 800, color: activeColor!, lineHeight: 1, fontVariantNumeric: "lining-nums", letterSpacing: "-0.03em" }}>{active.total}</span>
                <span className="text-center" style={{ fontSize: "0.58rem", fontWeight: 700, color: activeColor!, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>{active.nombre}</span>
              </motion.div>
            ) : (
              <motion.div key="total"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ fontFamily: "var(--font-raleway), sans-serif", fontSize: "1.9rem", fontWeight: 800, color: "var(--texto-primario)", lineHeight: 1, fontVariantNumeric: "lining-nums", letterSpacing: "-0.03em" }}>{total}</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--texto-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>activos</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {data.map((d, i) => {
          const color    = palette[i % palette.length];
          const pct      = Math.round(d.total / total * 100);
          const isActive = activeIdx === i;
          return (
            <div key={d.nombre}
              className="flex items-center gap-2 min-w-0 rounded-lg px-2 py-1"
              style={{ background: isActive ? `${color}12` : "transparent", cursor: "default",
                transition: "background 0.15s ease" }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: color, transform: isActive ? "scale(1.35)" : "scale(1)",
                  transition: "transform 0.15s ease" }} />
              <span className="text-xs truncate flex-1"
                style={{ color: isActive ? "var(--texto-primario)" : "var(--texto-secundario)",
                  fontWeight: isActive ? 600 : 500, transition: "color 0.15s ease, font-weight 0.15s ease" }}>
                {d.nombre}
              </span>
              <span className="text-xs font-bold shrink-0" style={{ minWidth: 18, textAlign: "right", color: isActive ? color : "var(--texto-primario)", transition: "color 0.15s ease" }}>{d.total}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: `${color}18`, color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const StatsTab = React.memo(function StatsTab({
  statsEmpresa,
  cargandoStats,
  statsRango,
  setStatsRangoT,
  statsDpto,
  setStatsDptoT,
  statsEstado,
  setStatsEstadoT,
  statsTipoMod,
  setStatsTipoModT,
  startStatsTransition,
  statsRangoLabel,
  statsRangoLabelMin,
  showKpis,
  setShowKpis,
  showMovimiento,
  setShowMovimiento,
  showEstadoFormacion,
  setShowEstadoFormacion,
  hayPersonalizacion,
  resetVistaEstadisticas,
  showPersonalizar,
  setShowPersonalizar,
  personalizarRef,
  exportFormat,
  setExportFormat,
  handleExportEstadisticas,
  empleados,
  formaciones,
}: {
  statsEmpresa: import("@/lib/api/estadisticas").EstadisticasEmpresaResponse | null;
  cargandoStats: boolean;
  statsRango: 1 | 3 | 6 | 12 | 24;
  setStatsRangoT: (v: 1 | 3 | 6 | 12 | 24) => void;
  statsDpto: string | null;
  setStatsDptoT: (v: string | null) => void;
  statsEstado: "todos" | "activos" | "inactivos";
  setStatsEstadoT: (v: "todos" | "activos" | "inactivos") => void;
  statsTipoMod: string | null;
  setStatsTipoModT: (v: string | null) => void;
  startStatsTransition: React.TransitionStartFunction;
  statsRangoLabel: string;
  statsRangoLabelMin: string;
  showKpis: boolean;
  setShowKpis: (v: boolean) => void;
  showMovimiento: boolean;
  setShowMovimiento: (v: boolean) => void;
  showEstadoFormacion: boolean;
  setShowEstadoFormacion: (v: boolean) => void;
  hayPersonalizacion: boolean;
  resetVistaEstadisticas: () => void;
  showPersonalizar: boolean;
  setShowPersonalizar: React.Dispatch<React.SetStateAction<boolean>>;
  personalizarRef: React.RefObject<HTMLDivElement | null>;
  exportFormat: import("@/lib/utils/statsExport").ExportFormat;
  setExportFormat: (v: import("@/lib/utils/statsExport").ExportFormat) => void;
  handleExportEstadisticas: () => void;
  empleados: Usuario[];
  formaciones: Modulo[];
}) {
  const [drillMes, setDrillMes] = useState<string | null>(null);
  const [drillSearch, setDrillSearch] = useState("");
  useEffect(() => {
    document.body.style.overflow = drillMes ? "hidden" : "";
    if (drillMes) document.body.classList.add("drill-modal-open");
    else { document.body.classList.remove("drill-modal-open"); setDrillSearch(""); }
    return () => { document.body.style.overflow = ""; document.body.classList.remove("drill-modal-open"); };
  }, [drillMes]);

  return (
    <div>
      {/* ── Título ── */}
      <div className="mb-8 text-center sm:text-left">
        <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Estadísticas
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {statsRangoLabel}
          {statsEmpresa && <> · <span style={{ color: "var(--texto-secundario)", fontWeight: 600 }}>{statsEmpresa.kpis.totalEmpleados} empleado{statsEmpresa.kpis.totalEmpleados !== 1 ? "s" : ""}</span></>}
          {statsDpto && <> · {DEPARTAMENTOS.find(d => d.id === statsDpto)?.label}</>}
          {statsEstado !== "todos" && <> · <span style={{ color: "var(--error)", fontWeight: 600 }}>{statsEstado === "activos" ? "Solo activos" : "Solo inactivos"}</span></>}
        </p>
      </div>

      {/* ── Barra DESKTOP: una sola fila ── */}
      <div className="hidden sm:flex sm:items-center sm:flex-wrap gap-2 mb-8">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--gris-superficie)", border: "1px solid var(--surface-border)" }}>
          {([{ n: 1, label: "1 mes" }, { n: 3, label: "3 meses" }, { n: 6, label: "6 meses" }, { n: 12, label: "1 año" }, { n: 24, label: "2 años" }] as const).map(({ n, label }) => (
            <motion.button key={n} onClick={() => setStatsRangoT(n)}
              className="relative text-sm font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer whitespace-nowrap"
              style={{ color: statsRango === n ? "#fff" : "var(--texto-muted)", transition: "color 0.15s ease", zIndex: 1 }}
              whileTap={{ scale: 0.94 }}>
              {statsRango === n && <motion.span layoutId="rango-pill-desktop" className="absolute inset-0 rounded-lg" style={{ background: "var(--azul-egm)", zIndex: -1 }} transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              {label}
            </motion.button>
          ))}
        </div>
        <div className="w-px h-5" style={{ background: "var(--surface-border)" }} />
        <StatsSelect value={statsDpto ?? ""} onChange={(v) => setStatsDptoT(v === "" ? null : v)} placeholder="Todos los dptos." minWidth={148} options={(() => { const p = new Set(empleados.map(e => e.departamento).filter((d): d is string => !!d)); return DEPARTAMENTOS.filter(d => p.has(d.id)).map(d => ({ id: d.id, label: `${d.label} (${empleados.filter(e => e.departamento === d.id).length})` })); })()} />
        <StatsSelect value={statsEstado === "activos" ? "" : statsEstado} onChange={(v) => setStatsEstadoT((v === "" ? "activos" : v) as "activos" | "inactivos" | "todos")} placeholder="Activos" minWidth={110} options={[{ id: "inactivos", label: "Inactivos" }, { id: "todos", label: "Todos" }]} />
        <StatsSelect value={statsTipoMod ?? ""} onChange={(v) => setStatsTipoModT(v === "" ? null : v)} placeholder="Todos los módulos" minWidth={152} options={(() => { const t = new Set(formaciones.map((m: Modulo) => m.tipoModulo).filter((t): t is ModuloTipo => !!t)); return Array.from(t).map(t => ({ id: t, label: `${(MODULO_TIPO_LABEL as Record<string,string>)[t] ?? t} (${formaciones.filter((m: Modulo) => m.tipoModulo === t).length})` })); })()} />
        <AnimatePresence>
          {(statsDpto || statsEstado !== "activos" || statsTipoMod) && (
            <motion.button initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={() => { setStatsDptoT(null); setStatsEstadoT("activos"); setStatsTipoModT(null); }}
              className="inline-flex items-center gap-2 text-sm font-semibold px-3 h-9 rounded-xl focus:outline-none cursor-pointer"
              style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "1px solid rgba(27,63,126,0.3)" }}>
              <X size={13} strokeWidth={2.5} />Limpiar
            </motion.button>
          )}
        </AnimatePresence>
        <div className="ml-auto flex items-center gap-2">
          {/* Restablecer */}
          <AnimatePresence>
            {hayPersonalizacion && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={resetVistaEstadisticas}
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 h-10 rounded-xl focus:outline-none cursor-pointer"
                style={{ background: "transparent", color: "var(--azul-egm)", border: "1px solid rgba(0,0,0,0.12)" }}
              >
                <RefreshCw size={14} />
                Restablecer
              </motion.button>
            )}
          </AnimatePresence>
          {/* Personalizar */}
          <div className="relative" ref={personalizarRef}>
            <Button
              variant={showPersonalizar ? "primary" : "ghost"}
              size="md"
              onClick={() => setShowPersonalizar((v: boolean) => !v)}
            >
              <SlidersHorizontal size={14} />
              Personalizar
            </Button>
            <AnimatePresence>
              {showPersonalizar && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.34, 1.2, 0.64, 1] }}
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl z-20"
                  style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-2" style={{ color: "var(--texto-muted)" }}>
                    Mostrar secciones
                  </p>
                  {[
                    { label: "KPIs resumen",              value: showKpis,            set: setShowKpis },
                    { label: "Incorporaciones y salidas",  value: showMovimiento,      set: setShowMovimiento },
                    { label: "Empleados por departamento", value: showEstadoFormacion, set: setShowEstadoFormacion },
                  ].map(({ label, value, set }, idx) => (
                    <label key={label}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      style={{ borderTop: idx > 0 ? "1px solid var(--surface-border)" : "none" }}
                    >
                      <input
                        type="checkbox" checked={value}
                        onChange={(e) => set(e.target.checked)}
                        className="w-4 h-4 cursor-pointer rounded"
                        style={{ accentColor: "var(--azul-egm)" }}
                      />
                      <span className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{label}</span>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Descargar */}
          <div className="flex items-center gap-2">
            <StatsSelect
              value={exportFormat}
              onChange={(v) => { if (v) setExportFormat(v as import("@/lib/utils/statsExport").ExportFormat); }}
              placeholder={exportFormat.toUpperCase()}
              minWidth={85}
              hidePlaceholder
              options={[
                { id: "pdf", label: "PDF" },
                { id: "csv", label: "CSV" },
                { id: "xml", label: "XML" },
              ]}
            />
            <Button variant="primary" size="md" onClick={handleExportEstadisticas} disabled={!statsEmpresa}>
              <Download size={14} />
              Descargar
            </Button>
          </div>
        </div>
      </div>

      {/* ── Barra MÓVIL: filas apiladas ── */}
      <div className="flex flex-col gap-3 mb-8 sm:hidden">
        {/* Rango — fila completa con etiquetas cortas */}
        <div className="flex gap-1 p-1 rounded-xl w-full" style={{ background: "var(--gris-superficie)", border: "1px solid var(--surface-border)" }}>
          {([{ n: 1, short: "1m", label: "1 mes" }, { n: 3, short: "3m", label: "3 meses" }, { n: 6, short: "6m", label: "6 meses" }, { n: 12, short: "1a", label: "1 año" }, { n: 24, short: "2a", label: "2 años" }] as const).map(({ n, short, label }) => (
            <motion.button key={n} onClick={() => setStatsRangoT(n)}
              className="relative flex-1 text-sm font-semibold py-1.5 rounded-lg focus:outline-none cursor-pointer text-center"
              style={{ color: statsRango === n ? "#fff" : "var(--texto-muted)", transition: "color 0.15s ease", zIndex: 1 }}
              title={label}
              whileTap={{ scale: 0.94 }}>
              {statsRango === n && <motion.span layoutId="rango-pill-mobile" className="absolute inset-0 rounded-lg" style={{ background: "var(--azul-egm)", zIndex: -1 }} transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              {short}
            </motion.button>
          ))}
        </div>
        {/* Filtros: apilados ancho completo */}
        <div className="flex flex-col gap-2">
          <StatsSelect fullWidth value={statsDpto ?? ""} onChange={(v) => setStatsDptoT(v === "" ? null : v)} placeholder="Todos los dptos." minWidth={0} options={(() => { const p = new Set(empleados.map(e => e.departamento).filter((d): d is string => !!d)); return DEPARTAMENTOS.filter(d => p.has(d.id)).map(d => ({ id: d.id, label: `${d.label} (${empleados.filter(e => e.departamento === d.id).length})` })); })()} />
          <StatsSelect fullWidth value={statsEstado === "activos" ? "" : statsEstado} onChange={(v) => setStatsEstadoT((v === "" ? "activos" : v) as "activos" | "inactivos" | "todos")} placeholder="Activos" minWidth={0} options={[{ id: "inactivos", label: "Inactivos" }, { id: "todos", label: "Todos" }]} />
          <StatsSelect fullWidth value={statsTipoMod ?? ""} onChange={(v) => setStatsTipoModT(v === "" ? null : v)} placeholder="Todos los módulos" minWidth={0} options={(() => { const t = new Set(formaciones.map((m: Modulo) => m.tipoModulo).filter((t): t is ModuloTipo => !!t)); return Array.from(t).map(t => ({ id: t, label: `${(MODULO_TIPO_LABEL as Record<string,string>)[t] ?? t} (${formaciones.filter((m: Modulo) => m.tipoModulo === t).length})` })); })()} />
        </div>
        {/* Acciones móvil */}
        <div className="flex flex-col gap-2">

          {/* Fila 1: Personalizar (ancho completo) + Restablecer */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1" ref={personalizarRef}>
              <button
                type="button"
                onClick={() => setShowPersonalizar((v: boolean) => !v)}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold h-10 rounded-xl focus:outline-none cursor-pointer"
                style={{
                  background: showPersonalizar ? "var(--azul-egm)" : "transparent",
                  color: showPersonalizar ? "#fff" : "var(--texto-primario)",
                  border: `1px solid ${showPersonalizar ? "var(--azul-egm)" : "rgba(0,0,0,0.12)"}`,
                  transition: "background 0.15s, color 0.15s, border-color 0.15s",
                }}
              >
                <SlidersHorizontal size={14} />
                Personalizar
              </button>
              <AnimatePresence>
                {showPersonalizar && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.34, 1.2, 0.64, 1] }}
                    className="absolute left-0 top-full mt-2 w-full rounded-2xl"
                    style={{ zIndex: 30, background: "var(--blanco)", border: "1px solid var(--surface-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-2" style={{ color: "var(--texto-muted)" }}>
                      Mostrar secciones
                    </p>
                    {[
                      { label: "KPIs resumen",              value: showKpis,            set: setShowKpis },
                      { label: "Incorporaciones y salidas",  value: showMovimiento,      set: setShowMovimiento },
                      { label: "Empleados por departamento", value: showEstadoFormacion, set: setShowEstadoFormacion },
                    ].map(({ label, value, set }, idx) => (
                      <label key={label}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                        style={{ borderTop: idx > 0 ? "1px solid var(--surface-border)" : "none" }}
                      >
                        <input
                          type="checkbox" checked={value}
                          onChange={(e) => set(e.target.checked)}
                          className="w-4 h-4 cursor-pointer rounded"
                          style={{ accentColor: "var(--azul-egm)" }}
                        />
                        <span className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{label}</span>
                      </label>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Restablecer — icono, solo visible si hay personalización */}
            <AnimatePresence>
              {hayPersonalizacion && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  onClick={resetVistaEstadisticas}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl focus:outline-none cursor-pointer shrink-0"
                  style={{ background: "transparent", color: "var(--azul-egm)", border: "1px solid rgba(0,0,0,0.12)" }}
                >
                  <RefreshCw size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Fila 2: PDF selector (30%) + Descargar (70%) */}
          <div className="flex items-center gap-2">
            <div style={{ width: "30%" }}>
              <StatsSelect
                fullWidth
                value={exportFormat}
                onChange={(v) => { if (v) setExportFormat(v as import("@/lib/utils/statsExport").ExportFormat); }}
                placeholder={exportFormat.toUpperCase()}
                minWidth={0}
                hidePlaceholder
                options={[
                  { id: "pdf", label: "PDF" },
                  { id: "csv", label: "CSV" },
                  { id: "xml", label: "XML" },
                ]}
              />
            </div>
            <button
              type="button"
              onClick={handleExportEstadisticas}
              disabled={!statsEmpresa}
              className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold h-10 rounded-xl focus:outline-none cursor-pointer"
              style={{
                background: "var(--azul-egm)",
                color: "#fff",
                border: "none",
                opacity: !statsEmpresa ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <Download size={14} />
              Descargar
            </button>
          </div>
        </div>
      </div>

      {!statsEmpresa ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
        </div>
      ) : !showKpis && !showMovimiento && !showEstadoFormacion ? (
        <div className="text-center py-20" style={{ color: "var(--texto-muted)" }}>
          <p className="text-sm mb-3">Todas las secciones están ocultas.</p>
          <button
            onClick={resetVistaEstadisticas}
            className="text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "var(--azul-egm)", color: "white" }}
          >
            Restablecer vista
          </button>
        </div>
      ) : (
        <div>
          {/* ── KPIs ── */}
          {showKpis && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {([
                { label: "Total empleados",                value: String(statsEmpresa.kpis.totalEmpleados),                                                                                                                                                       accent: "#3B82F6", bg: "rgba(59,130,246,0.08)",  icon: <Users         size={22} strokeWidth={1.8} /> },
                { label: `Altas - ${statsRangoLabelMin}`, value: String(statsEmpresa.movimientoMensual.reduce((s, m) => s + m.altas, 0)),      accent: "#10B981", bg: "rgba(16,185,129,0.08)", icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
                { label: `Bajas - ${statsRangoLabelMin}`, value: String(statsEmpresa.movimientoMensual.reduce((s, m) => s + m.bajas, 0)),      accent: "#F43F5E", bg: "rgba(244,63,94,0.08)",  icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm8-5h6" /></svg> },
                { label: "Rotación anualizada",           value: `${statsEmpresa.kpis.tasaRotacion}%`,                                                            accent: "#F59E0B", bg: "rgba(245,158,11,0.08)", icon: <RefreshCw     size={22} strokeWidth={1.8} /> },
                { label: "Completitud de formación",      value: `${statsEmpresa.kpis.pctCompletitudGlobal}%`,                                                    accent: "#8B5CF6", bg: "rgba(139,92,246,0.08)", icon: <GraduationCap size={22} strokeWidth={1.8} /> },
                { label: "Módulos con progreso",          value: String(statsEmpresa.kpis.modulosConProgreso),                                                    accent: "#06B6D4", bg: "rgba(6,182,212,0.08)",  icon: <LibraryBig    size={22} strokeWidth={1.8} /> },
              ] as { label: string; value: string; accent: string; bg: string; icon: React.ReactNode }[]).map(({ label, value, accent, bg, icon }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--blanco)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Contenido principal */}
                  <div className="p-4 sm:p-5" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minHeight: 100 }}>
                    {/* Label — altura fija 2 líneas para alinear números entre tarjetas */}
                    <p style={{ fontSize: "clamp(11px, 3vw, 13px)", fontWeight: 600, color: "var(--texto-muted)", margin: 0, letterSpacing: "0.01em", lineHeight: 1.35, minHeight: "2.7em" }}>{label}</p>
                    {/* Valor + icono */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                      <p style={{ fontSize: "clamp(1.8rem, 6vw, 2.6rem)", fontWeight: 800, color: accent, margin: 0, lineHeight: 1 }}>{value}</p>
                      <span className="hidden sm:flex" style={{ alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: bg, color: accent, flexShrink: 0 }}>
                        {icon}
                      </span>
                    </div>
                  </div>
                  {/* Franja de color inferior */}
                  <div style={{ height: 4, background: accent, opacity: 0.7 }} />
                </div>
              ))}
            </div>
          )}

          {/* ── Fila superior: 50/50 ── */}
          {(showMovimiento || showEstadoFormacion) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">

              {/* ── 1. Incorporaciones y salidas ── */}
              {showMovimiento && (() => {
                const totalAltas = statsEmpresa.movimientoMensual.reduce((s, m) => s + m.altas, 0);
                const totalBajas = statsEmpresa.movimientoMensual.reduce((s, m) => s + m.bajas, 0);
                const neto = totalAltas - totalBajas;
                return (
                <div className="p-6 rounded-2xl shadow-sm flex flex-col" style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                  {/* Header */}
                  <div className="pb-3 mb-3" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                    <div className="flex flex-col gap-2">
                      {/* Título + subtítulo */}
                      <div className="flex items-start justify-between gap-2">
                        <h2 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.05rem, 2.5vw, 1.35rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                          Incorporaciones y salidas
                        </h2>
                        {/* Badges — al lado del título en desktop, misma fila */}
                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(16,185,129,0.09)", color: "#10B981" }}>↑ {totalAltas}</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(244,63,94,0.09)", color: "#F43F5E" }}>↓ {totalBajas}</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: neto >= 0 ? "rgba(59,130,246,0.09)" : "rgba(244,63,94,0.09)", color: neto >= 0 ? "#3B82F6" : "#F43F5E" }}>{neto >= 0 ? "+" : ""}{neto}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
                          <span className="hidden sm:inline">Movimiento de plantilla - </span>{statsRangoLabelMin}
                        </p>
                        {/* Badges — debajo en móvil */}
                        <div className="flex sm:hidden items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(16,185,129,0.09)", color: "#10B981" }}>↑ {totalAltas}</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(244,63,94,0.09)", color: "#F43F5E" }}>↓ {totalBajas}</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: neto >= 0 ? "rgba(59,130,246,0.09)" : "rgba(244,63,94,0.09)", color: neto >= 0 ? "#3B82F6" : "#F43F5E" }}>{neto >= 0 ? "+" : ""}{neto}</span>
                        </div>
                      </div>
                      {/* Hint táctil — solo móvil */}
                      <p className="flex sm:hidden items-center gap-1 text-[11px]" style={{ color: "var(--texto-muted)" }}>
                        Toca un mes para ver el detalle
                      </p>
                    </div>
                  </div>
                  {/* Gráfico */}
                  <div className="flex-1 min-h-[240px]">
                    {totalAltas === 0 && totalBajas === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-sm" style={{ color: "var(--texto-muted)" }}>Sin movimiento de personal en este periodo</p>
                      </div>
                    ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={statsEmpresa.movimientoMensual}
                        margin={{ top: 6, right: 16, left: 4, bottom: 4 }}
                        onClick={(e) => { const label = e?.activeLabel; if (typeof label === "string") setDrillMes(label); }}
                        style={{ cursor: "pointer" }}
                      >
                        <defs>
                          <linearGradient id="gradAltas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.22} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradBajas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-border)" />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "var(--texto-muted)", fontSize: 11 }} dy={8}
                          interval={statsRango <= 6 ? 0 : statsRango === 12 ? 1 : 2}
                          padding={{ left: 12, right: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--texto-muted)", fontSize: 11 }} allowDecimals={false}
                          width={(() => { const mx = Math.max(...statsEmpresa.movimientoMensual.flatMap(m => [m.altas, m.bajas]), 0); return mx >= 1000 ? 44 : mx >= 100 ? 36 : 28; })()} />
                        <RechartsTooltip
                          animationDuration={120}
                          animationEasing="ease-out"
                          wrapperStyle={{ pointerEvents: "none" }}
                          content={({ active, payload, label: mesLabel }) => {
                            if (!active || !payload?.length) return null;
                            const altas = (payload.find(p => p.dataKey === "altas")?.value as number) ?? 0;
                            const bajas = (payload.find(p => p.dataKey === "bajas")?.value as number) ?? 0;
                            const bal = altas - bajas;
                            return (
                              <div style={{ borderRadius: 12, border: "1px solid var(--surface-border)", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", background: "var(--blanco)", padding: "10px 14px", minWidth: 150 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--texto-primario)", marginBottom: 6 }}>{mesLabel}</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                  <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>↑ {altas} INCORPORACIONES</span>
                                  <span style={{ fontSize: 11, color: "#F43F5E", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>↓ {bajas} SALIDAS</span>
                                  <span style={{ fontSize: 11, color: bal >= 0 ? "#3B82F6" : "#F43F5E", fontWeight: 700, marginTop: 2, paddingTop: 4, borderTop: "1px solid var(--surface-border)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                    {bal >= 0 ? "+" : ""}{bal} NETO
                                  </span>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area type="monotone" name="Altas" dataKey="altas" stroke="#10B981" strokeWidth={2.5} fill="url(#gradAltas)"
                          dot={{ r: 3, fill: "#10B981", strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#10B981", strokeWidth: 0 }} />
                        <Area type="monotone" name="Bajas" dataKey="bajas" stroke="#F43F5E" strokeWidth={2.5} fill="url(#gradBajas)"
                          dot={{ r: 3, fill: "#F43F5E", strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#F43F5E", strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                    )}
                  </div>
                </div>
                );
              })()}

              {/* ── 2. Empleados por departamento ── */}
              {showEstadoFormacion && (
                <div className="p-6 rounded-2xl shadow-sm flex flex-col" style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                  <div className="pb-3 mb-3" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.05rem, 2.5vw, 1.35rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                          Distribución por departamento
                        </h2>
                        <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>
                          Plantilla activa - {(() => { const activos = empleados.filter(e => e.activo !== false); const dptos = new Set(activos.map(e => e.departamento).filter(Boolean)); return dptos.size; })()} departamentos
                        </p>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const activos = empleados.filter(e => e.activo !== false);
                    const conteoDptos: Record<string, number> = {};
                    for (const e of activos) { const d = e.departamento || "Sin dpto."; conteoDptos[d] = (conteoDptos[d] ?? 0) + 1; }
                    const distribucionDepartamentos = Object.entries(conteoDptos).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total);
                    const PALETTE_RAW = ["#3B82F6","#10B981","#8B5CF6","#F59E0B","#F43F5E","#06B6D4","#84CC16","#EC4899","#F97316","#14B8A6","#6366F1","#EAB308"];
                    const total = activos.length;
                    return distribucionDepartamentos.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm" style={{ color: "var(--texto-muted)" }}>Sin datos de departamento</p>
                      </div>
                    ) : (
                      <DonutDepartamentos data={distribucionDepartamentos} total={total} palette={PALETTE_RAW} />
                    );
                  })()}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ── Modal drill-down mes — vive aquí para no tocar AdminContent ── */}
      <AnimatePresence>
        {drillMes && (() => {
          const MESES      = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
          const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
          const mesIdx = MESES.indexOf(drillMes);
          const hoy = new Date();
          let anioMes = hoy.getFullYear();
          for (let i = statsRango - 1; i >= 0; i--) {
            const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            if (MESES[d.getMonth()] === drillMes) { anioMes = d.getFullYear(); break; }
          }
          let empFiltrados = empleados;
          if (statsEstado === "activos")   empFiltrados = empFiltrados.filter((e) => e.activo !== false);
          if (statsEstado === "inactivos") empFiltrados = empFiltrados.filter((e) => e.activo === false);
          if (statsDpto) empFiltrados = empFiltrados.filter((e) => e.departamento === statsDpto);

          const altasDelMes = empFiltrados.filter((e) => {
            const f = new Date(e.fechaRegistro ?? 0);
            return f.getFullYear() === anioMes && f.getMonth() === mesIdx;
          });
          const bajasDelMes = empFiltrados.filter((e) => {
            if (!e.fechaBaja) return false;
            const f = new Date(e.fechaBaja);
            return f.getFullYear() === anioMes && f.getMonth() === mesIdx;
          });
          const netoMes = altasDelMes.length - bajasDelMes.length;
          const seccionesLista = [
            { title: "Incorporaciones", list: altasDelMes.filter(e => !drillSearch || `${e.nombre} ${e.apellidos}`.toLowerCase().includes(drillSearch.toLowerCase())), color: "#10B981", dateKey: "fechaRegistro" as const, empty: "Sin incorporaciones este mes" },
            { title: "Salidas",         list: bajasDelMes.filter(e => !drillSearch || `${e.nombre} ${e.apellidos}`.toLowerCase().includes(drillSearch.toLowerCase())), color: "#F43F5E", dateKey: "fechaBaja"     as const, empty: "Sin salidas este mes" },
          ];
          const totalEmps = altasDelMes.length + bajasDelMes.length;

          return (
            <motion.div
              key="drill-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4"
              style={{ background: "rgba(15,25,35,0.6)" }}
              onClick={() => setDrillMes(null)}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 28, scale: 0.94 },
                  show:   { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.3,  ease: [0.22, 1, 0.36, 1] } },
                  exit:   { opacity: 0, y: 14, scale: 0.97, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
                }}
                initial="hidden"
                animate="show"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className="rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
                style={{ background: "var(--blanco)", maxHeight: "92dvh" }}
              >
                {/* Cabecera con Grainient verde */}
                <div className="flex items-center justify-between px-6 shrink-0"
                  style={{ paddingTop: "20px", paddingBottom: "20px", position: "relative", background: "#10B981" }}>
                  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                    <Grainient
                      color1="#2D8653" color2="#10B981" color3="#059669"
                      timeSpeed={0.18} warpStrength={1.2} warpFrequency={4.0}
                      warpSpeed={1.5} warpAmplitude={60} grainAmount={0.08}
                      contrast={1.2} saturation={1.0} zoom={0.85}
                      style={{ width: "100%", height: "100%", display: "block" }}
                    />
                  </div>
                  <h3 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.25rem, 5vw, 1.6rem)", color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.15, fontVariantNumeric: "lining-nums", position: "relative", zIndex: 1 }}>
                    {MESES_FULL[mesIdx] ?? drillMes} {anioMes}
                  </h3>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <IconButton variant="glass" size="sm" label="Cerrar" onClick={() => setDrillMes(null)} />
                  </div>
                </div>

                {/* KPIs + Buscador — zona gris fija */}
                <div className="shrink-0 px-5 pt-4 pb-0" style={{ background: "var(--gris-panel)" }}>
                  <div className="grid grid-cols-3 rounded-2xl" style={{ border: "1px solid var(--surface-border)" }}>
                  {([
                    { label: "Incorporaciones", short: "Altas",  value: altasDelMes.length, color: "#10B981", bg: "rgba(16,185,129,0.07)", prefix: "↑" },
                    { label: "Salidas",         short: "Bajas",  value: bajasDelMes.length, color: "#F43F5E", bg: "rgba(244,63,94,0.07)",  prefix: "↓" },
                    { label: "Neto",            short: "Neto",   value: Math.abs(netoMes),  color: netoMes >= 0 ? "#3B82F6" : "#F43F5E",  bg: netoMes >= 0 ? "rgba(59,130,246,0.07)" : "rgba(244,63,94,0.07)", prefix: netoMes >= 0 ? "+" : "−" },
                  ] as const).map(({ label, short, value, color, bg, prefix }, i) => (
                    <div key={label} className="flex flex-col items-center justify-center py-4 sm:py-5 gap-1"
                      style={{
                        background: bg,
                        borderRight: i < 2 ? "1px solid var(--surface-border)" : "none",
                        borderRadius: i === 0 ? "16px 0 0 16px" : i === 2 ? "0 16px 16px 0" : 0,
                      }}>
                      <div className="flex items-baseline gap-0.5">
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color, lineHeight: 1 }}>{prefix}</span>
                        <span style={{ fontSize: "clamp(1.4rem, 5vw, 1.9rem)", fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: "lining-nums" }}>{value}</span>
                      </div>
                      <span className="hidden sm:block" style={{ fontSize: "0.72rem", fontWeight: 700, color, opacity: 0.75, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
                      <span className="block sm:hidden" style={{ fontSize: "0.68rem", fontWeight: 700, color, opacity: 0.75, letterSpacing: "0.04em", textTransform: "uppercase" }}>{short}</span>
                    </div>
                  ))}
                  </div>
                </div>

                {/* Buscador fijo */}
                {totalEmps > 5 && (
                  <div className="px-5 pt-3 pb-3 shrink-0 flex justify-center" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--gris-panel)" }}>
                    <div className="w-full max-w-sm">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                        <Search size={15} />
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar empleado…"
                        value={drillSearch}
                        onChange={e => setDrillSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl outline-none transition-colors"
                        style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "var(--azul-egm)")}
                        onBlur={e  => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
                      />
                      {drillSearch && (
                        <button
                          onClick={() => setDrillSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                          style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                )}

                {/* Listas */}
                <div className="overflow-y-auto px-5 pb-5 pt-3 space-y-5">
                  {seccionesLista.map(({ title, list, color, dateKey, empty }) => {
                    const dateLabel = dateKey === "fechaRegistro" ? "ALTA" : "BAJA";
                    return (
                      <div key={title}>
                        {/* Cabecera sección — pill coloreada */}
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                            style={{ background: `${color}14`, color, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                            {title}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}14`, color }}>
                            {list.length}
                          </span>
                        </div>

                        {list.length === 0 ? (
                          <p className="text-xs py-3 text-center rounded-xl" style={{ color: "var(--texto-muted)", background: "var(--gris-superficie)" }}>
                            {drillSearch ? "Sin resultados para esa búsqueda" : empty}
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {list.map((e) => {
                              const initials = `${e.nombre?.[0] ?? ""}${e.apellidos?.[0] ?? ""}`.toUpperCase();
                              const fecha = e[dateKey] ? new Date(e[dateKey]!).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : null;
                              return (
                                <li key={e.usuarioId}
                                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-default"
                                  style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}
                                  onMouseEnter={e2 => (e2.currentTarget.style.background = "var(--gris-superficie)")}
                                  onMouseLeave={e2 => (e2.currentTarget.style.background = "var(--blanco)")}>

                                  {/* Avatar */}
                                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                    {initials}
                                  </div>

                                  {/* Centro: nombre + puesto · departamento */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate leading-tight" style={{ color: "var(--texto-primario)" }}>
                                      {e.nombre} {e.apellidos}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5 min-w-0">
                                      {e.puestoTrabajo && (
                                        <span className="text-xs truncate shrink min-w-0" style={{ color: "var(--texto-muted)" }}>{e.puestoTrabajo}</span>
                                      )}
                                      {e.departamento && (
                                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                                          style={{ background: "rgba(10,138,150,0.10)", color: "#0A8A96" }}>
                                          {e.departamento}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Derecha: fecha con etiqueta pill */}
                                  {fecha && (
                                    <div className="flex flex-col items-end shrink-0 gap-1">
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                        style={{ background: `${color}14`, color }}>
                                        {dateLabel}
                                      </span>
                                      <span className="text-xs font-semibold" style={{ color: "var(--texto-primario)" }}>{fecha}</span>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
});

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();

  const [activeTab, setActiveTab] = useState<"empleados" | "anuncios" | "formaciones" | "incidencias" | "estadisticas" | "documentos">("empleados");
  const [tabMenuOpen, setTabMenuOpen] = useState(false);

  const queryClient = useQueryClient();

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: _empleadosData, isLoading: cargandoEmpleados } = useQuery<Usuario[]>({
    queryKey: QK.empleados(usuario?.empresaId),
    queryFn: () => apiFetch(`${API_URL}/users`).then((r) => r.json()),
    enabled: !!usuario?.empresaId && (activeTab === "formaciones" || activeTab === "estadisticas"),
    staleTime: 30_000,
  });
  const empleados = useMemo(() => _empleadosData ?? [], [_empleadosData]);

  const { data: noticias = [] } = useQuery({
    queryKey: QK.noticias(usuario?.empresaId),
    queryFn: () => getNoticias(usuario!.empresaId),
    enabled: !!usuario?.empresaId && activeTab === "anuncios",
    staleTime: 30_000,
  });

  const { data: _formacionesData } = useQuery<Modulo[]>({
    queryKey: QK.modulos(usuario?.empresaId),
    queryFn: () => getModulos(usuario?.empresaId),
    enabled: !!usuario?.empresaId,
    staleTime: 60_000,
  });
  const formaciones = useMemo(() => _formacionesData ?? [], [_formacionesData]);

  const { data: _progresoData, isLoading: cargandoProgreso } = useQuery({
    queryKey: QK.progresoEmpresa(usuario?.empresaId),
    queryFn: () => getProgresoEmpresa(usuario!.empresaId!),
    enabled: !!usuario?.empresaId,
    staleTime: 60_000,
  });
  const progresoEmpresa = useMemo(() => _progresoData ?? [], [_progresoData]);

  // Refs para el efecto de estadísticas
  const formacionesRef = useRef(formaciones);
  useEffect(() => { formacionesRef.current = formaciones; }, [formaciones]);
  const progresoEmpresaRef = useRef(progresoEmpresa);
  useEffect(() => { progresoEmpresaRef.current = progresoEmpresa; }, [progresoEmpresa]);
  const empleadosRef = useRef(empleados);
  useEffect(() => { empleadosRef.current = empleados; }, [empleados]);

  // ── Pagination ───────────────────────────────────────────────────────────────
  const PAGE_SIZE = 25;
  const PAGE_SIZE_MOBILE = 10;
  const [empPage, setEmpPage] = useState(0);

  // Resetear página al cruzar el breakpoint md (768px) para evitar slices vacíos
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = () => setEmpPage(0);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Filtros empleados ────────────────────────────────────────────────────────
  const [empSearch, setEmpSearch] = useState("");
  const [empSearchInput, setEmpSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setEmpSearch(empSearchInput), 180);
    return () => clearTimeout(t);
  }, [empSearchInput]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [showFormEmpleado, setShowFormEmpleado] = useState(false);

  const [formEmpleado, setFormEmpleado] = useState<NuevoEmpleadoForm>(EMPTY_EMPLEADO);
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);
  const [errorEmpleado, setErrorEmpleado] = useState<string | null>(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Usuario | null>(null);
  const [editandoEmpleado, setEditandoEmpleado] = useState(false);
  const [editEmpleadoForm, setEditEmpleadoForm] = useState<NuevoEmpleadoForm>(EMPTY_EMPLEADO);

  const inputImportRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; errors: string[] } | null>(null);

  // ── Scroll lock — modal y slide-over ─────────────────────────────────────────
  useEffect(() => {
    if (showFormEmpleado || !!empleadoSeleccionado) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [showFormEmpleado, empleadoSeleccionado]);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "error" } | null>(null);

  const mostrarToast = (msg: string, tipo: "ok" | "error" = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const [showFormAnuncio, setShowFormAnuncio] = useState(false);
  const [editando, setEditando] = useState<Noticia | null>(null);
  const [initialForm, setInitialForm] = useState<NoticiaInput>(EMPTY_ANUNCIO);

  // ── Stats tab state ───────────────────────────────────────────────────────────
  const [statsRango, setStatsRango] = useState<1 | 3 | 6 | 12 | 24>(6);
  const statsRangoLabel = statsRango === 1 ? "Último mes" : statsRango === 12 ? "Último año" : statsRango === 24 ? "Últimos 2 años" : `Últimos ${statsRango} meses`;
  const statsRangoLabelMin = statsRango === 1 ? "último mes" : statsRango === 12 ? "último año" : statsRango === 24 ? "últimos 2 años" : `últimos ${statsRango} meses`;
  const [statsDpto, setStatsDpto] = useState<string | null>(null);
  const [statsEstado, setStatsEstado] = useState<"todos" | "activos" | "inactivos">("activos");
  const [statsTipoMod, setStatsTipoMod] = useState<string | null>(null);
  const [isPendingStats, startStatsTransition] = useTransition();
  const cargandoStats = isPendingStats;

  const setStatsRangoT  = useCallback((v: 1|3|6|12|24) => startStatsTransition(() => setStatsRango(v)),  [startStatsTransition]);
  const setStatsDptoT   = useCallback((v: string|null)  => startStatsTransition(() => setStatsDpto(v)),   [startStatsTransition]);
  const setStatsEstadoT = useCallback((v: "todos"|"activos"|"inactivos") => startStatsTransition(() => setStatsEstado(v)), [startStatsTransition]);
  const setStatsTipoModT= useCallback((v: string|null)  => startStatsTransition(() => setStatsTipoMod(v)),[startStatsTransition]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [showPersonalizar, setShowPersonalizar] = useState(false);
  const personalizarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showPersonalizar) return;
    const handler = (e: MouseEvent) => {
      if (personalizarRef.current && !personalizarRef.current.contains(e.target as Node)) {
        setShowPersonalizar(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPersonalizar]);
  const [showKpis, setShowKpis] = useState(true);
  const [showMovimiento, setShowMovimiento] = useState(true);
  const [showEstadoFormacion, setShowEstadoFormacion] = useState(true);

  const hayPersonalizacion = !showKpis || !showMovimiento || !showEstadoFormacion;
  const resetVistaEstadisticas = () => {
    setShowKpis(true); setShowMovimiento(true); setShowEstadoFormacion(true);
  };
  const handleExportEstadisticas = () => {
    if (!statsEmpresa) return;
    const filtrosLabel = [
      statsDpto ? `Dpto: ${DEPARTAMENTOS.find(d => d.id === statsDpto)?.label ?? statsDpto}` : null,
      statsEstado !== "todos" ? `Estado: ${statsEstado}` : null,
      statsTipoMod ? `Módulo: ${statsTipoMod}` : null,
    ].filter(Boolean).join(" · ") || undefined;
    const sections: StatsSection[] = [
      {
        id: "kpis", title: "KPIs resumen",
        headers: ["Indicador", "Valor"],
        rows: [
          ["Total empleados", statsEmpresa.kpis.totalEmpleados],
          ["Altas este mes", statsEmpresa.kpis.altasEsteMes],
          ["Bajas este mes", statsEmpresa.kpis.bajasEsteMes],
          ["Tasa rotación anual %", statsEmpresa.kpis.tasaRotacion],
          ["Completitud formación %", statsEmpresa.kpis.pctCompletitudGlobal],
        ],
      },
      {
        id: "movimiento", title: "Incorporaciones y salidas por mes",
        headers: ["Mes", "Altas", "Bajas"],
        rows: statsEmpresa.movimientoMensual.map(m => [m.mes, m.altas, m.bajas]),
      },
      {
        id: "estado_formacion", title: "Estado de formación",
        headers: ["Estado", "Empleados"],
        rows: [
          ["Sin iniciar", statsEmpresa.empleadosSinFormacion],
          ["En progreso", statsEmpresa.empleadosEnProgreso],
          ["Completada", statsEmpresa.empleadosCompletados],
        ],
      },
    ];
    exportStats(exportFormat, {
      title: "Estadísticas de empresa",
      filtros: filtrosLabel,
      fileName: `estadisticas-empresa-${new Date().toISOString().split("T")[0]}`,
      sections,
    });
  };
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showBorradores, setShowBorradores] = useState(true);

  useEffect(() => {
    if (usuario && (usuario.codigoRol === "ROLE_EMPLEADO" || usuario.codigoRol === "INVITADO")) {
      router.replace("/dashboard");
    }
  }, [usuario, router]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "formaciones") setActiveTab("formaciones");
    if (tab === "anuncios") setActiveTab("anuncios");
    if (tab === "empleados") setActiveTab("empleados");
    if (tab === "estadisticas") setActiveTab("estadisticas");
    if (tab === "documentos") setActiveTab("documentos");
    const editId = searchParams.get("edit");
    if (editId && formaciones.length > 0) {
      const f = formaciones.find((x) => x.moduloId === editId);
      if (f) {
        router.push(`/dashboard/admin/modulos/crear?edit=${editId}`);
      }
    }
  }, [searchParams, formaciones, router]);

  // Calcular estadísticas — useMemo para evitar setState doble y re-renders innecesarios
  const statsEmpresa = useMemo<EstadisticasEmpresaResponse | null>(() => {
    if (activeTab !== "estadisticas") return null;
    if (!empleados.length && !progresoEmpresa.length) return null;
    const filtros: FiltrosEstadisticas = {
      rangoMeses: statsRango,
      departamento: statsDpto,
      estado: statsEstado,
      tipoModulo: statsTipoMod,
    };
    return getEstadisticasAdminEmpresa(empleados, formaciones, progresoEmpresa, filtros);
  }, [activeTab, empleados, formaciones, progresoEmpresa, statsRango, statsDpto, statsEstado, statsTipoMod]);

  const [guardandoEditEmpleado, setGuardandoEditEmpleado] = useState(false);

  const iniciarEditEmpleado = () => {
    if (!empleadoSeleccionado) return;
    setEditEmpleadoForm({
      nombre: empleadoSeleccionado.nombre,
      apellidos: empleadoSeleccionado.apellidos,
      email: empleadoSeleccionado.email,
      password: "",
      puestoTrabajo: empleadoSeleccionado.puestoTrabajo ?? "",
      departamento: empleadoSeleccionado.departamento ?? "",
    });
    setEditandoEmpleado(true);
  };

  const handleGuardarEditEmpleado = async () => {
    if (!empleadoSeleccionado) return;
    setGuardandoEditEmpleado(true);
    try {
      const res = await apiFetch(`${API_URL}/users/${empleadoSeleccionado.usuarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editEmpleadoForm.nombre.trim(),
          apellidos: editEmpleadoForm.apellidos.trim(),
          email: editEmpleadoForm.email.trim() || undefined, // ← si está vacío no lo manda
          puestoTrabajo: editEmpleadoForm.puestoTrabajo.trim() || null,
          departamento: editEmpleadoForm.departamento || null,
        }),
      });

      const data = await res.json();
      console.log("Respuesta del servidor:", data); // ← ahora verás el error real

      if (!res.ok) {
        throw new Error(data.message ?? "Error al guardar el empleado"); // ← usa data, no res.json()
      }
      queryClient.invalidateQueries({ queryKey: QK.empleados(usuario?.empresaId) });
      setEditandoEmpleado(false);
    } catch (err) {
      console.error("Error al guardar empleado:", err); // ← AÑADE

    }
    finally { setGuardandoEditEmpleado(false); }
  };

  const handleCrearEmpleado = async () => {
    if (!formEmpleado.nombre.trim() || !formEmpleado.email.trim() || !formEmpleado.password.trim()) {
      setErrorEmpleado("Nombre, email y contraseña son obligatorios");
      return;
    }
    setGuardandoEmpleado(true);
    setErrorEmpleado(null);
    try {
      const res = await apiFetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formEmpleado.nombre.trim(),
          apellidos: formEmpleado.apellidos.trim(),
          email: formEmpleado.email.trim(),
          password: formEmpleado.password,
          empresaId: usuario?.empresaId,
          rolId: ROL_EMPLEADO_ID,
          puestoTrabajo: formEmpleado.puestoTrabajo.trim() || null,
          departamento: formEmpleado.departamento || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Error al crear el empleado");
      }
      queryClient.invalidateQueries({ queryKey: QK.empleados(usuario?.empresaId) });
      setFormEmpleado(EMPTY_EMPLEADO);
      setShowFormEmpleado(false);
    } catch (e: unknown) {
      setErrorEmpleado(e instanceof Error ? e.message : "Error al crear el empleado");
    } finally {
      setGuardandoEmpleado(false);
    }
  };

  const handleToggleEmpleado = async (usuarioId: string, activo: boolean) => {
    const accion = activo ? "desactivar" : "activar";
    if (!confirm(`¿Seguro que quieres ${accion} este empleado?`)) return;
    try {
      if (activo) {
        await apiFetch(`${API_URL}/users/${usuarioId}/desactivar`, { method: "DELETE" });
      } else {
        await apiFetch(`${API_URL}/users/${usuarioId}/activar`, { method: "PATCH" });
      }
      queryClient.invalidateQueries({ queryKey: QK.empleados(usuario?.empresaId) });
      if (empleadoSeleccionado?.usuarioId === usuarioId) setEmpleadoSeleccionado(null);
    } catch { }
  };

  function abrirCrear() {
    setInitialForm({
      titulo: "", contenido: "", esGlobal: false, empresaId: usuario?.empresaId ?? null, imagenUrl: null,
      enlaceUrl: null, enlaceTexto: null, videoUrl: null,
      adjuntoUrl: null, adjuntoNombre: null, estado: "publicado", fijado: false,
      categoria: null,
    });
    setEditando(null);
    setShowFormAnuncio(true);
    setFormError(null);
  }

  function abrirEditar(n: Noticia) {
    setInitialForm({
      titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal,
      empresaId: n.empresaId, imagenUrl: n.imagenUrl ?? null,
      enlaceUrl: n.enlaceUrl ?? null, enlaceTexto: n.enlaceTexto ?? null,
      videoUrl: n.videoUrl ?? null, adjuntoUrl: n.adjuntoUrl ?? null,
      adjuntoNombre: n.adjuntoNombre ?? null, estado: n.estado ?? "publicado",
      fijado: n.fijado ?? false, categoria: n.categoria ?? null,
    });
    setEditando(n);
    setShowFormAnuncio(true);
    setFormError(null);
  }

  function cerrarForm() {
    setShowFormAnuncio(false);
    setEditando(null);
    setInitialForm(EMPTY_ANUNCIO);
    setFormError(null);
  }

  async function handleSubmitAnuncio(data: NoticiaInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editando) await editarNoticia(editando.anuncioId, data);
      else await crearNoticia({ ...data, empresaId: usuario?.empresaId ?? null });
      queryClient.invalidateQueries({ queryKey: QK.noticias(usuario?.empresaId) });
      cerrarForm();
      mostrarToast(editando ? "Anuncio actualizado correctamente" : data.estado === "borrador" ? "Borrador guardado" : "Anuncio publicado correctamente");
    } catch { setFormError("Error al guardar. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  }

  async function handleDesactivarAnuncio(id: string) {
    try {
      await desactivarNoticia(id);
      queryClient.invalidateQueries({ queryKey: QK.noticias(usuario?.empresaId) });
      mostrarToast("Anuncio desactivado");
    } catch { }
  }

  async function publicarBorrador(n: Noticia) {
    try {
      await editarNoticia(n.anuncioId, {
        titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal,
        empresaId: n.empresaId, imagenUrl: n.imagenUrl ?? null,
        enlaceUrl: n.enlaceUrl ?? null, enlaceTexto: n.enlaceTexto ?? null,
        videoUrl: n.videoUrl ?? null, adjuntoUrl: n.adjuntoUrl ?? null,
        adjuntoNombre: n.adjuntoNombre ?? null, fijado: n.fijado ?? false,
        categoria: n.categoria ?? null, estado: "publicado",
      });
      queryClient.invalidateQueries({ queryKey: QK.noticias(usuario?.empresaId) });
      mostrarToast("Anuncio publicado correctamente");
    } catch { mostrarToast("Error al publicar el anuncio"); }
  }
  const handleEditModulo = (f: Modulo) => { router.push(`/dashboard/admin/modulos/crear?edit=${f.moduloId}`); };

  const handleDesactivarModulo = async (modulo: Modulo) => {
    const estaActivo = modulo.activo;
    const msg = estaActivo
      ? "¿Desactivar este módulo? Dejará de ser visible para los empleados."
      : "¿Activar este módulo? Volverá a ser visible para los empleados.";
    if (!confirm(msg)) return;
    try {
      let res;
      if (estaActivo) {
        res = await apiFetch(`${API_URL}/modulos/${modulo.moduloId}/desactivar`, { method: "PATCH" });
      } else {
        // Reactivar: PUT con activo: true preservando el resto de campos
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
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.message ?? "Error"); return; }
      queryClient.invalidateQueries({ queryKey: QK.modulos(usuario?.empresaId) });
    } catch { alert("Error al cambiar el estado del módulo"); }
  };

  const handleEliminarModulo = async (moduloId: string) => {
    if (!confirm("¿Eliminar este módulo permanentemente? Esta acción no se puede deshacer.")) return;
    try {
      const res = await apiFetch(`${API_URL}/modulos/${moduloId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) { alert("Error al eliminar el módulo"); return; }
      queryClient.invalidateQueries({ queryKey: QK.modulos(usuario?.empresaId) });
    } catch { alert("Error al eliminar el módulo"); }
  };

  function getInitials(nombre: string, apellidos?: string | null) {
    return [nombre, apellidos].filter(Boolean).join(" ").split(" ")
      .slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  }

  const exportarEmpleadosExcel = async () => {
    setExportando(true);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Empleados");

    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 20 },
      { header: "Apellidos", key: "apellidos", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Puesto", key: "puesto", width: 25 },
      { header: "Departamento", key: "departamento", width: 20 },
      { header: "Rol", key: "rol", width: 15 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Fecha de alta", key: "fechaAlta", width: 18 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2D5A3D" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    empleados.forEach((e) => {
      worksheet.addRow({
        nombre: e.nombre,
        apellidos: e.apellidos,
        email: e.email,
        puesto: e.puestoTrabajo ?? "",
        departamento: DEPARTAMENTOS.find((d) => d.id === e.departamento)?.label ?? e.departamento ?? "",
        rol: e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado",
        estado: e.activo ? "Activo" : "Inactivo",
        fechaAlta: formatFecha(e.fechaRegistro),
      });
    });

    const fecha = new Date().toISOString().split("T")[0];
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empleados_${fecha}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExportando(false);
    mostrarToast(`Excel exportado con ${empleados.length} empleados`);
  };

  const importarEmpleados = async (file: File) => {
    setImportando(true);
    setImportResult(null);
    const errores: string[] = [];
    let ok = 0;
    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      const filas: { rowNum: number; values: string[] }[] = [];
      worksheet.eachRow((row, rowIdx) => {
        if (rowIdx === 1) return;
        const values = (row.values as unknown[]).slice(1).map((v) => String(v ?? "").trim());
        if (values.some((v) => v)) filas.push({ rowNum: rowIdx, values });
      });
      for (const { rowNum, values } of filas) {
        const [nombre, apellidos, email, puesto, dept] = values;
        if (!nombre || !email) { errores.push(`Fila ${rowNum}: nombre y email obligatorios`); continue; }
        try {
          const res = await apiFetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre,
              apellidos: apellidos || "",
              email,
              password: "Atalayas123!",
              empresaId: usuario?.empresaId,
              rolId: ROL_EMPLEADO_ID,
              puestoTrabajo: puesto || null,
              departamento: dept ? DEPARTAMENTOS.find((d) => d.label.toUpperCase() === dept.toUpperCase())?.id ?? dept.toUpperCase() : null,
            }),
          });
          if (res.ok) ok++;
          else {
            const err = await res.json().catch(() => ({}));
            errores.push(`${email}: ${err.message ?? "Error del servidor"}`);
          }
        } catch { errores.push(`${email}: Error de conexión`); }
      }
    } catch { errores.push("El archivo no es un Excel válido"); }
    setImportando(false);
    setImportResult({ ok, errors: errores });
    queryClient.invalidateQueries({ queryKey: QK.empleados(usuario?.empresaId) });
    if (errores.length === 0) {
      mostrarToast(`${ok} empleado${ok !== 1 ? "s" : ""} importado${ok !== 1 ? "s" : ""} correctamente`);
    } else if (ok > 0) {
      mostrarToast(`${ok} importado${ok !== 1 ? "s" : ""}, ${errores.length} con error`, "error");
    } else {
      mostrarToast("Error al importar el archivo", "error");
    }
  };

  // ── Ordenación tabla desktop ─────────────────────────────────────────────────
  type EmpSortCol = "nombre" | "puesto" | "departamento" | "perfil" | "estado" | null;
  const [empSort, setEmpSort] = useState<{ col: EmpSortCol; dir: "asc" | "desc" }>({ col: null, dir: "asc" });

  const toggleEmpSort = (col: Exclude<EmpSortCol, null>) => {
    setEmpSort(prev =>
      prev.col === col
        ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { col, dir: "asc" }
    );
    setEmpPage(0);
  };

  const resetEmpSort = () => { setEmpSort({ col: null, dir: "asc" }); setEmpPage(0); };

  // ── Empleados filtrados + ordenados (frontend) ───────────────────────────────
  const empleadosFiltrados = useMemo(() => {
    const q = empSearch.toLowerCase();
    const filtered = empleados.filter((e) =>
      !q || [e.nombre, e.apellidos, e.email, e.puestoTrabajo ?? ""].some((v) => v.toLowerCase().includes(q))
    );
    if (!empSort.col) return filtered;
    const dir = empSort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (empSort.col) {
        case "nombre":
          return dir * `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`, "es");
        case "puesto":
          return dir * (a.puestoTrabajo ?? "").localeCompare(b.puestoTrabajo ?? "", "es");
        case "departamento": {
          const da = DEPARTAMENTOS.find(d => d.id === a.departamento)?.label ?? "";
          const db = DEPARTAMENTOS.find(d => d.id === b.departamento)?.label ?? "";
          return dir * da.localeCompare(db, "es");
        }
        case "perfil": {
          const pa = a.codigoRol === "ROLE_ADMIN_EMPRESA" ? 0 : 1;
          const pb = b.codigoRol === "ROLE_ADMIN_EMPRESA" ? 0 : 1;
          return dir * (pa - pb);
        }
        case "estado":
          return dir * ((a.activo ? 0 : 1) - (b.activo ? 0 : 1));
        default:
          return 0;
      }
    });
  }, [empleados, empSearch, empSort]);

  const tabs = [
    { key: "empleados"   as const, label: "Empleados",         icon: <Users size={20} />,         accent: "#1B3F7E" },
    { key: "incidencias" as const, label: "Incidencias",        icon: <TriangleAlert size={20} />, accent: "#B45309" },
    { key: "anuncios"    as const, label: "Anuncios",           icon: <Megaphone size={20} />,     accent: "#0A8A96" },
    { key: "formaciones" as const, label: "Módulos formativos", icon: <GraduationCap size={20} />, accent: "#7B4A85" },
    { key: "estadisticas"as const, label: "Estadísticas",       icon: <BarChart3 size={20} />,     accent: "#2D8653" },
    { key: "documentos"  as const, label: "Documentos",         icon: <FileText size={20} />,      accent: "#4E6D7E" },
  ];

  // Accent colors per modulo tipo for top strip
  const tipoAccentColor: Record<string, string> = {
    PREVENCION: "var(--error)",
    CALIDAD: "var(--azul-egm)",
    MEDIO_AMBIENTE: "var(--verde-oliva)",
    FORMACION_BASICA: "var(--exito)",
  };

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .28s ease both}`}</style>
      <DashboardHero
        prefijo="Panel de "
        titulo="Administración"
        imagenFondo="/background-admin.webp"
      />

      <div className="px-10 lg:px-16 pt-10 pb-16">
        {/* Tabs — desktop */}
        <div className="hidden sm:block mb-8"
          style={{ borderBottom: "1px solid var(--gris-borde)" }}>
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative flex items-center gap-2 px-5 py-3 text-base font-semibold focus:outline-none"
                  animate={{ color: isActive ? tab.accent : "var(--texto-muted)" }}
                  transition={{ duration: 0.18 }}
                  style={{ background: "transparent", border: "none", cursor: "pointer" }}
                  whileHover={{ color: isActive ? tab.accent : "var(--texto-primario)" }}
                >
                  {tab.icon}
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="admin-tab-underline"
                      style={{
                        position: "absolute",
                        bottom: -1,
                        left: 0,
                        right: 0,
                        height: 2,
                        borderRadius: 2,
                        background: tab.accent,
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tabs — móvil (selector compacto con dropdown) */}
        <div className="sm:hidden mb-6 relative">
          {/* Botón selector — muestra tab activo */}
          {(() => {
            const activeTabData = tabs.find(t => t.key === activeTab)!;
            return (
              <motion.button
                onClick={() => setTabMenuOpen(o => !o)}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl focus:outline-none"
                style={{
                  background: "var(--blanco)",
                  border: `1.5px solid ${tabMenuOpen ? activeTabData.accent : "var(--gris-borde)"}`,
                  cursor: "pointer",
                  transition: "border-color 0.18s",
                }}
              >
                {/* Icono con color de acento */}
                <span style={{ color: activeTabData.accent }}>
                  {React.cloneElement(activeTabData.icon, { size: 20 })}
                </span>
                <span className="flex-1 text-left text-sm font-bold" style={{ color: "var(--texto-primario)" }}>
                  {activeTabData.label}
                </span>
                <motion.span
                  animate={{ rotate: tabMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: "var(--texto-muted)", display: "flex" }}
                >
                  <ChevronDown size={18} />
                </motion.span>
              </motion.button>
            );
          })()}

          {/* Dropdown de opciones */}
          <AnimatePresence>
            {tabMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.34, 1.2, 0.64, 1] }}
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-30"
                style={{
                  background: "var(--blanco)",
                  border: "1px solid var(--surface-border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                }}
              >
                {tabs.map((tab, idx) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <motion.button
                      key={tab.key}
                      onClick={() => { setActiveTab(tab.key); setTabMenuOpen(false); }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold focus:outline-none"
                      style={{
                        background: isActive ? tab.accent + "12" : "transparent",
                        borderBottom: idx < tabs.length - 1 ? "1px solid var(--surface-border)" : "none",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ color: isActive ? tab.accent : "var(--texto-muted)" }}>
                        {React.cloneElement(tab.icon, { size: 18 })}
                      </span>
                      <span style={{ color: isActive ? tab.accent : "var(--texto-primario)" }}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <span className="ml-auto w-2 h-2 rounded-full shrink-0" style={{ background: tab.accent }} />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Contenido de tabs con animación ── */}
        <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >

        {/* ── TAB EMPLEADOS ── */}
        {activeTab === "empleados" && (
          <div className="relative">
            {/* Título */}
            <div className="mb-8 text-center sm:text-left">
              <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                Gestión de equipo
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                {empleados.length} persona{empleados.length !== 1 ? "s" : ""}
                {empleados.filter(e => !e.activo).length > 0 && (
                  <span style={{ color: "var(--error)", fontWeight: 600 }}>
                    {" "}· {empleados.filter(e => !e.activo).length} inactiva{empleados.filter(e => !e.activo).length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>

            {/* ── Modal nuevo empleado ── */}
            <AnimatePresence>
            {showFormEmpleado && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                style={{ background: "var(--overlay, rgba(0,0,0,0.45))" }}
                onClick={() => { if (!guardandoEmpleado) { setShowFormEmpleado(false); setErrorEmpleado(null); } }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 28, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.97 }}
                  transition={{ duration: 0.26, ease: [0.34, 1.15, 0.64, 1] }}
                  className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: "var(--gris-panel)", maxHeight: "92dvh", boxShadow: "0 24px 56px rgba(0,0,0,0.18)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Cabecera */}
                  <div className="flex items-center justify-between px-5 sm:px-6 shrink-0"
                    style={{ paddingTop: "20px", paddingBottom: "20px", position: "relative", background: "#2563EB" }}>
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                      <Grainient
                        color1="#1B3F7E" color2="#2563EB" color3="#1D4ED8"
                        timeSpeed={0.18} warpStrength={1.2} warpFrequency={4.0}
                        warpSpeed={1.5} warpAmplitude={60} grainAmount={0.08}
                        contrast={1.3} saturation={1.1} zoom={0.85}
                        style={{ width: "100%", height: "100%", display: "block" }}
                      />
                    </div>
                    <h2 className="text-2xl font-bold" style={{ color: "#ffffff", position: "relative", zIndex: 1 }}>
                      Nuevo empleado
                    </h2>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <IconButton variant="glass" label="Cerrar" onClick={() => { setShowFormEmpleado(false); setErrorEmpleado(null); }} />
                    </div>
                  </div>

                  {/* Formulario scrollable */}
                  <form
                    id="form-nuevo-empleado"
                    onSubmit={(e) => { e.preventDefault(); if (formEmpleado.nombre.trim() && formEmpleado.email.trim() && formEmpleado.password.trim()) handleCrearEmpleado(); }}
                    className="flex flex-col gap-4 px-5 sm:px-6 py-5 overflow-y-auto"
                    style={{ flex: 1, opacity: guardandoEmpleado ? 0.6 : 1, pointerEvents: guardandoEmpleado ? "none" : undefined, transition: "opacity 0.2s ease" }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nombre */}
                      <EmpCampo label="Nombre" required placeholder="María"
                        value={formEmpleado.nombre} onChange={(v) => setFormEmpleado({ ...formEmpleado, nombre: v })} />
                      {/* Apellidos */}
                      <EmpCampo label="Apellidos" placeholder="García López"
                        value={formEmpleado.apellidos} onChange={(v) => setFormEmpleado({ ...formEmpleado, apellidos: v })} />
                    </div>
                    {/* Email */}
                    <EmpCampo label="Email" required type="email" placeholder="m.garcia@empresa.com"
                      value={formEmpleado.email} onChange={(v) => setFormEmpleado({ ...formEmpleado, email: v })} />
                    {/* Contraseña */}
                    <EmpCampo label="Contraseña inicial" required type="password" placeholder="Mínimo 8 caracteres"
                      hint="El empleado podrá cambiarla en su primer acceso"
                      value={formEmpleado.password} onChange={(v) => setFormEmpleado({ ...formEmpleado, password: v })} />
                    {/* Divisor secciones */}
                    <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", margin: "2px 0" }} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Puesto */}
                      <EmpCampo label="Puesto de trabajo" placeholder="Ej: Técnico de producción"
                        value={formEmpleado.puestoTrabajo} onChange={(v) => setFormEmpleado({ ...formEmpleado, puestoTrabajo: v })} />
                      {/* Departamento */}
                      <EmpSelect
                        label="Departamento"
                        value={formEmpleado.departamento}
                        onChange={(v) => setFormEmpleado({ ...formEmpleado, departamento: v })}
                        options={DEPARTAMENTOS}
                      />
                    </div>
                    {errorEmpleado && (
                      <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.07)", color: "var(--error)" }}>
                        {errorEmpleado}
                      </p>
                    )}
                  </form>

                  {/* Footer */}
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2.5 px-5 sm:px-6 py-4 shrink-0"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#ffffff", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
                    <Button type="button" variant="secondary" className="w-full sm:w-auto order-2 sm:order-1"
                      onClick={() => { setShowFormEmpleado(false); setErrorEmpleado(null); }} disabled={guardandoEmpleado}>
                      Cancelar
                    </Button>
                    <Button type="submit" form="form-nuevo-empleado" className="w-full sm:w-auto order-1 sm:order-2"
                      disabled={guardandoEmpleado || !formEmpleado.nombre.trim() || !formEmpleado.email.trim() || !formEmpleado.password.trim()}>
                      {guardandoEmpleado ? "Creando…" : "Crear empleado"}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Barra de herramientas */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-8">
              {/* Buscador */}
              <div className="flex flex-col w-full sm:w-64 shrink-0" style={{ minHeight: 48 }}>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar empleado…"
                    value={empSearchInput}
                    onChange={(e) => { setEmpSearchInput(e.target.value); setEmpPage(0); }}
                    className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl outline-none transition-colors"
                    style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--tab-empleados)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
                  />
                  {empSearch && (
                    <button
                      onClick={() => { setEmpSearch(""); setEmpSearchInput(""); setEmpPage(0); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-colors"
                      style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                <p className="text-xs pl-1 mt-1.5 transition-opacity duration-150"
                  style={{ color: "var(--texto-muted)", opacity: empSearch ? 1 : 0, pointerEvents: empSearch ? "auto" : "none" }}>
                  {empleadosFiltrados.length === 0
                    ? "Sin resultados"
                    : `${empleadosFiltrados.length} resultado${empleadosFiltrados.length !== 1 ? "s" : ""} para "${empSearch}"`}
                </p>
              </div>

              {/* Botones */}
              <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
                <input ref={inputImportRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) importarEmpleados(f); }} />
                <Button variant="primary" size="md" disabled={importando} onClick={() => inputImportRef.current?.click()}
                  style={{ background: "#16a34a", border: "1px solid rgba(255,255,255,0.18)", flexShrink: 0 }}>
                  {importando
                    ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><Upload size={15} /><span className="hidden sm:inline">&nbsp;Importar Excel</span></>}
                </Button>
                <Button variant="primary" size="md" disabled={exportando || empleados.length === 0} onClick={exportarEmpleadosExcel}
                  style={{ background: "#16a34a", border: "1px solid rgba(255,255,255,0.18)", flexShrink: 0 }}>
                  {exportando
                    ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><Download size={15} /><span className="hidden sm:inline">&nbsp;Exportar Excel</span></>}
                </Button>
                <Button variant="primary" size="md" className="flex-1 sm:flex-none" onClick={() => { setShowFormEmpleado(true); setErrorEmpleado(null); }}>
                  <Plus size={15} />
                  <span className="hidden sm:inline">Añadir empleado</span>
                  <span className="sm:hidden">Añadir</span>
                </Button>
              </div>
            </div>

            {/* Tabla — ocupa todo el ancho */}
            <div>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                {cargandoEmpleados ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin"
                      style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
                  </div>
                ) : empleados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "var(--gris-pagina)" }}>
                      <Users size={22} color="var(--texto-muted)" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>No hay empleados todavía</p>
                    <p className="text-xs mt-1 mb-4" style={{ color: "var(--texto-muted)" }}>Añade el primer empleado a tu empresa</p>
                    <button onClick={() => setShowFormEmpleado(true)}
                      className="text-xs font-semibold px-4 py-2 rounded-xl"
                      style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                      Añadir el primero →
                    </button>
                  </div>
                ) : empleadosFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "var(--gris-pagina)" }}>
                      <Users size={22} color="var(--texto-muted)" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Sin resultados</p>
                    <p className="text-xs mt-1 mb-4" style={{ color: "var(--texto-muted)" }}>Ningún empleado coincide con tu búsqueda</p>
                    <button onClick={() => { setEmpSearch(""); setEmpSearchInput(""); }}
                      className="text-xs font-semibold px-4 py-2 rounded-xl"
                      style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Vista desktop — tabla */}
                    <div className="hidden md:block">
                      <table className="w-full table-fixed">
                        <colgroup>
                          <col style={{ width: "30%" }} />
                          <col style={{ width: "19%" }} />
                          <col style={{ width: "19%" }} />
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "12%" }} />
                          <col style={{ width: "48px" }} />
                        </colgroup>
                        <thead>
                          <tr style={{ background: "var(--azul-egm-light)", borderBottom: "1px solid var(--surface-border)" }}>
                            {([
                              { label: "Empleado",     col: "nombre"       as EmpSortCol, pad: "pl-14 pr-6" },
                              { label: "Puesto",       col: "puesto"        as EmpSortCol, pad: "px-6"       },
                              { label: "Departamento", col: "departamento"  as EmpSortCol, pad: "px-6"       },
                              { label: "Perfil",       col: "perfil"        as EmpSortCol, pad: "px-6"       },
                              { label: "Estado",       col: "estado"        as EmpSortCol, pad: "pl-6 pr-6"  },
                            ]).map(({ label, col, pad }) => (
                              <th key={label} className={`text-left py-3.5 ${pad}`} style={{ color: "var(--azul-egm)" }}>
                                <button
                                  onClick={() => toggleEmpSort(col!)}
                                  className="inline-flex items-center gap-1 focus:outline-none select-none uppercase tracking-wider text-sm font-bold"
                                  style={{ cursor: "pointer", background: "none", border: "none", padding: 0, color: "inherit", fontFamily: "inherit" }}
                                >
                                  {label}
                                  <span style={{
                                    opacity: empSort.col === col ? 1 : 0.25,
                                    transition: "opacity 0.15s, transform 0.2s",
                                    display: "flex",
                                    transform: empSort.col === col && empSort.dir === "asc" ? "rotate(180deg)" : "rotate(0deg)",
                                  }}>
                                    <ChevronDown size={13} strokeWidth={2.5} />
                                  </span>
                                </button>
                              </th>
                            ))}
                            <th className="py-3.5 pr-3 text-right">
                              <motion.button
                                animate={{ opacity: empSort.col ? 1 : 0, scale: empSort.col ? 1 : 0.75 }}
                                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                onClick={resetEmpSort}
                                title="Quitar orden"
                                className="inline-flex items-center justify-center focus:outline-none"
                                style={{
                                  width: 30, height: 30, borderRadius: "50%",
                                  background: "rgba(255,255,255,0.52)",
                                  border: "1px solid rgba(255,255,255,0.80)",
                                  backdropFilter: "blur(10px)",
                                  WebkitBackdropFilter: "blur(10px)",
                                  boxShadow: "0 2px 8px rgba(27,63,126,0.18)",
                                  color: "var(--azul-egm)",
                                  cursor: empSort.col ? "pointer" : "default",
                                  flexShrink: 0,
                                  pointerEvents: empSort.col ? "auto" : "none",
                                }}
                              >
                                <RefreshCw size={14} strokeWidth={2.3} />
                              </motion.button>
                            </th>
                          </tr>
                        </thead>
                        <AnimatePresence mode="wait">
                        <tbody key={empPage}>
                          {empleadosFiltrados.slice(empPage * PAGE_SIZE, (empPage + 1) * PAGE_SIZE).map((e, idx) => (
                            <motion.tr
                              key={e.usuarioId}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.12, ease: "easeOut" }}
                              className="cursor-pointer"
                              style={{
                                borderBottom: idx < Math.min(empleadosFiltrados.length, PAGE_SIZE) - 1 ? "1px solid var(--surface-border)" : "none",
                                borderLeft: empleadoSeleccionado?.usuarioId === e.usuarioId ? "3px solid var(--azul-egm)" : "3px solid transparent",
                                background: empleadoSeleccionado?.usuarioId === e.usuarioId
                                  ? "var(--azul-egm-light)"
                                  : idx % 2 === 0 ? "#ffffff" : "#fafbfc",
                                transition: "border-left-color 0.15s, background 0.15s",
                              }}
                              onClick={() => setEmpleadoSeleccionado(
                                empleadoSeleccionado?.usuarioId === e.usuarioId ? null : e
                              )}
                              onMouseEnter={(el) => {
                                if (empleadoSeleccionado?.usuarioId !== e.usuarioId)
                                  el.currentTarget.style.background = "var(--gris-superficie)";
                              }}
                              onMouseLeave={(el) => {
                                if (empleadoSeleccionado?.usuarioId !== e.usuarioId)
                                  el.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#fafbfc";
                              }}
                            >
                              <td className="py-3.5 pl-14 pr-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-150"
                                    style={{
                                      background: "var(--azul-egm-light)",
                                      color: "var(--azul-egm)",
                                      outline: empleadoSeleccionado?.usuarioId === e.usuarioId ? "2px solid var(--azul-egm)" : "2px solid transparent",
                                      outlineOffset: "2px",
                                    }}>
                                    {getInitials(e.nombre, e.apellidos)}
                                  </div>
                                  <div>
                                    <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
                                      {e.nombre} {e.apellidos}
                                    </p>
                                    <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>{e.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-6 text-base" style={{ color: "var(--texto-secundario)" }}>
                                {e.puestoTrabajo ?? <span style={{ color: "var(--texto-muted)" }}>-</span>}
                              </td>
                              <td className="py-3.5 px-6">
                                {e.departamento ? (
                                  <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                    style={{ background: "rgba(10,138,150,0.10)", color: "#0A8A96" }}>
                                    {DEPARTAMENTOS.find((d) => d.id === e.departamento)?.label ?? e.departamento}
                                  </span>
                                ) : (
                                  <span className="text-base" style={{ color: "var(--texto-muted)" }}>-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                  style={e.codigoRol === "ROLE_ADMIN_EMPRESA"
                                    ? { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }
                                    : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                  {e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"}
                                </span>
                              </td>
                              <td className="py-3.5 pl-6 pr-6">
                                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                  style={e.activo
                                    ? { background: "var(--exito-light)", color: "var(--exito)" }
                                    : { background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                  {e.activo ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td />
                            </motion.tr>
                          ))}
                        </tbody>
                        </AnimatePresence>
                      </table>
                      {/* Paginación desktop empleados */}
                      {empleadosFiltrados.length > PAGE_SIZE && (() => {
                        const totalPages = Math.ceil(empleadosFiltrados.length / PAGE_SIZE);
                        const pages = Array.from({ length: totalPages }, (_, i) => i);
                        return (
                          <div className="flex items-center justify-center gap-1 px-5 py-4" style={{ borderTop: "1px solid var(--surface-border)" }}>
                            {/* Botón anterior */}
                            <motion.button
                              onClick={() => setEmpPage(p => Math.max(0, p - 1))}
                              disabled={empPage === 0}
                              whileHover={empPage !== 0 ? { scale: 1.05 } : {}}
                              whileTap={empPage !== 0 ? { scale: 0.95 } : {}}
                              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-semibold disabled:opacity-30"
                              style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--surface-border)", cursor: empPage === 0 ? "default" : "pointer" }}
                            >
                              <ChevronLeft size={15} strokeWidth={2} />
                              Anterior
                            </motion.button>

                            {/* Números */}
                            <div className="flex items-center gap-1 mx-1">
                              {pages.map(p => (
                                <motion.button
                                  key={p}
                                  onClick={() => setEmpPage(p)}
                                  whileHover={p !== empPage ? { scale: 1.08, background: "var(--gris-superficie)" } : {}}
                                  whileTap={{ scale: 0.92 }}
                                  animate={p === empPage
                                    ? { background: "#1B3F7E", color: "#ffffff" }
                                    : { background: "transparent", color: "var(--texto-secundario)" }
                                  }
                                  transition={{ duration: 0.18, ease: [0.34, 1.2, 0.64, 1] }}
                                  className="w-9 h-9 rounded-xl text-sm font-semibold"
                                  style={{ border: p === empPage ? "none" : "1px solid transparent", cursor: "pointer" }}
                                >{p + 1}</motion.button>
                              ))}
                            </div>

                            {/* Botón siguiente */}
                            <motion.button
                              onClick={() => setEmpPage(p => p + 1)}
                              disabled={(empPage + 1) * PAGE_SIZE >= empleadosFiltrados.length}
                              whileHover={(empPage + 1) * PAGE_SIZE < empleadosFiltrados.length ? { scale: 1.05 } : {}}
                              whileTap={(empPage + 1) * PAGE_SIZE < empleadosFiltrados.length ? { scale: 0.95 } : {}}
                              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-semibold disabled:opacity-30"
                              style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--surface-border)", cursor: (empPage + 1) * PAGE_SIZE >= empleadosFiltrados.length ? "default" : "pointer" }}
                            >
                              Siguiente
                              <ChevronRight size={15} strokeWidth={2} />
                            </motion.button>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Vista móvil — tarjetas */}
                    <div className="md:hidden flex flex-col">
                      {empleadosFiltrados.slice(empPage * PAGE_SIZE_MOBILE, (empPage + 1) * PAGE_SIZE_MOBILE).map((e, idx) => {
                        const isSelected = empleadoSeleccionado?.usuarioId === e.usuarioId;
                        return (
                        <motion.div
                          key={e.usuarioId}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, delay: idx * 0.04, ease: "easeOut" }}
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => setEmpleadoSeleccionado(isSelected ? null : e)}
                          style={{
                            padding: "12px 16px",
                            borderBottom: idx < Math.min(empleadosFiltrados.length, PAGE_SIZE_MOBILE) - 1 ? "1px solid var(--surface-border)" : "none",
                            borderLeft: `3px solid ${isSelected ? "var(--azul-egm)" : "transparent"}`,
                            background: isSelected ? "var(--azul-egm-light)" : idx % 2 === 0 ? "#ffffff" : "#fafbfc",
                            transition: "border-left-color 0.15s, background 0.15s",
                          }}
                        >
                          {/* Avatar con dot de estado */}
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "2px solid var(--azul-egm)" }}>
                              {getInitials(e.nombre, e.apellidos)}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                              style={{ background: e.activo ? "var(--exito)" : "var(--texto-muted)" }} />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="text-sm font-semibold truncate min-w-0 flex-1" style={{ color: "var(--texto-primario)" }}>
                                {e.nombre} {e.apellidos}
                              </p>
                              <span className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full"
                                style={e.codigoRol === "ROLE_ADMIN_EMPRESA"
                                  ? { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }
                                  : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                {e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Admin" : "Emp."}
                              </span>
                            </div>
                            <p className="text-xs truncate mt-0.5" style={{ color: "var(--texto-muted)" }}>
                              {e.puestoTrabajo ? `${e.puestoTrabajo} · ${e.email}` : e.email}
                            </p>
                          </div>

                          {/* Chevron */}
                          <ChevronRight size={16} strokeWidth={2} style={{ color: "var(--texto-muted)", flexShrink: 0, opacity: isSelected ? 1 : 0.4 }} />
                        </motion.div>
                        );
                      })}
                      {/* Paginación móvil empleados */}
                      {empleadosFiltrados.length > PAGE_SIZE_MOBILE && (
                        <div className="flex items-center justify-center gap-2 px-5 py-4" style={{ borderTop: "1px solid var(--surface-border)" }}>
                          <motion.button
                            onClick={() => setEmpPage(p => Math.max(0, p - 1))}
                            disabled={empPage === 0}
                            whileHover={empPage !== 0 ? { scale: 1.05 } : {}}
                            whileTap={empPage !== 0 ? { scale: 0.95 } : {}}
                            className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-semibold disabled:opacity-30"
                            style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--surface-border)", cursor: empPage === 0 ? "default" : "pointer" }}
                          ><ChevronLeft size={15} strokeWidth={2} /></motion.button>
                          <span className="text-sm font-semibold px-2" style={{ color: "var(--texto-secundario)" }}>
                            {empPage + 1} / {Math.ceil(empleadosFiltrados.length / PAGE_SIZE_MOBILE)}
                          </span>
                          <motion.button
                            onClick={() => setEmpPage(p => p + 1)}
                            disabled={(empPage + 1) * PAGE_SIZE_MOBILE >= empleadosFiltrados.length}
                            whileHover={(empPage + 1) * PAGE_SIZE_MOBILE < empleadosFiltrados.length ? { scale: 1.05 } : {}}
                            whileTap={(empPage + 1) * PAGE_SIZE_MOBILE < empleadosFiltrados.length ? { scale: 0.95 } : {}}
                            className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-semibold disabled:opacity-30"
                            style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--surface-border)", cursor: (empPage + 1) * PAGE_SIZE_MOBILE >= empleadosFiltrados.length ? "default" : "pointer" }}
                          ><ChevronRight size={15} strokeWidth={2} /></motion.button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* ── Slide-over desktop ── */}
            <AnimatePresence>
              {empleadoSeleccionado && (
                <>
                  {/* Backdrop sutil */}
                  <motion.div
                    className="hidden md:block fixed inset-0 z-40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ background: "rgba(15,25,35,0.25)" }}
                    onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }}
                  />
                  {/* Panel */}
                  <motion.div
                    className="hidden md:flex fixed top-0 right-0 h-full z-50 flex-col overflow-hidden"
                    style={{
                      width: 400,
                      background: "var(--azul-egm)",
                      borderLeft: "1px solid rgba(0,0,0,0.08)",
                      boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
                    }}
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 340, damping: 34 }}
                  >
                    {/* Header slide-over */}
                    <div className="px-6 flex items-center justify-between shrink-0"
                      style={{ height: 80, background: "var(--azul-egm)" }}>
                      <h3 className="text-xl font-bold" style={{ color: "#ffffff" }}>Ficha de empleado</h3>
                      <IconButton variant="glass" label="Cerrar" onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }} />
                    </div>

                    {/* Contenido scroll */}
                    <div className="flex-1 overflow-y-auto" style={{ background: "var(--gris-pagina)" }}>
                      <AnimatePresence mode="wait">
                        {editandoEmpleado ? (
                          <motion.div key="edit"
                            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="flex flex-col gap-6 px-6 py-6"
                          >
                            {/* Avatar mini — reactivo al formulario */}
                            <div className="flex items-center gap-3 py-4 px-4 rounded-2xl" style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "2px solid var(--azul-egm)" }}>
                                {getInitials(
                                  editEmpleadoForm.nombre || empleadoSeleccionado.nombre,
                                  editEmpleadoForm.apellidos || empleadoSeleccionado.apellidos
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate" style={{ color: "var(--texto-primario)" }}>
                                  {(editEmpleadoForm.nombre || empleadoSeleccionado.nombre)}{" "}
                                  {(editEmpleadoForm.apellidos || empleadoSeleccionado.apellidos)}
                                </p>
                                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--texto-muted)" }}>
                                  {editEmpleadoForm.email || empleadoSeleccionado.email}
                                </p>
                              </div>
                            </div>

                            {/* Campos */}
                            <div className="flex flex-col gap-4 p-5 rounded-2xl" style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                              {[
                                { key: "nombre", label: "Nombre" },
                                { key: "apellidos", label: "Apellidos" },
                                { key: "email", label: "Email", type: "email" },
                                { key: "puestoTrabajo", label: "Puesto" },
                              ].map(({ key, label, type = "text" }) => (
                                <EmpCampo key={key} label={label} type={type}
                                  value={editEmpleadoForm[key as keyof NuevoEmpleadoForm]}
                                  onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, [key]: v }))} />
                              ))}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>Departamento</label>
                                <EmpSelect label="" value={editEmpleadoForm.departamento}
                                  onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, departamento: v }))}
                                  options={DEPARTAMENTOS} placeholder="Sin departamento" />
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div key="view"
                            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="flex flex-col gap-6 px-6 py-6"
                          >
                            {/* Avatar + contacto */}
                            <div className="flex flex-col items-center gap-3 py-6 px-4 rounded-2xl"
                              style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                              {/* Avatar con dot de estado */}
                              <div className="relative">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
                                  style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "3px solid var(--azul-egm)" }}>
                                  {getInitials(empleadoSeleccionado.nombre, empleadoSeleccionado.apellidos)}
                                </div>
                                <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white"
                                  style={{ background: empleadoSeleccionado.activo ? "var(--exito)" : "var(--texto-muted)" }} />
                              </div>
                              <div className="text-center">
                                <p className="text-base font-bold" style={{ color: "var(--texto-primario)" }}>
                                  {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellidos}
                                </p>
                                <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>{empleadoSeleccionado.email}</p>
                              </div>
                            </div>

                            {/* Datos */}
                            <div className="flex flex-col gap-0" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--surface-border)" }}>
                              {/* Estado */}
                              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Estado</span>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                  style={empleadoSeleccionado.activo
                                    ? { background: "var(--exito-light)", color: "var(--exito)" }
                                    : { background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                  {empleadoSeleccionado.activo ? "Activo" : "Inactivo"}
                                </span>
                              </div>
                              {/* Perfil */}
                              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Perfil</span>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                  style={empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA"
                                    ? { background: "rgba(180,83,9,0.10)", color: "#B45309" }
                                    : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                  {empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"}
                                </span>
                              </div>
                              {/* Departamento */}
                              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Departamento</span>
                                {empleadoSeleccionado.departamento
                                  ? <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(10,138,150,0.10)", color: "#0A8A96" }}>
                                      {DEPARTAMENTOS.find((d) => d.id === empleadoSeleccionado.departamento)?.label ?? empleadoSeleccionado.departamento}
                                    </span>
                                  : <span className="text-sm" style={{ color: "var(--texto-muted)" }}>-</span>}
                              </div>
                              {/* Puesto */}
                              {empleadoSeleccionado.puestoTrabajo && (
                                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Puesto</span>
                                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(78,109,126,0.10)", color: "#4E6D7E" }}>
                                    {empleadoSeleccionado.puestoTrabajo}
                                  </span>
                                </div>
                              )}
                              {/* Alta */}
                              <div className="flex items-center justify-between px-5 py-4" style={{ background: "var(--blanco)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Alta</span>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                  style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)" }}>
                                  {formatFecha(empleadoSeleccionado.fechaRegistro)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Footer acciones */}
                    <div className="px-6 py-5 flex flex-col gap-2.5 shrink-0"
                      style={{ borderTop: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                      {editandoEmpleado ? (
                        <div className="flex gap-2.5">
                          <Button variant="secondary" size="md" className="flex-1" onClick={() => setEditandoEmpleado(false)}>
                            Cancelar
                          </Button>
                          <Button variant="primary" size="md" className="flex-1" onClick={handleGuardarEditEmpleado} disabled={guardandoEditEmpleado}>
                            {guardandoEditEmpleado
                              ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />&nbsp;Guardando…</>
                              : "Guardar cambios"}
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button variant="primary" size="md" onClick={iniciarEditEmpleado}>
                            Editar empleado
                          </Button>
                          <Button
                            variant={empleadoSeleccionado.activo ? "danger" : "secondary"}
                            size="md"
                            onClick={() => handleToggleEmpleado(empleadoSeleccionado.usuarioId, empleadoSeleccionado.activo)}>
                            {empleadoSeleccionado.activo ? "Desactivar empleado" : "Activar empleado"}
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Bottom sheet móvil */}
            <AnimatePresence>
            {empleadoSeleccionado && (
              <>
                {/* Backdrop */}
                <motion.div
                  className="md:hidden fixed inset-0"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ background: "rgba(15,25,35,0.35)", zIndex: 1090 }}
                  onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }}
                />
                <motion.div
                  className="md:hidden fixed bottom-0 left-0 right-0 rounded-t-3xl flex flex-col"
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 36 }}
                  style={{ background: "var(--gris-pagina)", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)", maxHeight: "88vh", zIndex: 1100 }}>

                  {/* Header mobile bottom sheet */}
                  <div className="rounded-t-3xl shrink-0"
                    style={{ background: "var(--azul-egm)" }}>
                    <div className="px-5 pt-2 pb-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {editandoEmpleado ? "Editando empleado" : "Ficha de empleado"}
                        </p>
                        <IconButton variant="glass" label="Cerrar" onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
                            style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "2px solid rgba(255,255,255,0.4)" }}>
                            {getInitials(
                              editandoEmpleado ? (editEmpleadoForm.nombre || empleadoSeleccionado.nombre) : empleadoSeleccionado.nombre,
                              editandoEmpleado ? (editEmpleadoForm.apellidos || empleadoSeleccionado.apellidos) : empleadoSeleccionado.apellidos
                            )}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold truncate" style={{ color: "#fff" }}>
                            {editandoEmpleado
                              ? `${editEmpleadoForm.nombre || empleadoSeleccionado.nombre} ${editEmpleadoForm.apellidos || empleadoSeleccionado.apellidos}`
                              : `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellidos}`}
                          </p>
                          <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                            {editandoEmpleado ? (editEmpleadoForm.email || empleadoSeleccionado.email) : empleadoSeleccionado.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contenido scrollable */}
                  <div className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      {editandoEmpleado ? (
                        <motion.div key="edit"
                          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="px-4 py-4">
                          <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                            {/* Nombre + Apellidos en fila */}
                            <div className="grid grid-cols-2 gap-3">
                              <EmpCampo label="Nombre"
                                value={editEmpleadoForm.nombre}
                                onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, nombre: v }))} />
                              <EmpCampo label="Apellidos"
                                value={editEmpleadoForm.apellidos}
                                onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, apellidos: v }))} />
                            </div>
                            <EmpCampo label="Email" type="email"
                              value={editEmpleadoForm.email}
                              onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, email: v }))} />
                            <EmpCampo label="Puesto"
                              value={editEmpleadoForm.puestoTrabajo}
                              onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, puestoTrabajo: v }))} />
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>Departamento</label>
                              <EmpSelect label="" value={editEmpleadoForm.departamento}
                                onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, departamento: v }))}
                                options={DEPARTAMENTOS} placeholder="Sin departamento" />
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="view"
                          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="px-4 py-4">
                          <div className="flex flex-col gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--surface-border)" }}>
                            {[
                              { label: "Estado",       value: empleadoSeleccionado.activo ? "Activo" : "Inactivo",                                                                    badge: empleadoSeleccionado.activo ? { bg: "var(--exito-light)", color: "var(--exito)" } : { bg: "var(--gris-superficie)", color: "var(--texto-muted)" } },
                              { label: "Perfil",       value: empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado",                                  badge: empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? { bg: "rgba(180,83,9,0.10)", color: "#B45309" } : { bg: "var(--azul-egm-light)", color: "var(--azul-egm)" } },
                              { label: "Departamento", value: DEPARTAMENTOS.find(d => d.id === empleadoSeleccionado.departamento)?.label,                                              badge: { bg: "var(--lima-light)", color: "var(--verde-oliva)" } },
                              { label: "Puesto",       value: empleadoSeleccionado.puestoTrabajo,                                                                                      badge: { bg: "rgba(78,109,126,0.10)", color: "#4E6D7E" } },
                              { label: "Alta",         value: formatFecha(empleadoSeleccionado.fechaRegistro),                                                                         badge: { bg: "var(--gris-superficie)", color: "var(--texto-secundario)" } },
                            ].map(({ label, value, badge }, idx, arr) => (
                              <div key={label} className="flex items-center justify-between px-4 py-3"
                                style={{ borderBottom: idx < arr.length - 1 ? "1px solid var(--surface-border)" : "none", background: "var(--blanco)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>{label}</span>
                                {value
                                  ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>{value}</span>
                                  : <span className="text-xs" style={{ color: "var(--texto-muted)" }}>-</span>}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer fijo */}
                  <div className="px-5 py-4 shrink-0"
                    style={{ borderTop: "1px solid var(--surface-border)", background: "var(--blanco)", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
                    {editandoEmpleado ? (
                      <div className="flex gap-2.5">
                        <Button variant="secondary" size="md" className="flex-1" onClick={() => setEditandoEmpleado(false)}>
                          Cancelar
                        </Button>
                        <Button variant="primary" size="md" className="flex-1" onClick={handleGuardarEditEmpleado} disabled={guardandoEditEmpleado}>
                          {guardandoEditEmpleado
                            ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />&nbsp;Guardando…</>
                            : "Guardar cambios"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button variant="primary" size="md" className="w-full" onClick={iniciarEditEmpleado}>
                          Editar empleado
                        </Button>
                        <Button variant={empleadoSeleccionado.activo ? "danger" : "secondary"} size="md" className="w-full"
                          onClick={() => handleToggleEmpleado(empleadoSeleccionado.usuarioId, empleadoSeleccionado.activo)}>
                          {empleadoSeleccionado.activo ? "Desactivar empleado" : "Activar empleado"}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
            </AnimatePresence>

            {/* Import result notification */}
            {importResult && (
              <div className="mt-6 rounded-2xl overflow-hidden fade-up" style={{ border: `1.5px solid ${importResult.errors.length === 0 ? "var(--exito)" : "#fcd34d"}`, background: importResult.errors.length === 0 ? "#f0fdf4" : "#fffbeb" }}>
                <div className="px-5 py-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: importResult.errors.length === 0 ? "var(--exito-light)" : "#fde68a" }}>
                    {importResult.errors.length === 0 ? (
                      <Check size={16} strokeWidth={2.5} style={{ color: "var(--exito)" }} />
                    ) : (
                      <TriangleAlert size={16} strokeWidth={2} style={{ color: "#d97706" }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: importResult.errors.length === 0 ? "var(--exito)" : "#92400e" }}>
                      Importación completada
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: importResult.errors.length === 0 ? "var(--exito)" : "#b45309" }}>
                      {importResult.ok} empleado{importResult.ok !== 1 ? "s" : ""} importado{importResult.ok !== 1 ? "s" : ""} correctamente
                      {importResult.errors.length > 0 && ` · ${importResult.errors.length} error${importResult.errors.length !== 1 ? "es" : ""}`}
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1 max-h-24 overflow-y-auto">
                        {importResult.errors.map((err, i) => (
                          <p key={i} className="text-xs" style={{ color: "#dc2626" }}>• {err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setImportResult(null)}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors"
                    style={{ color: importResult.errors.length === 0 ? "var(--exito)" : "#92400e", background: importResult.errors.length === 0 ? "var(--exito-light)" : "#fde68a" }}>
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB ANUNCIOS ── */}
        {activeTab === "anuncios" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  Gestion de Anuncios
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>Comunica novedades a todos los empleados</p>
              </div>
              <button onClick={abrirCrear}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}>
                <Plus size={14} />
                Nuevo anuncio
              </button>
            </div>

            {showFormAnuncio && (
              <div className="mb-8">
                <FormAnuncio
                  initialValues={initialForm}
                  editando={editando}
                  submitting={submitting}
                  formError={formError}
                  onClose={cerrarForm}
                  onSubmit={handleSubmitAnuncio}
                  onPreview={() => { }}
                />
              </div>
            )}

            {/* Panel borradores */}
            {(() => {
              const borradores = noticias.filter((n) => n.activo && n.estado === "borrador");
              const publicados = noticias.filter((n) => n.activo && (n.estado ?? "publicado") === "publicado");
              if (borradores.length === 0 && publicados.length === 0) return null;
              return (
                <>
                  {borradores.length > 0 && (
                    <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #fcd34d", background: "#fffbeb" }}>
                      <button onClick={() => setShowBorradores((v) => !v)} className="w-full flex items-center gap-2.5 px-4 py-3"
                        style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: "#fde68a", color: "#92400e", border: "1px solid #fcd34d" }}>
                          Borrador
                        </span>
                        <span className="text-sm font-semibold flex-1 text-left" style={{ color: "var(--texto-primario)" }}>
                          {borradores.length} {borradores.length === 1 ? "anuncio pendiente" : "anuncios pendientes"}
                        </span>
                        <ChevronDown size={14} strokeWidth={2.5} style={{ color: "#d97706", transition: "transform 0.2s", transform: showBorradores ? "rotate(0deg)" : "rotate(-90deg)" }} />
                      </button>
                      {showBorradores && (
                        <div className="flex flex-col" style={{ borderTop: "1px solid #bfdbfe" }}>
                          {borradores.map((n, i) => (
                            <div key={n.anuncioId} className="flex items-center gap-3 px-4 py-3"
                              style={{ borderTop: i > 0 ? "1px solid #dbeafe" : undefined, background: "var(--blanco)" }}>
                              {n.imagenUrl
                                ? <img src={n.imagenUrl} alt="" className="rounded-xl object-cover shrink-0" style={{ width: 44, height: 44 }} />
                                : <div className="rounded-xl shrink-0 flex items-center justify-center" style={{ width: 44, height: 44, background: "#eff6ff" }}>
                                  <FileText size={18} strokeWidth={1.8} style={{ color: "#93c5fd" }} />
                                </div>
                              }
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
                                  {n.titulo || "(Sin titulo)"}
                                </p>
                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>
                                  {n.contenido ? n.contenido.replace(/[#*_`>]/g, "").slice(0, 90) + (n.contenido.length > 90 ? "…" : "") : "Sin contenido"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => abrirEditar(n)}
                                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                                  style={{ background: "var(--blanco)", color: "#2563eb", border: "1px solid #bfdbfe", transition: "background 0.18s ease, transform 0.18s ease" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1.06)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; e.currentTarget.style.transform = "scale(1)"; }}>
                                  Editar
                                </button>
                                <button onClick={() => publicarBorrador(n)}
                                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#fff", border: "none", boxShadow: "0 2px 6px rgba(22,163,74,0.25)", transition: "opacity 0.18s ease, transform 0.18s ease" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.06)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}>
                                  Publicar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {publicados.length === 0 ? (
                    <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
                      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>No hay anuncios publicados</p>
                      <button onClick={abrirCrear}
                        className="text-xs font-semibold px-4 py-2 rounded-xl mt-4"
                        style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                        Crear el primero →
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Tarjetas destacadas (2 primeras) */}
                      {publicados.slice(0, 2).map((n) => (
                        <div key={n.anuncioId}
                          className="relative rounded-xl overflow-hidden cursor-pointer group"
                          style={{ outline: "1.5px solid transparent", boxShadow: "0 0 0 rgba(0,0,0,0)", transition: "outline-color 0.25s, box-shadow 0.25s", isolation: "isolate", height: "180px" }}
                          onClick={() => abrirEditar(n)}
                          onMouseEnter={(e) => { e.currentTarget.style.outline = "1.5px solid rgba(0,0,0,0.15)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.12)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.outline = "1.5px solid transparent"; e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)"; }}>
                          {n.imagenUrl ? (
                            <>
                              <img src={n.imagenUrl} alt={n.titulo} className="absolute inset-0 w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" />
                              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,10,28,0.92) 0%, rgba(3,10,28,0.25) 50%, transparent 100%)" }} />
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background: GRAD_EMP }}>
                              <Megaphone size={48} strokeWidth={1} style={{ color: "white", opacity: 0.2 }} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex flex-col justify-end p-5">
                            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden mb-1.5">
                              {(() => {
                                const sm = true;
                                const cls = `font-semibold rounded-full shrink-0 ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-0.5"}`;
                                const col = CATEGORIA_COLORS_DARK[n.categoria ?? "General"] ?? CATEGORIA_COLORS_DARK.General;
                                return (
                                  <>
                                    {n.categoria && n.categoria !== "General" && (
                                      <span className={cls} style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>{n.categoria}</span>
                                    )}
                                    {n.fijado && (
                                      <span className={cls} style={{ background: "rgba(79,70,229,0.45)", color: "#c7d2fe", border: "1px solid rgba(79,70,229,0.5)" }}>★ Fijado</span>
                                    )}
                                    {esNuevo(n.creadoEn) && (
                                      <span className={cls} style={{ background: "rgba(52,211,153,0.22)", color: "#a7f3d0", border: "1px solid rgba(52,211,153,0.32)" }}>Nuevo</span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            <h3 className="text-white leading-tight line-clamp-2"
                              style={{ fontWeight: 800, fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)", letterSpacing: "-0.02em", textShadow: SHADOW_TXT }}>
                              {n.titulo}
                            </h3>
                          </div>
                          <div className="absolute top-3 right-3 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => abrirEditar(n)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg"
                              style={{ color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", transition: "background 0.18s ease, transform 0.18s ease" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.55)"; e.currentTarget.style.transform = "scale(1.06)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}>
                              Editar
                            </button>
                            <button onClick={() => handleDesactivarAnuncio(n.anuncioId)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg"
                              style={{ color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", transition: "background 0.18s ease, transform 0.18s ease" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.6)"; e.currentTarget.style.transform = "scale(1.06)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}>
                              Desactivar
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Lista del resto */}
                      {publicados.length > 2 && (
                        <>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-semibold uppercase" style={{ color: "var(--texto-muted)", letterSpacing: "0.07em" }}>
                              Mas anuncios
                            </span>
                            <div className="flex-1 h-px" style={{ background: "var(--gris-borde)" }} />
                          </div>
                          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
                            {publicados.slice(2).map((n, i) => (
                              <div key={n.anuncioId}
                                className="flex items-center gap-3 cursor-pointer transition-colors"
                                style={{ borderBottom: i < publicados.slice(2).length - 1 ? "1px solid var(--gris-borde)" : "none", paddingTop: "12px", paddingBottom: "12px", paddingLeft: 0, paddingRight: "16px" }}
                                onClick={() => abrirEditar(n)}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--gris-superficie)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                                <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: "120px", height: "80px" }}>
                                  {n.imagenUrl ? (
                                    <img src={n.imagenUrl} alt={n.titulo} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: GRAD_EMP }}>
                                      <Megaphone size={24} strokeWidth={1} style={{ color: "white", opacity: 0.2 }} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col" style={{ gap: "4px" }}>
                                  <div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
                                    <span className="text-[11px] font-medium shrink-0" style={{ color: "var(--texto-muted)" }}>{new Date(n.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
                                    <span className="shrink-0 text-xs" style={{ color: "var(--gris-borde)" }}>·</span>
                                    {(() => {
                                      const sm = true;
                                      const cls = `font-semibold rounded-full shrink-0 ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-0.5"}`;
                                      const col = CATEGORIA_COLORS_LIGHT[n.categoria ?? "General"] ?? CATEGORIA_COLORS_LIGHT.General;
                                      return (
                                        <>
                                          {n.categoria && n.categoria !== "General" && (
                                            <span className={cls} style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>{n.categoria}</span>
                                          )}
                                          {n.fijado && (
                                            <span className={cls} style={{ background: "#ede9fe", color: "#4c1d95", border: "1px solid #c4b5fd" }}>★ Fijado</span>
                                          )}
                                          {esNuevo(n.creadoEn) && (
                                            <span className={cls} style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }}>Nuevo</span>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <h3 className="font-bold leading-snug line-clamp-1" style={{ fontSize: "0.875rem", color: "var(--texto-primario)" }}>
                                    {n.titulo}
                                  </h3>
                                  <p className="text-xs line-clamp-1" style={{ color: "var(--texto-muted)" }}>
                                    {n.contenido ? n.contenido.replace(/[#*_`>]/g, "").slice(0, 100) + (n.contenido.length > 100 ? "…" : "") : "Sin contenido"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => abrirEditar(n)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                                    style={{ background: "var(--blanco)", color: "#2563eb", border: "1px solid #bfdbfe", transition: "background 0.18s ease, transform 0.18s ease" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1.06)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; e.currentTarget.style.transform = "scale(1)"; }}>
                                    Editar
                                  </button>
                                  <button onClick={() => handleDesactivarAnuncio(n.anuncioId)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                                    style={{ background: "var(--blanco)", color: "#dc2626", border: "1px solid #fca5a5", transition: "background 0.18s ease, transform 0.18s ease" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "scale(1.06)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; e.currentTarget.style.transform = "scale(1)"; }}>
                                    Desactivar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* ── TAB PROGRESO DEL EQUIPO — oculto hasta que formación esté operativa ── */}

        {/* ── TAB MÓDULOS FORMATIVOS ── */}
        {activeTab === "formaciones" && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  Gestión de Módulos
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>Administra los módulos formativos de tu empresa</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                      const key = localStorage.key(i);
                      if (key?.startsWith("egm_modulo_admin_")) localStorage.removeItem(key);
                    }
                    queryClient.invalidateQueries({ queryKey: QK.modulos(usuario?.empresaId) });
                    mostrarToast("Progreso de admin reiniciado");
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: "var(--blanco)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blanco)")}
                  title="Reiniciar progreso de admin"
                >
                  < RefreshCw />
                  Reiniciar
                </button>
                <button
                  onClick={() => router.push("/dashboard/admin/modulos/crear")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
                >
                  < Plus />
                  Nuevo módulo
                </button>
              </div>
            </div>

            {/* Grid de módulos */}
            {formaciones.length === 0 ? (
              <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center mb-6"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "var(--gris-pagina)" }}>
                  <LibraryBig size={24} strokeWidth={1.5} style={{ color: "var(--texto-muted)" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>No hay módulos creados todavía</p>
                <p className="text-xs mt-1 mb-4" style={{ color: "var(--texto-muted)" }}>Crea el primer módulo formativo para tus empleados</p>
                <button onClick={() => router.push("/dashboard/admin/modulos/crear")}
                  className="text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                  Crear el primero →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {formaciones.map((f) => {
                  const accentColor = tipoAccentColor[f.tipoModulo] ?? "var(--azul-egm)";
                  return (
                    <div
                      key={f.moduloId}
                      className="rounded-2xl overflow-hidden flex flex-col transition-shadow"
                      style={{
                        background: f.activo ? "var(--blanco)" : "var(--gris-pagina)",
                        border: `1px solid ${f.activo ? "var(--gris-borde)" : "var(--gris-borde)"}`,
                        opacity: f.activo ? 1 : 0.65,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >
                      {/* Imagen de portada o franja de color */}
                      {f.imagenPortadaUrl ? (
                        <div className="w-full h-36 relative overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.imagenPortadaUrl} alt={f.nombre} className="w-full h-full object-cover"
                            style={{ filter: f.activo ? "none" : "grayscale(100%)" }} />
                          <div className="absolute inset-0" style={{ background: "rgba(10,20,40,0.18)" }} />
                        </div>
                      ) : (
                        <div className="w-full h-2 shrink-0"
                          style={{ background: f.activo ? accentColor : "var(--gris-borde)" }} />
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {MODULO_TIPO_LABEL[f.tipoModulo] && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                              {MODULO_TIPO_LABEL[f.tipoModulo]}
                            </span>
                          )}
                          {f.empresaId === null ? (
                            <span className="text-xs px-2.5 py-1 rounded-full italic"
                              style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                              EGM Global
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                              Tu empresa
                            </span>
                          )}
                          {!f.activo && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db" }}>
                              Desactivado
                            </span>
                          )}
                        </div>

                        {/* Title + description */}
                        <p className="text-base font-semibold mt-3 mb-1" style={{ color: "var(--texto-primario)" }}>
                          {f.nombre}
                        </p>
                        <p className="text-sm line-clamp-2 flex-1" style={{ color: "var(--texto-muted)" }}>
                          {f.descripcion}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 mt-4 pt-3"
                          style={{ borderTop: "1px solid var(--gris-borde)" }}>
                          {f.empresaId !== null ? (
                            <>
                              <button onClick={() => router.push(`/dashboard/formacion/${f.moduloId}`)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                                Ver
                              </button>
                              <button onClick={() => handleEditModulo(f)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                Editar
                              </button>
                              <button onClick={() => handleDesactivarModulo(f)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                style={{ background: "#fef9c3", color: "#854d0e" }}>
                                {f.activo ? "Desactivar" : "Activar"}
                              </button>
                              <button onClick={() => handleEliminarModulo(f.moduloId)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                style={{ background: "var(--error-light)", color: "var(--error)" }}>
                                Eliminar
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-lg"
                              style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>
                              Solo lectura
                            </span>
                          )}
                        </div>
                      </div>{/* /p-5 */}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── TAB INCIDENCIAS ── */}
        {activeTab === "incidencias" && (
          <GestionIncidencias empresaId={usuario?.empresaId} />
        )}

        {activeTab === "documentos" && usuario?.empresaId && (
          <DocumentosAdminTab
            empresaId={usuario.empresaId}
            empleados={empleados.map((e) => ({
              usuarioId: e.usuarioId,
              nombre: e.nombre,
              apellidos: e.apellidos,
              departamento: e.departamento,
            }))}
            departamentos={DEPARTAMENTOS}
          />
        )}

        {/* ── TAB ESTADÍSTICAS ── */}
        {activeTab === "estadisticas" && (
          <StatsTab
            statsEmpresa={statsEmpresa}
            cargandoStats={cargandoStats}
            statsRango={statsRango}
            setStatsRangoT={setStatsRangoT}
            statsDpto={statsDpto}
            setStatsDptoT={setStatsDptoT}
            statsEstado={statsEstado}
            setStatsEstadoT={setStatsEstadoT}
            statsTipoMod={statsTipoMod}
            setStatsTipoModT={setStatsTipoModT}
            startStatsTransition={startStatsTransition}
            statsRangoLabel={statsRangoLabel}
            statsRangoLabelMin={statsRangoLabelMin}
            showKpis={showKpis}
            setShowKpis={setShowKpis}
            showMovimiento={showMovimiento}
            setShowMovimiento={setShowMovimiento}
            showEstadoFormacion={showEstadoFormacion}
            setShowEstadoFormacion={setShowEstadoFormacion}
            hayPersonalizacion={hayPersonalizacion}
            resetVistaEstadisticas={resetVistaEstadisticas}
            showPersonalizar={showPersonalizar}
            setShowPersonalizar={setShowPersonalizar}
            personalizarRef={personalizarRef}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            handleExportEstadisticas={handleExportEstadisticas}
            empleados={empleados}
            formaciones={formaciones}
          />
        )}

        </motion.div>
        </AnimatePresence>
      </div>




      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.msg}
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
            className="fixed bottom-6 left-1/2 z-[300] flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
            style={{
              translateX: "-50%",
              background: toast.tipo === "error"
                ? "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)"
                : "linear-gradient(135deg, #1b3f7e 0%, #2563eb 100%)",
              color: "#fff",
            }}>
            {toast.tipo === "error"
              ? <X size={16} strokeWidth={2.5} />
              : <Check size={16} strokeWidth={2.5} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Select animado para el modal de empleado ─────────────────────────────────
function EmpSelect({ label, value, onChange, options, placeholder = "Sin departamento", hidePlaceholder = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  placeholder?: string;
  hidePlaceholder?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ bottom: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  function calcPos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ bottom: window.innerHeight - r.top + 6, left: r.left, width: r.width });
  }

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={wrapRef}>
      <label className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>{label}</label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { calcPos(); setOpen(p => !p); }}
        className="w-full flex items-center justify-between rounded-lg px-3.5 text-sm border transition-all duration-150 cursor-pointer"
        style={{
          height: "44px",
          borderColor: open ? "var(--azul-egm)" : "rgba(0,0,0,0.12)",
          boxShadow: open ? "0 0 0 3px rgba(22,50,105,0.08)" : "none",
          background: "#ffffff",
          color: selected ? "var(--texto-primario)" : "var(--texto-placeholder)",
          textAlign: "left",
        }}
      >
        <span>{selected?.label ?? placeholder}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ color: "var(--texto-muted)", display: "flex", flexShrink: 0 }}
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "fixed",
                bottom: pos.bottom,
                left: pos.left,
                width: pos.width,
                zIndex: 9999,
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: "10px",
                boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
                overflow: "hidden",
                transformOrigin: "bottom center",
              }}
            >
              {(hidePlaceholder ? options : [{ id: "", label: placeholder }, ...options]).map((opt) => {
                const isSelected = value === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{
                      background: isSelected ? "var(--azul-egm-light)" : "transparent",
                      color: isSelected ? "var(--azul-egm)" : "var(--texto-primario)",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--gris-pagina)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ── Select estilado para barras de filtros ────────────────────────────────────
function StatsSelect({ value, onChange, options, placeholder, minWidth = 140, hidePlaceholder = false, fullWidth = false }: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
  minWidth?: number;
  hidePlaceholder?: boolean;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const isActive   = value !== "";
  const selected   = options.find(o => o.id === value);

  function calcPos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 6, left: r.left, width: r.width });
  }

  useEffect(() => {
    if (!open) return;
    function onClickOut(e: MouseEvent) {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, [open]);

  return (
    <div ref={wrapRef} style={{ ...(fullWidth ? { width: "100%" } : undefined), position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { if (!fullWidth) calcPos(); setOpen(p => !p); }}
        className="flex items-center gap-2 rounded-xl pl-3 pr-2.5 h-9 text-sm font-semibold cursor-pointer focus:outline-none"
        style={{
          background: "var(--blanco)",
          border: `1px solid ${isActive || open ? "var(--azul-egm)" : "var(--surface-border)"}`,
          color: isActive ? "var(--azul-egm)" : "var(--texto-primario)",
          transition: "border-color 0.15s, color 0.15s",
          minWidth,
          ...(fullWidth ? { width: "100%" } : {}),
        }}
      >
        <span className="flex-1 text-left truncate">{selected?.label ?? placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}
          style={{ display: "flex", flexShrink: 0, color: isActive ? "var(--azul-egm)" : "var(--texto-muted)" }}>
          <ChevronDown size={13} strokeWidth={2.5} />
        </motion.span>
      </button>

      {fullWidth ? (
        /* Inline (móvil) — se desplaza con la página, z-index bajo el header (z-50) */
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                zIndex: 30,
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                overflow: "hidden",
              }}
            >
              {(hidePlaceholder ? options : [{ id: "", label: placeholder }, ...options]).map((opt) => {
                const isSel = value === opt.id;
                return (
                  <button key={opt.id} type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-[15px] cursor-pointer"
                    style={{
                      background: isSel ? "var(--azul-egm-light)" : "transparent",
                      color: isSel ? "var(--azul-egm)" : "var(--texto-primario)",
                      fontWeight: isSel ? 600 : 400,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--gris-pagina)"; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      ) : createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: pos.top,
                left: Math.min(pos.left, window.innerWidth - Math.max(pos.width, minWidth) - 12),
                width: Math.max(pos.width, minWidth),
                maxWidth: `calc(100vw - 24px)`,
                zIndex: 9999,
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                overflow: "hidden",
              }}
            >
              {(hidePlaceholder ? options : [{ id: "", label: placeholder }, ...options]).map((opt) => {
                const isSel = value === opt.id;
                return (
                  <button key={opt.id} type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-[15px] cursor-pointer"
                    style={{
                      background: isSel ? "var(--azul-egm-light)" : "transparent",
                      color: isSel ? "var(--azul-egm)" : "var(--texto-primario)",
                      fontWeight: isSel ? 600 : 400,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--gris-pagina)"; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ── Campo reutilizable para el modal de empleado ─────────────────────────────
function EmpCampo({ label, value, onChange, placeholder, required, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string; hint?: string;
}) {
  const [foco, setFoco] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (verPass ? "text" : "password") : type;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>
        {label}{required && (
          <span className="relative group ml-0.5 inline-block" style={{ color: "#ef4444" }}>
            *
            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: "#1f2937", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", zIndex: 99 }}>
              Obligatorio
            </span>
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          className="w-full rounded-lg text-sm outline-none border transition-all duration-150"
          style={{
            height: "44px",
            paddingLeft: "14px",
            paddingRight: isPassword ? "40px" : "14px",
            borderColor: foco ? "var(--azul-egm)" : "rgba(0,0,0,0.12)",
            boxShadow: foco ? "0 0 0 3px rgba(22,50,105,0.08)" : "none",
            background: "#ffffff",
            color: "var(--texto-primario)",
          }}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVerPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs" style={{ color: "var(--texto-placeholder)" }}>{hint}</p>}
    </div>
  );
}
