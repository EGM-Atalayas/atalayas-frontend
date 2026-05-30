"use client";

import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { UserPlus, GraduationCap, Megaphone, BarChart3, FolderOpen, Sparkles, Bot, Users, ListTodo, Repeat, GitBranch, MessageSquare, KanbanSquare, Rocket, Smartphone } from "lucide-react";

// ── Datos — rellenar antes del evento ────────────────────────────────────────
const VIDEO_URL  = ""; // https://player.vimeo.com/video/XXXXXXX
const QR_URL     = "https://atalayas-egm.es";
const FOTO_GRUPO = ""; // "/foto-equipo.jpg"

const EQUIPO = [
  { nombre: "Erik Vidal",       rol: "Full-stack", desc: "El que conectó el front con el back sin que nada explotara",     email: "erikvidalzemba@gmail.com",        foto: "/showcase/equipo/erik.png",    fotoEquipo: "/showcase/elequipo/erik-equipo.jpg" },
  { nombre: "Francisco Baeza",  rol: "Frontend",   desc: "Convirtió los diseños en pantallas que dan ganas de usar",       email: "franciscobaezasanchez@gmail.com", foto: "/showcase/equipo/fran.png",    fotoEquipo: "/showcase/elequipo/fran-equipo.jpg" },
  { nombre: "Eloy Pérez",       rol: "Frontend",   desc: "El ojo crítico que no dejaba pasar nada feo en pantalla",        email: "eloyperezinglada@gmail.com",      foto: "/showcase/equipo/eloy.png",    fotoEquipo: "/showcase/elequipo/eloy-equipo.jpg" },
  { nombre: "Martina Vargas",   rol: "Full-stack", desc: "De las primeras en tirar código y de las últimas en rendirse",   email: "martinavargastroche06@gmail.com", foto: "/showcase/equipo/martina.png", fotoEquipo: "/showcase/elequipo/martina-equipo.jpg" },
  { nombre: "César Alonso",     rol: "Backend",    desc: "Hizo que los datos llegaran donde tenían que llegar, siempre",   email: "cealonspont@gmail.com",           foto: "/showcase/equipo/cesar.png",   fotoEquipo: "/showcase/elequipo/cesar-equipo.jpg" },
];

const TECNOLOGIAS: { nombre: string; rol: string; color: string; capa: "Frontend" | "Backend" | "Infra" | "IA"; logo?: string; logoSize?: number; logoBottom?: number; logoRight?: number }[] = [
  { nombre: "Next.js",      rol: "La estructura de la web",     color: "#18181B", capa: "Frontend", logo: "/showcase/logos/nextjs.png" },
  { nombre: "React",        rol: "Lo que ves en pantalla",      color: "#61DAFB", capa: "Frontend", logo: "/showcase/logos/react.png" },
  { nombre: "TypeScript",   rol: "Código sin errores",          color: "#7DD3FC", capa: "Frontend", logo: "/showcase/logos/typescript.png", logoSize: 140, logoBottom: 0, logoRight: -5 },
  { nombre: "Tailwind",     rol: "El diseño y los estilos",     color: "#06B6D4", capa: "Frontend", logo: "/showcase/logos/tailwind.png" },
  { nombre: "Node.js",      rol: "El motor del servidor",       color: "#4ADE80", capa: "Backend", logo: "/showcase/logos/nodejs.png", logoSize: 110 },
  { nombre: "PostgreSQL",   rol: "Donde se guardan los datos",  color: "#A5B4FC", capa: "Backend", logo: "/showcase/logos/postgresql.png" },
  { nombre: "Spring Boot",  rol: "Framework del servidor",      color: "#6DB33F", capa: "Backend", logo: "/showcase/logos/spring.png",  logoSize: 95, logoBottom: 25 },
  { nombre: "Vercel",       rol: "Publica la app en la nube",   color: "#475569", capa: "Infra",   logo: "/showcase/logos/vercel.png", logoSize: 150, logoBottom: -10 },
  { nombre: "Claude IA",    rol: "Inteligencia artificial",     color: "#D97757", capa: "IA",      logo: "/showcase/logos/claude.png" },
];

const NUMEROS = [
  { valor: "2",  label: "meses de\ndesarrollo" },
  { valor: "5",  label: "personas en\nel equipo" },
  { valor: "1",  label: "cliente\nreal" },
  { valor: "8+", label: "módulos\nfuncionales" },
];

const FUNCIONALIDADES: { Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; titulo: string; desc: string; video?: string }[] = [
  { Icon: UserPlus,      titulo: "Onboarding estructurado",  desc: "Cada empleado tiene su proceso desde el día 1. Sin improvisación.",   video: "/showcase/videos/onboarding.mp4" },
  { Icon: GraduationCap, titulo: "Formación modular",         desc: "PRL, calidad, protocolos y formación específica por empresa.",        video: "/showcase/videos/formacion.mp4" },
  { Icon: Megaphone,     titulo: "Comunicación centralizada", desc: "Anuncios, comunicados y eventos en un solo lugar.",                   video: "/showcase/videos/comunicacion.mp4" },
  { Icon: BarChart3,     titulo: "Panel y estadísticas",      desc: "Movimientos de plantilla, formación completada, datos reales.",       video: "/showcase/videos/panel.mp4" },
  { Icon: FolderOpen,    titulo: "Gestión documental",        desc: "Documentos organizados y accesibles para toda la organización.",      video: "/showcase/videos/documental.mp4" },
  { Icon: Sparkles,      titulo: "IA integrada",              desc: "Chatbot de consulta para empleados. Sin saturar a RRHH.",             video: "/showcase/videos/ia.mp4" },
];

// ── Estilos base ─────────────────────────────────────────────────────────────
const BG     = "#1E1B4B";
const LIMA   = "#FFD166";
const MUTED  = "rgba(255,255,255,0.38)";
const CARD   = "rgba(255,255,255,0.06)";
const BORDER = "rgba(255,255,255,0.12)";

// Tema por slide — bg + accent vibrantes y variados (alineados con SLIDES array)
const SLIDE_THEMES: { bg: string; accent: string }[] = [
  { bg: "#1E1B4B", accent: "#FFD166" }, // 0 — Portada
  { bg: "#BE185D", accent: "#FCE7F3" }, // 1 — El equipo
  { bg: "#2563EB", accent: "#FEF08A" }, // 2 — Sobre Atalayas
  { bg: "#FB345F", accent: "#FEF3C7" }, // 3 — El problema
  { bg: "#065F46", accent: "#FEF9C3" }, // 4 — La solución
  { bg: "#6D28D9", accent: "#EDE9FE" }, // 5 — Tecnologías
  { bg: "#4F46E5", accent: "#C7D2FE" }, // 6 — El recorrido
  { bg: "#0F172A", accent: "#FCD34D" }, // 7 — Visitas
  { bg: "#1D195B", accent: "#C4B5FD" }, // 8 — Cierre
  { bg: "#2563EB", accent: "#FEF08A" }, // 9 — Preguntas
  { bg: "#2563EB", accent: "#FEF08A" }, // 10 — Contacto
];

// Contexto para que cada slide acceda al accent actual
const SlideThemeCtx = createContext<{ accent: string }>({ accent: LIMA });
const useAccent = () => useContext(SlideThemeCtx).accent;

// ── Slides ───────────────────────────────────────────────────────────────────
function Slide1() {
  const accent = useAccent();
  return (
    <div className="relative flex flex-col h-full overflow-hidden">

      {/* Imagen de fondo completa */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/showcase-cutout.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          mixBlendMode: "screen",
        }}
      />

      {/* Gradiente oscuro izquierda para que el texto se lea */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to right, rgba(16,40,140,0.95) 0%, rgba(16,40,140,0.75) 45%, rgba(16,40,140,0.2) 100%)",
      }} />
      {/* Gradiente inferior */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(to top, rgba(16,40,140,0.7) 0%, transparent 40%)",
      }} />

      {/* Logos — arriba izquierda */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative z-10 flex items-center gap-6"
        style={{ padding: "4% 6% 0" }}
      >
        <img src="/logo.webp" alt="Atalayas" style={{ height: 60, width: "auto", filter: "brightness(0) invert(1)", opacity: 0.9 }} />
        <div style={{ width: 1, height: 44, background: "rgba(255,255,255,0.3)" }} />
        <img src="/alicante-futura-logo.png" alt="Alicante Futura Lab" style={{ height: 60, width: "auto", opacity: 0.85 }} />
      </motion.div>

      {/* Contenido principal — izquierda, centrado verticalmente */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col flex-1 justify-center"
        style={{ padding: "0 6% 8%" }}
      >
        <p style={{ fontSize: "clamp(1.5rem, 2.4vw, 2.2rem)", color: "#B8C94A", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5em" }}>
          Ciudad Empresarial
        </p>
        <h1 style={{ fontSize: "clamp(5.5rem, 13vw, 12rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 0.9 }}>
          EGM<br />Atalayas
        </h1>
        <span style={{
          display: "inline-block", marginTop: "0.8em",
          fontSize: "clamp(1.4rem, 2vw, 1.8rem)", fontWeight: 900, color: "#fff",
          letterSpacing: "0.25em", textTransform: "uppercase",
        }}>GRUPO 2002</span>
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
  const [videoAbierto, setVideoAbierto] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoAbierto || !videoRef.current) return;
    const v = videoRef.current as HTMLVideoElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
      webkitEnterFullscreen?: () => void;
    };
    const enter = async () => {
      try {
        if (v.requestFullscreen) await v.requestFullscreen();
        else if (v.webkitRequestFullscreen) await v.webkitRequestFullscreen();
        else if (v.mozRequestFullScreen) await v.mozRequestFullScreen();
        else if (v.msRequestFullscreen) await v.msRequestFullscreen();
        else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      } catch { /* el usuario denegó o el navegador no soporta */ }
    };
    const id = window.setTimeout(enter, 80);
    const onFsChange = () => { if (!document.fullscreenElement) setVideoAbierto(false); };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => { clearTimeout(id); document.removeEventListener("fullscreenchange", onFsChange); };
  }, [videoAbierto]);

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
        <motion.button
          key={i}
          type="button"
          onClick={(e) => { e.stopPropagation(); setVideoAbierto(true); }}
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.12, duration: 0.55, ease: [0.22,1,0.36,1] }}
          whileHover={{ scale: 1.05, zIndex: 20 }}
          className="absolute px-6 py-5 text-left"
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
            cursor: "pointer",
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
        </motion.button>
      ))}

      {/* Modal de vídeo */}
      <AnimatePresence>
        {videoAbierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 100 }}
            onClick={() => setVideoAbierto(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
              className="relative w-full max-w-5xl mx-6 rounded-2xl overflow-hidden"
              style={{ background: "#000", boxShadow: `0 30px 80px -10px ${accent}55` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4" style={{ background: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>El problema</span>
                <button
                  type="button"
                  onClick={() => setVideoAbierto(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color: "#fff" }}
                  aria-label="Cerrar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <video
                ref={videoRef}
                src="/showcase/videos/problema.mp4"
                autoPlay
                loop
                playsInline
                style={{ width: "100%", height: "auto", maxHeight: "75vh", display: "block", background: "#000" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Slide4() {
  const accent = useAccent();
  const [videoActivo, setVideoActivo] = useState<{ titulo: string; src: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Al montar el modal, pedir fullscreen al elemento <video>
  useEffect(() => {
    if (!videoActivo || !videoRef.current) return;
    const v = videoRef.current as HTMLVideoElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
      webkitEnterFullscreen?: () => void; // iOS
    };
    const enter = async () => {
      try {
        if (v.requestFullscreen) await v.requestFullscreen();
        else if (v.webkitRequestFullscreen) await v.webkitRequestFullscreen();
        else if (v.mozRequestFullScreen) await v.mozRequestFullScreen();
        else if (v.msRequestFullscreen) await v.msRequestFullscreen();
        else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      } catch { /* el usuario denegó o el navegador no soporta */ }
    };
    // Pequeño delay para asegurar que el <video> está visible
    const id = window.setTimeout(enter, 80);
    // Al salir de fullscreen → cerrar el modal
    const onFsChange = () => {
      if (!document.fullscreenElement) setVideoActivo(null);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      clearTimeout(id);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, [videoActivo]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 gap-10 overflow-hidden">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.7em" }}>
        <span style={{ color: accent, fontSize: "clamp(0.85rem, 1.2vw, 1.1rem)", fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase" }}>Nuestra solución</span>
        <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3.8rem, 7vw, 6.5rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.04em", lineHeight: 0.88, maxWidth: 1100, zIndex: 5 }}
      >
        Una plataforma.<br />
        <span style={{ color: accent }}>Todo conectado.</span>
      </motion.h2>
      </div>

      {/* Mockup central — ventana de navegador con resumen visual de módulos */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22,1,0.36,1] }}
        className="relative w-full max-w-6xl rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 100%)",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
          aspectRatio: "16/9",
          maxHeight: "65vh",
        }}
      >
        {/* Barra de browser */}
        <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
          <div className="ml-5 px-4 py-1.5 rounded-lg flex items-center gap-2" style={{ background: "rgba(255,255,255,0.06)", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
            <span>🔒</span> atalayas-egm.es
          </div>
        </div>

        {/* Contenido del mock — grid de "módulos" con iconos */}
        <div className="p-8 sm:p-10 grid grid-cols-3 gap-6 h-[calc(100%-56px)]">
          {FUNCIONALIDADES.map((f, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (f.video) setVideoActivo({ titulo: f.titulo, src: f.video });
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08, duration: 0.45, ease: [0.22,1,0.36,1] }}
              whileHover={{ scale: 1.04 }}
              className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl cursor-pointer overflow-hidden transition-colors p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
            >
              <f.Icon className="w-12 h-12 sm:w-14 sm:h-14" style={{ color: accent }} />
              <span style={{ fontSize: "clamp(1.15rem, 1.6vw, 1.5rem)", fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.2 }}>{f.titulo}</span>
              {/* Play indicator que aparece al hover */}
              <span className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ width: 36, height: 36, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0b2147">
                  <polygon points="6,3 21,12 6,21" />
                </svg>
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>


      {/* Modal de vídeo */}
      <AnimatePresence>
        {videoActivo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 100 }}
            onClick={(e) => { e.stopPropagation(); setVideoActivo(null); }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
              className="relative w-full max-w-5xl mx-6 rounded-2xl overflow-hidden"
              style={{ background: "#000", boxShadow: `0 30px 80px -10px ${accent}55` }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ background: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{videoActivo.titulo}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setVideoActivo(null); }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color: "#fff" }}
                  aria-label="Cerrar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Video */}
              <video
                ref={videoRef}
                src={videoActivo.src}
                controls
                autoPlay
                loop
                playsInline
                style={{ width: "100%", height: "auto", maxHeight: "75vh", display: "block", background: "#000" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const reflexiones = [
    "Aprendimos a organizarnos cuando más falta hacía.",
    "Un cliente real nos enseñó más que cualquier ejercicio.",
    "Cada problema tuvo su solución. Aunque costara encontrarla.",
  ];
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-16 text-center overflow-hidden" style={{ gap: "7rem", paddingTop: "4%", paddingBottom: "8%" }}>
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <motion.p
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3.8rem, 7vw, 6.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.04em", maxWidth: 1200 }}
      >
        Con las <span style={{ color: "#fff", WebkitTextStroke: "2px rgba(255,255,255,0.5)", fontStyle: "italic" }}>ganas</span> de quien empieza y la <span style={{ color: "#fff", WebkitTextStroke: "2px rgba(255,255,255,0.5)", fontStyle: "italic" }}>dedicación</span> de quien lo da todo
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
        className="flex items-center w-full px-10"
        style={{ justifyContent: "space-between" }}
      >
        {reflexiones.map((r, i) => (
          <div key={i} className="flex items-center" style={{ flex: 1 }}>
            <p style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)", color: "#fff", fontWeight: 600, fontStyle: "italic", letterSpacing: "-0.01em", textAlign: "center", width: "100%", padding: "0 3.5rem" }}>
              "{r}"
            </p>
            {i < reflexiones.length - 1 && (
              <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function SlidePreguntas() {
  const accent = useAccent();
  return (
    <div className="relative flex flex-col items-center justify-center h-full overflow-hidden" style={{ background: "#2563EB" }}>
      {/* Decorative circles — animated bloom */}
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.1, ease: [0.22,1,0.36,1], delay: 0 }} style={{ position: "absolute", top: "-12%", left: "-8%", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none", transformOrigin: "center" }} />
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: [0.22,1,0.36,1], delay: 0.1 }} style={{ position: "absolute", bottom: "-15%", right: "-6%", width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none", transformOrigin: "center" }} />
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.22,1,0.36,1], delay: 0.2 }} style={{ position: "absolute", top: "15%", right: "8%", width: 180, height: 180, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", pointerEvents: "none" }} />
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.22,1,0.36,1], delay: 0.25 }} style={{ position: "absolute", bottom: "12%", left: "6%", width: 120, height: 120, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.12)", pointerEvents: "none" }} />
      <motion.h2
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(6rem, 12vw, 10rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        ¿Alguna pregunta?
      </motion.h2>
    </div>
  );
}

function Slide9() {
  const accent = useAccent();
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 gap-6 overflow-hidden" style={{ background: "#2563EB", paddingTop: "3%", paddingBottom: "3%" }}>
      {/* Decorative circles — animated bloom */}
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.1, ease: [0.22,1,0.36,1], delay: 0 }} style={{ position: "absolute", top: "-12%", left: "-8%", width: 420, height: 420, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: [0.22,1,0.36,1], delay: 0.1 }} style={{ position: "absolute", bottom: "-15%", right: "-6%", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.22,1,0.36,1], delay: 0.2 }} style={{ position: "absolute", bottom: "8%", left: "3%", width: 120, height: 120, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.12)", pointerEvents: "none" }} />
      <motion.h2
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(3rem, 6vw, 5rem)", fontWeight: 900, color: "#fff", textAlign: "center", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        <span style={{ color: "#fff" }}>Contacto</span>
      </motion.h2>
      <div className="grid grid-cols-5 gap-10 w-full px-10" style={{ marginTop: "2%" }}>
        {[1, 2, 0, 3, 4].map(idx => EQUIPO[idx]).map(({ nombre, email, foto }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i, duration: 0.5 }}
            className="flex flex-col items-center gap-4 p-5 rounded-3xl text-center overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}`, minHeight: 340 }}>
            <div className="w-44 h-44 rounded-full overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: "rgba(27,63,126,0.5)", border: "3px solid rgba(255,255,255,0.15)" }}>
              {foto ? (
                <img src={foto} alt={nombre} className="w-full h-full object-cover" style={{ objectPosition: nombre === "Francisco Baeza" ? "center 30%" : nombre === "Erik Vidal" ? "center 20%" : nombre === "Eloy Pérez" ? "center 15%" : nombre === "Martina Vargas" ? "-10% 0%" : "center center", transform: nombre === "Erik Vidal" ? "scale(1.15)" : nombre === "Martina Vargas" ? "scale(1.35)" : "scale(1)" }} />
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
          <Smartphone size={52} color="#fff" strokeWidth={2.5} />
          <p style={{ fontSize: "clamp(1.8rem, 2.8vw, 2.5rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>Escanea para visitar la plataforma</p>
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

// ── El recorrido — metodología + retos fusionados ────────────────────────────
function SlideMetodologia() {
  const accent = useAccent();
  const pilares = [
    { Icon: KanbanSquare,  titulo: "Sprints semanales",      desc: "Objetivos claros cada semana",                toolColor: "#EC4899" },
    { Icon: GitBranch,     titulo: "Revisión entre pares",   desc: "Nada se publicaba sin revisión del equipo",   toolColor: "#94A3B8" },
    { Icon: MessageSquare, titulo: "Comunicación constante", desc: "Decisiones en tiempo real, sin bloqueos",     toolColor: "#818CF8" },
    { Icon: Rocket,        titulo: "Entrega continua",       desc: "Cada mejora aprobada se publicaba sola",      toolColor: "#6EE7B7" },
  ];
  const retos = [
    { Icon: Repeat,   titulo: "Reasignación",             desc: "Llegamos a este proyecto a mitad de camino",  color: "#FBA5DA" },
    { Icon: Bot,      titulo: "Herramientas en evolución", desc: "Tecnología que cambiaba mientras la usábamos", color: "#FCA5A5" },
    { Icon: Users,    titulo: "Comunicación",             desc: "Coordinarse en remoto tiene su ciencia",       color: "#FDE68A" },
    { Icon: ListTodo, titulo: "Organización",             desc: "Aprendimos a priorizar sobre la marcha",       color: "#7DD3FC" },
  ];
  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ padding: "3.5% 5% 3.5% 5%" }}>

      {/* ── Dibujo — fondo completo, contain para ver la curva entera ────────── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}
        className="absolute pointer-events-none"
        style={{ inset: 0, zIndex: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/showcase/dibujo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </motion.div>

      {/* ── Título ─────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
        className="shrink-0" style={{ zIndex: 1, marginBottom: "6.5%" }}
      >
        <span style={{ color: accent, fontSize: "clamp(0.95rem, 1.4vw, 1.2rem)", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Nuestro recorrido
        </span>
        <h2 style={{ fontSize: "clamp(3.8rem, 7vw, 6.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 0.92, marginTop: "0.12em" }}>
          Planeamos.<br />Nos adaptamos.
        </h2>
      </motion.div>

      {/* ── Cuerpo: panel izq · espacio central · panel der ───────────────────── */}
      <div className="flex flex-1 min-h-0" style={{ gap: 0, position: "relative", zIndex: 1, alignItems: "flex-start", paddingBottom: "2%" }}>

        {/* Panel izquierdo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22,1,0.36,1] }}
          style={{
            width: "38%", borderRadius: 20,
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.25)",
            backdropFilter: "blur(14px)",
            padding: "28px 28px",
            display: "flex", flexDirection: "column",
            alignSelf: "stretch",
          }}
        >
          <p style={{ fontSize: "clamp(2.4rem, 3.2vw, 3.2rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 20, textAlign: "center", borderBottom: "2px solid rgba(255,255,255,0.5)", paddingBottom: 14 }}>
            CÓMO TRABAJAMOS
          </p>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-around" }}>
          {pilares.map(({ Icon, titulo, desc, toolColor }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              style={{
                display: "flex", gap: 16, alignItems: "center",
                flex: 1,
                borderBottom: i < pilares.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none",
              }}
            >
              <div style={{ width: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon style={{ width: 44, height: 44, color: "#fff", strokeWidth: 1.6, opacity: 0.85 }} />
              </div>
              <div>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em" }}>{titulo}</p>
                <p style={{ fontSize: "1.15rem", fontWeight: 600, color: "rgba(255,255,255,0.82)", marginTop: 8, lineHeight: 1.45 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
          </div>
        </motion.div>

        {/* Centro vacío — dibujo visible */}
        <div className="flex-1" />

        {/* Panel derecho */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22,1,0.36,1] }}
          style={{
            width: "38%", borderRadius: 20,
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.25)",
            backdropFilter: "blur(14px)",
            padding: "28px 28px",
            display: "flex", flexDirection: "column",
            alignSelf: "stretch",
          }}
        >
          <p style={{ fontSize: "clamp(2.4rem, 3.2vw, 3.2rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 20, textAlign: "center", borderBottom: "2px solid rgba(255,255,255,0.5)", paddingBottom: 14 }}>
            IMPREVISTOS
          </p>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-around" }}>
          {retos.map(({ Icon, titulo, desc, color }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              style={{
                display: "flex", gap: 16, alignItems: "center", flexDirection: "row",
                flex: 1,
                borderBottom: i < retos.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none",
              }}
            >
              <div style={{ width: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon style={{ width: 44, height: 44, color: "#fff", strokeWidth: 1.6, opacity: 0.85 }} />
              </div>
              <div style={{ textAlign: "left", flex: 1 }}>
                <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em" }}>{titulo}</p>
                <p style={{ fontSize: "1.15rem", fontWeight: 600, color: "rgba(255,255,255,0.82)", marginTop: 8, lineHeight: 1.45 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
          </div>
        </motion.div>

      </div>

    </div>
  );
}

// ── Visitas a empresas ────────────────────────────────────────────────────────
function SlideVisitas() {
  const accent = useAccent();
  const fotos = [
    "/showcase/visitas/foto1.png",
    "/showcase/visitas/foto2.png",
    "/showcase/visitas/foto3.png",
    "/showcase/visitas/foto4.png",
    "/showcase/visitas/foto5.png",
  ];
  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ padding: "3.5% 5% 3.5% 5%" }}>

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
        className="shrink-0" style={{ marginBottom: "3%" }}
      >
        <span style={{ color: accent, fontSize: "clamp(0.95rem, 1.4vw, 1.2rem)", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Área empresarial
        </span>
        <h2 style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 0.92, marginTop: "0.12em" }}>
          Salimos a<br />conocerlos.
        </h2>
      </motion.div>

      {/* Galería: foto grande a la izquierda + 4 en grid a la derecha */}
      <div className="flex flex-1 min-h-0" style={{ gap: "1.5%", alignItems: "stretch" }}>

        {/* Foto grande */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "48%", borderRadius: 20, overflow: "hidden", flexShrink: 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotos[0]} alt="Visita empresa" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "left center" }} />
        </motion.div>

        {/* Grid 2×2 */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "1.5%" }}>
          {fotos.slice(1).map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{ borderRadius: 16, overflow: "hidden" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Visita empresa ${i + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ── El equipo — 5 personas detrás del proyecto ───────────────────────────────
function SlideEquipo() {
  const accent = useAccent();
  // Martina, Eloy, Erik arriba — Fran, César abajo
  const orden = [3, 2, 0, 1, 4]; // Martina, Eloy, Erik, Fran, César
  // Para SlideEquipo usamos fotoEquipo (foto de equipo, más grande)
  const equipoOrdenado = orden.map(i => {
    const p = EQUIPO[i];
    return { ...p, foto: p.fotoEquipo ?? p.foto };
  });
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
        ? <img src={foto} alt={nombre} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: nombre === "Martina Vargas" ? "-200% 0%" : nombre === "Francisco Baeza" ? "center 75%" : nombre === "César Alonso" ? "center 50%" : "center center", transform: nombre === "Martina Vargas" ? "scale(1.4)" : nombre === "Eloy Pérez" ? "scale(1.2)" : "scale(1)" }} />
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
            <p style={{ fontSize: "1.7rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
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
const SLIDES = [Slide1, SlideEquipo, Slide2, Slide3, Slide4, Slide6, SlideMetodologia, SlideVisitas, Slide8, SlidePreguntas, Slide9];
const SLIDE_LABELS = ["Portada", "El equipo", "Sobre Atalayas", "El problema", "La solución", "Tecnologías", "El recorrido", "Visitas", "Cierre", "Preguntas", "Contacto"];

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
    // 7 — Cierre: fade + scale suave
    {
      enter:  { opacity: 0, scale: 0.95 },
      center: { opacity: 1, scale: 1 },
      exit:   { opacity: 0, scale: 0.95 },
    },
    // 8 — Preguntas: blur cinematográfico
    {
      enter:  { opacity: 0, filter: "blur(24px) brightness(0.7)" },
      center: { opacity: 1, filter: "blur(0px) brightness(1)" },
      exit:   { opacity: 0, filter: "blur(24px) brightness(0.7)" },
    },
    // 9 — Contacto: zoom de cámara continuo
    {
      enter:  { opacity: 0, scale: 1.18 },
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
