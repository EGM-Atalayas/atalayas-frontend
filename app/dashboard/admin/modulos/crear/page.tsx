"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, Briefcase, Check, CircleUser, File, FileUp, Image, Loader, Plus, Settings, Shield, Sparkles, SquareCheckBig, SquarePen, TextInitial, Trash2, Upload, UsersRound, X } from "lucide-react";
import { IAButton } from "@/components/ui/IAButton";
import Link from "next/link";
import { API_URL, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { subirImagenModulo, subirAdjunto } from "@/lib/supabase";
import { mapTipoToBackend } from "@/lib/types/modulos";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { getModulosConProgreso } from "@/lib/api/modulos";
import { PresentationCreator } from "@/components/presentation/PresentationCreator";
import type { Slide } from "@/components/presentation/slides/SlideRenderers";
import { BienvenidaTemplatePanel } from "@/components/bienvenida/BienvenidaTemplatePanel";

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type TipoPagina = "texto" | "archivo" | "test";
type AiTipo = "descripcion" | "test" | "podcast" | "video" | "documento";

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
const ROLES_BLOQUEADOS = ["ROLE_EMPLEADO", "INVITADO"];

type AudienciaTipo = "todos" | "empleado" | "departamento";

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
  { key: "texto", label: "Texto", desc: "Contenido escrito", icon: <TextInitial />, accent: "#1b3f7e", bg: "#eef2ff", badge: "bg:#eef2ff|color:#1b3f7e" },
  { key: "archivo", label: "Archivo", desc: "PDF, DOCX, vídeo, audio", icon: <FileUp />, accent: "#d97706", bg: "#fffbeb", badge: "bg:#fffbeb|color:#d97706" },
  { key: "test", label: "Test", desc: "Preguntas de evaluación", icon: <SquareCheckBig />, accent: "#15803d", bg: "#dcfce7", badge: "bg:#dcfce7|color:#15803d" },
];

function getTipoConfig(tipo: TipoPagina) {
  return TIPOS_PAGINA.find((t) => t.key === tipo)!;
}

const CS = { border: "1.5px solid #e5e7eb", color: "#111827", background: "#f9fafb" };
const SEL = "w-full text-sm px-3 py-2.5 rounded-lg outline-none cursor-pointer";

// ── TOGGLE ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="relative inline-flex items-center rounded-full transition-colors shrink-0"
      style={{ width: "44px", height: "24px", background: value ? "#4a7c59" : "#d1d5db" }}>
      <span className="inline-block rounded-full bg-white transition-transform"
        style={{ width: "18px", height: "18px", transform: value ? "translateX(22px)" : "translateX(3px)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

// ── PORTADA UPLOAD ────────────────────────────────────────────────────────────
function PortadaUpload({ preview, onFile, onRemove, accent = "#1b3f7e", accentLight = "#eef2ff" }: {
  preview: string; onFile: (f: File) => void; onRemove: () => void;
  accent?: string; accentLight?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#9ca3af" }}>Imagen de portada</label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden" style={{ height: "140px", border: "1.5px solid #e5e7eb" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Portada" className="w-full h-full object-cover" />
          <button type="button" onClick={onRemove} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs hover:opacity-80" style={{ background: "rgba(0,0,0,0.55)" }}><i className="bi bi-x-lg" style={{ fontSize: "12px" }} /></button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
          style={{ border: "2px dashed #d1d5db", background: "#f9fafb", height: "140px" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = accentLight; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.background = "#f9fafb"; }}>
          <div style={{ color: "#9ca3af" }}><Image /></div>
          <p className="text-sm font-medium text-center" style={{ color: "#9ca3af" }}>Subir portada</p>
          <p className="text-xs" style={{ color: "#d1d5db" }}>JPG · PNG · WEBP</p>
        </div>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ── PDF UPLOAD ────────────────────────────────────────────────────────────────
function PdfUpload({ file, onFile, onRemove }: {
  file: File | null; onFile: (f: File) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#9ca3af" }}>Documento PDF</label>
      {file ? (
        <div className="relative rounded-xl flex items-center gap-3 px-4 py-3" style={{ border: "1.5px solid #e5e7eb", background: "#f9fafb", minHeight: "60px" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <File className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{file.name}</p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>{formatBytes(file.size)}</p>
          </div>
          <button type="button" onClick={onRemove} className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 shrink-0" style={{ background: "rgba(0,0,0,0.08)", color: "#9ca3af" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
          style={{ border: "2px dashed #d1d5db", background: "#f9fafb", height: "100px" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.background = "#fef2f2"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.background = "#f9fafb"; }}>
          <FileUp className="w-5 h-5" style={{ color: "#9ca3af" }} />
          <p className="text-sm font-medium text-center" style={{ color: "#9ca3af" }}>Subir PDF</p>
          <p className="text-xs" style={{ color: "#d1d5db" }}>PDF</p>
        </div>
      )}
      <input ref={ref} type="file" accept=".pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function generarSVGPortada(nombre: string, categoria: string, prompt?: string): string {
  const gradient = categoria === "ESPECIALIZADO" ? "#7c3aed,#a855f7"
    : categoria === "CUMPLIMIENTO" ? "#2563eb,#1d4ed8"
      : "#0f766e,#14b8a6";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${gradient.split(",")[0]}"/><stop offset="100%" stop-color="${gradient.split(",")[1]}"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <text x="60" y="315" font-family="system-ui,sans-serif" font-size="48" font-weight="700" fill="white">${nombre.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
    <text x="60" y="380" font-family="system-ui,sans-serif" font-size="24" fill="rgba(255,255,255,0.7)">${categoria}</text>
    ${prompt ? `<text x="60" y="440" font-family="system-ui,sans-serif" font-size="16" fill="rgba(255,255,255,0.4)">${prompt.slice(0, 100).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>` : ""}
  </svg>`;
}

async function svgToPngFile(svg: string, name: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 1200, 630);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (b) resolve(new window.File([b], `${name}.png`, { type: "image/png" }));
        else reject(new Error("Error al convertir SVG a PNG"));
      }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Error al cargar SVG")); };
    img.src = url;
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
  const [alumnosIds, setAlumnosIds] = useState<string[]>([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<{ usuarioId: string; nombre: string; apellidos?: string }[]>([]);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string>("");
  const [activo, setActivo] = useState(true);

  // ── Podcast / Video ──────────────────────────────────────────────────────
  const [scriptPodcast, setScriptPodcast] = useState("");
  const [scriptVideo, setScriptVideo] = useState("");
  const [tiposSalida, setTiposSalida] = useState("documentacion");

  // ── Páginas del módulo ────────────────────────────────────────────────────
  const [paginas, setPaginas] = useState<PaginaModulo[]>([]);
  const [paginaActivaId, setPaginaActivaId] = useState<number | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  type VistaActiva = "ia" | "editor" | "bienvenida" | "config";
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>("config");
  const [mostrarSelectorTipo, setMostrarSelectorTipo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [aiSeleccionadas, setAiSeleccionadas] = useState<Record<AiTipo, boolean>>({ descripcion: false, test: false, podcast: false, video: false, documento: false });
  const [aiLoading, setAiLoading] = useState<AiTipo | null>(null);
  const [aiError, setAiError] = useState("");
  const [presentacionPanelOpen, setPresentacionPanelOpen] = useState(false);
  const [presentacionGuardada, setPresentacionGuardada] = useState<{ slides: Slide[]; themeId: string } | null>(null);
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
        const modulos = await getModulosConProgreso(usuario?.empresaId);
        const modulo = modulos.find((m) => m.moduloId === editId);
        if (modulo) {
          setModuloEditando(modulo);
          setNombre(modulo.nombre);
          setDescripcion(modulo.descripcion || "");
          if (modulo.tipoModulo && ["GENERAL", "ESPECIALIZADO", "ESPECIALIZADO_IA", "CUMPLIMIENTO", "ONBOARDING"].includes(modulo.tipoModulo)) {
            setCategoria(modulo.tipoModulo);
          } else {
            setCategoria("GENERAL"); // Valor por defecto si el guardado es inválido
          }
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
    if (audiencia === "empleado" && alumnosDisponibles.length === 0 && usuario?.empresaId) {
      apiFetch(`${API_URL}/users`)
        .then((r) => r.ok ? r.json() : [])
        .then((data) => {
          const empleados = (Array.isArray(data) ? data : []).filter(
            (u: any) => u.codigoRol === "ROLE_EMPLEADO" || u.codigoRol === "EMPLEADO"
          );
          setAlumnosDisponibles(empleados.map((u: any) => ({
            usuarioId: u.usuarioId || u.id,
            nombre: u.nombre || "",
            apellidos: u.apellidos || "",
          })));
        })
        .catch(() => { });
    }
  }, [audiencia, usuario?.empresaId, alumnosDisponibles.length]);

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

  async function generarAiSave(): Promise<PaginaModulo[]> {
    const nuevas: PaginaModulo[] = [];
    const activos = Object.entries(aiSeleccionadas).filter(([, v]) => v).map(([k]) => k as AiTipo);
    if (activos.length === 0) return nuevas;
    setAiError("");

    const contenidoExistente = paginaActiva?.contenido || "";
    const prompts: Record<AiTipo, string> = {
      descripcion: `Genera una descripción corta y profesional (máximo 150 caracteres) para un módulo de formación llamado "${nombre}". Devuelve SOLO la descripción, sin JSON ni formato adicional.`,
      test: `Crea 5 preguntas de test de opción múltiple (4 opciones cada una) basadas en el módulo "${nombre}". ${contenidoExistente ? `Contexto adicional: ${contenidoExistente}` : ""} Devuelve el resultado estrictamente en formato JSON: [{"texto":"pregunta","opciones":["op1","op2","op3","op4"],"correcta":0}] sin texto adicional.`,
      podcast: `Crea un podcast de 5-7 minutos sobre "${nombre}". Estructura: introducción, 3 puntos clave desarrollados, conclusiones. Incluye notas para el locutor entre corchetes [ej: pausa]. Máximo 500 palabras. Devuelve SOLO el guion en español, listo para ser narrado en voz alta.`,
      video: `Genera un array JSON de slides para un vídeo educativo sobre "${nombre}". Cada slide debe tener: numero (entero), titulo (string), contenido (string con viñetas separadas por \\n), notas (string opcional). Máximo 8 slides. Estructura: 1 slide intro, 4-5 slides de contenido, 1 slide resumen, 1 slide cierre. Devuelve SOLO el JSON, sin formato adicional. Ejemplo: [{"numero":1,"titulo":"Introducción","contenido":"Punto 1\\nPunto 2","notas":"Hablar pausado"}].`,
      documento: `Crea un documento de formación completo y estructurado sobre "${nombre}". Incluye: resumen ejecutivo, introducción, 3-4 secciones con subtítulos (##), conclusiones y recursos adicionales. Usa viñetas (-) donde sea útil. Máximo 1000 palabras. Devuelve SOLO el documento en markdown.`,
    };

    for (const tipo of activos) {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user" as const, content: prompts[tipo] }], context: {} }),
        });
        if (!res.ok) { setAiError(`Error al generar ${tipo}: el servicio de IA no está disponible`); continue; }

        let texto = "";
        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        while (true) { const { done, value } = await reader.read(); if (done) break; texto += dec.decode(value); }
        texto = texto.trim();
        if (!texto) { setAiError(`Error al generar ${tipo}: respuesta vacía`); continue; }

        if (tipo === "descripcion") {
          setDescripcion(texto);
        } else if (tipo === "test") {
          const jsonMatch = texto.match(/\[[\s\S]*?\]/);
          if (!jsonMatch) { setAiError(`Error al generar test: la IA no devolvió un formato válido`); continue; }
          try {
            const preguntas = JSON.parse(jsonMatch[0]);
            if (Array.isArray(preguntas) && preguntas.length > 0) {
              nuevas.push({
                id: newId(), tipo: "test", titulo: `Test: ${nombre}`,
                contenido: contenidoExistente || "Responde las siguientes preguntas:",
                archivoUrl: null, archivoNombre: null, archivoFile: null,
                preguntas: preguntas.map((p: any) => ({
                  texto: p.texto || p.text || "",
                  opciones: Array.isArray(p.opciones || p.options) ? (p.opciones || p.options) : ["", "", "", ""],
                  correcta: typeof p.correcta === "number" ? p.correcta : typeof p.correct === "number" ? p.correct : 0,
                })),
              });
            } else { setAiError("Error al generar test: formato de preguntas inválido"); }
          } catch { setAiError("Error al generar test: la IA no devolvió JSON válido"); }
        } else if (tipo === "podcast") {
          setScriptPodcast(texto);
          setTiposSalida((prev) => prev.includes("podcast") ? prev : [prev, "podcast"].filter(Boolean).join(","));
          nuevas.push({ id: newId(), tipo: "texto", titulo: `Podcast: ${nombre}`, contenido: texto, archivoUrl: null, archivoNombre: null, archivoFile: null, preguntas: [] });
        } else if (tipo === "video") {
          const jsonMatch = texto.match(/\[[\s\S]*?\]/);
          if (!jsonMatch) { setAiError(`Error al generar vídeo: la IA no devolvió un formato válido`); continue; }
          try {
            const slides = JSON.parse(jsonMatch[0]);
            if (Array.isArray(slides) && slides.length > 0) {
              setScriptVideo(texto);
              setTiposSalida((prev) => prev.includes("video") ? prev : [prev, "video"].filter(Boolean).join(","));
              nuevas.push({ id: newId(), tipo: "texto", titulo: `Vídeo: ${nombre}`, contenido: texto, archivoUrl: null, archivoNombre: null, archivoFile: null, preguntas: [] });
            } else { setAiError("Error al generar vídeo: formato de slides inválido"); }
          } catch { setAiError("Error al generar vídeo: la IA no devolvió JSON válido"); }
        } else if (tipo === "documento") {
          nuevas.push({ id: newId(), tipo: "texto", titulo: `Documento: ${nombre}`, contenido: texto, archivoUrl: null, archivoNombre: null, archivoFile: null, preguntas: [] });
        }
      } catch { setAiError(`Error al generar ${tipo}: no se pudo conectar con la IA`); }
    }
    return nuevas;
  }

  const guardarModulo = async (opts?: { comoBorrador?: boolean }) => {
    if (!nombre.trim()) { setErrorMsg("El nombre del módulo es obligatorio"); return; }
    if (opts?.comoBorrador) setActivo(false);
    const activoEnvio = opts?.comoBorrador ? false : activo;
    setGuardando(true); setErrorMsg("");
    try {
      // Generar contenido IA para tipos seleccionados
      const paginasAI = await generarAiSave();
      const paginasCompletas = [...paginas, ...paginasAI];
      setPaginas(paginasCompletas);

      let imagenPortadaUrl: string | null = null;
      if (portadaFile) {
        try { imagenPortadaUrl = await subirImagenModulo(portadaFile); }
        catch (e) { console.warn("No se pudo subir la imagen de portada:", e); }
      } else if (editId && moduloEditando?.imagenPortadaUrl) {
        imagenPortadaUrl = moduloEditando.imagenPortadaUrl;
      }

      // Subir archivos de las páginas tipo archivo
      const paginasConArchivos = await Promise.all(
        paginasCompletas.map(async (p) => {
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
          tipoModulo: mapTipoToBackend(categoria),
          activo: activoEnvio,
          empresaId: editId && moduloEditando ? moduloEditando.empresaId : (usuario?.empresaId ?? null),
          idioma,
          duracion,
          audiencia,
          departamentos: audiencia === "departamento" ? JSON.stringify(deptos) : "[]",
          usuariosIds: audiencia === "empleado" ? alumnosIds : [],
          contenidoMarkdown: contenidoJson,
          imagenPortadaUrl,
          testPreguntas: null,
          scriptPodcast: scriptPodcast || null,
          scriptVideo: presentacionGuardada
            ? JSON.stringify({ type: "presentation", themeId: presentacionGuardada.themeId, slides: presentacionGuardada.slides })
            : scriptVideo || null,
          tiposSalida: presentacionGuardada
            ? (tiposSalida.includes("video") ? tiposSalida : tiposSalida + ",video")
            : tiposSalida,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Error al guardar"); }
      setGuardado(true);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar. Inténtalo de nuevo.");
    } finally { setGuardando(false); }
  };

  const generarModuloConIA = async () => {
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
      if (data.categoria && ["GENERAL", "ESPECIALIZADO", "ESPECIALIZADO_IA", "CUMPLIMIENTO", "ONBOARDING"].includes(data.categoria)) {
        setCategoria(data.categoria);
      }

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
    } catch (e: unknown) {
      setErrorIA(e instanceof Error ? e.message : "Error al generar el módulo");
    } finally {
      setGenerandoIA(false);
    }
  };

  const resetear = () => {
    setNombre(""); setDescripcion(""); setCategoria("ESPECIALIZADO");
    setIdioma("es"); setDuracion("medio"); setAudiencia("todos"); setDeptos([]); setAlumnosIds([]);
    setPaginas([]); setPaginaActivaId(null); setPortadaFile(null); setPortadaPreview("");
    setScriptPodcast(""); setTiposSalida("documentacion");
    setGuardado(false); setErrorMsg(""); setActivo(true); setMostrarSelectorTipo(false);
    setAiSeleccionadas({ descripcion: false, test: false, podcast: false, video: false, documento: false });
  };

  const inputBase = { border: "1.5px solid #e5e7eb", color: "#111827", background: "#fff" };
  const onF = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#1b3f7e";
    if ("style" in e.target) (e.target as HTMLElement).style.boxShadow = "0 0 0 3px #eef2ff";
  };
  const onB = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#e5e7eb";
    if ("style" in e.target) (e.target as HTMLElement).style.boxShadow = "none";
  };

  if (cargandoEdicion) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: "#f4f5f7" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "#1b3f7e transparent transparent transparent" }} />
          <p className="text-sm" style={{ color: "#9ca3af" }}>Cargando módulo...</p>
        </div>
      </div>
    );
  }

  const gradAzul = "linear-gradient(135deg, #1b3f7e, #2563eb)";
  const gradVioleta = "linear-gradient(135deg, #7c3aed, #a855f7)";
  const gradVerde = "linear-gradient(135deg, #16a34a, #15803d)";

  return (
    <div className="w-full min-h-screen pt-20" style={{ background: "#f4f5f7" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.05)}to{transform:scale(1)}}
        @keyframes slideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:800px}}
        @keyframes shimmer{0%{background-position:-200% 0}to{background-position:200% 0}}
        .fade-up{animation:fadeUp .3s ease both}
        .ai-pop{animation:pop .25s ease both}
        .slide-down{animation:slideDown .35s ease both;overflow:hidden}
        .card-hover{transition:all .2s ease}
        .card-hover:hover{transform:translateY(-1px);box-shadow:0 8px 30px rgba(0,0,0,0.08)!important}
      `}</style>

      {/* ══ TOP ACCENT BAR ══ */}
      <div style={{ height: "3px", background: "linear-gradient(90deg, #1b3f7e, #2563eb, #3b82f6)" }} />

      {/* ══ HEADER ══ */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div className="px-4 md:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-gray-100 active:bg-gray-200"
                style={{ color: "#4b5563", border: "1px solid #e5e7eb" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Volver
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "#f0f4ff", border: "1px solid #dbeafe" }}>
                  <svg className="w-3.5 h-3.5" style={{ color: "#1b3f7e" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="text-xs font-semibold" style={{ color: "#1b3f7e" }}>
                    {paginas.length} página{paginas.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: activo ? "#f0fdf4" : "#f9fafb", border: `1px solid ${activo ? "#bbf7d0" : "#e5e7eb"}` }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: activo ? "#16a34a" : "#9ca3af" }} />
                  <span className="text-xs font-medium" style={{ color: activo ? "#16a34a" : "#9ca3af" }}>{activo ? "Activo" : "Inactivo"}</span>
                </div>
              </div>
              {nombre && (
                <span className="hidden lg:inline text-xs font-medium truncate max-w-[180px]" style={{ color: "#6b7280" }}>
                  {nombre}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ CUERPO PRINCIPAL — Layout con sidebar vertical de navegación ══ */}
      <div className="px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">

          {/* ══ SIDEBAR — Navegación entre tipos de creación ══ */}
          <aside className="lg:order-2 lg:sticky lg:top-24 self-start">
            <div className="flex lg:flex-col gap-2 rounded-2xl p-3"
              style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)" }}>
              {[
                { key: "ia" as VistaActiva, label: "Asistente IA", desc: "Genera contenido con IA", icon: <Sparkles className="w-5 h-5" />, gradient: "linear-gradient(135deg, #6B21A8 0%, #7C3AED 100%)" },
                { key: "editor" as VistaActiva, label: "Editor de páginas", desc: "Crea y organiza páginas", icon: <SquarePen className="w-5 h-5" />, gradient: "linear-gradient(135deg, #4338CA 0%, #0EA5E9 100%)" },
                { key: "bienvenida" as VistaActiva, label: "Plantilla bienvenida", desc: "Onboarding inicial", icon: <Shield className="w-5 h-5" />, gradient: "linear-gradient(135deg, #0891B2 0%, #10B981 100%)" },
                { key: "config" as VistaActiva, label: "Configuración", desc: "Datos del módulo", icon: <Settings className="w-5 h-5" />, gradient: "linear-gradient(135deg, #0F766E 0%, #06B6D4 100%)" },
              ].map((it) => {
                const sel = vistaActiva === it.key;
                return (
                  <button key={it.key} type="button" onClick={() => setVistaActiva(it.key)}
                    className="group relative flex-1 lg:flex-none flex lg:flex-row flex-col items-center lg:items-stretch gap-2 lg:gap-3 px-3 py-3 rounded-xl text-left transition-all overflow-hidden"
                    style={{
                      background: sel ? it.gradient : "transparent",
                      color: sel ? "#fff" : "#374151",
                      boxShadow: sel ? "0 8px 20px -8px rgba(0,0,0,0.25)" : "none",
                    }}
                    onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = "#f9fafb"; }}
                    onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: sel ? "rgba(255,255,255,0.22)" : "#f3f4f6",
                        color: sel ? "#fff" : "#6b7280",
                        backdropFilter: sel ? "blur(6px)" : undefined,
                      }}>
                      {it.icon}
                    </div>
                    <div className="hidden lg:block flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight">{it.label}</p>
                      <p className="text-[11px] mt-0.5 leading-tight" style={{ color: sel ? "rgba(255,255,255,0.85)" : "#9ca3af" }}>{it.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ══ COLUMNA PRINCIPAL — contenido según vistaActiva ══ */}
          <div className="flex flex-col gap-6 min-w-0 lg:order-1">

          {/* ══ VISTA: CONFIGURACIÓN ══ */}
          {vistaActiva === "config" && (
            <div className="rounded-2xl overflow-hidden card-hover fade-up"
              style={{ background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid #e5e7eb", background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", color: "#1e40af", boxShadow: "0 2px 8px rgba(30,64,175,0.12)" }}>
                  <Settings className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: "#111827" }}>Configuración del módulo</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Información básica y visibilidad</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: activo ? "#dcfce7" : "#f3f4f6", color: activo ? "#16a34a" : "#9ca3af" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: activo ? "#16a34a" : "#9ca3af" }} />
                  {activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-8">
                  <div className="flex flex-col gap-5">
                    {/* Nombre */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>
                        Nombre del módulo <span style={{ color: "#dc2626" }}>*</span>
                      </label>
                      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Seguridad en planta — Nivel básico"
                        className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all border"
                        style={inputBase}
                        onFocus={onF} onBlur={onB} />
                    </div>

                    {/* 3 selects en fila */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>Categoría</label>
                        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
                          className="w-full text-sm px-3 py-2.5 rounded-xl outline-none border cursor-pointer transition-all"
                          style={inputBase}
                          onFocus={onF} onBlur={onB}>
                          <option value="GENERAL">General</option>
                          <option value="ESPECIALIZADO">Especializado</option>
                          <option value="ESPECIALIZADO_IA">Especializado IA</option>
                          <option value="CUMPLIMIENTO">Cumplimiento normativo</option>
                          <option value="ONBOARDING">Onboarding</option>
                        </select>
                        {editId && moduloEditando?.tipoModulo && !["GENERAL", "ESPECIALIZADO", "ESPECIALIZADO_IA", "CUMPLIMIENTO", "ONBOARDING"].includes(moduloEditando.tipoModulo) && (
                          <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#dc2626" }}>
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Tipo antiguo: {moduloEditando.tipoModulo}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>Idioma</label>
                        <select value={idioma} onChange={(e) => setIdioma(e.target.value)}
                          className="w-full text-sm px-3 py-2.5 rounded-xl outline-none border cursor-pointer transition-all"
                          style={inputBase}
                          onFocus={onF} onBlur={onB}>
                          <option value="es">Español</option>
                          <option value="en">Inglés</option>
                          <option value="ca">Valenciano</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>Duración</label>
                        <select value={duracion} onChange={(e) => setDuracion(e.target.value)}
                          className="w-full text-sm px-3 py-2.5 rounded-xl outline-none border cursor-pointer transition-all"
                          style={inputBase}
                          onFocus={onF} onBlur={onB}>
                          <option value="corto">−15 min</option>
                          <option value="medio">15–45 min</option>
                          <option value="largo">+45 min</option>
                        </select>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#6b7280" }}>
                        Descripción <span className="font-normal lowercase" style={{ color: "#9ca3af" }}>(opcional)</span>
                      </label>
                      <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Describe brevemente de qué trata este módulo..."
                        rows={3}
                        className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all resize-none"
                        style={{ border: "1.5px solid #e5e7eb", color: "#111827", background: "#fff" }}
                        onFocus={onF} onBlur={onB} />
                    </div>

                    {/* Visibilidad */}
                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#6b7280" }}>Visibilidad</label>
                      <div className="flex gap-2">
                        {([
                          { key: "todos" as AudienciaTipo, label: "Todos", icon: <UsersRound className="w-4 h-4" /> },
                          { key: "empleado" as AudienciaTipo, label: "Empleado", icon: <CircleUser className="w-4 h-4" /> },
                          { key: "departamento" as AudienciaTipo, label: "Departamento", icon: <Briefcase className="w-4 h-4" /> },
                        ]).map((op) => {
                          const sel = audiencia === op.key;
                          return (
                            <button key={op.key} type="button" onClick={() => setAudiencia(op.key)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1"
                              style={{
                                border: `1.5px solid ${sel ? "#1b3f7e" : "#e5e7eb"}`,
                                background: sel ? "#eef2ff" : "#f9fafb",
                                color: sel ? "#1b3f7e" : "#9ca3af",
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                style={{
                                  border: `1.5px solid ${sel ? "#d97706" : "#e5e7eb"}`,
                                  background: sel ? "#fffbeb" : "#fff",
                                  color: sel ? "#d97706" : "#9ca3af",
                                }}>
                                {sel && <Check className="w-3 h-3" />}{d.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {audiencia === "empleado" && (
                        <div className="mt-3">
                          {alumnosDisponibles.length === 0 ? (
                            <p className="text-xs" style={{ color: "#9ca3af" }}>Cargando empleados...</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {alumnosDisponibles.map((a) => {
                                const sel = alumnosIds.includes(a.usuarioId);
                                return (
                                  <button key={a.usuarioId} type="button" onClick={() =>
                                    setAlumnosIds((p) => p.includes(a.usuarioId) ? p.filter((id) => id !== a.usuarioId) : [...p, a.usuarioId])
                                  }
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                    style={{
                                      border: `1.5px solid ${sel ? "#1b3f7e" : "#e5e7eb"}`,
                                      background: sel ? "#eef2ff" : "#fff",
                                      color: sel ? "#1b3f7e" : "#9ca3af",
                                    }}>
                                    {sel && <Check className="w-3 h-3" />}{a.nombre} {a.apellidos || ""}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                  <PortadaUpload
                    preview={portadaPreview}
                    onFile={(f) => { setPortadaFile(f); setPortadaPreview(URL.createObjectURL(f)); }}
                    onRemove={() => { setPortadaFile(null); setPortadaPreview(""); }}
                    accent="#1b3f7e" accentLight="#eef2ff"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ VISTA: ASISTENTE IA ══ */}
          {vistaActiva === "ia" && !editId && (
            <div className="rounded-2xl overflow-hidden card-hover fade-up"
              style={{ background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid #e5e7eb", background: "linear-gradient(135deg, #faf5ff, #f3e8ff)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: gradVioleta, color: "#fff", boxShadow: "0 2px 8px rgba(124,58,237,0.2)" }}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: "#5b21b6" }}>Asistente IA</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8b5cf6" }}>Genera contenido automáticamente</p>
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "modulo", label: "Módulo completo", desc: "Describe y la IA lo genera", icon: <Sparkles className="w-6 h-6" />, gradient: "linear-gradient(135deg, #6B21A8 0%, #7C3AED 100%)", disabled: false, onClick: () => setMostrarIA(true) },
                    { key: "presentacion", label: "Presentación con IA", desc: "Genera slides desde un PDF", icon: <SquarePen className="w-6 h-6" />, gradient: "linear-gradient(135deg, #4338CA 0%, #0EA5E9 100%)", disabled: false, onClick: () => setPresentacionPanelOpen(true) },
                    { key: "podcast", label: "Podcast con IA", desc: "Audio de 5–7 minutos", icon: <File className="w-6 h-6" />, gradient: "linear-gradient(135deg, #0891B2 0%, #10B981 100%)", disabled: false, onClick: () => setAiSeleccionadas((p) => ({ ...p, podcast: !p.podcast })) },
                    { key: "video", label: "Vídeo con IA", desc: "Próximamente", icon: <FileUp className="w-6 h-6" />, gradient: "linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)", disabled: true, onClick: () => {} },
                  ].map((opt) => (
                    <button key={opt.key} type="button" onClick={opt.onClick} disabled={opt.disabled}
                      className={`relative group rounded-2xl p-5 text-left transition-all overflow-hidden ${opt.disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-1 cursor-pointer"}`}
                      style={{
                        background: "#fff",
                        border: "1.5px solid #e5e7eb",
                        boxShadow: opt.disabled ? "none" : "0 4px 14px -8px rgba(0,0,0,0.15)",
                        minHeight: 140,
                      }}>
                      {/* Halo */}
                      {!opt.disabled && (
                        <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: opt.gradient, opacity: 0.10, filter: "blur(8px)" }} />
                      )}
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background: opt.gradient, color: "#fff", boxShadow: opt.disabled ? "none" : "0 6px 16px -4px rgba(0,0,0,0.25)" }}>
                          {opt.icon}
                        </div>
                        <p className="text-base font-bold mb-1" style={{ color: "#111827" }}>{opt.label}</p>
                        <p className="text-xs" style={{ color: "#6b7280" }}>{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* PDF Upload — necesario para Podcast/Vídeo */}
                <div className="mt-6 pt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>Material base (PDF)</p>
                  <PdfUpload
                    file={pdfFile}
                    onFile={(f) => { setPdfFile(f); setPdfPreview(URL.createObjectURL(f)); }}
                    onRemove={() => { setPdfFile(null); setPdfPreview(""); }}
                  />
                </div>

                {presentacionPanelOpen && (
                  <div className="mt-4 p-4 rounded-xl" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                    <PresentationCreator
                      moduleTitle={nombre}
                      onSave={(slides, themeId) => {
                        setPresentacionGuardada({ slides, themeId });
                        setPresentacionPanelOpen(false);
                      }}
                    />
                  </div>
                )}

                {aiError && (
                  <div className="mt-4 text-xs px-3 py-3 rounded-xl flex items-center gap-2 fade-up" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                    <Sparkles size={16} strokeWidth={2} className="shrink-0" />
                    <span className="flex-1">{aiError}</span>
                    <button type="button" onClick={() => setAiError("")} className="shrink-0 hover:opacity-70" style={{ color: "#1d4ed8" }}><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ══ VISTA: PLANTILLA DE BIENVENIDA ══ */}
          {vistaActiva === "bienvenida" && (
            <div className="fade-up">
              <BienvenidaTemplatePanel
                nombreEmpresa={usuario?.nombreEmpresa || ""}
                newId={newId}
                onAplicar={(nuevasPaginas) => {
                  setPaginas(nuevasPaginas);
                  setPaginaActivaId(nuevasPaginas[0]?.id ?? null);
                }}
              />
            </div>
          )}

          {/* ══ VISTA: EDITOR DE PÁGINAS ══ */}
          {vistaActiva === "editor" && (
          <div className="rounded-2xl overflow-hidden fade-up"
            style={{ background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)", minHeight: "500px" }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid #e5e7eb", background: "#fafbfc" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", color: "#1e40af", boxShadow: "0 2px 8px rgba(30,64,175,0.12)" }}>
                <SquarePen className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "#111827" }}>Editor de páginas</p>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Crea y organiza el contenido de tu módulo</p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#f0f4ff", border: "1px solid #dbeafe", color: "#1b3f7e" }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {paginas.length} página{paginas.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-col md:flex-row" style={{ height: "calc(100vh - 380px)", minHeight: "520px" }}>

              {/* Sidebar - Lista de páginas */}
              <div className="flex flex-col w-full md:w-56 lg:w-60 shrink-0 order-2 md:order-0"
                style={{ borderTop: "1px solid #e5e7eb", borderRight: "0px", background: "#f8f9fa" }}>

                {/* Lista de páginas */}
                <div className="flex-1 py-2 overflow-y-auto">
                  {paginas.map((pagina, idx) => {
                    const activa = pagina.id === paginaActivaId;
                    const tipoCfg = getTipoConfig(pagina.tipo);
                    return (
                      <div key={pagina.id}
                        className={`group relative mx-2 mb-1 rounded-xl transition-all ${activa ? "" : "hover:bg-white/60"}`}
                        style={activa ? { background: "#fff", boxShadow: "0 2px 8px rgba(27,63,126,0.1)", border: "1.5px solid #1b3f7e" } : { border: "1.5px solid transparent" }}>
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <div className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => setPaginaActivaId(pagina.id)}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: tipoCfg.bg, color: tipoCfg.accent }}>
                              {pagina.tipo === "texto" ? <TextInitial /> : pagina.tipo === "archivo" ? <FileUp /> : <SquareCheckBig />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: activa ? "#111827" : "#6b7280" }}>
                                {idx + 1}. {pagina.titulo}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {idx > 0 && (
                              <button type="button" onClick={() => moverPagina(pagina.id, "up")}
                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                                style={{ color: "#9ca3af" }} title="Mover arriba">
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {idx < paginas.length - 1 && (
                              <button type="button" onClick={() => moverPagina(pagina.id, "down")}
                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                                style={{ color: "#9ca3af" }} title="Mover abajo">
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button type="button" onClick={() => eliminarPagina(pagina.id)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                              style={{ color: "#dc2626" }} title="Eliminar página">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Botón añadir página */}
                  <div className="px-3 pt-2 pb-3">
                    <button type="button" onClick={() => setMostrarSelectorTipo(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ border: "1.5px dashed #d1d5db", color: "#9ca3af", background: "transparent" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1b3f7e"; e.currentTarget.style.color = "#1b3f7e"; e.currentTarget.style.background = "#eef2ff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}>
                      <Plus /> Añadir página
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor derecha */}
              <div className="flex-1 flex flex-col overflow-hidden order-1 md:order-0">
                {paginaActiva ? (
                  <>
                    {/* Header del editor */}
                    <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid #e5e7eb", background: "#fafbfc" }}>
                      {(() => {
                        const cfg = getTipoConfig(paginaActiva.tipo);
                        return (
                          <>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.accent }}>
                              {cfg.icon}
                            </div>
                            <input type="text" value={paginaActiva.titulo}
                              onChange={(e) => actualizarPagina(paginaActiva.id, "titulo", e.target.value)}
                              className="flex-1 text-base font-bold bg-transparent outline-none"
                              style={{ color: "#111827" }}
                              placeholder="Título de la página" />
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.accent }}>
                              {cfg.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {/* Contenido según tipo */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                      {/* TEXTO */}
                      {paginaActiva.tipo === "texto" && (
                        <div className="flex flex-col gap-3 h-full">
                          <textarea
                            value={paginaActiva.contenido}
                            onChange={(e) => actualizarPagina(paginaActiva.id, "contenido", e.target.value)}
                            placeholder="Escribe el contenido de esta página aquí..."
                            className="w-full text-sm leading-relaxed outline-none resize-none"
                            style={{ background: "transparent", color: "#6b7280", minHeight: "320px" }}
                          />
                          <div className="text-xs text-right" style={{ color: "#9ca3af" }}>
                            {paginaActiva.contenido.length} caracteres · {paginaActiva.contenido.split(/\s+/).filter(Boolean).length} palabras
                          </div>
                        </div>
                      )}

                      {/* ARCHIVO */}
                      {paginaActiva.tipo === "archivo" && (
                        <div className="flex flex-col gap-5">
                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                              Descripción / Instrucciones <span className="font-normal lowercase" style={{ color: "#9ca3af" }}>(opcional)</span>
                            </label>
                            <textarea value={paginaActiva.contenido}
                              onChange={(e) => actualizarPagina(paginaActiva.id, "contenido", e.target.value)}
                              placeholder="Añade contexto o instrucciones para el archivo..."
                              rows={3}
                              className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all resize-none"
                              style={{ border: "1.5px solid #e5e7eb", color: "#111827", background: "#fff" }}
                              onFocus={(e) => { e.target.style.borderColor = "#1b3f7e"; e.target.style.boxShadow = "0 0 0 3px #eef2ff"; }}
                              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#9ca3af" }}>
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
                                  <File className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>
                                    {paginaActiva.archivoNombre || paginaActiva.archivoUrl}
                                  </p>
                                  {paginaActiva.archivoFile && (
                                    <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{formatBytes(paginaActiva.archivoFile.size)}</p>
                                  )}
                                </div>
                                <button type="button" onClick={() => {
                                  setPaginas((p) => p.map((pg) => pg.id === paginaActiva.id ? { ...pg, archivoFile: null, archivoNombre: null, archivoUrl: null } : pg));
                                }} className="p-2 rounded-lg transition-colors" style={{ color: "#9ca3af" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div onClick={() => inputArchivoRef.current?.click()}
                                className="rounded-xl flex flex-col items-center gap-3 cursor-pointer transition-all hover:border-blue-400"
                                style={{ border: "2px dashed #d1d5db", background: "#f9fafb", minHeight: "140px", justifyContent: "center" }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f3f4f6", color: "#9ca3af" }}>
                                  <Upload className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-semibold" style={{ color: "#6b7280" }}>Arrastra o <span style={{ color: "#d97706", textDecoration: "underline" }}>selecciona</span></p>
                                <p className="text-xs" style={{ color: "#9ca3af" }}>PDF, DOCX, PPT, MP4, MP3 — máx. 10 MB</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TEST */}
                      {paginaActiva.tipo === "test" && (
                        <div className="flex flex-col gap-5">
                          <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#9ca3af" }}>
                              Descripción del test <span className="font-normal lowercase" style={{ color: "#9ca3af" }}>(opcional)</span>
                            </label>
                            <textarea value={paginaActiva.contenido}
                              onChange={(e) => actualizarPagina(paginaActiva.id, "contenido", e.target.value)}
                              placeholder="Ej: Responde las siguientes preguntas para evaluar tus conocimientos..."
                              rows={2}
                              className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all resize-none"
                              style={{ border: "1.5px solid #e5e7eb", color: "#111827", background: "#fff" }}
                              onFocus={(e) => { e.target.style.borderColor = "#1b3f7e"; e.target.style.boxShadow = "0 0 0 3px #eef2ff"; }}
                              onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }} />
                          </div>
                          {paginaActiva.preguntas.map((q, qi) => (
                            <div key={qi} className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
                              <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: "#dcfce7", color: "#15803d" }}>P{qi + 1}</span>
                                <input type="text" value={q.texto}
                                  onChange={(e) => actualizarPregunta(paginaActiva.id, qi, "texto", e.target.value)}
                                  placeholder="Escribe la pregunta..."
                                  className="flex-1 text-sm bg-transparent outline-none font-medium"
                                  style={{ color: "#111827" }} />
                                {paginaActiva.preguntas.length > 1 && (
                                  <button type="button" onClick={() => eliminarPregunta(paginaActiva.id, qi)}
                                    className="p-1 rounded-lg transition-colors shrink-0" style={{ color: "#9ca3af" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}>
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.opciones.map((op, oi) => (
                                  <div key={oi} className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
                                    style={{ border: `1.5px solid ${q.correcta === oi ? "#16a34a" : "#e5e7eb"}`, background: q.correcta === oi ? "#f0fdf4" : "#f9fafb" }}>
                                    <button type="button" onClick={() => actualizarPregunta(paginaActiva.id, qi, "correcta", oi)}
                                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-colors"
                                      style={{ border: `2px solid ${q.correcta === oi ? "#16a34a" : "#d1d5db"}`, background: q.correcta === oi ? "#16a34a" : "transparent", color: "#fff" }}>
                                      {q.correcta === oi && <Check className="w-3 h-3" />}
                                    </button>
                                    <input type="text" value={op}
                                      onChange={(e) => actualizarPregunta(paginaActiva.id, qi, "opciones", q.opciones.map((o, j) => j === oi ? e.target.value : o))}
                                      placeholder={`Opción ${oi + 1}`}
                                      className="flex-1 text-xs bg-transparent outline-none"
                                      style={{ color: "#111827" }} />
                                  </div>
                                ))}
                              </div>
                              <p className="px-4 pb-3 text-[11px]" style={{ color: "#9ca3af" }}>Haz clic en el círculo para marcar la respuesta correcta</p>
                            </div>
                          ))}
                          <button type="button" onClick={() => agregarPregunta(paginaActiva.id)}
                            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            style={{ border: "1.5px dashed #d1d5db", color: "#9ca3af", background: "#f9fafb" }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#15803d"; e.currentTarget.style.color = "#15803d"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#9ca3af"; }}>
                            <Plus className="w-4 h-4" /> Añadir pregunta
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{ background: "#f3f4f6", color: "#9ca3af" }}>
                      <TextInitial className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "#6b7280" }}>
                      {paginas.length === 0 ? "Añade la primera página" : "Selecciona una página"}
                    </p>
                    <p className="text-xs max-w-xs" style={{ color: "#9ca3af" }}>
                      {paginas.length === 0
                        ? "Haz clic en 'Añadir página' para empezar a crear el contenido de tu módulo."
                        : "Elige una página de la lista izquierda para editarla."}
                    </p>
                    {paginas.length === 0 && (
                      <button type="button" onClick={() => setMostrarSelectorTipo(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                        style={{ background: "#1b3f7e", color: "#fff", boxShadow: "0 4px 14px rgba(27,63,126,0.18)" }}>
                        <Plus className="w-4 h-4" /> Añadir página
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* ══ FOOTER ACCIONES ══ */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-6 pt-6" style={{ borderTop: "1px solid #e5e7eb" }}>
            <div className="text-xs" style={{ color: "#9ca3af" }}>
              {paginas.length > 0 && `${paginas.length} página${paginas.length !== 1 ? "s" : ""} creada${paginas.length !== 1 ? "s" : ""}`}
              {nombre && ` · "${nombre}"`}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => router.push("/dashboard/admin?tab=formaciones")}
                className="px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-gray-100 active:bg-gray-200"
                style={{ color: "#6b7280", border: "1px solid #e5e7eb" }}>
                Cancelar
              </button>
              <button type="button" onClick={() => guardarModulo({ comoBorrador: true })}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: "#0F766E", border: "1.5px solid #67e8f9", background: "#ecfeff" }}>
                Guardar como borrador
              </button>
              <button type="button" onClick={() => guardarModulo()}
                disabled={guardando || (paginas.length === 0 && !Object.values(aiSeleccionadas).some(Boolean))}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                style={{
                  background: guardando || (paginas.length === 0 && !Object.values(aiSeleccionadas).some(Boolean)) ? "#f3f4f6" : "#4a7c59",
                  color: guardando || (paginas.length === 0 && !Object.values(aiSeleccionadas).some(Boolean)) ? "#9ca3af" : "#fff",
                  boxShadow: guardando || (paginas.length === 0 && !Object.values(aiSeleccionadas).some(Boolean)) ? "none" : "0 4px 14px rgba(74,124,89,0.25)",
                  cursor: guardando || (paginas.length === 0 && !Object.values(aiSeleccionadas).some(Boolean)) ? "not-allowed" : "pointer",
                }}>
                {guardando ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando…</>
                ) : (
                  <><Check className="w-4 h-4" />{editId ? "Actualizar módulo" : "Guardar módulo"}</>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="text-sm px-5 py-4 rounded-xl flex items-center gap-3 fade-up" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", boxShadow: "0 2px 8px rgba(220,38,38,0.08)" }}>
              <AlertTriangle size={18} strokeWidth={2} className="shrink-0" />
              <span className="flex-1">{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg("")} className="shrink-0 hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ══ MODAL IA ══ */}
          {mostrarIA && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
              onClick={() => { if (!generandoIA) setMostrarIA(false); }}>
              <div className="w-full max-w-lg rounded-2xl overflow-hidden fade-up"
                style={{ background: "#fff", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: "1px solid #e5e7eb", background: "linear-gradient(135deg,#faf5ff,#f3e8ff)" }}>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: gradVioleta, color: "#fff", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold" style={{ color: "#111827" }}>Crear módulo con IA</h2>
                      <p className="text-xs mt-0.5" style={{ color: "#8b5cf6" }}>Describe el módulo que quieres generar</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setMostrarIA(false)} disabled={generandoIA}
                    className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-black/5 active:bg-black/10"
                    style={{ color: "#9ca3af" }}>
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="px-6 py-5">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    ¿Qué módulo necesitas?
                  </label>
                  <textarea value={promptIA} onChange={(e) => setPromptIA(e.target.value)}
                    placeholder="Ej: Un módulo sobre comunicación efectiva para equipos de ventas, con técnicas de negociación y un test final de 5 preguntas"
                    rows={5}
                    className="w-full text-sm px-4 py-3 rounded-xl outline-none resize-none transition-all"
                    style={{ border: `1.5px solid ${errorIA ? "#dc2626" : "#e5e7eb"}`, color: "#111827", background: "#fff" }}
                    onFocus={(e) => { e.target.style.borderColor = "#1b3f7e"; e.target.style.boxShadow = "0 0 0 3px #eef2ff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      "Protocolo de seguridad en planta",
                      "Atención al cliente avanzada",
                      "Liderazgo y gestión de equipos",
                      "Ofimática básica con Excel",
                    ].map((s) => (
                      <button key={s} type="button" onClick={() => setPromptIA(s)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ border: "1px solid #e5e7eb", background: "#f9fafb", color: "#6b7280" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {errorIA && (
                    <div className="mt-3 text-xs px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                      <AlertTriangle size={14} strokeWidth={2} className="shrink-0" />
                      {errorIA}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  <button type="button" onClick={() => setMostrarIA(false)} disabled={generandoIA}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-gray-200"
                    style={{ color: "#6b7280" }}>
                    Cancelar
                  </button>
                  <IAButton
                    size="md"
                    onClick={generarModuloConIA}
                    disabled={!promptIA.trim()}
                    loading={generandoIA}
                    loadingLabel="Generando…"
                  >
                    Generar módulo
                  </IAButton>
                </div>
              </div>
            </div>
          )}

          {/* ══ ÉXITO ══ */}
          {guardado && (
            <div className="rounded-2xl p-8 flex items-center gap-6 flex-wrap fade-up"
              style={{ background: "linear-gradient(135deg, #4a7c59, #2d7d4e)", boxShadow: "0 8px 32px rgba(45,125,78,0.3)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                <Check className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1">¡Módulo {editId ? "actualizado" : "creado"} correctamente!</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                  <strong className="text-white">{nombre}</strong> ya está disponible con {paginas.length} página{paginas.length !== 1 ? "s" : ""}.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => router.push("/dashboard/admin?tab=formaciones")}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/25 active:bg-white/30"
                  style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.25)" }}>
                  Ver módulos
                </button>
                <button onClick={() => {
                  if (editId) { router.push("/dashboard/admin/modulos/crear"); }
                  else { resetear(); }
                }} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#fff", color: "#2d7d4e" }}>
                  Crear otro
                </button>
              </div>
            </div>
          )}

          </div>
          {/* ══ FIN COLUMNA PRINCIPAL ══ */}

        </div>
      </div>

      {/* ══ MODAL SELECTOR DE TIPO DE PÁGINA ══ */}
      {mostrarSelectorTipo && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          onClick={() => setMostrarSelectorTipo(false)}>
          <div className="w-full max-w-xs rounded-t-2xl md:rounded-2xl overflow-hidden fade-up"
            style={{ background: "#fff", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid #e5e7eb", background: "#fafbfc" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#eef2ff", color: "#1b3f7e" }}>
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold" style={{ color: "#111827" }}>Añadir página</h2>
              </div>
              <button type="button" onClick={() => setMostrarSelectorTipo(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-black/5 active:bg-black/10"
                style={{ color: "#9ca3af" }}>
                <X size={15} />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              {TIPOS_PAGINA.map((tipo) => (
                <button key={tipo.key} type="button" onClick={() => nuevaPagina(tipo.key)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all w-full"
                  style={{ border: "1.5px solid #e5e7eb", background: "#f9fafb" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = tipo.accent; e.currentTarget.style.background = tipo.bg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f9fafb"; }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: tipo.bg, color: tipo.accent }}>
                    {tipo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: "#111827" }}>{tipo.label}</p>
                    <p className="text-[11px] truncate" style={{ color: "#9ca3af" }}>{tipo.desc}</p>
                  </div>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ border: "2px solid #d1d5db" }}>
                    <Check size={10} strokeWidth={2.5} style={{ color: "transparent" }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
