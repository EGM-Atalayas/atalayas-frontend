"use client";

import React, { useState, useEffect } from "react";
import { API_URL, apiFetch } from "@/lib/api";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList
} from "recharts";
import { FaChartPie } from "react-icons/fa";

// 1. Interfaz para el backend
export interface EstadisticasResponse {
  crecimiento: { mes: string; empleados: number; empresas: number }[];
  sectores: { nombre: string; valor: number; color: string }[];
  usuarios: { rol: string; cantidad: number; color: string }[];
}

// Datos de emergencia (Mocks)
const mockFallback: EstadisticasResponse = {
  crecimiento: [
    { mes: "Ene", empleados: 10, empresas: 5 },
    { mes: "Feb", empleados: 25, empresas: 8 },
    { mes: "Mar", empleados: 50, empresas: 12 },
    { mes: "Abr", empleados: 80, empresas: 15 },
    { mes: "May", empleados: 100, empresas: 18 },
  ],
  sectores: [
    { nombre: "Construcción", valor: 30, color: "#8B5CF6" },
    { nombre: "Logística", valor: 25, color: "#10B981" },
    { nombre: "Salud", valor: 20, color: "#F43F5E" },
    { nombre: "Tecnología", valor: 25, color: "#3B82F6" },
  ],
  usuarios: [
    { rol: "SuperAdmins", cantidad: 5, color: "#F59E0B" },
    { rol: "Admins Empresa", cantidad: 30, color: "#3B82F6" },
    { rol: "Empleados", cantidad: 200, color: "#10B981" },
  ]
};

const EstadisticasPage: React.FC = () => {
  const [data, setData] = useState<EstadisticasResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch(`${API_URL}/estadisticas/superadmin`);
        if (!response.ok) throw new Error();
        const json = await response.json();
        setData(json);
      } catch (err) {
        setData(mockFallback); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchEstadisticas();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 w-full max-w-[1400px] mx-auto animate-fadeIn mt-6">
      
      {/* CABECERA */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Estadísticas Generales</h1>
        <p className="text-slate-500 text-sm mt-1.5">Análisis del crecimiento y distribución del parque empresarial.</p>
      </div>

      {/* 1. CRECIMIENTO */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Crecimiento de la Plataforma</h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.crecimiento} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEmpleados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" name="Empleados Totales" dataKey="empleados" stroke="#3B82F6" strokeWidth={3} fill="url(#colorEmpleados)" />
              <Area type="monotone" name="Empresas" dataKey="empresas" stroke="#10B981" strokeWidth={3} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico Quesito: Sectores */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Empresas por Sector</h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.sectores} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="valor" nameKey="nombre" stroke="none">
                  {data?.sectores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NUEVO GRÁFICO DE BARRAS VERTICALES: DISTRIBUCIÓN DE USUARIOS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Distribución de Usuarios por Rol</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.usuarios}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="rol" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                {/* Barras verticales, borde redondeado arriba [top-left, top-right, bottom-right, bottom-left] */}
                <Bar dataKey="cantidad" radius={[10, 10, 0, 0]} barSize={50}>
                  {data?.usuarios.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  {/* Número encima de la barra */}
                  <LabelList dataKey="cantidad" position="top" style={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={-5} />
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