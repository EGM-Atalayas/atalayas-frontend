"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, API_URL } from "@/lib/api";

interface ResumenAdmin {
  nombreEmpresa:     string;
  usuariosActivos:   number;
  usuariosInactivos: number;
}

interface Anuncio {
  anuncioId:     string;
  empresaId:     string;
  titulo:        string;
  contenido:     string;
  esGlobal:      boolean;
  activo:        boolean;
  creadoPor:     string;
  creadoEn:      string;
  actualizadoEn: string;
}

// ── Mock data (sustituir cuando la API lo soporte) ──────────────────────────
const MOCK_MODULOS = [
  { id: "m1", nombre: "Prevención de Riesgos Laborales", completados: 18, enProgreso: 6, pendientes: 4, total: 28 },
  { id: "m2", nombre: "Protección de Datos (RGPD)",      completados: 22, enProgreso: 3, pendientes: 3, total: 28 },
  { id: "m3", nombre: "Habilidades de Comunicación",     completados: 12, enProgreso: 9, pendientes: 7, total: 28 },
  { id: "m4", nombre: "Onboarding Corporativo",          completados: 25, enProgreso: 2, pendientes: 1, total: 28 },
];

const MOCK_ACTIVIDAD = [
  { hora: "Hace 5 min",   texto: "Ana García completó «Prevención de Riesgos»",    tipo: "completado" },
  { hora: "Hace 22 min",  texto: "Carlos Ruiz inició «Protección de Datos»",        tipo: "inicio"     },
  { hora: "Hace 1 h",     texto: "María López obtuvo el 100% en Onboarding",        tipo: "logro"      },
  { hora: "Hace 3 h",     texto: "5 empleados completaron «Habilidades Comunicación»", tipo: "grupo"   },
  { hora: "Ayer",         texto: "Nuevo módulo «Excel Avanzado» publicado",          tipo: "nuevo"      },
];

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function TituloSeccion({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <h2
      className={noMargin ? "" : "mb-6"}
      style={{
        fontSize:      "clamp(1.6rem, 2.4vw, 2.4rem)",
        fontFamily:    "'Instrument Serif', serif",
        fontWeight:    400,
        color:         "var(--texto-primario)",
        letterSpacing: "-0.02em",
        lineHeight:    1.2,
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
  const router      = useRouter();

  const [resumen, setResumen]   = useState<ResumenAdmin | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resRes, anunciosRes] = await Promise.all([
          apiFetch(`${API_URL}/dashboard/admin/resumen`),
          apiFetch(`${API_URL}/anuncios`),
        ]);
        if (resRes.ok)      setResumen(await resRes.json());
        if (anunciosRes.ok) {
          const data = await anunciosRes.json();
          setAnuncios(data.filter((a: Anuncio) => a.activo).slice(0, 4));
        }
      } catch {}
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

  const nombreEmpresa   = resumen?.nombreEmpresa ?? usuario?.nombreEmpresa ?? "Mi empresa";
  const firstName       = (usuario?.nombre ?? "Administrador").split(" ")[0];
  const fechaHoy        = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());

  // Métricas reales + mockeadas
  const activos        = resumen?.usuariosActivos   ?? 0;
  const inactivos      = resumen?.usuariosInactivos ?? 0;
  const totalEmpleados = activos + inactivos;
  const progresoMedio  = 67; // mock — API pendiente
  const modulosTotal   = MOCK_MODULOS.length;

  return (
    <div>
      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <div
        className="-mx-8 -mt-8 mb-0 relative overflow-hidden"
        style={{ minHeight: "300px" }}
      >
        <div
          style={{
            position:           "absolute",
            inset:              0,
            backgroundImage:    "url('/background-dashboard.jpg')",
            backgroundSize:     "cover",
            backgroundPosition: "center",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,20,40,0.55) 0%, rgba(0,0,0,0.15) 100%)" }} />

        <div
          className="relative z-10 px-10 lg:px-16 flex flex-col justify-center"
          style={{ minHeight: "300px", paddingTop: "3rem", paddingBottom: "3rem" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "var(--verde-oliva-hover)", animation: "heroFadeUp 0.6s ease both" }}
          >
            {nombreEmpresa}
            <span style={{ color: "rgba(255,255,255,0.25)" }}> · </span>
            {fechaHoy}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "0.4em", animation: "heroFadeUp 0.7s ease 0.08s both" }}>
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 300, fontSize: "clamp(3rem, 6vw, 4rem)", color: "#ffffff", lineHeight: 1.1 }}>
              Hola,
            </span>
            <span
              style={{
                fontFamily:           "'Instrument Serif', serif",
                fontStyle:            "italic",
                fontWeight:           400,
                fontSize:             "clamp(3rem, 6vw, 5rem)",
                lineHeight:           1.05,
                background:           "linear-gradient(90deg, #A3B535, #ffffff, #A3B535)",
                backgroundSize:       "300% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
                animation:            "heroFadeUp 0.7s ease 0.12s both, gradientShift 6s ease infinite",
              }}
            >
              {firstName}
            </span>
          </div>

          <p
            className="text-sm mt-3"
            style={{ color: "rgba(255,255,255,0.50)", animation: "heroFadeUp 0.7s ease 0.2s both" }}
          >
            Panel de administración · {nombreEmpresa}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════ */}
      <div className="px-10 lg:px-16 pt-12 pb-16 flex flex-col gap-12">

        {/* ── MÉTRICAS ── */}
        <section>
          <TituloSeccion>Resumen del equipo</TituloSeccion>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {[
              { valor: activos,            label: "Empleados activos",  sub: totalEmpleados > 0 ? `${Math.round((activos/totalEmpleados)*100)}% del total` : null, href: "/dashboard/admin?tab=empleados",    color: "var(--azul-egm)" },
              { valor: inactivos,          label: "Sin acceso activo",  sub: inactivos > 0 ? "Gestionar →" : null,                                                 href: "/dashboard/admin?tab=empleados",    color: "var(--texto-muted)" },
              { valor: `${progresoMedio}%`, label: "Progreso medio",   sub: null,                                                                                   href: null,                               color: "var(--verde-oliva)", barra: true },
              { valor: modulosTotal,       label: "Módulos publicados", sub: "Ver formaciones →",                                                                   href: "/dashboard/admin?tab=formaciones",  color: "var(--texto-primario)" },
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
                {MOCK_MODULOS.map((mod) => {
                  const pctC = Math.round((mod.completados / mod.total) * 100);
                  const pctP = Math.round((mod.enProgreso  / mod.total) * 100);
                  return (
                    <div key={mod.id} className="rounded-xl px-5 py-4" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
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
                          { n: mod.enProgreso,  label: "en progreso", color: "#f59e0b" },
                          { n: mod.pendientes,  label: "pendientes",  color: "var(--gris-borde)" },
                        ].map((s) => (
                          <span key={s.label} className="text-xs flex items-center gap-1" style={{ color: "var(--texto-muted)" }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                            {s.n} {s.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actividad reciente */}
            <div className="lg:col-span-2">
              <TituloSeccion>Actividad reciente</TituloSeccion>
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                {MOCK_ACTIVIDAD.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5" style={{ borderBottom: i < MOCK_ACTIVIDAD.length - 1 ? "1px solid var(--gris-borde)" : "none" }}>
                    <ActividadIcon tipo={item.tipo} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug" style={{ color: "var(--texto-primario)" }}>{item.texto}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>{item.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                  { label: "Añadir empleado",  desc: "Registra un nuevo miembro del equipo",   href: "/dashboard/admin?tab=empleados",   bg: "var(--azul-egm-light)",   color: "var(--azul-egm)",  icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
                  { label: "Nuevo módulo",     desc: "Crea contenido formativo para tu equipo", href: "/dashboard/admin/modulos/crear",    bg: "var(--verde-oliva-light)", color: "var(--verde-oliva)", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
                  { label: "Publicar anuncio", desc: "Comunica algo importante a tu equipo",   href: "/dashboard/admin?tab=anuncios",    bg: "#fef3c7",                 color: "#b45309",           icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
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
            <div className="lg:col-span-2">
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

          </div>
        </section>

      </div>
    </div>
  );
}
