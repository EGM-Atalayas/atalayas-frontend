// src/components/pages/GestionEmpresas.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FaEdit, FaBan, FaCheckCircle } from "react-icons/fa";
import { getEmpresas, actualizarEstadoEmpresa } from "@/lib/api/empresas";

// Definimos la interfaz basada en tu base de datos
export interface EmpresaDB {
  empresaId: string;
  nombreEmpresa: string;
  cif: string;
  emailContacto: string;
  activo: boolean;
}

const GestionEmpresas: React.FC = () => {
  const [empresas, setEmpresas] = useState<EmpresaDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Usamos la función limpia de nuestra API
      const data = await getEmpresas();
      setEmpresas(data);
    } catch (err: any) {
      console.error("Error cargando empresas:", err);
      setError(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEstado = async (id: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    
    // Optimistic UI: Actualizamos la tabla visualmente al instante
    setEmpresas(empresas.map((emp) =>
      emp.empresaId === id ? { ...emp, activo: nuevoEstado } : emp
    ));

    try {
      // Hacemos la petición real al backend con tu apiFetch (que lleva el token)
      await actualizarEstadoEmpresa(id, nuevoEstado);
    } catch (error) {
      console.error("Error cambiando estado:", error);
      alert("Hubo un error al guardar el cambio en el servidor.");
      
      setEmpresas(empresas.map((emp) =>
        emp.empresaId === id ? { ...emp, activo: estadoActual } : emp
      ));
    }
  };

  const editarEmpresa = (id: string) => {
    console.log("Editar empresa con ID:", id);
  };

  return (
    <div className="p-8 w-full animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Empresas</h1>
        <p className="text-slate-500 text-sm mt-1">Administra las empresas adheridas al parque empresarial.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nombre de la Empresa</th>
                <th className="px-6 py-4">CIF</th>
                <th className="px-6 py-4">Email de Contacto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Cargando empresas...
                  </td>
                </tr>
              ) : empresas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No hay empresas registradas actualmente en la base de datos.
                  </td>
                </tr>
              ) : (
                empresas.map((empresa) => (
                  <tr key={empresa.empresaId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{empresa.nombreEmpresa}</td>
                    <td className="px-6 py-4">{empresa.cif}</td>
                    <td className="px-6 py-4">{empresa.emailContacto}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        empresa.activo 
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}>
                        {empresa.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button 
                        onClick={() => editarEmpresa(empresa.empresaId)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar empresa"
                      >
                        <FaEdit size={18} />
                      </button>
                      
                      <button 
                        onClick={() => toggleEstado(empresa.empresaId, empresa.activo)}
                        className={`p-2 rounded-lg transition-colors ${
                          empresa.activo 
                            ? "text-red-500 hover:text-red-700 hover:bg-red-50" 
                            : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                        }`}
                        title={empresa.activo ? "Desactivar empresa" : "Activar empresa"}
                      >
                        {empresa.activo ? <FaBan size={18} /> : <FaCheckCircle size={18} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestionEmpresas;