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
  { label: "En femenino", sub: "Alicante impulsa el liderazgo femenino en el ámbito empresarial" },
  { label: "Autobús lanzadera", sub: "Servicio de transporte directo al parque empresarial" },
  { label: "Coche compartido", sub: "Coordina rutas con compañeros del parque" },
  { label: "Aparcamiento VAO", sub: "Plazas exclusivas para vehículos de alta ocupación" },
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
      <section id="noticias" className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-px" style={{ background: "var(--azul-egm)" }} />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--texto-muted)" }}>Blog, Noticias, Eventos</p>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ color: "var(--texto-primario)" }}>
            Mantente al día<br />con Atalayas
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Featured card */}
          <Link href="/login" className="relative rounded-2xl overflow-hidden flex-shrink-0 lg:w-[48%] min-h-[340px] sm:min-h-[420px] group block">
            <Image
              src="/background-invitado.jpg"
              alt="Noticia destacada"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-px bg-white/60" />
                <span className="text-xs text-white/70 font-medium uppercase tracking-wider">Destacado</span>
              </div>
              <h3 className="text-white text-xl sm:text-2xl font-bold leading-snug max-w-sm">
                EGM Atalayas lanza su nueva plataforma digital para empresas del parque
              </h3>
            </div>
            <div className="absolute top-4 right-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white text-sm">↗</div>
            </div>
          </Link>

          {/* Right column */}
          <div className="flex-1 flex flex-col">
            {/* Category tabs */}
            <div className="flex items-center gap-6 mb-6 overflow-x-auto pb-1" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
              {["Noticias", "Eventos", "Comunicados", "Convocatorias"].map((tab, i) => (
                <div key={tab} className="flex items-center gap-1 pb-3 shrink-0 cursor-pointer" style={{ borderBottom: i === 0 ? "2px solid var(--azul-egm)" : "2px solid transparent", marginBottom: "-1px" }}>
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: i === 0 ? "var(--azul-egm)" : "var(--texto-muted)" }}>{tab}</span>
                  <span className="text-xs" style={{ color: i === 0 ? "var(--azul-egm)" : "var(--texto-muted)" }}>↗</span>
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
                <Link href="/login" key={item.title} className="flex gap-4 py-5 group items-start">
                  <div className="relative w-24 h-16 sm:w-28 sm:h-18 rounded-lg overflow-hidden shrink-0">
                    <Image src={item.img} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-1.5 px-2 py-0.5 rounded-full inline-block" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>{item.tag}</p>
                    <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:underline" style={{ color: "var(--texto-primario)" }}>{item.title}</h4>
                    <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>Sin extracto disponible.</p>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    <p className="text-2xl font-bold leading-none" style={{ color: "var(--texto-primario)" }}>{item.day}</p>
                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{item.month}</p>
                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{item.year}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMUNIDAD */}
      <section
        id="comunidad"
        className="relative w-full mt-2"
        style={{ backgroundImage: "url('/background-comunidad.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.3) 100%)" }} />
        {/* Fade inferior hacia el LogoLoop */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #0a1628)" }} />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-12 py-12 sm:py-20">
          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-8 text-center">Comunidad</h2>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-8 sm:gap-16 items-start sm:items-center">
            <div className="flex flex-col divide-y w-full" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {comunidadItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-4 group cursor-pointer">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-white text-lg font-medium">{item.label}</p>
                    <p className={`${playfair.className} text-base mt-0.5 line-clamp-2`} style={{ color: "rgba(255,255,255,0.5)" }}>{item.sub}</p>
                  </div>
                  <span className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>&#8594;</span>
                </div>
              ))}
            </div>
            <div className="hidden sm:flex flex-col gap-4 justify-center">
              {[
                { numero: "+150", label: "Empresas en el parque" },
                { numero: "+8.000", label: "Empleados directos" },
                { numero: "25", label: "Años de gestión" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl px-6 py-4"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <p className="text-white text-3xl font-extrabold leading-none">{s.numero}</p>
                  <p className={`${playfair.className} text-sm mt-1.5`} style={{ color: "rgba(255,255,255,0.6)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LOGO LOOP */}
      <section className="relative w-full py-10 sm:py-14" style={{ background: "linear-gradient(to bottom, #0a1628 0%, #0D1B2E 40%)" }}>
        <p className="text-center text-xs font-semibold uppercase tracking-widest mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          Empresas del parque
        </p>
        <LogoLoop
          speed={35}
          size={40}
          gap={80}
          logos={[
            { src: "/logo.webp", alt: "EGM Atalayas" },
            { src: "/logo.webp", alt: "Empresa 2" },
            { src: "/logo.webp", alt: "Empresa 3" },
            { src: "/logo.webp", alt: "Empresa 4" },
            { src: "/logo.webp", alt: "Empresa 5" },
            { src: "/logo.webp", alt: "Empresa 6" },
          ]}
        />
      </section>

      {/* FOOTER */}
      <FooterCTA />

    </div>
  );
}
