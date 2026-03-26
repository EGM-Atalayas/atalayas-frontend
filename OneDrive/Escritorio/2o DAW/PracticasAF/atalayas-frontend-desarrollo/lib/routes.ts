// lib/routes.ts
export const NAV_ROUTES: Record<string, string> = {
  "Inicio":         "/dashboard",
  "Onboarding":     "/dashboard/onboarding",
  "Formación":      "/dashboard/formacion",
  "Comunicación":   "/dashboard/noticias",
  "Administración": "/dashboard/admin",
};

export const SUPERADMIN_ROUTES: Record<string, string> = {
  "Inicio":        "/superadmin",
  "Empresas":      "/superadmin/empresas",
  "Solicitudes":   "/superadmin/solicitudes",
  "Estadísticas":  "/superadmin/estadisticas",
  "Configuración": "/superadmin/configuracion",
};