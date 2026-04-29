"use client";

import { useAuth } from "@/context/AuthContext";

interface DashboardHeroProps {
  prefijo?: string;
  titulo: string;
  imagenFondo?: string;
  objectPosition?: string;     // ← Nueva prop (opcional)
}

export default function DashboardHero({
  prefijo,
  titulo,
  imagenFondo = "/background-dashboard.webp",
  objectPosition = "center 40%"   // valor por defecto (el que tenías antes)
}: DashboardHeroProps) {

  const { usuario } = useAuth();

  return (
    <div
      className="relative overflow-hidden flex items-center"
      style={{ minHeight: "320px", boxShadow: "0 6px 32px rgba(0,0,0,0.22)" }}
    >
      <img
        src={imagenFondo}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: objectPosition   // ← Ahora usa la prop
        }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(10,20,40,0.60)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(13,27,46,0.92) 0%, rgba(13,27,46,0.50) 45%, transparent 100%)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,27,46,0.60) 0%, transparent 35%)" }} />

      <div className="relative z-10 w-full px-10 lg:px-16 py-14">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
          style={{ color: "var(--verde-oliva-hover)" }}
        >
          {usuario?.nombreEmpresa ?? "Mi empresa"}
          <span style={{ color: "rgba(255,255,255,0.2)" }}> · </span>
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long", day: "numeric", month: "long",
          }).replace(/^\w/, (c) => c.toUpperCase())}
        </p>

        <div className="leading-none flex flex-wrap items-center gap-x-3">
          {prefijo && (
            <span
              className="text-white"
              style={{
                fontSize: "clamp(3rem, 6vw, 4rem)",
                fontFamily: "var(--font-poppins), sans-serif",
                fontWeight: 300,
                letterSpacing: "-0.03em",
                animation: "heroFadeUp 0.7s ease both",
              }}
            >
              {prefijo}
            </span>
          )}
          <span
            style={{
              fontSize: "clamp(3rem, 6vw, 5rem)",
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              background: "linear-gradient(90deg, #A3B535, #ffffff, #A3B535)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "heroFadeUp 0.7s ease 0.12s both, gradientShift 8s ease infinite",
            }}
          >
            {titulo}
          </span>
        </div>
        <style>{`
          @keyframes heroFadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50%       { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    </div>
  );
}