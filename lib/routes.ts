// ── Rutas del dashboard por label ────────────────────────────────────────────
export const NAV_ROUTES: Record<string, string> = {
  "Inicio":         "/dashboard",
  "Formación":      "/dashboard/formacion",
  "Comunicación":   "/dashboard/comunicacion",
  "Comunidad":      "/dashboard/comunidad",
  "Colaboradores":  "/dashboard/colaboradores",
  "Administración": "/dashboard/admin",
};

// ── Items visibles por rol ────────────────────────────────────────────────────
export const NAV_ITEMS_BY_ROLE: Record<string, string[]> = {
  ROLE_EMPLEADO:      ["Inicio", "Formación", "Comunicación", "Comunidad", "Colaboradores"],
  ROLE_ADMIN_EMPRESA: ["Inicio", "Administración", "Formación", "Comunicación", "Comunidad", "Colaboradores"],
  INVITADO:           ["Comunidad"],
};

// ── Links del SuperAdmin ──────────────────────────────────────────────────────
export const SUPERADMIN_LINKS: { label: string; path: string }[] = [
  { label: "Inicio",         path: "/superadmin" },
  { label: "Administración", path: "/superadmin/administracion" },
  { label: "Comunicados",    path: "/superadmin/comunicados" },
  { label: "Comunidad",      path: "/dashboard/comunidad" },
];

// ── Páginas con fondo claro (el header se muestra sólido desde el inicio) ─────
// Añade aquí cualquier ruta nueva que tenga fondo blanco/claro
export const PAGINAS_FONDO_CLARO: string[] = [
  "/dashboard/admin/modulos/crear",
  "/dashboard/eventos/",     // página de detalle de evento (no la lista)
];
