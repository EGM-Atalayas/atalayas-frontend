"use client";

import Link from "next/link";
import SplitText from "@/components/ui/SplitText";

const HEADING = "¿Tu empresa está en el área empresarial?";

export default function FooterCTA() {
  return (
    <footer
      className="relative w-full flex flex-col"
      style={{ background: "#0a0a0f", color: "white", minHeight: "95vh" }}
    >
      {/* ── Animated 3D prisms (SVG, CSS-only) ─────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden" style={{ background: "#0a0a0f" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Glow para aristas */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-lg">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ═══ PRISMA CENTRAL ═══ */}
          <g transform="translate(700, 420)">
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" />
              {/* Cara 1 - frontal */}
              <polygon points="0,-160 140,80 -140,80" fill="rgba(59,130,246,0.25)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" filter="url(#glow)">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="6.66s" repeatCount="indefinite" />
              </polygon>
              {/* Cara 2 */}
              <polygon points="0,-160 140,80 -140,80" fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.4)" strokeWidth="1" transform="rotate(120)">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="6.66s" repeatCount="indefinite" />
              </polygon>
              {/* Cara 3 */}
              <polygon points="0,-160 140,80 -140,80" fill="rgba(168,85,247,0.2)" stroke="rgba(168,85,247,0.4)" strokeWidth="1" transform="rotate(240)">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="6.66s" begin="3.33s" repeatCount="indefinite" />
              </polygon>
              {/* Arista interior */}
              <line x1="0" y1="-160" x2="0" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              <line x1="140" y1="80" x2="0" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <line x1="-140" y1="80" x2="0" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            </g>
          </g>

          {/* ═══ PRISMA IZQUIERDA ═══ */}
          <g transform="translate(300, 320)">
            <g>
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="28s" repeatCount="indefinite" />
              <polygon points="0,-100 85,50 -85,50" fill="rgba(6,182,212,0.2)" stroke="rgba(6,182,212,0.4)" strokeWidth="1" filter="url(#glow)">
                <animate attributeName="opacity" values="0.7;0.25;0.7" dur="9.33s" repeatCount="indefinite" />
              </polygon>
              <polygon points="0,-100 85,50 -85,50" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" strokeWidth="0.8" transform="rotate(120)">
                <animate attributeName="opacity" values="0.25;0.7;0.25" dur="9.33s" repeatCount="indefinite" />
              </polygon>
              <polygon points="0,-100 85,50 -85,50" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.3)" strokeWidth="0.8" transform="rotate(240)">
                <animate attributeName="opacity" values="0.25;0.7;0.25" dur="9.33s" begin="4.66s" repeatCount="indefinite" />
              </polygon>
            </g>
          </g>

          {/* ═══ PRISMA DERECHA ═══ */}
          <g transform="translate(1080, 550)">
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="35s" repeatCount="indefinite" />
              <polygon points="0,-85 72,42 -72,42" fill="rgba(168,85,247,0.22)" stroke="rgba(168,85,247,0.45)" strokeWidth="1" filter="url(#glow)">
                <animate attributeName="opacity" values="0.7;0.25;0.7" dur="11.66s" repeatCount="indefinite" />
              </polygon>
              <polygon points="0,-85 72,42 -72,42" fill="rgba(6,182,212,0.18)" stroke="rgba(6,182,212,0.35)" strokeWidth="0.8" transform="rotate(120)">
                <animate attributeName="opacity" values="0.25;0.7;0.25" dur="11.66s" repeatCount="indefinite" />
              </polygon>
              <polygon points="0,-85 72,42 -72,42" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" strokeWidth="0.8" transform="rotate(240)">
                <animate attributeName="opacity" values="0.25;0.7;0.25" dur="11.66s" begin="5.83s" repeatCount="indefinite" />
              </polygon>
            </g>
          </g>

          {/* ═══ PARTÍCULAS / ESTRELLAS ═══ */}
          <g opacity="0.4">
            <circle cx="200" cy="150" r="1.5" fill="white">
              <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="950" cy="120" r="1" fill="white">
              <animate attributeName="opacity" values="0;0.8;0" dur="5s" begin="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="1200" cy="300" r="1.5" fill="white">
              <animate attributeName="opacity" values="0;1;0" dur="3.5s" begin="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="150" cy="700" r="1" fill="white">
              <animate attributeName="opacity" values="0;0.7;0" dur="4.5s" begin="0.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="1100" cy="750" r="1.5" fill="white">
              <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="500" cy="800" r="1" fill="white">
              <animate attributeName="opacity" values="0;0.6;0" dur="5.5s" begin="3s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* ═══ GLOW CENTRAL ═══ */}
          <circle cx="700" cy="420" r="180" fill="rgba(59,130,246,0.08)" filter="url(#glow-lg)">
            <animate attributeName="r" values="160;200;160" dur="6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="6s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

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
