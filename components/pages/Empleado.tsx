"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getNoticias } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { Noticia } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import ComunicadosCarousel, { ComunicadoItem } from "@/components/ui/ComunicadosCarousel";
import DotField from "@/components/ui/DotField";
import { API_URL } from "@/lib/api";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

// ── TIPOS Y MOCK FORMACIONES ──────────────────────────────────────────────────
type FormacionLocal = ModuloConProgreso & { totalItems: number; completadosLocal: number };

const MOCK_FORMACIONES_BASE: FormacionLocal[] = [
  {
    moduloId: "mock-1", nombre: "Incorporación y Bienvenida a Atalayas",
    descripcion: "Conoce la empresa, sus valores y los procedimientos de incorporación al área.",
    tipoModulo: "IDENTIDAD", orden: 1, activo: true, empresaId: null, esEspecializadoIa: false,
    creadoEn: "", actualizadoEn: "", status: "en progreso", totalItems: 6, completadosLocal: 4
  },
  {
    moduloId: "mock-2", nombre: "Comunicación Efectiva en el Trabajo",
    descripcion: "Estrategias para mejorar la comunicación interna y externa con tu equipo.",
    tipoModulo: "DESARROLLO", orden: 2, activo: true, empresaId: null, esEspecializadoIa: false,
    creadoEn: "", actualizadoEn: "", status: "pendiente", totalItems: 5, completadosLocal: 0
  },
  {
    moduloId: "mock-3", nombre: "PRL — Prevención de Riesgos Laborales",
    descripcion: "Formación obligatoria en seguridad, higiene y prevención de riesgos en el trabajo.",
    tipoModulo: "BASICA", orden: 3, activo: true, empresaId: null, esEspecializadoIa: false,
    creadoEn: "", actualizadoEn: "", status: "completado", totalItems: 4, completadosLocal: 4
  },
  {
    moduloId: "mock-4", nombre: "Digitalización y Herramientas Colaborativas",
    descripcion: "Aprende a usar las herramientas digitales del entorno laboral moderno.",
    tipoModulo: "ESPECIFICA", orden: 4, activo: true, empresaId: null, esEspecializadoIa: false,
    creadoEn: "", actualizadoEn: "", status: "pendiente", totalItems: 8, completadosLocal: 0
  },
];

const FORMACION_IMAGES_BY_ID: Record<string, string> = {
  "mock-1": "/background-formacion-empleado.jpg",
  "mock-2": "/comunicacion-trabajo.jpg",
  "mock-3": "/diversidad.jpg",
  "mock-4": "/herramientas-digitales.jpg",
};

const FORMACION_IMAGES_BY_NAME: Array<{ keywords: string[]; imagen: string }> = [
  { keywords: ["incorporac", "bienvenid", "atalayas"], imagen: "/background-formacion-empleado.jpg" },
  { keywords: ["comunicac", "efectiva", "trabajo"], imagen: "/comunicacion-trabajo.jpg" },
  { keywords: ["prl", "prevenci", "riesgos", "laboral"], imagen: "/diversidad.jpg" },
  { keywords: ["digitaliz", "herramienta", "colaborat"], imagen: "/herramientas-digitales.jpg" },
  { keywords: ["negociaci", "habilidad"], imagen: "/negociacion-habilidades.jpg" },
  { keywords: ["metodolog", "agil"], imagen: "/metodologias-agiles.jpg" },
  { keywords: ["cibersegur", "datos"], imagen: "/ciberseguridad-datos.jpg" },
  { keywords: ["diversidad", "inclusi"], imagen: "/diversidad.jpg" },
];

function getFormacionImage(moduloId: string, nombre: string): string | undefined {
  if (FORMACION_IMAGES_BY_ID[moduloId]) return FORMACION_IMAGES_BY_ID[moduloId];
  const lower = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const match = FORMACION_IMAGES_BY_NAME.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw))
  );
  return match?.imagen;
}

const LS_KEY = "egm_formacion_progress";

function loadProgress(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}"); } catch { return {}; }
}
function saveProgress(map: Record<string, number>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(map)); } catch { /* noop */ }
}
function applyProgress(base: FormacionLocal[], map: Record<string, number>): FormacionLocal[] {
  return base.map((f) => {
    const c = map[f.moduloId] ?? f.completadosLocal;
    const pct = c / f.totalItems;
    const st = pct >= 1 ? "completado" : c > 0 ? "en progreso" : "pendiente";
    return { ...f, completadosLocal: c, status: st };
  });
}

const SERVICIOS = [
  {
    label: "Coche compartido",
    desc: "Ahorra hasta 2.500€/año compartiendo ruta.",
    href: "https://www.lokinn.com/compartir-coche/atalayas",
    activo: true,
    icono: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    label: "Autobús lanzadera",
    desc: "Línea 7P con horarios laborales.",
    href: "https://atalayas.com/autobus-lanzadera/",
    activo: true,
    icono: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h2m4 0h2M3 11l1-5h16l1 5M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6M3 11h18" />
      </svg>
    ),
  },
  {
    label: "Aparcamiento VAO",
    desc: "Plazas para grupos que comparten vehículo.",
    href: "https://atalayas.com/aparcamientovao/",
    activo: true,
    icono: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4m6 0h4a2 2 0 012 2v12a2 2 0 01-2 2h-4m-6 0v-4a2 2 0 012-2h2a2 2 0 012 2v4m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Guardería",
    desc: "Conciliación familiar en el área.",
    href: null,
    activo: false,
    icono: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Descuentos y ventajas",
    desc: "Beneficios para trabajadores del parque.",
    href: null,
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
  const router = useRouter();
  const { usuario } = useAuth();

  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [formaciones, setFormaciones] = useState<ModuloConProgreso[]>([]);
  const [formacionesLocal, setFormacionesLocal] = useState<FormacionLocal[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [noticiasData, modulosData] = await Promise.all([
          getNoticias(usuario?.empresaId).catch(() => []),
          getModulosConProgreso().catch(() => []),
        ]);
        setNoticias((noticiasData as Noticia[]).slice(0, 6));
        const real = (modulosData as ModuloConProgreso[]).sort((a, b) => a.orden - b.orden);
        setFormaciones(real);
        // Si la API no devuelve módulos, usar mock con progreso de localStorage
        if (real.length === 0) {
          setFormacionesLocal(applyProgress(MOCK_FORMACIONES_BASE, loadProgress()));
        }
      } finally {
        setCargando(false);
      }
    }
    if (usuario) cargarDatos();
  }, [usuario]);

  // Avanzar progreso en una unidad (mock)
  const avanzarModulo = (moduloId: string) => {
    setFormacionesLocal((prev) => {
      const map = loadProgress();
      const m = prev.find((f) => f.moduloId === moduloId);
      if (!m || m.completadosLocal >= m.totalItems) return prev;
      const next = Math.min(m.completadosLocal + 1, m.totalItems);
      map[moduloId] = next;
      saveProgress(map);
      return applyProgress(MOCK_FORMACIONES_BASE, map);
    });
  };

  // Usa datos reales si existen, si no los mocks con localStorage
  const formDisplay: FormacionLocal[] = formaciones.length > 0
    ? formaciones.map((f) => ({ ...f, totalItems: 0, completadosLocal: 0 }))
    : formacionesLocal;

  const completados = formDisplay.filter((m) => m.status === "completado").length;
  const totalProgress = formDisplay.length > 0
    ? Math.round((completados / formDisplay.length) * 100)
    : 0;
  const siguientePaso = formDisplay.find((f) => f.status !== "completado");
  const hayModulos = formDisplay.length > 0;
  const hayProgreso = hayModulos && completados > 0;
  const noticiasEGM = noticias.filter((n) => n.esGlobal);
  const noticiasEmpresa = noticias.filter((n) => !n.esGlobal);

  // Transforma Noticia[] → ComunicadoItem[] para el carrusel
  const carouselItems: ComunicadoItem[] = noticias.length > 0
    ? noticias.map((n) => ({
      id: n.anuncioId,
      titulo: n.titulo,
      mensaje: n.contenido,
      fecha: n.creadoEn,
      tipo: n.esGlobal ? "egm" : "empresa",
    }))
    : [
      {
        id: "m1", tipo: "egm", categoria: "Novedades", fecha: "2026-04-10T09:00:00Z",
        titulo: "Apertura del nuevo espacio de coworking en el Edificio A",
        mensaje: "El nuevo espacio cuenta con 40 puestos, salas de reuniones y zona de descanso. Disponible desde el 1 de mayo.",
        imagenUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80"
      },
      {
        id: "m2", tipo: "egm", categoria: "Eventos", fecha: "2026-04-08T10:30:00Z",
        titulo: "Jornada de networking: Empresas del Parque — Mayo 2026",
        mensaje: "15 de mayo en el Salón de Actos del Edificio Central a partir de las 18:00h. Confirmad asistencia antes del 10 de mayo.",
        imagenUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
      },
      {
        id: "m3", tipo: "egm", categoria: "Avisos", fecha: "2026-04-05T08:00:00Z",
        titulo: "Mantenimiento programado del parking — 20 de abril",
        mensaje: "Trabajos de mantenimiento en parking exterior de 08:00 a 14:00h. Plazas zona B inhabilitadas.",
        imagenUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80"
      },
      {
        id: "m4", tipo: "egm", categoria: "Novedades", fecha: "2026-03-28T11:00:00Z",
        titulo: "Nueva cafetería disponible en el Edificio C",
        mensaje: "Horario 07:30–16:30h, menú del día con descuento para empleados del parque.",
        imagenUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80"
      },
      {
        id: "m5", tipo: "egm", categoria: "Avisos", fecha: "2026-03-20T09:00:00Z",
        titulo: "Actualización del protocolo de acceso con tarjeta",
        mensaje: "A partir del 25 de abril se renovará el sistema de control de acceso. Solicita tu nueva tarjeta en recepción.",
        imagenUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
      },
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
        style={{ minHeight: "320px", boxShadow: "0 6px 32px rgba(0,0,0,0.22)" }}
      >
        <img src={usuario?.bannerUrl ?? "/background-dashboard.jpg"} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 40%" }} />
        <div className="absolute inset-0"
          style={{ background: "rgba(10,20,40,0.60)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(13,27,46,0.92) 0%, rgba(13,27,46,0.50) 45%, transparent 100%)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(13,27,46,0.60) 0%, transparent 35%)" }} />

        <div className="relative z-10 w-full px-10 lg:px-16 py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
            style={{ color: "var(--verde-oliva-hover)" }}>
            {usuario?.nombreEmpresa ?? "Mi empresa"}
            <span style={{ color: "rgba(255,255,255,0.2)" }}> · </span>
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long", day: "numeric", month: "long",
            }).replace(/^\w/, (c) => c.toUpperCase())}
          </p>

          <div className="leading-none flex flex-wrap items-center gap-x-3">
            <span
              className="text-white"
              style={{
                fontSize: "clamp(3.5rem, 7vw, 4.5rem)",
                fontFamily: "var(--font-poppins), sans-serif",
                fontWeight: 300,
                letterSpacing: "-0.03em",
                animation: "heroFadeUp 0.8s ease both",
              }}
            >
              Hola,
            </span>
            <span
              style={{
                fontSize: "clamp(3.5rem, 7vw, 6rem)",
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                background: "linear-gradient(90deg, #A3B535, #ffffff, #A3B535)",
                backgroundSize: "300% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "heroFadeUp 0.8s ease 0.15s both, gradientShift 8s ease infinite",
              }}
            >
              {usuario?.nombre?.split(" ")[0] ?? "Empleado"}
            </span>
          </div>
          <style>{`
              @keyframes heroFadeUp {
                from { opacity: 0; transform: translateY(24px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              @keyframes gradientShift {
                0%, 100% { background-position: 0% 50%; }
                50%       { background-position: 100% 50%; }
              }
            `}</style>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          ONBOARDING BANNER (permanente)
      ════════════════════════════════════════════ */}
      <div className="px-10 lg:px-16 pt-8">
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          style={{ minHeight: "200px", background: "#0a1628", boxShadow: "0 4px 32px rgba(0,0,0,0.22)" }}
          onClick={() => router.push("/dashboard/formacion#onboarding")}
        >
          {/* Fondo animado de puntos */}
          <div className="absolute inset-0">
            <DotField
              dotRadius={1.5}
              dotSpacing={18}
              bulgeOnly
              bulgeStrength={60}
              glowRadius={180}
              gradientFrom="rgba(59,130,246,0.30)"
              gradientTo="rgba(99,179,237,0.18)"
              glowColor="#0a1628"
            />
          </div>
          {/* Overlay oscuro para legibilidad */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,22,40,0.75) 0%, rgba(10,22,40,0.30) 100%)" }} />

          {/* Contenido */}
          <div className="relative z-10 px-8 py-7 flex flex-col justify-between" style={{ minHeight: "200px" }}>

            {/* Fila superior: badge + título */}
            <div>
              <span className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-3"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}>
                Curso
              </span>
              <h2 className="text-2xl font-bold text-white leading-snug">
                Onboarding
              </h2>
            </div>

            {/* Fila inferior: descripción + barra de progreso */}
            <div className="flex items-center justify-between gap-6 mt-6">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <path d="M8 5v14l11-7z" />
                </svg>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Presentación, objetivos y bienvenida a la plataforma
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0" style={{ minWidth: "200px" }}>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <div className="h-full rounded-full" style={{ width: "0%", background: "rgba(255,255,255,0.6)" }} />
                </div>
                <span className="text-xs font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.45)" }}>0%</span>
              </div>
            </div>

          </div>
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
                    const content = (
                      <div
                        className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200"
                        style={{
                          background: s.activo ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                          border: s.activo ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.07)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          boxShadow: s.activo ? "inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
                        }}
                      >
                        {/* Icono */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: s.activo ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                            border: s.activo ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.06)",
                            backdropFilter: "blur(4px)",
                            WebkitBackdropFilter: "blur(4px)",
                            color: s.activo ? "white" : "rgba(255,255,255,0.2)",
                          }}
                        >
                          {s.icono}
                        </div>

                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate"
                            style={{ color: s.activo ? "white" : "rgba(255,255,255,0.25)" }}>
                            {s.label}
                          </p>
                          <p className="text-xs mt-0.5 truncate"
                            style={{ color: s.activo ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.15)" }}>
                            {s.desc}
                          </p>
                        </div>

                        {/* Acción */}
                        {s.activo ? (
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth={2}
                            style={{ color: "rgba(255,255,255,0.4)" }}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              background: "rgba(255,255,255,0.07)",
                              color: "rgba(255,255,255,0.25)",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}>
                            Próx.
                          </span>
                        )}
                      </div>
                    );

                    return s.activo && s.href ? (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                        className="block" style={{ textDecoration: "none" }}
                        onMouseEnter={(e) => {
                          const d = e.currentTarget.firstElementChild as HTMLElement;
                          if (d) {
                            d.style.background = "rgba(255,255,255,0.17)";
                            d.style.borderColor = "rgba(255,255,255,0.28)";
                            d.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const d = e.currentTarget.firstElementChild as HTMLElement;
                          if (d) {
                            d.style.background = "rgba(255,255,255,0.10)";
                            d.style.borderColor = "rgba(255,255,255,0.18)";
                            d.style.transform = "translateY(0)";
                          }
                        }}>
                        {content}
                      </a>
                    ) : <div key={s.label}>{content}</div>;
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


        {/* ── RUTA DE APRENDIZAJE ── */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <TituloSeccion noMargin>Mi formación</TituloSeccion>
              {hayModulos && (
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                  {completados === 0
                    ? "Aún no has completado ningún módulo. ¡Empieza cuando quieras!"
                    : completados === formDisplay.length
                      ? "🎉 ¡Has completado toda tu formación!"
                      : `${completados} de ${formDisplay.length} módulos completados · ${totalProgress}% del total`}
                </p>
              )}
            </div>
            {hayModulos && (
              <button onClick={() => router.push("/dashboard/formacion")}
                className="text-sm font-semibold shrink-0 hover:underline"
                style={{ color: "var(--azul-egm)" }}>
                Ver todo →
              </button>
            )}
          </div>

          {/* Barra de progreso global */}
          {hayModulos && (
            <div className="mb-8">
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--gris-borde)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${totalProgress}%`, background: "linear-gradient(90deg, var(--azul-egm) 0%, var(--verde-oliva) 100%)" }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs" style={{ color: "var(--texto-muted)" }}>Inicio</span>
                <span className="text-xs font-semibold" style={{ color: "var(--azul-egm)" }}>{totalProgress}%</span>
                <span className="text-xs" style={{ color: "var(--texto-muted)" }}>Meta</span>
              </div>
            </div>
          )}

          {!hayModulos ? (
            <div className="flex items-center gap-5 px-8 py-6 rounded-2xl"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>Aún no tienes módulos asignados</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>Tu empresa configurará el itinerario formativo en breve</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formDisplay.map((m, i) => (
                <TarjetaModulo
                  key={m.moduloId}
                  modulo={m}
                  index={i}
                  esMock={formaciones.length === 0}
                  onAvanzar={() => avanzarModulo(m.moduloId)}
                  onClick={() => router.push(`/dashboard/formacion/${m.moduloId}`)}
                  imagenUrl={getFormacionImage(m.moduloId, m.nombre)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── FILA 3: COMUNIDAD ── */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <TituloSeccion noMargin>Comunidad</TituloSeccion>
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
              Parque empresarial EGM
            </span>
          </div>

          {/* Evento destacado + iniciativas */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

            {/* Evento destacado (3/5) */}
            <div
              className="lg:col-span-3 rounded-2xl overflow-hidden relative"
              style={{ background: "var(--marino)", minHeight: "200px" }}
            >
              {/* Fondo decorativo */}
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(163,181,53,0.18) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

              <div className="relative z-10 p-6 flex flex-col h-full" style={{ minHeight: "200px" }}>
                <div className="flex items-start justify-between mb-auto">
                  <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "rgba(163,181,53,0.2)", color: "#A3B535" }}>
                    Próximo evento
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white leading-none">24</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>May</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                    Jornada de Networking EGM
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Conecta con profesionales del parque empresarial. Ponencias, mesas redondas y espacio de networking libre.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", text: "Sala Polivalente A" },
                      { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", text: "10:00 – 14:00 h" },
                      { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", text: "42 inscritos" },
                    ].map((d) => (
                      <span key={d.text} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={d.icon} />
                        </svg>
                        {d.text}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  className="mt-5 self-start text-xs font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
                  style={{ background: "#A3B535", color: "#fff" }}
                >
                  Ver detalles e inscribirme
                </button>
              </div>
            </div>

            {/* Iniciativas (2/5) */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {[
                {
                  label: "Team building",
                  desc: "Integración y trabajo en equipo entre empresas del parque",
                  fecha: "Jun 2025",
                  inscritos: 18,
                  color: "#7c3aed",
                  bg: "#ede9fe",
                  icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                },
                {
                  label: "En Femenino",
                  desc: "Liderazgo, igualdad e inspiración en el entorno empresarial",
                  fecha: "Jul 2025",
                  inscritos: 31,
                  color: "#be185d",
                  bg: "#fce7f3",
                  icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
                },
                {
                  label: "Eventos empresariales",
                  desc: "Actividades de networking entre las empresas del parque",
                  fecha: "Mensual",
                  inscritos: 60,
                  color: "var(--azul-egm)",
                  bg: "var(--azul-egm-light)",
                  icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                },
              ].map((ini) => (
                <div
                  key={ini.label}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors"
                  style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--gris-pagina)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--blanco)"; }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: ini.bg, color: ini.color }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={ini.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>{ini.label}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>{ini.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold" style={{ color: ini.color }}>{ini.fecha}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--texto-muted)" }}>{ini.inscritos} inscritos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tablón de la comunidad */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Tablón de la comunidad</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>Próximamente</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-x" style={{ borderColor: "var(--gris-borde)" }}>
              {[
                { emoji: "💬", titulo: "Foro del parque", desc: "Comparte ideas y preguntas con el resto de empresas y empleados." },
                { emoji: "📌", titulo: "Anuncios de comunidad", desc: "Comunicados transversales del parque empresarial EGM." },
                { emoji: "🤝", titulo: "Directorio de empresas", desc: "Conoce las empresas y equipos que comparten espacio contigo." },
              ].map((item, i) => (
                <div key={i} className="px-5 py-4 flex flex-col gap-2">
                  <span className="text-2xl leading-none">{item.emoji}</span>
                  <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>{item.titulo}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--texto-muted)" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


      </div>
    </div>
  );
}

// ── TÍTULO DE SECCIÓN ─────────────────────────────────────────────────────────
function TituloSeccion({ children, noMargin }: {
  children: React.ReactNode;
  noMargin?: boolean;
  letras?: boolean;
}) {
  return (
    <h2
      className={noMargin ? "" : "mb-6"}
      style={{
        fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)",
        fontFamily: "var(--font-raleway), sans-serif",
        fontWeight: 800,
        color: "var(--texto-primario)",
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
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
          <ColumnaNoticia tipo="egm" noticias={noticiasEGM} conBorde={tieneAmbas} />
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
  const esEGM = tipo === "egm";
  const acento = esEGM ? "var(--azul-egm)" : "var(--verde-oliva)";
  const label = esEGM ? "EGM Atalayas" : "Tu empresa";

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
              background: "var(--blanco)",
              border: "1px solid var(--gris-borde)",
              borderLeft: `3px solid ${acento}`,
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
  IDENTIDAD: { bg: "var(--azul-egm-light)", text: "var(--azul-egm)", label: "Identidad Corporativa" },
  BASICA: { bg: "var(--verde-oliva-light)", text: "var(--verde-oliva)", label: "Formación Básica" },
  ESPECIFICA: { bg: "var(--info-light)", text: "var(--info)", label: "Formación Específica" },
  DESARROLLO: { bg: "var(--advertencia-light)", text: "var(--advertencia)", label: "Desarrollo Profesional" },
  SEGURIDAD: { bg: "#FFF1F0", text: "#C84B31", label: "Seguridad Laboral" },
  RECOMPENSAS: { bg: "var(--exito-light)", text: "var(--exito)", label: "Recompensas" },
  COMUNIDAD: { bg: "var(--gris-superficie)", text: "var(--texto-muted)", label: "Comunidad" },
};

const STATUS_ESTILO: Record<string, { bg: string; text: string; label: string }> = {
  completado: { bg: "var(--exito-light)", text: "var(--exito)", label: "Completado" },
  "en progreso": { bg: "var(--azul-egm-light)", text: "var(--azul-egm)", label: "En progreso" },
  pendiente: { bg: "var(--gris-superficie)", text: "var(--texto-muted)", label: "Pendiente" },
};

function TarjetaModulo({ modulo, index, onClick, esMock, imagenUrl }: {
  modulo: FormacionLocal;
  index: number;
  onClick: () => void;
  onAvanzar?: () => void;
  esMock?: boolean;
  imagenUrl?: string;
}) {
  const tipo = TIPO_ACENTO[modulo.tipoModulo] ?? TIPO_ACENTO.ESPECIFICA;
  const completado = modulo.status === "completado";
  const enProgreso = modulo.status === "en progreso";

  const pct = modulo.totalItems > 0
    ? Math.round((modulo.completadosLocal / modulo.totalItems) * 100)
    : completado ? 100 : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200"
      style={{
        background: "var(--blanco)",
        border: enProgreso ? `2px solid ${tipo.text}` : "1px solid var(--gris-borde)",
        boxShadow: enProgreso ? `0 4px 16px ${tipo.text}22` : "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = enProgreso ? `0 4px 16px ${tipo.text}22` : "0 1px 4px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      {/* Imagen / Número / check */}
      {imagenUrl ? (
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative">
          <img src={imagenUrl} alt={modulo.nombre} className="w-full h-full object-cover" />
          {completado && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl"
              style={{ background: "rgba(22,163,74,0.65)" }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
          style={{
            background: completado ? "var(--exito)" : enProgreso ? tipo.text : "var(--gris-superficie)",
            color: completado || enProgreso ? "white" : "var(--texto-muted)",
          }}
        >
          {completado ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : String(index + 1).padStart(2, "0")}
        </div>
      )}

      {/* Contenido central */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold leading-snug truncate" style={{ color: "var(--texto-primario)" }}>
            {modulo.nombre}
          </p>
          {enProgreso && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: tipo.bg, color: tipo.text }}>
              En curso
            </span>
          )}
        </div>
        {/* Barra de progreso */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--gris-borde)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: completado ? "var(--exito)" : tipo.text }} />
          </div>
          <span className="text-[11px] font-semibold tabular-nums shrink-0" style={{ color: completado ? "var(--exito)" : "var(--texto-muted)" }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Flecha / check derecha */}
      <div className="shrink-0" style={{ color: completado ? "var(--exito)" : "var(--gris-borde)" }}>
        {completado ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </button>
  );
}