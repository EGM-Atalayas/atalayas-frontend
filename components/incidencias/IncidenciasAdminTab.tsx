"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIncidencias,
  crearIncidencia,
  cambiarEstadoIncidencia,
  deleteIncidencia,
} from "@/lib/api/incidencias";
import { Button } from "@/components/ui/Button";
import Grainient from "@/components/ui/Grainient";
import { IconButton } from "@/components/ui/IconButton";
import type { Incidencia, IncidenciaInput } from "@/lib/types/incidencias";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CircleAlert,
  Clock,
  CheckCircle2,
  ChevronDown,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { ModalConfirm } from "@/components/ui/ModalConfirm";

const TAB_COLOR = "#D97706";

// ── Paleta de estados ────────────────────────────────────────────────────────
const ESTADOS = [
  { value: "ABIERTA",  label: "Abierta",  plural: "abiertas",  color: "#dc2626", dark: "#991b1b", bg: "#fee2e2", border: "#fca5a5", grad1: "#f87171", grad2: "#b91c1c", Icon: CircleAlert },
  { value: "EN_CURSO", label: "En curso", plural: "en curso",  color: "#d97706", dark: "#92400e", bg: "#fef3c7", border: "#fcd34d", grad1: "#fbbf24", grad2: "#92400e", Icon: Clock        },
  { value: "CERRADA",  label: "Cerrada",  plural: "cerradas",  color: "#16a34a", dark: "#14532d", bg: "#dcfce7", border: "#86efac", grad1: "#4ade80", grad2: "#15803d", Icon: CheckCircle2 },
] as const;

const PRIORIDADES = [
  { value: "NORMAL",  label: "Normal"  },
  { value: "CRITICA", label: "Crítica" },
] as const;

interface Props {
  empresaId?: string | null;
  esSuperadmin?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

const tiempoRelativo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "ahora mismo";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `hace ${days}d`;
  return formatFecha(iso);
};

const estadoConf = (v: string) => ESTADOS.find(e => e.value === v) ?? ESTADOS[0];

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse flex flex-col"
      style={{ background: "var(--gris-borde)" }}>
      <div className="flex-1 px-4 pt-3.5 pb-3 flex flex-col gap-2">
        <div className="flex items-center">
          <div className="flex-1" />
          <div className="h-4 rounded-full w-12" style={{ background: "rgba(255,255,255,0.30)" }} />
        </div>
        <div className="h-4 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.35)" }} />
        <div className="h-3 rounded-full w-full" style={{ background: "rgba(255,255,255,0.20)" }} />
        <div className="h-3 rounded-full w-2/3" style={{ background: "rgba(255,255,255,0.15)" }} />
      </div>
      <div className="flex items-center px-3 py-2.5" style={{ background: "rgba(0,0,0,0.10)" }}>
        <div className="h-6 rounded-lg w-20" style={{ background: "rgba(255,255,255,0.22)" }} />
      </div>
    </div>
  );
}

// ── Estado selector ───────────────────────────────────────────────────────────
function EstadoSelector({ incidenciaId, estadoActual, onChange, matchButtonHeight = false, glass = false }: {
  incidenciaId: string; estadoActual: string;
  onChange: (id: string, estado: string) => void;
  matchButtonHeight?: boolean;
  glass?: boolean;
}) {
  const conf = estadoConf(estadoActual);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 5, left: r.left, width: r.width });
  };

  return (
    <div className="shrink-0">
      <button
        ref={triggerRef}
        onClick={() => { calcPos(); setOpen(v => !v); }}
        className={`flex items-center gap-1 font-semibold cursor-pointer ${matchButtonHeight ? "text-sm px-4" : "text-[11px] px-2 rounded-lg"}`}
        style={glass ? {
          height: 26,
          borderRadius: "7px",
          background: "rgba(255,255,255,0.18)",
          border: `1px solid ${open ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)"}`,
          color: "#fff",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "border-color 0.15s",
        } : {
          height: matchButtonHeight ? 34 : 26,
          borderRadius: matchButtonHeight ? "10px" : "7px",
          background: conf.bg,
          border: `1px solid ${open ? conf.color : conf.border}`,
          color: conf.color,
          transition: "border-color 0.15s",
        }}
      >
        <conf.Icon size={matchButtonHeight ? 15 : 11} strokeWidth={2.5} />
        {glass ? conf.label : conf.label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex", opacity: glass ? 0.75 : 0.55 }}
        >
          <ChevronDown size={matchButtonHeight ? 14 : 10} strokeWidth={2.5} />
        </motion.span>
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  minWidth: Math.max(pos.width, 160),
                  zIndex: 201,
                  background: "var(--blanco)",
                  border: "1px solid var(--gris-borde)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                }}
              >
                {ESTADOS.map(e => (
                  <button
                    key={e.value}
                    onClick={() => { onChange(incidenciaId, e.value); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer"
                    style={{
                      background: e.value === estadoActual ? e.bg : "transparent",
                      color: e.color,
                      fontWeight: e.value === estadoActual ? 700 : 500,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={ev => { if (e.value !== estadoActual) (ev.currentTarget as HTMLButtonElement).style.background = e.bg; }}
                    onMouseLeave={ev => { if (e.value !== estadoActual) (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <e.Icon size={14} strokeWidth={2.2} />
                    {e.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}


// ── Componente principal ──────────────────────────────────────────────────────
export default function IncidenciasAdminTab({ empresaId, esSuperadmin }: Props) {
  const queryClient = useQueryClient();

  const [filtro, setFiltro]       = useState<string>("todas");
  const [search, setSearch]       = useState("");
  const [errorMut, setErrorMut]   = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<Incidencia | null>(null);
  const [detailInc, setDetailInc] = useState<Incidencia | null>(null);
  const [filtroDropOpen, setFiltroDropOpen] = useState(false);
  const [filtroDropPos, setFiltroDropPos] = useState({ top: 0, left: 0, width: 0 });
  const filtroDropRef = useRef<HTMLButtonElement>(null);

  // ── Formulario nueva incidencia ───────────────────────────────────────────
  const [showForm, setShowForm]       = useState(false);
  const [formTitulo, setFormTitulo]   = useState("");
  const [formDesc, setFormDesc]       = useState("");
  const [formPrio, setFormPrio]       = useState<"NORMAL" | "CRITICA">("NORMAL");
  const [guardando, setGuardando]     = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

  const { data: incidencias = [], isLoading: cargando, isError, refetch } = useQuery<Incidencia[]>({
    queryKey: ["incidencias", empresaId],
    queryFn: () => getIncidencias(empresaId),
    enabled: !!empresaId,
  });

  const contadores = ESTADOS.reduce((acc, e) => {
    acc[e.value] = incidencias.filter(i => i.estado === e.value).length;
    return acc;
  }, {} as Record<string, number>);

  const filtradas = incidencias
    .filter(i => filtro === "todas" || i.estado === filtro)
    .filter(i => !search || [i.titulo, i.descripcion ?? "", i.nombreCreador ?? ""]
      .some(v => v.toLowerCase().includes(search.toLowerCase())));

  const closeForm = useCallback(() => {
    setShowForm(false);
    setFormTitulo(""); setFormDesc(""); setFormPrio("NORMAL"); setFormError(null);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEstado = async (id: string, nuevoEstado: string) => {

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

  const handleEliminar = async () => {
    if (!confirmEliminar) return;
    try {
      await deleteIncidencia(confirmEliminar.incidenciaId);
      queryClient.setQueryData<Incidencia[]>(["incidencias", empresaId], prev =>
        prev?.filter(i => i.incidenciaId !== confirmEliminar.incidenciaId) ?? []
      );
    } catch (e: any) {
      setErrorMut(e.message || "Error al eliminar la incidencia");
    } finally {
      setConfirmEliminar(null);
    }
  };

  const handleCrear = async () => {
    if (!formTitulo.trim()) { setFormError("El título es obligatorio"); return; }
    setGuardando(true);
    setFormError(null);
    try {
      const payload: IncidenciaInput = {
        titulo: formTitulo.trim(),
        descripcion: formDesc.trim(),
        prioridad: formPrio,
        empresaId: empresaId ?? null,
      };
      const nueva = await crearIncidencia(payload);
      queryClient.setQueryData<Incidencia[]>(["incidencias", empresaId], prev => [nueva, ...(prev ?? [])]);
      closeForm();
    } catch (e: any) {
      setFormError(e.message || "Error al crear la incidencia");
    } finally {
      setGuardando(false);
    }
  };

  const hayFiltrosActivos = search.trim() !== "" || filtro !== "todas";

  // Scroll lock when any modal is open
  useEffect(() => {
    if (showForm || !!detailInc) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [showForm, detailInc]);

  // live ref para el modal de detalle (refleja cambios de estado en tiempo real)
  const liveDetailInc = detailInc
    ? incidencias.find(i => i.incidenciaId === detailInc.incidenciaId) ?? detailInc
    : null;

  // ── Modal detalle incidencia (portal) ─────────────────────────────────────
  const detailModalNode = typeof document !== "undefined" ? createPortal(
    <AnimatePresence>
      {liveDetailInc && (() => {
        const est = estadoConf(liveDetailInc.estado);
        return (
          <motion.div
            key="inc-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "var(--overlay, rgba(0,0,0,0.45))" }}
            onMouseDown={e => { if (e.target === e.currentTarget) setDetailInc(null); }}
          >
            <motion.div
              key="inc-detail-panel"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.26, ease: [0.34, 1.15, 0.64, 1] }}
              className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: "85dvh", background: "var(--gris-panel)", boxShadow: "0 24px 56px rgba(0,0,0,0.18)" }}
              onMouseDown={e => e.stopPropagation()}
            >
              {/* ── Header sólido ── */}
              <div className="shrink-0 flex items-start justify-between px-5 sm:px-6 pt-5 pb-5"
                style={{ background: est.color }}>
                <div className="flex-1 min-w-0 pr-4 flex flex-col gap-2.5">
                  {/* Chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.20)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)" }}>
                      <est.Icon size={11} strokeWidth={2.5} />
                      {est.label}
                    </span>
                    {liveDetailInc.prioridad === "CRITICA" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.20)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)" }}>
                        <AlertTriangle size={11} strokeWidth={2.5} />
                        Crítica
                      </span>
                    )}
                  </div>
                  {/* Título */}
                  <h2 style={{
                    fontFamily: "var(--font-raleway), sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                    color: "#fff",
                    margin: 0,
                  }}>
                    {liveDetailInc.titulo}
                  </h2>
                  {/* Meta */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {liveDetailInc.nombreCreador && (
                      <>
                        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                          {liveDetailInc.nombreCreador}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 10 }}>·</span>
                      </>
                    )}
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {tiempoRelativo(liveDetailInc.creadoEn)}
                    </span>
                  </div>
                </div>
                <IconButton onClick={() => setDetailInc(null)} variant="glass" label="Cerrar" />
              </div>

              {/* ── Body ── */}
              <div className="overflow-y-auto flex-1 flex flex-col gap-4 px-5 sm:px-6 py-5"
                style={{ background: "var(--gris-pagina)" }}>

                {/* Descripción */}
                <div className="rounded-2xl px-4 py-4" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                  {liveDetailInc.descripcion?.trim() ? (
                    <p className="text-sm" style={{ color: "var(--texto-primario)", lineHeight: 1.8, wordBreak: "break-word", overflowWrap: "break-word" }}>
                      {liveDetailInc.descripcion}
                    </p>
                  ) : (
                    <p className="text-sm italic" style={{ color: "var(--texto-placeholder)" }}>Sin descripción</p>
                  )}
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="flex items-center justify-between gap-2 px-5 sm:px-6 py-3.5 shrink-0"
                style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--blanco)", paddingBottom: "calc(0.875rem + env(safe-area-inset-bottom, 0px))" }}>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="md" onClick={() => setDetailInc(null)}>Cerrar</Button>
                  <Button variant="danger" size="md" onClick={() => { setConfirmEliminar(liveDetailInc); setDetailInc(null); }}>
                    <Trash2 size={14} strokeWidth={2} />
                    Eliminar
                  </Button>
                </div>
                <EstadoSelector
                  incidenciaId={liveDetailInc.incidenciaId}
                  estadoActual={liveDetailInc.estado}
                  onChange={handleEstado}
                  matchButtonHeight
                />
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </AnimatePresence>,
    document.body
  ) : null;

  // ── Modal nueva incidencia (portal) ──────────────────────────────────────
  const modalNode = typeof document !== "undefined" ? createPortal(
    <AnimatePresence>
      {showForm && (
        <motion.div
          key="inc-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "var(--overlay, rgba(0,0,0,0.45))" }}
          onMouseDown={e => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <motion.div
            key="inc-form-panel"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.26, ease: [0.34, 1.15, 0.64, 1] }}
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "92dvh", background: "var(--gris-panel)", boxShadow: "0 24px 56px rgba(0,0,0,0.18)" }}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden shrink-0 flex items-center justify-between px-5 sm:px-6"
              style={{ paddingTop: "20px", paddingBottom: "20px", background: "#D97706" }}>
              <div className="absolute inset-0">
                <Grainient
                  color1="#F59E0B" color2="#D97706" color3="#B45309"
                  timeSpeed={0.18} warpStrength={1.1} warpFrequency={4.0}
                  warpSpeed={1.4} warpAmplitude={55} grainAmount={0.07}
                />
              </div>
              <h2 className="text-2xl font-bold relative z-10" style={{ color: "#ffffff" }}>
                Nueva incidencia
              </h2>
              <div className="relative z-10">
                <IconButton onClick={closeForm} variant="glass" label="Cerrar" />
              </div>
            </div>

            {/* Form body — scrollable */}
            <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 flex flex-col gap-4"
              style={{ opacity: guardando ? 0.6 : 1, pointerEvents: guardando ? "none" : undefined, transition: "opacity 0.2s ease" }}>
              {/* Título */}
              <div>
                <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--texto-label)" }}>
                  Título
                  <span className="relative group ml-0.5 inline-block" style={{ color: "#ef4444" }}>
                    *
                    <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ background: "#1f2937", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", zIndex: 99 }}>
                      Obligatorio
                    </span>
                  </span>
                </label>
                <input
                  value={formTitulo}
                  onChange={e => setFormTitulo(e.target.value)}
                  placeholder="Describe brevemente el problema…"
                  autoFocus
                  className="w-full rounded-lg text-sm px-3.5 outline-none border transition-all"
                  style={{ height: 44, borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "var(--texto-primario)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = TAB_COLOR; e.currentTarget.style.boxShadow = `0 0 0 3px ${TAB_COLOR}22`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                  onKeyDown={e => e.key === "Enter" && handleCrear()}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--texto-label)" }}>Descripción</label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Explica con más detalle qué ocurre, cuándo y a quién afecta…"
                  rows={4}
                  className="w-full rounded-lg text-sm px-3.5 py-2.5 outline-none border transition-all resize-none"
                  style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "var(--texto-primario)", lineHeight: 1.6 }}
                  onFocus={e => { e.currentTarget.style.borderColor = TAB_COLOR; e.currentTarget.style.boxShadow = `0 0 0 3px ${TAB_COLOR}22`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>

              {/* Prioridad */}
              <div>
                <label className="text-sm font-semibold mb-2 block" style={{ color: "var(--texto-label)" }}>Prioridad</label>
                <div className="flex gap-2">
                  {PRIORIDADES.map(p => {
                    const active = formPrio === p.value;
                    const col = p.value === "CRITICA"
                      ? { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" }
                      : { bg: "#f3f4f6", color: "#6b7280", border: "#d1d5db" };
                    return (
                      <button key={p.value} type="button" onClick={() => setFormPrio(p.value)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: active ? col.bg : "var(--blanco)",
                          color: active ? col.color : "var(--texto-secundario)",
                          border: `1.5px solid ${active ? col.border : "var(--gris-borde)"}`,
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                          transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
                        }}
                        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"; } e.currentTarget.style.transform = "scale(1.04)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = active ? col.bg : "var(--blanco)"; e.currentTarget.style.borderColor = active ? col.border : "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                        onMouseDown={(e)  => { e.currentTarget.style.transform = "scale(0.96)"; }}
                        onMouseUp={(e)    => { e.currentTarget.style.transform = "scale(1.04)"; }}>
                        {p.value === "CRITICA" && <AlertTriangle size={13} strokeWidth={2.2} />}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {formError && (
                <p className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.07)", color: "var(--error)" }}>
                  {formError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2.5 px-5 sm:px-6 py-4 shrink-0"
              style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "var(--blanco)", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={closeForm}
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto order-1 sm:order-2"
                onClick={handleCrear}
                disabled={guardando || !formTitulo.trim()}
              >
                {guardando ? "Creando…" : "Crear incidencia"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <div>
      {modalNode}
      {detailModalNode}

      {/* ── Título ── */}
      <div className="mb-8 text-center sm:text-left">
        <h1 style={{
          fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800,
          fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)",
          letterSpacing: "-0.02em", lineHeight: 1.1,
        }}>
          Incidencias
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {cargando ? "Cargando incidencias…" : isError ? "Error al cargar" : incidencias.length === 0 ? "No hay incidencias registradas"
            : <>
                {incidencias.length} incidencia{incidencias.length !== 1 ? "s" : ""}
                {contadores["ABIERTA"] > 0 && (
                  <span className="font-semibold" style={{ color: "#dc2626" }}>
                    {" · "}{contadores["ABIERTA"]} abierta{contadores["ABIERTA"] !== 1 ? "s" : ""}
                  </span>
                )}
                {contadores["EN_CURSO"] > 0 && (
                  <span className="font-semibold" style={{ color: "#d97706" }}>
                    {" · "}{contadores["EN_CURSO"]} en curso
                  </span>
                )}
              </>
          }
        </p>
      </div>

      {/* ── Toolbar — desktop: una sola fila (igual que Documentos) ── */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="hidden sm:flex items-center gap-2">
          {/* Buscador compacto — X dentro del input para limpiar búsqueda */}
          <div className="relative shrink-0" style={{ width: 260 }}>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar incidencia…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 py-2.5 text-base rounded-2xl outline-none transition-colors"
              style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", paddingRight: search ? "2.2rem" : "14px" }}
              onFocus={e => e.currentTarget.style.borderColor = TAB_COLOR}
              onBlur={e => e.currentTarget.style.borderColor = "var(--gris-borde)"}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-colors"
                style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Pills de estado — layoutId compartido para animación deslizante (igual que estadísticas) */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
            {([{ value: "todas", label: "Todas", color: "#fff", bg: "var(--azul-egm)", border: "none" },
               ...ESTADOS.map(e => ({ value: e.value, label: e.label, color: e.color, bg: e.bg, border: `1px solid ${e.border}` }))
            ]).map(item => {
              const isActive = filtro === item.value;
              return (
                <motion.button key={item.value}
                  onClick={() => setFiltro(prev => prev === item.value && item.value !== "todas" ? "todas" : item.value)}
                  className="relative text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer whitespace-nowrap"
                  style={{ color: isActive ? (item.value === "todas" ? "#fff" : item.color) : "var(--texto-muted)", transition: "color 0.15s ease", zIndex: 1, border: "none", background: "transparent" }}
                  whileTap={{ scale: 0.94 }}
                >
                  {isActive && (
                    <motion.span layoutId="inc-pill-bg-desktop"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: item.bg, border: item.border, zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  {item.label}
                </motion.button>
              );
            })}
          </div>

          {/* Botón limpiar filtros — aparece solo si hay filtro de estado activo */}
          <AnimatePresence>
            {filtro !== "todas" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <IconButton
                  variant="surface"
                  size="sm"
                  label="Limpiar filtro de estado"
                  onClick={() => setFiltro("todas")}
                >
                  <X size={14} strokeWidth={2.5} />
                </IconButton>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1" />

          <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
            <Plus size={16} strokeWidth={2.5} />
            Nueva incidencia
          </Button>
        </div>

        {/* Contador de resultados */}
        <AnimatePresence>
          {(search || filtro !== "todas") && incidencias.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-xs font-medium hidden sm:block"
              style={{ color: "var(--texto-muted)" }}
            >
              {filtradas.length === 0
                ? "Sin resultados"
                : `${filtradas.length} incidencia${filtradas.length !== 1 ? "s" : ""}`}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Móvil: buscador + botón, dropdown de filtro debajo */}
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                <Search size={16} />
              </span>
              <input type="text" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-2xl outline-none"
                style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }} />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                  style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
            <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
              <Plus size={16} strokeWidth={2.5} /> Añadir
            </Button>
          </div>
          {/* Dropdown filtro estado — portal, igual que "Todos los tipos" en Documentos */}
          {(() => {
            const activo = filtro !== "todas" ? ESTADOS.find(e => e.value === filtro) : null;
            return (
              <>
                <button
                  ref={filtroDropRef}
                  onClick={() => {
                    if (!filtroDropOpen && filtroDropRef.current) {
                      const r = filtroDropRef.current.getBoundingClientRect();
                      setFiltroDropPos({ top: r.bottom + 5, left: r.left, width: r.width });
                    }
                    setFiltroDropOpen(v => !v);
                  }}
                  className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm font-semibold rounded-2xl cursor-pointer"
                  style={{
                    background: "var(--blanco)",
                    border: `1.5px solid ${activo ? activo.border : "var(--gris-borde)"}`,
                    color: activo ? activo.color : "var(--texto-primario)",
                    transition: "border-color 0.15s",
                  }}
                >
                  <span className="flex items-center gap-2">
                    {activo && <activo.Icon size={13} strokeWidth={2.3} />}
                    {activo ? activo.label : "Todos los estados"}
                  </span>
                  <ChevronDown size={14} strokeWidth={2.3} style={{ color: "var(--texto-muted)", transform: filtroDropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
                </button>
                {filtroDropOpen && createPortal(
                  <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setFiltroDropOpen(false)} />
                    <div
                      className="fixed z-[9999] rounded-2xl overflow-hidden"
                      style={{
                        top: filtroDropPos.top,
                        left: filtroDropPos.left,
                        minWidth: Math.max(filtroDropPos.width, 180),
                        background: "var(--blanco)",
                        border: "1px solid var(--gris-borde)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
                      }}
                    >
                      {[{ value: "todas", label: "Todos los estados", Icon: null as any, color: "var(--texto-primario)", bg: "transparent" },
                        ...ESTADOS].map((opt, idx, arr) => {
                        const isSelected = filtro === opt.value;
                        const accentColor = isSelected && opt.value !== "todas" ? opt.color : TAB_COLOR;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => { setFiltro(opt.value); setFiltroDropOpen(false); }}
                            className="flex items-center justify-between gap-3 w-full px-4 py-3 text-sm font-semibold cursor-pointer"
                            style={{
                              color: isSelected ? (opt.value !== "todas" ? opt.color : TAB_COLOR) : "var(--texto-primario)",
                              background: isSelected ? `${opt.value !== "todas" ? opt.color : TAB_COLOR}12` : "transparent",
                              borderBottom: idx < arr.length - 1 ? "1px solid var(--gris-borde)" : "none",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--gris-pagina)"; }}
                            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <span className="flex items-center gap-2">
                              {opt.Icon && <opt.Icon size={13} strokeWidth={2.3} style={{ color: opt.color }} />}
                              {opt.label}
                            </span>
                            {isSelected && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />}
                          </button>
                        );
                      })}
                    </div>
                  </>,
                  document.body
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* ── Error mutación ── */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
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
          <button onClick={() => refetch()}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ background: "#dc2626", color: "white", cursor: "pointer" }}>
            Reintentar
          </button>
        </div>

      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 sm:py-16 px-6 rounded-2xl text-center"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "rgba(27,63,126,0.08)" }}>
            {filtro !== "todas"
              ? (() => { const e = ESTADOS.find(x => x.value === filtro)!; return <e.Icon size={28} strokeWidth={1.5} style={{ color: "var(--azul-egm)", opacity: 0.7 }} />; })()
              : <Search size={28} strokeWidth={1.5} style={{ color: "var(--azul-egm)", opacity: 0.7 }} />
            }
          </div>
          <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>
            {search ? "Sin resultados" : filtro === "todas" ? "Todavía no hay incidencias" : `Sin incidencias ${ESTADOS.find(e => e.value === filtro)?.plural}`}
          </p>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>
            {search
              ? <>No hay incidencias que coincidan con <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>"{search}"</span></>
              : filtro === "todas"
                ? "Los empleados aún no han reportado ninguna incidencia"
                : "Prueba a cambiar el filtro de estado"}
          </p>
          {(search || filtro !== "todas") && (
            <button onClick={() => { setSearch(""); setFiltro("todas"); }}
              className="text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
              style={{ background: "rgba(27,63,126,0.08)", color: "var(--azul-egm)", border: "1.5px solid rgba(27,63,126,0.20)" }}>
              Ver todas
            </button>
          )}
        </div>

      ) : (
        <AnimatePresence mode="wait">
        <motion.div
          key={filtro + "|" + search}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.18, ease: "easeOut", staggerChildren: 0.05 } }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
        >
          {filtradas.map((inc, idx) => {
            const est       = estadoConf(inc.estado);
            const esCritica = inc.prioridad === "CRITICA";

            return (
              <motion.div
                key={inc.incidenciaId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1], delay: idx * 0.04 } }}
                className="flex flex-col rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  background: `linear-gradient(145deg, ${est.grad1} 0%, ${est.color} 55%, ${est.grad2} 100%)`,
                  boxShadow: `0 2px 12px ${est.color}28, inset 0 1px 0 rgba(255,255,255,0.22)`,
                  transition: "box-shadow 0.22s ease, transform 0.22s ease",
                }}
                onClick={() => setDetailInc(inc)}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 8px 24px ${est.color}45, inset 0 1px 0 rgba(255,255,255,0.22)`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = `0 2px 12px ${est.color}28, inset 0 1px 0 rgba(255,255,255,0.22)`;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* ── Cuerpo ── */}
                <div className="relative flex-1 px-4 pt-4 pb-5 flex flex-col gap-2">

                  {/* Overlay radial — foco de luz */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "radial-gradient(ellipse at 15% 10%, rgba(255,255,255,0.18) 0%, transparent 60%)" }} />

                  {/* Decoración — círculos */}
                  <div className="absolute pointer-events-none select-none rounded-full"
                    style={{ width: 110, height: 110, bottom: -30, right: -20, background: "rgba(255,255,255,0.11)" }} />
                  <div className="absolute pointer-events-none select-none rounded-full"
                    style={{ width: 68, height: 68, bottom: -10, right: 52, background: "rgba(255,255,255,0.08)" }} />

                  {/* Fecha + chip crítica */}
                  <div className="flex items-center gap-1.5">
                    {esCritica && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(0,0,0,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.20)" }}>
                        <AlertTriangle size={8} strokeWidth={3} />
                        Crítica
                      </span>
                    )}
                    <span className="flex-1" />
                    <span className="text-[11px] font-semibold whitespace-nowrap"
                      style={{ color: "rgba(255,255,255,0.88)" }}
                      title={formatFecha(inc.creadoEn)}>
                      {tiempoRelativo(inc.creadoEn)}
                    </span>
                  </div>

                  {/* Título */}
                  <p className="text-lg font-extrabold leading-snug line-clamp-2"
                    style={{ color: "#fff", letterSpacing: "-0.025em", textShadow: "0 1px 6px rgba(0,0,0,0.20)" }}>
                    {inc.titulo}
                  </p>

                  {/* Descripción */}
                  <p className="text-[11px] line-clamp-1 leading-relaxed"
                    style={{ color: inc.descripcion?.trim() ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.35)", fontStyle: inc.descripcion?.trim() ? "normal" : "italic" }}>
                    {inc.descripcion?.trim() || "Sin descripción"}
                  </p>
                </div>

                {/* ── Footer blanco ── */}
                <div className="relative flex items-center justify-between gap-2 px-3.5 py-2"
                  style={{ background: "var(--blanco)", borderTop: "1px solid rgba(0,0,0,0.06)" }}
                  onClick={e => e.stopPropagation()}>
                  <EstadoSelector
                    incidenciaId={inc.incidenciaId}
                    estadoActual={inc.estado}
                    onChange={handleEstado}
                    matchButtonHeight
                  />
                  <IconButton
                    variant="danger"
                    size="sm"
                    label="Eliminar incidencia"
                    style={{ width: "34px", height: "34px" }}
                    onClick={() => setConfirmEliminar(inc)}
                  >
                    <Trash2 size={17} strokeWidth={2} />
                  </IconButton>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        </AnimatePresence>
      )}

      {/* ── Modal confirmar eliminar ── */}
      <ModalConfirm
        abierto={!!confirmEliminar}
        titulo="¿Eliminar incidencia?"
        descripcion={confirmEliminar ? `"${confirmEliminar.titulo}" se eliminará definitivamente` : ""}
        textoConfirmar="Eliminar"
        variante="danger"
        onConfirmar={handleEliminar}
        onCancelar={() => setConfirmEliminar(null)}
      />
    </div>
  );
}
