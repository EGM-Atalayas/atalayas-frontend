// lib/api/formaciones.ts
import { API_URL } from "@/lib/api";
import { Formacion } from "../types/formaciones";
import { MOCK_FORMACIONES } from "../mocks/formaciones.mock";

const USE_MOCK = true;

export async function getFormaciones(empresaId?: string): Promise<Formacion[]> {
  try {
    const url = empresaId
      ? `${API_URL}/formaciones?empresa_id=${empresaId}`
      : `${API_URL}/formaciones`;

    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Backend error");
    return res.json();
  } catch {
    // Fallback a mock data
    if (empresaId) {
      return MOCK_FORMACIONES.filter(f => f.empresa_id === empresaId || f.empresa_id === null);
    }
    return MOCK_FORMACIONES;
  }
}

export async function crearFormacion(data: Partial<Formacion>): Promise<Formacion> {
  try {
    const res = await fetch(`${API_URL}/formaciones`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Backend error");
    return res.json();
  } catch {
    const nueva: Formacion = {
      id: Date.now(),
      name: data.name || "Nueva formación",
      category: data.category || "Específica",
      status: "pendiente",
      description: data.description || "",
      empresa_id: data.empresa_id || null,
      pdfUrl: data.pdfUrl || null,
    };
    MOCK_FORMACIONES.unshift(nueva);
    return nueva;
  }
}

export async function editarFormacion(id: number, data: Partial<Formacion>): Promise<Formacion> {
  try {
    const res = await fetch(`${API_URL}/formaciones/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Backend error");
    return res.json();
  } catch {
    const idx = MOCK_FORMACIONES.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error("Formación no encontrada");
    MOCK_FORMACIONES[idx] = { ...MOCK_FORMACIONES[idx], ...data };
    return MOCK_FORMACIONES[idx];
  }
}

export async function desactivarFormacion(id: number): Promise<void> {
  try {
    await fetch(`${API_URL}/formaciones/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    const idx = MOCK_FORMACIONES.findIndex((f) => f.id === id);
    if (idx !== -1) {
      MOCK_FORMACIONES.splice(idx, 1);
    }
  }
}
