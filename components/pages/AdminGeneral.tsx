"use client";

import { useState, useEffect } from "react";
import { getNoticias } from "../../lib/api/noticias";
import type { Noticia } from "../../lib/types/noticias";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const stats = [
  { label: "Empresas adheridas", value: "18", delta: "+2 este mes" },
  { label: "Empleados registrados", value: "743", delta: "+31 este mes" },
  { label: "Módulos publicados", value: "64", delta: "en 18 empresas" },
  { label: "Incidencias abiertas", value: "3", delta: "1 crítica" },
];

const companies = [
  { name: "Soluciones TIC Levante", employees: 87, onboarding: 92, status: "activa" },
  { name: "Grupo Logístico Sur", employees: 124, onboarding: 68, status: "activa" },
  { name: "Clínica Dental Atalayas", employees: 31, onboarding: 45, status: "activa" },
  { name: "Construcciones Medvil", employees: 56, onboarding: 20, status: "revisión" },
  { name: "Asesoría Hernández", employees: 14, onboarding: 0, status: "pendiente" },
];

const activity = [
  { text: "Nueva empresa incorporada al parque", time: "hace 2h", type: "info" },
  { text: "Módulo PRL actualizado globalmente", time: "hace 5h", type: "success" },
  { text: "Error carga contenidos · Medvil", time: "hace 1d", type: "danger" },
  { text: "Evento team building — 28 mar", time: "hace 1d", type: "info" },
  { text: "Backup semanal completado", time: "hace 2d", type: "success" },
];

const modules = [
  { name: "Identidad Corporativa", published: 16, total: 18 },
  { name: "Formación Básica (PRL)", published: 18, total: 18 },
  { name: "Formación Específica", published: 11, total: 18 },
  { name: "Desarrollo Profesional", published: 8, total: 18 },
  { name: "Recompensas y Ventajas", published: 14, total: 18 },
  { name: "Comunidad", published: 6, total: 18 },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  activa: "bg-emerald-50 text-emerald-700 border-emerald-200",
  revisión: "bg-amber-50 text-amber-700 border-amber-200",
  pendiente: "bg-gray-100 text-gray-500 border-gray-200",
};

const activityDot: Record<string, string> = {
  info: "bg-blue-400",
  success: "bg-emerald-400",
  danger: "bg-red-400",
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function AdminGeneral() {
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    getNoticias().then((data) => setNoticias(data.slice(0, 3))); // mostrar solo las 3 más recientes
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Vista general</h1>
          <p className="text-sm text-gray-400 mt-1">
            EGM Atalayas Ciudad Empresarial · 20 de marzo de 2026
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-1">{s.delta}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Companies table */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-800">Empresas del parque</h2>
              <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                Ver todas →
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Empresa", "Empleados", "Onboarding", "Estado"].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-400 font-medium pb-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.name}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 text-xs font-medium text-gray-800">{c.name}</td>
                    <td className="py-3 text-xs text-gray-500">{c.employees}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.onboarding >= 80
                              ? "bg-emerald-400"
                              : c.onboarding >= 40
                                ? "bg-amber-400"
                                : "bg-gray-300"
                              }`}
                            style={{ width: `${c.onboarding}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400 w-8">{c.onboarding}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColor[c.status]}`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">Actividad reciente</h2>
            <div className="flex flex-col gap-4">
              {activity.map((a, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${activityDot[a.type]}`}
                  />
                  <div>
                    <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Module coverage */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800">
              Cobertura de módulos formativos
            </h2>
            <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Gestionar →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {modules.map((m) => {
              const pct = Math.round((m.published / m.total) * 100);
              return (
                <div key={m.name} className="border border-gray-100 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-gray-800 mb-2">{m.name}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full ${pct === 100
                        ? "bg-emerald-400"
                        : pct >= 60
                          ? "bg-blue-400"
                          : "bg-amber-400"
                        }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {m.published} de {m.total} empresas
                  </p>
                </div>
              );
            })}
          </div>

        </div>
        {/* Preview de noticias */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
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
                <Link
                  key={n.anuncioId}
                  href="/dashboard/noticias"
                  className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {n.esGlobal && (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          Global
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-800 truncate">{n.titulo}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.mensaje}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-4 mt-0.5">
                    {new Date(n.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
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
