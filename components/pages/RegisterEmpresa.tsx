"use client";

import React, { useState } from "react";
import { FiArrowRight, FiChevronLeft, FiCheckCircle, FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const SECTORES = [
  "Tecnología", "Salud", "Educación", "Finanzas", "Construcción",
  "Logística", "Comercio", "Industria", "Servicios", "Otro",
];

const RegisterEmpresa: React.FC = () => {
  const router = useRouter();

  const [paso, setPaso]                 = useState(1);
  const [isLoading, setIsLoading]       = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const [erroresValidacion, setErroresValidacion] = useState({
    cif: "",
    telefono: "",
  });
  
  // Nuevos estados para los checks legales
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [aceptarPrivacidad, setAceptarPrivacidad] = useState(false);

  // Validación de CIF: 1 letra + 8 números (ej: B12345678)
  const validarCIF = (cif: string): boolean => {
    const cifRegex = /^[A-Za-z]\d{8}$/;
    return cifRegex.test(cif);
  };

  // Validación de Teléfono: 9 números (opcional)
  const validarTelefono = (telefono: string): boolean => {
    if (!telefono) return true;
    const telefonoRegex = /^[0-9]{9}$/;
    return telefonoRegex.test(telefono);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar errores cuando el usuario empieza a escribir
    if (name === "cif" && erroresValidacion.cif) {
      setErroresValidacion((prev) => ({ ...prev, cif: "" }));
    }
    if (name === "telefono" && erroresValidacion.telefono) {
      setErroresValidacion((prev) => ({ ...prev, telefono: "" }));
    }
  };

  const nextStep = () => {
    setErrorMensaje("");
    
    // Validar CIF si estamos en paso 1
    if (paso === 1) {
      if (!validarCIF(formData.cif)) {
        setErroresValidacion((prev) => ({ 
          ...prev, 
          cif: "CIF inválido. Debe ser: 1 letra + 8 números (ej: B12345678)" 
        }));
        return;
      }

      // Validar teléfono si está relleno
      if (formData.telefono && !validarTelefono(formData.telefono)) {
        setErroresValidacion((prev) => ({ 
          ...prev, 
          telefono: "Teléfono inválido. Debe contener 9 dígitos numéricos" 
        }));
        return;
      }

      setErroresValidacion({ cif: "", telefono: "" });
    }

    setPaso((p) => p + 1);
  };

  const prevStep = () => {
    setErrorMensaje("");
    setErroresValidacion({ cif: "", telefono: "" });
    if (paso === 1) router.push("/login");
    else setPaso((p) => p - 1);
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
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
        setPaso(4);
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
    e.target.style.borderColor = "var(--azul-egm)";
    e.target.style.boxShadow   = "0 0 0 3px rgba(27,63,126,0.08)";
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "rgba(27,63,126,0.22)";
    e.target.style.boxShadow   = "none";
  };

  const isStep1Valid = !!(
    formData.nombreEmpresa && 
    formData.cif && 
    validarCIF(formData.cif) &&
    formData.emailEmpresa &&
    (!formData.telefono || validarTelefono(formData.telefono))
  );
  const isStep2Valid = !!(formData.nombreAdmin && formData.apellidosAdmin && formData.emailAdmin && formData.passwordAdmin);
  
  // Variable para comprobar si el paso 3 está listo para enviarse
  const isReadyToSubmit = aceptarTerminos && aceptarPrivacidad && !isLoading;

  const steps = [
    { num: 1, label: "Empresa",       sub: "Datos generales"   },
    { num: 2, label: "Administrador", sub: "Cuenta de acceso"  },
    { num: 3, label: "Verificación",  sub: "Revisa tus datos"  },
  ];

  /* ═══════════════════ PASO 1 ═══════════════════ */
  const renderPaso1 = () => (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center" style={{ color: "var(--azul-egm)", fontFamily: "var(--font-poppins), sans-serif", letterSpacing: "-0.03em" }}>
          Tu empresa
        </h2>
        <p className="text-base mt-2 text-center" style={{ color: "#6B7A8D" }}>Únete al área empresarial de Atalayas</p>
      </div>

      <div>
        <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>Nombre de la empresa</label>
        <input type="text" name="nombreEmpresa" value={formData.nombreEmpresa} onChange={handleChange}
          placeholder="Empresa S.L." required className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>CIF</label>
          <input type="text" name="cif" value={formData.cif} onChange={handleChange}
            placeholder="B12345678" required className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} 
            maxLength={9}
          />
          {erroresValidacion.cif && (
            <p className="text-sm mt-1" style={{ color: "var(--error)" }}>{erroresValidacion.cif}</p>
          )}
        </div>
        <div>
          <label className="block text-base font-medium mb-2" style={{ color: "#3D4A5C" }}>Sector <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span></label>
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
          placeholder="600000000" className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} 
          maxLength={9}
        />
        {erroresValidacion.telefono && (
          <p className="text-sm mt-1" style={{ color: "var(--error)" }}>{erroresValidacion.telefono}</p>
        )}
      </div>

      <div className="mt-2">
        <Button variant="primary" size="lg" className="w-full" disabled={!isStep1Valid} onClick={nextStep}>
          Continuar <FiArrowRight />
        </Button>
      </div>
    </div>
  );

  /* ═══════════════════ PASO 2 ═══════════════════ */
  const renderPaso2 = () => (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center" style={{ color: "var(--azul-egm)", fontFamily: "var(--font-poppins), sans-serif", letterSpacing: "-0.03em" }}>
          Administrador
        </h2>
        <p className="text-base mt-2 text-center" style={{ color: "#6B7A8D" }}>Crea la cuenta con la que gestionarás tu empresa</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="relative">
          <input type={showPassword ? "text" : "password"} name="passwordAdmin" value={formData.passwordAdmin} onChange={handleChange}
            placeholder="••••••••" required className={`${inputClass} pr-11`} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none"
            style={{ color: "#6B7A8D" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4A5C")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7A8D")}
            tabIndex={-1}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
      </div>

      <div className="mt-2">
        <Button variant="primary" size="lg" className="w-full" disabled={!isStep2Valid} onClick={nextStep}>
          Continuar <FiArrowRight />
        </Button>
      </div>
    </div>
  );

  /* ═══════════════════ PASO 3 ═══════════════════ */
  const renderPaso3 = () => (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center" style={{ color: "var(--azul-egm)", fontFamily: "var(--font-poppins), sans-serif", letterSpacing: "-0.03em" }}>
          Verifica tus datos
        </h2>
        <p className="text-base mt-2 text-center" style={{ color: "#6B7A8D" }}>Revisa la información antes de enviar la solicitud</p>
      </div>

      {/* Sección Empresa */}
      <div className="p-5 rounded-2xl" style={{ background: "rgba(27,63,126,0.04)", border: "1px solid rgba(27,63,126,0.10)" }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--azul-egm)" }}>Datos de la empresa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p style={{ color: "#6B7A8D" }}>Nombre de empresa</p>
            <p className="font-medium" style={{ color: "#0f1923" }}>{formData.nombreEmpresa}</p>
          </div>
          <div>
            <p style={{ color: "#6B7A8D" }}>CIF</p>
            <p className="font-medium" style={{ color: "#0f1923" }}>{formData.cif}</p>
          </div>
          {formData.sector && (
            <div>
              <p style={{ color: "#6B7A8D" }}>Sector</p>
              <p className="font-medium" style={{ color: "#0f1923" }}>{formData.sector}</p>
            </div>
          )}
          <div>
            <p style={{ color: "#6B7A8D" }}>Email de contacto</p>
            <p className="font-medium" style={{ color: "#0f1923" }}>{formData.emailEmpresa}</p>
          </div>
          {formData.telefono && (
            <div>
              <p style={{ color: "#6B7A8D" }}>Teléfono</p>
              <p className="font-medium" style={{ color: "#0f1923" }}>{formData.telefono}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sección Administrador */}
      <div className="p-5 rounded-2xl" style={{ background: "rgba(27,63,126,0.04)", border: "1px solid rgba(27,63,126,0.10)" }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--azul-egm)" }}>Datos del administrador</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p style={{ color: "#6B7A8D" }}>Nombre</p>
            <p className="font-medium" style={{ color: "#0f1923" }}>{formData.nombreAdmin}</p>
          </div>
          <div>
            <p style={{ color: "#6B7A8D" }}>Apellidos</p>
            <p className="font-medium" style={{ color: "#0f1923" }}>{formData.apellidosAdmin}</p>
          </div>
          <div className="col-span-2">
            <p style={{ color: "#6B7A8D" }}>Email</p>
            <p className="font-medium" style={{ color: "#0f1923" }}>{formData.emailAdmin}</p>
          </div>
        </div>
      </div>

      {/* Checkboxes Legales */}
      <div className="flex flex-col gap-2">
        {/* Términos y Condiciones */}
        <div className="flex items-start gap-3 p-4 rounded-2xl transition-colors cursor-pointer" style={{ background: aceptarTerminos ? "rgba(27,63,126,0.08)" : "rgba(27,63,126,0.03)", border: "1px solid rgba(27,63,126,0.10)" }} onClick={() => setAceptarTerminos(!aceptarTerminos)}>
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <div className="w-4 h-4 rounded" style={{ border: aceptarTerminos ? "1px solid var(--azul-egm)" : "1px solid #C8CDD8", background: aceptarTerminos ? "var(--azul-egm)" : "#f5f6f8" }} />
            {aceptarTerminos && (
              <svg className="w-3 h-3 text-white absolute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm leading-tight" style={{ color: "#3D4A5C" }}>
            He leído y acepto los <Link href="/terminos" target="_blank" className="font-semibold" style={{ color: "var(--azul-egm)", textDecoration: "underline" }} onClick={(e) => e.stopPropagation()}>Términos y Condiciones</Link> de uso de la plataforma Atalayas.
          </span>
        </div>

        {/* Política de Privacidad */}
        <div className="flex items-start gap-3 p-4 rounded-2xl transition-colors cursor-pointer" style={{ background: aceptarPrivacidad ? "rgba(27,63,126,0.08)" : "rgba(27,63,126,0.03)", border: "1px solid rgba(27,63,126,0.10)" }} onClick={() => setAceptarPrivacidad(!aceptarPrivacidad)}>
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <div className="w-4 h-4 rounded" style={{ border: aceptarPrivacidad ? "1px solid var(--azul-egm)" : "1px solid #C8CDD8", background: aceptarPrivacidad ? "var(--azul-egm)" : "#f5f6f8" }} />
            {aceptarPrivacidad && (
              <svg className="w-3 h-3 text-white absolute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm leading-tight" style={{ color: "#3D4A5C" }}>
            He leído y acepto la <Link href="/privacidad" target="_blank" className="font-semibold" style={{ color: "var(--azul-egm)", textDecoration: "underline" }} onClick={(e) => e.stopPropagation()}>Política de Privacidad</Link> relativa al tratamiento de mis datos personales.
          </span>
        </div>
      </div>

      {errorMensaje && (
        <div className="p-4 rounded-2xl text-sm" style={{ background: "var(--error-light)", border: "1px solid var(--error)", color: "var(--error)" }}>
          {errorMensaje}
        </div>
      )}

      <div className="mt-2">
        <Button variant="primary" size="lg" className="w-full" disabled={!isReadyToSubmit} onClick={handleSubmit}>
          {isLoading ? <span className="loading-dots">Enviando</span> : <> Enviar solicitud <FiArrowRight /> </>}
        </Button>
      </div>
    </div>
  );

  /* ═══════════════════ PASO 4 (ÉXITO) ═══════════════════ */
  const renderExito = () => (
    <div className="flex flex-col items-center justify-center gap-6 text-center py-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "rgba(27,63,126,0.08)" }}>
        <FiCheckCircle size={36} style={{ color: "var(--azul-egm)" }} />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--azul-egm)", fontFamily: "var(--font-poppins), sans-serif" }}>
          ¡Solicitud enviada!
        </h2>
        <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#6B7A8D" }}>
          Hemos recibido tus datos. Nuestro equipo validará la información y te contactaremos por email en breve.
        </p>
      </div>
      <Button variant="primary" size="lg" className="w-full" onClick={() => router.push("/login")}>
        Ir al inicio de sesión
      </Button>
    </div>
  );

  /* ═══════════════════ LAYOUT ═══════════════════ */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: "#ffffff" }}>

      {/* ── PANEL IZQUIERDO ── */}
      <div
        className="hidden lg:flex relative flex-col justify-between lg:w-[48%] py-12 lg:py-16"
        style={{ background: "url('/background-empresa.webp') no-repeat center center", backgroundSize: "cover" }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.38)" }} />

        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Atalayas" className="h-32 sm:h-44 w-auto brightness-0 invert" />
        </div>

        {/* Steps — un poco por encima del fondo */}
        <div className="absolute bottom-20 left-0 right-0 z-10 flex items-center justify-center gap-8">
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
                    {isActive && !isCurrent ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                    ) : step.num}
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

      {/* ── PANEL DERECHO ── */}
      <div
        className="flex-1 flex flex-col items-center justify-start lg:justify-center px-0 lg:px-24 pt-0 pb-10 lg:py-10 min-h-screen lg:min-h-0 overflow-y-auto"
        style={{ background: "#ffffff" }}
      >
        {/* Branding móvil */}
        <div className="lg:hidden w-full relative flex flex-col items-center"
          style={{ background: "url('/background-empresa.webp') center/cover no-repeat" }}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.38)" }} />
          <div className="relative z-10 w-full flex flex-col items-center px-6 py-10 gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Atalayas" className="h-16 w-auto brightness-0 invert" />
            {/* Indicador de pasos móvil */}
            {paso < 4 && (
              <div className="w-full max-w-xs flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-2 w-full">
                  {steps.map((step, i) => (
                    <React.Fragment key={step.num}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300"
                          style={{
                            background: paso > step.num ? "rgba(255,255,255,0.90)" : paso === step.num ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)",
                            color:      paso > step.num ? "var(--azul-egm)" : "#ffffff",
                            border:     paso === step.num ? "1.5px solid rgba(255,255,255,0.70)" : "1.5px solid rgba(255,255,255,0.20)",
                          }}>
                          {paso > step.num
                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
                            : step.num}
                        </div>
                        <span className="text-xs font-medium" style={{ color: paso === step.num ? "#ffffff" : "rgba(255,255,255,0.40)" }}>
                          {step.label}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="flex-1 h-px" style={{ background: paso > step.num ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.20)" }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-md px-5 sm:px-6 lg:px-0 py-6 lg:py-0">

          {/* Volver */}
          {paso < 4 && (
            <div className="mb-6">
              <Button variant="secondary" size="md" onClick={prevStep}>
                <FiChevronLeft size={15} /> Atrás
              </Button>
            </div>
          )}

          <form onSubmit={paso === 3 ? handleSubmit : (e) => e.preventDefault()} className="flex flex-col">
            {paso === 1 && renderPaso1()}
            {paso === 2 && renderPaso2()}
            {paso === 3 && renderPaso3()}
            {paso === 4 && renderExito()}
          </form>

          {paso < 4 && (
            <div className="text-center mt-4">
              <p className="text-sm" style={{ color: "#6B7A8D" }}>
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-medium transition-colors" style={{ color: "var(--azul-egm)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--azul-egm-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--azul-egm)")}
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