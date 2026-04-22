"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";

const TIPOS_CONTENIDO = [
  { key: "tutorial", label: "Tutorial", hint: "Guias paso a paso", emoji: "📘" },
  { key: "curso", label: "Curso", hint: "Formacion estructurada", emoji: "🎓" },
  { key: "video", label: "Video", hint: "Contenido audiovisual", emoji: "🎥" },
] as const;

export default function SuperadminComunicadosPage() {
  const [tipoContenido, setTipoContenido] = useState<"tutorial" | "curso" | "video">("tutorial");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [iaCargando, setIaCargando] = useState(false);
  const [iaResumen, setIaResumen] = useState("");
  const [iaEtiquetas, setIaEtiquetas] = useState<string[]>([]);

  const nombreArchivo = useMemo(() => {
    if (tipoContenido === "video") return videoFile?.name ?? "Ningun video seleccionado";
    return pdfFile?.name ?? "Ningun PDF seleccionado";
  }, [pdfFile, videoFile, tipoContenido]);

  useEffect(() => {
    if (tipoContenido !== "video" || !videoFile) {
      setVideoPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [tipoContenido, videoFile]);

  const handleSugerirIA = async () => {
    if (!titulo.trim() && !descripcion.trim()) {
      setError("Introduce al menos un titulo o descripcion para usar la IA.");
      return;
    }

    setIaCargando(true);
    setError("");
    setOkMsg("");

    try {
      const prompt = `Genera una salida JSON valida con esta estructura exacta:
{"resumen":"texto corto","etiquetas":["tag1","tag2","tag3"]}
Contexto del comunicado:
Tipo: ${tipoContenido}
Titulo: ${titulo || "Sin titulo"}
Descripcion: ${descripcion || "Sin descripcion"}
Maximo 20 palabras en resumen y 3 etiquetas en espanol.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          context: { rol: "Superadmin" },
        }),
      });

      if (!res.ok) throw new Error("No se pudo generar sugerencia IA");
      const data = await res.json();
      const raw = data?.message ?? "";

      const jsonCandidate = String(raw).match(/\{[\s\S]*\}/)?.[0] ?? "{}";
      const parsed = JSON.parse(jsonCandidate);
      setIaResumen(parsed?.resumen ?? "");
      setIaEtiquetas(Array.isArray(parsed?.etiquetas) ? parsed.etiquetas.slice(0, 3) : []);
    } catch {
      setError("No se pudo generar la sugerencia IA en este momento.");
    } finally {
      setIaCargando(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!titulo.trim() || !descripcion.trim()) {
      setError("Titulo y descripcion son obligatorios.");
      return;
    }
    if (tipoContenido === "video") {
      if (!videoFile) {
        setError("Debes adjuntar un video para este comunicado.");
        return;
      }
      if (!videoFile.type.startsWith("video/")) {
        setError("El archivo debe ser un video valido.");
        return;
      }
    } else {
      if (!pdfFile || pdfFile.type !== "application/pdf") {
        setError("Debes adjuntar un PDF valido.");
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
      setTitulo("");
      setDescripcion("");
      setPdfFile(null);
      setVideoFile(null);
      setVideoPreviewUrl("");
      setIaResumen("");
      setIaEtiquetas([]);
    } catch {
      setError("No se pudo subir el comunicado. Revisa backend y permisos de superadmin.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="px-6 md:px-10 w-full max-w-[1400px] mx-auto animate-fadeIn mt-6">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-blue-950">Sube tus comunicados</h1>
        <p className="text-slate-500 text-sm mt-1">
          Publica tutoriales, cursos o videos de Atalayas adjuntando titulo, descripcion y PDF.
        </p>

        <form className="mt-7 grid grid-cols-1 gap-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TIPOS_CONTENIDO.map((tipo) => {
              const active = tipoContenido === tipo.key;
              return (
                <button
                  key={tipo.key}
                  type="button"
                  onClick={() => setTipoContenido(tipo.key)}
                  className="text-left rounded-2xl p-4 transition-all"
                  style={{
                    border: `1px solid ${active ? "#2563eb" : "#e2e8f0"}`,
                    background: active ? "#eff6ff" : "#f8fafc",
                  }}
                >
                  <p className="text-lg">{tipo.emoji}</p>
                  <p className="text-sm font-semibold mt-1 text-slate-800">{tipo.label}</p>
                  <p className="text-xs mt-1 text-slate-500">{tipo.hint}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 rounded-2xl p-4 border border-slate-200 bg-slate-50">
              <label className="block text-xs font-semibold mb-2 text-slate-600">
                Titulo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Tutorial de acceso a la plataforma"
                className="w-full rounded-xl px-4 py-3 text-sm border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="block text-xs font-semibold mt-4 mb-2 text-slate-600">
                Descripcion <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Cuenta de forma clara de que trata este tutorial, curso o video..."
                className="w-full rounded-xl px-4 py-3 text-sm resize-none border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="lg:col-span-2 rounded-2xl p-4 border border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold mb-2 text-slate-600">
                {tipoContenido === "video" ? "Archivo de video" : "Archivo PDF"} <span className="text-red-500">*</span>
              </p>
              <label className="block rounded-2xl border-2 border-dashed p-5 cursor-pointer hover:opacity-90 transition-opacity border-slate-300 bg-white">
                <p className="text-2xl">{tipoContenido === "video" ? "🎬" : "📄"}</p>
                <p className="text-sm font-semibold mt-2 text-slate-800">
                  {tipoContenido === "video" ? "Arrastra o selecciona un video" : "Arrastra o selecciona un PDF"}
                </p>
                <p className="text-xs mt-1 break-all text-slate-500">{nombreArchivo}</p>
                <input
                  type="file"
                  accept={tipoContenido === "video" ? "video/*" : "application/pdf"}
                  className="hidden"
                  onChange={(e) => {
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
                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-black">
                  <video controls className="w-full h-auto max-h-64" src={videoPreviewUrl}>
                    Tu navegador no soporta vista previa de video.
                  </video>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-4 border border-slate-200 bg-slate-50">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Asistente IA</p>
                <p className="text-xs mt-1 text-slate-500">Crea resumen + etiquetas automaticamente para publicar en menos tiempo.</p>
              </div>
              <button
                type="button"
                onClick={handleSugerirIA}
                disabled={iaCargando}
                className="text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {iaCargando ? "Generando..." : "Generar propuesta IA"}
              </button>
            </div>

            {(iaResumen || iaEtiquetas.length > 0) && (
              <div className="mt-4 space-y-2">
                {iaResumen && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Resumen:</span> {iaResumen}
                  </p>
                )}
                {iaEtiquetas.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {iaEtiquetas.map((tag) => (
                      <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600">{error}</div>
          )}
          {okMsg && (
            <div className="text-sm px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600">{okMsg}</div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setTipoContenido("tutorial");
                setTitulo("");
                setDescripcion("");
                setPdfFile(null);
                setVideoFile(null);
                setVideoPreviewUrl("");
                setIaResumen("");
                setIaEtiquetas([]);
                setError("");
                setOkMsg("");
              }}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {guardando ? "Subiendo..." : "Subir comunicado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
