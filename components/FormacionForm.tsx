"use client";

import { useState } from "react";
import { Formacion, FormacionCategory } from "@/lib/types/formaciones";
import { crearFormacion, editarFormacion } from "@/lib/api/formaciones";

interface FormacionFormProps {
  editando?: Formacion | null;
  empresaId: string | undefined;
  onSave: () => void;
  onCancel: () => void;
}

const CATEGORIES: FormacionCategory[] = ["Onboarding", "Básica", "Específica"];

export default function FormacionForm({ editando, empresaId, onSave, onCancel }: FormacionFormProps) {
  const [form, setForm] = useState<Partial<Formacion>>(
    editando || {
      name: "",
      category: "Específica",
      description: "",
      pdfUrl: "",
    }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...form, empresa_id: empresaId ?? null };
      if (editando) {
        await editarFormacion(editando.id, payload);
      } else {
        await crearFormacion(payload);
      }
      onSave();
    } catch (err) {
      setError("Error al guardar la formación. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-800">
          {editando ? "Editar formación" : "Nueva formación"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Nombre del módulo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: PRL Avanzado, Identidad Corporativa..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Descripción / Objetivo
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="¿Qué aprenderá el empleado en este módulo?"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Categoría
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as FormacionCategory })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* PDF URL */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            URL del PDF (Material)
          </label>
          <input
            type="text"
            value={form.pdfUrl || ""}
            onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
            placeholder="https://ejemplo.com/material.pdf"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Error */}
        {error && <p className="md:col-span-2 text-xs text-red-500 mt-1">{error}</p>}

        {/* Acciones */}
        <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-50 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-900 text-white text-xs font-medium px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Guardando..." : "Guardar formación"}
          </button>
        </div>
      </form>
    </div>
  );
}
