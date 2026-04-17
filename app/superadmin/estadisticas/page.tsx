"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import { API_URL, apiFetch } from "@/lib/api";

// --- MOCKS TEMPORALES PARA EL DISEÑO ---
// Mientras tu backend crea el endpoint, usaremos estos datos para que veas cómo queda
const mockEvolucion = [
  { mes: "Ene", empresas: 4, empleados: 120 },
  { mes: "Feb", empresas: 7, empleados: 250 },
  { mes: "Mar", empresas: 10, empleados: 380 },
  { mes: "Abr", empresas: 15, empleados: 520 },
  { mes: "May", empresas: 18, empleados: 743 },
];

const mockSectores = [
  { name: "Tecnología", value: 35 },
  { name: "Logística", value: 25 },
  { name: "Salud", value: 20 },
  { name: "Construcción", value: 20 },
];
const COLORES_SECTORES = ["#2563EB", "#10B981", "#F43F5E", "#8B5CF6"];

const mockModulos = [
  { nombre: "Onboarding", completados: 450, pendientes: 120 },
  { nombre: "PRL Básico", completados: 380, pendientes: 190 },
  { nombre: "Ciberseguridad", completados: 210, pendientes: 360 },
];

export default function EstadisticasPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [dataEvolucion, setDataEvolucion] = useState(mockEvolucion);
  const [dataSectores, setDataSectores] = useState(mockSectores);
  const [dataModulos, setDataModulos] = useState(mockModulos);

  // Cuando el backend esté listo, descomenta esto para usar datos reales
  /*
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(`${API_URL}/estadisticas/superadmin`);
        if (res.ok) {
          const json = await res.json();
          setDataEvolucion(json.evolucion);
          setDataSectores(json.sectores);
          setDataModulos(json.modulos);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);
  */

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-950">Estadísticas y Analítica</h1>
        <p className="text-slate-500 text-sm mt-1">
          Métricas detalladas del uso de la plataforma en el área empresarial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* GRÁFICO 1: EVOLUCIÓN (Ocupa todo el ancho en móvil, media pantalla en PC) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-blue-950 mb-6">Crecimiento de la Plataforma</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataEvolucion} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEmpleados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="empleados" name="Empleados Totales" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorEmpleados)" />
                <Area type="monotone" dataKey="empresas" name="Empresas" stroke="#10B981" strokeWidth={3} fillOpacity={0} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: DISTRIBUCIÓN POR SECTOR (Anillo) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-blue-950 mb-6">Empresas por Sector</h2>
          <div className="h-64 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataSectores}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataSectores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES_SECTORES[index % COLORES_SECTORES.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 3: MÓDULOS (Barras apiladas) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-blue-950 mb-6">Estado de Formaciones</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataModulos} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend iconType="circle" />
                <Bar dataKey="completados" name="Completados" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="pendientes" name="Pendientes" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}