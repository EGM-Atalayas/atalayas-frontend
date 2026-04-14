"use client";

/**
 * Página de detalle de módulo formativo
 * Ruta: /dashboard/formacion/[id]
 * Archivo: app/dashboard/formacion/[id]/page.tsx
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type TipoContenido = "texto" | "video" | "pdf" | "quiz";

interface Contenido {
  id:         string;
  titulo:     string;
  tipo:       TipoContenido;
  duracion?:  string;
  completado: boolean;
  bloqueado:  boolean;
}

interface ModuloMock {
  id:          string;
  nombre:      string;
  descripcion: string;
  tipo:        string;
  totalItems:  number;
  completados: number;
  contenidos:  Contenido[];
}

// ── MOCK — reemplazar por llamada a API cuando esté lista ─────────────────────
const MODULO_MOCK: ModuloMock = {
  id:          "mock-prl-alturas",
  nombre:      "Prevención de Riesgos Laborales — Trabajos en Altura",
  descripcion: "Aprende los protocolos de seguridad obligatorios para trabajos en altura según la normativa vigente. Al finalizar obtendrás tu certificado PRL.",
  tipo:        "Formación Básica",
  totalItems:  5,
  completados: 2,
  contenidos: [
    { id: "c1", titulo: "Introducción a la normativa PRL",     tipo: "texto", duracion: "5 min",  completado: true,  bloqueado: false },
    { id: "c2", titulo: "Equipos de protección individual",    tipo: "video", duracion: "12 min", completado: true,  bloqueado: false },
    { id: "c3", titulo: "Procedimientos de trabajo seguro",    tipo: "texto", duracion: "8 min",  completado: false, bloqueado: false },
    { id: "c4", titulo: "Documentación y protocolos",          tipo: "pdf",   duracion: "10 min", completado: false, bloqueado: true  },
    { id: "c5", titulo: "Evaluación final del módulo",         tipo: "quiz",  duracion: "15 min", completado: false, bloqueado: true  },
  ],
};

// ── PÁGINA ────────────────────────────────────────────────────────────────────
export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();

  // En producción: usar params.id para llamar a /api/v1/modulos/{params.id}
  const [modulo, setModulo]         = useState<ModuloMock>(MODULO_MOCK);
  const [activoId, setActivoId]     = useState<string>("c3");
  const [completando, setCompletando] = useState(false);

  const activo  = modulo.contenidos.find((c) => c.id === activoId)!;
  const progPct = Math.round((modulo.completados / modulo.totalItems) * 100);

  const marcarCompletado = () => {
    setCompletando(true);
    setTimeout(() => {
      const idx = modulo.contenidos.findIndex((c) => c.id === activoId);
      setModulo((m) => ({
        ...m,
        completados: m.completados + 1,
        contenidos: m.contenidos.map((c, i) => {
          if (c.id === activoId) return { ...c, completado: true };
          if (i === idx + 1)     return { ...c, bloqueado: false };
          return c;
        }),
      }));
      const siguiente = modulo.contenidos[idx + 1];
      if (siguiente) setActivoId(siguiente.id);
      setCompletando(false);
    }, 600);
  };

  return (
    <div className="-mx-8 -mt-8 flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>

      {/* ── CABECERA ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: "var(--marino)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 80% at 80% -20%, rgba(27,63,126,0.5) 0%, transparent 60%)" }} />

        <div className="relative max-w-7xl mx-auto px-8 py-8">
          {/* Volver */}
          <button
            onClick={() => router.push("/dashboard/formacion")}
            className="flex items-center gap-2 text-xs font-medium mb-5 transition-opacity"
            style={{ color: "rgba(255,255,255,0.45)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Formación
          </button>

          <div className="flex items-start justify-between gap-8">
            <div className="flex-1 min-w-0">
              <span
                className="inline-flex text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                style={{ background: "var(--verde-oliva)", color: "var(--blanco)" }}
              >
                {modulo.tipo}
              </span>
              <h1
                className="font-bold text-white leading-tight mb-2"
                style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontFamily: "'Playfair Display', serif" }}
              >
                {modulo.nombre}
              </h1>
              <p className="text-sm max-w-2xl" style={{ color: "rgba(255,255,255,0.45)" }}>
                {modulo.descripcion}
              </p>
            </div>

            {/* Progreso circular */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <ProgresoCircular pct={progPct} />
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
                {modulo.completados}/{modulo.totalItems} completados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUERPO: ÍNDICE + CONTENIDO ────────────────────────────────────────── */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-8 py-8 gap-7">

        {/* ÍNDICE LATERAL */}
        <aside
          className="w-72 shrink-0 self-start sticky top-6 rounded-2xl overflow-hidden"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
              Contenidos
            </p>
          </div>
          <div className="py-2">
            {modulo.contenidos.map((c, i) => {
              const esActivo    = c.id === activoId;
              const esBloqueado = c.bloqueado && !c.completado;
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
                    borderLeft:  esActivo    ? "3px solid var(--azul-egm)" : "3px solid transparent",
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
                    <p className="text-xs font-semibold truncate"
                      style={{ color: esActivo ? "var(--azul-egm)" : "var(--texto-primario)" }}>
                      {c.titulo}
                    </p>
                    <p className="text-[10px] mt-0.5 capitalize" style={{ color: "var(--texto-muted)" }}>
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
              {activo.tipo === "texto" && <ContenidoTexto />}
              {activo.tipo === "video" && <ContenidoVideo />}
              {activo.tipo === "pdf"   && <ContenidoPDF />}
              {activo.tipo === "quiz"  && <ContenidoQuiz onCompletar={marcarCompletado} />}
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
        </main>
      </div>
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

function ContenidoTexto() {
  return (
    <div>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--texto-secundario)" }}>
        La normativa española sobre prevención de riesgos laborales establece en la Ley 31/1995 y el
        Real Decreto 2177/2004 los requisitos mínimos de seguridad para trabajos en altura. Todo
        trabajador que realice tareas a más de 2 metros del nivel de referencia debe completar esta
        formación y disponer del equipo de protección adecuado.
      </p>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--texto-secundario)" }}>
        Los principios básicos incluyen: evaluación previa del riesgo, uso obligatorio de arnés
        homologado, inspección del equipo antes de cada uso, y comunicación al responsable de
        seguridad antes de iniciar cualquier tarea en altura.
      </p>
      <div className="rounded-xl px-5 py-4 my-6"
        style={{ background: "var(--azul-egm-light)", borderLeft: "3px solid var(--azul-egm)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--azul-egm)" }}>
          Punto clave
        </p>
        <p className="text-sm" style={{ color: "var(--texto-primario)" }}>
          El incumplimiento de los protocolos PRL puede derivar en paralización de la actividad,
          sanciones económicas y responsabilidad penal.
        </p>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--texto-secundario)" }}>
        Es responsabilidad de cada trabajador conocer y aplicar estas normas. La empresa facilitará
        el equipo necesario y la formación específica requerida por ley.
      </p>
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

const PREGUNTAS = [
  { id: "q1", pregunta: "¿A partir de qué altura es obligatorio el uso de arnés?", opciones: ["1 metro", "2 metros", "3 metros", "5 metros"], correcta: 1 },
  { id: "q2", pregunta: "¿Cada cuánto tiempo debe inspeccionarse el arnés?",        opciones: ["Mensualmente", "Trimestralmente", "Antes de cada uso", "Anualmente"], correcta: 2 },
  { id: "q3", pregunta: "¿Qué documento acredita la formación PRL?",                opciones: ["El contrato laboral", "El certificado de formación", "La nómina mensual", "El DNI"], correcta: 1 },
];

function ContenidoQuiz({ onCompletar }: { onCompletar: () => void }) {
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [enviado, setEnviado]       = useState(false);

  const correctas = enviado
    ? PREGUNTAS.filter((p) => respuestas[p.id] === p.correcta).length
    : 0;
  const aprobado = correctas >= 2;

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
          {aprobado ? "Módulo completado — certificado disponible" : "Necesitas al menos 2 aciertos para aprobar"}
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
              {pi + 1}. {p.pregunta}
            </p>
            <div className="flex flex-col gap-2">
              {p.opciones.map((op, oi) => {
                const sel = respuestas[p.id] === oi;
                return (
                  <button key={oi}
                    onClick={() => setRespuestas((r) => ({ ...r, [p.id]: oi }))}
                    className="text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                      border:     sel ? "2px solid var(--azul-egm)" : "1px solid var(--gris-borde)",
                      background: sel ? "var(--azul-egm-light)"     : "var(--blanco)",
                      color:      sel ? "var(--azul-egm)"           : "var(--texto-primario)",
                      fontWeight: sel ? 600 : 400,
                    }}>
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
        onMouseEnter={(e) => { if (Object.keys(respuestas).length >= PREGUNTAS.length) e.currentTarget.style.background = "var(--azul-egm-hover)"; }}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}>
        Enviar respuestas
      </button>
    </div>
  );
}