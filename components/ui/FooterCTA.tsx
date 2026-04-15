"use client";

import Link from "next/link";
import LineWaves from "@/components/ui/LineWaves";

const HEADING = "¿Tu empresa está en el parque empresarial?";

export default function FooterCTA() {
  return (
    <footer
      className="relative w-full flex flex-col"
      style={{ background: "#000000", color: "white", minHeight: "75vh" }}
    >
      {/* ── LineWaves background ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <LineWaves
          speed={0.3}
          innerLineCount={32}
          outerLineCount={36}
          warpIntensity={1.0}
          rotation={-45}
          edgeFadeWidth={0.0}
          colorCycleSpeed={1.0}
          brightness={0.22}
          color1="#4f7fff"
          color2="#7b9fff"
          color3="#a0c4ff"
          enableMouseInteraction={true}
          mouseInfluence={2.0}
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1] bg-black/55" />

      {/* Fade superior — mezcla con LogoLoop */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-[2]"
        style={{ background: "linear-gradient(to bottom, #0D1B2E, transparent)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center text-center flex-1 space-y-8 px-6 py-12">

          {/* Pre-headline */}
          <p
            className="text-xl sm:text-3xl text-white leading-[1.1]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Únete a Atalayas
          </p>

          {/* Main headline */}
          <h2
            className="font-semibold leading-[1] tracking-tighter text-white"
            style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: "clamp(2rem, 6vw, 72px)",
              background: "linear-gradient(to bottom, #ffffff, #ffffff, #b4c0ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {HEADING}
          </h2>

          {/* Subheadline */}
          <p
            className="text-sm sm:text-base leading-[1.65] max-w-xl"
            style={{ fontFamily: "'Instrument Sans', sans-serif", opacity: 0.7 }}
          >
            Digitaliza la incorporación y formación interna de tu equipo en minutos. Sin conocimientos técnicos.
          </p>

          {/* CTA */}
          <Link
            href="/register-empresa"
            className="liquid-glass rounded-full px-10 py-4 text-xl font-semibold text-white hover:scale-[1.03] transition-transform inline-flex items-center justify-center"
            style={{ background: "rgba(59, 130, 246, 0.25)", fontFamily: "'Instrument Sans', sans-serif" }}
          >
            Solicitar alta
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="mt-auto px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
          <p className="text-sm text-white/40" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
            © {new Date().getFullYear()} EGM Atalayas Ciudad Empresarial. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
              Iniciar sesión
            </Link>
            <Link href="/register-empresa" className="text-sm text-white/40 hover:text-white transition-colors" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
              Registrar empresa
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
