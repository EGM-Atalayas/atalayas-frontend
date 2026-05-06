"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import type { StaggeredMenuHandle } from "@/components/ui/StaggeredMenu";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { API_URL } from "@/lib/api";
import { Playfair_Display } from "next/font/google";
import LogoLoop from "@/components/ui/LogoLoop";
import FooterCTA from "@/components/ui/FooterCTA";
import StaggeredMenu from "@/components/ui/StaggeredMenu";
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
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [todosLosComunicados, setTodosLosComunicados] = useState<Comunicado[]>([]);
  const [todosLosAnuncios, setTodosLosAnuncios] = useState<Noticia[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [tabActivo, setTabActivo] = useState(0);
  const [carruselIndex, setCarruselIndex] = useState(0);
  const carruselTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carruselNoAnim = useRef(false);
  const carruselInitialized = useRef(false);

  // Slides del carrusel: primero noticias EGM (empresaId null), luego comunicados
  const slidesCarrusel: ItemLista[] = useMemo(() => {
    const items: ItemLista[] = [
      ...todosLosAnuncios.filter(a => a.empresaId === null).slice(0, 5).map(anuncioToItem),
      ...todosLosComunicados.slice(0, 2).map(comunicadoToItem),
    ];
    return items.length > 0 ? items : [
      { img: "/background-invitado.webp", title: "EGM Atalayas lanza su nueva plataforma digital para empresas del área", tag: "Destacado", day: "", month: "", year: "" },
      { img: "/background-comunidad.webp", title: "Jornada de networking: conecta con +150 empresas del área", tag: "Evento", day: "", month: "", year: "" },
    ];
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

        {/* Background image */}
        <img
          src="/background-invitado.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 z-1" style={{ background: "rgba(0,0,0,0.52)" }} />

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <nav className="relative z-20 w-full px-8 py-6 flex flex-row items-center justify-between md:grid md:grid-cols-3">
          {/* Logo */}
          <Image src={logo} alt="Atalayas EGM" className="h-14 w-auto brightness-0 invert" />
          <div className="hidden md:flex items-center justify-center gap-8">
            <span className="text-2xl font-medium text-white cursor-default transition-colors">Inicio</span>
            <a href="#noticias" className="text-2xl font-medium text-white/50 hover:text-white transition-colors">Noticias</a>
            <a href="#comunidad" className="text-2xl font-medium text-white/50 hover:text-white transition-colors">Comunidad</a>
            <a href="#colaboradores" className="text-2xl font-medium text-white/50 hover:text-white transition-colors">Colaboradores</a>
          </div>

          {/* Mobile hamburger / close */}
          <button
            className="md:hidden p-2 flex items-center justify-center outline-none focus:outline-none"
            onClick={() => setMenuAbierto(prev => !prev)}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            {menuAbierto ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuAbierto && (
          <div className="md:hidden relative z-20 px-6 pb-6 flex flex-col" style={{ background: "rgba(0,0,0,0.85)" }}>
            <a href="#noticias" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Noticias</a>
            <a href="#comunidad" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Comunidad</a>
            <a href="#colaboradores" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Colaboradores</a>
            <Link href="/login" onClick={() => setMenuAbierto(false)} className="text-sm font-semibold py-3 text-white">Entrar</Link>
          </div>
        )}

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-40">
          <h1
            className="text-7xl sm:text-[9rem] md:text-[12rem] text-white leading-[0.9] max-w-7xl font-normal animate-fade-rise"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-2.46px" }}
          >
            Atalayas Área Empresarial.
          </h1>
          <p className={`${playfair.className} text-white/60 text-xl sm:text-2xl max-w-3xl mt-8 leading-relaxed animate-fade-rise-delay`}>
            La plataforma digital de incorporación y formación empresarial para las empresas del área industrial de Atalayas, Alicante.
          </p>
          <Link
            href="/login"
            className="liquid-glass rounded-full px-14 py-5 text-xl text-white mt-12 hover:scale-[1.03] transition-transform animate-fade-rise-delay-2 inline-flex items-center justify-center"
            style={{ background: "rgba(59, 130, 246, 0.25)" }}
          >
            Iniciar Sesión
          </Link>
        </div>
      </section>

      {/* NOTICIAS */}
      <section id="noticias" className="w-full px-6 sm:px-16 lg:px-24 xl:px-32 py-24 sm:py-36">
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-px" style={{ background: "var(--azul-egm)" }} />
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--texto-muted)" }}>Blog, Noticias, Eventos</p>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-3" style={{ color: "var(--texto-primario)" }}>
            Mantente al día con Atalayas
          </h2>
          <p className="text-base leading-relaxed max-xl mb-4" style={{ color: "var(--texto-muted)" }}>
            Descubre los últimos eventos, comunicados y convocatorias de Atalayas Ciudad Empresarial.
            Mantente informado de todo lo que ocurre en el parque.
          </p>
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 text-base font-semibold transition-colors hover:opacity-80"
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

          return (
            <div
              className="-mx-6 sm:-mx-16 lg:-mx-24 xl:-mx-32 relative"
              onMouseEnter={() => { if (carruselTimer.current) clearTimeout(carruselTimer.current); }}
              onMouseLeave={() => { carruselTimer.current = setTimeout(() => setCarruselIndex(p => p + 1), 6000); }}
            >
              {/* Contenedor */}
              <div className="overflow-hidden relative" style={{ height: CARD_H + 48 }}>
                {windowCards.map(({ cardIdx, relOffset, key }) => {
                  const slide = slidesCarrusel[cardIdx];
                  const dist = Math.abs(relOffset);
                  const isActive = dist === 0;
                  const scale = isActive ? 1 : dist === 1 ? 0.88 : 0.78;
                  const opacity = isActive ? 1 : dist === 1 ? 0.55 : 0.28;
                  return (
                    <div
                      key={key}
                      onClick={isActive ? undefined : () => goTo(cardIdx)}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: CARD_W,
                        height: CARD_H,
                        borderRadius: 20,
                        overflow: "hidden",
                        opacity,
                        cursor: isActive ? "default" : "pointer",
                        transform: `translate(calc(${relOffset * CARD_TOTAL - CARD_W / 2}px), -50%) scale(${scale})`,
                        transition: `transform ${TRANS}, opacity ${TRANS}`,
                        willChange: "transform, opacity",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slide.img} alt={slide.title}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 75%, transparent 100%)" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, transparent 35%)" }} />

                      {/* Tag */}
                      <div style={{ position: "absolute", top: 18, left: 18 }}>
                        <span style={{
                          display: "inline-block", padding: "3px 11px", borderRadius: 999,
                          fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.09em",
                          textTransform: "uppercase", background: "rgba(255,255,255,0.18)",
                          backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.92)",
                        }}>
                          {slide.tag}
                        </span>
                      </div>

                      {/* Contenido inferior */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 22px 22px" }}>
                        <p style={{
                          color: "white", fontWeight: 700,
                          fontSize: isActive ? "1.15rem" : "0.95rem",
                          lineHeight: 1.35, marginBottom: isActive ? 16 : 0,
                          textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                          display: "-webkit-box", WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {slide.title}
                        </p>
                        {isActive && (
                          <Link href="/noticias" style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "9px 20px", borderRadius: 999, fontSize: "0.82rem",
                            fontWeight: 600, background: "rgba(255,255,255,0.95)",
                            color: "#111827", textDecoration: "none",
                          }}>
                            Ver noticia
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Flechas */}
              {n > 1 && (
                <>
                  <button onClick={goPrev} style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    zIndex: 10, width: 44, height: 44, borderRadius: "50%", border: "none",
                    background: "rgba(255,255,255,0.13)", backdropFilter: "blur(8px)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.24)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button onClick={goNext} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    zIndex: 10, width: 44, height: 44, borderRadius: "50%", border: "none",
                    background: "rgba(255,255,255,0.13)", backdropFilter: "blur(8px)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.24)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Puntos */}
              {n > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
                  {slidesCarrusel.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)} style={{
                      width: i === realIdx ? 22 : 7, height: 7, borderRadius: 999,
                      border: "none", cursor: "pointer", padding: 0,
                      background: i === realIdx ? "var(--texto-primario)" : "var(--gris-borde)",
                      transition: "all 0.3s ease",
                    }} />
                  ))}
                </div>
              )}
            </div>
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
            { src: "/logo-gofre.webp", alt: "Gofre", href: "https://www.puntodeproductosvending.com" },
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
        <div className="relative w-full px-6 sm:px-20 lg:px-36 xl:px-48">
          {/* Título */}
          <h2 className="text-4xl sm:text-5xl font-bold mb-10 text-center" style={{ color: "#111827", maxWidth: 800 }}>
            Nuestra Comunidad
          </h2>
          {/* Lista en dos columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ maxWidth: 800 }}>
            {comunidadItems.map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 cursor-pointer group transition-colors duration-200 px-6 py-5 no-underline"
                style={{
                  borderBottom: "1px solid rgba(0,0,0,0.07)",
                  background: "transparent",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(27,63,126,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex items-center gap-4">
                  {/* Icono pequeño */}
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 44, height: 44, background: "rgba(27,63,126,0.12)", color: "#1b3f7e" }}
                  >
                    {item.icono}
                  </div>
                  <div>
                    <p className="font-bold text-base leading-snug mb-0.5" style={{ color: "#111827" }}>{item.label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{item.sub}</p>
                  </div>
                </div>
                {/* Flecha */}
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(27,63,126,0.4)" strokeWidth={2}
                  className="shrink-0 transition-transform duration-200 group-hover:translate-x-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Colaboradores />
      <FooterCTA />

    </div>
  );
}