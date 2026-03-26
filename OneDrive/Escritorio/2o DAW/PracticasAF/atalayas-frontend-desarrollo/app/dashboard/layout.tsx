// app/dashboard/layout.tsx
"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import DashboardSidebar from "@/components/ui/DashboardSidebar";
import SuperAdminSidebar from "@/components/ui/SuperAdminSidebar";
import Header from "@/components/Header";
import { NAV_ROUTES } from "@/lib/routes";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, setUsuario } = useAuth();
  const [verificando, setVerificando] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (usuario) {
      setVerificando(false);
      return;
    }

    fetch(`${API_URL}/users/me`, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("No autenticado");
      })
      .then((data) => {
        setUsuario({
          nombre: data.nombre,
          codigoRol: data.codigoRol,
          nombreEmpresa: data.nombreEmpresa,
          logoEmpresaUrl: data.logoEmpresaUrl,
        });
      })
      .catch(() => {
        setUsuario(null);
      })
      .finally(() => {
        setVerificando(false);
      });
  }, []);

  useEffect(() => {
    if (!verificando && !usuario) {
      router.replace("/login");
    }
  }, [verificando, usuario]);

  if (verificando) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <p className="text-white text-xl">Verificando sesión...</p>
      </div>
    );
  }

  if (!usuario) return null;

  if (usuario.codigoRol === "ROLE_ADMIN") {
    return (
      <div className="flex min-h-screen bg-[#F7F6F3]">
        <SuperAdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  if (usuario.codigoRol === "ROLE_ADMIN_EMPRESA") {
    return (
      <div className="flex min-h-screen bg-[#F7F6F3]">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // Los invitados tienen su propia vista completa sin navegación
  if (usuario.codigoRol === "INVITADO") {
    return <>{children}</>;
  }

  // Para Empleados
  const getActiveTab = (): "Inicio" | "Onboarding" | "Formación" | "Comunicación" | "Administración" => {
    if (pathname.includes("/onboarding")) return "Onboarding";
    if (pathname.includes("/formacion")) return "Formación";
    if (pathname.includes("/noticias")) return "Comunicación";
    if (pathname.includes("/admin")) return "Administración";
    return "Inicio";
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans flex flex-col">
      <Header
        key={activeTab} // Fuerza a que se actualice el estado interno "active" cuando cambiamos de pestaña
        defaultActive={activeTab}
        onNavChange={(item) => router.push(NAV_ROUTES[item])}
        logoEmpresa={usuario?.logoEmpresaUrl}
      />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}