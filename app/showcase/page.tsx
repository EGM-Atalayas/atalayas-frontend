"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ── Datos — rellenar antes del evento ────────────────────────────────────────
const VIDEO_URL  = ""; // https://player.vimeo.com/video/XXXXXXX
const QR_URL     = "https://atalayas-egm.vercel.app";
const FOTO_GRUPO = ""; // "/foto-equipo.jpg"

const EQUIPO = [
  { nombre: "NOMBRE 1", email: "correo1@ejemplo.com", foto: "" },
  { nombre: "NOMBRE 2", email: "correo2@ejemplo.com", foto: "" },
  { nombre: "NOMBRE 3", email: "correo3@ejemplo.com", foto: "" },
  { nombre: "NOMBRE 4", email: "correo4@ejemplo.com", foto: "" },
  { nombre: "NOMBRE 5", email: "correo5@ejemplo.com", foto: "" },
];

const TECNOLOGIAS = [
  { nombre: "Next.js",      color: "#a8b4c8" },
  { nombre: "React",        color: "#61DAFB" },
  { nombre: "TypeScript",   color: "#3178C6" },
  { nombre: "Spring Boot",  color: "#6DB33F" },
  { nombre: "PostgreSQL",   color: "#4169E1" },
  { nombre: "Tailwind CSS", color: "#06B6D4" },
];

const NUMEROS = [
  { valor: "2",  label: "meses de\ndesarrollo" },
  { valor: "5",  label: "personas en\nel equipo" },
  { valor: "1",  label: "cliente\nreal" },
  { valor: "8+", label: "módulos\nfuncionales" },
];

const FUNCIONALIDADES = [
  { icon: "👥", titulo: "Onboarding estructurado",  desc: "Cada empleado tiene su proceso desde el día 1. Sin improvisación." },
  { icon: "📚", titulo: "Formación modular",         desc: "PRL, calidad, protocolos y formación específica por empresa." },
  { icon: "📣", titulo: "Comunicación centralizada", desc: "Anuncios, comunicados y eventos en un solo lugar." },
  { icon: "📊", titulo: "Panel y estadísticas",      desc: "Movimientos de plantilla, formación completada, datos reales." },
  { icon: "📁", titulo: "Gestión documental",        desc: "Documentos organizados y accesibles para toda la organización." },
  { icon: "🤖", titulo: "IA integrada",              desc: "Chatbot de consulta para empleados. Sin saturar a RRHH." },
];

// ── Estilos base ─────────────────────────────────────────────────────────────
const BG     = "#1040a0";
const LIMA   = "#B4DC64";
const MUTED  = "rgba(255,255,255,0.38)";
const CARD   = "rgba(255,255,255,0.045)";
const BORDER = "rgba(255,255,255,0.08)";

// ── Slides ───────────────────────────────────────────────────────────────────
function Slide1() {
  return (
    <div className="relative flex flex-col items-center justify-start h-full text-center px-8 pt-16 overflow-hidden">
      {/* Imagen recortada — cubre la mitad inferior */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
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
        <p style={{ fontSize: "clamp(1.1rem, 2.4vw, 1.6rem)", color: LIMA, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Ciudad Empresarial
        </p>
        <p style={{ fontSize: "clamp(0.85rem, 1.6vw, 1.1rem)", color: "rgba(255,255,255,0.6)", maxWidth: 460, lineHeight: 1.6, fontWeight: 400, marginTop: "0.2em" }}>
          Plataforma digital de onboarding, formación y gestión interna para empresas
        </p>
      </motion.div>
    </div>
  );
}

function Slide2() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-8">
      <Label>El reto</Label>
      <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, color: "#fff", textAlign: "center", letterSpacing: "-0.02em" }}>
        ¿Cómo gestionan el onboarding hoy las empresas?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
        {[
          { q: "¿Dónde está el manual de incorporación?",       a: "En un PDF de hace 3 años" },
          { q: "¿Cómo sabe el empleado qué formación necesita?", a: "Alguien se lo explica de memoria" },
          { q: "¿Cómo mide RRHH el progreso de onboarding?",    a: "No lo mide" },
        ].map(({ q, a }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.55, ease: [0.22,1,0.36,1] }}
            className="flex flex-col gap-3 p-5 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>{q}</p>
            <p style={{ fontSize: "0.85rem", color: MUTED, fontStyle: "italic" }}>"{a}"</p>
          </motion.div>
        ))}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ fontSize: "clamp(1rem, 2.5vw, 1.3rem)", fontWeight: 700, color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
        EGM Atalayas nos pidió que lo cambiáramos. <span style={{ color: "#fff" }}>Lo hemos hecho.</span>
      </motion.p>
    </div>
  );
}

function Slide3() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-8">
      <Label>Cliente real</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl items-center">
        <div className="flex flex-col gap-4">
          <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            EGM Atalayas<br />Ciudad Empresarial
          </h2>
          <p style={{ fontSize: "0.95rem", color: MUTED, lineHeight: 1.7 }}>
            Área empresarial de Alicante que agrupa a decenas de empresas. Nos encargaron digitalizar
            sus procesos de incorporación y formación interna.
          </p>
          <div className="flex flex-col gap-2">
            {["Reuniones reales con el cliente", "Pliego técnico oficial", "Iteraciones basadas en feedback"].map(item => (
              <span key={item} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: LIMA }}>
                <span>✓</span> {item}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {NUMEROS.map(({ valor, label }, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center justify-center py-6 px-3 rounded-2xl text-center"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, color: LIMA, lineHeight: 1 }}>{valor}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: MUTED, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.4, whiteSpace: "pre-line", textAlign: "center" }}>{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slide4() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-6">
      <Label>La plataforma</Label>
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}`, aspectRatio: "16/9", maxHeight: "65vh" }}>
        {VIDEO_URL ? (
          <iframe src={VIDEO_URL} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" style={{ border: "none" }} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="rgba(255,255,255,0.35)" /></svg>
            </div>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.85rem" }}>Vídeo pendiente de subir</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Slide5() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-7">
      <Label>Qué resuelve</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-4xl">
        {FUNCIONALIDADES.map(({ icon, titulo, desc }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22,1,0.36,1] }}
            className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: "1.4rem", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginBottom: 3 }}>{titulo}</p>
              <p style={{ fontSize: "0.75rem", color: MUTED, lineHeight: 1.55 }}>{desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Slide6() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-8">
      <Label>Construido con</Label>
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
        {TECNOLOGIAS.map(({ nombre, color }, i) => (
          <motion.div key={nombre} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.07 * i, duration: 0.4 }}
            className="px-6 py-3 rounded-full text-sm font-bold"
            style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
            {nombre}
          </motion.div>
        ))}
      </div>
      <p style={{ fontSize: "0.85rem", color: MUTED, textAlign: "center", maxWidth: 480, lineHeight: 1.6 }}>
        Stack moderno, tipado y escalable. Arquitectura pensada para crecer con las necesidades del cliente.
      </p>
    </div>
  );
}

function Slide7() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-6">
      <Label>El equipo</Label>
      <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", textAlign: "center" }}>
        Grupo 2002 · 5 personas · 2 meses
      </h2>
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {FOTO_GRUPO ? (
          <img src={FOTO_GRUPO} alt="Equipo Grupo 2002" className="w-full object-cover" style={{ maxHeight: "38vh" }} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span style={{ fontSize: "2.2rem" }}>📸</span>
            <span style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.8rem" }}>Foto de equipo</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-3xl">
        {[
          { n: "01", t: "Reuniones con cliente",  d: "Análisis de necesidades y pliego técnico real" },
          { n: "02", t: "Desarrollo iterativo",   d: "Sprints semanales adaptados al feedback" },
          { n: "03", t: "Producto desplegado",     d: "Funciona. Cualquier empresa puede usarlo hoy" },
        ].map(({ n, t, d }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="p-4 rounded-xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, color: LIMA, letterSpacing: "0.1em" }}>— {n}</span>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", margin: "5px 0 4px" }}>{t}</p>
            <p style={{ fontSize: "0.75rem", color: MUTED, lineHeight: 1.5 }}>{d}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Slide8() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-6">
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
        style={{ fontSize: "clamp(1.6rem, 4.5vw, 3rem)", fontWeight: 900, color: "rgba(255,255,255,0.65)", lineHeight: 1.4, maxWidth: 680 }}>
        Cualquier empresa de Atalayas<br />podría empezar a usarlo{" "}
        <span style={{ color: "#fff" }}>mañana.</span>
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ fontSize: "clamp(0.9rem, 2vw, 1.15rem)", color: MUTED }}>
        Eso es lo que hemos construido en dos meses.
      </motion.p>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
        className="mt-4 px-6 py-3 rounded-2xl" style={{ background: `${LIMA}12`, border: `1px solid ${LIMA}25` }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: LIMA }}>
          Piloto demostrativo · Escalable · Replicable en otros entornos empresariales
        </span>
      </motion.div>
    </div>
  );
}

function Slide9() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-7">
      <Label>Contacto</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full max-w-4xl">
        {EQUIPO.map(({ nombre, email, foto }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i, duration: 0.5 }}
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl text-center"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: "rgba(27,63,126,0.5)", border: "2px solid rgba(255,255,255,0.1)" }}>
              {foto ? (
                <img src={foto} alt={nombre} className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>
                  {nombre.split(" ").slice(0, 2).map(n => n[0]).join("")}
                </span>
              )}
            </div>
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{nombre}</p>
              <p style={{ fontSize: "0.65rem", color: LIMA, marginTop: 3, wordBreak: "break-all", lineHeight: 1.4 }}>{email}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 rounded-xl" style={{ background: "#fff" }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(QR_URL)}&bgcolor=ffffff&color=080d1a`}
            alt="QR plataforma" width={110} height={110} />
        </div>
        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>{QR_URL}</p>
      </div>
    </div>
  );
}

// ── Label de sección ──────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: LIMA }}>
      {children}
    </span>
  );
}

// ── Slides array ──────────────────────────────────────────────────────────────
const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8, Slide9];
const SLIDE_LABELS = ["Portada", "El reto", "Cliente", "Vídeo", "Solución", "Tecnologías", "Equipo", "Cierre", "Contacto"];

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

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

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

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden select-none"
      style={{ background: BG, fontFamily: "var(--font-poppins), sans-serif", cursor: "pointer" }}
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
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex flex-col"
          style={{ paddingBottom: 0 }}
        >
          <SlideComponent />
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
