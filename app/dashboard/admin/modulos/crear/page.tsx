"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { API_URL } from "@/lib/api";

// ── TIPOS ─────────────────────────────────────────────────────────────────────
type Paso = 1 | 2 | 3 | 4;

type TipoGeneracion = "formativo" | "video" | "podcast" | "resumen";

interface ArchivoSubido {
  nombre: string;
  tamano: string;
  tipo: "pdf" | "docx" | "video" | "audio" | "otro";
  estado: "listo" | "procesando";
}

interface ConfigModulo {
  nombre: string;
  categoria: string;
  idioma: string;
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
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconFile = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IconVideo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
  </svg>
);
const IconMic = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
  </svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconBook = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
);
const IconAI = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconChevron = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function CrearModuloPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState<Paso>(1);
  const [archivos, setArchivos] = useState<ArchivoSubido[]>([]);
  const [archivosRaw, setArchivosRaw] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [resultadoIA, setResultadoIA] = useState<{ titulo: string; descripcion: string; contenido: string } | null>(null);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<TipoGeneracion[]>(["formativo"]);
  const [config, setConfig] = useState<ConfigModulo>({
    nombre: "",
    categoria: "ESPECIFICA",
    idioma: "es",
    duracion: "medio",
    asignarA: "todos",
  });
  const [generando, setGenerando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mensajeProgreso, setMensajeProgreso] = useState("");
  const [generado, setGenerado] = useState(false);

  // ── Subida de archivos ──
  const procesarArchivos = (files: FileList | null) => {
    if (!files) return;
    const nuevos: ArchivoSubido[] = Array.from(files).map((f) => ({
      nombre: f.name,
      tamano: formatBytes(f.size),
      tipo: getTipo(f.name),
      estado: "listo",
    }));
    setArchivos((prev) => [...prev, ...nuevos]);
    setArchivosRaw((prev) => [...prev, ...Array.from(files)]);
    if (paso === 1) setPaso(2);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    procesarArchivos(e.dataTransfer.files);
  };

  const eliminarArchivo = (idx: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== idx));
    setArchivosRaw((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Selección de tipos ──
  const toggleTipo = (tipo: TipoGeneracion) => {
    setTiposSeleccionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  // ── Generación con IA (backend real) ──
  const mensajesProgreso = [
    "Analizando documentos subidos…",
    "Extrayendo conceptos clave con IA…",
    "Estructurando lecciones y objetivos…",
    "Generando cuestionario de comprensión…",
    "Creando resumen estructurado…",
    "Finalizando módulo formativo…",
  ];

  const iniciarGeneracion = async () => {
    if (generando || archivos.length === 0 || !config.nombre.trim()) return;
    setGenerando(true);
    setGenerado(false);
    setProgreso(0);
    setPaso(3);

    // Animación de progreso mientras esperamos la respuesta
    let i = 0;
    setMensajeProgreso(mensajesProgreso[0]);
    const interval = setInterval(() => {
      i++;
      if (i < mensajesProgreso.length - 1) {
        setProgreso(Math.round((i / mensajesProgreso.length) * 85));
        setMensajeProgreso(mensajesProgreso[i]);
      }
    }, 1200);

    try {
      const formData = new FormData();
      formData.append("archivo", archivosRaw[0]); // first file

      const res = await fetch(`${API_URL}/ai/generar-desde-archivo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      clearInterval(interval);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setResultadoIA({
        titulo: data.titulo || config.nombre,
        descripcion: data.descripcion || "",
        contenido: data.contenido || "",
      });
      setProgreso(100);
      setMensajeProgreso("¡Módulo generado correctamente!");
      setGenerado(true);
      setPaso(4);
    } catch (err) {
      clearInterval(interval);
      setMensajeProgreso("Error al generar el módulo. Inténtalo de nuevo.");
      setProgreso(0);
      setGenerando(false);
      setPaso(2);
    }
  };

  // ── UI helpers ──
  const pasoLabel = ["Subir contenido", "Elegir formato", "Generar con IA", "Publicar"];

  const tiposConfig = [
    { id: "formativo" as TipoGeneracion, nombre: "Contenido formativo", desc: "Módulo con lecciones, objetivos y cuestionarios.", color: "var(--azul-egm-light)", stroke: "var(--azul-egm)", icono: <IconBook /> },
    { id: "video" as TipoGeneracion, nombre: "Vídeo formativo", desc: "Vídeo con narración automática y subtítulos.", color: "#fef3c7", stroke: "#d97706", icono: <IconVideo /> },
    { id: "podcast" as TipoGeneracion, nombre: "Podcast interno", desc: "Audio con voz sintética para escuchar en movilidad.", color: "var(--exito-light)", stroke: "var(--exito)", icono: <IconMic /> },
    { id: "resumen" as TipoGeneracion, nombre: "Resumen estructurado", desc: "Documento de puntos clave y documentación resumida.", color: "#e0f2fe", stroke: "#0284c7", icono: <IconDoc /> },
  ];

  const iconoArchivo = (tipo: ArchivoSubido["tipo"]) => {
    if (tipo === "video") return { bg: "#fef3c7", stroke: "#d97706", icon: <IconVideo /> };
    if (tipo === "audio") return { bg: "var(--exito-light)", stroke: "var(--exito)", icon: <IconMic /> };
    return { bg: "var(--azul-egm-light)", stroke: "var(--azul-egm)", icon: <IconFile /> };
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gris-pagina)" }}>
      <Header />

      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">

        {/* ── Cabecera ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs mb-3" style={{ color: "var(--texto-muted)" }}>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/admin" className="hover:underline">Admin</Link>
            <span>/</span>
            <span style={{ color: "var(--texto-primario)" }}>Crear módulo</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--texto-primario)" }}>
            Crear nuevo módulo formativo
          </h1>
          <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
            Sube contenido de tu empresa y la IA generará automáticamente el material formativo.
          </p>
        </div>

        {/* ── Stepper ── */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
          {pasoLabel.map((label, idx) => {
            const num = idx + 1;
            const estado = num < paso ? "done" : num === paso ? "active" : "pending";
            return (
              <div key={label} className="flex items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                    style={{
                      background: estado === "done" ? "var(--exito-light)" : estado === "active" ? "var(--marino)" : "var(--gris-superficie)",
                      color: estado === "done" ? "var(--exito)" : estado === "active" ? "#fff" : "var(--texto-muted)",
                    }}
                  >
                    {estado === "done" ? <IconCheck /> : num}
                  </div>
                  <span
                    className="text-xs font-medium whitespace-nowrap"
                    style={{ color: estado === "done" ? "var(--exito)" : estado === "active" ? "var(--texto-primario)" : "var(--texto-muted)" }}
                  >
                    {label}
                  </span>
                </div>
                {idx < pasoLabel.length - 1 && (
                  <div className="w-8 h-px mx-3 shrink-0" style={{ background: "var(--gris-borde)" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Layout dos columnas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

          {/* ── COLUMNA IZQUIERDA ── */}
          <div className="flex flex-col gap-5">

            {/* Panel subida */}
            <div className="rounded-xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--texto-primario)" }}>
                Contenido subido
              </p>

              {/* Zona drop */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className="rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all"
                style={{
                  border: `1.5px dashed ${dragging ? "var(--azul-egm)" : "var(--gris-borde)"}`,
                  background: dragging ? "var(--azul-egm-light)" : "var(--gris-pagina)",
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                  <IconUpload />
                </div>
                <div>
                  <p className="text-sm font-medium text-center" style={{ color: "var(--texto-primario)" }}>
                    Arrastra archivos o haz clic para subir
                  </p>
                  <p className="text-xs text-center mt-1" style={{ color: "var(--texto-muted)" }}>
                    Documentos, manuales, procedimientos operativos
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center mt-1">
                  {["PDF", "DOCX", "PPT", "MP4", "MP3", "TXT"].map((ext) => (
                    <span key={ext} className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>
                      {ext}
                    </span>
                  ))}
                </div>
                <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.ppt,.pptx,.mp4,.mp3,.txt" className="hidden" onChange={(e) => procesarArchivos(e.target.files)} />
              </div>

              {/* Lista archivos */}
              {archivos.length > 0 && (
                <div className="flex flex-col gap-2 mt-4">
                  {archivos.map((archivo, idx) => {
                    const { bg, stroke, icon } = iconoArchivo(archivo.tipo);
                    return (
                      <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: bg, color: stroke }}>
                          {icon}
                        </div>
                        <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--texto-primario)" }}>{archivo.nombre}</span>
                        <span className="text-[11px] shrink-0" style={{ color: "var(--texto-muted)" }}>{archivo.tamano}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{
                          background: archivo.estado === "listo" ? "var(--exito-light)" : "var(--azul-egm-light)",
                          color: archivo.estado === "listo" ? "var(--exito)" : "var(--azul-egm)",
                        }}>
                          {archivo.estado === "listo" ? "Listo" : "Procesando"}
                        </span>
                        <button onClick={() => eliminarArchivo(idx)} className="shrink-0 transition-opacity hover:opacity-70" style={{ color: "var(--texto-muted)" }}>
                          <IconTrash />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panel tipos de generación */}
            <div className="rounded-xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--texto-primario)" }}>
                ¿Qué quieres generar?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {tiposConfig.map((tipo) => {
                  const sel = tiposSeleccionados.includes(tipo.id);
                  return (
                    <div
                      key={tipo.id}
                      onClick={() => toggleTipo(tipo.id)}
                      className="rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2"
                      style={{
                        border: `1.5px solid ${sel ? "var(--azul-egm)" : "var(--gris-borde)"}`,
                        background: sel ? "var(--azul-egm-light)" : "var(--blanco)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: tipo.color, color: tipo.stroke }}>
                          {tipo.icono}
                        </div>
                        <div
                          className="w-4 h-4 rounded-full border flex items-center justify-center"
                          style={{
                            background: sel ? "var(--azul-egm)" : "transparent",
                            borderColor: sel ? "var(--azul-egm)" : "var(--gris-borde)",
                            color: "#fff",
                          }}
                        >
                          {sel && <IconCheck />}
                        </div>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: "var(--texto-primario)" }}>{tipo.nombre}</p>
                      <p className="text-[11px] leading-relaxed" style={{ color: "var(--texto-muted)" }}>{tipo.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA ── */}
          <div className="flex flex-col gap-5">

            {/* Formulario configuración */}
            <div className="rounded-xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>

              {/* Nombre */}
              <div className="mb-4">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>Nombre del módulo</label>
                <input
                  type="text"
                  value={config.nombre}
                  onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                  placeholder="Ej: Manual de seguridad — Planta A"
                  className="w-full text-sm px-3 py-2.5 rounded-lg outline-none transition-all"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; e.target.style.boxShadow = "0 0 0 3px var(--azul-egm-light)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--gris-borde)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Categoría */}
              <div className="mb-4">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>Categoría</label>
                <select value={config.categoria} onChange={(e) => setConfig({ ...config, categoria: e.target.value })}
                  className="w-full text-sm px-3 py-2.5 rounded-lg outline-none cursor-pointer"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}>
                  <option value="ESPECIFICA">Formación específica</option>
                  <option value="BASICA">Formación básica</option>
                  <option value="DESARROLLO">Desarrollo profesional</option>
                  <option value="IDENTIDAD">Identidad corporativa</option>
                </select>
              </div>

              {/* Idioma */}
              <div className="mb-4">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>Idioma del contenido</label>
                <select value={config.idioma} onChange={(e) => setConfig({ ...config, idioma: e.target.value })}
                  className="w-full text-sm px-3 py-2.5 rounded-lg outline-none cursor-pointer"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="ca">Valenciano</option>
                </select>
              </div>

              {/* Duración */}
              <div className="mb-4">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>Duración estimada</label>
                <select value={config.duracion} onChange={(e) => setConfig({ ...config, duracion: e.target.value })}
                  className="w-full text-sm px-3 py-2.5 rounded-lg outline-none cursor-pointer"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}>
                  <option value="corto">Corto (hasta 15 min)</option>
                  <option value="medio">Medio (15–45 min)</option>
                  <option value="largo">Largo (más de 45 min)</option>
                </select>
              </div>

              {/* Asignar a */}
              <div className="mb-5">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>Asignar a</label>
                <select value={config.asignarA} onChange={(e) => setConfig({ ...config, asignarA: e.target.value })}
                  className="w-full text-sm px-3 py-2.5 rounded-lg outline-none cursor-pointer"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}>
                  <option value="todos">Todos los empleados</option>
                  <option value="nuevos">Nuevos empleados</option>
                  <option value="tecnicos">Técnicos de planta</option>
                  <option value="manual">Selección manual</option>
                </select>
              </div>

              <div className="h-px mb-5" style={{ background: "var(--gris-borde)" }} />

              {/* Validación */}
              {archivos.length === 0 && (
                <p className="text-xs text-center mb-3" style={{ color: "var(--advertencia)" }}>
                  ⚠ Sube al menos un archivo para continuar
                </p>
              )}
              {!config.nombre.trim() && archivos.length > 0 && (
                <p className="text-xs text-center mb-3" style={{ color: "var(--advertencia)" }}>
                  ⚠ Escribe un nombre para el módulo
                </p>
              )}

              {/* Botón generar */}
              <button
                onClick={iniciarGeneracion}
                disabled={generando || archivos.length === 0 || !config.nombre.trim()}
                className="w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: generado ? "var(--exito)" : "var(--marino)",
                  color: "#fff",
                }}
              >
                {generado ? (
                  <><IconCheck /> Módulo generado</>
                ) : generando ? (
                  <><span className="loading-dots">Generando con IA</span></>
                ) : (
                  <><IconAI /> Generar con IA</>
                )}
              </button>

              {/* Barra de progreso */}
              {generando && (
                <div className="mt-3">
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--gris-superficie)" }}>
                    <div
                      className="h-1 rounded-full transition-all duration-700"
                      style={{ width: `${progreso}%`, background: "var(--azul-egm)" }}
                    />
                  </div>
                  <p className="text-[11px] text-center mt-2" style={{ color: "var(--texto-muted)" }}>{mensajeProgreso}</p>
                </div>
              )}
            </div>

            {/* Vista previa */}
            <div className="rounded-xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Vista previa del módulo</p>
                <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                  Generado por IA
                </span>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                {/* Cabecera módulo */}
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--marino)" }}>
                  <span className="text-sm font-medium text-white truncate">
                    {config.nombre || "Nombre del módulo"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full ml-2 shrink-0" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                    {config.categoria === "ESPECIFICA" ? "Form. específica" :
                      config.categoria === "BASICA" ? "Form. básica" :
                      config.categoria === "DESARROLLO" ? "Desarrollo" : "Identidad"}
                  </span>
                </div>

                {/* Secciones */}
                <div className="p-4 flex flex-col divide-y" style={{ borderColor: "var(--gris-superficie)" }}>
                  {[
                    { bg: "var(--azul-egm-light)", stroke: "var(--azul-egm)", titulo: "Objetivos del módulo", desc: "3 objetivos clave extraídos del manual", tag: "Auto" },
                    { bg: "var(--exito-light)", stroke: "var(--exito)", titulo: "Lecciones generadas", desc: "5 lecciones · 30 min estimados", tag: "5 lec." },
                    { bg: "#fef3c7", stroke: "#d97706", titulo: "Cuestionario final", desc: "10 preguntas de comprensión", tag: "Auto" },
                    { bg: "#e0f2fe", stroke: "#0284c7", titulo: "Resumen descargable", desc: "PDF con puntos clave estructurados", tag: "PDF" },
                  ].map((s) => (
                    <div key={s.titulo} className="flex items-start gap-3 py-2.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: s.bg, color: s.stroke }}>
                        <IconDoc />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>{s.titulo}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--texto-muted)" }}>{s.desc}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.stroke }}>
                        {s.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Sección output tras generación ── */}
        {generado && (
          <div className="mt-6 rounded-xl p-5" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <p className="text-sm font-semibold mb-4" style={{ color: "var(--texto-primario)" }}>
              Contenido generado — listo para publicar
            </p>

            {/* Resultado IA */}
            {resultadoIA && (
              <div className="mb-5 rounded-lg p-4" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                <p className="text-base font-bold mb-1" style={{ color: "var(--texto-primario)" }}>{resultadoIA.titulo}</p>
                <p className="text-sm mb-3" style={{ color: "var(--texto-secundario)" }}>{resultadoIA.descripcion}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texto-secundario)" }}>{resultadoIA.contenido}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {tiposSeleccionados.map((tipo) => {
                const t = tiposConfig.find((x) => x.id === tipo)!;
                return (
                  <div key={tipo} className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1px solid var(--gris-borde)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: t.color, color: t.stroke }}>
                      {t.icono}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>{t.nombre}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                        {tipo === "formativo" ? "5 lecciones · 10 preguntas" :
                          tipo === "video" ? "Vídeo HD · 12 min" :
                          tipo === "podcast" ? "Audio MP3 · 8 min" : "PDF · 4 páginas"}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push("/dashboard/admin")}
                      className="mt-auto text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                      style={{ color: "var(--azul-egm)" }}
                    >
                      {tipo === "formativo" ? "Publicar módulo" :
                        tipo === "resumen" ? "Descargar PDF" :
                        tipo === "video" ? "Ver vídeo" : "Escuchar podcast"}
                      <IconChevron />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
