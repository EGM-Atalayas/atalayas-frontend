"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { API_URL } from "@/lib/api";
import { Noticia } from "@/lib/types/noticias";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const comunidadLinks = [
  { label: "En femenino", sub: "Alicante impulsa el liderazgo femenino en el ámbito empresarial" },
  { label: "Autobús lanzadera", sub: "Servicio de transporte directo al parque empresarial" },
  { label: "Coche compartido", sub: "Coordina rutas con compañeros del parque" },
  { label: "Aparcamiento VAO", sub: "Plazas exclusivas para vehículos de alta ocupación" },
];

export default function Invitado() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/anuncios`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Noticia[]) =>
        setNoticias(data.filter((n) => n.esGlobal && n.activo))
      )
      .catch(() => { })
      .finally(() => setLoadingNoticias(false));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--gris-pagina)", color: "var(--texto-primario)" }}>

      {/* ── HEADER ── */}
      <header className="w-full bg-transparent absolute top-0 left-0 right-0 z-50">
        <div className="w-full px-5 sm:px-8 h-16 flex items-center justify-between">
          <Image src={logo} alt="Atalayas" className="h-12 sm:h-16 w-auto brightness-0 invert" />

          {/* Nav desktop */}
          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/80">
            <a href="#comunidad" className="hover:text-white transition-colors">Comunidad</a>
            <a href="#anuncios" className="hover:text-white transition-colors">Anuncios</a>
            <Link
              href="/login"
              className="text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors uppercase tracking-wide"
              style={{ background: "var(--azul-egm)", border: "1px solid var(--azul-egm-hover)" }}
            >
              Iniciar sesión
            </Link>
          </nav>

          {/* Botón hamburguesa mobile */}
          <button
            className="sm:hidden text-white p-2"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menú"
          >
            <div className="w-6 h-0.5 bg-white mb-1.5" />
            <div className="w-6 h-0.5 bg-white mb-1.5" />
            <div className="w-6 h-0.5 bg-white" />
          </button>
        </div>

        {/* Menú mobile desplegable */}
        {menuAbierto && (
          <div className="sm:hidden bg-black/90 backdrop-blur-sm px-5 pb-5 flex flex-col">
            <a href="#anuncios" onClick={() => setMenuAbierto(false)} className="text-white/80 text-sm py-3 border-b border-white/10">Anuncios</a>
            <a href="#comunidad" onClick={() => setMenuAbierto(false)} className="text-white/80 text-sm py-3 border-b border-white/10">Comunidad</a>
            <Link href="/login" onClick={() => setMenuAbierto(false)} className="text-white text-sm font-semibold py-3">Iniciar sesión →</Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section
        className="relative w-full min-h-[50vh] sm:h-[520px] flex items-end"
        style={{
          backgroundImage: "url('/background-invitado.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 px-5 sm:px-10 pt-24 pb-10 sm:pb-14 w-full">
          <p className="text-white/70 text-[10px] sm:text-xs font-medium mb-2 uppercase tracking-widest">
            Bienvenidos
          </p>
          <h1 className="text-white text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-4 leading-tight">
            Atalayas Ciudad Empresarial
          </h1>
          <p className={`${playfair.className} text-white/70 text-lg sm:text-2xl leading-relaxed max-w-3xl`}>
            Atalayas Ciudad Empresarial es una de las mayores áreas empresariales e industriales de la ciudad de Alicante y su provincia.
          </p>
        </div>
      </section>

      {/* ── ANUNCIOS ── */}
      <section id="anuncios" className="w-full max-w-7xl mx-auto px-5 sm:px-12 py-10 sm:py-16">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--texto-primario)" }}>Anuncios</h2>
          <span className="text-lg" style={{ color: "var(--texto-muted)" }}>→</span>
        </div>

        {loadingNoticias ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-2 rounded-full animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
          </div>
        ) : noticias.length === 0 ? (
          <p className="text-sm py-8" style={{ color: "var(--texto-muted)" }}>No hay anuncios recientes.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {noticias.map((n) => (
              <div
                key={n.anuncioId}
                className="flex flex-col sm:flex-row rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}
              >
                {/* Placeholder imagen */}
                <div className="w-full h-44 sm:w-52 sm:h-auto shrink-0" style={{ background: "var(--gris-superficie)" }} />
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {n.esGlobal && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "1px solid var(--azul-egm-light)" }}>
                          Global
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                        {new Date(n.creadoEn).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: "var(--texto-primario)" }}>{n.titulo}</h3>
                    <p className="text-base leading-relaxed line-clamp-3" style={{ color: "var(--texto-secundario)" }}>{n.mensaje}</p>
                  </div>
                  <button
                    className="self-start text-xs font-semibold px-4 py-2 rounded-md transition-colors"
                    style={{ color: "var(--azul-egm)", border: "1px solid var(--gris-borde)", background: "transparent" }}
                  >
                    Seguir leyendo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── COMUNIDAD ── */}
      <section
        id="comunidad"
        className="relative w-full mt-2"
        style={{ backgroundImage: "url('/background-comunidad.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-12 py-12 sm:py-20">
          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-8 text-center">Comunidad</h2>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-8 sm:gap-16 items-start sm:items-center">
            <div className="flex flex-col divide-y divide-white/10 w-full">
              {comunidadLinks.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-4 group cursor-pointer">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-white text-lg font-medium group-hover:text-white/80 transition-colors">
                      {item.label}
                    </p>
                    <p className={`${playfair.className} text-white/50 text-base mt-0.5 line-clamp-2`}>{item.sub}</p>
                  </div>
                  <span className="text-white/30 text-sm group-hover:text-white/70 transition-colors shrink-0">→</span>
                </div>
              ))}
            </div>
            {/* Placeholder imagen comunidad */}
            <div className="rounded-xl h-52 sm:h-64 w-full" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 sm:py-20 text-center px-5" style={{ background: "var(--marino)" }}>
        <h2 className="text-white text-lg sm:text-2xl font-bold mb-2">¿Tu empresa está en Atalayas?</h2>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>Únete a la plataforma del parque empresarial.</p>
        <Link
          href="/login"
          className="inline-block text-sm font-semibold px-8 py-3 rounded-md transition-colors"
          style={{ border: "1px solid white", color: "white" }}
        >
          Solicitar alta
        </Link>
      </section>

    </div>
  );
}
