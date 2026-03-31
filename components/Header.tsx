"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "@/public/logo.webp";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = "Inicio" | "Onboarding" | "Formación" | "Comunicación" | "Administración";

interface HeaderProps {
  defaultActive?: NavItem;
  onNavChange?: (item: NavItem) => void;
  logoEmpresa?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  "Inicio",
  "Onboarding",
  "Formación",
  "Comunicación",
  "Administración",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Genera las iniciales a partir del nombre completo */
function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Main Header ──────────────────────────────────────────────────────────────

export default function Header({ defaultActive = "Inicio", onNavChange, logoEmpresa }: HeaderProps) {
  const [active, setActive] = useState<NavItem>(defaultActive);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { usuario, logout } = useAuth();

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (item: NavItem) => {
    setActive(item);
    onNavChange?.(item);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const initials = usuario?.nombre ? getInitials(usuario.nombre) : "?";
  const nombreMostrado = usuario?.nombre ?? "Usuario";
  const rolMostrado: Record<string, string> = {
    ROLE_ADMIN: "Administrador general",
    ROLE_ADMIN_EMPRESA: "Admin empresa",
    ROLE_EMPLEADO: "Empleado",
    INVITADO: "Invitado",
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center gap-0">

        {/* ── Logo EGM ── */}
        <div className="flex items-center h-full pr-7 mr-9">
          <Image src={logo} alt="Logo" className="h-24 w-auto" />
        </div>

        {/* ── Navigation ── */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.filter(item => {
            if (item === "Administración") {
              return usuario?.codigoRol !== "ROLE_EMPLEADO" && usuario?.codigoRol !== "INVITADO";
            }
            return true;
          }).map((item) => (
            <NavButton
              key={item}
              label={item}
              isActive={active === item}
              onClick={() => handleNavClick(item)}
            />
          ))}
        </nav>

        {/* ── Right side ── */}
        <div className="shrink-0 ml-8 flex items-center gap-4">
          {/* Logo empresa */}


          {/* Separador */}
          <div className="w-px h-5 bg-slate-200" />

          {/* Avatar + menú */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {/* Avatar con iniciales */}
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-semibold select-none">
                {logoEmpresa ? (
                  <Image src={logoEmpresa} alt="Logo empresa" className="w-full h-full object-cover rounded-full" />
                ) : (
                  initials
                )}
              </div>
              {/* Nombre */}
              <span className="text-sm font-semibold text-slate-700 max-w-30 truncate">
                {nombreMostrado}
              </span>
              {/* Chevron */}
              <svg
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-md py-1 z-50">
                {/* Info usuario */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800 truncate">{nombreMostrado}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {rolMostrado[usuario?.codigoRol ?? ""] ?? usuario?.codigoRol}
                  </p>
                  {usuario?.nombreEmpresa && (
                    <p className="text-[11px] text-slate-400 truncate">{usuario.nombreEmpresa}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="py-1">
                  <button
                    onClick={() => { setMenuOpen(false); router.push("/dashboard"); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Mi perfil
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); router.push("/dashboard"); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Configuración
                  </button>
                </div>

                {/* Cerrar sesión */}
                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

// ─── NavButton ────────────────────────────────────────────────────────────────

interface NavButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-1.5 text-sm font-semibold rounded-md
        transition-colors duration-150 whitespace-nowrap border-none cursor-pointer
        ${isActive
          ? "text-blue-700"
          : "text-slate-500 hover:text-blue-700 hover:bg-blue-50"
        }
      `}
    >
      {label}
      <span
        className={`
          absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-blue-700
          transition-all duration-200
          ${isActive ? "w-[calc(100%-24px)]" : "w-0"}
        `}
      />
    </button>
  );
}