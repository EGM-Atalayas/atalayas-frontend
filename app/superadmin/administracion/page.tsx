"use client";

import React, { useState } from "react";
import { FaBuilding, FaClock, FaChartBar, FaExclamationTriangle } from "react-icons/fa";
import GestionEmpresas from "@/components/pages/GestionEmpresas";
import SolicitudesPendientes from "@/components/pages/SolicitudesPendientes";
import GestionIncidencias from "@/components/pages/GestionIncidencias";
import EstadisticasPage from "@/app/superadmin/estadisticas/page";

type TabType = "empresas" | "solicitudes" | "estadisticas" | "incidencias";

const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
  { id: "empresas", label: "Empresas", icon: <FaBuilding className="text-lg" /> },
  { id: "solicitudes", label: "Solicitudes", icon: <FaClock className="text-lg" /> },
  { id: "estadisticas", label: "Estadísticas", icon: <FaChartBar className="text-lg" /> },
  { id: "incidencias", label: "Incidencias", icon: <FaExclamationTriangle className="text-lg" /> },
];

export default function AdministracionPage() {
  const [activeTab, setActiveTab] = useState<TabType>("empresas");

  return (
    <div className="w-full">
      <div className="w-full px-6 md:px-8 lg:px-10 pt-10 pb-16">
        {/* PESTAÑAS */}
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO DE LAS PESTAÑAS */}
        <div className="animate-fadeIn">
          {activeTab === "empresas" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <GestionEmpresas />
            </div>
          )}

          {activeTab === "solicitudes" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <SolicitudesPendientes />
            </div>
          )}

          {activeTab === "estadisticas" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <EstadisticasPage />
            </div>
          )}

          {activeTab === "incidencias" && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <GestionIncidencias esSuperadmin={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}