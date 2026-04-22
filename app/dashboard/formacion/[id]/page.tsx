"use client";

/**
 * Página de detalle de módulo formativo
 * Ruta: /dashboard/formacion/[id]
 * Archivo: app/dashboard/formacion/[id]/page.tsx
 */

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch, API_URL } from "@/lib/api";

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type TipoContenido = "texto" | "video" | "pdf" | "quiz";

interface Contenido {
  id:         string;
  titulo:     string;
  tipo:       TipoContenido;
  subtipo?:   "podcast" | "slides";
  duracion?:  string;
  completado: boolean;
  bloqueado:  boolean;
}

interface ModuloMock {
  id:               string;
  nombre:           string;
  descripcion:      string;
  tipo:             string;
  totalItems:       number;
  completados:      number;
  esEspecializadoIa: boolean;
  contenidos:       Contenido[];
}

// ── MÓDULO REAL (API) ─────────────────────────────────────────────────────────
interface ModuloAPI {
  moduloId:         string;
  nombre:           string;
  descripcion:      string | null;
  tipoModulo:       string;
  idioma:           string | null;
  duracion:         string | null;
  audiencia:        string | null;
  esEspecializadoIa: boolean;
  testPreguntas:    string | null;
  scriptPodcast:    string | null;
  scriptVideo:      string | null;
  podcastAudioUrl:  string | null;
  tiposSalida:      string | null;
  activo:           boolean;
}

const TIPO_LABEL: Record<string, string> = {
  GENERAL:         "General",
  ESPECIALIZADO:   "Específico",
  ESPECIALIZADO_IA:"Generado con IA",
  CUMPLIMIENTO:    "Cumplimiento normativo",
  ONBOARDING:      "Onboarding",
};

// ── IMÁGENES POR MÓDULO ───────────────────────────────────────────────────────
const FORMACION_IMG_BY_ID: Record<string, string> = {
  "1": "/background-formacion-empleado.jpg",
  "2": "/comunicacion-trabajo.jpg",
  "3": "/herramientas-digitales.jpg",
  "4": "/negociacion-habilidades.jpg",
  "5": "/ciberseguridad-datos.jpg",
  "6": "/metodologias-agiles.jpg",
  "7": "/diversidad.jpg",
};

const FORMACION_IMG_BY_NAME: Array<{ keywords: string[]; imagen: string }> = [
  { keywords: ["incorporac", "bienvenid"],              imagen: "/background-formacion-empleado.jpg" },
  { keywords: ["comunicac", "efectiva"],                imagen: "/comunicacion-trabajo.jpg" },
  { keywords: ["herramienta", "digital", "colaborat"],  imagen: "/herramientas-digitales.jpg" },
  { keywords: ["negociaci", "habilidad", "directiv"],   imagen: "/negociacion-habilidades.jpg" },
  { keywords: ["cibersegur", "datos", "rgpd"],          imagen: "/ciberseguridad-datos.jpg" },
  { keywords: ["metodolog", "agil", "scrum", "kanban"], imagen: "/metodologias-agiles.jpg" },
  { keywords: ["diversidad", "inclusi"],                imagen: "/diversidad.jpg" },
];

function getHeroImg(id: string, nombre: string): string {
  if (FORMACION_IMG_BY_ID[id]) return FORMACION_IMG_BY_ID[id];
  const lower = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return FORMACION_IMG_BY_NAME.find((e) => e.keywords.some((kw) => lower.includes(kw)))?.imagen
    ?? "/background-formacion-empleado.jpg";
}

// ── MOCK ─────────────────────────────────────────────────────────────────────
// Mapa de módulos mock — cubre los IDs del listado de formación
const MOCKS: Record<string, Pick<ModuloMock, "nombre" | "descripcion" | "tipo" | "esEspecializadoIa">> = {
  "1": { nombre: "Incorporación y Bienvenida a Atalayas",         descripcion: "Conoce la empresa, sus valores y procedimientos de incorporación al área.", tipo: "Identidad Corporativa",  esEspecializadoIa: false },
  "2": { nombre: "Comunicación Efectiva en el Trabajo",            descripcion: "Estrategias para mejorar la comunicación interna y externa con tu equipo.",   tipo: "Desarrollo Profesional", esEspecializadoIa: false },
  "3": { nombre: "Introducción a Herramientas Digitales",          descripcion: "Uso de las plataformas y herramientas digitales del área empresarial.",      tipo: "Formación Básica",       esEspecializadoIa: false },
  "4": { nombre: "Negociación y Habilidades Directivas",           descripcion: "Técnicas avanzadas de negociación para entornos empresariales exigentes.",    tipo: "Formación Específica",   esEspecializadoIa: true  },
  "5": { nombre: "Ciberseguridad y Protección de Datos",           descripcion: "Buenas prácticas de seguridad informática y cumplimiento del RGPD.",          tipo: "Formación Básica",       esEspecializadoIa: false },
  "6": { nombre: "Gestión de Proyectos con Metodologías Ágiles",   descripcion: "Scrum, Kanban y otras metodologías para gestionar equipos de forma eficaz.",  tipo: "Desarrollo Profesional", esEspecializadoIa: true  },
  "7": { nombre: "Diversidad e Inclusión en la Empresa",           descripcion: "Cultura inclusiva y gestión de la diversidad en el entorno laboral.",          tipo: "Comunidad",              esEspecializadoIa: false },
};

function buildContenidos(moduloApi: ModuloAPI): Contenido[] {
  const tipos = moduloApi.tiposSalida ? moduloApi.tiposSalida.split(",") : ["documentacion"];
  const items: Contenido[] = [];
  let idx = 1;
  const durLabel = moduloApi.duracion === "corto" ? "−15 min" : moduloApi.duracion === "largo" ? "+45 min" : "15–45 min";

  if (tipos.includes("documentacion")) {
    items.push({ id: `c${idx++}`, titulo: "Documentación del módulo", tipo: "texto", duracion: durLabel, completado: false, bloqueado: false });
  }
  if (tipos.includes("podcast") && moduloApi.scriptPodcast) {
    items.push({ id: `c${idx++}`, titulo: "Podcast — Narración de audio", tipo: "video", subtipo: "podcast", duracion: "5–10 min", completado: false, bloqueado: items.length > 0 });
  }
  if (tipos.includes("video") && moduloApi.scriptVideo) {
    items.push({ id: `c${idx++}`, titulo: "Video — Presentación de slides", tipo: "video", subtipo: "slides", duracion: "8–12 min", completado: false, bloqueado: items.length > 0 });
  }
  if (items.length === 0) {
    items.push({ id: `c${idx++}`, titulo: "Descripción y contenido", tipo: "texto", duracion: durLabel, completado: false, bloqueado: false });
  }
  if (moduloApi.testPreguntas) {
    items.push({ id: `c${idx++}`, titulo: "Test de evaluación", tipo: "quiz", duracion: "10–15 min", completado: false, bloqueado: true });
  }

  return items;
}

function apiToMock(moduloApi: ModuloAPI): ModuloMock {
  const contenidos = buildContenidos(moduloApi);
  return {
    id:               moduloApi.moduloId,
    nombre:           moduloApi.nombre,
    descripcion:      moduloApi.descripcion ?? "",
    tipo:             TIPO_LABEL[moduloApi.tipoModulo] ?? moduloApi.tipoModulo,
    esEspecializadoIa: moduloApi.esEspecializadoIa,
    totalItems:       contenidos.length,
    completados:      0,
    contenidos,
  };
}

// Fallback para módulos legacy (IDs numéricos del mock original)
function getMockBase(id: string): ModuloMock {
  const meta = MOCKS[id] ?? {
    nombre:            "Módulo de Formación",
    descripcion:       "Completa todos los pasos para obtener tu certificado.",
    tipo:              "Formación",
    esEspecializadoIa: false,
  };
  return {
    id,
    nombre:            meta.nombre,
    descripcion:       meta.descripcion,
    tipo:              meta.tipo,
    esEspecializadoIa: meta.esEspecializadoIa ?? false,
    totalItems:        5,
    completados:       0,
    contenidos: [
      { id: "c1", titulo: "Introducción y conceptos clave",    tipo: "texto", duracion: "5 min",  completado: false, bloqueado: false },
      { id: "c2", titulo: "Desarrollo del tema principal",      tipo: "video", duracion: "12 min", completado: false, bloqueado: true  },
      { id: "c3", titulo: "Casos prácticos y aplicación",      tipo: "texto", duracion: "8 min",  completado: false, bloqueado: true  },
      { id: "c4", titulo: "Documentación y recursos",           tipo: "pdf",   duracion: "10 min", completado: false, bloqueado: true  },
      { id: "c5", titulo: "Evaluación final del módulo",        tipo: "quiz",  duracion: "15 min", completado: false, bloqueado: true  },
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

function guardarEstado(id: string, completados: string[], activoId: string) {
  try { localStorage.setItem(lsKey(id), JSON.stringify({ completados, activoId })); }
  catch { /* noop */ }
}

function aplicarEstado(base: ModuloMock, completados: string[]): ModuloMock {
  const set = new Set(completados);
  const contenidos = base.contenidos.map((c, i) => ({
    ...c,
    completado: set.has(c.id),
    bloqueado:  i > 0 && !set.has(base.contenidos[i - 1].id),
  }));
  return { ...base, completados: completados.length, contenidos };
}

// ── PÁGINA ────────────────────────────────────────────────────────────────────
export default function Page() {
  const router  = useRouter();
  const rawParams = useParams();
  const id      = Array.isArray(rawParams.id) ? rawParams.id[0] : (rawParams.id ?? "");

  const [modulo,      setModulo]      = useState<ModuloMock | null>(null);
  const [moduloApi,   setModuloApi]   = useState<ModuloAPI | null>(null);
  const [activoId,    setActivoId]    = useState<string>("c1");
  const [completando, setCompletando] = useState(false);

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
          setModulo(aplicarEstado(base, completados));
          setActivoId(savedActivo);
          return;
        }
      } catch { /* fallback */ }
      // Fallback: datos mock legacy
      const { completados, activoId: savedActivo } = cargarEstado(id);
      setModulo(aplicarEstado(getMockBase(id), completados));
      setActivoId(savedActivo);
    };
    cargar();
  }, [id]);

  // Persistir en localStorage cuando cambia el estado
  useEffect(() => {
    if (!id || !modulo) return;
    const hechos = modulo.contenidos.filter((c) => c.completado).map((c) => c.id);
    guardarEstado(id, hechos, activoId);
  }, [modulo, activoId]);

  if (!modulo) return null;

  const activo  = modulo.contenidos.find((c) => c.id === activoId) ?? modulo.contenidos[0];
  const progPct = Math.round((modulo.completados / modulo.totalItems) * 100);

  const marcarCompletado = () => {
    if (activo.completado) return;
    setCompletando(true);
    setTimeout(() => {
      const idx = modulo.contenidos.findIndex((c) => c.id === activoId);
      const siguiente = modulo.contenidos[idx + 1];
      setModulo((m) => m ? ({
        ...m,
        completados: m.completados + 1,
        contenidos: m.contenidos.map((c, i) => {
          if (c.id === activoId) return { ...c, completado: true };
          if (i === idx + 1)     return { ...c, bloqueado: false };
          return c;
        }),
      }) : null);
      if (siguiente) setActivoId(siguiente.id);
      setCompletando(false);
    }, 600);
  };

  // Color del borde lateral por tipo de contenido
  const borderColorForTipo = (tipo: TipoContenido) => {
    switch (tipo) {
      case "texto": return "#3b82f6"; // blue
      case "video": return "#a855f7"; // purple
      case "pdf":   return "#ef4444"; // red
      case "quiz":  return "#f97316"; // orange
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden flex items-center"
        style={{ minHeight: "320px", boxShadow: "0 6px 32px rgba(0,0,0,0.22)" }}
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
        <div className="relative z-10 w-full py-14">
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
              fontSize:      "clamp(2.2rem, 4vw, 3rem)",
              fontFamily:    "var(--font-poppins), sans-serif",
              fontWeight:    700,
              letterSpacing: "-0.02em",
              maxWidth:      "820px",
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
          className="w-[22rem] shrink-0 self-start sticky top-6 rounded-2xl overflow-hidden"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
        >
          <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
            {/* Tipo del módulo como badge */}
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
              style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
            >
              {modulo.tipo}
            </span>
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
              const esActivo    = c.id === activoId;
              const esBloqueado = c.bloqueado && !c.completado;
              const activeBorderColor = borderColorForTipo(c.tipo);
              return (
                <button
                  key={c.id}
                  onClick={() => !esBloqueado && setActivoId(c.id)}
                  disabled={esBloqueado}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{
                    background:  esActivo    ? "var(--azul-egm-light)" : "transparent",
                    cursor:      esBloqueado ? "not-allowed"           : "pointer",
                    opacity:     esBloqueado ? 0.4                     : 1,
                    borderLeft:  esActivo
                      ? `3px solid ${activeBorderColor}`
                      : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!esBloqueado && !esActivo) e.currentTarget.style.background = "var(--gris-pagina)"; }}
                  onMouseLeave={(e) => { if (!esActivo) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Estado */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      background: c.completado ? "var(--exito)"           : esActivo ? "var(--azul-egm)"    : "var(--gris-superficie)",
                      color:      c.completado ? "var(--blanco)"          : esActivo ? "var(--blanco)"      : "var(--texto-muted)",
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
            <div className="px-8 py-7">
              {activo.tipo === "texto" && <ContenidoTexto descripcion={moduloApi?.descripcion ?? modulo.descripcion} />}
              {activo.tipo === "video" && activo.subtipo === "podcast" && moduloApi?.scriptPodcast && <ContenidoPodcast script={moduloApi.scriptPodcast} audioUrl={moduloApi.podcastAudioUrl ?? undefined} />}
              {activo.tipo === "video" && activo.subtipo === "slides"  && moduloApi?.scriptVideo  && <ContenidoSlides scriptVideoJson={moduloApi.scriptVideo} />}
              {activo.tipo === "video" && !activo.subtipo && <ContenidoVideo />}
              {activo.tipo === "pdf"   && <ContenidoPDF />}
              {activo.tipo === "quiz"  && <ContenidoQuiz onCompletar={marcarCompletado} testPreguntasJson={moduloApi?.testPreguntas ?? null} />}
            </div>

            {/* Footer — no aparece en quiz (tiene su propio CTA) */}
            {activo.tipo !== "quiz" && (
              <div className="flex items-center justify-between px-8 py-5"
                style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
                  {activo.completado ? "Ya completaste este contenido" : "Marca como completado para desbloquear el siguiente"}
                </p>
                <button
                  onClick={marcarCompletado}
                  disabled={activo.completado || completando}
                  className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                  style={{
                    background: activo.completado ? "var(--exito-light)" : "var(--azul-egm)",
                    color:      activo.completado ? "var(--exito)"       : "var(--blanco)",
                  }}
                  onMouseEnter={(e) => { if (!activo.completado) e.currentTarget.style.background = "var(--azul-egm-hover)"; }}
                  onMouseLeave={(e) => { if (!activo.completado) e.currentTarget.style.background = "var(--azul-egm)"; }}
                >
                  {completando ? "Guardando..." : activo.completado ? "✓ Completado" : "Completado y continuar →"}
                </button>
              </div>
            )}
          </div>

          {/* IA Assistant — solo en módulos especializados IA */}
          {modulo.esEspecializadoIa && (
            <div className="mt-6">
              <AsistenteIA contenidoTitulo={activo.titulo} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── ASISTENTE IA ──────────────────────────────────────────────────────────────

function getMockIAData(titulo: string): {
  resumen: string[];
  preguntas: { pregunta: string; respuesta: string }[];
} {
  // Vary mocks slightly based on the content title
  if (titulo.toLowerCase().includes("evaluación") || titulo.toLowerCase().includes("quiz")) {
    return {
      resumen: [
        "Esta evaluación pone a prueba los conocimientos adquiridos a lo largo del módulo.",
        "Se requiere un mínimo de aciertos para superar la prueba y obtener el certificado.",
        "Revisa los contenidos anteriores antes de intentar la evaluación final.",
      ],
      preguntas: [
        { pregunta: "¿Cuántos intentos tengo para aprobar?", respuesta: "Puedes intentarlo tantas veces como necesites. Cada intento reinicia las preguntas para que puedas practicar sin límite." },
        { pregunta: "¿Qué pasa si no apruebo?", respuesta: "Si no superas la evaluación, puedes repasar el material y volver a intentarlo. No hay penalización por los intentos fallidos." },
        { pregunta: "¿Se guarda mi progreso automáticamente?", respuesta: "Sí, el progreso se guarda en tu navegador. Si cierras la página y vuelves, encontrarás el módulo en el mismo estado." },
      ],
    };
  }
  if (titulo.toLowerCase().includes("video")) {
    return {
      resumen: [
        "El vídeo presenta los conceptos fundamentales del módulo de forma visual y práctica.",
        "Se incluyen demostraciones reales del entorno empresarial de Atalayas.",
        "Toma nota de los puntos clave que se resaltan durante la reproducción.",
      ],
      preguntas: [
        { pregunta: "¿Puedo ver el vídeo varias veces?", respuesta: "Sí, puedes reproducir el vídeo cuantas veces necesites antes de marcarlo como completado." },
        { pregunta: "¿Hay subtítulos disponibles?", respuesta: "El vídeo incluye subtítulos en castellano. Puedes activarlos desde los controles del reproductor." },
        { pregunta: "¿El contenido del vídeo entra en el quiz?", respuesta: "Sí, los conceptos presentados en el vídeo son la base de la evaluación final del módulo." },
      ],
    };
  }
  // Default for texto, pdf, and anything else
  return {
    resumen: [
      "Este contenido cubre los fundamentos teóricos esenciales del módulo.",
      "Se abordan casos prácticos aplicables directamente al entorno de Atalayas.",
      "Presta especial atención a los recuadros de \"Punto clave\" que resumen lo más importante.",
    ],
    preguntas: [
      { pregunta: "¿Qué conceptos son más importantes de este contenido?", respuesta: "Los puntos clave destacados en recuadros azules contienen los conceptos que con más frecuencia aparecen en la evaluación final. Te recomendamos anotarlos." },
      { pregunta: "¿Puedo volver a este contenido después de completarlo?", respuesta: "Sí, una vez completado puedes acceder al contenido en cualquier momento desde el índice lateral para repasar." },
      { pregunta: "¿Hay material complementario disponible?", respuesta: "En el apartado de documentación encontrarás recursos adicionales en PDF con información ampliada sobre los temas tratados." },
    ],
  };
}

function AsistenteIA({ contenidoTitulo }: { contenidoTitulo: string }) {
  const [open, setOpen]                       = useState(true);
  const [preguntaActiva, setPreguntaActiva]   = useState<number | null>(null);
  const [inputVal, setInputVal]               = useState("");
  const [respuesta, setRespuesta]             = useState("");

  const { resumen, preguntas } = getMockIAData(contenidoTitulo);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    setRespuesta("Estoy procesando tu consulta sobre \"" + inputVal.trim() + "\"… Dame un momento.");
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid #e9d5ff" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white text-lg leading-none select-none">✦</span>
          <span className="text-sm font-bold text-white">Asistente IA</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.18)", color: "white", letterSpacing: "0.05em" }}
          >
            BETA
          </span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-white transition-opacity"
          style={{ opacity: 0.75 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
          aria-label={open ? "Colapsar asistente" : "Expandir asistente"}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            }
          </svg>
        </button>
      </div>

      {/* Body */}
      {open && (
        <div
          className="flex flex-col gap-5 px-5 py-4"
          style={{ background: "white" }}
        >
          {/* Resumen IA */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--texto-muted)" }}>
              Resumen del contenido
            </p>
            <ul className="flex flex-col gap-2">
              {resumen.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm font-bold shrink-0" style={{ color: "#7c3aed" }}>•</span>
                  <span className="text-sm" style={{ color: "var(--texto-secundario)" }}>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Preguntas sugeridas */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--texto-muted)" }}>
              Preguntas frecuentes
            </p>
            <div className="flex flex-col gap-2">
              {preguntas.map((item, i) => {
                const isActive = preguntaActiva === i;
                return (
                  <div key={i}>
                    <button
                      onClick={() => setPreguntaActiva(isActive ? null : i)}
                      className="text-xs px-3 py-2 rounded-full border transition-all text-left"
                      style={{
                        background:   isActive ? "#7c3aed"              : "transparent",
                        color:        isActive ? "white"                : "var(--texto-primario)",
                        borderColor:  isActive ? "#7c3aed"              : "#e9d5ff",
                        fontWeight:   isActive ? 600                    : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background   = "#faf5ff";
                          e.currentTarget.style.borderColor  = "#a855f7";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background   = "transparent";
                          e.currentTarget.style.borderColor  = "#e9d5ff";
                        }
                      }}
                    >
                      {item.pregunta}
                    </button>
                    {isActive && (
                      <div
                        className="mt-2 rounded-xl px-4 py-3 text-sm"
                        style={{
                          background:  "#faf5ff",
                          borderLeft:  "3px solid #7c3aed",
                          color:       "var(--texto-secundario)",
                        }}
                      >
                        {item.respuesta}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Respuesta del chat si existe */}
          {respuesta && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "#faf5ff",
                borderLeft: "3px solid #a855f7",
                color:      "var(--texto-secundario)",
              }}
            >
              {respuesta}
            </div>
          )}

          {/* Input de chat */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              className="flex-1 text-sm rounded-xl border px-3 py-2 outline-none transition-colors"
              style={{
                borderColor:     "#e9d5ff",
                color:           "var(--texto-primario)",
                background:      "white",
              }}
              onFocus={(e)  => (e.currentTarget.style.borderColor = "#a855f7")}
              onBlur={(e)   => (e.currentTarget.style.borderColor = "#e9d5ff")}
            />
            <button
              onClick={handleSend}
              disabled={!inputVal.trim()}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              onMouseEnter={(e) => { if (inputVal.trim()) e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUBCOMPONENTES ────────────────────────────────────────────────────────────

function ProgresoCircular({ pct }: { pct: number }) {
  const r = 28;
  const circ   = 2 * Math.PI * r;
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

function ContenidoTexto({ descripcion }: { descripcion: string }) {
  if (!descripcion) {
    return (
      <p className="text-sm leading-relaxed" style={{ color: "var(--texto-muted)" }}>
        Este módulo no tiene descripción. El administrador puede añadir contenido editando el módulo.
      </p>
    );
  }
  // Renderiza cada párrafo separado por salto de línea
  const parrafos = descripcion.split(/\n+/).filter(Boolean);
  return (
    <div>
      {parrafos.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed mb-4" style={{ color: "var(--texto-secundario)" }}>
          {p}
        </p>
      ))}
    </div>
  );
}

function ContenidoVideo() {
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
      <p className="text-sm leading-relaxed" style={{ color: "var(--texto-secundario)" }}>
        En este vídeo aprenderás a identificar, inspeccionar y utilizar correctamente los equipos
        de protección individual para trabajos en altura: arneses, líneas de vida, cascos y calzado
        de seguridad homologados.
      </p>
    </div>
  );
}

// ── PODCAST ──────────────────────────────────────────────────────────────────
function ContenidoPodcast({ script, audioUrl }: { script: string; audioUrl?: string }) {
  // Si hay URL de audio real (ElevenLabs MP3), usamos <audio>; si no, Web Speech API como fallback
  const tieneAudioReal = !!audioUrl;
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [reproduciendo, setReproduciendo] = React.useState(false);
  const [pausado,       setPausado]       = React.useState(false);

  // ── Controles para <audio> nativo ─────────────────────────────────────────
  const iniciarAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.play();
    setReproduciendo(true); setPausado(false);
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
  };

  // ── Controles para Web Speech API (fallback) ───────────────────────────────
  const iniciarSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = "es-ES"; utterance.rate = 0.95; utterance.pitch = 1;
    utterance.onend = () => { setReproduciendo(false); setPausado(false); };
    window.speechSynthesis.speak(utterance);
    setReproduciendo(true); setPausado(false);
  };
  const pausarSpeech = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause(); setPausado(true);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume(); setPausado(false);
    }
  };
  const detenerSpeech = () => { window.speechSynthesis.cancel(); setReproduciendo(false); setPausado(false); };

  const iniciar = tieneAudioReal ? iniciarAudio  : iniciarSpeech;
  const pausar  = tieneAudioReal ? pausarAudio   : pausarSpeech;
  const detener = tieneAudioReal ? detenerAudio  : detenerSpeech;

  return (
    <div>
      {/* Audio element oculto para reproducción MP3 */}
      {tieneAudioReal && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => { setReproduciendo(false); setPausado(false); }}
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
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Podcast del módulo</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {tieneAudioReal ? "Narrado por IA con ElevenLabs · ~5 min" : "Narrado por IA · ~5 min"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!reproduciendo ? (
            <button onClick={iniciar} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "#6366f1", color: "#fff", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Reproducir
            </button>
          ) : (
            <>
              <button onClick={pausar} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                {pausado
                  ? <><svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Reanudar</>
                  : <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pausar</>}
              </button>
              <button onClick={detener} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                Detener
              </button>
            </>
          )}
          {reproduciendo && !pausado && (
            <div className="flex items-end gap-0.5 h-5">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="w-1 rounded-full"
                  style={{ background: "#818cf8", animation: `eq${i} ${0.5+i*0.15}s ease-in-out infinite alternate`, height: `${8+i*3}px` }} />
              ))}
              <style>{`${[1,2,3,4,5].map((i)=>`@keyframes eq${i}{from{transform:scaleY(0.4)}to{transform:scaleY(1)}}`).join("")}`}</style>
            </div>
          )}
        </div>
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

function ContenidoSlides({ scriptVideoJson }: { scriptVideoJson: string }) {
  const slides: Slide[] = React.useMemo(() => {
    try { return JSON.parse(scriptVideoJson) as Slide[]; } catch { return []; }
  }, [scriptVideoJson]);
  const [idx, setIdx] = React.useState(0);
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
            {slide.contenido.split("\n").filter(Boolean).map((line, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "#6366f1" }} />
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>{line.replace(/^[-•*]\s*/,"")}</p>
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
        <button onClick={() => setIdx((p) => Math.max(0, p-1))} disabled={idx===0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: idx===0 ? "var(--gris-superficie)" : "var(--blanco)", color: idx===0 ? "var(--texto-muted)" : "var(--texto-primario)", border: "1px solid var(--gris-borde)" }}>
          ← Anterior
        </button>
        <span className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>{idx+1} de {slides.length}</span>
        <button onClick={() => setIdx((p) => Math.min(slides.length-1, p+1))} disabled={idx===slides.length-1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: idx===slides.length-1 ? "var(--gris-superficie)" : "var(--azul-egm)", color: idx===slides.length-1 ? "var(--texto-muted)" : "#fff" }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

function ContenidoPDF() {
  return (
    <div>
      <div className="rounded-2xl flex items-center gap-5 px-6 py-5 mb-6"
        style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--error-light)", color: "var(--error)" }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
            Protocolo_PRL_Alturas_v2.pdf
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>PDF · 2.4 MB · 18 páginas</p>
        </div>
        <button className="text-xs font-semibold px-4 py-2 rounded-lg shrink-0 transition-colors"
          style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}>
          Descargar
        </button>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--texto-secundario)" }}>
        Descarga y lee el documento antes de marcar este contenido como completado. Contiene los
        formularios de registro obligatorios que deberás cumplimentar en cada intervención.
      </p>
    </div>
  );
}

const LETRAS = ["A", "B", "C", "D"];

interface PreguntaQuiz { id: string; texto: string; opciones: string[]; correcta: number; }

function ContenidoQuiz({ onCompletar, testPreguntasJson }: { onCompletar: () => void; testPreguntasJson: string | null }) {
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [enviado, setEnviado]       = useState(false);

  // Parsear preguntas reales o usar fallback
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
      } catch { /* usa fallback */ }
    }
    return [
      { id: "q1", texto: "¿Cuál es el objetivo principal de este módulo?", opciones: ["Opción A", "Opción B", "Opción C", "Opción D"], correcta: 0 },
    ];
  })();

  const correctas = enviado
    ? PREGUNTAS.filter((p) => respuestas[p.id] === p.correcta).length
    : 0;
  const minAprobado = Math.ceil(PREGUNTAS.length * 0.6);
  const aprobado = correctas >= minAprobado;

  if (enviado) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 text-3xl"
          style={{
            background: aprobado ? "var(--exito-light)" : "var(--error-light)",
            border:     `2px solid ${aprobado ? "var(--exito)" : "var(--error)"}`,
          }}>
          {aprobado ? "🎉" : "📚"}
        </div>
        <h3 className="text-xl font-bold mb-2"
          style={{ color: "var(--texto-primario)", fontFamily: "'Playfair Display', serif" }}>
          {aprobado ? "¡Evaluación superada!" : "Sigue practicando"}
        </h3>
        <p className="text-sm mb-1" style={{ color: "var(--texto-muted)" }}>
          Has respondido correctamente{" "}
          <span className="font-bold" style={{ color: "var(--texto-primario)" }}>
            {correctas} de {PREGUNTAS.length}
          </span>{" "}
          preguntas.
        </p>
        <p className="text-sm mb-8 font-semibold"
          style={{ color: aprobado ? "var(--exito)" : "var(--error)" }}>
          {aprobado ? "Módulo completado — certificado disponible" : `Necesitas al menos ${minAprobado} aciertos para aprobar`}
        </p>
        {aprobado ? (
          <button onClick={onCompletar}
            className="px-8 py-3 rounded-xl text-sm font-bold transition-opacity"
            style={{ background: "var(--exito)", color: "var(--blanco)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            Continuar al siguiente módulo →
          </button>
        ) : (
          <button onClick={() => { setEnviado(false); setRespuestas({}); }}
            className="px-8 py-3 rounded-xl text-sm font-bold transition-opacity"
            style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            Intentarlo de nuevo
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm mb-6" style={{ color: "var(--texto-muted)" }}>
        Responde todas las preguntas. Necesitas acertar al menos 2 de 3 para aprobar.
      </p>
      <div className="flex flex-col gap-7">
        {PREGUNTAS.map((p, pi) => (
          <div key={p.id}>
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--texto-primario)" }}>
              {pi + 1}. {p.texto}
            </p>
            <div className="flex flex-col gap-2">
              {p.opciones.map((op, oi) => {
                const sel = respuestas[p.id] === oi;
                return (
                  <button key={oi}
                    onClick={() => setRespuestas((r) => ({ ...r, [p.id]: oi }))}
                    className="text-left flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
                    style={{
                      border:     sel ? "2px solid var(--azul-egm)" : "1px solid var(--gris-borde)",
                      background: sel ? "var(--azul-egm-light)"     : "var(--blanco)",
                      color:      sel ? "var(--azul-egm)"           : "var(--texto-primario)",
                      fontWeight: sel ? 600 : 400,
                    }}>
                    {/* Letter label */}
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        background: sel ? "var(--azul-egm)"        : "var(--gris-superficie)",
                        color:      sel ? "var(--blanco)"          : "var(--texto-muted)",
                      }}
                    >
                      {LETRAS[oi]}
                    </span>
                    {op}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setEnviado(true)}
        disabled={Object.keys(respuestas).length < PREGUNTAS.length}
        className="mt-8 w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
        style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
        onMouseEnter={(e) => { if (Object.keys(respuestas).length >= PREGUNTAS.length) e.currentTarget.style.background = "var(--azul-egm-hover)";}}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}>
        Enviar respuestas
      </button>
    </div>
  );
}
