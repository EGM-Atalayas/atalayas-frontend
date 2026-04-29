// src/components/pages/Login.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FiChevronRight, FiChevronLeft, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";
import Link from "next/link";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { guardarUsuario, loginInvitado } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
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
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
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

        // Guardar token para peticiones cross-domain (Vercel → Render)
        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
        }

        console.log("[Login] Usuario logueado:", { nombre: data.nombre, codigoRol: data.codigoRol });

        guardarUsuario({
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

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
    } catch { /* silencioso */ } finally {
      setForgotLoading(false);
      setForgotSent(true);
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
        className="hidden lg:flex relative flex-col justify-between lg:w-[48%] py-12 lg:py-16"
        style={{
          background:     "url('/background-login.webp') no-repeat center center",
          backgroundSize: "cover",
        }}
      >
        {/* Sombreado muy leve */}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.28)" }} />

        {/* Logo */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Atalayas" className="h-32 sm:h-44 w-auto brightness-0 invert" />
        </div>

      </div>

      {/* ── PANEL DERECHO: Formulario ── */}
      <div
        className="flex-1 flex flex-col items-center justify-start lg:justify-center px-0 lg:px-24 pt-0 pb-10 lg:py-0 min-h-screen lg:min-h-0"
        style={{ background: "#ffffff" }}
      >
        {/* Branding visible solo en móvil */}
        <div className="lg:hidden w-full px-6 py-12 mb-2 relative flex flex-col items-center"
          style={{ background: "url('/background-login.webp') center/cover no-repeat" }}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.28)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Atalayas" className="relative z-10 h-20 w-auto brightness-0 invert" />
        </div>

        <div className="w-full max-w-md px-6 lg:px-0 py-8 lg:py-0">

          {/* Volver */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm transition-colors cursor-pointer"
              style={{ color: "#1B3F7E" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2A5298")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#1B3F7E")}
            >
              <FiChevronLeft size={15} /> Volver
            </button>
          </div>

          {/* Título del formulario */}
          <h2
            className="text-4xl sm:text-5xl font-bold mb-5 text-center"
            style={{ color: "#1B3F7E", fontFamily: "var(--font-poppins), sans-serif", letterSpacing: "-0.03em" }}
          >
            Iniciar sesión
          </h2>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Campo Email */}
            <div>
              <label
                className="block text-base font-medium mb-2"
                style={{ color: "#3D4A5C" }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <FiMail
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "#6B7A8D" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 text-base rounded-lg transition-all duration-200 outline-none"
                  style={{
                    background: "#f5f6f8",
                    border: "1px solid rgba(27,63,126,0.22)",
                    color: "#0f1923",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1B3F7E";
                    e.target.style.boxShadow = "0 0 0 3px rgba(27, 63, 126, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(27,63,126,0.22)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                className="block text-base font-medium mb-2"
                style={{ color: "#3D4A5C" }}
              >
                Contraseña
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "#6B7A8D" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3.5 text-base rounded-lg transition-all duration-200 outline-none"
                  style={{
                    background: "#f5f6f8",
                    border: "1px solid rgba(27,63,126,0.22)",
                    color: "#0f1923",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1B3F7E";
                    e.target.style.boxShadow = "0 0 0 3px rgba(27, 63, 126, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(27,63,126,0.22)";
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
                className="flex items-center gap-2 text-sm font-medium transition-colors self-start"
                style={{ color: "#1B3F7E" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#2A5298")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#1B3F7E")}
              >
                <FiChevronRight
                  size={16}
                  className={`transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`}
                />
                Opciones avanzadas
              </button>

              {showAdvanced && (
                <div className="rounded-xl px-5 py-5 flex flex-col gap-4"
                  style={{ background: "#f5f6f8", border: "1px solid rgba(27,63,126,0.15)" }}>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: "#3D4A5C" }}>
                      Protocolo personalizado
                    </label>
                    <input
                      type="text"
                      value={protocol}
                      onChange={(e) => setProtocol(e.target.value)}
                      placeholder="Opcional"
                      className="w-full px-4 py-3.5 text-sm rounded-lg outline-none transition-all duration-200"
                      style={{
                        background: "#ffffff",
                        border: "1px solid rgba(27,63,126,0.22)",
                        color: "#0f1923",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#1B3F7E";
                        e.target.style.boxShadow = "0 0 0 3px rgba(27,63,126,0.08)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(27,63,126,0.22)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
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
                <span className="text-sm transition-colors" style={{ color: "#6B7A8D" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4A5C")} onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7A8D")}>
                  Recordar contraseña
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
              className="w-full py-4 rounded-lg text-base font-semibold tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
              style={{
                background:           isLoading ? "rgba(27,63,126,0.5)" : "rgba(27,63,126,0.82)",
                border:               "1px solid rgba(255,255,255,0.18)",
                color:                "#ffffff",
                backdropFilter:       "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow:            "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(27,63,126,0.25)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.background = "rgba(27,63,126,0.95)";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.background = "rgba(27,63,126,0.82)";
              }}
            >
              {isLoading ? <span className="loading-dots">Conectando</span> : "Entrar"}
            </button>
          </form>

          {/* Olvidaste contraseña */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => { setShowForgotModal(true); setForgotEmail(email); setForgotSent(false); }}
              className="text-sm transition-colors cursor-pointer"
              style={{ color: "#1B3F7E" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2A5298")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#1B3F7E")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* ── Zona Nueva empresa ── */}
          <div className="mt-10 rounded-2xl overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #4a7cc9 0%, #2d5494 100%)" }}>
            <div className="relative px-6 py-6 flex flex-col items-center gap-3 text-center">
              <div>
                <p className="text-lg font-semibold leading-snug" style={{ color: "#ffffff" }}>
                  ¿Tu empresa aún no está en Atalayas?
                </p>
                <p className="text-sm leading-relaxed mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Regístrala y accede a la plataforma del área empresarial.
                </p>
              </div>
              <Link
                href="/register-empresa"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background:           "rgba(255,255,255,0.15)",
                  border:               "1px solid rgba(255,255,255,0.3)",
                  color:                "#ffffff",
                  backdropFilter:       "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow:            "inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              >
                Solicitar alta de empresa →
              </Link>
            </div>
          </div>

          {/* Acceso invitado */}
          <div className="text-center mt-3">
            <button
              onClick={handleInvitado}
              className="text-sm transition-colors cursor-pointer"
              style={{ color: "#6B7A8D" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4A5C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7A8D")}
            >
              ← Continuar como invitado
            </button>
          </div>
        </div>
      </div>
      {/* ── MODAL: Recuperar contraseña ── */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForgotModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-8 flex flex-col gap-5"
            style={{ background: "#ffffff", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
          >
            {!forgotSent ? (
              <>
                <div>
                  <h3 className="text-2xl font-bold mb-1" style={{ color: "#1B3F7E", fontFamily: "var(--font-poppins), sans-serif" }}>
                    Recuperar contraseña
                  </h3>
                  <p className="text-sm" style={{ color: "#6B7A8D" }}>
                    Escribe tu correo y te enviaremos un enlace para restablecerla.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#3D4A5C" }}>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-all"
                    style={{ background: "#f5f6f8", border: "1px solid rgba(27,63,126,0.22)", color: "#0f1923" }}
                    onFocus={(e) => { e.target.style.borderColor = "#1B3F7E"; e.target.style.boxShadow = "0 0 0 3px rgba(27,63,126,0.08)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(27,63,126,0.22)"; e.target.style.boxShadow = "none"; }}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-3 rounded-lg text-sm font-semibold transition-colors border"
                    style={{ color: "#6B7A8D", borderColor: "#e2e5ea", background: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f6f8")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleForgotPassword}
                    disabled={!forgotEmail || forgotLoading}
                    className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                    style={{ background: "#1B3F7E", color: "#ffffff" }}
                    onMouseEnter={(e) => { if (forgotEmail && !forgotLoading) e.currentTarget.style.background = "#2A5298"; }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#1B3F7E")}
                  >
                    {forgotLoading ? "Enviando..." : "Enviar enlace"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#e8f0fe" }}>
                    <FiMail size={26} style={{ color: "#1B3F7E" }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: "#1B3F7E" }}>Correo enviado</h3>
                    <p className="text-sm" style={{ color: "#6B7A8D" }}>
                      Si <strong>{forgotEmail}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en breve.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="w-full py-3 rounded-lg text-sm font-semibold"
                    style={{ background: "#1B3F7E", color: "#ffffff" }}
                  >
                    Entendido
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;