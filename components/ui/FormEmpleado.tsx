"use client";

import { useState, useEffect } from "react";
import type { NuevoEmpleadoForm } from "@/lib/types/usuario";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import Grainient from "@/components/ui/Grainient";

interface FormEmpleadoProps {
  form: NuevoEmpleadoForm;
  setForm: (form: NuevoEmpleadoForm) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
  error: string | null;
}

const TAB_COLOR    = "#1b3f7e";
const inputCls     = "w-full text-sm rounded-lg outline-none border transition-all duration-150";
const inputSty: React.CSSProperties = {
  height: 44, paddingLeft: 14, paddingRight: 14,
  borderColor: "rgba(0,0,0,0.12)", background: "#ffffff",
  color: "var(--texto-primario)", cursor: "text",
};
const labelCls = "block text-sm font-semibold mb-1.5";
const labelSty: React.CSSProperties = { color: "var(--texto-label)" };

function onFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = TAB_COLOR;
  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(27,63,126,0.10)";
}
function onBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)";
  e.currentTarget.style.boxShadow   = "none";
}

export default function FormEmpleado({
  form, setForm, onSubmit, onClose, submitting, error,
}: FormEmpleadoProps) {
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) return;
    onSubmit();
  };

  const nombreError   = touched && !form.nombre.trim();
  const emailError    = touched && !form.email.trim();
  const passwordError = touched && !form.password.trim();
  const canSubmit     = form.nombre.trim() && form.email.trim() && form.password.trim();

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex: 160, background: "rgba(0,0,0,0.50)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "#ffffff", maxHeight: "92dvh", boxShadow: "0 28px 64px rgba(0,0,0,0.22)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="relative flex items-center justify-between px-5 sm:px-6 shrink-0 overflow-hidden"
          style={{ paddingTop: 20, paddingBottom: 20, background: TAB_COLOR }}
        >
          <div className="absolute inset-0">
            <Grainient
              color1={TAB_COLOR} color2="#2a5298" color3="#0d1b2e"
              timeSpeed={0.18} warpStrength={1.1} warpFrequency={4.0}
              warpSpeed={1.4} warpAmplitude={55} grainAmount={0.07}
            />
          </div>
          <div className="relative z-10 flex flex-col gap-0.5">
            <h2 className="text-2xl font-bold" style={{ color: "#ffffff" }}>Añadir empleado</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>Crea una cuenta para un nuevo miembro</p>
          </div>
          <div className="relative z-10">
            <IconButton variant="glass" label="Cerrar" onClick={onClose} />
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 bg-white" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Nombre */}
          <div>
            <label className={labelCls} style={labelSty}>
              Nombre <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              type="text" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: María García"
              className={inputCls}
              style={{ ...inputSty, borderColor: nombreError ? "var(--error)" : "rgba(0,0,0,0.12)" }}
              onFocus={onFocus} onBlur={onBlur}
            />
            {nombreError && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>El nombre es obligatorio</p>}
          </div>

          {/* Email */}
          <div>
            <label className={labelCls} style={labelSty}>
              Email <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="empleado@empresa.com"
              className={inputCls}
              style={{ ...inputSty, borderColor: emailError ? "var(--error)" : "rgba(0,0,0,0.12)" }}
              onFocus={onFocus} onBlur={onBlur}
            />
            {emailError && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>El email es obligatorio</p>}
          </div>

          {/* Contraseña */}
          <div>
            <label className={labelCls} style={labelSty}>
              Contraseña <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className={inputCls}
              style={{ ...inputSty, borderColor: passwordError ? "var(--error)" : "rgba(0,0,0,0.12)" }}
              onFocus={onFocus} onBlur={onBlur}
            />
            {passwordError && <p className="text-xs mt-1" style={{ color: "var(--error)" }}>La contraseña es obligatoria</p>}
          </div>

          {/* Error global */}
          {error && (
            <p className="text-sm px-4 py-3 rounded-xl" style={{ background: "var(--error-light)", color: "var(--error)" }}>
              {error}
            </p>
          )}
        </form>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-3 shrink-0"
          style={{ borderTop: "1px solid rgba(0,0,0,0.08)", background: "#ffffff" }}
        >
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary" size="md"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit as any}
            style={{ minWidth: 140 }}
          >
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creando…</>
              : "Crear empleado"}
          </Button>
        </div>
      </div>
    </div>
  );
}
