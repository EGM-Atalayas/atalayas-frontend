export const QK = {
  empleados:          (empresaId?: string | null) => ["empleados", empresaId] as const,
  noticias:           (empresaId?: string | null) => ["noticias",  empresaId] as const,
  modulos:            (empresaId?: string | null) => ["modulos",   empresaId] as const,
  documentos:         (empresaId?: string | null) => ["documentos", empresaId] as const,
  progresoEmpresa:    (empresaId?: string | null) => ["progreso",  "empresa", empresaId] as const,
  dashboardSuperadmin: ()                          => ["dashboard", "superadmin"]          as const,
  empresas:           ()                           => ["empresas"]                         as const,
  estadisticasSuperadmin: ()                       => ["estadisticas", "superadmin"]       as const,
};

