"use client";

// ============================================================
// ModalEvento — formulario reutilizable para crear o editar un
// evento de comunidad. Usado en EventosAdminTab y en la vista
// /dashboard/eventos.
// ============================================================

import { useState } from "react";
import { Calendar, X, Loader2, MapPin, Search, Check } from "lucide-react";
import {
  crearEventoComunidad,
  actualizarEventoComunidad,
  type ComunidadEvento,
  type ComunidadEventoInput,
} from "@/lib/api/comunidad";
import { buscarDireccion, type GeocodingResult } from "@/lib/geocoding";
import { MapaUbicacion } from "./MapaUbicacion";

interface Props {
  /** Si es null → modo creación; si tiene datos → modo edición */
  evento:       ComunidadEvento | null;
  /** Sólo los ROLE_ADMIN (superadmin) pueden marcar eventos como globales */
  esSuperAdmin: boolean;
  onClose:      () => void;
  onGuardado:   (evento: ComunidadEvento) => void;
}

export function ModalEvento({ evento, esSuperAdmin, onClose, onGuardado }: Props) {
  const esNuevo = !evento;

  // Convertir ISO con timezone a formato datetime-local (YYYY-MM-DDTHH:mm)
  const isoToLocal = (iso: string | null | undefined): string => {
    if (!iso) return "";
    const d = new Date(iso);
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  };

  const [titulo,      setTitulo]      = useState(evento?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(evento?.descripcion ?? "");
  const [fechaInicio, setFechaInicio] = useState(isoToLocal(evento?.fechaInicio));
  const [fechaFin,    setFechaFin]    = useState(isoToLocal(evento?.fechaFin));
  const [esGlobal,    setEsGlobal]    = useState(evento?.esGlobal ?? false);
  const [enviando,    setEnviando]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // ── Ubicación ──────────────────────────────────────────────
  const [lugar,    setLugar]    = useState(evento?.lugar ?? "");
  const [latitud,  setLatitud]  = useState<number | null>(evento?.latitud ?? null);
  const [longitud, setLongitud] = useState<number | null>(evento?.longitud ?? null);
  const [buscandoMapa, setBuscandoMapa] = useState(false);
  const [resultadosMapa, setResultadosMapa] = useState<GeocodingResult[]>([]);
  const [erroresMapa, setErroresMapa] = useState<string | null>(null);

  const buscar = async () => {
    if (!lugar.trim()) return;
    setBuscandoMapa(true);
    setErroresMapa(null);
    setResultadosMapa([]);
    try {
      const res = await buscarDireccion(lugar, 5);
      if (res.length === 0) setErroresMapa("Sin resultados — prueba con más detalles");
      else setResultadosMapa(res);
    } finally {
      setBuscandoMapa(false);
    }
  };

  const seleccionar = (r: GeocodingResult) => {
    setLatitud(r.latitud);
    setLongitud(r.longitud);
    setLugar(r.etiqueta);
    setResultadosMapa([]);
  };

  const limpiarUbicacion = () => {
    setLatitud(null);
    setLongitud(null);
    setLugar("");
    setResultadosMapa([]);
    setErroresMapa(null);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !fechaInicio) {
      setError("Título y fecha de inicio son obligatorios");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const payload: ComunidadEventoInput = {
        titulo:      titulo.trim(),
        descripcion: descripcion.trim() || null,
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin:    fechaFin ? new Date(fechaFin).toISOString() : null,
        lugar:       lugar.trim() || null,
        latitud,
        longitud,
        ...(esSuperAdmin && { esGlobal }),
      };
      const guardado = esNuevo
        ? await crearEventoComunidad(payload)
        : await actualizarEventoComunidad(evento!.eventoId, payload);
      onGuardado(guardado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-700" />
            {esNuevo ? "Crear evento" : "Editar evento"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={enviar} className="px-6 py-5 flex flex-col gap-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={150}
              required
              placeholder="Ej: Jornada de Networking EGM"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Descripción</label>
            <textarea
              value={descripcion ?? ""}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Detalles, lugar, ponentes, etc."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-slate-400 text-right mt-1">{(descripcion ?? "").length}/500</p>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fin (opcional)</label>
              <input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Ubicación (opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ubicación (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lugar ?? ""}
                onChange={(e) => setLugar(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscar(); } }}
                placeholder="Ej: Edificio Central EGM Atalayas, Alicante"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={buscar}
                disabled={!lugar.trim() || buscandoMapa}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                title="Buscar en el mapa"
              >
                {buscandoMapa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Buscar
              </button>
            </div>

            {/* Resultados de búsqueda */}
            {resultadosMapa.length > 0 && (
              <ul className="mt-2 border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                {resultadosMapa.map((r, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => seleccionar(r)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-start gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{r.etiqueta}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {erroresMapa && (
              <p className="mt-1.5 text-xs text-amber-700">{erroresMapa}</p>
            )}

            {/* Preview del mapa cuando hay coordenadas */}
            {latitud !== null && longitud !== null && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-emerald-700 inline-flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Ubicación seleccionada
                  </p>
                  <button
                    type="button"
                    onClick={limpiarUbicacion}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
                <MapaUbicacion
                  latitud={latitud}
                  longitud={longitud}
                  etiqueta={lugar ?? undefined}
                  alturaPx={180}
                />
              </div>
            )}
          </div>

          {/* Global (solo superadmin) */}
          {esSuperAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={esGlobal}
                onChange={(e) => setEsGlobal(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-700">
                Visible para <strong>todas las empresas</strong> (evento global EGM)
              </span>
            </label>
          )}

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: "var(--azul-egm)", color: "#fff" }}
            >
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {esNuevo ? "Crear evento" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
