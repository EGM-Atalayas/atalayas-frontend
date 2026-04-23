"use client";

import { useState, useRef } from "react";
import type { ModuloTipo } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { apiFetch, API_URL } from "@/lib/api";
import { subirImagenModulo } from "@/lib/supabase";

interface ModuloFormProps {
  editando?: {
    moduloId: string;
    nombre: string;
    descripcion: string;
    tipoModulo: ModuloTipo;
    audiencia?: string;
    imagenPortadaUrl?: string | null;
    activo?: boolean;
  } | null;
  empresaId: string | undefined;
  onSave: () => void;
  onCancel: () => void;
}

const TIPOS: { value: ModuloTipo; label: string }[] = [
  { value: "IDENTIDAD",   label: MODULO_TIPO_LABEL["IDENTIDAD"] },
  { value: "BASICA",      label: MODULO_TIPO_LABEL["BASICA"] },
  { value: "ESPECIFICA",  label: MODULO_TIPO_LABEL["ESPECIFICA"] },
  { value: "DESARROLLO",  label: MODULO_TIPO_LABEL["DESARROLLO"] },
  { value: "RECOMPENSAS", label: MODULO_TIPO_LABEL["RECOMPENSAS"] },
  { value: "COMUNIDAD",   label: MODULO_TIPO_LABEL["COMUNIDAD"] },
];

const CS = { border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" };

export default function ModuloForm({ editando, empresaId, onSave, onCancel }: ModuloFormProps) {
  const [nombre,      setNombre]      = useState(editando?.nombre      ?? "");
  const [descripcion, setDescripcion] = useState(editando?.descripcion ?? "");
  const [tipoModulo,  setTipoModulo]  = useState<ModuloTipo>(editando?.tipoModulo ?? "ESPECIFICA");
  const [audiencia,   setAudiencia]   = useState(editando?.audiencia   ?? "todos");
  const [activo,      setActivo]      = useState(editando?.activo      ?? true);
  const [portadaUrl,  setPortadaUrl]  = useState(editando?.imagenPortadaUrl ?? "");
  const [portadaPreview, setPortadaPreview] = useState(editando?.imagenPortadaUrl ?? "");
  const [portadaFile, setPortadaFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const inputPortadaRef = useRef<HTMLInputElement>(null);

  const handlePortada = (file: File) => {
    setPortadaFile(file);
    setPortadaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es obligatorio"); return; }
    setSubmitting(true); setError(null);
    try {
      let imagenPortadaUrl = portadaUrl;
      if (portadaFile) {
        imagenPortadaUrl = await subirImagenModulo(portadaFile, editando?.moduloId ?? "nuevo");
      }

      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        tipoModulo,
        audiencia,
        activo,
        imagenPortadaUrl: imagenPortadaUrl || null,
        empresaId: empresaId ?? null,
        // Preservar campos IA si existen
        ...(editando && {
          esEspecializadoIa: false,
          orden: 0,
        }),
      };

      const url    = editando ? `${API_URL}/modulos/${editando.moduloId}` : `${API_URL}/modulos`;
      const method = editando ? "PUT" : "POST";
      const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? "Error al guardar"); }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el módulo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>
            {editando ? "Editar módulo" : "Nuevo módulo"}
          </h2>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--texto-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--gris-borde)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>
              Nombre <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: PRL Avanzado, Bienvenida..."
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={CS} />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>
              Descripción
            </label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="¿Qué aprenderá el empleado en este módulo?"
              rows={3} className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
              style={CS} />
          </div>

          {/* Categoría + Visibilidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                Categoría
              </label>
              <select value={tipoModulo} onChange={e => setTipoModulo(e.target.value as ModuloTipo)}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                style={CS}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                Visibilidad
              </label>
              <select value={audiencia} onChange={e => setAudiencia(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl outline-none cursor-pointer"
                style={CS}>
                <option value="todos">Todos los empleados</option>
                <option value="administradores">Solo administradores</option>
                <option value="departamento">Por departamento</option>
              </select>
            </div>
          </div>

          {/* Estado activo */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Módulo activo</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                {activo ? "Visible para los empleados" : "Oculto para los empleados"}
              </p>
            </div>
            <button type="button" onClick={() => setActivo(!activo)}
              className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
              style={{ background: activo ? "var(--verde-oliva)" : "var(--gris-borde)" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: activo ? "translateX(20px)" : "translateX(2px)" }} />
            </button>
          </div>

          {/* Imagen portada */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--texto-secundario)" }}>
              Imagen de portada
            </label>
            <input ref={inputPortadaRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePortada(f); }} />

            {portadaPreview ? (
              <div className="relative rounded-xl overflow-hidden" style={{ height: 120 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={portadaPreview} alt="Portada" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2"
                  style={{ background: "rgba(0,0,0,0.35)" }}>
                  <button type="button" onClick={() => inputPortadaRef.current?.click()}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.9)", color: "#111" }}>
                    Cambiar
                  </button>
                  <button type="button" onClick={() => { setPortadaPreview(""); setPortadaUrl(""); setPortadaFile(null); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(239,68,68,0.85)", color: "#fff" }}>
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => inputPortadaRef.current?.click()}
                className="w-full py-6 rounded-xl flex flex-col items-center gap-2 transition-colors"
                style={{ border: "2px dashed var(--gris-borde)", color: "var(--texto-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--azul-egm)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--gris-borde)")}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">Haz clic para subir imagen</span>
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--error-light)", color: "var(--error)" }}>
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid var(--gris-borde)" }}>
            <button type="button" onClick={onCancel}
              className="text-sm px-4 py-2 rounded-xl transition-colors"
              style={{ color: "var(--texto-muted)" }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="text-sm font-bold px-5 py-2 rounded-xl transition-all"
              style={{
                background: submitting ? "var(--gris-borde)" : "linear-gradient(135deg,var(--azul-egm),#A3B535)",
                color: submitting ? "var(--texto-muted)" : "#fff",
                boxShadow: submitting ? "none" : "0 4px 12px rgba(0,82,204,0.25)",
              }}>
              {submitting ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
