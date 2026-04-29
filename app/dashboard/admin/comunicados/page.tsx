"use client";

import { useState, useEffect, useRef } from "react";
import DashboardHero from "@/components/ui/DashboardHero";
import {
  getComunicados,
  crearComunicado,
  editarComunicado,
  desactivarComunicado,
} from "@/lib/api/noticias";
import { subirImagenModulo, subirAdjunto } from "@/lib/supabase";
import type { Comunicado, ComunicadoInput, CategoriaComunicado } from "@/lib/types/noticias";

const GRAD_BTN = "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)";

// ── IA helper ─────────────────────────────────────────────────────────────────
async function llamarIA(prompt: string): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }], context: {} }),
  });
  if (!res.ok || !res.body) throw new Error("IA no disponible");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += dec.decode(value);
  }
  return out.trim();
}

// ── CONSTANTES ─────────────────────────────────────────────────────────────────
const CATEGORIAS: CategoriaComunicado[] = ["Novedad", "Aviso", "Evento", "General"];

const CATEGORIA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Novedad: { bg: "#e8f5ee", text: "#1a6b3a", border: "#9dcdb3" },
  Aviso:   { bg: "#fef3c7", text: "#92400e", border: "#fbbf24" },
  Evento:  { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  General: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

const EMPTY_FORM: ComunicadoInput = {
  titulo:           "",
  mensaje:          "",
  imagenUrl:        null,
  categoria:        "General",
  destacado:        false,
  fechaPublicacion: null,
  fechaExpiracion:  null,
  enlaceUrl:        null,
  enlaceTexto:      null,
  videoUrl:         null,
  adjuntoUrl:       null,
  adjuntoNombre:    null,
  estado:           "publicado",
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function toInputDate(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// ── COMPONENTE ─────────────────────────────────────────────────────────────────
export default function ComunicadosAdminPage() {
  const [comunicados, setComunicados]     = useState<Comunicado[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [editando, setEditando]           = useState<Comunicado | null>(null);
  const [form, setForm]                   = useState<ComunicadoInput>(EMPTY_FORM);
  const [submitting, setSubmitting]       = useState(false);
  const [formError, setFormError]         = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado]   = useState<"todos" | "activos" | "expirados">("activos");

  // Image upload
  const [imagenModo, setImagenModo]       = useState<"url" | "upload">("url");
  const [uploadingImg, setUploadingImg]   = useState(false);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  // Adjunto PDF
  const [uploadingAdj, setUploadingAdj]  = useState(false);
  const adjuntoRef                       = useRef<HTMLInputElement>(null);

  // IA
  const [aiLoading, setAiLoading]         = useState<"titulo" | "mensaje" | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await getComunicados();
      data.sort((a, b) => new Date(b.fechaPublicacion ?? "").getTime() - new Date(a.fechaPublicacion ?? "").getTime());
      setComunicados(data);
    } catch {
      setComunicados([]);
    } finally {
      setLoading(false);
    }
  }

  function abrirCrear() {
    setForm({ ...EMPTY_FORM, fechaPublicacion: new Date().toISOString().slice(0, 10) });
    setEditando(null);
    setShowForm(true);
    setFormError(null);
  }

  function abrirEditar(c: Comunicado) {
    setForm({
      titulo:           c.titulo,
      mensaje:          c.mensaje,
      imagenUrl:        c.imagenUrl ?? null,
      categoria:        (c.categoria as CategoriaComunicado) ?? "General",
      destacado:        c.destacado,
      fechaPublicacion: toInputDate(c.fechaPublicacion),
      fechaExpiracion:  toInputDate(c.fechaExpiracion),
      enlaceUrl:        c.enlaceUrl ?? null,
      enlaceTexto:      c.enlaceTexto ?? null,
      videoUrl:         c.videoUrl ?? null,
      adjuntoUrl:       c.adjuntoUrl ?? null,
      adjuntoNombre:    c.adjuntoNombre ?? null,
      estado:           c.estado ?? "publicado",
    });
    setEditando(c);
    setShowForm(true);
    setFormError(null);
    setImagenModo("url");
  }

  function cerrarForm() {
    setShowForm(false);
    setEditando(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setImagenModo("url");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await subirImagenModulo(file);
      setForm((f) => ({ ...f, imagenUrl: url }));
      setImagenModo("url"); // show preview via url tab
    } catch {
      setFormError("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAdjuntoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAdj(true);
    try {
      const { url, nombre } = await subirAdjunto(file);
      setForm((f) => ({ ...f, adjuntoUrl: url, adjuntoNombre: nombre }));
    } catch {
      setFormError("Error al subir el documento. Inténtalo de nuevo.");
    } finally {
      setUploadingAdj(false);
      if (adjuntoRef.current) adjuntoRef.current.value = "";
    }
  }

  function getVideoEmbedUrl(url: string): string | null {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return null;
  }

  async function sugerirConIA(campo: "titulo" | "mensaje") {
    if (campo === "mensaje" && !form.mensaje.trim() && !form.titulo.trim()) {
      setFormError("Escribe algo en el título o mensaje antes de usar la IA.");
      return;
    }
    if (campo === "titulo" && !form.mensaje.trim() && !form.titulo.trim()) {
      setFormError("Escribe el mensaje antes de sugerir un título.");
      return;
    }
    setAiLoading(campo);
    setFormError(null);
    try {
      if (campo === "titulo") {
        const base = form.mensaje.trim() || form.titulo.trim();
        const sugerencia = await llamarIA(
          `Sugiere un título corto (máximo 80 caracteres), claro y atractivo para un comunicado empresarial con el siguiente contenido. Devuelve SOLO el título, sin comillas, sin puntuación final ni explicaciones.\n\nContenido: ${base}`
        );
        setForm((f) => ({ ...f, titulo: sugerencia }));
      } else {
        const sugerencia = await llamarIA(
          `Mejora la redacción de este mensaje de comunicado empresarial. Hazlo más claro, profesional y fácil de leer. Devuelve SOLO el texto mejorado, sin explicaciones ni comentarios adicionales.\n\nTexto original: ${form.mensaje}`
        );
        setForm((f) => ({ ...f, mensaje: sugerencia }));
      }
    } catch {
      setFormError("La IA no está disponible en este momento.");
    } finally {
      setAiLoading(null);
    }
  }

  async function handleSubmit() {
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      setFormError("El título y el mensaje son obligatorios.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: ComunicadoInput = {
        ...form,
        imagenUrl:        form.imagenUrl?.trim() || null,
        fechaPublicacion: form.fechaPublicacion || null,
        fechaExpiracion:  form.fechaExpiracion  || null,
      };
      if (editando) {
        await editarComunicado(editando.comunicadoId, payload);
      } else {
        await crearComunicado(payload);
      }
      await cargar();
      cerrarForm();
    } catch {
      setFormError("Error al guardar. Comprueba la conexión e inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDesactivar(id: string) {
    if (!confirm("¿Desactivar este comunicado? Dejará de ser visible para los usuarios.")) return;
    try {
      await desactivarComunicado(id);
      await cargar();
    } catch {}
  }

  // Filtrado
  const ahora = Date.now();
  const lista = comunicados.filter((c) => {
    if (filtroEstado === "activos")   return c.activo && (!c.fechaExpiracion || new Date(c.fechaExpiracion).getTime() > ahora);
    if (filtroEstado === "expirados") return !c.activo || (!!c.fechaExpiracion && new Date(c.fechaExpiracion).getTime() <= ahora);
    return true;
  });

  return (
    <>
      <DashboardHero prefijo="Panel de " titulo="Comunicados." imagenFondo="/background-comunicacion-empleado.jpg" />

      <div className="px-6 md:px-10 lg:px-16 pt-10 pb-16">

        {/* Cabecera con acciones */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--texto-primario)" }}>Comunicados EGM</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
              Visibles para todos los usuarios de la plataforma
            </p>
          </div>
          <button
            onClick={abrirCrear}
            className="text-sm font-semibold px-4 py-2.5 rounded-lg"
            style={{ background: GRAD_BTN, color: "#fff" }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
          >
            + Nuevo comunicado
          </button>
        </div>

        {/* Filtro estado */}
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

        {/* Formulario */}
        {showForm && (
          <div className="rounded-xl p-6 mb-6" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: "var(--texto-primario)" }}>
                {editando ? "Editar comunicado" : "Nuevo comunicado"}
              </h2>
              <button onClick={cerrarForm} className="text-xl leading-none" style={{ color: "var(--texto-muted)" }}>×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--texto-secundario)" }}>
                    Título <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => sugerirConIA("titulo")}
                    disabled={aiLoading === "titulo"}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all disabled:opacity-60"
                    style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                    onMouseEnter={(e) => !aiLoading && (e.currentTarget.style.background = "#dbeafe")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                  >
                    {aiLoading === "titulo" ? (
                      <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      <i className="bi bi-stars" style={{ fontSize: "14px" }} />
                    )}
                    {aiLoading === "titulo" ? "Generando..." : "Sugerir título"}
                  </button>
                </div>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Apertura del nuevo espacio de coworking"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                />
              </div>

              {/* Mensaje */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--texto-secundario)" }}>
                    Mensaje <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                      {form.mensaje.length} caracteres
                    </span>
                    <button
                      type="button"
                      onClick={() => sugerirConIA("mensaje")}
                      disabled={aiLoading === "mensaje" || !form.mensaje.trim()}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all disabled:opacity-50"
                      style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                      onMouseEnter={(e) => !aiLoading && form.mensaje.trim() && (e.currentTarget.style.background = "#dbeafe")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                    >
                      {aiLoading === "mensaje" ? (
                        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                      <i className="bi bi-stars" style={{ fontSize: "14px" }} />
                      )}
                      {aiLoading === "mensaje" ? "Mejorando..." : "Mejorar con IA"}
                    </button>
                  </div>
                </div>
                <textarea
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  placeholder="Escribe el contenido completo del comunicado..."
                  rows={5}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                />
              </div>

              {/* Imagen */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--texto-secundario)" }}>Imagen (opcional)</label>
                  <div className="flex gap-1 rounded-lg overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                    {(["url", "upload"] as const).map((modo) => (
                      <button key={modo} type="button" onClick={() => setImagenModo(modo)}
                        className="text-xs px-3 py-1 font-medium transition-all"
                        style={{
                          background: imagenModo === modo ? GRAD_BTN : "transparent",
                          color: imagenModo === modo ? "#fff" : "var(--texto-secundario)",
                        }}
                      >
                        {modo === "url" ? "URL" : "Subir archivo"}
                      </button>
                    ))}
                  </div>
                </div>

                {imagenModo === "url" ? (
                  <>
                    <input
                      type="url"
                      value={form.imagenUrl ?? ""}
                      onChange={(e) => setForm({ ...form, imagenUrl: e.target.value || null })}
                      placeholder="https://..."
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                    />
                    {form.imagenUrl && (
                      <div className="relative mt-2">
                        <img src={form.imagenUrl} alt="preview" className="rounded-lg object-cover w-full"
                          style={{ height: "140px", objectFit: "cover" }}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <button
                          type="button" onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
                        >×</button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImg}
                      className="w-full flex flex-col items-center justify-center gap-2 rounded-lg py-6 text-sm transition-colors disabled:opacity-60"
                      style={{ border: "2px dashed var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-muted)" }}
                      onMouseEnter={(e) => !uploadingImg && (e.currentTarget.style.borderColor = "#93c5fd")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
                    >
                      {uploadingImg ? (
                        <>
                          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Subiendo imagen...</span>
                        </>
                      ) : (
                        <>
                          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <span>Haz clic para seleccionar una imagen</span>
                          <span className="text-xs">JPG, PNG, WebP — máx. 5 MB</span>
                        </>
                      )}
                    </button>
                    {form.imagenUrl && (
                      <div className="relative mt-2">
                        <img src={form.imagenUrl} alt="preview" className="rounded-lg w-full object-cover"
                          style={{ height: "140px", objectFit: "cover" }} />
                        <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(22,163,74,0.85)", color: "#fff" }}><i className="bi bi-check-lg" style={{ fontSize: "12px", marginRight: "2px" }} /> Subida correctamente</span>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>×</button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Categoría */}
              <FormField label="Categoría">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIAS.map((cat) => {
                    const activo = form.categoria === cat;
                    const col = CATEGORIA_COLORS[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({ ...form, categoria: cat })}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: activo ? col.bg    : "var(--gris-superficie)",
                          color:      activo ? col.text  : "var(--texto-secundario)",
                          border:     `1.5px solid ${activo ? col.border : "var(--gris-borde)"}`,
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              {/* Destacado */}
              <FormField label="Opciones">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.destacado}
                    onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "var(--azul-egm)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--texto-secundario)" }}>
                    <i className="bi bi-star-fill" style={{ fontSize: "14px", marginRight: "3px" }} /> Marcar como destacado (aparece siempre arriba)
                  </span>
                </label>
              </FormField>

              {/* Fecha publicación */}
              <FormField label="Fecha de publicación">
                <input
                  type="date"
                  value={form.fechaPublicacion ?? ""}
                  onChange={(e) => setForm({ ...form, fechaPublicacion: e.target.value || null })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                />
              </FormField>

              {/* Fecha expiración */}
              <FormField label="Fecha de expiración (opcional)">
                <input
                  type="date"
                  value={form.fechaExpiracion ?? ""}
                  onChange={(e) => setForm({ ...form, fechaExpiracion: e.target.value || null })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>
                  Tras esta fecha el comunicado deja de mostrarse automáticamente.
                </p>
              </FormField>

              {/* Video */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                  Video (YouTube o Vimeo, opcional)
                </label>
                <input type="url" value={form.videoUrl ?? ""}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value || null })}
                  placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                />
                {form.videoUrl && getVideoEmbedUrl(form.videoUrl) && (
                  <div className="mt-2 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe src={getVideoEmbedUrl(form.videoUrl)!} className="w-full h-full" allowFullScreen style={{ border: "none" }} />
                  </div>
                )}
              </div>

              {/* Adjunto PDF */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                  Documento adjunto (PDF, opcional)
                </label>
                <input ref={adjuntoRef} type="file" accept=".pdf,.doc,.docx" onChange={handleAdjuntoUpload} className="hidden" />
                {form.adjuntoUrl ? (
                  <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg"
                    style={{ border: "1px solid #86efac", background: "#f0fdf4" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm flex-1 truncate" style={{ color: "#166534" }}>{form.adjuntoNombre ?? "Documento"}</span>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, adjuntoUrl: null, adjuntoNombre: null }))}
                      className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--error)", background: "var(--error-light)" }}>
                      Quitar
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => adjuntoRef.current?.click()} disabled={uploadingAdj}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
                    style={{ border: "1.5px dashed var(--gris-borde)", background: "var(--gris-superficie)", color: "var(--texto-muted)" }}
                    onMouseEnter={(e) => !uploadingAdj && (e.currentTarget.style.borderColor = "#93c5fd")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}>
                    {uploadingAdj
                      ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Subiendo...</span></>
                      : <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg><span>Adjuntar documento (PDF, Word...)</span></>}
                  </button>
                )}
              </div>

              {/* Enlace externo / CTA */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                  Enlace externo (opcional)
                </label>
                <div className="flex flex-col gap-2">
                  <input type="url" value={form.enlaceUrl ?? ""}
                    onChange={(e) => setForm({ ...form, enlaceUrl: e.target.value || null })}
                    placeholder="https://..."
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                  />
                  {form.enlaceUrl && (
                    <input type="text" value={form.enlaceTexto ?? ""}
                      onChange={(e) => setForm({ ...form, enlaceTexto: e.target.value || null })}
                      placeholder='Texto del botón (ej: "Más información", "Inscríbete")'
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                    />
                  )}
                </div>
              </div>

              {/* Estado borrador */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={form.estado === "borrador"}
                    onChange={(e) => setForm({ ...form, estado: e.target.checked ? "borrador" : "publicado" })}
                    className="w-4 h-4 rounded" style={{ accentColor: "#2563eb" }} />
                  <span className="text-sm" style={{ color: "var(--texto-secundario)" }}>
                    Guardar como borrador (no visible para los usuarios)
                  </span>
                </label>
              </div>

            </div>

            {formError && (
              <p className="text-sm mt-4" style={{ color: "var(--error)" }}>{formError}</p>
            )}

            <div className="flex gap-2 justify-end pt-4 mt-4" style={{ borderTop: "1px solid var(--gris-superficie)" }}>
              <button onClick={cerrarForm} className="text-sm px-4 py-2 rounded-lg" style={{ color: "var(--texto-secundario)" }}>
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
                style={{ background: GRAD_BTN, color: "#fff" }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                {submitting ? "Guardando..." : editando ? "Guardar cambios" : form.estado === "borrador" ? "Guardar borrador" : "Publicar comunicado"}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <Spinner />
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl text-center"
            style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <p className="text-base font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
              {filtroEstado === "activos" ? "No hay comunicados activos" : "No hay comunicados en este filtro"}
            </p>
            <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
              {filtroEstado === "activos" ? "Crea el primer comunicado para que aparezca en la plataforma." : "Prueba con otro filtro."}
            </p>
            {filtroEstado === "activos" && (
              <button onClick={abrirCrear} className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: GRAD_BTN, color: "#fff" }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                Crear primer comunicado
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {lista.map((c) => {
              const expirado = c.fechaExpiracion && new Date(c.fechaExpiracion).getTime() <= ahora;
              const col = CATEGORIA_COLORS[c.categoria ?? "General"] ?? CATEGORIA_COLORS.General;
              return (
                <div
                  key={c.comunicadoId}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background:  "var(--blanco)",
                    border:      "1px solid var(--gris-borde)",
                    borderLeft:  `3px solid ${!c.activo || expirado ? "var(--gris-borde)" : "var(--azul-egm)"}`,
                    opacity:     !c.activo || expirado ? 0.65 : 1,
                  }}
                >
                  {c.imagenUrl && (
                    <div style={{ height: "120px", overflow: "hidden" }}>
                      <img src={c.imagenUrl} alt={c.titulo} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {c.destacado && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fbbf24" }}><i className="bi bi-star-fill" style={{ fontSize: "10px", marginRight: "2px" }} /> Destacado</span>
                          )}
                          {c.categoria && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                              {c.categoria}
                            </span>
                          )}
                          {c.estado === "borrador" && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fef9c3", color: "#854d0e", border: "1px solid #fde047" }}>
                              Borrador
                            </span>
                          )}
                          {(!c.activo || expirado) && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>
                              {!c.activo ? "Inactivo" : "Expirado"}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--texto-primario)" }}>{c.titulo}</h3>
                        <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: "var(--texto-muted)" }}>{c.mensaje}</p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                            Publicado: {formatDate(c.fechaPublicacion)}
                          </span>
                          {c.fechaExpiracion && (
                            <span className="text-xs" style={{ color: expirado ? "var(--error)" : "var(--texto-muted)" }}>
                              Expira: {formatDate(c.fechaExpiracion)}
                            </span>
                          )}
                          {(c.vistas ?? 0) > 0 && (
                            <span className="text-xs flex items-center gap-1" style={{ color: "var(--texto-muted)" }}>
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {c.vistas} {c.vistas === 1 ? "vista" : "vistas"}
                            </span>
                          )}
                          {c.adjuntoUrl && (
                            <span className="text-xs flex items-center gap-1" style={{ color: "var(--texto-muted)" }}>
                              <i className="bi bi-paperclip" style={{ fontSize: "12px" }} /> {c.adjuntoNombre ?? "Adjunto"}
                            </span>
                          )}
                          {c.enlaceUrl && (
                            <span className="text-xs flex items-center gap-1" style={{ color: "var(--texto-muted)" }}>
                              <i className="bi bi-link-45deg" style={{ fontSize: "12px" }} /> Enlace externo
                            </span>
                          )}
                          {c.videoUrl && (
                            <span className="text-xs flex items-center gap-1" style={{ color: "var(--texto-muted)" }}>
                              <i className="bi bi-film" style={{ fontSize: "12px" }} /> Video
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => abrirEditar(c)}
                          className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
                          style={{ color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                        >
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
                          </svg>
                          Editar
                        </button>
                        {c.activo && !expirado && (
                          <button
                            onClick={() => handleDesactivar(c.comunicadoId)}
                            className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
                            style={{ color: "var(--error)", background: "var(--error-light)", border: "1px solid #f5c6bb" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fad4cc")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--error-light)")}
                          >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Desactivar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
        {label} {required && <span style={{ color: "var(--error)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
    </div>
  );
}
