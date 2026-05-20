"use client";

import React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import Link          from "next/link";
import DashboardHero from "@/components/ui/DashboardHero";
import { Button }    from "@/components/ui/Button";
import { getIconoBeneficio } from "@/lib/iconosBeneficio";
import { useAuth } from "@/context/AuthContext";
import { getBeneficios, crearBeneficio, editarBeneficio, desactivarBeneficio } from "@/lib/api/beneficios";
import type { Beneficio, BeneficioInput } from "@/lib/types/beneficios";
import BeneficioModal  from "@/components/ui/BeneficioModal";
import { ModalConfirm } from "@/components/ui/ModalConfirm";

// ── Breadcrumb de vuelta ──────────────────────────────────────────────────────
function BreadcrumbBack({ href, label }: { href: string; label: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2"
      style={{
        color:      hovered ? "var(--azul-egm)" : "#4b5563",
        fontWeight: 500,
        fontSize:   "0.9375rem",   // entre sm y base — más presencia sin ser grande
        transition: "color 0.15s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg
        width="18" height="18" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth={2}
        style={{
          transform:  hovered ? "translateX(-5px)" : "translateX(0)",
          transition: "transform 0.35s cubic-bezier(0.34,1.20,0.64,1)",
        }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

// ── Icono genérico por defecto ────────────────────────────────────────────────
function IconoDefault() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

// ── Badge caducidad ───────────────────────────────────────────────────────────
function BadgeCaducidad({ fechaFin }: { fechaFin: string }) {
  const fecha  = new Date(fechaFin);
  const hoy    = new Date();
  const dias   = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  const caduca = dias <= 30;

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: caduca ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
        color:      caduca ? "#dc2626"               : "#059669",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: caduca ? "#dc2626" : "#059669" }}
      />
      {dias <= 0
        ? "Caducada"
        : `Hasta ${fecha.toLocaleDateString("es-ES", {
            day: "numeric", month: "short",
            year: fecha.getFullYear() !== hoy.getFullYear() ? "numeric" : undefined,
          })}`}
    </span>
  );
}

// ── Ítem de menú contextual (estilo ActionItem de UserMenu) ──────────────────
function CardMenuItem({
  label,
  icon,
  danger = false,
  onClick,
}: {
  label:   string;
  icon:    React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const dangerBg  = "rgba(239,68,68,0.07)";
  const normalBg  = "rgba(0,0,0,0.045)";
  const iconBg    = danger ? "rgba(239,68,68,0.07)" : "rgba(0,0,0,0.05)";
  const iconColor = danger ? "#ef4444" : "#374151";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            "12px",
        width:          "100%",
        padding:        "7px 10px",
        borderRadius:   "10px",
        border:         "none",
        cursor:         "pointer",
        background:     hov ? (danger ? dangerBg : normalBg) : "transparent",
        transition:     "background 0.15s ease",
        textAlign:      "left",
      }}
    >
      {/* Icono en contenedor cuadrado */}
      <span
        style={{
          width:          "28px",
          height:         "28px",
          borderRadius:   "8px",
          background:     iconBg,
          color:          iconColor,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}
      >
        {icon}
      </span>

      {/* Label */}
      <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: danger ? "#ef4444" : "#111827" }}>
        {label}
      </span>

      {/* Chevron */}
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
        style={{ color: danger ? "#ef4444" : "#9ca3af", flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  );
}

// ── Paleta Wallet — degradados vivos premium tipo tarjeta de crédito ──────────
type AcentoWallet = { from: string; to: string };

const PALETA_WALLET: AcentoWallet[] = [
  { from: "#6B21A8", to: "#EC4899" },  // Púrpura → Rosa
  { from: "#1B3F7E", to: "#0891B2" },  // Azul EGM → Cian
  { from: "#15803D", to: "#EAB308" },  // Verde → Amarillo
  { from: "#EA580C", to: "#DC2626" },  // Naranja → Rojo
  { from: "#0891B2", to: "#10B981" },  // Cian → Verde
  { from: "#4338CA", to: "#A855F7" },  // Indigo → Púrpura
  { from: "#BE185D", to: "#F97316" },  // Magenta → Naranja
  { from: "#0F766E", to: "#3B82F6" },  // Teal → Azul
];

// ── Card de beneficio (estilo Wallet) ─────────────────────────────────────────
function BeneficioCard({
  beneficio,
  esSuperAdmin,
  onEditar,
  onDesactivar,
  acento,
}: {
  beneficio:    Beneficio;
  esSuperAdmin: boolean;
  onEditar:     (b: Beneficio) => void;
  onDesactivar: (b: Beneficio) => void;
  acento:       AcentoWallet;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const menuRef                 = useRef<HTMLDivElement>(null);

  // Cerrar menú al clicar fuera
  useEffect(() => {
    if (!menuOpen) return;
    function onOut(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, [menuOpen]);

  const iconoNode = getIconoBeneficio(beneficio.iconoUrl);

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "24px",
        aspectRatio:  "16 / 10",            // proporción de tarjeta de crédito
        background:   `linear-gradient(135deg, ${acento.from} 0%, ${acento.to} 100%)`,
        color:        "#ffffff",
        boxShadow:    hovered
          ? `0 24px 60px ${acento.from}55, 0 8px 24px ${acento.to}40`
          : `0 8px 24px ${acento.from}30, 0 2px 8px rgba(0,0,0,0.08)`,
        transform:    hovered ? "translateY(-6px) scale(1.01)" : "translateY(0) scale(1)",
        transition:   "transform 0.35s cubic-bezier(0.34,1.20,0.64,1), box-shadow 0.35s ease",
        animation:    "heroFadeUp 0.45s ease both",
      }}
    >
      {/* Reflejo brillante en la parte superior */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: "55%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
        }}
      />

      {/* Icono GIGANTE translúcido al fondo (decorativo) */}
      <div
        className="pointer-events-none absolute"
        style={{
          right: "-20px", bottom: "-40px",
          width: 220, height: 220,
          opacity: 0.18,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#ffffff",
        }}
      >
        {iconoNode ? (
          <div style={{ transform: "scale(4.5)" }}>{iconoNode}</div>
        ) : (
          <div style={{ transform: "scale(7)" }}><IconoDefault /></div>
        )}
      </div>

      {/* Patrón decorativo: círculos al fondo */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "-80px", left: "-80px", width: 200, height: 200,
          borderRadius: "50%", background: "rgba(255,255,255,0.08)",
        }}
      />

      {/* Menú admin — esquina sup. derecha */}
      {esSuperAdmin && (
        <div ref={menuRef} className="absolute top-3 right-3 z-10" style={{ position: "absolute" }}>
          <button
            onClick={() => setMenuOpen(p => !p)}
            className="flex items-center justify-center rounded-lg"
            style={{
              width: "32px", height: "32px",
              background: menuOpen ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
              color:      "#ffffff",
              border:     "1px solid rgba(255,255,255,0.20)",
              cursor:     "pointer",
              transition: "background 0.15s ease",
              backdropFilter: "blur(6px)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                width: "200px", zIndex: 20,
                background: "#ffffff",
                border:     "1px solid rgba(0,0,0,0.08)",
                borderRadius: "16px",
                boxShadow:  "0 8px 32px rgba(0,0,0,0.18)",
                overflow:   "hidden",
                padding:    "6px",
                color:      "#111827",
              }}
            >
              <CardMenuItem
                label="Editar"
                danger={false}
                icon={<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>}
                onClick={() => { setMenuOpen(false); onEditar(beneficio); }}
              />
              <CardMenuItem
                label="Desactivar"
                danger
                icon={<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>}
                onClick={() => { setMenuOpen(false); onDesactivar(beneficio); }}
              />
            </div>
          )}
        </div>
      )}

      {/* Contenido principal — top: marca / chip, bottom: detalles */}
      <div className="relative z-[2] flex flex-col h-full px-6 py-5">

        {/* Top: pseudo-chip de tarjeta + caducidad */}
        <div className="flex items-start justify-between gap-3 mb-auto">
          {/* Chip dorado-translúcido tipo tarjeta */}
          <div
            className="rounded-md"
            style={{
              width: 38, height: 28,
              background: "linear-gradient(135deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.16) 100%)",
              border: "1px solid rgba(255,255,255,0.30)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.40)",
            }}
          />
          {beneficio.fechaFin && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(6px)",
              }}
            >
              <BadgeCaducidadWallet fechaFin={beneficio.fechaFin} />
            </span>
          )}
        </div>

        {/* Bottom: título + descripción + footer */}
        <div className="flex flex-col gap-2">
          <h3 className="font-bold leading-tight" style={{ fontSize: "1.5rem", color: "#ffffff", letterSpacing: "-0.01em" }}>
            {beneficio.titulo}
          </h3>
          {beneficio.descripcion && (
            <p className="text-xs leading-snug line-clamp-2" style={{ color: "rgba(255,255,255,0.85)" }}>
              {beneficio.descripcion}
            </p>
          )}

          {/* Footer: enlace + uppercase del beneficio */}
          <div className="flex items-end justify-between gap-3 mt-2 pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.18)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.65)" }}>
              EGM Atalayas · Beneficio
            </p>
            {beneficio.urlInfo && (
              <a
                href={beneficio.urlInfo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "#ffffff" }}
              >
                Usar
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Badge caducidad — versión Wallet (sin fondo, solo texto blanco) */
function BadgeCaducidadWallet({ fechaFin }: { fechaFin: string }) {
  const fecha  = new Date(fechaFin);
  const hoy    = new Date();
  const dias   = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return (
    <>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: dias <= 30 ? "#fca5a5" : "#86efac" }} />
      {dias <= 0
        ? "Caducada"
        : `Hasta ${fecha.toLocaleDateString("es-ES", {
            day: "numeric", month: "short",
            year: fecha.getFullYear() !== hoy.getFullYear() ? "numeric" : undefined,
          })}`}
    </>
  );
}

// ── Tarjeta fantasma ──────────────────────────────────────────────────────────
function GhostCard({ rotate = 0, opacity = 0.45, blur = 1.5, translateY = 0 }: {
  rotate?:     number;
  opacity?:    number;
  blur?:       number;
  translateY?: number;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        width:      "clamp(140px, 28vw, 240px)",
        background: "#ffffff",
        border:     "1px solid rgba(0,0,0,0.11)",
        boxShadow:  "0 4px 20px rgba(0,0,0,0.09)",
        opacity,
        filter:     `blur(${blur}px)`,
        transform:  `rotate(${rotate}deg) translateY(${translateY}px)`,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {/* Cabecera */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e0e7ff", flexShrink: 0 }} />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <div style={{ height: "11px", borderRadius: "6px", background: "#d1d5db", width: "65%" }} />
          <div style={{ height: "9px",  borderRadius: "6px", background: "#e5e7eb", width: "40%" }} />
        </div>
      </div>
      <div style={{ height: "1px", background: "rgba(0,0,0,0.08)", margin: "0 16px" }} />
      {/* Cuerpo */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <div style={{ height: "9px",  borderRadius: "6px", background: "#e5e7eb", width: "100%" }} />
        <div style={{ height: "9px",  borderRadius: "6px", background: "#e5e7eb", width: "80%"  }} />
        <div style={{ height: "9px",  borderRadius: "6px", background: "#e5e7eb", width: "55%"  }} />
      </div>
      {/* Footer */}
      <div className="px-4 pb-4 pt-1">
        <div style={{ height: "9px", borderRadius: "6px", background: "#e0e7ff", width: "35%" }} />
      </div>
    </div>
  );
}

// ── Estado vacío ──────────────────────────────────────────────────────────────
function EstadoVacio({ esSuperAdmin, onNuevo }: { esSuperAdmin: boolean; onNuevo: () => void }) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: "400px", padding: "0 40px" }}>

      {/* Tarjetas fantasma — fondo */}
      <div className="absolute inset-0 flex items-center justify-center gap-5 pointer-events-none px-4">
        <GhostCard rotate={-5} opacity={0.45} blur={1.5} translateY={20} />
        <GhostCard rotate={0}  opacity={0.70} blur={0}   translateY={0}  />
        <GhostCard rotate={5}  opacity={0.45} blur={1.5} translateY={20} />
      </div>

      {/* Gradiente radial — desvanece bordes suavemente */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 65% at 50% 50%, transparent 40%, var(--gris-pagina) 92%)" }}
      />

      {/* Mensaje centrado */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-8 py-7 rounded-3xl"
        style={{
          gap:                  "16px",
          background:           "rgba(245,246,248,0.88)",
          backdropFilter:       "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border:               "1px solid rgba(0,0,0,0.06)",
          boxShadow:            "0 2px 16px rgba(0,0,0,0.04)",
        }}
      >

        {/* Icono con anillos */}
        <div className="relative flex items-center justify-center" style={{ marginBottom: "4px" }}>
          {/* Anillo exterior */}
          <div style={{
            position:     "absolute",
            width:        "84px",
            height:       "84px",
            borderRadius: "50%",
            border:       "1.5px solid rgba(27,63,126,0.18)",
          }} />
          {/* Círculo interior */}
          <div style={{
            width:          "64px",
            height:         "64px",
            borderRadius:   "50%",
            background:     "var(--azul-egm-light)",
            color:          "var(--azul-egm)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}>
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="font-bold" style={{ fontSize: "1.05rem", color: "#111827" }}>
            Sin ventajas publicadas
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#6b7280", maxWidth: "300px" }}>
            {esSuperAdmin
              ? "Publica la primera ventaja para los empleados del área"
              : "Pronto habrá ventajas disponibles para ti"}
          </p>
        </div>

        {esSuperAdmin && (
          <Button onClick={onNuevo} className="mt-1">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva ventaja
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0 }
          100% { background-position:  400px 0 }
        }
        .sk { background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%); background-size: 800px 100%; animation: shimmer 1.4s ease infinite; }
      `}</style>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="px-5 pt-5 pb-3 flex items-start gap-3">
              <div className="sk" style={{ width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0 }} />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="sk" style={{ height: "13px", borderRadius: "6px", width: "60%" }} />
                <div className="sk" style={{ height: "10px", borderRadius: "6px", width: "35%" }} />
              </div>
            </div>
            <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />
            <div className="px-5 py-4 flex flex-col gap-2">
              <div className="sk" style={{ height: "10px", borderRadius: "6px", width: "100%" }} />
              <div className="sk" style={{ height: "10px", borderRadius: "6px", width: "75%" }} />
              <div className="sk" style={{ height: "10px", borderRadius: "6px", width: "50%" }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function VentajasPage() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.codigoRol === "ROLE_ADMIN";

  const [beneficios,  setBeneficios]  = useState<Beneficio[]>([]);
  const [cargando,    setCargando]    = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editando,    setEditando]    = useState<Beneficio | null>(null);
  const [confirmando, setConfirmando] = useState<Beneficio | null>(null);
  const [toast,       setToast]       = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await getBeneficios();
      setBeneficios(data);
    } catch (e) {
      console.error("[Ventajas] Error cargando beneficios:", e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirNuevo()             { setEditando(null); setModalOpen(true); }
  function abrirEditar(b: Beneficio) { setEditando(b);   setModalOpen(true); }

  async function handleGuardar(data: BeneficioInput) {
    if (editando) {
      await editarBeneficio(editando.beneficioId, data);
    } else {
      await crearBeneficio(data);
    }
    // El modal gestiona su propio cierre (toast → onCerrar). Solo recargamos.
    cargar();
  }

  async function handleDesactivar(b: Beneficio) {
    setConfirmando(b);
  }

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function confirmarDesactivar() {
    if (!confirmando) return;
    const titulo = confirmando.titulo;
    try {
      await desactivarBeneficio(confirmando.beneficioId);
      setConfirmando(null);
      cargar();
      mostrarToast(`"${titulo}" desactivada`);
    } catch {
      setConfirmando(null);
      mostrarToast("Error al desactivar. Inténtalo de nuevo.");
    }
  }

  return (
    <div style={{ background: "var(--gris-pagina)", minHeight: "100vh" }}>
      <DashboardHero
        prefijo="Tus"
        titulo="Ventajas"
        imagenFondo="/ventajas-banner.webp"
        objectPosition="center 40%"
        variante="seccion"
        tituloSize="clamp(3.5rem, 7vw, 6rem)"
      />

      <div className="px-5 sm:px-9 lg:px-14 py-8 sm:py-12">

        {/* Barra navegación/acción */}
        <div className="flex items-center justify-end mb-6 sm:mb-8">

          {/* Nueva ventaja — solo SuperAdmin */}
          {esSuperAdmin && (
            <>
              {/* Móvil: solo icono */}
              <button
                onClick={abrirNuevo}
                className="sm:hidden flex items-center justify-center rounded-xl"
                style={{
                  width: "40px", height: "40px",
                  background: "var(--azul-egm)", color: "#fff",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(27,63,126,0.25)",
                }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {/* Tablet+: botón completo */}
              <Button size="lg" onClick={abrirNuevo} className="hidden sm:inline-flex">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nueva ventaja
              </Button>
            </>
          )}
        </div>

        {/* Contenido */}
        {cargando ? (
          <Skeleton />
        ) : beneficios.length === 0 ? (
          <EstadoVacio esSuperAdmin={esSuperAdmin} onNuevo={abrirNuevo} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {beneficios.map((b, i) => (
              <BeneficioCard
                key={b.beneficioId}
                beneficio={b}
                esSuperAdmin={esSuperAdmin}
                onEditar={abrirEditar}
                onDesactivar={handleDesactivar}
                acento={PALETA_WALLET[i % PALETA_WALLET.length]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar — solo SuperAdmin */}
      {esSuperAdmin && modalOpen && (
        <BeneficioModal
          inicial={editando}
          onGuardar={handleGuardar}
          onCerrar={() => setModalOpen(false)}
        />
      )}

      <ModalConfirm
        abierto={!!confirmando}
        titulo="¿Desactivar ventaja?"
        descripcion={confirmando ? `"${confirmando.titulo}" dejará de ser visible para los empleados.` : ""}
        textoConfirmar="Desactivar"
        variante="danger"
        onConfirmar={() => { confirmarDesactivar(); setConfirmando(null); }}
        onCancelar={() => setConfirmando(null)}
      />

      {/* Toast global */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "max(28px, env(safe-area-inset-bottom, 28px))", left: "50%",
          transform: "translateX(-50%)", zIndex: 99999,
          background: "#111827", color: "#ffffff",
          borderRadius: "14px", padding: "12px 20px",
          fontSize: "0.875rem", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          animation: "toast-in 0.25s cubic-bezier(0.34,1.20,0.64,1) both",
          whiteSpace: "nowrap",
        }}>
          <style>{`@keyframes toast-in { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
