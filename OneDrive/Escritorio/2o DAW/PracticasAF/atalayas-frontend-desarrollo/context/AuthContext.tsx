"use client";
import { API_URL } from '@/lib/api';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Usuario {
  nombre: string;
  codigoRol: string;
  nombreEmpresa?: string;
  logoEmpresaUrl?: string;
  activo?: boolean;
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
    if (usuario?.invitado) return; // Si ya tenemos usuario, no hacemos nada

    try {
      const res = await fetch(
        `${API_URL}/auth/me`,
        { credentials: "include" }
      );

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
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
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
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}