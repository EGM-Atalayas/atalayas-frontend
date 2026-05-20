"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  ArrowUp,
  ArrowRight,
  CheckCircle,
  LayoutDashboard,
  GraduationCap,
  MessageSquare,
  Users,
  UserPlus,
  UserCircle,
  Building2,
  Megaphone,
  Sparkles,
} from "lucide-react";

// ── Configuración de pasos ──────────────────────────────────────────────────
interface GuiaStep {
  route: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  /** Label del nav al que apunta la flecha (sección actual) */
  navLabel?: string;
  /** Label del nav al que ir después */
  nextNavLabel?: string;
  nextRoute?: string;
  isLast?: boolean;
}

const ICON_CLS = "shrink-0";
const ICON_STYLE = { color: "var(--azul-egm, #1b3f7e)" };

const STEPS_EMPLEADO: GuiaStep[] = [
  {
    route: "INIT",
    icon: <LayoutDashboard size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Panel principal",
    desc: "Aquí empieza tu día en Atalayas. Verás un saludo personalizado con tu nombre, los servicios del parque empresarial (coche compartido, autobús lanzadera, aparcamiento, guardería, descuentos), un carrusel con las últimas comunicaciones y noticias, tus cursos de formación en curso con su progreso, y los próximos eventos de la comunidad. Todo tu entorno laboral en una sola pantalla.",
    navLabel: "Inicio",
    nextNavLabel: "Formación",
    nextRoute: "/dashboard/formacion",
  },
  {
    route: "/dashboard/formacion",
    icon: <GraduationCap size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Formación",
    desc: "El centro de aprendizaje. Aquí tienes tu programa de onboarding con los módulos de incorporación a la empresa, cada uno con su barra de progreso. Más abajo está la formación continua con todos los cursos disponibles. Puedes buscar por nombre, filtrar por tipo de módulo o por estado (pendiente, en progreso, completado). Cada curso incluye imagen, duración, descripción y un botón para empezar, continuar o descargar el certificado.",
    navLabel: "Formación",
    nextNavLabel: "Comunicación",
    nextRoute: "/dashboard/comunicacion",
  },
  {
    route: "/dashboard/comunicacion",
    icon: <MessageSquare size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunicación",
    desc: "Tu centro de comunicaciones. Aquí puedes filtrar entre comunicados de EGM Atalayas, anuncios de tu empresa o ver todos juntos. Las publicaciones más recientes aparecen como tarjetas destacadas con imagen de fondo, y el resto en una lista ordenada por fecha. Puedes buscar por texto, ordenar por más reciente o más antiguo, y al hacer clic en cualquier comunicación se abre un modal con el contenido completo, imágenes y enlaces.",
    navLabel: "Comunicación",
    nextNavLabel: "Comunidad",
    nextRoute: "/dashboard/comunidad",
  },
  {
    route: "/dashboard/comunidad",
    icon: <Users size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunidad",
    desc: "El punto de encuentro de la comunidad Atalayas. Desde aquí puedes acceder a tres secciones principales: Eventos (jornadas, networking y actividades del área empresarial), Servicios (bus lanzadera, coche compartido, aparcamiento y más), y Ventajas (descuentos en comercios, servicios y ocio). Cada tarjeta tiene una imagen de fondo representativa y al pasar el ratón se muestra más información.",
    navLabel: "Comunidad",
    nextNavLabel: "Colaboradores",
    nextRoute: "/dashboard/colaboradores",
  },
  {
    route: "/dashboard/colaboradores",
    icon: <UserPlus size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Colaboradores",
    desc: "El ecosistema de entidades colaboradoras de Atalayas. Aquí encontrarás tres categorías desplegables: Universidades (como la Universidad de Alicante y la UMH), Parques Científicos e Institutos Tecnológicos (AIJU, INESCOP, AITEX). Cada entidad muestra su logo, descripción y un enlace a su página web. Es tu red de conocimiento e innovación.",
    navLabel: "Colaboradores",
    nextNavLabel: "Tu perfil",
    nextRoute: "/dashboard/perfil",
  },
  {
    route: "/dashboard/perfil",
    icon: <UserCircle size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Tu perfil",
    desc: "Tu espacio personal. Aquí puedes cambiar tu foto de avatar y la imagen de portada con tu propia imagen o eligiendo entre varias galerías temáticas. Gestiona tus datos personales: nombre, apellidos, puesto de trabajo, teléfono y email. Los administradores también pueden cambiar la disponibilidad (Disponible, Teletrabajo, Ocupado, Vacaciones, Ausente). Además tienes un buzón de sugerencias para enviar tus ideas a EGM Atalayas y acceso a tus documentos.",
    navLabel: "Tu perfil",
    isLast: true,
  },
];

const STEPS_ADMIN: GuiaStep[] = [
  {
    route: "INIT",
    icon: <LayoutDashboard size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Panel de administración",
    desc: "Tu centro de control. Aquí ves un resumen completo de tu empresa: número de empleados activos, progreso medio de formación, módulos publicados y la actividad reciente de tu equipo. También tienes acceso rápido a las acciones más comunes: añadir empleado, gestionar módulos, crear un nuevo módulo o publicar un anuncio. Y en la parte inferior, los últimos comunicados publicados.",
    navLabel: "Inicio",
    nextNavLabel: "Administración",
    nextRoute: "/dashboard/admin",
  },
  {
    route: "/dashboard/admin",
    icon: <Building2 size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Administración",
    desc: "El panel de gestión completa de tu empresa. Tiene 7 pestañas con herramientas especializadas: Empleados (gestiona tu plantilla), Incidencias (reporta y hace seguimiento), Anuncios (crea y publica comunicados), Eventos (organiza actividades), Módulos formativos (crea cursos), Documentos (sube y asigna archivos) y Estadísticas (exporta informes con filtros por departamento y periodo).",
    navLabel: "Administración",
    nextNavLabel: "Formación",
    nextRoute: "/dashboard/formacion",
  },
  {
    route: "/dashboard/formacion",
    icon: <GraduationCap size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Formación",
    desc: "Gestiona la formación de tu empresa. Desde aquí puedes crear nuevos módulos formativos, editarlos y supervisar el progreso de tus empleados. La sección de onboarding muestra el programa de incorporación, y la formación continua incluye todos los cursos disponibles con filtros por tipo, estado y búsqueda por nombre.",
    navLabel: "Formación",
    nextNavLabel: "Comunicación",
    nextRoute: "/dashboard/comunicacion",
  },
  {
    route: "/dashboard/comunicacion",
    icon: <MessageSquare size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunicación",
    desc: "El centro de comunicaciones de tu empresa. Aquí puedes crear y publicar anuncios para toda tu plantilla. También ves los comunicados de EGM Atalayas. Puedes filtrar por fuente (EGM o tu empresa), buscar por texto y ordenar por fecha. Los borradores pendientes de publicar aparecen en un panel amarillo destacado.",
    navLabel: "Comunicación",
    nextNavLabel: "Comunidad",
    nextRoute: "/dashboard/comunidad",
  },
  {
    route: "/dashboard/comunidad",
    icon: <Users size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunidad",
    desc: "El punto de encuentro de la comunidad Atalayas. Desde aquí tú y tus empleados podéis acceder a Eventos (jornadas y networking), Servicios del parque empresarial (bus lanzadera, coche compartido, aparcamiento) y Ventajas (descuentos en comercios y ocio).",
    navLabel: "Comunidad",
    nextNavLabel: "Colaboradores",
    nextRoute: "/dashboard/colaboradores",
  },
  {
    route: "/dashboard/colaboradores",
    icon: <UserPlus size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Colaboradores",
    desc: "Gestiona el ecosistema de entidades colaboradoras. Aquí puedes ver y administrar las relaciones con Universidades (UA, UMH), Parques Científicos e Institutos Tecnológicos como AIJU, INESCOP y AITEX.",
    navLabel: "Colaboradores",
    nextNavLabel: "Tu perfil",
    nextRoute: "/dashboard/perfil",
  },
  {
    route: "/dashboard/perfil",
    icon: <UserCircle size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Tu perfil",
    desc: "Tu espacio personal con funciones añadidas de administrador. Además de gestionar tu avatar, portada y datos personales, puedes editar los datos de tu empresa: nombre, CIF, email de contacto y subir el logo corporativo con eliminación automática de fondo. También tienes acceso al buzón de sugerencias.",
    navLabel: "Tu perfil",
    isLast: true,
  },
];

const STEPS_SUPERADMIN: GuiaStep[] = [
  {
    route: "INIT",
    icon: <LayoutDashboard size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Panel de control global",
    desc: "Tu centro de control de toda la plataforma. Aquí ves 6 tarjetas con las métricas clave: empresas adheridas, nuevas empresas del mes, empleados registrados, nuevos empleados, módulos publicados e incidencias críticas. También tienes una guía de configuración con 5 pasos para poner en marcha la plataforma, acceso rápido a la gestión de empresas y solicitudes pendientes, y un feed con la actividad reciente de toda la plataforma.",
    navLabel: "Inicio",
    nextNavLabel: "Administración",
    nextRoute: "/superadmin/administracion",
  },
  {
    route: "/superadmin/administracion",
    icon: <Building2 size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Administración global",
    desc: "La gestión central de la plataforma. Tiene 4 pestañas: Empresas (visualiza y gestiona todas las empresas, actívalas o desactívalas), Solicitudes (aprueba o rechaza las solicitudes de registro de nuevas empresas), Estadísticas (informes detallados) e Incidencias (haz seguimiento de todas las incidencias reportadas).",
    navLabel: "Administración",
    nextNavLabel: "Comunicados",
    nextRoute: "/superadmin/comunicados",
  },
  {
    route: "/superadmin/comunicados",
    icon: <Megaphone size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunicados globales",
    desc: "Crea y publica comunicados que llegarán a todas las empresas y empleados de la plataforma. Es la herramienta para comunicar decisiones importantes, novedades o información de interés general a toda la comunidad Atalayas.",
    navLabel: "Comunicados",
    nextNavLabel: "Comunidad",
    nextRoute: "/dashboard/comunidad",
  },
  {
    route: "/dashboard/comunidad",
    icon: <Users size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunidad global",
    desc: "Supervisa la comunidad global de la plataforma. Aquí tú y todas las empresas podéis acceder a Eventos, Servicios del parque empresarial y Ventajas y descuentos. Es el escaparate de la actividad comunitaria de Atalayas.",
    navLabel: "Comunidad",
    isLast: true,
  },
];

const LS_KEY_PREFIX = "tutorial_step_";

function getSteps(role?: string): GuiaStep[] {
  switch (role) {
    case "ROLE_ADMIN": return STEPS_SUPERADMIN;
    case "ROLE_ADMIN_EMPRESA": return STEPS_ADMIN;
    default: return STEPS_EMPLEADO;
  }
}

const CARD_WIDTH = 520;
const ARROW_SIZE = 14;

// ── Componente ──────────────────────────────────────────────────────────────
export default function AppTutorial() {
  const { usuario } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const role = usuario?.codigoRol;
  const userId = usuario?.usuarioId;
  const steps = getSteps(role);

  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipSide, setTooltipSide] = useState<"bottom" | "top">("bottom");
  const [visible, setVisible] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const lsKey = userId ? `${LS_KEY_PREFIX}${userId}` : null;

  // ── Inicializar ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lsKey || !userId) return;
    const saved = localStorage.getItem(lsKey);
    if (saved === "COMPLETED") return;
    const idx = saved ? parseInt(saved, 10) : 0;
    if (isNaN(idx)) return;
    setStepIdx(idx);
    const t = setTimeout(() => setActive(true), 600);
    return () => clearTimeout(t);
  }, [lsKey, userId]);

  // ── Sincronizar paso con la ruta ──────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const cur = steps[stepIdx];
    if (!cur) return;

    if (cur.route === "INIT") {
      const onInit = pathname === "/dashboard" || pathname === "/superadmin";
      setVisible(onInit);
      return;
    }
    setVisible(pathname === cur.route);
  }, [pathname, stepIdx, steps, active]);

  // ── Avance automático ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || !lsKey) return;
    const next = steps.findIndex((s, i) => i > stepIdx && s.route === pathname);
    if (next !== -1) {
      setStepIdx(next);
      localStorage.setItem(lsKey, String(next));
    }
  }, [pathname, active, stepIdx, steps, lsKey]);

  // ── Buscar botón en el nav del header ─────────────────────────────────────
  const findNavButton = useCallback((label: string): Element | null => {
    const nav = document.querySelector("header nav");
    if (!nav) return null;
    const all = nav.querySelectorAll("button");
    for (const btn of all) {
      if ((btn.textContent?.trim().replace(/\s+/g, " ") ?? "") === label) return btn;
    }
    return null;
  }, []);

  // ── Calcular posición ─────────────────────────────────────────────────────
  const measure = useCallback(() => {
    if (!visible || !active) { setTargetRect(null); return; }
    const cur = steps[stepIdx];
    if (!cur?.navLabel) { setTargetRect(null); return; }

    const el = findNavButton(cur.navLabel);
    if (!el) { setTargetRect(null); return; }

    const r = el.getBoundingClientRect();
    setTargetRect(r);
    setTooltipSide(window.innerHeight - r.bottom < 240 ? "top" : "bottom");
  }, [visible, active, stepIdx, steps, findNavButton]);

  useEffect(() => {
    measure();
    const t1 = setTimeout(measure, 200);
    const t2 = setTimeout(measure, 600);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    pollRef.current = setInterval(measure, 1500);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [measure]);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    const cur = steps[stepIdx];
    if (cur?.nextRoute) router.push(cur.nextRoute);
  }, [stepIdx, steps, router]);

  const finish = useCallback(() => {
    if (lsKey) localStorage.setItem(lsKey, "COMPLETED");
    setActive(false);
    setVisible(false);
  }, [lsKey]);

  const handleNext = useCallback(() => {
    if (steps[stepIdx]?.isLast) finish();
    else goNext();
  }, [stepIdx, steps, finish, goNext]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!active || !visible || !steps[stepIdx]) return null;

  const cur = steps[stepIdx];
  const half = CARD_WIDTH / 2;

  // Posición horizontal: centrar la card sobre el target
  let cardLeft: number | string = 16;
  let cardTop: number | string = 80;

  if (targetRect) {
    cardLeft = Math.max(12, Math.min(
      targetRect.left + targetRect.width / 2 - half,
      window.innerWidth - CARD_WIDTH - 12
    ));
    const gap = 14;
    cardTop = tooltipSide === "bottom"
      ? targetRect.top + targetRect.height + gap
      : targetRect.top - gap;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-[9999]"
        style={{ left: cardLeft, top: cardTop, width: CARD_WIDTH }}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        transition={{ type: "spring", damping: 22, stiffness: 280, mass: 0.8 }}
      >
        {/* Flecha */}
        {targetRect && (
          <div
            style={{
              position: "absolute",
              left: `calc(50% - ${ARROW_SIZE / 2}px)`,
              top: tooltipSide === "bottom" ? -ARROW_SIZE / 2 + 1 : "auto",
              bottom: tooltipSide === "top" ? -ARROW_SIZE / 2 + 1 : "auto",
              width: ARROW_SIZE,
              height: ARROW_SIZE,
              background: "#fff",
              transform: tooltipSide === "bottom" ? "rotate(45deg)" : "rotate(225deg)",
              boxShadow: tooltipSide === "bottom"
                ? "-2px -2px 4px rgba(0,0,0,0.05)"
                : "2px 2px 4px rgba(0,0,0,0.05)",
              zIndex: 0,
              borderRadius: 2,
            }}
          />
        )}

        {/* Card principal */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 16px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 1,
          }}
        >
          {/* Cabecera compacta */}
          <div
            className="relative px-5 py-3"
            style={{
              background: "linear-gradient(135deg, #1b3f7e 0%, #2563eb 50%, #1e4a8a 100%)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at 90% 20%, rgba(163,181,53,0.25) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />
            <div className="relative flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                {cur.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)" }}
                  >
                    {stepIdx + 1} / {steps.length}
                  </span>
                  <h3
                    className="text-sm font-extrabold truncate"
                    style={{
                      fontFamily: "var(--font-raleway), sans-serif",
                      color: "#fff",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {cur.title}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Cuerpo compacto */}
          <div className="px-5 py-3">
            <p
              className="text-sm leading-snug"
              style={{ color: "var(--texto-secundario, #4b5563)" }}
            >
              {cur.desc}
            </p>

            {/* Sugerencia de navegación — más compacta */}
            {!cur.isLast && cur.nextNavLabel && (
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-3"
                style={{
                  background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                  border: "1px solid rgba(37,99,235,0.12)",
                }}
              >
                <ArrowUp size={14} style={{ color: "#2563eb", flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "#1e40af" }}>
                  Siguiente paso: haz clic en <strong>"{cur.nextNavLabel}"</strong> en el menú superior
                </p>
              </div>
            )}

            {/* Paso final — compacto */}
            {cur.isLast && (
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mt-3"
                style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  border: "1px solid rgba(22,163,74,0.12)",
                }}
              >
                <CheckCircle size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
                <p className="text-xs font-semibold" style={{ color: "#166534" }}>
                  ¡Tutorial completado! Has visitado todas las secciones.
                </p>
              </div>
            )}

            {/* Botones más compactos */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-1">
              <button
                onClick={finish}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ color: "var(--texto-muted, #6b7280)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fef2f2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--texto-muted, #6b7280)"; e.currentTarget.style.background = "transparent"; }}
              >
                <X size={12} /> Saltar
              </button>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-1">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStepIdx(i)}
                      className="rounded-full transition-all border-none"
                      style={{
                        width: i === stepIdx ? 18 : 5,
                        height: 5,
                        background: i === stepIdx
                          ? "var(--azul-egm, #1b3f7e)"
                          : "var(--gris-borde, #d1d5db)",
                        cursor: "pointer",
                      }}
                      aria-label={`Paso ${i + 1}`}
                    />
                  ))}
                </div>

                {cur.isLast ? (
                  <button
                    onClick={finish}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      color: "#fff",
                      boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                    }}
                  >
                    <CheckCircle size={14} /> Finalizar
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)",
                      color: "#fff",
                      boxShadow: "0 4px 14px rgba(27,63,126,0.3)",
                    }}
                  >
                    Ir ahora <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
