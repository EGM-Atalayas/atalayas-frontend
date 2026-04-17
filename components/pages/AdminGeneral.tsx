"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FaBuilding, 
  FaUsers, 
  FaExclamationTriangle, 
  FaArrowRight,
  FaFileAlt
} from "react-icons/fa";
import { API_URL, apiFetch } from "@/lib/api";

// 1. Interfaz de Actividad
export interface Actividad {
  id: number;
  texto: string;
  tiempo: string;
  tipo: "info" | "success" | "error" | "warning";
}

// 2. Interfaz EXACTA de lo que César nos envía
export interface DashboardResponse {
  empresasAdheridas: number;
  empresasNuevasMes: number;
  empleadosRegistrados: number;
  empleadosNuevosMes: number;
  modulosPublicados: number;
  incidenciasAbiertas: number;
  incidenciasCriticas: number;
  actividadReciente?: Actividad[]; 
}

const AdminGeneral: React.FC = () => {
  const router = useRouter();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await apiFetch(`${API_URL}/dashboard/superadmin`);
        
        const json = await response.json().catch(() => ({})); 
        
        if (!response.ok || json.code === 403 || json.code === 401) {
          console.error(`🚨 ALERTA DE SEGURIDAD DEL BACKEND:`, json);
          throw new Error(`Acceso denegado (Error ${json.code || response.status}). Comprueba con el backend que tienes permisos de SUPERADMIN.`);
        }
        
        setData(json);
        
      } catch (err: any) {
        console.error("Error cargando el dashboard:", err);
        setError(err.message || "Error de conexión al obtener los datos del panel.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getDotColor = (tipo: string) => {
    switch (tipo) {
      case "success": return "bg-emerald-500";
      case "error": return "bg-rose-500";
      case "warning": return "bg-amber-500";
      default: return "bg-blue-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    { 
      label: "Empresas Adheridas", 
      value: data?.empresasAdheridas || 0, 
      icon: <FaBuilding size={20} />, 
      color: "text-blue-600", bg: "bg-blue-100", 
      trend: `+${data?.empresasNuevasMes || 0} este mes` 
    },
    { 
      label: "Empleados Registrados", 
      value: data?.empleadosRegistrados || 0, 
      icon: <FaUsers size={20} />, 
      color: "text-indigo-600", bg: "bg-indigo-100", 
      trend: `+${data?.empleadosNuevosMes || 0} este mes` 
    },
    { 
      label: "Incidencias Abiertas", 
      value: data?.incidenciasAbiertas || 0, 
      icon: <FaExclamationTriangle size={20} />, 
      color: "text-rose-600", bg: "bg-rose-100", 
      trend: `${data?.incidenciasCriticas || 0} críticas` 
    },
  ];

  return (
    <div className="px-6 md:px-10 w-full max-w-[1400px] mx-auto animate-fadeIn mt-6">

      {/* CABECERA ORIGINAL (Como el Hero está en el Layout, aquí ponemos el título de la sección) */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Panel Principal</h1>
        <p className="text-slate-500 text-sm mt-1.5">Resumen de actividad de EGM Atalayas.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 text-sm font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 uppercase tracking-wide">
                {stat.trend}
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CONTENIDO INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (ACCESOS RÁPIDOS) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-800">Accesos Rápidos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <FaBuilding size={120} />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Gestión de Empresas</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    Administra el estado, edita datos y gestiona el acceso de las empresas del área.
                  </p>
                </div>
                <button 
                  onClick={() => router.push("/superadmin/empresas")}
                  className="bg-white text-slate-900 font-bold py-2.5 px-5 rounded-xl w-max text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors"
                >
                  Ir a Empresas <FaArrowRight />
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-slate-200 transition-colors hover:shadow-md">
              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div>
                  <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <FaFileAlt size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Solicitudes Pendientes</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    Revisa y aprueba las nuevas empresas que han solicitado unirse a la plataforma.
                  </p>
                </div>
                <button 
                  onClick={() => router.push("/superadmin/solicitudes")}
                  className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:text-blue-800 transition-colors w-max"
                >
                  Ver solicitudes <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (ACTIVIDAD RECIENTE) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-max mt-[44px]"> 
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Actividad reciente</h2>
          </div>
          
          <div className="flex flex-col gap-y-6">
            {!data?.actividadReciente || data.actividadReciente.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="bg-slate-50 p-3 rounded-full mb-3">
                  <FaFileAlt size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-600">No hay actividad reciente</p>
                <p className="text-xs text-slate-400 mt-1">El servidor aún no está enviando el log de acciones.</p>
              </div>
            ) : (
                  data.actividadReciente.map((item, index, array) => (
                  <div key={item.id || index} className="flex gap-4 items-start group">
                  <div className="relative mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${getDotColor(item.tipo)} ring-4 ring-slate-50 z-10 relative group-hover:scale-125 transition-transform`}></div>
                    {index !== array.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[2px] h-12 bg-slate-100"></div>
                    )}
                  </div>
                  
                  <div className="flex flex-col pb-2">
                    <p className="text-sm font-medium text-slate-700">{item.texto}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.tiempo}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminGeneral;