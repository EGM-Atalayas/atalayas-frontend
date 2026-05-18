"use client";

// ============================================================
// EventosAdminTab — tab del panel admin para gestionar eventos
// de comunidad. Lista, crea y desactiva eventos.
// ============================================================

import { useEffect, useState } from "react";
import {
  Calendar, Plus, X, Trash2, Pencil, Loader2, MapPin, Clock, Globe2, Building2,
} from "lucide-react";
import {
  getEventosComunidad,
  crearEventoComunidad,
  actualizarEventoComunidad,
  desactivarEventoComunidad,
  type ComunidadEvento,
  type ComunidadEventoInput,
} from "@/lib/api/comunidad";

interface Props {
  /** Si quien usa el panel es ROLE_ADMIN (superadmin) → puede marcar eventos como globales */
  esSuperAdmin?: boolean;
}

export function EventosAdminTab({ esSuperAdmin = false }: Props) {
  const [eventos, setEventos]   = useState<ComunidadEvento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<ComunidadEvento | null>(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getEventosComunidad();
      // Ordenar: futuros primero (asc), pasados al final (desc)
      const ahora = Date.now();
      const ordenados = [...data].sort((a, b) => {
        const ta = new Date(a.fechaInicio).getTime();
        const tb = new Date(b.fechaInicio).getTime();
        const fa = ta >= ahora, fb = tb >= ahora;
        if (fa && !fb) return -1;
        if (!fa && fb) return 1;
        return fa ? ta - tb : tb - ta;
      });
      setEventos(ordenados);
    } catch {
      setError("Error al cargar eventos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleDesactivar = async (ev: ComunidadEvento) => {
    if (!confirm(`¿Desactivar el evento "${ev.titulo}"?`)) return;
    try {
      await desactivarEventoComunidad(ev.eventoId);
      setEventos((prev) => prev.filter((e) => e.eventoId !== ev.eventoId));
    } catch {
      alert("No se pudo desactivar el evento");
    }
  };

  const handleGuardado = () => {
    setModalAbierto(false);
    setEditando(null);
    cargar();
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-700" />
            Eventos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea y gestiona los eventos visibles para los empleados {esSuperAdmin ? "(puedes marcarlos como globales EGM)" : "de tu empresa"}
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: "var(--azul-egm)", color: "#fff" }}
        >
          <Plus className="w-4 h-4" />
          Crear evento
        </button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-red-600">{error}</div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Aún no hay eventos</p>
          <p className="text-xs text-slate-500 mt-1">Crea el primero pulsando &quot;Crear evento&quot;</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {eventos.map((ev) => {
            const fechaIni = new Date(ev.fechaInicio);
            const esFuturo = fechaIni.getTime() >= Date.now();
            const acento   = ev.esGlobal ? "var(--azul-egm)" : "var(--verde-oliva)";
            return (
              <li key={ev.eventoId}
                className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/20 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Bloque fecha */}
                  <div className="shrink-0 w-14 rounded-xl py-2 text-center"
                    style={{ background: esFuturo ? "var(--azul-egm-light)" : "var(--gris-superficie)" }}>
                    <p className="text-lg font-bold leading-none"
                      style={{ color: esFuturo ? "var(--azul-egm)" : "var(--texto-muted)" }}>
                      {fechaIni.getDate()}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider mt-0.5"
                      style={{ color: esFuturo ? "var(--azul-egm)" : "var(--texto-muted)" }}>
                      {fechaIni.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: ev.esGlobal ? "var(--azul-egm-light)" : "var(--verde-oliva-light)", color: acento }}>
                        {ev.esGlobal ? <Globe2 className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {ev.esGlobal ? "EGM Global" : "Tu empresa"}
                      </span>
                      {!esFuturo && (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-500">
                          Finalizado
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-800 truncate">{ev.titulo}</p>
                    {ev.descripcion && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ev.descripcion}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {fechaIni.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {ev.fechaFin && ` – ${new Date(ev.fechaFin).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => { setEditando(ev); setModalAbierto(true); }}
                      title="Editar"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDesactivar(ev)}
                      title="Desactivar"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-100 text-red-500 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modalAbierto && (
        <ModalEvento
          evento={editando}
          esSuperAdmin={esSuperAdmin}
          onClose={() => { setModalAbierto(false); setEditando(null); }}
          onGuardado={handleGuardado}
        />
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// ModalEvento — form de creación/edición
// ────────────────────────────────────────────────────────────

function ModalEvento({ evento, esSuperAdmin, onClose, onGuardado }: {
  evento:        ComunidadEvento | null;
  esSuperAdmin:  boolean;
  onClose:       () => void;
  onGuardado:    () => void;
}) {
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
        ...(esSuperAdmin && { esGlobal }),
      };
      if (esNuevo) {
        await crearEventoComunidad(payload);
      } else {
        await actualizarEventoComunidad(evento!.eventoId, payload);
      }
      onGuardado();
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
