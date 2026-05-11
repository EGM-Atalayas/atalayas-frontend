"use client";

import { useEffect, useState } from "react";
import { getIncidencias, cambiarEstadoIncidencia } from "@/lib/api/incidencias";
import type { Incidencia } from "@/lib/types/incidencias";
import { EmptyState } from "@/components/ui/EmptyState";

const ESTADOS = [
  { value: "ABIERTA", label: "Abierta", color: "#dc2626", bg: "#fee2e2" },
  { value: "EN_CURSO", label: "En curso", color: "#d97706", bg: "#fef3c7" },
  { value: "RESUELTA", label: "Resuelta", color: "#16a34a", bg: "#dcfce7" },
  { value: "CERRADA", label: "Cerrada", color: "#6b7280", bg: "#f3f4f6" },
];

const PRIORIDAD_COLORS: Record<string, string> = {
  NORMAL: "#6b7280",
  CRITICA: "#dc2626",
};

interface Props {
  empresaId?: string | null;
  esSuperadmin?: boolean;
}

export default function GestionIncidencias({ empresaId, esSuperadmin }: Props) {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<string>("todas");
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [esLocal, setEsLocal] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setErrorApi(null);
    try {
      const data = await getIncidencias(empresaId);
      setIncidencias(data);
      setEsLocal(data.length > 0 && data.some(i => i.incidenciaId.startsWith("inc-local-")));
    } catch (e: any) {
      setErrorApi(e.message || "Error al cargar incidencias");
      setIncidencias([]);
    } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, [empresaId]);

  const handleEstado = async (id: string, nuevoEstado: string) => {
    try {
      await cambiarEstadoIncidencia(id, nuevoEstado);
      setIncidencias(prev => prev.map(i => i.incidenciaId === id ? { ...i, estado: nuevoEstado as Incidencia['estado'] } : i));
    } catch (e: any) {
      alert(e.message || "Error al cambiar el estado de la incidencia");
    }
  };

  const filtradas = filtro === "todas" ? incidencias : incidencias.filter(i => i.estado === filtro);

  const formatFecha = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold" style={{ color: "var(--texto-primario)" }}>Incidencias</h3>
          {esLocal && (
            <span className="text-[10px] px-2 py-1 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" }}>
              Datos de desarrollo
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFiltro("todas")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filtro === "todas" ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Todas</button>
          {ESTADOS.map(e => (
            <button key={e.value} onClick={() => setFiltro(e.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filtro === e.value ? 'text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              style={filtro === e.value ? { background: e.color, borderColor: e.color } : {}}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} /></div>
      ) : errorApi ? (
        <div className="rounded-2xl flex flex-col items-center justify-center py-16 text-center" style={{ background: "var(--blanco)", border: "1px solid var(--error)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--error)" }}>{errorApi}</p>
          <button onClick={cargar} className="text-xs font-semibold mt-4 px-4 py-2 rounded-xl" style={{ background: "var(--error)", color: "white" }}>Reintentar</button>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="card">
          <EmptyState
            size="sm"
            title="No hay incidencias con este filtro"
            description="Prueba a cambiar el estado seleccionado."
            icon={
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map(inc => {
            const estadoConf = ESTADOS.find(e => e.value === inc.estado) || ESTADOS[0];
            return (
              <div key={inc.incidenciaId} className="rounded-xl p-4" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold truncate" style={{ color: "var(--texto-primario)" }}>{inc.titulo}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: estadoConf.bg, color: estadoConf.color }}>{estadoConf.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${PRIORIDAD_COLORS[inc.prioridad]}15`, color: PRIORIDAD_COLORS[inc.prioridad] }}>
                        {inc.prioridad.toUpperCase()}
                      </span>

                    </div>
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: "var(--texto-muted)" }}>{inc.descripcion}</p>
                    <div className="flex items-center gap-4 text-[11px]" style={{ color: "var(--texto-muted)" }}>
                      <span>Por: <strong style={{ color: "var(--texto-primario)" }}>{inc.nombreCreador}</strong></span>
                      {esSuperadmin && inc.nombreEmpresa && <span>Empresa: <strong style={{ color: "var(--texto-primario)" }}>{inc.nombreEmpresa}</strong></span>}
                      <span>{formatFecha(inc.creadoEn)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <select
                      value={inc.estado}
                      onChange={(e) => handleEstado(inc.incidenciaId, e.target.value)}
                      className="text-xs p-1.5 rounded-lg border font-semibold"
                      style={{ borderColor: "var(--gris-borde)", background: "var(--blanco)" }}
                    >
                      {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
