"use client";

import { useState } from "react";
import { crearIncidencia } from "@/lib/api/incidencias";
import type { IncidenciaInput } from "@/lib/types/incidencias";

const TIPOS = ["IT", "Mantenimiento", "RRHH", "Instalaciones", "Seguridad", "Otro"];
const PRIORIDADES = [
  { value: "baja", label: "Baja", color: "#6b7280" },
  { value: "media", label: "Media", color: "#d97706" },
  { value: "alta", label: "Alta", color: "#dc2626" },
];

interface Props {
  empresaId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormIncidencia({ empresaId, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<IncidenciaInput>({
    titulo: "", descripcion: "", tipo: "Otro", prioridad: "media", empresaId,
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setError("El título y la descripción son obligatorios");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      await crearIncidencia(form);
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Error al enviar la incidencia");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 relative" style={{ background: "var(--blanco)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--texto-primario)" }}>Reportar Incidencia</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Tipo</label>
            <select
              className="w-full p-2.5 rounded-lg border text-sm"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              style={{ borderColor: "var(--gris-borde)", background: "var(--blanco)" }}
            >
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Título</label>
            <input
              className="w-full p-2.5 rounded-lg border text-sm"
              placeholder="Resumen de la incidencia"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              style={{ borderColor: "var(--gris-borde)", background: "var(--blanco)" }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Prioridad</label>
            <div className="flex gap-3">
              {PRIORIDADES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${form.prioridad === p.value ? 'ring-2' : 'hover:opacity-80'}`}
                  style={{
                    background: form.prioridad === p.value ? `${p.color}15` : 'var(--blanco)',
                    borderColor: form.prioridad === p.value ? p.color : 'var(--gris-borde)',
                    color: p.color,
                  }}
                  onClick={() => setForm({ ...form, prioridad: p.value as any })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Descripción</label>
            <textarea
              className="w-full p-2.5 rounded-lg border text-sm"
              rows={4}
              placeholder="Describe el problema con detalle..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              style={{ borderColor: "var(--gris-borde)", background: "var(--blanco)" }}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--gris-superficie)", color: "var(--texto-primario)" }}>Cancelar</button>
            <button type="submit" disabled={cargando} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--azul-egm)", opacity: cargando ? 0.7 : 1 }}>
              {cargando ? "Enviando..." : "Enviar Incidencia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
