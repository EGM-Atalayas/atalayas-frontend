"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { API_URL, apiFetch } from "@/lib/api";

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

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || "");
      setApellidos(usuario.apellidos || "");
      setEmail(usuario.email || "");
      // Puesto de trabajo no está en la interfaz base, se podría cargar si se añade
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
      
      // Actualizamos el contexto con la nueva información
      const finalUser = updatedUser || {};
      setUsuario({ 
        ...usuario, 
        ...finalUser, 
        nombre: finalUser.nombre || nombre, 
        apellidos: finalUser.apellidos || apellidos 
      });

      alert("Información personal guardada correctamente en la base de datos.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error al guardar la información. Comprueba la conexión o la ruta de la API.");
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

      // Enviamos la contraseña actual y la nueva al mismo endpoint (comúnmente usado o ajustar a ruta correcta)
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

      alert("Contraseña modificada correctamente en la base de datos.");
      setPwdActual("");
      setPwdNueva("");
      setPwdConfirmar("");
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
    <div className="min-h-screen w-full" style={{ background: "var(--gris-pagina)" }}>
      {/* Contenedor principal de una columna centrado, max 680px */}
      <div className="max-w-[680px] mx-auto py-10 px-4 sm:px-6 flex flex-col gap-6">

        {/* === Cabecera de perfil === */}
        <div className="flex flex-col items-center text-center pb-2">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 overflow-hidden shadow-sm"
            style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
          >
            {usuario.avatarUrl ? (
              <Image
                src={usuario.avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-2xl font-bold">{initials}</span>
            )}
          </div>
          <h1
            className="font-serif font-bold"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "22px",
              color: "var(--texto-primario)",
              letterSpacing: "-0.01em"
            }}
          >
            {usuario.nombre} {usuario.apellidos}
          </h1>
          <p
            className="mt-1"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              color: "var(--texto-muted)",
              fontWeight: 500
            }}
          >
            {usuario.nombreRol || "Usuario"}
          </p>
          {usuario.nombreEmpresa && (
            <p
              className="mt-0.5"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "var(--texto-muted)"
              }}
            >
              {usuario.nombreEmpresa}
            </p>
          )}
        </div>

        {/* === Sección: Información personal === */}
        <div
          className="rounded-xl overflow-hidden shadow-sm"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
        >
          <div className="px-6 py-5 border-b" style={{ borderColor: "var(--gris-borde)" }}>
            <h2 className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
              Información personal
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
              Actualiza tus datos y perfil público.
            </p>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {/* Grid 2 columnas para campos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)" }}
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
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Email <span style={{ color: "var(--texto-muted)" }}>(Solo lectura)</span></label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none cursor-not-allowed"
                  style={{
                    border: "1px solid var(--gris-borde)",
                    background: "var(--gris-pagina)",
                    color: "var(--texto-secundario)"
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Puesto de trabajo</label>
                <input
                  type="text"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  placeholder="Ej: Director comercial"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                />
              </div>
            </div>

            {/* Acción de guardar */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleGuardarInformacion}
                disabled={loadingInfo}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all"
                style={{
                  background: "var(--azul-egm)",
                  color: "var(--blanco)",
                  opacity: loadingInfo ? 0.7 : 1
                }}
              >
                {loadingInfo ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>

        {/* === Sección: Seguridad === */}
        <div
          className="rounded-xl overflow-hidden shadow-sm"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
        >
          <div className="px-6 py-5 border-b" style={{ borderColor: "var(--gris-borde)" }}>
            <h2 className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
              Seguridad
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
              Gestiona tu contraseña de acceso a la plataforma.
            </p>
          </div>

          <div className="p-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Contraseña actual</label>
                <input
                  type="password"
                  value={pwdActual}
                  onChange={(e) => setPwdActual(e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-2 text-sm rounded-lg outline-none transition-colors"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)" }}
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
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={pwdConfirmar}
                  onChange={(e) => setPwdConfirmar(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
                  style={{ border: "1px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--azul-egm)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--gris-borde)"}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCambiarPassword}
                disabled={loadingPass}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all outline-blue"
                style={{
                  background: "transparent",
                  color: "var(--azul-egm)",
                  border: "1px solid var(--azul-egm)",
                  opacity: loadingPass ? 0.7 : 1
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--azul-egm-light)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                {loadingPass ? "Actualizando..." : "Cambiar contraseña"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
