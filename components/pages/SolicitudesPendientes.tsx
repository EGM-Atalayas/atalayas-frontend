"use client";

import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaBuilding, FaEnvelope, FaIdCard, FaUserTie, FaRegCalendarAlt } from "react-icons/fa";
import { getEmpresas, actualizarEstadoEmpresa, rechazarSolicitudEmpresa } from "@/lib/api/empresas";
import { EmptyState } from "@/components/ui/EmptyState";

export interface SolicitudDB {
  empresaId: string;
  nombreEmpresa: string;
  cif: string;
  emailContacto: string; 
  nombre?: string;       
  apellidos?: string;    
  emailAdmin?: string;   
  fechaSolicitud?: string;
  estadoSolicitud?: string;
  [key: string]: any; 
}

const SolicitudesPendientes: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "exito" | "error"; mensaje: string } | null>(null);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const fetchSolicitudes = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getEmpresas();
      
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

  const procesarSolicitud = async (id: string, accion: "APROBADA" | "RECHAZADA") => {
    const nombreEmpresa = solicitudes.find((s) => s.empresaId === id)?.nombreEmpresa || "empresa";
    setProcesando(id);
    setAviso(null);

    try {
      if (accion === "RECHAZADA") {
        await rechazarSolicitudEmpresa(id);
      } else {
        await actualizarEstadoEmpresa(id, accion);
      }

      // Escondemos la tarjeta después de exitoso
      setSolicitudes((prev) => prev.filter((sol) => sol.empresaId !== id));

      const mensaje =
        accion === "APROBADA"
          ? `${nombreEmpresa} ha sido aprobada correctamente`
          : `${nombreEmpresa} ha sido rechazada`;

      setAviso({ tipo: "exito", mensaje });
      setProcesando(null);

      // Quitar aviso después de 4 segundos
      setTimeout(() => setAviso(null), 4000);
    } catch (error) {
      console.error(`Error al ${accion}:`, error);
      setProcesando(null);
      setAviso({
        tipo: "error",
        mensaje: `Error al ${accion === "APROBADA" ? "aprobar" : "rechazar"}. Intenta de nuevo.`,
      });
      setTimeout(() => setAviso(null), 4000);
    }
  };

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
    <div className="w-full animate-fadeIn min-h-screen p-6 md:p-10">
      
      {/* CABECERA */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--texto-primario)" }}>Solicitudes Pendientes</h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--texto-muted)" }}>Revisa y aprueba las nuevas empresas que desean unirse al parque empresarial.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 text-sm">
          {error}
        </div>
      )}

      {/* AVISO FLOTANTE */}
      {aviso && (
        <div
          className={`fixed bottom-6 right-6 max-w-sm px-6 py-4 rounded-xl shadow-lg border text-sm font-medium animate-fadeIn ${
            aviso.tipo === "exito"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {aviso.mensaje}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--texto-muted)" }}>
          <div className="w-10 h-10 border-4 rounded-full animate-spin mb-4" style={{ borderColor: "var(--gris-superficie)", borderTopColor: "var(--azul-egm)" }}></div>
          <p>Cargando solicitudes...</p>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="card">
          <EmptyState
            title="¡Todo al día!"
            description="No hay ninguna solicitud de empresa pendiente de revisión en este momento."
            icon={
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-[3000px]">
          {solicitudes.map((solicitud) => (
            <div key={solicitud.empresaId} className="card card-hover overflow-hidden flex flex-col">
              
              <div className="flex justify-between items-center p-5" style={{ borderBottom: "1px solid var(--gris-superficie)", background: "var(--blanco)" }}>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  PENDIENTE
                </span>
                <span className="text-xs flex items-center gap-1.5 font-medium" style={{ color: "var(--texto-placeholder)" }}>
                  <FaRegCalendarAlt />
                  {formatearFecha(solicitud.fechaSolicitud)}
                </span>
              </div>

              <div className="p-6 flex-1">
                <h3 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ color: "var(--texto-primario)" }}>
                  <FaBuilding size={18} style={{ color: "var(--azul-egm)" }} />
                  {solicitud.nombreEmpresa || "Empresa sin nombre"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider pb-1" style={{ color: "var(--texto-placeholder)", borderBottom: "1px solid var(--gris-borde)" }}>Datos Empresa</p>
                    <div className="flex items-start gap-2.5">
                      <FaIdCard className="mt-0.5" style={{ color: "var(--texto-placeholder)" }} />
                      <div>
                        <p className="text-xs" style={{ color: "var(--texto-muted)" }}>CIF</p>
                        <p className="text-sm font-medium" style={{ color: "var(--texto-secundario)" }}>{solicitud.cif || <span className="italic" style={{ color: "var(--texto-placeholder)" }}>No disponible</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FaEnvelope className="mt-0.5" style={{ color: "var(--texto-placeholder)" }} />
                      <div>
                        <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Email Contacto</p>
                        <p className="text-sm font-medium break-all" style={{ color: "var(--texto-secundario)" }}>{solicitud.emailContacto || <span className="italic" style={{ color: "var(--texto-placeholder)" }}>No disponible</span>}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider pb-1" style={{ color: "var(--texto-placeholder)", borderBottom: "1px solid var(--gris-borde)" }}>Administrador</p>
                    <div className="flex items-start gap-2.5">
                      <FaUserTie className="mt-0.5" style={{ color: "var(--texto-placeholder)" }} />
                      <div>
                        <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Nombre completo</p>
                        <p className="text-sm font-medium capitalize" style={{ color: "var(--texto-secundario)" }}>
                          {solicitud.nombre ? `${solicitud.nombre} ${solicitud.apellidos || ''}` : <span className="italic" style={{ color: "var(--texto-placeholder)" }}>Pendiente de servidor</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FaEnvelope className="mt-0.5" style={{ color: "var(--texto-placeholder)" }} />
                      <div>
                        <p className="text-xs" style={{ color: "var(--texto-muted)" }}>Email Admin</p>
                        <p className="text-sm font-medium break-all" style={{ color: "var(--texto-secundario)" }}>
                          {solicitud.emailAdmin ? solicitud.emailAdmin : <span className="italic" style={{ color: "var(--texto-placeholder)" }}>Pendiente de servidor</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5" style={{ background: "var(--blanco)", borderTop: "1px solid var(--gris-borde)" }}>
                <button
                  onClick={() => procesarSolicitud(solicitud.empresaId, "RECHAZADA")}
                  disabled={procesando === solicitud.empresaId}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {procesando === solicitud.empresaId ? (
                    <>
                      <div className="w-3 h-3 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FaTimes /> Rechazar
                    </>
                  )}
                </button>
                <button
                  onClick={() => procesarSolicitud(solicitud.empresaId, "APROBADA")}
                  disabled={procesando === solicitud.empresaId}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-200 transition-colors"
                >
                  {procesando === solicitud.empresaId ? (
                    <>
                      <div className="w-3 h-3 border-2 border-emerald-300 border-t-white rounded-full animate-spin"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Aprobar
                    </>
                  )}
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