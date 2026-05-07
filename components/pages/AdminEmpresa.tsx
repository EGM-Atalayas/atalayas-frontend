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
          apiFetch(`${API_URL}/anuncios`),
          getActividadReciente(5).catch(() => [] as ActividadItem[]),
          getModulos().catch(() => [] as Modulo[]),
          empresaId ? getProgresoEmpresa(empresaId).catch(() => [] as ProgresoEmpleado[]) : Promise.resolve([] as ProgresoEmpleado[]),
        ]);
        let resumenData = null;
        if (resRes.ok) {
          resumenData = await resRes.json();
          setResumen(resumenData);
        }
        if (anunciosRes.ok) {
          const data = await anunciosRes.json();
          setAnuncios(data.filter((a: Anuncio) => a.activo).slice(0, 4));
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

        imagenFondo={usuario?.bannerUrl ?? "/background-dashboard.webp"}
        variante="inicio"
      />

      {/* ══════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════ */}
      <div className="px-10 lg:px-16 pt-12 pb-16 flex flex-col gap-12">

        {/* ── MÉTRICAS ── */}
        <section>
          <TituloSeccion>Resumen del equipo</TituloSeccion>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {[
              { valor: activos, label: "Empleados activos", sub: totalEmpleados > 0 ? `${Math.round((activos / totalEmpleados) * 100)}% del total` : null, href: "/dashboard/admin?tab=empleados", color: "var(--azul-egm)" },
              { valor: inactivos, label: "Sin acceso activo", sub: inactivos > 0 ? "Gestionar →" : null, href: "/dashboard/admin?tab=empleados", color: "var(--texto-muted)" },
              { valor: `${progresoMedio}%`, label: "Progreso medio", sub: null, href: null, color: "var(--verde-oliva)", barra: true },
              { valor: modulosTotal, label: "Módulos publicados", sub: "Ver formaciones →", href: "/dashboard/admin?tab=formaciones", color: "var(--texto-primario)" },
            ].map((stat, i) => (
              <div
                key={i}
                onClick={() => stat.href && router.push(stat.href)}
                className="rounded-2xl px-5 py-5 transition-colors"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", cursor: stat.href ? "pointer" : "default" }}
                onMouseEnter={(e) => { if (stat.href) (e.currentTarget as HTMLDivElement).style.background = "var(--gris-pagina)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--blanco)"; }}
              >
                <p className="text-2xl font-semibold" style={{ color: stat.color }}>{stat.valor}</p>
                <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>{stat.label}</p>
                {(stat as any).barra && (
                  <div className="w-full rounded-full overflow-hidden mt-3" style={{ height: "4px", background: "var(--gris-superficie)" }}>
                    <div style={{ width: `${progresoMedio}%`, height: "100%", background: "var(--verde-oliva)", borderRadius: "9999px" }} />
                  </div>
                )}
                {stat.sub && !((stat as any).barra) && (
                  <p className="text-xs mt-2" style={{ color: stat.href ? "var(--azul-egm)" : "var(--texto-muted)" }}>{stat.sub}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── FORMACIÓN + ACTIVIDAD ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Estado de formación */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-5">
                <TituloSeccion noMargin>Estado de formación</TituloSeccion>
                <button onClick={() => router.push("/dashboard/admin?tab=formaciones")} className="text-xs font-medium hover:underline shrink-0" style={{ color: "var(--azul-egm)" }}>
                  Ver módulos →
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {modulosStats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl" style={{ background: "var(--gris-pagina)", border: "1px dashed var(--gris-borde)" }}>
                    <p className="text-sm mb-1" style={{ color: "var(--texto-primario)" }}>Sin módulos de formación</p>
                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Crea el primer módulo para tu equipo</p>
                  </div>
                ) : (
                  modulosStats.map((mod) => {
                    const pctC = mod.total > 0 ? Math.round((mod.completados / mod.total) * 100) : 0;
                    const pctP = mod.total > 0 ? Math.round((mod.enProgreso / mod.total) * 100) : 0;
                    return (
                      <div key={mod.moduloId} className="rounded-xl px-5 py-4" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm" style={{ color: "var(--texto-primario)" }}>{mod.nombre}</p>
                          <span className="text-xs font-semibold ml-3 shrink-0" style={{ color: "var(--verde-oliva)" }}>{pctC}%</span>
                        </div>
                        <div className="w-full flex rounded-full overflow-hidden" style={{ height: "5px", background: "var(--gris-superficie)" }}>
                          <div style={{ width: `${pctC}%`, background: "var(--verde-oliva)" }} />
                          <div style={{ width: `${pctP}%`, background: "#f59e0b" }} />
                        </div>
                        <div className="flex gap-4 mt-2">
                          {[
                            { n: mod.completados, label: "completados", color: "var(--verde-oliva)" },
                            { n: mod.enProgreso, label: "en progreso", color: "#f59e0b" },
                            { n: mod.pendientes, label: "pendientes", color: "var(--gris-borde)" },
                          ].map((s) => (
                            <span key={s.label} className="text-xs flex items-center gap-1" style={{ color: "var(--texto-muted)" }}>
                              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                              {s.n} {s.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actividad reciente */}
            <div className="lg:col-span-2">
              <TituloSeccion>Actividad reciente</TituloSeccion>
              {actividad.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl" style={{ background: "var(--gris-pagina)", border: "1px dashed var(--gris-borde)" }}>
                  <p className="text-sm mb-1" style={{ color: "var(--texto-primario)" }}>Sin actividad reciente</p>
                  <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Aparecerá aquí cuando los empleados interactúen con los módulos</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                  {actividad.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3.5" style={{ borderBottom: i < actividad.length - 1 ? "1px solid var(--gris-borde)" : "none" }}>
                      <ActividadIcon tipo={item.tipo} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug" style={{ color: "var(--texto-primario)" }}>{item.texto}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>{tiempoRelativo(item.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ── ACCIONES + ANUNCIOS ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Acciones rápidas */}
            <div className="lg:col-span-1">
              <TituloSeccion>Acciones rápidas</TituloSeccion>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Añadir empleado", desc: "Registra un nuevo miembro del equipo", href: "/dashboard/admin?tab=empleados", bg: "var(--azul-egm-light)", color: "var(--azul-egm)", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
                  { label: "Gestión de módulos", desc: "Administra los módulos formativos", href: "/dashboard/admin?tab=formaciones", bg: "var(--verde-oliva-light)", color: "var(--verde-oliva)", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
                  { label: "Crear módulo", desc: "Crea contenido formativo para tu equipo", href: "/dashboard/admin/modulos/crear", bg: "var(--azul-egm-light)", color: "var(--azul-egm)", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
                  { label: "Publicar anuncio", desc: "Comunica algo importante a tu equipo", href: "/dashboard/admin?tab=anuncios", bg: "#fef3c7", color: "#b45309", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
                ].map((a) => (
                  <button
                    key={a.label}
                    onClick={() => router.push(a.href)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left w-full transition-colors"
                    style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-pagina)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.bg, color: a.color }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{a.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>{a.desc}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--gris-borde)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Últimos comunicados */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <TituloSeccion noMargin>Últimos comunicados</TituloSeccion>
                <button onClick={() => router.push("/dashboard/admin?tab=anuncios")} className="text-xs font-medium hover:underline shrink-0" style={{ color: "var(--azul-egm)" }}>
                  Ver todos →
                </button>
              </div>

              {anuncios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl" style={{ background: "var(--gris-pagina)", border: "1px dashed var(--gris-borde)" }}>
                  <p className="text-sm mb-1" style={{ color: "var(--texto-primario)" }}>Sin comunicados publicados</p>
                  <p className="text-xs mb-4" style={{ color: "var(--texto-muted)" }}>Comunica novedades importantes a tu equipo</p>
                  <button onClick={() => router.push("/dashboard/admin?tab=anuncios")} className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}>
                    Crear comunicado
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {anuncios.map((a) => (
                    <div key={a.anuncioId} className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", borderLeft: "3px solid var(--azul-egm)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{a.titulo}</p>
                          <span className="text-xs shrink-0 mt-0.5" style={{ color: "var(--texto-muted)" }}>{formatFecha(a.creadoEn)}</span>
                        </div>
                        <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--texto-muted)" }}>{a.contenido}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5" style={{ background: a.esGlobal ? "#dbeafe" : "var(--verde-oliva-light)", color: a.esGlobal ? "#1d4ed8" : "var(--verde-oliva)" }}>
                        {a.esGlobal ? "Global" : "Empresa"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Servicios */}
            <div className="lg:col-span-1">
              <div className="mb-6"><TituloSeccion noMargin>Servicios</TituloSeccion></div>
              <div
                className="rounded-2xl overflow-hidden flex-1 relative"
                style={{ background: "linear-gradient(160deg, #f9fafb 0%, #f3f4f6 100%)" }}
              >
                {/* Glow decorativo */}
                <div className="absolute pointer-events-none" style={{
                  top: "-60px", left: "-60px", width: "240px", height: "240px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(0,0,0,0.04) 0%, transparent 70%)",
                }} />



                <div className="relative p-4 flex flex-col gap-2">
                  {servicios.sort((a, b) => a.orden - b.orden).map((s) => {
                    const icono = s.icono ? ICONO_MAP[s.icono] : null;
                    const content = (
                      <div
                        className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200"
                        style={{
                          background: s.activo ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.01)",
                          border: s.activo ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(0,0,0,0.06)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          boxShadow: s.activo ? "inset 0 1px 0 rgba(0,0,0,0.05)" : "none",
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: s.activo ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.03)",
                            border: s.activo ? "1px solid rgba(0,0,0,0.14)" : "1px solid rgba(0,0,0,0.05)",
                            backdropFilter: "blur(4px)",
                            WebkitBackdropFilter: "blur(4px)",
                            color: s.activo ? "#000" : "rgba(0,0,0,0.2)",
                          }}
                        >
                          {icono}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate"
                            style={{ color: s.activo ? "#000" : "rgba(0,0,0,0.25)" }}>
                            {s.nombre}
                          </p>
                          <p className="text-xs mt-0.5 truncate"
                            style={{ color: s.activo ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.15)" }}>
                            {s.descripcion}
                          </p>
                        </div>

                        {s.activo ? (
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth={2}
                            style={{ color: "rgba(0,0,0,0.40)" }}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              background: "rgba(0,0,0,0.05)",
                              color: "rgba(0,0,0,0.30)",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}>
                            Próx.
                          </span>
                        )}
                      </div>
                    );

                    return s.activo && s.url ? (
                      <a key={s.servicioId} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="block" style={{ textDecoration: "none" }}
                        onMouseEnter={(e) => {
                          const d = e.currentTarget.firstElementChild as HTMLElement;
                          if (d) {
                            d.style.background = "rgba(0,0,0,0.10)";
                            d.style.borderColor = "rgba(0,0,0,0.20)";
                            d.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const d = e.currentTarget.firstElementChild as HTMLElement;
                          if (d) {
                            d.style.background = s.activo ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.01)";
                            d.style.borderColor = s.activo ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.06)";
                            d.style.transform = "none";
                          }
                        }}
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={s.servicioId}>{content}</div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
