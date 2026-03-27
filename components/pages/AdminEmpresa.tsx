"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../Header";
import Link from "next/link";
import { getNoticias } from "@/lib/api/noticias";
import { Noticia } from "@/lib/types/noticias";
import { NAV_ROUTES } from "@/lib/routes";
import { useAuth } from "@/context/AuthContext";

// ─── Data empleado (igual que Empleado.tsx) ───────────────────────────────────

const onboardingModules = [
  { name: "Identidad Corporativa", status: "completado", progress: 100 },
  { name: "Prevención de Riesgos Laborales", status: "completado", progress: 100 },
  { name: "Calidad y Protocolos", status: "en progreso", progress: 60 },
  { name: "Formación Específica", status: "en progreso", progress: 25 },
  { name: "Desarrollo Profesional", status: "pendiente", progress: 0 },
  { name: "Recompensas y Ventajas", status: "pendiente", progress: 0 },
];

const perks = [
  { icon: "🚗", name: "Coche compartido", desc: "Coordina rutas con compañeros del parque.", available: true },
  { icon: "🧒", name: "Guardería bonificada", desc: "Plazas con precio reducido en centro infantil cercano.", available: true },
  { icon: "🍽️", name: "Descuentos en restaurantes", desc: "Precios especiales en establecimientos del entorno.", available: true },
  { icon: "🎓", name: "Formación externa", desc: "Cursos homologados con tarifas negociadas.", available: false },
];

// ─── Data admin (exclusivo AdminEmpresa) ──────────────────────────────────────

const employees = [
  { name: "Carlos Blanco", role: "Técnico", progress: 80, joined: "15 mar" },
  { name: "Laura Pons", role: "Administración", progress: 55, joined: "10 mar" },
  { name: "Miguel Salas", role: "Operario", progress: 30, joined: "03 mar" },
  { name: "Ana Vidal", role: "Comercial", progress: 100, joined: "20 feb" },
  { name: "Sergio Mora", role: "Técnico", progress: 10, joined: "18 mar" },
];

const pendingTasks = [
  { text: "Completar módulo de Protocolos comunes", urgency: "alta" },
  { text: "Revisar contenido de Normativa interna", urgency: "alta" },
  { text: "Subir manuales técnicos actualizados", urgency: "media" },
  { text: "Añadir 3 empleados pendientes de alta", urgency: "media" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const moduleStatusStyle: Record<string, string> = {
  completado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "en progreso": "bg-blue-50 text-blue-700 border-blue-200",
  pendiente: "bg-gray-100 text-gray-400 border-gray-200",
};

const urgencyColor: Record<string, string> = {
  alta: "text-red-400",
  media: "text-amber-400",
  baja: "text-gray-300",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminEmpresa() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    if (usuario?.empresaId) {
      getNoticias(usuario.empresaId).then((data) => setNoticias(data.slice(0, 3)));
    }
  }, [usuario?.empresaId]);

  const completed = onboardingModules.filter((m) => m.status === "completado").length;
  const totalProgress = Math.round(
    onboardingModules.reduce((acc, m) => acc + m.progress, 0) / onboardingModules.length
  );
  const avgProgress = Math.round(
    employees.reduce((acc, e) => acc + e.progress, 0) / employees.length
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <Header
        defaultActive="Inicio"
        onNavChange={(item) => router.push(NAV_ROUTES[item])}
        logoEmpresa={usuario?.logoEmpresaUrl}
      />

      <main className="max-w-7xl mx-auto px-8 py-10">

        {/* Page title */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Hola, {usuario?.nombre ?? "Administrador"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {usuario?.nombreEmpresa ?? "Mi empresa"} · 20 de marzo de 2026
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/admin")}
            className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Panel de administración →
          </button>
        </div>

        {/* Stats admin — exclusivo AdminEmpresa */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Empleados activos", value: String(employees.length) },
            { label: "Progreso medio equipo", value: `${avgProgress}%` },
            { label: "Onboarding completo", value: "1" },
            { label: "Tareas pendientes", value: String(pendingTasks.length) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Mismo grid que Empleado.tsx */}
        <div className="grid grid-cols-3 gap-6 mb-6">

          {/* Onboarding itinerary */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-800">Mi itinerario de onboarding</h2>
              <span className="text-xs text-gray-400">
                {completed} de {onboardingModules.length} completados
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-gray-900 rounded-full transition-all" style={{ width: `${totalProgress}%` }} />
            </div>
            <div className="flex flex-col gap-2">
              {onboardingModules.map((m) => (
                <div key={m.name} onClick={() => router.push(NAV_ROUTES["Formación"])} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-2.5 hover:bg-gray-50/80 hover:border-gray-200 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.status === "completado" ? "bg-emerald-400" : m.status === "en progreso" ? "bg-blue-400" : "bg-gray-200"}`} />
                    <p className="text-xs font-medium text-gray-800">{m.name}</p>
                  </div>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${moduleStatusStyle[m.status]}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tareas pendientes — exclusivo AdminEmpresa */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">Tareas pendientes</h2>
            <div className="flex flex-col gap-3">
              {pendingTasks.map((t, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`text-xs mt-0.5 font-bold ${urgencyColor[t.urgency]}`}>●</span>
                  <p className="text-xs text-gray-700 leading-snug">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Homologaciones y Carnés — exclusivo AdminEmpresa (Requisito Pliego) */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-800">Control de Homologaciones y Carnés</h2>
              <button className="text-[11px] text-blue-600 font-medium hover:underline">Gestionar todos →</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">⚠️</span>
                  <p className="text-xs font-bold text-amber-700 uppercase">Próximas renovaciones</p>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">Hay **3 empleados** con certificados de PRL que expiran en los próximos 30 días.</p>
              </div>
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">✅</span>
                  <p className="text-xs font-bold text-emerald-700 uppercase">Estado General</p>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">El **92%** de la plantilla tiene la documentación básica en regla y actualizada.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-center items-center text-center">
             <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 text-xl">📄</div>
             <h3 className="text-sm font-semibold text-gray-800 mb-1">Carga Masiva</h3>
             <p className="text-[11px] text-gray-400 mb-4">Sube múltiples CVs o carnés y la IA los procesará.</p>
             <button className="w-full py-2 bg-gray-900 text-white text-[11px] font-medium rounded-lg hover:bg-gray-700 transition-colors">
               Subir documentos
             </button>
          </div>
        </div>

        {/* Employee progress */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800">Progreso de empleados</h2>
            <button onClick={() => router.push("/dashboard/admin")} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Ver todos →
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["Empleado", "Cargo", "Alta", "Progreso onboarding"].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium pb-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.name} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-semibold text-gray-500">
                        {e.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="text-xs font-medium text-gray-800">{e.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-gray-500">{e.role}</td>
                  <td className="py-3 text-xs text-gray-500">{e.joined}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 w-48">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${e.progress === 100 ? "bg-emerald-400" : e.progress >= 50 ? "bg-blue-400" : "bg-amber-400"}`} style={{ width: `${e.progress}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-400 w-8">{e.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Noticias — igual que Empleado.tsx */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800">Últimas noticias</h2>
            <Link href="/dashboard/noticias" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Ver todas →
            </Link>
          </div>
          {noticias.length === 0 ? (
            <p className="text-xs text-gray-400">No hay noticias publicadas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {noticias.map((n) => (
                <Link key={n.anuncio_id} href="/dashboard/noticias" className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{n.tag}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 truncate">{n.titulo}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.cuerpo}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-4 mt-0.5">
                    {new Date(n.creado_en).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}