"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FaUser,
  FaLock,
  FaBell,
  FaUserSecret,
  FaCamera,
  FaCheck,
  FaExclamation,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

type TabType = "perfil" | "seguridad" | "notificaciones" | "privacidad";

const TABS: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
  { id: "perfil", label: "Perfil", icon: <FaUser /> },
  { id: "seguridad", label: "Seguridad", icon: <FaLock /> },
  { id: "notificaciones", label: "Notificaciones", icon: <FaBell /> },
  { id: "privacidad", label: "Privacidad", icon: <FaUserSecret /> },
];

export default function ConfiguracionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { usuario } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || "perfil");

  // ── ESTADOS PERFIL ──
  const [fotoPerfil, setFotoPerfil] = useState<string>(usuario?.avatarUrl || "/perfil-default.png");
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [apellido, setApellido] = useState(usuario?.apellidos || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [telefono, setTelefono] = useState("");
  const [bio, setBio] = useState("");

  // ── ACTUALIZAR CUANDO CAMBIA EL USUARIO ──
  useEffect(() => {
    if (usuario) {
      setFotoPerfil(usuario.avatarUrl || "/perfil-default.png");
      setNombre(usuario.nombre || "");
      setApellido(usuario.apellidos || "");
      setEmail(usuario.email || "");
    }
  }, [usuario]);

  // ── ESTADOS SEGURIDAD ──
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  // ── ESTADOS GENERALES ──
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ tipo: "exito" | "error" | null; mensaje: string }>({
    tipo: null,
    mensaje: "",
  });

  // ── FUNCIONES ──
  const mostrarToast = (tipo: "exito" | "error", mensaje: string) => {
    setToast({ tipo, mensaje });
    setTimeout(() => setToast({ tipo: null, mensaje: "" }), 4000);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 15MB)
      if (file.size > 15 * 1024 * 1024) {
        mostrarToast("error", "La imagen no debe exceder 15MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setFotoPerfil(imageData);
        mostrarToast("exito", "Foto de perfil actualizada (durante esta sesión)");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      mostrarToast("exito", "Perfil actualizado correctamente");
    } catch {
      mostrarToast("error", "Error al actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      mostrarToast("error", "Completa todos los campos");
      return;
    }

    if (passwordNueva.length < 8) {
      mostrarToast("error", "La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (passwordNueva !== passwordConfirmar) {
      mostrarToast("error", "Las contraseñas no coinciden");
      return;
    }

    if (passwordActual === passwordNueva) {
      mostrarToast("error", "La nueva contraseña no puede ser igual a la actual");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
      mostrarToast("exito", "Contraseña actualizada correctamente");
    } catch {
      mostrarToast("error", "Error al cambiar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDescargarDatos = () => {
    if (!usuario) {
      mostrarToast("error", "No hay datos de usuario para descargar");
      return;
    }

    // Crear objeto con los datos del usuario
    const datosUsuario = {
      nombreCompleto: `${usuario.nombre} ${usuario.apellidos || ""}`.trim(),
      email: usuario.email,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      rol: usuario.codigoRol,
      nombreRol: usuario.nombreRol,
      empresaId: usuario.empresaId,
      nombreEmpresa: usuario.nombreEmpresa,
      activo: usuario.activo,
      avatarUrl: usuario.avatarUrl,
      descargadoEn: new Date().toISOString(),
    };

    // Convertir a JSON
    const jsonString = JSON.stringify(datosUsuario, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Crear link y descargar
    const link = document.createElement("a");
    link.href = url;
    link.download = `datos-personales-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarToast("exito", "Datos descargados correctamente");
  };

  const handleEliminarCuenta = () => {
    const confirmacion = window.confirm(
      "Esta acción es irreversible. Se eliminarán todos tus datos permanentemente. ¿Estás seguro?"
    );

    if (!confirmacion) return;

    const confirmacionFinal = window.confirm(
      "Esta es tu última oportunidad. ¿Realmente quieres eliminar tu cuenta?"
    );

    if (!confirmacionFinal) return;

    mostrarToast("error", "Función de eliminación en desarrollo");
    // Aquí irá la lógica para eliminar la cuenta
  };

  return (
    <div className="w-full animate-fadeIn pb-16">
      {/* HEADER */}
      <div className="px-6 md:px-10 pt-8 pb-6">
        <h1 className="text-4xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 mt-2">Personaliza tu cuenta y gestiona tus preferencias</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 px-6 md:px-10">
        {/* SIDEBAR */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-l-4 transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-blue-50 border-l-blue-600 text-blue-600 font-semibold"
                    : "border-l-transparent text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1">
          {/* TAB: PERFIL */}
          {activeTab === "perfil" && (
            <div className="space-y-6">
              {/* Sección de Foto de Perfil */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Foto de Perfil</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      {fotoPerfil === "/perfil-default.png" ? (
                        <FaUser className="text-4xl text-blue-300" />
                      ) : (
                        <Image
                          src={fotoPerfil}
                          alt="Foto de perfil"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaCamera size={18} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Cambiar foto</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Sube una imagen JPG, PNG o GIF. Máximo 15MB.
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors"
                    >
                      Seleccionar imagen
                    </button>
                  </div>
                </div>
              </div>

              {/* Sección de Información Personal */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Información Personal</h2>
                <form onSubmit={handleUpdatePerfil} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Nombre</label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">Apellido</label>
                      <input
                        type="text"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500">
                      El email no se puede cambiar por motivos de seguridad.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Teléfono</label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Biografía</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={150}
                      rows={3}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                    />
                    <p className="text-xs text-slate-500">{bio.length}/150 caracteres</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FaCheck size={16} />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: SEGURIDAD */}
          {activeTab === "seguridad" && (
            <div className="space-y-6">
              {/* Cambiar Contraseña */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Cambiar Contraseña</h2>
                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Contraseña Actual</label>
                    <div className="relative">
                      <input
                        type={showPasswords.actual ? "text" : "password"}
                        value={passwordActual}
                        onChange={(e) => setPasswordActual(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, actual: !showPasswords.actual })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.actual ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Nueva Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPasswords.nueva ? "text" : "password"}
                        value={passwordNueva}
                        onChange={(e) => setPasswordNueva(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, nueva: !showPasswords.nueva })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.nueva ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Mínimo 8 caracteres. Usa mayúsculas, minúsculas y números.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700">Confirmar Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirmar ? "text" : "password"}
                        value={passwordConfirmar}
                        onChange={(e) => setPasswordConfirmar(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            confirmar: !showPasswords.confirmar,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.confirmar ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <FaCheck size={16} />
                        Cambiar Contraseña
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Dispositivos Activos */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Dispositivos Activos</h2>
                <div className="space-y-3">
                  <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Windows - Chrome</p>
                      <p className="text-sm text-slate-500">192.168.1.100 • Última actividad hace 5 minutos</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Activo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NOTIFICACIONES */}
          {activeTab === "notificaciones" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Preferencias de Notificaciones</h2>
              <div className="space-y-4 max-w-md">
                {[
                  { label: "Nuevas solicitudes de empresas", enabled: true },
                  { label: "Empresas aprobadas", enabled: true },
                  { label: "Actualizaciones del sistema", enabled: true },
                  { label: "Reportes semanales", enabled: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <label className="relative inline-flex cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={item.enabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PRIVACIDAD */}
          {activeTab === "privacidad" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Privacidad y Seguridad</h2>
              <div className="space-y-6 max-w-2xl">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-900">
                    Tu cuenta está protegida con los más altos estándares de seguridad. Nunca compartimos tus datos personales con terceros.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Descarga tus datos</h3>
                  <p className="text-slate-600 text-sm">
                    Solicita una copia de todos tus datos personales en formato JSON.
                  </p>
                  <button
                    onClick={handleDescargarDatos}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-colors"
                  >
                    Descargar mis datos
                  </button>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 text-red-600">Zona de Peligro</h3>
                  <p className="text-slate-600 text-sm">
                    Eliminar tu cuenta es una acción irreversible. Todos tus datos serán eliminados permanentemente.
                  </p>
                  <button
                    onClick={handleEliminarCuenta}
                    className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-colors"
                  >
                    Eliminar cuenta
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TOAST */}
      {toast.tipo && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 animate-slideUp ${
            toast.tipo === "exito"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {toast.tipo === "exito" ? <FaCheck size={18} /> : <FaExclamation size={18} />}
          <span className="font-medium">{toast.mensaje}</span>
        </div>
      )}
    </div>
  );
}