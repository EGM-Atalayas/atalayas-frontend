"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSugerencias, type Sugerencia, type EstadoSugerencia } from "@/lib/api/sugerencias";
import { MessageSquare, Inbox } from "lucide-react";
const ESTADO_LABEL: Record<EstadoSugerencia, string> = {
  PENDIENTE: "Pendiente",
  VISTA: "Vista",
  RESUELTA: "Resuelta",
};
const ESTADO_COLOR: Record<EstadoSugerencia, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  VISTA: "bg-blue-50 text-blue-700 border-blue-200",
  RESUELTA: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
function formatFecha(iso: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}
export default function SugerenciasAdminPanel() {
  const [filtroDestino, setFiltroDestino] = useState<"TODAS" | "EMPRESA" | "EGM">("TODAS");
  const [filtroEstado, setFiltroEstado] = useState<"TODAS" | EstadoSugerencia>("TODAS");
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["sugerencias"],
    queryFn: getSugerencias,
    staleTime: 60_000,
  });
  const filtradas = data.filter((s) => {
    const destOk = filtroDestino === "TODAS" || s.destinatario === filtroDestino;
    const estadoOk = filtroEstado === "TODAS" || s.estado === filtroEstado;
    return destOk && estadoOk;
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {(["TODAS", "EMPRESA", "EGM"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFiltroDestino(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filtroDestino === d
                  ? "bg-[var(--azul-egm)] text-white border-transparent"
                  : "bg-white text-[var(--texto-secundario)] border-[var(--gris-borde)] hover:border-[var(--azul-egm)]"
              }`}
            >
              {d === "TODAS" ? "Todas" : d === "EMPRESA" ? "Para mi empresa" : "Para EGM"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["TODAS", "PENDIENTE", "VISTA", "RESUELTA"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filtroEstado === e
                  ? "bg-[var(--azul-egm)] text-white border-transparent"
                  : "bg-white text-[var(--texto-secundario)] border-[var(--gris-borde)] hover:border-[var(--azul-egm)]"
              }`}
            >
              {e === "TODAS" ? "Todos los estados" : ESTADO_LABEL[e]}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-[var(--texto-muted)]">
          <div className="w-8 h-8 border-4 rounded-full animate-spin border-[var(--gris-superficie)] border-t-[var(--azul-egm)]" />
        </div>
      ) : error ? (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-4">
          No se pudieron cargar las sugerencias.
        </div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--texto-muted)]">
          <Inbox size={36} strokeWidth={1.3} />
          <p className="text-sm">No hay sugerencias con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((s) => (
            <div key={s.sugerenciaId} className="card p-5 flex gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-9 h-9 rounded-full bg-[var(--azul-egm-light)] flex items-center justify-center">
                  <MessageSquare size={16} className="text-[var(--azul-egm)]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-[var(--texto-primario)]">{s.nombreUsuario}</span>
                  <span className="text-xs text-[var(--texto-placeholder)]">·</span>
                  <span className="text-xs text-[var(--texto-muted)]">{s.emailUsuario}</span>
                  <span className="text-xs text-[var(--texto-placeholder)]">·</span>
                  <span className="text-xs text-[var(--texto-muted)]">{formatFecha(s.creadoEn)}</span>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_COLOR[s.estado]}`}>
                    {ESTADO_LABEL[s.estado]}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[var(--gris-borde)] text-[var(--texto-muted)] bg-[var(--gris-superficie)]">
                    → {s.destinatario === "EMPRESA" ? "Empresa" : "EGM"}
                  </span>
                </div>
                <p className="text-sm text-[var(--texto-secundario)] leading-relaxed">{s.mensaje}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
