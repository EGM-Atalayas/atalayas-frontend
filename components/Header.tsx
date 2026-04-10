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
  const [menuOpen, setMenuOpen]     = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noLeidas, setNoLeidas]     = useState(0);

  const menuRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const router   = useRouter();
  const pathname = usePathname();
  const { usuario, logout } = useAuth();

  const navItems = NAV_ITEMS_BY_ROLE[usuario?.codigoRol ?? ""] ?? [];

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

  return (
    <header
      className="w-full sticky top-0 z-50"
      style={{
        background:   "var(--blanco)",
        borderBottom: "1px solid var(--gris-borde)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-stretch h-16">

        {/* Logo — dimensiones explícitas para que Next.js lo respete */}
        <div className="flex items-center pr-6 shrink-0">
          <Image
            src={logo}
            alt="Atalayas EGM"
            width={180}
            height={50}
            priority
            className="object-contain"
            style={{ height: "46px", width: "auto", maxWidth: "180px" }}
            
          />
        </div>

        {/* Divisor vertical logo / nav */}
        <div
          className="hidden sm:block w-px my-3 mr-6 shrink-0"
          style={{ background: "var(--gris-borde)" }}
        />

        {/* Navegación desktop */}
        <nav className="hidden sm:flex items-stretch flex-1">
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
        <div className="ml-auto flex items-center gap-2">

          {/* Campana */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen((prev) => !prev);
                if (!notifOpen && noLeidas > 0) marcarTodasLeidas();
              }}
              className="relative flex items-center justify-center rounded-lg transition-colors"
              style={{ width: "40px", height: "40px", color: "var(--texto-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              aria-label="Notificaciones"
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {noLeidas > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 min-w-[16px] h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
                  style={{ background: "var(--error)" }}
                >
                  {noLeidas > 99 ? "99+" : noLeidas}
                </span>
              )}
            </button>

            {/* Dropdown notificaciones */}
            {notifOpen && (
              <div
                className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg z-50 overflow-hidden"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--gris-superficie)" }}
                >
                  <p className="text-xs font-semibold" style={{ color: "var(--texto-primario)" }}>
                    Notificaciones
                  </p>
                  <button
                    onClick={() => { setNotifOpen(false); router.push("/dashboard/comunicacion"); }}
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
                      <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>
                        {noLeidas}
                      </span>{" "}
                      notificación{noLeidas !== 1 ? "es" : ""} sin leer
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="hidden sm:block w-px h-5" style={{ background: "var(--gris-borde)" }} />

          {/* Avatar + menú — solo desktop */}
          <div className="hidden sm:block relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div
                className="rounded-full flex items-center justify-center font-bold select-none shrink-0 text-sm"
                style={{
                  width:      "34px",
                  height:     "34px",
                  background: "var(--azul-egm)",
                  color:      "var(--blanco)",
                }}
              >
                {logoEmpresa ? (
                  <Image src={logoEmpresa} alt="Logo empresa" width={34} height={34} className="object-cover rounded-full" />
                ) : initials}
              </div>
              <span
                className="text-sm font-semibold max-w-[110px] truncate"
                style={{ color: "var(--texto-primario)" }}
              >
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

            {/* Dropdown usuario */}
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl shadow-md py-1 z-50"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
              >
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ borderBottom: "1px solid var(--gris-superficie)" }}
                >
                  <div
                    className="rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ width: "32px", height: "32px", background: "var(--azul-egm)", color: "var(--blanco)" }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
                      {nombreMostrado}
                    </p>
                    {usuario?.nombreEmpresa && (
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--texto-muted)" }}>
                        {usuario.nombreEmpresa}
                      </p>
                    )}
                  </div>
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
            className="sm:hidden flex flex-col justify-center items-center rounded-lg transition-colors gap-1.5"
            style={{ width: "40px", height: "40px" }}
            onClick={() => setMobileOpen((prev) => !prev)}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Menú"
          >
            <span className="block h-0.5 rounded-full" style={{ background: "var(--texto-secundario)", width: "18px" }} />
            <span className="block h-0.5 rounded-full transition-all" style={{ background: "var(--texto-secundario)", width: mobileOpen ? "12px" : "18px" }} />
            <span className="block h-0.5 rounded-full" style={{ background: "var(--texto-secundario)", width: "18px" }} />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileOpen && (
        <div
          className="sm:hidden flex flex-col"
          style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--blanco)" }}
        >
          <div
            className="px-4 py-3 flex flex-col gap-1"
            style={{ borderBottom: "1px solid var(--gris-superficie)" }}
          >
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className="text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color:      pathname === NAV_ROUTES[item] ? "var(--azul-egm)" : "var(--texto-secundario)",
                  background: pathname === NAV_ROUTES[item] ? "var(--azul-egm-light)" : "transparent",
                  fontWeight: pathname === NAV_ROUTES[item] ? 600 : 400,
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div
                className="rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ width: "32px", height: "32px", background: "var(--azul-egm)", color: "var(--blanco)" }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
                  {nombreMostrado}
                </p>
                {usuario?.nombreEmpresa && (
                  <p className="text-xs truncate" style={{ color: "var(--texto-muted)" }}>
                    {usuario.nombreEmpresa}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => { setMobileOpen(false); router.push("/dashboard/perfil"); }}
              className="text-left px-3 py-2.5 text-sm rounded-lg transition-colors"
              style={{ color: "var(--texto-secundario)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Mi perfil
            </button>
            <button
              onClick={handleLogout}
              className="text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
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

// ── NAVBUTTON — Opción A ──────────────────────────────────────────────────────
interface NavButtonProps {
  label:    string;
  isActive: boolean;
  onClick:  () => void;
}

function NavButton({ label, isActive, onClick }: NavButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [origin, setOrigin]   = useState<"left" | "right">("left");
  const buttonRef             = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setOrigin(e.clientX - rect.left < rect.width / 2 ? "left" : "right");
    }
    setHovered(true);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setOrigin(e.clientX - rect.left < rect.width / 2 ? "left" : "right");
    }
    setHovered(false);
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center px-5 whitespace-nowrap border-none cursor-pointer h-full"
      style={{
        fontSize:   "15px",
        fontWeight: isActive ? 700 : 400,
        letterSpacing: isActive ? "-0.01em" : "0",
        color: isActive
          ? "var(--marino)"
          : hovered
          ? "var(--texto-primario)"
          : "var(--texto-secundario)",
        background: "transparent",
        transition: "color 0.15s ease",
      }}
    >
      {label}

      {/* Línea solo en hover — no en activo (Opción A) */}
      {!isActive && (
        <span
          style={{
            position:        "absolute",
            bottom:          "10px",
            left:            "12px",
            right:           "12px",
            height:          "2px",
            background:      "var(--azul-egm)",
            borderRadius:    "2px",
            display:         "block",
            transform:       hovered ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: origin,
            transition:      "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      )}
    </button>
  );
}