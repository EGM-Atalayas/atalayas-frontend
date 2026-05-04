"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
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

// Enlaces exclusivos para el SuperAdmin
const SUPERADMIN_LINKS = [
  { label: "Inicio",         path: "/superadmin" },
  { label: "Administración", path: "/superadmin/administracion" },
  { label: "Comunicados",    path: "/superadmin/comunicados" },
];

export default function Header({ logoEmpresa }: HeaderProps) {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [noLeidas, setNoLeidas]       = useState(0);
  const [scrolled, setScrolled]       = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { usuario, logout } = useAuth();

  // DETECTAMOS SI ES SUPERADMIN 
  const isSuperAdmin = usuario?.codigoRol === "ROLE_ADMIN" || pathname.startsWith("/superadmin");

  // LÓGICA DE RUTAS DINÁMICAS
  let linksToRender = [];
  if (isSuperAdmin) {
    linksToRender = SUPERADMIN_LINKS;
  } else {
    const rawItems = NAV_ITEMS_BY_ROLE[usuario?.codigoRol ?? ""] ?? [];
    linksToRender = rawItems.map((item) => ({
      label: item,
      path: NAV_ROUTES[item] || "/",
    }));
  }

  const fetchContador = useCallback(async () => {
    if (!usuario) return;
    try {
      const res = await apiFetch(`${API_URL}/notificaciones/me/contador`);
      if (!res.ok) return;
      const data = await res.json();
      setNoLeidas(data.noLeidas ?? 0);
    } catch { }
  }, [usuario]);

  useEffect(() => {
    fetchContador();
    const interval = setInterval(fetchContador, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchContador]);

  // Scroll: transparente en top, sólido+compacto al bajar
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      if (y > 10) setMobileOpen(false);
    };
    // Evaluar estado inicial (por si la página carga ya scrolleada)
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);



  const marcarTodasLeidas = async () => {
    try {
      await apiFetch(`${API_URL}/notificaciones/me/leer-todas`, { method: "PATCH" });
      setNoLeidas(0);
    } catch { }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleNavClick = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const initials = usuario?.nombre ? getInitials(usuario.nombre) : "U";
  const nombreMostrado = usuario?.nombre ?? "Usuario";

  const linkLogo           = isSuperAdmin ? "/superadmin" : "/dashboard";
  const linkPerfil         = "/dashboard/perfil";
  const linkConfiguracion  = "/dashboard/configuracion";

  return (
    <header
      className="w-full fixed top-0 left-0 right-0 z-50"
      style={{
        background:         scrolled ? "rgba(22,50,105,0.97)" : "transparent",
        borderBottom:       scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
        backdropFilter:     scrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
        boxShadow:          scrolled ? "0 4px 28px rgba(0,0,0,0.30)" : "none",
        transition:         "background 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease",
      }}
    >
      <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-14 flex items-stretch h-20 relative">

        {/* Logo — izquierda, z-10 para no quedar bajo el nav centrado */}
        <div className="flex items-center pr-4 sm:pr-6 lg:pr-10 shrink-0 z-10">
          <Link href={linkLogo}>
            <Image
              src={logo}
              alt="Atalayas EGM"
              width={180}
              height={50}
              priority
              style={{
                height:     "clamp(40px, 6vw, 50px)",
                width:      "auto",
                transition: "opacity 0.15s ease",
              }}
              className="brightness-0 invert cursor-pointer hover:opacity-75"
            />
          </Link>
        </div>

        {/* Navegación desktop — centrada en el header */}
        <nav className="hidden lg:flex items-stretch absolute left-1/2 -translate-x-1/2 h-full">
          {linksToRender.map((link) => {
            const isActive = pathname === link.path || (pathname.startsWith(link.path) && link.path !== linkLogo);
            return (
              <NavButton
                key={link.path}
                label={link.label}
                isActive={isActive}
                scrolled={scrolled}
                onClick={() => handleNavClick(link.path)}
              />
            );
          })}
        </nav>

        {/* Lado derecho — campana pegada al avatar */}
        <div className="ml-auto flex items-center h-full gap-2 lg:gap-1 z-10">

          {/* Campana — px reducido para quedar cerca del avatar */}
          <div className="flex items-center h-full">
            <NotifMenu
              noLeidas={noLeidas}
              onMarcarLeidas={marcarTodasLeidas}
            />
          </div>

          {/* Avatar + menú — sin separador, el gap del nav los aleja naturalmente */}
          <UserMenu
            nombreMostrado={nombreMostrado}
            email={usuario?.email}
            initials={initials}
            avatarUrl={usuario?.avatarUrl}
            onPerfil={() => router.push(linkPerfil)}
            onConfiguracion={() => router.push(linkConfiguracion)}
            onCerrarSesion={handleLogout}
          />

          {/* Hamburguesa → X — solo hasta lg */}
          <button
            className="lg:hidden flex flex-col justify-center items-center gap-[5px]"
            style={{
              width: "42px", height: "42px",
              borderRadius: "11px",
              background: mobileOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              transition: "background 0.15s ease",
            }}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <span style={{
              display: "block", height: "2px", borderRadius: "2px",
              background: "rgba(255,255,255,0.85)", width: "20px",
              transform: mobileOpen ? "translateY(7px) rotate(45deg)" : "none",
              transition: "transform 0.25s ease",
            }} />
            <span style={{
              display: "block", height: "2px", borderRadius: "2px",
              background: "rgba(255,255,255,0.85)", width: "20px",
              opacity: mobileOpen ? 0 : 1,
              transition: "opacity 0.15s ease",
            }} />
            <span style={{
              display: "block", height: "2px", borderRadius: "2px",
              background: "rgba(255,255,255,0.85)", width: "20px",
              transform: mobileOpen ? "translateY(-7px) rotate(-45deg)" : "none",
              transition: "transform 0.25s ease",
            }} />
          </button>
        </div>
      </div>

      {/* Menú móvil — con animación suave de entrada */}
      <div
        className="lg:hidden flex flex-col overflow-hidden"
        style={{
          maxHeight: mobileOpen ? "100dvh" : "0px",
          opacity:   mobileOpen ? 1 : 0,
          transition: "max-height 0.3s ease, opacity 0.2s ease",
          borderTop: mobileOpen ? "1px solid rgba(255,255,255,0.07)" : "none",
          background: "rgba(22,50,105,0.98)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          overflowY: "auto",
        }}
      >
        {/* ── Sección nav ── */}
        <div className="px-3 pt-3 pb-2 flex flex-col gap-0.5">
          {linksToRender.map((link) => {
            const isActive = pathname === link.path || (pathname.startsWith(link.path) && link.path !== linkLogo);
            return (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className="relative text-left px-4 py-3 text-sm rounded-xl"
                style={{
                  color:      isActive ? "#fff" : "rgba(255,255,255,0.65)",
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                {/* Barra verde izquierda en activo */}
                {isActive && (
                  <span style={{
                    position: "absolute", left: "6px", top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px", height: "18px",
                    background: "var(--verde-oliva-hover)",
                    borderRadius: "2px",
                  }} />
                )}
                {link.label}
              </button>
            );
          })}
        </div>

        {/* ── Separador ── */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0 16px" }} />

        {/* ── Sección usuario ── */}
        <div className="px-3 pt-2 pb-3 flex flex-col gap-0.5">

          {/* Tarjeta usuario — clickable, va a perfil */}
          <button
            onClick={() => { setMobileOpen(false); router.push(linkPerfil); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left"
            style={{
              background: "rgba(255,255,255,0.05)",
              transition: "background 0.15s ease",
            }}
          >
            {/* Avatar */}
            <div className="shrink-0">
              {usuario?.avatarUrl ? (
                <img
                  src={usuario.avatarUrl}
                  alt={nombreMostrado}
                  style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)",
                  }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    width: "40px", height: "40px",
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    border: "2px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Nombre + empresa */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.92)" }}>
                {nombreMostrado}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>
                {isSuperAdmin ? "Administración EGM" : usuario?.nombreEmpresa}
              </p>
            </div>

            {/* Chevron → indica que es tappable */}
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Configuración */}
          <button
            onClick={() => { setMobileOpen(false); router.push(linkConfiguracion); }}
            className="flex items-center px-4 py-3 text-sm rounded-xl active:bg-white/10"
            style={{ color: "rgba(255,255,255,0.7)", transition: "background 0.15s ease" }}
          >
            Configuración
          </button>

          {/* Separador antes de acción destructiva */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "4px 8px" }} />

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-sm font-medium rounded-xl active:bg-red-500/10"
            style={{ color: "#f87171", transition: "background 0.15s ease" }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}

// ── NAVBUTTON INTACTO ─────────────────────────────────────────────────────────
interface NavButtonProps {
  label: string;
  isActive: boolean;
  scrolled: boolean;
  onClick: () => void;
}

function NavButton({ label, isActive, scrolled, onClick }: NavButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [origin, setOrigin] = useState<"left" | "right">("left");
  const buttonRef = useRef<HTMLButtonElement>(null);

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
      className="relative flex items-center px-3 md:px-4 whitespace-nowrap border-none cursor-pointer h-full"
      style={{
        fontSize: "15px",
        fontWeight: isActive ? 600 : 500,
        color: isActive || hovered
          ? "#ffffff"
          : (scrolled ? "rgba(255,255,255,0.58)" : "rgba(255,255,255,0.82)"),
        transition: "color 0.3s ease",
        background: "transparent",
      }}
    >
      {label}
      {/* Underline: fijo y visible cuando activo, animado desde el ratón en hover */}
      <span
        style={{
          position: "absolute",
          bottom: "18px",
          left: "10px",
          right: "10px",
          height: "2px",
          background: "var(--verde-oliva-hover)",
          borderRadius: "2px",
          display: "block",
          transform: isActive || hovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: isActive ? "center" : origin,
          transition: isActive ? "none" : "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </button>
  );
}