"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Atajo oculto: Ctrl+Shift+P → abre la página de presentación
function useShowcaseShortcut() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        window.open("/showcase", "_blank");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
import { useAuth } from "@/context/AuthContext";
import { API_URL, apiFetch } from "@/lib/api";
import Header from "@/components/Header";
import ChatbotIA from "@/components/ui/ChatbotIA";
import AppTutorial from "@/components/tutorial/AppTutorial";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useShowcaseShortcut();
  const { usuario, guardarUsuario } = useAuth();
  const [verificando, setVerificando] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
      .then((data) => guardarUsuario(data))
      .catch(() => guardarUsuario(null))
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

  // Redirigimos al superadmin al panel principal solo si está en la raíz del dashboard
  useEffect(() => {
    if (!verificando && usuario?.codigoRol === "ROLE_ADMIN" && pathname === "/dashboard") {
      router.replace("/superadmin");
    }
  }, [verificando, usuario, pathname]);

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
              borderTopColor: "var(--lima)",
            }}
          />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  // Mientras redirige no renderizamos nada
  if (!usuario || usuario.codigoRol === "INVITADO" || (usuario.codigoRol === "ROLE_ADMIN" && pathname === "/dashboard")) return null;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--gris-pagina)" }}>
      <Header />
      <main className="pb-2">
        {children}
      </main>
      <ChatbotIA />
      <AppTutorial />
    </div>
  );
}
