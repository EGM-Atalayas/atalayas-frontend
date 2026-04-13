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

      {/* LOGO LOOP */}
      <section className="w-full py-10 sm:py-14" style={{ background: "var(--gris-pagina)", borderTop: "1px solid var(--gris-borde)", borderBottom: "1px solid var(--gris-borde)" }}>
        <p className="text-center text-xs font-semibold uppercase tracking-widest mb-8" style={{ color: "var(--texto-muted)" }}>
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

      {/* NOTICIAS */}
      <section id="noticias" className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--verde-oliva)" }}>Actualidad</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--texto-primario)" }}>Noticias del parque</h2>
          </div>
          <Link href="/login" className="text-sm font-medium hidden sm:block hover:underline" style={{ color: "var(--azul-egm)" }}>
            Ver todas &#8594;
          </Link>
        </div>

        {loadingComunicados ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
          </div>
        ) : comunicados.length === 0 ? (
          <div className="rounded-xl p-10 sm:p-14 flex flex-col sm:flex-row items-center gap-8" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--texto-primario)" }}>
                Pronto aquí, las últimas novedades
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--texto-muted)" }}>
                EGM Atalayas publica comunicados oficiales sobre eventos, servicios y novedades del parque empresarial. Accede con tu cuenta para verlos en tiempo real.
              </p>
            </div>
            <div className="hidden sm:block w-px self-stretch" style={{ background: "var(--gris-borde)" }} />
            <div className="hidden sm:flex flex-col gap-3 w-64 shrink-0">
              {["Jornadas de networking", "Nuevos servicios del parque", "Actualización de normativa"].map((t) => (
                <div key={t} className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--azul-egm)" }} />
                  <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {comunicados.map((c) => (
              <div key={c.comunicadoId} className="flex flex-col sm:flex-row rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
                {c.imagenUrl ? (
                  <div className="w-full h-44 sm:w-52 sm:h-auto shrink-0 relative">
                    <Image src={c.imagenUrl} alt={c.titulo} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-44 sm:w-52 sm:h-auto shrink-0" style={{ background: "var(--gris-superficie)" }} />
                )}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}>EGM Atalayas</span>
                      <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                        {new Date(c.fechaPublicacion).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold mb-1" style={{ color: "var(--texto-primario)" }}>{c.titulo}</h3>
                    <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--texto-secundario)" }}>{c.mensaje}</p>
                  </div>
                  <Link href="/login" className="self-start text-xs font-semibold px-4 py-2 rounded-md" style={{ color: "var(--azul-egm)", border: "1px solid var(--gris-borde)" }}>
                    Seguir leyendo &#8594;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* COMUNIDAD */}
      <section
        id="comunidad"
        className="relative w-full mt-2"
        style={{ backgroundImage: "url('/background-comunidad.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.3) 100%)" }} />
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

      {/* FOOTER */}
      <FooterCTA />

    </div>
  );
}
