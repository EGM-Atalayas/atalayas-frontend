"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface NotifMenuProps {
  noLeidas: number;
  onVerTodas: () => void;
  onMarcarLeidas: () => void;
}

export default function NotifMenu({ noLeidas, onVerTodas, onMarcarLeidas }: NotifMenuProps) {
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

  // Animate in whenever dropdown mounts
  useLayoutEffect(() => {
    if (!visible || !dropdownRef.current) return;

    const cards = cardsRef.current.filter(Boolean);

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
    tlRef.current.reverse().then(() => { setVisible(false); setOpen(false); });
  }

  function toggle() {
    if (open) {
      closeMenu();
    } else {
      if (noLeidas > 0) onMarcarLeidas();
      openMenu();
    }
  }

  const CARDS = [
    {
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      label:    noLeidas === 0 ? "Todo al día" : `${noLeidas > 99 ? "99+" : noLeidas} sin leer`,
      sublabel: noLeidas === 0 ? "Sin notificaciones nuevas" : `Notificación${noLeidas !== 1 ? "es" : ""} pendiente${noLeidas !== 1 ? "s" : ""}`,
      bg:       "#ffffff",
      color:    noLeidas > 0 ? "#3b82f6" : "#6b7280",
      onClick:  undefined,
    },
    {
      icon: (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label:    "Comunicación",
      sublabel: "Ver todos los comunicados",
      bg:       "#ffffff",
      color:    "#111827",
      onClick:  () => { closeMenu(); onVerTodas(); },
    },
  ];

  return (
    <div className="relative h-full" ref={containerRef}>
      {/* Bell button */}
      <button
        onClick={toggle}
        className="relative flex items-center justify-center h-full px-4 border-none cursor-pointer"
        style={{
          background: "transparent",
          color:      hovered ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.6)",
          transition: "color 0.15s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Notificaciones"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidas > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[16px] h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
            style={{ background: "var(--error)" }}
          >
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {visible && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-1 z-[200] will-change-transform"
          style={{ width: "300px" }}
        >
          <div
            className="rounded-xl overflow-hidden shadow-2xl"
            style={{ border: "1px solid #e5e7eb" }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{
                background:   "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                Notificaciones
              </p>
              <span className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#9ca3af" }}>
                {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </span>
            </div>

            {/* Cards */}
            <div
              className="flex flex-col gap-1.5 p-2"
              style={{ background: "#f3f4f6" }}
            >
              {CARDS.map((card, idx) => (
                <div
                  key={idx}
                  ref={(el) => { if (el) cardsRef.current[idx] = el; }}
                  onClick={card.onClick}
                  className={`flex items-start gap-3 px-3 py-3 rounded-lg select-none transition-opacity hover:opacity-80 ${card.onClick ? "cursor-pointer" : "cursor-default"}`}
                  style={{ background: card.bg, color: card.color }}
                >
                  <span className="shrink-0 mt-0.5">{card.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-none mb-1">{card.label}</p>
                    <p className="text-xs opacity-60 leading-snug">{card.sublabel}</p>
                  </div>
                  {card.onClick && (
                    <svg className="ml-auto shrink-0 w-3.5 h-3.5 opacity-50 mt-0.5" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
