"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, API_URL } from "@/lib/api";
import { getActividadReciente, getProgresoEmpresa } from "@/lib/api/progreso";

import { getModulos } from "@/lib/api/modulos";
import type { ActividadItem, ProgresoEmpleado } from "@/lib/types/progreso";
// Widget simplificado de servicios (pantalla inicio, no la página /servicios)
type Servicio = { servicioId: string; nombre: string; descripcion: string | null; url: string | null; activo: boolean; icono: string | null; orden: number; };
import type { Modulo } from "@/lib/types/modulos";
import DashboardHero from "@/components/ui/DashboardHero";

interface ResumenAdmin {
  nombreEmpresa: string;
  usuariosActivos: number;
  usuariosInactivos: number;
}

interface Anuncio {
  anuncioId: string;
  empresaId: string;
  titulo: string;
  contenido: string;
  esGlobal: boolean;
  activo: boolean;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

// ── Icon mapping for servicios ──────────────────────────────────────────────
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
  { servicioId: "m1", nombre: "Coche compartido", descripcion: "Ahorra hasta 2.500€/año compartiendo ruta.", url: "https://www.lokinn.com/compartir-coche/atalayas", activo: true, icono: "coche_compartido", orden: 1 },
  { servicioId: "m2", nombre: "Autobús lanzadera", descripcion: "Línea 7P con horarios laborales.", url: "https://atalayas.com/autobus-lanzadera/", activo: true, icono: "autobus", orden: 2 },
  { servicioId: "m3", nombre: "Aparcamiento VAO", descripcion: "Plazas para grupos que comparten vehículo.", url: "https://atalayas.com/aparcamientovao/", activo: true, icono: "aparcamiento", orden: 3 },
  { servicioId: "m4", nombre: "Guardería", descripcion: "Conciliación familiar en el área.", url: null, activo: false, icono: "guarderia", orden: 4 },
  { servicioId: "m5", nombre: "Descuentos y ventajas", descripcion: "Beneficios para trabajadores del parque.", url: null, activo: false, icono: "descuentos", orden: 5 },
];

interface ModuloStats {
  moduloId: string;
  nombre: string;
  completados: number;
  enProgreso: number;
  pendientes: number;
  total: number;
}

function tiempoRelativo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Ayer";
  return `Hace ${d} días`;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function TituloSeccion({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <h2
      className={noMargin ? "" : "mb-6"}
      style={{
        fontSize: "clamp(1.6rem, 2.4vw, 2.2rem)",
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

function ActividadIcon({ tipo }: { tipo: string }) {
  const configs: Record<string, { bg: string; color: string; path: string }> = {
    completado: {
      bg: "var(--verde-oliva-light)", color: "var(--verde-oliva)",
      path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    inicio: {
      bg: "var(--azul-egm-light)", color: "var(--azul-egm)",
      path: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z",
    },
    logro: {
      bg: "#fef9c3", color: "#b45309",
      path: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    },
    grupo: {
      bg: "#ede9fe", color: "#7c3aed",
      path: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
    nuevo: {
      bg: "#fce7f3", color: "#be185d",
      path: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    },
  };
  const c = configs[tipo] ?? configs.inicio;
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: c.bg, color: c.color }}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={c.path} />
      </svg>
    </div>
  );
}

export default function AdminEmpresa() {
  const { usuario } = useAuth();
  const router = useRouter();

  const [resumen, setResumen] = useState<ResumenAdmin | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [servicios, setServicios] = useState<Servicio[]>(SERVICIOS_MOCK);
  const [modulosStats, setModulosStats] = useState<ModuloStats[]>([]);
  const [progresoMedio, setProgresoMedio] = useState(0);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const empresaId = usuario?.empresaId;
        const [resRes, anunciosRes, actividadData, modulosData, progresoData] = await Promise.all([
          apiFetch(`${API_URL}/dashboard/admin/resumen`),
          empresaId ? apiFetch(`${API_URL}/anuncios?empresaId=${empresaId}`) : Promise.resolve(new Response(JSON.stringify([]))),
          getActividadReciente(5).catch(() => [] as ActividadItem[]),
          getModulos(empresaId).catch(() => [] as Modulo[]),
          empresaId ? getProgresoEmpresa(empresaId).catch(() => [] as ProgresoEmpleado[]) : Promise.resolve([] as ProgresoEmpleado[]),
        ]);
        let resumenData = null;
        if (resRes.ok) {
          resumenData = await resRes.json();
          setResumen(resumenData);
        }
        if (anunciosRes.ok) {
          const data = await anunciosRes.json();
          const filtrados = data.filter((a: Anuncio) => empresaId ? a.empresaId === empresaId : true);
          setAnuncios(filtrados.filter((a: Anuncio) => a.activo).slice(0, 4));
        }
        setActividad(actividadData);
        // servicios: usa mock hasta conectar el nuevo endpoint

        // Calcular estadísticas reales de módulos
        const modulos = modulosData.filter((m: Modulo) => m.activo);
        const totalEmpleados = (resumenData?.usuariosActivos ?? 0) + (resumenData?.usuariosInactivos ?? 0);
        if (modulos.length > 0 && progresoData.length > 0) {
          const stats: ModuloStats[] = modulos.map((modulo: Modulo) => {
            let completados = 0;
            let enProgreso = 0;
            for (const emp of progresoData) {
              const mp = emp.modulos.find(m => m.moduloId === modulo.moduloId);
              if (mp) {
                if (mp.porcentaje >= 100) completados++;
                else if (mp.porcentaje > 0) enProgreso++;
              }
            }
            const pendientes = Math.max(0, totalEmpleados - completados - enProgreso);
            return {
              moduloId: modulo.moduloId,
              nombre: modulo.nombre,
              completados,
              enProgreso,
              pendientes,
              total: totalEmpleados || 1,
            };
          });
          setModulosStats(stats);

          // Calcular progreso medio real
          const porcentajes = progresoData.flatMap(emp => emp.modulos.map(m => m.porcentaje));
          const pct = porcentajes.length > 0
            ? Math.round(porcentajes.reduce((a, b) => a + b, 0) / porcentajes.length)
            : 0;
          setProgresoMedio(pct);
        } else if (modulos.length > 0) {
          setModulosStats(modulos.map((m: Modulo) => ({
            moduloId: m.moduloId,
            nombre: m.nombre,
            completados: 0,
            enProgreso: 0,
            pendientes: totalEmpleados,
            total: totalEmpleados || 1,
          })));
        }
      } catch { }
      finally { setCargando(false); }
    }
    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }}
        />
      </div>
    );
  }

  const nombreEmpresa = resumen?.nombreEmpresa ?? usuario?.nombreEmpresa ?? "Mi empresa";
  const firstName = (usuario?.nombre ?? "Administrador").split(" ")[0];
  const fechaHoy = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());

  // Métricas reales
  const activos = resumen?.usuariosActivos ?? 0;
  const inactivos = resumen?.usuariosInactivos ?? 0;
  const totalEmpleados = activos + inactivos;
  const modulosTotal = modulosStats.length;

  return (
    <div>
      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <DashboardHero
        prefijo="Hola, "
        titulo={firstName}

        imagenFondo={usuario?.bannerUrl ?? "/background-admin.webp"}
        variante="inicio"
      />

      {/* ══════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════ */}
      <div className="px-10 lg:px-16 pt-12 pb-16 flex flex-col gap-12">

        {/* ── MÉTRICAS — BENTO ASIMÉTRICO ── */}
        <section>
          <TituloSeccion>Resumen del equipo</TituloSeccion>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-2 gap-4" style={{ gridAutoRows: "minmax(110px, auto)" }}>

            {/* HERO — Progreso medio: ocupa 3 cols x 2 rows con gradiente lleno */}
            <div
              className="relative rounded-3xl overflow-hidden lg:col-span-3 lg:row-span-2 p-6 flex flex-col justify-between"
              style={{
                background: "linear-gradient(135deg, #15803D 0%, #10B981 50%, #0EA5E9 100%)",
                boxShadow: "0 18px 40px -12px rgba(16,185,129,0.55)",
                minHeight: 220,
              }}
            >
              {/* Halos */}
              <div style={{ position: "absolute", top: "-80px", right: "-60px", width: "280px", height: "280px", borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
              <div style={{ position: "absolute", bottom: "-60px", left: "20%", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full inline-block"
                    style={{ background: "rgba(255,255,255,0.22)", color: "#fff", backdropFilter: "blur(8px)" }}>
                    Progreso medio
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.35)", backdropFilter: "blur(10px)" }}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>

              <div className="relative z-10">
                <p className="text-7xl sm:text-8xl font-extrabold text-white leading-none tracking-tight" style={{ fontFamily: "var(--font-poppins), sans-serif", textShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
                  {progresoMedio}<span className="text-5xl sm:text-6xl">%</span>
                </p>
                <p className="text-sm mt-2 font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Promedio de finalización del equipo en módulos formativos
                </p>
                <div className="w-full rounded-full overflow-hidden mt-4" style={{ height: "8px", background: "rgba(255,255,255,0.22)" }}>
                  <div style={{
                    width: `${progresoMedio}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #FBBF24 0%, #FFFFFF 100%)",
                    borderRadius: "9999px",
                    boxShadow: "0 0 12px rgba(251,191,36,0.6)",
                  }} />
                </div>
              </div>
            </div>

            {/* KPIs secundarios (los recorremos saltando el progreso medio) */}
            {[
              {
                valor: activos,
                label: "Empleados activos",
                sub: totalEmpleados > 0 ? `${Math.round((activos / totalEmpleados) * 100)}% del total` : null,
                href: "/dashboard/admin?tab=empleados",
                span: "lg:col-span-2 lg:row-span-1",
                acento: { from: "#4338CA", to: "#0EA5E9" }, // Indigo → Cielo
                icono: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
              },
              {
                valor: inactivos,
                label: "Sin acceso activo",
                sub: inactivos > 0 ? "Gestionar →" : null,
                href: "/dashboard/admin?tab=empleados",
                span: "lg:col-span-1 lg:row-span-1",
                acento: { from: "#EA580C", to: "#DC2626" }, // Naranja → Rojo
                icono: (
                  // Candado cerrado — usuarios sin acceso
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
              },
              {
                valor: modulosTotal,
                label: "Módulos publicados",
                sub: "Ver formaciones →",
                href: "/dashboard/admin?tab=formaciones",
                span: "lg:col-span-3 lg:row-span-1",
                acento: { from: "#6B21A8", to: "#EC4899" }, // Púrpura → Rosa
                icono: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
              },
            ].map((stat, i) => (
              <div
                key={i}
                onClick={() => stat.href && router.push(stat.href)}
                className={`relative rounded-2xl px-5 py-5 transition-all overflow-hidden group ${stat.span || ""}`}
                style={{
                  background: "var(--blanco)",
                  border: "1px solid var(--gris-borde)",
                  cursor: stat.href ? "pointer" : "default",
                  boxShadow: `0 4px 14px -8px ${stat.acento.from}55`,
                }}
                onMouseEnter={(e) => {
                  if (stat.href) (e.currentTarget as HTMLDivElement).style.boxShadow = `0 10px 24px -10px ${stat.acento.from}88`;
                  if (stat.href) (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 14px -8px ${stat.acento.from}55`;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                {/* Halo difuminado de color en la esquina */}
                <div className="absolute top-0 right-0 pointer-events-none" style={{
                  width: 140, height: 140, borderRadius: "50%",
                  background: `radial-gradient(circle, ${stat.acento.from}26 0%, transparent 70%)`,
                  transform: "translate(40%, -40%)",
                }} />

                {/* Icono con gradiente */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 relative z-10 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${stat.acento.from} 0%, ${stat.acento.to} 100%)`,
                    boxShadow: `0 4px 12px -3px ${stat.acento.from}66`,
                  }}>
                  {stat.icono}
                </div>

                <p className="text-2xl font-bold relative z-10" style={{
                  background: `linear-gradient(135deg, ${stat.acento.from} 0%, ${stat.acento.to} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>{stat.valor}</p>
                <p className="text-xs mt-1 relative z-10" style={{ color: "var(--texto-muted)" }}>{stat.label}</p>
                {(stat as any).barra && (
                  <div className="w-full rounded-full overflow-hidden mt-3 relative z-10" style={{ height: "5px", background: "var(--gris-superficie)" }}>
                    <div style={{
                      width: `${progresoMedio}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${stat.acento.from} 0%, ${stat.acento.to} 100%)`,
                      borderRadius: "9999px",
                      boxShadow: `0 0 8px ${stat.acento.to}88`,
                    }} />
                  </div>
                )}
                {stat.sub && !((stat as any).barra) && (
                  <p className="text-xs mt-2 font-semibold relative z-10" style={{ color: stat.href ? stat.acento.from : "var(--texto-muted)" }}>{stat.sub}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── ESTADO DE FORMACIÓN ── */}
        <section>
          <div>
            <div>
              <div className="flex items-center justify-between mb-5 gap-3">
                <TituloSeccion noMargin>Estado de formación</TituloSeccion>
                <div className="flex items-center gap-4 shrink-0">
                  <button onClick={() => router.push("/dashboard/admin?tab=formaciones")} className="text-xs font-medium hover:underline" style={{ color: "var(--azul-egm)" }}>
                    Ver módulos
                  </button>
                  {modulosStats.length > 4 && (
                    <button onClick={() => router.push("/dashboard/admin?tab=estadisticas")} className="text-xs font-medium hover:underline" style={{ color: "var(--azul-egm)" }}>
                      Estadísticas detalladas
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {modulosStats.length === 0 ? (
                  <div className="sm:col-span-2 lg:col-span-4 flex flex-col items-center justify-center py-10 text-center rounded-2xl" style={{ background: "var(--gris-pagina)", border: "1px dashed var(--gris-borde)" }}>
                    <p className="text-sm mb-1" style={{ color: "var(--texto-primario)" }}>Sin módulos de formación</p>
                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Crea el primer módulo para tu equipo</p>
                  </div>
                ) : (
                  <>
                    {modulosStats.slice(0, 4).map((mod, idx) => {
                      const PALETA_FORM = [
                        { from: "#4338CA", to: "#0EA5E9" }, // Indigo → Cielo
                        { from: "#0891B2", to: "#10B981" }, // Cian → Verde
                        { from: "#6B21A8", to: "#EC4899" }, // Púrpura → Rosa
                        { from: "#EA580C", to: "#F59E0B" }, // Naranja → Ámbar
                      ];
                      const ac = PALETA_FORM[idx % PALETA_FORM.length];
                      const pctC = mod.total > 0 ? Math.round((mod.completados / mod.total) * 100) : 0;
                      const gradId = `grad-mod-${mod.moduloId}`;
                      const r = 28;
                      const c = 2 * Math.PI * r;
                      const dash = (pctC / 100) * c;

                      return (
                        <div key={mod.moduloId} className="relative rounded-2xl overflow-hidden transition-all hover:-translate-y-1 flex flex-col"
                          style={{
                            background: `linear-gradient(135deg, ${ac.from}0d 0%, ${ac.to}05 100%), var(--blanco)`,
                            border: "1px solid var(--gris-borde)",
                            boxShadow: `0 4px 16px -8px ${ac.from}55`,
                            minHeight: 240,
                          }}>
                          {/* Halo difuminado superior */}
                          <div className="absolute top-0 left-1/2 pointer-events-none" style={{
                            width: 220, height: 180, borderRadius: "50%",
                            background: `radial-gradient(circle, ${ac.from}33 0%, transparent 70%)`,
                            transform: "translate(-50%, -55%)",
                          }} />

                          <div className="relative z-10 flex flex-col items-center p-5 flex-1">
                            {/* Anillo grande centrado */}
                            <div className="relative shrink-0 mb-4" style={{ width: 110, height: 110 }}>
                              <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
                                <defs>
                                  <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={ac.from} />
                                    <stop offset="100%" stopColor={ac.to} />
                                  </linearGradient>
                                </defs>
                                <circle cx="55" cy="55" r="45" fill="none" stroke="var(--gris-superficie)" strokeWidth="8" />
                                <circle cx="55" cy="55" r="45" fill="none" stroke={`url(#${gradId})`} strokeWidth="8"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(pctC / 100) * 2 * Math.PI * 45} ${2 * Math.PI * 45}`}
                                  style={{ transition: "stroke-dasharray 0.6s ease-out", filter: `drop-shadow(0 0 6px ${ac.to}66)` }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-extrabold leading-none" style={{
                                  background: `linear-gradient(135deg, ${ac.from} 0%, ${ac.to} 100%)`,
                                  WebkitBackgroundClip: "text",
                                  WebkitTextFillColor: "transparent",
                                  backgroundClip: "text",
                                }}>{pctC}%</span>
                                <span className="text-[10px] uppercase tracking-wider mt-0.5 font-semibold" style={{ color: "var(--texto-muted)" }}>
                                  completado
                                </span>
                              </div>
                            </div>

                            {/* Nombre del módulo */}
                            <p className="text-sm font-bold text-center mb-3 line-clamp-2" style={{ color: "var(--texto-primario)" }}>
                              {mod.nombre}
                            </p>

                            {/* Stats compactos en fila */}
                            <div className="w-full mt-auto pt-3 grid grid-cols-3 gap-1 text-center" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                              <div>
                                <p className="text-sm font-bold" style={{ color: ac.from }}>{mod.completados}</p>
                                <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "var(--texto-muted)" }}>Hechos</p>
                              </div>
                              <div>
                                <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>{mod.enProgreso}</p>
                                <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "var(--texto-muted)" }}>En curso</p>
                              </div>
                              <div>
                                <p className="text-sm font-bold" style={{ color: "var(--texto-muted)" }}>{mod.pendientes}</p>
                                <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "var(--texto-muted)" }}>Pendientes</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ── ACCIONES + ANUNCIOS — Layout asimétrico ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Acciones rápidas — angosta (2/5) */}
            <div className="lg:col-span-2">
              <TituloSeccion>Acciones rápidas</TituloSeccion>
              {(() => {
                const acciones = [
                  { label: "Añadir empleado", href: "/dashboard/admin?tab=empleados", acento: { from: "#4338CA", to: "#0EA5E9" }, icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
                  { label: "Gestión módulos", href: "/dashboard/admin?tab=formaciones", acento: { from: "#0891B2", to: "#10B981" }, icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
                  { label: "Crear módulo", href: "/dashboard/admin/modulos/crear", acento: { from: "#6B21A8", to: "#EC4899" }, icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
                  { label: "Publicar anuncio", href: "/dashboard/admin?tab=anuncios", acento: { from: "#EA580C", to: "#F59E0B" }, icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
                ];
                return (
                  <div className="grid grid-cols-2 gap-3">
                    {acciones.map((a, i) => (
                      <button
                        key={a.label}
                        onClick={() => router.push(a.href)}
                        className="group relative rounded-2xl overflow-hidden text-left transition-all hover:-translate-y-1 flex flex-col justify-between"
                        style={{
                          background: `linear-gradient(135deg, ${a.acento.from} 0%, ${a.acento.to} 100%)`,
                          boxShadow: `0 8px 22px -10px ${a.acento.from}99`,
                          aspectRatio: "1 / 1",
                          minHeight: 120,
                          // Mosaico: alternar tamaños — pares más grandes
                          transform: i === 0 || i === 3 ? "scale(1)" : "scale(1)",
                        }}
                      >
                        {/* Halos blancos */}
                        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
                        <div style={{ position: "absolute", bottom: "-30px", left: "-30px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />

                        <div className="relative z-10 p-4 flex flex-col h-full justify-between">
                          {/* Icono glassmorphism arriba izquierda */}
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6"
                            style={{
                              background: "rgba(255,255,255,0.25)",
                              backdropFilter: "blur(10px)",
                              border: "1px solid rgba(255,255,255,0.4)",
                            }}>
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                            </svg>
                          </div>

                          {/* Etiqueta abajo */}
                          <div className="flex items-end justify-between">
                            <p className="text-sm font-bold text-white leading-tight" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>
                              {a.label}
                            </p>
                            <svg className="w-4 h-4 shrink-0 text-white opacity-80 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Últimos comunicados — ancha (3/5) */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <TituloSeccion noMargin>Últimos comunicados</TituloSeccion>
                <button onClick={() => router.push("/dashboard/admin?tab=anuncios")} className="text-xs font-medium hover:underline shrink-0" style={{ color: "var(--azul-egm)" }}>
                  Ver todos
                </button>
              </div>

              {anuncios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl" style={{ background: "var(--gris-pagina)", border: "1px dashed var(--gris-borde)" }}>
                  <p className="text-sm mb-1" style={{ color: "var(--texto-primario)" }}>Sin comunicados publicados</p>
                  <p className="text-xs mb-4" style={{ color: "var(--texto-muted)" }}>Comunica novedades importantes a tu equipo</p>
                  <button onClick={() => router.push("/dashboard/admin?tab=anuncios")} className="text-xs font-bold px-4 py-2 rounded-lg transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #4338CA 0%, #0EA5E9 100%)", color: "#ffffff", boxShadow: "0 4px 12px -3px rgba(67,56,202,0.55)" }}>
                    Crear comunicado
                  </button>
                </div>
              ) : (() => {
                // Paleta nueva — distinta a la del resto de la página
                const PALETA_COM = [
                  { from: "#BE185D", to: "#F97316" }, // Magenta → Naranja
                  { from: "#0F766E", to: "#3B82F6" }, // Teal → Azul
                  { from: "#CA8A04", to: "#EAB308" }, // Ámbar oscuro → Amarillo
                  { from: "#1E293B", to: "#7C3AED" }, // Pizarra → Violeta
                  { from: "#0284C7", to: "#C026D3" }, // Cielo → Fucsia
                  { from: "#059669", to: "#84CC16" }, // Esmeralda → Lima
                ];
                return (
                  // Timeline vertical estilo magazine
                  <div className="relative pl-8">
                    {/* Línea temporal vertical con gradiente arcoiris */}
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 rounded-full" style={{
                      background: "linear-gradient(180deg, #BE185D 0%, #0F766E 33%, #CA8A04 66%, #7C3AED 100%)",
                      opacity: 0.4,
                    }} />

                    <div className="flex flex-col gap-4">
                      {anuncios.map((a, idx) => {
                        const ac = PALETA_COM[idx % PALETA_COM.length];
                        return (
                          <div
                            key={a.anuncioId}
                            onClick={() => router.push("/dashboard/admin?tab=anuncios")}
                            className="group relative cursor-pointer transition-all hover:-translate-x-0.5"
                          >
                            {/* Punto de la timeline — círculo grande con gradiente */}
                            <div className="absolute -left-8 top-2 z-10">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-125"
                                style={{
                                  background: `linear-gradient(135deg, ${ac.from} 0%, ${ac.to} 100%)`,
                                  boxShadow: `0 0 0 4px var(--blanco), 0 0 0 5px ${ac.from}44, 0 4px 12px -2px ${ac.from}88`,
                                }}>
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            </div>

                            {/* Card del comunicado — estilo magazine con banner de color arriba */}
                            <div className="rounded-2xl overflow-hidden transition-all"
                              style={{
                                background: "var(--blanco)",
                                border: "1px solid var(--gris-borde)",
                                boxShadow: `0 4px 14px -10px ${ac.from}88`,
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 10px 24px -10px ${ac.from}bb`; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 14px -10px ${ac.from}88`; }}
                            >
                              {/* Banner superior con gradiente y categoría */}
                              <div className="relative px-4 py-2.5 flex items-center justify-between"
                                style={{ background: `linear-gradient(90deg, ${ac.from} 0%, ${ac.to} 100%)` }}>
                                <div className="flex items-center gap-2">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                  </svg>
                                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                                    {a.esGlobal ? "Global · EGM" : "Tu empresa"}
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>
                                  {formatFecha(a.creadoEn)}
                                </span>
                              </div>

                              {/* Cuerpo blanco */}
                              <div className="p-4">
                                <p className="text-sm font-bold leading-tight mb-1.5" style={{ color: "var(--texto-primario)" }}>{a.titulo}</p>
                                <p className="text-xs line-clamp-2" style={{ color: "var(--texto-muted)" }}>{a.contenido}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        </section>

        {/* ── SERVICIOS — galería flotante sin caja, ancho completo ── */}
        <section className="-mx-10 lg:-mx-16 px-10 lg:px-16">
          <div className="mb-8"><TituloSeccion noMargin>Servicios</TituloSeccion></div>

          {(() => {
            const PALETA_SERV = [
              { from: "#0F766E", to: "#3B82F6" }, // Teal → Azul
              { from: "#BE185D", to: "#F97316" }, // Magenta → Naranja
              { from: "#7C3AED", to: "#EC4899" }, // Violeta → Rosa
              { from: "#0284C7", to: "#06B6D4" }, // Cielo → Cian
              { from: "#65A30D", to: "#EAB308" }, // Lima → Amarillo
              { from: "#DC2626", to: "#F59E0B" }, // Rojo → Ámbar
              { from: "#4338CA", to: "#A855F7" }, // Indigo → Púrpura
              { from: "#059669", to: "#84CC16" }, // Esmeralda → Lima
            ];

            const lista = servicios.sort((a, b) => a.orden - b.orden);

            return (
              <div className="flex flex-wrap gap-y-8 justify-between">
                {lista.map((s, idx) => {
                  const icono = s.icono ? ICONO_MAP[s.icono] : null;
                  const ac = PALETA_SERV[idx % PALETA_SERV.length];
                  const inner = (
                    <div className="group flex flex-col items-center text-center cursor-pointer transition-transform hover:-translate-y-1" style={{ width: 120 }}>
                      {/* Círculo grande con gradiente — sin caja, flota */}
                      <div className="relative mb-3">
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${ac.from} 0%, ${ac.to} 100%)`,
                            color: "#ffffff",
                            boxShadow: `0 12px 30px -8px ${ac.from}88, inset 0 1px 0 rgba(255,255,255,0.25)`,
                          }}
                        >
                          <span className="[&_svg]:w-9 [&_svg]:h-9">
                            {icono}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm font-bold leading-tight" style={{ color: "var(--texto-primario)" }}>
                        {s.nombre}
                      </p>
                      <p className="text-[11px] mt-1 leading-snug line-clamp-2" style={{ color: "var(--texto-muted)" }}>
                        {s.descripcion}
                      </p>
                    </div>
                  );

                  return s.url ? (
                    <a key={s.servicioId} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                      {inner}
                    </a>
                  ) : (
                    <div key={s.servicioId}>{inner}</div>
                  );
                })}
              </div>
            );
          })()}
        </section>

      </div>
    </div>
  );
}
