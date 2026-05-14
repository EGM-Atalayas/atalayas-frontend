"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";

interface UserMenuProps {
  nombreMostrado: string;
  email?: string;
  initials: string;
  avatarUrl?: string;
  onPerfil: () => void;
  onConfiguracion: () => void;
  onCerrarSesion: () => void;
}

const ACCIONES = [
  {
    key:    "perfil" as const,
    label:  "Mi perfil",
    danger: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key:    "configuracion" as const,
    label:  "Configuración",
    danger: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const ICONO_LOGOUT = (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function UserMenu({
  nombreMostrado,
  email,
  initials,
  avatarUrl,
  onPerfil,
  onConfiguracion,
  onCerrarSesion,
}: UserMenuProps) {
  const [open, setOpen]       = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  // Resetear el error cuando cambia la URL (el usuario sube nueva foto)
  const prevAvatarUrl = useRef(avatarUrl);
  if (avatarUrl !== prevAvatarUrl.current) {
    prevAvatarUrl.current = avatarUrl;
    if (imgError) setImgError(false);
  }

  const showAvatar = !!avatarUrl && !imgError;
  const dropdownRef           = useRef<HTMLDivElement>(null);
  const cardsRef              = useRef<HTMLDivElement[]>([]);
  const tlRef                 = useRef<gsap.core.Timeline | null>(null);

  useLayoutEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useLayoutEffect(() => {
    if (!visible || !dropdownRef.current) return;
    const cards = cardsRef.current.filter(Boolean);
    gsap.set(dropdownRef.current, { opacity: 0, y: -8, scale: 0.97 });
    if (cards.length > 0) gsap.set(cards, { y: 12, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(dropdownRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power3.out" });
    if (cards.length > 0) tl.to(cards, { y: 0, opacity: 1, duration: 0.25, ease: "power3.out", stagger: 0.07 }, "-=0.08");
    tlRef.current = tl;
    tl.play();
    return () => { tl.kill(); };
  }, [visible]);

  function openMenu()  { setVisible(true); setOpen(true); }
  function closeMenu() {
    if (!tlRef.current) { setVisible(false); setOpen(false); return; }
    tlRef.current.reverse().then(() => { setVisible(false); setOpen(false); });
  }
  function toggle() { open ? closeMenu() : openMenu(); }

  function handleAccion(key: "perfil" | "configuracion") {
    closeMenu();
    if (key === "perfil") onPerfil();
    else if (key === "configuracion") onConfiguracion();
  }

  return (
    <div className="hidden lg:flex relative h-full items-center px-1" ref={containerRef}>

      {/* ── Trigger ── */}
      <button
        onClick={toggle}
        className="flex items-center gap-2 border-none cursor-pointer"
        style={{
          height:       "42px",
          padding:      "0 12px 0 6px",
          borderRadius: "11px",
          background:   open     ? "rgba(255,255,255,0.13)"
                       : hovered ? "rgba(255,255,255,0.10)"
                       : "transparent",
          border:      open || hovered
            ? "1px solid rgba(255,255,255,0.18)"
            : "1px solid transparent",
          transition:  "background 0.15s ease, border-color 0.15s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="rounded-full flex items-center justify-center font-bold select-none shrink-0 text-xs overflow-hidden"
          style={{
            width:      "30px",
            height:     "30px",
            background: showAvatar ? "transparent" : "rgba(255,255,255,0.15)",
            color:      "#fff",
            border:     `2px solid ${hovered || open ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.30)"}`,
            transition: "border-color 0.15s ease",
          }}
        >
          {showAvatar
            ? <Image src={avatarUrl!} alt="Avatar" width={30} height={30} className="object-cover rounded-full" onError={() => setImgError(true)} />
            : initials}
        </div>

        <span
          className="max-w-[110px] truncate whitespace-nowrap hidden lg:block"
          style={{
            fontSize:   "14px",
            fontWeight: 500,
            color:      hovered || open ? "#fff" : "rgba(255,255,255,0.75)",
            transition: "color 0.15s ease",
          }}
        >
          {nombreMostrado}
        </span>

        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          style={{
            color:      hovered || open ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.50)",
            transition: "color 0.15s ease",
            flexShrink: 0,
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {visible && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 z-[200] will-change-transform"
          style={{ width: "260px" }}
        >
          {/* Caret */}
          <div style={{ position: "absolute", top: "-6px", right: "22px", width: "12px", height: "6px", overflow: "hidden" }}>
            <div style={{ width: "10px", height: "10px", background: "var(--blanco)", border: "1px solid var(--surface-border)", transform: "rotate(45deg) translate(1px, 3px)", boxShadow: "-2px -2px 4px rgba(0,0,0,0.04)" }} />
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {/* ── Info — solo lectura ── */}
            <div className="px-4 py-4 flex items-center gap-3">
              <div
                className="rounded-full flex items-center justify-center font-bold shrink-0 overflow-hidden"
                style={{
                  width:      "46px",
                  height:     "46px",
                  fontSize:   "17px",
                  background: showAvatar ? "transparent" : "var(--azul-egm)",
                  color:      "#fff",
                  border:     "2px solid rgba(0,0,0,0.06)",
                  flexShrink: 0,
                }}
              >
                {showAvatar
                  ? <Image src={avatarUrl!} alt="Avatar" width={46} height={46} className="object-cover rounded-full" onError={() => setImgError(true)} />
                  : initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold truncate" style={{ color: "var(--texto-primario)", lineHeight: 1.3 }}>
                  {nombreMostrado}
                </p>
                {email && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--texto-muted)" }} title={email}>
                    {email}
                  </p>
                )}
              </div>
            </div>

            {/* Separador */}
            <div style={{ height: "1px", background: "var(--surface-border)", margin: "0 16px" }} />

            {/* ── Mi perfil + Configuración + Incidencias ── */}
            <div className="py-2 px-2 flex flex-col gap-0.5">
              {ACCIONES.map((accion, idx) => (
                <ActionItem
                  key={accion.key}
                  label={accion.label}
                  icon={accion.icon}
                  danger={accion.danger}
                  refFn={(el) => { if (el) cardsRef.current[idx] = el; }}
                  onClick={() => handleAccion(accion.key)}
                />
              ))}
            </div>

            {/* Separador antes de cerrar sesión */}
            <div style={{ height: "1px", background: "var(--surface-border)", margin: "0 16px" }} />

            {/* ── Cerrar sesión ── */}
            <div className="py-2 px-2">
              <ActionItem
                label="Cerrar sesión"
                icon={ICONO_LOGOUT}
                danger
                refFn={(el) => { if (el) cardsRef.current[ACCIONES.length] = el; }}
                onClick={() => { closeMenu(); onCerrarSesion(); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ActionItem ── */
function ActionItem({
  label,
  icon,
  danger,
  refFn,
  onClick,
}: {
  label:  string;
  icon:   React.ReactNode;
  danger: boolean;
  refFn:  (el: HTMLDivElement | null) => void;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      ref={refFn}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center gap-3 px-3 py-3 cursor-pointer select-none active:bg-black/[0.05]"
      style={{
        borderRadius: "var(--radius-sm)",
        background: hov
          ? (danger ? "rgba(192,57,43,0.07)" : "rgba(0,0,0,0.045)")
          : "transparent",
        color:      danger ? "var(--error)" : "var(--texto-label)",
        transition: "background 0.15s ease",
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: hov
            ? (danger ? "var(--error-light)" : "rgba(0,0,0,0.07)")
            : (danger ? "rgba(192,57,43,0.06)" : "rgba(0,0,0,0.05)"),
          color:      danger ? "var(--error)" : "var(--texto-muted)",
          transition: "background 0.15s ease",
        }}
      >
        {icon}
      </div>

      <span className="text-[15px] font-medium flex-1">{label}</span>

      <svg
        width="14" height="14" fill="none" viewBox="0 0 24 24"
        stroke="currentColor" strokeWidth={2.5}
        style={{
          color:      danger ? "rgba(192,57,43,0.35)" : "rgba(0,0,0,0.18)",
          opacity:    hov ? 1 : 0.5,
          transition: "opacity 0.15s ease",
        }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}
