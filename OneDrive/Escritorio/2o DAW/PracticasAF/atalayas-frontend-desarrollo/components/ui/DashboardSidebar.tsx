"use client";
import { useRef, useEffect, useState, JSX } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import logo from "@/public/logo.webp";
import { useAuth } from "@/context/AuthContext";
import { NAV_ROUTES } from "@/lib/routes";

const ICONS: Record<string, JSX.Element> = {
  "Inicio": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  "Onboarding": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  "Formación": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  "Comunicación": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  "Administración": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function getInitials(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("");
}

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { usuario, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const initials = usuario?.nombre ? getInitials(usuario.nombre) : "?";

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-[#0F172A] flex flex-col border-r border-slate-700/50">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <Image src={logo} alt="Logo" className="h-16 w-auto" />
        {usuario?.nombreEmpresa && (
          <span className="mt-3 inline-block text-[10px] font-semibold tracking-widest text-slate-400 uppercase truncate w-full">
            {usuario.nombreEmpresa}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {Object.entries(NAV_ROUTES).map(([label, href]) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left cursor-pointer
                ${isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/60"
                }`}
            >
              {ICONS[label]}
              {label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-700/50" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/60 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-slate-200 truncate">{usuario?.nombre}</p>
            <p className="text-[10px] text-slate-500 truncate">{usuario?.codigoRol}</p>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute bottom-20 left-3 w-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
