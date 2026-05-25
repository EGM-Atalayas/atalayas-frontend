"use client";

import React, { memo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Download, GraduationCap, LibraryBig, RefreshCw,
  Search, SlidersHorizontal, Users, X, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { DonutDepartamentos } from "@/components/ui/DonutDepartamentos";
import { DEPARTAMENTOS } from "@/lib/constants/admin";
import { MODULO_TIPO_LABEL, type ModuloTipo } from "@/lib/types/modulos";
import type { Modulo } from "@/lib/types/modulos";
import type { Usuario } from "@/lib/types/usuario";
import type { EstadisticasEmpresaResponse } from "@/lib/api/estadisticas";
import type { ExportFormat } from "@/lib/utils/statsExport";

// ── StatsToggle ──────────────────────────────────────────────────────────────
function StatsToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className="shrink-0 transition-all"
      style={{
        width: 40, height: 22, borderRadius: 999,
        background: checked ? "var(--azul-egm)" : "var(--gris-borde)",
        border: "none", cursor: "pointer", padding: 3,
        transition: "background 0.2s ease",
        position: "relative", display: "flex", alignItems: "center",
      }}
    >
      <span style={{
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
        transform: checked ? "translateX(18px)" : "translateX(0)",
        transition: "transform 0.2s ease",
        display: "block",
      }} />
    </button>
  );
}

// ── StatsSelect ──────────────────────────────────────────────────────────────
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const isActive = value !== "";
  const selected = options.find(o => o.id === value);

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
        className="flex items-center gap-2 rounded-xl pl-3 pr-2.5 h-10 text-sm font-semibold cursor-pointer focus:outline-none"
        style={{
          background: "var(--blanco)",
          border: `1.5px solid ${isActive || open ? "var(--azul-egm)" : "var(--gris-borde)"}`,
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
        /* Inline (móvil) */
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

// ── StatsTab ─────────────────────────────────────────────────────────────────
export const StatsTab = memo(function StatsTab({
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
  statsEmpresa: EstadisticasEmpresaResponse | null;
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
  exportFormat: ExportFormat;
  setExportFormat: (v: ExportFormat) => void;
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
      <div className="hidden sm:flex sm:items-center gap-3 mb-8 min-w-0">

        {/* ── Grupo izquierdo: filtros scrollables ── */}
        <div className="flex items-center gap-2 min-w-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-1 p-1 rounded-xl shrink-0" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
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
          <StatsSelect value={statsDpto ?? ""} onChange={(v) => setStatsDptoT(v === "" ? null : v)} placeholder="Todos los dptos." minWidth={148} options={(() => { const p = new Set(empleados.map(e => e.departamento).filter((d): d is string => !!d)); return DEPARTAMENTOS.filter(d => p.has(d.id)).map(d => ({ id: d.id, label: `${d.label} (${empleados.filter(e => e.departamento === d.id).length})` })); })()} />
          <StatsSelect value={statsEstado === "activos" ? "" : statsEstado} onChange={(v) => setStatsEstadoT((v === "" ? "activos" : v) as "activos" | "inactivos" | "todos")} placeholder="Activos" minWidth={110} options={[{ id: "inactivos", label: "Inactivos" }, { id: "todos", label: "Todos" }]} />
          <StatsSelect value={statsTipoMod ?? ""} onChange={(v) => setStatsTipoModT(v === "" ? null : v)} placeholder="Todos los módulos" minWidth={152} options={(() => { const t = new Set(formaciones.map((m: Modulo) => m.tipoModulo).filter((t): t is ModuloTipo => !!t)); return Array.from(t).map(t => ({ id: t, label: `${(MODULO_TIPO_LABEL as Record<string, string>)[t] ?? t} (${formaciones.filter((m: Modulo) => m.tipoModulo === t).length})` })); })()} />
        </div>
        <AnimatePresence>
          {(statsDpto || statsEstado !== "activos" || statsTipoMod) && (
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
              <IconButton variant="surface" size="sm" label="Limpiar filtros"
                onClick={() => { setStatsDptoT(null); setStatsEstadoT("activos"); setStatsTipoModT(null); }}>
                <X size={14} strokeWidth={2.5} />
              </IconButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grupo derecho: acciones fijas ── */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Personalizar */}
          <div className="relative" ref={personalizarRef}>
            <Button
              variant={showPersonalizar ? "primary" : "ghost"}
              size="md"
              onClick={() => setShowPersonalizar((v: boolean) => !v)}
            >
              <SlidersHorizontal size={16} strokeWidth={2.5} />
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
                  style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                >
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                      Mostrar secciones
                    </p>
                    {hayPersonalizacion && (
                      <button
                        onClick={() => { resetVistaEstadisticas(); setShowPersonalizar(false); }}
                        title="Restablecer vista por defecto"
                        className="flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors"
                        style={{ color: "var(--texto-muted)", background: "transparent", border: "none" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--error)"; (e.currentTarget as HTMLElement).style.background = "var(--error-light)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--texto-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <RefreshCw size={14} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                  {[
                    { label: "KPIs resumen", value: showKpis, set: setShowKpis },
                    { label: "Incorporaciones y salidas", value: showMovimiento, set: setShowMovimiento },
                    { label: "Empleados por departamento", value: showEstadoFormacion, set: setShowEstadoFormacion },
                  ].map(({ label, value, set }, idx) => (
                    <div key={label}
                      className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
                      style={{ borderTop: idx > 0 ? "1px solid var(--gris-borde)" : "none" }}
                      onClick={() => set(!value)}
                    >
                      <span className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{label}</span>
                      <StatsToggle checked={value} onChange={set} />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Descargar */}
          <div className="flex items-center gap-2">
            <StatsSelect
              value={exportFormat}
              onChange={(v) => { if (v) setExportFormat(v as ExportFormat); }}
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
              <Download size={16} strokeWidth={2.5} />
              Descargar
            </Button>
          </div>
        </div>
      </div>

      {/* ── Barra MÓVIL: filas apiladas ── */}
      <div className="flex flex-col gap-3 mb-8 sm:hidden">
        {/* Rango */}
        <div className="flex gap-1 p-1 rounded-xl w-full" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
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
          <StatsSelect fullWidth value={statsTipoMod ?? ""} onChange={(v) => setStatsTipoModT(v === "" ? null : v)} placeholder="Todos los módulos" minWidth={0} options={(() => { const t = new Set(formaciones.map((m: Modulo) => m.tipoModulo).filter((t): t is ModuloTipo => !!t)); return Array.from(t).map(t => ({ id: t, label: `${(MODULO_TIPO_LABEL as Record<string, string>)[t] ?? t} (${formaciones.filter((m: Modulo) => m.tipoModulo === t).length})` })); })()} />
        </div>
        {/* Acciones móvil */}
        <div className="flex flex-col gap-2">

          {/* Fila 1: Personalizar + Restablecer */}
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
                <SlidersHorizontal size={16} strokeWidth={2.5} />
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
                    style={{ zIndex: 30, background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider px-4 pt-4 pb-2" style={{ color: "var(--texto-muted)" }}>
                      Mostrar secciones
                    </p>
                    {[
                      { label: "KPIs resumen", value: showKpis, set: setShowKpis },
                      { label: "Incorporaciones y salidas", value: showMovimiento, set: setShowMovimiento },
                      { label: "Empleados por departamento", value: showEstadoFormacion, set: setShowEstadoFormacion },
                    ].map(({ label, value, set }, idx) => (
                      <div key={label}
                        className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
                        style={{ borderTop: idx > 0 ? "1px solid var(--gris-borde)" : "none" }}
                        onClick={() => set(!value)}
                      >
                        <span className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{label}</span>
                        <StatsToggle checked={value} onChange={set} />
                      </div>
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
                onChange={(v) => { if (v) setExportFormat(v as ExportFormat); }}
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
              <Download size={16} strokeWidth={2.5} />
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
                { label: "Total empleados", value: String(statsEmpresa.kpis.totalEmpleados), accent: "#3B82F6", bg: "rgba(59,130,246,0.08)", icon: <Users size={22} strokeWidth={1.8} /> },
                { label: `Altas - ${statsRangoLabelMin}`, value: String(statsEmpresa.movimientoMensual.reduce((s, m) => s + m.altas, 0)), accent: "#10B981", bg: "rgba(16,185,129,0.08)", icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
                { label: `Bajas - ${statsRangoLabelMin}`, value: String(statsEmpresa.movimientoMensual.reduce((s, m) => s + m.bajas, 0)), accent: "#F43F5E", bg: "rgba(244,63,94,0.08)", icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm8-5h6" /></svg> },
                { label: "Rotación anualizada", value: `${statsEmpresa.kpis.tasaRotacion}%`, accent: "#F59E0B", bg: "rgba(245,158,11,0.08)", icon: <RefreshCw size={22} strokeWidth={1.8} /> },
                { label: "Completitud de formación", value: `${statsEmpresa.kpis.pctCompletitudGlobal}%`, accent: "#8B5CF6", bg: "rgba(139,92,246,0.08)", icon: <GraduationCap size={22} strokeWidth={1.8} /> },
                { label: "Módulos con progreso", value: String(statsEmpresa.kpis.modulosConProgreso), accent: "#06B6D4", bg: "rgba(6,182,212,0.08)", icon: <LibraryBig size={22} strokeWidth={1.8} /> },
              ] as { label: string; value: string; accent: string; bg: string; icon: React.ReactNode }[]).map(({ label, value, accent, bg, icon }) => (
                <div
                  key={label}
                  className="relative overflow-hidden"
                  style={{
                    background: accent,
                    borderRadius: "16px",
                    boxShadow: `0 4px 18px ${accent}44`,
                    minHeight: 130,
                  }}
                >
                  {/* Icono — desktop */}
                  <div className="hidden sm:flex pointer-events-none absolute" style={{
                    right: 16, bottom: -6, width: 110, height: 110,
                    color: "#fff", opacity: 0.32,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ transform: "scale(4.2)", transformOrigin: "center" }}>{icon}</div>
                  </div>
                  {/* Icono — móvil (más pequeño, más esquinado) */}
                  <div className="flex sm:hidden pointer-events-none absolute" style={{
                    right: 6, bottom: -8, width: 72, height: 72,
                    color: "#fff", opacity: 0.25,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ transform: "scale(2.8)", transformOrigin: "center" }}>{icon}</div>
                  </div>

                  {/* Círculo decorativo — esquina superior izquierda */}
                  <div className="pointer-events-none absolute" style={{
                    width: 90, height: 90, borderRadius: "50%",
                    background: "rgba(255,255,255,0.10)",
                    top: -30, left: -24,
                  }} />

                  {/* Contenido */}
                  <div className="relative p-4 sm:p-5 flex flex-col justify-between" style={{ minHeight: 130 }}>
                    <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "rgba(255,255,255,0.95)", margin: 0, lineHeight: 1.3 }}>{label}</p>
                    <p style={{ fontSize: "clamp(2rem, 6vw, 2.8rem)", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1 }}>{value}</p>
                  </div>
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
                  <div className="p-6 rounded-2xl shadow-sm flex flex-col" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                    <div className="pb-3 mb-3" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <h2 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                            Incorporaciones y salidas
                          </h2>
                          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold" style={{ background: "rgba(16,185,129,0.09)", color: "#10B981" }}>↑ {totalAltas}</span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold" style={{ background: "rgba(244,63,94,0.09)", color: "#F43F5E" }}>↓ {totalBajas}</span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold" style={{ background: neto >= 0 ? "rgba(59,130,246,0.09)" : "rgba(244,63,94,0.09)", color: neto >= 0 ? "#3B82F6" : "#F43F5E" }}>{neto >= 0 ? "+" : ""}{neto}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
                            <span className="hidden sm:inline">Movimiento de plantilla - </span>{statsRangoLabelMin}
                          </p>
                          <div className="flex sm:hidden items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(16,185,129,0.09)", color: "#10B981" }}>↑ {totalAltas}</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(244,63,94,0.09)", color: "#F43F5E" }}>↓ {totalBajas}</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: neto >= 0 ? "rgba(59,130,246,0.09)" : "rgba(244,63,94,0.09)", color: neto >= 0 ? "#3B82F6" : "#F43F5E" }}>{neto >= 0 ? "+" : ""}{neto}</span>
                          </div>
                        </div>
                        <p className="flex sm:hidden items-center gap-1 text-[11px]" style={{ color: "var(--texto-muted)" }}>
                          Toca un mes para ver el detalle
                        </p>
                      </div>
                    </div>
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gris-borde)" />
                            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "var(--texto-muted)", fontSize: 13 }} dy={8}
                              interval={statsRango <= 6 ? 0 : statsRango === 12 ? 1 : 2}
                              padding={{ left: 12, right: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--texto-muted)", fontSize: 13 }} allowDecimals={false}
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
                                  <div style={{ borderRadius: 14, border: "1px solid var(--gris-borde)", boxShadow: "0 8px 28px rgba(0,0,0,0.12)", background: "var(--blanco)", padding: "14px 18px", minWidth: 190 }}>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: "var(--texto-primario)", marginBottom: 8 }}>{mesLabel}</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                      <span style={{ fontSize: 13, color: "#10B981", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>↑ {altas} INCORPORACIONES</span>
                                      <span style={{ fontSize: 13, color: "#F43F5E", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>↓ {bajas} SALIDAS</span>
                                      <span style={{ fontSize: 13, color: bal >= 0 ? "#3B82F6" : "#F43F5E", fontWeight: 700, marginTop: 2, paddingTop: 6, borderTop: "1px solid var(--gris-borde)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
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
                <div className="p-6 rounded-2xl shadow-sm flex flex-col" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                  <div className="pb-3 mb-3" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
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
                    const PALETTE_RAW = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#F43F5E", "#06B6D4", "#84CC16", "#EC4899", "#F97316", "#14B8A6", "#6366F1", "#EAB308"];
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

      {/* ── Modal drill-down mes ── */}
      <AnimatePresence>
        {drillMes && (() => {
          const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
          const MESES_FULL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
          const mesIdx = MESES.indexOf(drillMes);
          const hoy = new Date();
          let anioMes = hoy.getFullYear();
          for (let i = statsRango - 1; i >= 0; i--) {
            const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            if (MESES[d.getMonth()] === drillMes) { anioMes = d.getFullYear(); break; }
          }
          let empFiltrados = empleados;
          if (statsEstado === "activos") empFiltrados = empFiltrados.filter((e) => e.activo !== false);
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
            { title: "Salidas", list: bajasDelMes.filter(e => !drillSearch || `${e.nombre} ${e.apellidos}`.toLowerCase().includes(drillSearch.toLowerCase())), color: "#F43F5E", dateKey: "fechaBaja" as const, empty: "Sin salidas este mes" },
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
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
                  exit: { opacity: 0, y: 14, scale: 0.97, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
                }}
                initial="hidden"
                animate="show"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className="rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
                style={{ background: "var(--blanco)", maxHeight: "92dvh" }}
              >
                {/* Cabecera */}
                <div className="flex items-center justify-between px-6 shrink-0"
                  style={{ paddingTop: "20px", paddingBottom: "20px", background: "var(--tab-estadisticas)" }}>
                  <h3 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.25rem, 5vw, 1.6rem)", color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.15, fontVariantNumeric: "lining-nums" }}>
                    {MESES_FULL[mesIdx] ?? drillMes} {anioMes}
                  </h3>
                  <IconButton variant="glass" size="sm" label="Cerrar" onClick={() => setDrillMes(null)} />
                </div>

                {/* KPIs + Buscador */}
                <div className="shrink-0 px-5 pt-4 pb-0" style={{ background: "var(--gris-panel)" }}>
                  <div className="grid grid-cols-3 rounded-2xl" style={{ border: "1px solid var(--gris-borde)" }}>
                    {([
                      { label: "Incorporaciones", short: "Altas", value: altasDelMes.length, color: "#10B981", bg: "rgba(16,185,129,0.07)", prefix: "↑" },
                      { label: "Salidas", short: "Bajas", value: bajasDelMes.length, color: "#F43F5E", bg: "rgba(244,63,94,0.07)", prefix: "↓" },
                      { label: "Neto", short: "Neto", value: Math.abs(netoMes), color: netoMes >= 0 ? "#3B82F6" : "#F43F5E", bg: netoMes >= 0 ? "rgba(59,130,246,0.07)" : "rgba(244,63,94,0.07)", prefix: netoMes >= 0 ? "+" : "−" },
                    ] as const).map(({ label, short, value, color, bg, prefix }, i) => (
                      <div key={label} className="flex flex-col items-center justify-center py-4 sm:py-5 gap-1"
                        style={{
                          background: bg,
                          borderRight: i < 2 ? "1px solid var(--gris-borde)" : "none",
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
                  <div className="px-5 pt-3 pb-3 shrink-0 flex justify-center" style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-panel)" }}>
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
                          onBlur={e => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
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
                                  style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
                                  onMouseEnter={e2 => (e2.currentTarget.style.background = "var(--gris-superficie)")}
                                  onMouseLeave={e2 => (e2.currentTarget.style.background = "var(--blanco)")}>

                                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                    {initials}
                                  </div>

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
                                          style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9" }}>
                                          {e.departamento}
                                        </span>
                                      )}
                                    </div>
                                  </div>

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
