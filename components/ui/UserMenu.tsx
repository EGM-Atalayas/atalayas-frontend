"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";

interface UserMenuProps {
  nombreMostrado: string;
  empresaNombre?: string;
  initials: string;
  logoEmpresa?: string;
  avatarUrl?: string;
  onPerfil: () => void;
  onConfiguracion: () => void;
  onCerrarSesion: () => void;
}

const CARDS = [
  {
    label: "Mi perfil",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    bg: "#ffffff",
    color: "#111827",
    action: "perfil" as const,
  },
  {
    label: "Configuración",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    bg: "#f9fafb",
    color: "#374151",
    action: "configuracion" as const,
  },
  {
    label: "Cerrar sesión",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    bg: "#fff1f2",
    color: "#e11d48",
    action: "logout" as const,
  },
];

export default function UserMenu({
  nombreMostrado,
  empresaNombre,
  initials,
  logoEmpresa,
  avatarUrl,
  onPerfil,
  onConfiguracion,
  onCerrarSesion,
}: UserMenuProps) {
  const [open, setOpen]       = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);
  const dropdownRef           = useRef<HTMLDivElement>(null);
  const cardsRef              = useRef<HTMLDivElement[]>([]);
  const tlRef                 = useRef<gsap.core.Timeline | null>(null);

  // Close on outside click
  useLayoutEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Build / rebuild timeline whenever visibility changes
  useLayoutEffect(() => {
    if (!visible || !dropdownRef.current) return;

    const cards = cardsRef.current.filter(Boolean);

    // Reset
    gsap.set(dropdownRef.current, { opacity: 0, y: -8, scale: 0.97 });
    gsap.set(cards, { y: 20, opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(dropdownRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" });
    tl.to(cards, { y: 0, opacity: 1, duration: 0.3, ease: "power3.out", stagger: 0.07 }, "-=0.08");

    tlRef.current = tl;
    tl.play();

    return () => { tl.kill(); };
  }, [visible]);

  function openMenu() {
    setVisible(true);
    setOpen(true);
  }

  function closeMenu() {
    if (!tlRef.current) { setVisible(false); setOpen(false); return; }
    tlRef.current.reverse().then(() => {
      setVisible(false);
      setOpen(false);
    });
  }

  function toggle() {
    open ? closeMenu() : openMenu();
  }

  function handleAction(action: "perfil" | "configuracion" | "logout") {
    closeMenu();
    if (action === "perfil") onPerfil();
    else if (action === "configuracion") onConfiguracion();
    else onCerrarSesion();
  }

  return (
    <div className="hidden lg:flex relative h-full items-center px-1" ref={containerRef}>
      {/* Trigger */}
      <button
        onClick={toggle}
        className="flex items-center gap-2 border-none cursor-pointer"
        style={{
          height:       "42px",
          padding:      "0 12px 0 6px",
          borderRadius: "11px",
          background:   open
            ? "rgba(255,255,255,0.13)"
            : hovered
              ? "rgba(255,255,255,0.10)"
              : "transparent",
          border:      open || hovered
            ? "1px solid rgba(255,255,255,0.18)"
            : "1px solid transparent",
          transition:  "background 0.15s ease, border-color 0.15s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Avatar / logo / iniciales */}
        <div
          className="rounded-full flex items-center justify-center font-bold select-none shrink-0 text-sm overflow-hidden"
          style={{
            width:      "30px",
            height:     "30px",
            background: "rgba(255,255,255,0.15)",
            color:      "var(--blanco)",
            border:     `2px solid ${hovered || open ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.30)"}`,
            transition: "border-color 0.15s ease",
          }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" width={30} height={30}
              className="object-cover rounded-full" />
          ) : logoEmpresa ? (
            <Image src={logoEmpresa} alt="Logo empresa" width={30} height={30}
              className="object-cover rounded-full" />
          ) : initials}
        </div>

        {/* Nombre */}
        <span
          className="max-w-[110px] truncate whitespace-nowrap hidden lg:block"
          style={{
            fontSize:   "14px",
            fontWeight: 500,
            color:      hovered || open ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.75)",
            transition: "color 0.15s ease",
          }}
        >
          {nombreMostrado}
        </span>

        {/* Chevron */}
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

      {/* Dropdown */}
      {visible && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-1 z-[200] will-change-transform"
          style={{ width: "280px" }}
        >
          {/* Header card — user info */}
          <div
            className="rounded-xl overflow-hidden shadow-2xl"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <div
              className="px-4 py-3 flex items-center gap-3"
              style={{
                background:   "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                className="rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                style={{
                  width:      "32px",
                  height:     "32px",
                  background: "var(--azul-egm)",
                  color:      "#ffffff",
                  border:     "2px solid #e5e7eb",
                }}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" width={32} height={32} className="object-cover rounded-full" />
                ) : initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>
                  {nombreMostrado}
                </p>
                {empresaNombre && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "#6b7280" }}>
                    {empresaNombre}
                  </p>
                )}
              </div>
            </div>

            {/* Action cards */}
            <div
              className="flex flex-col gap-1.5 p-2"
              style={{ background: "#f3f4f6" }}
            >
              {CARDS.map((card, idx) => (
                <div
                  key={card.action}
                  ref={(el) => { if (el) cardsRef.current[idx] = el; }}
                  onClick={() => handleAction(card.action)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-opacity hover:opacity-80 select-none"
                  style={{
                    background: card.bg,
                    color:      card.color,
                  }}
                >
                  <span className="shrink-0">{card.icon}</span>
                  <span className="text-base font-medium">{card.label}</span>
                  <svg className="ml-auto shrink-0 w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
