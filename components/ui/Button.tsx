import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?:    "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant  = "primary",
  size     = "md",
  className = "",
  style,
  ...props
}) => {
  // Tamaños
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-sm",
  };

  // Estilos base
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  // Estilos por variante usando variables CSS
  const variantStyles: Record<string, React.CSSProperties> = {
    primary:   { background: "var(--azul-egm)",      color: "var(--blanco)" },
    secondary: { background: "var(--gris-superficie)", color: "var(--texto-primario)", border: "1px solid var(--gris-borde)" },
    danger:    { background: "var(--error)",           color: "var(--blanco)" },
    ghost:     { background: "transparent",            color: "var(--azul-egm)",        border: "1px solid var(--gris-borde)" },
  };

  // Hover por variante, usando data attribute para no necesitar estado
  const hoverClass: Record<string, string> = {
    primary:   "hover:opacity-90",
    secondary: "hover:bg-gray-100",
    danger:    "hover:opacity-90",
    ghost:     "hover:bg-[var(--azul-egm-light)]",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${hoverClass[variant]} ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
};