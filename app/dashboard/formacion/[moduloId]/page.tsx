"use client";

/**
 * Página de detalle de módulo formativo
 * Ruta: /dashboard/formacion/[moduloId]
 * Archivo: app/dashboard/formacion/[moduloId]/page.tsx
 */

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch, API_URL } from "@/lib/api";

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type TipoContenido = "texto" | "video" | "pdf" | "quiz";

interface Contenido {
  id: string;
  titulo: string;
  tipo: TipoContenido;
  subtipo?: "podcast" | "slides";
  duracion?: string;
  completado: boolean;
  bloqueado: boolean;
  seccionIdx?: number; // índice en el array de secciones del markdown
}

interface SeccionMarkdown {
  titulo: string;
  contenido: string;
}

function parsearSecciones(markdown: string): SeccionMarkdown[] {
  const lineas = markdown.split("\n");
  const secciones: SeccionMarkdown[] = [];
  let actual: SeccionMarkdown | null = null;
  for (const linea of lineas) {
    if (linea.startsWith("## ")) {
      if (actual) secciones.push(actual);
      actual = { titulo: linea.slice(3).trim(), contenido: "" };
    } else if (linea.startsWith("# ")) {
      // título raíz, ignorar
    } else if (actual) {
      actual.contenido += linea + "\n";
    }
  }
  if (actual) secciones.push(actual);
  return secciones;
}

function estimarDuracion(texto: string): string {
  const palabras = texto.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(palabras / 180));
  return `~${mins} min`;
}

interface ModuloMock {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  totalItems: number;
  completados: number;
  esEspecializadoIa: boolean;
  contenidos: Contenido[];
}

// ── MÓDULO REAL (API) ─────────────────────────────────────────────────────────
interface ModuloAPI {
  moduloId: string;
  nombre: string;
  descripcion: string | null;
  tipoModulo: string;
  idioma: string | null;
  duracion: string | null;
  audiencia: string | null;
  esEspecializadoIa: boolean;
  testPreguntas: string | null;
  contenidoMarkdown: string | null;
  scriptPodcast: string | null;
  scriptVideo: string | null;
  podcastAudioUrl: string | null;
  tiposSalida: string | null;
  activo: boolean;
  adjuntoUrl?: string | null;
  adjuntoNombre?: string | null;
}

const TIPO_LABEL: Record<string, string> = {
  GENERAL: "General",
  ESPECIALIZADO: "Específico",
  ESPECIALIZADO_IA: "Generado con IA",
  CUMPLIMIENTO: "Cumplimiento normativo",
  ONBOARDING: "Onboarding",
};

// ── IMÁGENES POR MÓDULO ───────────────────────────────────────────────────────
const FORMACION_IMG_BY_ID: Record<string, string> = {
  "1": "/background-formacion-empleado.webp",
  "2": "/comunicacion-trabajo.webp",
  "3": "/herramientas-digitales.webp",
  "4": "/negociacion-habilidades.webp",
  "5": "/ciberseguridad-datos.webp",
  "6": "/metodologias-agiles.webp",
  "7": "/diversidad.webp",
};

const FORMACION_IMG_BY_NAME: Array<{ keywords: string[]; imagen: string }> = [
  { keywords: ["incorporac", "bienvenid"], imagen: "/background-formacion-empleado.webp" },
  { keywords: ["comunicac", "efectiva"], imagen: "/comunicacion-trabajo.webp" },
  { keywords: ["herramienta", "digital", "colaborat"], imagen: "/herramientas-digitales.webp" },
  { keywords: ["negociaci", "habilidad", "directiv"], imagen: "/negociacion-habilidades.webp" },
  { keywords: ["cibersegur", "datos", "rgpd"], imagen: "/ciberseguridad-datos.webp" },
  { keywords: ["metodolog", "agil", "scrum", "kanban"], imagen: "/metodologias-agiles.webp" },
  { keywords: ["diversidad", "inclusi"], imagen: "/diversidad.webp" },
];

function getHeroImg(id: string, nombre: string): string {
  if (FORMACION_IMG_BY_ID[id]) return FORMACION_IMG_BY_ID[id];
  const lower = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return FORMACION_IMG_BY_NAME.find((e) => e.keywords.some((kw) => lower.includes(kw)))?.imagen
    ?? "/background-formacion-empleado.webp";
}

// ── MOCK ─────────────────────────────────────────────────────────────────────
// Mapa de módulos mock — cubre los IDs del listado de formación
const MOCKS: Record<string, Pick<ModuloMock, "nombre" | "descripcion" | "tipo" | "esEspecializadoIa">> = {
  "1": { nombre: "Incorporación y Bienvenida a Atalayas", descripcion: "Conoce la empresa, sus valores y procedimientos de incorporación al área.", tipo: "Identidad Corporativa", esEspecializadoIa: false },
  "2": { nombre: "Comunicación Efectiva en el Trabajo", descripcion: "Estrategias para mejorar la comunicación interna y externa con tu equipo.", tipo: "Desarrollo Profesional", esEspecializadoIa: false },
  "3": { nombre: "Introducción a Herramientas Digitales", descripcion: "Uso de las plataformas y herramientas digitales del área empresarial.", tipo: "Formación Básica", esEspecializadoIa: false },
  "4": { nombre: "Negociación y Habilidades Directivas", descripcion: "Técnicas avanzadas de negociación para entornos empresariales exigentes.", tipo: "Formación Específica", esEspecializadoIa: true },
  "5": { nombre: "Ciberseguridad y Protección de Datos", descripcion: "Buenas prácticas de seguridad informática y cumplimiento del RGPD.", tipo: "Formación Básica", esEspecializadoIa: false },
  "6": { nombre: "Gestión de Proyectos con Metodologías Ágiles", descripcion: "Scrum, Kanban y otras metodologías para gestionar equipos de forma eficaz.", tipo: "Desarrollo Profesional", esEspecializadoIa: true },
  "7": { nombre: "Diversidad e Inclusión en la Empresa", descripcion: "Cultura inclusiva y gestión de la diversidad en el entorno laboral.", tipo: "Comunidad", esEspecializadoIa: false },
};

function buildContenidos(moduloApi: ModuloAPI): Contenido[] {
  const tipos = moduloApi.tiposSalida ? moduloApi.tiposSalida.split(",") : ["documentacion"];
  const items: Contenido[] = [];
  let idx = 1;

  // Intentar parsear contenidoMarkdown como JSON array de páginas (admin)
  let paginasJson: any[] | null = null;
  if (moduloApi.contenidoMarkdown) {
    try {
      const parsed = JSON.parse(moduloApi.contenidoMarkdown);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tipo) {
        paginasJson = parsed;
      }
    } catch { /* no es JSON, es markdown normal */ }
  }

  // Documentación: páginas desde JSON o markdown por secciones ##
  if (tipos.includes("documentacion")) {
    if (paginasJson) {
      // Separar primera página, tests, y resto de páginas de texto
      const primeraPag = paginasJson.length > 0 ? paginasJson[0] : null;
      const paginasTest = paginasJson.filter((p) => p.tipo === "test");
      const paginasTextoResto = paginasJson.slice(1).filter((p) => p.tipo !== "test");

      // 1. Primera página (introducción)
      if (primeraPag) {
        items.push({
          id: `c${idx++}`, titulo: primeraPag.titulo || "Introducción", tipo: "texto",
          duracion: estimarDuracion(primeraPag.contenido || ""), completado: false, bloqueado: false, seccionIdx: 0,
        });
      }

      // 2. Podcast después de la introducción
      if (tipos.includes("podcast") && moduloApi.scriptPodcast) {
        items.push({
          id: `c${idx++}`, titulo: "Podcast — Narración de audio", tipo: "video", subtipo: "podcast",
          duracion: "5–10 min", completado: false, bloqueado: items.length > 0,
          seccionIdx: -1,
        });
      }

      // 3. Resto de páginas de texto
      paginasTextoResto.forEach((pag, i) => {
        items.push({
          id: `c${idx++}`, titulo: pag.titulo || `Página ${i + 2}`, tipo: "texto",
          duracion: estimarDuracion(pag.contenido || ""), completado: false, bloqueado: false,
          seccionIdx: paginasJson.indexOf(pag),
        });
      });

      // 4. Test al final
      paginasTest.forEach((pag) => {
        items.push({
          id: `c${idx++}`, titulo: pag.titulo || "Evaluación", tipo: "quiz",
          duracion: "10–15 min", completado: false, bloqueado: items.length > 0,
          seccionIdx: paginasJson.indexOf(pag),
        });
      });
    } else if (moduloApi.contenidoMarkdown) {
      const secciones = parsearSecciones(moduloApi.contenidoMarkdown);
      if (secciones.length > 0) {
        secciones.forEach((s, i) => {
          items.push({
            id: `c${idx++}`,
            titulo: s.titulo,
            tipo: "texto",
            duracion: estimarDuracion(s.contenido),
            completado: false,
            bloqueado: false,
            seccionIdx: i,
          });
        });
      } else {
        items.push({ id: `c${idx++}`, titulo: "Documentación del módulo", tipo: "texto", duracion: "15–45 min", completado: false, bloqueado: false, seccionIdx: -1 });
      }
    } else {
      items.push({ id: `c${idx++}`, titulo: "Documentación del módulo", tipo: "texto", duracion: "15–45 min", completado: false, bloqueado: false });
    }
  }

  // Podcast para markdown normal (para JSON ya se insertó arriba)
  if (!paginasJson && tipos.includes("podcast") && moduloApi.scriptPodcast) {
    items.push({ id: `c${idx++}`, titulo: "Podcast — Narración de audio", tipo: "video", subtipo: "podcast", duracion: "5–10 min", completado: false, bloqueado: items.length > 0 });
  }
  if (tipos.includes("video") && moduloApi.scriptVideo) {
    items.push({ id: `c${idx++}`, titulo: "Video — Presentación de slides", tipo: "video", subtipo: "slides", duracion: "8–12 min", completado: false, bloqueado: items.length > 0 });
  }
  if (items.length === 0) {
    items.push({ id: `c${idx++}`, titulo: "Descripción y contenido", tipo: "texto", duracion: "15–45 min", completado: false, bloqueado: false });
  }
  if (moduloApi.adjuntoUrl) {
    const nombre = moduloApi.adjuntoNombre ?? "Documento adjunto";
    items.push({ id: `c${idx++}`, titulo: nombre, tipo: "pdf", duracion: "5–10 min", completado: false, bloqueado: items.length > 0 });
  }
  if (moduloApi.testPreguntas) {
    items.push({ id: `c${idx++}`, titulo: "Test de evaluación", tipo: "quiz", duracion: "10–15 min", completado: false, bloqueado: true });
  }

  return items;
}

function apiToMock(moduloApi: ModuloAPI): ModuloMock {
  const contenidos = buildContenidos(moduloApi);
  return {
    id: moduloApi.moduloId,
    nombre: moduloApi.nombre,
    descripcion: moduloApi.descripcion ?? "",
    tipo: TIPO_LABEL[moduloApi.tipoModulo] ?? moduloApi.tipoModulo,
    esEspecializadoIa: moduloApi.esEspecializadoIa,
    totalItems: contenidos.length,
    completados: 0,
    contenidos,
  };
}

// Fallback para módulos legacy (IDs numéricos del mock original)
function getMockBase(id: string): ModuloMock {
  const meta = MOCKS[id] ?? {
    nombre: "Módulo de Formación",
    descripcion: "Completa todos los pasos para obtener tu certificado.",
    tipo: "Formación",
    esEspecializadoIa: false,
  };
  return {
    id,
    nombre: meta.nombre,
    descripcion: meta.descripcion,
    tipo: meta.tipo,
    esEspecializadoIa: meta.esEspecializadoIa ?? false,
    totalItems: 5,
    completados: 0,
    contenidos: [
      { id: "c1", titulo: "Introducción y conceptos clave", tipo: "texto", duracion: "5 min", completado: false, bloqueado: false },
      { id: "c2", titulo: "Desarrollo del tema principal", tipo: "video", duracion: "12 min", completado: false, bloqueado: true },
      { id: "c3", titulo: "Casos prácticos y aplicación", tipo: "texto", duracion: "8 min", completado: false, bloqueado: true },
      { id: "c4", titulo: "Documentación y recursos", tipo: "pdf", duracion: "10 min", completado: false, bloqueado: true },
      { id: "c5", titulo: "Evaluación final del módulo", tipo: "quiz", duracion: "15 min", completado: false, bloqueado: true },
    ],
  };
}

function lsKey(id: string) { return `egm_modulo_${id}`; }

function cargarEstado(id: string): { completados: string[]; activoId: string } {
  try {
    const raw = localStorage.getItem(lsKey(id));
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { completados: [], activoId: "c1" };
}

function guardarEstado(id: string, completados: string[], activoId: string, total: number) {
  try { localStorage.setItem(lsKey(id), JSON.stringify({ completados, activoId, total })); }
  catch { /* noop */ }
}

function aplicarEstado(base: ModuloMock, completados: string[]): ModuloMock {
  const set = new Set(completados);
  const contenidos = base.contenidos.map((c, i) => ({
    ...c,
    completado: set.has(c.id),
    bloqueado: i > 0 && !set.has(base.contenidos[i - 1].id),
  }));
  return { ...base, completados: completados.length, contenidos };
}

// ── PÁGINA ────────────────────────────────────────────────────────────────────
export default function Page() {
  const router = useRouter();
  const rawParams = useParams();
  const id = Array.isArray(rawParams.moduloId) ? rawParams.moduloId[0] : (rawParams.moduloId ?? "");

  const [modulo, setModulo] = useState<ModuloMock | null>(null);
  const [moduloApi, setModuloApi] = useState<ModuloAPI | null>(null);
  const [activoId, setActivoId] = useState<string>("c1");
  const [completando, setCompletando] = useState(false);
  const [moduloCompletado, setModuloCompletado] = useState(false);
  const [verificado, setVerificado] = useState(false);

  // Secciones del markdown (calculadas una vez al cargar el módulo)
  const secciones = React.useMemo<SeccionMarkdown[]>(() => {
    if (!moduloApi?.contenidoMarkdown) return [];
    return parsearSecciones(moduloApi.contenidoMarkdown);
  }, [moduloApi]);

  // Páginas desde JSON array (cuando el admin crea páginas estructuradas)
  const paginasJson = React.useMemo<any[] | null>(() => {
    if (!moduloApi?.contenidoMarkdown) return null;
    try {
      const parsed = JSON.parse(moduloApi.contenidoMarkdown);
      return Array.isArray(parsed) && parsed.length > 0 && parsed[0].tipo ? parsed : null;
    } catch { return null; }
  }, [moduloApi]);

  // Reset verificado cada vez que el usuario cambia de ítem
  React.useEffect(() => { setVerificado(false); }, [activoId]);

  // Carga el módulo desde la API; si falla usa el mock legacy
  useEffect(() => {
    if (!id) return;
    const cargar = async () => {
      try {
        const res = await apiFetch(`${API_URL}/modulos/${id}`);
        if (res.ok) {
          const data: ModuloAPI = await res.json();
          setModuloApi(data);
          const base = apiToMock(data);
          const { completados, activoId: savedActivo } = cargarEstado(id);
          const moduloConEstado = aplicarEstado(base, completados);
          setModulo(moduloConEstado);
          // Si el módulo ya está 100% completado, empezar desde el primer ítem
          const yaCompletado = completados.length >= moduloConEstado.totalItems;
          setActivoId(yaCompletado ? moduloConEstado.contenidos[0].id : savedActivo);
          return;
        }
      } catch { /* fallback */ }
      // Fallback: datos mock legacy
      const { completados, activoId: savedActivo } = cargarEstado(id);
      const moduloConEstado = aplicarEstado(getMockBase(id), completados);
      setModulo(moduloConEstado);
      const yaCompletado = completados.length >= moduloConEstado.totalItems;
      setActivoId(yaCompletado ? moduloConEstado.contenidos[0].id : savedActivo);
    };
    cargar();
  }, [id]);

  // Persistir en localStorage cuando cambia el estado
  useEffect(() => {
    if (!id || !modulo) return;
    const hechos = modulo.contenidos.filter((c) => c.completado).map((c) => c.id);
    guardarEstado(id, hechos, activoId, modulo.totalItems);
  }, [modulo, activoId]);

  if (!modulo) return null;

  const activo = modulo.contenidos.find((c) => c.id === activoId) ?? modulo.contenidos[0];
  const progPct = Math.round((modulo.completados / modulo.totalItems) * 100);

  const marcarCompletado = () => {
    if (activo.completado) return;
    setCompletando(true);
    setTimeout(() => {
      const idx = modulo.contenidos.findIndex((c) => c.id === activoId);
      const siguiente = modulo.contenidos[idx + 1];
      const nuevosCompletados = modulo.completados + 1;
      setModulo((m) => m ? ({
        ...m,
        completados: nuevosCompletados,
        contenidos: m.contenidos.map((c, i) => {
          if (c.id === activoId) return { ...c, completado: true };
          if (i === idx + 1) return { ...c, bloqueado: false };
          return c;
        }),
      }) : null);
      if (siguiente) {
        setActivoId(siguiente.id);
      } else {
        // Último ítem — módulo completado
        setModuloCompletado(true);
      }
      setCompletando(false);
    }, 600);
  };

  // Color del borde lateral por tipo de contenido
  const borderColorForTipo = (tipo: TipoContenido) => {
    switch (tipo) {
      case "texto": return "#3b82f6"; // blue
      case "video": return "#a855f7"; // purple
      case "pdf": return "#ef4444"; // red
      case "quiz": return "#f97316"; // orange
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>

      {/* ── MODAL MÓDULO COMPLETADO ───────────────────────────────────────────── */}
      {moduloCompletado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-3xl text-center overflow-hidden shadow-2xl"
            style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            {/* Banner verde */}
            <div className="py-8 px-6" style={{ background: "linear-gradient(135deg,#16a34a 0%,#4ade80 100%)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(255,255,255,0.25)" }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-white">¡Módulo completado!</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                Has completado <strong>{modulo.nombre}</strong>
              </p>
            </div>
            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-sm mb-5" style={{ color: "var(--texto-secundario)" }}>
                Enhorabuena. Has terminado todos los contenidos de este módulo. Tu progreso queda guardado.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => router.push("/dashboard/formacion")}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: "linear-gradient(135deg,var(--azul-egm),#A3B535)", color: "#fff", boxShadow: "0 4px 12px rgba(0,82,204,0.3)" }}>
                  Volver a mis formaciones
                </button>
                <button
                  onClick={() => setModuloCompletado(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ color: "var(--texto-muted)" }}>
                  Revisar contenido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden flex items-center"
        style={{ minHeight: "clamp(260px, 30vw, 380px)", boxShadow: "0 6px 32px rgba(0,0,0,0.22)" }}
      >
        {/* Imagen de fondo */}
        <img
          src={getHeroImg(id, modulo.nombre)}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 40%" }}
        />
        {/* Capas de oscurecimiento */}
        <div className="absolute inset-0" style={{ background: "rgba(10,20,40,0.60)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(13,27,46,0.92) 0%, rgba(13,27,46,0.50) 45%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,27,46,0.80) 0%, transparent 50%)" }} />

        {/* Contenido del hero — mismo layout que DashboardHero */}
        <div className="relative z-10 w-full py-14" style={{ paddingTop: "80px" }}>
          <div className="w-full px-8 sm:px-12">

            {/* Breadcrumb */}
            <button
              onClick={() => router.push("/dashboard/formacion")}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] mb-5 transition-colors"
              style={{ color: "var(--verde-oliva-hover)" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Centro de Formación
              <span style={{ color: "rgba(255,255,255,0.2)" }}> · </span>
              {modulo.tipo}
            </button>

            {/* Título */}
            <h1
              className="text-white leading-tight mb-5 text-left"
              style={{
                fontSize: "clamp(2.2rem, 4vw, 3rem)",
                fontFamily: "var(--font-poppins), sans-serif",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                maxWidth: "820px",
              }}
            >
              {modulo.nombre}
            </h1>

            {/* Barra de progreso */}
            <div className="flex items-center gap-3" style={{ maxWidth: "280px" }}>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progPct}%`, background: "var(--verde-oliva-hover)" }}
                />
              </div>
              <span className="text-xs font-bold shrink-0" style={{ color: "var(--verde-oliva-hover)" }}>
                {progPct}% · {modulo.completados}/{modulo.totalItems}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUERPO: ÍNDICE + CONTENIDO ────────────────────────────────────────── */}
      <div className="flex flex-1 w-full px-8 lg:px-12 py-8 gap-10">

        {/* ÍNDICE LATERAL */}
        <aside
          className="w-88 shrink-0 self-start sticky top-6 rounded-2xl overflow-hidden"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
        >
          <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
            {/* Tipo del módulo como badge */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
              >
                {modulo.tipo}
              </span>
              {modulo.esEspecializadoIa && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.09 7.26L22 12l-7.91 2.74L12 22l-2.09-7.26L2 12l7.91-2.74z" />
                  </svg>
                  IA
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--texto-primario)" }}>
                Contenidos
              </p>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--texto-muted)" }}>
                {modulo.completados}/{modulo.totalItems}
              </span>
            </div>
            {/* Barra de progreso del módulo */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--gris-superficie)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progPct}%`, background: "linear-gradient(90deg, var(--azul-egm), var(--verde-oliva))" }} />
            </div>
          </div>
          <div className="py-2">
            {modulo.contenidos.map((c, i) => {
              const esActivo = c.id === activoId;
              const esBloqueado = c.bloqueado && !c.completado;
              const activeBorderColor = borderColorForTipo(c.tipo);
              return (
                <button
                  key={c.id}
                  onClick={() => !esBloqueado && setActivoId(c.id)}
                  disabled={esBloqueado}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    background: esActivo ? "var(--azul-egm-light)" : "transparent",
                    cursor: esBloqueado ? "not-allowed" : "pointer",
                    opacity: esBloqueado ? 0.4 : 1,
                    borderLeft: esActivo
                      ? `3px solid ${activeBorderColor}`
                      : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!esBloqueado && !esActivo) e.currentTarget.style.background = "var(--gris-pagina)"; }}
                  onMouseLeave={(e) => { if (!esActivo) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Estado */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      background: c.completado ? "var(--exito)" : esActivo ? "var(--azul-egm)" : "var(--gris-superficie)",
                      color: c.completado ? "var(--blanco)" : esActivo ? "var(--blanco)" : "var(--texto-muted)",
                    }}>
                    {c.completado ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : esBloqueado ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : String(i + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate"
                      style={{ color: esActivo ? "var(--azul-egm)" : "var(--texto-primario)" }}>
                      {c.titulo}
                    </p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--texto-secundario)" }}>
                      {c.tipo}{c.duracion ? ` · ${c.duracion}` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 min-w-0">

          {/* Banner módulo ya completado */}
          {progPct === 100 && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl mb-4"
              style={{ background: "var(--exito-light)", border: "1px solid var(--exito)" }}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--exito)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold" style={{ color: "var(--exito)" }}>
                Módulo completado — puedes revisar todo el contenido libremente
              </p>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden"
            style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>

            {/* Cabecera del item activo */}
            <div className="flex items-center gap-4 px-8 py-5"
              style={{ borderBottom: "1px solid var(--gris-borde)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                <IconoTipo tipo={activo.tipo} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold truncate" style={{ color: "var(--texto-primario)" }}>
                  {activo.titulo}
                </h2>
                <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--texto-muted)" }}>
                  {activo.tipo}{activo.duracion ? ` · ${activo.duracion}` : ""}
                </p>
              </div>
              {activo.completado && (
                <span className="text-[10px] font-bold px-3 py-1 rounded-full shrink-0"
                  style={{ background: "var(--exito-light)", color: "var(--exito)" }}>
                  Completado
                </span>
              )}
            </div>

            {/* Cuerpo según tipo */}
            <div className={activo.tipo === "pdf" ? "px-6 py-5" : "px-8 py-7"}>
              {activo.tipo === "texto" && (() => {
                // Si el ítem viene de JSON (admin), mostrar el contenido de esa página
                const desdeJson = paginasJson && activo.seccionIdx !== undefined && activo.seccionIdx >= 0
                  ? paginasJson[activo.seccionIdx] ?? null
                  : null;
                // Si no, buscar sección desde markdown con ##
                const seccion = !desdeJson && activo.seccionIdx !== undefined && activo.seccionIdx >= 0
                  ? secciones[activo.seccionIdx] ?? null
                  : null;
                const contenidoFinal = desdeJson
                  ? desdeJson.contenido
                  : seccion
                    ? seccion.contenido
                    : (moduloApi?.contenidoMarkdown ?? null);
                return <ContenidoTexto descripcion={moduloApi?.descripcion ?? modulo.descripcion} contenidoMarkdown={contenidoFinal} onVerificado={() => setVerificado(true)} />;
              })()}
              {activo.tipo === "video" && activo.subtipo === "podcast" && moduloApi?.scriptPodcast && <ContenidoPodcast script={moduloApi.scriptPodcast} audioUrl={moduloApi.podcastAudioUrl ?? undefined} onVerificado={() => setVerificado(true)} />}
              {activo.tipo === "video" && activo.subtipo === "slides" && moduloApi?.scriptVideo && <ContenidoSlides scriptVideoJson={moduloApi.scriptVideo} onVerificado={() => setVerificado(true)} />}
              {activo.tipo === "video" && !activo.subtipo && <ContenidoVideo onVerificado={() => setVerificado(true)} />}
              {activo.tipo === "pdf" && <ContenidoPDF url={moduloApi?.adjuntoUrl ?? undefined} nombre={moduloApi?.adjuntoNombre ?? undefined} onVerificado={() => setVerificado(true)} />}
              {activo.tipo === "quiz" && (() => {
                const desdeJson = paginasJson && activo.seccionIdx !== undefined && activo.seccionIdx >= 0
                  ? paginasJson[activo.seccionIdx] ?? null
                  : null;
                const preguntasJson = desdeJson?.preguntas
                  ? JSON.stringify(desdeJson.preguntas)
                  : (moduloApi?.testPreguntas ?? null);
                return <ContenidoQuiz onCompletar={marcarCompletado} testPreguntasJson={preguntasJson} />;
              })()}
            </div>

            {/* Footer — no aparece en quiz (tiene su propio CTA) */}
            {activo.tipo !== "quiz" && (
              <div className="flex items-center justify-between px-8 py-5"
                style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
                  {progPct === 100
                    ? "Módulo completado — revisando contenido"
                    : activo.completado
                      ? "Ya completaste este contenido — puedes revisarlo cuando quieras"
                      : verificado
                        ? "Contenido revisado. Puedes marcarlo como completado."
                        : activo.tipo === "texto" ? "Lee el contenido completo para poder completarlo"
                          : activo.subtipo === "podcast" ? "Escucha el podcast completo para poder completarlo"
                          : activo.subtipo === "slides" ? "Llega a la última diapositiva para poder completarlo"
                          : activo.tipo === "pdf" ? "Confirma que has leído el documento para poder completarlo"
                          : "Revisa el contenido para poder completarlo"}
                </p>
                {progPct < 100 && (
                  <button
                    onClick={marcarCompletado}
                    disabled={activo.completado || completando || (!verificado && !activo.completado)}
                    className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                    style={{
                      background: activo.completado ? "var(--exito-light)" : verificado ? "var(--azul-egm)" : "var(--gris-borde)",
                      color: activo.completado ? "var(--exito)" : verificado ? "var(--blanco)" : "var(--texto-muted)",
                      cursor: (!verificado && !activo.completado) ? "not-allowed" : "pointer",
                      opacity: completando ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (verificado && !activo.completado) e.currentTarget.style.background = "var(--azul-egm-hover)"; }}
                    onMouseLeave={(e) => { if (verificado && !activo.completado) e.currentTarget.style.background = "var(--azul-egm)"; }}
                  >
                    {completando ? "Guardando..." : activo.completado ? "Completado" : "Completado y continuar"}
                  </button>
                )}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

// ── SUBCOMPONENTES ────────────────────────────────────────────────────────────

function ProgresoCircular({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
      <circle cx="36" cy="36" r={r} fill="none"
        stroke="var(--verde-oliva-hover)" strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="36" y="40" textAnchor="middle"
        style={{ fontSize: "14px", fontWeight: 700, fill: "white", fontFamily: "'Playfair Display', serif" }}>
        {pct}%
      </text>
    </svg>
  );
}

function IconoTipo({ tipo, size = 16 }: { tipo: TipoContenido; size?: number }) {
  const s = { width: size, height: size };
  if (tipo === "texto") return (
    <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
  if (tipo === "video") return (
    <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (tipo === "pdf") return (
    <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
  return (
    <svg style={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function renderMarkdown(texto: string): React.ReactNode[] {
  const lineas = texto.split("\n");
  const elementos: React.ReactNode[] = [];
  let i = 0;
  while (i < lineas.length) {
    const linea = lineas[i];
    if (!linea.trim()) { i++; continue; }
    // Encabezados
    if (linea.startsWith("### ")) {
      elementos.push(<h3 key={i} className="text-base font-bold mt-6 mb-2" style={{ color: "var(--texto-primario)" }}>{linea.slice(4)}</h3>);
    } else if (linea.startsWith("## ")) {
      elementos.push(<h2 key={i} className="text-lg font-bold mt-8 mb-3" style={{ color: "var(--texto-primario)" }}>{linea.slice(3)}</h2>);
    } else if (linea.startsWith("# ")) {
      elementos.push(<h1 key={i} className="text-xl font-bold mt-8 mb-3" style={{ color: "var(--texto-primario)" }}>{linea.slice(2)}</h1>);
      // Listas
    } else if (linea.startsWith("- ") || linea.startsWith("* ")) {
      const items: string[] = [];
      while (i < lineas.length && (lineas[i].startsWith("- ") || lineas[i].startsWith("* "))) {
        items.push(lineas[i].slice(2));
        i++;
      }
      elementos.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 mb-4 space-y-1">
          {items.map((item, j) => (
            <li key={j} className="text-sm leading-relaxed" style={{ color: "var(--texto-secundario)" }}>{item}</li>
          ))}
        </ul>
      );
      continue;
      // Negritas simples (**texto**)
    } else {
      const formateado = linea.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      elementos.push(
        <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: "var(--texto-secundario)" }}
          dangerouslySetInnerHTML={{ __html: formateado }} />
      );
    }
    i++;
  }
  return elementos;
}

function ContenidoTexto({ descripcion, contenidoMarkdown, onVerificado }: { descripcion: string; contenidoMarkdown?: string | null; onVerificado?: () => void }) {
  const texto = contenidoMarkdown || descripcion;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const verificadoRef = React.useRef(false);

  const handleScroll = React.useCallback(() => {
    if (verificadoRef.current || !scrollRef.current) return;
    const el = scrollRef.current;
    const llegadoAlFinal = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
    if (llegadoAlFinal) { verificadoRef.current = true; onVerificado?.(); }
  }, [onVerificado]);

  // Si el contenido es corto y no hay scroll, verificar al montar
  React.useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    if (el.scrollHeight <= el.clientHeight + 40) { onVerificado?.(); }
  }, [texto, onVerificado]);

  if (!texto) {
    return (
      <p className="text-sm leading-relaxed" style={{ color: "var(--texto-muted)" }}>
        Este módulo no tiene descripción. El administrador puede añadir contenido editando el módulo.
      </p>
    );
  }
  return (
    <div ref={scrollRef} onScroll={handleScroll}
      className="prose-sm max-w-none overflow-y-auto pr-1"
      style={{ maxHeight: "55vh" }}>
      {renderMarkdown(texto)}
      <div className="h-4" />
    </div>
  );
}

function ContenidoVideo({ onVerificado }: { onVerificado?: () => void }) {
  const [visto, setVisto] = React.useState(false);
  return (
    <div>
      <div className="rounded-2xl overflow-hidden mb-6 flex items-center justify-center"
        style={{ background: "var(--marino)", aspectRatio: "16/9", border: "1px solid var(--gris-borde)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)" }}>
            <svg className="w-7 h-7 ml-1" fill="white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            Vídeo formativo · 12 min
          </p>
        </div>
      </div>
      {!visto && (
        <button onClick={() => { setVisto(true); onVerificado?.(); }}
          className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2"
          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
          He visto el video completo
        </button>
      )}
    </div>
  );
}

// ── PODCAST ──────────────────────────────────────────────────────────────────
function ContenidoPodcast({ script, audioUrl, onVerificado }: { script: string; audioUrl?: string; onVerificado?: () => void }) {
  const tieneAudioReal = !!audioUrl;
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [reproduciendo, setReproduciendo] = React.useState(false);
  const [pausado, setPausado] = React.useState(false);
  const [progreso, setProgreso] = React.useState(0);
  const [duracion, setDuracion] = React.useState(0);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const seg = Math.floor(s % 60);
    return `${m}:${seg.toString().padStart(2, "0")}`;
  };

  // ── Controles para <audio> nativo ─────────────────────────────────────────
  const iniciarAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.play();
    setReproduciendo(true); setPausado(false);
    onVerificado?.();
  };
  const pausarAudio = () => {
    if (!audioRef.current) return;
    if (!audioRef.current.paused) { audioRef.current.pause(); setPausado(true); }
    else { audioRef.current.play(); setPausado(false); }
  };
  const detenerAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause(); audioRef.current.currentTime = 0;
    setReproduciendo(false); setPausado(false);
    setProgreso(0);
  };
  const actualizarProgreso = () => {
    if (audioRef.current) {
      setProgreso(audioRef.current.currentTime);
      setDuracion(audioRef.current.duration || 0);
    }
  };

  // ── Controles para Web Speech API (fallback) ───────────────────────────────
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const progresoIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const iniciarSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = "es-ES"; utterance.rate = 0.95; utterance.pitch = 1;
    utterance.onend = () => {
      setReproduciendo(false); setPausado(false);
      setProgreso(1);
      if (progresoIntervalRef.current) clearInterval(progresoIntervalRef.current);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setReproduciendo(true); setPausado(false);
    setDuracion(1);
    // Estimar progreso: el Speech API no expone tiempo, simulamos con un intervalo
    const palabras = script.split(/\s+/).length;
    const estimadoSeg = (palabras / 150) * 60;
    const inicio = Date.now();
    if (progresoIntervalRef.current) clearInterval(progresoIntervalRef.current);
    progresoIntervalRef.current = setInterval(() => {
      const transcurrido = (Date.now() - inicio) / 1000;
      setProgreso(Math.min(transcurrido / estimadoSeg, 0.98));
    }, 250);
    onVerificado?.();
  };
  const pausarSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause(); setPausado(true);
      if (progresoIntervalRef.current) clearInterval(progresoIntervalRef.current);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume(); setPausado(false);
      // Reanudar intervalo
      if (progresoIntervalRef.current) clearInterval(progresoIntervalRef.current);
      const palabras = script.split(/\s+/).length;
      const estimadoSeg = (palabras / 150) * 60;
      const restante = (1 - progreso) * estimadoSeg;
      const reanudado = Date.now();
      progresoIntervalRef.current = setInterval(() => {
        const transcurrido = (Date.now() - reanudado) / 1000;
        setProgreso((p) => Math.min(p + transcurrido / restante * 0.05, 0.98));
      }, 250);
    }
  };
  const detenerSpeech = () => {
    window.speechSynthesis.cancel();
    setReproduciendo(false); setPausado(false);
    setProgreso(0);
    if (progresoIntervalRef.current) clearInterval(progresoIntervalRef.current);
  };

  React.useEffect(() => () => {
    if (progresoIntervalRef.current) clearInterval(progresoIntervalRef.current);
  }, []);

  const iniciar = tieneAudioReal ? iniciarAudio : iniciarSpeech;
  const pausar = tieneAudioReal ? pausarAudio : pausarSpeech;
  const detener = tieneAudioReal ? detenerAudio : detenerSpeech;
  const pct = tieneAudioReal && duracion > 0 ? progreso / duracion : progreso;
  const tiempoActual = tieneAudioReal ? formatTime(progreso) : "";
  const tiempoTotal = tieneAudioReal ? formatTime(duracion) : "";

  return (
    <div>
      {tieneAudioReal && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={actualizarProgreso}
          onLoadedMetadata={actualizarProgreso}
          onEnded={() => { setReproduciendo(false); setPausado(false); setProgreso(0); }}
          onPlay={() => { setReproduciendo(true); setPausado(false); }}
          onPause={() => setPausado(true)}
          preload="metadata"
        />
      )}
      <div className="rounded-2xl p-6 mb-6 flex flex-col gap-4"
        style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)", border: "1px solid #4338ca" }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
            <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Podcast del módulo</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {tieneAudioReal ? "Narrado por IA con ElevenLabs" : "Narrado por IA"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!reproduciendo ? (
            <button onClick={iniciar} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "#6366f1", color: "#fff", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Reproducir
            </button>
          ) : (
            <>
              <button onClick={pausar} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                {pausado
                  ? <><svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>Reanudar</>
                  : <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>Pausar</>}
              </button>
              <button onClick={detener} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                Detener
              </button>
            </>
          )}
          {reproduciendo && !pausado && (
            <div className="flex items-end gap-0.5 h-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-1 rounded-full"
                  style={{ background: "#818cf8", animation: `eq${i} ${0.5 + i * 0.15}s ease-in-out infinite alternate`, height: `${8 + i * 3}px` }} />
              ))}
              <style>{`${[1, 2, 3, 4, 5].map((i) => `@keyframes eq${i}{from{transform:scaleY(0.4)}to{transform:scaleY(1)}}`).join("")}`}</style>
            </div>
          )}
        </div>
        {/* Barra de progreso (solo visual, sin interacción) */}
        {(reproduciendo || pausado) && (
          <div className="w-full">
            <div className="relative w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", pointerEvents: "none" }}>
              <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.min(pct * 100, 100)}%`, background: "linear-gradient(90deg,#818cf8,#6366f1)" }} />
            </div>
            {tieneAudioReal && (
              <div className="flex justify-between mt-1">
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{tiempoActual}</span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{tiempoTotal}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="rounded-xl p-5" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--texto-muted)" }}>TRANSCRIPCIÓN</p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texto-secundario)" }}>{script}</p>
      </div>
    </div>
  );
}

// ── SLIDES VIDEO ─────────────────────────────────────────────────────────────
interface Slide { numero: number; titulo: string; contenido: string; notas?: string; }

function ContenidoSlides({ scriptVideoJson, onVerificado }: { scriptVideoJson: string; onVerificado?: () => void }) {
  const slides: Slide[] = React.useMemo(() => {
    try { return JSON.parse(scriptVideoJson) as Slide[]; } catch { return []; }
  }, [scriptVideoJson]);
  const [idx, setIdx] = React.useState(0);
  const verificadoRef = React.useRef(false);

  React.useEffect(() => {
    if (slides.length > 0 && idx === slides.length - 1 && !verificadoRef.current) {
      verificadoRef.current = true;
      onVerificado?.();
    }
  }, [idx, slides.length, onVerificado]);

  React.useEffect(() => {
    if (slides.length === 1 && !verificadoRef.current) {
      verificadoRef.current = true;
      onVerificado?.();
    }
  }, [slides.length, onVerificado]);

  if (slides.length === 0) return <p className="text-sm" style={{ color: "var(--texto-muted)" }}>No hay slides disponibles.</p>;
  const slide = slides[idx];
  return (
    <div>
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid var(--gris-borde)" }}>
        <div className="px-6 py-3 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,var(--marino) 0%,#1e3a5f 100%)" }}>
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Slide {slide.numero} / {slides.length}</span>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className="w-2 h-2 rounded-full transition-all"
                style={{ background: i === idx ? "#fff" : "rgba(255,255,255,0.25)" }} />
            ))}
          </div>
        </div>
        <div className="px-8 py-10 min-h-[220px] flex flex-col justify-center"
          style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)" }}>
          <h2 className="text-xl font-bold text-white mb-4">{slide.titulo}</h2>
          <div className="flex flex-col gap-2">
            {(Array.isArray(slide.contenido)
              ? slide.contenido
              : String(slide.contenido).split("\n").filter(Boolean)
            ).map((line: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#6366f1" }} />
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>{String(line).replace(/^[-•*]\s*/, "")}</p>
              </div>
            ))}
          </div>
        </div>
        {slide.notas && (
          <div className="px-6 py-3" style={{ background: "var(--gris-pagina)", borderTop: "1px solid var(--gris-borde)" }}>
            <p className="text-xs" style={{ color: "var(--texto-muted)" }}><span className="font-semibold">Notas: </span>{slide.notas}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button onClick={() => setIdx((p) => Math.max(0, p - 1))} disabled={idx === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: idx === 0 ? "var(--gris-superficie)" : "var(--blanco)", color: idx === 0 ? "var(--texto-muted)" : "var(--texto-primario)", border: "1px solid var(--gris-borde)" }}>
          ← Anterior
        </button>
        <span className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>{idx + 1} de {slides.length}</span>
        <button onClick={() => setIdx((p) => Math.min(slides.length - 1, p + 1))} disabled={idx === slides.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: idx === slides.length - 1 ? "var(--gris-superficie)" : "var(--azul-egm)", color: idx === slides.length - 1 ? "var(--texto-muted)" : "#fff" }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

function ContenidoPDF({ url, nombre, onVerificado }: { url?: string; nombre?: string; onVerificado?: () => void }) {
  const [leido, setLeido] = React.useState(false);
  const displayNombre = nombre ?? "Documento adjunto";

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <p className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>
          No hay documento adjunto en este módulo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra superior: nombre + botón descargar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--error-light)", color: "var(--error)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
            {displayNombre}
          </p>
        </div>
        <a href={url} download={nombre ?? true}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg shrink-0"
          style={{ background: "var(--azul-egm)", color: "#fff", boxShadow: "0 2px 8px rgba(27,63,126,0.18)" }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar
        </a>
      </div>

      {/* Visor PDF incrustado */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)", height: "68vh", minHeight: "480px" }}>
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          className="w-full h-full"
          title={displayNombre}
          style={{ display: "block", border: "none" }}
        />
      </div>

      {/* Confirmar lectura */}
      {!leido ? (
        <button
          onClick={() => { setLeido(true); onVerificado?.(); }}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "1px solid var(--azul-egm)" }}>
          He leído el documento completo
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: "var(--exito-light)", border: "1px solid var(--exito)" }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--exito)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-semibold" style={{ color: "var(--exito)" }}>Documento confirmado como leído</p>
        </div>
      )}
    </div>
  );
}

const LETRAS = ["A", "B", "C", "D"];

interface PreguntaQuiz { id: string; texto: string; opciones: string[]; correcta: number; }

function ContenidoQuiz({ onCompletar, testPreguntasJson }: { onCompletar: () => void; testPreguntasJson: string | null }) {
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [enviado, setEnviado] = useState(false);

  const PREGUNTAS: PreguntaQuiz[] = (() => {
    if (testPreguntasJson) {
      try {
        const parsed = JSON.parse(testPreguntasJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((q: any, i: number) => ({
            id: `q${i + 1}`,
            texto: q.texto ?? q.pregunta ?? `Pregunta ${i + 1}`,
            opciones: q.opciones ?? [],
            correcta: q.correcta ?? 0,
          }));
        }
      } catch { /* fallback */ }
    }
    return [];
  })();

  if (PREGUNTAS.length === 0) {
    return <p className="text-sm py-4" style={{ color: "var(--texto-muted)" }}>No hay preguntas disponibles para este test.</p>;
  }

  const todasRespondidas = Object.keys(respuestas).length >= PREGUNTAS.length;
  const correctas = enviado ? PREGUNTAS.filter((p) => respuestas[p.id] === p.correcta).length : 0;
  const aprobado = correctas >= Math.ceil(PREGUNTAS.length * 0.6);

  return (
    <div className="flex flex-col gap-6">
      {PREGUNTAS.map((p, pi) => {
        const respondida = respuestas[p.id] !== undefined;
        const respSel = respuestas[p.id];
        return (
          <div key={p.id}>
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--texto-primario)" }}>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2 shrink-0"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                {pi + 1}
              </span>
              {p.texto}
            </p>
            <div className="flex flex-col gap-2">
              {p.opciones.map((op, oi) => {
                const sel = respSel === oi;
                const esCorrecta = oi === p.correcta;
                let bg = sel ? "var(--azul-egm-light)" : "var(--gris-pagina)";
                let border = sel ? "var(--azul-egm)" : "var(--gris-borde)";
                let color = sel ? "var(--azul-egm)" : "var(--texto-primario)";
                if (enviado) {
                  if (esCorrecta) { bg = "#f0fdf4"; border = "#16a34a"; color = "#15803d"; }
                  else if (sel && !esCorrecta) { bg = "#fef2f2"; border = "#dc2626"; color = "#dc2626"; }
                  else { bg = "var(--gris-pagina)"; border = "var(--gris-borde)"; color = "var(--texto-muted)"; }
                }
                return (
                  <button key={oi}
                    onClick={() => !enviado && setRespuestas((r) => ({ ...r, [p.id]: oi }))}
                    disabled={enviado}
                    className="text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{ border: `1.5px solid ${border}`, background: bg, color, cursor: enviado ? "default" : "pointer" }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: sel && !enviado ? "var(--azul-egm)" : enviado && esCorrecta ? "#16a34a" : enviado && sel ? "#dc2626" : "var(--gris-superficie)", color: (sel || (enviado && esCorrecta)) ? "var(--blanco)" : "var(--texto-muted)" }}>
                      {enviado && esCorrecta ? <i className="bi bi-check-lg" style={{ fontSize: "14px" }} /> : enviado && sel && !esCorrecta ? <i className="bi bi-x-lg" style={{ fontSize: "12px" }} /> : LETRAS[oi]}
                    </span>
                    {op}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Resultado tras enviar */}
      {enviado && (
        <div className="rounded-xl px-5 py-4 flex items-center justify-between"
          style={{ background: aprobado ? "#f0fdf4" : "#fef2f2", border: `1.5px solid ${aprobado ? "#86efac" : "#fca5a5"}` }}>
          <div>
            <p className="text-sm font-bold" style={{ color: aprobado ? "#15803d" : "#dc2626" }}>
              {aprobado ? "Test superado" : "No superado — inténtalo de nuevo"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: aprobado ? "#16a34a" : "#ef4444" }}>
              {correctas} de {PREGUNTAS.length} respuestas correctas
            </p>
          </div>
          {aprobado ? (
            <button onClick={onCompletar}
              className="px-4 py-2 rounded-xl text-sm font-bold shrink-0"
              style={{ background: "#16a34a", color: "#fff" }}>
              Completar módulo
            </button>
          ) : (
            <button onClick={() => { setEnviado(false); setRespuestas({}); }}
              className="px-4 py-2 rounded-xl text-sm font-bold shrink-0"
              style={{ background: "var(--azul-egm)", color: "#fff" }}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* Botón enviar */}
      {!enviado && (
        <button onClick={() => setEnviado(true)} disabled={!todasRespondidas}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all"
          style={{ background: todasRespondidas ? "var(--azul-egm)" : "var(--gris-borde)", color: todasRespondidas ? "#fff" : "var(--texto-muted)", cursor: todasRespondidas ? "pointer" : "not-allowed" }}
          onMouseEnter={(e) => { if (todasRespondidas) e.currentTarget.style.background = "var(--azul-egm-hover)"; }}
          onMouseLeave={(e) => { if (todasRespondidas) e.currentTarget.style.background = "var(--azul-egm)"; }}>
          Enviar respuestas
        </button>
      )}
    </div>
  );
}
