// Rutas del dashboard, empleado y admin empresa
export const NAV_ROUTES: Record<string, string> = {
  "Inicio":         "/dashboard",
  "Formación":      "/dashboard/formacion",
  "Comunicación":   "/dashboard/comunicacion",
  "Comunidad":      "/dashboard/comunidad",
  "Colaboradores":  "/dashboard/colaboradores",
  "Administración": "/dashboard/admin",
};

// Items visibles según rol
export const NAV_ITEMS_BY_ROLE: Record<string, string[]> = {
  ROLE_EMPLEADO:      ["Inicio", "Formación", "Comunicación", "Comunidad", "Colaboradores"],
  ROLE_ADMIN_EMPRESA: ["Inicio", "Formación", "Comunicación", "Comunidad", "Colaboradores", "Administración"],
};
