"use client";

import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaBuilding, FaEnvelope, FaIdCard, FaUserTie, FaRegCalendarAlt } from "react-icons/fa";
import { getEmpresas, actualizarEstadoEmpresa } from "@/lib/api/empresas";

// Interfaz ajustada exactamente a lo que mandaste en tu payload de RegisterEmpresa.tsx
export interface SolicitudDB {
  empresaId: string;
  nombreEmpresa: string;
  cif: string;
  emailContacto: string; // <-- Así lo llamaste en el payload
  nombre?: string;       // Datos del admin
  apellidos?: string;    // Datos del admin
  emailAdmin?: string;   // Datos del admin
  fechaSolicitud?: string;
  estadoSolicitud?: string;
  [key: string]: any; 
}

const SolicitudesPendientes: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    setIsLoading(true);
    setError("");
    try {
      // 1. Nos traemos TODAS las empresas
      const data = await getEmpresas();
      
      // 2. FILTRO MÁGICO: Nos quedamos SOLO con las pendientes
      const pendientes = data.filter((emp: any) => {
        const estado = String(emp.estadoSolicitud || "").toUpperCase().trim();
        return estado === "PENDIENTE";
      });
      
      setSolicitudes(pendientes);
    } catch (err: any) {
      console.error("Error cargando solicitudes:", err);
      setError("No se pudieron cargar las solicitudes pendientes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para aprobar o rechazar
  const procesarSolicitud = async (id: string, accion: "APROBADA" | "RECHAZADA") => {
    // Optimistic UI: Lo quitamos de la lista al instante para que la tarjeta desaparezca suavemente
    setSolicitudes((prev) => prev.filter((sol) => sol.empresaId !== id));

    try {
      await actualizarEstadoEmpresa(id, accion);
    } catch (error) {
      console.error(`Error al ${accion}:`, error);
      alert(`Hubo un error al ${accion === 'APROBADA' ? 'aprobar' : 'rechazar'} la solicitud.`);
      // Si falla, recargamos la lista desde el servidor
      fetchSolicitudes();
    }
  };

  // Función a prueba de balas para las fechas (Adiós al "Invalid Date")
  const formatearFecha = (fechaString?: string) => {
    if (!fechaString) return "Fecha no disponible";
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return "Fecha no disponible";
      return new Intl.DateTimeFormat('es-ES', { 
        day: '2-digit', month: 'short', year: 'numeric' 
      }).format(fecha);
    } catch {
      return "Fecha no disponible";
    }
  };

  return (
    <div className="p-6 md:p-10 w-full max-w-[1400px] mx-auto animate-fadeIn min-h-screen">
      
      {/* CABECERA */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Solicitudes Pendientes</h1>
        <p className="text-slate-500 text-sm mt-1.5">Revisa y aprueba las nuevas empresas que desean unirse al parque empresarial.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p>Cargando solicitudes...</p>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <FaCheck className="text-4xl text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">¡Todo al día!</h3>
          <p className="text-slate-500">No hay ninguna solicitud de empresa pendiente de revisión en este momento.</p>
        </div>
      ) : (
        /* GRID DE TARJETAS */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {solicitudes.map((solicitud) => (
            <div key={solicitud.empresaId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              
              {/* Top de la Tarjeta (Badge y Fecha) */}
              <div className="flex justify-between items-center p-5 border-b border-slate-50 bg-slate-50/50">
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  PENDIENTE
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <FaRegCalendarAlt />
                  {formatearFecha(solicitud.fechaSolicitud)}
                </span>
              </div>

              {/* Cuerpo de la Tarjeta (Datos Reales) */}
              <div className="p-6 flex-1">
                <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <FaBuilding className="text-blue-500" size={18} />
                  {solicitud.nombreEmpresa || "Empresa sin nombre"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  {/* Datos de Empresa */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Datos Empresa</p>
                    <div className="flex items-start gap-2.5">
                      <FaIdCard className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">CIF</p>
                        <p className="text-sm font-medium text-slate-700">{solicitud.cif || "---"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FaEnvelope className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Email Contacto</p>
                        <p className="text-sm font-medium text-slate-700 break-all">{solicitud.emailContacto || "---"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Datos del Administrador */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Administrador</p>
                    <div className="flex items-start gap-2.5">
                      <FaUserTie className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Nombre completo</p>
                        <p className="text-sm font-medium text-slate-700 capitalize">
                          {solicitud.nombre ? `${solicitud.nombre} ${solicitud.apellidos || ''}` : "---"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FaEnvelope className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Email Admin</p>
                        <p className="text-sm font-medium text-slate-700 break-all">{solicitud.emailAdmin || "---"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="grid grid-cols-2 gap-3 p-5 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => procesarSolicitud(solicitud.empresaId, "RECHAZADA")}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <FaTimes /> Rechazar
                </button>
                <button
                  onClick={() => procesarSolicitud(solicitud.empresaId, "APROBADA")}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 transition-colors"
                >
                  <FaCheck /> Aprobar
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SolicitudesPendientes;