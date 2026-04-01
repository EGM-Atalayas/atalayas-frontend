// src/components/pages/Login.tsx
"use client";

import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { setUsuario, loginInvitado } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [errorMensaje, setErrorMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje("");
    setIsLoading(true);

    try {
      const [response] = await Promise.all([
        fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, protocol }),
        }),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      if (response.ok) {
        const data = await response.json();

        // La cookie HttpOnly la gestiona el backend automáticamente.
        // No guardamos el token en localStorage — credentials: "include"
        // se encarga de enviarlo en cada petición.
        setUsuario({
          nombre: data.nombre,
          apellidos: data.apellidos,
          codigoRol: data.codigoRol,
          nombreEmpresa: data.nombreEmpresa,
          logoEmpresaUrl: data.avatarUrl,
          empresaId: data.empresaId,
          usuarioId: data.usuarioId,
          email: data.email,
          activo: data.activo,
        });

        // Redirigir según rol
        if (data.codigoRol === "ROLE_ADMIN") {
          router.push("/superadmin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setErrorMensaje("Correo o contraseña incorrectos. Inténtalo de nuevo.");
      }
    } catch (error) {
      setErrorMensaje("Error de conexión. Verifica tu red e inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvitado = () => {
    loginInvitado();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <FaUserCircle className="text-5xl text-gray-300" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Iniciar sesión</h1>
            <p className="text-sm text-gray-400 mt-1">Accede a tu plataforma de formación</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* Opciones avanzadas */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiChevronRight
                  className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                />
                Opciones avanzadas
              </button>

              {showAdvanced && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Protocolo personalizado
                  </label>
                  <input
                    type="text"
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              )}
            </div>

            {errorMensaje && (
              <p className="text-red-600 font-semibold text-sm text-center">
                {errorMensaje}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-950 text-white font-bold py-3 rounded-xl w-full mt-2 hover:bg-blue-900 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Conectando..." : "Iniciar Sesión"}
            </button>
          </form>

          {/* Separador */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300">o</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Acceso invitado */}
          <button
            onClick={handleInvitado}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
          >
            <FiArrowLeft className="text-xs" />
            Continuar como invitado
          </button>
        </div>

        {/* Registro empresa */}
        <p className="text-center text-xs text-gray-400 mt-4">
          ¿Tu empresa no está registrada?{" "}
          <a href="/register-empresa" className="text-blue-600 hover:underline font-medium">
            Solicitar alta
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;