"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { API_URL } from "@/lib/api";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

interface Comunicado {
  comunicadoId: string;
  titulo: string;
  mensaje: string;
  imagenUrl?: string | null;
  fechaPublicacion: string;
  activo: boolean;
}

const comunidadLinks = [
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
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--gris-pagina)", color: "var(--texto-primario)" }}>

      {/* HEADER */}
      <header className="w-full bg-transparent absolute top-0 left-0 right-0 z-50">
        <div className="w-full px-5 sm:px-8 h-16 flex items-center justify-between">
          <Image src={logo} alt="Atalayas" className="h-10 sm:h-12 w-auto brightness-0 invert" />

          {/* Nav desktop */}
          <nav className="hidden sm:flex items-center gap-6 text-sm text-white/80">
            <a href="#comunidad" className="hover:text-white transition-colors">Comunidad</a>
            <a href="#noticias" className="hover:text-white transition-colors">Noticias</a>
            <Link
              href="/login"
              className="text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors uppercase tracking-wide"
              style={{ background: "var(--azul-egm)" }}
            >
              Entrar
            </Link>
          </nav>

          {/* Hamburguesa mobile */}
          <button
            className="sm:hidden text-white p-2"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menu"
          >
            <div className="w-6 h-0.5 bg-white mb-1.5" />
            <div className="w-6 h-0.5 bg-white mb-1.5" />
            <div className="w-6 h-0.5 bg-white" />
          </button>
        </div>

        {/* Menu mobile */}
        {menuAbierto && (
          <div className="sm:hidden bg-[#0D1B2E] px-5 pb-5 flex flex-col">
            <a href="#noticias" onClick={() => setMenuAbierto(false)} className="text-white/80 text-sm py-3 border-b border-white/10">Noticias</a>
            <a href="#comunidad" onClick={() => setMenuAbierto(false)} className="text-white/80 text-sm py-3 border-b border-white/10">Comunidad</a>
            <Link href="/login" onClick={() => setMenuAbierto(false)} className="text-white text-sm font-semibold py-3">Entrar</Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        className="relative w-full min-h-[75vh] flex items-center"
        style={{
          backgroundImage: "url('/background-invitado.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
        <div className="relative z-10 px-5 sm:px-10 pt-24 pb-10 sm:pb-14 w-full">
          <p className="text-white/70 text-[10px] sm:text-xs font-medium mb-2 uppercase tracking-widest">
            Bienvenido
          </p>
          <h1 className="text-white text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-4 leading-tight">
            Atalayas Ciudad Empresarial
          </h1>
          <p className={`${playfair.className} text-white/70 text-lg sm:text-2xl leading-relaxed max-w-3xl`}>
            Atalayas Ciudad Empresarial es una de las mayores áreas empresariales e industriales de la ciudad de Alicante y su provincia.
          </p>
        </div>
      </section>

      {/* NOTICIAS */}
      <section id="noticias" className="w-full max-w-7xl mx-auto px-5 sm:px-12 py-10 sm:py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--texto-primario)" }}>Noticias</h2>
          <Link href="/login" className="text-sm font-medium hidden sm:block hover:underline" style={{ color: "var(--azul-egm)" }}>
            Ver todas
          </Link>
        </div>

        {loadingComunicados ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
          </div>
        ) : comunicados.length === 0 ? (
          <p className="text-sm py-8" style={{ color: "var(--texto-muted)" }}>No hay noticias recientes.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {comunicados.map((c) => (
              <div
                key={c.comunicadoId}
                className="flex flex-col sm:flex-row rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}
              >
                {c.imagenUrl ? (
                  <div className="w-full h-44 sm:w-52 sm:h-auto shrink-0 relative">
                    <Image src={c.imagenUrl} alt={c.titulo} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-44 sm:w-52 sm:h-auto shrink-0" style={{ background: "var(--gris-superficie)" }} />
                )}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ background: "var(--azul-egm)", color: "white" }}
                      >
                        EGM Atalayas
                      </span>
                      <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                        {new Date(c.fechaPublicacion).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: "var(--texto-primario)" }}>{c.titulo}</h3>
                    <p className="text-base leading-relaxed line-clamp-3" style={{ color: "var(--texto-secundario)" }}>{c.mensaje}</p>
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

      {/* COMUNIDAD */}
      <section
        id="comunidad"
        className="relative w-full mt-2"
        style={{
          backgroundImage: "url('/background-comunidad.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.3) 100%)" }} />
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
                  <span className="text-white/30 text-sm group-hover:text-white/70 transition-colors shrink-0">&#8594;</span>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl h-64 sm:h-96 w-full"
              style={{
                backgroundImage: "url('/background-comunidad.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20 text-center px-5" style={{ background: "var(--azul-egm)" }}>
        <h2 className="text-white text-lg sm:text-2xl font-bold mb-2">¿Tu empresa está en Atalayas?</h2>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>Únete a la plataforma del parque empresarial.</p>
        <Link
          href="/register-empresa"
          className="inline-block text-sm font-semibold px-8 py-3 rounded-md transition-colors hover:opacity-90"
          style={{ background: "white", color: "var(--azul-egm)" }}
        >
          Solicitar alta
        </Link>
      </section>

    </div>
  );
}