"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { API_URL, apiFetch } from "@/lib/api";
import { Camera, Edit2, Shield, Key, CheckCircle, Briefcase, User, Clock } from "lucide-react";

function getInitials(nombre: string, apellidos: string = ""): string {
  const n = nombre ? nombre[0] : "";
  const a = apellidos ? apellidos[0] : "";
  const initials = (n + a).toUpperCase();
  return initials || "?";
}

export default function PerfilPage() {
  const { usuario, setUsuario } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [puesto, setPuesto] = useState("");

  const [pwdActual, setPwdActual] = useState("");
  const [pwdNueva, setPwdNueva] = useState("");
  const [pwdConfirmar, setPwdConfirmar] = useState("");

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  // Estados para manejar el modo edición
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingPass, setIsEditingPass] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || "");
      setApellidos(usuario.apellidos || "");
      setEmail(usuario.email || "");
      setPuesto("");
    }
  }, [usuario]);

  const handleGuardarInformacion = async () => {
    if (!usuario?.usuarioId) {
      alert("Error: No se pudo obtener el ID del usuario.");
      return;
    }

    setLoadingInfo(true);
    try {
      const payload: any = { nombre, apellidos };
      if (puesto) payload.puesto = puesto;

      const res = await apiFetch(`${API_URL}/usuarios/${usuario.usuarioId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: en la respuesta del servidor.`;
        try {
          const errorData = await res.json();
          if (errorData?.message) errorMsg = errorData.message;
        } catch (e) {
          errorMsg = res.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const updatedUser = await res.json();

      const finalUser = updatedUser || {};
      setUsuario({
        ...usuario,
        ...finalUser,
        nombre: finalUser.nombre || nombre,
        apellidos: finalUser.apellidos || apellidos
      });

      setIsEditingInfo(false); // Salir del modo edición
      alert("Información personal guardada correctamente.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error al guardar la información.");
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleCambiarPassword = async () => {
    if (!pwdActual || !pwdNueva || !pwdConfirmar) {
      alert("Debes rellenar todos los campos de contraseña.");
      return;
    }
    if (pwdNueva !== pwdConfirmar) {
      alert("Las nuevas contraseñas no coinciden.");
      return;
    }
    setLoadingPass(true);
    try {
      const id = usuario?.usuarioId;
      if (!id) throw new Error("ID de usuario no disponible.");

      const res = await apiFetch(`${API_URL}/usuarios/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          passwordActual: pwdActual,
          password: pwdNueva
        }),
      });

      if (!res.ok) {
        let errorMsg = `Error ${res.status}: al actualizar la contraseña.`;
        try {
          const errorData = await res.json();
          if (errorData?.message) errorMsg = errorData.message;
        } catch (e) {
          errorMsg = res.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      alert("Contraseña modificada correctamente.");
      setPwdActual("");
      setPwdNueva("");
      setPwdConfirmar("");
      setIsEditingPass(false); // Salir del modo edición
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error al cambiar la contraseña. Asegúrate de que la contraseña actual es correcta.");
    } finally {
      setLoadingPass(false);
    }
  };

  if (!usuario) {
    return <div className="min-h-screen bg-(--gris-pagina)" />;
  }

  const initials = getInitials(usuario.nombre, usuario.apellidos);

  return (
    <div className="min-h-screen w-full pb-12" style={{ background: "var(--gris-pagina)" }}>
      {/* Container ancho para el layout de columnas */}
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 flex flex-col gap-8">

        {/* === Header del Perfil === */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 animate-fade-rise">
          <div className="relative group cursor-pointer shrink-0">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border-4px border-white"
              style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
            >
              {usuario.avatarUrl ? (
                <Image
                  src={usuario.avatarUrl}
                  alt="Avatar"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-4xl font-bold">{initials}</span>
              )}
            </div>
            <div
              className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-lg flex items-center justify-center border-2 border-white shadow-sm text-white transition-transform group-hover:scale-105"
              style={{ background: "var(--azul-egm)" }}
            >
              <Camera size={16} />
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-start pt-2">
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--texto-primario)", fontFamily: "'Playfair Display', serif", letterSpacing: "-0.01em" }}
            >
              {usuario.nombre} {usuario.apellidos}
            </h1>
            <p
              className="text-base mt-0.5 font-medium"
              style={{ color: "var(--texto-muted)" }}
            >
              {usuario.nombreRol || "Especialista en Control de Calidad"}
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap justify-center sm:justify-start">
              {usuario.nombreEmpresa ? (
                <span className="px-3 py-1.5 text-[11px] font-bold rounded-full uppercase tracking-wider" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                  {usuario.nombreEmpresa}
                </span>
              ) : (
                <span className="px-3 py-1.5 text-[11px] font-bold rounded-full uppercase tracking-wider" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                  EGM ATALAYAS
                </span>
              )}
              <span className="px-3 py-1.5 bg-slate-200 text-slate-700 text-[11px] font-bold rounded-full uppercase tracking-wider">
                Empleado Activo
              </span>
            </div>
          </div>
        </div>

        {/* === Grid Principal (2 columnas + 1 columna lateral) === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coloca Izquierda: Cards de Información */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* --- Tarjeta: Personal Information --- */}
            <div className="rounded-xl bg-white shadow-sm border overflow-hidden animate-fade-rise-delay" style={{ borderColor: "var(--gris-borde)" }}>
              <div className="px-6 py-5 border-b flex justify-between items-center bg-[rgba(245,246,248,0.5)]" style={{ borderColor: "var(--gris-borde)" }}>
                <h2 className="text-lg font-bold" style={{ color: "var(--texto-primario)" }}>Información Personal</h2>
                {!isEditingInfo && (
                  <button
                    onClick={() => setIsEditingInfo(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
                    style={{ color: "var(--azul-egm)" }}
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                )}
              </div>

              <div className="p-6">
                {!isEditingInfo ? (
                  /* Modo Vista */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-7 gap-x-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Nombre</span>
                      <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{nombre || "—"}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Apellidos</span>
                      <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{apellidos || "—"}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Correo Electrónico</span>
                      <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{email || "—"}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Teléfono</span>
                      <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>+34 612 345 678</p>
                    </div>
                  </div>
                ) : (
                  /* Modo Edición */
                  <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Nombre</label>
                        <input
                          type="text"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors border"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                          onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                          onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Apellidos</label>
                        <input
                          type="text"
                          value={apellidos}
                          onChange={(e) => setApellidos(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors border"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                          onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                          onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Puesto de trabajo</label>
                        <input
                          type="text"
                          value={puesto}
                          onChange={(e) => setPuesto(e.target.value)}
                          placeholder="Ej: Director comercial"
                          className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors border"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                          onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                          onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Email <span className="text-xs font-normal" style={{ color: "var(--texto-muted)" }}>(Solo lectura)</span></label>
                        <input
                          type="email"
                          value={email}
                          readOnly
                          className="w-full px-3 py-2 text-sm rounded-lg outline-none cursor-not-allowed border"
                          style={{ borderColor: "var(--gris-borde)", background: "var(--gris-pagina)", color: "var(--texto-secundario)" }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 mt-2 border-t" style={{ borderColor: "var(--gris-borde)" }}>
                      <button
                        onClick={() => setIsEditingInfo(false)}
                        className="px-5 py-2 text-sm font-semibold rounded-lg transition-colors border"
                        style={{ color: "var(--texto-primario)", borderColor: "var(--gris-borde)", background: "transparent" }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleGuardarInformacion}
                        disabled={loadingInfo}
                        className="px-5 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all"
                        style={{ background: "var(--azul-egm)", color: "var(--blanco)", opacity: loadingInfo ? 0.7 : 1 }}
                      >
                        {loadingInfo ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- Tarjeta: Professional Details --- */}
            <div className="rounded-xl bg-white shadow-sm border overflow-hidden animate-fade-rise-delay" style={{ borderColor: "var(--gris-borde)" }}>
              <div className="px-6 py-5 border-b bg-[rgba(245,246,248,0.5)]" style={{ borderColor: "var(--gris-borde)" }}>
                <h2 className="text-lg font-bold" style={{ color: "var(--texto-primario)" }}>Detalles Profesionales</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                    <Briefcase size={14} /> Departamento
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Control de Calidad</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                    <Clock size={14} /> Fecha de Incorporación
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>14 de marzo, 2022</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                    <User size={14} /> Supervisor
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Marta Sánchez</p>
                </div>
              </div>
            </div>

            {/* --- Tarjeta: Security & Privacy --- */}
            <div className="rounded-xl bg-white shadow-sm border overflow-hidden animate-fade-rise-delay-2" style={{ borderColor: "var(--gris-borde)" }}>
              <div className="px-6 py-5 border-b bg-[rgba(245,246,248,0.5)]" style={{ borderColor: "var(--gris-borde)" }}>
                <h2 className="text-lg font-bold" style={{ color: "var(--texto-primario)" }}>Seguridad y Privacidad</h2>
              </div>
              <div className="p-0 flex flex-col">

                {/* Item: Password */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b" style={{ borderColor: "var(--gris-borde)" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)" }}>
                      <Key size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--texto-primario)" }}>Contraseña</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Cambiada hace 4 meses</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingPass(!isEditingPass)}
                    className="px-4 py-2 font-semibold text-sm rounded-lg transition-colors shrink-0 outline-none"
                    style={{
                      background: isEditingPass ? "transparent" : "var(--azul-egm-light)",
                      color: isEditingPass ? "var(--texto-muted)" : "var(--azul-egm)",
                      border: isEditingPass ? "1px solid var(--gris-borde)" : "1px solid transparent"
                    }}
                  >
                    {isEditingPass ? "Cancelar" : "Actualizar"}
                  </button>
                </div>

                {/* Formulario Password Desplegable */}
                {isEditingPass && (
                  <div className="p-6 border-b animate-in fade-in slide-in-from-top-2 duration-300" style={{ borderColor: "var(--gris-borde)", background: "rgba(245,246,248,0.3)" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Contraseña actual</label>
                        <input
                          type="password"
                          value={pwdActual}
                          onChange={(e) => setPwdActual(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors border"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                          onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                          onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Nueva contraseña</label>
                        <input
                          type="password"
                          value={pwdNueva}
                          onChange={(e) => setPwdNueva(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors border"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                          onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                          onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Confirmar contraseña</label>
                        <input
                          type="password"
                          value={pwdConfirmar}
                          onChange={(e) => setPwdConfirmar(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors border"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                          onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                          onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-5 pt-4 border-t" style={{ borderColor: "var(--gris-borde)" }}>
                      <button
                        onClick={handleCambiarPassword}
                        disabled={loadingPass}
                        className="px-5 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all"
                        style={{ background: "var(--azul-egm)", color: "var(--blanco)", opacity: loadingPass ? 0.7 : 1 }}
                      >
                        {loadingPass ? "Actualizando..." : "Guardar Contraseña"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Item: 2FA */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)" }}>
                      <Shield size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--texto-primario)" }}>Autenticación en Dos Pasos</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Activada</p>
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 font-semibold text-sm rounded-lg transition-colors shrink-0"
                    style={{ background: "var(--gris-superficie)", color: "var(--texto-primario)" }}
                  >
                    Configurar
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Coloca Derecha: Widgets */}
          <div className="lg:col-span-1 flex flex-col gap-6">

            {/* --- Widget: Onboarding Status --- */}
            <div className="rounded-xl shadow-sm overflow-hidden animate-fade-rise-delay-2" style={{ background: "var(--marino)", color: "var(--blanco)" }}>
              <div className="p-6 flex flex-col items-center text-center">
                <h2 className="text-lg font-bold self-start w-full text-left mb-8">Estado de Incorporación</h2>

                <div className="relative w-36 h-36 mb-6">
                  <svg viewBox="0 0 36 36" className="w-full h-full stroke-current" style={{ color: "rgba(255,255,255,0.1)" }}>
                    <path className="stroke-current" fill="none" strokeWidth="2.5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <svg viewBox="0 0 36 36" className="w-full h-full absolute top-0 left-0" style={{ transform: "rotate(-90deg)" }}>
                    <path
                      style={{ stroke: "var(--verde-oliva)" }}
                      strokeDasharray="65, 100"
                      strokeLinecap="round"
                      className="stroke-current"
                      fill="none"
                      strokeWidth="2.5"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">65%</span>
                  </div>
                </div>

                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Nivel de Dominio Institucional
                </p>
                <p className="text-xl font-bold mt-1 mb-2">Fase Fundacional</p>

                <button className="w-full mt-6 py-3 rounded-lg font-semibold text-sm transition-colors" style={{ background: "rgba(255,255,255,0.1)", color: "var(--blanco)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
                  Continuar Formación
                </button>
              </div>
            </div>

            {/* --- Widget: Recent Achievements --- */}
            <div className="rounded-xl bg-white shadow-sm border relative overflow-hidden flex flex-col animate-fade-rise-delay-2" style={{ borderColor: "var(--gris-borde)", minHeight: "400px" }}>
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: "var(--verde-oliva)" }} />

              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-base font-bold flex items-center gap-2 mb-6 mt-1" style={{ color: "var(--texto-primario)" }}>
                  <span style={{ color: "var(--verde-oliva)" }}><CheckCircle size={18} fill="currentColor" className="text-white" /></span> Logros Recientes
                </h2>

                <div className="flex flex-col gap-3 flex-1">
                  {/* Cert 1 */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl border" style={{ background: "var(--gris-pagina)", borderColor: "var(--gris-borde)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                      <CheckCircle size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>Protocolos de Seguridad 2024</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Completado 12 ago, 2024</p>
                    </div>
                  </div>

                  {/* Cert 2 */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl border" style={{ background: "var(--gris-pagina)", borderColor: "var(--gris-borde)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                      <CheckCircle size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>Introducción a la Gestión de Calidad</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Completado 30 jul, 2024</p>
                    </div>
                  </div>

                  {/* Cert 3 */}
                  <div className="flex items-center gap-3.5 p-3.5 rounded-xl border" style={{ background: "var(--gris-pagina)", borderColor: "var(--gris-borde)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                      <CheckCircle size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>Fundamentos de Ciberseguridad</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Completado 15 jul, 2024</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center w-full">
                  <button className="text-sm font-bold transition-opacity hover:opacity-80" style={{ color: "var(--azul-egm)" }}>
                    Ver Todos los Certificados
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

