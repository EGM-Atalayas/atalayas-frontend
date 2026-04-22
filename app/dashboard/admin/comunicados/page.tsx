"use client";

import { FormEvent, useMemo, useState } from "react";
import DashboardHero from "@/components/ui/DashboardHero";
import { API_URL } from "@/lib/api";

const TIPOS_CONTENIDO = [
  { key: "tutorial", label: "Tutorial", hint: "Guias paso a paso", emoji: "📘" },
  { key: "curso", label: "Curso", hint: "Formacion estructurada", emoji: "🎓" },
  { key: "video", label: "Video", hint: "Contenido audiovisual", emoji: "🎥" },
] as const;

export default function ComunicadosAdminPage() {
  const [tipoContenido, setTipoContenido] = useState<"tutorial" | "curso" | "video">("tutorial");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [iaCargando, setIaCargando] = useState(false);
  const [iaResumen, setIaResumen] = useState("");
  const [iaEtiquetas, setIaEtiquetas] = useState<string[]>([]);

  const nombreArchivo = useMemo(() => pdfFile?.name ?? "Ningun PDF seleccionado", [pdfFile]);

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
          context: { rol: "Admin empresa" },
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
    if (!pdfFile) {
      setError("Debes adjuntar un PDF para este comunicado.");
      return;
    }
    if (pdfFile.type !== "application/pdf") {
      setError("El archivo debe ser un PDF valido.");
      return;
    }

    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("tipo", tipoContenido);
      formData.append("titulo", titulo.trim());
      formData.append("descripcion", descripcion.trim());
      formData.append("archivo", pdfFile);
      if (iaResumen) formData.append("iaResumen", iaResumen);
      if (iaEtiquetas.length > 0) formData.append("iaEtiquetas", JSON.stringify(iaEtiquetas));

      const res = await fetch(`${API_URL}/comunicados`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error();

      setOkMsg("Comunicado subido correctamente.");
      setTitulo("");
      setDescripcion("");
      setPdfFile(null);
      setIaResumen("");
      setIaEtiquetas([]);
    } catch {
      setError("No se pudo subir el comunicado. Revisa si el endpoint de backend esta disponible.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <DashboardHero
        prefijo="Panel de "
        titulo="Comunicados."
        imagenFondo="/background-formacion-empleado.jpg"
      />

      <div className="px-10 lg:px-16 pt-10 pb-16">
        <div
          className="rounded-3xl p-6 md:p-8 mb-6 shadow-sm"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
        >
          <h1
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)",
              fontWeight: 400,
              color: "var(--texto-primario)",
              letterSpacing: "-0.02em",
            }}
          >
            Sube tus comunicados
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--texto-muted)" }}>
            Publica tutoriales, cursos o videos de Atalayas y adjunta un PDF para automatizaciones futuras con IA.
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
                      border: `1px solid ${active ? "var(--azul-egm)" : "var(--gris-borde)"}`,
                      background: active ? "var(--azul-egm-light)" : "var(--gris-pagina)",
                    }}
                  >
                    <p className="text-lg">{tipo.emoji}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: "var(--texto-primario)" }}>{tipo.label}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>{tipo.hint}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 rounded-2xl p-4" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--texto-secundario)" }}>
                  Titulo <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Nuevo curso de PRL para empresas adheridas"
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                />

                <label className="block text-xs font-semibold mt-4 mb-2" style={{ color: "var(--texto-secundario)" }}>
                  Descripcion <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <textarea
                  rows={6}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Cuenta de forma clara de que trata este tutorial, curso o video..."
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                />
              </div>

            <div className="lg:col-span-2 rounded-2xl p-4" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--texto-secundario)" }}>
                  Archivo PDF <span style={{ color: "var(--error)" }}>*</span>
                </p>
                <label className="block rounded-2xl border-2 border-dashed p-5 cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ borderColor: "var(--gris-borde)", background: "var(--blanco)" }}>
                  <p className="text-2xl">📄</p>
                  <p className="text-sm font-semibold mt-2" style={{ color: "var(--texto-primario)" }}>
                    Arrastra o selecciona un PDF
                  </p>
                  <p className="text-xs mt-1 break-all" style={{ color: "var(--texto-muted)" }}>{nombreArchivo}</p>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Asistente IA</p>
                  <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>
                    Crea resumen + etiquetas automaticamente para publicar en menos tiempo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSugerirIA}
                  disabled={iaCargando}
                  className="text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60"
                  style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                >
                  {iaCargando ? "Generando..." : "Generar propuesta IA"}
                </button>
              </div>

              {(iaResumen || iaEtiquetas.length > 0) && (
                <div className="mt-4 space-y-2">
                  {iaResumen && (
                    <p className="text-sm" style={{ color: "var(--texto-secundario)" }}>
                      <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>Resumen:</span> {iaResumen}
                    </p>
                  )}
                  {iaEtiquetas.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {iaEtiquetas.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error)" }}>
                {error}
              </div>
            )}
            {okMsg && (
              <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "var(--exito-light)", color: "var(--exito)", border: "1px solid var(--exito)" }}>
                {okMsg}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTipoContenido("tutorial");
                  setTitulo("");
                  setDescripcion("");
                  setPdfFile(null);
                  setIaResumen("");
                  setIaEtiquetas([]);
                  setError("");
                  setOkMsg("");
                }}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl"
                style={{ background: "var(--gris-pagina)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}
              >
                Limpiar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
              >
                {guardando ? "Subiendo..." : "Subir comunicado"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
