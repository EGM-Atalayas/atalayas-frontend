// Rutas del dashboard, empleado y admin empresa
export const NAV_ROUTES: Record<string, string> = {
  "Inicio":           "/dashboard",
  "Formación":        "/dashboard/formacion",
  "Comunicación":     "/dashboard/comunicacion",
  "Administración":   "/dashboard/admin",
};

// Rutas del superadmin
export const SUPERADMIN_ROUTES: Record<string, string> = {
  "Inicio":           "/superadmin",
  "Empresas":         "/superadmin/empresas",
  "Solicitudes":      "/superadmin/solicitudes",
  "Estadísticas":     "/superadmin/estadisticas",
  "Configuración":    "/superadmin/configuracion",
};

// Items visibles según rol
export const NAV_ITEMS_BY_ROLE: Record<string, string[]> = {
  // El empleado ve Formación y Comunicación — sin Administración
  ROLE_EMPLEADO:      ["Inicio", "Formación", "Comunicación"],
  // El admin ve todo, Formación incluye gestión de módulos
  ROLE_ADMIN_EMPRESA: ["Inicio", "Formación", "Comunicación", "Administración"],
};