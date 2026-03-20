// src/components/auth/ProtectedRoute.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario, setUsuario } = useAuth();
  const [verificando, setVerificando] = useState(true);
  const router = useRouter();

  // ✅ Todos los useEffect juntos arriba, antes de cualquier return
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
  }, [verificando, usuario]); // ← también movido arriba

  if (verificando) {
    return (
      <div className="min-h-screen bg-[#100D3E] flex items-center justify-center">
        <p className="text-white text-xl">Verificando sesión...</p>
      </div>
    );
  }

  if (!usuario) return null; // ← necesario para evitar el error de antes

  return (
    <>
      <main className="min-h-screen bg-slate-50">
        {children}
      </main>
    </>
  );
}