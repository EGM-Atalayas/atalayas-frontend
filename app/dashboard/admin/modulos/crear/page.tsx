"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { subirImagenModulo } from "@/lib/supabase";

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type Modo  = null | "manual" | "ia";
type PasoManual = 1 | 2 | 3 | 4;
type PasoIA     = 1 | 2 | 3 | 4 | 5;

interface Pregunta {
  id:       number;
  texto:    string;
  opciones: string[];
  correcta: number;
}
interface ArchivoSubido {
  nombre: string; tamano: string; tipo: "pdf" | "docx" | "video" | "audio" | "otro";
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
const getTipo = (nombre: string): ArchivoSubido["tipo"] => {
  const ext = nombre.split(".").pop()?.toLowerCase();
  if (["pdf","docx","txt","ppt","pptx"].includes(ext!)) return "pdf";
  if (["mp4","mov"].includes(ext!)) return "video";
  if (["mp3","wav"].includes(ext!)) return "audio";
  return "otro";
};
let _pid = 1;
const newId = () => _pid++;

// ── ICONOS ────────────────────────────────────────────────────────────────────
const IconUpload = ({ sz = 5 }: { sz?: number }) =>
  <svg viewBox="0 0 24 24" className={`w-${sz} h-${sz}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>;
const IconFile   = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconCheck  = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconTrash  = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconSpark  = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2l2.09 7.26L22 12l-7.91 2.74L12 22l-2.09-7.26L2 12l7.91-2.74z" /></svg>;
const IconPencil = () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconArrow  = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const IconPlus   = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconVideo  = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
const IconMic    = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>;

const ROLES_BLOQUEADOS = ["ROLE_EMPLEADO", "INVITADO"];

const PASOS_MANUAL = [
  { num: 1, label: "Información"  },
  { num: 2, label: "Archivo"      },
  { num: 3, label: "Visibilidad"  },
  { num: 4, label: "Test"         },
];

const PASOS_IA = [
  { num: 1, label: "Información" },
  { num: 2, label: "Documento"   },
  { num: 3, label: "Contenido"   },
  { num: 4, label: "Test"        },
  { num: 5, label: "Generar"     },
];

// Audiencia principal del módulo
type AudienciaTipo = "todos" | "administradores" | "departamento";

const DEPARTAMENTOS = [
  { id: "PRODUCCION",   label: "Producción"    },
  { id: "RRHH",         label: "RRHH"          },
  { id: "LOGISTICA",    label: "Logística"     },
  { id: "CALIDAD",      label: "Calidad"       },
  { id: "MANTENIMIENTO",label: "Mantenimiento" },
  { id: "VENTAS",       label: "Ventas"        },
  { id: "ADMINISTRACION",label:"Administración"},
  { id: "IT",           label: "IT"            },
  { id: "SEGURIDAD",    label: "Seguridad"     },
  { id: "FORMACION",    label: "Formación"     },
];

const CS  = { border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" };
const SEL = "w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer";

// ── TOGGLE ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="relative inline-flex items-center rounded-full transition-colors shrink-0"
      style={{ width: "44px", height: "24px", background: value ? "var(--azul-egm)" : "var(--gris-borde)" }}>
      <span className="inline-block rounded-full bg-white transition-transform"
        style={{ width: "18px", height: "18px", transform: value ? "translateX(22px)" : "translateX(3px)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

// ── CAMPOS BASE (fuera del componente para evitar remount en cada render) ──────
function CamposBase({ nombre, setNombre, descripcion, setDescripcion, categoria, setCategoria, idioma, setIdioma, duracion, setDuracion }: {
  nombre: string; setNombre: (v: string) => void;
  descripcion: string; setDescripcion: (v: string) => void;
  categoria: string; setCategoria: (v: string) => void;
  idioma: string; setIdioma: (v: string) => void;
  duracion: string; setDuracion: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>
          Nombre del módulo <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Seguridad en planta — Nivel básico"
          className="w-full text-sm px-4 py-2.5 rounded-xl outline-none transition-all"
          style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
          onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; e.target.style.boxShadow = "0 0 0 3px var(--azul-egm-light)"; e.target.style.background = "var(--blanco)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "var(--gris-borde)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--gris-pagina)"; }} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Descripción</label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Breve descripción del módulo…" rows={3}
          className="w-full text-sm px-4 py-2.5 rounded-xl outline-none transition-all resize-none"
          style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
          onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; e.target.style.boxShadow = "0 0 0 3px var(--azul-egm-light)"; e.target.style.background = "var(--blanco)"; }}
          onBlur={(e)  => { e.target.style.borderColor = "var(--gris-borde)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--gris-pagina)"; }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Categoría</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={SEL} style={CS}>
            <option value="ESPECIALIZADO">Específica</option>
            <option value="GENERAL">Básica / General</option>
            <option value="CUMPLIMIENTO">Cumplimiento normativo</option>
            <option value="ONBOARDING">Onboarding</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Idioma</label>
          <select value={idioma} onChange={(e) => setIdioma(e.target.value)} className={SEL} style={CS}>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="ca">Valenciano</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Duración</label>
          <select value={duracion} onChange={(e) => setDuracion(e.target.value)} className={SEL} style={CS}>
            <option value="corto">−15 min</option>
            <option value="medio">15–45 min</option>
            <option value="largo">+45 min</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ── STEPPER (genérico) ────────────────────────────────────────────────────────
function Stepper({ paso, setPaso, pasos }: {
  paso: number;
  setPaso: (p: number) => void;
  pasos: { num: number; label: string }[];
}) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {pasos.map((p, idx) => {
        const estado = p.num < paso ? "done" : p.num === paso ? "active" : "pending";
        const isLast = idx === pasos.length - 1;
        const clickable = estado === "done";
        return (
          <div key={p.num} className="flex items-center" style={{ flex: isLast ? "0 0 auto" : "1 1 auto" }}>
            <div className="flex items-center gap-2"
              onClick={() => clickable && setPaso(p.num)}
              style={{ cursor: clickable ? "pointer" : "default" }}
              title={clickable ? `Volver a ${p.label}` : undefined}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                style={{
                  background: estado === "done" ? "var(--verde-oliva)" : estado === "active" ? "var(--azul-egm)" : "var(--gris-superficie)",
                  color:      estado === "pending" ? "var(--texto-muted)" : "#fff",
                  boxShadow:  estado === "active" ? "0 0 0 4px rgba(30,64,175,0.12)" : estado === "done" ? "0 0 0 3px rgba(74,124,89,0.15)" : "none",
                  transition: "box-shadow 0.2s, background 0.2s",
                }}>
                {estado === "done" ? <IconCheck /> : p.num}
              </div>
              <span className="text-xs font-semibold whitespace-nowrap hidden sm:block"
                style={{ color: estado === "active" ? "var(--texto-primario)" : estado === "done" ? "var(--verde-oliva)" : "var(--texto-muted)" }}>
                {p.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 mx-3 rounded-full" style={{ height: "2px", minWidth: "24px", background: p.num < paso ? "var(--verde-oliva)" : "var(--gris-borde)", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── BOTONES NAVEGACIÓN (genérico) ─────────────────────────────────────────────
function NavBtns({ paso, setPaso, setModo, onNext, disabledNext, labelNext = "Continuar", onSave, guardando }: {
  paso: number; setPaso: (p: number) => void; setModo: (m: Modo) => void;
  onNext?: () => void; disabledNext?: boolean; labelNext?: string; onSave?: () => void; guardando?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-6">
      <button onClick={() => paso > 1 ? setPaso(paso - 1) : setModo(null)}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)" }}>
        {paso === 1 ? "Cancelar" : "← Atrás"}
      </button>
      {onSave ? (
        <button onClick={onSave} disabled={guardando}
          className="flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          style={{ background: "var(--verde-oliva)", color: "#fff", opacity: guardando ? 0.7 : 1 }}>
          {guardando ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando…</> : "Guardar módulo"}
        </button>
      ) : (
        <button onClick={onNext} disabled={disabledNext}
          className="flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: disabledNext ? "var(--gris-superficie)" : "var(--azul-egm)", color: disabledNext ? "var(--texto-muted)" : "#fff", cursor: disabledNext ? "not-allowed" : "pointer", boxShadow: disabledNext ? "none" : "0 4px 14px rgba(30,64,175,0.2)" }}>
          {labelNext} <IconArrow />
        </button>
      )}
    </div>
  );
}

export default function CrearModuloPage() {
  const router      = useRouter();
  const inputRef        = useRef<HTMLInputElement>(null);
  const inputIARef      = useRef<HTMLInputElement>(null);
  const inputPortadaRef = useRef<HTMLInputElement>(null);
  const inputPortadaIARef = useRef<HTMLInputElement>(null);
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario && ROLES_BLOQUEADOS.includes(usuario.codigoRol)) router.replace("/dashboard");
  }, [usuario]);
  if (!usuario || ROLES_BLOQUEADOS.includes(usuario.codigoRol)) return null;

  const [modo, setModo] = useState<Modo>(null);

  // ── MANUAL estado ──
  const [pasoManual,    setPasoManual]    = useState<PasoManual>(1);
  const [nombre,        setNombre]        = useState("");
  const [descripcion,   setDescripcion]   = useState("");
  const [categoria,     setCategoria]     = useState("ESPECIALIZADO");
  const [idioma,        setIdioma]        = useState("es");
  const [duracion,      setDuracion]      = useState("medio");
  const [archivoM,      setArchivoM]      = useState<ArchivoSubido | null>(null);
  const [archivoMRaw,   setArchivoMRaw]   = useState<File | null>(null);
  const [draggingM,     setDraggingM]     = useState(false);
  const [audiencia,     setAudiencia]     = useState<AudienciaTipo>("todos");
  const [deptos,        setDeptos]        = useState<string[]>([]);
  const [tieneTest,     setTieneTest]     = useState(false);
  const [modoTest,      setModoTest]      = useState<"manual" | "ia">("manual");
  const [preguntas,     setPreguntas]     = useState<Pregunta[]>([]);
  const [genTest,       setGenTest]       = useState(false);
  const [portadaFile,   setPortadaFile]   = useState<File | null>(null);
  const [portadaPreview,setPortadaPreview]= useState<string>("");
  const [guardando,     setGuardando]     = useState(false);
  const [guardado,      setGuardado]      = useState(false);
  const [errorMsg,      setErrorMsg]      = useState("");

  const toggleDepto = (id: string) =>
    setDeptos((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);

  const agregarPregunta = () =>
    setPreguntas((p) => [...p, { id: newId(), texto: "", opciones: ["", "", "", ""], correcta: 0 }]);
  const updPregunta  = (id: number, campo: keyof Pregunta, val: string | number | string[]) =>
    setPreguntas((p) => p.map((q) => q.id === id ? { ...q, [campo]: val } : q));
  const updOpcion    = (id: number, i: number, val: string) =>
    setPreguntas((p) => p.map((q) => q.id === id ? { ...q, opciones: q.opciones.map((o, j) => j === i ? val : o) } : q));
  const delPregunta  = (id: number) => setPreguntas((p) => p.filter((q) => q.id !== id));

  const generarPreguntasIA = async () => {
    if (!nombre.trim()) return;
    setGenTest(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await fetch(`${API_URL}/ai/generar-preguntas`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ tema: nombre, descripcion }),
      });
      const data = res.ok ? await res.json() : null;
      if (data?.preguntas) {
        setPreguntas(data.preguntas.map((q: any) => ({ id: newId(), texto: q.texto, opciones: q.opciones, correcta: q.correcta ?? 0 })));
      } else {
        setPreguntas([
          { id: newId(), texto: `¿Cuál es el objetivo principal de "${nombre}"?`, opciones: ["Opción A","Opción B","Opción C","Opción D"], correcta: 0 },
          { id: newId(), texto: "¿Qué aspecto es más importante en este módulo?",  opciones: ["Opción A","Opción B","Opción C","Opción D"], correcta: 0 },
        ]);
      }
    } catch {
      setPreguntas([{ id: newId(), texto: `¿Cuál es el objetivo de "${nombre}"?`, opciones: ["Opción A","Opción B","Opción C","Opción D"], correcta: 0 }]);
    } finally { setGenTest(false); }
  };

  const guardarManual = async () => {
    setGuardando(true); setErrorMsg("");
    try {
      const testJson = tieneTest && preguntas.length > 0
        ? JSON.stringify(preguntas.map((q) => ({
            texto: q.texto,
            opciones: q.opciones,
            correcta: q.correcta,
          })))
        : null;

      let imagenPortadaUrl: string | null = null;
      if (portadaFile) {
        imagenPortadaUrl = await subirImagenModulo(portadaFile);
      }

      const res = await apiFetch(`${API_URL}/modulos`, {
        method: "POST",
        body: JSON.stringify({
          nombre:           nombre.trim(),
          descripcion:      descripcion.trim(),
          tipoModulo:       categoria,
          activo:           true,
          empresaId:        usuario?.empresaId ?? null,
          idioma,
          duracion,
          audiencia,
          departamentos:    audiencia === "departamento" ? JSON.stringify(deptos) : "[]",
          testPreguntas:    testJson,
          imagenPortadaUrl: imagenPortadaUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al guardar");
      }
      setGuardado(true);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar. Inténtalo de nuevo.");
    } finally { setGuardando(false); }
  };

  // ── IA estado ──
  const [pasoIA,        setPasoIA]        = useState<PasoIA>(1);
  const [archivosIA,    setArchivosIA]    = useState<ArchivoSubido[]>([]);
  const [archivosIARaw, setArchivosIARaw] = useState<File[]>([]);
  const [draggingIA,    setDraggingIA]    = useState(false);
  const [generando,     setGenerando]     = useState(false);
  const [generado,      setGenerado]      = useState(false);
  const [progreso,      setProgreso]      = useState(0);
  const [msgProgreso,   setMsgProgreso]   = useState("");
  const [errorIA,       setErrorIA]       = useState("");
  const [resultadoIA,   setResultadoIA]   = useState<{ titulo: string; descripcion: string; contenido: string } | null>(null);
  const [portadaIAFile,    setPortadaIAFile]    = useState<File | null>(null);
  const [portadaIAPreview, setPortadaIAPreview] = useState<string>("");

  const [tieneTestIA,   setTieneTestIA]   = useState(false);

  // Tipos de salida seleccionados (al menos uno requerido)
  type TipoSalida = "documentacion" | "podcast" | "video";
  const TIPOS_SALIDA: { key: TipoSalida; label: string; desc: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { key: "documentacion", label: "Documentación",        desc: "Contenido formativo en texto estructurado",    icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, color: "var(--azul-egm)", bg: "var(--azul-egm-light)" },
    { key: "podcast",       label: "Podcast",               desc: "Guion para narración de audio",                icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, color: "#d97706", bg: "#fffbeb" },
    { key: "video",         label: "Video / Presentación",  desc: "Slides estructuradas con guion visual",        icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>, color: "#7c3aed", bg: "#f3e8ff" },
  ];

  const COMBOS: { keys: TipoSalida[]; label: string; desc: string }[] = [
    { keys: ["documentacion"],            label: "Solo documentación",          desc: "Texto formativo estructurado" },
    { keys: ["video"],                    label: "Solo video",                  desc: "Slides + guion visual" },
    { keys: ["podcast"],                  label: "Solo podcast",                desc: "Guion de audio narrado" },
    { keys: ["documentacion", "video"],   label: "Documentación + Video",       desc: "Texto y presentación" },
    { keys: ["documentacion", "podcast"], label: "Documentación + Podcast",     desc: "Texto y guion de audio" },
  ];

  const [tiposSalidaIA, setTiposSalidaIA] = useState<TipoSalida[]>(["documentacion"]);

  const comboActivo = COMBOS.findIndex(
    (c) => c.keys.length === tiposSalidaIA.length && c.keys.every((k) => tiposSalidaIA.includes(k))
  );

  const FORMATOS_SOPORTADOS = ["pdf", "docx", "txt"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const procesarArchivosIA = (files: FileList | null) => {
    if (!files) return;
    const validos: File[] = [];
    const errores: string[] = [];
    Array.from(files).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!FORMATOS_SOPORTADOS.includes(ext)) {
        errores.push(`"${f.name}" tiene un formato no soportado. Usa PDF, DOCX o TXT.`);
      } else if (f.size > MAX_FILE_SIZE) {
        errores.push(`"${f.name}" supera el límite de 10 MB.`);
      } else {
        validos.push(f);
      }
    });
    if (errores.length > 0) setErrorIA(errores.join(" "));
    if (validos.length === 0) return;
    setErrorIA("");
    setArchivosIA((p) => [...p, ...validos.map((f) => ({ nombre: f.name, tamano: formatBytes(f.size), tipo: getTipo(f.name) }))]);
    setArchivosIARaw((p) => [...p, ...validos]);
  };

  const MENSAJES_IA_EXTENDED = [
    "Analizando documento…",
    "Extrayendo conceptos clave…",
    tiposSalidaIA.includes("documentacion") ? "Generando contenido formativo…" : null,
    tiposSalidaIA.includes("podcast") ? "Escribiendo guion de podcast…" : null,
    tiposSalidaIA.includes("video") ? "Creando slides del video…" : null,
    tieneTestIA ? "Generando preguntas del test…" : null,
    "Finalizando módulo…",
  ].filter(Boolean) as string[];

  const iniciarGeneracion = async () => {
    if (generando || archivosIA.length === 0 || !nombre.trim()) return;
    setGenerando(true); setGenerado(false); setProgreso(0); setErrorIA("");
    let i = 0; setMsgProgreso(MENSAJES_IA_EXTENDED[0]);
    const interval = setInterval(() => {
      i++;
      if (i < MENSAJES_IA_EXTENDED.length - 1) {
        setProgreso(Math.round((i / MENSAJES_IA_EXTENDED.length) * 85));
        setMsgProgreso(MENSAJES_IA_EXTENDED[i]);
      }
    }, 1400);
    try {
      // Subir portada IA si existe
      let imagenPortadaUrl: string | null = null;
      if (portadaIAFile) {
        imagenPortadaUrl = await subirImagenModulo(portadaIAFile);
      }

      const fd = new FormData();
      fd.append("archivo", archivosIARaw[0]);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const tiposSalidaStr = tiposSalidaIA.join(",");
      const resIA = await fetch(`${API_URL}/ai/generar-desde-archivo?tiposSalida=${encodeURIComponent(tiposSalidaStr)}`, {
        method: "POST", credentials: "include", body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      clearInterval(interval);
      if (!resIA.ok) {
        const archivo = archivosIARaw[0];
        const ext = archivo?.name.split(".").pop()?.toLowerCase() ?? "";
        if (resIA.status === 400) {
          if (!FORMATOS_SOPORTADOS.includes(ext)) {
            throw new Error(`Formato no soportado: ".${ext}". El archivo debe ser PDF, DOCX o TXT.`);
          } else if (archivo && archivo.size > MAX_FILE_SIZE) {
            throw new Error(`El archivo supera el límite de 10 MB.`);
          } else {
            // Intentar leer mensaje del backend
            const body = await resIA.json().catch(() => null);
            throw new Error(body?.message || "El archivo no pudo procesarse. Puede estar vacío, dañado, o ser un PDF escaneado sin texto seleccionable.");
          }
        }
        if (resIA.status === 413) throw new Error("El archivo es demasiado grande para el servidor. Usa un archivo de menos de 10 MB.");
        if (resIA.status === 403) throw new Error("No tienes permisos para generar contenido con IA.");
        if (resIA.status === 500) throw new Error("Error interno del servidor al procesar el archivo. Inténtalo de nuevo.");
        throw new Error(`Error ${resIA.status} al generar contenido con IA.`);
      }
      const d = await resIA.json();
      setResultadoIA({ titulo: d.titulo || nombre, descripcion: d.descripcion || "", contenido: d.contenido || "" });

      // Generar test con IA si está activado
      let testJson: string | null = null;
      if (tieneTestIA) {
        setMsgProgreso("Generando preguntas del test…");
        try {
          const promptTest = d.contenido
            ? d.contenido.substring(0, 3000)
            : `${d.titulo || nombre}. ${d.descripcion || ""}`;
          const resTest = await fetch(`${API_URL}/ai/generar-preguntas`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ prompt: promptTest, tema: d.titulo || nombre, descripcion: d.descripcion || "", numPreguntas: 5 }),
          });
          if (resTest.ok) {
            const dataTest = await resTest.json();
            // El backend devuelve { contenido: "JSON con preguntas" }
            const raw = dataTest?.contenido ?? dataTest?.preguntas;
            if (raw) {
              try {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                const pregsArr = Array.isArray(parsed) ? parsed : parsed?.preguntas;
                if (Array.isArray(pregsArr) && pregsArr.length > 0) {
                  testJson = JSON.stringify(pregsArr.map((q: { texto: string; opciones: string[]; correcta: number }) => ({
                    texto: q.texto, opciones: q.opciones, correcta: q.correcta ?? 0,
                  })));
                }
              } catch { /* si no parsea, se queda sin test */ }
            }
          }
        } catch { /* si falla la generación del test, continuamos sin él */ }
      }

      setProgreso(90); setMsgProgreso("Guardando módulo…");
      const resM = await apiFetch(`${API_URL}/modulos`, {
        method: "POST",
        body: JSON.stringify({
          nombre:        d.titulo || nombre,
          descripcion:   d.descripcion || "",
          tipoModulo:    "ESPECIALIZADO_IA",
          esEspecializadoIa: true,
          activo:        true,
          empresaId:     usuario?.empresaId ?? null,
          idioma,
          duracion,
          tiposSalida:       tiposSalidaStr,
          testPreguntas:     testJson,
          imagenPortadaUrl:  imagenPortadaUrl,
          contenidoMarkdown: d.contenido      ?? null,
          scriptPodcast:     d.scriptPodcast  ?? null,
          scriptVideo:       d.scriptVideo    ?? null,
          podcastAudioUrl:   d.podcastAudioUrl ?? null,
        }),
      });
      if (!resM.ok) {
        const errBody = await resM.json().catch(() => ({}));
        throw new Error(errBody.message || `Error ${resM.status} al guardar el módulo`);
      }
      setProgreso(100); setMsgProgreso("¡Módulo creado!"); setGenerado(true); setGenerando(false);
    } catch (e: unknown) {
      clearInterval(interval);
      setErrorIA(e instanceof Error ? e.message : "Error al generar. Inténtalo de nuevo.");
      setProgreso(0); setGenerando(false);
    }
  };

  const resetear = () => {
    setModo(null); setPasoManual(1); setPasoIA(1);
    setNombre(""); setDescripcion(""); setCategoria("ESPECIFICA"); setIdioma("es"); setDuracion("medio");
    setArchivoM(null); setArchivoMRaw(null); setAudiencia("todos"); setDeptos([]); setTieneTest(false); setPreguntas([]); setGuardado(false); setErrorMsg("");
    setPortadaFile(null); setPortadaPreview("");
    setArchivosIA([]); setArchivosIARaw([]); setGenerado(false); setResultadoIA(null); setProgreso(0); setErrorIA(""); setTiposSalidaIA(["documentacion"]);
    setTieneTestIA(false);
    setPortadaIAFile(null); setPortadaIAPreview("");
  };

  const puedeGenerar = archivosIA.length > 0 && nombre.trim().length > 0;

  // Hero subtitle helper
  const heroSubtitle = () => {
    if (modo === null) return "Elige cómo quieres crear el módulo.";
    if (modo === "manual") return `Paso ${pasoManual} de 4 — ${PASOS_MANUAL[pasoManual - 1].label}`;
    if (modo === "ia" && !generado) return `Paso ${pasoIA} de 5 — ${PASOS_IA[pasoIA - 1].label}`;
    return "";
  };

  return (
    <div className="w-full">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease both; }
      `}</style>

      {/* ══ HERO ══ */}
      <div className="-mx-8 -mt-8 relative overflow-hidden" style={{ minHeight: "200px" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"url('/background-formacion-empleado.jpg')", backgroundSize:"cover", backgroundPosition:"center 30%" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(10,20,40,0.72)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right,rgba(10,20,40,0.95) 0%,rgba(10,20,40,0.5) 60%,transparent 100%)" }} />
        <div className="relative z-10 px-10 lg:px-16 flex flex-col justify-center" style={{ minHeight:"200px", paddingTop:"2.5rem", paddingBottom:"2.5rem" }}>
          <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color:"rgba(255,255,255,0.45)" }}>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/admin" className="hover:text-white transition-colors">Administración</Link>
            <span>/</span>
            <span style={{ color:"rgba(255,255,255,0.8)" }}>Crear módulo</span>
          </div>
          <h1 style={{ fontFamily:"'Instrument Serif',serif", fontStyle:"italic", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:400, color:"#fff", lineHeight:1.15, letterSpacing:"-0.02em" }}>
            {modo === "ia"
              ? <span className="flex items-center gap-3 flex-wrap">Crear nuevo módulo formativo con IA <span style={{ display:"inline-flex", color:"#A3B535", fontSize:"clamp(1.5rem,3vw,2.25rem)" }}><IconSpark /></span></span>
              : "Crear nuevo módulo formativo"}
          </h1>
          <p className="mt-2 text-sm" style={{ color:"rgba(255,255,255,0.5)", maxWidth:"440px" }}>
            {heroSubtitle()}
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8">

        {/* ── SELECCIÓN MODO ── */}
        {modo === null && (
          <div className="fade-up max-w-3xl mx-auto">
            <p className="text-sm font-semibold mb-6 text-center" style={{ color:"var(--texto-muted)" }}>¿Cómo quieres crear el módulo?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { key:"manual" as Modo, icono:<IconPencil />, titulo:"Creación manual", desc:"Configura paso a paso: información, archivo, visibilidad y test de evaluación.", accent:"var(--azul-egm)", bg:"var(--azul-egm-light)" },
                { key:"ia"     as Modo, icono:<IconSpark />,  titulo:"Generar con IA",  desc:"Sube un documento y la IA crea el módulo completo con lecciones y cuestionario.", accent:"#A3B535", bg:"rgba(163,181,53,0.12)" },
              ].map((op) => (
                <button key={op.key!} onClick={() => setModo(op.key)}
                  className="rounded-2xl p-7 text-left transition-all"
                  style={{ background:"var(--blanco)", border:"2px solid var(--gris-borde)", boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor=op.accent; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor="var(--gris-borde)"; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 1px 8px rgba(0,0,0,0.04)"; }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background:op.bg, color:op.accent }}>{op.icono}</div>
                  <p className="text-base font-bold mb-2" style={{ color:"var(--texto-primario)" }}>{op.titulo}</p>
                  <p className="text-sm leading-relaxed" style={{ color:"var(--texto-muted)" }}>{op.desc}</p>
                  <div className="flex items-center gap-1.5 mt-5 text-xs font-semibold" style={{ color:op.accent }}>
                    Empezar <IconArrow />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ MODO MANUAL ══ */}
        {modo === "manual" && !guardado && (
          <div className="fade-up max-w-5xl mx-auto">
            <Stepper paso={pasoManual} setPaso={(p) => setPasoManual(p as PasoManual)} pasos={PASOS_MANUAL} />

            {/* PASO 1: Información */}
            {pasoManual === 1 && (
              <div className="fade-up rounded-2xl overflow-hidden" style={{ background:"var(--blanco)", border:"1px solid var(--gris-borde)", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--gris-borde)", background:"var(--gris-pagina)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"var(--azul-egm-light)", color:"var(--azul-egm)" }}><IconPencil /></div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>Información del módulo</p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>Datos generales y configuración básica</p>
                  </div>
                </div>
                <div className="p-6">
                  {/* 2 columnas: campos izquierda, portada derecha */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                    <CamposBase nombre={nombre} setNombre={setNombre} descripcion={descripcion} setDescripcion={setDescripcion} categoria={categoria} setCategoria={setCategoria} idioma={idioma} setIdioma={setIdioma} duracion={duracion} setDuracion={setDuracion} />

                    {/* Imagen de portada */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Imagen de portada</label>
                      {portadaPreview ? (
                        <div className="relative rounded-xl overflow-hidden" style={{ height: "200px", border: "1.5px solid var(--gris-borde)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={portadaPreview} alt="Portada" className="w-full h-full object-cover" />
                          <button
                            onClick={() => { setPortadaFile(null); setPortadaPreview(""); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
                            style={{ background: "rgba(0,0,0,0.55)" }}
                            title="Eliminar imagen">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => inputPortadaRef.current?.click()}
                          className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                          style={{ border: "2px dashed var(--gris-borde)", background: "var(--gris-pagina)", height: "200px" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--azul-egm)"; e.currentTarget.style.background = "var(--azul-egm-light)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--gris-pagina)"; }}>
                          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--texto-muted)" }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <p className="text-sm text-center px-2" style={{ color: "var(--texto-muted)" }}>Haz clic para subir portada</p>
                          <p className="text-xs" style={{ color: "var(--texto-muted)" }}>JPG, PNG, WEBP</p>
                        </div>
                      )}
                      <input
                        ref={inputPortadaRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setPortadaFile(f);
                          setPortadaPreview(URL.createObjectURL(f));
                        }}
                      />
                    </div>
                  </div>

                  <NavBtns paso={pasoManual} setPaso={(p) => setPasoManual(p as PasoManual)} setModo={setModo} onNext={() => setPasoManual(2)} disabledNext={!nombre.trim()} />
                </div>
              </div>
            )}

            {/* PASO 2: Archivo */}
            {pasoManual === 2 && (
              <div className="fade-up rounded-2xl overflow-hidden" style={{ background:"var(--blanco)", border:"1px solid var(--gris-borde)", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--gris-borde)", background:"var(--gris-pagina)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"#e0f2fe", color:"#0284c7" }}><IconUpload sz={4} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>Archivo del módulo</p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>Sube el material formativo (opcional)</p>
                  </div>
                  {archivoM && <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background:"var(--azul-egm-light)", color:"var(--azul-egm)" }}>1 archivo</span>}
                </div>
                <div className="p-6">
                  {!archivoM ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDraggingM(true); }}
                      onDragLeave={() => setDraggingM(false)}
                      onDrop={(e) => {
                        e.preventDefault(); setDraggingM(false);
                        const f = e.dataTransfer.files[0];
                        if (f) { setArchivoM({ nombre:f.name, tamano:formatBytes(f.size), tipo:getTipo(f.name) }); setArchivoMRaw(f); }
                      }}
                      onClick={() => inputRef.current?.click()}
                      className="rounded-xl flex flex-col items-center gap-3 cursor-pointer transition-all"
                      style={{ border:`2px dashed ${draggingM ? "var(--azul-egm)" : "var(--gris-borde)"}`, background: draggingM ? "var(--azul-egm-light)" : "var(--gris-pagina)", minHeight: "220px", justifyContent: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: draggingM ? "var(--azul-egm)" : "var(--gris-superficie)", color: draggingM ? "#fff" : "var(--texto-muted)" }}>
                        <IconUpload sz={6} />
                      </div>
                      <p className="text-sm font-medium" style={{ color:"var(--texto-muted)" }}>
                        Arrastra un archivo o <span style={{ color:"var(--azul-egm)", textDecoration:"underline" }}>selecciona</span>
                      </p>
                      <p className="text-xs" style={{ color:"var(--texto-muted)" }}>PDF, DOCX, PPT, MP4, MP3 — max 10 MB</p>
                      <input ref={inputRef} type="file" accept=".pdf,.docx,.ppt,.pptx,.mp4,.mp3,.txt" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) { setArchivoM({ nombre:f.name, tamano:formatBytes(f.size), tipo:getTipo(f.name) }); setArchivoMRaw(f); } }} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background:"var(--gris-pagina)", border:"1px solid var(--gris-borde)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background:"var(--azul-egm-light)", color:"var(--azul-egm)" }}>
                        {archivoM.tipo === "video" ? <IconVideo /> : archivoM.tipo === "audio" ? <IconMic /> : <IconFile />}
                      </div>
                      <span className="text-sm font-medium flex-1 truncate" style={{ color:"var(--texto-primario)" }}>{archivoM.nombre}</span>
                      <span className="text-xs" style={{ color:"var(--texto-muted)" }}>{archivoM.tamano}</span>
                      <button onClick={() => { setArchivoM(null); setArchivoMRaw(null); }} className="p-1 rounded-lg transition-colors" style={{ color:"var(--texto-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.color="#dc2626"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--texto-muted)"; }}>
                        <IconTrash />
                      </button>
                    </div>
                  )}
                  <p className="text-xs mt-3 text-center" style={{ color:"var(--texto-muted)" }}>El archivo es opcional, puedes continuar sin subir ninguno</p>
                  <NavBtns paso={pasoManual} setPaso={(p) => setPasoManual(p as PasoManual)} setModo={setModo} onNext={() => setPasoManual(3)} labelNext="Continuar" />
                </div>
              </div>
            )}

            {/* PASO 3: Visibilidad */}
            {pasoManual === 3 && (
              <div className="fade-up rounded-2xl overflow-hidden" style={{ background:"var(--blanco)", border:"1px solid var(--gris-borde)", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--gris-borde)", background:"var(--gris-pagina)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"#f3e8ff", color:"#7c3aed" }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>Visibilidad del módulo</p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>¿Quién puede ver este módulo?</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
                  {([
                    { key: "todos" as AudienciaTipo,          label: "Todos los empleados",      desc: "Visible para cualquier empleado de la empresa",          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>, accent:"var(--azul-egm)", bg:"var(--azul-egm-light)" },
                    { key: "administradores" as AudienciaTipo, label: "Solo administradores",    desc: "Visible únicamente para administradores de empresa",      icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,                                                                                                                                                                                                                         accent:"#7c3aed",         bg:"#f3e8ff" },
                    { key: "departamento" as AudienciaTipo,   label: "Por departamento",         desc: "Visible solo para empleados de departamentos concretos",  icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,                                                                                                                                                                                accent:"#d97706",         bg:"#fffbeb" },
                  ] as const).map((op) => {
                    const sel = audiencia === op.key;
                    return (
                      <button key={op.key} onClick={() => setAudiencia(op.key)}
                        className="flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all w-full"
                        style={{ border:`1.5px solid ${sel ? op.accent : "var(--gris-borde)"}`, background: sel ? op.bg : "var(--gris-pagina)" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: sel ? op.accent : "var(--gris-superficie)", color: sel ? "#fff" : "var(--texto-muted)" }}>
                          {op.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: sel ? "var(--texto-primario)" : "var(--texto-secundario)" }}>{op.label}</p>
                          <p className="text-xs mt-0.5 leading-snug" style={{ color:"var(--texto-muted)" }}>{op.desc}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                          style={{ border:`2px solid ${sel ? op.accent : "var(--gris-borde)"}`, background: sel ? op.accent : "transparent" }}>
                          {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                  </div>

                  {audiencia === "departamento" && (
                    <div className="fade-up mt-1 rounded-xl p-4" style={{ background:"var(--gris-pagina)", border:"1px solid var(--gris-borde)" }}>
                      <p className="text-xs font-semibold mb-3" style={{ color:"var(--texto-secundario)" }}>Selecciona los departamentos</p>
                      <div className="flex flex-wrap gap-2">
                        {DEPARTAMENTOS.map((d) => {
                          const sel = deptos.includes(d.id);
                          return (
                            <button key={d.id} onClick={() => toggleDepto(d.id)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                              style={{
                                border:`1.5px solid ${sel ? "#d97706" : "var(--gris-borde)"}`,
                                background: sel ? "#fffbeb" : "var(--blanco)",
                                color: sel ? "#d97706" : "var(--texto-muted)",
                              }}>
                              {sel && "✓ "}{d.label}
                            </button>
                          );
                        })}
                      </div>
                      {deptos.length === 0 && (
                        <p className="text-xs mt-3" style={{ color:"#d97706" }}>⚠ Selecciona al menos un departamento</p>
                      )}
                    </div>
                  )}

                  <NavBtns paso={pasoManual} setPaso={(p) => setPasoManual(p as PasoManual)} setModo={setModo}
                    onNext={() => setPasoManual(4)}
                    disabledNext={audiencia === "departamento" && deptos.length === 0}
                  />
                </div>
              </div>
            )}

            {/* PASO 4: Test */}
            {pasoManual === 4 && (
              <div className="fade-up rounded-2xl overflow-hidden" style={{ background:"var(--blanco)", border:"1px solid var(--gris-borde)", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--gris-borde)", background:"var(--gris-pagina)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"#dcfce7", color:"#15803d" }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>Test de evaluación</p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>Cuestionario al final del módulo (opcional)</p>
                  </div>
                  <Toggle value={tieneTest} onChange={setTieneTest} />
                </div>

                <div className="p-6">
                  {!tieneTest ? (
                    <p className="text-sm text-center py-6" style={{ color:"var(--texto-muted)" }}>
                      Activa el toggle si quieres añadir un test al final del módulo.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-5">
                      <div className="flex gap-3">
                        {([["manual","Escribir manualmente"],["ia","Generar con IA"]] as const).map(([key, label]) => (
                          <button key={key} onClick={() => setModoTest(key as "manual" | "ia")}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                            style={{ border:`1.5px solid ${modoTest === key ? "var(--azul-egm)" : "var(--gris-borde)"}`, background: modoTest === key ? "var(--azul-egm-light)" : "var(--gris-pagina)", color: modoTest === key ? "var(--azul-egm)" : "var(--texto-muted)" }}>
                            {key === "ia" && <IconSpark />}
                            {label}
                          </button>
                        ))}
                      </div>

                      {modoTest === "ia" && (
                        <button onClick={generarPreguntasIA} disabled={genTest}
                          className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                          style={{ background:"linear-gradient(135deg, var(--azul-egm), #A3B535)", color:"#fff", opacity: genTest ? 0.7 : 1, boxShadow:"0 4px 14px rgba(163,181,53,0.25)" }}>
                          {genTest
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando preguntas…</>
                            : <><IconSpark />{preguntas.length > 0 ? "Regenerar preguntas" : "Generar preguntas con IA"}</>}
                        </button>
                      )}

                      {preguntas.length > 0 && (
                        <div className="flex flex-col gap-4">
                          {preguntas.map((q, qi) => (
                            <div key={q.id} className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--gris-borde)" }}>
                              <div className="px-4 py-3 flex items-center gap-3" style={{ background:"var(--gris-pagina)", borderBottom:"1px solid var(--gris-borde)" }}>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background:"var(--azul-egm-light)", color:"var(--azul-egm)" }}>P{qi+1}</span>
                                <input type="text" value={q.texto} onChange={(e) => updPregunta(q.id,"texto",e.target.value)}
                                  placeholder="Escribe la pregunta…"
                                  className="flex-1 text-sm bg-transparent outline-none font-medium"
                                  style={{ color:"var(--texto-primario)" }} />
                                <button onClick={() => delPregunta(q.id)} className="p-1 rounded-lg transition-colors shrink-0" style={{ color:"var(--texto-muted)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.color="#dc2626"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--texto-muted)"; }}>
                                  <IconTrash />
                                </button>
                              </div>
                              <div className="p-4 grid grid-cols-2 gap-2">
                                {q.opciones.map((op, oi) => (
                                  <div key={oi} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
                                    style={{ border:`1.5px solid ${q.correcta===oi ? "#16a34a" : "var(--gris-borde)"}`, background: q.correcta===oi ? "#f0fdf4" : "var(--gris-pagina)" }}>
                                    <button onClick={() => updPregunta(q.id,"correcta",oi)}
                                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-colors"
                                      style={{ border:`2px solid ${q.correcta===oi ? "#16a34a" : "var(--gris-borde)"}`, background: q.correcta===oi ? "#16a34a" : "transparent", color:"#fff" }}>
                                      {q.correcta===oi && <IconCheck />}
                                    </button>
                                    <input type="text" value={op} onChange={(e) => updOpcion(q.id,oi,e.target.value)}
                                      placeholder={`Opción ${oi+1}`}
                                      className="flex-1 text-xs bg-transparent outline-none"
                                      style={{ color:"var(--texto-primario)" }} />
                                  </div>
                                ))}
                              </div>
                              <p className="px-4 pb-3 text-[11px]" style={{ color:"var(--texto-muted)" }}>Haz clic en el círculo para marcar la respuesta correcta</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={agregarPregunta}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                        style={{ border:"1.5px dashed var(--gris-borde)", color:"var(--texto-muted)", background:"var(--gris-pagina)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor="var(--azul-egm)"; e.currentTarget.style.color="var(--azul-egm)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor="var(--gris-borde)"; e.currentTarget.style.color="var(--texto-muted)"; }}>
                        <IconPlus /> Añadir pregunta
                      </button>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="mt-4 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2" style={{ background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca" }}>
                      ⚠ {errorMsg}
                    </div>
                  )}

                  <NavBtns paso={pasoManual} setPaso={(p) => setPasoManual(p as PasoManual)} setModo={setModo} onSave={guardarManual} guardando={guardando} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ MODO IA ══ */}
        {modo === "ia" && !generado && (
          <div className="fade-up max-w-5xl mx-auto">
            <Stepper paso={pasoIA} setPaso={(p) => setPasoIA(p as PasoIA)} pasos={PASOS_IA} />

            {/* IA PASO 1: Información */}
            {pasoIA === 1 && (
              <div className="fade-up rounded-2xl overflow-hidden" style={{ background:"var(--blanco)", border:"1px solid var(--gris-borde)", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--gris-borde)", background:"var(--gris-pagina)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"rgba(163,181,53,0.15)", color:"#A3B535" }}><IconPencil /></div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>Información del módulo</p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>Datos generales que usará la IA para estructurar el contenido</p>
                  </div>
                </div>
                <div className="p-6">
                  {/* 2 columnas: campos izquierda, portada derecha */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                    <CamposBase nombre={nombre} setNombre={setNombre} descripcion={descripcion} setDescripcion={setDescripcion} categoria={categoria} setCategoria={setCategoria} idioma={idioma} setIdioma={setIdioma} duracion={duracion} setDuracion={setDuracion} />

                    {/* Imagen de portada IA */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Imagen de portada</label>
                      {portadaIAPreview ? (
                        <div className="relative rounded-xl overflow-hidden" style={{ height: "200px", border: "1.5px solid var(--gris-borde)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={portadaIAPreview} alt="Portada" className="w-full h-full object-cover" />
                          <button
                            onClick={() => { setPortadaIAFile(null); setPortadaIAPreview(""); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
                            style={{ background: "rgba(0,0,0,0.55)" }}
                            title="Eliminar imagen">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => inputPortadaIARef.current?.click()}
                          className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                          style={{ border: "2px dashed var(--gris-borde)", background: "var(--gris-pagina)", height: "200px" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#A3B535"; e.currentTarget.style.background = "rgba(163,181,53,0.07)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--gris-pagina)"; }}>
                          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--texto-muted)" }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <p className="text-sm text-center px-2" style={{ color: "var(--texto-muted)" }}>Haz clic para subir portada</p>
                          <p className="text-xs" style={{ color: "var(--texto-muted)" }}>JPG, PNG, WEBP</p>
                        </div>
                      )}
                      <input
                        ref={inputPortadaIARef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setPortadaIAFile(f);
                          setPortadaIAPreview(URL.createObjectURL(f));
                        }}
                      />
                    </div>
                  </div>

                  <NavBtns paso={pasoIA} setPaso={(p) => setPasoIA(p as PasoIA)} setModo={setModo}
                    onNext={() => setPasoIA(2)} disabledNext={!nombre.trim()} />
                </div>
              </div>
            )}

            {/* IA PASO 2: Documento */}
            {pasoIA === 2 && (
              <div className="fade-up rounded-2xl overflow-hidden" style={{ background:"var(--blanco)", border:"1px solid var(--gris-borde)", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--gris-borde)", background:"var(--gris-pagina)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"rgba(163,181,53,0.15)", color:"#A3B535" }}><IconUpload sz={4} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>Documento base</p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>La IA transformará este contenido en un módulo formativo</p>
                  </div>
                  {archivosIA.length > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background:"rgba(163,181,53,0.15)", color:"#A3B535" }}>{archivosIA.length} archivo{archivosIA.length !== 1 ? "s" : ""}</span>}
                </div>
                <div className="p-6">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDraggingIA(true); }}
                    onDragLeave={() => setDraggingIA(false)}
                    onDrop={(e) => { e.preventDefault(); setDraggingIA(false); procesarArchivosIA(e.dataTransfer.files); }}
                    onClick={() => inputIARef.current?.click()}
                    className="rounded-xl flex flex-col items-center gap-3 cursor-pointer transition-all"
                    style={{ border:`2px dashed ${draggingIA ? "#A3B535" : "var(--gris-borde)"}`, background: draggingIA ? "rgba(163,181,53,0.07)" : "var(--gris-pagina)", minHeight: "220px", justifyContent: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: draggingIA ? "#A3B535" : "var(--gris-superficie)", color: draggingIA ? "#fff" : "var(--texto-muted)" }}>
                      <IconUpload sz={6} />
                    </div>
                    <p className="text-sm font-medium" style={{ color:"var(--texto-muted)" }}>
                      Arrastra o <span style={{ color:"#A3B535", textDecoration:"underline" }}>selecciona</span>
                    </p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>PDF, DOCX, PPT, TXT, MP4, MP3 — max 10 MB</p>
                    <input ref={inputIARef} type="file" multiple accept=".pdf,.docx,.ppt,.pptx,.mp4,.mp3,.txt" className="hidden"
                      onChange={(e) => procesarArchivosIA(e.target.files)} />
                  </div>

                  {archivosIA.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      {archivosIA.map((a, idx) => (
                        <div key={idx} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background:"var(--gris-pagina)", border:"1px solid var(--gris-borde)" }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background:"rgba(163,181,53,0.15)", color:"#A3B535" }}><IconFile /></div>
                          <span className="text-sm flex-1 truncate" style={{ color:"var(--texto-primario)" }}>{a.nombre}</span>
                          <span className="text-xs" style={{ color:"var(--texto-muted)" }}>{a.tamano}</span>
                          <button onClick={() => { setArchivosIA((p) => p.filter((_, i) => i !== idx)); setArchivosIARaw((p) => p.filter((_, i) => i !== idx)); }}
                            className="p-1 rounded-lg" style={{ color:"var(--texto-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.color="#dc2626"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--texto-muted)"; }}>
                            <IconTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <NavBtns paso={pasoIA} setPaso={(p) => setPasoIA(p as PasoIA)} setModo={setModo}
                    onNext={() => setPasoIA(3)} disabledNext={archivosIA.length === 0}
                    labelNext="Continuar" />
                </div>
              </div>
            )}

            {/* IA PASO 3: Contenido a generar */}
            {pasoIA === 3 && (
              <div className="fade-up rounded-2xl overflow-hidden" style={{ background:"var(--blanco)", border:"1px solid var(--gris-borde)", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--gris-borde)", background:"var(--gris-pagina)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"rgba(163,181,53,0.15)", color:"#A3B535" }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>Tipo de contenido a generar</p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>Elige qué formatos creará la IA a partir de tu documento</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {COMBOS.map((combo, idx) => {
                    const sel = comboActivo === idx;
                    return (
                      <button key={idx} onClick={() => setTiposSalidaIA(combo.keys)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all w-full"
                        style={{ border:`1.5px solid ${sel ? "#A3B535" : "var(--gris-borde)"}`, background: sel ? "rgba(163,181,53,0.08)" : "var(--gris-pagina)" }}>
                        <div className="flex gap-1 shrink-0">
                          {combo.keys.map((k) => {
                            const t = TIPOS_SALIDA.find((x) => x.key === k)!;
                            return (
                              <span key={k} className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: sel ? t.color : "var(--gris-superficie)", color: sel ? "#fff" : "var(--texto-muted)" }}>
                                {t.icon}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight" style={{ color: sel ? "var(--texto-primario)" : "var(--texto-primario)" }}>{combo.label}</p>
                          <p className="text-xs mt-0.5" style={{ color:"var(--texto-muted)" }}>{combo.desc}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                          style={{ border:`2px solid ${sel ? "#A3B535" : "var(--gris-borde)"}`, background: sel ? "#A3B535" : "transparent" }}>
                          {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                  </div>

                  <NavBtns paso={pasoIA} setPaso={(p) => setPasoIA(p as PasoIA)} setModo={setModo}
                    onNext={() => setPasoIA(4)} labelNext="Continuar" />
                </div>
              </div>
            )}

            {/* IA PASO 4: Test */}
            {pasoIA === 4 && (
              <div className="fade-up rounded-2xl overflow-hidden" style={{ background:"var(--blanco)", border:"1px solid var(--gris-borde)", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--gris-borde)", background:"var(--gris-pagina)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"#dcfce7", color:"#15803d" }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>Test de evaluación</p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>La IA generará las preguntas a partir del contenido del módulo (opcional)</p>
                  </div>
                  <Toggle value={tieneTestIA} onChange={setTieneTestIA} />
                </div>
                <div className="p-6">
                  {tieneTestIA ? (
                    <div className="rounded-xl p-5 flex items-start gap-4" style={{ background:"rgba(163,181,53,0.07)", border:"1.5px solid rgba(163,181,53,0.3)" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:"rgba(163,181,53,0.15)", color:"#A3B535" }}>
                        <IconSpark />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1" style={{ color:"var(--texto-primario)" }}>Test generado automáticamente por IA</p>
                        <p className="text-sm leading-relaxed" style={{ color:"var(--texto-secundario)" }}>
                          Durante la generación del módulo, la IA creará <strong>5 preguntas de tipo test</strong> basadas en el contenido del documento. Las preguntas estarán disponibles al completar el módulo.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-center py-6" style={{ color:"var(--texto-muted)" }}>
                      Activa el toggle si quieres que la IA genere un test al final del módulo.
                    </p>
                  )}
                  <NavBtns paso={pasoIA} setPaso={(p) => setPasoIA(p as PasoIA)} setModo={setModo}
                    onNext={() => setPasoIA(5)} labelNext="Continuar" />
                </div>
              </div>
            )}

            {/* IA PASO 5: Generar */}
            {pasoIA === 5 && (
              <div className="fade-up rounded-2xl overflow-hidden" style={{ background:"var(--blanco)", border:"1px solid var(--gris-borde)", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" }}>
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid var(--gris-borde)", background:"var(--gris-pagina)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"rgba(163,181,53,0.15)", color:"#A3B535" }}><IconSpark /></div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>Generar módulo con IA</p>
                    <p className="text-xs" style={{ color:"var(--texto-muted)" }}>Revisa el resumen y lanza la generación</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    {/* Resumen de configuración */}
                    <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background:"var(--gris-pagina)", border:"1px solid var(--gris-borde)" }}>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color:"var(--texto-muted)" }}>Resumen de la configuración</p>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-semibold w-24 shrink-0 mt-0.5" style={{ color:"var(--texto-muted)" }}>Módulo</span>
                          <span className="text-sm font-semibold" style={{ color:"var(--texto-primario)" }}>{nombre}</span>
                        </div>
                        {descripcion && (
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-semibold w-24 shrink-0 mt-0.5" style={{ color:"var(--texto-muted)" }}>Descripción</span>
                            <span className="text-sm leading-relaxed" style={{ color:"var(--texto-secundario)" }}>{descripcion}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-semibold w-24 shrink-0 mt-0.5" style={{ color:"var(--texto-muted)" }}>Documento</span>
                          <span className="text-sm" style={{ color:"var(--texto-primario)" }}>{archivosIA[0]?.nombre}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-semibold w-24 shrink-0 mt-0.5" style={{ color:"var(--texto-muted)" }}>Idioma</span>
                          <span className="text-sm" style={{ color:"var(--texto-primario)" }}>{{ es: "Español", en: "Inglés", ca: "Valenciano" }[idioma] ?? idioma}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-semibold w-24 shrink-0 mt-0.5" style={{ color:"var(--texto-muted)" }}>Contenido</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {tiposSalidaIA.map((t) => {
                              const info = TIPOS_SALIDA.find((x) => x.key === t)!;
                              return (
                                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                                  style={{ background: info.bg, color: info.color }}>
                                  {info.icon} {info.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-semibold w-24 shrink-0 mt-0.5" style={{ color:"var(--texto-muted)" }}>Test</span>
                          <span className="text-sm" style={{ color: tieneTestIA ? "#15803d" : "var(--texto-muted)" }}>
                            {tieneTestIA ? "Sí — generado por IA (5 preguntas)" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Panel de generación */}
                    <div className="flex flex-col justify-between gap-4">
                      {generando && (
                        <div>
                          <button disabled
                            className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                            style={{ background:"linear-gradient(135deg,var(--azul-egm),#A3B535)", color:"#fff", opacity:0.85 }}>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generando…
                          </button>
                          <div className="mt-4">
                            <div className="w-full rounded-full overflow-hidden" style={{ height:"5px", background:"var(--gris-superficie)" }}>
                              <div className="h-full rounded-full transition-all duration-700" style={{ width:`${progreso}%`, background:"linear-gradient(90deg,var(--azul-egm),#A3B535)" }} />
                            </div>
                            <p className="text-xs text-center mt-2" style={{ color:"var(--texto-muted)" }}>{msgProgreso}</p>
                          </div>
                        </div>
                      )}

                      {errorIA && !generando && (
                        <div className="px-4 py-3 rounded-xl flex items-start gap-2.5" style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626" }}>
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          <div>
                            <p className="text-xs font-semibold">Error al generar el módulo</p>
                            <p className="text-xs mt-0.5">{errorIA}</p>
                          </div>
                        </div>
                      )}

                      {!generando && (
                        <NavBtns paso={pasoIA} setPaso={(p) => setPasoIA(p as PasoIA)} setModo={setModo}
                          onNext={iniciarGeneracion} disabledNext={generando}
                          labelNext={errorIA ? "Reintentar" : "Generar módulo con IA"} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ ÉXITO ══ */}
        {(guardado || generado) && (
          <div className="fade-up max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background:"var(--verde-oliva)", color:"#fff" }}><IconCheck /></div>
            <h2 className="text-xl font-bold mb-2" style={{ color:"var(--texto-primario)" }}>¡Módulo creado correctamente!</h2>
            <p className="text-sm mb-6" style={{ color:"var(--texto-muted)" }}><strong>{resultadoIA?.titulo || nombre}</strong> ya está disponible en la plataforma.</p>

            {generado && tiposSalidaIA.length > 0 && (
              <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                {tiposSalidaIA.map((t) => {
                  const info = TIPOS_SALIDA.find((x) => x.key === t);
                  if (!info) return null;
                  return (
                    <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: info.bg, color: info.color, border: `1.5px solid ${info.color}` }}>
                      {info.icon} {info.label}
                    </span>
                  );
                })}
              </div>
            )}

            {generado && resultadoIA?.contenido && (
              <div className="rounded-xl p-4 mb-6 text-left" style={{ background:"var(--gris-pagina)", border:"1px solid var(--gris-borde)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color:"var(--texto-muted)" }}>Vista previa del contenido generado</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color:"var(--texto-secundario)" }}>{resultadoIA.contenido.slice(0, 500)}{resultadoIA.contenido.length > 500 ? "…" : ""}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push("/dashboard/admin?tab=formaciones")} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ background:"var(--blanco)", color:"var(--texto-primario)", border:"1px solid var(--gris-borde)" }}>Ver módulos</button>
              <button onClick={resetear} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80" style={{ background:"var(--verde-oliva)", color:"#fff" }}>Crear otro</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
