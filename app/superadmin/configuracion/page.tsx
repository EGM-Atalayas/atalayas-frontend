// src/app/superadmin/configuracion/page.tsx
"use client";

import React, { useState } from "react";
import { FaUserShield, FaSave, FaLock } from "react-icons/fa";

export default function ConfiguracionPage() {
  // Simulamos los datos del super admin (esto debería venir de tu AuthContext o backend)
  const [perfil, setPerfil] = useState({
    nombre: "Super Administrador",
    email: "admin@atalayas.com",
    telefono: "+34 600 000 000",
  });

  const [passwords, setPasswords] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular llamada a API: PATCH /api/v1/auth/me
    setTimeout(() => {
      setIsLoading(false);
      alert("Perfil actualizado correctamente");
    }, 1000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.nueva !== passwords.confirmar) {
      alert("Las contraseñas no coinciden");
      return;
    }
    setIsLoading(true);
    // Simular llamada a API: POST /api/v1/auth/change-password
    setTimeout(() => {
      setIsLoading(false);
      setPasswords({ actual: "", nueva: "", confirmar: "" });
      alert("Contraseña actualizada correctamente");
    }, 1000);
  };

  return (
    <div className="p-8 w-full max-w-4xl animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-950">Configuración</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona tu perfil y preferencias de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* FORMULARIO DE PERFIL */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-max">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <FaUserShield className="text-blue-600 text-xl" />
            <h2 className="text-lg font-bold text-blue-950">Datos Personales</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Nombre</label>
              <input
                type="text"
                value={perfil.nombre}
                onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Email (Solo lectura)</label>
              <input
                type="email"
                disabled
                value={perfil.email}
                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Teléfono</label>
              <input
                type="tel"
                value={perfil.telefono}
                onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 bg-blue-950 text-white font-semibold py-3 rounded-xl hover:bg-blue-900 transition-colors flex justify-center items-center gap-2"
            >
              <FaSave /> {isLoading ? "Guardando..." : "Actualizar Perfil"}
            </button>
          </form>
        </div>

        {/* FORMULARIO DE SEGURIDAD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-max">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <FaLock className="text-blue-600 text-xl" />
            <h2 className="text-lg font-bold text-blue-950">Cambiar Contraseña</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Contraseña Actual</label>
              <input
                type="password"
                required
                value={passwords.actual}
                onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Nueva Contraseña</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwords.nueva}
                onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwords.confirmar}
                onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwords.actual || !passwords.nueva || !passwords.confirmar}
              className="mt-2 bg-slate-800 text-white font-semibold py-3 rounded-xl hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}