"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Beneficio, BeneficioInput } from "@/lib/types/beneficios";
import { Button } from "@/components/ui/Button";
import { ICONOS_BENEFICIO } from "@/lib/iconosBeneficio";
import Grainient from "@/components/ui/Grainient";

interface Props {
  inicial:   Beneficio | null;               // null = crear, Beneficio = editar
  onGuardar: (data: BeneficioInput) => Promise<void>;
  onCerrar:  () => void;
}

const CAMPO_BASE =
  "w-full rounded-xl px-3.5 text-sm outline-none transition-all duration-150 border";

const ALTURA_CAMPO = "44px";

const estiloInput = (foco: boolean) => ({
  borderColor:  foco ? "var(--azul-egm)"         : "rgba(0,0,0,0.12)",
  boxShadow:    foco ? "0 0 0 3px rgba(22,50,105,0.08)" : "none",
  background:   "#ffffff",
  color:        "#111827",
});

// ── Botón cerrar — fusión chatbot + notis ────────────────────────────────────
function CloseButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      aria-label="Cerrar"
      style={{
        width:          "38px",
        height:         "38px",
        borderRadius:   "11px",
        border:         "1px solid rgba(255,255,255,0.28)",
        cursor:         "pointer",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        background:     pressed
          ? "rgba(0,0,0,0.28)"
          : hovered
          ? "rgba(0,0,0,0.20)"
          : "rgba(255,255,255,0.14)",
        color:          pressed ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.90)",
        boxShadow:      hovered && !pressed
          ? "0 4px 14px rgba(0,0,0,0.30), 0 0 0 3px rgba(0,0,0,0.12)"
          : "0 2px 6px rgba(0,0,0,0.18)",
        transform:      pressed ? "scale(0.88)" : hovered ? "scale(1.10)" : "scale(1)",
        transition:     "background 0.15s ease, box-shadow 0.18s cubic-bezier(0.34,1.20,0.64,1), transform 0.18s cubic-bezier(0.34,1.20,0.64,1)",
        flexShrink:     0,
      }}
    >
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// ── Separador de sección ─────────────────────────────────────────────────────
function Separador({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" style={{ marginTop: "4px" }}>
      <span className="text-[11px] font-semibold uppercase tracking-wider shrink-0" style={{ color: "#9ca3af" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.07)" }} />
    </div>
  );
}

// ── Selector de icono predefinido (dropdown) ─────────────────────────────────
function IconoPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState({ top: 0, left: 0, width: 0 });
  const ref               = useRef<HTMLDivElement>(null);
  const triggerRef        = useRef<HTMLButtonElement>(null);
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const selected          = ICONOS_BENEFICIO.find(i => i.key === value);

  // Calcular posición fixed del dropdown
  function calcPos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }

  // Cerrar al clicar fuera — excluye el portal para que el click del icono llegue
  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger  = ref.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "#374151" }}>
          Icono
        </span>
        {value && !open && (
          <button type="button" onClick={() => onChange("")}
            className="text-[11px]" style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Quitar
          </button>
        )}
      </div>

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { calcPos(); setOpen(p => !p); }}
        className="w-full flex items-center gap-3 px-3.5 rounded-xl text-sm border"
        style={{
          height:      ALTURA_CAMPO,
          borderColor: open ? "var(--azul-egm)" : "rgba(0,0,0,0.12)",
          boxShadow:   open ? "0 0 0 3px rgba(22,50,105,0.08)" : "none",
          background:  "#ffffff",
          transition:  "border-color 0.15s ease, box-shadow 0.15s ease",
          textAlign:   "left",
        }}
      >
        {selected ? (
          <>
            <span style={{
              display: "flex", width: 22, height: 22, flexShrink: 0,
              overflow: "hidden", color: "var(--azul-egm)",
            }}>
              <span style={{ transform: "scale(0.61)", transformOrigin: "top left", display: "flex", flexShrink: 0 }}>
                {selected.svg}
              </span>
            </span>
            <span className="flex-1 font-medium text-sm" style={{ color: "#111827" }}>{selected.label}</span>
          </>
        ) : (
          <span className="flex-1 text-sm" style={{ color: "#9ca3af" }}>Seleccionar icono</span>
        )}
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
          style={{ color: "#9ca3af", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Grid — portal al body para escapar del transform del panel */}
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position:     "fixed",
            top:          pos.top,
            left:         pos.left,
            width:        pos.width,
            zIndex:       9999,
            background:   "#ffffff",
            border:       "1px solid rgba(0,0,0,0.10)",
            borderRadius: "14px",
            boxShadow:    "0 8px 28px rgba(0,0,0,0.13)",
            padding:      "10px",
          }}
        >
          <div className="grid grid-cols-4 gap-1">
            {ICONOS_BENEFICIO.map(icono => {
              const sel = value === icono.key;
              return (
                <button
                  key={icono.key}
                  type="button"
                  title={icono.label}
                  onClick={() => { onChange(sel ? "" : icono.key); setOpen(false); }}
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    padding:        "7px",
                    borderRadius:   "10px",
                    border:         sel ? "2px solid var(--azul-egm)" : "2px solid transparent",
                    background:     sel ? "var(--azul-egm-light)" : "transparent",
                    color:          sel ? "var(--azul-egm)" : "#6b7280",
                    cursor:         "pointer",
                    transition:     "background 0.12s ease, color 0.12s ease, border-color 0.12s ease",
                  }}
                  onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.background = "rgba(27,63,126,0.07)"; e.currentTarget.style.color = "var(--azul-egm)"; }}}
                  onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; }}}
                >
                  {icono.svg}
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

// Placeholders rotativos por icono seleccionado
const PLACEHOLDERS_TITULO: Record<string, string> = {
  parking:     "Ej: Plaza de aparcamiento gratuita",
  descuento:   "Ej: 20% de descuento en tiendas colaboradoras",
  restaurante: "Ej: Menú diario a precio reducido",
  deporte:     "Ej: Acceso gratuito al gimnasio corporativo",
  transporte:  "Ej: Bono de transporte mensual subvencionado",
  salud:       "Ej: Revisión médica anual gratuita",
  formacion:   "Ej: Acceso a cursos de formación online",
  ocio:        "Ej: Entradas para eventos culturales",
  cafe:        "Ej: Café gratuito en la oficina",
  compras:     "Ej: Tarjeta de descuento en supermercados",
  seguro:      "Ej: Seguro de vida incluido",
  regalo:      "Ej: Regalo de bienvenida para nuevos empleados",
};
const PLACEHOLDER_DEFAULT = "Ej: Plaza de aparcamiento gratuita";

// ── Componente campo de texto ─────────────────────────────────────────────────
function Campo({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  opcional,
  type = "text",
  multiline,
  rows = 3,
  maxLength,
  min,
  max,
  hint,
  onClear,
}: {
  label:        string;
  name:         string;
  value:        string;
  onChange:     (val: string) => void;
  placeholder?: string;
  required?:    boolean;
  opcional?:    boolean;
  type?:        string;
  multiline?:   boolean;
  rows?:        number;
  maxLength?:   number;
  min?:         string;
  max?:         string;
  hint?:        string;
  onClear?:     () => void;
}) {
  const [foco,      setFoco]      = useState(false);
  const [urlValida, setUrlValida] = useState<boolean | null>(null);

  function validarUrl(val: string) {
    if (type !== "url" || !val) { setUrlValida(null); return; }
    try { new URL(val); setUrlValida(true); }
    catch { setUrlValida(false); }
  }

  const shared = {
    id:          name,
    value,
    onChange:    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (maxLength && e.target.value.length > maxLength) return;
      onChange(e.target.value);
    },
    onFocus:     () => setFoco(true),
    onBlur:      (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFoco(false);
      validarUrl(e.target.value);
    },
    onKeyDown:   (e: React.KeyboardEvent) => {
      if (!multiline && e.key === "Enter") e.preventDefault();
    },
    placeholder: placeholder ?? "",
    className:   CAMPO_BASE,
    style:       estiloInput(foco),
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-semibold" style={{ color: "#374151" }}>
          {label}
          {required && (
            <span title="Obligatorio" className="ml-0.5 cursor-default" style={{ color: "#ef4444" }}>*</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          {/* Indicador de validez URL */}
          {type === "url" && urlValida !== null && (
            urlValida
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          )}
          {/* Botón limpiar */}
          {onClear && value && (
            <button type="button" onClick={onClear}
              className="text-xs" style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Quitar
            </button>
          )}
          {/* Contador caracteres */}
          {maxLength && (
            <span className="text-xs" style={{ color: value.length >= maxLength * 0.9 ? "#f59e0b" : "#d1d5db" }}>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
      {multiline ? (
        <textarea
          {...shared}
          rows={rows}
          style={{ ...shared.style, resize: "none", minHeight: `${rows * 1.6 + 1.5}rem`, overflow: "hidden", paddingTop: "10px", paddingBottom: "10px" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
        />
      ) : (
        <input {...shared} type={type} min={min} max={max} style={{ ...shared.style, height: ALTURA_CAMPO }} />
      )}
      {/* Hint bajo el campo */}
      {hint && (
        <p className="text-xs" style={{ color: "#9ca3af" }}>{hint}</p>
      )}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export default function BeneficioModal({ inicial, onGuardar, onCerrar }: Props) {
  const editando = inicial !== null;

  // Fecha mínima = hoy, máxima = 5 años vista (zona local, YYYY-MM-DD)
  const hoyLocal = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const minFecha = `${hoyLocal.getFullYear()}-${pad2(hoyLocal.getMonth() + 1)}-${pad2(hoyLocal.getDate())}`;
  const maxFecha = `${hoyLocal.getFullYear() + 5}-${pad2(hoyLocal.getMonth() + 1)}-${pad2(hoyLocal.getDate())}`;

  const [form, setForm] = useState<BeneficioInput>({
    titulo:      inicial?.titulo      ?? "",
    descripcion: inicial?.descripcion ?? "",
    urlInfo:     inicial?.urlInfo     ?? "",
    iconoUrl:    inicial?.iconoUrl    ?? "",
    comoAcceder: inicial?.comoAcceder ?? "",
    fechaFin:    inicial?.fechaFin
      ? inicial.fechaFin.slice(0, 10)   // ISO → YYYY-MM-DD para <input type="date">
      : "",
  });

  const [guardando,    setGuardando]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [confirmSalir, setConfirmSalir] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Estado inicial para detectar cambios
  const estadoInicial: BeneficioInput = {
    titulo:      inicial?.titulo      ?? "",
    descripcion: inicial?.descripcion ?? "",
    urlInfo:     inicial?.urlInfo     ?? "",
    iconoUrl:    inicial?.iconoUrl    ?? "",
    comoAcceder: inicial?.comoAcceder ?? "",
    fechaFin:    inicial?.fechaFin ? inicial.fechaFin.slice(0, 10) : "",
  };
  const hayCambios = JSON.stringify(form) !== JSON.stringify(estadoInicial);

  // Cierre seguro — pide confirmación si hay cambios sin guardar
  const cerrarSeguro = useCallback(() => {
    if (hayCambios && !guardando) { setConfirmSalir(true); return; }
    onCerrar();
  }, [hayCambios, guardando, onCerrar]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") cerrarSeguro();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cerrarSeguro]);

  // Animación de entrada
  useEffect(() => {
    const overlay = overlayRef.current;
    const panel   = panelRef.current;
    if (!overlay || !panel) return;

    overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 180, easing: "ease", fill: "forwards",
    });
    panel.animate(
      [{ opacity: 0, transform: "translateY(16px) scale(0.97)" },
       { opacity: 1, transform: "translateY(0)   scale(1)"    }],
      { duration: 220, easing: "cubic-bezier(0.34,1.20,0.64,1)", fill: "forwards" },
    );
  }, []);

  // Cerrar clicando overlay
  function onOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) cerrarSeguro();
  }

  function set(field: keyof BeneficioInput, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value === "" ? null : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo?.trim()) return;

    setGuardando(true);
    setError(null);

    try {
      const payload: BeneficioInput = {
        titulo:      form.titulo.trim(),
        descripcion: form.descripcion  || null,
        urlInfo:     form.urlInfo      || null,
        iconoUrl:    form.iconoUrl     || null,
        comoAcceder: form.comoAcceder  || null,
        fechaFin:    form.fechaFin
          ? (() => {
              const [y, m, d] = form.fechaFin!.split("-").map(Number);
              const fecha = new Date(y, m - 1, d, 23, 59, 59);
              const pad   = (n: number) => String(n).padStart(2, "0");
              const off   = -fecha.getTimezoneOffset();
              const sign  = off >= 0 ? "+" : "-";
              const hh    = pad(Math.floor(Math.abs(off) / 60));
              const mm    = pad(Math.abs(off) % 60);
              return `${y}-${pad(m)}-${pad(d)}T23:59:59${sign}${hh}:${mm}`;
            })()
          : null,
      };
      await onGuardar(payload);
      // Toast de éxito
      setToastVisible(true);
      setTimeout(() => { setToastVisible(false); onCerrar(); }, 1800);
    } catch (err) {
      console.error("[BeneficioModal] Error al guardar:", err);
      setError("No se pudo guardar la ventaja. Inténtalo de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <>
    {/* ── Toast de éxito ── */}
    {toastVisible && createPortal(
      <div
        style={{
          position:     "fixed",
          bottom:       "28px",
          left:         "50%",
          transform:    "translateX(-50%)",
          zIndex:       99999,
          background:   "#111827",
          color:        "#ffffff",
          borderRadius: "14px",
          padding:      "12px 20px",
          fontSize:     "0.875rem",
          fontWeight:   600,
          display:      "flex",
          alignItems:   "center",
          gap:          "10px",
          boxShadow:    "0 8px 24px rgba(0,0,0,0.25)",
          animation:    "toast-in 0.25s cubic-bezier(0.34,1.20,0.64,1) both",
        }}
      >
        <style>{`@keyframes toast-in { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        {editando ? "Cambios guardados" : "Ventaja creada"}
      </div>,
      document.body
    )}

    <div
      ref={overlayRef}
      onClick={onOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        ref={panelRef}
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background:  "#f9fafb",
          maxHeight:   "92dvh",
          boxShadow:   "0 24px 56px rgba(0,0,0,0.18)",
        }}
      >
        {/* ── Cabecera ── */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 shrink-0"
          style={{ paddingTop: "20px", paddingBottom: "20px", position: "relative", background: "var(--azul-egm)" }}
        >
          {/* Fondo animado — posición absoluta para cubrir exactamente el padre */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <Grainient
              color1="#2A5298"
              color2="#1B3F7E"
              color3="#1040a0"
              timeSpeed={0.18}
              warpStrength={1.2}
              warpFrequency={4.0}
              warpSpeed={1.5}
              warpAmplitude={60}
              grainAmount={0.08}
              contrast={1.3}
              saturation={1.1}
              zoom={0.85}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>
          {/* Contenido encima */}
          <h2 className="text-2xl font-bold leading-tight" style={{ color: "#ffffff", position: "relative", zIndex: 1 }}>
            {editando ? "Editar ventaja" : "Nueva ventaja"}
          </h2>
          <div style={{ position: "relative", zIndex: 1 }}>
            <CloseButton onClick={confirmSalir ? onCerrar : cerrarSeguro} />
          </div>
        </div>

        {/* ── Barra de confirmación de salida ── */}
        <div
          style={{
            overflow:   "hidden",
            maxHeight:  confirmSalir ? "64px" : "0px",
            opacity:    confirmSalir ? 1 : 0,
            transition: "max-height 0.22s ease, opacity 0.18s ease",
            background: "#fffbeb",
            borderBottom: confirmSalir ? "1px solid rgba(245,158,11,0.20)" : "none",
          }}
        >
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-sm font-medium" style={{ color: "#92400e" }}>
                Los cambios se perderán al salir
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmSalir(false)}>
                Seguir editando
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={onCerrar}>
                Salir
              </Button>
            </div>
          </div>
        </div>

        {/* ── Formulario (scrollable) ── */}
        <form
          id="beneficio-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-5 sm:px-6 py-5 overflow-y-auto"
          style={{ flex: 1, opacity: guardando ? 0.6 : 1, pointerEvents: guardando ? "none" : undefined, transition: "opacity 0.2s ease" }}
        >
          <Campo
            label="Título"
            name="titulo"
            value={form.titulo ?? ""}
            onChange={v => set("titulo", v)}
            placeholder={PLACEHOLDERS_TITULO[form.iconoUrl ?? ""] ?? PLACEHOLDER_DEFAULT}
            required
            maxLength={80}
          />

          <Campo
            label="Descripción"
            name="descripcion"
            value={form.descripcion ?? ""}
            onChange={v => set("descripcion", v)}
            placeholder="Breve descripción de la ventaja"
            multiline
            rows={2}
            opcional
          />

          <Campo
            label="Cómo acceder"
            name="comoAcceder"
            value={form.comoAcceder ?? ""}
            onChange={v => set("comoAcceder", v)}
            placeholder="Ej: Presenta tu tarjeta de empleado en recepción"
            multiline
            rows={2}
            opcional
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo
              label="URL de información"
              name="urlInfo"
              value={form.urlInfo ?? ""}
              onChange={v => set("urlInfo", v)}
              placeholder="https://..."
              type="url"
            />
            <IconoPicker
              value={form.iconoUrl ?? ""}
              onChange={v => set("iconoUrl", v || null)}
            />
          </div>

          <Campo
            label="Fecha de caducidad"
            name="fechaFin"
            value={form.fechaFin ?? ""}
            onChange={v => set("fechaFin", v)}
            type="date"
            min={minFecha}
            max={maxFecha}
            hint="Sin fecha de caducidad, la ventaja estará activa indefinidamente"
            onClear={() => set("fechaFin", null)}
          />

          {/* Error */}
          {error && (
            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.07)", color: "#dc2626" }}>
              {error}
            </p>
          )}
        </form>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 shrink-0"
          style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}
        >
          <Button type="button" variant="secondary" onClick={cerrarSeguro} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="beneficio-form" disabled={guardando || !form.titulo?.trim()}>
            {guardando ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                </svg>
                Guardando…
              </>
            ) : (
              editando ? "Guardar cambios" : "Crear ventaja"
            )}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
