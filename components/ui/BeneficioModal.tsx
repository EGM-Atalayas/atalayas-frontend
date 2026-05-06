"use client";

import { useEffect, useRef, useState } from "react";
import type { Beneficio, BeneficioInput } from "@/lib/types/beneficios";

interface Props {
  inicial:   Beneficio | null;               // null = crear, Beneficio = editar
  onGuardar: (data: BeneficioInput) => Promise<void>;
  onCerrar:  () => void;
}

const CAMPO_BASE =
  "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-150 border";

const estiloInput = (foco: boolean) => ({
  borderColor:  foco ? "var(--azul-egm)"         : "rgba(0,0,0,0.12)",
  boxShadow:    foco ? "0 0 0 3px rgba(22,50,105,0.08)" : "none",
  background:   "#ffffff",
  color:        "#111827",
});

// ── Componente campo de texto ─────────────────────────────────────────────────
function Campo({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  multiline,
  rows = 3,
}: {
  label:       string;
  name:        string;
  value:       string;
  onChange:    (val: string) => void;
  placeholder?: string;
  required?:   boolean;
  type?:       string;
  multiline?:  boolean;
  rows?:       number;
}) {
  const [foco, setFoco] = useState(false);

  const shared = {
    id:          name,
    value,
    onChange:    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onFocus:     () => setFoco(true),
    onBlur:      () => setFoco(false),
    placeholder: placeholder ?? "",
    className:   CAMPO_BASE,
    style:       estiloInput(foco),
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-semibold" style={{ color: "#374151" }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: "#ef4444" }}>*</span>}
      </label>
      {multiline ? (
        <textarea {...shared} rows={rows} style={{ ...shared.style, resize: "vertical", minHeight: "72px" }} />
      ) : (
        <input {...shared} type={type} />
      )}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export default function BeneficioModal({ inicial, onGuardar, onCerrar }: Props) {
  const editando = inicial !== null;

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

  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

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
    if (e.target === overlayRef.current) onCerrar();
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
        // Convierte YYYY-MM-DD → ISO 8601 con offset 0 para que el backend lo parsee
        fechaFin:    form.fechaFin
          ? `${form.fechaFin}T23:59:59Z`
          : null,
      };
      await onGuardar(payload);
    } catch (err) {
      console.error("[BeneficioModal] Error al guardar:", err);
      setError("No se pudo guardar la ventaja. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={onOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
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
          className="flex items-center justify-between px-5 sm:px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#ffffff" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "#111827" }}>
            {editando ? "Editar ventaja" : "Nueva ventaja"}
          </h2>
          <button
            onClick={onCerrar}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ color: "#9ca3af", background: "transparent", transition: "background 0.12s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            aria-label="Cerrar"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Formulario (scrollable) ── */}
        <form
          id="beneficio-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-5 sm:px-6 py-5 overflow-y-auto"
          style={{ flex: 1 }}
        >
          <Campo
            label="Título"
            name="titulo"
            value={form.titulo ?? ""}
            onChange={v => set("titulo", v)}
            placeholder="Ej: Descuento en gimnasio"
            required
          />

          <Campo
            label="Descripción"
            name="descripcion"
            value={form.descripcion ?? ""}
            onChange={v => set("descripcion", v)}
            placeholder="Breve descripción de la ventaja"
            multiline
            rows={3}
          />

          <Campo
            label="Cómo acceder"
            name="comoAcceder"
            value={form.comoAcceder ?? ""}
            onChange={v => set("comoAcceder", v)}
            placeholder="Ej: Presenta tu tarjeta de empleado en recepción"
            multiline
            rows={2}
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
            <Campo
              label="URL del icono / logo"
              name="iconoUrl"
              value={form.iconoUrl ?? ""}
              onChange={v => set("iconoUrl", v)}
              placeholder="https://..."
              type="url"
            />
          </div>

          <Campo
            label="Fecha de caducidad"
            name="fechaFin"
            value={form.fechaFin ?? ""}
            onChange={v => set("fechaFin", v)}
            type="date"
          />

          {/* Vista previa icono */}
          {form.iconoUrl && (
            <div className="flex items-center gap-3">
              <img
                src={form.iconoUrl}
                alt="Vista previa icono"
                className="w-10 h-10 rounded-xl object-contain"
                style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#f3f4f6" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="text-xs" style={{ color: "#9ca3af" }}>Vista previa del icono</span>
            </div>
          )}

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
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "transparent",
              color:      "#6b7280",
              border:     "1px solid rgba(0,0,0,0.12)",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="beneficio-form"
            disabled={guardando || !form.titulo?.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{
              background:  guardando || !form.titulo?.trim()
                ? "rgba(22,50,105,0.4)"
                : "var(--azul-egm)",
              transition:  "opacity 0.15s ease, background 0.15s ease",
              cursor:      guardando || !form.titulo?.trim() ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!guardando && form.titulo?.trim()) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
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
          </button>
        </div>
      </div>
    </div>
  );
}
