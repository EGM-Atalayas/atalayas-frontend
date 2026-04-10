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

      {/* HEADER */}
      <header className="w-full absolute top-0 left-0 right-0 z-50">
        <div className="w-full px-6 sm:px-10 h-20 flex items-center justify-between">
          <Image src={logo} alt="Atalayas EGM" className="h-12 sm:h-16 w-auto brightness-0 invert" />
          <nav className="hidden sm:flex items-center gap-8">
            <a href="#noticias" className="text-base font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>Noticias</a>
            <a href="#comunidad" className="text-base font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>Comunidad</a>
            <Link href="/login" className="text-base font-semibold px-7 py-3 rounded-md" style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}>Entrar</Link>
          </nav>
          <button className="sm:hidden text-white p-2 flex flex-col gap-1.5" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menu">
            <div className="w-6 h-0.5 bg-white" />
            <div className="w-6 h-0.5 bg-white" />
            <div className="w-6 h-0.5 bg-white" />
          </button>
        </div>
        {menuAbierto && (
          <div className="sm:hidden px-6 pb-6 flex flex-col" style={{ background: "var(--marino)" }}>
            <a href="#noticias" onClick={() => setMenuAbierto(false)} className="text-sm py-3" style={{ color: "rgba(255,255,255,0.8)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Noticias</a>
            <a href="#comunidad" onClick={() => setMenuAbierto(false)} className="text-sm py-3" style={{ color: "rgba(255,255,255,0.8)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Comunidad</a>
            <Link href="/login" onClick={() => setMenuAbierto(false)} className="text-sm font-semibold py-3" style={{ color: "var(--blanco)" }}>Entrar</Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        className="relative w-full min-h-[100svh] sm:min-h-[75vh] flex items-end"
        style={{ backgroundImage: "url('/background-invitado.jpg')", backgroundSize: "cover", backgroundPosition: "center 30%" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.15) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 45%)" }} />
        <div className="relative z-10 w-full px-6 sm:px-12 pb-14 sm:pb-20">
          <p className="text-xs font-semibold mb-3 uppercase tracking-[0.2em]" style={{ color: "var(--verde-oliva-hover)" }}>
            Bienvenido
          </p>
          <h1 className="text-white text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-tight">
            Atalayas Ciudad Empresarial
          </h1>
          <p className={`${playfair.className} text-lg sm:text-xl leading-relaxed max-w-2xl mb-8`} style={{ color: "rgba(255,255,255,0.7)" }}>
            La plataforma digital de incorporación y formación empresarial para las empresas del parque industrial de Atalayas, Alicante.
          </p>
          <Link href="/login" className="sm:hidden text-base font-semibold px-8 py-4 rounded-md inline-block" style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}>
            Entrar a la plataforma
          </Link>
        </div>
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

      {/* CTA FINAL */}
      {/* TODO: sustituir background-invitado.jpg por imagen diferente cuando este disponible */}
      <section
        className="relative w-full py-20 sm:py-28"
        style={{ backgroundImage: "url('/background-invitado.jpg')", backgroundSize: "cover", backgroundPosition: "center 60%" }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(13,27,46,0.88)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--verde-oliva-hover)" }}>
            Únete a Atalayas
          </p>
          <h2 className="text-white text-2xl sm:text-4xl font-bold mb-4 leading-tight">
            ¿Tu empresa está en el parque empresarial?
          </h2>
          <p className={`${playfair.className} text-lg mb-8 leading-relaxed`} style={{ color: "rgba(255,255,255,0.6)" }}>
            Digitaliza la incorporación y formación interna de tu equipo en minutos. Sin conocimientos técnicos.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register-empresa" className="text-sm font-semibold px-7 py-3 rounded-md" style={{ background: "var(--blanco)", color: "var(--azul-egm)" }}>
              Solicitar alta
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}