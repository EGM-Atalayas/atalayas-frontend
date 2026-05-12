"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import UserMenu from "@/components/ui/UserMenu";
import NotifMenu from "@/components/ui/NotifMenu";
import logo from "@/public/logo.webp";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, API_URL } from "@/lib/api";
import { NAV_ROUTES, NAV_ITEMS_BY_ROLE, SUPERADMIN_LINKS, PAGINAS_FONDO_CLARO } from "@/lib/routes";

const POLLING_INTERVAL = 30_000;

function getInitials(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

export default function Header() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const mobileOpenRef  = useRef(false);          // ref espejo para closures estables
  const menuPanelRef   = useRef<HTMLDivElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const menuItemsRef   = useRef<HTMLDivElement>(null);
  const [noLeidas, setNoLeidas]       = useState(0);
  const [scrolled, setScrolled]       = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { usuario, logout } = useAuth();

  // DETECTAMOS SI ES SUPERADMIN
  const isSuperAdmin = usuario?.codigoRol === "ROLE_ADMIN" || pathname.startsWith("/superadmin");

  // HEADER SÓLIDO EN PÁGINAS CON FONDO CLARO — configurable en lib/routes.ts
  const forceSolid = PAGINAS_FONDO_CLARO.some((p) => pathname.startsWith(p));

  // LÓGICA DE RUTAS DINÁMICAS
  let linksToRender: { label: string; path: string }[] = [];
  if (isSuperAdmin) {
    linksToRender = SUPERADMIN_LINKS;
  } else {
    const rawItems = NAV_ITEMS_BY_ROLE[usuario?.codigoRol ?? ""] ?? [];
    linksToRender = rawItems.map((item) => ({
      label: item,
      path: NAV_ROUTES[item] || "/",
    }));
  }

  useLayoutEffect(() => {
    if (menuPanelRef.current)   gsap.set(menuPanelRef.current,   { xPercent: 100 });
    if (menuOverlayRef.current) gsap.set(menuOverlayRef.current, { opacity: 0, pointerEvents: "none" });
  }, []);

  const abrirMenu = () => {
    setMobileOpen(true);
    mobileOpenRef.current = true;
    const panel   = menuPanelRef.current;
    const overlay = menuOverlayRef.current;
    const items   = menuItemsRef.current ? Array.from(menuItemsRef.current.children) as HTMLElement[] : [];
    if (!panel || !overlay) return;
    gsap.set(items,   { xPercent: 40, opacity: 0 });
    gsap.set(overlay, { pointerEvents: "auto" });
    const tl = gsap.timeline();
    tl.to(overlay, { opacity: 1, duration: 0.3,  ease: "power2.out" });
    tl.to(panel,   { xPercent: 0, duration: 0.45, ease: "power4.out" }, 0);
    tl.to(items,   { xPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.07 }, 0.2);
  };

  const cerrarMenu = () => {
    const panel   = menuPanelRef.current;
    const overlay = menuOverlayRef.current;
    if (!panel || !overlay) return;
    // Desactivar pointerEvents INMEDIATAMENTE para no bloquear clics durante la animación
    gsap.set(overlay, { pointerEvents: "none" });
    mobileOpenRef.current = false;
    const tl = gsap.timeline({ onComplete: () => setMobileOpen(false) });
    tl.to(panel,   { xPercent: 100, duration: 0.35, ease: "power3.in" });
    tl.to(overlay, { opacity: 0, duration: 0.25, ease: "power2.in" }, 0);
  };

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
      setScrolled(y > 50);
      if (y > 20 && mobileOpenRef.current) cerrarMenu();
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
        background:         forceSolid || scrolled ? "rgba(22,50,105,0.97)" : "transparent",
        borderBottom:       forceSolid || scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
        backdropFilter:     forceSolid || scrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: forceSolid || scrolled ? "blur(14px)" : "none",
        boxShadow:          forceSolid || scrolled ? "0 4px 28px rgba(0,0,0,0.30)" : "none",
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

        {/* Lado derecho */}
        <div className="ml-auto flex items-center h-full gap-1 z-10">

          {/* Campana — visible en todos los tamaños */}
          <div className="flex items-center h-full">
            <NotifMenu
              noLeidas={noLeidas}
              onMarcarLeidas={marcarTodasLeidas}
            />
          </div>

          {/* Avatar + menú desktop — solo lg+ */}
          <div className="hidden lg:flex items-center h-full">
            <UserMenu
              nombreMostrado={nombreMostrado}
              email={usuario?.email}
              initials={initials}
              avatarUrl={usuario?.avatarUrl}
              onPerfil={() => router.push(linkPerfil)}
              onConfiguracion={() => router.push(linkConfiguracion)}
              onCerrarSesion={handleLogout}
            />
          </div>

          {/* Hamburguesa — solo hasta lg */}
          <button
            className="lg:hidden flex flex-col justify-center items-center gap-[5px] ml-1"
            style={{
              width: "42px", height: "42px",
              borderRadius: "11px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              transition: "background 0.15s ease",
              flexShrink: 0,
            }}
            onClick={abrirMenu}
            aria-label="Abrir menú"
          >
            <span style={{ display: "block", height: "2px", borderRadius: "2px", background: "rgba(255,255,255,0.85)", width: "20px" }} />
            <span style={{ display: "block", height: "2px", borderRadius: "2px", background: "rgba(255,255,255,0.85)", width: "20px" }} />
            <span style={{ display: "block", height: "2px", borderRadius: "2px", background: "rgba(255,255,255,0.85)", width: "20px" }} />
          </button>
        </div>
      </div>

      {/* ── Menú móvil — panel lateral GSAP ─────────────────────────────────── */}
      <div className="lg:hidden" style={{ overflow: "hidden" }}>
        {/* Overlay oscuro con blur */}
        <div
          ref={menuOverlayRef}
          onClick={cerrarMenu}
          className="fixed inset-0 z-[57]"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
        />

        {/* Panel */}
        <div
          ref={menuPanelRef}
          className="fixed top-0 right-0 h-full z-[58] flex flex-col"
          style={{ width: "100%", background: "rgba(14,34,82,1)" }}
        >
          {/* ── Barra superior del panel: logo + notif + X ── */}
          <div
            className="flex items-center px-5 shrink-0 gap-2"
            style={{ height: "80px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Logo — izquierda */}
            <Link href={linkLogo} onClick={cerrarMenu} className="flex items-center flex-1">
              <Image
                src={logo} alt="Atalayas EGM" width={160} height={44}
                style={{ height: "40px", width: "auto" }}
                className="brightness-0 invert"
              />
            </Link>

            {/* Campana con dropdown completo (NotifMenu) */}
            <NotifMenu noLeidas={noLeidas} onMarcarLeidas={marcarTodasLeidas} />

            {/* Botón X — mismo estilo que la hamburguesa */}
            <button
              onClick={cerrarMenu}
              aria-label="Cerrar menú"
              className="flex items-center justify-center shrink-0"
              style={{
                width: "42px", height: "42px", borderRadius: "11px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Contenido con scroll ── */}
          <div className="flex-1 overflow-y-auto flex flex-col">

            {/* Nav links con stagger GSAP */}
            <div ref={menuItemsRef} className="flex flex-col px-6 pt-5 pb-3">
              {linksToRender.map((link) => {
                const isActive = pathname === link.path || (pathname.startsWith(link.path) && link.path !== linkLogo);
                return (
                  <button
                    key={link.path}
                    onClick={() => { cerrarMenu(); handleNavClick(link.path); }}
                    className="text-left py-4 text-xl font-bold uppercase tracking-wider"
                    style={{
                      color:        isActive ? "var(--lima)" : "rgba(255,255,255,0.85)",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background:   "transparent",
                    }}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>

            {/* Spacer para empujar sección usuario abajo */}
            <div className="flex-1" />

            {/* ── Sección usuario ── */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "0 20px" }} />
            <div className="px-5 pb-10 flex flex-col gap-2">

              {/* Tarjeta usuario */}
              <button
                onClick={() => { cerrarMenu(); router.push(linkPerfil); }}
                className="w-full flex items-center gap-3.5 px-4 py-4 mt-4 rounded-2xl text-left active:scale-[0.98]"
                style={{
                  background:   "rgba(255,255,255,0.08)",
                  border:       "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  transition:   "background 0.15s ease",
                }}
              >
                <div className="shrink-0">
                  {usuario?.avatarUrl ? (
                    <img
                      src={usuario.avatarUrl} alt={nombreMostrado}
                      style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.30)" }}
                    />
                  ) : (
                    <div className="rounded-full flex items-center justify-center font-bold"
                      style={{ width: "48px", height: "48px", fontSize: "17px", background: "var(--azul-egm)", color: "#fff", border: "2px solid rgba(255,255,255,0.25)" }}>
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold truncate" style={{ color: "#fff" }}>{nombreMostrado}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {isSuperAdmin ? "Administración EGM" : usuario?.nombreEmpresa}
                  </p>
                </div>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.35)" strokeWidth={2.5} style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Configuración */}
              <button
                onClick={() => { cerrarMenu(); router.push(linkConfiguracion); }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-white/10"
                style={{ transition: "background 0.15s ease" }}
              >
                <div className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.60)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <span className="text-sm font-bold uppercase" style={{ color: "rgba(255,255,255,0.60)", letterSpacing: "0.07em" }}>Configuración</span>
              </button>

              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-red-500/10"
                style={{ transition: "background 0.15s ease" }}
              >
                <div className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: "36px", height: "36px", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <span className="text-sm font-bold uppercase" style={{ color: "#f87171", letterSpacing: "0.07em" }}>Cerrar sesión</span>
              </button>
            </div>
          </div>
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
          background: "var(--lima)",
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