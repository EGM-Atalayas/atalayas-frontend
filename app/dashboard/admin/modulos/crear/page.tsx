"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, Briefcase, Check, ChevronDown, File, FileUp, Image, Loader, Plus, Settings, Shield, Sparkles, SquareCheckBig, SquarePen, TextInitial, Trash2, Upload, UsersRound, X } from "lucide-react";
import { IAButton } from "@/components/ui/IAButton";
import Link from "next/link";
import { API_URL, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { subirImagenModulo, subirAdjunto } from "@/lib/supabase";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { getModulosConProgreso } from "@/lib/api/modulos";
import { PresentationCreator } from "@/components/presentation/PresentationCreator";
import type { Slide } from "@/components/presentation/slides/SlideRenderers";
import { BienvenidaTemplatePanel } from "@/components/bienvenida/BienvenidaTemplatePanel";

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
          <div style={{ color: "var(--texto-muted)" }}><Image /></div>
          <p className="text-sm font-medium text-center" style={{ color: "var(--texto-muted)" }}>Subir portada</p>
          <p className="text-xs" style={{ color: "var(--gris-borde)" }}>JPG · PNG · WEBP</p>
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
      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Documento PDF</label>
      {file ? (
        <div className="relative rounded-xl flex items-center gap-3 px-4 py-3" style={{ border: "1.5px solid var(--gris-borde)", background: "var(--gris-pagina)", minHeight: "60px" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <File className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>{file.name}</p>
            <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{formatBytes(file.size)}</p>
          </div>
          <button type="button" onClick={onRemove} className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 shrink-0" style={{ background: "rgba(0,0,0,0.08)", color: "var(--texto-muted)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()} className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
          style={{ border: "2px dashed var(--gris-borde)", background: "var(--gris-pagina)", height: "100px" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.background = "#fef2f2"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--gris-pagina)"; }}>
          <FileUp className="w-5 h-5" style={{ color: "var(--texto-muted)" }} />
          <p className="text-sm font-medium text-center" style={{ color: "var(--texto-muted)" }}>Subir PDF</p>
          <p className="text-xs" style={{ color: "var(--gris-borde)" }}>PDF</p>
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
  const [configOpen, setConfigOpen] = useState(true);
  const [mostrarSelectorTipo, setMostrarSelectorTipo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [aiLoading, setAiLoading] = useState<"descripcion" | "contenido" | "test" | "podcast" | "video" | "documento" | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
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
    if (usuario && ROLES_BLOQUEADOS.includes(usuario.codigoRol)) router.replace("/dashboard");
  }, [usuario]);
  if (!usuario || ROLES_BLOQUEADOS.includes(usuario.codigoRol)) return null;

  const toggleDepto = (id: string) =>
    setDeptos((p) => p.includes(id) ? p.filter((d) => d !== id) : [...p, id]);

  async function generarConIA(tipo: "descripcion" | "contenido" | "test" | "podcast" | "video" | "documento") {
    setAiError("");
    if (!nombre.trim() && !pdfFile) {
      setAiError("Necesitas un título o un documento PDF para que la IA pueda generar contenido.");
      return;
    }
    if ((tipo === "contenido" || tipo === "test") && !paginaActiva) return;
    setAiLoading(tipo);
    try {
      const contenidoExistente = paginaActiva?.contenido || "";
      const prompts: Record<string, string> = {
        descripcion: `Genera una descripción corta y profesional (máximo 150 caracteres) para un módulo de formación llamado "${nombre}". Devuelve SOLO la descripción.`,
        contenido: `Genera contenido educativo claro y estructurado para una página titulada "${paginaActiva?.titulo}" en un módulo sobre "${nombre}". ${contenidoExistente ? `Amplía o mejora este contenido existente: ${contenidoExistente}` : ""} Usa ## para títulos y - para listas. Máximo 600 palabras. Devuelve SOLO el contenido en formato markdown.`,
        test: `Crea 5 preguntas de test de opción múltiple (4 opciones cada una) basadas en el módulo "${nombre}". ${contenidoExistente ? `Contexto adicional: ${contenidoExistente}` : ""} Devuelve el resultado estrictamente en formato JSON: [{"texto":"pregunta","opciones":["op1","op2","op3","op4"],"correcta":0}] sin texto adicional.`,
        podcast: `Crea un podcast de 5-7 minutos sobre "${nombre}". Estructura: introducción, 3 puntos clave desarrollados, conclusiones. Incluye notas para el locutor entre corchetes [ej: pausa]. Máximo 500 palabras. Devuelve SOLO el guion en español, listo para ser narrado en voz alta.`,
        video: `Genera un array JSON de slides para un vídeo educativo sobre "${nombre}". Cada slide debe tener: numero (entero), titulo (string), contenido (string con viñetas separadas por \\n), notas (string opcional). Máximo 8 slides. Estructura: 1 slide intro, 4-5 slides de contenido, 1 slide resumen, 1 slide cierre. Devuelve SOLO el JSON, sin formato adicional. Ejemplo: [{"numero":1,"titulo":"Introducción","contenido":"Punto 1\\nPunto 2","notas":"Hablar pausado"}].`,
        documento: `Crea un documento de formación completo y estructurado sobre "${nombre}". Incluye: resumen ejecutivo, introducción, 3-4 secciones con subtítulos (##), conclusiones y recursos adicionales. Usa viñetas (-) donde sea útil. Máximo 1000 palabras. Devuelve SOLO el documento en markdown.`,
      };

      // Usar /api/chat/generate-content para descripción y test (mejor para JSON estructurado)
      // Usar /api/chat para contenido, podcast, video, documento (texto libre)
      const usarGenerateContent = tipo === "descripcion" || tipo === "test";
      const endpoint = usarGenerateContent ? "/api/chat/generate-content" : "/api/chat";

      const body = usarGenerateContent
        ? {
          prompt: prompts[tipo],
          systemPrompt: tipo === "test"
            ? "Eres un asistente que genera preguntas de test. Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, sin markdown. Ejemplo: [{\"texto\":\"Pregunta\",\"opciones\":[\"A\",\"B\",\"C\",\"D\"],\"correcta\":0}]"
            : undefined,
        }
        : { messages: [{ role: "user" as const, content: prompts[tipo] }], context: {} };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[IA] Error ${res.status}:`, errorText);
        throw new Error("Error en la respuesta");
      }

      let textoLimpio = "";

      if (usarGenerateContent) {
        // Para generate-content, la respuesta es JSON
        const data = await res.json();
        if (tipo === "descripcion" && data.descripcion) {
          textoLimpio = data.descripcion;
        } else {
          textoLimpio = JSON.stringify(data);
        }
      } else {
        // Para chat normal, leer streaming
        if (!res.body) throw new Error("No hay body");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textoLimpio += dec.decode(value);
        }
      }

      textoLimpio = textoLimpio.trim();

      if (!textoLimpio) throw new Error("Respuesta vacía");

      // Aplicar el contenido generado según el tipo
      if (tipo === "descripcion") {
        setDescripcion(textoLimpio);
      } else if (tipo === "contenido" && paginaActiva) {
        actualizarPagina(paginaActiva.id, "contenido", textoLimpio);
      } else if (tipo === "test" && paginaActiva) {
        try {
          const preguntas = JSON.parse(textoLimpio);
          if (Array.isArray(preguntas) && preguntas.length > 0) {
            const preguntasFormateadas = preguntas.map((p: any) => ({
              texto: p.texto || p.text || "",
              opciones: Array.isArray(p.opciones || p.options) ? (p.opciones || p.options) : ["", "", "", ""],
              correcta: typeof p.correcta === "number" ? p.correcta : typeof p.correct === "number" ? p.correct : 0,
            }));
            setPaginas((p) => p.map((pg) => pg.id !== paginaActiva.id ? pg : { ...pg, tipo: "test", preguntas: preguntasFormateadas }));
          } else {
            throw new Error("Formato incorrecto");
          }
        } catch (e) {
          console.error("[IA] Error parseando test:", e);
          setAiError("Error al procesar el test generado. Intenta de nuevo.");
        }
      } else if (tipo === "documento") {
        const nuevaPagina: PaginaModulo = {
          id: newId(),
          tipo: "texto",
          titulo: `Documento: ${paginaActiva?.titulo || "Nueva página"}`,
          contenido: textoLimpio,
          archivoUrl: null,
          archivoNombre: null,
          archivoFile: null,
          preguntas: [],
        };
        setPaginas((p) => [...p, nuevaPagina]);
        setPaginaActivaId(nuevaPagina.id);
      } else if (tipo === "podcast") {
        setScriptPodcast(textoLimpio);
        setTiposSalida((prev) => prev.includes("podcast") ? prev : [prev, "podcast"].filter(Boolean).join(","));
        const nuevaPagina: PaginaModulo = {
          id: newId(),
          tipo: "texto",
          titulo: `Podcast: ${paginaActiva?.titulo || "Nueva página"}`,
          contenido: textoLimpio,
          archivoUrl: null,
          archivoNombre: null,
          archivoFile: null,
          preguntas: [],
        };
        setPaginas((p) => [...p, nuevaPagina]);
        setPaginaActivaId(nuevaPagina.id);
      } else if (tipo === "video") {
        try {
          const slides = JSON.parse(textoLimpio);
          if (Array.isArray(slides) && slides.length > 0) {
            setScriptVideo(textoLimpio);
            setTiposSalida((prev) => prev.includes("video") ? prev : [prev, "video"].filter(Boolean).join(","));
            const nuevaPagina: PaginaModulo = {
              id: newId(),
              tipo: "texto",
              titulo: `Vídeo: ${paginaActiva?.titulo || "Nueva página"}`,
              contenido: textoLimpio,
              archivoUrl: null,
              archivoNombre: null,
              archivoFile: null,
              preguntas: [],
            };
            setPaginas((p) => [...p, nuevaPagina]);
            setPaginaActivaId(nuevaPagina.id);
          } else {
            throw new Error("Formato inválido");
          }
        } catch {
          setAiError("Error al procesar los slides generados. Intenta de nuevo.");
        }
      }
    } catch (err) {
      console.error("[IA] Error:", err);
      setAiError("La IA no está disponible. Verifica que el backend esté funcionando.");
    } finally {
      setAiLoading(null);
    }
  }

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
                  <IAButton size="sm" onClick={() => setMostrarIA(true)}>
                    Crear con IA
                  </IAButton>
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
      <div className="px-4 md:px-8 lg:px-12 py-4 md:py-6">
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
                    <PdfUpload
                      file={pdfFile}
                      onFile={(f) => { setPdfFile(f); setPdfPreview(URL.createObjectURL(f)); }}
                      onRemove={() => { setPdfFile(null); setPdfPreview(""); }}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Categoría</label>
                        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={SEL} style={CS} onFocus={onF} onBlur={onB}>
                          <option value="GENERAL">General</option>
                          <option value="ESPECIALIZADO">Especializado</option>
                          <option value="ESPECIALIZADO_IA">Especializado IA</option>
                          <option value="CUMPLIMIENTO">Cumplimiento normativo</option>
                          <option value="ONBOARDING">Onboarding</option>
                        </select>
                        {editId && moduloEditando?.tipoModulo && !["GENERAL", "ESPECIALIZADO", "ESPECIALIZADO_IA", "CUMPLIMIENTO", "ONBOARDING"].includes(moduloEditando.tipoModulo) && (
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#dc2626" }}>
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Este módulo tiene un tipo antiguo ("{moduloEditando.tipoModulo}"). Elige uno de los valores válidos arriba.
                          </p>
                        )}
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
                          { key: "todos" as AudienciaTipo, label: "Todos", icon: <UsersRound /> },
                          { key: "administradores" as AudienciaTipo, label: "Admins", icon: <Shield /> },
                          { key: "departamento" as AudienciaTipo, label: "Departamento", icon: <Briefcase /> },
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
                                {sel && <Check className="w-3 h-3 shrink-0" />}{d.label}
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

          {/* ══ PANEL PLANTILLA BIENVENIDA (solo Onboarding) ══ */}
          {categoria === "ONBOARDING" && (
            <BienvenidaTemplatePanel
              nombreEmpresa={usuario?.nombreEmpresa || ""}
              newId={newId}
              onAplicar={(nuevasPaginas) => {
                setPaginas(nuevasPaginas);
                setPaginaActivaId(nuevasPaginas[0]?.id ?? null);
              }}
            />
          )}

          {/* ══ PANEL IA ══ */}
          <div className="rounded-2xl overflow-hidden mb-6 fade-up" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <button type="button" onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="w-full flex items-center justify-between px-6 py-4 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", borderBottom: aiPanelOpen ? "1px solid #bfdbfe" : "none" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#2563eb", color: "#fff" }}><Sparkles className="w-4 h-4" /></div>
                <div className="text-left">
                  <p className="text-sm font-bold" style={{ color: "#1e40af" }}>Asistente IA</p>
                  <p className="text-xs" style={{ color: "#3b82f6" }}>Genera contenido basado en el título: "{nombre || '...'}"</p>
                </div>
              </div>
              <div className="transition-transform" style={{ transform: aiPanelOpen ? "rotate(0)" : "rotate(-90deg)" }}>
                <ChevronDown style={{ color: "#2563eb" }} />
              </div>
            </button>

            {aiPanelOpen && (
              <div className="px-6 py-5 fade-up">
                {!nombre.trim() && !pdfFile ? (
                  <div className="text-center py-4">
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--texto-secundario)" }}>Define un título o sube un PDF primero</p>
                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>La IA necesita el título o un documento PDF como referencia</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--texto-muted)" }}>Generar contenido</p>
                    <p className="text-xs truncate" style={{ color: "var(--texto-muted)" }}>Basado en: "{nombre}"</p>

                    {/* Descripción */}
                    <button type="button" onClick={() => generarConIA("descripcion")} disabled={aiLoading === "descripcion"}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-40"
                      style={{ border: "1.5px solid #bfdbfe", background: aiLoading === "descripcion" ? "#dbeafe" : "var(--blanco)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff", color: "#2563eb" }}>
                        {aiLoading === "descripcion" ? <Loader className="w-4 h-4 animate-spin" /> : "📝"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Descripción</p>
                        <p className="text-xs truncate" style={{ color: "var(--texto-muted)" }}>Genera una descripción corta y profesional</p>
                      </div>
                    </button>

                    {/* Contenido de página */}
                    <button type="button" onClick={() => generarConIA("contenido")} disabled={aiLoading === "contenido" || !paginaActiva || paginaActiva?.tipo !== "texto"}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-40"
                      style={{ border: "1.5px solid #bfdbfe", background: aiLoading === "contenido" ? "#dbeafe" : "var(--blanco)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff", color: "#2563eb" }}>
                        {aiLoading === "contenido" ? <Loader className="w-4 h-4 animate-spin" /> : "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Contenido de página</p>
                        <p className="text-xs truncate" style={{ color: "var(--texto-muted)" }}>Genera contenido educativo para la página activa</p>
                      </div>
                    </button>

                    {/* Test */}
                    <button type="button" onClick={() => generarConIA("test")} disabled={aiLoading === "test" || !paginaActiva}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-40"
                      style={{ border: "1.5px solid #bfdbfe", background: aiLoading === "test" ? "#dbeafe" : "var(--blanco)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff", color: "#2563eb" }}>
                        {aiLoading === "test" ? <Loader className="w-4 h-4 animate-spin" /> : "✅"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Test de evaluación</p>
                        <p className="text-xs truncate" style={{ color: "var(--texto-muted)" }}>Genera 5 preguntas de test en la página activa</p>
                      </div>
                    </button>

                    {/* Podcast */}
                    <button type="button" onClick={() => generarConIA("podcast")} disabled={aiLoading === "podcast"}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-40"
                      style={{ border: "1.5px solid #bfdbfe", background: aiLoading === "podcast" ? "#dbeafe" : "var(--blanco)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff", color: "#2563eb" }}>
                        {aiLoading === "podcast" ? <Loader className="w-4 h-4 animate-spin" /> : "🎙️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Podcast</p>
                        <p className="text-xs truncate" style={{ color: "var(--texto-muted)" }}>Crea un podcast de 5-7 minutos</p>
                      </div>
                    </button>

                    {/* Video */}
                    <button type="button" onClick={() => generarConIA("video")} disabled={aiLoading === "video"}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-40"
                      style={{ border: "1.5px solid #bfdbfe", background: aiLoading === "video" ? "#dbeafe" : "var(--blanco)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff", color: "#2563eb" }}>
                        {aiLoading === "video" ? <Loader className="w-4 h-4 animate-spin" /> : "🎬"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Vídeo</p>
                        <p className="text-xs truncate" style={{ color: "var(--texto-muted)" }}>Crea un vídeo educativo de 3-5 min</p>
                      </div>
                    </button>

                    {/* Documento */}
                    <button type="button" onClick={() => generarConIA("documento")} disabled={aiLoading === "documento"}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-40"
                      style={{ border: "1.5px solid #bfdbfe", background: aiLoading === "documento" ? "#dbeafe" : "var(--blanco)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff", color: "#2563eb" }}>
                        {aiLoading === "documento" ? <Loader className="w-4 h-4 animate-spin" /> : "📑"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Documento completo</p>
                        <p className="text-xs truncate" style={{ color: "var(--texto-muted)" }}>Genera un documento de formación estructurado</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══ PANEL PRESENTACIÓN IA ══ */}
          <div className="rounded-2xl overflow-hidden mb-6 fade-up" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <button type="button" onClick={() => setPresentacionPanelOpen(!presentacionPanelOpen)}
              className="w-full flex items-center justify-between px-6 py-4 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", borderBottom: presentacionPanelOpen ? "1px solid #ddd6fe" : "none" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#7c3aed", color: "#fff" }}><Sparkles className="w-4 h-4" /></div>
                <div className="text-left">
                  <p className="text-sm font-bold" style={{ color: "#5b21b6" }}>Presentación con IA</p>
                  <p className="text-xs" style={{ color: "#7c3aed" }}>
                    {presentacionGuardada
                      ? `Presentación lista — ${presentacionGuardada.slides.length} slides`
                      : "Genera slides automáticamente desde un PDF"}
                  </p>
                </div>
              </div>
              <div className="transition-transform" style={{ transform: presentacionPanelOpen ? "rotate(0)" : "rotate(-90deg)" }}>
                <ChevronDown style={{ color: "#7c3aed" }} />
              </div>
            </button>

            {presentacionPanelOpen && (
              <div className="px-6 py-5 fade-up">
                <PresentationCreator
                  moduleTitle={nombre}
                  onSave={(slides, themeId) => {
                    setPresentacionGuardada({ slides, themeId });
                    setPresentacionPanelOpen(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* ══ MENSAJE ERROR IA ══ */}
          {aiError && (
            <div className="mb-4 text-xs px-4 py-3 rounded-lg flex items-center gap-2 fade-up" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              <Sparkles size={16} strokeWidth={2} className="shrink-0" />
              <span className="flex-1">{aiError}</span>
              <button type="button" onClick={() => setAiError("")} className="shrink-0 hover:opacity-70" style={{ color: "#1d4ed8" }}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* ══ EDITOR DE PÁGINAS ══ */}
          <div className="rounded-2xl overflow-hidden fade-up" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", minHeight: "500px" }}>
            <div className="flex flex-col md:flex-row" style={{ height: "calc(100vh - 340px)", minHeight: "500px" }}>

              {/* Sidebar - Lista de páginas - Diseño limpio tipo menú */}
              <div className="flex flex-col w-full md:w-64 lg:w-64 shrink-0 order-2 md:order-0"
                style={{ borderTop: "1px solid var(--gris-borde)", borderRight: "0px", background: "var(--gris-pagina)" }}>

                {/* Lista de páginas - sin scroll */}
                <div className="flex-1 py-2">
                  {paginas.map((pagina, idx) => {
                    const activa = pagina.id === paginaActivaId;
                    const tipoCfg = getTipoConfig(pagina.tipo);
                    return (
                      <div key={pagina.id}
                        className={`group relative mx-2 mb-1 rounded-lg transition-all ${activa ? "" : "hover:bg-white/50"}`}
                        style={activa ? { background: "var(--blanco)", border: "1.5px solid var(--azul-egm)", boxShadow: "0 2px 8px rgba(27,63,126,0.1)" } : { border: "1.5px solid transparent" }}>
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <div className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => setPaginaActivaId(pagina.id)}>
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: tipoCfg.bg, color: tipoCfg.accent }}>
                              {pagina.tipo === "texto" ? <TextInitial /> : pagina.tipo === "archivo" ? <FileUp /> : <SquareCheckBig />}
                            </div>
                            <p className="text-xs font-semibold truncate" style={{ color: activa ? "var(--texto-primario)" : "var(--texto-secundario)" }}>
                              {idx + 1}. {pagina.titulo}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {idx > 0 && (
                              <button type="button" onClick={() => moverPagina(pagina.id, "up")}
                                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80"
                                style={{ color: "var(--texto-muted)" }} title="Mover arriba">
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {idx < paginas.length - 1 && (
                              <button type="button" onClick={() => moverPagina(pagina.id, "down")}
                                className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80"
                                style={{ color: "var(--texto-muted)" }} title="Mover abajo">
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button type="button" onClick={() => eliminarPagina(pagina.id)}
                              className="w-6 h-6 rounded flex items-center justify-center hover:opacity-80"
                              style={{ color: "#dc2626" }} title="Eliminar página">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Botón añadir página abajo del sidebar */}
                  <div className="px-3 py-3" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                    <button type="button" onClick={() => setMostrarSelectorTipo(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                      style={{ border: "1.5px dashed var(--gris-borde)", color: "var(--texto-muted)", background: "transparent" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--azul-egm)"; e.currentTarget.style.color = "var(--azul-egm)"; e.currentTarget.style.background = "var(--azul-egm-light)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.color = "var(--texto-muted)"; e.currentTarget.style.background = "transparent"; }}>
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
                        <div className="px-4 md:px-6 py-4 flex flex-col gap-3">
                          <textarea
                            value={paginaActiva.contenido}
                            onChange={(e) => actualizarPagina(paginaActiva.id, "contenido", e.target.value)}
                            placeholder="Escribe el contenido de esta página aquí...\n\nPuedes incluir texto, instrucciones, explicaciones o cualquier información que el empleado necesite leer.\n\nUsa ## para títulos y - para listas."
                            className="w-full h-full text-sm leading-relaxed outline-none resize-none"
                            style={{ background: "transparent", color: "var(--texto-secundario)", minHeight: "350px" }}
                          />
                          <div className="text-xs" style={{ color: "var(--texto-muted)" }}>
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
                                  <File />
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
                                  <Trash2 />
                                </button>
                              </div>
                            ) : (
                              <div onClick={() => inputArchivoRef.current?.click()}
                                className="rounded-xl flex flex-col items-center gap-3 cursor-pointer transition-all"
                                style={{ border: "2px dashed var(--gris-borde)", background: "var(--gris-pagina)", minHeight: "140px", justifyContent: "center" }}>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                  <Upload />
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
                                    <Trash2 />
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
                                      {q.correcta === oi && <Check />}
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
                            <Plus /> Añadir pregunta
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                      <TextInitial />
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
                        <Plus /> Añadir página
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ FOOTER ACCIONES ══ */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-4 md:mt-6">
            <button type="button" onClick={() => router.push("/dashboard/admin?tab=formaciones")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors text-center"
              style={{ color: "var(--texto-muted)" }}>
              Cancelar
            </button>
            <button type="button" onClick={guardarModulo} disabled={guardando || paginas.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: guardando || paginas.length === 0 ? "var(--gris-superficie)" : "var(--verde-oliva)",
                color: guardando || paginas.length === 0 ? "var(--texto-muted)" : "#fff",
                boxShadow: guardando || paginas.length === 0 ? "none" : "0 4px 14px rgba(45,125,78,0.2)",
                cursor: guardando || paginas.length === 0 ? "not-allowed" : "pointer",
              }}>
              {guardando ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando…</>
              ) : (
                <><Check />{editId ? "Actualizar módulo" : "Guardar módulo"}</>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 text-xs px-4 py-3 rounded-lg flex items-center gap-2" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              <AlertTriangle size={16} strokeWidth={2} className="shrink-0" />
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
                      <Sparkles size={16} />
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
                    <X size={16} strokeWidth={2.5} />
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
                      <AlertTriangle size={14} strokeWidth={2} className="shrink-0" />
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
            <div className="mt-6 rounded-2xl p-7 flex items-center gap-6 flex-wrap fade-up"
              style={{ background: "linear-gradient(135deg, var(--verde-oliva), var(--exito))", boxShadow: "0 4px 24px rgba(45,125,78,0.22)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.18)" }}>
                <Check />
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setMostrarSelectorTipo(false)}>
          <div className="w-full max-w-xs md:max-w-xs rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden fade-up md:mt-0"
            style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>Añadir página</h2>
              </div>
              <button type="button" onClick={() => setMostrarSelectorTipo(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                style={{ color: "var(--texto-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-borde)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <X size={14} />
              </button>
            </div>
            {/* Opciones */}
            <div className="p-3 flex flex-col gap-1.5">
              {TIPOS_PAGINA.map((tipo) => (
                <button key={tipo.key} type="button" onClick={() => nuevaPagina(tipo.key)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all w-full"
                  style={{ border: `1.5px solid var(--gris-borde)`, background: "var(--gris-pagina)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = tipo.accent; e.currentTarget.style.background = tipo.bg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--gris-pagina)"; }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: tipo.bg, color: tipo.accent }}>
                    {tipo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: "var(--texto-primario)" }}>{tipo.label}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--texto-muted)" }}>{tipo.desc}</p>
                  </div>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ border: "2px solid var(--gris-borde)" }}>
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
