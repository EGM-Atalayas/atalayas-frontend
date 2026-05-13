"use client";

import { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { getNotificacionesNoLeidas, marcarNotificacionLeida, marcarTodasLeidas, type Notificacion } from "@/lib/api/notifusuario";

interface NotifMenuProps {
  noLeidas: number;
  onMarcarLeidas: () => void;
}

const POR_PAGINA = 3;

/** Páginas con elipsis */
function getPaginasMostradas(actual: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i);

  const result: (number | "...")[] = [0];
  if (actual <= 2) {
    result.push(1, 2, "...", total - 1);
  } else if (actual >= total - 3) {
    result.push("...", total - 3, total - 2, total - 1);
  } else {
    result.push("...", actual - 1, actual, actual + 1, "...", total - 1);
  }
  return result;
}

export default function NotifMenu({ noLeidas, onMarcarLeidas }: NotifMenuProps) {
  const [open, setOpen]                     = useState(false);
  const [visible, setVisible]               = useState(false);
  const [hovered, setHovered]               = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando]             = useState(false);
  const [paginaActual, setPaginaActual]     = useState(0);
  const [panelPos, setPanelPos]             = useState<{ top: number; right: number; caretRight: number; isMobile: boolean }>({ top: 60, right: 16, caretRight: 21, isMobile: false });
  const containerRef  = useRef<HTMLDivElement>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);
  const listaRef      = useRef<HTMLDivElement>(null);
  const cardsRef      = useRef<HTMLDivElement[]>([]);
  const tlRef         = useRef<gsap.core.Timeline | null>(null);
  const cacheNotifs   = useRef<Notificacion[]>([]); // última respuesta conocida
  const router        = useRouter();

  // ── Contador sincronizado con el polling del Header ──
  const [contadorNotifs, setContadorNotifs] = useState(noLeidas);
  useEffect(() => { setContadorNotifs(noLeidas); }, [noLeidas]);

  // ── Calcular posición del panel (reutilizable en open y en resize) ──
  const calcularPosicion = useCallback(() => {
    if (!containerRef.current) return;
    const rect       = containerRef.current.getBoundingClientRect();
    const vw         = window.innerWidth;
    const isMobile   = vw < 640;
    const panelWidth = Math.min(380, vw - 12);

    let right: number;
    if (isMobile) {
      // Móvil: centrado horizontalmente en pantalla
      right = Math.round((vw - panelWidth) / 2);
    } else {
      // Desktop: alineado con el borde derecho del botón campana
      const rightFromEdge = vw - rect.right;
      right = Math.max(8, Math.min(rightFromEdge, vw - panelWidth - 8));
    }

    // Centro exacto del botón campana desde el borde derecho del panel
    const caretRight = Math.round((vw - right) - (rect.left + rect.width / 2));
    setPanelPos({ top: rect.bottom + 8, right, caretRight, isMobile });
  }, []);

  // ── Recalcular posición al redimensionar si el panel está abierto (F12, rotación…) ──
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", calcularPosicion);
    return () => window.removeEventListener("resize", calcularPosicion);
  }, [open, calcularPosicion]);

  // ── Cerrar menú — definido antes del effect que lo referencia ──
  const closeMenu = useCallback(() => {
    if (!tlRef.current) { setVisible(false); setOpen(false); return; }
    tlRef.current.reverse().then(() => { setVisible(false); setOpen(false); });
  }, []);

  // ── Cierre al clicar fuera ──
  // Como el panel usa position:fixed, comprobamos tanto el botón como el panel
  useLayoutEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const clickEnBoton = containerRef.current?.contains(target);
      const clickEnPanel = dropdownRef.current?.contains(target);
      if (!clickEnBoton && !clickEnPanel) closeMenu();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [closeMenu]);

  // ── Animación de entrada del dropdown ──
  useLayoutEffect(() => {
    if (!visible || !dropdownRef.current) return;
    // Calculamos cuántos items hay en la página actual para truncar refs obsoletos
    const itemsEnPagina = Math.min(POR_PAGINA, Math.max(0, notificaciones.length - paginaActual * POR_PAGINA));
    cardsRef.current = cardsRef.current.slice(0, itemsEnPagina);
    const cards = cardsRef.current.filter(Boolean);
    gsap.set(dropdownRef.current, { opacity: 0, y: -8, scale: 0.97 });
    if (cards.length > 0) gsap.set(cards, { y: 16, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(dropdownRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" });
    if (cards.length > 0) tl.to(cards, { y: 0, opacity: 1, duration: 0.28, ease: "power3.out", stagger: 0.06 }, "-=0.08");
    tlRef.current = tl;
    tl.play();
    return () => { tl.kill(); };
  }, [visible]);

  // ── Animación de cambio de página — slide horizontal según dirección ──
  const animarCambioPagina = useCallback((cb: () => void, direccion: 1 | -1) => {
    if (!listaRef.current) { cb(); return; }
    const xSalida  = direccion === 1 ? -28 : 28;  // sale hacia la izquierda si avanza
    const xEntrada = direccion === 1 ?  28 : -28; // entra desde la derecha si avanza
    gsap.to(listaRef.current, {
      x: xSalida, opacity: 0, duration: 0.18, ease: "power2.in",
      onComplete: () => {
        cb();
        gsap.set(listaRef.current, { x: xEntrada, opacity: 0 });
        requestAnimationFrame(() => {
          gsap.to(listaRef.current, {
            x: 0, opacity: 1, duration: 0.26, ease: "power3.out",
          });
        });
      },
    });
  }, []);

  function cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina === paginaActual) return;
    const direccion = nuevaPagina > paginaActual ? 1 : -1;
    animarCambioPagina(() => setPaginaActual(nuevaPagina), direccion);
  }

  // ── Abrir ──
  async function openMenu() {
    if (open) return;
    calcularPosicion();
    setPaginaActual(0);

    const tieneCaché = cacheNotifs.current.length > 0;
    if (tieneCaché) {
      // Datos conocidos → abre inmediato sin skeleton, refresca en silencio
      setNotificaciones(cacheNotifs.current);
      setCargando(false);
    } else {
      // Primera vez → skeleton hasta que llegue la respuesta
      setNotificaciones([]);
      setCargando(true);
    }

    setVisible(true);
    setOpen(true);

    try {
      const notifs = await getNotificacionesNoLeidas();
      cacheNotifs.current = notifs;
      setNotificaciones(notifs);
    } catch (error) {
      console.error("[NotifMenu] Error cargando notificaciones:", error);
    } finally {
      setCargando(false);
    }
  }

  function toggle() { open ? closeMenu() : openMenu(); }

  // ── Leer notificación ──
  async function handleClickNotificacion(notif: Notificacion) {
    await marcarNotificacionLeida(notif.notificacionId);
    setContadorNotifs(prev => Math.max(0, prev - 1));

    setNotificaciones(prev => {
      const siguiente = prev.filter(n => n.notificacionId !== notif.notificacionId);
      cacheNotifs.current = siguiente;
      const totalPags = Math.ceil(siguiente.length / POR_PAGINA);
      setPaginaActual(p => Math.min(p, Math.max(0, totalPags - 1)));
      return siguiente;
    });

    if (notif.enlace) {
      const enlace = notif.enlace
        .replace("/formacion/modulo/", "/dashboard/formacion/");
      closeMenu();
      router.push(enlace);
    }
  }

  // ── Marcar todas leídas ──
  async function handleMarcarTodas() {
    await marcarTodasLeidas();
    cacheNotifs.current = [];
    setNotificaciones([]);
    setPaginaActual(0);
    setContadorNotifs(0);
    onMarcarLeidas();
  }

  // ── Iconos por tipo ──
  function getIconoPorTipo(tipo: string) {
    switch (tipo) {
      case "MODULO_NUEVO":
        return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
      case "SOLICITUD_EMPRESA":
        return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 11h2m4 0h2M8 15h2m4 0h2" /></svg>;
      case "BIENVENIDA":
        return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
      case "EMPLEADO_NUEVO":
        return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
      case "COMUNICADO_NUEVO":
        return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
      default:
        return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    }
  }

  function getColorPorTipo(tipo: string): string {
    switch (tipo) {
      case "MODULO_NUEVO":      return "#8b5cf6";
      case "SOLICITUD_EMPRESA": return "#3b82f6";
      case "BIENVENIDA":        return "#f59e0b";
      case "EMPLEADO_NUEVO":    return "#10b981";
      case "COMUNICADO_NUEVO":  return "#0ea5e9";
      default:                  return "#6b7280";
    }
  }

  // ── Datos paginados ──
  const totalPaginas  = Math.ceil(notificaciones.length / POR_PAGINA);
  const notifsPagina  = notificaciones.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);
  const hayPaginacion = totalPaginas > 1;

  // Tamaño de botones de paginación: táctil (44px) en móvil, compacto en desktop
  const paginBtnPx = panelPos.isMobile ? 44 : 28;
  const paginArrPx = panelPos.isMobile ? 16 : 12;

  return (
    <div className="relative flex items-center h-full px-1" ref={containerRef}>

      {/* ── Botón campana ── */}
      <button
        onClick={toggle}
        className="relative flex items-center justify-center border-none cursor-pointer"
        style={{
          width: "42px", height: "42px", borderRadius: "11px",
          background: open ? "rgba(255,255,255,0.13)" : hovered ? "rgba(255,255,255,0.10)" : "transparent",
          border:     open || hovered ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
          color:      hovered || open ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.72)",
          transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Notificaciones"
      >
        <svg width="21" height="21" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {contadorNotifs > 0 && (
          <span
            className="absolute min-w-[16px] h-[16px] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none pointer-events-none"
            style={{ top: "-4px", right: "-4px", background: "#ef4444", boxShadow: "0 0 0 2px rgba(0,0,0,0.25)" }}
          >
            {contadorNotifs > 99 ? "99+" : contadorNotifs}
          </span>
        )}
      </button>

      {/* ── Panel desplegable — position:fixed para romper cualquier overflow:hidden del header ── */}
      {visible && (
        <div
          ref={dropdownRef}
          className="will-change-transform z-[300]"
          style={{
            position: "fixed",
            top:      panelPos.top,
            right:    panelPos.right,
            width:    `min(380px, calc(100vw - 12px))`,
          }}
        >

          {/* Caret — apunta al centro exacto del botón campana. Oculto en móvil (panel centrado) */}
          {!panelPos.isMobile && (
            <div style={{ position: "absolute", top: "-6px", right: `${panelPos.caretRight - 6}px`, width: "12px", height: "6px", overflow: "hidden" }}>
              <div style={{ width: "10px", height: "10px", background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", transform: "rotate(45deg) translate(1px, 3px)", boxShadow: "-2px -2px 4px rgba(0,0,0,0.04)" }} />
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>

            {/* ── Cabecera ── */}
            <div className="px-4 py-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-[15px] font-bold shrink-0" style={{ color: "var(--texto-primario)" }}>Notificaciones</h3>
                {contadorNotifs > 0 && (
                  <span className="min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none shrink-0" style={{ background: "#ef4444" }}>
                    {contadorNotifs > 99 ? "99+" : contadorNotifs}
                  </span>
                )}
              </div>
              {notificaciones.length > 0 && (
                <button
                  onClick={handleMarcarTodas}
                  className="text-xs font-semibold shrink-0"
                  style={{ color: "var(--azul-egm)", opacity: 0.75, cursor: "pointer", transition: "opacity 0.15s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.75"; }}
                >
                  Marcar leídas
                </button>
              )}
            </div>

            {/* ── Lista ── */}
            <div className="overflow-hidden">
              <div ref={listaRef} className="flex flex-col pt-1 pb-2 px-2">
              {cargando ? (

                /* Skeleton de carga */
                <div className="flex flex-col gap-1 px-1 py-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex items-center gap-3 px-2 py-2.5 rounded-xl">
                      <div style={{ width: "3px", borderRadius: "2px", background: "var(--gris-borde)", minHeight: "36px", flexShrink: 0 }} />
                      <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "var(--gris-superficie)", flexShrink: 0 }} />
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div style={{ height: "12px", borderRadius: "6px", background: "var(--gris-superficie)", width: `${75 - i * 10}%` }} />
                        <div style={{ height: "10px", borderRadius: "6px", background: "var(--gris-superficie)", width: "40%" }} />
                      </div>
                    </div>
                  ))}
                </div>

              ) : notificaciones.length === 0 ? (

                /* Estado vacío */
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--azul-egm-light)", color: "var(--azul-egm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Todo al día</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--texto-muted)" }}>Te avisaremos cuando tengas novedades</p>
                  </div>
                </div>

              ) : (
                notifsPagina.map((notif, idx) => {
                  const color = getColorPorTipo(notif.tipo);
                  return (
                    <div
                      key={notif.notificacionId}
                      ref={(el) => { if (el) cardsRef.current[idx] = el; }}
                      onClick={() => handleClickNotificacion(notif)}
                      className="flex items-center gap-3 py-2.5 px-2 cursor-pointer active:bg-black/[0.05]"
                      style={{ borderRadius: "var(--radius-sm)", transition: "background 0.12s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Franja izquierda */}
                      <div className="shrink-0 self-stretch" style={{ width: "3px", borderRadius: "2px", background: color, minHeight: "36px" }} />

                      {/* Icono */}
                      <div className="shrink-0 p-2 rounded-lg" style={{ background: `${color}18`, color }}>
                        {getIconoPorTipo(notif.tipo)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug mb-0.5 line-clamp-2" style={{ color: "var(--texto-primario)" }}>
                          {notif.mensaje}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--texto-muted)" }}>
                          {new Date(notif.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      {/* Punto no leída */}
                      <div className="w-2 h-2 rounded-full shrink-0 self-center" style={{ background: color }} />
                    </div>
                  );
                })
              )}
            </div>
            </div>{/* /overflow-hidden */}

            {/* ── Paginación ── */}
            {hayPaginacion && (
              <div className="px-2 py-2.5 flex items-center justify-center gap-0.5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", margin: "0 12px" }}>

                {/* Flecha anterior */}
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 0}
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: `${paginBtnPx}px`, height: `${paginBtnPx}px`,
                    color:      paginaActual === 0 ? "var(--gris-borde)" : "var(--texto-muted)",
                    background: "transparent",
                    cursor:     paginaActual === 0 ? "not-allowed" : "pointer",
                    transition: "background 0.12s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { if (paginaActual > 0) e.currentTarget.style.background = "rgba(0,0,0,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width={paginArrPx} height={paginArrPx} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Números de página */}
                {getPaginasMostradas(paginaActual, totalPaginas).map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`e-${i}`}
                      className="flex items-center justify-center text-xs"
                      style={{ width: `${paginBtnPx}px`, height: `${paginBtnPx}px`, color: "var(--texto-muted)", flexShrink: 0 }}
                    >…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => cambiarPagina(p as number)}
                      className="flex items-center justify-center rounded-lg text-xs font-semibold"
                      style={{
                        width: `${paginBtnPx}px`, height: `${paginBtnPx}px`,
                        background: p === paginaActual ? "var(--azul-egm)" : "transparent",
                        color:      p === paginaActual ? "#ffffff" : "var(--texto-muted)",
                        cursor:     "pointer",
                        transition: "background 0.12s ease",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => { if (p !== paginaActual) e.currentTarget.style.background = "rgba(0,0,0,0.05)"; }}
                      onMouseLeave={(e) => { if (p !== paginaActual) e.currentTarget.style.background = "transparent"; }}
                    >
                      {(p as number) + 1}
                    </button>
                  )
                )}

                {/* Flecha siguiente */}
                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas - 1}
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: `${paginBtnPx}px`, height: `${paginBtnPx}px`,
                    color:      paginaActual === totalPaginas - 1 ? "var(--gris-borde)" : "var(--texto-muted)",
                    background: "transparent",
                    cursor:     paginaActual === totalPaginas - 1 ? "not-allowed" : "pointer",
                    transition: "background 0.12s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { if (paginaActual < totalPaginas - 1) e.currentTarget.style.background = "rgba(0,0,0,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width={paginArrPx} height={paginArrPx} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
