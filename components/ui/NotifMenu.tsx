"use client";

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { getNotificacionesNoLeidas, marcarNotificacionLeida, marcarTodasLeidas, type Notificacion } from "@/lib/api/notifusuario";
import { getNoticias } from "@/lib/api/noticias";
import type { Noticia } from "@/lib/types/noticias";

interface NotifMenuProps {
  noLeidas: number;
  onMarcarLeidas: () => void;
}

export default function NotifMenu({ noLeidas, onMarcarLeidas }: NotifMenuProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const router = useRouter();
  const [anuncios, setAnuncios] = useState<Noticia[]>([]);
  const [anunciosNuevosCount, setAnunciosNuevosCount] = useState(0);

  useEffect(() => {
    const ultimaVisita = localStorage.getItem("notif_ultima_visita");
    if (!ultimaVisita) return;
    getNoticias().then(data => {
      const nuevos = data.filter(a => new Date(a.creadoEn) > new Date(ultimaVisita));
      setAnunciosNuevosCount(nuevos.length);
    });
  }, []);

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
    gsap.set(cards, { y: 20, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(dropdownRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" });
    tl.to(cards, { y: 0, opacity: 1, duration: 0.3, ease: "power3.out", stagger: 0.07 }, "-=0.08");
    tlRef.current = tl;
    tl.play();
    return () => { tl.kill(); };
  }, [visible, notificaciones]);

  async function openMenu() {
    const ultimaVisita = localStorage.getItem("notif_ultima_visita");
    const ahora = new Date().toISOString();

    const [notifs, anunciosData] = await Promise.all([
      getNotificacionesNoLeidas(),
      getNoticias(),
    ]);

    console.log("ultimaVisita:", ultimaVisita);
    console.log("anunciosData:", anunciosData.length);

    const anunciosNuevos = ultimaVisita
      ? anunciosData.filter(a => new Date(a.creadoEn) > new Date(ultimaVisita))
      : anunciosData.slice(0, 3);

    console.log("anunciosNuevos:", anunciosNuevos.length);

    setNotificaciones(notifs);
    setAnuncios(anunciosNuevos);
    localStorage.setItem("notif_ultima_visita", ahora);
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
      openMenu();
    }
  }

  async function handleClickNotificacion(notif: Notificacion) {
    await marcarNotificacionLeida(notif.notificacionId);
    onMarcarLeidas();
    closeMenu();
    if (notif.enlace) {
      const enlace = notif.enlace
        .replace("/formacion/modulo/", "/dashboard/formacion/");
      router.push(enlace);
    }
  }

  async function handleMarcarTodas() {
    await marcarTodasLeidas();
    setNotificaciones([]);
    onMarcarLeidas();
  }

  function getIconoPorTipo(tipo: string) {
    switch (tipo) {
      case "MODULO":
        return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
      case "ANUNCIO":
        return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 11l19-9-9 19-2-8-8-2z" /></svg>;
      default:
        return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    }
  }

  return (
    <div className="relative h-full" ref={containerRef}>
      <button
        onClick={toggle}
        className="relative flex items-center justify-center h-full px-4 border-none cursor-pointer"
        style={{
          background: "transparent",
          color: hovered ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.6)",
          transition: "color 0.15s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Notificaciones"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {(noLeidas + anunciosNuevosCount) > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none" style={{ background: "var(--error)" }}>
            {(noLeidas + anunciosNuevosCount) > 99 ? "99+" : noLeidas + anunciosNuevosCount}
          </span>
        )}
      </button>

      {visible && (
        <div ref={dropdownRef} className="absolute right-0 top-full mt-1 z-200 will-change-transform" style={{ width: "380px" }}>
          <div className="rounded-xl overflow-hidden shadow-2xl" style={{ border: "1px solid #e5e7eb" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <p className="text-sm font-semibold" style={{ color: "#111827" }}>Notificaciones</p>
              {notificaciones.length > 0 && (
                <button onClick={handleMarcarTodas} className="text-xs font-medium" style={{ color: "#6b7280" }}>
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 p-2" style={{ background: "#f3f4f6", maxHeight: "360px", overflowY: "auto" }}>
              {/* Notificaciones */}
              {notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm font-medium" style={{ color: "#6b7280" }}>Todo al día</p>
                  <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>Sin notificaciones nuevas</p>
                </div>
              ) : (
                notificaciones.map((notif, idx) => (
                  <div
                    key={notif.notificacionId}
                    ref={(el) => { if (el) cardsRef.current[idx] = el; }}
                    onClick={() => handleClickNotificacion(notif)}
                    className="flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                    style={{ background: "#ffffff", color: "#111827" }}
                  >
                    <span className="shrink-0 mt-0.5" style={{ color: "#3b82f6" }}>
                      {getIconoPorTipo(notif.tipo)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug mb-0.5">{notif.mensaje}</p>
                      <p className="text-xs" style={{ color: "#9ca3af" }}>
                        {new Date(notif.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {notif.enlace && (
                      <svg className="ml-auto shrink-0 w-3.5 h-3.5 opacity-50 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    )}
                  </div>
                ))
              )}
              {/* Separador anuncios */}
              {anuncios.length > 0 && (
                <>
                  <div className="px-1 pt-2 pb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                      Comunicados recientes
                    </p>
                  </div>
                  {anuncios.slice(0, 3).map((anuncio, idx) => (
                    <div
                      key={anuncio.anuncioId}
                      ref={(el) => { if (el) cardsRef.current[notificaciones.length + idx] = el; }}
                      onClick={() => { closeMenu(); router.push("/dashboard/noticias"); }}
                      className="flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: "#ffffff", color: "#111827" }}
                    >
                      <span className="shrink-0 mt-0.5" style={{ color: "#6b7280" }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l19-9-9 19-2-8-8-2z" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug mb-0.5 truncate">{anuncio.titulo}</p>
                        <p className="text-xs line-clamp-1" style={{ color: "#9ca3af" }}>{anuncio.contenido}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#d1d5db" }}>
                          {new Date(anuncio.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <svg className="ml-auto shrink-0 w-3.5 h-3.5 opacity-50 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                      </svg>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}