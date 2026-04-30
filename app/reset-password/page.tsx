"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiShield, FiMail } from "react-icons/fi";
import { API_URL } from "@/lib/api";

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { level: "Muy débil", color: "#C84B31", bg: "#FDECEA", width: "16%" };
  if (score <= 3) return { level: "Débil", color: "#E8A517", bg: "#FFF3CD", width: "33%" };
  if (score <= 4) return { level: "Aceptable", color: "#D4A843", bg: "#FFF9E6", width: "50%" };
  if (score <= 5) return { level: "Fuerte", color: "#2D7D4E", bg: "#D4EDDA", width: "75%" };
  return { level: "Muy fuerte", color: "#16a34a", bg: "#D4EDDA", width: "100%" };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirmar.length > 0 && password === confirmar;
  const passwordsMismatch = confirmar.length > 0 && password !== confirmar;
  const isFormValid = password.length >= 6 && passwordsMatch;

  useEffect(() => {
    if (!token) setError("Enlace inválido. Solicita un nuevo correo de recuperación.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nuevaPassword: password }),
      });

      if (res.ok) {
        setExito(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "El enlace es inválido o ha expirado. Solicita uno nuevo.");
      }
    } catch {
      setError("Error de conexión. Verifica tu red e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f5f6f8" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div style={{ background: "#1B3F7E", padding: "32px 40px" }}>
          <img src="/logo.webp" alt="Atalayas" className="h-10 w-auto brightness-0 invert mb-3" />
          <h1 className="text-white text-2xl font-bold" style={{ letterSpacing: "-0.02em" }}>
            Nueva contraseña
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
            Elige una contraseña segura para tu cuenta
          </p>
        </div>

        <div className="p-8">
          {exito ? (
            /* Estado de éxito */
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#D4EDDA" }}>
                <FiCheckCircle size={32} style={{ color: "#16a34a" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#0f1923" }}>¡Contraseña actualizada!</h2>
                <p className="text-sm" style={{ color: "#6B7A8D" }}>
                  Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.
                </p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#1B3F7E" }}
              >
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            /* Formulario */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#3D4A5C" }}>
                  Nueva contraseña
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7A8D" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
                    className="w-full pl-11 pr-11 py-3 text-sm rounded-lg outline-none transition-all"
                    style={{
                      background: "#f5f6f8",
                      border: `1px solid ${password.length > 0 && password.length < 6 ? "#E8A517" : touched && password.length >= 6 ? "#16a34a" : "rgba(27,63,126,0.22)"}`,
                      color: "#0f1923",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#1B3F7E"; e.target.style.boxShadow = "0 0 0 3px rgba(27,63,126,0.08)"; }}
                    onBlur={(e) => {
                      e.target.style.borderColor = password.length > 0 && password.length < 6 ? "#E8A517" : touched && password.length >= 6 ? "#16a34a" : "rgba(27,63,126,0.22)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7A8D" }}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {/* Indicador de fuerza */}
                {password.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium" style={{ color: strength.color }}>
                        {strength.level}
                      </span>
                      <FiShield size={13} style={{ color: strength.color }} />
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: strength.bg }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: strength.width, background: strength.color }}
                      />
                    </div>

                    {/* Requisitos */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                      {[
                        { label: "Mínimo 6 caracteres", ok: password.length >= 6 },
                        { label: "Mayúscula (A-Z)", ok: /[A-Z]/.test(password) },
                        { label: "Minúscula (a-z)", ok: /[a-z]/.test(password) },
                        { label: "Número (0-9)", ok: /[0-9]/.test(password) },
                        { label: "Símbolo (!@#$)", ok: /[^A-Za-z0-9]/.test(password) },
                        { label: "10+ caracteres", ok: password.length >= 10 },
                      ].map((req) => (
                        <div key={req.label} className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: req.ok ? "#D4EDDA" : "#f5f6f8",
                              border: `1px solid ${req.ok ? "#16a34a" : "#C8CDD8"}`,
                              transition: "all 0.2s",
                            }}>
                            {req.ok && (
                              <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs" style={{ color: req.ok ? "#16a34a" : "#6B7A8D" }}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#3D4A5C" }}>
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7A8D" }} />
                  <input
                    type={showConfirmar ? "text" : "password"}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    autoComplete="new-password"
                    className="w-full pl-11 pr-11 py-3 text-sm rounded-lg outline-none transition-all"
                    style={{
                      background: "#f5f6f8",
                      border: confirmar.length === 0
                        ? "1px solid rgba(27,63,126,0.22)"
                        : passwordsMatch
                          ? "1px solid #16a34a"
                          : "1px solid #C84B31",
                      color: "#0f1923",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#1B3F7E"; e.target.style.boxShadow = "0 0 0 3px rgba(27,63,126,0.08)"; }}
                    onBlur={(e) => {
                      e.target.style.borderColor = confirmar.length === 0
                        ? "rgba(27,63,126,0.22)"
                        : passwordsMatch ? "#16a34a" : "#C84B31";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmar(!showConfirmar)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7A8D" }}>
                    {showConfirmar ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {/* Coincidencia */}
                {confirmar.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {passwordsMatch ? (
                      <>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#D4EDDA" }}>
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs" style={{ color: "#16a34a" }}>Las contraseñas coinciden</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#FDECEA" }}>
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="#C84B31" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <span className="text-xs" style={{ color: "#C84B31" }}>Las contraseñas no coinciden</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg"
                  style={{ background: "#FDECEA", border: "1px solid #C84B31", color: "#C84B31" }}>
                  <FiAlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={loading || !token || !isFormValid}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#1B3F7E" }}
                onMouseEnter={(e) => { if (!loading && isFormValid) e.currentTarget.style.background = "#2A5298"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#1B3F7E")}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando...
                  </span>
                ) : "Guardar nueva contraseña"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-sm text-center transition-colors"
                style={{ color: "#6B7A8D" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#3D4A5C")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7A8D")}
              >
                ← Volver a iniciar sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
