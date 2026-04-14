"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import UserMenu from "@/components/ui/UserMenu";
import NotifMenu from "@/components/ui/NotifMenu";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noLeidas, setNoLeidas]     = useState(0);

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
      className="w-full sticky top-0 z-[100]"
      style={{
        background:   "var(--azul-egm)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-stretch h-20">

        {/* Logo */}
        <div className="flex items-center pr-6 shrink-0">
          <Image
            src={logo}
            alt="Atalayas EGM"
            width={180}
            height={50}
            priority
            style={{ height: "52px", width: "auto" }}
            className="brightness-0 invert"
          />
        </div>

        {/* Divisor vertical */}
        <div
          className="hidden sm:block w-px my-4 mr-8 shrink-0"
          style={{ background: "rgba(255,255,255,0.25)" }}
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
          <NotifMenu
            noLeidas={noLeidas}
            onVerTodas={() => router.push("/dashboard/comunicacion")}
            onMarcarLeidas={marcarTodasLeidas}
          />

          {/* Divisor */}
          <div className="hidden sm:block w-px h-6"
            style={{ background: "rgba(255,255,255,0.2)" }} />

          {/* Avatar + menú — solo desktop */}
          <UserMenu
            nombreMostrado={nombreMostrado}
            empresaNombre={usuario?.nombreEmpresa}
            initials={initials}
            logoEmpresa={logoEmpresa}
            onPerfil={() => router.push("/dashboard/perfil")}
            onCerrarSesion={handleLogout}
          />

          {/* Hamburguesa — solo móvil */}
          <button
            className="sm:hidden flex flex-col justify-center items-center rounded-lg transition-colors gap-1.5"
            style={{ width: "40px", height: "40px" }}
            onClick={() => setMobileOpen((prev) => !prev)}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            aria-label="Menú"
          >
            <span className="block h-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.8)", width: "18px" }} />
            <span className="block h-0.5 rounded-full transition-all"
              style={{ background: "rgba(255,255,255,0.8)", width: mobileOpen ? "12px" : "18px" }} />
            <span className="block h-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.8)", width: "18px" }} />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileOpen && (
        <div
          className="sm:hidden flex flex-col"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "var(--azul-egm)" }}
        >
          <div className="px-4 py-3 flex flex-col gap-1"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className="text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color:      pathname === NAV_ROUTES[item] ? "var(--blanco)" : "rgba(255,255,255,0.65)",
                  background: pathname === NAV_ROUTES[item] ? "rgba(255,255,255,0.1)" : "transparent",
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
                style={{
                  width:      "32px",
                  height:     "32px",
                  background: "rgba(255,255,255,0.15)",
                  color:      "var(--blanco)",
                  border:     "2px solid rgba(255,255,255,0.3)",
                }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {nombreMostrado}
                </p>
                {usuario?.nombreEmpresa && (
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {usuario.nombreEmpresa}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => { setMobileOpen(false); router.push("/dashboard/perfil"); }}
              className="text-left px-3 py-2.5 text-sm rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.75)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Mi perfil
            </button>
            <button
              onClick={handleLogout}
              className="text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
              style={{ color: "#f87171" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.1)")}
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
        fontSize:   "18px",
        fontWeight: isActive ? 700 : 600,
        color:      isActive
          ? "var(--verde-oliva-hover)"
          : hovered
          ? "rgba(255,255,255,0.95)"
          : "rgba(255,255,255,0.6)",
        background: "transparent",
        transition: "color 0.15s ease",
      }}
    >
      {label}
      {/* Línea verde oliva en hover — no en activo */}
      {!isActive && (
        <span
          style={{
            position:        "absolute",
            bottom:          "18px",
            left:            "12px",
            right:           "12px",
            height:          "2px",
            background:      "var(--verde-oliva-hover)",
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