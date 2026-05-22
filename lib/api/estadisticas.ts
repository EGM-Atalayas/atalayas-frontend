// src/lib/api/estadisticas.ts
import { API_URL, apiFetch } from "../api";
import type { ProgresoEmpleado } from "@/lib/types/progreso";

// ─── Tipos para admin empresa ─────────────────────────────────────────────────

export interface EstadisticasEmpresaResponse {
  /** KPIs resumen */
  kpis: {
    totalEmpleados: number;
    altasEsteMes: number;
    bajasEsteMes: number;
    altasPeriodo: number;          // total altas en el rango seleccionado
    bajasPeriodo: number;          // total bajas en el rango seleccionado
    tasaRotacion: number;          // % anualizado
    modulosConProgreso: number;    // módulos con al menos 1 empleado con progreso
    pctCompletitudGlobal: number;  // % medio de completitud de formación
  };
  /** Altas y bajas por mes — últimos 6 meses */
  movimientoMensual: { mes: string; altas: number; bajas: number }[];
  /** % de completitud por módulo (todos los empleados) */
  progresoModulos: { nombre: string; porcentaje: number }[];
  /** Desglose detallado por módulo: completados / en progreso / pendientes */
  detalleModulos: { moduloId: string; nombre: string; completados: number; enProgreso: number; pendientes: number; total: number }[];
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
    }
  } catch {
    // Continuar sin usuarios si no se pueden cargar
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

  const primerMes = ventana[0];

  const empresasAntes = empresas.filter((emp) => {
    if (emp.estadoSolicitud !== "APROBADA") return false;
    const fechaStr = emp.fechaResolucion ?? emp.actualizadoEn ?? emp.fechaRegistro ?? emp.creadoEn ?? emp.fechaCreacion ?? emp.createdAt ?? emp.created_at;
    if (!fechaStr) return false;
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return false;
    return fecha.getFullYear() < primerMes.anio || (fecha.getFullYear() === primerMes.anio && fecha.getMonth() < primerMes.mes);
  }).length;

  const empleadosAntes = usuarios.filter((u) => {
    const fechaStr = u.fechaRegistro ?? u.creadoEn ?? u.fechaCreacion ?? u.createdAt ?? u.created_at;
    if (!fechaStr) return false;
    const rol = u.codigoRol ?? u.rol ?? u.role ?? "";
    if (rol !== "ROLE_EMPLEADO") return false;
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return false;
    return fecha.getFullYear() < primerMes.anio || (fecha.getFullYear() === primerMes.anio && fecha.getMonth() < primerMes.mes);
  }).length;

  const conteoCrecimientoMensual = ventana.map(({ anio, mes, label }) => {
    const empresasNuevas = empresas.filter((emp) => {
      if (emp.estadoSolicitud !== "APROBADA") return false;
      // Para empresas, usar fechaResolucion (cuando se aprobó)
      const fechaStr = emp.fechaResolucion ?? emp.actualizadoEn ?? emp.fechaRegistro ?? emp.creadoEn ?? emp.fechaCreacion ?? emp.createdAt ?? emp.created_at;
      if (!fechaStr) return false;
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        return false;
      }
      return fecha.getFullYear() === anio && fecha.getMonth() === mes;
    }).length;

    const empleadosNuevos = usuarios.filter((u) => {
      const fechaStr = u.fechaRegistro ?? u.creadoEn ?? u.fechaCreacion ?? u.createdAt ?? u.created_at;
      if (!fechaStr) return false;
      const rol = u.codigoRol ?? u.rol ?? u.role ?? "";
      if (rol !== "ROLE_EMPLEADO") return false;
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) return false;
      const match = fecha.getFullYear() === anio && fecha.getMonth() === mes;
      return match;
    }).length;

    return { mes: label, empleados: empleadosNuevos, empresas: empresasNuevas };
  });

  let acumuladoEmpresas = empresasAntes;
  let acumuladoEmpleados = empleadosAntes;
  const conteoCrecimiento = conteoCrecimientoMensual.map((item) => {
    acumuladoEmpresas += item.empresas;
    acumuladoEmpleados += item.empleados;
    return {
      mes: item.mes,
      empresas: acumuladoEmpresas,
      empleados: acumuladoEmpleados,
    };
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
  /** Nº de meses a mostrar en gráficos de evolución (3, 6, 12, 24) */
  rangoMeses?: 1 | 3 | 6 | 12 | 24;
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

  // Guardar lista completa antes de aplicar filtros (para altas/bajas reales de la empresa)
  const empleadosTodos = [...empleados];

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
  // Siempre sobre empleadosTodos (sin filtro de estado) para reflejar movimiento real de plantilla.
  // El filtro de departamento sí aplica (empleadosTodos ya está filtrado por dpto si procede).
  const empleadosParaMovimiento = filtros.departamento
    ? empleadosTodos.filter((e) => e.departamento === filtros.departamento)
    : empleadosTodos;

  const activos = empleadosParaMovimiento.filter((e) => e.activo !== false);

  const movimientoMensual = ventana.map(({ anio, mes, label }) => {
    const altas = empleadosParaMovimiento.filter((e) => {
      const f = new Date(e.fechaRegistro ?? e.creadoEn ?? e.createdAt ?? 0);
      return f.getFullYear() === anio && f.getMonth() === mes;
    }).length;
    const bajas = empleadosParaMovimiento.filter((e) => {
      if (!e.fechaBaja) return false;
      const f = new Date(e.fechaBaja);
      return f.getFullYear() === anio && f.getMonth() === mes;
    }).length;
    return { mes: label, altas, bajas };
  });

  // ── KPIs de rotación ────────────────────────────────────────────────────────
  const mesActual  = hoy.getMonth();
  const anioActual = hoy.getFullYear();
  const altasEsteMes = empleadosParaMovimiento.filter((e) => {
    const f = new Date(e.fechaRegistro ?? e.creadoEn ?? e.createdAt ?? 0);
    return f.getFullYear() === anioActual && f.getMonth() === mesActual;
  }).length;
  const bajasEsteMes = empleadosParaMovimiento.filter((e) => {
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

  const progresoModulos: { nombre: string; porcentaje: number }[] = [];
  const detalleModulos: { moduloId: string; nombre: string; completados: number; enProgreso: number; pendientes: number; total: number }[] = [];

  for (const m of modulos) {
    const mid = m.moduloId ?? m.id ?? "";
    let completados = 0;
    let enProgreso  = 0;
    let sumPct      = 0;
    let conDatos    = 0;

    for (const pe of progresoEmpresa) {
      const pm = pe.modulos?.find((x) => String(x.moduloId) === String(mid));
      if (pm) {
        conDatos++;
        sumPct += pm.porcentaje ?? 0;
        if ((pm.porcentaje ?? 0) >= 100) completados++;
        else if ((pm.porcentaje ?? 0) > 0) enProgreso++;

      }
    }
    const porcentaje = conDatos > 0
      ? Math.round(sumPct / conDatos)
      : 0;
    const nombre = m.titulo ?? m.nombre ?? "Módulo";
    const pendientes = Math.max(0, totalEmpleados - completados - enProgreso);
    progresoModulos.push({ nombre, porcentaje });
    detalleModulos.push({ moduloId: mid, nombre, completados, enProgreso, pendientes, total: totalEmpleados || 1 });
  }


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

  // ── Distribución por departamento ────────────────────────────────────────────
  const conteoDptos: Record<string, number> = {};
  for (const e of activos) {
    const dpto = e.departamento || "Sin departamento";
    conteoDptos[dpto] = (conteoDptos[dpto] ?? 0) + 1;
  }
  const distribucionDepartamentos = Object.entries(conteoDptos)
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);

  // ── KPI de completitud global ────────────────────────────────────────────────
  // Solo promedia módulos que tienen al menos un empleado con datos (evita arrastrar a 0 módulos sin asignar)
  const modulosConDatos = progresoModulos.filter((m) => m.porcentaje > 0);
  const pctCompletitudGlobal = modulosConDatos.length
    ? Math.round(modulosConDatos.reduce((s, m) => s + m.porcentaje, 0) / modulosConDatos.length)
    : 0;

  return {
    kpis: {
      totalEmpleados:       activos.length,
      altasEsteMes,
      bajasEsteMes,
      altasPeriodo:         movimientoMensual.reduce((s, m) => s + m.altas, 0),
      bajasPeriodo:         movimientoMensual.reduce((s, m) => s + m.bajas, 0),
      tasaRotacion,
      modulosConProgreso:   progresoModulos.filter((m) => m.porcentaje > 0).length,
      pctCompletitudGlobal,
    },
    movimientoMensual,
    progresoModulos,
    detalleModulos,
    empleadosSinFormacion:  sinFormacion,
    empleadosEnProgreso:    enProgreso,
    empleadosCompletados:   completados100,

  };
}

// ─── Formación global para Superadmin ─────────────────────────────────────────

export interface FormacionGlobalModulo {
  moduloId: string;
  nombre: string;
  completados: number;
  enProgreso: number;
  pendientes: number;
  total: number;
}

/**
 * Agrega el progreso de formación de TODOS los empleados de TODAS las empresas
 * aprobadas, devolviendo estadísticas por módulo similares a las que ve el
 * admin de empresa en su dashboard.
 */
export async function getFormacionGlobalSuperadmin(): Promise<FormacionGlobalModulo[]> {
  const [resEmp, resMod] = await Promise.all([
    apiFetch(`${API_URL}/empresas`),
    apiFetch(`${API_URL}/modulos`),
  ]);

  const empresas: any[] = resEmp.ok ? await resEmp.json() : [];
  const modulos: any[]  = resMod.ok ? await resMod.json()  : [];

  const empresasAprobadas = empresas.filter((e: any) => e.estadoSolicitud === "APROBADA");
  const modulosActivos    = modulos.filter((m: any) => m.activo !== false);

  if (empresasAprobadas.length === 0 || modulosActivos.length === 0) return [];

  // Progreso de todas las empresas en paralelo
  const progresosPorEmpresa = await Promise.all(
    empresasAprobadas.map((emp: any) =>
      apiFetch(`${API_URL}/progreso/empresa/${emp.id}`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ),
  );

  const allProgreso: ProgresoEmpleado[] = progresosPorEmpresa.flat();

  // Empleados únicos con algún registro de progreso
  const empleadosConProgreso = new Set(allProgreso.map((p) => p.usuarioId));
  const totalEmpleados = Math.max(empleadosConProgreso.size, 1);

  return modulosActivos.map((mod: any) => {
    const mid = mod.moduloId ?? mod.id ?? "";
    let completados = 0;
    let enProgreso  = 0;

    for (const emp of allProgreso) {
      const mp = emp.modulos?.find((m) => m.moduloId === mid);
      if (mp) {
        if ((mp.porcentaje ?? 0) >= 100) completados++;
        else if ((mp.porcentaje ?? 0) > 0) enProgreso++;
      }
    }

    const pendientes = Math.max(0, totalEmpleados - completados - enProgreso);

    return {
      moduloId: mid,
      nombre: mod.titulo ?? mod.nombre ?? "Módulo",
      completados,
      enProgreso,
      pendientes,
      total: totalEmpleados,
    };
  });
}