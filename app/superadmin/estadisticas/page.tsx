"use client";

import React, { useState, useEffect } from "react";
import { getEstadisticasSuperadmin, EstadisticasResponse } from "@/lib/api/estadisticas";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList
} from "recharts";
import { FaChartPie } from "react-icons/fa";

const EstadisticasPage: React.FC = () => {
  const [data, setData]           = useState<EstadisticasResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"xml" | "csv" | "pdf">("pdf");

  useEffect(() => {
    const fetchEstadisticas = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const stats = await getEstadisticasSuperadmin();
        setData(stats);
      } catch (err: any) {
        console.error("[Estadísticas] Error:", err);
        setError("No se pudieron cargar las estadísticas. Comprueba la conexión con el servidor.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEstadisticas();
  }, []);

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const buildXml = (stats: EstadisticasResponse) => {
    const crecimientoXml = stats.crecimiento
      .map(i => `    <mes nombre="${i.mes}" empleados="${i.empleados}" empresas="${i.empresas}" />`)
      .join("\n");
    const sectoresXml = stats.sectores
      .map(i => `    <sector nombre="${i.nombre}" valor="${i.valor}" color="${i.color}" />`)
      .join("\n");
    const usuariosXml = stats.usuarios
      .map(i => `    <usuario rol="${i.rol}" cantidad="${i.cantidad}" color="${i.color}" />`)
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<estadisticas_superadmin>
  <crecimiento>\n${crecimientoXml}\n  </crecimiento>
  <sectores>\n${sectoresXml}\n  </sectores>
  <usuarios>\n${usuariosXml}\n  </usuarios>
</estadisticas_superadmin>`;
  };

  const buildCsv = (stats: EstadisticasResponse) => [
    "tipo,categoria,valor_1,valor_2",
    ...stats.crecimiento.map(i => `crecimiento,${i.mes},${i.empleados},${i.empresas}`),
    ...stats.sectores.map(i    => `sector,${i.nombre},${i.valor},${i.color}`),
    ...stats.usuarios.map(i    => `usuario,${i.rol},${i.cantidad},${i.color}`),
  ].join("\n");

  const exportAsPdf = (stats: EstadisticasResponse) => {
    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) return;
    const fecha = new Date().toLocaleString("es-ES");
    w.document.write(`
      <html><head><title>Estadísticas Superadmin</title>
      <style>body{font-family:Arial,sans-serif;margin:24px;color:#0f172a}
      h1{font-size:22px}h2{margin-top:24px;font-size:18px}p{color:#475569}
      table{border-collapse:collapse;width:100%;margin-top:16px}
      th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#f8fafc}
      </style></head><body>
      <h1>Reporte de Estadísticas (Superadmin)</h1><p>Fecha: ${fecha}</p>
      <h2>Crecimiento de la plataforma</h2>
      <table><thead><tr><th>Mes</th><th>Empleados</th><th>Empresas</th></tr></thead>
      <tbody>${stats.crecimiento.map(i=>`<tr><td>${i.mes}</td><td>${i.empleados}</td><td>${i.empresas}</td></tr>`).join("")}</tbody></table>
      <h2>Empresas por sector</h2>
      <table><thead><tr><th>Sector</th><th>Cantidad</th></tr></thead>
      <tbody>${stats.sectores.map(i=>`<tr><td>${i.nombre}</td><td>${i.valor}</td></tr>`).join("")}</tbody></table>
      <h2>Usuarios por rol</h2>
      <table><thead><tr><th>Rol</th><th>Cantidad</th></tr></thead>
      <tbody>${stats.usuarios.map(i=>`<tr><td>${i.rol}</td><td>${i.cantidad}</td></tr>`).join("")}</tbody></table>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleExport = () => {
    if (!data) return;
    const base = `estadisticas-superadmin-${new Date().toISOString().split("T")[0]}`;
    if (exportFormat === "xml") { downloadFile(buildXml(data), `${base}.xml`, "application/xml;charset=utf-8"); return; }
    if (exportFormat === "csv") { downloadFile(buildCsv(data), `${base}.csv`, "text/csv;charset=utf-8"); return; }
    exportAsPdf(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 md:px-10 w-full max-w-[1400px] mx-auto mt-10">
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 text-sm shadow-sm">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 w-full max-w-[1400px] mx-auto animate-fadeIn mt-6">

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
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as "xml" | "csv" | "pdf")}
            className="border border-slate-300 bg-white text-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Formato de exportación"
          >
            <option value="pdf">Exportar en PDF</option>
            <option value="xml">Exportar en XML</option>
            <option value="csv">Exportar en CSV</option>
          </select>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            Descargar
          </button>
        </div>
      </div>

      {/* KPIs RÁPIDOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Empresas",         value: data?.sectores.reduce((s, x) => s + x.valor, 0) ?? 0,                color: "text-blue-600"   },
          { label: "Empleados",        value: data?.usuarios.find(u => u.rol === "Empleados")?.cantidad ?? 0,       color: "text-emerald-600" },
          { label: "Sectores",         value: data?.sectores.filter(s => s.nombre !== "Sin datos").length ?? 0,     color: "text-violet-600"  },
          { label: "Usuarios Totales", value: data?.usuarios.reduce((s, x) => s + x.cantidad, 0) ?? 0,             color: "text-amber-600"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* CRECIMIENTO */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Crecimiento de la Plataforma</h2>
        <p className="text-xs text-slate-400 mb-6">Acumulado — últimos 6 meses</p>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.crecimiento} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEmpleados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="colorEmpresas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" name="Empleados" dataKey="empleados" stroke="#3B82F6" strokeWidth={3} fill="url(#colorEmpleados)" />
              <Area type="monotone" name="Empresas"  dataKey="empresas"  stroke="#10B981" strokeWidth={3} fill="url(#colorEmpresas)"  />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTORES */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Empresas por Sector</h2>
          <p className="text-xs text-slate-400 mb-6">Solo empresas aprobadas</p>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.sectores}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={100}
                  paddingAngle={5}
                  dataKey="valor" nameKey="nombre"
                  stroke="none"
                >
                  {data?.sectores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* USUARIOS POR ROL */}
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

      </div>
    </div>
  );
};

export default EstadisticasPage;