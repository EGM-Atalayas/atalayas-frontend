import { apiFetch, API_URL } from "@/lib/api";

export interface Notificacion {
    notificacionId: string;
    destinatarioId: string;
    tipo: string;
    mensaje: string;
    enlace: string | null;
    leido: boolean;
    creadoEn: string;
}

export async function getNotificacionesNoLeidas(): Promise<Notificacion[]> {
    const res = await apiFetch(`${API_URL}/notificaciones/me/no-leidas`);
    if (!res.ok) return [];
    return res.json();
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
    await apiFetch(`${API_URL}/notificaciones/${id}/leer`, { method: "PATCH" });
}

export async function marcarTodasLeidas(): Promise<void> {
    await apiFetch(`${API_URL}/notificaciones/me/leer-todas`, { method: "PATCH" });
}