// src/components/pages/RegisterEmpresa.tsx
"use client";

import React, { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { FiArrowRight, FiChevronLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import Link from "next/link";

const SECTORES = [
  "Tecnología", "Salud", "Educación", "Finanzas", "Construcción",
  "Logística", "Comercio", "Industria", "Servicios", "Otro",
];

const RegisterEmpresa: React.FC = () => {
  const router = useRouter();

  const [paso, setPaso]               = useState(1);
  const [isLoading, setIsLoading]     = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");

  const [formData, setFormData] = useState({
    nombreEmpresa: "",
    cif:           "",
    sector:        "",
    emailEmpresa:  "",
    telefono:      "",
    nombreAdmin:   "",
    apellidosAdmin:"",
    emailAdmin:    "",
    passwordAdmin: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => { setErrorMensaje(""); setPaso((p) => p + 1); };
  const prevStep = () => {
    setErrorMensaje("");
    if (paso === 1) router.push("/login");
    else setPaso((p) => p - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje("");
    setIsLoading(true);
    const payload = {
      nombreEmpresa: formData.nombreEmpresa,
      cif:           formData.cif,
      emailContacto: formData.emailEmpresa,
      nombre:        formData.nombreAdmin,
      apellidos:     formData.apellidosAdmin,
      emailAdmin:    formData.emailAdmin,
      password:      formData.passwordAdmin,
    };
    try {
      const response = await fetch(`${API_URL}/empresas/solicitud`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (response.ok) {
        setPaso(3);
      } else {
        const errorData = await response.json().catch(() => ({}));
        let errMsg = "Error del servidor";
        if (errorData.message)      errMsg = Array.isArray(errorData.message) ? errorData.message.join(", ") : errorData.message;
        else if (errorData.errors)  errMsg = JSON.stringify(errorData.errors);
        else if (errorData.error)   errMsg = errorData.error;
        setErrorMensaje(errMsg);
      }
    } catch {
      setErrorMensaje("No se ha podido conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Estilos compartidos (parity con Login) ─── */
  const inputClass = "w-full px-4 py-3.5 text-base rounded-lg transition-all duration-200 outline-none";
  const inputStyle: React.CSSProperties = {
    background: "#f5f6f8",
    border:     "1px solid rgba(27,63,126,0.22)",
    color:      "#0f1923",
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#1B3F7E";
    e.target.style.boxShadow   = "0 0 0 3px rgba(27,63,126,0.08)";
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(27,63,126,0.22)";
    e.target.style.boxShadow   = "none";
  };

  const isStep1Valid = !!(formData.nombreEmpresa && formData.cif && formData.emailEmpresa);
  const isStep2Valid = !!(formData.nombreAdmin && formData.apellidosAdmin && formData.emailAdmin && formData.passwordAdmin);

  const steps = [
    { num: 1, label: "Empresa",       sub: "Datos generales"   },
    { num: 2, label: "Administrador", sub: "Cuenta de acceso"  },
  ];

  /* ═══════════════════ PASO 1 ═══════════════════ */
  const renderPaso1 = () => (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-4xl sm:text-5xl font-bold text-center" style={{ color: "#1B3F7E", fontFamily: "var(--font-poppins), sans-serif", letterSpacing: "-0.03em" }}>
          Tu empresa
        </h2>
        <p className="text-base mt-2 text-center" style={{ color: "#6B7A8D" }}>Únete al área empresarial de Atalayas.</p>
      </div>

      <div>
        <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>Nombre de la empresa</label>
        <input type="text" name="nombreEmpresa" value={formData.nombreEmpresa} onChange={handleChange}
          placeholder="Empresa S.L." required className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>CIF</label>
          <input type="text" name="cif" value={formData.cif} onChange={handleChange}
            placeholder="B12345678" required className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
        </div>
        <div>
          <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>Sector</label>
          <select name="sector" value={formData.sector} onChange={handleChange}
            className={`${inputClass} appearance-none cursor-pointer`}
            style={{
              ...inputStyle,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7A8D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat:   "no-repeat",
              backgroundPosition: "right 14px center",
              color: formData.sector ? "#0f1923" : "#6B7A8D",
            }}
            onFocus={inputFocus} onBlur={inputBlur}
          >
            <option value="" disabled>Seleccionar...</option>
            {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>Email de contacto</label>
        <input type="email" name="emailEmpresa" value={formData.emailEmpresa} onChange={handleChange}
          placeholder="contacto@empresa.com" required className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
      </div>

      <div>
        <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>
          Teléfono <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
        </label>
        <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
          placeholder="600 000 000" className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
      </div>

      <button type="button" onClick={nextStep} disabled={!isStep1Valid}
        className="w-full py-4 rounded-lg text-base font-semibold tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background:           isStep1Valid ? "rgba(27,63,126,0.82)" : "rgba(27,63,126,0.25)",
          border:               "1px solid rgba(255,255,255,0.18)",
          color:                isStep1Valid ? "#ffffff" : "#8aa6cc",
          backdropFilter:       "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:            isStep1Valid ? "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(27,63,126,0.25)" : "none",
        }}
        onMouseEnter={(e) => { if (isStep1Valid) e.currentTarget.style.background = "rgba(27,63,126,0.95)"; }}
        onMouseLeave={(e) => { if (isStep1Valid) e.currentTarget.style.background = "rgba(27,63,126,0.82)"; }}
      >
        Continuar <FiArrowRight />
      </button>
    </div>
  );

  /* ═══════════════════ PASO 2 ═══════════════════ */
  const renderPaso2 = () => (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-4xl sm:text-5xl font-bold text-center" style={{ color: "#1B3F7E", fontFamily: "var(--font-poppins), sans-serif", letterSpacing: "-0.03em" }}>
          Administrador
        </h2>
        <p className="text-base mt-2 text-center" style={{ color: "#6B7A8D" }}>Crea la cuenta con la que gestionarás tu empresa.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>Nombre</label>
          <input type="text" name="nombreAdmin" value={formData.nombreAdmin} onChange={handleChange}
            placeholder="Juan" required className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
        </div>
        <div>
          <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>Apellidos</label>
          <input type="text" name="apellidosAdmin" value={formData.apellidosAdmin} onChange={handleChange}
            placeholder="García López" required className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
        </div>
      </div>

      <div>
        <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>Email de administrador</label>
        <input type="email" name="emailAdmin" value={formData.emailAdmin} onChange={handleChange}
          placeholder="admin@empresa.com" required className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
      </div>

      <div>
        <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>Contraseña</label>
        <input type="password" name="passwordAdmin" value={formData.passwordAdmin} onChange={handleChange}
          placeholder="••••••••" required className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
      </div>

      <button type="submit" disabled={!isStep2Valid || isLoading}
        className="w-full py-4 rounded-lg text-base font-semibold tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background:           (isStep2Valid && !isLoading) ? "rgba(27,63,126,0.82)" : "rgba(27,63,126,0.25)",
          border:               "1px solid rgba(255,255,255,0.18)",
          color:                (isStep2Valid && !isLoading) ? "#ffffff" : "#8aa6cc",
          backdropFilter:       "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:            (isStep2Valid && !isLoading) ? "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(27,63,126,0.25)" : "none",
        }}
        onMouseEnter={(e) => { if (isStep2Valid && !isLoading) e.currentTarget.style.background = "rgba(27,63,126,0.95)"; }}
        onMouseLeave={(e) => { if (isStep2Valid && !isLoading) e.currentTarget.style.background = "rgba(27,63,126,0.82)"; }}
      >
        {isLoading ? <span className="loading-dots">Enviando</span> : <> Enviar solicitud <FiArrowRight /> </>}
      </button>
    </div>
  );

  /* ═══════════════════ ÉXITO ═══════════════════ */
  const renderExito = () => (
    <div className="flex flex-col items-center justify-center gap-6 text-center py-10">
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "rgba(27,63,126,0.08)" }}>
        <FaCheckCircle className="text-4xl" style={{ color: "#1B3F7E" }} />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#1B3F7E", fontFamily: "var(--font-poppins), sans-serif" }}>
          ¡Solicitud enviada!
        </h2>
        <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#6B7A8D" }}>
          Hemos recibido tus datos. Nuestro equipo validará la información y te contactaremos por email en breve.
        </p>
      </div>
      <button onClick={() => router.push("/login")}
        className="py-3 px-8 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer"
        style={{
          background:           "rgba(27,63,126,0.82)",
          border:               "1px solid rgba(255,255,255,0.18)",
          color:                "#ffffff",
          backdropFilter:       "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:            "inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(27,63,126,0.95)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(27,63,126,0.82)")}
      >
        Ir al inicio de sesión
      </button>
    </div>
  );

  /* ═══════════════════ LAYOUT ═══════════════════ */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: "#ffffff" }}>

      {/* ── PANEL IZQUIERDO ── */}
      <div
        className="hidden lg:flex relative flex-col justify-between lg:w-[48%] py-12 lg:py-16"
        style={{ background: "url('/background-empresa.jpg') no-repeat center center", backgroundSize: "cover" }}
      >
        {/* Sombreado igual que Login */}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.38)" }} />

        {/* Logo + stepper — centrado igual que Login */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Atalayas" className="h-32 sm:h-44 w-auto brightness-0 invert" />

          <div className="flex items-center justify-center gap-8">
            {steps.map((step) => {
              const isActive  = paso >= step.num;
              const isCurrent = paso === step.num;
              return (
                <div key={step.num} className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0 transition-all duration-300"
                    style={{
                      background:     isCurrent ? "rgba(255,255,255,0.25)" : isActive ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                      color:          isCurrent ? "#ffffff"                 : isActive ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)",
                      border:         isCurrent ? "2px solid rgba(255,255,255,0.6)" : "2px solid rgba(255,255,255,0.14)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {isActive && !isCurrent ? "✓" : step.num}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight" style={{ color: isCurrent ? "#ffffff" : "rgba(255,255,255,0.38)" }}>
                      {step.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: isCurrent ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>
                      {step.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div
        className="flex-1 flex flex-col items-center justify-start lg:justify-center px-0 lg:px-24 pt-0 pb-10 lg:py-0 min-h-screen lg:min-h-0"
        style={{ background: "#ffffff" }}
      >
        {/* Branding móvil */}
        <div className="lg:hidden w-full px-6 py-12 mb-2 relative flex flex-col items-center"
          style={{ background: "url('/background-empresa.jpg') center/cover no-repeat" }}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.38)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Atalayas" className="relative z-10 h-20 w-auto brightness-0 invert" />
        </div>

        <div className="w-full max-w-md px-6 lg:px-0 py-8 lg:py-0">

          {/* Volver */}
          {paso < 3 && (
            <button onClick={prevStep}
              className="flex items-center gap-1.5 text-sm mb-6 transition-colors cursor-pointer"
              style={{ color: "#1B3F7E" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2A5298")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#1B3F7E")}
            >
              <FiChevronLeft size={15} />
              Volver
            </button>
          )}

          {/* Error */}
          {errorMensaje && paso < 3 && (
            <div className="text-sm text-center py-3 px-4 rounded-lg mb-4"
              style={{ background: "#FDECEA", border: "1px solid #C84B31", color: "#C84B31" }}>
              {errorMensaje}
            </div>
          )}

          <form onSubmit={paso === 2 ? handleSubmit : (e) => e.preventDefault()} className="flex flex-col">
            {paso === 1 && renderPaso1()}
            {paso === 2 && renderPaso2()}
            {paso === 3 && renderExito()}
          </form>

          {paso < 3 && (
            <div className="text-center mt-4">
              <p className="text-sm" style={{ color: "#6B7A8D" }}>
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-medium transition-colors" style={{ color: "#1B3F7E" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#2A5298")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#1B3F7E")}
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
