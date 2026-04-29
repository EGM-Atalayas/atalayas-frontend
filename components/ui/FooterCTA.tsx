"use client";

import Link from "next/link";
import Prism from "@/components/ui/Prism";
import SplitText from "@/components/ui/SplitText";

const HEADING = "¿Tu empresa está en el área empresarial?";

export default function FooterCTA() {
  return (
    <footer
      className="relative w-full flex flex-col"
      style={{ background: "#0a0a0f", color: "white", minHeight: "95vh" }}
    >
      {/* ── Prism background ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Prism
          animationType="rotate"
          glow={1.2}
          noise={0.3}
          scale={3.6}
          colorFrequency={1}
          bloom={1}
          timeScale={0.5}
          transparent={true}
          suspendWhenOffscreen={true}
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1] bg-black/30" />

      {/* Fade superior — mezcla con sección anterior */}
      <div
        className="absolute top-0 left-0 right-0 h-40 pointer-events-none z-[50]"
        style={{ background: "linear-gradient(to bottom, #0a0a0f, transparent)" }}
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
          <SplitText
            text={HEADING}
            tag="h2"
            textAlign="center"
            delay={30}
            duration={1}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 50 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-50px"
            style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: "clamp(2rem, 6vw, 72px)",
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          />

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
