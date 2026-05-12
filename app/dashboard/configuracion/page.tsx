"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL, apiFetch } from "@/lib/api";
import DashboardHero from "@/components/ui/DashboardHero";
import { LogOut, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NotifPrefs {
  notifNuevoModulo: boolean;
  notifModuloCompletado: boolean;
  notifComunicado: boolean;
  notifPendiente: boolean;
  modoOscuro: boolean;
}

function ToggleRow({
  label, description, checked, onChange, separator = true,
}: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; separator?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex-1 min-w-0 pr-8">
          <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>{label}</p>
          {description && (
            <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>{description}</p>
          )}
        </div>
        <button
          onClick={() => onChange(!checked)}
          className="relative shrink-0 transition-colors rounded-full cursor-pointer"
          style={{
            width: "48px", height: "26px",
            background: checked ? "var(--lima)" : "var(--gris-borde)",
          }}
        >
          <span
            className="absolute top-0.5 rounded-full transition-transform"
            style={{
              width: "22px", height: "22px",
              background: "#fff",
              left: "2px",
              transform: checked ? "translateX(22px)" : "translateX(0)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </button>
      </div>
      {separator && <div className="mx-6" style={{ borderBottom: "1px solid var(--gris-borde)" }} />}
    </div>
  );
}

/* ── Toast fijo — no desplaza el layout ── */
function Toast({ visible, mensaje, variante = "ok" }: { visible: boolean; mensaje: string; variante?: "ok" | "error" }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold pointer-events-none"
      style={{
        background:  variante === "error" ? "var(--error)" : "var(--azul-egm)",
        color:       "#fff",
        boxShadow:   "0 4px 20px rgba(0,0,0,0.18)",
        opacity:     visible ? 1 : 0,
        transform:   visible ? "translateY(0)" : "translateY(12px)",
        transition:  "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      <Check size={15} />
      {mensaje}
    </div>
  );
}

export default function ConfiguracionPage() {
  const { usuario, logout } = useAuth();
  const router = useRouter();

  const [pwdActual, setPwdActual]     = useState("");
  const [pwdNueva, setPwdNueva]       = useState("");
  const [pwdConfirmar, setPwdConfirmar] = useState("");
  const [showPwdActual, setShowPwdActual]       = useState(false);
  const [showPwdNueva, setShowPwdNueva]         = useState(false);
  const [showPwdConfirmar, setShowPwdConfirmar] = useState(false);
  const [resetSent, setResetSent]               = useState(false);
  const [resetLoading, setResetLoading]         = useState(false);
  const [loadingPwd, setLoadingPwd]   = useState(false);
  const [intentado, setIntentado]     = useState(false);
  const [toast, setToast]             = useState<{ visible: boolean; mensaje: string; variante: "ok" | "error" }>({ visible: false, mensaje: "", variante: "ok" });

  const [prefs, setPrefs] = useState<NotifPrefs>({
    notifNuevoModulo:      true,
    notifModuloCompletado: true,
    notifComunicado:       true,
    notifPendiente:        true,
    modoOscuro:            false,
  });

  const showToast = (mensaje: string, variante: "ok" | "error" = "ok") => {
    setToast({ visible: true, mensaje, variante });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  };

  useEffect(() => { loadPrefs(); }, []);

  const loadPrefs = async () => {
    try {
      const res = await apiFetch(`${API_URL}/users/me`);
      if (res.ok) {
        const data = await res.json();
        setPrefs({
          notifNuevoModulo:      data.notifNuevoModulo      ?? true,
          notifModuloCompletado: data.notifModuloCompletado ?? true,
          notifComunicado:       data.notifComunicado       ?? true,
          notifPendiente:        data.notifPendiente        ?? true,
          modoOscuro:            data.modoOscuro            ?? false,
        });
      }
    } catch {}
  };

  const handleSolicitarReset = async () => {
    if (!usuario?.email) return;
    setResetLoading(true);
    try {
      await apiFetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        body: JSON.stringify({ email: usuario.email }),
      });
      setResetSent(true);
    } catch {}
    finally { setResetLoading(false); }
  };

  const handleCambiarPassword = async () => {
    setIntentado(true);
    if (!pwdActual || !pwdNueva || !pwdConfirmar) {
      showToast("Completa todos los campos.", "error"); return;
    }
    if (pwdNueva.length < 8) {
      showToast("La contraseña debe tener al menos 8 caracteres.", "error"); return;
    }
    if (pwdNueva !== pwdConfirmar) {
      showToast("Las contraseñas no coinciden.", "error"); return;
    }
    setLoadingPwd(true);
    try {
      const res = await apiFetch(`${API_URL}/users/me/password`, {
        method: "POST",
        body: JSON.stringify({ passwordActual: pwdActual, passwordNueva: pwdNueva, passwordConfirmar: pwdConfirmar }),
      });
      if (res.ok) {
        showToast("Contraseña actualizada correctamente.");
        setPwdActual(""); setPwdNueva(""); setPwdConfirmar("");
        setIntentado(false);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message ?? "Error al cambiar la contraseña.", "error");
      }
    } catch { showToast("Error de conexión. Inténtalo de nuevo.", "error"); }
    finally  { setLoadingPwd(false); }
  };

  const updatePref = async (key: keyof NotifPrefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    try {
      const res = await apiFetch(`${API_URL}/users/me`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        showToast("Preferencias guardadas.");
      }
    } catch {}
  };

  const handleLogout = async () => { await logout(); router.push("/login"); };

  /* ── Estilos compartidos ── */
  const sectionLabel = "text-sm font-semibold uppercase tracking-widest mb-4";
  const inputClass   = "w-full px-4 py-3.5 text-base border outline-none transition-colors";
  const inputStyle   = { background: "var(--gris-pagina)", borderColor: "var(--gris-borde)", color: "var(--texto-primario)" };
  const labelClass   = "text-xs font-bold uppercase tracking-wider";

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--gris-pagina)" }}>

      <DashboardHero
        prefijo="Mi "
        titulo="Configuración"
        variante="seccion"
        imagenFondo={usuario?.bannerUrl ?? "/background-dashboard.webp"}
      />

      {/* Toast — posición fija, no afecta al layout */}
      <Toast visible={toast.visible} mensaje={toast.mensaje} variante={toast.variante} />

      <div className="px-6 sm:px-10 lg:px-16 pt-14 lg:pt-16 pb-16">

        {/* ── Fila superior: Seguridad + Notificaciones ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 mb-14 lg:mb-16">

          {/* SEGURIDAD */}
          <section className="flex flex-col">
            <p className={sectionLabel} style={{ color: "var(--texto-muted)" }}>Seguridad</p>
            <div className="rounded-2xl p-8 flex-1" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="flex flex-col gap-5">

                {/* Contraseña actual */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className={`${labelClass} shrink-0`} style={{ color: "var(--texto-muted)" }}>Contraseña actual</label>
                    {!resetSent ? (
                      <button
                        type="button"
                        onClick={handleSolicitarReset}
                        disabled={resetLoading}
                        className="text-xs font-medium transition-opacity hover:opacity-70 cursor-pointer text-right"
                        style={{ color: "var(--azul-egm)" }}
                      >
                        {resetLoading ? "Enviando…" : "Recuperar contraseña"}
                      </button>
                    ) : (
                      <span className="flex items-center justify-end gap-1 text-xs font-medium text-right" style={{ color: "var(--verde-oliva)" }}>
                        <Check size={13} />
                        Email enviado
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPwdActual ? "text" : "password"}
                      value={pwdActual}
                      onChange={(e) => setPwdActual(e.target.value)}
                      placeholder="Tu contraseña actual"
                      className={`${inputClass} pr-12`}
                      style={{ ...inputStyle, borderRadius: "var(--radius-sm)", borderColor: intentado && !pwdActual ? "var(--error)" : "var(--gris-borde)" }}
                      onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                      onBlur={(e)  => e.target.style.borderColor = intentado && !pwdActual ? "var(--error)" : "var(--gris-borde)"}
                    />
                    <button type="button" onClick={() => setShowPwdActual(!showPwdActual)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 active:scale-90 transition-transform duration-100 cursor-pointer"
                      style={{ color: "var(--texto-muted)" }}>
                      {showPwdActual ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Nueva contraseña */}
                <div className="flex flex-col gap-2">
                  <label className={labelClass} style={{ color: "var(--texto-muted)" }}>Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPwdNueva ? "text" : "password"}
                      value={pwdNueva}
                      onChange={(e) => setPwdNueva(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className={`${inputClass} pr-12`}
                      style={{
                        ...inputStyle,
                        borderRadius: "var(--radius-sm)",
                        borderColor: (intentado && !pwdNueva) || (pwdNueva && pwdConfirmar && pwdNueva !== pwdConfirmar) ? "var(--error)" : "var(--gris-borde)",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                      onBlur={(e)  => e.target.style.borderColor = (intentado && !pwdNueva) || (pwdNueva && pwdConfirmar && pwdNueva !== pwdConfirmar) ? "var(--error)" : "var(--gris-borde)"}
                    />
                    <button type="button" onClick={() => setShowPwdNueva(!showPwdNueva)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 active:scale-90 transition-transform duration-100 cursor-pointer"
                      style={{ color: "var(--texto-muted)" }}>
                      {showPwdNueva ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div className="flex flex-col gap-2">
                  <label className={labelClass} style={{ color: "var(--texto-muted)" }}>Confirmar contraseña</label>
                  <div className="relative">
                    <input
                      type={showPwdConfirmar ? "text" : "password"}
                      value={pwdConfirmar}
                      onChange={(e) => setPwdConfirmar(e.target.value)}
                      placeholder="Repite la contraseña"
                      className={`${inputClass} pr-12`}
                      style={{
                        ...inputStyle,
                        borderRadius: "var(--radius-sm)",
                        borderColor: (intentado && !pwdConfirmar) || (pwdConfirmar && pwdNueva !== pwdConfirmar) ? "var(--error)" : "var(--gris-borde)",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                      onBlur={(e)  => e.target.style.borderColor = (intentado && !pwdConfirmar) || (pwdConfirmar && pwdNueva !== pwdConfirmar) ? "var(--error)" : "var(--gris-borde)"}
                    />
                    <button type="button" onClick={() => setShowPwdConfirmar(!showPwdConfirmar)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 active:scale-90 transition-transform duration-100 cursor-pointer"
                      style={{ color: "var(--texto-muted)" }}>
                      {showPwdConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center sm:justify-end mt-10">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleCambiarPassword}
                  disabled={loadingPwd}
                >
                  {loadingPwd ? "Actualizando…" : "Actualizar contraseña"}
                </Button>
              </div>
            </div>
          </section>

          {/* NOTIFICACIONES */}
          <section className="flex flex-col">
            <p className={sectionLabel} style={{ color: "var(--texto-muted)" }}>Notificaciones</p>
            <div className="rounded-2xl flex-1" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="px-6 py-5">
                <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
                  Notificaciones por email enviadas a{" "}
                  <strong className="text-base break-all" style={{ color: "var(--texto-primario)", fontWeight: 600 }}>{usuario?.email}</strong>
                </p>
              </div>
              <div className="mx-6" style={{ borderBottom: "1px solid var(--gris-borde)" }} />
              <ToggleRow label="Nuevo módulo disponible"  description="Cuando se publica un nuevo módulo de formación" checked={prefs.notifNuevoModulo}      onChange={(v) => updatePref("notifNuevoModulo", v)} />
              <ToggleRow label="Módulo completado"        description="Confirmación cuando terminas un módulo"         checked={prefs.notifModuloCompletado}  onChange={(v) => updatePref("notifModuloCompletado", v)} />
              <ToggleRow label="Nuevos comunicados"       description="Cuando tu empresa publica un comunicado"        checked={prefs.notifComunicado}        onChange={(v) => updatePref("notifComunicado", v)} />
              <ToggleRow label="Recordatorio pendientes"  description="Si tienes notificaciones sin leer"              checked={prefs.notifPendiente}         onChange={(v) => updatePref("notifPendiente", v)} separator={false} />
            </div>
          </section>
        </div>

        {/* ── Fila inferior: Apariencia + Sesión ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* APARIENCIA */}
          <section className="flex flex-col">
            <p className={sectionLabel} style={{ color: "var(--texto-muted)" }}>Apariencia</p>
            <div className="rounded-2xl flex-1 flex flex-col" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", minHeight: "110px" }}>
              <div className="flex items-center justify-between px-6 flex-1">
                <div>
                  <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>Modo oscuro</p>
                  <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>Próximamente disponible</p>
                </div>
                <div className="relative shrink-0 rounded-full cursor-not-allowed opacity-40"
                  style={{ width: "48px", height: "26px", background: "var(--gris-borde)" }}>
                  <span className="absolute top-0.5 left-0.5 rounded-full"
                    style={{ width: "22px", height: "22px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </div>
              </div>
            </div>
          </section>

          {/* SESIÓN */}
          <section className="flex flex-col">
            <p className={sectionLabel} style={{ color: "var(--texto-muted)" }}>Sesión</p>
            <div className="rounded-2xl flex-1 flex flex-col" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", minHeight: "110px" }}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-6 w-full flex-1 rounded-2xl transition-colors text-left cursor-pointer active:bg-red-500/10"
                style={{ color: "var(--error)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(220,38,38,0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <LogOut size={18} />
                <span className="text-base font-semibold">Cerrar sesión</span>
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
