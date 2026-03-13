import { useState } from "react";

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

// ─── Main Header ──────────────────────────────────────────────────────────────

export default function Header({ defaultActive = "Inicio", onNavChange, logoEmpresa }: HeaderProps) {
  const [active, setActive] = useState<NavItem>(defaultActive);

  const handleNavClick = (item: NavItem) => {
    setActive(item);
    onNavChange?.(item);
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center gap-0">

        {/* ── Logo block ── */}
        <div className="flex items-center h-full pr-7 mr-9 gap-0">
          {/* Logo image */}
          <img src="../src/assets/logo.webp" alt="" className="w-60 h-60 object-contain" />
        </div>

        {/* ── Navigation ── */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item}
              label={item}
              isActive={active === item}
              onClick={() => handleNavClick(item)}
            />
          ))}
        </nav>

        {/* ── Right badge ── */}
        <div className="shrink-0 ml-8">
          {logoEmpresa ? (
            <img src={logoEmpresa} alt="Logo Empresa" className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200">
            </div>
          )}
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
      {/* Active underline */}
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