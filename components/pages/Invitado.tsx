"use client";

import { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { API_URL } from "@/lib/api";
import { Playfair_Display } from "next/font/google";
import LogoLoop from "@/components/ui/LogoLoop";
import FooterCTA from "@/components/ui/FooterCTA";
import {
  GraduationCap, BookOpen, Network,
  FlaskConical, Sprout, Building2,
  Rocket, Lightbulb, MonitorDot,
  Microchip, Cpu, Factory,
  ChevronDown, Users, Bus, Car, ParkingCircle,
  Bike, Recycle, Heart, Briefcase
} from "lucide-react";
import Colaboradores from "../ui/Colaboradores";
import type { Comunicado, Noticia } from "@/lib/types/noticias";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface ItemLista {
  img: string;
  title: string;
  tag: string;
  day: string;
  month: string;
  year: string;
}

function comunicadoToItem(c: Comunicado): ItemLista {
  const d = new Date(c.fechaPublicacion ?? c.actualizadoEn ?? "");
  return {
    img: c.imagenUrl ?? "/background-invitado.webp",
    title: c.titulo,
    tag: c.categoria ?? "Comunicado",
    day: d.getDate().toString().padStart(2, "0"),
    month: MESES[d.getMonth() + 1],
    year: d.getFullYear().toString(),
  };
}

function anuncioToItem(n: Noticia): ItemLista {
  const d = new Date(n.creadoEn);
  return {
    img: n.imagenUrl ?? "/background-invitado.webp",
    title: n.titulo,
    tag: n.categoria ?? "Noticia",
    day: d.getDate().toString().padStart(2, "0"),
    month: MESES[d.getMonth() + 1],
    year: d.getFullYear().toString(),
  };
}

const comunidadItems = [
  {
    label: "En Femenino",
    sub: "Liderazgo e igualdad en el entorno empresarial",
    color: "#8878c8",
    icono: <Users size={28} />,
    url: "https://atalayas.com/en-femenino/",
  },
  {
    label: "Autobús lanzadera",
    sub: "Servicio de transporte directo al área empresarial",
    color: "#2563eb",
    icono: <Bus size={28} />,
    url: "https://atalayas.com/autobus-lanzadera/",
  },
  {
    label: "Coche compartido",
    sub: "Coordina rutas con compañeros del área",
    color: "#0891b2",
    icono: <Car size={28} />,
    url: "https://atalayas.com/journify-coche-compartido/",
  },
  {
    label: "Aparcamiento VAO",
    sub: "Plazas exclusivas para vehículos de alta ocupación",
    color: "#059669",
    icono: <ParkingCircle size={28} />,
    url: "https://atalayas.com/aparcamientovao/",
  },
  {
    label: "Empresarios de hoy y de mañana",
    sub: "Networking y actividades entre empresas del área",
    color: "#d97706",
    icono: <Briefcase size={28} />,
    url: "https://atalayas.com/100-estudiantes-20-empresarios/",
  },
  {
    label: "Proyecto empresas solidarias",
    sub: "Más de 44.000 personas ya han sido beneficiadas.",
    color: "#dc2626",
    icono: <Heart size={28} />,
    url: "https://atalayas.com/empresas-solidarias/",
  },
  {
    label: "Voy en bici al trabajo",
    sub: "Semana de la movilidad",
    color: "#16a34a",
    icono: <Bike size={28} />,
    url: "https://atalayas.com/semana-de-la-movilidad/",
  },
  {
    label: "Atalayas circular",
    sub: "3R: REDUCIR, REUTILIZAR Y RECICLAR",
    color: "#0d9488",
    icono: <Recycle size={28} />,
    url: "https://atalayas.com/atalayas-circular/",
  },
];


export default function Invitado() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (menuPanelRef.current) gsap.set(menuPanelRef.current, { xPercent: 100 });
    if (menuOverlayRef.current) gsap.set(menuOverlayRef.current, { opacity: 0, pointerEvents: "none" });
  }, []);

  const abrirMenu = () => {
    setMenuAbierto(true);
    const panel = menuPanelRef.current;
    const overlay = menuOverlayRef.current;
    const items = menuItemsRef.current ? Array.from(menuItemsRef.current.children) as HTMLElement[] : [];
    if (!panel || !overlay) return;
    gsap.set(items, { xPercent: 40, opacity: 0 });
    gsap.set(overlay, { pointerEvents: "auto" });
    const tl = gsap.timeline();
    tl.to(overlay, { opacity: 1, duration: 0.3, ease: "power2.out" });
    tl.to(panel, { xPercent: 0, duration: 0.45, ease: "power4.out" }, 0);
    tl.to(items, { xPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.07 }, 0.2);
  };

  const cerrarMenu = () => {
    const panel = menuPanelRef.current;
    const overlay = menuOverlayRef.current;
    if (!panel || !overlay) return;
    const tl = gsap.timeline({ onComplete: () => setMenuAbierto(false) });
    tl.to(panel, { xPercent: 100, duration: 0.35, ease: "power3.in" });
    tl.to(overlay, { opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => { gsap.set(overlay, { pointerEvents: "none" }); } }, 0);
  };

  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);
  const [todosLosComunicados, setTodosLosComunicados] = useState<Comunicado[]>([]);
  const [todosLosAnuncios, setTodosLosAnuncios] = useState<Noticia[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [tabActivo, setTabActivo] = useState(0);
  const [carruselIndex, setCarruselIndex] = useState(0);
  const carruselTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carruselNoAnim = useRef(false);
  const carruselInitialized = useRef(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Slides del carrusel: primero noticias EGM (empresaId null), luego comunicados
  const slidesCarrusel: ItemLista[] = useMemo(() => {
    const fallback: ItemLista[] = [
      { img: "/background-invitado.webp", title: "EGM Atalayas lanza su nueva plataforma digital para empresas del área", tag: "Destacado", day: "", month: "", year: "" },
      { img: "/background-comunidad.webp", title: "Jornada de networking: conecta con +150 empresas del área", tag: "Evento", day: "", month: "", year: "" },
      { img: "/background-invitado.webp", title: "Nuevas iniciativas de movilidad sostenible en Atalayas Ciudad Empresarial", tag: "Comunicado", day: "", month: "", year: "" },
    ];
    const items: ItemLista[] = [
      ...todosLosAnuncios.filter(a => a.empresaId === null).slice(0, 5).map(anuncioToItem),
      ...todosLosComunicados.slice(0, 3).map(comunicadoToItem),
    ];
    if (items.length === 0) return fallback;
    // Garantizar mínimo 3 repitiendo si hace falta
    while (items.length < 3) items.push(...items.slice(0, 3 - items.length));
    return items;
  }, [todosLosAnuncios, todosLosComunicados]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/comunicados`).then((res) => { if (!res.ok) throw new Error(); return res.json(); }),
      fetch(`${API_URL}/anuncios`).then((res) => { if (!res.ok) throw new Error(); return res.json(); }),
    ])
      .then(([comunicadosData, anunciosData]) => {
        const comunicadosActivos = (comunicadosData as Comunicado[]).filter(c => c.activo && c.estado !== "borrador");
        comunicadosActivos.sort((a, b) => new Date(b.fechaPublicacion ?? "").getTime() - new Date(a.fechaPublicacion ?? "").getTime());
        setTodosLosComunicados(comunicadosActivos);

        const anunciosActivos = (anunciosData as Noticia[]).filter(n => n.activo && n.estado !== "borrador");
        anunciosActivos.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
        setTodosLosAnuncios(anunciosActivos);
      })
      .catch(() => { })
      .finally(() => setLoadingNoticias(false));
  }, []);

  // Auto-avance del carrusel (sin snap, índice crece indefinidamente)
  useEffect(() => {
    carruselTimer.current = setTimeout(() => setCarruselIndex(p => p + 1), 6000);
    return () => { if (carruselTimer.current) clearTimeout(carruselTimer.current); };
  }, [carruselIndex]);

  // Filtrar por tab — combina comunicados EGM + anuncios de empresas
  const itemsComunicados = todosLosComunicados.map(comunicadoToItem);
  const itemsAnuncios = todosLosAnuncios.map(anuncioToItem);

  const itemsPorTab: ItemLista[][] = [
    // Tab 0: Noticias → comunicados (Novedad/General) + anuncios de empresas
    [
      ...todosLosComunicados
        .filter(c => !c.categoria || c.categoria === "Novedad" || c.categoria === "General")
        .map(comunicadoToItem),
      ...itemsAnuncios,
    ].sort((a, b) => {
      const dateA = new Date(`${a.year}-${MESES.indexOf(a.month)}-${a.day}`).getTime();
      const dateB = new Date(`${b.year}-${MESES.indexOf(b.month)}-${b.day}`).getTime();
      return dateB - dateA;
    }),
    // Tab 1: Eventos
    todosLosComunicados
      .filter(c => c.categoria === "Evento")
      .map(comunicadoToItem),
    // Tab 2: Comunicados → todos los comunicados EGM
    itemsComunicados,
    // Tab 3: Convocatorias → Aviso
    todosLosComunicados
      .filter(c => c.categoria === "Aviso")
      .map(comunicadoToItem),
  ];

  const itemsActivos = itemsPorTab[tabActivo];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--gris-pagina)" }}>

      {/* HERO */}
      <section className="relative w-full min-h-screen flex flex-col overflow-hidden">

        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/atalayas-fondo.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay */}
        <div className="absolute inset-0 z-1" style={{ background: "rgba(0,0,0,0.52)" }} />

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <nav className="fixed top-0 left-0 right-0 z-50 w-full px-8 py-5 hidden md:grid md:grid-cols-3 items-center transition-all duration-300" style={{ background: scrolled ? "rgba(0,0,0,0.45)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none" }}>
          {/* Izquierda: Inicio + Noticias */}
          <div className="flex items-center justify-end gap-8 pr-10">
            <span className="text-lg font-medium text-white cursor-default transition-colors">Inicio</span>
            <a href="#colaboradores" className="text-lg font-medium text-white/50 hover:text-white transition-colors">Colaboradores</a>
          </div>

          {/* Centro: Logo */}
          <div className="flex justify-center">
            <Link href="/">
              <Image src={logo} alt="Atalayas EGM" className="h-12 w-auto brightness-0 invert" />
            </Link>
          </div>

          {/* Derecha: Comunidad + Noticias */}
          <div className="flex items-center justify-start gap-8 pl-10">
            <a href="#comunidad" className="text-lg font-medium text-white/50 hover:text-white transition-colors">Comunidad</a>
            <Link href="/noticias" className="text-lg font-medium text-white/50 hover:text-white transition-colors">Noticias</Link>
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-[56] w-full px-6 py-5 flex items-center justify-between transition-all duration-300" style={{ background: scrolled ? "rgba(0,0,0,0.45)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none" }}>
          <Link href="/">
            <Image src={logo} alt="Atalayas EGM" className="h-10 w-auto brightness-0 invert" />
          </Link>
          <button onClick={abrirMenu} aria-label="Abrir menú" className="p-1 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>


        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 sm:pt-40 pb-20 sm:pb-40">
          <h1
            className="text-[4.5rem] sm:text-7xl md:text-[7rem] lg:text-[10rem] text-white leading-[0.9] max-w-7xl font-normal animate-fade-rise"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-2.46px" }}
          >
            Atalayas Área Empresarial.
          </h1>
          <p className={`${playfair.className} text-white/60 text-xl sm:text-xl md:text-2xl max-w-3xl mt-8 leading-relaxed animate-fade-rise-delay`}>
            La plataforma digital de incorporación y formación empresarial para las empresas del área industrial de Atalayas, Alicante.
          </p>
          <Link
            href="/login"
            className="liquid-glass rounded-full px-8 sm:px-14 py-3 sm:py-5 text-base sm:text-xl text-white mt-8 sm:mt-12 hover:scale-[1.03] transition-transform animate-fade-rise-delay-2 inline-flex items-center justify-center"
            style={{ background: "rgba(59, 130, 246, 0.25)" }}
          >
            Iniciar sesión
          </Link>
        </div>
      </section>

      {/* NOTICIAS */}
      <section id="noticias" className="w-full px-6 sm:px-16 lg:px-24 xl:px-32 py-16 sm:py-36">
        <div className="mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-px" style={{ background: "var(--azul-egm)" }} />
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--texto-muted)" }}>Noticias · Eventos · Comunicaciones</p>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold leading-tight mb-3" style={{ color: "var(--texto-primario)" }}>
            Mantente al día con Atalayas
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-4" style={{ color: "var(--texto-muted)" }}>
            Descubre los últimos eventos, comunicados y convocatorias de Atalayas Ciudad Empresarial.
          </p>
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--azul-egm)" }}
          >
            Ver todas las publicaciones ↗
          </Link>
        </div>

        {/* ── Carrusel estilo Apple TV Portrait ─────────────────────────── */}
        {(() => {
          const n = slidesCarrusel.length;
          if (n === 0) return null;

          const CARD_W = 820;
          const CARD_H = 460;
          const CARD_GAP = 20;
          const CARD_TOTAL = CARD_W + CARD_GAP;
          const TRANS = "0.52s cubic-bezier(0.25,0.46,0.45,0.94)";
          const HALF = Math.min(n - 1, 2);

          // Índice real 0..n-1 — nunca hay snap, crece indefinidamente
          const realIdx = ((carruselIndex % n) + n) % n;

          const goTo = (ri: number) => {
            if (carruselTimer.current) clearTimeout(carruselTimer.current);
            const base = carruselIndex - realIdx;
            setCarruselIndex(base + ri + (ri < realIdx ? n : 0));
            carruselTimer.current = setTimeout(() => setCarruselIndex(p => p + 1), 6000);
          };
          const goNext = () => {
            if (carruselTimer.current) clearTimeout(carruselTimer.current);
            setCarruselIndex(p => p + 1);
            carruselTimer.current = setTimeout(() => setCarruselIndex(p => p + 1), 6000);
          };
          const goPrev = () => {
            if (carruselTimer.current) clearTimeout(carruselTimer.current);
            setCarruselIndex(p => p - 1);
            carruselTimer.current = setTimeout(() => setCarruselIndex(p => p + 1), 6000);
          };

          // Ventana de tarjetas absolutas con key estable = carruselIndex + relOffset
          // Cuando carruselIndex cambia, cada tarjeta existente anima su transform (sin snap)
          const windowCards = Array.from({ length: HALF * 2 + 1 }, (_, k) => {
            const relOffset = k - HALF;
            const cardIdx = ((carruselIndex + relOffset) % n + n) % n;
            return { cardIdx, relOffset, key: carruselIndex + relOffset };
          });

          const slides3 = slidesCarrusel.slice(0, 3);

          return (
            <>
              {/* ── MÓVIL: scroll horizontal con swipe ── */}
              <div className="sm:hidden -mx-6">
                <div
                  className="flex gap-3 overflow-x-auto px-6 pb-4 snap-x snap-mandatory"
                  style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
                >
                  {slides3.map((slide, i) => (
                    <div key={i} className="shrink-0 snap-center rounded-2xl overflow-hidden relative" style={{ width: "82vw", height: 220 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slide.img} alt={slide.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)" }} />
                      <div style={{ position: "absolute", top: 14, left: 14 }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.92)" }}>{slide.tag}</span>
                      </div>
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 16px 16px" }}>
                        <p style={{ color: "white", fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{slide.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Puntos móvil */}
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
                  {slides3.map((_, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: 999, background: "var(--gris-borde)" }} />
                  ))}
                </div>
              </div>

              {/* ── DESKTOP: carrusel original ── */}
              <div
                className="hidden sm:block -mx-16 lg:-mx-24 xl:-mx-32 relative"
                onMouseEnter={() => { if (carruselTimer.current) clearTimeout(carruselTimer.current); }}
                onMouseLeave={() => { carruselTimer.current = setTimeout(() => setCarruselIndex(p => p + 1), 6000); }}
              >
                <div className="overflow-hidden relative" style={{ height: CARD_H + 48 }}>
                  {windowCards.map(({ cardIdx, relOffset, key }) => {
                    const slide = slidesCarrusel[cardIdx];
                    const dist = Math.abs(relOffset);
                    const isActive = dist === 0;
                    const scale = isActive ? 1 : dist === 1 ? 0.88 : 0.78;
                    const opacity = isActive ? 1 : dist === 1 ? 0.55 : 0.28;
                    return (
                      <div key={key} onClick={isActive ? undefined : () => goTo(cardIdx)} style={{ position: "absolute", top: "50%", left: "50%", width: CARD_W, height: CARD_H, borderRadius: 20, overflow: "hidden", opacity, cursor: isActive ? "default" : "pointer", transform: `translate(calc(${relOffset * CARD_TOTAL - CARD_W / 2}px), -50%) scale(${scale})`, transition: `transform ${TRANS}, opacity ${TRANS}`, willChange: "transform, opacity" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slide.img} alt={slide.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 75%, transparent 100%)" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, transparent 35%)" }} />
                        <div style={{ position: "absolute", top: 18, left: 18 }}>
                          <span style={{ display: "inline-block", padding: "3px 11px", borderRadius: 999, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.92)" }}>{slide.tag}</span>
                        </div>
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 22px 22px" }}>
                          <p style={{ color: "white", fontWeight: 700, fontSize: isActive ? "1.15rem" : "0.95rem", lineHeight: 1.35, marginBottom: isActive ? 16 : 0, textShadow: "0 1px 8px rgba(0,0,0,0.6)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{slide.title}</p>
                          {isActive && (
                            <Link href="/noticias" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 999, fontSize: "0.82rem", fontWeight: 600, background: "rgba(255,255,255,0.95)", color: "#111827", textDecoration: "none" }}>Ver noticia</Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {n > 1 && (
                  <>
                    <button onClick={goPrev} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.13)", backdropFilter: "blur(8px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.24)")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={goNext} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.13)", backdropFilter: "blur(8px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.24)")} onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </>
                )}
                {n > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
                    {slidesCarrusel.map((_, i) => (
                      <button key={i} onClick={() => goTo(i)} style={{ width: i === realIdx ? 22 : 7, height: 7, borderRadius: 999, border: "none", cursor: "pointer", padding: 0, background: i === realIdx ? "var(--texto-primario)" : "var(--gris-borde)", transition: "all 0.3s ease" }} />
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}

      </section>

      {/* LOGO LOOP */}
      <section className="relative w-full pt-10 pb-20 sm:pt-14 sm:pb-28" style={{ background: "#F5F6F8" }}>
        <LogoLoop
          speed={35} size={70} gap={90}
          logos={[
            { src: "/logo.webp", alt: "EGM Atalayas", href: "https://www.atalayas.com" },
            { src: "/logo-famosa.webp", alt: "Famosa", href: "https://www.famosa.es" },
            { src: "/logo-aliaxis.webp", alt: "Aliaxis", href: "https://www.aliaxis.com" },
            { src: "/logo-blinker.webp", alt: "Blinker", href: "https://www.blinker.com" },
            { src: "/logo-seur.webp", alt: "Seur", href: "https://www.seur.com" },
            { src: "/logo-gofre.webp", alt: "Gofre", href: "https://puntogofre.com" },
            { src: "/logo-itae.webp", alt: "ITAE", href: "https://www.itae.es" },
            { src: "/logo-pompadour.webp", alt: "Pompadour", href: "https://www.pompadour.es" },
            { src: "/logo-sprinter.webp", alt: "Sprinter", href: "https://www.sprinter.es" },
          ]}
        />
      </section>

      {/* COMUNIDAD */}
      <section id="comunidad" className="relative w-full overflow-hidden py-16 sm:py-24" style={{ background: "#ffffff" }}>
        {/* Imagen decorativa pegada al borde derecho */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 pointer-events-none select-none" style={{ width: 500 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/circulos-decoracion.png" alt="" aria-hidden
            className="absolute right-0 top-1/2 -translate-y-1/2"
            style={{ width: 500, opacity: 1, filter: "invert(18%) sepia(60%) saturate(800%) hue-rotate(200deg) brightness(60%)" }} />
        </div>

        {/* Layout: lista centrada con margen */}
        <div className="relative w-full px-6 sm:px-16 lg:px-36 xl:px-48">
          {/* Título */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-10 text-center" style={{ color: "#111827", maxWidth: 800 }}>
            Nuestra Comunidad
          </h2>
          {/* MÓVIL: 2 columnas, solo icono + título */}
          <div className="grid grid-cols-2 gap-3 sm:hidden">
            {comunidadItems.map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 rounded-2xl px-4 py-5 no-underline text-center transition-colors duration-200"
                style={{ background: "rgba(27,63,126,0.05)", border: "1px solid rgba(27,63,126,0.08)" }}
              >
                <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 48, height: 48, background: "rgba(27,63,126,0.12)", color: "#1b3f7e" }}>
                  {item.icono}
                </div>
                <p className="font-bold text-sm leading-snug" style={{ color: "#111827" }}>{item.label}</p>
              </a>
            ))}
          </div>

          {/* DESKTOP: lista con descripción */}
          <div className="hidden sm:grid grid-cols-2" style={{ maxWidth: 800 }}>
            {comunidadItems.map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 cursor-pointer group transition-colors duration-200 px-6 py-5 no-underline"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(27,63,126,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 44, height: 44, background: "rgba(27,63,126,0.12)", color: "#1b3f7e" }}>
                    {item.icono}
                  </div>
                  <div>
                    <p className="font-bold text-base leading-snug mb-0.5" style={{ color: "#111827" }}>{item.label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{item.sub}</p>
                  </div>
                </div>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(27,63,126,0.4)" strokeWidth={2} className="shrink-0 transition-transform duration-200 group-hover:translate-x-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Colaboradores />
      <FooterCTA />

      {/* Mobile menu panel */}
      <div className="md:hidden">
        {/* Overlay */}
        <div
          ref={menuOverlayRef}
          onClick={cerrarMenu}
          className="fixed inset-0 z-[57]"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        />
        {/* Panel */}
        <div
          ref={menuPanelRef}
          className="fixed top-0 right-0 h-full z-[58] flex flex-col"
          style={{ width: "100%", background: "#fff" }}
        >
          {/* Cabecera del panel */}
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <Image src={logo} alt="Atalayas EGM" className="h-10 w-auto" />
            <button onClick={cerrarMenu} aria-label="Cerrar menú" className="p-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {/* Items */}
          <div ref={menuItemsRef} className="flex flex-col px-6 py-8 gap-1">
            <Link href="/" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3" style={{ color: "#111", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>Inicio</Link>
            <Link href="/noticias" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3" style={{ color: "#111", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>Noticias</Link>
            <a href="#comunidad" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3" style={{ color: "#111", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>Comunidad</a>
            <a href="#colaboradores" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3" style={{ color: "#111", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>Colaboradores</a>
            <Link href="/login" onClick={cerrarMenu} className="text-3xl font-bold uppercase tracking-tight py-3 mt-2" style={{ color: "var(--azul-egm)" }}>Entrar →</Link>
          </div>
        </div>
      </div>

    </div>
  );
}