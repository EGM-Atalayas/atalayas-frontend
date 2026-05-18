"use client";

import React, { useEffect, useState } from "react";
import { getEstadisticasSuperadmin, EstadisticasResponse } from "@/lib/api/estadisticas";
import { API_URL, apiFetch } from "@/lib/api";
import { exportStats, type ExportFormat, type StatsSection } from "@/lib/utils/statsExport";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList
} from "recharts";
import { FaChartPie } from "react-icons/fa";

const STORAGE_KEY = "egm_superadmin_stats_prefs";

const EstadisticasPage: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");

  const [statsRango, setStatsRango] = useState<3 | 6 | 12>(6);

  const [showKpis,        setShowKpis]        = useState(true);
  const [showCrecimiento, setShowCrecimiento] = useState(true);
  const [showSectores,    setShowSectores]    = useState(true);
  const [showUsuarios,    setShowUsuarios]    = useState(true);
  const [showPersonalizar, setShowPersonalizar] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EstadisticasResponse | null>(null);
  const [empresasData, setEmpresasData] = useState<any[] | null>(null);
  const [sectorModal, setSectorModal] = useState<{ visible: boolean; nombre: string; empresas: any[] }>({ visible: false, nombre: "", empresas: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.rango === 3 || p.rango === 6 || p.rango === 12) setStatsRango(p.rango);
        if (typeof p.showKpis === "boolean") setShowKpis(p.showKpis);
        if (typeof p.showCrecimiento === "boolean") setShowCrecimiento(p.showCrecimiento);
        if (typeof p.showSectores === "boolean") setShowSectores(p.showSectores);
        if (typeof p.showUsuarios === "boolean") setShowUsuarios(p.showUsuarios);
      }
    } catch { /* ignorar errores de localStorage */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        rango: statsRango, showKpis, showCrecimiento, showSectores, showUsuarios,
      }));
    } catch { /* ignorar errores de localStorage */ }
  }, [statsRango, showKpis, showCrecimiento, showSectores, showUsuarios]);

  const hayPersonalizacion =
    !showKpis || !showCrecimiento || !showSectores || !showUsuarios || statsRango !== 6;

  const resetVista = () => {
    setStatsRango(6);
    setShowKpis(true);
    setShowCrecimiento(true);
    setShowSectores(true);
    setShowUsuarios(true);
  };

  useEffect(() => {
    const fetchEstadisticas = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const stats = await getEstadisticasSuperadmin();
        setData(stats);
      } catch (err: any) {
        setError("No se pudieron cargar las estadísticas. Comprueba la conexión con el servidor.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEmpresas = async () => {
      try {
        const res = await apiFetch(`${API_URL}/empresas`);
        if (res.ok) {
          const empresas: any[] = await res.json();
          setEmpresasData(empresas);
        }
      } catch {
        // no es crítico, abriremos modal con carga bajo demanda si falla
      }
    };

    fetchEstadisticas();
    fetchEmpresas();
  }, []);

  const openSectorModal = async (sectorNombre: string) => {
    let empresasFiltradas: any[] = [];

    if (empresasData) {
      empresasFiltradas = empresasData.filter(
        (emp) =>
          emp.estadoSolicitud === "APROBADA" &&
          (emp.sector || emp.sectorEmpresa || emp.industria || "Otros") === sectorNombre
      );
    } else {
      try {
        const res = await apiFetch(`${API_URL}/empresas`);
        if (!res.ok) throw new Error("Error al obtener empresas");
        const empresas: any[] = await res.json();
        empresasFiltradas = empresas.filter(
          (emp) =>
            emp.estadoSolicitud === "APROBADA" &&
            (emp.sector || emp.sectorEmpresa || emp.industria || "Otros") === sectorNombre
        );
      } catch (err) {
        setToast("Error al cargar empresas del sector");
        setTimeout(() => setToast(null), 2500);
      }
    }

    setSectorModal({ visible: true, nombre: sectorNombre, empresas: empresasFiltradas });
  };

  const crecimientoFiltrado = data?.crecimiento.slice(-statsRango) ?? [];

  const handleExport = () => {
    if (!data) return;
    const sections: StatsSection[] = [
      {
        id: "crecimiento",
        title: `Crecimiento de empleados (últimos ${statsRango} meses)`,
        headers: ["Mes", "Empleados"],
        rows: crecimientoFiltrado.map((i) => [i.mes, i.empleados]),
      },
      {
        id: "sectores",
        title: "Empresas por sector",
        headers: ["Sector", "Cantidad"],
        rows: data.sectores.map((i) => [i.nombre, i.valor]),
      },
      {
        id: "usuarios",
        title: "Distribución de usuarios por rol",
        headers: ["Rol", "Cantidad"],
        rows: data.usuarios.map((i) => [i.rol, i.cantidad]),
      },
    ];
    exportStats(exportFormat, {
      title: "Reporte de Estadísticas — Superadmin",
      fileName: `estadisticas-superadmin-${new Date().toISOString().split("T")[0]}`,
      sections,
    });
    setToast("Reporte descargado correctamente");
    setTimeout(() => setToast(null), 2500);
  };

  const totalEmpresas = data?.sectores.reduce((s, x) => s + x.valor, 0) ?? 0;
  const totalEmpleados = data?.usuarios.find(u => u.rol === "Empleados")?.cantidad ?? 0;
  const totalSectores = data?.sectores.filter(s => s.nombre !== "Sin datos").length ?? 0;
  const totalUsuarios = data?.usuarios.reduce((s, x) => s + x.cantidad, 0) ?? 0;

  const allHidden = !showKpis && !showCrecimiento && !showSectores && !showUsuarios;

  if (error) {
    return (
      <div className="px-6 md:px-10 w-full max-w-[1400px] mx-auto mt-10">
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 text-sm shadow-sm">
          <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: "16px" }} />{error}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 w-full animate-fadeIn mt-6">

      {/* ── Barra de filtros y personalización ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
        {/* Rango temporal */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rango</span>
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
            {([3, 6, 12] as const).map((n) => (
              <button
                key={n}
                onClick={() => setStatsRango(n)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: statsRango === n ? "var(--azul-egm)" : "transparent",
                  color:      statsRango === n ? "white" : "var(--texto-muted)",
                }}
              >
                {n} meses
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* Export */}
        <div className="flex items-center gap-1.5">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            style={{ background: "white", color: "var(--texto-primario)" }}
            aria-label="Formato de exportación"
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
          </select>
          <button
            onClick={handleExport}
            disabled={!data}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--azul-egm)", color: "white" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar
          </button>
        </div>

        {/* Badge de personalización */}
        {hayPersonalizacion && (
          <button
            onClick={resetVista}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Restablecer vista por defecto"
          >
            Restablecer
          </button>
        )}

        {/* Botón personalizar */}
        <div className="relative">
          <button
            onClick={() => setShowPersonalizar((v) => !v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
            style={{
              background: showPersonalizar ? "var(--azul-egm)" : "var(--gris-superficie)",
              color:      showPersonalizar ? "white" : "var(--texto-primario)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            Personalizar
          </button>

          {/* Panel desplegable de personalización */}
          {showPersonalizar && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Mostrar secciones</p>
              {[
                { label: "KPIs resumen",            value: showKpis,        set: setShowKpis },
                { label: "Crecimiento de empleados", value: showCrecimiento, set: setShowCrecimiento },
                { label: "Empresas por sector",      value: showSectores,    set: setShowSectores },
                { label: "Distribución de usuarios", value: showUsuarios,    set: setShowUsuarios },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => set(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CABECERA */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 flex items-center gap-2">
            <FaChartPie className="text-blue-700" />
            Estadísticas y Analítica
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Métricas en tiempo real del parque empresarial.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
        </div>
      ) : !data ? (
        <div className="text-center py-20" style={{ color: "var(--texto-muted)" }}>
          No hay datos disponibles aún.
        </div>
      ) : allHidden ? (
        <div className="text-center py-20" style={{ color: "var(--texto-muted)" }}>
          <p className="text-sm mb-3">Todas las secciones están ocultas.</p>
          <button
            onClick={resetVista}
            className="text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "var(--azul-egm)", color: "white" }}
          >
            Restablecer vista
          </button>
        </div>
      ) : (
        <>

          {/* KPIs RÁPIDOS */}
          {showKpis && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Empresas",         value: totalEmpresas,              color: "text-blue-600"   },
              { label: "Empleados",        value: totalEmpleados,             color: "text-emerald-600" },
              { label: "Sectores",         value: totalSectores,              color: "text-violet-600"  },
              { label: "Usuarios Totales", value: totalUsuarios,              color: "text-amber-600"   },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          )}

          {/* CRECIMIENTO */}
          {showCrecimiento && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-lg font-bold text-slate-800">Crecimiento de Empleados</h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">Acumulado — últimos {statsRango} meses</p>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={crecimientoFiltrado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmpleados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" name="Empleados" dataKey="empleados" stroke="#3B82F6" strokeWidth={3} fill="url(#colorEmpleados)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* SECTORES */}
            {showSectores && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Empresas por Sector</h2>
                  <p className="text-xs text-slate-400">Solo empresas aprobadas</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {data?.sectores.length ?? 0} sectores
                </span>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
                <div className="h-[320px] rounded-3xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <Pie
                        data={data?.sectores}
                        cx="50%" cy="50%"
                        innerRadius="40%" outerRadius="72%"
                        paddingAngle={1}
                        dataKey="valor" nameKey="nombre"
                        stroke="#fff"
                        strokeWidth={1}
                      >
                        {data?.sectores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 max-h-[320px] overflow-y-auto">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-3">Leyenda</p>
                  <div className="grid gap-2">
                    {data?.sectores.map((entry, index) => (
                      <button
                        key={entry.nombre ?? index}
                        onClick={() => openSectorModal(entry.nombre)}
                        className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl bg-white p-3 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <div className="min-w-0 text-left">
                          <p className="text-sm font-semibold text-slate-900 truncate">{entry.nombre}</p>
                          <p className="text-[11px] text-slate-500">{entry.valor} empresas</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* USUARIOS POR ROL */}
            {showUsuarios && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Distribución de Usuarios por Rol</h2>
              <p className="text-xs text-slate-400 mb-6">Total de usuarios registrados en la plataforma</p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.usuarios} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="rol" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Bar dataKey="cantidad" radius={[10, 10, 0, 0]} barSize={50}>
                      {data?.usuarios.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList dataKey="cantidad" position="top" style={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }} dy={-5} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            )}

          </div>
        </>
      )}

      {/* Modal Sector */}
      {sectorModal.visible && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSectorModal({ ...sectorModal, visible: false })}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Empresas - {sectorModal.nombre}</h3>
              <button
                onClick={() => setSectorModal({ ...sectorModal, visible: false })}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {sectorModal.empresas.length > 0 ? (
                <div className="grid gap-3">
                  {sectorModal.empresas.map((emp) => (
                    <div
                      key={emp.empresaId || emp.id}
                      className="flex flex-col gap-1 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <p className="font-semibold text-slate-900">{emp.nombre || emp.nombreEmpresa}</p>
                      <p className="text-sm text-slate-600">{emp.cif || emp.nif || "—"}</p>
                      <p className="text-xs text-slate-500">{emp.localidad || emp.ciudad || "—"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">No hay empresas en este sector</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-3 flex justify-end">
              <button
                onClick={() => setSectorModal({ ...sectorModal, visible: false })}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-300 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ transform: "translateX(-50%)", background: "linear-gradient(135deg, #1b3f7e 0%, #2563eb 100%)", color: "#fff", animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
          <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(12px) scale(0.95); } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }`}</style>
        </div>
      )}
    </div>
  );
};

export default EstadisticasPage;
