"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { API_URL } from "@/lib/api";
import { Noticia } from "@/lib/types/noticias";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });

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
      .catch(() => {})
      .finally(() => setLoadingNoticias(false));
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

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
              className="bg-white/10 border border-white/30 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-white/20 transition-colors uppercase tracking-wide"
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
        className="relative w-full min-h-[50vh] sm:h-[480px] flex items-end"
        style={{
          backgroundImage: "url('/background-invitado.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 px-5 sm:px-10 pt-24 pb-10 sm:pb-14 w-full">
          <p className="text-white/70 text-[10px] sm:text-xs font-medium mb-2 uppercase tracking-widest">
            Bienvenidos
          </p>
          <h1 className="text-white text-2xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight mb-3 leading-tight">
            Atalayas Ciudad Empresarial
          </h1>
          <p className={`${playfair.className} text-white/70 text-lg sm:text-2xl leading-relaxed max-w-4xl`}>
            Atalayas Ciudad Empresarial es una de las mayores áreas empresariales e industriales de la ciudad de Alicante y su provincia.
          </p>
        </div>
      </section>

      {/* ── ANUNCIOS ── */}
      <section id="anuncios" className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="flex items-center gap-2 mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Anuncios</h2>
          <span className="text-gray-400 text-lg">→</span>
        </div>

        {loadingNoticias ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
          </div>
        ) : noticias.length === 0 ? (
          <p className="text-sm text-gray-400 py-8">No hay anuncios recientes.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {noticias.map((n) => (
              <div
                key={n.anuncioId}
                className="flex flex-col sm:flex-row border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
              >
                {/* Placeholder imagen */}
                <div className="w-full h-40 sm:w-44 sm:h-auto shrink-0 bg-gray-200" />
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {n.esGlobal && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Global
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {new Date(n.creadoEn).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{n.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{n.mensaje}</p>
                  </div>
                  <button className="self-start text-xs font-semibold text-gray-700 border border-gray-200 px-4 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
                    Seguir leyendo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── COMUNIDAD ── */}
      <section id="comunidad" className="relative w-full mt-2" style={{ backgroundImage: "url('/background-comunidad.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-8 pb-10">
          <h2 className="text-white text-lg sm:text-xl font-bold mb-6 text-center">Comunidad</h2>
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6 sm:gap-10 items-start sm:items-center">
            <div className="flex flex-col divide-y divide-white/10 w-full">
              {comunidadLinks.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 group cursor-pointer">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-white text-sm font-medium group-hover:text-white/80 transition-colors truncate">
                      {item.label}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5 line-clamp-2 break-words">{item.sub}</p>
                  </div>
                  <span className="text-white/30 text-sm group-hover:text-white/60 transition-colors shrink-0">→</span>
                </div>
              ))}
            </div>
            {/* Imagen comunidad */}
            <div className="bg-gray-700 rounded-xl h-44 sm:h-56 w-full" />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#1a1a4e] py-12 sm:py-16 text-center px-5">
        <h2 className="text-white text-lg sm:text-xl font-bold mb-1">¿Tu empresa está en Atalayas?</h2>
        <p className="text-white/60 text-sm mb-6">Únete a la plataforma del parque empresarial.</p>
        <Link
          href="/login"
          className="inline-block border border-white text-white text-sm font-semibold px-8 py-2.5 rounded-md hover:bg-white hover:text-[#1a1a4e] transition-colors"
        >
          Solicitar alta
        </Link>
      </section>

    </div>
  );
}
