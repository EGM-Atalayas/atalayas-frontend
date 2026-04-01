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
  nombreRol?: string;
  invitado?: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  logout: () => Promise<void>;
  loginInvitado: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const isGuest = localStorage.getItem("guest");
    if (isGuest) {
      loginInvitado();
    } else {
      checkSession();
    }
  }, []);

  const checkSession = async () => {
    if (usuario?.invitado) return;
    try {
      const res = await apiFetch(`${API_URL}/auth/me`);
      if (!res.ok) {
        setUsuario(null);
        return;
      }
      const data: Usuario = await res.json();
      if (!data.activo) {
        await logout();
        return;
      }
      setUsuario(data);
    } catch {
      setUsuario(null);
    }
  };

  const logout = async () => {
    try {
      await apiFetch(`${API_URL}/auth/logout`, { method: "POST" });
    } finally {
      // Limpiamos también el guest por si acaso
      localStorage.removeItem("guest");
      setUsuario(null);
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
    setUsuario(guestUser);
  };

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, logout, loginInvitado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}