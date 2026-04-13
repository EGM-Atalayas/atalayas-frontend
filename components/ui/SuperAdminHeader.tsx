"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaBell, FaChevronDown, FaSignOutAlt, FaCog, FaBars, FaTimes } from "react-icons/fa";

const SuperAdminHeader = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Simulación de usuario
  const usuario = { nombre: "Admin Atalayas", email: "admin@atalayas.com", iniciales: "AA" };

  // Enlaces de navegación (Lo que antes estaba en el Sidebar)
  const navLinks = [
    { name: "Inicio", path: "/superadmin" },
    { name: "Empresas", path: "/superadmin/empresas" },
    { name: "Solicitudes", path: "/superadmin/solicitudes" },
    { name: "Estadísticas", path: "/superadmin/estadisticas" },
  ];

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Si al final usáis cookies, el backend matará la sesión, 
    // pero borramos esto por si acaso usabais localStorage al final.
    localStorage.removeItem("accessToken"); 
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* IZQUIERDA: Logo y Navegación Desktop */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Atalayas <span className="text-blue-600">EGM</span>
              </h2>
            </div>
            
            {/* Navegación Desktop (Oculta en móvil) */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.path || (pathname.startsWith(link.path) && link.path !== "/superadmin");
                return (
                  <Link 
                    key={link.path} 
                    href={link.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* DERECHA: Herramientas y Perfil */}
          <div className="flex items-center gap-3">
            
            {/* Campana */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors hidden sm:block">
              <FaBell size={18} />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </button>

            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>

            {/* Menú de Usuario */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {usuario.iniciales}
                </div>
                <FaChevronDown className={`hidden sm:block text-slate-400 text-[10px] mr-1 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Usuario */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 py-2 animate-fadeIn origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-50 mb-2">
                    <p className="text-sm font-bold text-slate-800">{usuario.nombre}</p>
                    <p className="text-xs text-slate-500 truncate">{usuario.email}</p>
                  </div>
                  <button onClick={() => { setIsUserMenuOpen(false); router.push("/superadmin/configuracion"); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 flex items-center gap-3">
                    <FaCog className="text-slate-400 text-base" /> Configuración
                  </button>
                  <div className="h-px bg-slate-50 my-1"></div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                    <FaSignOutAlt className="text-base" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            {/* Botón de Menú Móvil (Hamburguesa) */}
            <button 
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg ml-2 transition-colors focus:outline-none"
            >
              {isMobileNavOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* NAVEGACIÓN MÓVIL (Desplegable) */}
      {isMobileNavOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-fadeIn">
          <nav className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path || (pathname.startsWith(link.path) && link.path !== "/superadmin");
              return (
                <Link 
                  key={link.path} 
                  href={link.path}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default SuperAdminHeader;