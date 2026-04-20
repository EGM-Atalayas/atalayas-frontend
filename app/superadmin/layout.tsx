"use client";

import React from "react";
import Header from "@/components/Header";
import DashboardHero from "@/components/ui/DashboardHero";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const pathname = usePathname();

  // 1. Extraemos el nombre para el saludo de Inicio
  const nombreParaMostrar = usuario?.nombre ? usuario.nombre.split(" ")[0] : "Admin";

  // 2. Definimos la lógica de textos dinámicos según la pestaña
  let heroConfig = {
    prefijo: "Bienvenido, ",
    titulo: nombreParaMostrar
  };

  // Cambiamos el texto según la ruta actual
  if (pathname.includes("/superadmin/empresas")) {
    heroConfig = {
      prefijo: "Gestiona las ",
      titulo: "Empresas"
    };
  } else if (pathname.includes("/superadmin/solicitudes")) {
    heroConfig = {
      prefijo: "Revisa las ",
      titulo: "Solicitudes"
    };
  } else if (pathname.includes("/superadmin/estadisticas")) {
    heroConfig = {
      prefijo: "Analiza las ",
      titulo: "Estadísticas"
    };
  } else if (pathname.includes("/superadmin/configuracion")) {
    heroConfig = {
      prefijo: "Panel de ",
      titulo: "Configuración"
    };
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-10">
      <Header />
      
      {/* El Hero ahora usa la configuración dinámica que definimos arriba */}
      <DashboardHero 
        prefijo={heroConfig.prefijo} 
        titulo={heroConfig.titulo} 
      />

      {/* Contenido de las páginas con el espaciado limpio que pusimos antes */}
      <main className="relative z-10 pt-8 sm:pt-10">
        {children}
      </main>
    </div>
  );
}