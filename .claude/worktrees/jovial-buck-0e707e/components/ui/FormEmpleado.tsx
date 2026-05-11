"use client";

import { useState, useEffect } from "react";
import type { NuevoEmpleadoForm } from "@/app/dashboard/admin/page";

interface FormEmpleadoProps {
  form: NuevoEmpleadoForm;
  setForm: (form: NuevoEmpleadoForm) => void;
  onSubmit: () => void;
  onClose: () => void;
  submitting: boolean;
  error: string | null;
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

  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 160, background: "rgba(0,0,0,0.52)", padding: "16px" }}
      onClick={onClose}>
      <div className="relative w-full flex flex-col"
        style={{
          maxWidth: 520,
          background: "var(--gris-fondo)",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #1b3f7e, #0d1b2e)" }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-white text-2xl font-bold">Añadir nuevo empleado</h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Crea una cuenta para un nuevo miembro</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white bg-opacity-10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-8">
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full rounded-xl px-4 py-3 border border-gray-300" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl px-4 py-3 border border-gray-300" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2">Contraseña *</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl px-4 py-3 border border-gray-300" />
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-50">
              {submitting ? <span className="loading-dots">Creando</span> : "Crear empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
