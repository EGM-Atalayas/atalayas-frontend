// Rutas del dashboard para empleado y admin empresa
export const NAV_ROUTES: Record<string, string> = {
  "Inicio":          "/dashboard",
  "Mi formación":    "/dashboard/formacion",
  "Comunicación":    "/dashboard/noticias",
  "Administración":  "/dashboard/admin",
};

// Rutas del superadmin
export const SUPERADMIN_ROUTES: Record<string, string> = {
  "Inicio":          "/superadmin",
  "Empresas":        "/superadmin/empresas",
  "Solicitudes":     "/superadmin/solicitudes",
  "Estadísticas":    "/superadmin/estadisticas",
  "Configuración":   "/superadmin/configuracion",
};

// Items visibles según rol
export const NAV_ITEMS_BY_ROLE: Record<string, string[]> = {
  ROLE_EMPLEADO:       ["Inicio", "Mi formación", "Comunicación"],
  ROLE_ADMIN_EMPRESA:  ["Inicio", "Mi formación", "Comunicación", "Administración"],
};