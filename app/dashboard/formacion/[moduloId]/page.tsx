"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL, apiFetch } from "@/lib/api";
import type { Modulo } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";

// ── ICONO FILE ────────────────────────────────────────────────────────────────
function IconFile({ ext }: { ext?: string }) {
  const color =
    ext === "pdf" ? "#dc2626" :
    ext === "docx" || ext === "doc" ? "#2563eb" :
    ext === "ppt" || ext === "pptx" ? "#ea580c" :
    ext === "mp4" || ext === "mov" ? "#7c3aed" :
    ext === "mp3" || ext === "wav" ? "#d97706" :
    "var(--texto-muted)";

  return (
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
      style={{ background: `${color}18`, border: `1.5px solid ${color}33` }}>
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        {(ext === "mp4" || ext === "mov") && <polygon points="10 9 16 12 10 15 10 9" fill={color} stroke="none" />}
        {(ext === "mp3" || ext === "wav") && <path d="M9 18V5l12-2v13" strokeLinecap="round" />}
      </svg>
    </div>
  );
}

function formatBytes(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function ModuloDetallePage() {
  const { moduloId } = useParams<{ moduloId: string }>();
  const router = useRouter();

  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const res = await apiFetch(`${API_URL}/modulos/${moduloId}`);
        if (!res.ok) throw new Error("Módulo no encontrado");
        const data = await res.json();
        setModulo(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar el módulo");
      } finally {
        setCargando(false);
      }
    }
    if (moduloId) cargar();
  }, [moduloId]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
      </div>
    );
  }

  if (error || !modulo) {
    return (
      <div className="px-8 lg:px-16 py-16 flex flex-col items-center gap-4 text-center">
        <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
          {error || "Módulo no encontrado"}
        </p>
        <Link href="/dashboard/formacion" className="text-sm font-semibold hover:underline" style={{ color: "var(--azul-egm)" }}>
          ← Volver a formaciones
        </Link>
      </div>
    );
  }

  const tipoLabel = MODULO_TIPO_LABEL[modulo.tipoModulo] ?? modulo.tipoModulo;
  const adjExt = modulo.adjuntoNombre?.split(".").pop()?.toLowerCase();

  return (
    <div className="w-full min-h-screen" style={{ background: "var(--gris-pagina)" }}>

      {/* ── HEADER ── */}
      {modulo.imagenPortadaUrl && (
        <div className="relative overflow-hidden" style={{ height: "260px" }}>
          <img src={modulo.imagenPortadaUrl} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center 40%" }} />
          <div className="absolute inset-0" style={{ background: "rgba(10,20,40,0.55)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(10,20,40,0.85) 100%)" }} />
        </div>
      )}

      {/* ── BREADCRUMBS + TÍTULO ── */}
      <div style={{ background: "var(--blanco)", borderBottom: "1px solid var(--gris-borde)" }}>
        <div className="px-8 lg:px-12 py-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "var(--texto-muted)" }}>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/formacion" className="hover:underline">Formación</Link>
            <span>/</span>
            <span style={{ color: "var(--texto-primario)", fontWeight: 600 }} className="truncate max-w-[200px]">
              {modulo.nombre}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold leading-snug" style={{ color: "var(--texto-primario)" }}>
              {modulo.nombre}
            </h1>
            <button onClick={() => router.back()}
              className="shrink-0 text-sm font-semibold hover:underline"
              style={{ color: "var(--azul-egm)" }}>
              ← Volver
            </button>
          </div>
        </div>
      </div>

      {/* ── CUERPO ── */}
      <div className="px-8 lg:px-12 py-8 max-w-4xl mx-auto flex flex-col gap-6">

        {/* Información general */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
              {tipoLabel}
            </span>
            {modulo.idioma && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>
                {modulo.idioma === "es" ? "🇪🇸 Español" : modulo.idioma === "en" ? "🇬🇧 Inglés" : modulo.idioma}
              </span>
            )}
            {modulo.duracion && (
              <span className="text-xs font-medium" style={{ color: "var(--texto-muted)" }}>
                {modulo.duracion === "corto" ? "−15 min" : modulo.duracion === "medio" ? "15–45 min" : "+45 min"}
              </span>
            )}
          </div>
          {modulo.descripcion && (
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--texto-secundario)" }}>
                {modulo.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* ── ARCHIVO ADJUNTO ── */}
        {modulo.adjuntoUrl && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--texto-muted)" }}>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
                Material del módulo
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                <IconFile ext={adjExt} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
                    {modulo.adjuntoNombre ?? "Archivo adjunto"}
                  </p>
                  <p className="text-xs mt-0.5 uppercase" style={{ color: "var(--texto-muted)" }}>
                    {adjExt ?? "archivo"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Vista previa en nueva pestaña */}
                  <a href={modulo.adjuntoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--azul-egm-light)"; e.currentTarget.style.color = "var(--azul-egm)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver
                  </a>
                  {/* Descarga */}
                  <a href={modulo.adjuntoUrl} download={modulo.adjuntoNombre ?? true}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: "var(--azul-egm)", color: "#fff", boxShadow: "0 2px 8px rgba(27,63,126,0.2)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Markdown */}
        {modulo.contenidoMarkdown && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>Contenido del módulo</p>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--texto-secundario)" }}>
                {modulo.contenidoMarkdown}
              </p>
            </div>
          </div>
        )}

        {/* Sin contenido */}
        {!modulo.adjuntoUrl && !modulo.contenidoMarkdown && !modulo.podcastAudioUrl && (
          <div className="rounded-2xl flex flex-col items-center justify-center gap-3 py-16 text-center"
            style={{ background: "var(--blanco)", border: "1.5px dashed var(--gris-borde)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>Este módulo aún no tiene contenido</p>
            <p className="text-xs" style={{ color: "var(--texto-muted)" }}>El administrador añadirá el material próximamente.</p>
          </div>
        )}

      </div>
    </div>
  );
}
