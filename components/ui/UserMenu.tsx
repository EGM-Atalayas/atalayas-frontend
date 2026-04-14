"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";

interface UserMenuProps {
  nombreMostrado: string;
  empresaNombre?: string;
  initials: string;
  logoEmpresa?: string;
  onPerfil: () => void;
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
  onPerfil,
  onCerrarSesion,
}: UserMenuProps) {
  const [open, setOpen]       = useState(false);
  const [visible, setVisible] = useState(false);
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

  function handleAction(action: "perfil" | "logout") {
    closeMenu();
    if (action === "perfil") onPerfil();
    else onCerrarSesion();
  }

  return (
    <div className="hidden sm:block relative" ref={containerRef}>
      {/* Trigger */}
      <button
        onClick={toggle}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div
          className="rounded-full flex items-center justify-center font-bold select-none shrink-0 text-sm overflow-hidden"
          style={{
            width:      "36px",
            height:     "36px",
            background: "rgba(255,255,255,0.15)",
            color:      "var(--blanco)",
            border:     "2px solid rgba(255,255,255,0.5)",
          }}
        >
          {logoEmpresa ? (
            <Image src={logoEmpresa} alt="Logo empresa" width={36} height={36}
              className="object-cover rounded-full" />
          ) : initials}
        </div>

        <span className="text-sm font-semibold max-w-[110px] truncate"
          style={{ color: "rgba(255,255,255,0.9)" }}>
          {nombreMostrado}
        </span>

        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {visible && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 z-[200] will-change-transform"
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
                {initials}
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
