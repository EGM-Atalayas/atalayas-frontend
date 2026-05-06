"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_URL, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { subirImagenModulo, subirAdjunto } from "@/lib/supabase";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { getModulosConProgreso } from "@/lib/api/modulos";

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type Modo = null | "manual" | "ia";
type PasoManual = 1 | 2 | 3 | 4;
type PasoIA = 1 | 2 | 3 | 4 | 5;

interface Pregunta {
  id: number;
  texto: string;
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
  if (["pdf", "docx", "txt", "ppt", "pptx"].includes(ext!)) return "pdf";
  if (["mp4", "mov"].includes(ext!)) return "video";
  if (["mp3", "wav"].includes(ext!)) return "audio";
  return "otro";
};
let _pid = 1;
const newId = () => _pid++;

// ── ICONOS ────────────────────────────────────────────────────────────────────
const IconUpload = ({ sz = 5 }: { sz?: number }) =>
  <svg viewBox="0 0 24 24" className={`w-${sz} h-${sz}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>;
const IconFile = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
const IconCheck = ({ sz = 4 }: { sz?: number }) => <svg viewBox="0 0 24 24" className={`w-${sz} h-${sz}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconTrash = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
const IconSpark = ({ sz = 4 }: { sz?: number }) => <svg viewBox="0 0 24 24" className={`w-${sz} h-${sz}`} fill="currentColor"><path d="M12 2l2.09 7.26L22 12l-7.91 2.74L12 22l-2.09-7.26L2 12l7.91-2.74z" /></svg>;
const IconPencil = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IconArrow = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
const IconPlus = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconVideo = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>;
const IconMic = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" /></svg>;
const IconUsers = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>;
const IconShield = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconBriefcase = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>;
const IconTest = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>;
const IconDoc = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
const IconImage = () => <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;

const ROLES_BLOQUEADOS = ["ROLE_EMPLEADO", "INVITADO"];

function parsearPreguntasTexto(texto: string): { texto: string; opciones: string[]; correcta: number }[] {
  const preguntas: { texto: string; opciones: string[]; correcta: number }[] = [];
  const bloques = texto.split(/PREGUNTA\s+\d+\s*:/i).filter((b) => b.trim());
  for (const bloque of bloques) {
    const lineas = bloque.split("\n").map((l) => l.trim()).filter((l) => l);
    const textoPreg = lineas[0]?.trim() ?? "";
    const opciones: string[] = [];
    let correcta = 0;
    for (const linea of lineas.slice(1)) {
      const mOp = linea.match(/^([A-D])\)\s+(.+)/i);
      if (mOp) opciones.push(mOp[2].trim());
      const mCor = linea.match(/^CORRECTA\s*:\s*([A-D])/i);
      if (mCor) correcta = Math.max(0, ["A", "B", "C", "D"].indexOf(mCor[1].toUpperCase()));
    }
    if (textoPreg && opciones.length >= 2) preguntas.push({ texto: textoPreg, opciones, correcta });
  }
  return preguntas;
}

const PASOS_MANUAL = [
  { num: 1, label: "Información", icon: <IconPencil /> },
  { num: 2, label: "Archivo", icon: <IconUpload sz={4} /> },
  { num: 3, label: "Visibilidad", icon: <IconUsers /> },
  { num: 4, label: "Test", icon: <IconTest /> },
];
const PASOS_IA = [
  { num: 1, label: "Información", icon: <IconPencil /> },
  { num: 2, label: "Documento", icon: <IconUpload sz={4} /> },
  { num: 3, label: "Visibilidad", icon: <IconUsers /> },
  { num: 4, label: "Test", icon: <IconTest /> },
  { num: 5, label: "Generar", icon: <IconSpark sz={4} /> },
];

type AudienciaTipo = "todos" | "administradores" | "departamento";

const DEPARTAMENTOS = [
  { id: "PRODUCCION", label: "Producción" },
  { id: "RRHH", label: "RRHH" },
  { id: "LOGISTICA", label: "Logística" },
  { id: "CALIDAD", label: "Calidad" },
  { id: "MANTENIMIENTO", label: "Mantenimiento" },
  { id: "VENTAS", label: "Ventas" },
  { id: "ADMINISTRACION", label: "Administración" },
  { id: "IT", label: "IT" },
  { id: "SEGURIDAD", label: "Seguridad" },
  { id: "FORMACION", label: "Formación" },
];

const CS = { border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" };
const SEL = "w-full text-sm px-3 py-2.5 rounded-lg outline-none cursor-pointer";

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

// ── CAMPOS BASE ───────────────────────────────────────────────────────────────
function CamposBase({ nombre, setNombre, descripcion, setDescripcion, categoria, setCategoria, idioma, setIdioma, duracion, setDuracion, ocultarDescripcion = false }: {
  nombre: string; setNombre: (v: string) => void;
  descripcion: string; setDescripcion: (v: string) => void;
  categoria: string; setCategoria: (v: string) => void;
  idioma: string; setIdioma: (v: string) => void;
  duracion: string; setDuracion: (v: string) => void;
  ocultarDescripcion?: boolean;
}) {
  const inputBase = { border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--blanco)" };
  const onF = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = "var(--azul-egm)"; e.target.style.boxShadow = "0 0 0 3px var(--azul-egm-light)"; };
  const onB = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = "var(--gris-borde)"; e.target.style.boxShadow = "none"; };
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
          Nombre del módulo <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Seguridad en planta — Nivel básico"
          className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-all"
          style={inputBase} onFocus={onF} onBlur={onB} />
      </div>
      {!ocultarDescripcion && (
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
            Descripción corta <span className="normal-case font-normal" style={{ color: "var(--texto-muted)" }}>(portada del módulo)</span>
          </label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Frase corta que aparecerá en la tarjeta del módulo…" rows={2}
            className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-all resize-none"
            style={inputBase as React.CSSProperties}
            onFocus={onF as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
            onBlur={onB as unknown as React.FocusEventHandler<HTMLTextAreaElement>} />
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Categoría</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={SEL} style={CS}>
            <option value="ESPECIALIZADO">Específica</option>
            <option value="GENERAL">Básica / General</option>
            <option value="CUMPLIMIENTO">Cumplimiento normativo</option>
            <option value="ONBOARDING">Onboarding</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Idioma</label>
          <select value={idioma} onChange={(e) => setIdioma(e.target.value)} className={SEL} style={CS}>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="ca">Valenciano</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Duración</label>
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

// ── SIDEBAR VERTICAL STEPPER ──────────────────────────────────────────────────
function SidebarStepper({ paso, setPaso, pasos, accent = "var(--azul-egm)" }: {
  paso: number;
  setPaso: (p: number) => void;
  pasos: { num: number; label: string; icon: React.ReactNode }[];
  accent?: string;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {pasos.map((p, idx) => {
        const estado = p.num < paso ? "done" : p.num === paso ? "active" : "pending";
        const isLast = idx === pasos.length - 1;
        return (
          <div key={p.num} className="flex flex-col">
            <button
              onClick={() => estado === "done" && setPaso(p.num)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full transition-all"
              style={{ background: estado === "active" ? "rgba(255,255,255,0.1)" : "transparent", cursor: estado === "done" ? "pointer" : "default" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: estado === "done" ? "var(--verde-oliva)" : estado === "active" ? "#fff" : "rgba(255,255,255,0.08)",
                  color: estado === "done" ? "#fff" : estado === "active" ? accent : "rgba(255,255,255,0.3)",
                }}>
                {estado === "done" ? <IconCheck sz={3} /> : p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-none"
                  style={{ color: estado === "active" ? "#fff" : estado === "done" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)" }}>
                  {p.label}
                </p>
              </div>
              {estado === "active" && <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
            </button>
            {!isLast && (
              <div className="ml-5.25 w-px h-3"
                style={{ background: p.num < paso ? "rgba(139,181,53,0.4)" : "rgba(255,255,255,0.08)" }} />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ── BOTONES NAVEGACIÓN ────────────────────────────────────────────────────────
function NavBtns({ paso, setPaso, setModo, onNext, disabledNext, labelNext = "Continuar", onSave, guardando, accent = "var(--azul-egm)", editing = false }: {
  paso: number; setPaso: (p: number) => void; setModo: (m: Modo) => void;
  onNext?: () => void; disabledNext?: boolean; labelNext?: string;
  onSave?: () => void; guardando?: boolean; accent?: string; editing?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-6 mt-6" style={{ borderTop: "1px solid var(--gris-borde)" }}>
      <button onClick={() => paso > 1 ? setPaso(paso - 1) : setModo(null)}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity"
        style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}>
        {paso === 1 ? (editing ? "Cancelar edición" : "Cancelar") : "← Atrás"}
      </button>
      {onSave ? (
        <button onClick={onSave} disabled={guardando}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
          style={{ background: "var(--verde-oliva)", color: "#fff", opacity: guardando ? 0.7 : 1 }}>
          {guardando ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando…</> : (editing ? "Actualizar módulo" : "Guardar módulo")}
        </button>
      ) : (
        <button onClick={onNext} disabled={disabledNext}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
          style={{ background: disabledNext ? "var(--gris-superficie)" : accent, color: disabledNext ? "var(--texto-muted)" : "#fff", cursor: disabledNext ? "not-allowed" : "pointer", boxShadow: disabledNext ? "none" : "0 4px 14px rgba(27,63,126,0.18)" }}>
          {labelNext} <IconArrow />
        </button>
      )}
    </div>
  );
}

// ── SECCIÓN HEADER ────────────────────────────────────────────────────────────
function SeccionHeader({ icono, titulo, subtitulo, iconoBg, iconoColor, right }: {
  icono: React.ReactNode; titulo: string; subtitulo: React.ReactNode;
  iconoBg: string; iconoColor: string; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 mb-7">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconoBg, color: iconoColor }}>{icono}</div>
      <div className="flex-1">
        <h2 className="text-base font-bold" style={{ color: "var(--texto-primario)" }}>{titulo}</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>{subtitulo}</p>
      </div>
      {right}
    </div>
  );
}

// ── PORTADA UPLOAD ────────────────────────────────────────────────────────────
function PortadaUpload({ preview, onFile, onRemove, accent = "var(--azul-egm)", accentLight = "var(--azul-egm-light)" }: {
  preview: string; onFile: (f: File) => void; onRemove: () => void;
  accent?: string; accentLight?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Imagen de portada</label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden" style={{ height: "190px", border: "1.5px solid var(--gris-borde)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Portada" className="w-full h-full object-cover" />
          <button onClick={onRemove} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs hover:opacity-80" style={{ background: "rgba(0,0,0,0.55)" }}><i className="bi bi-x-lg" style={{ fontSize: "12px" }} /></button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
          style={{ border: "2px dashed var(--gris-borde)", background: "var(--gris-pagina)", height: "190px" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = accentLight; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--gris-pagina)"; }}>
          <div style={{ color: "var(--texto-muted)" }}><IconImage /></div>
          <p className="text-sm font-medium text-center" style={{ color: "var(--texto-muted)" }}>Haz clic para subir portada</p>
          <p className="text-xs" style={{ color: "var(--gris-borde)" }}>JPG · PNG · WEBP</p>
        </div>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CrearModuloPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputIARef = useRef<HTMLInputElement>(null);
  const { usuario } = useAuth();

  const editId = searchParams.get("edit");
  const [moduloEditando, setModuloEditando] = useState<ModuloConProgreso | null>(null);
  const [cargandoEdicion, setCargandoEdicion] = useState(!!editId);

  useEffect(() => {
    if (usuario && ROLES_BLOQUEADOS.includes(usuario.codigoRol)) router.replace("/dashboard");
  }, [usuario]);
  if (!usuario || ROLES_BLOQUEADOS.includes(usuario.codigoRol)) return null;

  // Cargar datos del módulo a editar
  useEffect(() => {
    if (!editId || !usuario?.empresaId) return;
    const cargarModulo = async () => {
      try {
        const modulos = await getModulosConProgreso();
        const modulo = modulos.find((m) => m.moduloId === editId);
        if (modulo) {
          setModuloEditando(modulo);
          // Precargar datos básicos
          setNombre(modulo.nombre);
          setDescripcion(modulo.descripcion || "");
          // Precargar tipo de módulo
          if (modulo.tipoModulo) setCategoria(modulo.tipoModulo);
          // Precargar imagen de portada
          if (modulo.imagenPortadaUrl) {
            setPortadaPreview(modulo.imagenPortadaUrl);
          }
          // Establecer modo manual para edición
          setModo("manual");
          setPasoManual(1);
        }
      } catch (e) {
        console.error("Error al cargar módulo para editar:", e);
      } finally {
        setCargandoEdicion(false);
      }
    };
    cargarModulo();
  }, [editId, usuario?.empresaId]);

  const [modo, setModo] = useState<Modo>(null);

  // ── MANUAL estado ──────────────────────────────────────────────────────────
  const [pasoManual, setPasoManual] = useState<PasoManual>(1);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("ESPECIALIZADO");
  const [idioma, setIdioma] = useState("es");
  const [duracion, setDuracion] = useState("medio");
  const [archivoM, setArchivoM] = useState<ArchivoSubido | null>(null);
  const [archivoMRaw, setArchivoMRaw] = useState<File | null>(null);
  const [draggingM, setDraggingM] = useState(false);
  const [audiencia, setAudiencia] = useState<AudienciaTipo>("todos");
  const [deptos, setDeptos] = useState<string[]>([]);
  const [tieneTest, setTieneTest] = useState(false);
  const [modoTest, setModoTest] = useState<"manual" | "ia">("manual");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [genTest, setGenTest] = useState(false);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string>("");
  const [introduccion, setIntroduccion] = useState("");
  const [genDesc, setGenDesc] = useState(false);
  const [genDescError, setGenDescError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleDepto = (id: string) =>
    setDeptos((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);
  const agregarPregunta = () =>
    setPreguntas((p) => [...p, { id: newId(), texto: "", opciones: ["", "", "", ""], correcta: 0 }]);
  const updPregunta = (id: number, campo: keyof Pregunta, val: string | number | string[]) =>
    setPreguntas((p) => p.map((q) => q.id === id ? { ...q, [campo]: val } : q));
  const updOpcion = (id: number, i: number, val: string) =>
    setPreguntas((p) => p.map((q) => q.id === id ? { ...q, opciones: q.opciones.map((o, j) => j === i ? val : o) } : q));
  const delPregunta = (id: number) => setPreguntas((p) => p.filter((q) => q.id !== id));

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
      const rawTexto: string = data?.contenido ?? data?.preguntas ?? "";
      const parsed = rawTexto ? parsearPreguntasTexto(rawTexto) : [];
      if (parsed.length > 0) {
        setPreguntas(parsed.map((q) => ({ id: newId(), texto: q.texto, opciones: q.opciones, correcta: q.correcta })));
      } else {
        setPreguntas([
          { id: newId(), texto: `¿Cuál es el objetivo principal de "${nombre}"?`, opciones: ["Opción A", "Opción B", "Opción C", "Opción D"], correcta: 0 },
          { id: newId(), texto: "¿Qué aspecto es más importante en este módulo?", opciones: ["Opción A", "Opción B", "Opción C", "Opción D"], correcta: 0 },
        ]);
      }
    } catch {
      setPreguntas([{ id: newId(), texto: `¿Cuál es el objetivo de "${nombre}"?`, opciones: ["Opción A", "Opción B", "Opción C", "Opción D"], correcta: 0 }]);
    } finally { setGenTest(false); }
  };

  const generarConIA = async () => {
    if (!archivoMRaw) return;
    setGenDesc(true);
    setGenDescError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const formData = new FormData();
      formData.append("archivo", archivoMRaw);
      const res = await fetch(`${API_URL}/ai/generar-desde-archivo?tiposSalida=documentacion`, {
        method: "POST",
        credentials: "include",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!res.ok) {
        const errTxt = await res.text().catch(() => "");
        setGenDescError(`Error ${res.status}${errTxt ? `: ${errTxt.slice(0, 120)}` : ""}`);
        return;
      }
      const data = await res.json();
      const cont: string = data?.contenido ?? "";
      let desc: string = data?.descripcion ?? "";
      // Si el backend no devuelve descripción corta, pedimos a la IA local que genere una
      if (!desc.trim() && cont.trim()) {
        try {
          const resDesc = await fetch("/api/chat/generate-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: `Genera una descripción corta para este módulo formativo:\n\n${cont.slice(0, 3000)}`,
              systemPrompt: `Eres un asistente que genera descripciones para módulos de formación empresarial. Responde ÚNICAMENTE con un objeto JSON válido sin markdown: {"titulo":"título del módulo","descripcion":"una sola frase en español que resuma todo el contenido, máximo 20 palabras, tono profesional"}`,
            }),
          });
          if (resDesc.ok) {
            const dDesc = await resDesc.json();
            desc = dDesc?.descripcion ?? dDesc?.resumen ?? "";
          }
        } catch { /* silencioso, se deja vacío */ }
      }
      if (desc.trim()) setDescripcion(desc.trim());
      if (cont.trim()) setIntroduccion(cont.trim());
      if (!desc.trim() && !cont.trim()) setGenDescError("La IA no devolvió contenido. Inténtalo de nuevo.");
    } catch (e) {
      setGenDescError(e instanceof Error ? e.message : "Error de red al contactar con la IA.");
    } finally {
      setGenDesc(false);
    }
  };

  const guardarManual = async () => {
    setGuardando(true); setErrorMsg("");
    try {
      const testJson = tieneTest && preguntas.length > 0
        ? JSON.stringify(preguntas.map((q) => ({ texto: q.texto, opciones: q.opciones, correcta: q.correcta })))
        : null;
      let imagenPortadaUrl: string | null = null;
      if (portadaFile) {
        try {
          imagenPortadaUrl = await subirImagenModulo(portadaFile);
        } catch (e) {
          console.warn("No se pudo subir la imagen de portada:", e);
        }
      } else if (editId && moduloEditando?.imagenPortadaUrl) {
        imagenPortadaUrl = moduloEditando.imagenPortadaUrl;
      }
      let adjuntoUrl: string | null = null;
      let adjuntoNombre: string | null = null;
      if (archivoMRaw) {
        const adjunto = await subirAdjunto(archivoMRaw);
        adjuntoUrl = adjunto.url;
        adjuntoNombre = adjunto.nombre;
      }
      const url = editId ? `${API_URL}/modulos/${editId}` : `${API_URL}/modulos`;
      const method = editId ? "PUT" : "POST";
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          nombre: nombre.trim(), descripcion: descripcion.trim(), tipoModulo: categoria,
          activo: moduloEditando?.activo ?? true, empresaId: usuario?.empresaId ?? null, idioma, duracion, audiencia,
          departamentos: audiencia === "departamento" ? JSON.stringify(deptos) : "[]",
          testPreguntas: testJson, imagenPortadaUrl, adjuntoUrl, adjuntoNombre,
          contenidoMarkdown: introduccion.trim() || null,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Error al guardar"); }
      setGuardado(true);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar. Inténtalo de nuevo.");
    } finally { setGuardando(false); }
  };

  // ── IA estado ──────────────────────────────────────────────────────────────
  const [pasoIA, setPasoIA] = useState<PasoIA>(1);
  const [archivosIA, setArchivosIA] = useState<ArchivoSubido[]>([]);
  const [archivosIARaw, setArchivosIARaw] = useState<File[]>([]);
  const [draggingIA, setDraggingIA] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [generado, setGenerado] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [msgProgreso, setMsgProgreso] = useState("");
  const [errorIA, setErrorIA] = useState("");
  const [resultadoIA, setResultadoIA] = useState<{ titulo: string; descripcion: string; contenido: string } | null>(null);
  const [portadaIAFile, setPortadaIAFile] = useState<File | null>(null);
  const [portadaIAPreview, setPortadaIAPreview] = useState<string>("");
  const [tieneTestIA, setTieneTestIA] = useState(false);
  const [numPreguntasIA, setNumPreguntasIA] = useState(5);
  const [preguntasGeneradasIA, setPreguntasGeneradasIA] = useState<{ texto: string; opciones: string[]; correcta: number }[]>([]);

  type TipoSalida = "documentacion" | "podcast" | "video";
  const TIPOS_SALIDA: { key: TipoSalida; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { key: "documentacion", label: "Documentación", icon: <IconFile />, color: "var(--azul-egm)", bg: "var(--azul-egm-light)" },
    { key: "podcast", label: "Podcast", icon: <IconMic />, color: "#d97706", bg: "#fffbeb" },
    { key: "video", label: "Video / Presentación", icon: <IconVideo />, color: "#7c3aed", bg: "#f3e8ff" },
  ];
  const COMBOS: { keys: TipoSalida[]; label: string; desc: string }[] = [
    { keys: ["documentacion"], label: "Solo documentación", desc: "Texto formativo estructurado" },
    { keys: ["video"], label: "Solo video", desc: "Slides + guion visual" },
    { keys: ["podcast"], label: "Solo podcast", desc: "Guion de audio narrado" },
    { keys: ["documentacion", "video"], label: "Documentación + Video", desc: "Texto y presentación" },
    { keys: ["documentacion", "podcast"], label: "Documentación + Podcast", desc: "Texto y guion de audio" },
  ];
  const [tiposSalidaIA, setTiposSalidaIA] = useState<TipoSalida[]>(["documentacion"]);
  const comboActivo = COMBOS.findIndex(
    (c) => c.keys.length === tiposSalidaIA.length && c.keys.every((k) => tiposSalidaIA.includes(k))
  );

  const FORMATOS_SOPORTADOS = ["pdf", "docx", "txt"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const procesarArchivosIA = (files: FileList | null) => {
    if (!files) return;
    const validos: File[] = []; const errores: string[] = [];
    Array.from(files).forEach((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!FORMATOS_SOPORTADOS.includes(ext)) errores.push(`"${f.name}" tiene un formato no soportado. Usa PDF, DOCX o TXT.`);
      else if (f.size > MAX_FILE_SIZE) errores.push(`"${f.name}" supera el límite de 10 MB.`);
      else validos.push(f);
    });
    if (errores.length > 0) setErrorIA(errores.join(" "));
    if (validos.length === 0) return;
    setErrorIA("");
    setArchivosIA((p) => [...p, ...validos.map((f) => ({ nombre: f.name, tamano: formatBytes(f.size), tipo: getTipo(f.name) }))]);
    setArchivosIARaw((p) => [...p, ...validos]);
  };

  const MENSAJES_IA = [
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
    let i = 0; setMsgProgreso(MENSAJES_IA[0]);
    const interval = setInterval(() => {
      i++;
      if (i < MENSAJES_IA.length - 1) { setProgreso(Math.round((i / MENSAJES_IA.length) * 85)); setMsgProgreso(MENSAJES_IA[i]); }
    }, 1400);
    try {
      let imagenPortadaUrl: string | null = null;
      if (portadaIAFile) {
        try {
          imagenPortadaUrl = await subirImagenModulo(portadaIAFile);
        } catch (e) {
          console.warn("No se pudo subir la imagen de portada:", e);
        }
      }
      const fd = new FormData(); fd.append("archivo", archivosIARaw[0]);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const tiposSalidaStr = tiposSalidaIA.join(",");
      const resIA = await fetch(`${API_URL}/ai/generar-desde-archivo?tiposSalida=${encodeURIComponent(tiposSalidaStr)}`, {
        method: "POST", credentials: "include", body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      clearInterval(interval);
      if (!resIA.ok) {
        const archivo = archivosIARaw[0];
        const ext = archivo?.name.split(".").pop()?.toLowerCase() ?? "";
        if (resIA.status === 400) {
          if (!FORMATOS_SOPORTADOS.includes(ext)) throw new Error(`Formato no soportado: ".${ext}". El archivo debe ser PDF, DOCX o TXT.`);
          else if (archivo && archivo.size > MAX_FILE_SIZE) throw new Error(`El archivo supera el límite de 10 MB.`);
          else { const body = await resIA.json().catch(() => null); throw new Error(body?.message || "El archivo no pudo procesarse. Puede estar vacío, dañado, o ser un PDF escaneado sin texto."); }
        }
        if (resIA.status === 413) throw new Error("El archivo es demasiado grande. Usa un archivo de menos de 10 MB.");
        if (resIA.status === 403) throw new Error("No tienes permisos para generar contenido con IA.");
        if (resIA.status === 500) throw new Error("Error interno del servidor. Inténtalo de nuevo.");
        throw new Error(`Error ${resIA.status} al generar contenido con IA.`);
      }
      const d = await resIA.json();
      setResultadoIA({ titulo: d.titulo || nombre, descripcion: d.descripcion || "", contenido: d.contenido || "" });
      let testJson: string | null = null;
      if (tieneTestIA) {
        setMsgProgreso("Generando preguntas del test…");
        try {
          const promptTest = d.contenido ? d.contenido.substring(0, 3000) : `${d.titulo || nombre}. ${d.descripcion || ""}`;
          const resTest = await fetch(`${API_URL}/ai/generar-preguntas`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ prompt: promptTest, tema: d.titulo || nombre, descripcion: d.descripcion || "", numPreguntas: numPreguntasIA }),
          });
          if (resTest.ok) {
            const dataTest = await resTest.json();
            const rawTexto: string = dataTest?.contenido ?? dataTest?.preguntas ?? "";
            const pregsMapeadas = rawTexto ? parsearPreguntasTexto(rawTexto) : [];
            if (pregsMapeadas.length > 0) { testJson = JSON.stringify(pregsMapeadas); setPreguntasGeneradasIA(pregsMapeadas); }
          }
        } catch { /* silencioso */ }
      }
      setProgreso(90); setMsgProgreso("Guardando módulo…");
      const resM = await apiFetch(`${API_URL}/modulos`, {
        method: "POST",
        body: JSON.stringify({
          nombre: d.titulo || nombre, descripcion: d.descripcion || "",
          tipoModulo: "ESPECIALIZADO_IA", esEspecializadoIa: true, activo: true,
          empresaId: usuario?.empresaId ?? null, idioma, duracion,
          tiposSalida: tiposSalidaStr, testPreguntas: testJson, imagenPortadaUrl,
          contenidoMarkdown: d.contenido ?? null, scriptPodcast: d.scriptPodcast ?? null,
          scriptVideo: d.scriptVideo ?? null, podcastAudioUrl: d.podcastAudioUrl ?? null,
        }),
      });
      if (!resM.ok) { const errBody = await resM.json().catch(() => ({})); throw new Error(errBody.message || `Error ${resM.status} al guardar`); }
      setProgreso(100); setMsgProgreso("¡Módulo creado!"); setGenerado(true); setGenerando(false);
    } catch (e: unknown) {
      clearInterval(interval);
      setErrorIA(e instanceof Error ? e.message : "Error al generar. Inténtalo de nuevo.");
      setProgreso(0); setGenerando(false);
    }
  };

  const resetear = () => {
    setModo(null); setPasoManual(1); setPasoIA(1);
    setNombre(""); setDescripcion(""); setCategoria("ESPECIALIZADO"); setIdioma("es"); setDuracion("medio");
    setArchivoM(null); setArchivoMRaw(null); setAudiencia("todos"); setDeptos([]);
    setTieneTest(false); setPreguntas([]); setGuardado(false); setErrorMsg("");
    setPortadaFile(null); setPortadaPreview("");
    setArchivosIA([]); setArchivosIARaw([]); setGenerado(false); setResultadoIA(null);
    setProgreso(0); setErrorIA(""); setTiposSalidaIA(["documentacion"]);
    setTieneTestIA(false); setNumPreguntasIA(5); setPreguntasGeneradasIA([]);
    setPortadaIAFile(null); setPortadaIAPreview("");
  };

  const puedeGenerar = archivosIA.length > 0 && nombre.trim().length > 0;
  const IA_ACCENT = "#8B9A2D";

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen pt-20" style={{ background: "var(--gris-pagina)" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .28s ease both}`}</style>

      {/* ══ HEADER BREADCRUMBS ══ */}
      <div style={{ background: "var(--blanco)", borderBottom: "1px solid var(--gris-borde)" }}>
        <div className="px-8 lg:px-12 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/admin"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}>
                ← Volver
              </Link>
              <div>
                <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "var(--texto-muted)" }}>
                  <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                  <span>/</span>
                  <Link href="/dashboard/admin" className="hover:underline">Administración</Link>
                  <span>/</span>
                  <span style={{ color: "var(--texto-primario)", fontWeight: 600 }}>
                    {editId ? "Editar módulo" : "Crear módulo"}
                  </span>
                </div>
              </div>
            </div>
            {!editId && modo !== null && !guardado && !generado && (
              <button onClick={() => setModo(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}>
                ← Cambiar modo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ CUERPO ══ */}
      <div className="px-8 lg:px-12 py-8">
        <div className="max-w-4xl mx-auto">

          {/* ══ TARJETA ÚNICA ══ */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>

              {/* ── CABECERA DE LA TARJETA ── */}
              <div className="px-8 pt-7 pb-6" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
                <h1 className="text-xl font-bold mb-1" style={{ color: "var(--texto-primario)" }}>
                  {editId ? "Editar módulo formativo" : "Crear módulo formativo"}
                </h1>
                <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                  {editId
                    ? "Modifica los datos del módulo formativo existente."
                    : "Publica módulos formativos adjuntando título, descripción, archivo y test de evaluación."}
                </p>
              </div>

            {/* ── SELECTOR DE MODO (solo en creación) ── */}
            {!editId && (
              <div className="px-8 py-5" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: "manual" as Modo, icon: <IconPencil />, label: "Manual", desc: "Paso a paso", accent: "var(--azul-egm)", aLight: "var(--azul-egm-light)" },
                    { key: "ia" as Modo, icon: <IconSpark sz={4} />, label: "Asistente IA", desc: "Generación automática", accent: IA_ACCENT, aLight: "rgba(139,154,45,0.1)" },
                  ] as const).map((op) => {
                    const active = modo === op.key;
                    return (
                      <button key={op.key!} onClick={() => { setModo(op.key); if (op.key === "manual") setPasoManual(1); else setPasoIA(1); }}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                        style={{ border: `1.5px solid ${active ? op.accent : "var(--gris-borde)"}`, background: active ? op.aLight : "var(--gris-pagina)" }}
                        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = op.accent; e.currentTarget.style.background = op.aLight; } }}
                        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--gris-pagina)"; } }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                          style={{ background: active ? op.accent : "var(--gris-superficie)", color: active ? "#fff" : "var(--texto-muted)" }}>
                          {op.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>{op.label}</p>
                          <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{op.desc}</p>
                        </div>
                        {active && <div className="ml-auto w-2 h-2 rounded-full shrink-0" style={{ background: op.accent }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── PLACEHOLDER SI NO SE HA ELEGIDO MODO ── */}
            {modo === null && (
              <div className="px-8 py-16 flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                  <IconPencil />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>Selecciona un método de creación</p>
                <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Elige entre creación manual o asistida por IA para continuar.</p>
              </div>
            )}

            {/* ── INDICADOR DE PASOS (solo si no es edición) ── */}
            {!editId && modo !== null && !guardado && !generado && (
              <div className="px-8 py-4 flex items-center gap-1" style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                {(modo === "manual" ? PASOS_MANUAL : PASOS_IA).map((p, idx, arr) => {
                  const currentPaso = modo === "manual" ? pasoManual : pasoIA;
                  const estado = p.num < currentPaso ? "done" : p.num === currentPaso ? "active" : "pending";
                  const accent = modo === "ia" ? IA_ACCENT : "var(--azul-egm)";
                  return (
                    <div key={p.num} className="flex items-center gap-1 flex-1">
                      <button
                        onClick={() => estado === "done" && (modo === "manual" ? setPasoManual(p.num as PasoManual) : setPasoIA(p.num as PasoIA))}
                        className="flex items-center gap-1.5 whitespace-nowrap"
                        style={{ cursor: estado === "done" ? "pointer" : "default" }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                          style={{ background: estado === "done" ? "var(--verde-oliva)" : estado === "active" ? accent : "var(--gris-superficie)", color: estado === "pending" ? "var(--texto-muted)" : "#fff" }}>
                          {estado === "done" ? "✓" : p.num}
                        </div>
                        <span className="text-xs font-semibold hidden sm:block" style={{ color: estado === "active" ? "var(--texto-primario)" : "var(--texto-muted)" }}>{p.label}</span>
                      </button>
                      {idx < arr.length - 1 && <div className="flex-1 h-px mx-1" style={{ background: p.num < currentPaso ? "var(--verde-oliva)" : "var(--gris-borde)", minWidth: "12px" }} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── CONTENIDO DEL PASO ── */}
            {modo !== null && !guardado && !generado && (
              <div className="px-8 py-7 fade-up">

                {/* MANUAL */}
                {modo === "manual" && (
                  <>
                    {pasoManual === 1 && (
                      <>
                        <SeccionHeader icono={<IconPencil />} titulo="Información del módulo" subtitulo="Datos generales y configuración básica" iconoBg="var(--azul-egm-light)" iconoColor="var(--azul-egm)" />
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-7">
                          <CamposBase nombre={nombre} setNombre={setNombre} descripcion={descripcion} setDescripcion={setDescripcion} categoria={categoria} setCategoria={setCategoria} idioma={idioma} setIdioma={setIdioma} duracion={duracion} setDuracion={setDuracion} ocultarDescripcion />
                          <PortadaUpload preview={portadaPreview} onFile={(f) => { setPortadaFile(f); setPortadaPreview(URL.createObjectURL(f)); }} onRemove={() => { setPortadaFile(null); setPortadaPreview(""); }} />
                        </div>
                      </>
                    )}
                    {pasoManual === 2 && (
                      <>
                        <SeccionHeader icono={<IconUpload sz={4} />} titulo="Archivo del módulo" subtitulo={<>Sube el material formativo <span style={{ color: "#dc2626" }}>*</span></>} iconoBg="#e0f2fe" iconoColor="#0284c7"
                          right={archivoM ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>1 archivo</span> : undefined} />
                        {!archivoM ? (
                          <div onDragOver={(e) => { e.preventDefault(); setDraggingM(true); }} onDragLeave={() => setDraggingM(false)}
                            onDrop={(e) => { e.preventDefault(); setDraggingM(false); const f = e.dataTransfer.files[0]; if (f) { setArchivoM({ nombre: f.name, tamano: formatBytes(f.size), tipo: getTipo(f.name) }); setArchivoMRaw(f); } }}
                            onClick={() => inputRef.current?.click()}
                            className="rounded-xl flex flex-col items-center gap-4 cursor-pointer transition-all"
                            style={{ border: `2px dashed ${draggingM ? "var(--azul-egm)" : "var(--gris-borde)"}`, background: draggingM ? "var(--azul-egm-light)" : "var(--gris-pagina)", minHeight: "190px", justifyContent: "center" }}>
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all" style={{ background: draggingM ? "var(--azul-egm)" : "var(--gris-superficie)", color: draggingM ? "#fff" : "var(--texto-muted)" }}><IconUpload sz={6} /></div>
                            <div className="text-center">
                              <p className="text-sm font-semibold mb-1" style={{ color: "var(--texto-secundario)" }}>Arrastra un archivo o <span style={{ color: "var(--azul-egm)", textDecoration: "underline" }}>selecciona</span></p>
                              <p className="text-xs" style={{ color: "var(--texto-muted)" }}>PDF, DOCX, PPT, MP4, MP3 — máx. 10 MB</p>
                            </div>
                            <input ref={inputRef} type="file" accept=".pdf,.docx,.ppt,.pptx,.mp4,.mp3,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setArchivoM({ nombre: f.name, tamano: formatBytes(f.size), tipo: getTipo(f.name) }); setArchivoMRaw(f); } }} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                              {archivoM.tipo === "video" ? <IconVideo /> : archivoM.tipo === "audio" ? <IconMic /> : <IconFile />}
                            </div>
                            <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--texto-primario)" }}>{archivoM.nombre}</span>
                            <span className="text-xs" style={{ color: "var(--texto-muted)" }}>{archivoM.tamano}</span>
                            <button onClick={() => { setArchivoM(null); setArchivoMRaw(null); }} className="p-2 rounded-lg transition-colors" style={{ color: "var(--texto-muted)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--texto-muted)"; }}><IconTrash /></button>
                          </div>
                        )}
                        {!archivoM && <p className="text-xs mt-3 text-center" style={{ color: "#dc2626" }}>⚠ Debes subir un archivo para continuar.</p>}

                        {/* ── CONTENIDO DEL MÓDULO ── */}
                        <div className="mt-6 flex flex-col gap-5" style={{ borderTop: "1px solid var(--gris-borde)", paddingTop: "24px" }}>
                          {/* Descripción corta con botón IA */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
                                Descripción corta <span className="normal-case font-normal">(portada)</span>
                              </label>
                              {archivoM && (
                                <button onClick={generarConIA} disabled={genDesc}
                                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                  style={{ background: genDesc ? "var(--gris-superficie)" : "#f3e8ff", color: genDesc ? "var(--texto-muted)" : "#7c3aed", border: "1px solid #e9d5ff" }}>
                                  {genDesc
                                    ? <><span className="w-3 h-3 border-2 rounded-full animate-spin inline-block" style={{ borderColor: "#e9d5ff", borderTopColor: "#7c3aed" }} />Generando…</>
                                    : <><IconSpark sz={3} />Sugerir con IA</>}
                                </button>
                              )}
                            </div>
                            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                              placeholder="Frase corta que aparecerá en la tarjeta del módulo…" rows={2}
                              className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-all resize-none"
                              style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--blanco)" }}
                              onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; e.target.style.boxShadow = "0 0 0 3px var(--azul-egm-light)"; }}
                              onBlur={(e) => { e.target.style.borderColor = "var(--gris-borde)"; e.target.style.boxShadow = "none"; }} />
                            {genDescError && <p className="text-xs mt-1.5" style={{ color: "#dc2626" }}>⚠ {genDescError}</p>}
                          </div>
                          {/* Introducción del módulo */}
                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
                              Introducción del módulo <span className="normal-case font-normal">(contenido visible para el empleado)</span>
                            </label>
                            <textarea value={introduccion} onChange={(e) => setIntroduccion(e.target.value)}
                              placeholder="Escribe aquí la introducción o el contenido formativo del módulo…" rows={6}
                              className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-all resize-none"
                              style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--blanco)" }}
                              onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; e.target.style.boxShadow = "0 0 0 3px var(--azul-egm-light)"; }}
                              onBlur={(e) => { e.target.style.borderColor = "var(--gris-borde)"; e.target.style.boxShadow = "none"; }} />
                          </div>
                        </div>
                      </>
                    )}
                    {pasoManual === 3 && (
                      <div className="fade-up rounded-2xl" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                        <div className="px-8 py-7">
                          <SeccionHeader icono={<IconUsers />} titulo="Visibilidad del módulo" subtitulo="Define quién puede acceder a este módulo" iconoBg="#f3e8ff" iconoColor="#7c3aed" />
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                            {([
                              { key: "todos" as AudienciaTipo, label: "Todos los empleados", desc: "Visible para cualquier empleado", icon: <IconUsers />, accent: "var(--azul-egm)", bg: "var(--azul-egm-light)" },
                              { key: "administradores" as AudienciaTipo, label: "Solo administradores", desc: "Solo admins de empresa", icon: <IconShield />, accent: "#7c3aed", bg: "#f3e8ff" },
                              { key: "departamento" as AudienciaTipo, label: "Por departamento", desc: "Departamentos específicos", icon: <IconBriefcase />, accent: "#d97706", bg: "#fffbeb" },
                            ] as const).map((op) => {
                              const sel = audiencia === op.key;
                              return (
                                <button key={op.key} onClick={() => setAudiencia(op.key)}
                                  className="flex flex-col gap-3 px-5 py-5 rounded-xl text-left transition-all w-full"
                                  style={{ border: `1.5px solid ${sel ? op.accent : "var(--gris-borde)"}`, background: sel ? op.bg : "var(--gris-pagina)" }}>
                                  <div className="flex items-center justify-between">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: sel ? op.accent : "var(--gris-superficie)", color: sel ? "#fff" : "var(--texto-muted)" }}>{op.icon}</div>
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ border: `2px solid ${sel ? op.accent : "var(--gris-borde)"}`, background: sel ? op.accent : "transparent" }}>
                                      {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold mb-0.5" style={{ color: "var(--texto-primario)" }}>{op.label}</p>
                                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{op.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {audiencia === "departamento" && (
                            <div className="fade-up rounded-xl p-5 mb-2" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--texto-muted)" }}>Selecciona los departamentos</p>
                              <div className="flex flex-wrap gap-2">
                                {DEPARTAMENTOS.map((d) => {
                                  const sel = deptos.includes(d.id);
                                  return (
                                    <button key={d.id} onClick={() => toggleDepto(d.id)}
                                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                                      style={{ border: `1.5px solid ${sel ? "#d97706" : "var(--gris-borde)"}`, background: sel ? "#fffbeb" : "var(--blanco)", color: sel ? "#d97706" : "var(--texto-muted)" }}>
                                      {sel && "✓ "}{d.label}
                                    </button>
                                  );
                                })}
                              </div>
                              {deptos.length === 0 && <p className="text-xs mt-3" style={{ color: "#d97706" }}>⚠ Selecciona al menos un departamento</p>}
                            </div>
                          )}
                          <NavBtns paso={pasoManual} setPaso={(p) => setPasoManual(p as PasoManual)} setModo={setModo} onNext={() => setPasoManual(4)} disabledNext={audiencia === "departamento" && deptos.length === 0} />
                        </div>
                      </div>
                    )}
                    {pasoManual === 4 && (
                      <div className="fade-up rounded-2xl" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                        <div className="px-8 py-7">
                          <SeccionHeader icono={<IconTest />} titulo="Test de evaluación" subtitulo="Cuestionario al final del módulo (opcional)" iconoBg="#dcfce7" iconoColor="#15803d" right={<Toggle value={tieneTest} onChange={setTieneTest} />} />
                          {!tieneTest ? (
                            <div className="rounded-xl flex flex-col items-center justify-center gap-3 py-14" style={{ background: "var(--gris-pagina)", border: "1.5px dashed var(--gris-borde)" }}>
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}><IconTest /></div>
                              <p className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>Sin test de evaluación</p>
                              <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Activa el toggle para añadir preguntas.</p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-5">
                              <div className="flex gap-3">
                                {([["manual", "Escribir manualmente"], ["ia", "Generar con IA"]] as const).map(([key, label]) => (
                                  <button key={key} onClick={() => setModoTest(key as "manual" | "ia")}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
                                    style={{ border: `1.5px solid ${modoTest === key ? "var(--azul-egm)" : "var(--gris-borde)"}`, background: modoTest === key ? "var(--azul-egm-light)" : "var(--gris-pagina)", color: modoTest === key ? "var(--azul-egm)" : "var(--texto-muted)" }}>
                                    {key === "ia" && <IconSpark sz={3} />}{label}
                                  </button>
                                ))}
                              </div>
                              {modoTest === "ia" && (
                                <button onClick={generarPreguntasIA} disabled={genTest}
                                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                                  style={{ background: "linear-gradient(135deg, var(--azul-egm), #A3B535)", color: "#fff", opacity: genTest ? 0.7 : 1, boxShadow: "0 4px 14px rgba(163,181,53,0.25)" }}>
                                  {genTest ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando preguntas…</> : <><IconSpark sz={3} />{preguntas.length > 0 ? "Regenerar" : "Generar preguntas con IA"}</>}
                                </button>
                              )}
                              {preguntas.length > 0 && (
                                <div className="flex flex-col gap-3">
                                  {preguntas.map((q, qi) => (
                                    <div key={q.id} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                                      <div className="px-4 py-3 flex items-center gap-3" style={{ background: "var(--gris-pagina)", borderBottom: "1px solid var(--gris-borde)" }}>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>P{qi + 1}</span>
                                        <input type="text" value={q.texto} onChange={(e) => updPregunta(q.id, "texto", e.target.value)} placeholder="Escribe la pregunta…" className="flex-1 text-sm bg-transparent outline-none font-medium" style={{ color: "var(--texto-primario)" }} />
                                        <button onClick={() => delPregunta(q.id)} className="p-1 rounded-lg transition-colors shrink-0" style={{ color: "var(--texto-muted)" }}
                                          onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--texto-muted)"; }}><IconTrash /></button>
                                      </div>
                                      <div className="p-4 grid grid-cols-2 gap-2">
                                        {q.opciones.map((op, oi) => (
                                          <div key={oi} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
                                            style={{ border: `1.5px solid ${q.correcta === oi ? "#16a34a" : "var(--gris-borde)"}`, background: q.correcta === oi ? "#f0fdf4" : "var(--gris-pagina)" }}>
                                            <button onClick={() => updPregunta(q.id, "correcta", oi)} className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-colors" style={{ border: `2px solid ${q.correcta === oi ? "#16a34a" : "var(--gris-borde)"}`, background: q.correcta === oi ? "#16a34a" : "transparent", color: "#fff" }}>
                                              {q.correcta === oi && <IconCheck sz={3} />}
                                            </button>
                                            <input type="text" value={op} onChange={(e) => updOpcion(q.id, oi, e.target.value)} placeholder={`Opción ${oi + 1}`} className="flex-1 text-xs bg-transparent outline-none" style={{ color: "var(--texto-primario)" }} />
                                          </div>
                                        ))}
                                      </div>
                                      <p className="px-4 pb-3 text-[11px]" style={{ color: "var(--texto-muted)" }}>Haz clic en el círculo para marcar la respuesta correcta</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <button onClick={agregarPregunta}
                                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                                style={{ border: "1.5px dashed var(--gris-borde)", color: "var(--texto-muted)", background: "var(--gris-pagina)" }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--azul-egm)"; e.currentTarget.style.color = "var(--azul-egm)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.color = "var(--texto-muted)"; }}>
                                <IconPlus /> Añadir pregunta
                              </button>
                            </div>
                          )}
                          {errorMsg && (
                            <div className="mt-4 text-xs px-4 py-3 rounded-lg flex items-center gap-2" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>⚠ {errorMsg}</div>
                          )}
                          <NavBtns paso={pasoManual} setPaso={(p) => setPasoManual(p as PasoManual)} setModo={setModo} onSave={guardarManual} guardando={guardando} editing={!!editId} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* IA */}
                {modo === "ia" && (
                  <>
                    {pasoIA === 1 && (
                      <>
                        <SeccionHeader icono={<IconPencil />} titulo="Información del módulo" subtitulo="Datos que usará la IA para estructurar el contenido" iconoBg="rgba(139,154,45,0.12)" iconoColor={IA_ACCENT} />
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-7">
                          <CamposBase nombre={nombre} setNombre={setNombre} descripcion={descripcion} setDescripcion={setDescripcion} categoria={categoria} setCategoria={setCategoria} idioma={idioma} setIdioma={setIdioma} duracion={duracion} setDuracion={setDuracion} />
                          <PortadaUpload preview={portadaIAPreview} onFile={(f) => { setPortadaIAFile(f); setPortadaIAPreview(URL.createObjectURL(f)); }} onRemove={() => { setPortadaIAFile(null); setPortadaIAPreview(""); }} accent={IA_ACCENT} accentLight="rgba(139,154,45,0.08)" />
                        </div>
                      </>
                    )}
                    {pasoIA === 2 && (
                      <>
                        {/* ── Documento ── */}
                        <SeccionHeader icono={<IconUpload sz={4} />} titulo="Documento base" subtitulo="La IA transformará este contenido en un módulo formativo" iconoBg="rgba(139,154,45,0.12)" iconoColor={IA_ACCENT}
                          right={archivosIA.length > 0 ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(139,154,45,0.12)", color: IA_ACCENT }}>{archivosIA.length} archivo{archivosIA.length !== 1 ? "s" : ""}</span> : undefined} />
                        <div onDragOver={(e) => { e.preventDefault(); setDraggingIA(true); }} onDragLeave={() => setDraggingIA(false)}
                          onDrop={(e) => { e.preventDefault(); setDraggingIA(false); procesarArchivosIA(e.dataTransfer.files); }}
                          onClick={() => inputIARef.current?.click()}
                          className="rounded-xl flex flex-col items-center gap-4 cursor-pointer transition-all mb-4"
                          style={{ border: `2px dashed ${draggingIA ? IA_ACCENT : "var(--gris-borde)"}`, background: draggingIA ? "rgba(139,154,45,0.06)" : "var(--gris-pagina)", minHeight: "160px", justifyContent: "center" }}>
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all" style={{ background: draggingIA ? IA_ACCENT : "var(--gris-superficie)", color: draggingIA ? "#fff" : "var(--texto-muted)" }}><IconUpload sz={6} /></div>
                          <div className="text-center">
                            <p className="text-sm font-semibold mb-1" style={{ color: "var(--texto-secundario)" }}>Arrastra o <span style={{ color: IA_ACCENT, textDecoration: "underline" }}>selecciona</span></p>
                            <p className="text-xs" style={{ color: "var(--texto-muted)" }}>PDF, DOCX, TXT — máx. 10 MB</p>
                          </div>
                          <input ref={inputIARef} type="file" multiple accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => procesarArchivosIA(e.target.files)} />
                        </div>
                        {archivosIA.length > 0 && (
                          <div className="flex flex-col gap-2 mb-6">
                            {archivosIA.map((a, idx) => (
                              <div key={idx} className="flex items-center gap-3 rounded-xl px-5 py-3.5" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(139,154,45,0.12)", color: IA_ACCENT }}><IconFile /></div>
                                <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--texto-primario)" }}>{a.nombre}</span>
                                <span className="text-xs" style={{ color: "var(--texto-muted)" }}>{a.tamano}</span>
                                <button onClick={() => { setArchivosIA((p) => p.filter((_, i) => i !== idx)); setArchivosIARaw((p) => p.filter((_, i) => i !== idx)); }}
                                  className="p-2 rounded-lg transition-colors" style={{ color: "var(--texto-muted)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--texto-muted)"; }}><IconTrash /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        {errorIA && (
                          <div className="mb-4 px-4 py-3 rounded-xl flex items-start gap-2.5" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <p className="text-xs">{errorIA}</p>
                          </div>
                        )}

                        {/* ── Tipo de contenido (fusionado) ── */}
                        <div className="pt-6 mt-2" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                          <SeccionHeader icono={<IconDoc />} titulo="Tipo de contenido a generar" subtitulo="Elige los formatos que creará la IA a partir de tu documento" iconoBg="rgba(139,154,45,0.12)" iconoColor={IA_ACCENT} />
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {COMBOS.map((combo, idx) => {
                              const sel = comboActivo === idx;
                              return (
                                <button key={idx} onClick={() => setTiposSalidaIA(combo.keys)}
                                  className="flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all w-full"
                                  style={{ border: `1.5px solid ${sel ? IA_ACCENT : "var(--gris-borde)"}`, background: sel ? "rgba(139,154,45,0.06)" : "var(--gris-pagina)" }}>
                                  <div className="flex gap-1.5 shrink-0">
                                    {combo.keys.map((k) => {
                                      const t = TIPOS_SALIDA.find((x) => x.key === k)!;
                                      return (<span key={k} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: sel ? t.color : "var(--gris-superficie)", color: sel ? "#fff" : "var(--texto-muted)" }}>{t.icon}</span>);
                                    })}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold leading-tight" style={{ color: "var(--texto-primario)" }}>{combo.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>{combo.desc}</p>
                                  </div>
                                  <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center" style={{ border: `2px solid ${sel ? IA_ACCENT : "var(--gris-borde)"}`, background: sel ? IA_ACCENT : "transparent" }}>
                                    {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                    {pasoIA === 3 && (
                      <>
                        <SeccionHeader icono={<IconUsers />} titulo="Visibilidad del módulo" subtitulo="Define quién puede acceder a este módulo" iconoBg="#f3e8ff" iconoColor="#7c3aed" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                          {([
                            { key: "todos" as AudienciaTipo, label: "Todos los empleados", desc: "Visible para cualquier empleado", icon: <IconUsers />, accent: "var(--azul-egm)", bg: "var(--azul-egm-light)" },
                            { key: "administradores" as AudienciaTipo, label: "Solo administradores", desc: "Solo admins de empresa", icon: <IconShield />, accent: "#7c3aed", bg: "#f3e8ff" },
                            { key: "departamento" as AudienciaTipo, label: "Por departamento", desc: "Departamentos específicos", icon: <IconBriefcase />, accent: "#d97706", bg: "#fffbeb" },
                          ] as const).map((op) => {
                            const sel = audiencia === op.key;
                            return (
                              <button key={op.key} onClick={() => setAudiencia(op.key)}
                                className="flex flex-col gap-3 px-5 py-5 rounded-xl text-left transition-all w-full"
                                style={{ border: `1.5px solid ${sel ? op.accent : "var(--gris-borde)"}`, background: sel ? op.bg : "var(--gris-pagina)" }}>
                                <div className="flex items-center justify-between">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: sel ? op.accent : "var(--gris-superficie)", color: sel ? "#fff" : "var(--texto-muted)" }}>{op.icon}</div>
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ border: `2px solid ${sel ? op.accent : "var(--gris-borde)"}`, background: sel ? op.accent : "transparent" }}>
                                    {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-bold mb-0.5" style={{ color: "var(--texto-primario)" }}>{op.label}</p>
                                  <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{op.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {audiencia === "departamento" && (
                          <div className="fade-up rounded-xl p-5 mb-2" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--texto-muted)" }}>Selecciona los departamentos</p>
                            <div className="flex flex-wrap gap-2">
                              {DEPARTAMENTOS.map((d) => {
                                const sel = deptos.includes(d.id);
                                return (
                                  <button key={d.id} onClick={() => toggleDepto(d.id)}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                                    style={{ border: `1.5px solid ${sel ? "#d97706" : "var(--gris-borde)"}`, background: sel ? "#fffbeb" : "var(--blanco)", color: sel ? "#d97706" : "var(--texto-muted)" }}>
                                    {sel && "✓ "}{d.label}
                                  </button>
                                );
                              })}
                            </div>
                            {deptos.length === 0 && <p className="text-xs mt-3" style={{ color: "#d97706" }}>⚠ Selecciona al menos un departamento</p>}
                          </div>
                        )}
                      </>
                    )}
                    {pasoIA === 4 && (
                      <>
                        <SeccionHeader icono={<IconTest />} titulo="Test de evaluación" subtitulo="La IA generará las preguntas automáticamente a partir del contenido" iconoBg="#dcfce7" iconoColor="#15803d" right={<Toggle value={tieneTestIA} onChange={setTieneTestIA} />} />
                        {tieneTestIA ? (
                          <div className="flex flex-col gap-5">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--texto-muted)" }}>Número de preguntas</label>
                              <div className="flex gap-3">
                                {[3, 5, 7, 10].map((n) => (
                                  <button key={n} onClick={() => setNumPreguntasIA(n)}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                                    style={{ border: `1.5px solid ${numPreguntasIA === n ? IA_ACCENT : "var(--gris-borde)"}`, background: numPreguntasIA === n ? "rgba(139,154,45,0.08)" : "var(--gris-pagina)", color: numPreguntasIA === n ? IA_ACCENT : "var(--texto-muted)" }}>
                                    {n}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-xl p-5 flex items-start gap-4" style={{ background: "rgba(139,154,45,0.05)", border: "1.5px solid rgba(139,154,45,0.2)" }}>
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,154,45,0.15)", color: IA_ACCENT }}><IconSpark sz={4} /></div>
                              <div>
                                <p className="text-sm font-bold mb-1" style={{ color: "var(--texto-primario)" }}>Generado automáticamente</p>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--texto-secundario)" }}>
                                  La IA creará <strong>{numPreguntasIA} preguntas tipo test</strong> basadas en el contenido del documento. Verás una previsualización al finalizar.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl flex flex-col items-center justify-center gap-3 py-14" style={{ background: "var(--gris-pagina)", border: "1.5px dashed var(--gris-borde)" }}>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}><IconTest /></div>
                            <p className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>Sin test de evaluación</p>
                            <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Activa el toggle para que la IA genere las preguntas.</p>
                          </div>
                        )}
                      </>
                    )}
                    {pasoIA === 5 && (
                      <>
                        <SeccionHeader icono={<IconSpark sz={4} />} titulo="Generar módulo con IA" subtitulo="Revisa la configuración y lanza la generación" iconoBg="rgba(139,154,45,0.12)" iconoColor={IA_ACCENT} />
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                            <div className="px-5 py-3.5" style={{ background: "var(--gris-pagina)", borderBottom: "1px solid var(--gris-borde)" }}>
                              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Resumen</p>
                            </div>
                            <div className="divide-y" style={{ borderColor: "var(--gris-borde)" }}>
                              {[
                                { label: "Módulo", value: <span className="font-semibold">{nombre}</span> },
                                ...(descripcion ? [{ label: "Descripción", value: descripcion }] : []),
                                { label: "Documento", value: archivosIA[0]?.nombre },
                                { label: "Idioma", value: ({ es: "Español", en: "Inglés", ca: "Valenciano" } as Record<string, string>)[idioma] ?? idioma },
                                {
                                  label: "Contenido", value: (
                                    <div className="flex gap-1.5 flex-wrap">
                                      {tiposSalidaIA.map((t) => { const info = TIPOS_SALIDA.find((x) => x.key === t)!; return (<span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: info.bg, color: info.color }}>{info.icon}{info.label}</span>); })}
                                    </div>
                                  )
                                },
                                { label: "Test", value: <span style={{ color: tieneTestIA ? "#15803d" : "var(--texto-muted)" }}>{tieneTestIA ? `Sí — ${numPreguntasIA} preguntas` : "No"}</span> },
                              ].map((row, i) => (
                                <div key={i} className="flex items-start gap-4 px-5 py-3">
                                  <span className="text-xs font-semibold w-24 shrink-0 mt-0.5" style={{ color: "var(--texto-muted)" }}>{row.label}</span>
                                  <span className="text-sm flex-1" style={{ color: "var(--texto-primario)" }}>{row.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-4">
                            {!generando && (
                              <button onClick={iniciarGeneracion} disabled={!puedeGenerar}
                                className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all"
                                style={{ background: puedeGenerar ? `linear-gradient(135deg, var(--azul-egm), ${IA_ACCENT})` : "var(--gris-superficie)", color: puedeGenerar ? "#fff" : "var(--texto-muted)", boxShadow: puedeGenerar ? "0 6px 20px rgba(27,63,126,0.22)" : "none", cursor: puedeGenerar ? "pointer" : "not-allowed" }}>
                                <IconSpark sz={4} />
                                {errorIA ? "Reintentar generación" : "Generar módulo con IA"}
                              </button>
                            )}
                            {generando && (
                              <div className="rounded-xl p-5" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(139,154,45,0.15)", color: IA_ACCENT }}>
                                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${IA_ACCENT} transparent transparent transparent` }} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>Generando módulo…</p>
                                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{msgProgreso}</p>
                                  </div>
                                </div>
                                <div className="w-full rounded-full overflow-hidden" style={{ height: "6px", background: "var(--gris-borde)" }}>
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progreso}%`, background: `linear-gradient(90deg, var(--azul-egm), ${IA_ACCENT})` }} />
                                </div>
                                <p className="text-right text-xs mt-1.5 font-semibold tabular-nums" style={{ color: "var(--texto-muted)" }}>{progreso}%</p>
                              </div>
                            )}
                            {errorIA && !generando && (
                              <div className="px-4 py-3 rounded-xl flex items-start gap-2.5" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                <div><p className="text-xs font-semibold">Error al generar el módulo</p><p className="text-xs mt-0.5">{errorIA}</p></div>
                              </div>
                            )}
                            <div className="rounded-xl p-4" style={{ background: "var(--info-light)", border: "1px solid rgba(91,127,166,0.2)" }}>
                              <p className="text-xs font-semibold mb-1" style={{ color: "var(--info)" }}>¿Cuánto tarda?</p>
                              <p className="text-xs leading-relaxed" style={{ color: "var(--texto-secundario)" }}>Entre 30 seg. y 2 min. según el tamaño del documento. No cierres esta ventana.</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ── BOTONES INFERIORES ── */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-6" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                  <button
                    onClick={() => { if (modo === "manual") { pasoManual > 1 ? setPasoManual((pasoManual - 1) as PasoManual) : setModo(null); } else { pasoIA > 1 ? setPasoIA((pasoIA - 1) as PasoIA) : setModo(null); } }}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}>
                    {(modo === "manual" ? pasoManual : pasoIA) === 1 ? "Limpiar" : "← Atrás"}
                  </button>
                  {/* Último paso manual: guardar */}
                  {modo === "manual" && pasoManual === 4 ? (
                    <button onClick={guardarManual} disabled={guardando}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2"
                      style={{ background: "var(--verde-oliva)", color: "#fff", opacity: guardando ? 0.7 : 1, boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}>
          {guardando ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando…</> : (editId ? "Actualizar módulo" : "Guardar módulo")}
                    </button>
                  ) : modo === "ia" && pasoIA === 5 ? null : (
                    <button
                      onClick={() => { if (modo === "manual") setPasoManual((pasoManual + 1) as PasoManual); else setPasoIA((pasoIA + 1) as PasoIA); }}
                      disabled={
                        (modo === "manual" && pasoManual === 1 && !nombre.trim()) ||
                        (modo === "manual" && pasoManual === 2 && !archivoM) ||
                        (modo === "manual" && pasoManual === 3 && audiencia === "departamento" && deptos.length === 0) ||
                        (modo === "ia" && pasoIA === 1 && !nombre.trim()) ||
                        (modo === "ia" && pasoIA === 2 && archivosIA.length === 0) ||
                        (modo === "ia" && pasoIA === 3 && audiencia === "departamento" && deptos.length === 0)
                      }
                      className="px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                      style={{
                        background: (
                          (modo === "manual" && pasoManual === 1 && !nombre.trim()) ||
                          (modo === "manual" && pasoManual === 2 && !archivoM) ||
                          (modo === "manual" && pasoManual === 3 && audiencia === "departamento" && deptos.length === 0) ||
                          (modo === "ia" && pasoIA === 1 && !nombre.trim()) ||
                          (modo === "ia" && pasoIA === 2 && archivosIA.length === 0) ||
                          (modo === "ia" && pasoIA === 3 && audiencia === "departamento" && deptos.length === 0)
                        ) ? "var(--gris-superficie)" : modo === "ia" ? IA_ACCENT : "var(--azul-egm)",
                        color: (
                          (modo === "manual" && pasoManual === 1 && !nombre.trim()) ||
                          (modo === "manual" && pasoManual === 2 && !archivoM) ||
                          (modo === "manual" && pasoManual === 3 && audiencia === "departamento" && deptos.length === 0) ||
                          (modo === "ia" && pasoIA === 1 && !nombre.trim()) ||
                          (modo === "ia" && pasoIA === 2 && archivosIA.length === 0) ||
                          (modo === "ia" && pasoIA === 3 && audiencia === "departamento" && deptos.length === 0)
                        ) ? "var(--texto-muted)" : "#fff",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.12)"
                      }}>
                      Continuar <IconArrow />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ══ ÉXITO ══ */}
            {(guardado || generado) && (
              <div className="px-8 py-7 fade-up">
                {/* Banner */}
                <div className="rounded-2xl p-7 mb-6 flex items-center gap-6 flex-wrap"
                  style={{ background: "linear-gradient(135deg, var(--verde-oliva), var(--exito))", boxShadow: "0 4px 24px rgba(45,125,78,0.22)" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.18)" }}>
                    <IconCheck sz={7} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white mb-1">¡Módulo creado correctamente!</h2>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                      <strong className="text-white">{resultadoIA?.titulo || nombre}</strong> ya está disponible en la plataforma.
                    </p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => router.push("/dashboard/admin?tab=formaciones")}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}>
                      Ver módulos
                    </button>
                    <button onClick={resetear} className="px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                      style={{ background: "#fff", color: "var(--exito)" }}>
                      Crear otro
                    </button>
                  </div>
                </div>

                {/* Badges */}
                {generado && tiposSalidaIA.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mb-5">
                    {tiposSalidaIA.map((t) => { const info = TIPOS_SALIDA.find((x) => x.key === t); if (!info) return null; return (<span key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: info.bg, color: info.color, border: `1.5px solid ${info.color}` }}>{info.icon}{info.label}</span>); })}
                    {generado && tieneTestIA && preguntasGeneradasIA.length > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#f0fdf4", color: "#15803d", border: "1.5px solid #86efac" }}>
                        <IconCheck sz={3} /> Test · {preguntasGeneradasIA.length} preguntas
                      </span>
                    )}
                  </div>
                )}

                {/* Previsualizaciones */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {generado && resultadoIA?.contenido && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
                      <div className="px-5 py-4 flex items-center gap-2.5" style={{ background: "var(--gris-pagina)", borderBottom: "1px solid var(--gris-borde)" }}>
                        <IconFile />
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Previsualización del contenido</p>
                      </div>
                      <div className="p-6 overflow-y-auto" style={{ maxHeight: "320px" }}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texto-secundario)" }}>
                          {resultadoIA.contenido.slice(0, 1200)}{resultadoIA.contenido.length > 1200 ? "\n\n…(contenido completo disponible en el módulo)" : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  {generado && tieneTestIA && preguntasGeneradasIA.length > 0 && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
                      <div className="px-5 py-4 flex items-center gap-2.5" style={{ background: "var(--gris-pagina)", borderBottom: "1px solid var(--gris-borde)" }}>
                        <IconTest />
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Preguntas del test generadas</p>
                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: "#15803d" }}>{preguntasGeneradasIA.length} preguntas</span>
                      </div>
                      <div className="divide-y overflow-y-auto" style={{ borderColor: "var(--gris-borde)", maxHeight: "320px" }}>
                        {preguntasGeneradasIA.map((q, qi) => (
                          <div key={qi} className="px-5 py-4">
                            <p className="text-sm font-semibold mb-3" style={{ color: "var(--texto-primario)" }}>
                              <span className="inline-block mr-2 px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>P{qi + 1}</span>
                              {q.texto}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {q.opciones.map((op, oi) => (
                                <div key={oi} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                                  style={{ border: `1.5px solid ${q.correcta === oi ? "#16a34a" : "var(--gris-borde)"}`, background: q.correcta === oi ? "#f0fdf4" : "var(--gris-pagina)", color: q.correcta === oi ? "#15803d" : "var(--texto-secundario)" }}>
                                  {q.correcta === oi && <IconCheck sz={3} />}{op}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>{/* /tarjeta única */}
        </div>
      </div>
    </div>
  );
}
