"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Servicio, ServicioInput, CategoriaServicio } from "@/lib/types/servicios";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ICONOS_BENEFICIO, BootstrapIcon } from "@/lib/iconosBeneficio";
import Grainient from "@/components/ui/Grainient";

interface Props {
  inicial:   Servicio | null;
  onGuardar: (data: ServicioInput) => Promise<void>;
  onCerrar:  () => void;
}

const CAMPO_BASE =
  "w-full rounded-xl px-3.5 text-sm outline-none transition-all duration-150 border";
const ALTURA_CAMPO = "44px";

const estiloInput = (foco: boolean) => ({
  borderColor: foco ? "var(--azul-egm)" : "rgba(0,0,0,0.12)",
  boxShadow:   foco ? "0 0 0 3px rgba(22,50,105,0.08)" : "none",
  background:  "#ffffff",
  color:       "var(--texto-primario)",
});

const CATEGORIAS: { value: CategoriaServicio; label: string; emoji: string }[] = [
  { value: "MOVILIDAD",     label: "Movilidad",     emoji: "🚌" },
  { value: "INSTALACIONES", label: "Instalaciones", emoji: "🏢" },
  { value: "INICIATIVAS",   label: "Iniciativas",   emoji: "🤝" },
  { value: "COMUNES",       label: "Servicios comunes", emoji: "🔧" },
];


// ── Selector de icono ─────────────────────────────────────────────────────────
function IconoPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0 });
  const ref         = useRef<HTMLDivElement>(null);
  const triggerRef  = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected    = ICONOS_BENEFICIO.find(i => i.key === value);

  function calcPos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  useEffect(() => {
    function onOut(e: MouseEvent) {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>Icono</span>
        {value && (
          <button type="button" onClick={() => onChange("")}
            style={{ color: "var(--texto-placeholder)", background: "none", border: "none", cursor: "pointer", fontSize: "11px", padding: 0 }}>
            Quitar
          </button>
        )}
      </div>
      <button
        ref={triggerRef} type="button"
        onClick={() => { calcPos(); setOpen(p => !p); }}
        className="w-full flex items-center gap-3 px-3.5 rounded-xl text-sm border"
        style={{
          height: ALTURA_CAMPO, textAlign: "left",
          borderColor: open ? "var(--azul-egm)" : "rgba(0,0,0,0.12)",
          boxShadow:   open ? "0 0 0 3px rgba(22,50,105,0.08)" : "none",
          background:  "#ffffff", transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {selected ? (
          <>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, flexShrink: 0, color: "var(--azul-egm)" }}>
              <BootstrapIcon name={selected.bi} size={20} />
            </span>
            <span className="flex-1 font-medium text-sm" style={{ color: "var(--texto-primario)" }}>{selected.label}</span>
          </>
        ) : (
          <span style={{ color: "var(--texto-placeholder)" }}>Seleccionar icono</span>
        )}
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
          style={{ color: "var(--texto-placeholder)", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && createPortal(
        <div ref={dropdownRef} style={{
          position: "fixed", top: pos.top, left: pos.left, width: pos.width,
          zIndex: 9999, background: "#fff", border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: "14px", boxShadow: "0 8px 28px rgba(0,0,0,0.13)", padding: "10px",
        }}>
          <div className="grid grid-cols-4 gap-1">
            {ICONOS_BENEFICIO.map(icono => {
              const sel = value === icono.key;
              return (
                <button key={icono.key} type="button" title={icono.label}
                  onClick={() => { onChange(sel ? "" : icono.key); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "7px", borderRadius: "10px",
                    border: sel ? "2px solid var(--azul-egm)" : "2px solid transparent",
                    background: sel ? "var(--azul-egm-light)" : "transparent",
                    color: sel ? "var(--azul-egm)" : "var(--texto-muted)", cursor: "pointer",
                    transition: "background 0.12s, color 0.12s",
                  }}
                  onMouseEnter={e => { if (!sel) { e.currentTarget.style.background = "rgba(27,63,126,0.07)"; e.currentTarget.style.color = "var(--azul-egm)"; }}}
                  onMouseLeave={e => { if (!sel) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--texto-muted)"; }}}
                >
                  <BootstrapIcon name={icono.bi} size={28} />
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Selector de categoría ─────────────────────────────────────────────────────
function CategoriaSelector({ value, onChange }: { value: CategoriaServicio | ""; onChange: (v: CategoriaServicio) => void }) {
  const [foco, setFoco] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>
        Categoría<span title="Obligatorio" style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as CategoriaServicio)}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        className="w-full rounded-xl px-3.5 text-sm outline-none border appearance-none cursor-pointer"
        style={{ height: ALTURA_CAMPO, ...estiloInput(foco), color: value ? "var(--texto-primario)" : "var(--texto-placeholder)" }}
      >
        <option value="" disabled>Seleccionar categoría</option>
        {CATEGORIAS.map(c => (
          <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Campo de texto ────────────────────────────────────────────────────────────
function Campo({
  label, name, value, onChange, placeholder, required,
  type = "text", multiline, rows = 3, maxLength, hint,
}: {
  label: string; name: string; value: string; onChange: (val: string) => void;
  placeholder?: string; required?: boolean; type?: string;
  multiline?: boolean; rows?: number; maxLength?: number; hint?: string;
}) {
  const [foco, setFoco] = useState(false);
  const [urlValida, setUrlValida] = useState<boolean | null>(null);

  function validarUrl(val: string) {
    if (type !== "url" || !val) { setUrlValida(null); return; }
    try { new URL(val); setUrlValida(true); } catch { setUrlValida(false); }
  }

  const shared = {
    id: name, value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (maxLength && e.target.value.length > maxLength) return;
      onChange(e.target.value);
    },
    onFocus: () => setFoco(true),
    onBlur:  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { setFoco(false); validarUrl(e.target.value); },
    onKeyDown: (e: React.KeyboardEvent) => { if (!multiline && e.key === "Enter") e.preventDefault(); },
    placeholder: placeholder ?? "",
    className: CAMPO_BASE,
    style: estiloInput(foco),
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>
          {label}
          {required && <span title="Obligatorio" style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
        </label>
        <div className="flex items-center gap-2">
          {type === "url" && urlValida !== null && (
            urlValida
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          )}
          {maxLength && (
            <span className="text-xs" style={{ color: value.length >= maxLength * 0.9 ? "#f59e0b" : "#d1d5db" }}>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
      {multiline ? (
        <textarea {...shared} rows={rows}
          style={{ ...shared.style, resize: "none", minHeight: `${rows * 1.6 + 1.5}rem`, overflow: "hidden", paddingTop: "10px", paddingBottom: "10px" }}
          onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
        />
      ) : (
        <input {...shared} type={type} style={{ ...shared.style, height: ALTURA_CAMPO }} />
      )}
      {hint && <p className="text-xs" style={{ color: "var(--texto-placeholder)" }}>{hint}</p>}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export default function ServicioModal({ inicial, onGuardar, onCerrar }: Props) {
  const editando = inicial !== null;

  const [form, setForm] = useState<ServicioInput>({
    titulo:      inicial?.titulo      ?? "",
    descripcion: inicial?.descripcion ?? "",
    categoria:   inicial?.categoria   ?? ("" as CategoriaServicio),
    iconoUrl:    inicial?.iconoUrl    ?? "",
    urlInfo:     inicial?.urlInfo     ?? "",
    telefono:    inicial?.telefono    ?? "",
    comoAcceder: inicial?.comoAcceder ?? "",
  });

  const [guardando,    setGuardando]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [confirmSalir, setConfirmSalir] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  const estadoInicial: ServicioInput = {
    titulo:      inicial?.titulo      ?? "",
    descripcion: inicial?.descripcion ?? "",
    categoria:   inicial?.categoria   ?? ("" as CategoriaServicio),
    iconoUrl:    inicial?.iconoUrl    ?? "",
    urlInfo:     inicial?.urlInfo     ?? "",
    telefono:    inicial?.telefono    ?? "",
    comoAcceder: inicial?.comoAcceder ?? "",
  };
  const hayCambios = JSON.stringify(form) !== JSON.stringify(estadoInicial);

  const cerrarSeguro = useCallback(() => {
    if (hayCambios && !guardando) { setConfirmSalir(true); return; }
    onCerrar();
  }, [hayCambios, guardando, onCerrar]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") cerrarSeguro(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cerrarSeguro]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel   = panelRef.current;
    if (!overlay || !panel) return;
    overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease", fill: "forwards" });
    panel.animate(
      [{ opacity: 0, transform: "translateY(16px) scale(0.97)" }, { opacity: 1, transform: "translateY(0) scale(1)" }],
      { duration: 220, easing: "cubic-bezier(0.34,1.20,0.64,1)", fill: "forwards" },
    );
  }, []);

  function set(field: keyof ServicioInput, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value === "" ? null : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo?.trim() || !form.categoria) return;

    setGuardando(true);
    setError(null);
    try {
      await onGuardar({
        titulo:      form.titulo.trim(),
        descripcion: form.descripcion  || null,
        categoria:   form.categoria,
        iconoUrl:    form.iconoUrl     || null,
        urlInfo:     form.urlInfo      || null,
        telefono:    form.telefono     || null,
        comoAcceder: form.comoAcceder  || null,
      });
      setToastVisible(true);
      setTimeout(() => { setToastVisible(false); onCerrar(); }, 1800);
    } catch (err) {
      console.error("[ServicioModal]", err);
      setError("No se pudo guardar el servicio. Inténtalo de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <>
      {/* Toast */}
      {toastVisible && createPortal(
        <div style={{
          position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)",
          zIndex: 99999, background: "var(--texto-primario)", color: "#fff", borderRadius: "14px",
          padding: "12px 20px", fontSize: "0.875rem", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          animation: "toast-in 0.25s cubic-bezier(0.34,1.20,0.64,1) both",
        }}>
          <style>{`@keyframes toast-in { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          {editando ? "Cambios guardados" : "Servicio creado"}
        </div>,
        document.body
      )}

      <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) cerrarSeguro(); }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "var(--overlay)" }}
      >
        <div ref={panelRef}
          className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
          style={{ background: "var(--gris-panel)", maxHeight: "92dvh", boxShadow: "0 24px 56px rgba(0,0,0,0.18)" }}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between px-5 sm:px-6 shrink-0"
            style={{ paddingTop: "20px", paddingBottom: "20px", position: "relative", background: "var(--azul-egm)" }}
          >
            <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <Grainient
                color1="#2A5298" color2="#1B3F7E" color3="#1040a0"
                timeSpeed={0.18} warpStrength={1.2} warpFrequency={4.0}
                warpSpeed={1.5} warpAmplitude={60} grainAmount={0.08}
                contrast={1.3} saturation={1.1} zoom={0.85}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: "#fff", position: "relative", zIndex: 1 }}>
              {editando ? "Editar servicio" : "Nuevo servicio"}
            </h2>
            <div style={{ position: "relative", zIndex: 1 }}>
              <IconButton onClick={confirmSalir ? onCerrar : cerrarSeguro} variant="glass" />
            </div>
          </div>

          {/* Barra confirmación salida */}
          <div style={{
            overflow: "hidden", maxHeight: confirmSalir ? "64px" : "0px",
            opacity: confirmSalir ? 1 : 0,
            transition: "max-height 0.22s ease, opacity 0.18s ease",
            background: "#fffbeb", borderBottom: confirmSalir ? "1px solid rgba(245,158,11,0.20)" : "none",
          }}>
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3">
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="text-sm font-medium" style={{ color: "#92400e" }}>Los cambios se perderán al salir</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmSalir(false)}>Seguir editando</Button>
                <Button type="button" variant="danger" size="sm" onClick={onCerrar}>Salir</Button>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}
            className="flex flex-col gap-4 px-5 sm:px-6 py-5 overflow-y-auto"
            style={{ flex: 1, opacity: guardando ? 0.6 : 1, pointerEvents: guardando ? "none" : undefined, transition: "opacity 0.2s" }}
          >
            <Campo label="Título" name="titulo" value={form.titulo ?? ""} onChange={v => set("titulo", v)}
              placeholder="Ej: Autobús lanzadera al área empresarial" required maxLength={80} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CategoriaSelector value={form.categoria ?? ""} onChange={v => setForm(p => ({ ...p, categoria: v }))} />
              <IconoPicker value={form.iconoUrl ?? ""} onChange={v => set("iconoUrl", v)} />
            </div>

            <Campo label="Descripción" name="descripcion" value={form.descripcion ?? ""} onChange={v => set("descripcion", v)}
              placeholder="Breve descripción del servicio" multiline rows={2} />

            <Campo label="Cómo acceder" name="comoAcceder" value={form.comoAcceder ?? ""} onChange={v => set("comoAcceder", v)}
              placeholder="Ej: Solicita la tarjeta VAO en la oficina de EGM" multiline rows={2} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="URL de información" name="urlInfo" value={form.urlInfo ?? ""} onChange={v => set("urlInfo", v)}
                placeholder="https://atalayas.com/..." type="url" />
              <Campo label="Teléfono de contacto" name="telefono" value={form.telefono ?? ""} onChange={v => set("telefono", v)}
                placeholder="Ej: 647 76 33 89" hint="Opcional" />
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: "#ef4444" }}>{error}</p>
            )}

            <div className="flex gap-3 pt-1 pb-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={cerrarSeguro} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={guardando || !form.titulo?.trim() || !form.categoria}>
                {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear servicio"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
