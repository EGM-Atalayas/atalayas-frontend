"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getNoticias } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import { getEventosComunidad, type ComunidadEvento } from "@/lib/api/comunidad";
import type { Noticia } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import type { ComunicadoItem } from "@/components/ui/ComunicadosCarousel";
import ComunicadosDeck from "@/components/ui/ComunicadosDeck";
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
  const [eventosCom, setEventosCom]           = useState<ComunidadEvento[]>([]);
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
        const [noticiasData, modulosData, eventosData] = await Promise.all([
          getNoticias(usuario?.empresaId).catch(() => []),
          getModulosConProgreso(usuario?.empresaId).catch(() => []),
          getEventosComunidad().catch(() => []),
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
        // Eventos: ordenar por fecha (futuros primero, luego pasados)
        const ahora = Date.now();
        const ordenados = [...eventosData].sort((a, b) => {
          const ta = new Date(a.fechaInicio).getTime();
          const tb = new Date(b.fechaInicio).getTime();
          const futuroA = ta >= ahora;
          const futuroB = tb >= ahora;
          if (futuroA && !futuroB) return -1;
          if (!futuroA && futuroB) return 1;
          return futuroA ? ta - tb : tb - ta;  // futuros asc, pasados desc
        });
        setEventosCom(ordenados);
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

  // ── Progreso del onboarding calculado desde módulos de tipo ONBOARDING ──
  const onboardingModules = formDisplay.filter((m) => m.tipoModulo === "ONBOARDING");
  const onboardingProgreso = onboardingModules.length === 0
    ? 0
    : Math.round((onboardingModules.filter((m) => m.status === "completado").length / onboardingModules.length) * 100);
  const onboardingIncompleto = onboardingModules.length > 0 && onboardingProgreso < 100;

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
            className="group relative flex items-center gap-3 sm:gap-6 px-4 sm:px-7 py-4 sm:py-5 rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(120deg, #10B981 0%, #0EA5E9 45%, #7C3AED 100%)",
              boxShadow: "0 12px 32px -10px rgba(14,165,233,0.55)",
            }}
            onClick={() => router.push("/dashboard/onboarding")}
          >
            {/* Halos decorativos */}
            <div style={{ position: "absolute", top: "-80px", right: "-40px", width: "260px", height: "260px", borderRadius: "50%", background: "rgba(255,255,255,0.12)", filter: "blur(2px)" }} />
            <div style={{ position: "absolute", bottom: "-60px", left: "20%", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            {/* Shimmer sutil */}
            <div className="absolute inset-0 pointer-events-none opacity-60" style={{
              background: "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.18) 0%, transparent 40%)",
            }} />

            {/* Icono con gradiente inverso */}
            <div
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 relative z-10"
              style={{
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.35)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              {/* Cohete — encaja con "incorporación / despegar" */}
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0 relative z-10">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.22)", color: "#ffffff", backdropFilter: "blur(6px)" }}>
                  Onboarding
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.75)" }}>
                  · En progreso
                </span>
              </div>
              <p className="text-base sm:text-lg font-bold text-white mb-2.5 leading-tight">
                Completa tu onboarding en Atalayas
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.18)" }}>
                  <div className="h-full rounded-full transition-all duration-700 relative"
                    style={{
                      width: `${onboardingProgreso}%`,
                      background: "linear-gradient(90deg, #FBBF24 0%, #F97316 50%, #FFFFFF 100%)",
                      boxShadow: "0 0 12px rgba(251,191,36,0.55)",
                    }}
                  />
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0 text-white">
                  {onboardingProgreso}%
                </span>
              </div>
            </div>

            <div
              className="shrink-0 hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl relative z-10 transition-transform group-hover:translate-x-0.5"
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "#0EA5E9",
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              }}
            >
              <span className="text-sm font-bold">Continuar</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div className="shrink-0 sm:hidden relative z-10 text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
            <TituloSeccion noMargin sinBarra>Servicios del parque</TituloSeccion>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {(() => {
              const PALETA_CHIPS = [
                { from: "#8B7AB8", to: "#C8A2C8" },  // Púrpura suave → Lila
                { from: "#7BA7B5", to: "#9AC4A8" },  // Azul polvo → Verde salvia
                { from: "#D4956B", to: "#C77F7F" },  // Terracota → Coral apagado
                { from: "#7C82B5", to: "#B5A1C8" },  // Azul lavanda → Malva
                { from: "#8FA88A", to: "#C9C58A" },  // Verde oliva → Mostaza suave
                { from: "#6F8FA3", to: "#9AB8C7" },  // Azul pizarra → Azul polvo
                { from: "#B58A9F", to: "#D4A88A" },  // Rosa apagado → Melocotón
                { from: "#5D7A99", to: "#8AA8C2" },  // Azul humo → Cielo neblina
              ];
              return SERVICIOS_MOCK.filter((s) => s.activo).slice(0, 8).map((s, idx) => {
              const ac = PALETA_CHIPS[idx % PALETA_CHIPS.length];
              const chip = (
                <span
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full text-base font-semibold transition-all"
                  style={{
                    background: `linear-gradient(var(--blanco), var(--blanco)) padding-box, linear-gradient(135deg, ${ac.from} 0%, ${ac.to} 100%) border-box`,
                    border:     "2px solid transparent",
                    color:      "var(--texto-primario)",
                    boxShadow:  "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 16px -4px ${ac.from}55`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                  }}
                >
                  <span
                    className="flex items-center justify-center w-6 h-6 [&_svg]:w-5 [&_svg]:h-5"
                    style={{ color: ac.from }}
                  >
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
              });
            })()}
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
          <ComunicadosDeck items={carouselItems} minHeight={460} />
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

        {/* ── COMUNIDAD — eventos reales del backend ── */}
        {(() => {
          const destacado = eventosCom[0];
          const otros     = eventosCom.slice(1, 4);
          const noHay     = eventosCom.length === 0;

          // Helpers de formato
          const fmtDia = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric" });
          const fmtMes = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
          const fmtHora = (iso: string, isoFin?: string | null) => {
            const ini = new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
            if (!isoFin) return `${ini} h`;
            const fin = new Date(isoFin).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
            return `${ini} – ${fin} h`;
          };
          const fmtFechaCorta = (iso: string) =>
            new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

          return (
            <section>
              <div className="mb-5">
                <TituloSeccion noMargin>Comunidad</TituloSeccion>
                <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--texto-muted)" }}>Actividades e iniciativas del parque empresarial</p>
              </div>

              {noHay ? (
                /* Placeholder cuando no hay eventos */
                <div className="rounded-2xl flex flex-col items-center justify-center gap-3 py-12 px-6 text-center"
                  style={{ background: "var(--blanco)", border: "1px dashed var(--gris-borde)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Aún no hay eventos programados</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Cuando se publiquen aparecerán aquí</p>
                  </div>
                </div>
              ) : (() => {
                // Paleta colorida rotativa para los secundarios
                const PALETA = [
                  { from: "#6B21A8", to: "#EC4899" },  // Púrpura → Rosa
                  { from: "#0891B2", to: "#10B981" },  // Cian → Verde
                  { from: "#EA580C", to: "#DC2626" },  // Naranja → Rojo
                  { from: "#4338CA", to: "#A855F7" },  // Indigo → Púrpura
                ];
                // Color del destacado según estado
                const esProx = new Date(destacado.fechaInicio).getTime() >= Date.now();
                const destAcento = esProx
                  ? { from: "#6B21A8", to: "#EC4899" }  // Próximo: púrpura → rosa
                  : { from: "#1B3F7E", to: "#0891B2" }; // Pasado: azul → cian

                return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 items-stretch">

                  {/* Evento destacado con gradiente vibrante */}
                  <div
                    className="rounded-2xl overflow-hidden relative cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                    style={{
                      background: `linear-gradient(135deg, ${destAcento.from} 0%, ${destAcento.to} 100%)`,
                      minHeight: "200px",
                      boxShadow: `0 10px 30px -10px ${destAcento.from}66`,
                    }}
                    onClick={() => router.push(`/dashboard/eventos/${destacado.eventoId}`)}
                  >
                    {/* Halos decorativos */}
                    <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
                    <div style={{ position: "absolute", bottom: "-40px", left: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

                    <div className="relative z-10 p-6 flex flex-col h-full" style={{ minHeight: "200px" }}>
                      <div className="flex items-start justify-between mb-auto">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur"
                          style={{ background: "rgba(255,255,255,0.22)", color: "#ffffff" }}>
                          {esProx ? "Próximo evento" : "Último evento"}
                        </span>
                        <div className="text-right rounded-xl px-3 py-2 backdrop-blur" style={{ background: "rgba(255,255,255,0.18)" }}>
                          <p className="text-2xl font-bold text-white leading-none">{fmtDia(destacado.fechaInicio)}</p>
                          <p className="text-[10px] uppercase tracking-wider capitalize mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{fmtMes(destacado.fechaInicio)}</p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-xl font-semibold text-white mb-1.5" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                          {destacado.titulo}
                        </h3>
                        {destacado.descripcion && (
                          <p className="text-sm mb-4 line-clamp-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                            {destacado.descripcion}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
                          <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {fmtHora(destacado.fechaInicio, destacado.fechaFin)}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {destacado.esGlobal ? "EGM Atalayas" : "Tu empresa"}
                          </span>
                        </div>
                      </div>

                      <span
                        className="mt-5 self-start text-xs font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-1.5"
                        style={{ background: "rgba(255,255,255,0.22)", color: "#fff", backdropFilter: "blur(8px)" }}
                      >
                        Ver evento
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Otros eventos como iniciativas con franja lateral de color */}
                  <div className="flex flex-col gap-4 h-full">
                    {otros.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center rounded-xl px-6 py-8 text-center"
                        style={{ background: "var(--blanco)", border: "1px dashed var(--gris-borde)" }}>
                        <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                          No hay más eventos programados de momento
                        </p>
                      </div>
                    ) : (
                      otros.map((ev, idx) => {
                        const ac = PALETA[(idx + 1) % PALETA.length];
                        return (
                          <div
                            key={ev.eventoId}
                            className="relative flex-1 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group"
                            style={{
                              background: `linear-gradient(135deg, ${ac.from} 0%, ${ac.to} 100%)`,
                              boxShadow: `0 6px 18px -8px ${ac.from}66`,
                            }}
                            onClick={() => router.push(`/dashboard/eventos/${ev.eventoId}`)}
                          >
                            {/* Halo decorativo */}
                            <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />

                            <div className="relative z-10 flex items-center gap-3 px-4 py-3.5 h-full">
                              {/* Día grande */}
                              <div className="shrink-0 text-center pr-3 border-r" style={{ borderColor: "rgba(255,255,255,0.25)" }}>
                                <p className="text-2xl font-bold text-white leading-none">{fmtDia(ev.fechaInicio)}</p>
                                <p className="text-[10px] uppercase tracking-wider mt-1 capitalize" style={{ color: "rgba(255,255,255,0.85)" }}>{fmtMes(ev.fechaInicio)}</p>
                              </div>

                              {/* Contenido */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate text-white">{ev.titulo}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1 text-[11px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {fmtHora(ev.fechaInicio, ev.fechaFin)}
                                  </span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.22)", color: "#ffffff" }}>
                                    {ev.esGlobal ? "EGM" : "Empresa"}
                                  </span>
                                </div>
                              </div>

                              {/* Flecha */}
                              <svg className="w-4 h-4 shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                );
              })()}
            </section>
          );
        })()}

      </div>
    </div>
  );
}

// ── TÍTULO DE SECCIÓN ─────────────────────────────────────────────────────────
function TituloSeccion({ children, noMargin, sinBarra }: {
  children: React.ReactNode;
  noMargin?: boolean;
  sinBarra?: boolean;
}) {
  return (
    <h2
      className={`inline-flex items-center gap-3 ${noMargin ? "" : "mb-5"}`}
      style={{
        fontSize:      "clamp(1.6rem, 2.4vw, 2.1rem)",
        fontFamily:    "var(--font-poppins), sans-serif",
        fontWeight:    800,
        color:         "var(--texto-primario)",
        letterSpacing: "-0.025em",
        lineHeight:    1.15,
      }}
    >
      {/* Barra decorativa con gradiente */}
      {!sinBarra && (
        <span
          aria-hidden="true"
          style={{
            display:      "inline-block",
            width:        6,
            height:       "1.3em",
            borderRadius: 999,
            background:   "linear-gradient(180deg, #1E3A8A 0%, #0EA5E9 100%)",
            boxShadow:    "0 2px 8px rgba(14,165,233,0.35)",
          }}
        />
      )}
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