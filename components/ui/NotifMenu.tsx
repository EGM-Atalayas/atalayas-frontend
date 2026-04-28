"use client";

import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { API_URL } from "@/lib/api"; // <-- Asegúrate de tener esto importado
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
  
  // ── ESTADO PARA EL POLLING DEL CONTADOR ──
  const [contadorNotifs, setContadorNotifs] = useState(noLeidas);

  // 1. Efecto Polling (Llama al endpoint de César cada 30s)
  useEffect(() => {
    const revisarContador = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await fetch(`${API_URL}/notificaciones/me/contador`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          // Ajusta 'data' según lo que devuelva tu backend (ej: data.contador, data.count, o solo data)
          const cantidad = typeof data === "number" ? data : (data.contador || data.count || 0);
          setContadorNotifs(cantidad);
        }
      } catch (error) {
        console.error("❌ Error revisando contador:", error);
      }
    };

    // Llamamos nada más cargar la web
    revisarContador();

    // Lo programamos cada 30 segundos (30000 milisegundos)
    const intervalo = setInterval(revisarContador, 30000);

    return () => clearInterval(intervalo);
  }, []);

  // 2. Efecto para los anuncios (como lo tenías)
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
    if (cards.length > 0) {
      gsap.set(cards, { y: 20, opacity: 0 });
    }
    const tl = gsap.timeline({ paused: true });
    tl.to(dropdownRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" });
    if (cards.length > 0) {
      tl.to(cards, { y: 0, opacity: 1, duration: 0.3, ease: "power3.out", stagger: 0.07 }, "-=0.08");
    }
    tlRef.current = tl;
    tl.play();
    return () => { tl.kill(); };
  }, [visible, notificaciones]);

  // 3. Al abrir, hacemos la petición pesada de la lista
  async function openMenu() {
    const ultimaVisita = localStorage.getItem("notif_ultima_visita");
    const ahora = new Date().toISOString();

    try {
      // AQUÍ OCURRE EL GET /me?page=0&size=20 a través de tu función
      const [notifs, anunciosData] = await Promise.all([
        getNotificacionesNoLeidas(),
        getNoticias(),
      ]);

      const anunciosNuevos = ultimaVisita
        ? anunciosData.filter(a => new Date(a.creadoEn) > new Date(ultimaVisita))
        : anunciosData.slice(0, 3);

      setNotificaciones(notifs);
      setAnuncios(anunciosNuevos);
      localStorage.setItem("notif_ultima_visita", ahora);
      setVisible(true);
      setOpen(true);
    } catch (error) {
      console.error("❌ [NotifMenu] Error cargando notificaciones completas:", error);
    }
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
    setContadorNotifs(prev => Math.max(0, prev - 1)); // Restamos 1 al contador visual
    onMarcarLeidas();
    closeMenu();
    if (notif.enlace) {
      const enlace = notif.enlace.replace("/formacion/modulo/", "/dashboard/formacion/");
      router.push(enlace);
    }
  }

  async function handleMarcarTodas() {
    await marcarTodasLeidas();
    setNotificaciones([]);
    setContadorNotifs(0); // Ponemos a 0 el contador visual
    onMarcarLeidas();
  }

  function getIconoPorTipo(tipo: string) {
    switch (tipo) {
      case "MODULO": return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
      case "ANUNCIO": return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 11l19-9-9 19-2-8-8-2z" /></svg>;
      case "SOLICITUD_EMPRESA": return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 5 7 13" /><line x1="7" y1="9" x2="17" y2="9" /></svg>;
      case "EMPRESA_APROBADA": return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case "EMPRESA_RECHAZADA": return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2.59-2.59m0 0l2.59-2.59m-5.18 5.18l-2.59-2.59m5.18 0l2.59 2.59M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>;
      default: return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    }
  }

  function getColorPorTipo(tipo: string): string {
    switch (tipo) {
      case "SOLICITUD_EMPRESA": return "#3b82f6";
      case "EMPRESA_APROBADA": return "#10b981";
      case "EMPRESA_RECHAZADA": return "#ef4444";
      case "MODULO":
      case "ANUNCIO": return "#8b5cf6";
      default: return "#6b7280";
    }
  }

  // Ahora el total visual suma los anuncios + nuestro contador asíncrono
  const totalNuevas = contadorNotifs + anunciosNuevosCount;

  return (
    <div className="relative h-full" ref={containerRef}>
      {/* ── BOTÓN DE LA CAMPANITA ── */}
      <button
        onClick={toggle}
        className="relative flex items-center justify-center h-full px-4 border-none cursor-pointer group"
        style={{
          background: "transparent",
          color: hovered || open ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.7)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Notificaciones"
      >
        <div className={`p-2 rounded-full transition-colors ${open ? "bg-white/10" : "group-hover:bg-white/10"}`}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        {/* El famoso puntito rojo alimentado por el polling */}
        {totalNuevas > 0 && (
          <span className="absolute top-3 right-3 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm animate-pulse" 
                style={{ background: "#ef4444", border: "2px solid var(--azul-egm)" }}>
            {totalNuevas > 99 ? "99+" : totalNuevas}
          </span>
        )}
      </button>

      {/* ── PANEL DESPLEGABLE ── */}
      {visible && (
        <div ref={dropdownRef} className="absolute right-0 top-full mt-2 z-50 will-change-transform" style={{ width: "380px" }}>
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
            
            <div className="px-5 py-4 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
              {notificaciones.length > 0 && (
                <button onClick={handleMarcarTodas} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                  Marcar todas leídas
                </button>
              )}
            </div>

            <div className="flex flex-col p-2 max-h-[400px] overflow-y-auto bg-white">
              {notificaciones.length === 0 && anuncios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="p-3 bg-slate-50 rounded-full mb-3 text-slate-300">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-600">Todo al día</p>
                  <p className="text-xs mt-1 text-slate-400">No hay avisos ni solicitudes pendientes.</p>
                </div>
              ) : (
                <>
                  {notificaciones.map((notif, idx) => {
                    const color = getColorPorTipo(notif.tipo);
                    return (
                      <div
                        key={notif.notificacionId}
                        ref={(el) => { if (el) cardsRef.current[idx] = el; }}
                        onClick={() => handleClickNotificacion(notif)}
                        className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100 group"
                      >
                        <div className="shrink-0 p-2.5 rounded-full mt-0.5 transition-transform group-hover:scale-105" 
                             style={{ backgroundColor: `${color}15`, color: color }}>
                          {getIconoPorTipo(notif.tipo)}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 leading-snug mb-1">
                            {notif.mensaje}
                          </p>
                          <p className="text-[11px] font-medium text-slate-400">
                            {new Date(notif.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                      </div>
                    );
                  })}

                  {anuncios.length > 0 && (
                    <>
                      <div className="px-3 pt-4 pb-2 mt-2 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Comunicados recientes
                        </p>
                      </div>
                      {anuncios.map((anuncio, idx) => (
                        <div
                          key={anuncio.anuncioId}
                          ref={(el) => { if (el) cardsRef.current[notificaciones.length + idx] = el; }}
                          onClick={() => { closeMenu(); router.push("/dashboard/noticias"); }}
                          className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-100 group"
                        >
                          <div className="shrink-0 p-2.5 rounded-full bg-slate-100 text-slate-500 mt-0.5 transition-transform group-hover:scale-105">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l19-9-9 19-2-8-8-2z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 leading-snug mb-0.5 truncate">
                              {anuncio.titulo}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-1 mb-1">{anuncio.contenido}</p>
                            <p className="text-[11px] font-medium text-slate-400">
                              {new Date(anuncio.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
            
            {(notificaciones.length > 0 || anuncios.length > 0) && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                <button 
                  onClick={() => { closeMenu(); router.push("/superadmin/comunicados"); }} 
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Ir al panel general
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}