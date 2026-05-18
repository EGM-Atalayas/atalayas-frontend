"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardHero from "@/components/ui/DashboardHero";
import { Button }    from "@/components/ui/Button";
import { useAuth }   from "@/context/AuthContext";
import {
  getEventosComunidad,
  desactivarEventoComunidad,
  type ComunidadEvento,
} from "@/lib/api/comunidad";
import { ModalEvento } from "@/components/eventos/ModalEvento";
import { ModalUbicacion } from "@/components/eventos/ModalUbicacion";

// ── Helpers ───────────────────────────────────────────────────────────────────
type EstadoEvento = "PROXIMO" | "EN_CURSO" | "FINALIZADO";

const ESTADO_CONFIG: Record<EstadoEvento, { label: string; bg: string; color: string }> = {
  PROXIMO:    { label: "Próximo",    bg: "rgba(59,130,246,0.09)",  color: "#2563eb" },
  EN_CURSO:   { label: "Hoy",        bg: "rgba(16,185,129,0.09)",  color: "#059669" },
  FINALIZADO: { label: "Finalizado", bg: "rgba(0,0,0,0.06)",       color: "#6b7280" },
};

function calcEstado(ev: ComunidadEvento): EstadoEvento {
  const ahora    = Date.now();
  const ini      = new Date(ev.fechaInicio).getTime();
  const fin      = ev.fechaFin ? new Date(ev.fechaFin).getTime() : ini;
  if (ini > ahora) return "PROXIMO";
  if (ahora <= fin) return "EN_CURSO";
  return "FINALIZADO";
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatHoras(ev: ComunidadEvento) {
  const ini = new Date(ev.fechaInicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (!ev.fechaFin) return ini;
  const fin = new Date(ev.fechaFin).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${ini} – ${fin}`;
}

// ── Card de evento ────────────────────────────────────────────────────────────
function EventoCard({
  evento, puedeEditar, onEditar, onDesactivar, onVerUbicacion,
}: {
  evento: ComunidadEvento; puedeEditar: boolean;
  onEditar: (e: ComunidadEvento) => void;
  onDesactivar: (e: ComunidadEvento) => void;
  onVerUbicacion: (e: ComunidadEvento) => void;
}) {
  const [hovered,   setHovered]   = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const estado  = calcEstado(evento);
  const cfg     = ESTADO_CONFIG[estado];
  const pasado  = estado === "FINALIZADO";
  const fechaIni = new Date(evento.fechaInicio);

  useEffect(() => {
    if (!menuOpen) return;
    function onOut(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, [menuOpen]);

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:  "#ffffff",
        border:      "1px solid rgba(0,0,0,0.07)",
        boxShadow:   hovered ? "0 8px 28px rgba(0,0,0,0.11)" : "0 2px 12px rgba(0,0,0,0.06)",
        transform:   hovered ? "translateY(-2px)" : "translateY(0)",
        transition:  "box-shadow 0.22s ease, transform 0.22s cubic-bezier(0.34,1.20,0.64,1)",
        opacity:     pasado ? 0.72 : 1,
      }}
    >
      {/* Badge estado (esquina sup. izq.) + Menú admin (esquina sup. der.) */}
      <div className="absolute top-3 left-3 z-10">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
      {puedeEditar && (
        <div ref={menuRef} className="absolute top-3 right-3 z-10" style={{ position: "absolute" }}>
          <button
            onClick={() => setMenuOpen(p => !p)}
            className="flex items-center justify-center rounded-lg"
            style={{ width: 30, height: 30, background: menuOpen ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.80)", border: "1px solid rgba(0,0,0,0.06)", cursor: "pointer", color: "#6b7280", backdropFilter: "blur(4px)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.95)"; }}
            onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = "rgba(255,255,255,0.80)"; }}
          >
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 6px)", width: "180px", zIndex: 20,
              background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "14px",
              boxShadow: "0 8px 28px rgba(0,0,0,0.12)", padding: "6px", textAlign: "left",
            }}>
              <MenuBtn label="Editar" onClick={() => { setMenuOpen(false); onEditar(evento); }}
                icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>} />
              <MenuBtn label="Cancelar" danger onClick={() => { setMenuOpen(false); onDesactivar(evento); }}
                icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>} />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col items-start px-5 pt-12 pb-5 gap-3">
        {/* 1+2. Fecha (bloque) + Título y fecha completa */}
        <div className="flex items-center gap-3 w-full">
          <div className="shrink-0 rounded-xl flex flex-col items-center justify-center px-3 py-2"
            style={{
              minWidth: 60,
              background: pasado ? "#f3f4f6" : "linear-gradient(135deg, #e8eef8 0%, #d4e0f5 100%)",
              color: pasado ? "#9ca3af" : "var(--azul-egm)",
            }}>
            <span className="text-2xl font-bold leading-none">{fechaIni.getDate()}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider leading-none mt-1">
              {fechaIni.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-snug" style={{ color: "#111827" }}>
              {evento.titulo}
            </h3>
            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
              {formatFecha(evento.fechaInicio)} · {formatHoras(evento)}
            </p>
          </div>
        </div>

        {/* 3. Imagen */}
        {evento.imagenUrl && (
          <div className="relative w-full overflow-hidden rounded-xl mt-1" style={{ aspectRatio: "16 / 9", background: "#f1f5f9" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={evento.imagenUrl} alt={evento.titulo} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}

        {/* 4. Descripción */}
        {evento.descripcion && (
          <p className="text-xs leading-relaxed line-clamp-3 mt-1" style={{ color: "#6b7280" }}>
            {evento.descripcion}
          </p>
        )}

        {/* Scope global / empresa */}
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            style={{ color: evento.esGlobal ? "var(--azul-egm)" : "var(--verde-oliva)", flexShrink: 0 }}>
            {evento.esGlobal ? (
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            )}
          </svg>
          <span className="text-xs font-medium" style={{ color: evento.esGlobal ? "var(--azul-egm)" : "var(--verde-oliva)" }}>
            {evento.esGlobal ? "EGM Atalayas (global)" : "Tu empresa"}
          </span>
        </div>

        {/* 5. Lugar + botón Ver ubicación */}
        {evento.lugar && (
          <p className="text-xs inline-flex items-center gap-1.5 line-clamp-1" style={{ color: "#6b7280" }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              style={{ color: "#9ca3af", flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{evento.lugar}</span>
          </p>
        )}
        {evento.latitud != null && evento.longitud != null && (
          <button
            type="button"
            onClick={() => onVerUbicacion(evento)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--azul-egm-light)"; }}
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Ver ubicación
          </button>
        )}
      </div>
    </div>
  );
}

function MenuBtn({ label, icon, danger = false, onClick }: {
  label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "10px", width: "100%",
        padding: "7px 10px", borderRadius: "10px", border: "none", cursor: "pointer",
        background: hov ? (danger ? "rgba(239,68,68,0.07)" : "rgba(0,0,0,0.045)") : "transparent",
        transition: "background 0.15s",
      }}
    >
      <span style={{ width: 28, height: 28, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: danger ? "rgba(239,68,68,0.07)" : "rgba(0,0,0,0.05)", color: danger ? "#ef4444" : "#374151", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: danger ? "#ef4444" : "#111827" }}>{label}</span>
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ color: danger ? "#ef4444" : "#9ca3af" }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="rounded-xl shrink-0" style={{ width: 46, height: 46, background: "#e5e7eb" }} />
        <div className="flex-1 flex flex-col gap-2">
          <div style={{ height: 14, width: "55%", background: "#e5e7eb", borderRadius: 6 }} />
          <div style={{ height: 11, width: "35%", background: "#f3f4f6", borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function EventosPage() {
  const { usuario } = useAuth();
  const esSuperAdmin  = usuario?.codigoRol === "ROLE_ADMIN";
  const esAdminEmpresa = usuario?.codigoRol === "ROLE_ADMIN_EMPRESA";
  const puedeEditar   = esSuperAdmin || esAdminEmpresa;

  const [eventos,    setEventos]    = useState<ComunidadEvento[]>([]);
  const [cargando,   setCargando]   = useState(true);
  const [toast,      setToast]      = useState<{ msg: string; tipo: "ok" | "err" } | null>(null);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editando,   setEditando]   = useState<ComunidadEvento | null>(null);
  const [verUbicacion, setVerUbicacion] = useState<ComunidadEvento | null>(null);

  const mostrarToast = useCallback((msg: string, tipo: "ok" | "err" = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const cargar = useCallback(() => {
    setCargando(true);
    getEventosComunidad()
      .then(setEventos)
      .catch(() => mostrarToast("Error al cargar los eventos", "err"))
      .finally(() => setCargando(false));
  }, [mostrarToast]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleDesactivar(evento: ComunidadEvento) {
    if (!confirm(`¿Cancelar el evento "${evento.titulo}"?`)) return;
    try {
      await desactivarEventoComunidad(evento.eventoId);
      setEventos(prev => prev.filter(e => e.eventoId !== evento.eventoId));
      mostrarToast("Evento cancelado");
    } catch {
      mostrarToast("Error al cancelar el evento", "err");
    }
  }

  function handleEditar(ev: ComunidadEvento) { setEditando(ev); setModalOpen(true); }
  function handleNuevo()                    { setEditando(null); setModalOpen(true); }
  function handleGuardado() {
    setModalOpen(false);
    setEditando(null);
    cargar();
    mostrarToast("Evento guardado");
  }

  // Separar próximos/en curso de pasados
  const activos  = eventos.filter(e => calcEstado(e) !== "FINALIZADO");
  const pasados  = eventos.filter(e => calcEstado(e) === "FINALIZADO");

  // Ordenar: futuros ascendente, pasados descendente
  activos.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
  pasados.sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());

  return (
    <div className="flex flex-col gap-6 pb-10">
      <DashboardHero
        titulo="Eventos"
        subtitulo="Actividades, jornadas y encuentros del área empresarial EGM Atalayas."
        variante="seccion"
        imagenFondo="/eventos-banner.png"
        tituloSize="clamp(3.5rem, 7vw, 6rem)"
      />
      {puedeEditar && (
        <div className="px-4 sm:px-6 lg:px-8 -mt-2 flex justify-end">
          <Button variant="primary" onClick={handleNuevo}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="mr-1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo evento
          </Button>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-8">

        {/* Próximos / en curso */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#9ca3af" }}>
            Próximos
          </h2>
          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : activos.length === 0 ? (
            <div className="rounded-2xl flex flex-col items-center justify-center py-14 gap-3"
              style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.06)" }}>
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} style={{ color: "#d1d5db" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p className="text-sm" style={{ color: "#9ca3af" }}>No hay eventos próximos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activos.map(e => (
                <EventoCard key={e.eventoId} evento={e} puedeEditar={puedeEditar}
                  onEditar={handleEditar}
                  onDesactivar={handleDesactivar}
                  onVerUbicacion={setVerUbicacion}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pasados */}
        {!cargando && pasados.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#9ca3af" }}>
              Anteriores
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pasados.map(e => (
                <EventoCard key={e.eventoId} evento={e} puedeEditar={puedeEditar}
                  onEditar={handleEditar}
                  onDesactivar={handleDesactivar}
                  onVerUbicacion={setVerUbicacion}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <ModalEvento
          evento={editando}
          esSuperAdmin={esSuperAdmin}
          onClose={() => { setModalOpen(false); setEditando(null); }}
          onGuardado={handleGuardado}
        />
      )}

      {/* Modal Ver ubicación */}
      {verUbicacion && verUbicacion.latitud != null && verUbicacion.longitud != null && (
        <ModalUbicacion
          titulo={verUbicacion.titulo}
          lugar={verUbicacion.lugar}
          latitud={verUbicacion.latitud}
          longitud={verUbicacion.longitud}
          onClose={() => setVerUbicacion(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: `calc(28px + env(safe-area-inset-bottom))`,
          left: "50%", transform: "translateX(-50%)", zIndex: 99999,
          background: toast.tipo === "ok" ? "#111827" : "#dc2626",
          color: "#fff", borderRadius: "14px", padding: "12px 20px",
          fontSize: "0.875rem", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          animation: "toast-in 0.25s cubic-bezier(0.34,1.20,0.64,1) both",
          whiteSpace: "nowrap",
        }}>
          <style>{`@keyframes toast-in { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
          {toast.tipo === "ok"
            ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}
