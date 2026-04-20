"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { API_URL } from "@/lib/api";

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
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#e8f5e9" }}>
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full pl-11 pr-11 py-3 text-sm rounded-lg outline-none transition-all"
                    style={{ background: "#f5f6f8", border: "1px solid rgba(27,63,126,0.22)", color: "#0f1923" }}
                    onFocus={(e) => { e.target.style.borderColor = "#1B3F7E"; e.target.style.boxShadow = "0 0 0 3px rgba(27,63,126,0.08)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(27,63,126,0.22)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7A8D" }}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
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
                    className="w-full pl-11 pr-11 py-3 text-sm rounded-lg outline-none transition-all"
                    style={{ background: "#f5f6f8", border: "1px solid rgba(27,63,126,0.22)", color: "#0f1923" }}
                    onFocus={(e) => { e.target.style.borderColor = "#1B3F7E"; e.target.style.boxShadow = "0 0 0 3px rgba(27,63,126,0.08)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(27,63,126,0.22)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmar(!showConfirmar)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#6B7A8D" }}>
                    {showConfirmar ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
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
                disabled={loading || !token}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "#1B3F7E" }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#2A5298"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#1B3F7E")}
              >
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
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
