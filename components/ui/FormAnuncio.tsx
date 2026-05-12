"use client";

import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { subirImagenBackend, subirAdjuntoBackend } from "@/lib/api/noticias";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const GRAD_BTN = "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)";
const GRAD_EGM = "linear-gradient(135deg, #1b3f7e 0%, #0d1b2e 100%)";

const EMPTY_FORM: NoticiaInput = {
  titulo: "", contenido: "", esGlobal: false, empresaId: null, imagenUrl: null,
  enlaceUrl: null, enlaceTexto: null, videoUrl: null,
  adjuntoUrl: null, adjuntoNombre: null, estado: "publicado", fijado: false,
  categoria: null,
};

const CATEGORIA_COLORS_LIGHT: Record<string, { bg: string; text: string; border: string }> = {
  Aviso:   { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  Evento:  { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  General: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

const inputStyle: React.CSSProperties = {
  border: "1.5px solid var(--gris-borde)",
  background: "var(--blanco)",
  color: "var(--texto-primario)",
  transition: "border-color 0.15s",
};
function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "#93c5fd";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(147,197,253,0.18)";
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "var(--gris-borde)";
  e.currentTarget.style.boxShadow = "none";
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getVideoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

// ── ICONS ─────────────────────────────────────────────────────────────────────
function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconSparkle({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ── SUBCOMPONENTES ────────────────────────────────────────────────────────────
function FieldLabel({ label, required, right }: { label: string; required?: boolean; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2.5" style={{ minHeight: 32 }}>
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)", letterSpacing: "0.07em" }}>
        {label}
        {required && (
          <span className="relative inline-block ml-1 group" style={{ verticalAlign: "middle" }}>
            <span style={{ color: "var(--error)", fontWeight: 700, cursor: "default" }}>*</span>
            <span className="pointer-events-none absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2
              opacity-0 group-hover:opacity-100 transition-opacity duration-150
              whitespace-nowrap text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-lg"
              style={{ background: "rgba(15,23,42,0.92)", letterSpacing: "0.01em", zIndex: 200 }}>
              Campo obligatorio
              <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent"
                style={{ borderTopColor: "rgba(15,23,42,0.92)" }} />
            </span>
          </span>
        )}
      </label>
      {right}
    </div>
  );
}

function Toggle({ checked, onChange, color = "#2563eb" }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="shrink-0 transition-all"
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: checked ? color : "var(--gris-borde)",
        border: "none", cursor: "pointer", padding: 3,
        transition: "background 0.2s ease",
        position: "relative", display: "flex", alignItems: "center",
      }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
        transform: checked ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.2s ease",
        display: "block",
      }} />
    </button>
  );
}

function AIButton({ loading, disabled, label, loadingLabel, onClick }: {
  loading: boolean; disabled?: boolean; label: string; loadingLabel: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={loading || disabled}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
      style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", color: "#1d4ed8", border: "1px solid #bfdbfe", boxShadow: "0 1px 6px rgba(37,99,235,0.15)" }}
      onMouseEnter={(e) => { if (!loading && !disabled) { e.currentTarget.style.background = "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(37,99,235,0.25)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
      onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(37,99,235,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : <IconSparkle size={15} />}
      {loading ? loadingLabel : label}
    </button>
  );
}

// ── TIPO FEEDITEM PARA PREVIEW ────────────────────────────────────────────────
interface FeedItem {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string | null;
  fecha: string;
  fuente: "egm" | "empresa";
  categoria?: string | null;
  destacado: boolean;
  esNuevoItem: boolean;
  videoUrl?: string | null;
  adjuntoUrl?: string | null;
  adjuntoNombre?: string | null;
  enlaceUrl?: string | null;
  enlaceTexto?: string | null;
  estado?: string | null;
  fijado?: boolean;
  vistas?: number;
  _raw: Noticia;
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({ children, onClose, zIndex = 50, maxWidth = "42rem", modalRef }: {
  children: ReactNode; onClose: () => void; zIndex?: number; maxWidth?: string;
  modalRef?: React.RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex, background: "rgba(0,0,0,0.58)", animation: "modalBgIn 0.2s ease", padding: "16px 12px" }}
      onClick={onClose}>
      <div ref={modalRef} className="relative w-full flex flex-col"
        style={{ maxWidth, maxHeight: "calc(100vh - 32px)", flex: 1, minWidth: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-3 right-3 z-20 flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", cursor: "pointer", transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.75)"; e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.35)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
          title="Cerrar (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="flex flex-col rounded-2xl overflow-hidden w-full h-full"
          style={{ background: "#0d1b2e", boxShadow: "0 32px 80px rgba(0,0,0,0.28)", animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)", transform: "translateZ(0)", isolation: "isolate" }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes modalBgIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.94) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}

// ── DETALLE MODAL PARA PREVIEW ────────────────────────────────────────────────
function DetallePreviewModal({ item, onClose }: {
  item: FeedItem;
  onClose: () => void;
}) {
  const embedUrl = useMemo(() => item.videoUrl ? getVideoEmbedUrl(item.videoUrl) : null, [item.videoUrl]);
  const modalRef = useRef<HTMLDivElement>(null);

  function renderMarkdown(text: string): ReactNode {
    const lines = text.split("\n");
    const out: ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith("## ")) {
        out.push(<h3 key={i} style={{ fontWeight: 700, fontSize: "1rem", color: "var(--texto-primario)", margin: "12px 0 4px" }}>{parseInline(line.slice(3))}</h3>);
      } else if (line.startsWith("# ")) {
        out.push(<h2 key={i} style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--texto-primario)", margin: "14px 0 4px" }}>{parseInline(line.slice(2))}</h2>);
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        const items: ReactNode[] = [];
        while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
          items.push(<li key={i} style={{ marginLeft: "18px", listStyleType: "disc" }}>{parseInline(lines[i].slice(2))}</li>);
          i++;
        }
        out.push(<ul key={`ul${i}`} style={{ margin: "4px 0 8px" }}>{items}</ul>);
        continue;
      } else if (line.trim() === "") {
        out.push(<div key={i} style={{ height: "8px" }} />);
      } else {
        out.push(<p key={i} style={{ margin: "2px 0", lineHeight: 1.75 }}>{parseInline(line)}</p>);
      }
      i++;
    }
    return <>{out}</>;
  }

  function parseInline(text: string): ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return <>{parts.map((p, i) => p.startsWith("**") && p.endsWith("**")
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p
    )}</>;
  }

  return (
    <Modal onClose={onClose} zIndex={220} maxWidth="42rem" modalRef={modalRef}>
      {item.imagenUrl ? (
        <div className="relative w-full shrink-0 overflow-hidden rounded-t-2xl"
          style={{ aspectRatio: "16/9", maxHeight: "260px" }}>
          <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold"
            style={{ background: "#fef9c3", color: "#854d0e", borderBottom: "1px solid #fde047" }}>
            <span>Vista previa — así verán los usuarios este anuncio</span>
          </div>
          <img src={item.imagenUrl} alt={item.titulo} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,10,28,0.95) 0%, rgba(3,10,28,0.25) 55%, transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 flex items-end justify-between gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.22)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.32)" }}>
              Empresa
            </span>
            <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>Ahora mismo</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full shrink-0 overflow-hidden rounded-t-2xl"
          style={{ height: 150, background: GRAD_EGM }}>
          <div className="absolute top-3 left-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ transform: "translateX(-50%)", background: "rgba(0,0,0,0.45)", color: "#fde68a", backdropFilter: "blur(8px)", border: "1px solid rgba(253,230,138,0.35)" }}>
            Vista previa
          </div>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <h2 className="leading-tight"
              style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.15rem, 2.5vw, 1.45rem)", letterSpacing: "-0.02em", color: "#fff" }}>
              {item.titulo}
            </h2>
          </div>
        </div>
      )}
      <div className="overflow-y-auto flex-1 flex flex-col" style={{ background: "var(--blanco)" }}>
        <div className="flex-1 px-6 pb-5 md:px-8 flex flex-col gap-4"
          style={{ paddingTop: item.imagenUrl ? "1.5rem" : "1.25rem" }}>
          {item.imagenUrl && (
            <h2 className="leading-tight"
              style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.4rem, 3vw, 1.85rem)", letterSpacing: "-0.02em", color: "var(--texto-primario)" }}>
              {item.titulo}
            </h2>
          )}
          <div style={{ fontSize: "0.94rem", color: "#4b5563", lineHeight: 1.85, overflowWrap: "break-word" }}>
            {renderMarkdown(item.descripcion)}
          </div>
          {(embedUrl || item.adjuntoUrl || item.enlaceUrl) && (
            <div className="flex flex-col gap-3" style={{ borderTop: "1px solid var(--gris-borde)", paddingTop: "1.25rem" }}>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--texto-muted)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--texto-muted)", letterSpacing: "0.08em" }}>Recursos adjuntos</p>
              </div>
              {embedUrl && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--texto-muted)" }}>Vídeo</span>
                  <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen style={{ border: "none" }} />
                  </div>
                </div>
              )}
              {item.adjuntoUrl && (
                <a href={item.adjuntoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", textDecoration: "none" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dbeafe" }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: "#2563eb" }}>{item.adjuntoNombre ?? "Ver documento"}</span>
                </a>
              )}
              {item.enlaceUrl && (
                <a href={item.enlaceUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)", textDecoration: "none" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dbeafe" }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                  </div>
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: "#2563eb" }}>{item.enlaceTexto ?? "Ver enlace"}</span>
                </a>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--gris-borde)" }}>
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-xl"
            style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Volver a editar
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── FORMULARIO ANUNCIO ────────────────────────────────────────────────────────
export default function FormAnuncio({
  initialValues, editando, submitting, formError,
  onClose, onSubmit, onPreview,
}: {
  initialValues: NoticiaInput;
  editando: Noticia | null;
  submitting: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (data: NoticiaInput) => void;
  onPreview: (item: FeedItem) => void;
}) {
  type Tab = "contenido" | "multimedia" | "publicacion";
  const [tab, setTab]         = useState<Tab>("contenido");
  const visitedTabs           = useRef<Set<Tab>>(new Set(["contenido"]));
  const [touched, setTouched] = useState(false);
  const [form, setForm]       = useState<NoticiaInput>({ ...EMPTY_FORM, ...initialValues, imagenUrl: initialValues.imagenUrl ?? null });
  const initialSnapshot = useRef<string>(JSON.stringify(initialValues));
  const isDirty   = JSON.stringify(form) !== initialSnapshot.current;
  const canSubmit = form.titulo.trim().length > 0 && form.contenido.trim().length > 0;

  const [confirmClose, setConfirmClose] = useState(false);
  const handleRequestClose = () => { if (isDirty) setConfirmClose(true); else onClose(); };

  const [imagenModo, setImagenModo]     = useState<"url" | "upload">("url");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingAdj, setUploadingAdj] = useState(false);
  const [aiLoading, setAiLoading]       = useState<"titulo" | "contenido" | null>(null);
  const [localError, setLocalError]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adjuntoRef   = useRef<HTMLInputElement>(null);

  const errorMsg = localError ?? formError;

  const [previewItem, setPreviewItem] = useState<FeedItem | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true); setLocalError(null);
    try {
      const url = await subirImagenBackend(file);
      setForm((f) => ({ ...f, imagenUrl: url }));
      setImagenModo("url");
    } catch (err) { setLocalError(`Error al subir la imagen: ${err instanceof Error ? err.message : String(err)}`); }
    finally { setUploadingImg(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  async function handleAdjuntoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAdj(true); setLocalError(null);
    try {
      const { url, nombre } = await subirAdjuntoBackend(file);
      setForm((f) => ({ ...f, adjuntoUrl: url, adjuntoNombre: nombre }));
    } catch { setLocalError("Error al subir el documento. Inténtalo de nuevo."); }
    finally { setUploadingAdj(false); if (adjuntoRef.current) adjuntoRef.current.value = ""; }
  }

  async function sugerirConIA(campo: "titulo" | "contenido") {
    const base = campo === "titulo" ? (form.contenido.trim() || form.titulo.trim()) : form.contenido.trim();
    if (!base) { setLocalError("Escribe algo antes de usar la IA."); return; }
    setAiLoading(campo); setLocalError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: campo === "titulo"
            ? `Sugiere un título corto (máximo 80 caracteres), claro y atractivo para un anuncio de empresa con el siguiente contenido. Devuelve SOLO el título, sin comillas ni explicaciones.\n\nContenido: ${base}`
            : `Mejora la redacción de este anuncio de empresa. Hazlo más claro y profesional. Devuelve SOLO el texto mejorado, sin comentarios adicionales.\n\nTexto original: ${base}`
          }],
          context: {},
        }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader(); const dec = new TextDecoder(); let out = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; out += dec.decode(value); }
      if (campo === "titulo") setForm((f) => ({ ...f, titulo: out.trim() }));
      else setForm((f) => ({ ...f, contenido: out.trim() }));
    } catch { setLocalError("La IA no está disponible en este momento."); }
    finally { setAiLoading(null); }
  }

  function handlePreview() {
    const item: FeedItem = {
      id: "preview",
      titulo: form.titulo || "(Sin título)",
      descripcion: form.contenido,
      imagenUrl: form.imagenUrl,
      fecha: new Date().toISOString(),
      fuente: "empresa",
      categoria: form.categoria ?? null,
      destacado: form.fijado ?? false,
      esNuevoItem: true,
      videoUrl: form.videoUrl,
      adjuntoUrl: form.adjuntoUrl,
      adjuntoNombre: form.adjuntoNombre,
      enlaceUrl: form.enlaceUrl,
      enlaceTexto: form.enlaceTexto,
      estado: form.estado,
      _raw: {} as Noticia,
    };
    setPreviewItem(item);
  }

  const tituloError    = touched && !form.titulo.trim();
  const contenidoError = touched && !form.contenido.trim();

  const badgeMult = useMemo(() => [form.imagenUrl, form.videoUrl, form.adjuntoUrl].filter(Boolean).length, [form.imagenUrl, form.videoUrl, form.adjuntoUrl]);
  const badgePub  = useMemo(() => [form.enlaceUrl, form.fijado, form.estado === "borrador"].filter(Boolean).length, [form.enlaceUrl, form.fijado, form.estado]);
  const embedUrl  = useMemo(() => form.videoUrl ? getVideoEmbedUrl(form.videoUrl) : null, [form.videoUrl]);
  const badgeCont = useMemo(() => touched ? [!form.titulo.trim(), !form.contenido.trim()].filter(Boolean).length : 0, [touched, form.titulo, form.contenido]);

  const TABS = useMemo<{ id: Tab; label: string; badge?: number; error?: boolean }[]>(() => [
    { id: "contenido",   label: "Contenido",   badge: badgeCont || undefined, error: badgeCont > 0 },
    { id: "multimedia",  label: "Multimedia",  badge: badgeMult },
    { id: "publicacion", label: "Publicación", badge: badgePub  },
  ], [badgeCont, badgeMult, badgePub]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleRequestClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isDirty]);

  const CATEGORIAS = ["General", "Aviso", "Evento"];

  if (previewItem) {
    return <DetallePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />;
  }

  return (
    <>
    <div className="fixed inset-0 flex items-start justify-center"
      style={{ zIndex: 160, background: "rgba(0,0,0,0.52)", paddingTop: 96, paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}
      onClick={handleRequestClose}>

      <div className="relative w-full flex flex-col"
        style={{
          maxWidth: 660,
          height: "auto",
          maxHeight: "calc(100vh - 112px)",
          background: "var(--blanco)",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)",
          overflow: "hidden",
          isolation: "isolate",
        }}
        onClick={(e) => e.stopPropagation()}>

        {/* Cabecera */}
        <div className="relative shrink-0 overflow-hidden" style={{ background: GRAD_EGM }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 90% 10%, rgba(255,255,255,0.07) 0%, transparent 55%)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 0% 120%, rgba(37,99,235,0.18) 0%, transparent 50%)" }} />
          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <h3 style={{
                fontFamily: "var(--font-raleway), sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.65rem, 4vw, 2.1rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                margin: 0,
                textShadow: "0 1px 12px rgba(0,0,0,0.18)",
              }}>
                {editando ? "Editar anuncio" : "Nuevo anuncio"}
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
                {editando ? "Modifica los datos y guarda los cambios." : "Visible para todos los empleados de tu empresa."}
              </p>
            </div>
            <button onClick={handleRequestClose}
              className="shrink-0 flex items-center justify-center"
              style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", cursor: "pointer", transition: "background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; e.currentTarget.style.transform = "scale(1.12)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
              title="Cerrar (Esc)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 relative" style={{ background: "var(--gris-superficie)", borderBottom: "1px solid var(--gris-borde)" }}>
          <div className="flex">
            {TABS.map(({ id, label, badge, error }) => (
              <button key={id} type="button" onClick={() => { visitedTabs.current.add(id); setTab(id); }}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors"
                style={{
                  color: tab === id ? (error ? "var(--error)" : "var(--azul-accion)") : "var(--texto-muted)",
                  background: "none",
                }}>
                {label}
                {badge ? (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{
                      background: error ? "var(--error)" : tab === id ? "var(--azul-accion)" : "#d1d5db",
                      color: error || tab === id ? "#fff" : "var(--texto-muted)",
                      minWidth: 18, textAlign: "center",
                    }}>
                    {badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: `${100 / TABS.length}%`,
            height: 2,
            borderRadius: "2px 2px 0 0",
            background: TABS.find((t) => t.id === tab)?.error ? "var(--error)" : "var(--azul-accion)",
            transform: `translateX(${TABS.findIndex((t) => t.id === tab) * 100}%)`,
            transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease",
          }} />
        </div>

        {/* Cuerpo con scroll */}
        <div className="overflow-y-auto" style={{ background: "var(--gris-superficie)" }}>

          {/* TAB: Contenido */}
          <div style={{ display: tab === "contenido" ? "block" : "none" }}>
          <div className="flex flex-col gap-6" style={{ padding: "28px 32px" }}>
            <div>
              <FieldLabel label="Título" required
                right={
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs tabular-nums" style={{ color: form.titulo.length > 80 ? "var(--error)" : "var(--texto-muted)" }}>{form.titulo.length}/80</span>
                    <AIButton loading={aiLoading === "titulo"} label="Sugerir título" loadingLabel="Generando..." onClick={() => sugerirConIA("titulo")} />
                  </div>
                }
              />
              <input type="text" value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Recordatorio reunión de equipo"
                className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                style={{ ...inputStyle, ...(tituloError ? { borderColor: "var(--error)", boxShadow: "0 0 0 3px rgba(239,68,68,0.12)" } : {}) }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {tituloError && <p className="text-xs mt-1.5" style={{ color: "var(--error)" }}>El título es obligatorio</p>}
            </div>

            <div>
              <FieldLabel label="Descripción" required
                right={
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs tabular-nums" style={{ color: "var(--texto-muted)" }}>{form.contenido.length} car.</span>
                    <AIButton loading={aiLoading === "contenido"} disabled={!form.contenido.trim()}
                      label="Mejorar con IA" loadingLabel="Mejorando..." onClick={() => sugerirConIA("contenido")} />
                  </div>
                }
              />
              <textarea value={form.contenido}
                onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                placeholder="Escribe la descripción. Puedes usar **negrita** y - listas."
                className="w-full rounded-xl px-4 py-3 text-base focus:outline-none resize-none"
                style={{ ...inputStyle, minHeight: 180, ...(contenidoError ? { borderColor: "var(--error)", boxShadow: "0 0 0 3px rgba(239,68,68,0.12)" } : {}) }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {contenidoError && <p className="text-xs mt-1.5" style={{ color: "var(--error)" }}>La descripción es obligatoria</p>}
            </div>

            <div>
              <FieldLabel label="Categoría" />
              <div className="flex gap-2 flex-wrap">
                {CATEGORIAS.map((cat) => {
                  const active = (form.categoria ?? "General") === cat;
                  const col = CATEGORIA_COLORS_LIGHT[cat] ?? CATEGORIA_COLORS_LIGHT.General;
                  return (
                    <button key={cat} type="button"
                      onClick={() => setForm({ ...form, categoria: cat === "General" ? null : cat })}
                      className="text-sm font-semibold px-4 py-1.5 rounded-full transition-all"
                      style={{
                        background: active ? col.bg : "var(--blanco)",
                        color: active ? col.text : "var(--texto-muted)",
                        border: `1.5px solid ${active ? col.border : "var(--gris-borde)"}`,
                        boxShadow: active ? `0 2px 8px ${col.border}60` : "none",
                      }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div></div>

          {/* TAB: Multimedia */}
          {visitedTabs.current.has("multimedia") && (
          <div style={{ display: tab === "multimedia" ? "block" : "none" }}>
          <div className="flex flex-col gap-6" style={{ padding: "28px 32px" }}>
            <div>
              <FieldLabel label="Imagen"
                right={
                  <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--gris-borde)" }}>
                    {(["url", "upload"] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setImagenModo(m)}
                        className="text-xs px-3 py-1.5 font-semibold transition-all"
                        style={{ background: imagenModo === m ? GRAD_BTN : "transparent", color: imagenModo === m ? "#fff" : "var(--texto-secundario)" }}>
                        {m === "url" ? "URL" : "Subir"}
                      </button>
                    ))}
                  </div>
                }
              />
              {imagenModo === "url" ? (
                <>
                  <input type="url" value={form.imagenUrl ?? ""}
                    onChange={(e) => setForm({ ...form, imagenUrl: e.target.value || null })}
                    placeholder="https://..."
                    className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                  {form.imagenUrl && (
                    <div className="relative mt-3">
                      <img src={form.imagenUrl} alt="preview" className="rounded-xl w-full object-cover"
                        style={{ height: "160px" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                        className="absolute top-2 right-2 flex items-center justify-center transition-all"
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.8)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.transform = "scale(1)"; }}
                        title="Quitar imagen">
                        <IconX size={12} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl py-8 text-sm transition-all disabled:opacity-60"
                    style={{ border: "2px dashed var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-muted)" }}
                    onMouseEnter={(e) => { if (!uploadingImg) { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.background = "#f0f7ff"; }}}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--blanco)"; }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "#eff6ff"; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "var(--blanco)"; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = "var(--gris-borde)";
                      e.currentTarget.style.background = "var(--blanco)";
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith("image/")) {
                        handleImageUpload({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                      }
                    }}>
                    {uploadingImg
                      ? <><span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Subiendo...</span></>
                      : <><IconUpload /><span className="font-medium">Arrastra o selecciona imagen</span><span className="text-xs opacity-70">JPG, PNG, WebP</span></>}
                  </button>
                  {form.imagenUrl && (
                    <div className="relative mt-3">
                      <img src={form.imagenUrl} alt="preview" className="rounded-xl w-full object-cover" style={{ height: "160px" }} />
                      <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(22,163,74,0.9)", color: "#fff" }}>Subida correctamente</span>
                      <button type="button" onClick={() => setForm((f) => ({ ...f, imagenUrl: null }))}
                        className="absolute top-2 right-2 flex items-center justify-center transition-all"
                        style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.8)"; e.currentTarget.style.transform = "scale(1.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.transform = "scale(1)"; }}
                        title="Quitar imagen">
                        <IconX size={12} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <FieldLabel label="Vídeo (YouTube o Vimeo)" />
              {embedUrl ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      <span className="text-xs font-semibold truncate max-w-[220px]" style={{ color: "#166534" }}>{form.videoUrl}</span>
                    </div>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, videoUrl: null }))}
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0"
                      style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                      Quitar
                    </button>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", maxHeight: 200 }}>
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen style={{ border: "none" }} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <input type="url" value={form.videoUrl || ""}
                    onChange={(e) => setForm({ ...form, videoUrl: e.target.value || null })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                    style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                  {form.videoUrl && (
                    <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#b45309" }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                      Solo se pueden incrustar vídeos de YouTube o Vimeo
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <FieldLabel label="Documento adjunto" />
              <input ref={adjuntoRef} type="file" accept=".pdf,.doc,.docx" onChange={handleAdjuntoUpload} className="hidden" />
              {form.adjuntoUrl ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ border: "1.5px solid #86efac", background: "#f0fdf4" }}>
                  <span style={{ color: "#16a34a" }}><IconDoc /></span>
                  <span className="text-sm flex-1 truncate font-medium" style={{ color: "#166534" }}>
                    {form.adjuntoNombre ?? "Documento"}
                  </span>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, adjuntoUrl: null, adjuntoNombre: null }))}
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{ color: "var(--texto-secundario)", background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.transform = "scale(1.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.transform = "scale(1)"; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}>
                    Quitar
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => adjuntoRef.current?.click()} disabled={uploadingAdj}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
                  style={{ border: "1.5px dashed var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-muted)" }}
                  onMouseEnter={(e) => { if (!uploadingAdj) e.currentTarget.style.borderColor = "#93c5fd"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--gris-borde)"; }}>
                  {uploadingAdj
                    ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Subiendo...</span></>
                    : <><IconDoc /><span className="font-medium">Adjuntar PDF o Word</span></>}
                </button>
              )}
            </div>
          </div></div>
          )}

          {/* TAB: Publicación */}
          {visitedTabs.current.has("publicacion") && (
          <div style={{ display: tab === "publicacion" ? "block" : "none" }}>
          <div className="flex flex-col gap-6" style={{ padding: "28px 32px" }}>
            <div style={{ width: "100%" }}>
              <FieldLabel label="Enlace externo" />
              <div className="flex flex-col gap-2">
                <input type="url" value={form.enlaceUrl || ""}
                  onChange={(e) => setForm({ ...form, enlaceUrl: e.target.value || null })}
                  placeholder="https://..."
                  className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
                {form.enlaceUrl && (
                  <>
                    <input type="text" value={form.enlaceTexto || ""}
                      onChange={(e) => setForm({ ...form, enlaceTexto: e.target.value || null })}
                      placeholder='Texto del enlace — ej: "Más información"'
                      className="w-full rounded-xl px-4 py-3 text-base focus:outline-none"
                      style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                    <div className="flex flex-col gap-1.5 pt-1">
                      <p className="text-xs font-medium" style={{ color: "var(--texto-muted)" }}>Así se verá en el anuncio</p>
                      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                        style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dbeafe" }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                          </div>
                          <span className="text-sm font-medium truncate" style={{ color: "#2563eb" }}>
                            {form.enlaceTexto?.trim() || "Ver enlace"}
                          </span>
                        </div>
                        <button type="button" onClick={() => setForm((f) => ({ ...f, enlaceUrl: null, enlaceTexto: null }))}
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0"
                          style={{ color: "var(--texto-secundario)", background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                          Quitar
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Visibilidad */}
            <div>
              <FieldLabel label="Estado" />
              <div className="rounded-2xl overflow-hidden" style={{
                border: `1.5px solid ${form.fijado ? "#bfdbfe" : "var(--gris-borde)"}`,
                transition: "border-color 0.18s",
              }}>
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 cursor-pointer"
                  style={{ background: form.fijado ? "#dbeafe" : "var(--blanco)", transition: "background 0.18s" }}
                  onClick={() => setForm({ ...form, fijado: !form.fijado })}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: form.fijado ? "#bfdbfe" : "var(--gris-superficie)", transition: "background 0.18s" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={form.fijado ? "#1d4ed8" : "var(--texto-muted)"} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: form.fijado ? "#1d4ed8" : "var(--texto-primario)" }}>Fijar en la parte superior</p>
                      <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--texto-muted)" }}>Aparece siempre el primero en el listado</p>
                    </div>
                  </div>
                  <Toggle checked={form.fijado ?? false} onChange={(v) => setForm({ ...form, fijado: v })} color="#2563eb" />
                </div>

                {!form.fijado && form.estado !== "borrador" && !(editando && editando.estado !== "borrador") && (
                  <div style={{ height: 1, background: "var(--gris-borde)" }} />
                )}

                {!(editando && editando.estado !== "borrador") && (
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 cursor-pointer"
                  style={{ background: form.estado === "borrador" ? "#fffbeb" : "var(--blanco)", transition: "background 0.18s" }}
                  onClick={() => setForm({ ...form, estado: form.estado === "borrador" ? "publicado" : "borrador" })}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: form.estado === "borrador" ? "#fde68a" : "var(--gris-superficie)", transition: "background 0.18s" }}>
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={form.estado === "borrador" ? "#d97706" : "var(--texto-muted)"} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight" style={{ color: form.estado === "borrador" ? "#92400e" : "var(--texto-primario)" }}>Guardar como borrador</p>
                      <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--texto-muted)" }}>No visible hasta que lo publiques manualmente</p>
                    </div>
                  </div>
                  <Toggle checked={form.estado === "borrador"} onChange={(v) => setForm({ ...form, estado: v ? "borrador" : "publicado" })} color="#d97706" />
                </div>
                )}
              </div>
            </div>
          </div>
          </div>
          )}
        </div>

        {/* Footer fijo */}
        <div className="px-8 py-5 flex items-center justify-between gap-3 shrink-0"
          style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
          <div className="flex-1 min-w-0">
            {errorMsg && <p className="text-sm truncate" style={{ color: "var(--error)" }}>{errorMsg}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleRequestClose}
              className="text-sm px-4 py-2 rounded-xl font-medium"
              style={{ color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)", background: "transparent", transition: "background 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}>
              Cancelar
            </button>
            <button type="button" onClick={handlePreview}
              className="text-sm px-4 py-2 rounded-xl font-medium"
              style={{ color: "#2563eb", border: "1px solid #bfdbfe", background: "#eff6ff", transition: "background 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.04)"; }}>
              Previsualizar
            </button>
            {editando && editando.estado === "borrador" && (() => {
              const active = isDirty && canSubmit;
              return (
                <button onClick={() => { if (!active) return; setTouched(true); onSubmit(form); }}
                  disabled={submitting}
                  className="text-sm font-semibold px-5 py-2 rounded-xl transition-all"
                  style={{
                    background: active ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)" : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
                    color: "#fff",
                    boxShadow: active ? "0 2px 8px rgba(217,119,6,0.35)" : "none",
                    cursor: active ? "pointer" : "not-allowed",
                    opacity: submitting ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { if (active) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = submitting ? "0.5" : "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { if (active) e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { if (active) e.currentTarget.style.transform = "scale(1.04)"; }}>
                  {submitting ? "Guardando..." : "Guardar cambios"}
                </button>
              );
            })()}
            {!(editando && editando.estado === "borrador") && (() => {
              const esBorrador = form.estado === "borrador" && !editando;
              const active = canSubmit && (!editando || isDirty);
              const bg = active
                ? esBorrador ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)" : GRAD_BTN
                : "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
              const shadow = active
                ? esBorrador ? "0 2px 8px rgba(217,119,6,0.35)" : "0 2px 8px rgba(37,99,235,0.3)"
                : "none";
              return (
                <button onClick={() => { if (!active) return; setTouched(true); onSubmit(form); }}
                  disabled={submitting}
                  className="text-sm font-semibold px-5 py-2 rounded-xl transition-all"
                  style={{ background: bg, color: "#fff", boxShadow: shadow, cursor: active ? "pointer" : "not-allowed", opacity: submitting ? 0.5 : 1 }}
                  onMouseEnter={(e) => { if (active) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = submitting ? "0.5" : "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { if (active) e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { if (active) e.currentTarget.style.transform = "scale(1.04)"; }}>
                  {submitting ? "Guardando..." : editando ? "Guardar cambios" : esBorrador ? "Guardar borrador" : "Publicar anuncio"}
                </button>
              );
            })()}
            {editando && editando.estado === "borrador" && (() => {
              const active = canSubmit;
              return (
                <button onClick={() => { if (!active) return; setTouched(true); onSubmit({ ...form, estado: "publicado" }); }}
                  disabled={submitting}
                  className="text-sm font-semibold px-5 py-2 rounded-xl transition-all"
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#fff", boxShadow: active ? "0 2px 8px rgba(22,163,74,0.3)" : "none", cursor: active ? "pointer" : "not-allowed", opacity: submitting ? 0.5 : !active ? 0.5 : 1 }}
                  onMouseEnter={(e) => { if (active) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = submitting || !active ? "0.5" : "1"; e.currentTarget.style.transform = "scale(1)"; }}
                  onMouseDown={(e) => { if (active) e.currentTarget.style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { if (active) e.currentTarget.style.transform = "scale(1.04)"; }}>
                  {submitting ? "Publicando..." : "Publicar ahora"}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>

    {/* Diálogo confirmar cierre */}
    {confirmClose && (
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200, background: "rgba(0,0,0,0.45)" }}>
        <div className="w-full max-w-xs flex flex-col gap-5 p-6 rounded-2xl"
          style={{
            background: "var(--blanco)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
            border: "1px solid var(--gris-borde)",
            animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
          <div className="flex justify-center">
            <div className="flex items-center justify-center rounded-full" style={{ width: 52, height: 52, background: "#fef9c3", border: "1.5px solid #fde047" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ca8a04" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
          </div>
          <div className="text-center flex flex-col gap-1">
            <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>¿Descartar los cambios?</p>
            <p className="text-sm" style={{ color: "var(--texto-muted)" }}>Tienes cambios sin guardar. Si sales ahora los perderás.</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setConfirmClose(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: GRAD_BTN, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.3)", transition: "opacity 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}>
              Seguir editando
            </button>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--gris-borde)", cursor: "pointer", transition: "background 0.18s ease, color 0.18s ease, transform 0.18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.transform = "scale(1.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--gris-superficie)"; e.currentTarget.style.color = "var(--texto-secundario)"; e.currentTarget.style.transform = "scale(1)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}>
              Descartar cambios
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
