// src/lib/api/estadisticas.ts
import { API_URL, apiFetch } from "../api";

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
  SUPERADMIN: "#F59E0B",
  ADMIN:      "#3B82F6",
  EMPLEADO:   "#10B981",
  INVITADO:   "#94A3B8",
};

const ETIQUETA_ROL: Record<string, string> = {
  SUPERADMIN: "SuperAdmins",
  ADMIN:      "Admins Empresa",
  EMPLEADO:   "Empleados",
  INVITADO:   "Invitados",
};

export async function getEstadisticasSuperadmin(): Promise<EstadisticasResponse> {
  const [resEmpresas, resUsuarios] = await Promise.all([
    apiFetch(`${API_URL}/empresas`),
    apiFetch(`${API_URL}/usuarios`),
  ]);

  if (!resEmpresas.ok) throw new Error("Error al obtener empresas");
  if (!resUsuarios.ok) throw new Error("Error al obtener usuarios");

  const empresas: any[] = await resEmpresas.json();
  const usuarios: any[] = await resUsuarios.json();

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

  const conteoRoles: Record<string, number> = {};
  for (const user of usuarios) {
    const rol: string = (
      user.codigoRol ?? user.rol ?? user.role ?? user.nombreRol ?? "DESCONOCIDO"
    ).toUpperCase();
    conteoRoles[rol] = (conteoRoles[rol] ?? 0) + 1;
  }

  const usuariosPorRol = Object.entries(conteoRoles).map(([rol, cantidad]) => ({
    rol: ETIQUETA_ROL[rol] ?? rol,
    cantidad,
    color: COLORES_ROLES[rol] ?? "#94A3B8",
  }));

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
      const rol = (u.codigoRol ?? u.rol ?? u.role ?? "").toUpperCase();
      if (rol !== "EMPLEADO") return false;
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