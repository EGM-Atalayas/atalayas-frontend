// src/components/pages/Login.tsx
"use client";

import React, { useState } from "react";
import { FiChevronRight, FiMail, FiLock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import Link from "next/link";

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
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">

      {/* ── PANEL IZQUIERDO: Branding ── */}
      <div
        className="relative flex flex-col justify-between lg:w-[48%] px-10 sm:px-16 lg:px-24 py-12 lg:py-16"
        style={{
          background: "linear-gradient(160deg, #0c2340 0%, #0a1e35 40%, #081a2e 70%, #0d2847 100%)",
        }}
      >
        {/* Decoración sutil */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #3b9a8c 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
            transform: "translate(-40%, 40%)",
          }}
        />

        {/* Contenido superior */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          {/* Badge */}
          <div className="mb-6">
            <span
              className="inline-block text-[11px] font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full"
              style={{
                color: "#4ecca3",
                background: "rgba(78, 204, 163, 0.08)",
                border: "1px solid rgba(78, 204, 163, 0.15)",
              }}
            >
              Ciudad Empresarial
            </span>
          </div>

          {/* Título */}
          <h1
            className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] mb-5 tracking-tight"
            style={{ color: "#ffffff", fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            Bienvenido a{" "}
            <br />
            Atalayas
          </h1>

          {/* Subtítulo */}
          <p
            className="text-base sm:text-lg font-medium mb-4"
            style={{ color: "#4ecca3" }}
          >
            Tu espacio de trabajo conectado
          </p>

          {/* Descripción */}
          <p
            className="text-sm sm:text-[15px] leading-relaxed max-w-md"
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
          >
            Accede a formación, noticias y ventajas exclusivas para empleados del parque empresarial.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-8 lg:mt-0">
          <p
            className="text-xs tracking-wide"
            style={{ color: "rgba(255, 255, 255, 0.25)" }}
          >
            EGM Atalayas · Área empresarial
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO: Formulario ── */}
      <div
        className="flex-1 flex items-center justify-center px-10 sm:px-16 lg:px-24 py-10 lg:py-0"
        style={{ background: "#1a1d23" }}
      >
        <div className="w-full max-w-md">

          {/* Título del formulario */}
          <h2
            className="text-2xl sm:text-3xl font-bold mb-8"
            style={{ color: "#f0f0f0" }}
          >
            Iniciar sesión
          </h2>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Campo Email */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "rgba(255, 255, 255, 0.65)" }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <FiMail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "rgba(255, 255, 255, 0.25)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 text-sm rounded-lg transition-all duration-200 outline-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#e8e8e8",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(78, 204, 163, 0.4)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(78, 204, 163, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "rgba(255, 255, 255, 0.65)" }}
              >
                Contraseña
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "rgba(255, 255, 255, 0.25)" }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3.5 text-sm rounded-lg transition-all duration-200 outline-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#e8e8e8",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(78, 204, 163, 0.4)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(78, 204, 163, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Opciones avanzadas */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: "rgba(255, 255, 255, 0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                <FiChevronRight
                  className={`transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`}
                />
                Opciones avanzadas
              </button>

              {showAdvanced && (
                <div className="mt-3">
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "rgba(255, 255, 255, 0.5)" }}
                  >
                    Protocolo personalizado
                  </label>
                  <input
                    type="text"
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-all duration-200"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#e8e8e8",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(78, 204, 163, 0.4)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Error */}
            {errorMensaje && (
              <div
                className="text-sm text-center py-3 px-4 rounded-lg"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#f87171",
                }}
              >
                {errorMensaje}
              </div>
            )}

            {/* Botón Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-1 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: isLoading ? "rgba(255,255,255,0.05)" : "transparent",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: isLoading ? "rgba(255,255,255,0.4)" : "rgba(255, 255, 255, 0.85)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }
              }}
            >
              {isLoading ? <span className="loading-dots">Conectando</span> : "Entrar"}
            </button>
          </form>

          {/* Olvidaste contraseña */}
          <div className="text-center mt-6">
            <button
              type="button"
              className="text-sm transition-colors cursor-pointer"
              style={{ color: "#4ecca3" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6ee7b7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4ecca3")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255, 255, 255, 0.08)" }} />
            <span className="text-xs" style={{ color: "rgba(255, 255, 255, 0.25)" }}>
              ¿nueva empresa?
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(255, 255, 255, 0.08)" }} />
          </div>

          {/* Solicitar alta */}
          <p className="text-center text-sm" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
            ¿Tu empresa no está registrada?{" "}
            <Link
              href="/register-empresa"
              className="font-medium transition-colors"
              style={{ color: "#4ecca3" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6ee7b7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4ecca3")}
            >
              Solicitar alta
            </Link>
          </p>

          {/* Acceso invitado */}
          <div className="text-center mt-6">
            <button
              onClick={handleInvitado}
              className="text-xs transition-colors cursor-pointer"
              style={{ color: "rgba(255, 255, 255, 0.2)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
            >
              ← Continuar como invitado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;