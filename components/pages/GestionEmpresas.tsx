"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FaBan, FaCheckCircle, FaSearch, FaBuilding, FaRegFolderOpen, FaClock } from "react-icons/fa";
import { getEmpresas, toggleActivacionEmpresa } from "@/lib/api/empresas";

export interface EmpresaDB {
  empresaId: string;
  nombreEmpresa: string;
  cif: string;
  emailContacto: string;
  estadoSolicitud?: "APROBADA" | "RECHAZADA" | "PENDIENTE" | string;
  activo?: boolean;
  [key: string]: any;
}

const coloresEstado: Record<string, string> = {
  ACTIVA: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
  APROBADA: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
  INACTIVA: "bg-slate-100 text-slate-500 border-slate-200",
  RECHAZADA: "bg-slate-100 text-slate-500 border-slate-200",
  PENDIENTE: "bg-amber-50 text-amber-600 border-amber-200/50",
};

const GestionEmpresas: React.FC = () => {
  const [empresas, setEmpresas] = useState<EmpresaDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODAS" | "ACTIVA" | "INACTIVA" | "PENDIENTE">("TODAS");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err: any) {
      console.error("Error cargando empresas:", err);
      setError(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActivacion = async (id: string, activaActual: boolean) => {
    // Optimistic update
    setEmpresas(empresas.map((emp) =>
      emp.empresaId === id ? { ...emp, activo: !activaActual } : emp
    ));

    try {
      await toggleActivacionEmpresa(id);
    } catch (error) {
      console.error("Error cambiando activación:", error);
      alert("Hubo un error al guardar el cambio en el servidor.");
      // Revertir
      setEmpresas(empresas.map((emp) =>
        emp.empresaId === id ? { ...emp, activo: activaActual } : emp
      ));
    }
  };

  const empresasFiltradas = useMemo(() => {
    return empresas.filter((emp) => {
      const coincideBusqueda =
        emp.nombreEmpresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cif?.toLowerCase().includes(searchTerm.toLowerCase());

      let coincideEstado = false;
      if (filtroEstado === "TODAS") {
        coincideEstado = true;
      } else if (filtroEstado === "ACTIVA") {
        coincideEstado = emp.estadoSolicitud === "APROBADA" && emp.activo === true;
      } else if (filtroEstado === "INACTIVA") {
        coincideEstado = emp.estadoSolicitud === "APROBADA" && emp.activo === false;
      } else if (filtroEstado === "PENDIENTE") {
        coincideEstado = emp.estadoSolicitud === "PENDIENTE";
      }

      return coincideBusqueda && coincideEstado;
    });
  }, [empresas, searchTerm, filtroEstado]);

  const stats = {
    total: empresas.length,
    activas: empresas.filter(e => e.estadoSolicitud === "APROBADA" && e.activo === true).length,
    inactivas: empresas.filter(e => e.estadoSolicitud === "APROBADA" && e.activo === false).length,
    pendientes: empresas.filter(e => e.estadoSolicitud === "PENDIENTE").length,
  };

  return (
    <div className="w-full animate-fadeIn mt-6 px-6 md:px-10">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gestión de Empresas</h1>
          <p className="text-slate-500 text-sm mt-1.5">Administra, pausa o reactiva las empresas del área empresarial.</p>
        </div>
      </div>

      {/* ALERTAS */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 text-sm flex items-center gap-3 shadow-sm">
          <FaBan className="text-red-400" /> {error}
        </div>
      )}

      {/* KPI CARDS (Resumen estadístico) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <FaBuilding size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Empresas</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "-" : stats.total}</p>
          </div>
        </div>
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FaCheckCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Activas</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "-" : stats.activas}</p>
          </div>
        </div>
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
            <FaBan size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pausadas</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "-" : stats.inactivas}</p>
          </div>
        </div>
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <FaClock size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pendientes</p>
            <p className="text-2xl font-bold text-slate-800">{isLoading ? "-" : stats.pendientes}</p>
          </div>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="bg-white p-4 rounded-t-2xl border-x border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        
        {/* Tabs de Filtro */}
        <div className="flex bg-slate-100/50 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {["TODAS", "ACTIVA", "INACTIVA", "PENDIENTE"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFiltroEstado(tab as any)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap ${
                filtroEstado === tab 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72 shrink-0">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Buscar por nombre o CIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700"
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-b-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[800px]">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold tracking-wider border-y border-slate-100">
              <tr>
                <th className="px-6 py-5">Empresa</th>
                <th className="px-6 py-5">CIF</th>
                <th className="px-6 py-5">Contacto</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <p>Cargando datos del servidor...</p>
                    </div>
                  </td>
                </tr>
              ) : empresasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <FaRegFolderOpen size={32} className="text-slate-300" />
                      </div>
                      <p className="text-base font-medium text-slate-600">No hay empresas que coincidan</p>
                      <p className="text-sm mt-1">Prueba a cambiar los filtros o el término de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                empresasFiltradas.map((empresa) => {
                  const estadoLimpio = String(empresa.estadoSolicitud || "").toUpperCase().trim();
                  const esPendiente = estadoLimpio === "PENDIENTE";
                  const esAprobada = estadoLimpio === "APROBADA";
                  const esRechazada = estadoLimpio === "RECHAZADA";
                  const esActiva = esAprobada && empresa.activo === true;

                  let textoEstado = "RECHAZADA";
                  let colorClase = coloresEstado.RECHAZADA;
                  let colorPunto = "bg-slate-400";

                  if (esPendiente) {
                    textoEstado = "PENDIENTE";
                    colorClase = coloresEstado.PENDIENTE;
                    colorPunto = "bg-amber-500";
                  } else if (esAprobada && esActiva) {
                    textoEstado = "ACTIVA";
                    colorClase = coloresEstado.APROBADA;
                    colorPunto = "bg-emerald-500";
                  } else if (esAprobada && !esActiva) {
                    textoEstado = "PAUSADA";
                    colorClase = coloresEstado.INACTIVA;
                    colorPunto = "bg-slate-400";
                  }

                  return (
                    <tr key={empresa.empresaId} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{empresa.nombreEmpresa}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 bg-slate-50 rounded p-1 inline-block mt-2">
                        {empresa.cif}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{empresa.emailContacto}</td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border uppercase flex w-max items-center gap-1.5 ${colorClase}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colorPunto}`}></span>
                          {textoEstado}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {esPendiente || esRechazada ? (
                          <span className="text-xs text-slate-400 font-medium italic">
                            {esPendiente ? "En Solicitudes" : "Rechazada"}
                          </span>
                        ) : esActiva ? (
                          <button
                            onClick={() => toggleActivacion(empresa.empresaId, true)}
                            className="p-2 rounded-xl transition-all text-slate-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            title="Desactivar empresa"
                          >
                            <FaBan size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleActivacion(empresa.empresaId, false)}
                            className="p-2 rounded-xl transition-all text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            title="Activar empresa"
                          >
                            <FaCheckCircle size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestionEmpresas;