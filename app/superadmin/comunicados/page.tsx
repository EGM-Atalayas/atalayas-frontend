"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
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

const TIPOS_CONTENIDO = [
  { key: "tutorial", label: "Tutorial", hint: "Guías paso a paso", Icon: BsBook },
  { key: "curso", label: "Curso", hint: "Formación estructurada", Icon: BsMortarboard },
  { key: "video", label: "Video", hint: "Contenido audiovisual", Icon: BsCameraVideo },
] as const;

export default function SuperadminComunicadosPage() {
  const [tipoContenido, setTipoContenido] = useState<"tutorial" | "curso" | "video">("tutorial");
  
  const [modoIngreso, setModoIngreso] = useState<"manual" | "ia">("manual");
  const [promptIA, setPromptIA] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [iaCargando, setIaCargando] = useState(false);
  const [iaResumen, setIaResumen] = useState("");
  const [iaEtiquetas, setIaEtiquetas] = useState<string[]>([]);

  const nombreArchivo = useMemo(() => {
    if (tipoContenido === "video") return videoFile?.name ?? "Ningún video seleccionado";
    return pdfFile?.name ?? "Ningún PDF seleccionado";
  }, [pdfFile, videoFile, tipoContenido]);

  useEffect(() => {
    if (tipoContenido === "video") {
      setPdfPreviewUrl("");
      return;
    }
    if (!pdfFile) {
      setPdfPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(pdfFile);
    setPdfPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [tipoContenido, pdfFile]);

  useEffect(() => {
    if (tipoContenido !== "video" || !videoFile) {
      setVideoPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [tipoContenido, videoFile]);

  // --- FUNCIÓN IA MÁGICA (TEXTO + PDF) ---
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

      console.log("Enviando petición a la IA...", { prompt });

      const res = await fetch("/api/chat/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      console.log("Respuesta del servidor - Status:", res.status, "OK:", res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("📌 Status del servidor:", res.status);
        console.error("📌 Respuesta de error del servidor:", errorText);
        let errorMsg = "No se pudo generar el contenido";
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        console.error("Mensaje de error procesado:", errorMsg);
        throw new Error(errorMsg);
      }

      const parsed = await res.json();
      console.log("Respuesta parseada exitosamente");
      console.log("Campos recibidos:", {
        titulo: parsed?.titulo,
        descripcion: parsed?.descripcion,
        resumen: parsed?.resumen,
        etiquetas: parsed?.etiquetas,
        tieneOtrosCampos: Object.keys(parsed || {})
      });

      // Validar que tenemos título y descripción
      if (!parsed?.titulo?.trim() || !parsed?.descripcion?.trim()) {
        console.error("Validación fallida. Objeto recibido:", parsed);
        throw new Error(`La IA generó campos incompletos. Recibido: ${JSON.stringify(parsed)}`);
      }

      // Establecer los valores generados
      setTitulo(parsed.titulo.trim());
      setDescripcion(parsed.descripcion.trim());
      setIaResumen(typeof parsed?.resumen === "string" ? parsed.resumen : "");
      setIaEtiquetas(Array.isArray(parsed?.etiquetas) ? parsed.etiquetas.slice(0, 3) : []);
      
      // Generar PDF automáticamente si no es video
      if (tipoContenido !== "video") {
        try {
          console.log("Generando PDF automático...");
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
            console.log("PDF generado exitosamente");
          } else {
            console.warn("No se pudo generar el PDF, pero continuar con el contenido de texto");
          }
        } catch (pdfError) {
          console.warn("Error generando PDF automático:", pdfError);
          // Continuar sin error si falla la generación del PDF
        }
      }
      
      setModoIngreso("manual");
      setOkMsg("¡Contenido generado con éxito! Puedes revisar el PDF y editar antes de publicar.");
      setPromptIA("");

    } catch (err: any) {
      console.error("❌ Error en generación de IA:", err);
      console.error("Stack:", err.stack);
      console.error("Detalles completos:", err.message);
      
      let mensajeError = err.message || "No se pudo generar el contenido. Intenta de nuevo.";
      
      // Si es un timeout, mostrar mensaje específico
      if (err.name === "TimeoutError" || mensajeError.includes("timeout")) {
        mensajeError = "⏱ La solicitud tardó demasiado. Intenta con un prompt más corto o espera unos segundos.";
      }
      
      setError(`${mensajeError}`);
    } finally {
      setIaCargando(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!titulo.trim() || !descripcion.trim()) {
      setError("Título y descripción son obligatorios.");
      return;
    }
    if (tipoContenido === "video") {
      if (!videoFile) {
        setError("Debes adjuntar un video para este comunicado.");
        return;
      }
      if (!videoFile.type.startsWith("video/")) {
        setError("El archivo debe ser un video válido.");
        return;
      }
    } else {
      if (!pdfFile || pdfFile.type !== "application/pdf") {
        setError("Debes adjuntar un PDF válido.");
        return;
      }
    }

    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("tipo", tipoContenido);
      formData.append("titulo", titulo.trim());
      formData.append("descripcion", descripcion.trim());
      if (tipoContenido === "video" && videoFile) {
        formData.append("archivo", videoFile);
      } else if (pdfFile) {
        formData.append("archivo", pdfFile);
      }
      if (iaResumen) formData.append("iaResumen", iaResumen);
      if (iaEtiquetas.length > 0) formData.append("iaEtiquetas", JSON.stringify(iaEtiquetas));

      const res = await fetch(`${API_URL}/comunicados`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error();

      setOkMsg("Comunicado subido correctamente.");
      setTipoContenido("tutorial");
      setModoIngreso("manual");
      setPromptIA("");
      setTitulo("");
      setDescripcion("");
      setPdfFile(null);
      setVideoFile(null);
      setPdfPreviewUrl("");
      setVideoPreviewUrl("");
      setIaResumen("");
      setIaEtiquetas([]);
    } catch {
      setError("No se pudo subir el comunicado. Revisa backend y permisos de superadmin.");
    } finally {
      setGuardando(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    setError("");

    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;

    if (tipoContenido === "video") {
      if (!file.type.startsWith("video/")) {
        setError("Debes soltar un archivo de video válido.");
        return;
      }
      setVideoFile(file);
      setPdfFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Debes soltar un archivo PDF válido.");
      return;
    }
    setPdfFile(file);
    setVideoFile(null);
  };

  return (
    <div className="px-6 md:px-10 w-full max-w-[1400px] mx-auto animate-fadeIn mt-6">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-blue-950">Sube tus comunicados</h1>
        <p className="text-slate-500 text-sm mt-1">
          Publica tutoriales, cursos o videos de Atalayas adjuntando título, descripción y archivo.
        </p>

        <form className="mt-7 grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TIPOS_CONTENIDO.map((tipo) => {
              const active = tipoContenido === tipo.key;
              const Icono = tipo.Icon;
              return (
                <button
                  key={tipo.key}
                  type="button"
                  onClick={() => {
                    setTipoContenido(tipo.key);
                    if (tipo.key === "video") setPdfFile(null);
                  }}
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

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            
            <div className="lg:col-span-3 rounded-2xl p-5 border border-slate-200 bg-slate-50 flex flex-col">
              
              {/* Ajuste responsive para los botones de Tabs */}
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
                  <BsLightbulb className="text-base" /> Asistente inteligente
                </button>
              </div>

              {modoIngreso === "ia" ? (
                <div className="flex-1 flex flex-col justify-center animate-fadeIn">
                  <label className="block text-sm font-semibold mb-3 text-slate-700">
                    ¿De qué trata este {tipoContenido}?
                  </label>
                  <textarea
                    rows={4}
                    value={promptIA}
                    onChange={(e) => setPromptIA(e.target.value)}
                    placeholder={tipoContenido === "video" 
                      ? "Ej: Un video mostrando las instalaciones del polígono..." 
                      : "Ej: Haz un tutorial explicando cómo registrarse y genera un documento detallado con los pasos..."}
                    className="w-full rounded-xl px-4 py-3 text-sm resize-none border border-indigo-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-slate-400 shadow-inner"
                  />
                  
                  {tipoContenido !== "video" && (
                    <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center gap-1.5">
                      <BsLightbulb /> La IA también generará automáticamente un PDF estructurado con la información.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerarIACompleta}
                    disabled={iaCargando}
                    className="mt-5 w-full bg-indigo-600 text-white font-bold rounded-xl py-3.5 hover:bg-indigo-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm shadow-indigo-200"
                  >
                    {iaCargando ? (
                      <span className="animate-pulse flex items-center gap-2">
                        <BsLightbulb className="text-lg" /> Creando borrador y documento...
                      </span>
                    ) : (
                      <>
                        <BsLightbulb className="text-lg" /> Generar Contenido Mágico
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col animate-fadeIn">
                  <label className="block text-xs font-semibold mb-2 text-slate-600">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Tutorial de acceso a la plataforma"
                    className="w-full rounded-xl px-4 py-3 text-sm border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  />

                  <label className="block text-xs font-semibold mb-2 text-slate-600">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Cuenta de forma clara de qué trata este tutorial, curso o video..."
                    className="w-full flex-1 rounded-xl px-4 py-3 text-sm resize-none border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {(iaResumen || iaEtiquetas.length > 0) && modoIngreso === "manual" && (
                <div className="mt-5 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-fadeIn">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BsLightbulb /> Datos extra generados por el asistente
                  </p>
                  {iaResumen && (
                    <p className="text-sm text-slate-600 mb-2">
                      <span className="font-semibold text-slate-700">Resumen:</span> {iaResumen}
                    </p>
                  )}
                  {iaEtiquetas.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {iaEtiquetas.map((tag) => (
                        <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 rounded-2xl p-4 border border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold mb-2 text-slate-600">
                {tipoContenido === "video" ? "Archivo de video" : "Archivo PDF"} <span className="text-red-500">*</span>
              </p>
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="block rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-all bg-white"
                style={{
                  borderColor: isDraggingFile ? "#2563eb" : pdfFile ? "#10b981" : "#cbd5e1",
                  background: isDraggingFile ? "#eff6ff" : pdfFile ? "#ecfdf5" : "#ffffff",
                }}
              >
                <div className="flex justify-center mb-2">
                  {tipoContenido === "video" ? (
                    <BsFilm className={`text-4xl ${isDraggingFile ? "text-blue-500" : "text-slate-400"}`} />
                  ) : (
                    <BsFileEarmarkPdf className={`text-4xl ${pdfFile ? "text-emerald-500" : isDraggingFile ? "text-blue-500" : "text-slate-400"}`} />
                  )}
                </div>
                <p className="text-sm font-semibold mt-2 text-center text-slate-800">
                  {isDraggingFile
                    ? "Suelta el archivo aquí"
                    : pdfFile 
                    ? "¡PDF listo!"
                    : tipoContenido === "video"
                    ? "Arrastra o selecciona un video"
                    : "Arrastra o selecciona un PDF"}
                </p>
                <p className="text-xs mt-1 text-center break-all text-slate-500">{nombreArchivo}</p>
                <input
                  type="file"
                  accept={tipoContenido === "video" ? "video/*" : "application/pdf"}
                  className="hidden"
                  onChange={(e) => {
                    setError("");
                    const file = e.target.files?.[0] ?? null;
                    if (tipoContenido === "video") {
                      setVideoFile(file);
                      setPdfFile(null);
                    } else {
                      setPdfFile(file);
                      setVideoFile(null);
                    }
                  }}
                />
              </label>

              {tipoContenido === "video" && videoPreviewUrl && (
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-black relative">
                  <video controls className="w-full h-auto max-h-64" src={videoPreviewUrl}>
                    Tu navegador no soporta vista previa de video.
                  </video>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreviewUrl("");
                    }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/95 text-white hover:bg-red-600 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6m3 0V4a1 1 0 011-1h6a1 1 0 011 1v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              )}
              {tipoContenido !== "video" && pdfPreviewUrl && (
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-white relative">
                  <iframe src={pdfPreviewUrl} className="w-full h-72" title="Previsualización PDF" />
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      setPdfPreviewUrl("");
                    }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/95 text-white hover:bg-red-600 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6m3 0V4a1 1 0 011-1h6a1 1 0 011 1v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 whitespace-pre-wrap">{error}</div>
          )}
          {okMsg && (
            <div className="text-sm px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">{okMsg}</div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setTipoContenido("tutorial");
                setModoIngreso("manual");
                setPromptIA("");
                setTitulo("");
                setDescripcion("");
                setPdfFile(null);
                setVideoFile(null);
                setPdfPreviewUrl("");
                setVideoPreviewUrl("");
                setIaResumen("");
                setIaEtiquetas([]);
                setError("");
                setOkMsg("");
              }}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="text-sm font-semibold px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm"
            >
              {guardando ? "Subiendo..." : "Subir comunicado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}