"use client";

import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { UserPlus, GraduationCap, Megaphone, BarChart3, FolderOpen, Sparkles, Bot, Users, ListTodo, Repeat, GitBranch, MessageSquare, KanbanSquare, Rocket, Smartphone } from "lucide-react";

// ── Datos — rellenar antes del evento ────────────────────────────────────────
const VIDEO_URL  = ""; // https://player.vimeo.com/video/XXXXXXX
const QR_URL     = "https://atalayas-egm.vercel.app";
const FOTO_GRUPO = ""; // "/foto-equipo.jpg"

const EQUIPO = [
  { nombre: "Erik Vidal",       rol: "Full-stack", desc: "El que conectó el front con el back sin que nada explotara",     email: "erikvidalzemba@gmail.com",        foto: "/showcase/equipo/erik.jpeg" },
  { nombre: "Francisco Baeza",  rol: "Frontend",   desc: "Convirtió los diseños en pantallas que dan ganas de usar",       email: "franciscobaezasanchez@gmail.com", foto: "/showcase/equipo/fran.jpeg" },
  { nombre: "Eloy Pérez",       rol: "Frontend",   desc: "El ojo crítico que no dejaba pasar nada feo en pantalla",        email: "eloyperezinglada@gmail.com",      foto: "/showcase/equipo/eloy.jpeg" },
  { nombre: "Martina Vargas",   rol: "Full-stack", desc: "De las primeras en tirar código y de las últimas en rendirse",   email: "martinavargastroche06@gmail.com", foto: "/showcase/equipo/martina.jpeg" },
  { nombre: "César Alonso",     rol: "Backend",    desc: "Hizo que los datos llegaran donde tenían que llegar, siempre",   email: "cealonspont@gmail.com",           foto: "/showcase/equipo/cesar.jpeg" },
];

const TECNOLOGIAS: { nombre: string; rol: string; color: string; capa: "Frontend" | "Backend" | "Infra" | "IA"; logo?: string; logoSize?: number; logoBottom?: number; logoRight?: number }[] = [
  { nombre: "Next.js",      rol: "La estructura de la web",     color: "#18181B", capa: "Frontend", logo: "/showcase/logos/nextjs.png" },
  { nombre: "React",        rol: "Lo que ves en pantalla",      color: "#61DAFB", capa: "Frontend", logo: "/showcase/logos/react.png" },
  { nombre: "TypeScript",   rol: "Código sin errores",          color: "#7DD3FC", capa: "Frontend", logo: "/showcase/logos/typescript.png", logoSize: 140, logoBottom: 0, logoRight: -5 },
  { nombre: "Tailwind",     rol: "El diseño y los estilos",     color: "#06B6D4", capa: "Frontend", logo: "/showcase/logos/tailwind.png" },
  { nombre: "Node.js",      rol: "El motor del servidor",       color: "#4ADE80", capa: "Backend", logo: "/showcase/logos/nodejs.png", logoSize: 110 },
  { nombre: "PostgreSQL",   rol: "Donde se guardan los datos",  color: "#A5B4FC", capa: "Backend", logo: "/showcase/logos/postgresql.png" },
  { nombre: "Supabase",     rol: "Archivos, accesos y más",     color: "#16803C", capa: "Infra",   logo: "/showcase/logos/supabase.png", logoSize: 95, logoBottom: 25 },
  { nombre: "Vercel",       rol: "Publica la app en la nube",   color: "#475569", capa: "Infra",   logo: "/showcase/logos/vercel.png", logoSize: 150, logoBottom: -10 },
  { nombre: "Claude IA",    rol: "Inteligencia artificial",     color: "#D97757", capa: "IA",      logo: "/showcase/logos/claude.png" },
];

const NUMEROS = [
  { valor: "2",  label: "meses de\ndesarrollo" },
  { valor: "5",  label: "personas en\nel equipo" },
  { valor: "1",  label: "cliente\nreal" },
  { valor: "8+", label: "módulos\nfuncionales" },
];

const FUNCIONALIDADES: { Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; titulo: string; desc: string }[] = [
  { Icon: UserPlus,      titulo: "Onboarding estructurado",  desc: "Cada empleado tiene su proceso desde el día 1. Sin improvisación." },
  { Icon: GraduationCap, titulo: "Formación modular",         desc: "PRL, calidad, protocolos y formación específica por empresa." },
  { Icon: Megaphone,     titulo: "Comunicación centralizada", desc: "Anuncios, comunicados y eventos en un solo lugar." },
  { Icon: BarChart3,     titulo: "Panel y estadísticas",      desc: "Movimientos de plantilla, formación completada, datos reales." },
  { Icon: FolderOpen,    titulo: "Gestión documental",        desc: "Documentos organizados y accesibles para toda la organización." },
  { Icon: Sparkles,      titulo: "IA integrada",              desc: "Chatbot de consulta para empleados. Sin saturar a RRHH." },
];

// ── Estilos base ─────────────────────────────────────────────────────────────
const BG     = "#1E1B4B";
const LIMA   = "#FFD166";
const MUTED  = "rgba(255,255,255,0.38)";
const CARD   = "rgba(255,255,255,0.06)";
const BORDER = "rgba(255,255,255,0.12)";

// Tema por slide — bg + accent vibrantes y variados
const SLIDE_THEMES: { bg: string; accent: string }[] = [
  { bg: "#1E1B4B", accent: "#FFD166" }, // 0 — Portada · indigo nocturno + oro suave
  { bg: "#2563EB", accent: "#FEF08A" }, // 1 — Sobre Atalayas · azul vivo + amarillo pastel
  { bg: "#FB345F", accent: "#FEF3C7" }, // 2 — El problema · rojo pastel + cream
  { bg: "#059669", accent: "#FEF9C3" }, // 3 — La solución · esmeralda + lemon cream
  { bg: "#06B6D4", accent: "#ECFEFF" }, // 4 — Demo · cian fresco + cyan claro
  { bg: "#6D28D9", accent: "#EDE9FE" }, // 5 — Tecnologías · violeta vivo + lavanda
  { bg: "#FB923C", accent: "#FFF7ED" }, // 6 — Metodología · naranja claro + cream cálido
  { bg: "#A78BFA", accent: "#F5F3FF" }, // 7 — El camino · lavanda suave + violeta pálido
  { bg: "#BE185D", accent: "#FCE7F3" }, // 8 — El equipo · rosa magenta + rose pálido
  { bg: "#0E7490", accent: "#CFFAFE" }, // 9 — Cierre · cian profundo + cyan claro
  { bg: "#1B3F7E", accent: "#C3F8B4" }, // 10 — Contacto · azul corporativo EGM + lima de marca
];

// Contexto para que cada slide acceda al accent actual
const SlideThemeCtx = createContext<{ accent: string }>({ accent: LIMA });
const useAccent = () => useContext(SlideThemeCtx).accent;

// ── Slides ───────────────────────────────────────────────────────────────────
function Slide1() {
  const accent = useAccent();
  return (
    <div className="relative flex flex-col items-center justify-start h-full text-center px-8 pt-16 overflow-hidden">
      {/* Imagen recortada — cubre la mitad inferior */}
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], opacity: { duration: 0.6, ease: "easeOut" } }}
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          height: "75%",
          backgroundImage: "url('/showcase-cutout.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          mixBlendMode: "screen",
          maskImage: "radial-gradient(ellipse 80% 90% at 50% 100%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 90% at 50% 100%, black 40%, transparent 100%)",
        }}
      />

      {/* Gradiente inferior para que el texto resalte sobre la imagen */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to bottom, rgba(16,64,160,1) 0%, rgba(16,64,160,0.7) 25%, rgba(16,64,160,0.0) 55%)",
      }} />

      {/* Texto — arriba */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-6">
          <img src="/logo.webp" alt="Atalayas" style={{ height: 44, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.9 }} />
          <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.25)" }} />
          <img src="/alicante-futura-logo.png" alt="Alicante Futura Lab" style={{ height: 44, width: "auto", opacity: 0.85 }} />
        </div>
        <h1 style={{ fontSize: "clamp(3.2rem, 9vw, 7.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 0.95, marginTop: "0.2em" }}>
          EGM<br />Atalayas
        </h1>
        <p style={{ fontSize: "clamp(1.3rem, 2.8vw, 1.9rem)", color: accent, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Ciudad Empresarial
        </p>
        <p style={{ fontSize: "clamp(1rem, 1.9vw, 1.35rem)", color: "rgba(255,255,255,0.65)", maxWidth: 560, lineHeight: 1.55, fontWeight: 400, marginTop: "0.2em" }}>
          Plataforma digital de onboarding, formación y gestión interna para empresas
        </p>
      </motion.div>
    </div>
  );
}

function Slide2() {
  const accent = useAccent();
  const stats = [
    { valor: "1,2M", unidad: "m²",        label: "de superficie" },
    { valor: "8.000", unidad: "+",         label: "empleos directos" },
    { valor: "1.700", unidad: "M€",      label: "de facturación" },
    { valor: "0,7M", unidad: "m²",        label: "en proyecto" },
  ];
  const sectores = ["Industria", "Logística", "Comercio", "Servicios técnicos", "Construcción"];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-24">


      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(4rem, 9.2vw, 8.2rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.04em", lineHeight: 0.95 }}
      >
        El <span style={{ color: accent }}>área empresarial</span><br />
        de referencia en Alicante
      </motion.h2>

      {/* Stats grandes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full max-w-[85vw]">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.55, ease: [0.22,1,0.36,1] }}
            className="flex flex-col items-center justify-center py-12 px-6 rounded-3xl text-center"
            style={{ background: "rgba(255,255,255,0.08)", border: `1.5px solid rgba(255,255,255,0.22)` }}>
            <div className="flex items-baseline gap-1.5">
              <span style={{ fontSize: "clamp(3.6rem, 6.5vw, 6rem)", fontWeight: 900, color: "#FEF08A", lineHeight: 0.95, letterSpacing: "-0.035em" }}>
                {s.valor}
              </span>
              <span style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.4rem)", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                {s.unidad}
              </span>
            </div>
            <span style={{ fontSize: "clamp(1.4rem, 1.7vw, 1.8rem)", fontWeight: 700, color: "rgba(255,255,255,0.9)", marginTop: 28, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>

    </div>
  );
}

function Slide3() {
  const accent = useAccent();
  // Todos los bocadillos con cola abajo
  const tail = { bottom: -9, left: "30%", right: "auto", top: "auto" };
  const quejas = [
    // Arriba
    // Arriba — 4 bocadillos en 2 filas escalonadas
    { txt: "¿El nuevo ha leído el protocolo?",                          rot: -4, pos: { top: 50,  left: 50 },         w: 310, z: 4 },
    { txt: "Cada vez que entra alguien nuevo empezamos desde cero",     rot: -1, pos: { top: 100, left: "27%" },      w: 330, z: 3 },
    { txt: "Mandamos el aviso por email y la mitad no se enteró",       rot:  2, pos: { top: 50,  right: "27%" },     w: 320, z: 3 },
    { txt: "Tenemos tres grupos de WhatsApp y ninguno funciona bien",   rot:  6, pos: { top: 98,  right: 50 },        w: 310, z: 4 },
    // Laterales
    { txt: "Ni sé quiénes son nuestros vecinos de edificio",            rot: -4, pos: { top: "38%", left: 50 },       w: 300, z: 2 },
    { txt: "Nadie documentó cómo se hacen las cosas",                   rot:  5, pos: { top: "38%", right: 50 },      w: 305, z: 2 },
    // Abajo
    { txt: "¿Dónde pongo una incidencia del parking? Nadie lo sabe",   rot: -5, pos: { bottom: 50, left: 50 },        w: 310, z: 4 },
    { txt: "Los eventos del área nos enteramos tarde o por casualidad", rot:  1, pos: { bottom: 100, left: "27%" },   w: 330, z: 3 },
    { txt: "No sé si el empleado leyó el aviso",                        rot:  3, pos: { bottom: 50, right: "27%" },   w: 315, z: 3 },
    { txt: "Si alguien se va nos llevamos el conocimiento con él",      rot:  5, pos: { bottom: 98, right: 50 },      w: 310, z: 4 },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 gap-8 overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(4rem, 8.5vw, 7rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.04em", lineHeight: 1.0, maxWidth: 1200, zIndex: 5 }}
      >
        Lo que frena a las<br />
        <span style={{ color: "transparent", WebkitTextStroke: "3px #ffffff" }}>empresas del área</span>
      </motion.h2>

      {/* Bocadillos de queja flotando */}
      {quejas.map((q, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.12, duration: 0.55, ease: [0.22,1,0.36,1] }}
          className="absolute px-6 py-5"
          style={{
            ...q.pos,
            width: q.w,
            zIndex: q.z,
            transform: `rotate(${q.rot}deg)`,
            background: "#fff",
            color: "#1a1a1a",
            borderRadius: "1.8rem",
            boxShadow: "0 20px 50px -10px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.12)",
            fontWeight: 600,
            fontSize: "clamp(1.4rem, 1.8vw, 1.7rem)",
            lineHeight: 1.35,
          }}
        >
          {q.txt}
          {/* Cola abajo */}
          <span style={{
            position: "absolute",
            ...tail,
            width: 16, height: 16,
            background: "#fff",
            transform: "rotate(45deg)",
            boxShadow: "3px 3px 6px -3px rgba(0,0,0,0.10)",
          }} />
        </motion.div>
      ))}
    </div>
  );
}

function Slide4() {
  const accent = useAccent();
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 gap-10 overflow-hidden">
      <Label>La solución</Label>

      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3.2rem, 7.2vw, 5.6rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.035em", lineHeight: 1, maxWidth: 1100, zIndex: 5 }}
      >
        Una plataforma.<br />
        <span style={{ color: accent }}>Todo conectado.</span>
      </motion.h2>

      {/* Mockup central — ventana de navegador con resumen visual de módulos */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22,1,0.36,1] }}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 100%)",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
          aspectRatio: "16/9.5",
          maxHeight: "55vh",
        }}
      >
        {/* Barra de browser */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
          <div className="ml-4 px-3 py-1 rounded-md flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.06)", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            <span>🔒</span> atalayas-egm.vercel.app
          </div>
        </div>

        {/* Contenido del mock — grid de "módulos" con iconos */}
        <div className="p-6 sm:p-8 grid grid-cols-3 gap-4 h-[calc(100%-44px)]">
          {FUNCIONALIDADES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08, duration: 0.45, ease: [0.22,1,0.36,1] }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
            >
              <f.Icon className="w-7 h-7 sm:w-9 sm:h-9" style={{ color: accent }} />
              <span style={{ fontSize: "clamp(0.85rem, 1.2vw, 1.1rem)", fontWeight: 700, color: "#fff", textAlign: "center", padding: "0 0.5rem" }}>{f.titulo}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tagline inferior */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.6 }}
        style={{ fontSize: "clamp(1.1rem, 1.7vw, 1.45rem)", color: "rgba(255,255,255,0.6)", textAlign: "center", letterSpacing: "0.02em" }}
      >
        Onboarding · Formación · Comunicación · Documentación · IA
      </motion.p>
    </div>
  );
}

function Slide5() {
  const accent = useAccent();
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-8">
      <Label>La demo</Label>
      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(2.8rem, 6.2vw, 5rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.035em", lineHeight: 1 }}
      >
        La plataforma <span style={{ color: accent }}>en acción</span>
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22,1,0.36,1] }}
        className="w-full max-w-5xl rounded-2xl overflow-hidden"
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          aspectRatio: "16/9",
          maxHeight: "65vh",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.55)",
        }}
      >
        {VIDEO_URL ? (
          <iframe src={VIDEO_URL} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" style={{ border: "none" }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `${accent}1f`, border: `2px solid ${accent}40` }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <polygon points="6,3 21,12 6,21" fill={accent} />
              </svg>
            </div>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.15rem", fontWeight: 500 }}>Vídeo demo pendiente</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Slide6() {
  const accent = useAccent();
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-10 gap-24 overflow-hidden"
      style={{ background: "#7C3AED" }}>

      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3.4rem, 7vw, 5.8rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.04em", lineHeight: 1.1 }}
      >
        El stack que{" "}
        <span style={{
          color: "#7C3AED",
          background: "#ffffff",
          borderRadius: "0.15em",
          padding: "0.05em 0.25em",
          display: "inline-block",
        }}>
          lo hace posible
        </span>
      </motion.h2>

      {/* Grid grande de tecnologías */}
      <div className="grid grid-cols-3 gap-14 w-full px-16">
        {TECNOLOGIAS.map(({ nombre, rol, color, capa, logo, logoSize, logoBottom, logoRight }, i) => {
          const capaColor: Record<string, string> = {
            Frontend: "#60A5FA", Backend: "#4ADE80", Infra: "#FB923C", IA: "#F472B6"
          };
          const cc = capaColor[capa] ?? "#fff";
          return (
            <motion.div
              key={nombre}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12 + i * 0.06, duration: 0.5, ease: [0.22,1,0.36,1] }}
              className="relative rounded-3xl overflow-hidden flex flex-col gap-4 transition-transform hover:-translate-y-1"
              style={{
                background: `linear-gradient(145deg, ${color}58 0%, ${color}30 100%), rgba(255,255,255,0.08)`,
                border: `1.5px solid rgba(255,255,255,0.15)`,
                boxShadow: `0 6px 24px rgba(0,0,0,0.3)`,
                minHeight: 175,
                padding: "18px 22px 16px",
              }}
            >
              {/* Logo de fondo — marca de agua */}
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" style={{
                  position: "absolute", bottom: logoBottom ?? 10, right: logoRight ?? 14,
                  width: logoSize ?? 110, height: logoSize ?? 110, objectFit: "contain",
                  opacity: 0.65,
                  filter: "brightness(0) invert(1)",
                }} />
              )}

              {/* Badge categoría */}
              <div className="relative z-10">
                <span style={{
                  fontSize: "0.82rem", fontWeight: 800, letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.9)",
                  background: "rgba(255,255,255,0.15)",
                  padding: "4px 12px", borderRadius: "6px",
                  display: "inline-block",
                }}>
                  {capa}
                </span>
              </div>

              {/* Nombre + descripción */}
              <div className="relative z-10 mt-auto flex flex-col gap-1.5">
                <p style={{
                  fontSize: "clamp(2.1rem, 3.1vw, 2.9rem)",
                  fontWeight: 900, color: "#ffffff",
                  letterSpacing: "-0.03em", lineHeight: 1,
                }}>
                  {nombre}
                </p>
                <p style={{ fontSize: "1.2rem", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
                  {rol}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Slide7() {
  const accent = useAccent();
  const retos = [
    { Icon: Bot,      titulo: "IA inestable" },
    { Icon: Users,    titulo: "Comunicación" },
    { Icon: ListTodo, titulo: "Organización" },
    { Icon: Repeat,   titulo: "Reasignación" },
  ];
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 gap-16 overflow-hidden">
      <Label>El camino</Label>
      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3.2rem, 7.2vw, 5.6rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.035em", lineHeight: 1 }}
      >
        El camino no fue <span style={{ color: accent }}>recto</span>
      </motion.h2>

      {/* Camino — imagen ilustrada (huellas en la nieve) */}
      <motion.div
        className="relative w-full max-w-5xl flex items-center justify-center"
        style={{ height: "clamp(200px, 28vh, 320px)" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/showcase/dibujo.png"
          alt="El camino"
          style={{
            maxHeight: "100%",
            maxWidth: "100%",
            objectFit: "contain",
          }}
        />
      </motion.div>

      {/* 4 nodos en fila debajo del camino */}
      <div className="w-full max-w-5xl flex justify-around items-start mt-2">
        {retos.map((r, i) => {
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.25, duration: 0.55, ease: [0.22,1,0.36,1] }}
              className="flex flex-col items-center gap-3"
            >
              {/* Círculo con icono — pulse infinito */}
              <motion.div
                animate={{
                  boxShadow: [
                    `0 0 0 0 ${accent}55`,
                    `0 0 0 18px ${accent}00`,
                  ],
                }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 1 + i * 0.3, ease: "easeOut" }}
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
                  boxShadow: `0 10px 30px -6px ${accent}aa`,
                }}
              >
                <r.Icon className="w-11 h-11" style={{ color: "#0f172a", strokeWidth: 2.4 }} />
              </motion.div>
              {/* Etiqueta */}
              <span style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                color: "#fff",
                textAlign: "center",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}>
                {r.titulo}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Conclusión corta y simple */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.6 }}
        style={{
          fontSize: "clamp(1.3rem, 2.2vw, 1.7rem)",
          color: "rgba(255,255,255,0.75)",
          textAlign: "center",
          fontWeight: 500,
        }}
      >
        Cada obstáculo nos enseñó algo.
      </motion.p>
    </div>
  );
}

function Slide8() {
  const accent = useAccent();
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-6">
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(2.6rem, 6.5vw, 4.4rem)", fontWeight: 900, color: "rgba(255,255,255,0.7)", lineHeight: 1.35, maxWidth: 980 }}>
        Aprendimos <span style={{ color: "#fff" }}>haciendo.</span>
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ fontSize: "clamp(1.1rem, 2.3vw, 1.5rem)", color: "rgba(255,255,255,0.55)" }}>
        Y construimos algo de lo que estamos orgullosos.
      </motion.p>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
        className="mt-4 px-7 py-4 rounded-2xl" style={{ background: `${accent}1f`, border: `1.5px solid ${accent}55` }}>
        <span style={{ fontSize: "clamp(1rem, 1.4vw, 1.15rem)", fontWeight: 700, color: accent }}>
          Piloto demostrativo · Escalable · Replicable en otros entornos empresariales
        </span>
      </motion.div>
    </div>
  );
}

function Slide9() {
  const accent = useAccent();
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 gap-10 overflow-hidden" style={{ background: "#2563EB", paddingTop: "2%", paddingBottom: "2%" }}>
      {/* Decorative circles — filled */}
      <div style={{ position: "absolute", top: "-12%", left: "-8%", width: 420, height: 420, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-15%", right: "-6%", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      {/* Decorative circles — border only */}
      <div style={{ position: "absolute", bottom: "8%", left: "3%", width: 120, height: 120, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.12)", pointerEvents: "none" }} />
      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(5rem, 10vw, 8rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        <span style={{ color: "#fff" }}>Contacto</span>
      </motion.h2>
      <div className="grid grid-cols-5 gap-10 w-full px-10">
        {[1, 2, 0, 3, 4].map(idx => EQUIPO[idx]).map(({ nombre, email, foto }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i, duration: 0.5 }}
            className="flex flex-col items-center gap-4 p-5 rounded-3xl text-center overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}`, minHeight: 340 }}>
            <div className="w-44 h-44 rounded-full overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: "rgba(27,63,126,0.5)", border: "3px solid rgba(255,255,255,0.15)" }}>
              {foto ? (
                <img src={foto} alt={nombre} className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: "2.4rem", fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>
                  {nombre.split(" ").slice(0, 2).map(n => n[0]).join("")}
                </span>
              )}
            </div>
            <div className="w-full">
              <p style={{ fontSize: "clamp(1.6rem, 2.2vw, 2.2rem)", fontWeight: 700, color: "#fff", lineHeight: 1.25, whiteSpace: "nowrap" }}>
                {nombre}
              </p>
              <p style={{
                fontSize: "clamp(0.8rem, 0.95vw, 1rem)",
                color: "#ffffff",
                marginTop: 8,
                lineHeight: 1.4,
                wordBreak: "break-all",
                letterSpacing: "-0.01em",
              }}>
                {email}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-8" style={{ marginTop: "4%" }}>
        <div className="flex items-center gap-3">
          <Smartphone size={36} color="#fff" strokeWidth={2.5} />
          <p style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>Escanea para visitar la plataforma</p>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: "#fff", boxShadow: "0 0 40px rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.2)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/showcase/qrcode.svg" alt="QR plataforma" width={210} height={210} />
        </div>
        <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>{QR_URL}</p>
      </div>
    </div>
  );
}

// ── Label de sección ──────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  const accent = useAccent();
  return (
    <span
      className="font-bold uppercase"
      style={{
        color: accent,
        fontSize: "clamp(0.95rem, 1.4vw, 1.2rem)",
        letterSpacing: "0.2em",
      }}
    >
      {children}
    </span>
  );
}

// ── NUEVA: Metodología de trabajo ─────────────────────────────────────────────
function SlideMetodologia() {
  const accent = useAccent();
  const pilares = [
    { Icon: KanbanSquare,  titulo: "Sprints semanales",   desc: "Tareas repartidas y objetivos claros cada semana", tool: "Notion",  toolColor: "#EC4899" },
    { Icon: GitBranch,     titulo: "Git + Pull Requests", desc: "Nadie sube código sin revisión previa",            tool: "GitHub",  toolColor: "#94A3B8" },
    { Icon: MessageSquare, titulo: "Reuniones + Discord", desc: "Canal siempre abierto para decidir al momento",    tool: "Discord", toolColor: "#818CF8" },
    { Icon: Rocket,        titulo: "Despliegue continuo", desc: "Cada mejora aprobada se publica automáticamente",  tool: "Vercel",  toolColor: "#6EE7B7" },
  ];
  const retos = [
    { Icon: Bot,      titulo: "IA inestable",  color: "#F87171" },
    { Icon: Users,    titulo: "Comunicación",  color: "#FBBF24" },
    { Icon: ListTodo, titulo: "Organización",  color: "#60A5FA" },
    { Icon: Repeat,   titulo: "Reasignación",  color: "#A78BFA" },
  ];
  return (
    <div className="relative flex flex-col h-full px-12 py-10 gap-6 overflow-hidden">

      {/* Título */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        className="flex flex-col items-center gap-2 shrink-0">
        <h2 style={{ fontSize: "clamp(2.8rem, 5.5vw, 4.4rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.04em", lineHeight: 1 }}>
          Así lo{" "}
          <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: "0.15em", padding: "0.02em 0.22em", display: "inline-block" }}>
            construimos
          </span>
        </h2>
        <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.6)", fontWeight: 500, textAlign: "center" }}>
          Un proyecto real desde cero, aprendiendo en cada paso
        </p>
      </motion.div>

      {/* Layout 2 columnas */}
      <div className="grid grid-cols-2 gap-6 w-full flex-1 min-h-0">

        {/* Izquierda — 4 pilares en 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {pilares.map(({ Icon, titulo, desc, tool, toolColor }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.09, duration: 0.5, ease: [0.22,1,0.36,1] }}
              className="relative rounded-2xl flex flex-col justify-between overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: `1.5px solid ${toolColor}55`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "20px 18px 18px",
                boxShadow: `0 4px 24px rgba(0,0,0,0.25)`,
              }}
            >
              {/* Icono */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${toolColor}28`, color: toolColor }}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Texto */}
              <div className="flex flex-col gap-1 mt-3">
                <p style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{titulo}</p>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{desc}</p>
              </div>

              {/* Tool badge */}
              <span style={{
                position: "absolute", top: 14, right: 14,
                fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase",
                color: toolColor, background: `${toolColor}20`,
                padding: "3px 8px", borderRadius: "5px",
              }}>{tool}</span>
            </motion.div>
          ))}
        </div>

        {/* Derecha — el camino */}
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.7, ease: [0.22,1,0.36,1] }}
          className="flex flex-col gap-4 rounded-3xl"
          style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)", padding: "24px 24px 20px", boxShadow: "0 4px 32px rgba(0,0,0,0.2)" }}
        >
          {/* Título derecha */}
          <p style={{ fontSize: "clamp(1.3rem, 2vw, 1.7rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.02em", lineHeight: 1.1, flexShrink: 0 }}>
            El camino no fue{" "}
            <span style={{ color: accent }}>recto</span>
          </p>

          {/* Dibujo */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/showcase/dibujo.png" alt="El camino" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>

          {/* Retos */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            {retos.map(({ Icon, titulo, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.1, duration: 0.4, ease: [0.22,1,0.36,1] }}
                className="flex items-center gap-2.5 rounded-xl"
                style={{ background: `${color}18`, border: `1px solid ${color}40`, padding: "10px 14px" }}
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>{titulo}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// ── El equipo — 5 personas detrás del proyecto ───────────────────────────────
function SlideEquipo() {
  const accent = useAccent();
  // Martina, Eloy, Erik arriba — Fran, César abajo
  const orden = [3, 2, 0, 1, 4]; // Martina, Eloy, Erik, Fran, César
  const equipoOrdenado = orden.map(i => EQUIPO[i]);
  const fila1 = equipoOrdenado.slice(0, 3);
  const fila2 = equipoOrdenado.slice(3, 5);
  const Tarjeta = ({ nombre, rol, desc, foto }: { nombre: string; rol: string; desc: string; foto: string }, i: number) => (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 24, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.12 + i * 0.1, duration: 0.55, ease: [0.22,1,0.36,1] }}
      className="relative rounded-3xl overflow-hidden transition-transform hover:-translate-y-1 h-full"
      style={{ border: `1px solid rgba(164,209,207,0.3)` }}
    >
      {/* Foto fondo completo */}
      {foto
        ? <img src={foto} alt={nombre} className="absolute inset-0 w-full h-full object-cover object-center" />
        : <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${accent}33` }}>
            <span style={{ fontSize: "4rem", fontWeight: 900, color: accent }}>{nombre.split(" ").slice(0,2).map((n: string)=>n[0]).join("")}</span>
          </div>
      }

      {/* Gradiente difuminado inferior */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(to top, rgba(5,25,22,0.95) 0%, rgba(5,25,22,0.4) 20%, transparent 36%)`,
      }} />

      {/* Texto sobre el gradiente */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 flex flex-col gap-2">
        <p style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>{nombre}</p>
        <span style={{
          fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.15)",
          padding: "5px 12px", borderRadius: "6px", display: "inline-block", alignSelf: "flex-start",
        }}>{rol}</span>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full px-24 py-10 gap-0 overflow-hidden items-center" style={{ paddingBottom: "8%", background: "#0D9E7A" }}>

      {/* Título */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
        className="flex items-center justify-between w-full shrink-0" style={{ marginTop: "4%" }}>
        <h2 style={{ fontSize: "clamp(4rem, 8vw, 7rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
          El equipo detrás
        </h2>
        {/* Separador vertical + subtítulo */}
        <div className="flex items-center gap-5">
          <div style={{ width: 2, height: 70, background: "rgba(255,255,255,0.25)", borderRadius: 2 }} />
          <div className="flex flex-col gap-1 text-right">
            <p style={{ fontSize: "1.7rem", fontWeight: 800, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Talento local formado en
            </p>
            <p style={{ fontSize: "1.7rem", fontWeight: 900, color: accent, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Alicante Futura
            </p>
          </div>
        </div>
      </motion.div>

      {/* Bloque de tarjetas */}
      <div className="flex flex-col gap-12 w-full shrink-0" style={{ marginTop: "4%", height: "78%" }}>

        {/* Fila 1 — 3 tarjetas */}
        <div className="grid grid-cols-3 gap-12 min-h-0" style={{ flex: 1 }}>
          {fila1.map((p, i) => Tarjeta(p, i))}
        </div>

        {/* Fila 2 — 2 tarjetas, mismo ancho total */}
        <div className="grid grid-cols-2 gap-12 min-h-0" style={{ flex: 1 }}>
          {fila2.map((p, i) => Tarjeta(p, i + 3))}
        </div>

      </div>

    </div>
  );
}

// ── Transición de cortina con curva morphing (GSAP) ─────────────────────────
function WaveTransition({ onMidpoint, onComplete, color = "#EEF2D0" }: {
  onMidpoint: () => void;
  onComplete: () => void;
  color?: string;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  // Refs estables para que el efecto se ejecute UNA SOLA VEZ al montar
  const onMidpointRef = useRef(onMidpoint);
  const onCompleteRef = useRef(onComplete);
  onMidpointRef.current = onMidpoint;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    // viewBox 100x100, preserveAspectRatio="none" (estira a fullscreen)
    // Cortina = rectángulo cuya BORDE DERECHO es una curva bezier cúbica.
    // Misma estructura de path en todos los estados para que el morph sea limpio.
    //
    // Estructura del path: M (x1 0) L (x2 0) C (cx1 33, cx2 66, x2 100) L (x1 100) Z
    // x1 = borde izquierdo, x2 = borde derecho (donde está la curva), cx = control points

    // Estado 1 — Oculta a la izquierda (colapsada como una línea fuera de la pantalla)
    const HIDDEN_LEFT  = "M -20 0 L -20 0 C -20 33, -20 66, -20 100 L -20 100 Z";
    // Estado 2 — Cubre toda la pantalla, curva bulging hacia la derecha (fuera de pantalla)
    const COVER        = "M -5  0 L 105 0 C 125 33, 125 66, 105 100 L -5  100 Z";
    // Estado 3 — Curva flip: ahora bulge hacia la izquierda (concava por la derecha)
    const COVER_FLIP   = "M -5  0 L 105 0 C 85  33, 85  66, 105 100 L -5  100 Z";
    // Estado 4 — Sale por la derecha (colapsada)
    const HIDDEN_RIGHT = "M 120 0 L 120 0 C 120 33, 120 66, 120 100 L 120 100 Z";

    gsap.set(path, { attr: { d: HIDDEN_LEFT } });

    const tl = gsap.timeline({ onComplete: () => onCompleteRef.current() });
    tl.to(path, { attr: { d: COVER },        duration: 0.55, ease: "power2.inOut" });
    tl.add(() => onMidpointRef.current());
    tl.to(path, { attr: { d: COVER_FLIP },   duration: 0.15, ease: "power1.inOut" });
    tl.to(path, { attr: { d: HIDDEN_RIGHT }, duration: 0.55, ease: "power2.inOut" });

    return () => { tl.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar — los callbacks se leen via ref

  return (
    <svg
      className="fixed inset-0 pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 60, width: "100vw", height: "100vh" }}
    >
      <path
        ref={pathRef}
        fill={color}
        d="M -20 0 L -20 0 C -20 33, -20 66, -20 100 L -20 100 Z"
      />
    </svg>
  );
}

// ── Slides array ──────────────────────────────────────────────────────────────
const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, SlideEquipo, Slide6, SlideMetodologia, Slide8, Slide9];
const SLIDE_LABELS = ["Portada", "Sobre Atalayas", "El problema", "La solución", "Demo", "El equipo", "Tecnologías", "El camino", "Cierre", "Contacto"];

// ── Página principal ──────────────────────────────────────────────────────────
export default function ShowcasePage() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1); // 1 = adelante, -1 = atrás
  const total = SLIDES.length;

  useEffect(() => { document.title = "Grupo 2002 · Alicante Futura Lab 2026"; }, []);

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= total) return;
    setDir(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current, total]);

  const [waveActive, setWaveActive] = useState(false);

  const next = useCallback(() => {
    // Si salimos desde la slide 3 (índice 2) hacia adelante → cortina con curva
    if (current === 2 && !waveActive) {
      setWaveActive(true);
      return;
    }
    goTo(current + 1);
  }, [current, goTo, waveActive]);

  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Cuando la cortina está cubriendo, cambiamos al siguiente slide por debajo
  const handleWaveMidpoint = useCallback(() => {
    goTo(current + 1);
  }, [current, goTo]);

  const handleWaveDone = useCallback(() => {
    setWaveActive(false);
  }, []);

  // Teclado + puntero presentador + reset + fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) { e.preventDefault(); next(); }
      if (["ArrowLeft",  "ArrowUp",  "Backspace", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
      if (e.key === "Escape") { e.preventDefault(); setDir(-1); setCurrent(0); }
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  // Scroll del ratón
  useEffect(() => {
    let locked = false;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (locked) return;
      locked = true;
      if (e.deltaY > 0) next(); else prev();
      setTimeout(() => { locked = false; }, 700);
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, [next, prev]);

  const SlideComponent = SLIDES[current];

  // Variants por slide — cada una tiene su propio estilo de entrada/salida
  const SLIDE_TRANSITIONS = [
    // 0 — Portada: slide vertical
    {
      enter:  (d: number) => ({ opacity: 0, y: d > 0 ? "100%" : "-100%" }),
      center: { opacity: 1, y: 0 },
      exit:   (d: number) => ({ opacity: 0, y: d > 0 ? "-100%" : "100%" }),
    },
    // 1 — Sobre Atalayas: zoom in
    {
      enter:  { opacity: 0, scale: 0.85 },
      center: { opacity: 1, scale: 1 },
      exit:   { opacity: 0, scale: 1.15 },
    },
    // 2 — El problema: slide horizontal
    {
      enter:  (d: number) => ({ opacity: 0, x: d > 0 ? "100%" : "-100%" }),
      center: { opacity: 1, x: 0 },
      exit:   (d: number) => ({ opacity: 0, x: d > 0 ? "-100%" : "100%" }),
    },
    // 3 — La solución: blur fade
    {
      enter:  { opacity: 0, filter: "blur(20px) brightness(0.6)" },
      center: { opacity: 1, filter: "blur(0px) brightness(1)" },
      exit:   { opacity: 0, filter: "blur(20px) brightness(0.6)" },
    },
    // 4 — Demo: rotate + scale
    {
      enter:  { opacity: 0, scale: 0.7, rotate: -8 },
      center: { opacity: 1, scale: 1, rotate: 0 },
      exit:   { opacity: 0, scale: 1.1, rotate: 8 },
    },
    // 5 — Tecnologías: slide vertical desde arriba
    {
      enter:  { opacity: 0, y: "-100%" },
      center: { opacity: 1, y: 0 },
      exit:   { opacity: 0, y: "100%" },
    },
    // 6 — Metodología: slide horizontal desde la izquierda
    {
      enter:  (d: number) => ({ opacity: 0, x: d > 0 ? "-100%" : "100%" }),
      center: { opacity: 1, x: 0 },
      exit:   (d: number) => ({ opacity: 0, x: d > 0 ? "100%" : "-100%" }),
    },
    // 7 — El camino: zoom out + fade
    {
      enter:  { opacity: 0, scale: 1.3 },
      center: { opacity: 1, scale: 1 },
      exit:   { opacity: 0, scale: 0.7 },
    },
    // 8 — El equipo: rotate sutil + scale
    {
      enter:  { opacity: 0, scale: 0.85, rotate: 4 },
      center: { opacity: 1, scale: 1, rotate: 0 },
      exit:   { opacity: 0, scale: 1.1, rotate: -4 },
    },
    // 9 — Cierre: slide diagonal
    {
      enter:  (d: number) => ({ opacity: 0, x: d > 0 ? "60%" : "-60%", y: d > 0 ? "60%" : "-60%" }),
      center: { opacity: 1, x: 0, y: 0 },
      exit:   (d: number) => ({ opacity: 0, x: d > 0 ? "-60%" : "60%", y: d > 0 ? "-60%" : "60%" }),
    },
    // 10 — Contacto: fade + scale lento
    {
      enter:  { opacity: 0, scale: 0.92 },
      center: { opacity: 1, scale: 1 },
      exit:   { opacity: 0, scale: 0.92 },
    },
  ];

  const variants = SLIDE_TRANSITIONS[current] ?? SLIDE_TRANSITIONS[0];

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const theme = SLIDE_THEMES[current] ?? { bg: BG, accent: LIMA };

  return (
    <SlideThemeCtx.Provider value={{ accent: theme.accent }}>
    <div className="fixed inset-0 overflow-hidden select-none"
      style={{
        background: theme.bg,
        fontFamily: "var(--font-poppins), sans-serif",
        cursor: "pointer",
        transition: "background-color 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onClick={(e) => {
        // No avanzar si el click es sobre los dots
        if ((e.target as HTMLElement).closest("[data-nav]")) return;
        next();
      }}
    >

      {/* Slide */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={current}
          custom={dir}
          variants={waveActive ? {} : variants}
          initial={waveActive ? false : "enter"}
          animate={waveActive ? false : "center"}
          exit={waveActive ? undefined : "exit"}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex flex-col"
          style={{ paddingBottom: 0 }}
        >
          <SlideComponent />
        </motion.div>
      </AnimatePresence>

      {/* Cortina con curva GSAP al salir de la Slide 3 */}
      {waveActive && (
        <WaveTransition
          onMidpoint={handleWaveMidpoint}
          onComplete={handleWaveDone}
          color={theme.accent}
        />
      )}

    </div>
    </SlideThemeCtx.Provider>
  );
}
