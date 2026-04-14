"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL, apiFetch } from "@/lib/api";
import Header from "@/components/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, setUsuario } = useAuth();
  const [verificando, setVerificando] = useState(true);
  const router = useRouter();

  // Verificamos sesión activa contra el endpoint correcto
  useEffect(() => {
    if (usuario) {
      setVerificando(false);
      return;
    }

    apiFetch(`${API_URL}/auth/me`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("No autenticado");
      })
      .then((data) => setUsuario(data))
      .catch(() => setUsuario(null))
      .finally(() => setVerificando(false));
  }, []);

  // Redirigimos al login si no hay sesión válida
  useEffect(() => {
    if (!verificando && !usuario) {
      router.replace("/login");
    }
  }, [verificando, usuario]);

  // Redirigimos al invitado a la landing — no tiene acceso al dashboard
  useEffect(() => {
    if (!verificando && usuario?.codigoRol === "INVITADO") {
      router.replace("/");
    }
  }, [verificando, usuario]);

  // Pantalla de verificación mientras comprobamos la sesión
  if (verificando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--marino)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-7 h-7 border-2 rounded-full animate-spin"
            style={{
              borderColor:    "var(--gris-borde)",
              borderTopColor: "var(--verde-oliva)",
            }}
          />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  // Mientras redirige al invitado no renderizamos nada
  if (!usuario || usuario.codigoRol === "INVITADO") return null;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--gris-pagina)" }}>
      <Header />
      <main className="max-w-7xl mx-auto px-8 pb-8">
        {children}
      </main>
    </div>
  );
}