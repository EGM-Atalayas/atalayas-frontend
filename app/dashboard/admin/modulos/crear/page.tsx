"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type Paso = 1 | 2 | 3 | 4;
type TipoGeneracion = "formativo" | "video" | "podcast" | "resumen";

interface ArchivoSubido {
  nombre: string;
  tamano: string;
  tipo:   "pdf" | "docx" | "video" | "audio" | "otro";
  estado: "listo" | "procesando";
}

interface ConfigModulo {
  nombre:   string;
  categoria: string;
  idioma:   string;
  duracion: string;
  asignarA: string;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function getTipo(nombre: string): ArchivoSubido["tipo"] {
  const ext = nombre.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || ext === "docx" || ext === "txt" || ext === "ppt" || ext === "pptx") return "pdf";
  if (ext === "mp4" || ext === "mov") return "video";
  if (ext === "mp3" || ext === "wav") return "audio";
  return "otro";
}

// ── ICONOS ────────────────────────────────────────────────────────────────────
const IconUpload = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconFile  = () => (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>);
const IconVideo = () => (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>);
const IconMic   = () => (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>);
const IconDoc   = () => (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const IconBook  = () => (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>);
const IconAI    = () => (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>);
const IconCheck = () => (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IconTrash = () => (<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>);
const IconSpark = () => (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>);

const ROLES_BLOQUEADOS = ["ROLE_EMPLEADO", "INVITADO"];

const TIPOS_CONFIG = [
  {
    id:     "formativo" as TipoGeneracion,
    nombre: "Contenido formativo",
    desc:   "Módulo completo con lecciones, objetivos y cuestionarios de comprensión.",
    bg:     "var(--azul-egm-light)",
    color:  "var(--azul-egm)",
    icono:  <IconBook />,
  },
  {
    id:     "video" as TipoGeneracion,
    nombre: "Vídeo formativo",
    desc:   "Vídeo con narración automática generada por IA y subtítulos.",
    bg:     "#fef3c7",
    color:  "#b45309",
    icono:  <IconVideo />,
  },
  {
    id:     "podcast" as TipoGeneracion,
    nombre: "Podcast interno",
    desc:   "Audio con voz sintética optimizado para escuchar en movilidad.",
    bg:     "#dcfce7",
    color:  "#15803d",
    icono:  <IconMic />,
  },
  {
    id:     "resumen" as TipoGeneracion,
    nombre: "Resumen estructurado",
    desc:   "Documento PDF con los puntos clave organizados y resumidos.",
    bg:     "#e0f2fe",
    color:  "#0284c7",
    icono:  <IconDoc />,
  },
];

const PASOS_LABELS = ["Subir contenido", "Configurar", "Generar con IA", "Publicar"];

export default function CrearModuloPage() {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario && ROLES_BLOQUEADOS.includes(usuario.codigoRol)) {
      router.replace("/dashboard");
    }
  }, [usuario]);

  if (!usuario || ROLES_BLOQUEADOS.includes(usuario.codigoRol)) return null;

  const [paso,            setPaso]            = useState<Paso>(1);
  const [archivos,        setArchivos]        = useState<ArchivoSubido[]>([]);
  const [archivosRaw,     setArchivosRaw]     = useState<File[]>([]);
  const [dragging,        setDragging]        = useState(false);
  const [resultadoIA,     setResultadoIA]     = useState<{ titulo: string; descripcion: string; contenido: string } | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoGeneracion>("formativo");
  const [config,          setConfig]          = useState<ConfigModulo>({
    nombre: "", categoria: "ESPECIFICA", idioma: "es", duracion: "medio", asignarA: "todos",
  });
  const [generando,       setGenerando]       = useState(false);
  const [progreso,        setProgreso]        = useState(0);
  const [mensajeProgreso, setMensajeProgreso] = useState("");
  const [generado,        setGenerado]        = useState(false);

  const procesarArchivos = (files: FileList | null) => {
    if (!files) return;
    const nuevos: ArchivoSubido[] = Array.from(files).map((f) => ({
      nombre: f.name,
      tamano: formatBytes(f.size),
      tipo:   getTipo(f.name),
      estado: "listo" as const,
    }));
    setArchivos((prev) => [...prev, ...nuevos]);
    setArchivosRaw((prev) => [...prev, ...Array.from(files)]);
    if (paso === 1) setPaso(2);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    procesarArchivos(e.dataTransfer.files);
  };

  const eliminarArchivo = (idx: number) => {
    setArchivos((p) => p.filter((_, i) => i !== idx));
    setArchivosRaw((p) => p.filter((_, i) => i !== idx));
  };

  const MENSAJES_PROGRESO = [
    "Analizando documentos subidos…",
    "Extrayendo conceptos clave con IA…",
    "Estructurando lecciones y objetivos…",
    "Generando cuestionario de comprensión…",
    "Creando resumen estructurado…",
    "Finalizando módulo formativo…",
  ];

  const iniciarGeneracion = async () => {
    if (generando || archivos.length === 0 || !config.nombre.trim()) return;
    setGenerando(true); setGenerado(false); setProgreso(0); setPaso(3);
    let i = 0;
    setMensajeProgreso(MENSAJES_PROGRESO[0]);
    const interval = setInterval(() => {
      i++;
      if (i < MENSAJES_PROGRESO.length - 1) {
        setProgreso(Math.round((i / MENSAJES_PROGRESO.length) * 85));
        setMensajeProgreso(MENSAJES_PROGRESO[i]);
      }
    }, 1200);
    try {
      const formData = new FormData();
      formData.append("archivo", archivosRaw[0]);
      const resIA = await fetch(`${API_URL}/ai/generar-desde-archivo`, {
        method: "POST", credentials: "include", body: formData,
      });
      clearInterval(interval);
      if (!resIA.ok) throw new Error(`HTTP ${resIA.status}`);
      const dataIA = await resIA.json();
      const titulo      = dataIA.titulo      || config.nombre;
      const descripcion = dataIA.descripcion || "";
      const contenido   = dataIA.contenido   || "";
      setResultadoIA({ titulo, descripcion, contenido });
      setProgreso(90);
      setMensajeProgreso("Guardando módulo en la plataforma…");
      const resModulo = await fetch(`${API_URL}/modulos`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: titulo, descripcion, tipoModulo: "ESPECIALIZADO_IA",
          esEspecializadoIa: true, activo: true, empresaId: usuario?.empresaId ?? null,
        }),
      });
      if (!resModulo.ok) throw new Error(`HTTP ${resModulo.status}`);
      setProgreso(100);
      setMensajeProgreso("¡Módulo creado correctamente!");
      setGenerado(true); setPaso(4);
    } catch {
      clearInterval(interval);
      setMensajeProgreso("Error al generar el módulo. Inténtalo de nuevo.");
      setProgreso(0); setGenerando(false); setPaso(2);
    }
  };

  const puedeGenerar = archivos.length > 0 && config.nombre.trim().length > 0;

  return (
    <div className="w-full">
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(163,181,53,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(163,181,53,0); }
          100% { box-shadow: 0 0 0 0 rgba(163,181,53,0); }
        }
      `}</style>

      {/* ══════════════ HERO ══════════════ */}
      <div
        className="-mx-8 -mt-8 relative overflow-hidden"
        style={{ minHeight: "220px" }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/background-formacion-empleado.jpg')", backgroundSize: "cover", backgroundPosition: "center 30%" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,20,40,0.72)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,20,40,0.95) 0%, rgba(10,20,40,0.5) 60%, transparent 100%)" }} />

        <div className="relative z-10 px-10 lg:px-16 flex flex-col justify-center" style={{ minHeight: "220px", paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/admin" className="hover:text-white transition-colors">Administración</Link>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.8)" }}>Crear módulo</span>
          </div>

          <div style={{ animation: "fadeUp 0.6s ease both" }}>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(163,181,53,0.2)", color: "#A3B535", border: "1px solid rgba(163,181,53,0.3)" }}
              >
                <IconSpark />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A3B535" }}>
                Generación con IA
              </span>
            </div>
            <h1 style={{
              fontFamily:   "'Instrument Serif', serif",
              fontStyle:    "italic",
              fontSize:     "clamp(2.2rem, 4vw, 3.2rem)",
              fontWeight:   400,
              color:        "#fff",
              lineHeight:   1.15,
              letterSpacing: "-0.02em",
            }}>
              Crear nuevo módulo formativo
            </h1>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)", maxWidth: "480px" }}>
              Sube documentos de tu empresa y la IA generará automáticamente el material formativo listo para asignar.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════ STEPPER ══════════════ */}
      <div className="px-10 lg:px-16 py-8" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
        <div className="flex items-center gap-0 overflow-x-auto">
          {PASOS_LABELS.map((label, idx) => {
            const num    = idx + 1;
            const estado = num < paso ? "done" : num === paso ? "active" : "pending";
            const isLast = idx === PASOS_LABELS.length - 1;
            return (
              <div key={label} className="flex items-center shrink-0" style={{ flex: isLast ? "0 0 auto" : "1 1 auto" }}>
                <div className="flex items-center gap-3">
                  {/* Círculo numerado */}
                  <div
                    className="flex items-center justify-center rounded-full font-bold text-sm shrink-0"
                    style={{
                      width:      "36px",
                      height:     "36px",
                      background: estado === "done"   ? "var(--verde-oliva)"
                                : estado === "active" ? "var(--azul-egm)"
                                : "var(--gris-superficie)",
                      color:      estado === "pending" ? "var(--texto-muted)" : "#fff",
                      boxShadow:  estado === "active"  ? "0 0 0 4px rgba(var(--azul-egm-rgb,30,64,175),0.15)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {estado === "done" ? <IconCheck /> : num}
                  </div>
                  {/* Label */}
                  <div>
                    <p
                      className="text-xs font-semibold whitespace-nowrap"
                      style={{
                        color: estado === "done"   ? "var(--verde-oliva)"
                             : estado === "active" ? "var(--texto-primario)"
                             : "var(--texto-muted)",
                      }}
                    >
                      {label}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--texto-muted)" }}>
                      {estado === "done" ? "Completado" : estado === "active" ? "En curso" : "Pendiente"}
                    </p>
                  </div>
                </div>
                {/* Línea conectora */}
                {!isLast && (
                  <div
                    className="flex-1 mx-4 rounded-full"
                    style={{
                      height:     "2px",
                      minWidth:   "32px",
                      background: num < paso ? "var(--verde-oliva)" : "var(--gris-borde)",
                      transition: "background 0.3s ease",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════ CONTENIDO PRINCIPAL ══════════════ */}
      <div className="px-10 lg:px-16 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* ────── COLUMNA IZQUIERDA ────── */}
          <div className="flex flex-col gap-6">

            {/* Panel 1: Subida de archivos */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                  <IconUpload />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Contenido a transformar</p>
                  <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Sube los documentos base para generar el módulo</p>
                </div>
                {archivos.length > 0 && (
                  <span
                    className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
                  >
                    {archivos.length} archivo{archivos.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="p-6">
                {/* Zona drop */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className="rounded-xl flex flex-col items-center gap-4 cursor-pointer transition-all"
                  style={{
                    padding:    "2.5rem 1.5rem",
                    border:     `2px dashed ${dragging ? "var(--azul-egm)" : "var(--gris-borde)"}`,
                    background: dragging ? "var(--azul-egm-light)" : "var(--gris-pagina)",
                    transform:  dragging ? "scale(1.01)" : "scale(1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: dragging ? "var(--azul-egm)" : "var(--gris-superficie)",
                      color:      dragging ? "#fff" : "var(--texto-muted)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <IconUpload />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--texto-primario)" }}>
                      Arrastra archivos aquí o{" "}
                      <span style={{ color: "var(--azul-egm)", textDecoration: "underline" }}>selecciona desde tu equipo</span>
                    </p>
                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
                      Documentos, manuales, procedimientos, presentaciones, vídeos
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {["PDF", "DOCX", "PPT", "MP4", "MP3", "TXT"].map((ext) => (
                      <span
                        key={ext}
                        className="text-[11px] px-2.5 py-1 rounded-md font-medium"
                        style={{ background: "var(--blanco)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}
                      >
                        .{ext}
                      </span>
                    ))}
                  </div>
                  <input
                    ref={inputRef} type="file" multiple
                    accept=".pdf,.docx,.ppt,.pptx,.mp4,.mp3,.txt"
                    className="hidden"
                    onChange={(e) => procesarArchivos(e.target.files)}
                  />
                </div>

                {/* Lista de archivos subidos */}
                {archivos.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    {archivos.map((archivo, idx) => {
                      const esVideo = archivo.tipo === "video";
                      const esAudio = archivo.tipo === "audio";
                      const bg    = esVideo ? "#fef3c7" : esAudio ? "#dcfce7" : "var(--azul-egm-light)";
                      const color = esVideo ? "#b45309"  : esAudio ? "#15803d"  : "var(--azul-egm)";
                      const Icon  = esVideo ? <IconVideo /> : esAudio ? <IconMic /> : <IconFile />;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-xl px-4 py-3"
                          style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg, color }}>
                            {Icon}
                          </div>
                          <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--texto-primario)" }}>{archivo.nombre}</span>
                          <span className="text-xs shrink-0" style={{ color: "var(--texto-muted)" }}>{archivo.tamano}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                            style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}
                          >
                            Listo
                          </span>
                          <button
                            onClick={() => eliminarArchivo(idx)}
                            className="shrink-0 rounded-lg p-1 transition-colors"
                            style={{ color: "var(--texto-muted)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--texto-muted)"; }}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Panel 2: Tipo de generación */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
            >
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                  <IconSpark />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Formato de salida</p>
                  <p className="text-xs" style={{ color: "var(--texto-muted)" }}>¿Cómo quieres que la IA transforme el contenido?</p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {TIPOS_CONFIG.map((tipo) => {
                    const sel = tipoSeleccionado === tipo.id;
                    return (
                      <button
                        key={tipo.id}
                        onClick={() => setTipoSeleccionado(tipo.id)}
                        className="rounded-xl p-4 text-left transition-all flex flex-col gap-3"
                        style={{
                          border:     `2px solid ${sel ? "var(--azul-egm)" : "var(--gris-borde)"}`,
                          background: sel ? "var(--azul-egm-light)" : "var(--gris-pagina)",
                          transform:  sel ? "translateY(-1px)" : "translateY(0)",
                          boxShadow:  sel ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: tipo.bg, color: tipo.color }}
                          >
                            {tipo.icono}
                          </div>
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{
                              background:   sel ? "var(--azul-egm)" : "transparent",
                              borderColor:  sel ? "var(--azul-egm)" : "var(--gris-borde)",
                              color:        "#fff",
                            }}
                          >
                            {sel && <IconCheck />}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{ color: "var(--texto-primario)" }}>{tipo.nombre}</p>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--texto-muted)" }}>{tipo.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* ────── COLUMNA DERECHA ────── */}
          <div className="flex flex-col gap-6">

            {/* Formulario de configuración */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
            >
              <div
                className="px-6 py-4"
                style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Configuración del módulo</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Define los parámetros del módulo formativo</p>
              </div>

              <div className="p-6 flex flex-col gap-4">

                {/* Nombre */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                    Nombre del módulo <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={config.nombre}
                    onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                    placeholder="Ej: Manual de seguridad — Planta A"
                    className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all"
                    style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; e.target.style.background = "var(--blanco)"; e.target.style.boxShadow = "0 0 0 3px var(--azul-egm-light)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "var(--gris-borde)"; e.target.style.background = "var(--gris-pagina)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Categoría + Idioma */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Categoría</label>
                    <select
                      value={config.categoria}
                      onChange={(e) => setConfig({ ...config, categoria: e.target.value })}
                      className="w-full text-sm px-3 py-3 rounded-xl outline-none cursor-pointer"
                      style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
                    >
                      <option value="ESPECIFICA">Específica</option>
                      <option value="BASICA">Básica</option>
                      <option value="DESARROLLO">Desarrollo</option>
                      <option value="IDENTIDAD">Corporativa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Idioma</label>
                    <select
                      value={config.idioma}
                      onChange={(e) => setConfig({ ...config, idioma: e.target.value })}
                      className="w-full text-sm px-3 py-3 rounded-xl outline-none cursor-pointer"
                      style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                      <option value="ca">Valenciano</option>
                    </select>
                  </div>
                </div>

                {/* Duración + Asignar a */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Duración</label>
                    <select
                      value={config.duracion}
                      onChange={(e) => setConfig({ ...config, duracion: e.target.value })}
                      className="w-full text-sm px-3 py-3 rounded-xl outline-none cursor-pointer"
                      style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
                    >
                      <option value="corto">Corto (−15 min)</option>
                      <option value="medio">Medio (15–45 min)</option>
                      <option value="largo">Largo (+45 min)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>Asignar a</label>
                    <select
                      value={config.asignarA}
                      onChange={(e) => setConfig({ ...config, asignarA: e.target.value })}
                      className="w-full text-sm px-3 py-3 rounded-xl outline-none cursor-pointer"
                      style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
                    >
                      <option value="todos">Todos</option>
                      <option value="nuevos">Nuevos</option>
                      <option value="tecnicos">Técnicos</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "var(--gris-borde)" }} />

                {/* Validaciones */}
                {archivos.length === 0 && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "#fef9c3", color: "#854d0e" }}>
                    <span>⚠</span> Sube al menos un archivo para continuar
                  </div>
                )}
                {!config.nombre.trim() && archivos.length > 0 && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "#fef9c3", color: "#854d0e" }}>
                    <span>⚠</span> Escribe un nombre para el módulo
                  </div>
                )}

                {/* Botón generar */}
                <button
                  onClick={iniciarGeneracion}
                  disabled={generando || !puedeGenerar}
                  className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all"
                  style={{
                    background:  generado     ? "var(--verde-oliva)"
                               : puedeGenerar ? "var(--azul-egm)"
                               : "var(--gris-superficie)",
                    color:       puedeGenerar || generado ? "#fff" : "var(--texto-muted)",
                    cursor:      !puedeGenerar || generando ? "not-allowed" : "pointer",
                    boxShadow:   puedeGenerar && !generando ? "0 4px 14px rgba(30,64,175,0.3)" : "none",
                    transform:   puedeGenerar && !generando ? "translateY(0)" : "none",
                  }}
                  onMouseEnter={(e) => { if (puedeGenerar && !generando) e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {generado ? (
                    <><IconCheck /> Módulo generado</>
                  ) : generando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generando…
                    </>
                  ) : (
                    <><IconAI /> Generar con IA</>
                  )}
                </button>

                {/* Barra de progreso */}
                {generando && (
                  <div>
                    <div className="w-full rounded-full overflow-hidden" style={{ height: "6px", background: "var(--gris-superficie)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${progreso}%`, background: "linear-gradient(90deg, var(--azul-egm), #A3B535)" }}
                      />
                    </div>
                    <p className="text-xs text-center mt-2" style={{ color: "var(--texto-muted)" }}>{mensajeProgreso}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vista previa estructural */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
            >
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: "var(--marino)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
              >
                <div>
                  <p className="text-sm font-semibold text-white truncate">
                    {config.nombre || "Vista previa del módulo"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {config.categoria === "ESPECIFICA" ? "Form. específica"
                     : config.categoria === "BASICA"   ? "Form. básica"
                     : config.categoria === "DESARROLLO" ? "Desarrollo"
                     : "Corporativo"} · {config.idioma === "es" ? "Español" : config.idioma === "en" ? "Inglés" : "Valenciano"}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full font-semibold shrink-0" style={{ background: "rgba(163,181,53,0.2)", color: "#A3B535" }}>
                  IA
                </span>
              </div>

              <div className="divide-y" style={{ borderColor: "var(--gris-borde)" }}>
                {[
                  { bg: "var(--azul-egm-light)", color: "var(--azul-egm)", titulo: "Objetivos del módulo",  desc: "3 objetivos extraídos automáticamente",   tag: "Auto" },
                  { bg: "#dcfce7",               color: "#15803d",          titulo: "Lecciones generadas",  desc: "5 lecciones · estimado 30 min",            tag: "5 lec." },
                  { bg: "#fef3c7",               color: "#b45309",          titulo: "Cuestionario final",   desc: "10 preguntas de comprensión lectora",       tag: "Auto" },
                  { bg: "#e0f2fe",               color: "#0284c7",          titulo: "Resumen descargable",  desc: "PDF con puntos clave estructurados",        tag: "PDF" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg, color: s.color }}>
                      <IconDoc />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: "var(--texto-primario)" }}>{s.titulo}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--texto-muted)" }}>{s.desc}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: s.bg, color: s.color }}>{s.tag}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════ BANNER ÉXITO ══════════════ */}
        {generado && (
          <div
            className="mt-8 rounded-2xl p-6 flex items-start gap-5"
            style={{ background: "#f0fdf4", border: "2px solid var(--verde-oliva)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--verde-oliva)", color: "#fff" }}
            >
              <IconCheck />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold mb-1" style={{ color: "var(--texto-primario)" }}>
                ¡Módulo generado y publicado con éxito!
              </p>
              <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                <strong>{resultadoIA?.titulo || config.nombre}</strong> ya está disponible en la plataforma y listo para asignar a los empleados.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => router.push("/dashboard/admin?tab=formaciones")}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: "var(--blanco)", color: "var(--texto-primario)", border: "1px solid var(--gris-borde)" }}
              >
                Ver módulos
              </button>
              <button
                onClick={() => { setGenerado(false); setArchivos([]); setArchivosRaw([]); setConfig({ nombre: "", categoria: "ESPECIFICA", idioma: "es", duracion: "medio", asignarA: "todos" }); setPaso(1); setResultadoIA(null); }}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: "var(--verde-oliva)", color: "#fff" }}
              >
                Crear otro
              </button>
            </div>
          </div>
        )}

        {/* Contenido IA generado */}
        {generado && resultadoIA && (
          <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
              <IconAI />
              <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Contenido generado por IA</p>
            </div>
            <div className="p-6">
              <p className="text-lg font-bold mb-1" style={{ color: "var(--texto-primario)" }}>{resultadoIA.titulo}</p>
              <p className="text-sm mb-4" style={{ color: "var(--texto-muted)" }}>{resultadoIA.descripcion}</p>
              <div className="rounded-xl p-4" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texto-secundario)" }}>{resultadoIA.contenido}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
