"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "@/public/logo.webp";
import { useAuth } from "@/context/AuthContext";
import { API_URL, apiFetch } from "@/lib/api";


// ── TYPES ─────────────────────────────────────────────────────────────────────
type NavItem = "Inicio" | "Onboarding" | "Formación" | "Comunicación" | "Administración";

interface HeaderProps {
  defaultActive?: NavItem;
  onNavChange?: (item: NavItem) => void;
  logoEmpresa?: string;
}


// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  "Inicio",
  "Onboarding",
  "Formación",
  "Comunicación",
  "Administración",
];

const POLLING_INTERVAL = 30_000; // 30 segundos


// ── HELPERS ───────────────────────────────────────────────────────────────────
function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}


// ── MAIN HEADER ───────────────────────────────────────────────────────────────
export default function Header({ defaultActive = "Inicio", onNavChange, logoEmpresa }: HeaderProps) {
  const [active, setActive] = useState<NavItem>(defaultActive);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { usuario, logout } = useAuth();

  
  // ── CONTADOR DE NOTIFICACIONES NO LEÍDAS ──────────────────────────────────
  const fetchContador = useCallback(async () => {

    // Solo para usuarios autenticados — invitados no tienen notificaciones
    if (!usuario || usuario.codigoRol === "INVITADO") return;
    try {
      const res = await apiFetch(`${API_URL}/notificaciones/me/contador`);
      if (!res.ok) return;
      const data = await res.json();
      setNoLeidas(data.noLeidas ?? 0);
    } catch {
      // Silencioso — la campana no es crítica
    }
  }, [usuario]);

  // Carga inicial + polling cada 30s
  useEffect(() => {
    fetchContador();
    const interval = setInterval(fetchContador, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchContador]);

  // ── CERRAR DROPDOWNS AL CLICAR FUERA ─────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // ── MARCAR TODAS COMO LEÍDAS ──────────────────────────────────────────────
  const marcarTodasLeidas = async () => {
    try {
      await apiFetch(`${API_URL}/notificaciones/me/leer-todas`, { method: "PATCH" });
      setNoLeidas(0);
    } catch {
      // Silencioso
    }
  };

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

        {/* Logo EGM */}
        <div className="flex items-center h-full pr-7 mr-9">
          <Image src={logo} alt="Logo" className="h-24 w-auto" />
        </div>

        {/* Navegación */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.filter((item) => {
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

        {/* Lado derecho */}
        <div className="shrink-0 ml-8 flex items-center gap-3">

          {/* ── Campana de notificaciones ── */}
          {usuario && usuario.codigoRol !== "INVITADO" && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  if (!notifOpen && noLeidas > 0) marcarTodasLeidas();
                }}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors"
                aria-label="Notificaciones"
              >
                {/* Icono campana */}
                <svg
                  className="w-5 h-5 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

                {/* Badge contador */}
                {noLeidas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {noLeidas > 99 ? "99+" : noLeidas}
                  </span>
                )}
              </button>

              {/* Dropdown notificaciones */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">Notificaciones</p>
                    <button
                      onClick={() => router.push("/dashboard/noticias")}
                      className="text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      Ver todas →
                    </button>
                  </div>
                  <div className="py-3 px-4 text-center">
                    {noLeidas === 0 ? (
                      <p className="text-xs text-slate-400">Todo al día — sin notificaciones nuevas</p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Tienes <span className="font-semibold text-slate-800">{noLeidas}</span> notificación{noLeidas !== 1 ? "es" : ""} sin leer
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Separador */}
          <div className="w-px h-5 bg-slate-200" />

          {/* Avatar + menú */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-semibold select-none">
                {logoEmpresa ? (
                  <Image src={logoEmpresa} alt="Logo empresa" className="w-full h-full object-cover rounded-full" width={32} height={32} />
                ) : (
                  initials
                )}
              </div>
              <span className="text-sm font-semibold text-slate-700 max-w-30 truncate">
                {nombreMostrado}
              </span>
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

            {/* Dropdown usuario */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-md py-1 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800 truncate">{nombreMostrado}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {rolMostrado[usuario?.codigoRol ?? ""] ?? usuario?.codigoRol}
                  </p>
                  {usuario?.nombreEmpresa && (
                    <p className="text-[11px] text-slate-400 truncate">{usuario.nombreEmpresa}</p>
                  )}
                </div>

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


// ── NAVBUTTON ─────────────────────────────────────────────────────────────────
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