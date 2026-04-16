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

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function TituloSeccion({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <h2
      className={noMargin ? "" : "mb-6"}
      style={{
        fontSize:      "clamp(2rem, 2.8vw, 2.8rem)",
        fontFamily:    "'Instrument Serif', serif",
        fontWeight:    400,
        color:         "var(--texto-primario)",
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </h2>
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
          setAnuncios(data.filter((a: Anuncio) => a.activo).slice(0, 3));
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

  const nombreEmpresa = resumen?.nombreEmpresa ?? usuario?.nombreEmpresa ?? "Mi empresa";
  const firstName     = (usuario?.nombre ?? "Administrador").split(" ")[0];
  const fechaHoy      = new Date().toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });

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
        style={{ minHeight: "340px" }}
      >
        {/* Background image */}
        <div
          style={{
            position:           "absolute",
            inset:              0,
            backgroundImage:    "url('/background-dashboard.jpg')",
            backgroundSize:     "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Dark overlays */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)" }} />
        <div
          style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(135deg, rgba(10,20,40,0.55) 0%, rgba(0,0,0,0.2) 100%)",
          }}
        />

        {/* Hero content */}
        <div
          className="relative z-10 px-10 lg:px-16 flex flex-col justify-center"
          style={{ minHeight: "340px", paddingTop: "3.5rem", paddingBottom: "3.5rem" }}
        >
          {/* Top line: empresa · fecha */}
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{
              color:     "var(--verde-oliva-hover)",
              animation: "heroFadeUp 0.6s ease both",
            }}
          >
            {nombreEmpresa} · {fechaHoy}
          </p>

          {/* Title */}
          <div
            style={{
              display:       "flex",
              flexWrap:      "wrap",
              alignItems:    "baseline",
              gap:           "0.4em",
              animation:     "heroFadeUp 0.7s ease both",
              animationDelay: "0.08s",
            }}
          >
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 300,
                fontSize:   "clamp(3.5rem, 7vw, 4.5rem)",
                color:      "#ffffff",
                lineHeight: 1.1,
              }}
            >
              Hola,
            </span>
            <span
              style={{
                fontFamily:              "'Instrument Serif', serif",
                fontStyle:               "italic",
                fontWeight:              400,
                fontSize:                "clamp(3.5rem, 7vw, 6rem)",
                lineHeight:              1.05,
                background:              "linear-gradient(90deg, #A3B535, #ffffff, #A3B535)",
                backgroundSize:          "300% auto",
                WebkitBackgroundClip:    "text",
                WebkitTextFillColor:     "transparent",
                backgroundClip:          "text",
                animation:               "heroFadeUp 0.7s ease both, gradientShift 6s ease infinite",
                animationDelay:          "0.12s, 0s",
              }}
            >
              {firstName}
            </span>
          </div>

          {/* Subtitle */}
          <p
            className="text-sm mt-3"
            style={{
              color:          "rgba(255,255,255,0.55)",
              animation:      "heroFadeUp 0.7s ease both",
              animationDelay: "0.2s",
            }}
          >
            Panel de administración · {nombreEmpresa}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CONTENT AREA
      ══════════════════════════════════════════ */}
      <div className="px-10 lg:px-16 pt-14 pb-16 flex flex-col gap-16">

        {/* ── SECCIÓN 1: MÉTRICAS ── */}
        <section>
          <TituloSeccion>Resumen</TituloSeccion>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Empleados activos */}
            <button
              onClick={() => router.push("/dashboard/admin?tab=empleados")}
              className="text-left rounded-2xl px-6 py-5 transition-all group"
              style={{
                background:   "var(--blanco)",
                border:       "1px solid var(--gris-borde)",
                position:     "relative",
                overflow:     "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow  = "0 6px 24px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform  = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow  = "none";
                e.currentTarget.style.transform  = "translateY(0)";
              }}
            >
              {/* Top accent strip */}
              <div
                style={{
                  position:   "absolute",
                  top:        0,
                  left:       0,
                  right:      0,
                  height:     "3px",
                  background: "var(--azul-egm)",
                }}
              />
              <p
                className="text-4xl font-bold mt-1"
                style={{ color: "var(--azul-egm)" }}
              >
                {resumen?.usuariosActivos ?? "—"}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                Empleados activos
              </p>
            </button>

            {/* Empleados inactivos */}
            <button
              onClick={() => router.push("/dashboard/admin?tab=empleados")}
              className="text-left rounded-2xl px-6 py-5 transition-all"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
                position:   "relative",
                overflow:   "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  position:   "absolute",
                  top:        0,
                  left:       0,
                  right:      0,
                  height:     "3px",
                  background: "var(--texto-muted)",
                  opacity:    0.4,
                }}
              />
              <p
                className="text-4xl font-bold mt-1"
                style={{ color: "var(--texto-muted)" }}
              >
                {resumen?.usuariosInactivos ?? "—"}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                Empleados inactivos
              </p>
            </button>

            {/* Progreso medio */}
            <div
              className="rounded-2xl px-6 py-5"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
                position:   "relative",
                overflow:   "hidden",
              }}
            >
              <div
                style={{
                  position:   "absolute",
                  top:        0,
                  left:       0,
                  right:      0,
                  height:     "3px",
                  background: "var(--verde-oliva)",
                }}
              />
              <p
                className="text-4xl font-bold mt-1"
                style={{ color: "var(--verde-oliva)" }}
              >
                —
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                Progreso medio
              </p>
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full mt-2"
                style={{
                  background: "var(--verde-oliva-light)",
                  color:      "var(--verde-oliva)",
                  fontWeight: 500,
                }}
              >
                Próximamente
              </span>
            </div>

            {/* Módulos activos */}
            <div
              className="rounded-2xl px-6 py-5"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
                position:   "relative",
                overflow:   "hidden",
              }}
            >
              <div
                style={{
                  position:   "absolute",
                  top:        0,
                  left:       0,
                  right:      0,
                  height:     "3px",
                  background: "var(--advertencia)",
                }}
              />
              <p
                className="text-4xl font-bold mt-1"
                style={{ color: "var(--advertencia)" }}
              >
                —
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                Módulos activos
              </p>
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full mt-2"
                style={{
                  background: "var(--advertencia-light)",
                  color:      "var(--advertencia)",
                  fontWeight: 500,
                }}
              >
                Próximamente
              </span>
            </div>

          </div>
        </section>

        {/* ── SECCIÓN 2: ACCIONES + ANUNCIOS ── */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT: Acciones rápidas */}
            <div className="lg:col-span-1">
              <TituloSeccion>Acciones rápidas</TituloSeccion>
              <div className="flex flex-col gap-3">

                {/* Añadir empleado */}
                <button
                  onClick={() => router.push("/dashboard/admin?tab=empleados")}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left w-full transition-all"
                  style={{
                    background: "var(--blanco)",
                    border:     "1px solid var(--gris-borde)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                      Añadir empleado
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                      Registra un nuevo miembro del equipo
                    </p>
                  </div>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    style={{ color: "var(--texto-muted)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Nuevo módulo */}
                <button
                  onClick={() => router.push("/dashboard/admin/modulos/crear")}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left w-full transition-all"
                  style={{
                    background: "var(--blanco)",
                    border:     "1px solid var(--gris-borde)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                      Nuevo módulo
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                      Crea contenido formativo para tu equipo
                    </p>
                  </div>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    style={{ color: "var(--texto-muted)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Publicar anuncio */}
                <button
                  onClick={() => router.push("/dashboard/admin?tab=anuncios")}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left w-full transition-all"
                  style={{
                    background: "var(--blanco)",
                    border:     "1px solid var(--gris-borde)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--advertencia-light)", color: "var(--advertencia)" }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                      Publicar anuncio
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                      Comunica algo importante a tu equipo
                    </p>
                  </div>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    style={{ color: "var(--texto-muted)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

              </div>
            </div>

            {/* RIGHT: Últimos comunicados */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <TituloSeccion noMargin>Últimos comunicados</TituloSeccion>
                <button
                  onClick={() => router.push("/dashboard/admin?tab=anuncios")}
                  className="text-sm font-medium hover:underline shrink-0"
                  style={{ color: "var(--azul-egm)" }}
                >
                  Ver todos →
                </button>
              </div>

              {anuncios.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12 text-center rounded-2xl"
                  style={{
                    background: "var(--gris-pagina)",
                    border:     "1px dashed var(--gris-borde)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "var(--azul-egm-light)" }}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      style={{ color: "var(--azul-egm)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--texto-primario)" }}>
                    Sin comunicados publicados
                  </p>
                  <p className="text-xs mb-4" style={{ color: "var(--texto-muted)" }}>
                    Comunica novedades importantes a tu equipo
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/admin?tab=anuncios")}
                    className="text-xs font-semibold px-4 py-2 rounded-lg transition-opacity"
                    style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Crear primer comunicado
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {anuncios.map((a) => (
                    <div
                      key={a.anuncioId}
                      className="flex items-start justify-between rounded-xl px-4 py-3"
                      style={{
                        background:  "var(--blanco)",
                        border:      "1px solid var(--gris-borde)",
                        borderLeft:  "3px solid var(--azul-egm)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: "var(--texto-primario)" }}
                        >
                          {a.titulo}
                        </p>
                        <p
                          className="text-xs mt-0.5 line-clamp-2"
                          style={{ color: "var(--texto-muted)" }}
                        >
                          {a.contenido}
                        </p>
                      </div>
                      <span
                        className="text-xs ml-4 shrink-0 mt-0.5"
                        style={{ color: "var(--texto-muted)" }}
                      >
                        {formatFecha(a.creadoEn)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ── SECCIÓN 3: ESTADO DEL EQUIPO ── */}
        <section>
          <TituloSeccion>Estado del equipo</TituloSeccion>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Empleados activos */}
            <div
              className="rounded-2xl px-5 py-5"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
                position:   "relative",
                overflow:   "hidden",
              }}
            >
              <div
                style={{
                  position:   "absolute",
                  bottom:     0,
                  left:       0,
                  right:      0,
                  height:     "2px",
                  background: "linear-gradient(90deg, var(--azul-egm), var(--azul-egm-light))",
                }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-xs mb-1" style={{ color: "var(--texto-muted)" }}>
                Empleados activos
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--azul-egm)" }}
              >
                {resumen?.usuariosActivos ?? "—"}
              </p>
            </div>

            {/* Módulos de formación */}
            <div
              className="rounded-2xl px-5 py-5"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
                position:   "relative",
                overflow:   "hidden",
              }}
            >
              <div
                style={{
                  position:   "absolute",
                  bottom:     0,
                  left:       0,
                  right:      0,
                  height:     "2px",
                  background: "linear-gradient(90deg, var(--verde-oliva), var(--verde-oliva-light))",
                }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--texto-muted)" }}>
                Módulos de formación
              </p>
              <button
                onClick={() => router.push("/dashboard/admin?tab=formaciones")}
                className="text-xs font-semibold transition-opacity"
                style={{ color: "var(--verde-oliva)" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Gestionar módulos →
              </button>
            </div>

            {/* Empleados inactivos */}
            <div
              className="rounded-2xl px-5 py-5"
              style={{
                background: "var(--blanco)",
                border:     "1px solid var(--gris-borde)",
                position:   "relative",
                overflow:   "hidden",
              }}
            >
              <div
                style={{
                  position:   "absolute",
                  bottom:     0,
                  left:       0,
                  right:      0,
                  height:     "2px",
                  background: "linear-gradient(90deg, var(--texto-muted), var(--gris-superficie))",
                  opacity:    0.5,
                }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className="text-xs mb-1" style={{ color: "var(--texto-muted)" }}>
                Empleados inactivos
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--texto-muted)" }}
              >
                {resumen?.usuariosInactivos ?? "—"}
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
