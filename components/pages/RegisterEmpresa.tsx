"use client";

import React, { useState } from "react";
import { FaBuilding, FaUserTie } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

const RegisterEmpresa: React.FC = () => {
  const router = useRouter();

  // Estados - Datos de la Empresa
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [cif, setCif] = useState("");
  const [emailContacto, setEmailContacto] = useState("");

  // Estados - Datos del Usuario Administrador
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estados de control
  const [errorMensaje, setErrorMensaje] = useState("");
  const [exitoMensaje, setExitoMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje("");
    setExitoMensaje("");
    setIsLoading(true);

    try {
      const payload = {
        empresa: {
          nombre_empresa: nombreEmpresa,
          cif: cif,
          email_contacto: emailContacto,
        },
        usuario: {
          nombre: nombre,
          apellidos: apellidos,
          email: email,
          password: password,
        },
      };

      const response = await fetch(`${API_URL}/auth/register-empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setExitoMensaje("¡Empresa y administrador registrados con éxito! Redirigiendo...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setErrorMensaje("Hubo un error al registrar los datos. Verifica e inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Error conectando al servidor:", error);
      setErrorMensaje("No se pudo conectar con el servidor. Verifica tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-950 min-h-screen flex items-center justify-center p-4 py-12">
      <div className="bg-slate-200 rounded-[2.5rem] p-10 w-full max-w-2xl flex flex-col items-center gap-y-8 shadow-2xl relative">
        
        <button
          onClick={() => router.push("/")} 
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-700 font-semibold text-sm hover:text-blue-900 group transition"
        >
          <FiArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Volver
        </button>

        <div className="flex flex-col items-center gap-y-2 mt-6">
          <h1 className="text-2xl font-bold text-blue-950 text-center">Alta de Empresa</h1>
          <p className="text-slate-600 text-sm text-center">Registra tu organización y tu cuenta de administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-y-8">
          
          {/* SECCIÓN 1: DATOS DE LA EMPRESA */}
          <div className="bg-slate-100 p-6 rounded-3xl shadow-inner">
            <h2 className="text-lg font-bold text-blue-950 mb-4 flex items-center gap-2">
              <FaBuilding className="text-slate-500" /> Datos de la Empresa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-2 md:col-span-2">
                <label className="font-bold text-xs text-slate-700 uppercase tracking-wider" htmlFor="nombreEmpresa">
                  Nombre de la empresa
                </label>
                <input
                  type="text"
                  id="nombreEmpresa"
                  value={nombreEmpresa}
                  onChange={(e) => setNombreEmpresa(e.target.value)}
                  className="bg-white rounded-xl px-4 py-3 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <label className="font-bold text-xs text-slate-700 uppercase tracking-wider" htmlFor="cif">
                  CIF
                </label>
                <input
                  type="text"
                  id="cif"
                  value={cif}
                  onChange={(e) => setCif(e.target.value)}
                  className="bg-white rounded-xl px-4 py-3 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <label className="font-bold text-xs text-slate-700 uppercase tracking-wider" htmlFor="emailContacto">
                  Email de Contacto (Empresa)
                </label>
                <input
                  type="email"
                  id="emailContacto"
                  value={emailContacto}
                  onChange={(e) => setEmailContacto(e.target.value)}
                  className="bg-white rounded-xl px-4 py-3 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS DEL ADMINISTRADOR */}
          <div className="bg-slate-100 p-6 rounded-3xl shadow-inner">
            <h2 className="text-lg font-bold text-blue-950 mb-4 flex items-center gap-2">
              <FaUserTie className="text-slate-500" /> Cuenta de Administrador
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-2">
                <label className="font-bold text-xs text-slate-700 uppercase tracking-wider" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="bg-white rounded-xl px-4 py-3 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <label className="font-bold text-xs text-slate-700 uppercase tracking-wider" htmlFor="apellidos">
                  Apellidos
                </label>
                <input
                  type="text"
                  id="apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="bg-white rounded-xl px-4 py-3 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <label className="font-bold text-xs text-slate-700 uppercase tracking-wider" htmlFor="email">
                  Email de Usuario
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white rounded-xl px-4 py-3 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <label className="font-bold text-xs text-slate-700 uppercase tracking-wider" htmlFor="password">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white rounded-xl px-4 py-3 w-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* MENSAJES Y BOTÓN SUBMIT */}
          <div className="flex flex-col gap-y-4 mt-2">
            {errorMensaje && (
              <p className="text-red-600 font-semibold text-sm text-center bg-red-100 p-3 rounded-xl border border-red-200">
                {errorMensaje}
              </p>
            )}

            {exitoMensaje && (
              <p className="text-green-600 font-semibold text-sm text-center bg-green-100 p-3 rounded-xl border border-green-200">
                {exitoMensaje}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-950 text-white font-bold py-4 rounded-full w-full hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-500 disabled:cursor-not-allowed text-lg shadow-lg"
            >
              {isLoading ? "Creando cuenta..." : "Registrar Empresa y Administrador"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterEmpresa;