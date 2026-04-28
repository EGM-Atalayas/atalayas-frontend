"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getComunicados, desactivarComunicado } from "@/lib/api/noticias";
import type { Comunicado } from "@/lib/types/noticias";
import { 
  BsBook, 
  BsMortarboard, 
  BsCameraVideo, 
  BsPencilSquare, 
  BsLightbulb, 
  BsFilm, 
  BsFileEarmarkPdf 
} from "react-icons/bs";
import { jsPDF } from "jspdf";

const GRAD_BTN = "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)";

const TIPOS_CONTENIDO = [
  { key: "tutorial", label: "Tutorial", hint: "Guías paso a paso", Icon: BsBook },
  { key: "curso", label: "Curso", hint: "Formación estructurada", Icon: BsMortarboard },
  { key: "video", label: "Video", hint: "Contenido audiovisual", Icon: BsCameraVideo },
] as const;

// Colores para las etiquetas en las tarjetas
const TIPO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tutorial: { bg: "#e8f5ee", text: "#1a6b3a", border: "#9dcdb3" },
  curso:    { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  video:    { bg: "#fef3c7", text: "#92400e", border: "#fbbf24" },
  General:  { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function SuperadminComunicadosPage() {
  // ── ESTADOS DE LA LISTA ──
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "expirados">("activos");
  const [showForm, setShowForm] = useState(false);

  // ── ESTADOS DEL FORMULARIO ──
  const [tipoContenido, setTipoContenido] = useState<"tutorial" | "curso" | "video">("tutorial");
  const [modoIngreso, setModoIngreso] = useState<"manual" | "ia">("manual");
  const [promptIA, setPromptIA] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [imagenPreviewUrl, setImagenPreviewUrl] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isDraggingImagen, setIsDraggingImagen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [iaCargando, setIaCargando] = useState(false);
  const [iaResumen, setIaResumen] = useState("");
  const [iaEtiquetas, setIaEtiquetas] = useState<string[]>([]);
  const [pdfGeneradoBlob, setPdfGeneradoBlob] = useState<Blob | null>(null);

  // ── EFECTOS Y CARGA ──
  useEffect(() => { cargarLista(); }, []);

  async function cargarLista() {
    setLoadingList(true);
    try {
      const data = await getComunicados();
      data.sort((a, b) => new Date(b.fechaPublicacion ?? "").getTime() - new Date(a.fechaPublicacion ?? "").getTime());
      setComunicados(data);
    } catch {
      setComunicados([]);
    } finally {
      setLoadingList(false);
    }
  }

  const nombreArchivo = useMemo(() => {
    if (tipoContenido === "video") return videoFile?.name ?? "Ningún video seleccionado";
    return pdfFile?.name ?? "Ningún PDF seleccionado";
  }, [pdfFile, videoFile, tipoContenido]);

  useEffect(() => {
    if (tipoContenido === "video") { setPdfPreviewUrl(""); return; }
    if (!pdfFile) { setPdfPreviewUrl(""); return; }
    const url = URL.createObjectURL(pdfFile);
    setPdfPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [tipoContenido, pdfFile]);

  useEffect(() => {
    if (tipoContenido !== "video" || !videoFile) { setVideoPreviewUrl(""); return; }
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [tipoContenido, videoFile]);

  useEffect(() => {
    if (!imagenFile) { setImagenPreviewUrl(""); return; }
    const url = URL.createObjectURL(imagenFile);
    setImagenPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imagenFile]);

  // ── ACCIONES DE INTERFAZ ──
  const abrirCrear = () => {
    limpiarFormulario();
    setShowForm(true);
    document.body.style.overflow = "hidden";
  };

  const cerrarForm = () => {
    setShowForm(false);
    limpiarFormulario();
    document.body.style.overflow = "auto";
  };

  const limpiarFormulario = () => {
    setTipoContenido("tutorial");
    setModoIngreso("manual");
    setPromptIA("");
    setTitulo("");
    setDescripcion("");
    setPdfFile(null);
    setVideoFile(null);
    setImagenFile(null);
    setPdfPreviewUrl("");
    setVideoPreviewUrl("");
    setImagenPreviewUrl("");
    setIaResumen("");
    setIaEtiquetas([]);
    setError("");
    setOkMsg("");
    setPdfGeneradoBlob(null);
  };

  // ── FUNCIÓN IA ──
  const handleGenerarIACompleta = async () => {
    if (!promptIA.trim()) {
      setError("Dinos brevemente de qué trata el comunicado para que el asistente pueda trabajar.");
      return;
    }
    setIaCargando(true);
    setError("");
    setOkMsg("");

    try {
      const prompt = `Actúa como un experto en marketing y estructuración de contenido. 
Genera estrictamente un objeto JSON válido con esta estructura exacta y sin formato markdown adicional:
{"titulo":"texto corto","descripcion":"texto","resumen":"texto corto","etiquetas":["tag1","tag2","tag3"]}

Contexto del comunicado:
- Tipo de contenido: ${tipoContenido}
- Petición del usuario: ${promptIA}

Instrucciones para los campos del JSON:
- titulo: Atractivo y claro, máximo 10 palabras.
- descripcion: 2 a 4 frases en español, tono profesional y explicativo.
- resumen: Máximo 20 palabras.
- etiquetas: Exactamente 3 etiquetas útiles y relacionadas en español (sin el símbolo #).`;

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      const res = await fetch("/api/chat/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = "No se pudo generar el contenido";
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const parsed = await res.json();

      if (!parsed?.titulo?.trim() || !parsed?.descripcion?.trim()) {
        throw new Error(`La IA generó campos incompletos.`);
      }

      setTitulo(parsed.titulo.trim());
      setDescripcion(parsed.descripcion.trim());
      setIaResumen(typeof parsed?.resumen === "string" ? parsed.resumen : "");
      setIaEtiquetas(Array.isArray(parsed?.etiquetas) ? parsed.etiquetas.slice(0, 3) : []);

      if (tipoContenido !== "video") {
        try {
          const pdfRes = await fetch("/api/comunicados-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titulo: parsed.titulo,
              descripcion: parsed.descripcion,
              tipo: tipoContenido,
            }),
          });

          if (pdfRes.ok) {
            const blob = await pdfRes.blob();
            const file = new File([blob], `${parsed.titulo.replace(/\s+/g, "_").toLowerCase()}.pdf`, {
              type: "application/pdf",
            });
            setPdfFile(file);
            setPdfGeneradoBlob(blob); 
          }
        } catch (pdfError) {
          console.warn("Error generando PDF automático:", pdfError);
        }
      }

      setModoIngreso("manual");
      setOkMsg("¡Contenido generado con éxito! Puedes revisar el PDF y editar antes de publicar.");
      setPromptIA("");

    } catch (err: any) {
      let mensajeError = err.message || "No se pudo generar el contenido. Intenta de nuevo.";
      if (err.name === "TimeoutError" || mensajeError.includes("timeout")) {
        mensajeError = "⏱ La solicitud tardó demasiado. Intenta con un prompt más corto o espera unos segundos.";
      }
      setError(mensajeError);
    } finally {
      setIaCargando(false);
    }
  };

  // ── SUBIDA AL BACKEND ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!titulo.trim() || !descripcion.trim()) { setError("Título y descripción son obligatorios."); return; }
    if (tipoContenido === "video") {
      if (!videoFile) { setError("Debes adjuntar un video para este comunicado."); return; }
      if (!videoFile.type.startsWith("video/")) { setError("El archivo debe ser un video válido."); return; }
    } else {
      if (!pdfFile || pdfFile.type !== "application/pdf") { setError("Debes adjuntar un PDF válido."); return; }
    }

    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("tipo", tipoContenido);
      formData.append("titulo", titulo.trim());
      formData.append("descripcion", descripcion.trim());
      
      if (tipoContenido === "video" && videoFile) formData.append("archivo", videoFile);
      else if (pdfFile) formData.append("archivo", pdfFile);
      
      if (imagenFile) formData.append("imagen", imagenFile);
      
      if (iaResumen) formData.append("iaResumen", iaResumen);
      if (iaEtiquetas.length > 0) formData.append("iaEtiquetas", JSON.stringify(iaEtiquetas));

      const res = await fetch(`${API_URL}/comunicados`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error();

      setOkMsg("Comunicado subido correctamente.");
      await cargarLista();
      cerrarForm();
    } catch {
      setError("No se pudo subir el comunicado. Revisa backend y permisos de superadmin.");
    } finally {
      setGuardando(false);
    }
  };

  const handleDesactivar = async (id: string) => {
    if (!confirm("¿Desactivar este comunicado? Dejará de ser visible para los usuarios.")) return;
    try {
      await desactivarComunicado(id);
      await cargarLista();
    } catch (e) {
      console.error(e);
    }
  }

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDraggingFile(true); };
  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDraggingFile(false); };
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    setError("");
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    if (tipoContenido === "video") {
      if (!file.type.startsWith("video/")) { setError("Debes soltar un archivo de video válido."); return; }
      setVideoFile(file); setPdfFile(null); return;
    }
    if (file.type !== "application/pdf") { setError("Debes soltar un archivo PDF válido."); return; }
    setPdfFile(file); setVideoFile(null);
  };

  const handleDragOverImagen = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDraggingImagen(true); };
  const handleDragLeaveImagen = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDraggingImagen(false); };
  const handleDropImagen = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingImagen(false);
    setError("");
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Debes soltar una imagen válida."); return; }
    setImagenFile(file);
  };

  const ahora = Date.now();
  const listaFiltrada = comunicados.filter((c) => {
    if (filtroEstado === "activos")   return c.activo && (!c.fechaExpiracion || new Date(c.fechaExpiracion).getTime() > ahora);
    if (filtroEstado === "expirados") return !c.activo || (!!c.fechaExpiracion && new Date(c.fechaExpiracion).getTime() <= ahora);
    return true;
  });

  return (
    <div className="w-full">
      <div className="px-6 md:px-8 lg:px-10 w-full pt-10 pb-16 relative">
        
        {/* Cabecera con acciones */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--texto-primario)" }}>Comunicados Generales</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
              Gestiona tutoriales, cursos y videos visibles en toda la plataforma.
            </p>
          </div>
          <button
            onClick={abrirCrear}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all hover:opacity-90"
            style={{ background: GRAD_BTN, color: "#fff" }}
          >
            + Nuevo comunicado
          </button>
        </div>

        {/* ── FORMULARIO EMERGENTE (MODAL) ── */}
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            {/* Contenedor del Modal */}
            <div className="bg-white rounded-3xl w-full max-w-[1200px] shadow-2xl relative my-auto animate-fadeIn flex flex-col max-h-[95vh]">
              
              {/* Header Pegajoso (Sticky) */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-6 py-5 md:px-8 border-b border-slate-100 flex justify-between items-center rounded-t-3xl">
                <div>
                  <h2 className="text-2xl font-bold text-blue-950">Subir nuevo recurso</h2>
                  <p className="text-slate-500 text-sm mt-1">Genera contenido con Inteligencia Artificial o súbelo manualmente.</p>
                </div>
                <button 
                  onClick={cerrarForm} 
                  className="w-10 h-10 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-full flex items-center justify-center text-2xl transition-colors"
                  title="Cerrar"
                >
                  ×
                </button>
              </div>

              {/* Cuerpo del formulario (Scrollable) */}
              <div className="p-6 md:p-8 overflow-y-auto">
                <form className="grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {TIPOS_CONTENIDO.map((tipo) => {
                      const active = tipoContenido === tipo.key;
                      const Icono = tipo.Icon;
                      return (
                        <button
                          key={tipo.key}
                          type="button"
                          onClick={() => { setTipoContenido(tipo.key); if (tipo.key === "video") setPdfFile(null); }}
                          className="text-left rounded-2xl p-4 transition-all flex flex-col"
                          style={{
                            border: `1px solid ${active ? "#2563eb" : "#e2e8f0"}`,
                            background: active ? "#eff6ff" : "#f8fafc",
                          }}
                        >
                          <Icono className={`text-2xl mb-2 ${active ? "text-blue-600" : "text-slate-500"}`} />
                          <p className="text-sm font-semibold mt-1 text-slate-800">{tipo.label}</p>
                          <p className="text-xs mt-1 text-slate-500">{tipo.hint}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── SECCIÓN IMAGEN ── */}
                  <div className="rounded-2xl p-4 border border-slate-200 bg-slate-50">
                    <p className="text-xs font-semibold mb-2 text-slate-600">Imagen destacada <span className="text-slate-400">(Opcional)</span></p>
                    <label
                      onDragOver={handleDragOverImagen}
                      onDragLeave={handleDragLeaveImagen}
                      onDrop={handleDropImagen}
                      className="block rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-all bg-white"
                      style={{ borderColor: isDraggingImagen ? "#2563eb" : imagenFile ? "#10b981" : "#cbd5e1" }}
                    >
                      <div className="flex justify-center mb-2">
                        {imagenFile ? (
                          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-emerald-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        ) : (
                          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-2 text-center text-slate-800">
                        {imagenFile ? "¡Imagen lista!" : "Arrastra o selecciona una imagen"}
                      </p>
                      <p className="text-xs mt-1 text-center break-all text-slate-500">{imagenFile?.name || "PNG, JPG, WebP"}</p>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (file && file.type.startsWith("image/")) { setImagenFile(file); }
                      }} />
                    </label>
                    {imagenPreviewUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                        <img src={imagenPreviewUrl} alt="preview" className="w-full h-auto max-h-48 object-cover" />
                        <button type="button" onClick={() => { setImagenFile(null); setImagenPreviewUrl(""); }} className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600">×</button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-3 rounded-2xl p-5 border border-slate-200 bg-slate-50 flex flex-col">
                      <div className="grid grid-cols-1 sm:flex sm:flex-row bg-slate-200/50 p-1 rounded-xl w-full md:w-max mb-5 gap-1">
                        <button
                          type="button"
                          onClick={() => setModoIngreso("manual")}
                          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            modoIngreso === "manual" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <BsPencilSquare className="text-base" /> Escribir manual
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoIngreso("ia")}
                          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            modoIngreso === "ia" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <BsLightbulb className="text-base" /> Asistente IA
                        </button>
                      </div>

                      {modoIngreso === "ia" ? (
                        <div className="flex-1 flex flex-col justify-center animate-fadeIn">
                          <label className="block text-sm font-semibold mb-3 text-slate-700">¿De qué trata este {tipoContenido}?</label>
                          <textarea
                            rows={4}
                            value={promptIA}
                            onChange={(e) => setPromptIA(e.target.value)}
                            placeholder={tipoContenido === "video" ? "Ej: Un video mostrando las instalaciones..." : "Ej: Haz un tutorial explicando cómo registrarse..."}
                            className="w-full rounded-xl px-4 py-3 text-sm resize-none border border-indigo-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                          />
                          {tipoContenido !== "video" && (
                            <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center gap-1.5">
                              <BsLightbulb /> La IA también generará automáticamente un PDF estructurado.
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={handleGenerarIACompleta}
                            disabled={iaCargando}
                            className="mt-5 w-full bg-indigo-600 text-white font-bold rounded-xl py-3.5 hover:bg-indigo-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm shadow-indigo-200"
                          >
                            {iaCargando ? <span className="animate-pulse">Creando contenido...</span> : <><BsLightbulb className="text-lg" /> Generar Contenido</>}
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col animate-fadeIn">
                          <label className="block text-xs font-semibold mb-2 text-slate-600">Título <span className="text-red-500">*</span></label>
                          <input
                            type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ej: Tutorial de acceso"
                            className="w-full rounded-xl px-4 py-3 text-sm border border-slate-200 bg-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <label className="block text-xs font-semibold mb-2 text-slate-600">Descripción <span className="text-red-500">*</span></label>
                          <textarea
                            rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Cuenta de forma clara de qué trata..."
                            className="w-full flex-1 rounded-xl px-4 py-3 text-sm resize-none border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-2 rounded-2xl p-4 border border-slate-200 bg-slate-50">
                      <p className="text-xs font-semibold mb-2 text-slate-600">
                        {tipoContenido === "video" ? "Archivo de video" : "Archivo PDF"} <span className="text-red-500">*</span>
                      </p>
                      <label
                        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        className="block rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-all bg-white"
                        style={{ borderColor: isDraggingFile ? "#2563eb" : pdfFile ? "#10b981" : "#cbd5e1" }}
                      >
                        <div className="flex justify-center mb-2">
                          {tipoContenido === "video" ? <BsFilm className="text-4xl text-slate-400" /> : <BsFileEarmarkPdf className={`text-4xl ${pdfFile ? "text-emerald-500" : "text-slate-400"}`} />}
                        </div>
                        <p className="text-sm font-semibold mt-2 text-center text-slate-800">
                          {pdfFile ? "¡PDF listo!" : "Arrastra o selecciona un archivo"}
                        </p>
                        <p className="text-xs mt-1 text-center break-all text-slate-500">{nombreArchivo}</p>
                        <input type="file" accept={tipoContenido === "video" ? "video/*" : "application/pdf"} className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (tipoContenido === "video") { setVideoFile(file); setPdfFile(null); }
                          else { setPdfFile(file); setVideoFile(null); setPdfGeneradoBlob(null); }
                        }} />
                      </label>

                      {/* Vistas previas */}
                      {tipoContenido === "video" && videoPreviewUrl && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-black relative">
                          <video controls className="w-full h-auto max-h-64" src={videoPreviewUrl} />
                          <button type="button" onClick={() => { setVideoFile(null); setVideoPreviewUrl(""); }} className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white">×</button>
                        </div>
                      )}
                      {tipoContenido !== "video" && pdfPreviewUrl && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                          <iframe src={pdfPreviewUrl} className="w-full h-72" />
                          <button type="button" onClick={() => { setPdfFile(null); setPdfPreviewUrl(""); setPdfGeneradoBlob(null); }} className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white">×</button>
                        </div>
                      )}
                      
                      {/* Botón Descargar PDF de la IA */}
                      {pdfGeneradoBlob && tipoContenido !== "video" && (
                        <button type="button" onClick={() => {
                            const url = URL.createObjectURL(pdfGeneradoBlob);
                            const link = document.createElement("a"); link.href = url; link.download = `${titulo || "documento"}.pdf`; link.click();
                          }}
                          className="mt-3 w-full bg-emerald-600 text-white font-semibold rounded-xl py-2.5 text-sm flex justify-center items-center gap-2 hover:bg-emerald-700 transition-colors"
                        ><BsFileEarmarkPdf /> Descargar PDF generado</button>
                      )}
                    </div>
                  </div>

                  {error && <div className="text-sm p-3 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}
                  {okMsg && <div className="text-sm p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">{okMsg}</div>}

                  <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={cerrarForm} className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
                    <button type="button" onClick={limpiarFormulario} className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">Limpiar</button>
                    <button type="submit" disabled={guardando} className="text-sm font-semibold px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">{guardando ? "Subiendo..." : "Subir comunicado"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTADO / TARJETAS ── */}
        <div className="flex gap-2 mb-6">
          {(["activos", "expirados", "todos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className="px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all"
              style={{
                background: filtroEstado === f ? GRAD_BTN : "var(--gris-superficie)",
                color:      filtroEstado === f ? "#fff"   : "var(--texto-secundario)",
                border:     `1.5px solid ${filtroEstado === f ? "transparent" : "var(--gris-borde)"}`,
                boxShadow:  filtroEstado === f ? "0 2px 8px rgba(37,99,235,0.22)" : "none",
              }}
            >
              {f === "activos" ? "Activos" : f === "expirados" ? "Expirados / Inactivos" : "Todos"}
            </button>
          ))}
        </div>

        {loadingList ? (
          <Spinner />
        ) : listaFiltrada.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl text-center border border-slate-200 bg-white">
            <p className="text-base font-medium mb-1 text-slate-800">No hay comunicados en este filtro</p>
            <p className="text-sm text-slate-500">
              {filtroEstado === "activos" ? "Sube el primer comunicado para que aparezca aquí." : "Prueba con otro estado."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {listaFiltrada.map((c) => {
              const expirado = c.fechaExpiracion && new Date(c.fechaExpiracion).getTime() <= ahora;
              const tipoLabel = c.categoria || "General";
              const col = TIPO_COLORS[tipoLabel.toLowerCase()] || TIPO_COLORS.General;
              
              return (
                <div
                  key={c.comunicadoId}
                  className="rounded-xl overflow-hidden flex flex-col shadow-sm transition-shadow hover:shadow-md"
                  style={{
                    background:  "var(--blanco)",
                    border:      "1px solid var(--gris-borde)",
                    borderLeft:  `3px solid ${!c.activo || expirado ? "var(--gris-borde)" : "var(--azul-egm)"}`,
                    opacity:     !c.activo || expirado ? 0.65 : 1,
                  }}
                >
                  {c.imagenUrl && (
                    <div style={{ height: "140px", overflow: "hidden" }}>
                      <img src={c.imagenUrl} alt={c.titulo} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                        {tipoLabel}
                      </span>
                      {(!c.activo || expirado) && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          {!c.activo ? "Inactivo" : "Expirado"}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold mb-2 text-slate-800">{c.titulo}</h3>
                    <p className="text-sm line-clamp-3 text-slate-500 mb-4 flex-1">
                      {c.mensaje}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-medium">
                        {formatDate(c.fechaPublicacion)}
                      </span>
                      {c.activo && !expirado && (
                        <button
                          onClick={() => handleDesactivar(c.comunicadoId)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
    </div>
  );
}