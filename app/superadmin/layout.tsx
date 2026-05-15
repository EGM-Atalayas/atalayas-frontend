"use client";

export const dynamic = "force-dynamic";

import React from "react";
import Header from "@/components/Header";
import DashboardHero from "@/components/ui/DashboardHero";
import ChatbotIA from "@/components/ui/ChatbotIA";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Solo ROLE_ADMIN puede acceder al panel de superadmin
  React.useEffect(() => {
    if (usuario !== undefined && usuario !== null && usuario.codigoRol !== "ROLE_ADMIN") {
      router.replace("/dashboard");
    }
  }, [usuario]);

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
    imagenFondo:    "/background-dashboard.webp",
    objectPosition: "center 40%",
  };

  // El inicio es grande, el resto secciones medianas
  const variante: "inicio" | "seccion" = pathname === "/superadmin" ? "inicio" : "seccion";

  if (pathname.includes("/superadmin/administracion")) {
    heroConfig = {
      prefijo:      "Panel de ",
      titulo:       "Administración",
      imagenFondo:  "/hero-administracion.webp",
      objectPosition: "center 30%",
    };
  } else if (pathname.includes("/superadmin/empresas")) {
    heroConfig = {
      prefijo:      "Gestiona las ",
      titulo:       "Empresas",
      imagenFondo:  "/hero-administracion.webp",
      objectPosition: "center 50%",
    };
  } else if (pathname.includes("/superadmin/solicitudes")) {
    heroConfig = {
      prefijo:      "Revisa las ",
      titulo:       "Solicitudes",
      imagenFondo:  "/background-comunidad.webp",
      objectPosition: "center 40%",
    };
  } else if (pathname.includes("/superadmin/estadisticas")) {
    heroConfig = {
      prefijo:      "Analiza las ",
      titulo:       "Estadísticas",
      imagenFondo:  "/background-dashboard.webp",
      objectPosition: "center 60%",
    };
  } else if (pathname.includes("/superadmin/comunicados")) {
    heroConfig = {
      prefijo:      "Gestiona los ",
      titulo:       "Comunicados",
      imagenFondo:  "/hero-comunicacion.webp",
      objectPosition: "center 40%",
    };
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--gris-pagina)" }}>
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
