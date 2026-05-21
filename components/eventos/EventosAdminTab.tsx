"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar, Plus, MapPin, Globe2, Building2, Clock, Search, ChevronDown,
} from "lucide-react";
import {
  getEventosComunidad,
  desactivarEventoComunidad,
  type ComunidadEvento,
} from "@/lib/api/comunidad";
import { ModalEvento } from "./ModalEvento";
import { ModalConfirm } from "@/components/ui/ModalConfirm";
import { Button } from "@/components/ui/Button";

const TAB_COLOR  = "#0F766E";
const QK_EVENTOS = ["eventos-admin"];

// ── Helpers de fecha ─────────────────────────────────────────────────────────

function formatFechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function esFuturo(iso: string) {
  return new Date(iso).getTime() >= Date.now();
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden animate-pulse"
      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ height: 110, background: "var(--gris-superficie)" }} />
      <div className="flex flex-col gap-2.5 px-3.5 pt-3 pb-3.5">
        <div className="flex gap-1.5">
          <div className="h-4 rounded-md w-20" style={{ background: "var(--gris-borde)" }} />
          <div className="h-4 rounded-md w-16" style={{ background: "var(--gris-superficie)" }} />
        </div>
        <div className="h-4 rounded-full w-3/4" style={{ background: "var(--gris-borde)" }} />
        <div className="h-3 rounded-full w-1/2" style={{ background: "var(--gris-superficie)" }} />
        <div className="h-3 rounded-full w-2/3" style={{ background: "var(--gris-superficie)" }} />
        <div className="flex gap-2 pt-1">
          <div className="h-8 flex-1 rounded-xl" style={{ background: "var(--gris-borde)" }} />
          <div className="h-8 w-8 rounded-xl" style={{ background: "var(--gris-superficie)" }} />
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta de evento ─────────────────────────────────────────────────────────

function EventoCard({
  ev,
  onEditar,
  onEliminar,
}: {
  ev: ComunidadEvento;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const futuro = esFuturo(ev.fechaInicio);
  const d      = new Date(ev.fechaInicio);
  const dia    = d.getDate();
  const mes    = d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase();

  const gradFuturo = "linear-gradient(135deg, #065F46 0%, #0F766E 55%, #0D9488 100%)";
  const gradPasado = "linear-gradient(135deg, #374151 0%, #4B5563 100%)";

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background:  "var(--blanco)",
        border:      "1px solid var(--gris-borde)",
        boxShadow:   "0 1px 4px rgba(0,0,0,0.04)",
        transition:  "box-shadow 0.2s, transform 0.2s",
      }}
      onClick={onEditar}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* ── Cabecera ── */}
      <div className="relative w-full overflow-hidden"
        style={{ height: 110, background: futuro ? gradFuturo : gradPasado }}>

        {/* Imagen de portada */}
        {ev.imagenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ev.imagenUrl} alt={ev.titulo}
            className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.40) 100%)" }} />

        {/* Icono decorativo de fondo */}
        <Calendar size={64} strokeWidth={0.8}
          className="absolute -bottom-3 -right-3 pointer-events-none"
          style={{ color: "rgba(255,255,255,0.08)" }} />

        {/* Fecha destacada — esquina inferior izquierda */}
        <div className="absolute bottom-3 left-4 flex items-end gap-1.5">
          <span className="font-black leading-none"
            style={{ fontSize: "2.6rem", color: "#fff", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            {dia}
          </span>
          <div className="flex flex-col pb-1">
            <span className="font-bold uppercase tracking-widest"
              style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.90)", letterSpacing: "0.12em" }}>
              {mes}
            </span>
            <span className="font-semibold"
              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>
              {d.getFullYear()}
            </span>
          </div>
        </div>

        {/* Badge top-right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
          {ev.esGlobal && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(27,63,126,0.85)", color: "#fff", backdropFilter: "blur(4px)" }}>
              <Globe2 size={9} strokeWidth={2.5} /> EGM Global
            </span>
          )}
          {!futuro && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)" }}>
              Finalizado
            </span>
          )}
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex flex-col flex-1 px-3.5 pt-3 pb-3.5 gap-2">

        {/* Badge empresa */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
            style={{
              background: ev.esGlobal ? "#1B3F7E18" : `${TAB_COLOR}15`,
              color:      ev.esGlobal ? "var(--azul-egm)" : TAB_COLOR,
            }}>
            {ev.esGlobal
              ? <><Globe2 size={9} strokeWidth={2.5} />EGM Global</>
              : <><Building2 size={9} strokeWidth={2.5} />Tu empresa</>}
          </span>
        </div>

        {/* Título */}
        <h3 className="font-bold leading-snug line-clamp-2"
          style={{ fontSize: "0.875rem", color: "var(--texto-primario)", minHeight: "2.6em" }}>
          {ev.titulo}
        </h3>

        {/* Meta */}
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--texto-secundario)" }}>
            <Clock size={11} strokeWidth={2} style={{ color: futuro ? TAB_COLOR : "var(--texto-secundario)", flexShrink: 0 }} />
            {formatHora(ev.fechaInicio)}
            {ev.fechaFin ? ` – ${formatHora(ev.fechaFin)}` : ""}
          </span>
          {ev.lugar && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--texto-secundario)" }}>
              <MapPin size={11} strokeWidth={2} style={{ color: futuro ? TAB_COLOR : "var(--texto-secundario)", flexShrink: 0 }} />
              <span className="truncate">{ev.lugar}</span>
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1.5 mt-auto pt-2" onClick={e => e.stopPropagation()}>
          <Button variant="primary" size="sm" className="flex-1 justify-center" onClick={onEditar}>
            Editar
          </Button>
          <Button variant="danger" size="sm" className="flex-1 justify-center" onClick={onEliminar}>
            Desactivar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  esSuperAdmin?: boolean;
}

export function EventosAdminTab({ esSuperAdmin = false }: Props) {
  const qc = useQueryClient();

  const { data: eventos = [], isLoading: cargando, isError } = useQuery<ComunidadEvento[]>({
    queryKey: QK_EVENTOS,
    queryFn: async () => {
      const data = await getEventosComunidad();
      const ahora = Date.now();
      return [...data].sort((a, b) => {
        const ta = new Date(a.fechaInicio).getTime();
        const tb = new Date(b.fechaInicio).getTime();
        const fa = ta >= ahora, fb = tb >= ahora;
        if (fa && !fb) return -1;
        if (!fa && fb) return 1;
        return fa ? ta - tb : tb - ta;
      });
    },
    staleTime: 60_000,
  });

  type Filtro = "todos" | "proximos" | "finalizados";
  const [search, setSearch]                     = useState("");
  const [filtro, setFiltro]                     = useState<Filtro>("todos");
  const [dropOpen, setDropOpen]                 = useState(false);
  const [dropPos,  setDropPos]                  = useState({ top: 0, left: 0, width: 0 });
  const dropRef = useRef<HTMLButtonElement>(null);
  const [modalAbierto, setModalAbierto]         = useState(false);
  const [editando, setEditando]                 = useState<ComunidadEvento | null>(null);
  const [confirmEliminar, setConfirmEliminar]   = useState<ComunidadEvento | null>(null);
  const [eliminando, setEliminando]             = useState(false);

  if (typeof document !== "undefined") {
    document.body.style.overflow = (modalAbierto || !!confirmEliminar) ? "hidden" : "";
  }

  const filtrados = eventos.filter(ev => {
    if (filtro === "proximos"    && !esFuturo(ev.fechaInicio)) return false;
    if (filtro === "finalizados" &&  esFuturo(ev.fechaInicio)) return false;
    return !search.trim() ||
      ev.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (ev.descripcion ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (ev.lugar ?? "").toLowerCase().includes(search.toLowerCase());
  });

  const handleGuardado = (ev: ComunidadEvento) => {
    qc.setQueryData<ComunidadEvento[]>(QK_EVENTOS, (prev = []) => {
      const existe = prev.find(e => e.eventoId === ev.eventoId);
      const lista  = existe
        ? prev.map(e => e.eventoId === ev.eventoId ? ev : e)
        : [ev, ...prev];
      const ahora  = Date.now();
      return [...lista].sort((a, b) => {
        const ta = new Date(a.fechaInicio).getTime();
        const tb = new Date(b.fechaInicio).getTime();
        const fa  = ta >= ahora, fb = tb >= ahora;
        if (fa && !fb) return -1;
        if (!fa && fb) return 1;
        return fa ? ta - tb : tb - ta;
      });
    });
    setModalAbierto(false);
    setEditando(null);
  };

  const ejecutarEliminar = async () => {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      await desactivarEventoComunidad(confirmEliminar.eventoId);
      qc.setQueryData<ComunidadEvento[]>(QK_EVENTOS, (prev = []) =>
        prev.filter(e => e.eventoId !== confirmEliminar.eventoId)
      );
    } finally {
      setEliminando(false);
      setConfirmEliminar(null);
    }
  };

  const totalFuturos = eventos.filter(ev => esFuturo(ev.fechaInicio)).length;

  return (
    <div>
      {/* ── Título + subtítulo ── */}
      <div className="mb-8 text-center sm:text-left">
        <h1 style={{
          fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800,
          fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)",
          letterSpacing: "-0.02em", lineHeight: 1.1,
        }}>
          Eventos
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {cargando ? "Cargando eventos…" : isError ? "Error al cargar" : eventos.length === 0
            ? "No hay eventos registrados"
            : <>
                {eventos.length} evento{eventos.length !== 1 ? "s" : ""}
                {totalFuturos > 0 && (
                  <span className="font-semibold" style={{ color: TAB_COLOR }}>
                    {" · "}{totalFuturos} próximo{totalFuturos !== 1 ? "s" : ""}
                  </span>
                )}
              </>
          }
        </p>
      </div>

      {/* ── Toolbar ── */}
      {(() => {
        const FILTROS = [
          { id: "todos"       as Filtro, label: "Todos"       },
          { id: "proximos"    as Filtro, label: "Próximos"    },
          { id: "finalizados" as Filtro, label: "Finalizados" },
        ];
        const activoLabel = FILTROS.find(f => f.id === filtro)?.label ?? "Todos";
        const searchInput = (placeholder: string) => (
          <div className="relative flex-1 sm:flex-none" style={{ width: undefined }}>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
              <Search size={15} strokeWidth={2} />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none"
              style={{
                background: "var(--blanco)",
                border: "1.5px solid var(--gris-borde)",
                color: "var(--texto-primario)",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = TAB_COLOR}
              onBlur={e  => e.currentTarget.style.borderColor = "var(--gris-borde)"}
            />
          </div>
        );
        return (
          <div className="flex flex-col gap-2 mb-6">
            {/* Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <div style={{ width: 260 }}>{searchInput("Buscar eventos…")}</div>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
                {FILTROS.map(({ id, label }) => {
                  const active = filtro === id;
                  return (
                    <button key={id} type="button" onClick={() => setFiltro(id)}
                      className="relative text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer whitespace-nowrap"
                      style={{ color: active ? "var(--texto-primario)" : "var(--texto-muted)", background: "none", border: "none", transition: "color 0.15s" }}>
                      {active && (
                        <motion.span layoutId="ev-filtro-pill"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: "var(--blanco)", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex-1" />
              <Button variant="primary" size="md" onClick={() => { setEditando(null); setModalAbierto(true); }}>
                <Plus size={14} /> Crear evento
              </Button>
            </div>

            {/* Móvil */}
            <div className="flex flex-col gap-2 sm:hidden">
              <div className="flex gap-2">
                {searchInput("Buscar…")}
                <Button variant="primary" size="md" onClick={() => { setEditando(null); setModalAbierto(true); }}>
                  <Plus size={14} />
                </Button>
              </div>
              {/* Dropdown filtro */}
              <button
                ref={dropRef}
                onClick={() => {
                  if (!dropOpen && dropRef.current) {
                    const r = dropRef.current.getBoundingClientRect();
                    setDropPos({ top: r.bottom + 5, left: r.left, width: r.width });
                  }
                  setDropOpen(v => !v);
                }}
                className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl cursor-pointer"
                style={{
                  background: "var(--blanco)",
                  border: `1.5px solid ${filtro !== "todos" ? TAB_COLOR : "var(--gris-borde)"}`,
                  color: filtro !== "todos" ? TAB_COLOR : "var(--texto-primario)",
                  transition: "border-color 0.15s",
                }}
              >
                <span>{activoLabel}</span>
                <ChevronDown size={14} strokeWidth={2.3} style={{ color: "var(--texto-muted)", transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
              </button>
              {dropOpen && createPortal(
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setDropOpen(false)} />
                  <div className="fixed z-[9999] rounded-xl overflow-hidden"
                    style={{
                      top: dropPos.top, left: dropPos.left,
                      minWidth: Math.max(dropPos.width, 180),
                      background: "var(--blanco)",
                      border: "1px solid var(--gris-borde)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
                    }}>
                    {FILTROS.map(opt => {
                      const sel = filtro === opt.id;
                      return (
                        <button key={opt.id} onClick={() => { setFiltro(opt.id); setDropOpen(false); }}
                          className="flex items-center w-full px-4 py-2.5 text-sm font-semibold cursor-pointer text-left"
                          style={{
                            color: sel ? TAB_COLOR : "var(--texto-primario)",
                            background: sel ? `${TAB_COLOR}10` : "transparent",
                          }}
                          onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "var(--gris-pagina)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = sel ? `${TAB_COLOR}10` : "transparent"; }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Contenido ── */}
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <SkeletonCard key={i} />)}
        </div>

      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl text-center"
          style={{ background: "var(--blanco)", border: "1px solid #fca5a5" }}>
          <div className="rounded-2xl p-4" style={{ background: "#fee2e2" }}>
            <Calendar size={28} style={{ color: "#dc2626" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--texto-primario)" }}>No se pudieron cargar los eventos</p>
            <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>Comprueba tu conexión e inténtalo de nuevo</p>
          </div>
          <button onClick={() => qc.invalidateQueries({ queryKey: QK_EVENTOS })}
            className="text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
            style={{ background: "#dc2626", color: "white" }}>
            Reintentar
          </button>
        </div>

      ) : filtrados.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 72, height: 72, background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
            {search ? <Search size={28} strokeWidth={1.4} /> : <Calendar size={28} strokeWidth={1.4} />}
          </div>
          <div>
            <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>
              {search ? "Sin resultados" : "Todavía no hay eventos"}
            </p>
            <p className="text-sm" style={{ color: "var(--texto-muted)", maxWidth: 320, margin: "0 auto" }}>
              {search
                ? <>No hay eventos que coincidan con <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>"{search}"</span></>
                : "Crea el primer evento para que los empleados puedan verlo."}
            </p>
          </div>
          {search && (
            <button onClick={() => setSearch("")}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
              style={{ background: TAB_COLOR, color: "white" }}>
              Ver todos
            </button>
          )}
        </div>

      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <AnimatePresence initial={false}>
            {filtrados.map((ev, idx) => (
              <motion.div
                key={ev.eventoId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: idx * 0.03 }}
              >
                <EventoCard
                  ev={ev}
                  onEditar={() => { setEditando(ev); setModalAbierto(true); }}
                  onEliminar={() => setConfirmEliminar(ev)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal crear/editar ── */}
      {modalAbierto && (
        <ModalEvento
          evento={editando}
          esSuperAdmin={esSuperAdmin}
          onClose={() => { setModalAbierto(false); setEditando(null); }}
          onGuardado={handleGuardado}
        />
      )}

      {/* ── Confirm desactivar ── */}
      <ModalConfirm
        abierto={!!confirmEliminar}
        titulo="¿Desactivar evento?"
        descripcion={
          confirmEliminar
            ? `"${confirmEliminar.titulo}" dejará de ser visible para los empleados.`
            : ""
        }
        textoConfirmar={eliminando ? "Desactivando…" : "Desactivar"}
        variante="danger"
        onConfirmar={ejecutarEliminar}
        onCancelar={() => setConfirmEliminar(null)}
      />
    </div>
  );
}
