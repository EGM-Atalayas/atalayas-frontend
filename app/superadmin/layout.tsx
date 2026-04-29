"use client";

export const dynamic = "force-dynamic";

import React from "react";
import Header from "@/components/Header";
import DashboardHero from "@/components/ui/DashboardHero";
import ChatbotIA from "@/components/ui/ChatbotIA";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const pathname = usePathname();

  const nombreParaMostrar = usuario?.nombre ? usuario.nombre.split(" ")[0] : "Admin";

  let heroConfig = {
    prefijo: "Bienvenido, ",
    titulo: nombreParaMostrar
  };

  if (pathname.includes("/superadmin/administracion")) {
    heroConfig = {
      prefijo: "Panel de ",
      titulo: "Administración"
    };
  } else if (pathname.includes("/superadmin/empresas")) {
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
  } else if (pathname.includes("/superadmin/comunicados")) {
    heroConfig = {
      prefijo: "Gestiona los ",
      titulo: "Comunicados"
    };
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-10 pt-20">
      <Header />
      <DashboardHero 
        prefijo={heroConfig.prefijo} 
        titulo={heroConfig.titulo} 
      />
      <main className="relative z-10 pt-8 sm:pt-10">
        {children}
      </main>
      <ChatbotIA />
    </div>
  );
}