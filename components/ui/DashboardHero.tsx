"use client";

interface DashboardHeroProps {
  prefijo?: string;
  titulo: string;
  subtitulo?: string; // mantenido por retrocompatibilidad
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

  /* ── Alturas ── */
  const alturaMin = variante === "inicio"
    ? "clamp(220px, 35vw, 400px)"
    : variante === "minima"
      ? "clamp(100px, 12vw, 160px)"
      : "clamp(200px, 28vw, 320px)";

  /* ── Tipografía ── */
  const sizeTitulo = variante === "inicio"
    ? "clamp(2.4rem, 5.5vw, 5rem)"
    : variante === "minima"
      ? "clamp(1.2rem, 2vw, 1.6rem)"
      : "clamp(2.6rem, 5vw, 4.2rem)";

  const sizePrefijo = sizeTitulo;

  /* ── Overlay base ── */
  const overlayBase = variante === "minima"
    ? "rgba(8,17,34,0.60)"
    : "rgba(8,17,34,0.30)";

  /* ── Padding inferior ── */
  const paddingBottom = variante === "inicio"
    ? "clamp(2.5rem, 5vw, 3.5rem)"
    : variante === "minima"
      ? "1.5rem"
      : "clamp(2.2rem, 4vw, 3rem)";

  const fechaHoy = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  }).replace(/^\w/, (c) => c.toUpperCase());

  /* ── Minima: centrado, sin cambios ── */
  if (variante === "minima") {
    return (
      <div
        className="relative overflow-hidden flex items-center"
        style={{ minHeight: alturaMin, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
      >
        <img src={imagenFondo} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition }} />
        <div className="absolute inset-0" style={{ background: overlayBase }} />
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ height: "60%", background: "linear-gradient(to bottom, rgba(8,17,34,0.50) 0%, transparent 100%)" }}
        />
        <div
          className="relative z-10 w-full px-6 sm:px-9 lg:px-14 flex flex-wrap items-baseline gap-x-2"
          style={{ paddingTop: "80px" }}
        >
          {prefijo && (
            <span style={{
              fontSize:   sizeTitulo,
              fontFamily: "'Instrument Serif', serif",
              fontStyle:  "italic",
              fontWeight: 500,
              color:      "rgba(255,255,255,0.65)",
              lineHeight: 1.1,
            }}>
              {prefijo}
            </span>
          )}
          <span style={{
            fontSize:   sizeTitulo,
            fontFamily: "'Instrument Serif', serif",
            fontStyle:  "italic",
            fontWeight: 500,
            color:      "rgba(255,255,255,0.90)",
            lineHeight: 1.1,
          }}>
            {titulo}
          </span>
        </div>
      </div>
    );
  }

  /* ── Inicio / Seccion: texto anclado abajo-izquierda ── */
  return (
    <div
      className="relative overflow-hidden flex items-end"
      style={{ minHeight: alturaMin, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
    >
      {/* Imagen */}
      <img
        src={imagenFondo}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition }}
      />

      {/* Overlay base */}
      <div className="absolute inset-0" style={{ background: overlayBase }} />

      {/* Gradiente superior — protege header transparente */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "45%",
          background: "linear-gradient(to bottom, rgba(8,17,34,0.55) 0%, transparent 100%)",
        }}
      />

      {/* Gradiente inferior — legibilidad del texto */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "65%",
          background: "linear-gradient(to bottom, transparent 0%, rgba(8,17,34,0.55) 50%, rgba(8,17,34,0.82) 100%)",
        }}
      />

      {/* Contenido */}
      <div
        className="relative z-10 w-full px-6 sm:px-9 lg:px-14"
        style={{
          paddingBottom,
          ...(variante === "inicio" ? { maxWidth: "800px" } : {}),
        }}
      >
        {/* Fecha — solo en inicio */}
        {variante === "inicio" && (
          <p
            className="flex items-center gap-2 mb-3 sm:mb-4"
            style={{
              fontSize:      "0.875rem",
              fontWeight:    500,
              color:         "rgba(255,255,255,0.68)",
              letterSpacing: "0.02em",
              animation:     "fade-rise 0.6s ease both",
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
            <span className="whitespace-nowrap">{fechaHoy}</span>
          </p>
        )}

        {/* Prefijo + Título */}
        <div style={{ animation: "fade-rise 0.7s ease 0.1s both" }}>
          <div className="leading-tight flex flex-wrap items-baseline gap-x-3 gap-y-1">

            {prefijo && (
              <span
                style={{
                  fontSize:   sizePrefijo,
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle:  "italic",
                  fontWeight: 500,
                  lineHeight: 1.05,
                  color:      "#ffffff",
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
                lineHeight:           1.2,
                paddingBottom:        "0.15em",
                backgroundImage:      "linear-gradient(90deg, #ffffff, #c8d96a, #ffffff)",
                backgroundSize:       "250% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
                animation:            "gradientShift 6s ease infinite",
                overflowWrap:         "break-word",
                wordBreak:            "break-word",
                maxWidth:             "100%",
                display:              "inline-block",
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
