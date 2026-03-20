// src/components/pages/RegisterEmpresa.tsx
"use client";

import React, { useState } from "react";
import { FaBuilding, FaUserTie, FaCheckCircle, FaClipboardList } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

const RegisterEmpresa: React.FC = () => {
  const router = useRouter();

  const [paso, setPaso] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");

  // Estado unificado exactamente con los campos de tu imagen
  const [formData, setFormData] = useState({
    // Paso 1: Empresa
    nombreEmpresa: "",
    cif: "",
    emailEmpresa: "", // Nuevo campo según la imagen
    // Paso 2: Admin
    nombreAdmin: "",
    apellidosAdmin: "",
    emailAdmin: "",
    passwordAdmin: "", // Nuevo campo según la imagen
    // Paso 3: Confirmación
    terminosAceptados: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const nextStep = () => {
    setErrorMensaje("");
    setPaso((prev) => prev + 1);
  };
  
  const prevStep = () => {
    setErrorMensaje("");
    if (paso === 1) {
      router.push("/");
    } else {
      setPaso((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje("");
    setIsLoading(true);

    const payload = {
      empresa: {
        nombre: formData.nombreEmpresa,
        cif: formData.cif,
        email_contacto: formData.emailEmpresa,
      },
      admin: {
        nombre: formData.nombreAdmin,
        apellidos: formData.apellidosAdmin,
        email: formData.emailAdmin,
        password: formData.passwordAdmin,
      },
    };

    try {
      const response = await fetch(`${API_URL}/api/v1/empresas/solicitud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setPaso(4);
      } else {
        setErrorMensaje("Hubo un error al procesar la solicitud. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Error conectando al servidor:", error);
      // MOCK DATA: Forzamos el éxito para probar la UI mientras el BE no esté listo
      console.warn("Usando mock mode: Simulando éxito de la solicitud");
      setTimeout(() => setPaso(4), 1000); 
    } finally {
      setIsLoading(false);
    }
  };

  // --- PASO 1: DATOS DE LA EMPRESA ---
  const renderPaso1 = () => (
    <div className="flex flex-col gap-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <FaBuilding className="text-blue-950 text-2xl" />
        <h2 className="text-xl font-bold text-blue-950">Datos de la Empresa</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre Empresa ocupa las dos columnas en escritorio */}
        <div className="flex flex-col gap-y-2 md:col-span-2">
          <label className="font-bold text-xs text-slate-700 uppercase" htmlFor="nombreEmpresa">Nombre de la empresa</label>
          <input type="text" id="nombreEmpresa" name="nombreEmpresa" value={formData.nombreEmpresa} onChange={handleChange} required className="bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
        </div>
        <div className="flex flex-col gap-y-2">
          <label className="font-bold text-xs text-slate-700 uppercase" htmlFor="cif">CIF</label>
          <input type="text" id="cif" name="cif" value={formData.cif} onChange={handleChange} required className="bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
        </div>
        <div className="flex flex-col gap-y-2">
          <label className="font-bold text-xs text-slate-700 uppercase" htmlFor="emailEmpresa">Email de contacto (Empresa)</label>
          <input type="email" id="emailEmpresa" name="emailEmpresa" value={formData.emailEmpresa} onChange={handleChange} required className="bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
        </div>
      </div>
      
      <button 
        type="button" 
        onClick={nextStep} 
        disabled={!formData.nombreEmpresa || !formData.cif || !formData.emailEmpresa} 
        className="bg-blue-950 text-white font-bold py-4 rounded-full w-full mt-4 hover:bg-blue-900 transition-colors disabled:bg-slate-400"
      >
        Siguiente: Cuenta de Administrador
      </button>
    </div>
  );

  // --- PASO 2: CUENTA DE ADMINISTRADOR ---
  const renderPaso2 = () => (
    <div className="flex flex-col gap-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <FaUserTie className="text-blue-950 text-2xl" />
        <h2 className="text-xl font-bold text-blue-950">Cuenta de Administrador</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-2">
          <label className="font-bold text-xs text-slate-700 uppercase" htmlFor="nombreAdmin">Nombre</label>
          <input type="text" id="nombreAdmin" name="nombreAdmin" value={formData.nombreAdmin} onChange={handleChange} required className="bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
        </div>
        <div className="flex flex-col gap-y-2">
          <label className="font-bold text-xs text-slate-700 uppercase" htmlFor="apellidosAdmin">Apellidos</label>
          <input type="text" id="apellidosAdmin" name="apellidosAdmin" value={formData.apellidosAdmin} onChange={handleChange} required className="bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
        </div>
        <div className="flex flex-col gap-y-2">
          <label className="font-bold text-xs text-slate-700 uppercase" htmlFor="emailAdmin">Email de Usuario</label>
          <input type="email" id="emailAdmin" name="emailAdmin" value={formData.emailAdmin} onChange={handleChange} required className="bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
        </div>
        <div className="flex flex-col gap-y-2">
          <label className="font-bold text-xs text-slate-700 uppercase" htmlFor="passwordAdmin">Contraseña</label>
          <input type="password" id="passwordAdmin" name="passwordAdmin" value={formData.passwordAdmin} onChange={handleChange} required className="bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600" />
        </div>
      </div>

      <button 
        type="button" 
        onClick={nextStep} 
        disabled={!formData.nombreAdmin || !formData.apellidosAdmin || !formData.emailAdmin || !formData.passwordAdmin} 
        className="bg-blue-950 text-white font-bold py-4 rounded-full w-full mt-4 hover:bg-blue-900 transition-colors disabled:bg-slate-400"
      >
        Siguiente: Confirmación
      </button>
    </div>
  );

  // --- PASO 3: CONFIRMACIÓN ---
  const renderPaso3 = () => (
    <div className="flex flex-col gap-y-6 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <FaClipboardList className="text-blue-950 text-2xl" />
        <h2 className="text-xl font-bold text-blue-950">Resumen de la Solicitud</h2>
      </div>

      <div className="bg-white p-6 rounded-2xl flex flex-col gap-4 text-sm text-slate-900">
        <div>
          <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">Empresa</h3>
          <p><span className="font-semibold mr-1">Nombre:</span> {formData.nombreEmpresa}</p>
          <p><span className="font-semibold mr-1">CIF:</span> {formData.cif}</p>
          <p><span className="font-semibold mr-1">Email:</span> {formData.emailEmpresa}</p>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 border-b border-slate-300 pb-1 mb-2">Administrador</h3>
          <p><span className="font-semibold mr-1">Nombre:</span> {formData.nombreAdmin} {formData.apellidosAdmin}</p>
          <p><span className="font-semibold mr-1">Email:</span> {formData.emailAdmin}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <input type="checkbox" id="terminosAceptados" name="terminosAceptados" checked={formData.terminosAceptados} onChange={handleChange} className="w-5 h-5 accent-blue-600" />
        <label htmlFor="terminosAceptados" className="text-sm text-slate-700 cursor-pointer">
          Acepto los términos y condiciones y la política de privacidad.
        </label>
      </div>

      <button 
        type="submit" 
        disabled={!formData.terminosAceptados || isLoading} 
        className="bg-blue-950 text-white font-bold py-4 rounded-full w-full mt-4 hover:bg-blue-900 transition-colors disabled:bg-slate-400 shadow-lg"
      >
        {isLoading ? "Enviando..." : "Registrar Empresa y Administrador"}
      </button>
    </div>
  );

  // --- PANTALLA DE ÉXITO ---
  const renderExito = () => (
    <div className="flex flex-col items-center justify-center gap-y-6 text-center animate-fadeIn py-8">
      <FaCheckCircle className="text-green-500 text-7xl mb-2" />
      <h2 className="text-3xl font-bold text-blue-950">¡Solicitud enviada!</h2>
      <p className="text-slate-600 max-w-sm">
        Hemos recibido tus datos correctamente. Nuestro equipo validará la información y te contactaremos por email en breve con los pasos a seguir.
      </p>
      <button onClick={() => router.push("/")} className="bg-blue-950 text-white font-bold py-3 px-8 rounded-full mt-6 hover:bg-blue-900 transition-colors">
        Volver al inicio
      </button>
    </div>
  );

  return (
    <div className="bg-blue-950 min-h-screen flex items-center justify-center p-4 py-12">
      <div className="bg-slate-200 rounded-[2.5rem] p-8 md:p-12 w-full max-w-2xl flex flex-col shadow-2xl relative min-h-125">
        
        {paso < 4 && (
          <>
            <button onClick={prevStep} className="absolute top-8 left-8 flex items-center gap-2 text-slate-700 font-semibold text-sm hover:text-blue-900 group transition z-10">
              <FiArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              {paso === 1 ? "Volver" : "Atrás"}
            </button>

            <div className="absolute top-8 right-8 text-sm font-bold text-slate-500 bg-slate-300 px-3 py-1 rounded-full">
              Paso {paso} de 3
            </div>
            
            <div className="mt-12 mb-8 flex flex-col items-center gap-2">
              <h1 className="text-3xl font-bold text-blue-950 text-center">Alta de Empresa</h1>
              <p className="text-slate-600 text-sm text-center">Registra tu organización y tu cuenta de administrador</p>
            </div>
          </>
        )}

        {errorMensaje && paso < 4 && (
          <div className="bg-red-100 text-red-600 p-3 rounded-xl border border-red-200 text-sm font-semibold text-center mb-6">
            {errorMensaje}
          </div>
        )}

        <form onSubmit={paso === 3 ? handleSubmit : (e) => e.preventDefault()} className="flex-1 flex flex-col justify-center">
          {paso === 1 && renderPaso1()}
          {paso === 2 && renderPaso2()}
          {paso === 3 && renderPaso3()}
          {paso === 4 && renderExito()}
        </form>

      </div>
    </div>
  );
};

export default RegisterEmpresa;