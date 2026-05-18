"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getNoticias } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { Noticia } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import ComunicadosCarousel, { ComunicadoItem } from "@/components/ui/ComunicadosCarousel";
import DashboardHero from "@/components/ui/DashboardHero";

// ── TIPOS Y MOCK FORMACIONES ──────────────────────────────────────────────────
type FormacionLocal = ModuloConProgreso & { totalItems: number; completadosLocal: number };

// Tipo local para el widget de servicios del parque (desacoplado del tipo global)
type Servicio = { servicioId: string; label: string; desc: string | null; href: string | null; activo: boolean; icono: string | null; orden: number; };

const MOCK_FORMACIONES_BASE: FormacionLocal[] = [
  { moduloId: "mock-1", nombre: "Incorporación y Bienvenida a Atalayas",
    descripcion: "Conoce la empresa, sus valores y los procedimientos de incorporación al área.",
    tipoModulo: "IDENTIDAD", orden: 1, activo: true, empresaId: null, esEspecializadoIa: false,
    creadoEn: "", actualizadoEn: "", status: "en progreso", totalItems: 6, completadosLocal: 4 },
  { moduloId: "mock-2", nombre: "Comunicación Efectiva en el Trabajo",
    descripcion: "Estrategias para mejorar la comunicación interna y externa con tu equipo.",
    tipoModulo: "DESARROLLO", orden: 2, activo: true, empresaId: null, esEspecializadoIa: false,
    creadoEn: "", actualizadoEn: "", status: "pendiente", totalItems: 5, completadosLocal: 0 },
  { moduloId: "mock-3", nombre: "PRL — Prevención de Riesgos Laborales",
    descripcion: "Formación obligatoria en seguridad, higiene y prevención de riesgos en el trabajo.",
    tipoModulo: "BASICA", orden: 3, activo: true, empresaId: null, esEspecializadoIa: false,
    creadoEn: "", actualizadoEn: "", status: "completado", totalItems: 4, completadosLocal: 4 },
  { moduloId: "mock-4", nombre: "Digitalización y Herramientas Colaborativas",
    descripcion: "Aprende a usar las herramientas digitales del entorno laboral moderno.",
    tipoModulo: "ESPECIFICA", orden: 4, activo: true, empresaId: null, esEspecializadoIa: false,
    creadoEn: "", actualizadoEn: "", status: "pendiente", totalItems: 8, completadosLocal: 0 },
];

const FORMACION_IMAGES_BY_ID: Record<string, string> = {
  "mock-1": "/background-formacion-empleado.webp",
  "mock-2": "/comunicacion-trabajo.webp",
  "mock-3": "/diversidad.webp",
  "mock-4": "/herramientas-digitales.webp",
};

const FORMACION_IMAGES_BY_NAME: Array<{ keywords: string[]; imagen: string }> = [
  { keywords: ["incorporac", "bienvenid", "atalayas"],    imagen: "/background-formacion-empleado.webp" },
  { keywords: ["comunicac", "efectiva", "trabajo"],       imagen: "/comunicacion-trabajo.webp" },
  { keywords: ["prl", "prevenci", "riesgos", "laboral"],  imagen: "/diversidad.webp" },
  { keywords: ["digitaliz", "herramienta", "colaborat"],  imagen: "/herramientas-digitales.webp" },
  { keywords: ["negociaci", "habilidad"],                 imagen: "/negociacion-habilidades.webp" },
  { keywords: ["metodolog", "agil"],                      imagen: "/metodologias-agiles.webp" },
  { keywords: ["cibersegur", "datos"],                    imagen: "/ciberseguridad-datos.webp" },
  { keywords: ["diversidad", "inclusi"],                  imagen: "/diversidad.webp" },
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
    const c   = map[f.moduloId] ?? f.completadosLocal;
    const pct = c / f.totalItems;
    const st  = pct >= 1 ? "completado" : c > 0 ? "en progreso" : "pendiente";
    return { ...f, completadosLocal: c, status: st };
  });
}

// Lee el progreso guardado desde la página de detalle del módulo (egm_modulo_{id})
function leerProgresoModulo(moduloId: string): { completados: number; total: number } | null {
  try {
    const raw = localStorage.getItem(`egm_modulo_${moduloId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data.total === "number" && Array.isArray(data.completados)) {
      return { completados: data.completados.length, total: data.total };
    }
  } catch { /* noop */ }
  return null;
}

const ICONO_MAP: Record<string, React.ReactNode> = {
  coche_compartido: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  autobus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h2m4 0h2M3 11l1-5h16l1 5M3 11v6a1 1 0 001 1h1m14 0h1a1 1 0 001-1v-6M3 11h18" />
    </svg>
  ),
  aparcamiento: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4m6 0h4a2 2 0 012 2v12a2 2 0 01-2 2h-4m-6 0v-4a2 2 0 012-2h2a2 2 0 012 2v4m-6 0h6" />
    </svg>
  ),
  guarderia: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  descuentos: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
};

const SERVICIOS_MOCK: Servicio[] = [
  { servicioId: "m1", label: "Coche compartido", desc: "Ahorra hasta 2.500€/año compartiendo ruta.", href: "https://www.lokinn.com/compartir-coche/atalayas", activo: true, icono: "coche_compartido", orden: 1 },
  { servicioId: "m2", label: "Autobús lanzadera", desc: "Línea 7P con horarios laborales.", href: "https://atalayas.com/autobus-lanzadera/", activo: true, icono: "autobus", orden: 2 },
  { servicioId: "m3", label: "Aparcamiento VAO", desc: "Plazas para grupos que comparten vehículo.", href: "https://atalayas.com/aparcamientovao/", activo: true, icono: "aparcamiento", orden: 3 },
  { servicioId: "m4", label: "Guardería", desc: "Conciliación familiar en el área.", href: "https://atalayas.com/servicios/", activo: true, icono: "guarderia", orden: 4 },
  { servicioId: "m5", label: "Descuentos y ventajas", desc: "Beneficios para trabajadores del parque.", href: "https://atalayas.com/servicios-a-los-trabajadores/", activo: true, icono: "descuentos", orden: 5 },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Empleado() {
  const router      = useRouter();
  const { usuario } = useAuth();

  const [noticias, setNoticias]               = useState<Noticia[]>([]);
  const [formaciones, setFormaciones]         = useState<ModuloConProgreso[]>([]);
  const [formacionesLocal, setFormacionesLocal] = useState<FormacionLocal[]>([]);
  const [cargando, setCargando]               = useState(true);

  // Ref al contenedor de scroll horizontal de "Mi formación" para los botones de navegación
  const formScrollRef = useRef<HTMLDivElement>(null);
  const scrollFormacion = (dir: "left" | "right") => {
    const el = formScrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-tarjeta-curso]");
    const step = card ? card.offsetWidth + 16 /* gap-4 */ : 280;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [noticiasData, modulosData] = await Promise.all([
          getNoticias(usuario?.empresaId).catch(() => []),
          getModulosConProgreso(usuario?.empresaId).catch(() => []),
        ]);
        const filtradas = usuario?.empresaId
          ? (noticiasData as Noticia[]).filter((n) => n.empresaId === usuario.empresaId)
          : (noticiasData as Noticia[]).filter((n) => !n.empresaId);
        setNoticias(filtradas.slice(0, 6));
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
      const m   = prev.find((f) => f.moduloId === moduloId);
      if (!m || m.completadosLocal >= m.totalItems) return prev;
      const next = Math.min(m.completadosLocal + 1, m.totalItems);
      map[moduloId] = next;
      saveProgress(map);
      return applyProgress(MOCK_FORMACIONES_BASE, map);
    });
  };

  // Usa datos reales si existen, si no los mocks con localStorage
  // El progreso real (completados/totalItems) se lee desde egm_modulo_{id}
  // guardado por la página de detalle del módulo
  const formDisplay: FormacionLocal[] = formaciones.length > 0
    ? formaciones.map((f) => {
        const ls = leerProgresoModulo(f.moduloId);
        const completadosLocal = ls?.completados ?? 0;
        const totalItems = ls?.total ?? 0;
        const st: FormacionLocal["status"] = totalItems > 0 && completadosLocal >= totalItems
          ? "completado"
          : completadosLocal > 0
            ? "en progreso"
            : f.status;
        return { ...f, totalItems, completadosLocal, status: st };
      })
    : formacionesLocal;

  const completados   = formDisplay.filter((m) => m.status === "completado").length;
  const totalProgress = formDisplay.length > 0
    ? Math.round((completados / formDisplay.length) * 100)
    : 0;
  const hayModulos    = formDisplay.length > 0;

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

  const nombreCorto = usuario?.nombre?.split(" ")[0] ?? "Empleado";

  // ── Estado del onboarding (desde localStorage; lo gestiona /dashboard/onboarding) ──
  const onboardingProgreso = (() => {
    try {
      const raw = localStorage.getItem("egm_onboarding_progress");
      if (!raw) return 0;
      const data = JSON.parse(raw);
      if (typeof data?.porcentaje === "number") return data.porcentaje;
      return 0;
    } catch { return 0; }
  })();
  const onboardingIncompleto = onboardingProgreso < 100;

  // ── Ordenamiento inteligente: en curso → pendientes → completados ──
  const formOrdenado = [...formDisplay].sort((a, b) => {
    const peso = (s: string) => s === "en progreso" ? 0 : s === "pendiente" ? 1 : 2;
    return peso(a.status) - peso(b.status);
  });

  return (
    <div>
      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <DashboardHero
        variante="inicio"
        prefijo="Hola,"
        titulo={nombreCorto}
        imagenFondo={usuario?.bannerUrl ?? "/background-dashboard.webp"}
        objectPosition="center 40%"
      />

      {/* ════════════════════════════════════════════
          HERO ACTION — Solo si onboarding incompleto
      ════════════════════════════════════════════ */}
      {onboardingIncompleto && (
        <div className="px-5 sm:px-8 lg:px-16 pt-5 sm:pt-7">
          <div
            className="relative flex items-center gap-3 sm:gap-6 px-4 sm:px-7 py-4 sm:py-5 rounded-2xl cursor-pointer overflow-hidden"
            style={{ background: "#0a1628", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
            onClick={() => router.push("/dashboard/onboarding")}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.28)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.18)"; }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse at 95% 50%, rgba(163,181,53,0.12) 0%, transparent 60%)",
            }} />

            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 relative z-10"
              style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: "var(--verde-oliva-hover)" }}>
                Proceso de incorporación
              </p>
              <p className="text-sm sm:text-base font-semibold text-white mb-2">
                Completa tu onboarding en Atalayas
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${onboardingProgreso}%`, background: "linear-gradient(90deg, var(--azul-egm) 0%, var(--verde-oliva-hover) 100%)" }} />
                </div>
                <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {onboardingProgreso}%
                </span>
              </div>
            </div>

            <div
              className="shrink-0 hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl relative z-10"
              style={{ background: "var(--verde-oliva-hover)", color: "#fff" }}
            >
              <span className="text-sm font-semibold">Continuar</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div className="shrink-0 sm:hidden relative z-10" style={{ color: "rgba(255,255,255,0.45)" }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          CONTENIDO
      ════════════════════════════════════════════ */}
      <div className="px-5 sm:px-8 lg:px-16 pt-8 sm:pt-10 pb-16 flex flex-col gap-10 sm:gap-14">

        {/* ── SERVICIOS DEL PARQUE — chips compactos justo debajo del onboarding ── */}
        <section>
          <div className="mb-4 text-center">
            <TituloSeccion noMargin>Servicios del parque</TituloSeccion>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {SERVICIOS_MOCK.filter((s) => s.activo).slice(0, 8).map((s) => {
              const chip = (
                <span
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full text-base font-semibold transition-all"
                  style={{
                    background: "var(--blanco)",
                    border:     "1px solid var(--gris-borde)",
                    color:      "var(--texto-primario)",
                    boxShadow:  "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--azul-egm)";
                    (e.currentTarget as HTMLElement).style.background  = "var(--azul-egm-light)";
                    (e.currentTarget as HTMLElement).style.transform   = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow   = "0 4px 12px rgba(27,63,126,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--gris-borde)";
                    (e.currentTarget as HTMLElement).style.background  = "var(--blanco)";
                    (e.currentTarget as HTMLElement).style.transform   = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow   = "0 1px 4px rgba(0,0,0,0.04)";
                  }}
                >
                  <span className="flex items-center justify-center w-6 h-6 [&_svg]:w-5 [&_svg]:h-5" style={{ color: "var(--azul-egm)" }}>
                    {ICONO_MAP[s.icono ?? ""] ?? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </span>
                  {s.label}
                </span>
              );
              return s.href ? (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}>
                  {chip}
                </a>
              ) : (
                <button key={s.label} type="button" onClick={() => router.push("/dashboard/servicios")}
                  style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                  {chip}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── COMUNICACIONES (ancho completo) ── */}
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <TituloSeccion noMargin>Comunicaciones</TituloSeccion>
            <Link href="/dashboard/comunicacion"
              className="text-sm font-semibold shrink-0 hover:underline mb-1"
              style={{ color: "var(--azul-egm)" }}>
              Ver todas →
            </Link>
          </div>
          <ComunicadosCarousel
            items={carouselItems}
            autoplay
            autoplayDelay={4500}
            pauseOnHover
            loop
            minHeight={460}
          />
        </section>


        {/* ── MI FORMACIÓN — grid vertical de tarjetas ── */}
        <section>
          <div className="flex items-end justify-between mb-5 gap-4">
            <div>
              <TituloSeccion noMargin>Mi formación</TituloSeccion>
              {hayModulos && (
                <p className="text-sm mt-1.5" style={{ color: "var(--texto-muted)" }}>
                  {completados === 0
                    ? "Aún no has completado ningún módulo. ¡Empieza cuando quieras!"
                    : completados === formDisplay.length
                    ? "¡Has completado toda tu formación!"
                    : `${completados} de ${formDisplay.length} módulos completados · ${totalProgress}% del total`}
                </p>
              )}
            </div>
            {hayModulos && (
              <Link href="/dashboard/formacion"
                className="text-sm font-semibold shrink-0 hover:underline mb-1"
                style={{ color: "var(--azul-egm)" }}>
                Ver todo →
              </Link>
            )}
          </div>

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
            <div className="relative group">
              {/* Botón izquierda — solo flecha, sin círculo */}
              <button
                type="button"
                onClick={() => scrollFormacion("left")}
                aria-label="Anterior"
                className="absolute -left-12 top-1/2 -translate-y-1/2 z-20 transition-transform hover:scale-125 hidden sm:flex items-center justify-center bg-transparent border-0 cursor-pointer"
                style={{ color: "var(--texto-primario)" }}
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Botón derecha — solo flecha, sin círculo */}
              <button
                type="button"
                onClick={() => scrollFormacion("right")}
                aria-label="Siguiente"
                className="absolute -right-12 top-1/2 -translate-y-1/2 z-20 transition-transform hover:scale-125 hidden sm:flex items-center justify-center bg-transparent border-0 cursor-pointer"
                style={{ color: "var(--texto-primario)" }}
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Carrusel con difuminado en los laterales */}
              <div
                ref={formScrollRef}
                className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory items-stretch scroll-smooth"
                style={{
                  maskImage:        "linear-gradient(to right, #000 0, #000 calc(100% - 32px), transparent 100%)",
                  WebkitMaskImage:  "linear-gradient(to right, #000 0, #000 calc(100% - 32px), transparent 100%)",
                }}
              >
                {formOrdenado.map((m) => (
                  <div key={m.moduloId} data-tarjeta-curso className="snap-start shrink-0 flex"
                    style={{ width: "clamp(240px, 22vw, 300px)" }}>
                    <TarjetaCurso
                      modulo={m}
                      onClick={() => router.push(`/dashboard/formacion/${m.moduloId}`)}
                      imagenUrl={getFormacionImage(m.moduloId, m.nombre)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── FILA 3: COMUNIDAD ── */}
        <section>
          <div className="mb-5">
            <TituloSeccion noMargin>Comunidad</TituloSeccion>
            <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--texto-muted)" }}>Actividades e iniciativas del parque empresarial</p>
          </div>

          {/* Evento destacado + iniciativas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 items-stretch">

            {/* Evento destacado */}
            <div
              className="rounded-2xl overflow-hidden relative cursor-pointer"
              style={{ background: "var(--marino)", minHeight: "200px" }}
              onClick={() => router.push("/dashboard/eventos")}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.95"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              {/* Fondo decorativo */}
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(163,181,53,0.18) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

              <div className="relative z-10 p-6 flex flex-col h-full" style={{ minHeight: "200px" }}>
                <div className="flex items-start justify-between mb-auto">
                  <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: "rgba(163,181,53,0.2)", color: "var(--verde-oliva-hover)" }}>
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
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
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

                <Link
                  href="/dashboard/eventos"
                  className="mt-5 self-start text-xs font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-80 inline-flex items-center gap-1.5"
                  style={{ background: "var(--verde-oliva-hover)", color: "#fff", textDecoration: "none" }}
                >
                  Ver evento
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Iniciativas */}
            <div className="flex flex-col gap-4 h-full">
              {[
                {
                  label: "Team building",
                  desc:  "Integración y trabajo en equipo entre empresas del parque",
                  fecha: "Jun 2025",
                  inscritos: 18,
                  color: "#7c3aed",
                  bg:    "#ede9fe",
                  icon:  "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                },
                {
                  label: "En Femenino",
                  desc:  "Liderazgo, igualdad e inspiración en el entorno empresarial",
                  fecha: "Jul 2025",
                  inscritos: 31,
                  color: "#be185d",
                  bg:    "#fce7f3",
                  icon:  "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
                },
                {
                  label: "Eventos empresariales",
                  desc:  "Actividades de networking entre las empresas del parque",
                  fecha: "Mensual",
                  inscritos: 60,
                  color: "var(--azul-egm)",
                  bg:    "var(--azul-egm-light)",
                  icon:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                },
              ].map((ini) => (
                <div
                  key={ini.label}
                  className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-150 cursor-pointer"
                  style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
                  onClick={() => router.push("/dashboard/comunidad")}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "var(--gris-pagina)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = ini.color;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "var(--blanco)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gris-borde)";
                  }}
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

        </section>

      </div>
    </div>
  );
}

// ── TÍTULO DE SECCIÓN ─────────────────────────────────────────────────────────
function TituloSeccion({ children, noMargin }: {
  children: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <h2
      className={noMargin ? "" : "mb-5"}
      style={{
        fontSize:      "clamp(1.15rem, 1.6vw, 1.4rem)",
        fontFamily:    "var(--font-poppins), sans-serif",
        fontWeight:    700,
        color:         "var(--texto-primario)",
        letterSpacing: "-0.01em",
        lineHeight:    1.25,
      }}
    >
      {children}
    </h2>
  );
}

// ── TARJETA CURSO (vertical, estilo card) ─────────────────────────────────────
const TIPO_ACENTO: Record<string, { bg: string; text: string; label: string }> = {
  IDENTIDAD:   { bg: "var(--azul-egm-light)",   text: "var(--azul-egm)",    label: "Identidad Corporativa" },
  BASICA:      { bg: "var(--verde-oliva-light)", text: "var(--verde-oliva)", label: "Formación Básica" },
  ESPECIFICA:  { bg: "var(--info-light)",        text: "var(--info)",        label: "Formación Específica" },
  DESARROLLO:  { bg: "var(--advertencia-light)", text: "var(--advertencia)", label: "Desarrollo Profesional" },
  SEGURIDAD:   { bg: "#FFF1F0",                  text: "#C84B31",            label: "Seguridad Laboral" },
  RECOMPENSAS: { bg: "var(--exito-light)",       text: "var(--exito)",       label: "Recompensas" },
  COMUNIDAD:   { bg: "var(--gris-superficie)",   text: "var(--texto-muted)", label: "Comunidad" },
};

const DURACION_POR_TIPO: Record<string, string> = {
  IDENTIDAD:   "20 min",
  BASICA:      "35 min",
  ESPECIFICA:  "50 min",
  DESARROLLO:  "45 min",
  SEGURIDAD:   "40 min",
  RECOMPENSAS: "15 min",
  COMUNIDAD:   "25 min",
};

function TarjetaCurso({ modulo, onClick, imagenUrl }: {
  modulo:    FormacionLocal;
  onClick:   () => void;
  imagenUrl?: string;
}) {
  const tipo       = TIPO_ACENTO[modulo.tipoModulo] ?? TIPO_ACENTO.ESPECIFICA;
  const completado = modulo.status === "completado";
  const enProgreso = modulo.status === "en progreso";
  const duracion   = DURACION_POR_TIPO[modulo.tipoModulo] ?? "30 min";

  const pct = modulo.totalItems > 0
    ? Math.round((modulo.completadosLocal / modulo.totalItems) * 100)
    : completado ? 100 : 0;

  // Etiqueta de estado superpuesta en la imagen (esquina superior derecha)
  const statusBadge = completado
    ? { label: "Completado", bg: "var(--exito)",    color: "#fff" }
    : enProgreso
      ? { label: "En curso",  bg: "var(--azul-egm)", color: "#fff" }
      : null;

  return (
    <button
      onClick={onClick}
      className="w-full h-full text-left flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "var(--blanco)",
        border:     "1px solid var(--gris-borde)",
        boxShadow:  "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Imagen superior */}
      <div className="relative w-full aspect-[16/10] overflow-hidden flex items-center justify-center"
        style={{ background: tipo.text }}>
        {/* Fallback SVG (siempre debajo) */}
        <svg className="w-12 h-12 opacity-30 absolute" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        {imagenUrl && (
          <img
            src={imagenUrl}
            alt=""
            className="relative w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        )}
        {/* Overlay sutil para legibilidad de badges */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 30%)" }} />

        {/* Badge de estado (esquina sup. derecha) */}
        {statusBadge && (
          <span
            className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
            style={{ background: statusBadge.bg, color: statusBadge.color, boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
          >
            {statusBadge.label}
          </span>
        )}

        {/* Check grande si completado */}
        {completado && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(22,163,74,0.85)", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Contenido inferior */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Fila superior: tipo + duración */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
            style={{ background: tipo.bg, color: tipo.text }}>
            Curso
          </span>
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--texto-muted)" }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
            </svg>
            {duracion}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-base font-bold leading-snug line-clamp-2" style={{ color: "var(--texto-primario)", minHeight: "2.6em" }}>
          {modulo.nombre}
        </h3>

        {/* Fila inferior: tipo módulo + progreso */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--texto-muted)" }}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: tipo.text }}>
              <path d="M2 22h2v-7H2v7zm5 0h2v-12H7v12zm5 0h2V8h-2v14zm5 0h2v-9h-2v9zm5-17v17h2V5h-2z" />
            </svg>
            {tipo.label.split(" ")[0]}
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color: completado ? "var(--exito)" : tipo.text }}>
            {pct}%
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--gris-borde)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: completado ? "var(--exito)" : tipo.text }} />
        </div>
      </div>
    </button>
  );
}