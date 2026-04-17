"use client";

import React from "react";
import Header from "@/components/Header";
import DashboardHero from "@/components/ui/DashboardHero";
import { useAuth } from "@/context/AuthContext";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  // Extraemos el usuario una sola vez para el Layout global
  const { usuario } = useAuth();
  const nombreParaMostrar = usuario?.nombre ? usuario.nombre.split(" ")[0] : "Admin";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-10">
      <Header />
      
      {/* 1. El Hero gigante aparece en TODAS las pantallas automáticamente */}
      <DashboardHero prefijo="Hola, " titulo={nombreParaMostrar} />

      {/* 2. AQUÍ ESTÁ LA MAGIA: 
             Cambiamos el margen negativo (-mt-6) por un "padding top" (pt-8 sm:pt-10) 
             para que todas las páginas respiren y tengan un hueco limpio debajo de la foto. */}
      <main className="relative z-10 pt-8 sm:pt-10">
        {children}
      </main>
    </div>
  );
}