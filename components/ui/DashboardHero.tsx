"use client";

import { useAuth } from "@/context/AuthContext";

interface DashboardHeroProps {
  prefijo?: string;
  titulo: string;
  subtitulo?: string;
  imagenFondo?: string;
  objectPosition?: string;
  /** "inicio"  = hero grande (home de cada rol)
   *  "seccion" = hero medio (formación, comunicación, etc.) — por defecto
   *  "minima"  = hero barra (configuración, páginas utilitarias) */
  variante?: "inicio" | "seccion" | "minima";
}

export default function DashboardHero({
  prefijo,
  titulo,
  subtitulo,
  imagenFondo = "/background-dashboard.webp",
  objectPosition = "center 40%",
  variante = "seccion",
}: DashboardHeroProps) {

  const { usuario } = useAuth();

  const esSuperAdmin    = usuario?.codigoRol === "ROLE_ADMIN";
  const etiquetaEmpresa = esSuperAdmin
    ? "EGM Atalayas · Administración"
    : (usuario?.nombreEmpresa ?? "");

  /* ── Tamaños según variante ── */
  const alturaMin = variante === "inicio"
    ? "clamp(190px, 28vw, 360px)"
    : variante === "minima"
      ? "clamp(100px, 12vw, 160px)"
      : "clamp(170px, 25vw, 290px)";

  const paddingY = variante === "inicio"
    ? "py-8 sm:py-12 lg:py-16"
    : variante === "minima"
      ? "py-5 sm:py-7"
      : "py-8 sm:py-11 lg:py-14";

  const sizePrefijo = variante === "inicio"
    ? "clamp(1.6rem, 3.8vw, 3.6rem)"
    : variante === "minima"
      ? "clamp(0.95rem, 1.6vw, 1.25rem)"
      : "clamp(1.8rem, 3.8vw, 3.2rem)";

  const sizeTitulo = variante === "inicio"
    ? "clamp(2rem, 4.8vw, 4.6rem)"
    : variante === "minima"
      ? "clamp(1.2rem, 2vw, 1.6rem)"
      : "clamp(2.6rem, 5vw, 4.2rem)";

  /* ── Opacidades de overlay según variante ── */
  const overlayBase    = variante === "minima" ? "rgba(8,17,34,0.60)" : "rgba(8,17,34,0.50)";
  const overlayLateral = variante === "minima"
    ? "none"
    : "linear-gradient(to right, rgba(8,17,34,0.80) 0%, rgba(8,17,34,0.40) 55%, transparent 100%)";

  return (
    <div
      className="relative overflow-hidden flex items-center"
      style={{
        minHeight: alturaMin,
        boxShadow: "0 6px 32px rgba(0,0,0,0.22)",
      }}
    >
      {/* Imagen de fondo */}
      <img
        src={imagenFondo}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition }}
      />

      {/* Overlay base */}
      <div className="absolute inset-0" style={{ background: overlayBase }} />

      {/* Overlay lateral — no en minima */}
      {overlayLateral !== "none" && (
        <div className="absolute inset-0" style={{ background: overlayLateral }} />
      )}

      {/* Contenido */}
      <div className={`relative z-10 w-full px-6 sm:px-9 lg:px-14 ${paddingY}`}>

        {/* Etiqueta: empresa · fecha */}
        <p
          className="flex items-center gap-2 text-xs font-semibold uppercase mb-3 sm:mb-4 overflow-hidden"
          style={{
            color: "rgba(255,255,255,0.50)",
            letterSpacing: "0.12em",
            animation: "heroFadeUp 0.6s ease both",
          }}
        >
          <span
            className="inline-block rounded-full shrink-0"
            style={{ width: "6px", height: "6px", background: "var(--verde-oliva-hover)" }}
          />
          {etiquetaEmpresa && (
            <>
              <span className="truncate min-w-0" style={{ maxWidth: "200px" }}>
                {etiquetaEmpresa}
              </span>
              <span className="shrink-0" style={{ opacity: 0.3 }}>·</span>
            </>
          )}
          <span className="whitespace-nowrap shrink-0">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long", day: "numeric", month: "long",
            }).replace(/^\w/, (c) => c.toUpperCase())}
          </span>
        </p>

        {/* Título — prefijo y nombre en bloque unificado en móvil */}
        <div
          style={{ animation: "heroFadeUp 0.7s ease 0.1s both" }}
        >
          <div className="leading-tight flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {prefijo && (
              <span
                className="text-white"
                style={{
                  fontSize:      sizePrefijo,
                  fontFamily:    "var(--font-poppins), sans-serif",
                  fontWeight:    400,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                }}
              >
                {prefijo}
              </span>
            )}
            <span
              style={{
                fontSize:             sizeTitulo,
                fontFamily:           "'Instrument Serif', serif",
                fontStyle:            "italic",
                fontWeight:           500,
                letterSpacing:        "-0.01em",
                lineHeight:           1.05,
                backgroundImage:      "linear-gradient(90deg, #ffffff, #c8d96a, #ffffff)",
                backgroundSize:       "250% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
                animation:            "gradientShift 6s ease infinite",
                overflowWrap:         "break-word",
                wordBreak:            "break-word",
                maxWidth:             "100%",
              }}
            >
              {titulo}
            </span>
          </div>
        </div>

        {/* Subtítulo opcional */}
        {subtitulo && (
          <p
            className="mt-2.5 sm:mt-3 text-sm sm:text-base max-w-md"
            style={{
              color:      "rgba(255,255,255,0.65)",
              animation:  "heroFadeUp 0.7s ease 0.22s both",
              lineHeight: 1.55,
            }}
          >
            {subtitulo}
          </p>
        )}
      </div>
    </div>
  );
}
