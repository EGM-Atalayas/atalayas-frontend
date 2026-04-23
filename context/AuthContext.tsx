"use client";

import { API_URL, apiFetch } from "@/lib/api";
import { createContext, useContext, useState, useEffect } from "react";
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
  const [cargando, setCargando] = useState(false); // Cambiado a false para no mostrar loading

  useEffect(() => {
    recuperarSesion();
  }, []);

  const recuperarSesion = async () => {
    try {
      const isGuest = localStorage.getItem("guest");
      const token = localStorage.getItem("accessToken");

      if (isGuest) {
        loginInvitado();
        return;
      }

      if (!token) {
        console.log("[AuthContext] No hay token ni guest");
        return;
      }

      console.log("[AuthContext] ✅ Intentando recuperar sesión con token");
      const res = await apiFetch(`${API_URL}/auth/me`);

      if (!res.ok) {
        console.log("[AuthContext] ❌ /auth/me no respondió OK:", res.status);
        localStorage.removeItem("accessToken");
        return;
      }

      const data: Usuario = await res.json();
      console.log("[AuthContext] 📦 /auth/me devolvió:", { nombre: data.nombre, rol: data.codigoRol });

      if (!data.activo) {
        console.log("[AuthContext] ❌ Usuario no activo");
        localStorage.removeItem("accessToken");
        return;
      }

      console.log("[AuthContext] ✅ Sesión recuperada para:", data.nombre);
      setUsuario(data);
    } catch (error) {
      console.error("[AuthContext] ❌ Error recuperando sesión:", error);
    }
  };

  const logout = async () => {
    try {
      await apiFetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch (error) {
      console.error("[AuthContext] Error en logout:", error);
    } finally {
      localStorage.removeItem("guest");
      localStorage.removeItem("accessToken");
      setUsuario(null);
    }
  };

  // Función auxiliar para guardar usuario
  const guardarUsuario = (nuevoUsuario: Usuario | null) => {
    setUsuario(nuevoUsuario);
    if (nuevoUsuario) {
      console.log("[AuthContext] Usuario guardado:", nuevoUsuario.nombre);
    }
  };

  const loginInvitado = () => {
    const guestUser: Usuario = {
      nombre: "Invitado",
      codigoRol: "INVITADO",
      invitado: true,
      activo: true,
    };
    localStorage.setItem("guest", "true");
    guardarUsuario(guestUser);
  };

  // Si ya sabemos quién eres (o si sabemos que no estás logueado), mostramos la app normal
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