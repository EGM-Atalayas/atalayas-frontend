"use client";

import { API_URL, apiFetch } from "@/lib/api";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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

// Lista de páginas que se pueden ver sin estar logueado
const RUTAS_PUBLICAS = ["/login", "/register-empresa", "/terminos", "/privacidad"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Al montar la app (ej: al hacer F5), intentamos recuperar la sesión
    const isGuest = localStorage.getItem("guest");
    const token = localStorage.getItem("accessToken");

    if (isGuest) {
      loginInvitado();
    } else if (token) {
      checkSession();
    } else {
      // Si no hay sesión y la página NO es pública, expulsamos al login
      if (!RUTAS_PUBLICAS.includes(pathname ?? "")) {
        router.replace("/login");
      }
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSession = async () => {
    try {
      console.log("[AuthContext] 🔄 Intentando recuperar sesión con el token guardado...");
      const res = await apiFetch(`${API_URL}/auth/me`);
      
      if (!res.ok) {
        throw new Error("Token inválido o expirado");
      }

      const data = await res.json();
      const userData = data.data || data.usuario || data; // Extrae el usuario según el formato del backend

      // Si el backend dice explícitamente que está desactivado, lo echamos
      if (userData.activo === false) {
        await logout();
        return;
      }

      setUsuario(userData);
      console.log(`[AuthContext] ✅ Sesión recuperada: Bienvenido de nuevo, ${userData.nombre}`);

    } catch (err) {
      console.warn("[AuthContext] ❌ Error recuperando sesión:", err);
      // Limpiamos los rastros y redirigimos si no estamos en una página pública
      localStorage.removeItem("accessToken");
      setUsuario(null);
      if (!RUTAS_PUBLICAS.includes(pathname ?? "")) {
        router.replace("/login");
      }
    } finally {
      setCargando(false);
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
      router.push("/login");
    }
  };

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
    setCargando(false);
  };

  // --- CONTROL VISUAL DURANTE LA CARGA ---
  // Si estamos en una ruta pública, NO mostramos la pantalla de carga, 
  // así los Términos y Condiciones se ven al instante.
  const esRutaPublica = RUTAS_PUBLICAS.includes(pathname ?? "");

  if (cargando && !esRutaPublica) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--azul-egm, #0d1b2e)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-white text-sm font-semibold tracking-widest uppercase opacity-80">
            Recuperando sesión...
          </p>
        </div>
      </div>
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