"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { API_URL } from "@/lib/api";
import { Playfair_Display } from "next/font/google";
import LogoLoop from "@/components/ui/LogoLoop";
import FooterCTA from "@/components/ui/FooterCTA";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

interface Comunicado {
  comunicadoId: string;
  titulo: string;
  mensaje: string;
  imagenUrl?: string | null;
  fechaPublicacion: string;
  activo: boolean;
}

const comunidadItems = [
  {
    label: "En Femenino",
    sub: "Liderazgo e igualdad en el entorno empresarial",
    icono: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    label: "Autobús lanzadera",
    sub: "Servicio de transporte directo al parque empresarial",
    icono: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    label: "Coche compartido",
    sub: "Coordina rutas con compañeros del parque",
    icono: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    label: "Aparcamiento VAO",
    sub: "Plazas exclusivas para vehículos de alta ocupación",
    icono: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Eventos empresariales",
    sub: "Networking y actividades entre empresas del parque",
    icono: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Team building",
    sub: "Iniciativas colectivas e integración entre equipos",
    icono: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Sostenibilidad",
    sub: "Iniciativas verdes y responsabilidad ambiental",
    icono: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Salud y bienestar",
    sub: "Programas de bienestar para todos los empleados",
    icono: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

export default function Invitado() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/comunicados`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Comunicado[]) =>
        setComunicados(data.filter((c) => c.activo).slice(0, 3))
      )
      .catch(() => {})
      .finally(() => setLoadingComunicados(false));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--gris-pagina)" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — fullscreen background image with cinematic typography
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-screen flex flex-col overflow-hidden">

        {/* Background image */}
        <img
          src="/background-invitado.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 z-[1]" style={{ background: "rgba(0,0,0,0.52)" }} />

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <nav className="relative z-20 w-full px-8 py-6 flex flex-row items-center justify-between md:grid md:grid-cols-3">
          {/* Logo */}
          <Image src={logo} alt="Atalayas EGM" className="h-14 w-auto brightness-0 invert" />

          {/* Nav links — desktop only */}
          <div className="hidden md:flex items-center justify-center gap-8">
            <span className="text-2xl text-white cursor-default transition-colors">Inicio</span>
            <a href="#noticias" className="text-2xl text-white/50 hover:text-white transition-colors">Noticias</a>
            <a href="#comunidad" className="text-2xl text-white/50 hover:text-white transition-colors">Comunidad</a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 flex flex-col gap-1.5"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menu"
          >
            <div className="w-6 h-0.5 bg-white" />
            <div className="w-6 h-0.5 bg-white" />
            <div className="w-6 h-0.5 bg-white" />
          </button>
        </nav>

        {/* Mobile menu */}
        {menuAbierto && (
          <div className="md:hidden relative z-20 px-6 pb-6 flex flex-col" style={{ background: "rgba(0,0,0,0.85)" }}>
            <a href="#noticias" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Noticias</a>
            <a href="#comunidad" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Comunidad</a>
            <Link href="/login" onClick={() => setMenuAbierto(false)} className="text-sm font-semibold py-3 text-white">Entrar</Link>
          </div>
        )}

        {/* ── Hero content ───────────────────────────────────────────── */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-40">
          <h1
            className="text-7xl sm:text-[9rem] md:text-[12rem] text-white leading-[0.9] max-w-7xl font-normal animate-fade-rise"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-2.46px" }}
          >
            Atalayas Ciudad Empresarial.
          </h1>

          <p className={`${playfair.className} text-white/60 text-xl sm:text-2xl max-w-3xl mt-8 leading-relaxed animate-fade-rise-delay`}>
            La plataforma digital de incorporación y formación empresarial para las empresas del parque industrial de Atalayas, Alicante.
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
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-px" style={{ background: "var(--azul-egm)" }} />
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--texto-muted)" }}>Blog, Noticias, Eventos</p>
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold leading-tight" style={{ color: "var(--texto-primario)" }}>
            Mantente al día<br />con Atalayas
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Featured card */}
          <Link href="/login" className="relative rounded-2xl overflow-hidden flex-shrink-0 lg:w-[48%] min-h-[480px] sm:min-h-[560px] group block">
            <Image
              src="/background-invitado.jpg"
              alt="Noticia destacada"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
            <div className="absolute bottom-0 left-0 p-8 sm:p-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-px bg-white/60" />
                <span className="text-sm text-white/70 font-medium uppercase tracking-wider">Destacado</span>
              </div>
              <h3 className="text-white text-2xl sm:text-3xl font-bold leading-snug max-w-sm">
                EGM Atalayas lanza su nueva plataforma digital para empresas del parque
              </h3>
            </div>
            <div className="absolute top-5 right-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white text-base">↗</div>
            </div>
          </Link>

          {/* Right column */}
          <div className="flex-1 flex flex-col">
            {/* Category tabs */}
            <div className="flex items-center gap-8 mb-8 overflow-x-auto pb-1" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
              {["Noticias", "Eventos", "Comunicados", "Convocatorias"].map((tab, i) => (
                <div key={tab} className="flex items-center gap-1.5 pb-4 shrink-0 cursor-pointer" style={{ borderBottom: i === 0 ? "2px solid var(--azul-egm)" : "2px solid transparent", marginBottom: "-1px" }}>
                  <span className="text-base font-medium whitespace-nowrap" style={{ color: i === 0 ? "var(--azul-egm)" : "var(--texto-muted)" }}>{tab}</span>
                  <span className="text-sm" style={{ color: i === 0 ? "var(--azul-egm)" : "var(--texto-muted)" }}>↗</span>
                </div>
              ))}
            </div>

            {/* Article list */}
            <div className="flex flex-col divide-y" style={{ borderColor: "var(--gris-borde)" }}>
              {[
                {
                  img: "/background-comunidad.jpg",
                  title: "Jornada de networking: conecta con +150 empresas del parque",
                  tag: "Evento",
                  day: "18", month: "Abr", year: "2026",
                },
                {
                  img: "/background-invitado.jpg",
                  title: "Nuevos servicios de transporte lanzadera desde Alicante",
                  tag: "Noticia",
                  day: "10", month: "Abr", year: "2026",
                },
                {
                  img: "/background-comunidad.jpg",
                  title: "Convocatoria: Programa de formación para pymes del parque empresarial",
                  tag: "Convocatoria",
                  day: "03", month: "Abr", year: "2026",
                },
              ].map((item) => (
                <Link href="/login" key={item.title} className="flex gap-6 py-7 group items-start">
                  <div className="relative w-32 h-22 sm:w-40 sm:h-28 rounded-xl overflow-hidden shrink-0" style={{ minHeight: "88px" }}>
                    <Image src={item.img} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-2 px-2.5 py-1 rounded-full inline-block" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>{item.tag}</p>
                    <h4 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 group-hover:underline" style={{ color: "var(--texto-primario)" }}>{item.title}</h4>
                    <p className="text-sm mt-1.5" style={{ color: "var(--texto-muted)" }}>Sin extracto disponible.</p>
                  </div>
                  <div className="shrink-0 text-right ml-3">
                    <p className="text-3xl font-bold leading-none" style={{ color: "var(--texto-primario)" }}>{item.day}</p>
                    <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>{item.month}</p>
                    <p className="text-sm" style={{ color: "var(--texto-muted)" }}>{item.year}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LOGO LOOP */}
      <section className="relative w-full pt-10 pb-20 sm:pt-14 sm:pb-28" style={{ background: "#F5F6F8" }}>
        <LogoLoop
          speed={35}
          size={70}
          gap={90}
          logos={[
            { src: "/logo.webp", alt: "EGM Atalayas" },
            { src: "/logo-famosa.png", alt: "Empresa 2" },
            { src: "/logo-aliaxis.png", alt: "Empresa 3" },
            { src: "/logo-blinker.png", alt: "Empresa 4" },
            { src: "/logo-seur.png", alt: "Empresa 5" },
            { src: "/logo-famosa.png", alt: "Empresa 6" },
          ]}
        />
      </section>

      {/* COMUNIDAD */}
      <section
        id="comunidad"
        className="relative w-full mt-2"
        style={{ backgroundImage: "url('/background-comunidad.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.3) 100%)" }} />
        <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10" style={{ background: "linear-gradient(to bottom, #0d0d0d, transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #000000)" }} />
        <div className="relative z-10 w-full px-6 sm:px-16 lg:px-24 xl:px-32 py-24 sm:py-36">
          <h2 className="text-5xl sm:text-6xl font-bold leading-tight mb-12 text-center" style={{ color: "white" }}>
            Nuestra Comunidad
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {comunidadItems.map((item) => (
              <div
                key={item.label}
                className="aspect-square flex flex-col justify-between p-5 rounded-2xl cursor-pointer group transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {/* Icono */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}
                >
                  {item.icono}
                </div>

                {/* Texto */}
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold leading-snug text-white">
                    {item.label}
                  </p>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <FooterCTA />

    </div>
  );
}
