"use client";

import { useAuth } from "@/context/AuthContext";

interface DashboardHeroProps {
  prefijo?: string;
  titulo: string;
  subtitulo?: string; // mantenido por retrocompatibilidad, ya no se renderiza
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
  imagenFondo = "/background-dashboard.webp",
  objectPosition = "center 40%",
  variante = "seccion",
}: DashboardHeroProps) {

  const { usuario } = useAuth();

  const esSuperAdmin = usuario?.codigoRol === "ROLE_ADMIN";
  const etiquetaRol  = esSuperAdmin ? "SuperAdmin" : null; // reservado para uso futuro

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
    ? "clamp(1.4rem, 3.2vw, 3rem)"
    : variante === "minima"
      ? "clamp(0.95rem, 1.6vw, 1.25rem)"
      : "clamp(1.6rem, 3.2vw, 2.8rem)";

  const sizeTitulo = variante === "inicio"
    ? "clamp(2.6rem, 6vw, 5.8rem)"   // más grande en inicio
    : variante === "minima"
      ? "clamp(1.2rem, 2vw, 1.6rem)"
      : "clamp(2.6rem, 5vw, 4.2rem)";

  /* ── Opacidades de overlay según variante ── */
  const overlayBase    = variante === "minima" ? "rgba(8,17,34,0.60)" : "rgba(8,17,34,0.45)";
  const overlayLateral = variante === "minima"
    ? "none"
    : "linear-gradient(to right, rgba(8,17,34,0.75) 0%, rgba(8,17,34,0.35) 55%, transparent 100%)";

  /* ── En móvil suavizamos el overlay lateral ── */
  const overlayMobile = variante !== "minima"
    ? "linear-gradient(to right, rgba(8,17,34,0.60) 0%, rgba(8,17,34,0.20) 70%, transparent 100%)"
    : "none";

  const fechaHoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  }).replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div
      className="relative overflow-hidden flex items-center"
      style={{
        minHeight: alturaMin,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
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

      {/* Overlay lateral — desktop */}
      {overlayLateral !== "none" && (
        <div
          className="absolute inset-0 hidden sm:block"
          style={{ background: overlayLateral }}
        />
      )}

      {/* Overlay lateral — móvil (más suave) */}
      {overlayMobile !== "none" && (
        <div
          className="absolute inset-0 block sm:hidden"
          style={{ background: overlayMobile }}
        />
      )}

      {/* Fade inferior */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "60px",
          background: "linear-gradient(to bottom, transparent, rgba(8,17,34,0.30))",
        }}
      />

      {/* Contenido — en inicio limitamos el ancho en desktop */}
      <div
        className={`relative z-10 w-full px-6 sm:px-9 lg:px-14 ${paddingY}`}
        style={{
          paddingTop:  "80px",
          ...(variante === "inicio" ? { maxWidth: "720px" } : {}),
        }}
      >
        {/* Etiqueta: punto pulsante + fecha */}
        <p
          className="flex items-center gap-2 text-xs font-semibold uppercase mb-3 sm:mb-4"
          style={{
            color:         "rgba(255,255,255,0.45)",
            letterSpacing: "0.12em",
            animation:     "heroFadeUp 0.6s ease both",
          }}
        >
          <span
            className="inline-block rounded-full shrink-0"
            style={{
              width:      "6px",
              height:     "6px",
              background: "var(--verde-oliva-hover)",
              animation:  "heroPulse 2.4s ease-in-out infinite",
            }}
          />
          <span className="whitespace-nowrap shrink-0">{fechaHoy}</span>
        </p>

        {/* Título */}
        <div style={{ animation: "heroFadeUp 0.7s ease 0.1s both" }}>
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
                  opacity:       0.7,   // prefijo más tenue para que el título destaque
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
      </div>
    </div>
  );
}
