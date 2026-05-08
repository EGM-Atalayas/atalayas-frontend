"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL, apiFetch } from "@/lib/api";
import DashboardHero from "@/components/ui/DashboardHero";
import { Key, Bell, Moon, LogOut, Check, Eye, EyeOff, ChevronLeft } from "lucide-react";

interface NotifPrefs {
  notifNuevoModulo: boolean;
  notifModuloCompletado: boolean;
  notifComunicado: boolean;
  notifPendiente: boolean;
  modoOscuro: boolean;
}

function ToggleRow({
  label, description, checked, onChange,
}: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-5 border-b last:border-b-0"
      style={{ borderColor: "var(--gris-borde)" }}>
      <div className="flex-1 min-w-0 pr-8">
        <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>{label}</p>
        {description && (
          <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative shrink-0 transition-colors rounded-full"
        style={{
          width: "44px", height: "24px",
          background: checked ? "var(--azul-egm)" : "var(--gris-borde)",
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-transform"
          style={{
            width: "20px", height: "20px",
            background: "#fff",
            left: "2px",
            transform: checked ? "translateX(20px)" : "translateX(0)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

export default function ConfiguracionPage() {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  const [pwdActual, setPwdActual] = useState("");
  const [pwdNueva, setPwdNueva] = useState("");
  const [pwdConfirmar, setPwdConfirmar] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [loadingPwd, setLoadingPwd] = useState(false);

  const [prefs, setPrefs] = useState<NotifPrefs>({
    notifNuevoModulo: true,
    notifModuloCompletado: true,
    notifComunicado: true,
    notifPendiente: true,
    modoOscuro: false,
  });
  const [savedPrefs, setSavedPrefs] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const res = await apiFetch(`${API_URL}/users/me`);
      if (res.ok) {
        const data = await res.json();
        setPrefs({
          notifNuevoModulo: data.notifNuevoModulo ?? true,
          notifModuloCompletado: data.notifModuloCompletado ?? true,
          notifComunicado: data.notifComunicado ?? true,
          notifPendiente: data.notifPendiente ?? true,
          modoOscuro: data.modoOscuro ?? false,
        });
      }
    } catch {}
  };

  const handleCambiarPassword = async () => {
    setPwdError("");
    setPwdSuccess(false);
    if (!pwdActual || !pwdNueva || !pwdConfirmar) {
      setPwdError("Rellena todos los campos.");
      return;
    }
    if (pwdNueva !== pwdConfirmar) {
      setPwdError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (pwdNueva.length < 8) {
      setPwdError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoadingPwd(true);
    try {
      const res = await apiFetch(`${API_URL}/users/me/password`, {
        method: "POST",
        body: JSON.stringify({ passwordActual: pwdActual, passwordNueva: pwdNueva, passwordConfirmar: pwdConfirmar }),
      });
      if (res.ok) {
        setPwdSuccess(true);
        setPwdActual(""); setPwdNueva(""); setPwdConfirmar("");
      } else {
        const data = await res.json().catch(() => ({}));
        setPwdError(data.message ?? "Error al cambiar la contraseña.");
      }
    } catch {
      setPwdError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoadingPwd(false);
    }
  };

  const updatePref = async (key: keyof NotifPrefs, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSavedPrefs(false);
    try {
      const res = await apiFetch(`${API_URL}/users/me`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        setSavedPrefs(true);
        setTimeout(() => setSavedPrefs(false), 2500);
      }
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--gris-pagina)" }}>

      <DashboardHero prefijo="Mi " titulo="Configuración" variante="minima" />

      <div className="px-10 lg:px-16 pt-14 pb-16">

        {/* Cabecera con volver */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/perfil")}
              className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors"
              style={{ background: "var(--blanco)", borderColor: "var(--gris-borde)", color: "var(--texto-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--azul-egm)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--gris-borde)"}
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--texto-primario)" }}>Configuración</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>{usuario?.nombre} {usuario?.apellidos}</p>
            </div>
          </div>
          {savedPrefs && (
            <span className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full"
              style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
              <Check size={14} /> Guardado
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Columna izquierda 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Seguridad */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="flex items-center gap-3 px-8 py-5 border-b"
                style={{ borderColor: "var(--gris-borde)", background: "rgba(245,246,248,0.6)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                  <Key size={16} />
                </div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: "var(--texto-primario)" }}>Contraseña</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Mínimo 8 caracteres</p>
                </div>
              </div>

              <div className="px-8 py-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

                  {/* Contraseña actual — ocupa fila completa */}
                  <div className="sm:col-span-2 flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={pwdActual}
                        onChange={(e) => setPwdActual(e.target.value)}
                        placeholder="Tu contraseña actual"
                        className="w-full px-4 py-3 pr-12 text-sm rounded-xl border outline-none transition-colors"
                        style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                        onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--texto-muted)" }}>
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={pwdNueva}
                      onChange={(e) => setPwdNueva(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full px-4 py-3 text-sm rounded-xl border outline-none transition-colors"
                      style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                      onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={pwdConfirmar}
                      onChange={(e) => setPwdConfirmar(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full px-4 py-3 text-sm rounded-xl border outline-none transition-colors"
                      style={{
                        borderColor: pwdConfirmar && pwdNueva !== pwdConfirmar ? "#dc2626" : "var(--gris-borde)",
                        color: "var(--texto-primario)",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                      onBlur={(e) => e.target.style.borderColor = pwdConfirmar && pwdNueva !== pwdConfirmar ? "#dc2626" : "var(--gris-borde)"}
                    />
                  </div>
                </div>

                {pwdError && (
                  <p className="text-sm font-medium mt-4" style={{ color: "#dc2626" }}>{pwdError}</p>
                )}
                {pwdSuccess && (
                  <p className="text-sm font-medium mt-4 flex items-center gap-2" style={{ color: "var(--verde-oliva)" }}>
                    <Check size={14} /> Contraseña actualizada correctamente
                  </p>
                )}

                <div className="flex justify-end mt-6 pt-5 border-t" style={{ borderColor: "var(--gris-borde)" }}>
                  <button
                    onClick={handleCambiarPassword}
                    disabled={loadingPwd}
                    className="px-6 py-3 text-sm font-semibold rounded-xl transition-opacity"
                    style={{ background: "var(--azul-egm)", color: "#fff", opacity: loadingPwd ? 0.7 : 1 }}
                  >
                    {loadingPwd ? "Actualizando…" : "Actualizar contraseña"}
                  </button>
                </div>
              </div>
            </div>

            {/* Notificaciones */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="flex items-center gap-3 px-8 py-5 border-b"
                style={{ borderColor: "var(--gris-borde)", background: "rgba(245,246,248,0.6)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                  <Bell size={16} />
                </div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: "var(--texto-primario)" }}>Notificaciones por email</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                    Enviadas a <strong style={{ color: "var(--texto-primario)" }}>{usuario?.email}</strong>
                  </p>
                </div>
              </div>
              <div className="px-8">
                <ToggleRow
                  label="Nuevo módulo disponible"
                  description="Cuando se publica un nuevo módulo de formación para tu empresa"
                  checked={prefs.notifNuevoModulo}
                  onChange={(v) => updatePref("notifNuevoModulo", v)}
                />
                <ToggleRow
                  label="Módulo completado"
                  description="Confirmación cuando terminas un módulo de formación"
                  checked={prefs.notifModuloCompletado}
                  onChange={(v) => updatePref("notifModuloCompletado", v)}
                />
                <ToggleRow
                  label="Nuevos comunicados"
                  description="Cuando tu empresa publica un comunicado oficial"
                  checked={prefs.notifComunicado}
                  onChange={(v) => updatePref("notifComunicado", v)}
                />
                <ToggleRow
                  label="Notificaciones sin leer"
                  description="Recordatorio periódico si tienes notificaciones pendientes"
                  checked={prefs.notifPendiente}
                  onChange={(v) => updatePref("notifPendiente", v)}
                />
              </div>
            </div>

          </div>

          {/* Columna derecha 1/3 */}
          <div className="flex flex-col gap-8">

            {/* Apariencia */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="flex items-center gap-3 px-6 py-5 border-b"
                style={{ borderColor: "var(--gris-borde)", background: "rgba(245,246,248,0.6)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                  <Moon size={16} />
                </div>
                <h2 className="font-bold" style={{ color: "var(--texto-primario)" }}>Apariencia</h2>
              </div>
              <div className="px-6">
                <ToggleRow
                  label="Modo oscuro"
                  description="Próximamente disponible"
                  checked={prefs.modoOscuro}
                  onChange={(v) => updatePref("modoOscuro", v)}
                />
              </div>
            </div>

            {/* Cerrar sesión */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="px-6 py-5 border-b" style={{ borderColor: "var(--gris-borde)", background: "rgba(245,246,248,0.6)" }}>
                <h2 className="font-bold" style={{ color: "var(--texto-primario)" }}>Cuenta</h2>
              </div>
              <div className="p-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-left transition-colors"
                  style={{ color: "#dc2626" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fff1f2"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut size={16} />
                  <span className="text-sm font-semibold">Cerrar sesión</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
