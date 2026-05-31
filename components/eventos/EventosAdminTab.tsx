"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar, Plus, MapPin, Globe2, Clock, Search, ChevronDown, X, ArrowRight,
} from "lucide-react";
import {
  getEventosComunidad,
  desactivarEventoComunidad,
  type ComunidadEvento,
} from "@/lib/api/comunidad";
import { ModalEvento } from "./ModalEvento";
import { ModalConfirm } from "@/components/ui/ModalConfirm";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";

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
      <div style={{ height: 130, background: "var(--gris-superficie)" }} />
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
        transition:  "box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease",
      }}
      onClick={onEditar}
      onMouseEnter={e => {
        const c = futuro ? "#065F46" : "#374151";
        e.currentTarget.style.boxShadow = `0 8px 28px ${c}33, 0 2px 8px rgba(0,0,0,0.06)`;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = `${c}35`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--gris-borde)";
      }}
    >
      {/* ── Cabecera ── */}
      <div className="relative w-full overflow-hidden"
        style={{ height: 130, background: futuro ? gradFuturo : gradPasado }}>

        {/* Imagen de portada */}
        {ev.imagenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ev.imagenUrl} alt={ev.titulo}
            className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Overlay — solo cuando hay imagen */}
        {ev.imagenUrl && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.65) 100%)" }} />
        )}

        {/* Sin imagen: decoración igual que documentos/anuncios */}
        {!ev.imagenUrl && (
          <>
            {/* Círculo decorativo — top-left */}
            <div className="pointer-events-none absolute" style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              top: -28, left: -22,
            }} />
            {/* Icono gigante translúcido — bottom-right */}
            <div className="pointer-events-none absolute flex items-center justify-center" style={{
              right: -18, bottom: -40, width: 140, height: 140,
              opacity: 0.18, color: "#fff",
            }}>
              <Calendar size={100} strokeWidth={1} />
            </div>
          </>
        )}

        {/* Fecha destacada — esquina inferior izquierda */}
        <div className="absolute bottom-3 left-4 flex items-stretch gap-2.5">
          <span className="font-black leading-none"
            style={{ fontSize: "3.4rem", color: "#fff", lineHeight: 1, textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            {dia}
          </span>
          <div className="flex flex-col justify-between" style={{ paddingTop: "0.18em", paddingBottom: "0.22em" }}>
            <span className="font-extrabold uppercase"
              style={{ fontSize: "1.35rem", color: "#fff", letterSpacing: "0.06em", textShadow: "0 1px 6px rgba(0,0,0,0.5)", lineHeight: 1 }}>
              {mes}
            </span>
            <span className="font-bold"
              style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.82)", letterSpacing: "0.03em", textShadow: "0 1px 4px rgba(0,0,0,0.4)", lineHeight: 1 }}>
              {d.getFullYear()}
            </span>
          </div>
        </div>

        {/* Badge top-right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
          {ev.esGlobal && (
            <Badge variant="glass" icon={<Globe2 size={9} strokeWidth={2.5} />}>
              EGM Global
            </Badge>
          )}
          {!futuro && (
            <Badge variant="glass">Finalizado</Badge>
          )}
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex flex-col flex-1 px-3.5 pt-3 pb-3.5 gap-1.5">

        {/* Badge empresa — solo si es evento global */}
        {ev.esGlobal && (
          <div className="flex items-center gap-1.5">
            <Badge
              variant="soft"
              color="var(--azul-egm)"
              icon={<Globe2 size={9} strokeWidth={2.5} />}
              style={{ borderRadius: 6 }}
            >
              EGM Global
            </Badge>
          </div>
        )}

        {/* Título */}
        <h3 className="font-extrabold text-base leading-snug line-clamp-2"
          style={{ color: "var(--texto-primario)", minHeight: "2.6em", letterSpacing: "-0.01em" }}>
          {ev.titulo}
        </h3>

        {/* Meta */}
        {(() => {
          const finDistinto = ev.fechaFin &&
            new Date(ev.fechaFin).toDateString() !== new Date(ev.fechaInicio).toDateString();
          return (
            <div className="flex flex-col gap-1" style={{ minHeight: "3rem" }}>
              <span className="inline-flex items-center gap-1.5 font-medium" style={{ fontSize: "0.875rem", color: "var(--texto-secundario)" }}>
                <Clock size={14} strokeWidth={2} style={{ color: futuro ? TAB_COLOR : "var(--texto-secundario)", flexShrink: 0 }} />
                {finDistinto
                  ? <>{formatHora(ev.fechaInicio)} <ArrowRight size={11} strokeWidth={2} style={{ flexShrink: 0, color: "var(--texto-muted)" }} /> {formatFechaCorta(ev.fechaFin!)} · {formatHora(ev.fechaFin!)}</>
                  : <>{formatHora(ev.fechaInicio)}{ev.fechaFin ? ` – ${formatHora(ev.fechaFin)}` : ""}</>
                }
              </span>
              {ev.lugar ? (
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ fontSize: "0.875rem", color: "var(--texto-secundario)" }}>
                  <MapPin size={14} strokeWidth={2} style={{ color: futuro ? TAB_COLOR : "var(--texto-secundario)", flexShrink: 0 }} />
                  <span className="truncate">{ev.lugar.split(",")[0].trim()}</span>
                </span>
              ) : (
                <span style={{ minHeight: "1.3rem" }} />
              )}
            </div>
          );
        })()}

        {/* Acciones */}
        <div className="flex items-center gap-2 mt-auto pt-2" onClick={e => e.stopPropagation()}>
          <Button variant="primary" size="md" className="flex-1 justify-center" style={{ background: "var(--azul-egm)", color: "#fff", border: "none" }} onClick={onEditar}>
            Editar
          </Button>
          <Button variant="danger" size="md" className="flex-1 justify-center" onClick={onEliminar}>
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

  useEffect(() => {
    if (modalAbierto || !!confirmEliminar) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [modalAbierto, confirmEliminar]);

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
        const FILTROS: { id: Filtro; label: string }[] = [
          { id: "todos",       label: "Todos"       },
          { id: "proximos",    label: "Próximos"    },
          { id: "finalizados", label: "Finalizados" },
        ];
        const activoLabel = FILTROS.find(f => f.id === filtro)?.label ?? "Todos";
        return (
          <div className="flex flex-col gap-2 mb-6">
            {/* Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Buscador con X dentro */}
              <div className="relative shrink-0" style={{ width: 260 }}>
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                  <Search size={16} strokeWidth={2} />
                </span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar eventos…"
                  className="w-full pl-10 py-2.5 text-base rounded-2xl outline-none transition-colors"
                  style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", paddingRight: search ? "2.2rem" : "14px" }}
                  onFocus={e => e.currentTarget.style.borderColor = TAB_COLOR}
                  onBlur={e  => e.currentTarget.style.borderColor = "var(--gris-borde)"}
                />
                {search && (
                  <button onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <X size={13} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Pills de filtro */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
                {FILTROS.map(({ id, label }) => {
                  const active = filtro === id;
                  return (
                    <motion.button key={id} type="button"
                      onClick={() => setFiltro(prev => prev === id && id !== "todos" ? "todos" : id)}
                      className="relative text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer whitespace-nowrap"
                      style={{ color: active ? (id === "todos" ? "#fff" : TAB_COLOR) : "var(--texto-muted)", background: "transparent", border: "none", transition: "color 0.15s ease", zIndex: 1 }}
                      whileTap={{ scale: 0.94 }}
                    >
                      {active && (
                        <motion.span layoutId="ev-filtro-pill"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: id === "todos" ? TAB_COLOR : `${TAB_COLOR}18`, border: id === "todos" ? "none" : `1px solid ${TAB_COLOR}40`, zIndex: -1 }}
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        />
                      )}
                      {label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Limpiar filtro */}
              <AnimatePresence>
                {filtro !== "todos" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  >
                    <IconButton variant="surface" size="sm" label="Limpiar filtro" onClick={() => setFiltro("todos")}>
                      <X size={14} strokeWidth={2.5} />
                    </IconButton>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1" />
              <Button variant="primary" size="md" onClick={() => { setEditando(null); setModalAbierto(true); }}>
                <Plus size={16} strokeWidth={2.5} /> Crear evento
              </Button>
            </div>

            {/* Contador de resultados — fuera de la fila para no desalinear */}
            <AnimatePresence>
              {(search || filtro !== "todos") && eventos.length > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: "var(--texto-muted)" }}
                >
                  {filtrados.length === 0 ? "Sin resultados" : `${filtrados.length} evento${filtrados.length !== 1 ? "s" : ""}`}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Móvil */}
            <div className="flex flex-col gap-2 sm:hidden">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                    <Search size={16} strokeWidth={2} />
                  </span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…"
                    className="w-full pl-10 py-2.5 text-base rounded-2xl outline-none"
                    style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", paddingRight: search ? "2.2rem" : "14px" }} />
                  {search && (
                    <button onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                      style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                <Button variant="primary" size="md" onClick={() => { setEditando(null); setModalAbierto(true); }}>
                  <Plus size={16} strokeWidth={2.5} /> Añadir
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
                className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm font-semibold rounded-2xl cursor-pointer"
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
                  <div className="fixed z-[9999] rounded-2xl overflow-hidden"
                    style={{ top: dropPos.top, left: dropPos.left, minWidth: Math.max(dropPos.width, 180), background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 8px 24px rgba(0,0,0,0.13)" }}>
                    {FILTROS.map((opt, idx) => {
                      const sel = filtro === opt.id;
                      return (
                        <button key={opt.id} onClick={() => { setFiltro(opt.id); setDropOpen(false); }}
                          className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold cursor-pointer"
                          style={{ color: sel ? TAB_COLOR : "var(--texto-primario)", background: sel ? `${TAB_COLOR}12` : "transparent", borderBottom: idx < FILTROS.length - 1 ? "1px solid var(--gris-borde)" : "none" }}
                          onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = "var(--gris-pagina)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = sel ? `${TAB_COLOR}12` : "transparent"; }}
                        >
                          <span>{opt.label}</span>
                          {sel && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TAB_COLOR }} />}
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
        <div className="flex flex-col items-center justify-center py-14 sm:py-16 px-6 rounded-2xl text-center"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "rgba(15,118,110,0.08)" }}>
            {search
              ? <Search size={28} strokeWidth={1.5} style={{ color: TAB_COLOR, opacity: 0.7 }} />
              : <Calendar size={28} strokeWidth={1.5} style={{ color: TAB_COLOR, opacity: 0.7 }} />}
          </div>
          <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>
            {search ? "Sin resultados" : "Todavía no hay eventos"}
          </p>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>
            {search
              ? <>No hay eventos que coincidan con <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>"{search}"</span></>
              : "Crea el primer evento para que los empleados puedan verlo"}
          </p>
          {search && (
            <button onClick={() => setSearch("")}
              className="text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
              style={{ background: "rgba(15,118,110,0.08)", color: TAB_COLOR, border: `1.5px solid rgba(15,118,110,0.20)` }}>
              Ver todos
            </button>
          )}
        </div>

      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={filtro + "|" + search}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.18, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
          >
            {filtrados.map((ev, idx) => (
              <motion.div
                key={ev.eventoId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1], delay: idx * 0.04 } }}
              >
                <EventoCard
                  ev={ev}
                  onEditar={() => { setEditando(ev); setModalAbierto(true); }}
                  onEliminar={() => setConfirmEliminar(ev)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
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
