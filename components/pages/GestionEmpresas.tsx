"use client";

import React, { useState, useMemo } from "react";
import { FaBan, FaCheckCircle, FaSearch, FaBuilding, FaRegFolderOpen, FaClock } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmpresas, toggleActivacionEmpresa } from "@/lib/api/empresas";
import { EmptyState } from "@/components/ui/EmptyState";
import { QK } from "@/lib/queryKeys";

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
  INACTIVA: "bg-gray-100 text-gray-500 border-gray-200",
  RECHAZADA: "bg-gray-100 text-gray-500 border-gray-200",
  PENDIENTE: "bg-amber-50 text-amber-600 border-amber-200/50",
};

const GestionEmpresas: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"TODAS" | "ACTIVA" | "INACTIVA" | "PENDIENTE">("TODAS");

  const { data: empresas = [], isLoading, error: queryError } = useQuery({
    queryKey: QK.empresas(),
    queryFn: getEmpresas,
    staleTime: 30_000,
  });
  const error = queryError ? (queryError as Error).message : "";

  const toggleMutation = useMutation({
    mutationFn: ({ id }: { id: string; activaActual: boolean }) => toggleActivacionEmpresa(id),
    onMutate: async ({ id, activaActual }: { id: string; activaActual: boolean }) => {
      await queryClient.cancelQueries({ queryKey: QK.empresas() });
      const prev = queryClient.getQueryData<typeof empresas>(QK.empresas());
      queryClient.setQueryData<typeof empresas>(QK.empresas(), (old = []) =>
        old.map((emp) => emp.empresaId === id ? { ...emp, activo: !activaActual } : emp)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(QK.empresas(), ctx?.prev);
      alert("Hubo un error al guardar el cambio en el servidor.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QK.empresas() }),
  });

  const toggleActivacion = (id: string, activaActual: boolean) =>
    toggleMutation.mutate({ id, activaActual });

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
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--texto-primario)" }}>Gestión de Empresas</h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--texto-muted)" }}>Administra, pausa o reactiva las empresas del área empresarial.</p>
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
          <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "var(--azul-accion-light)", color: "var(--azul-accion)" }}>
            <FaBuilding size={20} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--texto-muted)" }}>Total Empresas</p>
            <p className="text-2xl font-bold" style={{ color: "var(--texto-primario)" }}>{isLoading ? "-" : stats.total}</p>
          </div>
        </div>
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FaCheckCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--texto-muted)" }}>Activas</p>
            <p className="text-2xl font-bold" style={{ color: "var(--texto-primario)" }}>{isLoading ? "-" : stats.activas}</p>
          </div>
        </div>
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
            <FaBan size={20} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--texto-muted)" }}>Pausadas</p>
            <p className="text-2xl font-bold" style={{ color: "var(--texto-primario)" }}>{isLoading ? "-" : stats.inactivas}</p>
          </div>
        </div>
        <div className="card card-hover p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <FaClock size={20} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--texto-muted)" }}>Pendientes</p>
            <p className="text-2xl font-bold" style={{ color: "var(--texto-primario)" }}>{isLoading ? "-" : stats.pendientes}</p>
          </div>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="bg-white p-4 rounded-t-2xl border-x border-t flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm" style={{ borderColor: "var(--gris-borde)" }}>

        {/* Tabs de Filtro */}
        <div className="flex p-1 rounded-xl w-full md:w-auto overflow-x-auto" style={{ background: "var(--gris-superficie)" }}>
          {["TODAS", "ACTIVA", "INACTIVA", "PENDIENTE"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFiltroEstado(tab as any)}
              className="flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap"
              style={{
                background: filtroEstado === tab ? "var(--blanco)" : "transparent",
                color:      filtroEstado === tab ? "var(--azul-accion)" : "var(--texto-muted)",
                boxShadow:  filtroEstado === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72 shrink-0">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: "var(--texto-placeholder)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre o CIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background:  "var(--gris-pagina)",
              border:      "1px solid var(--gris-borde)",
              color:       "var(--texto-primario)",
            }}
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-b-2xl shadow-sm overflow-hidden" style={{ border: "1px solid var(--gris-borde)", borderTop: "none" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]" style={{ color: "var(--texto-secundario)" }}>
            <thead className="text-xs uppercase font-bold tracking-wider" style={{ background: "var(--gris-pagina)", color: "var(--texto-muted)", borderTop: "1px solid var(--gris-borde)", borderBottom: "1px solid var(--gris-borde)" }}>
              <tr>
                <th className="px-6 py-5">Empresa</th>
                <th className="px-6 py-5">CIF</th>
                <th className="px-6 py-5">Contacto</th>
                <th className="px-6 py-5">Estado</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody style={{ borderTop: "1px solid var(--gris-superficie)" }}>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center" style={{ color: "var(--texto-muted)" }}>
                      <div className="w-8 h-8 border-4 rounded-full animate-spin mb-4" style={{ borderColor: "var(--gris-superficie)", borderTopColor: "var(--azul-egm)" }}></div>
                      <p>Cargando datos del servidor...</p>
                    </div>
                  </td>
                </tr>
              ) : empresasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      size="sm"
                      title="No hay empresas que coincidan"
                      description="Prueba a cambiar los filtros o el término de búsqueda."
                      icon={<FaRegFolderOpen size={32} />}
                    />
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
                    <tr key={empresa.empresaId} className="transition-colors group" style={{ borderBottom: "1px solid var(--gris-superficie)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--gris-pagina)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-6 py-4">
                        <div className="font-semibold" style={{ color: "var(--texto-primario)" }}>{empresa.nombreEmpresa}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs rounded p-1 inline-block mt-2" style={{ color: "var(--texto-muted)", background: "var(--gris-superficie)" }}>
                        {empresa.cif}
                      </td>
                      <td className="px-6 py-4" style={{ color: "var(--texto-muted)" }}>{empresa.emailContacto}</td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border uppercase flex w-max items-center gap-1.5 ${colorClase}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colorPunto}`}></span>
                          {textoEstado}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {esPendiente || esRechazada ? (
                          <span className="text-xs font-medium italic" style={{ color: "var(--texto-placeholder)" }}>
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