// src/app/superadmin/solicitudes/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaBuilding } from "react-icons/fa";
import { API_URL, apiFetch } from "@/lib/api";

// Interfaz para las solicitudes pendientes
interface Solicitud {
  empresa_id: string;
  nombre_empresa: string;
  cif: string;
  email_contacto: string;
  estado_solicitud: string; // PENDIENTE
  fecha_creacion: string;
  // Opcional: datos del admin solicitante
  nombre_admin?: string;
  email_admin?: string;
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Endpoint sugerido: /empresas?estado_solicitud=PENDIENTE
      const response = await apiFetch(`${API_URL}/empresas?estado_solicitud=PENDIENTE`);
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data);
      } else {
        setError("Error al cargar las solicitudes pendientes.");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const procesarSolicitud = async (id: string, accion: "aprobar" | "rechazar") => {
    try {
      // Endpoint sugerido: PATCH /empresas/:id/solicitud
      const response = await apiFetch(`${API_URL}/empresas/${id}/solicitud`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }), // "aprobar" o "rechazar"
      });

      if (response.ok) {
        // Quitamos la solicitud de la lista visualmente
        setSolicitudes(solicitudes.filter(s => s.empresa_id !== id));
        alert(`Solicitud ${accion === "aprobar" ? "aprobada" : "rechazada"} con éxito.`);
      } else {
        alert("Hubo un error al procesar la solicitud.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al procesar la solicitud.");
    }
  };

  return (
    <div className="p-8 w-full animate-fadeIn max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-950">Solicitudes Pendientes</h1>
        <p className="text-slate-500 text-sm mt-1">
          Revisa y aprueba las nuevas empresas que desean unirse al parque empresarial.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-950"></div>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
          <FaBuilding className="text-slate-300 text-6xl mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No hay solicitudes nuevas</h3>
          <p className="text-slate-500 mt-2">Todas las solicitudes han sido procesadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solicitudes.map((solicitud) => (
            <div key={solicitud.empresa_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Pendiente
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(solicitud.fecha_creacion).toLocaleDateString()}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-blue-950 mb-1 line-clamp-1" title={solicitud.nombre_empresa}>
                  {solicitud.nombre_empresa}
                </h2>
                
                <div className="text-sm text-slate-600 space-y-2 mt-4">
                  <p><span className="font-semibold text-slate-800">CIF:</span> {solicitud.cif}</p>
                  <p><span className="font-semibold text-slate-800">Email Empresa:</span> {solicitud.email_contacto}</p>
                  {solicitud.nombre_admin && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Admin Solicitante</p>
                      <p><span className="font-semibold text-slate-800">Nombre:</span> {solicitud.nombre_admin}</p>
                      <p><span className="font-semibold text-slate-800">Email:</span> {solicitud.email_admin}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => procesarSolicitud(solicitud.empresa_id, "rechazar")}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  <FaTimes /> Rechazar
                </button>
                <button
                  onClick={() => procesarSolicitud(solicitud.empresa_id, "aprobar")}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold py-2.5 rounded-xl transition-colors shadow-sm text-sm"
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
}