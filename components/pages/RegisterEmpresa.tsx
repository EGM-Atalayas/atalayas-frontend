// src/components/pages/RegisterEmpresa.tsx
"use client";

import React, { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import Link from "next/link";

const SECTORES = [
  "Tecnología",
  "Salud",
  "Educación",
  "Finanzas",
  "Construcción",
  "Logística",
  "Comercio",
  "Industria",
  "Servicios",
  "Otro",
];

const RegisterEmpresa: React.FC = () => {
  const router = useRouter();

  const [paso, setPaso] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");

  const [formData, setFormData] = useState({
    // Paso 1: Empresa
    nombreEmpresa: "",
    cif: "",
    sector: "",
    emailEmpresa: "",
    telefono: "",
    // Paso 2: Admin
    nombreAdmin: "",
    apellidosAdmin: "",
    emailAdmin: "",
    passwordAdmin: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const nextStep = () => {
    setErrorMensaje("");
    setPaso((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrorMensaje("");
    if (paso === 1) {
      router.push("/login");
    } else {
      setPaso((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje("");
    setIsLoading(true);

    const payload = {
      nombreEmpresa: formData.nombreEmpresa,
      cif: formData.cif,
      emailContacto: formData.emailEmpresa,
      nombre: formData.nombreAdmin,
      apellidos: formData.apellidosAdmin,
      emailAdmin: formData.emailAdmin,
      password: formData.passwordAdmin,
    };

    try {
      const response = await fetch(`${API_URL}/empresas/solicitud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setPaso(3); // Éxito
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error 400 from backend:", errorData);
        
        // Extract exact message from common backend error formats (e.g. Spring Boot or NestJS)
        let errMsg = "Error del servidor: 400";
        if (errorData.message) {
           errMsg = Array.isArray(errorData.message) ? errorData.message.join(", ") : errorData.message;
        } else if (errorData.errors) {
           errMsg = JSON.stringify(errorData.errors);
        } else if (errorData.error) {
           errMsg = errorData.error;
        }

        setErrorMensaje(errMsg);
      }
    } catch (error) {
      setErrorMensaje("No se ha podido conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Estilos de los inputs (consistente con login) ─── */
  const inputStyle: React.CSSProperties = {
    background: "#f5f6f8",
    border: "1px solid #C8CDD8",
    color: "#0f1923",
    borderRadius: "0.5rem",
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#1B3F7E";
    e.target.style.boxShadow = "0 0 0 3px rgba(27, 63, 126, 0.08)";
  };

  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#C8CDD8";
    e.target.style.boxShadow = "none";
  };

  /* ─── Stepper del panel izquierdo ─── */
  const steps = [
    { num: 1, title: "Datos de la empresa", subtitle: "CIF, sector y contacto" },
    { num: 2, title: "Administrador", subtitle: "Cuenta de acceso" },
  ];

  /* ═══════════════════ PASO 1 ═══════════════════ */
  const renderPaso1 = () => (
    <div className="flex flex-col gap-y-5 transition-opacity duration-300">
      <div className="mb-2">
        <h2 className="text-2xl font-bold" style={{ color: "#0f1923" }}>
          Datos de la empresa
        </h2>
        <p className="text-sm mt-1" style={{ color: "#6B7A8D" }}>
          Información principal de tu empresa
        </p>
      </div>

      {/* Nombre de la empresa */}
      <div className="flex flex-col gap-y-1.5">
        <label className="text-sm font-medium" style={{ color: "#3D4A5C" }}>
          Nombre de la empresa
        </label>
        <input
          type="text"
          name="nombreEmpresa"
          value={formData.nombreEmpresa}
          onChange={handleChange}
          placeholder="Empresa S.L."
          required
          className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200"
          style={inputStyle}
          onFocus={inputFocus}
          onBlur={inputBlur}
        />
      </div>

      {/* CIF + Sector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#3D4A5C" }}>
            CIF
          </label>
          <input
            type="text"
            name="cif"
            value={formData.cif}
            onChange={handleChange}
            placeholder="B12345678"
            required
            className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200"
            style={inputStyle}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#3D4A5C" }}>
            Sector
          </label>
          <select
            name="sector"
            value={formData.sector}
            onChange={handleChange}
            className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200 appearance-none cursor-pointer"
            style={{
              ...inputStyle,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7A8D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              color: formData.sector ? "#0f1923" : "#6B7A8D",
            }}
            onFocus={inputFocus}
            onBlur={inputBlur}
          >
            <option value="" disabled>
              Seleccionar...
            </option>
            {SECTORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Email + Teléfono */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#3D4A5C" }}>
            Email de contacto
          </label>
          <input
            type="email"
            name="emailEmpresa"
            value={formData.emailEmpresa}
            onChange={handleChange}
            placeholder="contacto@empresa.com"
            required
            className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200"
            style={inputStyle}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#3D4A5C" }}>
            Teléfono{" "}
            <span className="font-normal" style={{ color: "#9CA3AF" }}>
              (opcional)
            </span>
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="600 000 000"
            className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200"
            style={inputStyle}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </div>
      </div>

      {/* Botón Continuar */}
      <button
        type="button"
        onClick={nextStep}
        disabled={
          !formData.nombreEmpresa || !formData.cif || !formData.emailEmpresa
        }
        className="w-full py-3.5 mt-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background:
            !formData.nombreEmpresa || !formData.cif || !formData.emailEmpresa
              ? "#C8CDD8"
              : "#0D1B2E",
          border: "1px solid transparent",
          color: "#ffffff",
        }}
        onMouseEnter={(e) => {
          if (
            formData.nombreEmpresa &&
            formData.cif &&
            formData.emailEmpresa
          )
            e.currentTarget.style.background = "#152540";
        }}
        onMouseLeave={(e) => {
          if (
            formData.nombreEmpresa &&
            formData.cif &&
            formData.emailEmpresa
          )
            e.currentTarget.style.background = "#0D1B2E";
        }}
      >
        Continuar <FiArrowRight className="text-base" />
      </button>
    </div>
  );

  /* ═══════════════════ PASO 2 ═══════════════════ */
  const renderPaso2 = () => (
    <div className="flex flex-col gap-y-5 transition-opacity duration-300">
      <div className="mb-2">
        <h2 className="text-2xl font-bold" style={{ color: "#0f1923" }}>
          Cuenta de administrador
        </h2>
        <p className="text-sm mt-1" style={{ color: "#6B7A8D" }}>
          Datos de acceso para el gestor de la empresa
        </p>
      </div>

      {/* Nombre + Apellidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#3D4A5C" }}>
            Nombre
          </label>
          <input
            type="text"
            name="nombreAdmin"
            value={formData.nombreAdmin}
            onChange={handleChange}
            placeholder="Juan"
            required
            className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200"
            style={inputStyle}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#3D4A5C" }}>
            Apellidos
          </label>
          <input
            type="text"
            name="apellidosAdmin"
            value={formData.apellidosAdmin}
            onChange={handleChange}
            placeholder="García López"
            required
            className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200"
            style={inputStyle}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </div>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-y-1.5">
        <label className="text-sm font-medium" style={{ color: "#3D4A5C" }}>
          Email de administrador
        </label>
        <input
          type="email"
          name="emailAdmin"
          value={formData.emailAdmin}
          onChange={handleChange}
          placeholder="admin@empresa.com"
          required
          className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200"
          style={inputStyle}
          onFocus={inputFocus}
          onBlur={inputBlur}
        />
      </div>

      {/* Contraseña */}
      <div className="flex flex-col gap-y-1.5">
        <label className="text-sm font-medium" style={{ color: "#3D4A5C" }}>
          Contraseña
        </label>
        <input
          type="password"
          name="passwordAdmin"
          value={formData.passwordAdmin}
          onChange={handleChange}
          placeholder="••••••••"
          required
          className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200"
          style={inputStyle}
          onFocus={inputFocus}
          onBlur={inputBlur}
        />
      </div>

      {/* Botón Enviar solicitud */}
      <button
        type="submit"
        disabled={
          !formData.nombreAdmin ||
          !formData.apellidosAdmin ||
          !formData.emailAdmin ||
          !formData.passwordAdmin ||
          isLoading
        }
        className="w-full py-3.5 mt-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background:
            !formData.nombreAdmin ||
            !formData.apellidosAdmin ||
            !formData.emailAdmin ||
            !formData.passwordAdmin ||
            isLoading
              ? "#C8CDD8"
              : "#0D1B2E",
          border: "1px solid transparent",
          color: "#ffffff",
        }}
        onMouseEnter={(e) => {
          if (
            formData.nombreAdmin &&
            formData.apellidosAdmin &&
            formData.emailAdmin &&
            formData.passwordAdmin &&
            !isLoading
          )
            e.currentTarget.style.background = "#152540";
        }}
        onMouseLeave={(e) => {
          if (
            formData.nombreAdmin &&
            formData.apellidosAdmin &&
            formData.emailAdmin &&
            formData.passwordAdmin &&
            !isLoading
          )
            e.currentTarget.style.background = "#0D1B2E";
        }}
      >
        {isLoading ? (
          <span className="loading-dots">Enviando</span>
        ) : (
          <>
            Enviar solicitud <FiArrowRight className="text-base" />
          </>
        )}
      </button>
    </div>
  );

  /* ═══════════════════ ÉXITO ═══════════════════ */
  const renderExito = () => (
    <div className="flex flex-col items-center justify-center gap-y-6 text-center py-12 transition-opacity duration-300">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "rgba(78, 204, 163, 0.1)" }}
      >
        <FaCheckCircle className="text-4xl" style={{ color: "#4ecca3" }} />
      </div>
      <h2 className="text-2xl font-bold" style={{ color: "#0f1923" }}>
        ¡Solicitud enviada!
      </h2>
      <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#6B7A8D" }}>
        Hemos recibido tus datos correctamente. Nuestro equipo validará la
        información y te contactaremos por email en breve.
      </p>
      <button
        onClick={() => router.push("/login")}
        className="py-3 px-8 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer mt-2"
        style={{ background: "#0D1B2E", color: "#ffffff" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#152540")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#0D1B2E")}
      >
        Ir al inicio de sesión
      </button>
    </div>
  );

  /* ═══════════════════ LAYOUT PRINCIPAL ═══════════════════ */
  return (
    <div
      className="min-h-screen lg:h-screen flex flex-col lg:flex-row lg:overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* ── PANEL IZQUIERDO: Branding + Stepper ── */}
      <div
        className="hidden lg:flex relative flex-col justify-between lg:w-[48%] px-10 sm:px-16 lg:px-16 py-12 lg:py-16"
        style={{
          background: "url('/background-empresa.jpg') no-repeat center",
          backgroundSize: "cover"
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

        {/* Contenido */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          {/* Brand */}
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-8"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            EGM Atalayas
          </p>

          {/* Título */}
          <h1
            className="text-4xl sm:text-[2.75rem] font-bold leading-tight mb-4"
            style={{ color: "#ffffff" }}
          >
            Registra tu
            <br />
            empresa
          </h1>

          {/* Subtítulo */}
          <p
            className="text-sm sm:text-[15px] leading-relaxed max-w-xs mb-14"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Únete al parque empresarial y accede a todos los servicios de la
            comunidad.
          </p>

          {/* Stepper vertical */}
          <div className="flex flex-col gap-0">
            {steps.map((step, idx) => {
              const isActive = paso >= step.num;
              const isCurrent = paso === step.num;
              return (
                <div key={step.num} className="flex items-start gap-4">
                  {/* Línea + Círculo */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                      style={{
                        background: isCurrent
                          ? "#3b82f6"
                          : isActive
                          ? "rgba(78,204,163,0.15)"
                          : "rgba(255,255,255,0.06)",
                        color: isCurrent
                          ? "#ffffff"
                          : isActive
                          ? "#4ecca3"
                          : "rgba(255,255,255,0.25)",
                        border: isCurrent
                          ? "2px solid #3b82f6"
                          : "2px solid transparent",
                      }}
                    >
                      {isActive && !isCurrent ? "✓" : step.num}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className="w-px h-10"
                        style={{
                          background: isActive
                            ? "rgba(78,204,163,0.2)"
                            : "rgba(255,255,255,0.06)",
                        }}
                      />
                    )}
                  </div>

                  {/* Texto */}
                  <div className="pt-1">
                    <p
                      className="text-sm font-semibold transition-colors duration-300"
                      style={{
                        color: isCurrent
                          ? "#ffffff"
                          : isActive
                          ? "rgba(255,255,255,0.7)"
                          : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {step.title}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: isCurrent
                          ? "rgba(255,255,255,0.45)"
                          : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-8 lg:mt-0">
          <p
            className="text-xs tracking-wide"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Solicitud sujeta a revisión por EGM
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO: Formulario ── */}
      <div
        className="flex-1 lg:overflow-y-auto flex flex-col items-center justify-start lg:justify-center px-0 lg:px-16 xl:px-24 py-0 lg:py-12"
        style={{ background: "#ffffff" }}
      >
        {/* Branding visible solo en móvil */}
        <div
          className="lg:hidden w-full px-6 py-10 mb-2 relative"
          style={{
            background: "url('/background-empresa.jpg') no-repeat center center",
            backgroundSize: "cover",
          }}
        >
          {/* Capa oscura extra para legibilidad en móvil si fuera necesario, o podemos dejarlo solo con la imagen */}
          <div className="absolute inset-0 bg-blue-950/40" />
          
          <div className="relative z-10">
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              EGM Atalayas
            </p>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "#ffffff" }}
            >
              Registra tu empresa
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              Únete al parque empresarial y accede a todos los servicios.
            </p>

            {/* Stepper horizontal en móvil */}
            <div className="flex items-center gap-3 mt-6">
              {steps.map((step, idx) => {
                const isCurrent = paso === step.num;
                const isDone = paso > step.num;
                return (
                  <React.Fragment key={step.num}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: isCurrent
                            ? "#3b82f6"
                            : isDone
                            ? "rgba(78,204,163,0.3)"
                            : "rgba(255,255,255,0.15)",
                          color: isCurrent
                            ? "#fff"
                            : isDone
                            ? "#4ecca3"
                            : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {isDone ? "✓" : step.num}
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: isCurrent
                            ? "#ffffff"
                            : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {step.title}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className="flex-1 h-px"
                        style={{ background: "rgba(255,255,255,0.2)" }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-lg px-6 lg:px-0 py-8 lg:py-0">
          {/* Botón volver (solo pasos activos) */}
          {paso < 3 && (
            <button
              onClick={prevStep}
              className="flex items-center gap-1.5 text-sm mb-8 transition-colors cursor-pointer"
              style={{ color: "#6B7A8D" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4A5C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7A8D")}
            >
              ← {paso === 1 ? "Iniciar sesión" : "Volver"}
            </button>
          )}

          {/* Error */}
          {errorMensaje && paso < 3 && (
            <div
              className="text-sm text-center py-3 px-4 rounded-lg mb-6"
              style={{
                background: "#FDECEA",
                border: "1px solid #C84B31",
                color: "#C84B31",
              }}
            >
              {errorMensaje}
            </div>
          )}

          {/* Contenido del paso */}
          <form
            onSubmit={paso === 2 ? handleSubmit : (e) => e.preventDefault()}
            className="flex-1 flex flex-col justify-center"
          >
            {paso === 1 && renderPaso1()}
            {paso === 2 && renderPaso2()}
            {paso === 3 && renderExito()}
          </form>

          {/* Link a login */}
          {paso < 3 && (
            <div className="text-center mt-8">
              <p className="text-sm" style={{ color: "#6B7A8D" }}>
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/login"
                  className="font-medium transition-colors"
                  style={{ color: "#1B3F7E" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#2A5298")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#1B3F7E")
                  }
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterEmpresa;