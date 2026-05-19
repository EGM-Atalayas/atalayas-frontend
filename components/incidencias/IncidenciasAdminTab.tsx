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
  { value: "ABIERTA",  label: "Abierta",  color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", Icon: AlertTriangle },
  { value: "EN_CURSO", label: "En curso", color: "#d97706", bg: "#fef3c7", border: "#fcd34d", Icon: Clock        },
  { value: "CERRADA",  label: "Cerrada",  color: "#16a34a", bg: "#dcfce7", border: "#86efac", Icon: CheckCircle2 },
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
    <div className="rounded-2xl p-5 animate-pulse"
      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
      <div className="flex items-start gap-4">
        <div className="rounded-2xl shrink-0" style={{ width: 48, height: 48, background: "var(--gris-borde)" }} />
        <div className="flex-1 flex flex-col gap-2.5 pt-0.5">
          <div className="flex gap-2 items-center">
            <div className="h-4 rounded-full w-48" style={{ background: "var(--gris-borde)" }} />
            <div className="h-5 rounded-full w-16" style={{ background: "var(--gris-borde)" }} />
          </div>
          <div className="h-3 rounded-full w-full" style={{ background: "var(--gris-borde)" }} />
          <div className="h-3 rounded-full w-2/3" style={{ background: "var(--gris-borde)" }} />
          <div className="flex gap-3 mt-1">
            <div className="h-3 rounded-full w-28" style={{ background: "var(--gris-borde)" }} />
            <div className="h-3 rounded-full w-16" style={{ background: "var(--gris-borde)" }} />
          </div>
        </div>
        <div className="rounded-xl shrink-0 h-8 w-28" style={{ background: "var(--gris-borde)" }} />
      </div>
    </div>
  );
}

// ── Estado selector ───────────────────────────────────────────────────────────
function EstadoSelector({ incidenciaId, estadoActual, onChange }: {
  incidenciaId: string; estadoActual: string;
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
          background: conf.bg, color: conf.color,
          border: `1px solid ${conf.border}`,
          cursor: "pointer", minWidth: 112,
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
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-left"
                  style={{
                    color: e.value === estadoActual ? e.color : "var(--texto-primario)",
                    background: e.value === estadoActual ? e.bg : "transparent",
                    cursor: "pointer", transition: "background 0.12s",
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

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO: Incidencia[] = [
  {
    incidenciaId: "demo-1",
    titulo: "Fallo en el sistema de climatización planta 2",
    descripcion: "Desde el lunes el aire acondicionado de la planta 2 no funciona correctamente, la temperatura supera los 30°C y está afectando al rendimiento del equipo.",
    prioridad: "CRITICA", estado: "ABIERTA",
    creadoPor: "usr-demo", nombreCreador: "Laura Martínez", emailCreador: "laura@empresa.com",
    empresaId: "demo", creadoEn: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    actualizadoEn: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    incidenciaId: "demo-2",
    titulo: "Problemas con el acceso al portal de RRHH",
    descripcion: "Varios empleados del departamento de administración no pueden iniciar sesión en el portal interno de RRHH. El error aparece al introducir las credenciales.",
    prioridad: "NORMAL", estado: "EN_CURSO",
    creadoPor: "usr-demo2", nombreCreador: "Carlos Pérez", emailCreador: "carlos@empresa.com",
    empresaId: "demo", creadoEn: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    actualizadoEn: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    incidenciaId: "demo-3",
    titulo: "Impresora de recepción sin papel y con error de red",
    descripcion: "La impresora principal de recepción muestra un error de conexión de red y además se ha quedado sin papel. Se ha reportado dos veces sin resolución.",
    prioridad: "NORMAL", estado: "CERRADA",
    creadoPor: "usr-demo3", nombreCreador: "Ana Gómez", emailCreador: "ana@empresa.com",
    empresaId: "demo", creadoEn: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    actualizadoEn: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function IncidenciasAdminTab({ empresaId, esSuperadmin }: Props) {
  const queryClient = useQueryClient();

  const [filtro, setFiltro]       = useState<string>("todas");
  const [search, setSearch]       = useState("");
  const [errorMut, setErrorMut]   = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<Incidencia | null>(null);

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

  const esDemo = !cargando && !isError && rawIncidencias.length === 0;
  const incidencias = esDemo ? DEMO : rawIncidencias;

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
    if (esDemo) return;
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
    if (!confirmEliminar || esDemo) return;
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

  // Scroll lock when modal is open
  useEffect(() => {
    if (showForm) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [showForm]);

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
            style={{ maxHeight: "92dvh", background: "var(--blanco)" }}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Header with color */}
            <div className="relative overflow-hidden shrink-0 flex items-center justify-between px-6 py-5"
              style={{ background: TAB_COLOR }}>
              <div className="absolute inset-0 pointer-events-none">
                <Grainient color1={TAB_COLOR} color2="#92400e" color3="#451a03" />
              </div>
              <div className="relative z-10">
                <h2 className="text-base font-bold text-white" style={{ letterSpacing: "-0.01em" }}>
                  Nueva incidencia
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.72)" }}>
                  Rellena los datos y pulsa crear
                </p>
              </div>
              <div className="relative z-10">
                <IconButton onClick={closeForm} variant="glass" label="Cerrar">
                  <X size={16} strokeWidth={2.5} />
                </IconButton>
              </div>
            </div>

            {/* Form body — scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
              {/* Título */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--texto-label)" }}>
                  Título <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={formTitulo}
                  onChange={e => setFormTitulo(e.target.value)}
                  placeholder="Describe brevemente el problema…"
                  autoFocus
                  className="w-full rounded-xl text-sm px-3.5 outline-none border transition-all"
                  style={{ height: 42, borderColor: "var(--gris-borde)", background: "#fff", color: "var(--texto-primario)" }}
                  onFocus={e => e.currentTarget.style.borderColor = TAB_COLOR}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--gris-borde)"}
                  onKeyDown={e => e.key === "Enter" && handleCrear()}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--texto-label)" }}>Descripción</label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Explica con más detalle qué ocurre, cuándo y a quién afecta…"
                  rows={4}
                  className="w-full rounded-xl text-sm px-3.5 py-2.5 outline-none border transition-all resize-none"
                  style={{ borderColor: "var(--gris-borde)", background: "#fff", color: "var(--texto-primario)", lineHeight: 1.6 }}
                  onFocus={e => e.currentTarget.style.borderColor = TAB_COLOR}
                  onBlur={e => e.currentTarget.style.borderColor = "var(--gris-borde)"}
                />
              </div>

              {/* Prioridad */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--texto-label)" }}>Prioridad</label>
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
                <p className="text-xs font-semibold" style={{ color: "#dc2626" }}>{formError}</p>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-4 flex justify-end gap-3"
              style={{ borderTop: "1px solid var(--gris-borde)" }}>
              <button
                type="button"
                onClick={closeForm}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                style={{ background: "var(--gris-superficie)", color: "var(--texto-primario)", border: "1px solid var(--gris-borde)", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrear}
                disabled={guardando}
                className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-opacity"
                style={{ background: TAB_COLOR, color: "#fff", cursor: guardando ? "not-allowed" : "pointer", opacity: guardando ? 0.7 : 1 }}
              >
                {guardando ? "Creando…" : "Crear incidencia"}
              </button>
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

      {/* ── Título ── */}
      <div className="mb-6 sm:mb-8">
        <h1 style={{
          fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800,
          fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)",
          letterSpacing: "-0.02em", lineHeight: 1.1,
        }}>
          Incidencias
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {cargando ? "Cargando incidencias…" : isError ? "Error al cargar" : esDemo
            ? <span>Vista previa · <span style={{ color: TAB_COLOR, fontWeight: 600 }}>datos de ejemplo</span></span>
            : incidencias.length === 0 ? "No hay incidencias registradas"
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

        {/* Móvil: buscador + botón en fila, pills debajo */}
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
          <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
              {["todas", ...ESTADOS.map(e => e.value)].map(v => {
                const est = v === "todas" ? null : ESTADOS.find(e => e.value === v)!;
                const isActive = filtro === v;
                return (
                  <motion.button key={v}
                    onClick={() => setFiltro(v === filtro && v !== "todas" ? "todas" : v)}
                    className="relative text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer whitespace-nowrap"
                    style={{ color: isActive ? (est ? est.color : "#fff") : "var(--texto-muted)", zIndex: 1, border: "none", background: "transparent" }}
                    whileTap={{ scale: 0.94 }}>
                    <AnimatePresence>
                      {isActive && (
                        <motion.span key="bg" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                          className="absolute inset-0 rounded-lg"
                          style={{ background: est ? est.bg : TAB_COLOR, border: est ? `1px solid ${est.border}` : "none", zIndex: -1 }} />
                      )}
                    </AnimatePresence>
                    {v === "todas" ? "Todas" : est!.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
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
          <button onClick={() => refetch()}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ background: "#dc2626", color: "white", cursor: "pointer" }}>
            Reintentar
          </button>
        </div>

      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 rounded-2xl text-center"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          <div className="rounded-2xl p-5" style={{ background: "var(--gris-superficie)" }}>
            <AlertTriangle size={32} strokeWidth={1.4} style={{ color: "var(--texto-muted)" }} />
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: "var(--texto-primario)" }}>
              {search ? "Sin resultados" : filtro === "todas" ? "Todavía no hay incidencias" : `Sin incidencias ${ESTADOS.find(e => e.value === filtro)?.label.toLowerCase()}`}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--texto-muted)", maxWidth: 280, margin: "4px auto 0" }}>
              {search ? `No hay incidencias que coincidan con "${search}"` : filtro === "todas" ? "Los empleados aún no han reportado ninguna" : "Prueba a cambiar el filtro"}
            </p>
          </div>
          {(search || filtro !== "todas") && (
            <button onClick={() => { setSearch(""); setFiltro("todas"); }}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl"
              style={{ background: "var(--azul-egm)", color: "white", cursor: "pointer" }}>
              Ver todas
            </button>
          )}
        </div>

      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map(inc => {
            const est       = estadoConf(inc.estado);
            const esCritica = inc.prioridad === "CRITICA";

            return (
              <motion.div
                key={inc.incidenciaId}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="group rounded-2xl overflow-hidden"
                style={{
                  background: "var(--blanco)",
                  border: "1px solid var(--gris-borde)",
                  transition: "box-shadow 0.18s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 18px rgba(0,0,0,0.07)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}
              >
                <div className="flex items-start gap-4 px-5 pt-4 pb-3">
                  {/* Icono estado */}
                  <div className="rounded-2xl shrink-0 flex items-center justify-center"
                    style={{ width: 48, height: 48, background: est.bg, color: est.color, border: `1px solid ${est.border}`, marginTop: 1 }}>
                    <est.Icon size={20} strokeWidth={2} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-bold text-sm leading-snug" style={{ color: "var(--texto-primario)" }}>
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
                    {inc.descripcion && (
                      <p className="text-xs line-clamp-2" style={{ color: "#6b7280", lineHeight: 1.65 }}>
                        {inc.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Acciones — desktop */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <EstadoSelector
                      incidenciaId={inc.incidenciaId}
                      estadoActual={inc.estado}
                      onChange={handleEstado}
                    />
                    {!esDemo && (
                      <motion.button
                        onClick={() => setConfirmEliminar(inc)}
                        whileTap={{ scale: 0.88 }}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0 cursor-pointer"
                        style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--error-light)", color: "var(--error)", border: "1px solid rgba(220,38,38,0.15)", transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.18s var(--ease-spring), opacity 0.15s" }}
                        title="Eliminar incidencia"
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--error)"; el.style.color = "#fff"; el.style.borderColor = "var(--error)"; el.style.boxShadow = "0 4px 14px rgba(220,38,38,0.35), 0 0 0 3px rgba(220,38,38,0.15)"; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--error-light)"; el.style.color = "var(--error)"; el.style.borderColor = "rgba(220,38,38,0.15)"; el.style.boxShadow = "none"; }}
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between gap-3 px-5 pb-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]" style={{ color: "#9ca3af" }}>
                    {inc.nombreCreador && (
                      <span>
                        <strong style={{ color: "var(--texto-primario)", fontWeight: 600 }}>{inc.nombreCreador}</strong>
                      </span>
                    )}
                    {esSuperadmin && inc.nombreEmpresa && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>
                        {inc.nombreEmpresa}
                      </span>
                    )}
                    <span title={formatFecha(inc.creadoEn)} style={{ color: "#9ca3af" }}>
                      {tiempoRelativo(inc.creadoEn)}
                    </span>
                  </div>

                  {/* Acciones — móvil */}
                  <div className="sm:hidden flex items-center gap-2 shrink-0">
                    <EstadoSelector
                      incidenciaId={inc.incidenciaId}
                      estadoActual={inc.estado}
                      onChange={handleEstado}
                    />
                    {!esDemo && (
                      <motion.button
                        onClick={() => setConfirmEliminar(inc)}
                        whileTap={{ scale: 0.88 }}
                        className="flex items-center justify-center shrink-0 cursor-pointer"
                        style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--error-light)", color: "var(--error)", border: "1px solid rgba(220,38,38,0.15)", transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.18s var(--ease-spring)" }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--error)"; el.style.color = "#fff"; el.style.borderColor = "var(--error)"; el.style.boxShadow = "0 4px 14px rgba(220,38,38,0.35), 0 0 0 3px rgba(220,38,38,0.15)"; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--error-light)"; el.style.color = "var(--error)"; el.style.borderColor = "rgba(220,38,38,0.15)"; el.style.boxShadow = "none"; }}
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
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
