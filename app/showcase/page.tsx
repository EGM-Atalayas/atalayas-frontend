"use client";

import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { UserPlus, GraduationCap, Megaphone, BarChart3, FolderOpen, Sparkles, Bot, Users, ListTodo, Repeat, GitBranch, MessageSquare, KanbanSquare, Rocket } from "lucide-react";

// ── Datos — rellenar antes del evento ────────────────────────────────────────
const VIDEO_URL  = ""; // https://player.vimeo.com/video/XXXXXXX
const QR_URL     = "https://atalayas-egm.vercel.app";
const FOTO_GRUPO = ""; // "/foto-equipo.jpg"

const EQUIPO = [
  { nombre: "Erik Vidal",       rol: "Full-stack", email: "erikvidalzemba@gmail.com",     foto: "/showcase/equipo/erik.jpeg" },
  { nombre: "Francisco Baeza",  rol: "Frontend",   email: "franciscobaezasanchez@gmail.com", foto: "/showcase/equipo/fran.jpeg" },
  { nombre: "Eloy Pérez",       rol: "Frontend",   email: "eloyperezinglada@gmail.com",   foto: "/showcase/equipo/eloy.jpeg" },
  { nombre: "César Alonso",     rol: "Backend",    email: "cealonspont@gmail.com",        foto: "/showcase/equipo/cesar.jpeg" },
  { nombre: "Martina Vargas",   rol: "Full-stack", email: "martinavargastroche06@gmail.com", foto: "/showcase/equipo/martina.jpeg" },
];

const TECNOLOGIAS: { nombre: string; rol: string; color: string; capa: "Frontend" | "Backend" | "Infra" | "IA"; logo?: string; logoSize?: number }[] = [
  { nombre: "Next.js",      rol: "Framework UI",   color: "#FFFFFF", capa: "Frontend", logo: "/showcase/logos/nextjs.png" },
  { nombre: "React",        rol: "Componentes",    color: "#61DAFB", capa: "Frontend", logo: "/showcase/logos/react.png" },
  { nombre: "TypeScript",   rol: "Tipado seguro",  color: "#7DD3FC", capa: "Frontend", logo: "/showcase/logos/typescript.png", logoSize: 38 },
  { nombre: "Tailwind",     rol: "Estilado",       color: "#06B6D4", capa: "Frontend", logo: "/showcase/logos/tailwind.png" },
  { nombre: "Node.js",      rol: "Runtime backend",color: "#8CC84B", capa: "Backend", logo: "/showcase/logos/nodejs.png", logoSize: 38 },
  { nombre: "PostgreSQL",   rol: "Base de datos",  color: "#A5B4FC", capa: "Backend", logo: "/showcase/logos/postgresql.png" },
  { nombre: "Supabase",     rol: "Storage & Auth", color: "#3FCF8E", capa: "Infra",   logo: "/showcase/logos/supabase.png" },
  { nombre: "Vercel",       rol: "Despliegue",     color: "#FFFFFF", capa: "Infra",   logo: "/showcase/logos/vercel.png" },
  { nombre: "Claude IA",    rol: "Generación",     color: "#D97757", capa: "IA",      logo: "/showcase/logos/claude.png" },
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
  { bg: "#2563EB", accent: "#FEF3C7" }, // 1 — Sobre Atalayas · azul vivo + cream
  { bg: "#DB2777", accent: "#FEF3C7" }, // 2 — El problema · hot pink + cream
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
    <div className="flex flex-col items-center justify-center h-full px-8 gap-14">
      <Label>Sobre Atalayas</Label>

      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.035em", lineHeight: 1 }}
      >
        Una <span style={{ color: accent }}>ciudad empresarial</span><br />
        de referencia en Alicante
      </motion.h2>

      {/* Stats grandes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 w-full max-w-7xl">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.55, ease: [0.22,1,0.36,1] }}
            className="flex flex-col items-center justify-center py-12 px-5 rounded-3xl text-center"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-baseline gap-1.5">
              <span style={{ fontSize: "clamp(2.8rem, 5.5vw, 4.6rem)", fontWeight: 900, color: accent, lineHeight: 0.95, letterSpacing: "-0.035em" }}>
                {s.valor}
              </span>
              <span style={{ fontSize: "clamp(1.4rem, 2.2vw, 2rem)", fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                {s.unidad}
              </span>
            </div>
            <span style={{ fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)", fontWeight: 600, color: MUTED, marginTop: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Sectores como chips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-wrap gap-3 justify-center">
        {sectores.map((sec) => (
          <span key={sec}
            className="font-semibold px-5 py-2.5 rounded-full"
            style={{ background: `${accent}1f`, color: accent, border: `1.5px solid ${accent}55`, fontSize: "clamp(0.95rem, 1.3vw, 1.15rem)" }}>
            {sec}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Slide3() {
  const accent = useAccent();
  const quejas = [
    // Lado izquierdo — esparcidos
    { txt: "Cada vez que entra alguien, empezamos de cero.",                       rot: -3, pos: { top: "3%",   left: "8%"  } },
    { txt: "No sabemos si el empleado ha entendido los protocolos.",               rot: -2, pos: { top: "45%",  left: "0%"  } },
    { txt: "Si alguien se va, perdemos conocimiento.",                             rot: -5, pos: { bottom: "4%", left: "14%" } },
    // Lado derecho — esparcidos
    { txt: "La formación depende de que alguien tenga tiempo.",                    rot:  4, pos: { top: "6%",   right: "12%" } },
    { txt: "La documentación está en carpetas, emails o en la cabeza de alguien.", rot:  3, pos: { top: "42%",  right: "0%"  } },
    { txt: "Comunicamos cosas importantes y no sabemos si llegan.",                rot:  5, pos: { bottom: "2%", right: "6%"  } },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 gap-8 overflow-hidden">
      <Label>El problema</Label>

      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3.2rem, 7.2vw, 5.6rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.035em", lineHeight: 1, maxWidth: 1100, zIndex: 5 }}
      >
        Lo que escuchamos de las<br />
        <span style={{ color: accent }}>empresas del área</span>
      </motion.h2>

      {/* Bocadillos de queja flotando */}
      {quejas.map((q, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.12, duration: 0.55, ease: [0.22,1,0.36,1] }}
          className="absolute max-w-[260px] sm:max-w-[300px] px-6 py-4 rounded-2xl"
          style={{
            ...q.pos,
            transform: `rotate(${q.rot}deg)`,
            background: "#fff",
            color: "#0b2147",
            boxShadow: "0 14px 40px -10px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.15)",
            fontWeight: 600,
            fontSize: "clamp(1.25rem, 1.9vw, 1.6rem)",
            lineHeight: 1.35,
          }}
        >
          {q.txt}
          {/* Cola del bocadillo */}
          <span style={{
            position: "absolute",
            bottom: -8,
            left: q.rot > 0 ? "20%" : "auto",
            right: q.rot > 0 ? "auto" : "20%",
            width: 16, height: 16,
            background: "#fff",
            transform: "rotate(45deg)",
            boxShadow: "4px 4px 8px -4px rgba(0,0,0,0.15)",
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
    <div className="relative flex flex-col items-center justify-center h-full px-8 gap-10 overflow-hidden">
      <Label>El stack</Label>

      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3rem, 6.6vw, 5.2rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.035em", lineHeight: 1 }}
      >
        Construido con <span style={{ color: accent }}>lo último</span>
      </motion.h2>

      {/* Grid grande de tecnologías */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5 w-full max-w-6xl">
        {TECNOLOGIAS.map(({ nombre, rol, color, capa, logo, logoSize }, i) => (
          <motion.div
            key={nombre}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12 + i * 0.06, duration: 0.5, ease: [0.22,1,0.36,1] }}
            className="relative rounded-2xl overflow-hidden p-6 sm:p-7 flex flex-col gap-3 transition-transform hover:-translate-y-1"
            style={{
              background: `linear-gradient(135deg, ${color}1f 0%, ${color}08 100%), ${CARD}`,
              border: `1px solid ${color}40`,
              minHeight: 190,
            }}
          >
            {/* Halo de color en esquina */}
            <div style={{
              position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%",
              background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
            }} />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={nombre}
                    style={{
                      width: logoSize ?? 28,
                      height: logoSize ?? 28,
                      objectFit: "contain",
                      filter: `drop-shadow(0 0 6px rgba(255,255,255,0.6)) drop-shadow(0 2px 6px ${color}66)`,
                    }}
                  />
                )}
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: `${color}cc`, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  {capa}
                </span>
              </div>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 12px ${color}` }} />
            </div>
            <div className="relative z-10 mt-auto">
              <p style={{
                fontSize: "clamp(2rem, 3.2vw, 2.8rem)",
                fontWeight: 900,
                color,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}>
                {nombre}
              </p>
              <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 500 }}>
                {rol}
              </p>
            </div>
          </motion.div>
        ))}
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
    <div className="flex flex-col items-center justify-center h-full px-8 gap-10">
      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3rem, 6.6vw, 5.2rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.035em", lineHeight: 1 }}
      >
        <span style={{ color: accent }}>Contacto</span>
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full" style={{ maxWidth: "98vw" }}>
        {EQUIPO.map(({ nombre, email, foto }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i, duration: 0.5 }}
            className="flex flex-col items-center gap-4 p-5 rounded-3xl text-center overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}`, minHeight: 340 }}>
            <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center shrink-0"
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
              <p style={{ fontSize: "clamp(1.05rem, 1.3vw, 1.3rem)", fontWeight: 700, color: "#fff", lineHeight: 1.25, whiteSpace: "nowrap" }}>
                {nombre}
              </p>
              <p style={{
                fontSize: "clamp(0.72rem, 0.85vw, 0.92rem)",
                color: accent,
                marginTop: 8,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}>
                {email}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="p-4 rounded-2xl" style={{ background: "#fff" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/showcase/qrcode.svg" alt="QR plataforma" width={160} height={160} />
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
    { Icon: KanbanSquare,   titulo: "Sprints semanales",     desc: "Planificación, tareas claras y demos" },
    { Icon: GitBranch,      titulo: "Git + Pull Requests",   desc: "Code review en cada cambio importante" },
    { Icon: MessageSquare,  titulo: "Dailies + Discord",     desc: "Comunicación constante y sin fricción" },
    { Icon: Rocket,         titulo: "Despliegue continuo",   desc: "Cada merge se ve online al instante" },
  ];
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 gap-10 overflow-hidden">
      <Label>Cómo trabajamos</Label>
      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3.2rem, 7.2vw, 5.6rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.035em", lineHeight: 1 }}
      >
        Metodología <span style={{ color: accent }}>real</span>
      </motion.h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 w-full max-w-6xl">
        {pilares.map(({ Icon, titulo, desc }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.55, ease: [0.22,1,0.36,1] }}
            className="relative rounded-2xl overflow-hidden p-6 sm:p-7 flex flex-col gap-4 transition-transform hover:-translate-y-1"
            style={{
              background: `linear-gradient(135deg, ${accent}1f 0%, ${accent}08 100%), ${CARD}`,
              border: `1px solid ${accent}40`,
              minHeight: 230,
            }}
          >
            <div style={{
              position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
            }} />
            <div className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${accent}26`, color: accent, border: `1px solid ${accent}40` }}>
              <Icon className="w-7 h-7" />
            </div>
            <div className="relative z-10 mt-auto">
              <p style={{ fontSize: "clamp(1.2rem, 1.7vw, 1.45rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                {titulo}
              </p>
              <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.7)", marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>
                {desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
        style={{ fontSize: "clamp(1.05rem, 1.5vw, 1.3rem)", color: "rgba(255,255,255,0.6)", textAlign: "center", letterSpacing: "0.05em" }}
      >
        GitHub · Discord · Vercel · Render
      </motion.p>
    </div>
  );
}

// ── NUEVA: El equipo — 5 personas detrás del proyecto ─────────────────────────
function SlideEquipo() {
  const accent = useAccent();
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-10">
      <Label>El equipo</Label>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 w-full max-w-6xl">
        {EQUIPO.map(({ nombre, rol, foto }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.55, ease: [0.22,1,0.36,1] }}
            className="relative rounded-3xl overflow-hidden p-8 flex flex-col items-center text-center gap-5 transition-transform hover:-translate-y-1"
            style={{
              background: `linear-gradient(180deg, ${accent}1f 0%, ${accent}05 100%), ${CARD}`,
              border: `1px solid ${accent}40`,
              minHeight: 360,
            }}
          >
            <div style={{
              position: "absolute", top: -30, left: "50%", width: 180, height: 180, borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
              transform: "translateX(-50%)",
            }} />

            <div className="relative z-10 w-36 h-36 rounded-full overflow-hidden flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accent}aa 0%, ${accent}55 100%)`,
                border: `3px solid ${accent}88`,
                boxShadow: `0 10px 32px -4px ${accent}66`,
              }}>
              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={foto} alt={nombre} className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: "2.6rem", fontWeight: 900, color: "#fff", letterSpacing: "0.02em" }}>
                  {nombre.split(" ").slice(0, 2).map(n => n[0]).join("")}
                </span>
              )}
            </div>

            <div className="relative z-10">
              <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                {nombre}
              </p>
              <p style={{ fontSize: "1.15rem", fontWeight: 700, color: accent, marginTop: 8, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {rol}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.6 }}
        style={{ fontSize: "clamp(1.1rem, 1.6vw, 1.4rem)", color: "rgba(255,255,255,0.65)", textAlign: "center", fontWeight: 500 }}
      >
        Talento formado en el bootcamp
      </motion.p>
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
const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, SlideMetodologia, Slide7, SlideEquipo, Slide8, Slide9];
const SLIDE_LABELS = ["Portada", "Sobre Atalayas", "El problema", "La solución", "Demo", "Tecnologías", "Metodología", "El camino", "El equipo", "Cierre", "Contacto"];

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
