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
        <div className="flex gap-2 mb-8 bg-white rounded-xl p-2 shadow-sm border border-slate-100 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
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
            <div>
              <GestionEmpresas />
            </div>
          )}

          {activeTab === "solicitudes" && (
            <div>
              <SolicitudesPendientes />
            </div>
          )}

          {activeTab === "estadisticas" && (
            <div>
              <EstadisticasPage />
            </div>
          )}

          {activeTab === "incidencias" && (
            <div>
              <GestionIncidencias esSuperadmin={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}