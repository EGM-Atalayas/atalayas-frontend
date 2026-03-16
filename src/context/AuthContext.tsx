import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Usuario {
  nombre: string;
  codigoRol: string;
  nombreEmpresa?: string;
  logoEmpresaUrl?: string;
  activo?: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (u: Usuario | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch(
        'https://atalayas-backend.onrender.com/api/v1/auth/me',
        { credentials: 'include' }
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
      await fetch('https://atalayas-backend.onrender.com/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUsuario(null);
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}