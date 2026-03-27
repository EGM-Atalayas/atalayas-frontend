"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

import SuperAdminSidebar from "@/components/ui/SuperAdminSidebar";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario, setUsuario } = useAuth();
  const [verificando, setVerificando] = useState(true);
  const router = useRouter();

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
      <div className="min-h-screen bg-[#100D3E] flex items-center justify-center">
        <p className="text-white text-xl">Verificando sesión...</p>
      </div>
    );
  }

  if (!usuario) return null;
  console.log("ROL ACTUAL:", usuario.codigoRol);
  const esSuperAdmin = usuario.codigoRol === "ROLE_ADMIN";

  return (
    <>
      {esSuperAdmin ? (
        <div className="flex min-h-screen bg-slate-50">
          <SuperAdminSidebar />
          <main className="flex-1">{children}</main>
        </div>
      ) : (
        <>{children}</>
      )}
    </>
  );
}