import { apiFetch, API_URL } from "../api";
import type { Incidencia, IncidenciaInput } from "../types/incidencias";

const LS_KEY = "egm_incidencias";

function getLocalStorage(): Incidencia[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveLocalStorage(data: Incidencia[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch { /* noop */ }
}

function getUserInfo() {
  try {
    const userStr = localStorage.getItem("usuario");
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        usuarioId: user.usuarioId || "user-local",
        nombre: `${user.nombre || "Usuario"} ${user.apellidos || ""}`.trim(),
        email: user.email || "user@local.com",
        empresaId: user.empresaId || null,
        nombreEmpresa: user.nombreEmpresa || "Mi Empresa",
      };
    }
  } catch { /* noop */ }
  return {
    usuarioId: "user-local",
    nombre: "Usuario Local",
    email: "user@local.com",
    empresaId: null,
    nombreEmpresa: "Mi Empresa",
  };
}

export async function getIncidencias(empresaId?: string | null): Promise<Incidencia[]> {
  try {
    const url = empresaId ? `${API_URL}/incidencias?empresaId=${empresaId}` : `${API_URL}/incidencias`;
    const res = await apiFetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    console.log("Backend de incidencias no disponible, usando localStorage");
  }

  const all = getLocalStorage();
  if (empresaId) return all.filter(i => i.empresaId === empresaId);
  return all;
}

export async function crearIncidencia(data: IncidenciaInput): Promise<Incidencia> {
  try {
    const res = await apiFetch(`${API_URL}/incidencias`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {
    console.log("Guardando incidencia en localStorage");
  }

  const user = getUserInfo();
  const newInc: Incidencia = {
    ...data,
    incidenciaId: `inc-local-${Date.now()}`,
    prioridad: data.prioridad as any,
    estado: "abierta",
    creadoPor: user.usuarioId,
    nombreCreador: user.nombre,
    emailCreador: user.email,
    empresaId: data.empresaId || "emp-local",
    nombreEmpresa: user.nombreEmpresa,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  };

  const all = getLocalStorage();
  all.push(newInc);
  saveLocalStorage(all);
  return newInc;
}

export async function cambiarEstadoIncidencia(incidenciaId: string, estado: string): Promise<Incidencia> {
  try {
    const res = await apiFetch(`${API_URL}/incidencias/${incidenciaId}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
    if (res.ok) return await res.json();
  } catch {
    console.log("Actualizando estado en localStorage");
  }

  const all = getLocalStorage();
  const idx = all.findIndex(i => i.incidenciaId === incidenciaId);
  if (idx !== -1) {
    all[idx] = { ...all[idx], estado: estado as any, actualizadoEn: new Date().toISOString() };
    saveLocalStorage(all);
    return all[idx];
  }
  throw new Error("Incidencia no encontrada");
}
