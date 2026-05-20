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

export interface NotificacionesPage {
    content: Notificacion[];
    totalElements: number;
    totalPages: number;
    number: number; // página actual (0-based)
    size: number;
}

export interface CrearNotificacionInput {
    destinatarioId: string;
    tipo: string;
    mensaje: string;
    enlace?: string;
}

export async function getNotificacionesNoLeidas(): Promise<Notificacion[]> {
    const res = await apiFetch(`${API_URL}/notificaciones/me/no-leidas`);
    if (!res.ok) return [];
    return res.json();
}

export async function getNotificacionesPaginadas(page = 0, size = 20): Promise<NotificacionesPage> {
    const res = await apiFetch(`${API_URL}/notificaciones/me?page=${page}&size=${size}`);
    if (!res.ok) throw new Error("Error al cargar notificaciones");
    return res.json();
}

export async function getContadorNoLeidas(): Promise<number> {
    const res = await apiFetch(`${API_URL}/notificaciones/me/contador`);
    if (!res.ok) return 0;
    const data = await res.json();
    return data.noLeidas ?? 0;
}

export async function marcarNotificacionLeida(id: string): Promise<void> {
    await apiFetch(`${API_URL}/notificaciones/${id}/leer`, { method: "PATCH" });
}

export async function marcarTodasLeidas(): Promise<void> {
    await apiFetch(`${API_URL}/notificaciones/me/leer-todas`, { method: "PATCH" });
}

export async function crearNotificacion(data: CrearNotificacionInput): Promise<Notificacion> {
    const res = await apiFetch(`${API_URL}/notificaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear la notificación");
    return res.json();
}

