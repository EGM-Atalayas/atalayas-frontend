// src/components/pages/Login.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FiChevronRight, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import Link from "next/link";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { setUsuario, loginInvitado } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);
  const [protocol, setProtocol] = useState("");
  const [errorMensaje, setErrorMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje("");
    setIsLoading(true);

    try {
      if (rememberEmail) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

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
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: "var(--blanco)" }}>

      {/* ── PANEL IZQUIERDO: Branding ── oculto en móvil, visible en desktop */}
      <div
        className="hidden lg:flex relative flex-col justify-between lg:w-[48%] px-10 sm:px-16 lg:px-24 py-12 lg:py-16"
        style={{
          background: "url('/background-login.jpg') no-repeat center center",
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

          {/* Logo */}
          <div className="mb-5 -ml-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Atalayas" className="h-16 sm:h-40 w-auto brightness-0 invert" />
          </div>

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
        className="flex-1 flex flex-col items-center justify-start lg:justify-center px-0 lg:px-24 pt-0 pb-10 lg:py-0 min-h-screen lg:min-h-0"
        style={{ background: "#ffffff" }}
      >
        {/* Branding visible solo en móvil */}
        <div className="lg:hidden w-full px-6 py-10 mb-2" style={{ background: "url('/background-login.jpg')" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Atalayas" className="h-20 w-auto mb-4 brightness-0 invert mx-auto block" />
          <p className="text-base font-medium mb-2" style={{ color: "#4ecca3" }}>
            Tu espacio de trabajo conectado
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Accede a formación, noticias y ventajas exclusivas para empleados del parque empresarial.
          </p>
        </div>
        <div className="w-full max-w-md px-6 lg:px-0 py-8 lg:py-0">

          {/* Título del formulario */}
          <h2
            className="text-2xl sm:text-3xl font-bold mb-8 text-center"
            style={{ color: "#0f1923" }}
          >
            Iniciar sesión
          </h2>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Campo Email */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#3D4A5C" }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <FiMail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "#6B7A8D" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 text-sm rounded-lg transition-all duration-200 outline-none"
                  style={{
                    background: "#f5f6f8",
                    border: "1px solid #C8CDD8",
                    color: "#0f1923",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1B3F7E";
                    e.target.style.boxShadow = "0 0 0 3px rgba(27, 63, 126, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#C8CDD8";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#3D4A5C" }}
              >
                Contraseña
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "#6B7A8D" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3.5 text-sm rounded-lg transition-all duration-200 outline-none"
                  style={{
                    background: "#f5f6f8",
                    border: "1px solid #C8CDD8",
                    color: "#0f1923",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1B3F7E";
                    e.target.style.boxShadow = "0 0 0 3px rgba(27, 63, 126, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#C8CDD8";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm focus:outline-none"
                  style={{ color: "#6B7A8D" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4A5C")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7A8D")}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Opciones avanzadas y Recordarme */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs transition-colors self-start"
                style={{ color: "#6B7A8D" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4A5C")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7A8D")}
              >
                <FiChevronRight
                  className={`transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`}
                />
                Opciones avanzadas
              </button>

              {showAdvanced && (
                <div className="mt-1">
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "#6B7A8D" }}
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
                      background: "#f5f6f8",
                      border: "1px solid #C8CDD8",
                      color: "#0f1923",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#1B3F7E";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#C8CDD8";
                    }}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer group w-max">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer appearance-none outline-none transition-all"
                    style={{
                      border: rememberEmail ? "1px solid #1B3F7E" : "1px solid #C8CDD8",
                      background: rememberEmail ? "#1B3F7E" : "#f5f6f8",
                    }}
                  />
                  {rememberEmail && (
                    <svg className="w-3 h-3 text-white absolute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs transition-colors" style={{ color: "#6B7A8D" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4A5C")} onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7A8D")}>
                  Recordar mi correo
                </span>
              </label>
            </div>

            {/* Error */}
            {errorMensaje && (
              <div
                className="text-sm text-center py-3 px-4 rounded-lg"
                style={{
                  background: "#FDECEA",
                  border: "1px solid #C84B31",
                  color: "#C84B31",
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
                background: isLoading ? "#C8CDD8" : "#0D1B2E",
                border: "1px solid #0D1B2E",
                color: "#ffffff",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.background = "#152540";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.background = "#0D1B2E";
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
              style={{ color: "#1B3F7E" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2A5298")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#1B3F7E")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px" style={{ background: "#C8CDD8" }} />
            <span className="text-xs" style={{ color: "#6B7A8D" }}>
              ¿nueva empresa?
            </span>
            <div className="flex-1 h-px" style={{ background: "#C8CDD8" }} />
          </div>

          {/* Solicitar alta */}
          <p className="text-center text-sm" style={{ color: "#6B7A8D" }}>
            ¿Tu empresa no está registrada?{" "}
            <Link
              href="/register-empresa"
              className="font-medium transition-colors"
              style={{ color: "#1B3F7E" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2A5298")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#1B3F7E")}
            >
              Solicitar alta
            </Link>
          </p>

          {/* Acceso invitado */}
          <div className="text-center mt-6">
            <button
              onClick={handleInvitado}
              className="text-xs transition-colors cursor-pointer"
              style={{ color: "#6B7A8D" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4A5C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7A8D")}
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