"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, FileUp, Settings, SquareCheckBig, TextInitial } from "lucide-react";
import Link from "next/link";
import { API_URL, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { subirImagenModulo, subirAdjunto } from "@/lib/supabase";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { getModulosConProgreso } from "@/lib/api/modulos";

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type TipoPagina = "texto" | "archivo" | "test";

interface PreguntaPagina {
  texto: string;
  opciones: string[];
  correcta: number;
}

interface PaginaModulo {
  id: number;
  tipo: TipoPagina;
  titulo: string;
  contenido: string;
  archivoUrl: string | null;
  archivoNombre: string | null;
  archivoFile: File | null;
  preguntas: PreguntaPagina[];
}

interface ArchivoSubido {
  nombre: string; tamano: string; tipo: "pdf" | "docx" | "video" | "audio" | "otro";
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
const getTipoArchivo = (nombre: string): ArchivoSubido["tipo"] => {
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
const IconChevronDown = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
const IconGrip = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>;
const IconX = () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>;

const ROLES_BLOQUEADOS = ["ROLE_EMPLEADO", "INVITADO"];

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

const TIPOS_PAGINA: { key: TipoPagina; label: string; desc: string; icon: React.ReactNode; accent: string; bg: string; badge: string }[] = [
  { key: "texto", label: "Texto", desc: "Contenido escrito", icon: <TextInitial />, accent: "var(--azul-egm)", bg: "var(--azul-egm-light)", badge: "bg:var(--azul-egm-light)|color:var(--azul-egm)" },
  { key: "archivo", label: "Archivo", desc: "PDF, DOCX, vídeo, audio", icon: <FileUp />, accent: "#d97706", bg: "#fffbeb", badge: "bg:#fffbeb|color:#d97706" },
  { key: "test", label: "Test", desc: "Preguntas de evaluación", icon: <SquareCheckBig />, accent: "#15803d", bg: "#dcfce7", badge: "bg:#dcfce7|color:#15803d" },
];

function getTipoConfig(tipo: TipoPagina) {
  return TIPOS_PAGINA.find((t) => t.key === tipo)!;
}

const CS = { border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" };
const SEL = "w-full text-sm px-3 py-2.5 rounded-lg outline-none cursor-pointer";

// ── TOGGLE ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="relative inline-flex items-center rounded-full transition-colors shrink-0"
      style={{ width: "44px", height: "24px", background: value ? "var(--verde-oliva)" : "var(--gris-borde)" }}>
      <span className="inline-block rounded-full bg-white transition-transform"
        style={{ width: "18px", height: "18px", transform: value ? "translateX(22px)" : "translateX(3px)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
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
        <div className="relative rounded-xl overflow-hidden" style={{ height: "140px", border: "1.5px solid var(--gris-borde)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Portada" className="w-full h-full object-cover" />
          <button type="button" onClick={onRemove} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs hover:opacity-80" style={{ background: "rgba(0,0,0,0.55)" }}><i className="bi bi-x-lg" style={{ fontSize: "12px" }} /></button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
          style={{ border: "2px dashed var(--gris-borde)", background: "var(--gris-pagina)", height: "140px" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = accentLight; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--gris-pagina)"; }}>
          <div style={{ color: "var(--texto-muted)" }}><IconImage /></div>
          <p className="text-sm font-medium text-center" style={{ color: "var(--texto-muted)" }}>Subir portada</p>
          <p className="text-xs" style={{ color: "var(--gris-borde)" }}>JPG · PNG · WEBP</p>
        </div>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ── GENERAR SVG DE PORTADA ──────────────────────────────────────────────────
const CATEGORIA_COLORS: Record<string, { from: string; to: string; icon: string }> = {
  IDENTIDAD: { from: "#1e3a5f", to: "#2d5a8e", icon: "🏢" },
  BASICA: { from: "#166534", to: "#22c55e", icon: "📘" },
  ESPECIFICA: { from: "#7c3aed", to: "#a855f7", icon: "🎯" },
  DESARROLLO: { from: "#b45309", to: "#f59e0b", icon: "📈" },
  RECOMPENSAS: { from: "#15803d", to: "#4ade80", icon: "🎁" },
  COMUNIDAD: { from: "#0369a1", to: "#38bdf8", icon: "🤝" },
  CUMPLIMIENTO: { from: "#b91c1c", to: "#ef4444", icon: "⚖️" },
  LIDERAZGO: { from: "#6d28d9", to: "#8b5cf6", icon: "👔" },
  TECNICO: { from: "#1e40af", to: "#3b82f6", icon: "⚙️" },
  SOFT_SKILLS: { from: "#be185d", to: "#ec4899", icon: "💬" },
  ONBOARDING: { from: "#0f766e", to: "#14b8a6", icon: "🚀" },
};

function generarSVGPortada(nombre: string, categoria: string, prompt?: string): string {
  const colores = CATEGORIA_COLORS[categoria] ?? CATEGORIA_COLORS.ESPECIFICA;
  const palabrasClave = prompt
    ? prompt.split(" ").slice(0, 6).join(", ")
    : nombre.toLowerCase().split(" ").slice(0, 4).join(", ");
  const nombreCortado = nombre.length > 50 ? nombre.slice(0, 47) + "..." : nombre;
  const icono = colores.icon;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colores.from};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colores.to};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.08)" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0)" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.2)" />
    </filter>
  </defs>
  <rect width="800" height="450" fill="url(#bg)" rx="16" />
  <circle cx="600" cy="50" r="250" fill="rgba(255,255,255,0.04)" />
  <circle cx="100" cy="420" r="180" fill="rgba(255,255,255,0.03)" />
  <rect x="0" y="0" width="800" height="450" fill="url(#glow)" rx="16" />
  <text x="50" y="130" font-family="system-ui,sans-serif" font-size="100" filter="url(#shadow)">${icono}</text>
  <text x="50" y="220" font-family="system-ui,sans-serif" font-weight="800" font-size="42" fill="white" filter="url(#shadow)">${nombreCortado}</text>
  <circle cx="50" cy="255" r="4" fill="rgba(255,255,255,0.3)" />
  <text x="70" y="268" font-family="system-ui,sans-serif" font-weight="500" font-size="18" fill="rgba(255,255,255,0.6)">${categoria}</text>
  <circle cx="50" cy="295" r="4" fill="rgba(255,255,255,0.3)" />
  <text x="70" y="308" font-family="system-ui,sans-serif" font-weight="400" font-size="14" fill="rgba(255,255,255,0.4)">${palabrasClave}</text>
  <rect x="50" y="350" width="160" height="40" rx="20" fill="rgba(255,255,255,0.15)" />
  <text x="130" y="376" font-family="system-ui,sans-serif" font-weight="600" font-size="14" fill="white" text-anchor="middle">Módulo IA</text>
  <text x="740" y="430" font-family="system-ui,sans-serif" font-weight="300" font-size="12" fill="rgba(255,255,255,0.25)" text-anchor="end">Atalayas · Formación</text>
</svg>`;
  return svg;
}

async function svgToFile(svg: string, nombre: string): Promise<File> {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const nombreSinExt = nombre.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30) || "portada";
  return new File([blob], `${nombreSinExt}.svg`, { type: "image/svg+xml" });
}

/** Renderiza un SVG en un Canvas y lo exporta como PNG (evita problemas de subida con SVG) */
async function svgToPngFile(svg: string, nombre: string): Promise<File> {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Error al cargar SVG")); };
  });
  img.src = url;
  await loaded;
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext("2d");
  if (!ctx) { URL.revokeObjectURL(url); throw new Error("Canvas 2D no disponible"); }
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  return new Promise((resolve, reject) => {
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) { reject(new Error("Error al convertir a PNG")); return; }
      const nombreSinExt = nombre.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30) || "portada";
      resolve(new File([pngBlob], `${nombreSinExt}.png`, { type: "image/png" }));
    }, "image/png");
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function CrearModuloPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();

  const editId = searchParams.get("edit");
  const [moduloEditando, setModuloEditando] = useState<ModuloConProgreso | null>(null);
  const [cargandoEdicion, setCargandoEdicion] = useState(!!editId);

  // ── Info base del módulo ──────────────────────────────────────────────────
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("ESPECIALIZADO");
  const [idioma, setIdioma] = useState("es");
  const [duracion, setDuracion] = useState("medio");
  const [audiencia, setAudiencia] = useState<AudienciaTipo>("todos");
  const [deptos, setDeptos] = useState<string[]>([]);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string>("");
  const [activo, setActivo] = useState(true);

  // ── Podcast ───────────────────────────────────────────────────────────────
  const [scriptPodcast, setScriptPodcast] = useState("");
  const [tiposSalida, setTiposSalida] = useState("documentacion");

  // ── Páginas del módulo ────────────────────────────────────────────────────
  const [paginas, setPaginas] = useState<PaginaModulo[]>([]);
  const [paginaActivaId, setPaginaActivaId] = useState<number | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [configOpen, setConfigOpen] = useState(true);
  const [mostrarSelectorTipo, setMostrarSelectorTipo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ── IA state ──────────────────────────────────────────────────────────────
  const [mostrarIA, setMostrarIA] = useState(false);
  const [promptIA, setPromptIA] = useState("");
  const [generandoIA, setGenerandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState("");

  const inputArchivoRef = useRef<HTMLInputElement>(null);

  // Cargar datos del módulo a editar
  useEffect(() => {
    if (!editId || !usuario?.empresaId) return;
    const cargarModulo = async () => {
      try {
        const modulos = await getModulosConProgreso();
        const modulo = modulos.find((m) => m.moduloId === editId);
        if (modulo) {
          setModuloEditando(modulo);
          setNombre(modulo.nombre);
          setDescripcion(modulo.descripcion || "");
          if (modulo.tipoModulo) setCategoria(modulo.tipoModulo);
          if (modulo.imagenPortadaUrl) setPortadaPreview(modulo.imagenPortadaUrl);
          if (modulo.idioma) setIdioma(modulo.idioma);
          if (modulo.duracion) setDuracion(modulo.duracion);
          if (modulo.audiencia) setAudiencia(modulo.audiencia as AudienciaTipo);
          if (modulo.departamentos) {
            try { setDeptos(JSON.parse(modulo.departamentos)); } catch { /* */ }
          }
          if (modulo.activo !== undefined) setActivo(modulo.activo);
          if (modulo.contenidoMarkdown) {
            try {
              const paginasParseadas = JSON.parse(modulo.contenidoMarkdown);
              if (Array.isArray(paginasParseadas) && paginasParseadas.length > 0) {
                const paginasRecuperadas = paginasParseadas.map((p: any, i: number) => ({
                  id: newId(),
                  tipo: (p.tipo as TipoPagina) || "texto",
                  titulo: p.titulo || `Página ${i + 1}`,
                  contenido: p.contenido || "",
                  archivoUrl: p.archivoUrl || null,
                  archivoNombre: p.archivoNombre || null,
                  archivoFile: null,
                  preguntas: Array.isArray(p.preguntas) ? p.preguntas : [],
                }));
                setPaginas(paginasRecuperadas);
                setPaginaActivaId(paginasRecuperadas[0].id);
              }
            } catch {
              setPaginas([{ id: newId(), tipo: "texto", titulo: "Introducción", contenido: modulo.contenidoMarkdown, archivoUrl: null, archivoNombre: null, archivoFile: null, preguntas: [] }]);
              setPaginaActivaId(_pid - 1);
            }
          }
        }
      } catch (e) {
        console.error("Error al cargar módulo para editar:", e);
      } finally {
        setCargandoEdicion(false);
      }
    };
    cargarModulo();
  }, [editId, usuario?.empresaId]);

  useEffect(() => {
    if (usuario && ROLES_BLOQUEADOS.includes(usuario.codigoRol)) router.replace("/dashboard");
  }, [usuario]);
  if (!usuario || ROLES_BLOQUEADOS.includes(usuario.codigoRol)) return null;

  const toggleDepto = (id: string) =>
    setDeptos((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);

  const nuevaPagina = (tipo: TipoPagina) => {
    const nueva: PaginaModulo = {
      id: newId(),
      tipo,
      titulo: tipo === "texto" ? `Página ${paginas.length + 1}` : tipo === "archivo" ? `Documento ${paginas.length + 1}` : `Test ${paginas.length + 1}`,
      contenido: "",
      archivoUrl: null,
      archivoNombre: null,
      archivoFile: null,
      preguntas: tipo === "test" ? [{ texto: "", opciones: ["", "", "", ""], correcta: 0 }] : [],
    };
    setPaginas((p) => [...p, nueva]);
    setPaginaActivaId(nueva.id);
    setMostrarSelectorTipo(false);
  };

  const eliminarPagina = (id: number) => {
    setPaginas((p) => {
      const nuevas = p.filter((pg) => pg.id !== id);
      if (paginaActivaId === id) {
        setPaginaActivaId(nuevas.length > 0 ? nuevas[0].id : null);
      }
      return nuevas;
    });
  };

  const actualizarPagina = (id: number, campo: keyof PaginaModulo, valor: string) => {
    setPaginas((p) => p.map((pg) => pg.id === id ? { ...pg, [campo]: valor } : pg));
  };

  const actualizarPregunta = (idPagina: number, idxPregunta: number, campo: keyof PreguntaPagina, valor: string | number | string[]) => {
    setPaginas((p) => p.map((pg) => {
      if (pg.id !== idPagina) return pg;
      const nuevas = [...pg.preguntas];
      nuevas[idxPregunta] = { ...nuevas[idxPregunta], [campo]: valor };
      return { ...pg, preguntas: nuevas };
    }));
  };

  const agregarPregunta = (idPagina: number) => {
    setPaginas((p) => p.map((pg) => pg.id !== idPagina ? pg : { ...pg, preguntas: [...pg.preguntas, { texto: "", opciones: ["", "", "", ""], correcta: 0 }] }));
  };

  const eliminarPregunta = (idPagina: number, idx: number) => {
    setPaginas((p) => p.map((pg) => {
      if (pg.id !== idPagina) return pg;
      const nuevas = pg.preguntas.filter((_, i) => i !== idx);
      return { ...pg, preguntas: nuevas };
    }));
  };

  const moverPagina = (id: number, direccion: "up" | "down") => {
    setPaginas((p) => {
      const idx = p.findIndex((pg) => pg.id === id);
      if (idx < 0) return p;
      const nuevoIdx = direccion === "up" ? idx - 1 : idx + 1;
      if (nuevoIdx < 0 || nuevoIdx >= p.length) return p;
      const copia = [...p];
      [copia[idx], copia[nuevoIdx]] = [copia[nuevoIdx], copia[idx]];
      return copia;
    });
  };

  const paginaActiva = paginas.find((p) => p.id === paginaActivaId) ?? null;

  const guardarModulo = async () => {
    if (!nombre.trim()) { setErrorMsg("El nombre del módulo es obligatorio"); return; }
    setGuardando(true); setErrorMsg("");
    try {
      let imagenPortadaUrl: string | null = null;
      if (portadaFile) {
        try { imagenPortadaUrl = await subirImagenModulo(portadaFile); }
        catch (e) { console.warn("No se pudo subir la imagen de portada:", e); }
      } else if (editId && moduloEditando?.imagenPortadaUrl) {
        imagenPortadaUrl = moduloEditando.imagenPortadaUrl;
      }

      // Subir archivos de las páginas tipo archivo
      const paginasConArchivos = await Promise.all(
        paginas.map(async (p) => {
          if (p.tipo === "archivo" && p.archivoFile) {
            try {
              const adjunto = await subirAdjunto(p.archivoFile);
              return { ...p, archivoUrl: adjunto.url, archivoNombre: adjunto.nombre, archivoFile: null };
            } catch {
              return { ...p, archivoFile: null };
            }
          }
          return { ...p, archivoFile: null };
        })
      );

      const contenidoJson = JSON.stringify(paginasConArchivos.map((p) => ({
        tipo: p.tipo,
        titulo: p.titulo,
        contenido: p.contenido,
        archivoUrl: p.archivoUrl,
        archivoNombre: p.archivoNombre,
        preguntas: p.preguntas,
      })));

      const url = editId ? `${API_URL}/modulos/${editId}` : `${API_URL}/modulos`;
      const method = editId ? "PUT" : "POST";
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          tipoModulo: categoria,
          activo,
          empresaId: usuario?.empresaId ?? null,
          idioma,
          duracion,
          audiencia,
          departamentos: audiencia === "departamento" ? JSON.stringify(deptos) : "[]",
          contenidoMarkdown: contenidoJson,
          imagenPortadaUrl,
          testPreguntas: null,
          scriptPodcast: scriptPodcast || null,
          tiposSalida,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Error al guardar"); }
      setGuardado(true);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar. Inténtalo de nuevo.");
    } finally { setGuardando(false); }
  };

  const generarConIA = async () => {
    if (!promptIA.trim()) { setErrorIA("Describe el módulo que quieres crear"); return; }
    setGenerandoIA(true); setErrorIA("");
    try {
      const res = await fetch("/api/chat/generate-modulo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptIA.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al generar el módulo");
      }
      const data = await res.json();
      setNombre(data.nombre || "");
      setDescripcion(data.descripcion || "");
      if (data.categoria) setCategoria(data.categoria);

      // Procesar páginas
      const paginasGeneradas: PaginaModulo[] = (data.paginas || []).map((p: any, i: number) => ({
        id: newId(),
        tipo: p.tipo === "test" ? "test" : "texto",
        titulo: p.titulo || `Página ${i + 1}`,
        contenido: p.contenido || "",
        archivoUrl: null,
        archivoNombre: null,
        archivoFile: null,
        preguntas: p.tipo === "test" && Array.isArray(p.preguntas)
          ? p.preguntas.map((q: any) => ({
              texto: q.texto || "",
              opciones: Array.isArray(q.opciones) && q.opciones.length >= 2 ? q.opciones : ["Verdadero", "Falso"],
              correcta: typeof q.correcta === "number" ? q.correcta : 0,
            }))
          : [],
      }));
      setPaginas(paginasGeneradas);

      // Procesar podcast
      const tienePodcast = !!data.scriptPodcast;
      setScriptPodcast(data.scriptPodcast || "");
      setTiposSalida(tienePodcast ? "documentacion,podcast" : "documentacion");

      // Generar portada SVG y convertir a PNG
      const cat = data.categoria || "ESPECIFICA";
      const svg = generarSVGPortada(data.nombre || "", cat, data.portadaPrompt);
      const pngFile = await svgToPngFile(svg, data.nombre || "portada");
      setPortadaFile(pngFile);
      const blobUrl = URL.createObjectURL(pngFile);
      setPortadaPreview(blobUrl);

      setPaginaActivaId(paginasGeneradas.length > 0 ? paginasGeneradas[0].id : null);
      setMostrarIA(false);
      setConfigOpen(false);
    } catch (e: unknown) {
      setErrorIA(e instanceof Error ? e.message : "Error al generar el módulo");
    } finally {
      setGenerandoIA(false);
    }
  };

  const resetear = () => {
    setNombre(""); setDescripcion(""); setCategoria("ESPECIALIZADO");
    setIdioma("es"); setDuracion("medio"); setAudiencia("todos"); setDeptos([]);
    setPaginas([]); setPaginaActivaId(null); setPortadaFile(null); setPortadaPreview("");
    setScriptPodcast(""); setTiposSalida("documentacion");
    setGuardado(false); setErrorMsg(""); setActivo(true); setMostrarSelectorTipo(false);
  };

  const inputBase = { border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--blanco)" };
  const onF = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "var(--azul-egm)";
    if ("style" in e.target) (e.target as HTMLElement).style.boxShadow = "0 0 0 3px var(--azul-egm-light)";
  };
  const onB = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "var(--gris-borde)";
    if ("style" in e.target) (e.target as HTMLElement).style.boxShadow = "none";
  };

  if (cargandoEdicion) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: "var(--gris-pagina)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--azul-egm) transparent transparent transparent" }} />
          <p className="text-sm" style={{ color: "var(--texto-muted)" }}>Cargando módulo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-20" style={{ background: "var(--gris-pagina)" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .28s ease both}`}</style>

      {/* ══ HEADER BREADCRUMBS ══ */}
      <div style={{ background: "var(--blanco)", borderBottom: "1px solid var(--gris-borde)" }}>
        <div className="px-8 lg:px-12 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Link href="/dashboard/admin"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}>
                  ← Volver
                </Link>
                {!editId && (
                  <button type="button" onClick={() => setMostrarIA(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", boxShadow: "0 2px 10px rgba(124,58,237,0.25)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9" }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 7.26L22 12l-7.91 2.74L12 22l-2.09-7.26L2 12l7.91-2.74z" /></svg>
                    Crear con IA
                  </button>
                )}
              </div>
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
          </div>
        </div>
      </div>

      {/* ══ CUERPO ══ */}
      <div className="px-8 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto">

          {/* ══ CONFIGURACIÓN DEL MÓDULO (colapsable) ══ */}
          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <button type="button" onClick={() => setConfigOpen(!configOpen)}
              className="w-full flex items-center justify-between px-6 py-4 hover:opacity-90 transition-opacity"
              style={{ background: "var(--gris-pagina)", borderBottom: configOpen ? "1px solid var(--gris-borde)" : "none" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}><Settings /></div>
                <div className="text-left">
                  <p className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>
                    {nombre || "Configuración del módulo"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
                    {paginas.length} página{paginas.length !== 1 ? "s" : ""} · {descripcion ? descripcion.slice(0, 60) : "Sin descripción"}
                  </p>
                </div>
              </div>
              <div className="transition-transform" style={{ transform: configOpen ? "rotate(0)" : "rotate(-90deg)" }}>
                <ChevronDown />
              </div>
            </button>

            {configOpen && (
              <div className="px-6 py-5 fade-up">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_200px] gap-6">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
                        Nombre del módulo <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Seguridad en planta — Nivel básico"
                        className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-all"
                        style={inputBase} onFocus={onF} onBlur={onB} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
                        Descripción corta
                      </label>
                      <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Frase corta que aparecerá en la tarjeta del módulo"
                        className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-all"
                        style={inputBase} onFocus={onF} onBlur={onB} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Categoría</label>
                        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={SEL} style={CS} onFocus={onF} onBlur={onB}>
                          <option value="IDENTIDAD">Identidad Corporativa</option>
                          <option value="BASICA">Formación Básica</option>
                          <option value="ESPECIFICA">Formación Específica</option>
                          <option value="DESARROLLO">Desarrollo Profesional</option>
                          <option value="RECOMPENSAS">Recompensas y Ventajas</option>
                          <option value="COMUNIDAD">Comunidad</option>
                          <option value="CUMPLIMIENTO">Cumplimiento normativo</option>
                          <option value="LIDERAZGO">Liderazgo</option>
                          <option value="TECNICO">Técnico</option>
                          <option value="SOFT_SKILLS">Soft Skills</option>
                          <option value="ONBOARDING">Onboarding</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Idioma</label>
                        <select value={idioma} onChange={(e) => setIdioma(e.target.value)} className={SEL} style={CS} onFocus={onF} onBlur={onB}>
                          <option value="es">Español</option>
                          <option value="en">Inglés</option>
                          <option value="ca">Valenciano</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Duración</label>
                        <select value={duracion} onChange={(e) => setDuracion(e.target.value)} className={SEL} style={CS} onFocus={onF} onBlur={onB}>
                          <option value="corto">−15 min</option>
                          <option value="medio">15–45 min</option>
                          <option value="largo">+45 min</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Visibilidad</label>
                      <div className="flex gap-2">
                        {([
                          { key: "todos" as AudienciaTipo, label: "Todos", icon: <IconUsers /> },
                          { key: "administradores" as AudienciaTipo, label: "Admins", icon: <IconShield /> },
                          { key: "departamento" as AudienciaTipo, label: "Departamento", icon: <IconBriefcase /> },
                        ]).map((op) => {
                          const sel = audiencia === op.key;
                          return (
                            <button key={op.key} type="button" onClick={() => setAudiencia(op.key)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex-1"
                              style={{
                                border: `1.5px solid ${sel ? "var(--azul-egm)" : "var(--gris-borde)"}`,
                                background: sel ? "var(--azul-egm-light)" : "var(--gris-pagina)",
                                color: sel ? "var(--azul-egm)" : "var(--texto-muted)",
                              }}>
                              {op.icon} {op.label}
                            </button>
                          );
                        })}
                      </div>
                      {audiencia === "departamento" && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {DEPARTAMENTOS.map((d) => {
                            const sel = deptos.includes(d.id);
                            return (
                              <button key={d.id} type="button" onClick={() => toggleDepto(d.id)}
                                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                                style={{
                                  border: `1.5px solid ${sel ? "#d97706" : "var(--gris-borde)"}`,
                                  background: sel ? "#fffbeb" : "var(--blanco)",
                                  color: sel ? "#d97706" : "var(--texto-muted)",
                                }}>
                                {sel && "✓ "}{d.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Módulo activo</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                          {activo ? "Visible para los empleados" : "Oculto para los empleados"}
                        </p>
                      </div>
                      <Toggle value={activo} onChange={setActivo} />
                    </div>
                  </div>
                  <PortadaUpload
                    preview={portadaPreview}
                    onFile={(f) => { setPortadaFile(f); setPortadaPreview(URL.createObjectURL(f)); }}
                    onRemove={() => { setPortadaFile(null); setPortadaPreview(""); }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ══ EDITOR DE PÁGINAS ══ */}
          <div className="rounded-2xl overflow-hidden fade-up" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", minHeight: "500px" }}>
            <div className="flex" style={{ height: "calc(100vh - 340px)", minHeight: "500px" }}>

              {/* Sidebar izquierda - Lista de páginas */}
              <div className="flex flex-col" style={{ width: "260px", borderRight: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Páginas</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                    {paginas.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                  {paginas.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                        <IconDoc />
                      </div>
                      <p className="text-xs font-semibold mb-1" style={{ color: "var(--texto-secundario)" }}>Sin páginas</p>
                      <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Añade la primera página del módulo</p>
                    </div>
                  )}
                  {paginas.map((pagina, idx) => {
                    const activa = pagina.id === paginaActivaId;
                    const tipoCfg = getTipoConfig(pagina.tipo);
                    const contenidoPreview = pagina.tipo === "texto" ? pagina.contenido.slice(0, 40).trim()
                      : pagina.tipo === "archivo" ? (pagina.archivoNombre || "Sin archivo")
                        : `${pagina.preguntas.length} pregunta${pagina.preguntas.length !== 1 ? "s" : ""}`;
                    return (
                      <div key={pagina.id}
                        className={`group relative mx-2 mb-1 rounded-lg transition-all cursor-pointer ${activa ? "" : "hover:bg-white/50"}`}
                        style={activa ? { background: "var(--blanco)", border: "1.5px solid var(--azul-egm)", boxShadow: "0 2px 8px rgba(27,63,126,0.1)" } : { border: "1.5px solid transparent" }}>
                        <div onClick={() => setPaginaActivaId(pagina.id)} className="flex items-start gap-2 px-3 py-2.5">
                          {/* Tipo badge */}
                          <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: tipoCfg.bg, color: tipoCfg.accent }}>
                            {pagina.tipo === "texto" ? <IconDoc /> : pagina.tipo === "archivo" ? <IconUpload sz={3} /> : <IconTest />}
                          </div>
                          {/* Info página */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: activa ? "var(--texto-primario)" : "var(--texto-secundario)" }}>
                              {idx + 1}. {pagina.titulo}
                            </p>
                            <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--texto-muted)" }}>
                              {contenidoPreview}
                            </p>
                          </div>
                        </div>
                        {/* Mover arriba/abajo */}
                        <div className="absolute right-2 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={(e) => { e.stopPropagation(); moverPagina(pagina.id, "up"); }}
                            disabled={idx === 0}
                            className="w-5 h-5 flex items-center justify-center rounded transition-colors disabled:opacity-30"
                            style={{ color: "var(--texto-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-borde)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="18 15 12 9 6 15" /></svg>
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); moverPagina(pagina.id, "down"); }}
                            disabled={idx === paginas.length - 1}
                            className="w-5 h-5 flex items-center justify-center rounded transition-colors disabled:opacity-30"
                            style={{ color: "var(--texto-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-borde)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="6 9 12 15 18 9" /></svg>
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); eliminarPagina(pagina.id); }}
                            className="w-5 h-5 flex items-center justify-center rounded transition-colors"
                            style={{ color: "var(--texto-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--texto-muted)"; }}>
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botón añadir página */}
                <div className="px-3 py-3" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                  <button type="button" onClick={() => setMostrarSelectorTipo(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={{ border: "1.5px dashed var(--gris-borde)", color: "var(--texto-muted)", background: "transparent" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--azul-egm)"; e.currentTarget.style.color = "var(--azul-egm)"; e.currentTarget.style.background = "var(--azul-egm-light)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.color = "var(--texto-muted)"; e.currentTarget.style.background = "transparent"; }}>
                    <IconPlus /> Añadir página
                  </button>
                </div>
              </div>

              {/* Editor derecha */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {paginaActiva ? (
                  <>
                    {/* Header del editor */}
                    <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
                      {(() => {
                        const cfg = getTipoConfig(paginaActiva.tipo);
                        return (
                          <>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.accent }}>
                              {cfg.icon}
                            </div>
                            <input type="text" value={paginaActiva.titulo}
                              onChange={(e) => actualizarPagina(paginaActiva.id, "titulo", e.target.value)}
                              className="flex-1 text-base font-bold bg-transparent outline-none"
                              style={{ color: "var(--texto-primario)" }}
                              placeholder="Título de la página" />
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.accent }}>
                              {cfg.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {/* Contenido según tipo */}
                    <div className="flex-1 overflow-y-auto">
                      {paginaActiva.tipo === "texto" && (
                        <div className="px-6 py-4">
                          <textarea
                            value={paginaActiva.contenido}
                            onChange={(e) => actualizarPagina(paginaActiva.id, "contenido", e.target.value)}
                            placeholder="Escribe el contenido de esta página aquí...\n\nPuedes incluir texto, instrucciones, explicaciones o cualquier información que el empleado necesite leer."
                            className="w-full h-full text-sm leading-relaxed outline-none resize-none"
                            style={{ background: "transparent", color: "var(--texto-secundario)", minHeight: "350px" }}
                          />
                          <div className="mt-3 text-xs" style={{ color: "var(--texto-muted)" }}>
                            {paginaActiva.contenido.length} caracteres · {paginaActiva.contenido.split(/\s+/).filter(Boolean).length} palabras
                          </div>
                        </div>
                      )}

                      {paginaActiva.tipo === "archivo" && (
                        <div className="px-6 py-6 flex flex-col gap-5">
                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
                              Descripción / Instrucciones (opcional)
                            </label>
                            <textarea value={paginaActiva.contenido}
                              onChange={(e) => actualizarPagina(paginaActiva.id, "contenido", e.target.value)}
                              placeholder="Añade contexto o instrucciones para el archivo..."
                              rows={3}
                              className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-all resize-none"
                              style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--blanco)" }}
                              onFocus={onF} onBlur={onB} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
                              Archivo <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <input ref={inputArchivoRef} type="file" accept=".pdf,.docx,.txt,.ppt,.pptx,.mp4,.mp3,.wav,.mov" className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  setPaginas((p) => p.map((pg) => pg.id === paginaActiva.id ? { ...pg, archivoFile: f, archivoNombre: f.name } : pg));
                                }
                              }} />
                            {paginaActiva.archivoNombre || paginaActiva.archivoUrl ? (
                              <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "#fffbeb", border: "1.5px solid #fbbf24" }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fbbf24", color: "#fff" }}>
                                  <IconFile />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
                                    {paginaActiva.archivoNombre || paginaActiva.archivoUrl}
                                  </p>
                                  {paginaActiva.archivoFile && (
                                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{formatBytes(paginaActiva.archivoFile.size)}</p>
                                  )}
                                </div>
                                <button type="button" onClick={() => {
                                  setPaginas((p) => p.map((pg) => pg.id === paginaActiva.id ? { ...pg, archivoFile: null, archivoNombre: null, archivoUrl: null } : pg));
                                }} className="p-2 rounded-lg transition-colors" style={{ color: "var(--texto-muted)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--texto-muted)"; }}>
                                  <IconTrash />
                                </button>
                              </div>
                            ) : (
                              <div onClick={() => inputArchivoRef.current?.click()}
                                className="rounded-xl flex flex-col items-center gap-3 cursor-pointer transition-all"
                                style={{ border: "2px dashed var(--gris-borde)", background: "var(--gris-pagina)", minHeight: "140px", justifyContent: "center" }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                  <IconUpload sz={5} />
                                </div>
                                <p className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>Arrastra o <span style={{ color: "#d97706", textDecoration: "underline" }}>selecciona</span></p>
                                <p className="text-xs" style={{ color: "var(--texto-muted)" }}>PDF, DOCX, PPT, MP4, MP3 — máx. 10 MB</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {paginaActiva.tipo === "test" && (
                        <div className="px-6 py-6 flex flex-col gap-5">
                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
                              Descripción del test (opcional)
                            </label>
                            <textarea value={paginaActiva.contenido}
                              onChange={(e) => actualizarPagina(paginaActiva.id, "contenido", e.target.value)}
                              placeholder="Ej: Responde las siguientes preguntas para evaluar tus conocimientos..."
                              rows={2}
                              className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-all resize-none"
                              style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--blanco)" }}
                              onFocus={onF} onBlur={onB} />
                          </div>
                          {paginaActiva.preguntas.map((q, qi) => (
                            <div key={qi} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                              <div className="px-4 py-3 flex items-center gap-3" style={{ background: "var(--gris-pagina)", borderBottom: "1px solid var(--gris-borde)" }}>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: "#dcfce7", color: "#15803d" }}>P{qi + 1}</span>
                                <input type="text" value={q.texto}
                                  onChange={(e) => actualizarPregunta(paginaActiva.id, qi, "texto", e.target.value)}
                                  placeholder="Escribe la pregunta..."
                                  className="flex-1 text-sm bg-transparent outline-none font-medium"
                                  style={{ color: "var(--texto-primario)" }} />
                                {paginaActiva.preguntas.length > 1 && (
                                  <button type="button" onClick={() => eliminarPregunta(paginaActiva.id, qi)}
                                    className="p-1 rounded-lg transition-colors shrink-0" style={{ color: "var(--texto-muted)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--texto-muted)"; }}>
                                    <IconTrash />
                                  </button>
                                )}
                              </div>
                              <div className="p-4 grid grid-cols-2 gap-2">
                                {q.opciones.map((op, oi) => (
                                  <div key={oi} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
                                    style={{ border: `1.5px solid ${q.correcta === oi ? "#16a34a" : "var(--gris-borde)"}`, background: q.correcta === oi ? "#f0fdf4" : "var(--gris-pagina)" }}>
                                    <button type="button" onClick={() => actualizarPregunta(paginaActiva.id, qi, "correcta", oi)}
                                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-colors"
                                      style={{ border: `2px solid ${q.correcta === oi ? "#16a34a" : "var(--gris-borde)"}`, background: q.correcta === oi ? "#16a34a" : "transparent", color: "#fff" }}>
                                      {q.correcta === oi && <IconCheck sz={3} />}
                                    </button>
                                    <input type="text" value={op}
                                      onChange={(e) => actualizarPregunta(paginaActiva.id, qi, "opciones", q.opciones.map((o, j) => j === oi ? e.target.value : o))}
                                      placeholder={`Opción ${oi + 1}`}
                                      className="flex-1 text-xs bg-transparent outline-none"
                                      style={{ color: "var(--texto-primario)" }} />
                                  </div>
                                ))}
                              </div>
                              <p className="px-4 pb-3 text-[11px]" style={{ color: "var(--texto-muted)" }}>Haz clic en el círculo para marcar la respuesta correcta</p>
                            </div>
                          ))}
                          <button type="button" onClick={() => agregarPregunta(paginaActiva.id)}
                            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            style={{ border: "1.5px dashed var(--gris-borde)", color: "var(--texto-muted)", background: "var(--gris-pagina)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#15803d"; e.currentTarget.style.color = "#15803d"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.color = "var(--texto-muted)"; }}>
                            <IconPlus /> Añadir pregunta
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                      <IconDoc />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>
                      {paginas.length === 0 ? "Añade la primera página" : "Selecciona una página"}
                    </p>
                    <p className="text-xs max-w-xs" style={{ color: "var(--texto-muted)" }}>
                      {paginas.length === 0
                        ? "Haz clic en 'Añadir página' para empezar a crear el contenido de tu módulo."
                        : "Elige una página de la lista izquierda para editarla."}
                    </p>
                    {paginas.length === 0 && (
                      <button type="button" onClick={() => setMostrarSelectorTipo(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
                        style={{ background: "var(--azul-egm)", color: "#fff", boxShadow: "0 4px 14px rgba(27,63,126,0.18)" }}>
                        <IconPlus /> Añadir página
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ FOOTER ACCIONES ══ */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button type="button" onClick={() => router.push("/dashboard/admin?tab=formaciones")}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ color: "var(--texto-muted)" }}>
              Cancelar
            </button>
            <button type="button" onClick={guardarModulo} disabled={guardando || paginas.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: guardando || paginas.length === 0 ? "var(--gris-superficie)" : "var(--verde-oliva)",
                color: guardando || paginas.length === 0 ? "var(--texto-muted)" : "#fff",
                boxShadow: guardando || paginas.length === 0 ? "none" : "0 4px 14px rgba(45,125,78,0.2)",
                cursor: guardando || paginas.length === 0 ? "not-allowed" : "pointer",
              }}>
              {guardando ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando…</>
              ) : (
                <><IconCheck sz={3} />{editId ? "Actualizar módulo" : "Guardar módulo"}</>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 text-xs px-4 py-3 rounded-lg flex items-center gap-2" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errorMsg}
            </div>
          )}

          {/* ══ MODAL IA ══ */}
          {mostrarIA && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
              onClick={() => { if (!generandoIA) setMostrarIA(false); }}>
              <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden fade-up"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: "1px solid var(--gris-borde)", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" }}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 7.26L22 12l-7.91 2.74L12 22l-2.09-7.26L2 12l7.91-2.74z" /></svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>Crear módulo con IA</h2>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Describe el módulo que quieres generar</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setMostrarIA(false)} disabled={generandoIA}
                    className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                    style={{ color: "var(--texto-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-borde)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <IconX />
                  </button>
                </div>
                {/* Body */}
                <div className="px-6 py-5">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
                    ¿Qué módulo necesitas?
                  </label>
                  <textarea value={promptIA} onChange={(e) => setPromptIA(e.target.value)}
                    placeholder="Ej: Un módulo sobre comunicación efectiva para equipos de ventas, con técnicas de negociación y un test final de 5 preguntas"
                    rows={5}
                    className="w-full text-sm px-4 py-3 rounded-lg outline-none resize-none transition-all"
                    style={{ border: `1.5px solid ${errorIA ? "#dc2626" : "var(--gris-borde)"}`, color: "var(--texto-primario)", background: "var(--blanco)" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; e.target.style.boxShadow = "0 0 0 3px var(--azul-egm-light)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--gris-borde)"; e.target.style.boxShadow = "none"; }} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      "Protocolo de seguridad en planta",
                      "Atención al cliente avanzada",
                      "Liderazgo y gestión de equipos",
                      "Ofimática básica con Excel",
                    ].map((s) => (
                      <button key={s} type="button" onClick={() => setPromptIA(s)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ border: "1px solid var(--gris-borde)", background: "var(--gris-pagina)", color: "var(--texto-secundario)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.color = "var(--texto-secundario)"; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {errorIA && (
                    <div className="mt-3 text-xs px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      {errorIA}
                    </div>
                  )}
                </div>
                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                  <button type="button" onClick={() => setMostrarIA(false)} disabled={generandoIA}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{ color: "var(--texto-muted)" }}>
                    Cancelar
                  </button>
                  <button type="button" onClick={generarConIA} disabled={generandoIA || !promptIA.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
                    style={{
                      background: generandoIA ? "var(--gris-superficie)" : "linear-gradient(135deg,#7c3aed,#a855f7)",
                      color: generandoIA ? "var(--texto-muted)" : "#fff",
                      cursor: generandoIA || !promptIA.trim() ? "not-allowed" : "pointer",
                      boxShadow: generandoIA ? "none" : "0 4px 14px rgba(124,58,237,0.25)",
                    }}>
                    {generandoIA ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando…</>
                    ) : (
                      <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 7.26L22 12l-7.91 2.74L12 22l-2.09-7.26L2 12l7.91-2.74z" /></svg>Generar módulo</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ ÉXITO ══ */}
          {guardado && (
            <div className="mt-6 rounded-2xl p-7 flex items-center gap-6 flex-wrap fade-up"
              style={{ background: "linear-gradient(135deg, var(--verde-oliva), var(--exito))", boxShadow: "0 4px 24px rgba(45,125,78,0.22)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.18)" }}>
                <IconCheck sz={7} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1">¡Módulo {editId ? "actualizado" : "creado"} correctamente!</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                  <strong className="text-white">{nombre}</strong> ya está disponible con {paginas.length} página{paginas.length !== 1 ? "s" : ""}.
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
          )}
        </div>
      </div>

      {/* ══ MODAL SELECTOR DE TIPO DE PÁGINA ══ */}
      {mostrarSelectorTipo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setMostrarSelectorTipo(false)}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden fade-up"
            style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>Añadir nueva página</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Elige el tipo de contenido</p>
              </div>
              <button type="button" onClick={() => setMostrarSelectorTipo(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                style={{ color: "var(--texto-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-borde)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <IconX />
              </button>
            </div>
            {/* Opciones */}
            <div className="px-6 py-5 flex flex-col gap-3">
              {TIPOS_PAGINA.map((tipo) => (
                <button key={tipo.key} type="button" onClick={() => nuevaPagina(tipo.key)}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all w-full"
                  style={{ border: `1.5px solid var(--gris-borde)`, background: "var(--gris-pagina)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = tipo.accent; e.currentTarget.style.background = tipo.bg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--gris-pagina)"; }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tipo.bg, color: tipo.accent }}>
                    {tipo.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>{tipo.label}</p>
                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{tipo.desc}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "2px solid var(--gris-borde)", color: "transparent" }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
