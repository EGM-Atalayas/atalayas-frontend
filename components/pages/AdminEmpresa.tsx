"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../Header";
import { getNoticias } from "@/lib/api/noticias";
import { Noticia } from "@/lib/types/noticias";
import { NAV_ROUTES } from "@/lib/routes";
import { useAuth } from "@/context/AuthContext";

// ─── Data ─────────────────────────────────────────────────────────────────────

const moduleGroups = [
  {
    group: "Identidad Corporativa",
    items: [
      { name: "Visión, misión y valores", status: "publicado" },
      { name: "Presentación institucional", status: "publicado" },
      { name: "Información general", status: "borrador" },
    ],
  },
  {
    group: "Formación Básica",
    items: [
      { name: "Prevención de Riesgos Laborales", status: "publicado" },
      { name: "Calidad", status: "publicado" },
      { name: "Protocolos comunes", status: "pendiente" },
      { name: "Normativa interna básica", status: "pendiente" },
    ],
  },
  {
    group: "Formación Específica",
    items: [
      { name: "Manuales internos", status: "borrador" },
      { name: "Procedimientos operativos", status: "pendiente" },
      { name: "Documentación técnica", status: "pendiente" },
    ],
  },
];

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

const statusStyle: Record<string, string> = {
  publicado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  borrador: "bg-amber-50 text-amber-700 border-amber-200",
  pendiente: "bg-gray-100 text-gray-500 border-gray-200",
};

const urgencyColor: Record<string, string> = {
  alta: "text-red-400",
  media: "text-amber-400",
  baja: "text-gray-300",
};

interface Props {
  logoEmpresaUrl?: string;
  nombreEmpresa?: string;
  empresaId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminEmpresa({ logoEmpresaUrl, nombreEmpresa, empresaId }: Props) {
  const router = useRouter();
  const { usuario } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
  if (usuario?.empresaId) {
    getNoticias(usuario.empresaId).then((data) => setNoticias(data.slice(0, 3)));
  }
}, [usuario?.empresaId]);

  const totalModules = moduleGroups.reduce((acc, g) => acc + g.items.length, 0);
  const publishedModules = moduleGroups.reduce(
    (acc, g) => acc + g.items.filter((i) => i.status === "publicado").length,
    0
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
              Resumen
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {nombreEmpresa ?? "Mi empresa"} · 20 de marzo de 2026
            </p>
          </div>
          <button className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            + Añadir empleado
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Empleados activos", value: "87" },
            { label: "Módulos publicados", value: `${publishedModules}/${totalModules}` },
            { label: "Progreso medio", value: `${avgProgress}%` },
            { label: "Onboarding completo", value: "1" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Module status */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-800">Estado de módulos</h2>
              <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                Editar contenidos →
              </button>
            </div>
            <div className="flex flex-col gap-5">
              {moduleGroups.map((g) => (
                <div key={g.group}>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {g.group}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {g.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                      >
                        <p className="text-xs text-gray-700">{item.name}</p>
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusStyle[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending tasks */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">Tareas pendientes</h2>
            <div className="flex flex-col gap-3">
              {pendingTasks.map((t, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`text-xs mt-0.5 font-bold ${urgencyColor[t.urgency]}`}>
                    ●
                  </span>
                  <p className="text-xs text-gray-700 leading-snug">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee progress */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800">Progreso de empleados</h2>
            <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Ver todos →
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["Empleado", "Cargo", "Alta", "Progreso onboarding"].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-400 font-medium pb-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr
                  key={e.name}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
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
                        <div
                          className={`h-full rounded-full ${e.progress === 100
                              ? "bg-emerald-400"
                              : e.progress >= 50
                                ? "bg-blue-400"
                                : "bg-amber-400"
                            }`}
                          style={{ width: `${e.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 w-8">{e.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
