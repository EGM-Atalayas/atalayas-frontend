"use client";

// ============================================================
// DocumentosAdminTab — gestión documental del panel de admin
// Rediseñado para ser coherente con el sistema de diseño del panel
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  listarDocumentosEmpresa, subirDocumento, desactivarDocumento, listarAsignaciones, editarDocumento, asignarDocumento, desasignarDocumento,
} from "@/lib/api/documentos";
import { QK } from "@/lib/queryKeys";
import {
  type Documento, type AsignacionDetalle, type TipoDocumento, type SubirDocumentoInput,
  TIPO_DOCUMENTO_LABEL, TIPO_DOCUMENTO_COLOR,
} from "@/lib/types/documentos";
import {
  FileText, Upload, Trash2, Check, X, AlertTriangle, ChevronDown,
  Users, Building2, Globe, Plus, Search, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import Grainient from "@/components/ui/Grainient";
import { ModalConfirm } from "@/components/ui/ModalConfirm";

interface Props {
  empresaId: string;
  empleados: Array<{ usuarioId: string; nombre: string; apellidos: string; departamento: string | null }>;
  departamentos: Array<{ id: string; label: string }>;
  /** Datos precargados desde page.tsx — evita re-loading al cambiar de tab */
  documentosIniciales?: Documento[];
  cargandoInicial?: boolean;
}

const TIPOS: TipoDocumento[] = ["NOMINA", "CONTRATO", "CERTIFICADO", "POLITICA", "OTRO"];
const TAB_COLOR = "#4E6D7E";

// ── Paletas de avatar y departamento — compartidas por todos los modales ──────
const AVATAR_PALETTES = [
  { bg: "#dbeafe", color: "#1d4ed8" }, // blue
  { bg: "#d1fae5", color: "#065f46" }, // green
  { bg: "#ede9fe", color: "#5b21b6" }, // violet
  { bg: "#fce7f3", color: "#9d174d" }, // pink
  { bg: "#ffedd5", color: "#c2410c" }, // orange
  { bg: "#e0f2fe", color: "#0369a1" }, // sky
  { bg: "#fef9c3", color: "#854d0e" }, // yellow
  { bg: "#f1f5f9", color: "#334155" }, // slate
];
const avatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
};
const normDpto = (s: string) =>
  s?.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim() ?? "";
const DPTO_PALETTES: Record<string, { bg: string; color: string; border: string }> = {
  FORMACION:      { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  ADMINISTRACION: { bg: "#ede9fe", color: "#5b21b6", border: "#ddd6fe" },
  PRODUCCION:     { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  RRHH:           { bg: "#fce7f3", color: "#9d174d", border: "#fbcfe8" },
  VENTAS:         { bg: "#ffedd5", color: "#c2410c", border: "#fed7aa" },
  IT:             { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  FINANZAS:       { bg: "#fef9c3", color: "#854d0e", border: "#fde68a" },
  LOGISTICA:      { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  CALIDAD:        { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  MANTENIMIENTO:  { bg: "#f1f5f9", color: "#334155", border: "#e2e8f0" },
  SEGURIDAD:      { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
};
const dptoColorFull = (d: string) =>
  DPTO_PALETTES[normDpto(d)] ?? { bg: "var(--gris-superficie)", color: "var(--texto-muted)", border: "var(--gris-borde)" };

export function DocumentosAdminTab({ empresaId, empleados, departamentos, documentosIniciales, cargandoInicial = false }: Props) {
  const queryClient = useQueryClient();

  // El componente nunca se desmonta (CSS display), así que isLoading solo es true
  // en la primera carga real — igual que empleados en page.tsx
  const { data: documentos = documentosIniciales ?? [], isLoading: cargando } = useQuery<Documento[]>({
    queryKey: QK.documentos(empresaId),
    queryFn: listarDocumentosEmpresa,
    enabled: !!empresaId,
  });

  const [showSubir, setShowSubir]             = useState(false);
  const [verAsignacionesDe, setVerAsignaciones] = useState<Documento | null>(null);
  const [asignaciones, setAsignaciones]       = useState<AsignacionDetalle[]>([]);
  const [cargandoAsig, setCargandoAsig]       = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState<Documento | null>(null);
  const [docEditar, setDocEditar]             = useState<Documento | null>(null);
  const [editForm, setEditForm]               = useState<{ titulo: string; descripcion: string; tipo: TipoDocumento; requiereFirma: boolean } | null>(null);
  const [editando, setEditando]               = useState(false);
  const [editError, setEditError]             = useState<string | null>(null);
  const [busqueda, setBusqueda]               = useState("");
  const [filtroTipos, setFiltroTipos]         = useState<Set<TipoDocumento>>(new Set());
  const [toast, setToast]                     = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (confirmEliminar) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [confirmEliminar]);

  const mostrarToast = (msg: string, tipo: "ok" | "error" = "ok") => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const abrirAsignaciones = async (doc: Documento) => {
    setVerAsignaciones(doc);
    setCargandoAsig(true);
    try {
      setAsignaciones(await listarAsignaciones(doc.documentoId));
    } catch { setAsignaciones([]); }
    finally { setCargandoAsig(false); }
  };

  const [asignacionesEditar, setAsignacionesEditar]       = useState<AsignacionDetalle[]>([]);
  const [cargandoAsigEditar, setCargandoAsigEditar]       = useState(false);

  const abrirEditar = async (doc: Documento) => {
    setDocEditar(doc);
    setEditForm({ titulo: doc.titulo, descripcion: doc.descripcion ?? "", tipo: doc.tipo, requiereFirma: doc.requiereFirma });
    setEditError(null);
    setAsignacionesEditar([]);
    setCargandoAsigEditar(true);
    try {
      const asig = await listarAsignaciones(doc.documentoId);
      setAsignacionesEditar(asig);
    } catch { /* no crítico */ }
    finally { setCargandoAsigEditar(false); }
  };

  const guardarEdicion = async (cambiosAsig?: {
    nuevosUsersSel: Set<string>;
    nuevosDptosSel: Set<string>;
    destino: "todos" | "departamentos" | "empleados";
    asignarATodos: boolean;
    eliminarIds: string[];
    notificar: boolean;
  }) => {
    if (!docEditar || !editForm) return;
    if (!editForm.titulo.trim()) { setEditError("El título es obligatorio"); return; }
    setEditando(true);
    setEditError(null);
    try {
      await editarDocumento(docEditar.documentoId, {
        titulo: editForm.titulo.trim(),
        descripcion: editForm.descripcion.trim() || null,
        tipo: editForm.tipo,
        requiereFirma: editForm.requiereFirma,
      });
      if (cambiosAsig) {
        if (cambiosAsig.asignarATodos || cambiosAsig.nuevosUsersSel.size > 0 || cambiosAsig.nuevosDptosSel.size > 0) {
          await asignarDocumento(docEditar.documentoId, {
            asignarATodos: cambiosAsig.asignarATodos,
            usuariosIds:   cambiosAsig.destino === "empleados"     ? Array.from(cambiosAsig.nuevosUsersSel) : [],
            departamentos: cambiosAsig.destino === "departamentos" ? Array.from(cambiosAsig.nuevosDptosSel) : [],
            notificar:     cambiosAsig.notificar,
          });
        }
        if (cambiosAsig.eliminarIds.length > 0) {
          await desasignarDocumento(docEditar.documentoId, cambiosAsig.eliminarIds);
        }
      }
      queryClient.invalidateQueries({ queryKey: QK.documentos(empresaId) });
      mostrarToast("Documento actualizado");
      setDocEditar(null);
      setEditForm(null);
    } catch (e: any) {
      setEditError(e?.message ?? "Error al guardar");
    } finally {
      setEditando(false);
    }
  };

  const ejecutarEliminar = async () => {
    if (!confirmEliminar) return;
    const doc = confirmEliminar;
    setConfirmEliminar(null);
    try {
      await desactivarDocumento(doc.documentoId);
      queryClient.invalidateQueries({ queryKey: QK.documentos(empresaId) });
      mostrarToast("Documento eliminado");
    } catch (e: any) {
      mostrarToast(e?.message ?? "Error al eliminar", "error");
    }
  };

  // Filtrado
  const docsFiltrados = documentos.filter((d) => {
    const q = busqueda.toLowerCase().trim();
    const matchQ = !q || d.titulo.toLowerCase().includes(q) || d.descripcion?.toLowerCase().includes(q);
    const matchT = filtroTipos.size === 0 || filtroTipos.has(d.tipo);
    return matchQ && matchT;
  });

  const hayFiltrosActivos = busqueda.trim() !== "" || filtroTipos.size > 0;
  const limpiarFiltros = () => { setBusqueda(""); setFiltroTipos(new Set()); };

  const toggleTipo = (t: TipoDocumento) => {
    setFiltroTipos(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const totalPendientesFirma = documentos.filter((d) => d.requiereFirma && (d.totalFirmados ?? 0) < (d.totalAsignados ?? 0)).length;

  return (
    <div>
      {/* ── Título ── */}
      <div className="mb-8 text-center sm:text-left">
        <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Documentos
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {cargando
            ? "Cargando documentos…"
            : documentos.length === 0
              ? "Sube nóminas, contratos o certificados a tus empleados"
              : <>{documentos.length} documento{documentos.length !== 1 ? "s" : ""}
                {totalPendientesFirma > 0 && (
                  <span style={{ color: "var(--advertencia)", fontWeight: 600 }}>
                    {" "}· {totalPendientesFirma} pendiente{totalPendientesFirma !== 1 ? "s" : ""} de firma
                  </span>
                )}
              </>
          }
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-2 mb-6">

        {/* Desktop: una sola fila — buscador · pills · limpiar · botón */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="relative" style={{ width: 260 }}>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Buscar documento…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-colors"
              style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = TAB_COLOR)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
            />
          </div>

          {/* Pills */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
            {TIPOS.map((t) => {
              const active = filtroTipos.has(t);
              return (
                <motion.button
                  key={t}
                  onClick={() => toggleTipo(t)}
                  className="relative text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer whitespace-nowrap"
                  style={{ color: active ? "#fff" : "var(--texto-muted)", transition: "color 0.15s ease", zIndex: 1, border: "none", background: "transparent" }}
                  whileTap={{ scale: 0.94 }}
                >
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        key="bg"
                        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg"
                        style={{ background: TAB_COLOR, zIndex: -1 }}
                      />
                    )}
                  </AnimatePresence>
                  {TIPO_DOCUMENTO_LABEL[t]}
                </motion.button>
              );
            })}
          </div>

          {/* Botón limpiar */}
          <AnimatePresence>
            {hayFiltrosActivos && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={limpiarFiltros}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full focus:outline-none cursor-pointer shrink-0"
                title="Limpiar filtros"
                style={{ background: `${TAB_COLOR}1a`, border: `1.5px solid ${TAB_COLOR}38`, color: TAB_COLOR, transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.18s ease, transform 0.18s ease" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${TAB_COLOR}30`; el.style.boxShadow = `0 0 0 3px ${TAB_COLOR}20`; el.style.borderColor = `${TAB_COLOR}60`; el.style.transform = "scale(1.10)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${TAB_COLOR}1a`; el.style.boxShadow = "none"; el.style.borderColor = `${TAB_COLOR}38`; el.style.transform = "scale(1)"; }}
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.88)"; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.10)"; }}
              >
                <X size={14} strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="flex-1" />
          <Button variant="primary" size="md" onClick={() => setShowSubir(true)}>
            <Plus size={14} /> Subir documento
          </Button>
        </div>

        {/* Móvil: dos filas — fila 1: buscador + botón · fila 2: dropdown + limpiar */}
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Buscar documento…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-colors"
                style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = TAB_COLOR)}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
              />
            </div>
            <Button variant="primary" size="md" onClick={() => setShowSubir(true)}>
              <Plus size={14} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <DocSelect
                value={filtroTipos.size === 1 ? Array.from(filtroTipos)[0] : ""}
                onChange={(v) => setFiltroTipos(v ? new Set([v as TipoDocumento]) : new Set())}
                options={TIPOS.map(t => ({ id: t, label: TIPO_DOCUMENTO_LABEL[t] }))}
                placeholder="Todos los tipos"
                accentColor={TAB_COLOR}
              />
            </div>
            <AnimatePresence>
              {hayFiltrosActivos && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  onClick={limpiarFiltros}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full focus:outline-none cursor-pointer shrink-0"
                  title="Limpiar filtros"
                  style={{ background: `${TAB_COLOR}1a`, border: `1.5px solid ${TAB_COLOR}38`, color: TAB_COLOR }}
                >
                  <X size={14} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ── Contenido ── */}
      {cargando ? (
        /* Skeleton — 4 cards con shimmer */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-2xl overflow-hidden"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              {/* cabecera */}
              <div className="animate-pulse" style={{ height: 88, background: "var(--gris-superficie)" }} />
              {/* cuerpo */}
              <div className="flex flex-col gap-3 px-3 pt-3 pb-4">
                <div className="animate-pulse h-3 w-20 rounded-full" style={{ background: "var(--gris-borde)" }} />
                <div className="animate-pulse h-4 w-3/4 rounded-full" style={{ background: "var(--gris-borde)" }} />
                <div className="animate-pulse h-3 w-full rounded-full" style={{ background: "var(--gris-superficie)" }} />
                <div className="animate-pulse h-3 w-2/3 rounded-full" style={{ background: "var(--gris-superficie)" }} />
                <div className="animate-pulse h-3 w-24 rounded-full mt-1" style={{ background: "var(--gris-borde)" }} />
                {/* botones placeholder */}
                <div className="flex gap-1.5 mt-1">
                  <div className="animate-pulse flex-1 h-8 rounded-xl" style={{ background: "var(--gris-superficie)" }} />
                  <div className="animate-pulse flex-1 h-8 rounded-xl" style={{ background: "var(--gris-superficie)" }} />
                  <div className="animate-pulse w-8 h-8 rounded-full shrink-0" style={{ background: "var(--gris-superficie)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : documentos.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-14 sm:py-24 px-6 rounded-2xl text-center"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: `${TAB_COLOR}12` }}>
            <FileText size={30} style={{ color: TAB_COLOR }} strokeWidth={1.5} />
          </div>
          <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>Todavía no hay documentos</p>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>
            Sube nóminas, contratos o certificados y asígnalos a tus empleados
          </p>
          <Button variant="primary" size="md" onClick={() => setShowSubir(true)}>
            <Plus size={14} /> Subir primer documento
          </Button>
        </div>
      ) : docsFiltrados.length === 0 ? (
        /* Sin resultados */
        <div className="flex flex-col items-center justify-center py-14 sm:py-16 px-6 rounded-2xl text-center"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: `${TAB_COLOR}12` }}>
            <Search size={28} style={{ color: TAB_COLOR, opacity: 0.7 }} strokeWidth={1.5} />
          </div>
          <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>Sin resultados</p>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>
            {busqueda.trim()
              ? <>No hay documentos que coincidan con <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>"{busqueda.trim()}"</span></>
              : "No hay documentos del tipo seleccionado"}
          </p>
          <motion.button
            onClick={limpiarFiltros}
            whileTap={{ scale: 0.95 }}
            className="text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
            style={{ background: `${TAB_COLOR}15`, color: TAB_COLOR, border: `1.5px solid ${TAB_COLOR}30` }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${TAB_COLOR}25`; el.style.borderColor = `${TAB_COLOR}50`; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${TAB_COLOR}15`; el.style.borderColor = `${TAB_COLOR}30`; }}
          >
            Limpiar filtros
          </motion.button>
        </div>
      ) : (
        /* Grid de document cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {docsFiltrados.map((d, idx) => {
            const color     = TIPO_DOCUMENTO_COLOR[d.tipo];
            const asignados = d.totalAsignados ?? 0;
            const firmados  = d.totalFirmados  ?? 0;
            return (
              <motion.div key={d.documentoId}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut", delay: idx * 0.05 }}
                className="flex flex-col rounded-2xl overflow-hidden"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s ease, transform 0.2s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {/* Cabecera coloreada */}
                <div className="relative flex items-center justify-center overflow-hidden" style={{
                  height: 88,
                  background: `linear-gradient(135deg, ${color.bg} 0%, ${color.text}22 100%)`,
                }}>
                  {/* Círculo decorativo grande — esquina inferior derecha */}
                  <div className="absolute" style={{
                    width: 110, height: 110,
                    borderRadius: "50%",
                    background: `${color.text}14`,
                    bottom: -38, right: -28,
                  }} />
                  {/* Círculo decorativo pequeño — esquina superior izquierda */}
                  <div className="absolute" style={{
                    width: 56, height: 56,
                    borderRadius: "50%",
                    background: `${color.text}0e`,
                    top: -20, left: -14,
                  }} />
                  {/* Icono en contenedor blanco semitransparente */}
                  <div className="relative flex items-center justify-center rounded-2xl"
                    style={{
                      width: 44, height: 44,
                      background: "rgba(255,255,255,0.72)",
                      boxShadow: `0 2px 12px ${color.text}20`,
                      backdropFilter: "blur(4px)",
                    }}>
                    <FileText size={22} strokeWidth={1.5} style={{ color: color.text }} />
                  </div>
                  {/* Badge tipo */}
                  <span className="absolute top-2.5 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.88)", color: color.text }}>
                    {TIPO_DOCUMENTO_LABEL[d.tipo]}
                  </span>
                  {/* Badge firma */}
                  {d.requiereFirma && (
                    <span className="absolute top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.88)", color: "#92400e" }}>
                      ✍ Firma
                    </span>
                  )}
                </div>

                {/* Cuerpo */}
                <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-2">
                  {/* Fecha */}
                  <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                    {new Date(d.fechaSubida).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {/* Título */}
                  <h3 className="font-bold text-sm leading-snug line-clamp-2" style={{ color: "var(--texto-primario)", minHeight: "2.6em" }}>
                    {d.titulo}
                  </h3>
                  {/* Descripción */}
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#6B7A8D", minHeight: "2.6em" }}>
                    {d.descripcion ? d.descripcion.trim().slice(0, 110) + (d.descripcion.length > 110 ? "…" : "") : "Sin descripción"}
                  </p>

                  {/* Stats asignados / firmados */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                      {asignados} {asignados === 1 ? "asignado" : "asignados"}
                    </span>
                    {d.requiereFirma && asignados > 0 && (
                      <>
                        <span style={{ color: "#D1D5DB", fontSize: 10 }}>·</span>
                        <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
                          {firmados} firmado{firmados !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="primary" size="sm" className="flex-1 justify-center" style={{ background: "var(--azul-egm)", color: "#fff", border: "none" }} onClick={() => abrirEditar(d)}>
                      Editar
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1 justify-center" onClick={() => abrirAsignaciones(d)}>
                      Asignados
                    </Button>
                    <motion.button
                      title="Eliminar documento"
                      onClick={() => setConfirmEliminar(d)}
                      whileTap={{ scale: 0.88 }}
                      className="flex items-center justify-center w-8 h-8 shrink-0 cursor-pointer"
                      style={{ borderRadius: "50%", background: "var(--error-light)", color: "var(--error)", border: "1px solid rgba(220,38,38,0.15)", transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.18s var(--ease-spring)" }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--error)"; el.style.color = "#fff"; el.style.borderColor = "var(--error)"; el.style.boxShadow = "0 4px 14px rgba(220,38,38,0.35), 0 0 0 3px rgba(220,38,38,0.15)"; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--error-light)"; el.style.color = "var(--error)"; el.style.borderColor = "rgba(220,38,38,0.15)"; el.style.boxShadow = "none"; }}>
                      <Trash2 size={13} strokeWidth={2} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Subir documento ── */}
      <AnimatePresence>
        {showSubir && (
          <ModalSubirDocumento
            empleados={empleados}
            departamentos={departamentos}
            tabColor={TAB_COLOR}
            onCancel={() => setShowSubir(false)}
            onUploaded={() => {
              queryClient.invalidateQueries({ queryKey: QK.documentos(empresaId) });
              setShowSubir(false);
              mostrarToast("Documento subido y asignado correctamente");
            }}
            onError={(msg) => mostrarToast(msg, "error")}
          />
        )}
      </AnimatePresence>

      {/* ── Modal: Asignaciones ── */}
      <AnimatePresence>
        {verAsignacionesDe && (
          <ModalAsignaciones
            documento={verAsignacionesDe}
            asignaciones={asignaciones}
            cargando={cargandoAsig}
            onClose={() => { setVerAsignaciones(null); setAsignaciones([]); }}
          />
        )}
      </AnimatePresence>

      {/* ── Modal: Editar documento ── */}
      <AnimatePresence>
        {docEditar && editForm && (
          <ModalEditarDocumento
            documento={docEditar}
            form={editForm}
            empleados={empleados}
            departamentos={departamentos}
            asignacionesActuales={asignacionesEditar}
            cargandoAsignaciones={cargandoAsigEditar}
            tabColor={TAB_COLOR}
            guardando={editando}
            error={editError}
            onFormChange={setEditForm}
            onGuardar={guardarEdicion}
            onClose={() => { setDocEditar(null); setEditForm(null); setEditError(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Modal: Confirmar eliminar ── */}
      <ModalConfirm
        abierto={!!confirmEliminar}
        titulo="¿Eliminar documento?"
        descripcion={confirmEliminar ? `"${confirmEliminar.titulo}" dejará de ser visible para los empleados. Esta acción no se puede deshacer.` : ""}
        textoConfirmar="Eliminar documento"
        variante="danger"
        onConfirmar={ejecutarEliminar}
        onCancelar={() => setConfirmEliminar(null)}
      />

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 z-[1300] flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
            style={{
              transform: "translateX(-50%)",
              background: toast.tipo === "ok"
                ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
                : "linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)",
              color: "#fff",
            }}
          >
            {toast.tipo === "ok" ? <Check size={16} /> : <AlertTriangle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Toggle estilizado ───────────────────────────────────────────────────────
function Toggle({ checked, onChange, color }: { checked: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="shrink-0"
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: checked ? color : "var(--gris-borde)",
        border: "none", cursor: "pointer", padding: 3,
        transition: "background 0.2s ease",
        position: "relative", display: "flex", alignItems: "center",
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
        transform: checked ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.2s ease",
        display: "block",
      }} />
    </button>
  );
}

// ─── Modal: Subir documento ──────────────────────────────────────────────────

function ModalSubirDocumento({
  empleados, departamentos, tabColor, onCancel, onUploaded, onError,
}: {
  empleados: Props["empleados"];
  departamentos: Props["departamentos"];
  tabColor: string;
  onCancel: () => void;
  onUploaded: () => void;
  onError: (msg: string) => void;
}) {
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const [paso, setPaso]                   = useState<1 | 2>(1);
  const [file, setFile]                   = useState<File | null>(null);
  const [dragging, setDragging]           = useState(false);
  const [titulo, setTitulo]               = useState("");
  const [descripcion, setDescripcion]     = useState("");
  const [tipo, setTipo]                   = useState<TipoDocumento>("NOMINA");
  const [requiereFirma, setRequiereFirma] = useState(false);
  const [notificar, setNotificar]         = useState(true);
  const [destino, setDestino]             = useState<"todos" | "departamentos" | "empleados">("empleados");
  const [dptosSel, setDptosSel]           = useState<Set<string>>(new Set());
  const [usersSel, setUsersSel]           = useState<Set<string>>(new Set());
  const [enviando, setEnviando]           = useState(false);
  const [busqueda, setBusqueda]           = useState("");

  const puedeSiguiente = !!file && titulo.trim().length > 0;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.classList.add("drill-modal-open");
    return () => { document.body.style.overflow = ""; document.body.classList.remove("drill-modal-open"); };
  }, []);

  const toggleSet = (s: Set<string>, v: string) => {
    const ns = new Set(s); if (ns.has(v)) ns.delete(v); else ns.add(v); return ns;
  };

  const handleFile = (f: File | null | undefined) => { if (f) setFile(f); };

  const puedeEnviar = !!file && titulo.trim().length > 0 && (
    destino === "todos" ||
    (destino === "departamentos" && dptosSel.size > 0) ||
    (destino === "empleados" && usersSel.size > 0)
  );

  const submit = async () => {
    if (!puedeEnviar || !file) return;
    setEnviando(true);
    try {
      await subirDocumento({
        file, titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        tipo, requiereFirma, notificar,
        asignarATodos: destino === "todos",
        departamentos: destino === "departamentos" ? Array.from(dptosSel) : [],
        usuariosIds:   destino === "empleados"     ? Array.from(usersSel) : [],
      });
      onUploaded();
    } catch (e: any) {
      onError(e?.message ?? "No se pudo subir el documento");
    } finally {
      setEnviando(false);
    }
  };

  const inputCls = "w-full text-sm rounded-lg outline-none border transition-all duration-150";
  const inputSty = { height: 44, paddingLeft: 14, paddingRight: 14, borderColor: "rgba(0,0,0,0.12)", background: "#ffffff", color: "var(--texto-primario)" };
  const labelCls = "block text-sm font-semibold mb-1.5";
  const labelSty = { color: "var(--texto-label)" };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex: 160, background: "rgba(0,0,0,0.50)" }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "#ffffff", maxHeight: "92dvh", boxShadow: "0 28px 64px rgba(0,0,0,0.22)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-5 sm:px-6 shrink-0 overflow-hidden"
          style={{ paddingTop: 20, paddingBottom: 20, background: tabColor }}>
          <div className="absolute inset-0">
            <Grainient color1={tabColor} color2="#5F8A9E" color3="#3D5A6A"
              timeSpeed={0.18} warpStrength={1.1} warpFrequency={4.0}
              warpSpeed={1.4} warpAmplitude={55} grainAmount={0.07} />
          </div>
          <div className="relative z-10 flex flex-col gap-0.5">
            <h2 className="text-2xl font-bold" style={{ color: "#ffffff" }}>Subir documento</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              {paso === 1 ? "Paso 1 de 2 · Información del documento" : "Paso 2 de 2 · Asignación"}
            </p>
          </div>
          <div className="relative z-10">
            <IconButton variant="glass" label="Cerrar" onClick={onCancel} />
          </div>
        </div>

        {/* ── Barra de progreso ── */}
        <div className="shrink-0 flex" style={{ height: 3, background: "var(--gris-borde)" }}>
          <motion.div
            animate={{ width: paso === 1 ? "50%" : "100%" }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{ height: "100%", background: tabColor }}
          />
        </div>

        {/* ── Cuerpo scrollable con transición entre pasos ── */}
        <div className="overflow-y-auto flex-1 bg-white" style={{ minHeight: 0 }}>
          <AnimatePresence mode="wait" initial={false}>
            {paso === 1 ? (
              <motion.div
                key="paso1"
                initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="px-4 sm:px-6"
                style={{ paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 20 }}
              >
                {/* Zona de archivo */}
                <div>
                  <label className={labelCls} style={labelSty}>Archivo <span style={{ color: "var(--error)" }}>*</span></label>
                  <div
                    onClick={() => !file && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                    onMouseEnter={(e) => { if (!file) { e.currentTarget.style.borderColor = tabColor; e.currentTarget.style.background = `${tabColor}0D`; }}}
                    onMouseLeave={(e) => { if (!file && !dragging) { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--blanco)"; }}}
                    className="rounded-xl transition-all"
                    style={{
                      border: `2px dashed ${dragging ? tabColor : file ? tabColor : "var(--gris-borde)"}`,
                      background: dragging ? `${tabColor}0D` : file ? `${tabColor}08` : "var(--blanco)",
                      cursor: file ? "default" : "pointer",
                      padding: file ? "12px 16px" : "28px 16px",
                    }}
                  >
                    <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])} />
                    {file ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${tabColor}18` }}>
                          <FileText size={17} style={{ color: tabColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>{file.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <IconButton variant="surface" size="sm" label="Quitar archivo"
                          style={{ borderRadius: "50%" }}
                          onClick={(e) => { e.stopPropagation(); setFile(null); }} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                          style={{ background: "var(--gris-superficie)" }}>
                          <Upload size={20} style={{ color: "var(--texto-muted)" }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>
                            Arrastra o <span style={{ color: tabColor }}>selecciona un archivo</span>
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>PDF o imagen · Máximo 25 MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className={labelCls} style={labelSty}>Título <span style={{ color: "var(--error)" }}>*</span></label>
                  <input
                    type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Nómina octubre 2026"
                    className={inputCls} style={inputSty}
                    onFocus={(e) => { e.currentTarget.style.borderColor = tabColor; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(78,109,126,0.10)"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className={labelCls} style={labelSty}>Descripción <span className="font-normal text-sm" style={{ color: "var(--texto-muted)" }}>(opcional)</span></label>
                  <textarea
                    value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                    rows={3} placeholder="Instrucciones o comentario para el empleado"
                    className={`${inputCls} resize-none`} style={{ ...inputSty, height: "auto", paddingTop: 10, paddingBottom: 10 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = tabColor; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(78,109,126,0.10)"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className={labelCls} style={labelSty}>Tipo de documento</label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS.map((t) => {
                      const active = tipo === t;
                      const col = TIPO_DOCUMENTO_COLOR[t];
                      return (
                        <button key={t} type="button" onClick={() => setTipo(t)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: active ? col.bg : "var(--blanco)",
                            color: active ? col.text : "var(--texto-secundario)",
                            border: `1.5px solid ${active ? col.text + "40" : "var(--gris-borde)"}`,
                            fontWeight: active ? 700 : 500,
                            cursor: "pointer",
                            transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
                          }}
                          onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"; } e.currentTarget.style.transform = "scale(1.04)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = active ? col.bg : "var(--blanco)"; e.currentTarget.style.borderColor = active ? col.text + "40" : "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                          onMouseDown={(e)  => { e.currentTarget.style.transform = "scale(0.96)"; }}
                          onMouseUp={(e)    => { e.currentTarget.style.transform = "scale(1.04)"; }}>
                          {TIPO_DOCUMENTO_LABEL[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Opciones — toggles */}
                {(() => {
                  const AZUL = "var(--azul-egm)";
                  const AZUL_HEX = "#1b3f7e";
                  const opts = [
                    {
                      label: "Requiere firma del empleado",
                      sub: "El empleado deberá firmar el documento digitalmente",
                      val: requiereFirma, set: setRequiereFirma,
                      color: AZUL, colorHex: AZUL_HEX, bgLight: "#dbeafe", bgRow: "#eff6ff",
                      icon: (
                        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      ),
                    },
                    {
                      label: "Avisar al empleado",
                      sub: "Recibirá una notificación en el panel al asignarlo",
                      val: notificar, set: setNotificar,
                      color: "#059669", colorHex: "#059669", bgLight: "#d1fae5", bgRow: "#f0fdf4",
                      icon: (
                        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                      ),
                    },
                  ];
                  return (
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                      {opts.map((opt, i) => (
                        <div key={opt.label}
                          className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
                          style={{
                            borderBottom: i < opts.length - 1 ? `1px solid ${opt.val ? opt.bgLight : "var(--gris-borde)"}` : "none",
                            background: opt.val ? opt.bgRow : "var(--blanco)",
                            transition: "background 0.2s ease",
                          }}
                          onClick={() => opt.set(!opt.val)}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: opt.val ? opt.bgLight : "var(--gris-superficie)", color: opt.val ? opt.colorHex : "var(--texto-muted)", transition: "background 0.2s ease, color 0.2s ease" }}>
                            {opt.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: opt.val ? opt.colorHex : "var(--texto-primario)", transition: "color 0.2s ease" }}>{opt.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>{opt.sub}</p>
                          </div>
                          <Toggle checked={opt.val} onChange={opt.set} color={opt.colorHex} />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                key="paso2"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="px-4 sm:px-6"
                style={{ paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 20 }}
              >
                {/* Resumen del doc — recordatorio para el usuario */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: `${tabColor}0D`, border: `1px solid ${tabColor}25` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${tabColor}18` }}>
                    <FileText size={16} style={{ color: tabColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>{titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                      {TIPO_DOCUMENTO_LABEL[tipo]} · {file ? `${(file.size / 1024).toFixed(0)} KB` : ""}
                    </p>
                  </div>
                </div>

                {/* Asignar a */}
                <div>
                  <label className={labelCls} style={labelSty}>Asignar a <span style={{ color: "var(--error)" }}>*</span></label>
                  <div className="flex gap-2 mb-3">
                    {([
                      { id: "empleados",     label: "Empleados",       icon: Users     },
                      { id: "departamentos", label: "Departamentos",   icon: Building2 },
                      { id: "todos",         label: "Toda la empresa", icon: Globe     },
                    ] as const).map((opt) => {
                      const Icon   = opt.icon;
                      const active = destino === opt.id;
                      return (
                        <button key={opt.id} type="button" onClick={() => { setDestino(opt.id); setBusqueda(""); }}
                          className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap"
                          style={{
                            background: active ? tabColor : "var(--blanco)",
                            color:      active ? "white"  : "var(--texto-secundario)",
                            border:     `1.5px solid ${active ? tabColor : "var(--gris-borde)"}`,
                            cursor: "pointer",
                          }}>
                          <Icon size={12} className="shrink-0 hidden sm:block" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {destino === "empleados" && (() => {
                    const filtrados = empleados.filter((e) =>
                      `${e.nombre} ${e.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
                    );
                    const todosSeleccionados = empleados.length > 0 && empleados.every((e) => usersSel.has(e.usuarioId));
                    const algunoSeleccionado = empleados.some((e) => usersSel.has(e.usuarioId));

                    return (
                      <div className="flex flex-col gap-2">
                        {/* Buscador + pill "Todos/Ninguno" */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }} />
                            <input
                              type="text"
                              value={busqueda}
                              onChange={(e) => setBusqueda(e.target.value)}
                              placeholder="Buscar empleado…"
                              className="w-full text-sm rounded-lg outline-none border transition-all"
                              style={{
                                height: 36, paddingLeft: 30, paddingRight: busqueda ? 28 : 10,
                                borderColor: "rgba(0,0,0,0.12)", background: "#fff",
                                color: "var(--texto-primario)",
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = tabColor; e.currentTarget.style.boxShadow = `0 0 0 3px ${tabColor}1A`; }}
                              onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            {busqueda && (
                              <button type="button" onClick={() => setBusqueda("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--texto-muted)", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          {empleados.length > 0 && (
                            <button type="button"
                              onClick={() => setUsersSel(todosSeleccionados ? new Set() : new Set(empleados.map((e) => e.usuarioId)))}
                              className="inline-flex items-center shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                              style={{
                                background: algunoSeleccionado ? `${tabColor}12` : "var(--gris-pagina)",
                                color:      algunoSeleccionado ? tabColor         : "var(--texto-muted)",
                                border:     `1.5px solid ${algunoSeleccionado ? `${tabColor}30` : "var(--gris-borde)"}`,
                                cursor: "pointer",
                              }}>
                              {todosSeleccionados ? "Desmarcar" : "Marcar todos"}
                            </button>
                          )}
                        </div>

                        {/* Contador */}
                        {usersSel.size > 0 && (
                          <p className="text-xs font-semibold" style={{ color: tabColor }}>
                            {usersSel.size} de {empleados.length} seleccionado{usersSel.size !== 1 ? "s" : ""}
                          </p>
                        )}

                        {/* Lista */}
                        <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid var(--gris-borde)" }}>
                          {empleados.length === 0 ? (
                            <p className="text-xs text-center py-6" style={{ color: "var(--texto-muted)" }}>No hay empleados</p>
                          ) : filtrados.length === 0 ? (
                            <p className="text-xs text-center py-6" style={{ color: "var(--texto-muted)" }}>Sin resultados para "{busqueda}"</p>
                          ) : (
                            <div className="max-h-48 overflow-y-auto">
                              {filtrados.map((e, i) => {
                                const sel      = usersSel.has(e.usuarioId);
                                const iniciales = `${e.nombre?.[0] ?? ""}${e.apellidos?.[0] ?? ""}`.toUpperCase();
                                const palette   = avatarColor(`${e.nombre}${e.apellidos}`);
                                const dptoPal   = e.departamento ? dptoColorFull(e.departamento) : null;
                                return (
                                  <label key={e.usuarioId}
                                    className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer"
                                    style={{
                                      background:   sel ? `${tabColor}0D` : "var(--blanco)",
                                      borderBottom: i < filtrados.length - 1 ? "1px solid var(--gris-superficie)" : "none",
                                      transition:   "background 0.12s ease",
                                    }}
                                    onMouseEnter={(ev) => { if (!sel) ev.currentTarget.style.background = "var(--gris-pagina)"; }}
                                    onMouseLeave={(ev) => { ev.currentTarget.style.background = sel ? `${tabColor}0D` : "var(--blanco)"; }}>
                                    {/* Checkbox */}
                                    <span className="shrink-0 w-4 h-4 rounded flex items-center justify-center"
                                      style={{
                                        background: sel ? tabColor : "var(--blanco)",
                                        border: `1.5px solid ${sel ? tabColor : "var(--gris-borde)"}`,
                                        transition: "background 0.12s ease, border-color 0.12s ease",
                                      }}>
                                      {sel && <Check size={10} color="white" strokeWidth={3} />}
                                    </span>
                                    <input type="checkbox" checked={sel} onChange={() => setUsersSel((s) => toggleSet(s, e.usuarioId))} className="hidden" />
                                    {/* Avatar con color único */}
                                    <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                      style={{ background: palette.bg, color: palette.color }}>
                                      {iniciales}
                                    </span>
                                    <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--texto-primario)" }}>
                                      {e.nombre} {e.apellidos}
                                    </span>
                                    {e.departamento && dptoPal && (
                                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                                        style={{ background: dptoPal.bg, color: dptoPal.color }}>
                                        {e.departamento}
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {destino === "departamentos" && (() => {
                    const todosDepSel = departamentos.length > 0 && departamentos.every((d) => dptosSel.has(d.id));
                    return (
                      <div className="flex flex-col gap-2">
                        {/* Contador + seleccionar todos */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold" style={{ color: dptosSel.size > 0 ? tabColor : "var(--texto-muted)" }}>
                            {dptosSel.size > 0
                              ? `${dptosSel.size} de ${departamentos.length} seleccionado${dptosSel.size !== 1 ? "s" : ""}`
                              : `${departamentos.length} departamentos`}
                          </p>
                          {departamentos.length > 0 && (
                            <button type="button"
                              onClick={() => setDptosSel(todosDepSel ? new Set() : new Set(departamentos.map((d) => d.id)))}
                              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                              style={{
                                background: dptosSel.size > 0 ? `${tabColor}12` : "var(--gris-pagina)",
                                color:      dptosSel.size > 0 ? tabColor          : "var(--texto-muted)",
                                border:     `1.5px solid ${dptosSel.size > 0 ? `${tabColor}30` : "var(--gris-borde)"}`,
                                cursor: "pointer",
                              }}>
                              {todosDepSel ? "Desmarcar" : "Marcar todos"}
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {departamentos.map((d) => {
                            const sel = dptosSel.has(d.id);
                            const pal = dptoColorFull(d.label);
                            return (
                              <button key={d.id} type="button" onClick={() => setDptosSel((s) => toggleSet(s, d.id))}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{
                                  background: sel ? pal.bg    : "var(--blanco)",
                                  color:      sel ? pal.color : "var(--texto-secundario)",
                                  border:     `1.5px solid ${sel ? pal.border : "var(--gris-borde)"}`,
                                  cursor: "pointer",
                                  boxShadow: sel ? `0 0 0 3px ${pal.bg}` : "none",
                                }}>
                                {sel && <Check size={11} strokeWidth={3} />}
                                {d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {destino === "todos" && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "var(--advertencia-light)", border: "1px solid rgba(217,119,6,0.2)" }}>
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: "var(--advertencia)" }} />
                      <p className="text-xs leading-relaxed" style={{ color: "var(--advertencia)" }}>
                        El documento se asignará a <strong>todos los empleados activos</strong> de la empresa.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 flex items-center justify-between gap-3 shrink-0"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)", background: "#ffffff" }}>
          {/* Izquierda: Cancelar (paso 1) o Volver (paso 2) */}
          {paso === 1 ? (
            <Button variant="secondary" size="md" onClick={onCancel}>
              Cancelar
            </Button>
          ) : (
            <Button variant="secondary" size="md" onClick={() => setPaso(1)}>
              ← Volver
            </Button>
          )}

          {/* Derecha: Siguiente (paso 1) o Subir (paso 2) */}
          {paso === 1 ? (
            <Button
              variant="primary" size="md"
              disabled={!puedeSiguiente}
              onClick={() => setPaso(2)}
              style={{ minWidth: 130 }}
            >
              Siguiente →
            </Button>
          ) : (
            <Button
              variant="primary" size="md"
              disabled={!puedeEnviar || enviando}
              onClick={submit}
              style={{ minWidth: 148 }}
            >
              {enviando
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Subiendo…</>
                : <><Upload size={14} /> Subir documento</>}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modal: Editar documento (2 pasos) ──────────────────────────────────────

function ModalEditarDocumento({
  documento, form, empleados, departamentos, asignacionesActuales, cargandoAsignaciones, tabColor,
  guardando, error,
  onFormChange, onGuardar, onClose,
}: {
  documento: Documento;
  form: { titulo: string; descripcion: string; tipo: TipoDocumento; requiereFirma: boolean };
  empleados: Props["empleados"];
  departamentos: Props["departamentos"];
  asignacionesActuales: AsignacionDetalle[];
  cargandoAsignaciones: boolean;
  tabColor: string;
  guardando: boolean;
  error: string | null;
  onFormChange: (f: typeof form) => void;
  onGuardar: (cambios?: { nuevosUsersSel: Set<string>; nuevosDptosSel: Set<string>; destino: "todos" | "departamentos" | "empleados"; asignarATodos: boolean; eliminarIds: string[]; notificar: boolean }) => void;
  onClose: () => void;
}) {
  // ── Mapa de asignaciones actuales: usuarioId → asignacionId ──
  const asigMap = useMemo(
    () => new Map(asignacionesActuales.map((a) => [a.usuarioId, a.asignacionId])),
    [asignacionesActuales]
  );
  const yaAsignadosIds = useMemo(() => new Set(asigMap.keys()), [asigMap]);

  // ── Detectar destino inicial ──
  const esGlobal = asignacionesActuales.length > 0 && empleados.length > 0 && asignacionesActuales.length >= empleados.length;

  // Detectar departamentos pre-asignados: si TODOS los empleados de un dpto están asignados
  const dptosPreAsignados = useMemo(() => {
    const preIds = new Set<string>();
    for (const d of departamentos) {
      const miembros = empleados.filter((e) => normDpto(e.departamento ?? "") === normDpto(d.label));
      if (miembros.length > 0 && miembros.every((e) => yaAsignadosIds.has(e.usuarioId))) {
        preIds.add(d.id);
      }
    }
    return preIds;
  }, [departamentos, empleados, yaAsignadosIds]);

  const destinoInicial = useMemo<"todos" | "departamentos" | "empleados">(() => {
    if (esGlobal) return "todos";
    if (dptosPreAsignados.size > 0 && dptosPreAsignados.size === new Set([...yaAsignadosIds].map(id => empleados.find(e => e.usuarioId === id)?.departamento).filter(Boolean)).size) return "departamentos";
    return "empleados";
  }, [esGlobal, dptosPreAsignados]);

  const [paso, setPaso]           = useState<1 | 2>(1);
  const [destino, setDestino]     = useState<"todos" | "departamentos" | "empleados">(destinoInicial);
  const [usersSel, setUsersSel]   = useState<Set<string>>(() => new Set(yaAsignadosIds));
  const [dptosSel, setDptosSel]   = useState<Set<string>>(() => new Set(dptosPreAsignados));
  const [notificar, setNotificar] = useState(true);
  const [busqueda, setBusqueda]   = useState("");

  // Sincronizar si cargan después (async)
  useEffect(() => {
    if (asignacionesActuales.length > 0) {
      setUsersSel(new Set(yaAsignadosIds));
      setDptosSel(new Set(dptosPreAsignados));
      setDestino(destinoInicial);
    }
  }, [asignacionesActuales]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.classList.add("drill-modal-open");
    return () => { document.body.style.overflow = ""; document.body.classList.remove("drill-modal-open"); };
  }, []);

  const toggleSet = (s: Set<string>, v: string) => {
    const ns = new Set(s); if (ns.has(v)) ns.delete(v); else ns.add(v); return ns;
  };

  // ── Diff: nuevos vs. eliminados ──
  const nuevosUsersSel = useMemo(() => new Set([...usersSel].filter((id) => !yaAsignadosIds.has(id))), [usersSel, yaAsignadosIds]);
  const eliminadosIds  = useMemo(() => [...yaAsignadosIds].filter((id) => !usersSel.has(id)).map((id) => asigMap.get(id)!).filter(Boolean), [usersSel, yaAsignadosIds, asigMap]);
  const nuevosDptosSel = useMemo(() => new Set([...dptosSel].filter((id) => !dptosPreAsignados.has(id))), [dptosSel, dptosPreAsignados]);

  const hayCambiosAsig =
    eliminadosIds.length > 0 ||
    nuevosUsersSel.size > 0 ||
    nuevosDptosSel.size > 0 ||
    (destino === "todos" && destinoInicial !== "todos");

  const inputCls = "w-full text-sm rounded-lg outline-none border transition-all duration-150";
  const inputSty = { height: 44, paddingLeft: 14, paddingRight: 14, borderColor: "rgba(0,0,0,0.12)", background: "#ffffff", color: "var(--texto-primario)" };
  const labelCls = "block text-sm font-semibold mb-1.5";
  const labelSty = { color: "var(--texto-label)" };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex: 1200, background: "rgba(0,0,0,0.50)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "#ffffff", maxHeight: "92dvh", boxShadow: "0 28px 64px rgba(0,0,0,0.22)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-5 sm:px-6 shrink-0 overflow-hidden"
          style={{ paddingTop: 20, paddingBottom: 20, background: tabColor }}>
          <div className="absolute inset-0">
            <Grainient color1={tabColor} color2="#5F8A9E" color3="#3D5A6A"
              timeSpeed={0.18} warpStrength={1.1} warpFrequency={4.0}
              warpSpeed={1.4} warpAmplitude={55} grainAmount={0.07} />
          </div>
          <div className="relative z-10 flex flex-col gap-0.5">
            <h2 className="text-2xl font-bold" style={{ color: "#ffffff" }}>Editar documento</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              {paso === 1 ? "Paso 1 de 2 · Información del documento" : "Paso 2 de 2 · Asignaciones"}
            </p>
          </div>
          <div className="relative z-10">
            <IconButton variant="glass" label="Cerrar" onClick={onClose} />
          </div>
        </div>

        {/* ── Barra de progreso ── */}
        <div className="shrink-0 flex" style={{ height: 3, background: "var(--gris-borde)" }}>
          <motion.div animate={{ width: paso === 1 ? "50%" : "100%" }} transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{ height: "100%", background: tabColor }} />
        </div>

        {/* ── Cuerpo ── */}
        <div className="overflow-y-auto flex-1 bg-white" style={{ minHeight: 0 }}>
          <AnimatePresence mode="wait" initial={false}>
            {paso === 1 ? (
              <motion.div key="paso1"
                initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="px-4 sm:px-6"
                style={{ paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 20 }}>

                <div>
                  <label className={labelCls} style={labelSty}>Título <span style={{ color: "var(--error)" }}>*</span></label>
                  <input type="text" value={form.titulo} onChange={(e) => onFormChange({ ...form, titulo: e.target.value })}
                    placeholder="Nombre del documento" className={inputCls} style={inputSty}
                    onFocus={(e) => { e.currentTarget.style.borderColor = tabColor; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(78,109,126,0.12)"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                <div>
                  <label className={labelCls} style={labelSty}>
                    Descripción <span className="font-normal text-sm" style={{ color: "var(--texto-muted)" }}>(opcional)</span>
                  </label>
                  <textarea value={form.descripcion} onChange={(e) => onFormChange({ ...form, descripcion: e.target.value })}
                    placeholder="Instrucciones o comentario para el empleado" rows={3}
                    className={`${inputCls} resize-none`} style={{ ...inputSty, height: "auto", paddingTop: 10, paddingBottom: 10 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = tabColor; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(78,109,126,0.12)"; }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                <div>
                  <label className={labelCls} style={labelSty}>Tipo de documento</label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS.map((t) => {
                      const c = TIPO_DOCUMENTO_COLOR[t]; const active = form.tipo === t;
                      return (
                        <button key={t} type="button" onClick={() => onFormChange({ ...form, tipo: t })}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold"
                          style={{ background: active ? c.bg : "var(--blanco)", color: active ? c.text : "var(--texto-secundario)", border: `1.5px solid ${active ? c.text + "40" : "var(--gris-borde)"}`, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease" }}
                          onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--gris-superficie)"; } e.currentTarget.style.transform = "scale(1.04)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = active ? c.bg : "var(--blanco)"; e.currentTarget.style.transform = "scale(1)"; }}
                          onMouseDown={(e)  => { e.currentTarget.style.transform = "scale(0.96)"; }}
                          onMouseUp={(e)    => { e.currentTarget.style.transform = "scale(1.04)"; }}>
                          {TIPO_DOCUMENTO_LABEL[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const opts = [
                    { label: "Requiere firma del empleado", sub: "El empleado deberá firmar el documento digitalmente", val: form.requiereFirma, set: (v: boolean) => onFormChange({ ...form, requiereFirma: v }), colorHex: "#1d4ed8", bgLight: "#dbeafe", bgRow: "#eff6ff", icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg> },
                    { label: "Avisar al empleado", sub: "Recibirá notificación si se añaden nuevas asignaciones", val: notificar, set: setNotificar, colorHex: "#059669", bgLight: "#d1fae5", bgRow: "#f0fdf4", icon: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg> },
                  ];
                  return (
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                      {opts.map((opt, i) => (
                        <div key={opt.label} className="flex items-center gap-4 px-5 py-3.5 cursor-pointer"
                          style={{ borderBottom: i < opts.length - 1 ? `1px solid ${opt.val ? opt.bgLight : "var(--gris-borde)"}` : "none", background: opt.val ? opt.bgRow : "var(--blanco)", transition: "background 0.2s ease" }}
                          onClick={() => opt.set(!opt.val)}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: opt.val ? opt.bgLight : "var(--gris-superficie)", color: opt.val ? opt.colorHex : "var(--texto-muted)", transition: "background 0.2s ease, color 0.2s ease" }}>
                            {opt.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: opt.val ? opt.colorHex : "var(--texto-primario)", transition: "color 0.2s ease" }}>{opt.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>{opt.sub}</p>
                          </div>
                          <Toggle checked={opt.val} onChange={opt.set} color={opt.colorHex} />
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {error && <p className="text-sm px-4 py-3 rounded-xl" style={{ background: "var(--error-light)", color: "var(--error)" }}>{error}</p>}
              </motion.div>
            ) : (
              <motion.div key="paso2"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="px-4 sm:px-6"
                style={{ paddingTop: 20, paddingBottom: 20, display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Resumen */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: `${tabColor}0D`, border: `1px solid ${tabColor}25` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tabColor}18` }}>
                    <FileText size={16} style={{ color: tabColor }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>{form.titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                      {TIPO_DOCUMENTO_LABEL[form.tipo]}
                      {yaAsignadosIds.size > 0 && ` · ${yaAsignadosIds.size} asignado${yaAsignadosIds.size !== 1 ? "s" : ""} actualmente`}
                    </p>
                  </div>
                </div>

                {/* Tabs destino */}
                <div>
                  <label className={labelCls} style={labelSty}>Asignaciones</label>
                  <div className="flex gap-2 mb-3">
                    {([
                      { id: "empleados", label: "Empleados", icon: Users },
                      { id: "departamentos", label: "Departamentos", icon: Building2 },
                      { id: "todos", label: "Toda la empresa", icon: Globe },
                    ] as const).map((opt) => {
                      const Icon = opt.icon; const active = destino === opt.id;
                      return (
                        <button key={opt.id} type="button" onClick={() => { setDestino(opt.id); setBusqueda(""); }}
                          className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap"
                          style={{ background: active ? tabColor : "var(--blanco)", color: active ? "white" : "var(--texto-secundario)", border: `1.5px solid ${active ? tabColor : "var(--gris-borde)"}`, cursor: "pointer" }}>
                          <Icon size={12} className="shrink-0 hidden sm:block" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cargando asignaciones */}
                  {cargandoAsignaciones ? (
                    <div className="flex items-center justify-center gap-2.5 py-8 rounded-xl"
                      style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
                      <div className="w-5 h-5 border-2 rounded-full animate-spin shrink-0"
                        style={{ borderColor: "var(--gris-borde)", borderTopColor: tabColor }} />
                      <span className="text-xs font-medium" style={{ color: "var(--texto-muted)" }}>Cargando asignaciones…</span>
                    </div>
                  ) : null}

                  {/* ── Empleados ── */}
                  {!cargandoAsignaciones && destino === "empleados" && (() => {
                    const filtrados = empleados.filter((e) =>
                      `${e.nombre} ${e.apellidos}`.toLowerCase().includes(busqueda.toLowerCase())
                    );
                    const todosSeleccionados = empleados.length > 0 && empleados.every((e) => usersSel.has(e.usuarioId));
                    const algunoSeleccionado = empleados.some((e) => usersSel.has(e.usuarioId));
                    return (
                      <div className="flex flex-col gap-2">
                        {/* Buscador + marcar todos */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }} />
                            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                              placeholder="Buscar empleado…"
                              className="w-full text-sm rounded-lg outline-none border transition-all"
                              style={{ height: 36, paddingLeft: 30, paddingRight: busqueda ? 28 : 10, borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "var(--texto-primario)" }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = tabColor; e.currentTarget.style.boxShadow = `0 0 0 3px ${tabColor}1A`; }}
                              onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                            />
                            {busqueda && (
                              <button type="button" onClick={() => setBusqueda("")} className="absolute right-2.5 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--texto-muted)", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          {empleados.length > 0 && (
                            <button type="button"
                              onClick={() => setUsersSel(todosSeleccionados
                                ? new Set(yaAsignadosIds) // al "desmarcar todos" solo deja los ya asignados (no los quita)
                                : new Set(empleados.map((e) => e.usuarioId)))}
                              className="inline-flex items-center shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg"
                              style={{ background: algunoSeleccionado ? `${tabColor}12` : "var(--gris-pagina)", color: algunoSeleccionado ? tabColor : "var(--texto-muted)", border: `1.5px solid ${algunoSeleccionado ? `${tabColor}30` : "var(--gris-borde)"}`, cursor: "pointer" }}>
                              {todosSeleccionados ? "Desmarcar nuevos" : "Marcar todos"}
                            </button>
                          )}
                        </div>

                        {/* Contador — altura fija para evitar saltos de layout */}
                        <p className="text-xs font-semibold" style={{
                          color: nuevosUsersSel.size > 0 ? tabColor : eliminadosIds.length > 0 ? "var(--error)" : "var(--texto-muted)",
                          minHeight: "1.25rem",
                        }}>
                          {nuevosUsersSel.size > 0 && eliminadosIds.length > 0
                            ? `+${nuevosUsersSel.size} nuevos · −${eliminadosIds.length} se quitan`
                            : nuevosUsersSel.size > 0
                              ? `+${nuevosUsersSel.size} nuevo${nuevosUsersSel.size !== 1 ? "s" : ""} · ${yaAsignadosIds.size} ya asignado${yaAsignadosIds.size !== 1 ? "s" : ""}`
                              : eliminadosIds.length > 0
                                ? `−${eliminadosIds.length} perderá${eliminadosIds.length !== 1 ? "n" : ""} acceso · ${yaAsignadosIds.size - eliminadosIds.length} restantes`
                                : yaAsignadosIds.size > 0
                                  ? `${yaAsignadosIds.size} ya asignado${yaAsignadosIds.size !== 1 ? "s" : ""} · sin cambios`
                                  : "Ninguno seleccionado"}
                        </p>

                        {/* Lista */}
                        <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid var(--gris-borde)" }}>
                          {empleados.length === 0 ? (
                            <p className="text-xs text-center py-6" style={{ color: "var(--texto-muted)" }}>No hay empleados</p>
                          ) : filtrados.length === 0 ? (
                            <p className="text-xs text-center py-6" style={{ color: "var(--texto-muted)" }}>Sin resultados para "{busqueda}"</p>
                          ) : (
                            <div className="max-h-52 overflow-y-auto">
                              {filtrados.map((e, i) => {
                                const yaAsignado = yaAsignadosIds.has(e.usuarioId);
                                const sel        = usersSel.has(e.usuarioId);
                                const esNuevo    = sel && !yaAsignado;
                                const seQuita    = yaAsignado && !sel;
                                const iniciales  = `${e.nombre?.[0] ?? ""}${e.apellidos?.[0] ?? ""}`.toUpperCase();
                                const palette    = avatarColor(`${e.nombre}${e.apellidos}`);
                                const dptoPal    = e.departamento ? dptoColorFull(e.departamento) : null;
                                return (
                                  <label key={e.usuarioId}
                                    className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer"
                                    style={{
                                      background:   seQuita ? "var(--error-light)" : sel ? `${tabColor}0D` : "var(--blanco)",
                                      borderBottom: i < filtrados.length - 1 ? "1px solid var(--gris-superficie)" : "none",
                                      transition:   "background 0.12s ease",
                                      opacity:      seQuita ? 0.75 : 1,
                                    }}
                                    onMouseEnter={(ev) => { if (!sel && !seQuita) ev.currentTarget.style.background = "var(--gris-pagina)"; }}
                                    onMouseLeave={(ev) => { ev.currentTarget.style.background = seQuita ? "var(--error-light)" : sel ? `${tabColor}0D` : "var(--blanco)"; }}>
                                    {/* Checkbox */}
                                    <span className="shrink-0 w-4 h-4 rounded flex items-center justify-center"
                                      style={{ background: sel ? tabColor : seQuita ? "var(--error)" : "var(--blanco)", border: `1.5px solid ${sel ? tabColor : seQuita ? "var(--error)" : "var(--gris-borde)"}`, transition: "background 0.12s ease, border-color 0.12s ease" }}>
                                      {sel && <Check size={10} color="white" strokeWidth={3} />}
                                      {seQuita && <X size={10} color="white" strokeWidth={3} />}
                                    </span>
                                    <input type="checkbox" checked={sel} onChange={() => setUsersSel((s) => toggleSet(s, e.usuarioId))} className="hidden" />
                                    {/* Avatar */}
                                    <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                      style={{ background: palette.bg, color: palette.color }}>{iniciales}</span>
                                    <span className="text-sm font-medium flex-1 truncate" style={{ color: seQuita ? "var(--error)" : "var(--texto-primario)" }}>
                                      {e.nombre} {e.apellidos}
                                    </span>
                                    {/* Badge estado */}
                                    {seQuita ? (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(220,38,38,0.12)", color: "var(--error)" }}>Se quitará</span>
                                    ) : esNuevo ? (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${tabColor}18`, color: tabColor }}>Nuevo</span>
                                    ) : yaAsignado ? (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${tabColor}10`, color: tabColor }}>Asignado</span>
                                    ) : e.departamento && dptoPal ? (
                                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium" style={{ background: dptoPal.bg, color: dptoPal.color }}>{e.departamento}</span>
                                    ) : null}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Departamentos ── */}
                  {!cargandoAsignaciones && destino === "departamentos" && (() => {
                    const todosDepSel = departamentos.length > 0 && departamentos.every((d) => dptosSel.has(d.id));
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            {nuevosDptosSel.size > 0 && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${tabColor}15`, color: tabColor }}>
                                +{nuevosDptosSel.size} nuevo{nuevosDptosSel.size !== 1 ? "s" : ""}
                              </span>
                            )}
                            {dptosSel.size === 0 && <span className="text-xs" style={{ color: "var(--texto-muted)" }}>{departamentos.length} departamentos</span>}
                            {dptosSel.size > 0 && nuevosDptosSel.size === 0 && (
                              <span className="text-xs" style={{ color: "var(--texto-muted)" }}>{dptosSel.size} seleccionado{dptosSel.size !== 1 ? "s" : ""} · sin cambios</span>
                            )}
                          </div>
                          {departamentos.length > 0 && (
                            <button type="button"
                              onClick={() => setDptosSel(todosDepSel ? new Set(dptosPreAsignados) : new Set(departamentos.map((d) => d.id)))}
                              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg"
                              style={{ background: dptosSel.size > 0 ? `${tabColor}12` : "var(--gris-pagina)", color: dptosSel.size > 0 ? tabColor : "var(--texto-muted)", border: `1.5px solid ${dptosSel.size > 0 ? `${tabColor}30` : "var(--gris-borde)"}`, cursor: "pointer" }}>
                              {todosDepSel ? "Desmarcar nuevos" : "Marcar todos"}
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {departamentos.map((d) => {
                            const sel       = dptosSel.has(d.id);
                            const yaEstaba  = dptosPreAsignados.has(d.id);
                            const pal       = dptoColorFull(d.label);
                            return (
                              <button key={d.id} type="button" onClick={() => setDptosSel((s) => toggleSet(s, d.id))}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{ background: sel ? pal.bg : "var(--blanco)", color: sel ? pal.color : "var(--texto-secundario)", border: `1.5px solid ${sel ? pal.border : "var(--gris-borde)"}`, cursor: "pointer", boxShadow: sel ? `0 0 0 3px ${pal.bg}` : "none" }}>
                                {sel && <Check size={11} strokeWidth={3} />}
                                {d.label}
                                {yaEstaba && sel && <span className="text-[9px] font-bold opacity-60 ml-0.5">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Toda la empresa ── */}
                  {!cargandoAsignaciones && destino === "todos" && (
                    esGlobal ? (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: `${tabColor}0D`, border: `1px solid ${tabColor}25` }}>
                        <Check size={15} className="shrink-0 mt-0.5" style={{ color: tabColor }} />
                        <p className="text-xs leading-relaxed" style={{ color: tabColor }}>
                          Este documento ya está asignado a <strong>todos los empleados</strong> de la empresa.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--advertencia-light)", border: "1px solid rgba(217,119,6,0.2)" }}>
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: "var(--advertencia)" }} />
                        <p className="text-xs leading-relaxed" style={{ color: "var(--advertencia)" }}>
                          El documento se asignará a <strong>todos los empleados activos</strong> de la empresa.
                        </p>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Error en paso 2 ── */}
        {paso === 2 && error && (
          <div className="px-4 sm:px-6 pb-0 pt-3 shrink-0">
            <p className="text-sm px-4 py-3 rounded-xl" style={{ background: "var(--error-light)", color: "var(--error)" }}>{error}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-6 py-4 flex items-center justify-between gap-3 shrink-0"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)", background: "#ffffff" }}>
          {paso === 1
            ? <Button variant="secondary" size="md" onClick={onClose}>Cancelar</Button>
            : <Button variant="secondary" size="md" onClick={() => setPaso(1)}>← Volver</Button>
          }
          {paso === 1 ? (
            <Button variant="primary" size="md" disabled={!form.titulo.trim()} onClick={() => setPaso(2)} style={{ minWidth: 130 }}>
              Siguiente →
            </Button>
          ) : (
            <Button variant="primary" size="md" disabled={guardando}
              onClick={() => onGuardar(hayCambiosAsig ? { nuevosUsersSel, nuevosDptosSel, destino, asignarATodos: destino === "todos" && !esGlobal, eliminarIds: eliminadosIds, notificar } : undefined)}
              style={{ minWidth: 148 }}>
              {guardando
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando…</>
                : "Guardar cambios"}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Modal: detalle de asignaciones ─────────────────────────────────────────

function ModalAsignaciones({
  documento, asignaciones, cargando, onClose,
}: {
  documento: Documento;
  asignaciones: AsignacionDetalle[];
  cargando: boolean;
  onClose: () => void;
}) {
  const color = TIPO_DOCUMENTO_COLOR[documento.tipo];
  const firmados  = asignaciones.filter((a) => a.firmado).length;
  const vistos    = asignaciones.filter((a) => a.visto).length;
  const pendientes = asignaciones.filter((a) => !a.visto).length;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex: 160, background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.26, ease: [0.34, 1.15, 0.64, 1] }}
        className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--gris-panel)", maxHeight: "80dvh", boxShadow: "0 24px 56px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente del tipo */}
        <div className="relative px-6 py-5 shrink-0"
          style={{ background: `linear-gradient(135deg, ${color.text}cc, ${color.text}88)` }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>Asignaciones</p>
              <h3 className="font-bold text-lg" style={{ color: "#fff" }}>{documento.titulo}</h3>
            </div>
            <IconButton variant="glass" label="Cerrar" onClick={onClose} />
          </div>
        </div>

        {/* KPIs */}
        {!cargando && (
          <div className="shrink-0 px-5 pt-4 pb-4" style={{ background: "var(--gris-panel)", borderBottom: "1px solid var(--gris-borde)" }}>
            <div className="grid grid-cols-3 rounded-2xl" style={{ border: "1px solid var(--gris-borde)" }}>
              {([
                { label: "Asignados", value: asignaciones.length, color: color.text,              bg: `${color.text}12`, prefix: ""  },
                { label: "Vistos",    value: vistos,              color: "var(--exito)",           bg: "rgba(16,185,129,0.07)", prefix: "" },
                ...(documento.requiereFirma
                  ? [{ label: "Firmados",   value: firmados,   color: "#7B4A85", bg: "rgba(123,74,133,0.08)", prefix: "" }]
                  : [{ label: "Pendientes", value: pendientes, color: "var(--advertencia)", bg: "rgba(245,158,11,0.08)", prefix: "" }]),
              ] as const).map(({ label, value, color: c, bg }, i) => (
                <div key={label} className="flex flex-col items-center justify-center py-4 gap-1"
                  style={{
                    background: bg,
                    borderRight: i < 2 ? "1px solid var(--gris-borde)" : "none",
                    borderRadius: i === 0 ? "16px 0 0 16px" : i === 2 ? "0 16px 16px 0" : 0,
                  }}>
                  <span style={{ fontSize: "clamp(1.4rem, 5vw, 1.9rem)", fontWeight: 800, color: c, lineHeight: 1, fontVariantNumeric: "lining-nums" }}>
                    {value}
                  </span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: c, opacity: 0.75, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="overflow-y-auto flex-1 p-4">
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--gris-borde)", borderTopColor: color.text }} />
            </div>
          ) : asignaciones.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--texto-muted)" }}>Sin asignaciones</p>
          ) : (
            <ul className="space-y-1.5">
              {asignaciones.map((a) => {
                const initials = `${a.nombre?.[0] ?? ""}${a.apellidos?.[0] ?? ""}`.toUpperCase();
                return (
                  <li key={a.asignacionId}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{ background: "var(--blanco)", border: "1px solid var(--gris-superficie)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blanco)")}>
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: color.bg, color: color.text }}>
                      {initials}
                    </div>
                    {/* Nombre + departamento */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight" style={{ color: "var(--texto-primario)" }}>
                        {a.nombre} {a.apellidos}
                      </p>
                      {a.departamento && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9" }}>
                          {a.departamento}
                        </span>
                      )}
                    </div>
                    {/* Estado */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {a.visto ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: "var(--exito-light)", color: "var(--exito)" }}>
                          <CheckCircle2 size={10} className="shrink-0" /> Visto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: "var(--advertencia-light)", color: "var(--advertencia)" }}>
                          <Clock size={10} className="shrink-0" /> Pendiente
                        </span>
                      )}
                      {documento.requiereFirma && a.firmado && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: "#F3E8FF", color: "#7B4A85" }}>
                          <Check size={10} className="shrink-0" /> Firmado
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── DocSelect — dropdown estilizado igual que StatsSelect ───────────────────
function DocSelect({ value, onChange, options, placeholder, accentColor }: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
  accentColor: string;
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
    <div ref={wrapRef} className="relative flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { calcPos(); setOpen(p => !p); }}
        className="w-full flex items-center gap-2 rounded-xl pl-3 pr-2.5 h-10 text-sm font-semibold cursor-pointer focus:outline-none"
        style={{
          background: "var(--blanco)",
          border: `1.5px solid ${isActive || open ? accentColor : "var(--gris-borde)"}`,
          color: isActive ? accentColor : "var(--texto-primario)",
          transition: "border-color 0.15s, color 0.15s",
        }}
      >
        <span className="flex-1 text-left truncate">{selected?.label ?? placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}
          style={{ display: "flex", flexShrink: 0, color: isActive ? accentColor : "var(--texto-muted)" }}>
          <ChevronDown size={13} strokeWidth={2.5} />
        </motion.span>
      </button>
      {createPortal(
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
                left: Math.min(pos.left, window.innerWidth - Math.max(pos.width, 180) - 12),
                width: Math.max(pos.width, 180),
                zIndex: 9999,
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                overflow: "hidden",
              }}
            >
              {[{ id: "", label: placeholder }, ...options].map((opt) => {
                const isSel = value === opt.id;
                return (
                  <button key={opt.id} type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-sm cursor-pointer"
                    style={{
                      background: isSel ? `${accentColor}15` : "transparent",
                      color: isSel ? accentColor : "var(--texto-primario)",
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
