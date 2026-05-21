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
} from "lucide-react";

interface GuiaSubStep {
  desc: string;
  /** CSS selector para encontrar el elemento a resaltar */
  selector?: string;
  /** Label del nav del header (legacy) */
  navLabel?: string;
}

interface GuiaStep {
  route: string;
  icon: React.ReactNode;
  title: string;
  subSteps: GuiaSubStep[];
  nextNavLabel?: string;
  nextRoute?: string;
  isLast?: boolean;
}

const ICON_CLS = "shrink-0";
const ICON_STYLE = { color: "var(--azul-egm, #1b3f7e)" };

const SUB_STEPS_EMPLEADO: GuiaStep[] = [
  {
    route: "INIT",
    icon: <LayoutDashboard size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Panel principal",
    subSteps: [
      {
        desc: '¡Hola Buenos dias! Aquí empieza tu día a dia en Atalayas. Arriba tienes el menú principal con todas las secciones: Formación, Comunicación, Comunidad, Colaboradores y Tu perfil. Usa este menú para navegar por la plataforma.',
        navLabel: "Inicio",
      },
      {
        desc: 'Este es tu saludo personalizado. Aquí aparecerá tu nombre y un resumen rápido de tu actividad. Más abajo verás los servicios del parque empresarial: coche compartido, autobús lanzadera, aparcamiento, guardería y descuentos.',
        selector: "[style*='8px 40px'], h1",
      },
      {
        desc: 'El carrusel de comunicaciones te muestra las últimas noticias y anuncios importantes. Puedes deslizar para ver más comunicados.',
        selector: "section:has(a[href='/dashboard/comunicacion'])",
      },
      {
        desc: 'Tus cursos de formación en curso aparecen aquí con su barra de progreso. También verás los próximos eventos de la comunidad.',
        selector: "section:has(a[href='/dashboard/formacion'])",
      },
    ],
    nextNavLabel: "Formación",
    nextRoute: "/dashboard/formacion",
  },
  {
    route: "/dashboard/formacion",
    icon: <GraduationCap size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Formación",
    subSteps: [
      {
        desc: 'Aquí tienes tu programa de onboarding. Cada módulo de incorporación muestra su barra de progreso para que sepas cómo vas.',
        navLabel: "Formación",
        selector: "[class*='onboarding'], [class*='incorporacion']",
      },
      {
        desc: 'Más abajo está la formación continua con todos los cursos disponibles. Cada curso incluye imagen, duración, descripción y un botón para empezar, continuar o descargar el certificado.',
        selector: "[class*='continua'], [class*='cursos'], section",
      },
      {
        desc: 'Puedes buscar cursos por nombre, filtrar por tipo de módulo o por estado (pendiente, en progreso, completado) para encontrar lo que necesites rápidamente.',
        selector: "#onboarding div[class*='gap-3']",
      },
    ],
    nextNavLabel: "Comunicación",
    nextRoute: "/dashboard/comunicacion",
  },
  {
    route: "/dashboard/comunicacion",
    icon: <MessageSquare size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunicación",
    subSteps: [
      {
        desc: 'Las publicaciones más recientes aparecen como tarjetas destacadas con imagen de fondo. Son las comunicaciones más importantes.',
        navLabel: "Comunicación",
      },
      {
        desc: 'El resto de comunicados están ordenados por fecha. Puedes filtrar entre comunicados de EGM Atalayas, anuncios de tu empresa o ver todos juntos pulsando estos botones.',
        selector: "div[style*='scrollbarWidth']",
      },
      {
        desc: 'Usa los filtros para buscar por texto, ordenar por más reciente o más antiguo. Al hacer clic en cualquier comunicación se abre un modal con el contenido completo.',
        selector: "div[class*='md:ml-auto']",
      },
    ],
    nextNavLabel: "Comunidad",
    nextRoute: "/dashboard/comunidad",
  },
  {
    route: "/dashboard/comunidad",
    icon: <Users size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunidad",
    subSteps: [
      {
        desc: 'Este es el punto de encuentro de la comunidad Atalayas. Aquí encontrarás Eventos como jornadas, networking y actividades del área empresarial.',
        navLabel: "Comunidad",
      },
      {
        desc: 'También tienes Servicios del parque empresarial: bus lanzadera, coche compartido, aparcamiento y más. Cada tarjeta tiene una imagen de fondo representativa.',
        selector: "[class*='servicio'], [class*='service'], section",
      },
      {
        desc: 'Y en Ventajas encontrarás descuentos en comercios, servicios y ocio. Al pasar el ratón sobre cada tarjeta se muestra más información.',
        selector: "[class*='md:grid-cols-3'] button:nth-child(3)",
      },
    ],
    nextNavLabel: "Colaboradores",
    nextRoute: "/dashboard/colaboradores",
  },
  {
    route: "/dashboard/colaboradores",
    icon: <UserPlus size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Colaboradores",
    subSteps: [
      {
        desc: 'El ecosistema de entidades colaboradoras de Atalayas. Aquí encontrarás Universidades como la Universidad de Alicante y la UMH.',
        navLabel: "Colaboradores",
      },
      {
        desc: 'También hay Parques Científicos e Institutos Tecnológicos como AIJU, INESCOP y AITEX. Cada entidad muestra su logo, descripción y un enlace a su web.',
        selector: "div[class*='rounded-3xl'][class*='overflow-hidden']",
      },
    ],
    nextNavLabel: "Tu perfil",
    nextRoute: "/dashboard/perfil",
  },
  {
    route: "/dashboard/perfil",
    icon: <UserCircle size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Tu perfil",
    subSteps: [
      {
        desc: 'Tu espacio personal. Aquí puedes cambiar tu foto de avatar y la imagen de portada, con tu propia imagen o eligiendo entre varias galerías temáticas.',
        navLabel: "Tu perfil",
      },
      {
        desc: 'Gestiona tus datos personales: nombre, apellidos, puesto de trabajo, teléfono y email.',
        selector: "div[class*='flex-col'][class*='gap-7']",
      },
      {
        desc: 'Aquí puedes ver tus documentos asignados, como contratos, nóminas o certificados de formación. Haz clic en cada documento para descargarlo.',
        selector: "#mis-documentos",
      },
      {
        desc: 'El buzón de sugerencias te permite enviar tus ideas, quejas o propuestas directamente a EGM Atalayas. Escribe tu mensaje y pulsa "Enviar".',
        selector: "div[class*='flex-col'][class*='gap-4']",
      },
    ],
    isLast: true,
  },
];

const SUB_STEPS_ADMIN: GuiaStep[] = [
  {
    route: "INIT",
    icon: <LayoutDashboard size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Panel de administración",
    subSteps: [
      {
        desc: 'Tu centro de control. Aquí ves un resumen completo de tu empresa: número de empleados activos, progreso medio de formación, módulos publicados y la actividad reciente de tu equipo.',
        navLabel: "Inicio",
      },
      {
        desc: 'Tienes acceso rápido a las acciones más comunes: añadir empleado, gestionar módulos, crear un nuevo módulo o publicar un anuncio.',
        selector: "[class*='acceso'], [class*='quick'], [class*='action']",
      },
      {
        desc: 'En la parte inferior, los últimos comunicados publicados para que no te pierdas nada.',
        selector: "[class*='comunicado'], [class*='anuncio'], section",
      },
    ],
    nextNavLabel: "Administración",
    nextRoute: "/dashboard/admin",
  },
  {
    route: "/dashboard/admin",
    icon: <Building2 size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Administración",
    subSteps: [
      {
        desc: 'El panel de gestión completa de tu empresa. Tiene 7 pestañas con herramientas especializadas: Empleados, Incidencias, Anuncios, Eventos, Módulos, Documentos y Estadísticas.',
        navLabel: "Administración",
      },
      {
        desc: 'En Empleados puedes gestionar tu plantilla. En Incidencias puedes reportar y hacer seguimiento. Y en Anuncios puedes crear y publicar comunicados.',
        selector: "[class*='tab'], [role='tab'], [class*='pestana']",
      },
      {
        desc: 'En Módulos formativos puedes crear cursos. En Documentos puedes subir y asignar archivos. Y en Estadísticas puedes exportar informes con filtros por departamento y periodo.',
        selector: "[class*='modulo'], [class*='documento'], [class*='estadistica']",
      },
    ],
    nextNavLabel: "Formación",
    nextRoute: "/dashboard/formacion",
  },
  {
    route: "/dashboard/formacion",
    icon: <GraduationCap size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Formación",
    subSteps: [
      {
        desc: 'Gestiona la formación de tu empresa. Desde aquí puedes crear nuevos módulos formativos, editarlos y supervisar el progreso de tus empleados.',
        navLabel: "Formación",
      },
      {
        desc: 'La sección de onboarding muestra el programa de incorporación, y la formación continua incluye todos los cursos disponibles con filtros por tipo y estado.',
        selector: "[class*='onboarding'], [class*='cursos'], section",
      },
    ],
    nextNavLabel: "Comunicación",
    nextRoute: "/dashboard/comunicacion",
  },
  {
    route: "/dashboard/comunicacion",
    icon: <MessageSquare size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunicación",
    subSteps: [
      {
        desc: 'Crea y publica anuncios para toda tu plantilla. También ves los comunicados de EGM Atalayas.',
        navLabel: "Comunicación",
      },
      {
        desc: 'Puedes filtrar por fuente (EGM o tu empresa), buscar por texto y ordenar por fecha. Los borradores pendientes aparecen en un panel amarillo destacado.',
        selector: "[class*='filter'], [class*='filtro'], input",
      },
    ],
    nextNavLabel: "Comunidad",
    nextRoute: "/dashboard/comunidad",
  },
  {
    route: "/dashboard/comunidad",
    icon: <Users size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunidad",
    subSteps: [
      {
        desc: 'El punto de encuentro de la comunidad Atalayas. Desde aquí tus empleados pueden acceder a Eventos, Servicios y Ventajas.',
        navLabel: "Comunidad",
      },
      {
        desc: 'Eventos incluye jornadas y networking. Servicios incluye bus lanzadera, coche compartido y aparcamiento. Ventajas incluye descuentos en comercios y ocio.',
        selector: "[class*='evento'], [class*='servicio'], [class*='ventaja'], section",
      },
    ],
    nextNavLabel: "Colaboradores",
    nextRoute: "/dashboard/colaboradores",
  },
  {
    route: "/dashboard/colaboradores",
    icon: <UserPlus size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Colaboradores",
    subSteps: [
      {
        desc: 'Gestiona las entidades colaboradoras. Aquí puedes ver y administrar las relaciones con Universidades (UA, UMH), Parques Científicos e Institutos Tecnológicos.',
        navLabel: "Colaboradores",
      },
    ],
    nextNavLabel: "Tu perfil",
    nextRoute: "/dashboard/perfil",
  },
  {
    route: "/dashboard/perfil",
    icon: <UserCircle size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Tu perfil",
    subSteps: [
      {
        desc: 'Además de gestionar tu avatar, portada y datos personales, puedes editar los datos de tu empresa: nombre, CIF, email de contacto y subir el logo corporativo.',
        navLabel: "Tu perfil",
      },
      {
        desc: 'También tienes acceso al buzón de sugerencias para enviar tus ideas.',
        selector: "[class*='sugerencia'], [class*='suggestion'], form",
      },
    ],
    isLast: true,
  },
];

const SUB_STEPS_SUPERADMIN: GuiaStep[] = [
  {
    route: "INIT",
    icon: <LayoutDashboard size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Panel de control global",
    subSteps: [
      {
        desc: 'Tu centro de control de toda la plataforma. Aquí ves 6 tarjetas con métricas clave: empresas adheridas, nuevas empresas del mes, empleados registrados y más.',
        navLabel: "Inicio",
      },
      {
        desc: 'También tienes una guía de configuración con 5 pasos para poner en marcha la plataforma, acceso rápido a la gestión de empresas y un feed con la actividad reciente.',
        selector: "[class*='config'], [class*='guia'], [class*='guide'], section",
      },
    ],
    nextNavLabel: "Administración",
    nextRoute: "/superadmin/administracion",
  },
  {
    route: "/superadmin/administracion",
    icon: <Building2 size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Administración global",
    subSteps: [
      {
        desc: 'La gestión central de la plataforma. Tiene 4 pestañas: Empresas, Solicitudes, Estadísticas e Incidencias.',
        navLabel: "Administración",
      },
      {
        desc: 'En Empresas puedes activarlas o desactivarlas. En Solicitudes apruebas o rechazas nuevos registros. En Incidencias haces seguimiento de todas las reportadas.',
        selector: "[class*='tab'], [role='tab'], [class*='pestana']",
      },
    ],
    nextNavLabel: "Comunicados",
    nextRoute: "/superadmin/comunicados",
  },
  {
    route: "/superadmin/comunicados",
    icon: <Megaphone size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunicados globales",
    subSteps: [
      {
        desc: 'Crea y publica comunicados que llegarán a todas las empresas y empleados de la plataforma. Ideal para decisiones importantes o info de interés general.',
        navLabel: "Comunicados",
      },
    ],
    nextNavLabel: "Comunidad",
    nextRoute: "/dashboard/comunidad",
  },
  {
    route: "/dashboard/comunidad",
    icon: <Users size={24} className={ICON_CLS} style={ICON_STYLE} />,
    title: "Comunidad global",
    subSteps: [
      {
        desc: 'Supervisa la comunidad global. Aquí todas las empresas pueden acceder a Eventos, Servicios del parque empresarial y Ventajas y descuentos.',
        navLabel: "Comunidad",
      },
    ],
    isLast: true,
  },
];

const LS_KEY_PREFIX = "tutorial_step_";

function getSteps(role?: string): GuiaStep[] {
  switch (role) {
    case "ROLE_ADMIN": return SUB_STEPS_SUPERADMIN;
    case "ROLE_ADMIN_EMPRESA": return SUB_STEPS_ADMIN;
    default: return SUB_STEPS_EMPLEADO;
  }
}

const CARD_WIDTH = 520;
const ARROW_SIZE = 14;

function findTargetElements(subStep: GuiaSubStep): Element[] {
  const elements: Element[] = [];
  if (subStep.selector) {
    try {
      const all = document.querySelectorAll(subStep.selector);
      all.forEach((el) => elements.push(el));
    } catch { }
  }
  if (elements.length === 0 && subStep.navLabel) {
    const nav = document.querySelector("header nav");
    if (nav) {
      const all = nav.querySelectorAll("button");
      for (const btn of all) {
        if ((btn.textContent?.trim().replace(/\s+/g, " ") ?? "") === subStep.navLabel) {
          elements.push(btn);
        }
      }
    }
  }
  return elements;
}

function combineRects(elements: Element[]): DOMRect {
  let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
  for (const el of elements) {
    const r = el.getBoundingClientRect();
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
  }
  return new DOMRect(left, top, right - left, bottom - top);
}

export default function AppTutorial() {
  const { usuario } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const role = usuario?.codigoRol;
  const userId = usuario?.usuarioId;
  const steps = getSteps(role);

  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [subStepIdx, setSubStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipSide, setTooltipSide] = useState<"bottom" | "top">("bottom");
  const [visible, setVisible] = useState(false);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lsKey = userId ? `${LS_KEY_PREFIX}${userId}` : null;

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

  useEffect(() => {
    if (!active || !lsKey) return;
    const next = steps.findIndex((s, i) => i > stepIdx && s.route === pathname);
    if (next !== -1) {
      setStepIdx(next);
      setSubStepIdx(0);
      localStorage.setItem(lsKey, String(next));
    }
  }, [pathname, active, stepIdx, steps, lsKey]);

  const measure = useCallback(() => {
    if (!visible || !active) { setTargetRect(null); setHighlightStyle(null); return; }
    const cur = steps[stepIdx];
    if (!cur) { setTargetRect(null); setHighlightStyle(null); return; }

    const subStep = cur.subSteps[subStepIdx];
    if (!subStep) { setTargetRect(null); setHighlightStyle(null); return; }

    const elements = findTargetElements(subStep);
    if (elements.length === 0) { setTargetRect(null); setHighlightStyle(null); return; }

    const r = elements.length === 1 ? elements[0].getBoundingClientRect() : combineRects(elements);
    setTargetRect(r);
    setTooltipSide(window.innerHeight - r.bottom < 240 ? "top" : "bottom");

    setHighlightStyle({
      position: "fixed",
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      borderRadius: 8,
      boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px rgba(37,99,235,0.5), 0 0 24px rgba(37,99,235,0.3)",
      pointerEvents: "none",
      zIndex: 9997,
      transition: "all 0.35s ease",
    });

    elements[0].scrollIntoView({ behavior: "smooth", block: "center" });
  }, [visible, active, stepIdx, subStepIdx, steps]);

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

  const advanceSubStep = useCallback(() => {
    const cur = steps[stepIdx];
    if (!cur) return;
    if (subStepIdx < cur.subSteps.length - 1) {
      setSubStepIdx((prev) => prev + 1);
    } else {
      if (cur.isLast) {
        if (lsKey) localStorage.setItem(lsKey, "COMPLETED");
        setActive(false);
        setVisible(false);
      } else if (cur.nextRoute) {
        router.push(cur.nextRoute);
      }
    }
  }, [stepIdx, subStepIdx, steps, router, lsKey]);

  const finish = useCallback(() => {
    if (lsKey) localStorage.setItem(lsKey, "COMPLETED");
    setActive(false);
    setVisible(false);
  }, [lsKey]);

  if (!active || !visible || !steps[stepIdx]) return null;

  const cur = steps[stepIdx];
  const subStep = cur.subSteps[subStepIdx];
  if (!subStep) return null;

  const half = CARD_WIDTH / 2;
  const totalSubSteps = cur.subSteps.length;
  const isLastSubStep = subStepIdx === totalSubSteps - 1;

  let cardLeft: number | string = 16;
  let cardTop: number | string = 80;

  if (targetRect) {
    cardLeft = Math.max(12, Math.min(
      targetRect.left + targetRect.width * 0.55 - half,
      window.innerWidth - CARD_WIDTH - 12
    ));
    const gap = 8;
    const cardHeight = cardRef.current?.offsetHeight ?? 240;
    cardTop = tooltipSide === "bottom"
      ? targetRect.top + targetRect.height + gap
      : targetRect.top - gap - cardHeight;
    cardTop = Math.max(10, Math.min(cardTop, window.innerHeight - 260));
  }

  return (
    <AnimatePresence>
      {highlightStyle && (
        <motion.div
          style={highlightStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <motion.div
        ref={cardRef}
        className="fixed z-[9999]"
        style={{ left: cardLeft, top: cardTop, width: CARD_WIDTH }}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        transition={{ type: "spring", damping: 22, stiffness: 280, mass: 0.8 }}
        key={`${stepIdx}-${subStepIdx}`}
      >
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

        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "#fff",
            boxShadow: "0 16px 48px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 1,
          }}
        >
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
                    className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)" }}
                  >
                    {stepIdx + 1}.{subStepIdx + 1} / {steps.length}.{totalSubSteps}
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

          <div className="px-5 py-3">
            <p
              className="text-sm leading-snug"
              style={{ color: "var(--texto-secundario, #4b5563)", fontFamily: "var(--font-poppins), sans-serif" }}
            >
              {subStep.desc}
            </p>

            {!cur.isLast && isLastSubStep && cur.nextNavLabel && (
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-3"
                style={{
                  background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                  border: "1px solid rgba(37,99,235,0.12)",
                }}
              >
                <ArrowUp size={14} style={{ color: "#2563eb", flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "#1e40af", fontFamily: "var(--font-poppins), sans-serif" }}>
                  Siguiente paso: haz clic en <strong>"{cur.nextNavLabel}"</strong> en el menú superior
                </p>
              </div>
            )}

            {cur.isLast && isLastSubStep && (
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mt-3"
                style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  border: "1px solid rgba(22,163,74,0.12)",
                }}
              >
                <CheckCircle size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
                <p className="text-xs" style={{ color: "#166534", fontFamily: "var(--font-poppins), sans-serif" }}>
                  Tutorial completado! Has visitado todas las secciones.
                </p>
              </div>
            )}

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
                      onClick={() => { setStepIdx(i); setSubStepIdx(0); }}
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

                <button
                    onClick={advanceSubStep}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isLastSubStep && !cur.isLast
                        ? "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)"
                        : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      color: "#fff",
                      boxShadow: isLastSubStep && !cur.isLast
                        ? "0 4px 14px rgba(27,63,126,0.3)"
                        : "0 4px 12px rgba(22,163,74,0.3)",
                    }}
                  >
                    {isLastSubStep && !cur.isLast ? "Ir ahora" : isLastSubStep && cur.isLast ? "Finalizar" : "Siguiente"}
                    {isLastSubStep && cur.isLast ? <CheckCircle size={14} /> : <ArrowRight size={13} />}
                  </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
