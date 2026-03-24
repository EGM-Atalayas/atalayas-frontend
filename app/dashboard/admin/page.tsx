"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface Empleado {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  rol: string;
}

interface DashboardData {
  nombreEmpresa: string;
  totalEmpleados: number;
  modulosActivos: number;
  comunicadosRecientes: number;
  listaEmpleados: Empleado[];
}

export default function AdminDashboardPage() {
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const response = await fetch(`${API_URL}/dashboard/admin/resumen`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = "/login";
            return;
          }
          throw new Error("Servidor no disponible");
        }

        const data = await response.json();
        setDatos(data);
      } catch (err: any) {
        setError("No hemos podido conectar con los servidores principales.");
      } finally {
        setCargando(false);
      }
    };
    cargarDashboard();
  }, []);

  // PANTALLA DE CARGA
  if (cargando) return (
    <div className="flex items-center justify-center w-full min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando con Railway...</p>
      </div>
    </div>
  );

  // PANTALLA DE ERROR 
  if (error) return (
    <div className="flex items-center justify-center w-full min-h-[60vh] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-100 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔌</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Conexión Interrumpida</h2>
        <p className="text-slate-500 text-sm mb-6">{error} El equipo técnico ya ha sido notificado.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-medium transition-colors"
        >
          Reintentar conexión
        </button>
      </div>
    </div>
  );

  // DISEÑO PRINCIPAL (Compatible con el Layout)
  return (
    <div className="w-full p-4 md:p-8">
      
      {/* BOTÓN DE VOLVER ATRÁS */}
      <div className="max-w-7xl mx-auto mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 w-fit"
        >
          <span className="text-lg leading-none">←</span> Volver al menú principal
        </Link>
      </div>

      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard de Gestión</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              Empresa: <span className="text-indigo-600 font-semibold">{datos?.nombreEmpresa || "Atalayas S.L."}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-indigo-200 active:scale-95">
            + Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Plantilla Total", val: datos?.totalEmpleados, icon: "👥" },
            { label: "Módulos Activos", val: datos?.modulosActivos, icon: "⚡" },
            { label: "Comunicados", val: datos?.comunicadosRecientes, icon: "📢" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl opacity-80 group-hover:scale-110 transition-transform">{stat.icon}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stat.val ?? 0}</p>
            </div>
          ))}
        </div>

        {/* Tabla de Empleados */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
            <h2 className="text-lg font-bold text-slate-800">Directorio de Equipo</h2>
            <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
              {datos?.listaEmpleados?.length || 0} Registrados
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Empleado</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rol / Cargo</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {datos?.listaEmpleados && datos.listaEmpleados.length > 0 ? (
                  datos.listaEmpleados.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            {emp.nombre.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{emp.nombre}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                          emp.rol === 'ADMIN' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                        }`}>
                          {emp.rol}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.activo ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span className={`text-sm font-medium ${emp.activo ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {emp.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                          <span className="text-2xl">📁</span>
                        </div>
                        <p className="text-slate-500 font-medium">No hay empleados para mostrar todavía.</p>
                        <p className="text-sm text-slate-400 max-w-sm">Los datos aparecerán aquí automáticamente en cuanto el backend esté operativo y haya usuarios registrados.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}