"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getNoticias } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { Noticia } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import SplitText from "@/components/ui/SplitText";
import GradientText from "@/components/ui/GradientText";
import ComunicadosCarousel, { ComunicadoItem } from "@/components/ui/ComunicadosCarousel";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const SERVICIOS = [
  {
    label:  "Coche compartido",
    desc:   "Ahorra hasta 2.500€/año compartiendo ruta.",
    href:   "https://www.lokinn.com/compartir-coche/atalayas",
    activo: true,
    icono: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    label:  "Autobús lanzadera",
    desc:   "Línea 7P con horarios laborales.",
    href:   "https://atalayas.com/autobus-lanzadera/",
    activo: true,
    icono: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h2m4 0h2M3 11l1-5h16l1 5M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6M3 11h18" />
      </svg>
    ),
  },
  {
    label:  "Aparcamiento VAO",
    desc:   "Plazas para grupos que comparten vehículo.",
    href:   "https://atalayas.com/aparcamientovao/",
    activo: true,
    icono: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4m6 0h4a2 2 0 012 2v12a2 2 0 01-2 2h-4m-6 0v-4a2 2 0 012-2h2a2 2 0 012 2v4m-6 0h6" />
      </svg>
    ),
  },
  {
    label:  "Guardería",
    desc:   "Conciliación familiar en el área.",
    href:   null,
    activo: false,
    icono: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label:  "Descuentos y ventajas",
    desc:   "Beneficios para trabajadores del parque.",
    href:   null,
    activo: false,
    icono: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Empleado() {
  const router      = useRouter();
  const { usuario } = useAuth();

  const [noticias, setNoticias]       = useState<Noticia[]>([]);
  const [formaciones, setFormaciones] = useState<ModuloConProgreso[]>([]);
  const [cargando, setCargando]       = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [noticiasData, modulosData] = await Promise.all([
          getNoticias(usuario?.empresaId).catch(() => []),
          getModulosConProgreso().catch(() => []),
        ]);
        setNoticias((noticiasData as Noticia[]).slice(0, 6));
        setFormaciones(
          (modulosData as ModuloConProgreso[]).sort((a, b) => a.orden - b.orden)
        );
      } finally {
        setCargando(false);
      }
    }
    if (usuario) cargarDatos();
  }, [usuario]);

  const completados   = formaciones.filter((m) => m.status === "completado").length;
  const totalProgress = formaciones.length > 0
    ? Math.round((completados / formaciones.length) * 100)
    : 0;
  const siguientePaso = formaciones.find((f) => f.status !== "completado");
  const hayModulos    = formaciones.length > 0;
  const hayProgreso   = hayModulos && completados > 0;
  const noticiasEGM     = noticias.filter((n) => n.esGlobal);
  const noticiasEmpresa = noticias.filter((n) => !n.esGlobal);

  // Transforma Noticia[] → ComunicadoItem[] para el carrusel
  const carouselItems: ComunicadoItem[] = noticias.length > 0
    ? noticias.map((n) => ({
        id:       n.anuncioId,
        titulo:   n.titulo,
        mensaje:  n.contenido,
        fecha:    n.creadoEn,
        tipo:     n.esGlobal ? "egm" : "empresa",
      }))
    : [
        { id: "m1", tipo: "egm", categoria: "Novedades", fecha: "2026-04-10T09:00:00Z",
          titulo: "Apertura del nuevo espacio de coworking en el Edificio A",
          mensaje: "El nuevo espacio cuenta con 40 puestos, salas de reuniones y zona de descanso. Disponible desde el 1 de mayo.",
          imagenUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80" },
        { id: "m2", tipo: "egm", categoria: "Eventos", fecha: "2026-04-08T10:30:00Z",
          titulo: "Jornada de networking: Empresas del Parque — Mayo 2026",
          mensaje: "15 de mayo en el Salón de Actos del Edificio Central a partir de las 18:00h. Confirmad asistencia antes del 10 de mayo.",
          imagenUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80" },
        { id: "m3", tipo: "egm", categoria: "Avisos", fecha: "2026-04-05T08:00:00Z",
          titulo: "Mantenimiento programado del parking — 20 de abril",
          mensaje: "Trabajos de mantenimiento en parking exterior de 08:00 a 14:00h. Plazas zona B inhabilitadas.",
          imagenUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80" },
        { id: "m4", tipo: "egm", categoria: "Novedades", fecha: "2026-03-28T11:00:00Z",
          titulo: "Nueva cafetería disponible en el Edificio C",
          mensaje: "Horario 07:30–16:30h, menú del día con descuento para empleados del parque.",
          imagenUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80" },
        { id: "m5", tipo: "egm", categoria: "Avisos", fecha: "2026-03-20T09:00:00Z",
          titulo: "Actualización del protocolo de acceso con tarjeta",
          mensaje: "A partir del 25 de abril se renovará el sistema de control de acceso. Solicita tu nueva tarjeta en recepción.",
          imagenUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
      ];

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
      </div>
    );
  }

  return (
    <div>
      {/* ════════════════════════════════════════════
          BANDA HERO
      ════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden flex items-center"
        style={{ minHeight: "300px", boxShadow: "0 6px 32px rgba(0,0,0,0.22)" }}
      >
        <img src="/background-dashboard.jpg" alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 40%" }} />
        <div className="absolute inset-0"
          style={{ background: "rgba(10,20,40,0.60)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(13,27,46,0.92) 0%, rgba(13,27,46,0.50) 45%, transparent 100%)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(13,27,46,0.60) 0%, transparent 35%)" }} />

        <div className="relative z-10 w-full px-10 lg:px-16 py-16 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6"
              style={{ color: "var(--verde-oliva-hover)" }}>
              {usuario?.nombreEmpresa ?? "Mi empresa"}
              <span style={{ color: "rgba(255,255,255,0.2)" }}> · </span>
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long", day: "numeric", month: "long",
              }).replace(/^\w/, (c) => c.toUpperCase())}
            </p>

            {/* Tipografía diferenciada: "Hola," en Sans, nombre en Serif italic */}
            <div className="leading-none mb-1" style={{ marginBottom: siguientePaso ? "2.5rem" : "0" }}>
              <span
                className="text-white"
                style={{
                  fontSize:      "clamp(3.5rem, 7vw, 4.5rem)",
                  fontFamily:    "'Instrument Sans', sans-serif",
                  fontWeight:    300,
                  letterSpacing: "-0.03em",
                }}
              >
                Hola,{" "}
              </span>
              <GradientText
                style={{
                  fontSize:      "clamp(3.5rem, 7vw, 6rem)",
                  fontFamily:    "'Instrument Serif', serif",
                  fontStyle:     "italic",
                  fontWeight:    400,
                  letterSpacing: "-0.01em",
                }}
              >
                <SplitText
                  text={usuario?.nombre?.split(" ")[0] ?? "Empleado"}
                  tag="span"
                  textAlign="left"
                  delay={40}
                  duration={0.9}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 60 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="0px"
                />
              </GradientText>
            </div>

            {siguientePaso && (
              <div className="inline-flex items-center gap-4 rounded-2xl px-6 py-4"
                style={{
                  background:     "rgba(255,255,255,0.08)",
                  border:         "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(12px)",
                  maxWidth:       "520px",
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--verde-oliva)" }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                    style={{ color: "var(--verde-oliva-hover)" }}>
                    Siguiente paso
                  </p>
                  <p className="text-base font-semibold text-white truncate">
                    {siguientePaso.nombre}
                  </p>
                </div>
                <button onClick={() => router.push("/dashboard/formacion")}
                  className="text-sm font-bold px-5 py-2.5 rounded-xl shrink-0 whitespace-nowrap transition-opacity"
                  style={{ background: "var(--verde-oliva)", color: "var(--blanco)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                  Continuar →
                </button>
              </div>
            )}
          </div>

          {hayProgreso && (
            <div className="flex flex-row lg:flex-col gap-4 shrink-0">
              <div className="rounded-2xl px-8 py-6 text-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(10px)", minWidth: "150px" }}>
                <p className="text-white leading-none"
                  style={{ fontSize: "3.8rem", fontFamily: "'Instrument Serif', serif" }}>
                  {totalProgress}<span style={{ fontSize: "2rem", color: "var(--verde-oliva-hover)" }}>%</span>
                </p>
                <p className="text-xs uppercase tracking-wider mt-2" style={{ color: "rgba(255,255,255,0.38)" }}>Completado</p>
              </div>
              <div className="rounded-2xl px-8 py-6 text-center"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", minWidth: "150px" }}>
                <p className="text-white leading-none"
                  style={{ fontSize: "3rem", fontFamily: "'Instrument Serif', serif" }}>
                  {completados}<span style={{ fontSize: "1.5rem", color: "rgba(255,255,255,0.28)" }}>/{formaciones.length}</span>
                </p>
                <p className="text-xs uppercase tracking-wider mt-2" style={{ color: "rgba(255,255,255,0.38)" }}>Módulos</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          CONTENIDO
      ════════════════════════════════════════════ */}
      <div className="px-10 lg:px-16 pt-14 pb-16 flex flex-col gap-16">

        {/* ── FILA 1: COMUNICACIONES (2/3) + SERVICIOS (1/3) ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

            {/* COMUNICACIONES — 2/3 */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="mb-6"><TituloSeccion noMargin letras>Comunicaciones</TituloSeccion></div>
              <ComunicadosCarousel
                items={carouselItems}
                autoplay
                autoplayDelay={4500}
                pauseOnHover
                loop
              />
            </div>

            {/* SERVICIOS DEL PARQUE — 1/3 */}
            <div className="flex flex-col">
              <div className="mb-6"><TituloSeccion noMargin letras>Servicios</TituloSeccion></div>
              <div
                className="rounded-2xl overflow-hidden flex-1 relative"
                style={{ background: "linear-gradient(160deg, #1B3F7E 0%, #0D1B2E 100%)" }}
              >
                {/* Glow decorativo */}
                <div className="absolute pointer-events-none" style={{
                  top: "-60px", left: "-60px", width: "240px", height: "240px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)",
                }} />

                {/* Mini cabecera */}
                <div className="relative px-4 pt-4 pb-3 flex items-center justify-between"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.38)" }}>
                    Servicios del parque
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {SERVICIOS.filter(s => s.activo).length} / {SERVICIOS.length} activos
                  </span>
                </div>

                <div className="relative p-4 flex flex-col gap-2">
                  {SERVICIOS.map((s) => {
                    const item = (
                      <div
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all"
                        style={{
                          background: s.activo ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                          border:     s.activo ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: s.activo ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)",
                            color:      s.activo ? "white"                  : "rgba(255,255,255,0.25)",
                          }}>
                          {s.icono}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate"
                            style={{ color: s.activo ? "white" : "rgba(255,255,255,0.3)" }}>
                            {s.label}
                          </p>
                          <p className="text-xs truncate"
                            style={{ color: s.activo ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)" }}>
                            {s.desc}
                          </p>
                        </div>
                        {s.activo && (
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth={2.5}
                            style={{ color: "rgba(255,255,255,0.35)" }}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </div>
                    );
                    return s.activo && s.href ? (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                        className="block" style={{ textDecoration: "none" }}
                        onMouseEnter={(e) => {
                          const d = e.currentTarget.firstElementChild as HTMLElement;
                          if (d) { d.style.background = "rgba(255,255,255,0.2)"; d.style.borderColor = "rgba(255,255,255,0.25)"; }
                        }}
                        onMouseLeave={(e) => {
                          const d = e.currentTarget.firstElementChild as HTMLElement;
                          if (d) { d.style.background = "rgba(255,255,255,0.12)"; d.style.borderColor = "rgba(255,255,255,0.16)"; }
                        }}>
                        {item}
                      </a>
                    ) : <div key={s.label}>{item}</div>;
                  })}
                </div>
              </div>
            </div>

          </div>
          <div className="flex justify-start mt-3">
            <Link href="/dashboard/comunicacion"
              className="text-sm font-semibold hover:underline"
              style={{ color: "var(--azul-egm)" }}>
              Ver todas →
            </Link>
          </div>
        </section>

        {/* ── FILA 2: FORMACIÓN — ancho completo ── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <TituloSeccion noMargin>Mi itinerario</TituloSeccion>
            <div className="flex items-center gap-5">
              {hayProgreso && (
                <span className="text-base" style={{ color: "var(--texto-muted)" }}>
                  <span style={{ color: "var(--texto-primario)", fontWeight: 700 }}>{completados}</span>
                  /{formaciones.length} completados
                </span>
              )}
              {hayModulos && (
                <button onClick={() => router.push("/dashboard/formacion")}
                  className="text-base font-semibold hover:underline"
                  style={{ color: "var(--azul-egm)" }}>
                  Ver todo →
                </button>
              )}
            </div>
          </div>

          {hayModulos && (
            <div className="h-px w-full mb-6 rounded-full overflow-hidden"
              style={{ background: "var(--gris-borde)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${totalProgress}%`,
                  background: "linear-gradient(90deg, var(--azul-egm) 0%, var(--verde-oliva) 100%)",
                }} />
            </div>
          )}

          {!hayModulos ? (
            <div className="flex items-center gap-5 px-8 py-6 rounded-2xl"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: "var(--texto-primario)" }}>
                  Aún no tienes módulos asignados
                </p>
                <p className="text-base mt-0.5" style={{ color: "var(--texto-muted)" }}>
                  Tu empresa configurará el itinerario formativo en breve
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {formaciones.map((m, i) => (
                <TarjetaModulo
                  key={m.moduloId}
                  modulo={m}
                  index={i}
                  onClick={() => router.push(`/dashboard/formacion/${m.moduloId}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── FILA 3: COMUNIDAD — discreta, al final ── */}
        <section>
          <TituloSeccion>Comunidad</TituloSeccion>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Eventos empresariales", desc: "Actividades y networking en el parque" },
              { label: "Team building",          desc: "Iniciativas colectivas entre empresas" },
              { label: "En Femenino",            desc: "Liderazgo e igualdad en el entorno laboral" },
            ].map((item) => (
              <div key={item.label}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                style={{
                  background: "var(--blanco)",
                  border:     "1px solid var(--gris-borde)",
                  opacity:    0.7,
                }}>
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: "var(--verde-oliva)" }} />
                <div className="min-w-0">
                  <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
                    {item.label}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
                    {item.desc}
                  </p>
                </div>
                <span className="ml-auto text-xs font-medium shrink-0 px-2 py-0.5 rounded-full"
                  style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                  Próx.
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

// ── TÍTULO DE SECCIÓN ─────────────────────────────────────────────────────────
function TituloSeccion({ children, noMargin, letras }: {
  children: React.ReactNode;
  noMargin?: boolean;
  letras?:  boolean;
}) {
  return (
    <h2
      className={noMargin ? "" : "mb-6"}
      style={{
        fontSize:      "clamp(2rem, 2.8vw, 2.8rem)",
        fontFamily:    "'Instrument Serif', serif",
        fontWeight:    400,
        color:         "var(--texto-primario)",
        letterSpacing: letras ? "0.04em" : "-0.02em",
      }}
    >
      {children}
    </h2>
  );
}

// ── SECCIÓN COMUNICACIONES (patrón invitado) ──────────────────────────────────
function SeccionComunicaciones({ noticiasEGM, noticiasEmpresa }: {
  noticiasEGM: Noticia[]; noticiasEmpresa: Noticia[];
}) {
  const tieneAmbas = noticiasEGM.length > 0 && noticiasEmpresa.length > 0;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--gris-borde)" }}>

      {/* Cabecera */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ background: "var(--blanco)", borderBottom: "1px solid var(--gris-borde)" }}>
        <h2 className="text-base font-bold" style={{ color: "var(--texto-primario)" }}>
          Últimas comunicaciones
        </h2>
        <Link href="/dashboard/comunicacion"
          className="text-sm font-semibold hover:underline"
          style={{ color: "var(--azul-egm)" }}>
          Ver todas →
        </Link>
      </div>

      {/* Grid de columnas — mismo patrón que invitado */}
      <div
        className={`grid ${tieneAmbas ? "lg:grid-cols-2" : "grid-cols-1"}`}
        style={{ background: "var(--gris-pagina)" }}
      >
        {noticiasEGM.length > 0 && (
          <ColumnaNoticia tipo="egm"     noticias={noticiasEGM}     conBorde={tieneAmbas} />
        )}
        {noticiasEmpresa.length > 0 && (
          <ColumnaNoticia tipo="empresa" noticias={noticiasEmpresa} conBorde={false} />
        )}
      </div>
    </div>
  );
}

function ColumnaNoticia({ tipo, noticias, conBorde }: {
  tipo: "egm" | "empresa"; noticias: Noticia[]; conBorde: boolean;
}) {
  const esEGM  = tipo === "egm";
  const acento = esEGM ? "var(--azul-egm)"  : "var(--verde-oliva)";
  const label  = esEGM ? "EGM Atalayas"     : "Tu empresa";

  return (
    <div className="p-5"
      style={{ borderRight: conBorde && esEGM ? "1px solid var(--gris-borde)" : "none" }}>

      {/* Etiqueta de columna */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: acento }} />
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: acento }}>
          {label}
        </p>
      </div>

      {/* Tarjetas */}
      <div className="flex flex-col gap-2.5">
        {noticias.map((n) => (
          <div key={n.anuncioId}
            className="rounded-xl px-4 py-3 transition-colors"
            style={{
              background:  "var(--blanco)",
              border:      "1px solid var(--gris-borde)",
              borderLeft:  `3px solid ${acento}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blanco)")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                  {n.titulo}
                </p>
                <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed"
                  style={{ color: "var(--texto-muted)" }}>
                  {n.contenido}
                </p>
              </div>
              <span className="text-xs shrink-0 mt-0.5 whitespace-nowrap"
                style={{ color: "var(--texto-muted)" }}>
                {formatFecha(n.creadoEn)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TARJETA MÓDULO ────────────────────────────────────────────────────────────
const TIPO_ACENTO: Record<string, { bg: string; text: string; label: string }> = {
  IDENTIDAD:   { bg: "var(--azul-egm-light)",   text: "var(--azul-egm)",    label: "Identidad Corporativa" },
  BASICA:      { bg: "var(--verde-oliva-light)", text: "var(--verde-oliva)", label: "Formación Básica" },
  ESPECIFICA:  { bg: "var(--info-light)",        text: "var(--info)",        label: "Formación Específica" },
  DESARROLLO:  { bg: "var(--advertencia-light)", text: "var(--advertencia)", label: "Desarrollo Profesional" },
  RECOMPENSAS: { bg: "var(--exito-light)",       text: "var(--exito)",       label: "Recompensas" },
  COMUNIDAD:   { bg: "var(--gris-superficie)",   text: "var(--texto-muted)", label: "Comunidad" },
};

const STATUS_ESTILO: Record<string, { bg: string; text: string; label: string }> = {
  completado:    { bg: "var(--exito-light)",     text: "var(--exito)",       label: "Completado" },
  "en progreso": { bg: "var(--azul-egm-light)",  text: "var(--azul-egm)",    label: "En progreso" },
  pendiente:     { bg: "var(--gris-superficie)", text: "var(--texto-muted)", label: "Pendiente" },
};

function TarjetaModulo({ modulo, index, onClick }: {
  modulo: ModuloConProgreso; index: number; onClick: () => void;
}) {
  const tipo   = TIPO_ACENTO[modulo.tipoModulo] ?? TIPO_ACENTO.ESPECIFICA;
  const status = STATUS_ESTILO[modulo.status]   ?? STATUS_ESTILO.pendiente;
  return (
    <div
      className="flex items-center gap-4 rounded-2xl px-5 py-4 cursor-pointer transition-colors"
      style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-pagina)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blanco)")}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
        style={{ background: tipo.bg, color: tipo.text }}>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
          {modulo.nombre}
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>{tipo.label}</p>
      </div>
      <span className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
        style={{ background: status.bg, color: status.text }}>
        {status.label}
      </span>
    </div>
  );
}