"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import logo from "@/public/logo.webp";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, API_URL } from "@/lib/api";
import { NAV_ROUTES, NAV_ITEMS_BY_ROLE } from "@/lib/routes";

interface HeaderProps {
  logoEmpresa?: string;
}

const POLLING_INTERVAL = 30_000;

function getInitials(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

export default function Header({ logoEmpresa }: HeaderProps) {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [noLeidas, setNoLeidas]         = useState(0);

  const menuRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const router   = useRouter();
  const pathname = usePathname();
  const { usuario, logout } = useAuth();

  const navItems = NAV_ITEMS_BY_ROLE[usuario?.codigoRol ?? ""] ?? [];

  // ── CONTADOR NOTIFICACIONES ───────────────────────────────────────────────
  const fetchContador = useCallback(async () => {
    if (!usuario) return;
    try {
      const res = await apiFetch(`${API_URL}/notificaciones/me/contador`);
      if (!res.ok) return;
      const data = await res.json();
      setNoLeidas(data.noLeidas ?? 0);
    } catch {}
  }, [usuario]);

  useEffect(() => {
    fetchContador();
    const interval = setInterval(fetchContador, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchContador]);

  // ── CERRAR DROPDOWNS AL CLICAR FUERA ─────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const marcarTodasLeidas = async () => {
    try {
      await apiFetch(`${API_URL}/notificaciones/me/leer-todas`, { method: "PATCH" });
      setNoLeidas(0);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleNavClick = (item: string) => {
    router.push(NAV_ROUTES[item]);
    setMobileOpen(false);
  };

  const initials       = usuario?.nombre ? getInitials(usuario.nombre) : "?";
  const nombreMostrado = usuario?.nombre ?? "Usuario";

  const rolMostrado: Record<string, string> = {
    ROLE_ADMIN:         "Administrador general",
    ROLE_ADMIN_EMPRESA: "Admin empresa",
    ROLE_EMPLEADO:      "Empleado",
  };

  return (
    <header
      className="w-full sticky top-0 z-50"
      style={{ background: "var(--blanco)", borderBottom: "1px solid var(--gris-borde)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center">

        {/* Logo */}
        <div className="flex items-center h-full pr-4 sm:pr-7 sm:mr-6 shrink-0">
          <Image src={logo} alt="Atalayas EGM" className="h-20 sm:h-24 w-auto" />
        </div>

        {/* Navegación desktop */}
        <nav className="hidden sm:flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <NavButton
              key={item}
              label={item}
              isActive={pathname === NAV_ROUTES[item]}
              onClick={() => handleNavClick(item)}
            />
          ))}
        </nav>

        {/* Lado derecho */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">

          {/* Campana notificaciones */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen((prev) => !prev);
                if (!notifOpen && noLeidas > 0) marcarTodasLeidas();
              }}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--texto-secundario)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              aria-label="Notificaciones"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {noLeidas > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
                  style={{ background: "var(--error)" }}
                >
                  {noLeidas > 99 ? "99+" : noLeidas}
                </span>
              )}
            </button>

            {/* Dropdown notificaciones */}
            {notifOpen && (
              <div
                className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl shadow-lg z-50 overflow-hidden"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
              >
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--gris-superficie)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--texto-primario)" }}>Notificaciones</p>
                  <button
                    onClick={() => { setNotifOpen(false); router.push("/dashboard/noticias"); }}
                    className="text-[11px] font-medium hover:underline"
                    style={{ color: "var(--azul-egm)" }}
                  >
                    Ver todas →
                  </button>
                </div>
                <div className="py-3 px-4 text-center">
                  {noLeidas === 0 ? (
                    <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
                      Todo al día — sin notificaciones nuevas
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--texto-secundario)" }}>
                      Tienes{" "}
                      <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>{noLeidas}</span>
                      {" "}notificación{noLeidas !== 1 ? "es" : ""} sin leer
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Separador — solo desktop */}
          <div className="hidden sm:block w-px h-5" style={{ background: "var(--gris-borde)" }} />

          {/* Avatar + menú usuario — solo desktop */}
          <div className="hidden sm:block relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold select-none overflow-hidden"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "1px solid var(--gris-borde)" }}
              >
                {logoEmpresa ? (
                  <Image src={logoEmpresa} alt="Logo empresa" width={32} height={32} className="object-cover" />
                ) : initials}
              </div>
              <span className="text-sm font-semibold max-w-[120px] truncate" style={{ color: "var(--texto-primario)" }}>
                {nombreMostrado}
              </span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                style={{ color: "var(--texto-muted)" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl shadow-md py-1 z-50"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
              >
                <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--gris-superficie)" }}>
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--texto-primario)" }}>{nombreMostrado}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--texto-muted)" }}>
                    {rolMostrado[usuario?.codigoRol ?? ""] ?? usuario?.codigoRol}
                  </p>
                  {usuario?.nombreEmpresa && (
                    <p className="text-[11px] truncate" style={{ color: "var(--texto-muted)" }}>{usuario.nombreEmpresa}</p>
                  )}
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setMenuOpen(false); router.push("/dashboard/perfil"); }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{ color: "var(--texto-secundario)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Mi perfil
                  </button>
                </div>
                <div className="py-1" style={{ borderTop: "1px solid var(--gris-superficie)" }}>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm font-medium transition-colors"
                    style={{ color: "var(--error)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--error-light)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hamburguesa — solo móvil */}
          <button
            className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 rounded-lg"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menú"
          >
            <span
              className="block w-5 h-0.5 rounded-full transition-all"
              style={{ background: "var(--texto-secundario)" }}
            />
            <span
              className="block w-5 h-0.5 rounded-full transition-all"
              style={{ background: "var(--texto-secundario)" }}
            />
            <span
              className="block w-5 h-0.5 rounded-full transition-all"
              style={{ background: "var(--texto-secundario)" }}
            />
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {mobileOpen && (
        <div
          className="sm:hidden px-4 pb-4 flex flex-col"
          style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--blanco)" }}
        >
          {/* Links de navegación */}
          <div className="flex flex-col py-2" style={{ borderBottom: "1px solid var(--gris-superficie)" }}>
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className="text-left px-2 py-3 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color:      pathname === NAV_ROUTES[item] ? "var(--azul-egm)" : "var(--texto-secundario)",
                  background: pathname === NAV_ROUTES[item] ? "var(--azul-egm-light)" : "transparent",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Info usuario + acciones */}
          <div className="pt-3 flex flex-col gap-1">
            <div className="flex items-center gap-3 px-2 py-2 mb-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>{nombreMostrado}</p>
                <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
                  {rolMostrado[usuario?.codigoRol ?? ""] ?? usuario?.codigoRol}
                </p>
              </div>
            </div>
            <button
              onClick={() => { setMobileOpen(false); router.push("/dashboard/perfil"); }}
              className="text-left px-2 py-2.5 text-sm rounded-lg transition-colors"
              style={{ color: "var(--texto-secundario)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Mi perfil
            </button>
            <button
              onClick={handleLogout}
              className="text-left px-2 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{ color: "var(--error)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--error-light)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

// ── NAVBUTTON ─────────────────────────────────────────────────────────────────
interface NavButtonProps {
  label:    string;
  isActive: boolean;
  onClick:  () => void;
}

function NavButton({ label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className="relative px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 whitespace-nowrap border-none cursor-pointer"
      style={{
        color:      isActive ? "var(--azul-egm)"       : "var(--texto-secundario)",
        background: isActive ? "var(--azul-egm-light)" : "transparent",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--gris-superficie)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {label}
      {isActive && (
        <span
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
          style={{ width: "calc(100% - 24px)", background: "var(--azul-egm)" }}
        />
      )}
    </button>
  );
}