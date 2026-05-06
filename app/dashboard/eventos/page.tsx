"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardHero from "@/components/ui/DashboardHero";
import { Button }    from "@/components/ui/Button";
import { useAuth }   from "@/context/AuthContext";
import { getEventos, desactivarEvento } from "@/lib/api/eventos";
import type { Evento, EstadoEvento } from "@/lib/types/eventos";

// ── Mock ──────────────────────────────────────────────────────────────────────
const hoy = new Date();
const fmt  = (d: Date) => d.toISOString().slice(0, 10);
const add  = (days: number) => { const d = new Date(hoy); d.setDate(d.getDate() + days); return d; };

const MOCK_EVENTOS: Evento[] = [
  {
    eventoId: "e1", titulo: "Semana de la Movilidad Sostenible",
    descripcion: "Jornadas de concienciación sobre movilidad sostenible en el área empresarial: talleres, exhibiciones y actividades para fomentar el transporte verde.",
    fecha: fmt(add(12)), horaInicio: "09:00", horaFin: "18:00",
    lugar: "Edificio central EGM Atalayas", urlInfo: "https://atalayas.com/semana-de-la-movilidad/",
    imagenUrl: null, estado: "PROXIMO",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  {
    eventoId: "e2", titulo: "En Femenino — Mesa redonda de liderazgo",
    descripcion: "Encuentro de referentes femeninas del área empresarial para debatir sobre el papel de la mujer en el desarrollo económico y social.",
    fecha: fmt(add(25)), horaInicio: "10:30", horaFin: "13:00",
    lugar: "Aula de formación EGM Atalayas", urlInfo: "https://atalayas.com/en-femenino/",
    imagenUrl: null, estado: "PROXIMO",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  {
    eventoId: "e3", titulo: "100 Estudiantes · 20 Empresarios",
    descripcion: "Programa de networking entre jóvenes estudiantes y líderes empresariales del área. Una oportunidad para conectar talento emergente con el tejido empresarial.",
    fecha: fmt(add(40)), horaInicio: "16:00", horaFin: "19:00",
    lugar: "Polígono Industrial Las Atalayas", urlInfo: "https://atalayas.com/100-estudiantes-20-empresarios/",
    imagenUrl: null, estado: "PROXIMO",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  {
    eventoId: "e4", titulo: "Jornada de Empresas Solidarias",
    descripcion: "Entrega anual de lotes solidarios a familias en situación de vulnerabilidad, organizada por las empresas del área.",
    fecha: fmt(add(-15)), horaInicio: "11:00", horaFin: "14:00",
    lugar: "Edificio central EGM Atalayas", urlInfo: "https://atalayas.com/empresas-solidarias/",
    imagenUrl: null, estado: "FINALIZADO",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<EstadoEvento, { label: string; bg: string; color: string }> = {
  PROXIMO:    { label: "Próximo",    bg: "rgba(59,130,246,0.09)",  color: "#2563eb" },
  EN_CURSO:   { label: "En curso",   bg: "rgba(16,185,129,0.09)", color: "#059669" },
  FINALIZADO: { label: "Finalizado", bg: "rgba(0,0,0,0.06)",       color: "#6b7280" },
  CANCELADO:  { label: "Cancelado",  bg: "rgba(239,68,68,0.09)",   color: "#dc2626" },
};

function calcEstado(evento: Evento): EstadoEvento {
  if (evento.estado) return evento.estado;
  const fecha = new Date(evento.fecha);
  const hoyMs = new Date().setHours(0, 0, 0, 0);
  if (fecha.getTime() > hoyMs) return "PROXIMO";
  if (fecha.getTime() === hoyMs) return "EN_CURSO";
  return "FINALIZADO";
}

function formatFecha(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ── Card de evento ────────────────────────────────────────────────────────────
function EventoCard({
  evento, esSuperAdmin, onEditar, onDesactivar,
}: {
  evento: Evento; esSuperAdmin: boolean;
  onEditar: (e: Evento) => void; onDesactivar: (e: Evento) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const estado  = calcEstado(evento);
  const cfg     = ESTADO_CONFIG[estado];
  const pasado  = estado === "FINALIZADO" || estado === "CANCELADO";

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
      {/* Franja de fecha */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {/* Bloque día */}
        <div className="shrink-0 rounded-xl flex flex-col items-center justify-center"
          style={{ width: 46, height: 46, background: pasado ? "#f3f4f6" : "linear-gradient(135deg, #e8eef8 0%, #d4e0f5 100%)", color: pasado ? "#9ca3af" : "var(--azul-egm)" }}>
          <span className="text-lg font-bold leading-none">{new Date(evento.fecha + "T00:00:00").getDate()}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide leading-none mt-0.5">
            {new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-ES", { month: "short" })}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-snug text-sm" style={{ color: "#111827" }}>
            {evento.titulo}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
            {formatFecha(evento.fecha)}
            {evento.horaInicio && ` · ${evento.horaInicio}${evento.horaFin ? ` – ${evento.horaFin}` : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Badge estado */}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>

          {/* Menú superadmin */}
          {esSuperAdmin && (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(p => !p)}
                className="flex items-center justify-center rounded-lg"
                style={{ width: 30, height: 30, background: menuOpen ? "rgba(0,0,0,0.06)" : "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
                onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = "transparent"; }}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)", width: "180px", zIndex: 20,
                  background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "14px",
                  boxShadow: "0 8px 28px rgba(0,0,0,0.12)", padding: "6px",
                }}>
                  <MenuBtn label="Editar" onClick={() => { setMenuOpen(false); onEditar(evento); }}
                    icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>} />
                  <MenuBtn label="Cancelar" danger onClick={() => { setMenuOpen(false); onDesactivar(evento); }}
                    icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cuerpo */}
      {(evento.descripcion || evento.lugar) && (
        <>
          <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "0 16px" }} />
          <div className="px-4 py-3 flex flex-col gap-2">
            {evento.descripcion && (
              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#6b7280" }}>
                {evento.descripcion}
              </p>
            )}
            {evento.lugar && (
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "#9ca3af", flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span className="text-xs" style={{ color: "#9ca3af" }}>{evento.lugar}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      {evento.urlInfo && (
        <div className="px-4 pb-4 mt-auto">
          <a href={evento.urlInfo} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: "var(--azul-egm)" }}>
            Más información
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        </div>
      )}
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
  const esSuperAdmin = usuario?.codigoRol === "ROLE_ADMIN";

  const [eventos,   setEventos]   = useState<Evento[]>([]);
  const [cargando,  setCargando]  = useState(true);
  const [toast,     setToast]     = useState<{ msg: string; tipo: "ok" | "err" } | null>(null);

  const mostrarToast = useCallback((msg: string, tipo: "ok" | "err" = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    const useMock = true; // ← false cuando el backend esté listo
    if (useMock) {
      setTimeout(() => { setEventos(MOCK_EVENTOS); setCargando(false); }, 500);
      return;
    }
    getEventos()
      .then(setEventos)
      .catch(() => mostrarToast("Error al cargar los eventos", "err"))
      .finally(() => setCargando(false));
  }, [mostrarToast]);

  async function handleDesactivar(evento: Evento) {
    try {
      await desactivarEvento(evento.eventoId);
      setEventos(prev => prev.filter(e => e.eventoId !== evento.eventoId));
      mostrarToast("Evento cancelado");
    } catch {
      mostrarToast("Error al cancelar el evento", "err");
    }
  }

  // Separar próximos de pasados
  const proximos  = eventos.filter(e => calcEstado(e) !== "FINALIZADO" && calcEstado(e) !== "CANCELADO");
  const pasados   = eventos.filter(e => calcEstado(e) === "FINALIZADO" || calcEstado(e) === "CANCELADO");

  return (
    <div className="flex flex-col gap-6 pb-10">
      <DashboardHero
        titulo="Eventos"
        subtitulo="Actividades, jornadas y encuentros del área empresarial EGM Atalayas."
        variante="seccion"
      />
      {esSuperAdmin && (
        <div className="px-4 sm:px-6 lg:px-8 -mt-2">
          <Button variant="primary" onClick={() => mostrarToast("Próximamente — modal de evento")}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="mr-1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo evento
          </Button>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-8">

        {/* Próximos */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#9ca3af" }}>
            Próximos
          </h2>
          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : proximos.length === 0 ? (
            <div className="rounded-2xl flex flex-col items-center justify-center py-14 gap-3"
              style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.06)" }}>
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} style={{ color: "#d1d5db" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p className="text-sm" style={{ color: "#9ca3af" }}>No hay eventos próximos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {proximos.map(e => (
                <EventoCard key={e.eventoId} evento={e} esSuperAdmin={esSuperAdmin}
                  onEditar={() => mostrarToast("Próximamente — editar evento")}
                  onDesactivar={handleDesactivar}
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
                <EventoCard key={e.eventoId} evento={e} esSuperAdmin={esSuperAdmin}
                  onEditar={() => mostrarToast("Próximamente — editar evento")}
                  onDesactivar={handleDesactivar}
                />
              ))}
            </div>
          </section>
        )}
      </div>

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
