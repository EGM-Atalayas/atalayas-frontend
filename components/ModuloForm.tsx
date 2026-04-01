"use client";

import { useState } from "react";
import type { ModuloTipo } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { apiFetch, API_URL } from "@/lib/api";

interface ModuloFormProps {
  editando?: {
    moduloId: string;
    nombre: string;
    descripcion: string;
    tipoModulo: ModuloTipo;
  } | null;
  empresaId: string | undefined;
  onSave: () => void;
  onCancel: () => void;
}

const TIPOS: ModuloTipo[] = [
  "IDENTIDAD", "BASICA", "ESPECIFICA",
  "DESARROLLO", "RECOMPENSAS", "COMUNIDAD",
];

export default function ModuloForm({ editando, empresaId, onSave, onCancel }: ModuloFormProps) {
  const [form, setForm] = useState({
    nombre: editando?.nombre ?? "",
    descripcion: editando?.descripcion ?? "",
    tipoModulo: editando?.tipoModulo ?? ("ESPECIFICA" as ModuloTipo),
    orden: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...form, empresaId: empresaId ?? null };
      const url = editando
        ? `${API_URL}/modulos/${editando.moduloId}`
        : `${API_URL}/modulos`;
      const method = editando ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      onSave();
    } catch {
      setError("Error al guardar el módulo. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-800">
          {editando ? "Editar módulo" : "Nuevo módulo"}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 text-lg leading-none">
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Nombre del módulo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: PRL Avanzado, Identidad Corporativa..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Descripción / Objetivo
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="¿Qué aprenderá el empleado en este módulo?"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo</label>
          <select
            value={form.tipoModulo}
            onChange={(e) => setForm({ ...form, tipoModulo: e.target.value as ModuloTipo })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 bg-white"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>{MODULO_TIPO_LABEL[t]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Orden</label>
          <input
            type="number"
            min={0}
            value={form.orden}
            onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {error && <p className="md:col-span-2 text-xs text-red-500">{error}</p>}

        <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-50 mt-2">
          <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-900 text-white text-xs font-medium px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Guardando..." : "Guardar módulo"}
          </button>
        </div>
      </form>
    </div>
  );
}