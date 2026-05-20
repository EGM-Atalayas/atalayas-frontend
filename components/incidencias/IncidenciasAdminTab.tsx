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

const TAB_COLOR = "#B45309";

// ── Paleta de estados ────────────────────────────────────────────────────────
const ESTADOS = [
  { value: "ABIERTA",  label: "Abierta",  color: "#dc2626", dark: "#991b1b", bg: "#fee2e2", border: "#fca5a5", Icon: CircleAlert },
  { value: "EN_CURSO", label: "En curso", color: "#d97706", dark: "#92400e", bg: "#fef3c7", border: "#fcd34d", Icon: Clock        },
  { value: "CERRADA",  label: "Cerrada",  color: "#16a34a", dark: "#14532d", bg: "#dcfce7", border: "#86efac", Icon: CheckCircle2 },
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
    <div className="rounded-2xl overflow-hidden animate-pulse flex"
      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
      {/* Acento lateral */}
      <div style={{ width: 4, flexShrink: 0, background: "var(--gris-borde)" }} />
      {/* Contenido */}
      <div className="flex flex-1 items-center gap-3 px-3 sm:px-4 py-3">
        <div className="rounded-lg shrink-0" style={{ width: 32, height: 32, background: "var(--gris-borde)" }} />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3.5 rounded-full w-40" style={{ background: "var(--gris-borde)" }} />
            <div className="h-3.5 rounded-full w-12" style={{ background: "var(--gris-borde)" }} />
          </div>
          <div className="h-3 rounded-full w-3/4" style={{ background: "var(--gris-superficie)" }} />
        </div>
        <div className="hidden sm:block rounded-xl shrink-0 h-7 w-28" style={{ background: "var(--gris-borde)" }} />
      </div>
    </div>
  );
}

// ── Estado selector ───────────────────────────────────────────────────────────
function EstadoSelector({ incidenciaId, estadoActual, onChange, matchButtonHeight = false }: {
  incidenciaId: string; estadoActual: string;
  onChange: (id: string, estado: string) => void;
  matchButtonHeight?: boolean;
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
        style={{
          height: matchButtonHeight ? 40 : 26,
          borderRadius: matchButtonHeight ? "var(--radius-btn)" : "7px",
          background: conf.bg,
          border: `1px solid ${open ? conf.color : conf.border}`,
          color: conf.color,
          transition: "border-color 0.15s",
        }}
      >
        <conf.Icon size={matchButtonHeight ? 14 : 10} strokeWidth={2.5} />
        {conf.label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex", opacity: 0.55 }}
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
                  background: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.10)",
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
                      background: e.value === estadoActual ? `${e.color}12` : "transparent",
                      color: e.value === estadoActual ? e.color : "var(--texto-primario)",
                      fontWeight: e.value === estadoActual ? 600 : 400,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={ev => { if (e.value !== estadoActual) (ev.currentTarget as HTMLButtonElement).style.background = "var(--gris-superficie)"; }}
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

  const { data: rawIncidencias = [], isLoading: cargando, isError, refetch } = useQuery<Incidencia[]>({
    queryKey: ["incidencias", empresaId],
    queryFn: () => getIncidencias(empresaId),
    enabled: !!empresaId,
  });

  const incidencias = rawIncidencias;

  const contadores = ESTADOS.reduce((acc, e) => {
    acc[e.value] = incidencias.filter(i => i.estado === e.value).length;
    return acc;
  }, {} as Record<string, number>);

  const totalPendientes = (contadores["ABIERTA"] ?? 0) + (contadores["EN_CURSO"] ?? 0);

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
              {/* Header plano con color del estado */}
              <div className="shrink-0 flex items-start justify-between px-5 sm:px-6"
                style={{ paddingTop: "20px", paddingBottom: "20px", background: est.color }}>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}>
                      <est.Icon size={11} strokeWidth={2.5} />
                      {est.label}
                    </span>
                    {liveDetailInc.prioridad === "CRITICA" && (
                      <span className="inline-flex items-center justify-center rounded-full"
                        style={{ width: 28, height: 28, background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}
                        title="Prioridad crítica">
                        <AlertTriangle size={15} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold leading-snug" style={{ color: "#ffffff" }}>
                    {liveDetailInc.titulo}
                  </h2>
                </div>
                <div className="shrink-0">
                  <IconButton onClick={() => setDetailInc(null)} variant="glass" label="Cerrar" />
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 flex flex-col gap-3">

                {/* Meta: creador · fecha en una sola línea */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {liveDetailInc.nombreCreador && (
                    <>
                      <span className="text-xs" style={{ color: "var(--texto-muted)" }}>Reportado por</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--texto-secundario)" }}>
                        {liveDetailInc.nombreCreador}
                      </span>
                      <span className="text-xs" style={{ color: "var(--gris-borde)" }}>·</span>
                    </>
                  )}
                  <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                    {tiempoRelativo(liveDetailInc.creadoEn) !== formatFecha(liveDetailInc.creadoEn)
                      ? tiempoRelativo(liveDetailInc.creadoEn)
                      : formatFecha(liveDetailInc.creadoEn)}
                  </span>
                </div>

                {/* Descripción */}
                <div>
                  {liveDetailInc.descripcion?.trim() ? (
                    <p className="text-sm" style={{ color: "var(--texto-primario)", lineHeight: 1.8 }}>
                      {liveDetailInc.descripcion}
                    </p>
                  ) : (
                    <p className="text-sm italic" style={{ color: "var(--texto-placeholder)" }}>Sin descripción</p>
                  )}
                </div>
              </div>

              {/* Footer: izq cerrar+eliminar · der estado */}
              <div className="flex items-center justify-between gap-2 px-5 sm:px-6 py-4 shrink-0"
                style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#ffffff", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="md" onClick={() => setDetailInc(null)}>Cerrar</Button>
                  <Button variant="danger" size="md" onClick={() => { setConfirmEliminar(liveDetailInc); setDetailInc(null); }}>
                    <Trash2 size={14} strokeWidth={2} />
                    <span className="hidden sm:inline">Eliminar</span>
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
              style={{ paddingTop: "20px", paddingBottom: "20px", background: "#C8782A" }}>
              <div className="absolute inset-0">
                <Grainient
                  color1="#C8782A" color2="#B45309" color3="#7C3A0E"
                  timeSpeed={0.18} warpStrength={1.1} warpFrequency={4.0}
                  warpSpeed={1.4} warpAmplitude={55} grainAmount={0.07}
                />
              </div>
              <h2 className="relative z-10" style={{
                fontFamily: "var(--font-raleway), sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.4rem, 4vw, 1.8rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                margin: 0,
              }}>
                Nueva incidencia
              </h2>
              <div className="relative z-10">
                <IconButton onClick={closeForm} variant="glass" label="Cerrar" />
              </div>
            </div>

            {/* Form body — scrollable */}
            <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 flex flex-col gap-4">
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
                  {PRIORIDADES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFormPrio(p.value)}
                      className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                      style={{
                        background: formPrio === p.value
                          ? (p.value === "CRITICA" ? "#fee2e2" : "var(--gris-superficie)")
                          : "transparent",
                        color: formPrio === p.value
                          ? (p.value === "CRITICA" ? "#dc2626" : "var(--texto-primario)")
                          : "var(--texto-muted)",
                        border: `1.5px solid ${formPrio === p.value
                          ? (p.value === "CRITICA" ? "#fca5a5" : "var(--gris-borde)")
                          : "var(--gris-borde)"}`,
                        cursor: "pointer",
                      }}
                    >
                      {p.value === "CRITICA" ? "⚠ " : ""}{p.label}
                    </button>
                  ))}
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
              style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#ffffff", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
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
          {/* Buscador compacto */}
          <div className="relative" style={{ width: 260 }}>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Buscar incidencia…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-colors"
              style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }}
              onFocus={e => e.currentTarget.style.borderColor = TAB_COLOR}
              onBlur={e => e.currentTarget.style.borderColor = "var(--gris-borde)"}
            />
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

          {/* Botón limpiar filtros — azul como documentos */}
          <AnimatePresence>
            {hayFiltrosActivos && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => { setSearch(""); setFiltro("todas"); }}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full focus:outline-none cursor-pointer shrink-0"
                title="Limpiar filtros"
                style={{ background: "rgba(22,50,105,0.07)", border: "1.5px solid rgba(22,50,105,0.18)", color: "var(--azul-egm)", transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.18s ease, transform 0.18s ease" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(22,50,105,0.13)"; el.style.boxShadow = "0 0 0 3px rgba(22,50,105,0.10)"; el.style.borderColor = "rgba(22,50,105,0.35)"; el.style.transform = "scale(1.10)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(22,50,105,0.07)"; el.style.boxShadow = "none"; el.style.borderColor = "rgba(22,50,105,0.18)"; el.style.transform = "scale(1)"; }}
                onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.88)"; }}
                onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.10)"; }}
              >
                <X size={14} strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="flex-1" />

          <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
            <Plus size={14} />
            Nueva incidencia
          </Button>
        </div>

        {/* Móvil: buscador + botón, dropdown de filtro debajo */}
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                <Search size={15} />
              </span>
              <input type="text" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none"
                style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }} />
            </div>
            <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
              <Plus size={14} />
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
                  className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer"
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
                      className="fixed z-[9999] rounded-xl overflow-hidden"
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
                        ...ESTADOS].map(opt => {
                        const isSelected = filtro === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => { setFiltro(opt.value); setFiltroDropOpen(false); }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold cursor-pointer text-left"
                            style={{
                              color: isSelected ? opt.color : "var(--texto-primario)",
                              background: isSelected ? (("bg" in opt && opt.bg !== "transparent") ? opt.bg : "var(--gris-superficie)") : "transparent",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--gris-superficie)"; }}
                            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            {opt.Icon && <opt.Icon size={13} strokeWidth={2.3} style={{ color: opt.color }} />}
                            {opt.label}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
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
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 72, height: 72, background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
            {search || filtro !== "todas"
              ? <Search size={28} strokeWidth={1.4} />
              : <AlertTriangle size={28} strokeWidth={1.4} />}
          </div>
          <div>
            <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>
              {search ? "Sin resultados" : filtro === "todas" ? "Todavía no hay incidencias" : `Sin incidencias ${ESTADOS.find(e => e.value === filtro)?.label.toLowerCase()}`}
            </p>
            <p className="text-sm" style={{ color: "var(--texto-muted)", maxWidth: 320, margin: "0 auto" }}>
              {search
                ? <>No hay incidencias que coincidan con <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>"{search}"</span></>
                : filtro === "todas"
                  ? "Los empleados aún no han reportado ninguna incidencia."
                  : "Prueba a cambiar el filtro de estado."}
            </p>
          </div>
          {(search || filtro !== "todas") && (
            <button onClick={() => { setSearch(""); setFiltro("todas"); }}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl mt-1"
              style={{ background: "var(--azul-egm)", color: "white", cursor: "pointer" }}>
              Ver todas
            </button>
          )}
        </div>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          <AnimatePresence initial={false}>
          {filtradas.map((inc, idx) => {
            const est       = estadoConf(inc.estado);
            const esCritica = inc.prioridad === "CRITICA";

            return (
              <motion.div
                key={inc.incidenciaId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: idx * 0.03 }}
                className="flex rounded-2xl"
                style={{
                  background: "var(--blanco)",
                  border: "1px solid var(--gris-borde)",
                  borderLeft: `3px solid ${est.color}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "box-shadow 0.2s ease",
                  overflow: "visible",
                  position: "relative",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
              >
                {/* Contenido principal */}
                <div className="flex flex-1 items-center gap-3 px-3 sm:px-4 py-3 min-w-0 cursor-pointer" onClick={() => setDetailInc(inc)}>

                  {/* Icono estado + indicador crítica */}
                  <div className="relative shrink-0" style={{ width: 36, height: 36 }}>
                    <div className="flex items-center justify-center rounded-xl w-full h-full"
                      style={{ background: est.bg }}>
                      <est.Icon size={17} strokeWidth={2.2} style={{ color: est.color }} />
                    </div>
                    {esCritica && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                        style={{ width: 17, height: 17, background: "#dc2626", boxShadow: "0 0 0 2px var(--blanco)" }}
                        title="Prioridad crítica">
                        <AlertTriangle size={9} strokeWidth={2.8} style={{ color: "#fff" }} />
                      </span>
                    )}
                  </div>

                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    {/* Fila superior: título + fecha */}
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <span className="font-semibold text-sm line-clamp-1 leading-snug"
                        style={{ color: "var(--texto-primario)" }}>
                        {inc.titulo}
                      </span>
                      <span className="text-[11px] shrink-0 font-medium whitespace-nowrap"
                        style={{ color: "var(--texto-muted)" }}
                        title={formatFecha(inc.creadoEn)}>
                        {tiempoRelativo(inc.creadoEn)}
                      </span>
                    </div>
                    {/* Fila inferior: descripción + empresa */}
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      {inc.descripcion?.trim() ? (
                        <span className="text-[11px] truncate" style={{ color: "var(--texto-muted)" }}>
                          {inc.descripcion.trim()}
                        </span>
                      ) : (
                        <span className="text-[11px] italic" style={{ color: "var(--texto-placeholder)" }}>Sin descripción</span>
                      )}
                      {esSuperadmin && inc.nombreEmpresa && (
                        <>
                          <span className="text-[11px] shrink-0" style={{ color: "var(--gris-borde)" }}>·</span>
                          <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--texto-muted)" }}>
                            {inc.nombreEmpresa}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Indicador visual de que hay detalle */}
                  <ChevronDown size={13} strokeWidth={2} style={{ color: "var(--texto-muted)", transform: "rotate(-90deg)", opacity: 0.4, flexShrink: 0 }} />
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal confirmar eliminar ── */}
      <ModalConfirm
        abierto={!!confirmEliminar}
        titulo="¿Eliminar incidencia?"
        descripcion={confirmEliminar ? `"${confirmEliminar.titulo}" se eliminará definitivamente.` : ""}
        textoConfirmar="Eliminar"
        variante="danger"
        onConfirmar={handleEliminar}
        onCancelar={() => setConfirmEliminar(null)}
      />
    </div>
  );
}
