"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getNoticias } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { Noticia } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const SERVICIOS = [
  { label: "Coche compartido",   href: "https://www.lokinn.com/compartir-coche/atalayas" },
  { label: "Autobús lanzadera",  href: "https://atalayas.com/autobus-lanzadera/" },
  { label: "Aparcamiento VAO",   href: "https://atalayas.com/aparcamientovao/" },
  { label: "Guardería",          href: null },
  { label: "Descuentos",         href: null },
];

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

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
      </div>
    );
  }

  return (
    <div className="-mx-8">

      {/* ════════════════════════════════════════════════════════════════
          BANDA — imagen full-bleed
      ════════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden flex items-center"
        style={{
          width:      "100vw",
          marginLeft: "calc(50% - 50vw)",
          minHeight:  "280px",
          boxShadow:  "0 6px 32px rgba(0,0,0,0.22)",
        }}
      >
        <img src="/background-dashboard.jpg" alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 40%" }} />
        <div className="absolute inset-0"
          style={{ background: "rgba(10,20,40,0.62)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(13,27,46,0.92) 0%, rgba(13,27,46,0.55) 40%, rgba(13,27,46,0.1) 65%, transparent 100%)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(13,27,46,0.65) 0%, transparent 30%)" }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 py-16 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-5"
              style={{ color: "var(--verde-oliva-hover)" }}>
              {usuario?.nombreEmpresa ?? "Mi empresa"}
              <span style={{ color: "rgba(255,255,255,0.2)" }}> · </span>
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long", day: "numeric", month: "long",
              }).replace(/^\w/, (c) => c.toUpperCase())}
            </p>

            <h1 className="text-white leading-none"
              style={{
                fontSize:      "clamp(3rem, 6vw, 5.5rem)",
                fontFamily:    "'Instrument Serif', serif",
                fontWeight:    400,
                letterSpacing: "-0.02em",
                marginBottom:  siguientePaso ? "2rem" : "0",
              }}>
              Hola, {usuario?.nombre?.split(" ")[0] ?? "Empleado"}
            </h1>

            {siguientePaso && (
              <div className="inline-flex items-center gap-4 rounded-2xl px-5 py-3.5"
                style={{
                  background:     "rgba(255,255,255,0.08)",
                  border:         "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(10px)",
                  maxWidth:       "480px",
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--verde-oliva)" }}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                    style={{ color: "var(--verde-oliva-hover)" }}>
                    Siguiente paso
                  </p>
                  <p className="text-sm font-semibold text-white truncate">
                    {siguientePaso.nombre}
                  </p>
                </div>
                <button onClick={() => router.push("/dashboard/formacion")}
                  className="text-xs font-bold px-4 py-2 rounded-xl shrink-0 whitespace-nowrap transition-opacity"
                  style={{ background: "var(--verde-oliva)", color: "var(--blanco)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                  Continuar →
                </button>
              </div>
            )}
          </div>

          {hayProgreso && (
            <div className="flex flex-row lg:flex-col gap-3 shrink-0">
              <div className="rounded-2xl px-6 py-4 text-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(10px)", minWidth: "120px" }}>
                <p className="text-white leading-none"
                  style={{ fontSize: "3rem", fontFamily: "'Instrument Serif', serif" }}>
                  {totalProgress}<span style={{ fontSize: "1.6rem", color: "var(--verde-oliva-hover)" }}>%</span>
                </p>
                <p className="text-[10px] uppercase tracking-wider mt-1.5"
                  style={{ color: "rgba(255,255,255,0.38)" }}>
                  Completado
                </p>
              </div>
              <div className="rounded-2xl px-6 py-4 text-center"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", minWidth: "120px" }}>
                <p className="text-white leading-none"
                  style={{ fontSize: "2.4rem", fontFamily: "'Instrument Serif', serif" }}>
                  {completados}<span style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.28)" }}>/{formaciones.length}</span>
                </p>
                <p className="text-[10px] uppercase tracking-wider mt-1.5"
                  style={{ color: "rgba(255,255,255,0.38)" }}>
                  Módulos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          CONTENIDO — sobre fondo de página limpio
      ════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-12">

        {/* ── FORMACIÓN ─────────────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <h2 style={{
              fontSize:   "clamp(1.6rem, 2.5vw, 2.2rem)",
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              color:      "var(--texto-primario)",
              letterSpacing: "-0.01em",
            }}>
              Mi itinerario
            </h2>
            <div className="flex items-center gap-4">
              {hayProgreso && (
                <span className="text-sm" style={{ color: "var(--texto-muted)" }}>
                  <span style={{ color: "var(--texto-primario)", fontWeight: 600 }}>{completados}</span>
                  /{formaciones.length} completados
                </span>
              )}
              {hayModulos && (
                <button onClick={() => router.push("/dashboard/formacion")}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "var(--azul-egm)" }}>
                  Ver todo →
                </button>
              )}
            </div>
          </div>

          {/* Barra de progreso — solo si hay módulos */}
          {hayModulos && (
            <div className="mb-5">
              <div className="h-0.5 w-full rounded-full overflow-hidden"
                style={{ background: "var(--gris-borde)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:      `${totalProgress}%`,
                    background: "linear-gradient(90deg, var(--azul-egm) 0%, var(--verde-oliva) 100%)",
                  }} />
              </div>
            </div>
          )}

          {!hayModulos ? (
            /* Estado vacío compacto */
            <div className="flex items-center gap-4 px-6 py-5 rounded-2xl"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={1.3}
                style={{ color: "var(--gris-borde)" }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>
                  Aún no tienes módulos asignados
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                  Tu empresa configurará el itinerario formativo en breve
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
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

        {/* ── COMUNICACIONES — imagen de fondo con overlay intenso ──── */}
        <section className="mb-10">
          <h2 className="mb-6"
            style={{
              fontSize:   "clamp(1.6rem, 2.5vw, 2.2rem)",
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              color:      "var(--texto-primario)",
              letterSpacing: "-0.01em",
            }}>
            Comunicaciones
          </h2>

          {noticias.length === 0 ? (
            <div className="flex items-center justify-between rounded-2xl px-6 py-5"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                Sin comunicaciones todavía
              </p>
              <Link href="/dashboard/comunicacion"
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--azul-egm)" }}>
                Ir a comunicación →
              </Link>
            </div>
          ) : (
            /* Bloque con imagen de fondo + overlay intenso */
            <div className="relative overflow-hidden rounded-2xl"
              style={{ minHeight: "280px" }}>
              {/* Imagen de fondo */}
              <img
                src="/background-comunicacion-empleado.png"
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "center center" }}
              />
              {/* Overlay intenso para legibilidad */}
              <div className="absolute inset-0"
                style={{ background: "rgba(8,14,28,0.82)" }} />
              {/* Degradado lateral izquierdo más oscuro */}
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to right, rgba(8,14,28,0.6) 0%, transparent 60%)" }} />

              {/* Contenido */}
              <div className="relative z-10 p-8">
                <div className={`grid gap-8 ${noticiasEGM.length > 0 && noticiasEmpresa.length > 0 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                  {noticiasEGM.length > 0 && (
                    <ColumnaNoticiaOscura tipo="egm" noticias={noticiasEGM} />
                  )}
                  {noticiasEmpresa.length > 0 && (
                    <ColumnaNoticiaOscura tipo="empresa" noticias={noticiasEmpresa} />
                  )}
                </div>

                {/* Footer del bloque */}
                <div className="mt-8 pt-5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <Link href="/dashboard/comunicacion"
                    className="text-xs font-semibold transition-opacity hover:opacity-75"
                    style={{ color: "rgba(255,255,255,0.55)" }}>
                    Ver todas las comunicaciones →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── SERVICIOS DEL PARQUE — pills con más peso ──────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>
              Servicios del parque
            </h3>
            <div className="flex-1 h-px" style={{ background: "var(--gris-borde)" }} />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {SERVICIOS.map((s) =>
              s.href ? (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background:     "var(--blanco)",
                    color:          "var(--azul-egm)",
                    border:         "1px solid var(--gris-borde)",
                    textDecoration: "none",
                    boxShadow:      "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background   = "var(--azul-egm)";
                    e.currentTarget.style.color        = "white";
                    e.currentTarget.style.borderColor  = "var(--azul-egm)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background   = "var(--blanco)";
                    e.currentTarget.style.color        = "var(--azul-egm)";
                    e.currentTarget.style.borderColor  = "var(--gris-borde)";
                  }}>
                  {s.label}
                  <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <span key={s.label}
                  className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-medium"
                  style={{
                    background: "var(--blanco)",
                    color:      "var(--texto-muted)",
                    border:     "1px solid var(--gris-borde)",
                  }}>
                  {s.label}
                </span>
              )
            )}
          </div>
        </section>
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

function TarjetaModulo({
  modulo, index, onClick,
}: {
  modulo: ModuloConProgreso; index: number; onClick: () => void;
}) {
  const tipo   = TIPO_ACENTO[modulo.tipoModulo] ?? TIPO_ACENTO.ESPECIFICA;
  const status = STATUS_ESTILO[modulo.status]   ?? STATUS_ESTILO.pendiente;

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3.5 cursor-pointer transition-colors"
      style={{
        border:     "1px solid var(--gris-borde)",
        background: "var(--blanco)",
        boxShadow:  "0 1px 3px rgba(0,0,0,0.04)",
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-pagina)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blanco)")}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: tipo.bg, color: tipo.text }}>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--texto-primario)" }}>
          {modulo.nombre}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--texto-muted)" }}>
          {tipo.label}
        </p>
      </div>
      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
        style={{ background: status.bg, color: status.text }}>
        {status.label}
      </span>
    </div>
  );
}

// ── COLUMNA NOTICIA OSCURA ────────────────────────────────────────────────────
function ColumnaNoticiaOscura({
  tipo, noticias,
}: {
  tipo: "egm" | "empresa"; noticias: Noticia[];
}) {
  const esEGM  = tipo === "egm";
  const acento = esEGM ? "var(--azul-egm)"        : "var(--verde-oliva)";
  const acentoRgb = esEGM ? "27,63,126"           : "139,154,45";
  const label  = esEGM ? "EGM Atalayas"           : "Tu empresa";

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: acento }} />
        <p className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: acento }}>
          {label}
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        {noticias.map((n) => (
          <div key={n.anuncioId}
            className="rounded-xl px-4 py-3.5 transition-all"
            style={{
              background:  `rgba(${acentoRgb},0.08)`,
              border:      `1px solid rgba(${acentoRgb},0.2)`,
              borderLeft:  `3px solid rgba(${acentoRgb},0.7)`,
              backdropFilter: "blur(4px)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `rgba(${acentoRgb},0.14)`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `rgba(${acentoRgb},0.08)`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug"
                  style={{ color: "rgba(255,255,255,0.9)" }}>
                  {n.titulo}
                </p>
                <p className="text-xs mt-1 line-clamp-2 leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.45)" }}>
                  {n.contenido}
                </p>
              </div>
              <span className="text-[10px] shrink-0 mt-0.5 whitespace-nowrap"
                style={{ color: "rgba(255,255,255,0.3)" }}>
                {formatFecha(n.creadoEn)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}