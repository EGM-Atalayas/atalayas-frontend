// src/components/pages/AdminGeneral.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FaBuilding, 
  FaUsers, 
  FaBookOpen, 
  FaExclamationTriangle, 
  FaArrowRight,
  FaFileAlt
} from "react-icons/fa";
// Importamos tu configuración de API
import { API_URL, apiFetch } from "@/lib/api";

// 1. Definimos las interfaces de lo que esperamos recibir del backend
export interface Actividad {
  id: number;
  texto: string;
  tiempo: string; // ej: "hace 2h" o "28 mar"
  tipo: "info" | "success" | "error" | "warning"; // Para darle color al puntito
}

export interface DashboardStats {
  empresasAdheridas: number;
  empresasNuevasMes: number;
  empleadosRegistrados: number;
  empleadosNuevosMes: number;
  modulosPublicados: number;
  incidenciasAbiertas: number;
  incidenciasCriticas: number;
  actividadReciente: Actividad[];
}

const AdminGeneral: React.FC = () => {
  const router = useRouter();

  // 2. Estados para manejar los datos reales
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 3. Efecto para obtener los datos al cargar la página
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError("");
      try {
        // OJO: Ajusta esta URL a la ruta real de tu backend que devuelve las estadísticas
        const response = await apiFetch(`${API_URL}/dashboard/superadmin`);
        
        if (!response.ok) {
          throw new Error("No se pudieron cargar las estadísticas del servidor.");
        }
        
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        console.error("Error cargando el dashboard:", err);
        setError("Error de conexión al obtener los datos del panel.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Función auxiliar para asignar colores a la línea de tiempo según el tipo
  const getDotColor = (tipo: string) => {
    switch (tipo) {
      case "success": return "bg-emerald-500";
      case "error": return "bg-rose-500";
      case "warning": return "bg-amber-500";
      default: return "bg-blue-500"; // "info"
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
      </div>
    );
  }

  // Preparamos el array de estadísticas con los datos reales (o 0 si falló)
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
      label: "Módulos Publicados", 
      value: data?.modulosPublicados || 0, 
      icon: <FaBookOpen size={20} />, 
      color: "text-emerald-600", bg: "bg-emerald-100", 
      trend: "Módulos globales" 
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
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto animate-fadeIn min-h-screen">
      
      {/* HEADER DE LA VISTA */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-950">Vista General</h1>
        <p className="text-slate-500 mt-1">EGM Atalayas Ciudad Empresarial • Resumen de actividad</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      {/* 1. TARJETAS DE ESTADÍSTICAS (KPIs) - Con datos reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between transition-transform hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                {stat.trend}
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-blue-950">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA (ACCESOS RÁPIDOS) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-blue-950 flex items-center gap-2">
            Accesos Rápidos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-950 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <FaBuilding size={120} />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Gestión de Empresas</h3>
                  <p className="text-sm text-blue-200 line-clamp-2">
                    Administra el estado, edita datos y gestiona el acceso de las empresas del parque empresarial.
                  </p>
                </div>
                <button 
                  onClick={() => router.push("/superadmin/empresas")}
                  className="bg-white text-blue-950 font-bold py-3 px-5 rounded-full w-max text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors"
                >
                  Ir a Empresas <FaArrowRight />
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
              <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div>
                  <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <FaFileAlt size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-blue-950 mb-2">Solicitudes Pendientes</h3>
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

        {/* COLUMNA DERECHA (ACTIVIDAD RECIENTE) - Con datos reales */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-max">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-blue-950">Actividad reciente</h2>
          </div>
          
          <div className="flex flex-col gap-y-6">
            {/* Si no hay datos, mostramos un mensaje vacío */}
            {!data?.actividadReciente || data.actividadReciente.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No hay actividad reciente registrada.</p>
            ) : (
              data.actividadReciente.map((item, index) => (
                <div key={item.id || index} className="flex gap-4 items-start">
                  <div className="relative mt-1">
                    {/* El color del punto viene dinámicamente de la función getDotColor */}
                    <div className={`w-2.5 h-2.5 rounded-full ${getDotColor(item.tipo)} ring-4 ring-slate-50 z-10 relative`}></div>
                    {/* Ocultamos la línea en el último elemento */}
                    {index !== data.actividadReciente.length - 1 && (
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