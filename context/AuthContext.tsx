"use client";

import { API_URL, apiFetch } from "@/lib/api";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface Usuario {
  nombre: string;
  apellidos?: string;
  codigoRol: string;
  nombreEmpresa?: string;
  logoEmpresaUrl?: string;
  activo?: boolean;
  empresaId?: string;
  usuarioId?: string;
  email?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  nombreRol?: string;
  invitado?: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  guardarUsuario: (u: Usuario | null) => void;
  logout: () => Promise<void>;
  loginInvitado: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  const guardarUsuario = useCallback((nuevoUsuario: Usuario | null) => {
    setUsuario(nuevoUsuario);
    if (nuevoUsuario) {
      console.log("[AuthContext] Usuario guardado:", nuevoUsuario.nombre);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch (error) {
      console.error("[AuthContext] Error en logout:", error);
    } finally {
      localStorage.removeItem("guest");
      localStorage.removeItem("accessToken");
      // Limpiar progresos locales para que no se mezclen entre usuarios
      Object.keys(localStorage).filter(k => k.startsWith("egm_")).forEach(k => localStorage.removeItem(k));
      // Limpiar caché de React Query
      import("@/components/providers/QueryProvider").then(m => m.queryClient?.clear());
      setUsuario(null);
      router.push("/login");
    }
  }, [router]);

  const checkSession = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/auth/me`);
      if (!res.ok) throw new Error("Token inválido o expirado");

      const data = await res.json();
      const userData = data.data || data.usuario || data;

      if (userData.activo === false) {
        await logout();
        return;
      }

      setUsuario(userData);
    } catch (err) {
      console.warn("[AuthContext] ❌ Error recuperando sesión:", err);
      localStorage.removeItem("accessToken");
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, [logout]);

  const loginInvitado = useCallback(() => {
    const guestUser: Usuario = {
      nombre: "Invitado",
      codigoRol: "INVITADO",
      invitado: true,
      activo: true,
    };
    localStorage.setItem("guest", "true");
    guardarUsuario(guestUser);
    setCargando(false);
  }, [guardarUsuario]);

  // Al montar la app: recuperar sesión
  useEffect(() => {
    const isGuest = localStorage.getItem("guest");
    const token = localStorage.getItem("accessToken");

    if (isGuest) {
      loginInvitado();
    } else if (token) {
      checkSession();
    } else {
      setCargando(false);
    }
  }, [loginInvitado, checkSession]);

  // Solo proteger rutas de dashboard: redirigir a login si no hay sesión
  useEffect(() => {
    if (cargando) return;

    const path = window.location.pathname;
    const esRutaProtegida = path.startsWith("/dashboard") || path.startsWith("/superadmin");

    if (!esRutaProtegida) return;

    const isGuest = localStorage.getItem("guest");
    const token = localStorage.getItem("accessToken");

    if (!isGuest && !token) {
      router.replace("/login");
    }
  }, [cargando, router]);

  if (cargando) {
    return (
      <AuthContext.Provider value={{ usuario, setUsuario, guardarUsuario, logout, loginInvitado }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, guardarUsuario, logout, loginInvitado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
