// src/lib/api/estadisticas.ts
import { API_URL, apiFetch } from "../api";

// ─── Tipos para admin empresa ─────────────────────────────────────────────────

export interface EstadisticasEmpresaResponse {
  /** KPIs resumen */
  kpis: {
    totalEmpleados: number;
    altasEsteMes: number;
    bajasEsteMes: number;
    tasaRotacion: number;          // % anualizado
    modulosConProgreso: number;    // módulos con al menos 1 empleado con progreso
    pctCompletitudGlobal: number;  // % medio de completitud de formación
  };
  /** Altas y bajas por mes — últimos 6 meses */
  movimientoMensual: { mes: string; altas: number; bajas: number }[];
  /** % de completitud por módulo (todos los empleados) */
  progresoModulos: { nombre: string; porcentaje: number }[];
  /** Empleados sin iniciar ningún módulo */
  empleadosSinFormacion: number;
  /** Empleados con formación incompleta (> 0 % y < 100 %) */
  empleadosEnProgreso: number;
  /** Empleados con toda la formación completada */
  empleadosCompletados: number;
}

export interface EstadisticasResponse {
  crecimiento: { mes: string; empleados: number; empresas: number }[];
  sectores:    { nombre: string; valor: number; color: string }[];
  usuarios:    { rol: string; cantidad: number; color: string }[];
}

const COLORES_SECTORES = [
  "#3B82F6", "#10B981", "#F59E0B", "#F43F5E",
  "#8B5CF6", "#06B6D4", "#84CC16", "#EC4899",
  "#14B8A6", "#F97316",
];

const COLORES_ROLES: Record<string, string> = {
  ROLE_ADMIN:         "#F59E0B",
  ROLE_ADMIN_EMPRESA: "#3B82F6",
  ROLE_EMPLEADO:      "#10B981",
};

const ETIQUETA_ROL: Record<string, string> = {
  ROLE_ADMIN:         "SuperAdmins",
  ROLE_ADMIN_EMPRESA: "Admins Empresa",
  ROLE_EMPLEADO:      "Empleados",
};

export async function getEstadisticasSuperadmin(): Promise<EstadisticasResponse> {
  const resEmpresas = await apiFetch(`${API_URL}/empresas`);
  if (!resEmpresas.ok) throw new Error("Error al obtener empresas");
  const empresas: any[] = await resEmpresas.json();

  let usuarios: any[] = [];
  try {
    const resUsuarios = await apiFetch(`${API_URL}/users`);
    if (resUsuarios.ok) {
      usuarios = await resUsuarios.json();
      console.log("[DEBUG usuarios]", usuarios.slice(0, 3));
    }
  } catch {
    console.warn("[Estadísticas] No se pudo cargar /users, continuando sin ellos.");
  }

  // ── SECTORES ─────────────────────────────────────────────────────────────────
  const conteoSectores: Record<string, number> = {};
  for (const emp of empresas) {
    if (emp.estadoSolicitud !== "APROBADA") continue;
    const sector: string = emp.sector || emp.sectorEmpresa || emp.industria || "Otros";
    conteoSectores[sector] = (conteoSectores[sector] ?? 0) + 1;
  }

  const sectores = Object.entries(conteoSectores).map(([nombre, valor], i) => ({
    nombre,
    valor,
    color: COLORES_SECTORES[i % COLORES_SECTORES.length],
  }));

  // ── USUARIOS POR ROL ─────────────────────────────────────────────────────────
  const conteoRoles: Record<string, number> = {};
  for (const user of usuarios) {
    const rol: string =
      user.codigoRol ?? user.rol ?? user.role ?? user.nombreRol ?? "DESCONOCIDO";
    conteoRoles[rol] = (conteoRoles[rol] ?? 0) + 1;
  }

  console.log("[DEBUG conteoRoles]", conteoRoles);

  const usuariosPorRol = Object.entries(conteoRoles).map(([rol, cantidad]) => ({
    rol:      ETIQUETA_ROL[rol]   ?? rol,
    cantidad,
    color:    COLORES_ROLES[rol]  ?? "#94A3B8",
  }));

  // ── CRECIMIENTO ──────────────────────────────────────────────────────────────
  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const hoy = new Date();

  const ventana: { anio: number; mes: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    ventana.push({ anio: d.getFullYear(), mes: d.getMonth(), label: MESES[d.getMonth()] });
  }

  const conteoCrecimiento = ventana.map(({ anio, mes, label }) => {
    const empresasHasta = empresas.filter((emp) => {
      const fecha = new Date(emp.creadoEn ?? emp.fechaCreacion ?? emp.createdAt ?? 0);
      return fecha.getFullYear() < anio || (fecha.getFullYear() === anio && fecha.getMonth() <= mes);
    }).length;

    const empleadosHasta = usuarios.filter((u) => {
      const rol = u.codigoRol ?? u.rol ?? u.role ?? "";
      if (rol !== "ROLE_EMPLEADO") return false;
      const fecha = new Date(u.creadoEn ?? u.fechaCreacion ?? u.createdAt ?? 0);
      return fecha.getFullYear() < anio || (fecha.getFullYear() === anio && fecha.getMonth() <= mes);
    }).length;

    return { mes: label, empleados: empleadosHasta, empresas: empresasHasta };
  });

  return {
    crecimiento: conteoCrecimiento,
    sectores: sectores.length ? sectores : [{ nombre: "Sin datos", valor: 1, color: "#CBD5E1" }],
    usuarios: usuariosPorRol.length ? usuariosPorRol : [{ rol: "Sin datos", cantidad: 0, color: "#CBD5E1" }],
  };
}

// ─── Estadísticas para Admin Empresa ─────────────────────────────────────────
// Enfocadas en: incorporaciones/salidas/rotación + progreso de formación

export interface FiltrosEstadisticas {
  /** Nº de meses a mostrar en gráficos de evolución (3, 6, 12) */
  rangoMeses?: 3 | 6 | 12;
  /** Filtrar empleados por departamento. null = todos */
  departamento?: string | null;
  /** Filtrar empleados por estado. "todos" por defecto */
  estado?: "activos" | "inactivos" | "todos";
  /** Filtrar módulos por tipo (ej: "ONBOARDING"). null = todos */
  tipoModulo?: string | null;
}

export function getEstadisticasAdminEmpresa(
  empleados: any[],
  modulos: any[],
  progresoEmpresa: import("../types/progreso").ProgresoEmpleado[],
  filtros: FiltrosEstadisticas = {},
): EstadisticasEmpresaResponse {
  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const hoy   = new Date();
  const rangoMeses = filtros.rangoMeses ?? 6;

  // Aplicar filtro de estado
  if (filtros.estado === "activos") {
    empleados = empleados.filter((e) => e.activo !== false);
  } else if (filtros.estado === "inactivos") {
    empleados = empleados.filter((e) => e.activo === false);
  }
  // (si es "todos" o undefined, no se filtra)

  // Aplicar filtro de departamento
  if (filtros.departamento) {
    empleados = empleados.filter((e) => e.departamento === filtros.departamento);
  }

  // Sincronizar progresoEmpresa con los empleados filtrados
  if (filtros.estado || filtros.departamento) {
    const ids = new Set(empleados.map((e) => e.usuarioId));
    progresoEmpresa = progresoEmpresa.filter((p) => ids.has(p.usuarioId));
  }

  // Aplicar filtro de tipo de módulo
  if (filtros.tipoModulo) {
    modulos = modulos.filter((m) => m.tipoModulo === filtros.tipoModulo);
    // Filtrar el progreso de cada empleado para que solo cuente módulos del tipo
    const idsModulos = new Set(modulos.map((m: any) => m.moduloId ?? m.id));
    progresoEmpresa = progresoEmpresa.map((p) => ({
      ...p,
      modulos: (p.modulos ?? []).filter((m) => idsModulos.has(m.moduloId)),
    }));
  }

  // ── Ventana temporal ────────────────────────────────────────────────────────
  const ventana: { anio: number; mes: number; label: string }[] = [];
  for (let i = rangoMeses - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    ventana.push({ anio: d.getFullYear(), mes: d.getMonth(), label: MESES[d.getMonth()] });
  }

  // ── Altas y bajas por mes ────────────────────────────────────────────────────
  // Altas: fechaRegistro del empleado.
  // Bajas: campo fechaBaja del backend (se setea al desactivar al usuario).
  const activos = empleados.filter((e) => e.activo !== false);

  const movimientoMensual = ventana.map(({ anio, mes, label }) => {
    const altas = empleados.filter((e) => {
      const f = new Date(e.fechaRegistro ?? e.creadoEn ?? e.createdAt ?? 0);
      return f.getFullYear() === anio && f.getMonth() === mes;
    }).length;
    const bajas = empleados.filter((e) => {
      if (!e.fechaBaja) return false;
      const f = new Date(e.fechaBaja);
      return f.getFullYear() === anio && f.getMonth() === mes;
    }).length;
    return { mes: label, altas, bajas };
  });

  // ── KPIs de rotación ────────────────────────────────────────────────────────
  const mesActual  = hoy.getMonth();
  const anioActual = hoy.getFullYear();
  const altasEsteMes = empleados.filter((e) => {
    const f = new Date(e.fechaRegistro ?? e.creadoEn ?? e.createdAt ?? 0);
    return f.getFullYear() === anioActual && f.getMonth() === mesActual;
  }).length;
  const bajasEsteMes = empleados.filter((e) => {
    if (!e.fechaBaja) return false;
    const f = new Date(e.fechaBaja);
    return f.getFullYear() === anioActual && f.getMonth() === mesActual;
  }).length;
  const totalBase  = activos.length || 1;
  // Tasa de rotación anualizada en función del rango elegido
  const bajasTotal   = movimientoMensual.reduce((s, m) => s + m.bajas, 0);
  const factorAnual  = 12 / rangoMeses;
  const tasaRotacion = Math.round((bajasTotal / totalBase) * factorAnual * 100 * 10) / 10;

  // ── Progreso de formación por módulo ────────────────────────────────────────
  const totalEmpleados = activos.length || 1;

  const progresoModulos = modulos.slice(0, 8).map((m) => {
    const mid = m.moduloId ?? m.id ?? "";
    // Buscamos en progresoEmpresa cuántos tienen ese módulo con porcentaje 100
    let completados = 0;
    let sumPct      = 0;
    let conDatos    = 0;
    for (const pe of progresoEmpresa) {
      const pm = pe.modulos.find((x) => x.moduloId === mid);
      if (pm) {
        conDatos++;
        sumPct += pm.porcentaje ?? 0;
        if ((pm.porcentaje ?? 0) >= 100) completados++;
      }
    }
    const porcentaje = conDatos > 0
      ? Math.round(sumPct / totalEmpleados)
      : 0;
    return { nombre: m.titulo ?? m.nombre ?? "Módulo", porcentaje };
  });

  // ── Estado de formación de empleados ────────────────────────────────────────
  let sinFormacion   = 0;
  let enProgreso     = 0;
  let completados100 = 0;

  for (const pe of progresoEmpresa) {
    if (!pe.modulos || pe.modulos.length === 0) { sinFormacion++; continue; }
    const pctMedio = pe.modulos.reduce((s, m) => s + (m.porcentaje ?? 0), 0) / pe.modulos.length;
    if (pctMedio === 0)        sinFormacion++;
    else if (pctMedio >= 100)  completados100++;
    else                       enProgreso++;
  }
  // Empleados sin ningún registro de progreso también cuentan como sin formación
  const conRegistro = progresoEmpresa.length;
  sinFormacion += Math.max(0, activos.length - conRegistro);

  // ── KPI de completitud global ────────────────────────────────────────────────
  const pctCompletitudGlobal = progresoModulos.length
    ? Math.round(progresoModulos.reduce((s, m) => s + m.porcentaje, 0) / progresoModulos.length)
    : 0;

  return {
    kpis: {
      totalEmpleados:       empleados.length,
      altasEsteMes,
      bajasEsteMes,
      tasaRotacion,
      modulosConProgreso:   progresoModulos.filter((m) => m.porcentaje > 0).length,
      pctCompletitudGlobal,
    },
    movimientoMensual,
    progresoModulos,
    empleadosSinFormacion:  sinFormacion,
    empleadosEnProgreso:    enProgreso,
    empleadosCompletados:   completados100,
  };
}