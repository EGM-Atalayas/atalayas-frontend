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

  type HeroConfig = {
    prefijo?: string;
    titulo: string;
    subtitulo?: string;
    imagenFondo?: string;
    objectPosition?: string;
  };

  let heroConfig: HeroConfig = {
    prefijo:        "Bienvenido, ",
    titulo:         nombreParaMostrar,
    subtitulo:      "Panel de administración de EGM Atalayas",
    imagenFondo:    "/background-dashboard.webp",
    objectPosition: "center 40%",
  };

  // El inicio es grande, el resto secciones medianas
  const variante: "inicio" | "seccion" = pathname === "/superadmin" ? "inicio" : "seccion";

  if (pathname.includes("/superadmin/administracion")) {
    heroConfig = {
      prefijo:      "Panel de ",
      titulo:       "Administración",
      subtitulo:    "Gestiona empresas, usuarios y configuración global de la plataforma",
      imagenFondo:  "/background-empresa.webp",
      objectPosition: "center 30%",
    };
  } else if (pathname.includes("/superadmin/empresas")) {
    heroConfig = {
      prefijo:      "Gestiona las ",
      titulo:       "Empresas",
      subtitulo:    "Alta, edición y seguimiento de todas las empresas del parque",
      imagenFondo:  "/background-empresa.webp",
      objectPosition: "center 50%",
    };
  } else if (pathname.includes("/superadmin/solicitudes")) {
    heroConfig = {
      prefijo:      "Revisa las ",
      titulo:       "Solicitudes",
      subtitulo:    "Gestiona las solicitudes pendientes de empresas y usuarios",
      imagenFondo:  "/background-comunidad.webp",
      objectPosition: "center 40%",
    };
  } else if (pathname.includes("/superadmin/estadisticas")) {
    heroConfig = {
      prefijo:      "Analiza las ",
      titulo:       "Estadísticas",
      subtitulo:    "Métricas de uso, formación y actividad en la plataforma",
      imagenFondo:  "/background-dashboard.webp",
      objectPosition: "center 60%",
    };
  } else if (pathname.includes("/superadmin/comunicados")) {
    heroConfig = {
      prefijo:      "Gestiona los ",
      titulo:       "Comunicados",
      imagenFondo:  "/background-comunicacion-empleado.webp",
      objectPosition: "center 40%",
    };
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-10 pt-20">
      <Header />
      <DashboardHero
        prefijo={heroConfig.prefijo}
        titulo={heroConfig.titulo}
        subtitulo={heroConfig.subtitulo}
        imagenFondo={heroConfig.imagenFondo}
        objectPosition={heroConfig.objectPosition}
        variante={variante}
      />
      <main className="relative z-10 pt-8 sm:pt-10">
        {children}
      </main>
      <ChatbotIA />
    </div>
  );
}