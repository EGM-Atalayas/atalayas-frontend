"use client";

import { useState } from "react";
import Header from "../Header";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmpleadoNavItem = "Inicio" | "Onboarding" | "Formación" | "Comunicación" | "Administración";

// ─── Data ─────────────────────────────────────────────────────────────────────

const onboardingModules = [
  { name: "Identidad Corporativa", status: "completado", progress: 100 },
  { name: "Prevención de Riesgos Laborales", status: "completado", progress: 100 },
  { name: "Calidad y Protocolos", status: "en progreso", progress: 60 },
  { name: "Formación Específica", status: "en progreso", progress: 25 },
  { name: "Desarrollo Profesional", status: "pendiente", progress: 0 },
  { name: "Recompensas y Ventajas", status: "pendiente", progress: 0 },
];

const announcements = [
  {
    tag: "Evento",
    title: "Jornada de puertas abiertas — 28 de marzo",
    body: "EGM Atalayas celebra su jornada anual. Inscríbete antes del 25 de marzo.",
    date: "20 mar",
  },
  {
    tag: "Ventajas",
    title: "Nuevas ventajas disponibles en el catálogo",
    body: "Se han añadido descuentos en guardería y coche compartido. Consulta el catálogo.",
    date: "18 mar",
  },
  {
    tag: "Formación",
    title: "Actualización del módulo de PRL",
    body: "El módulo de Prevención de Riesgos ha sido actualizado con nueva normativa.",
    date: "15 mar",
  },
];

const perks = [
  { icon: "🚗", name: "Coche compartido", desc: "Coordina rutas con compañeros del parque.", available: true },
  { icon: "🧒", name: "Guardería bonificada", desc: "Plazas con precio reducido en centro infantil cercano.", available: true },
  { icon: "🍽️", name: "Descuentos en restaurantes", desc: "Precios especiales en establecimientos del entorno.", available: true },
  { icon: "🎓", name: "Formación externa", desc: "Cursos homologados con tarifas negociadas.", available: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const moduleStatusStyle: Record<string, string> = {
  completado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "en progreso": "bg-blue-50 text-blue-700 border-blue-200",
  pendiente: "bg-gray-100 text-gray-400 border-gray-200",
};

const tagColor: Record<string, string> = {
  Evento: "bg-blue-50 text-blue-600 border-blue-100",
  Ventajas: "bg-amber-50 text-amber-700 border-amber-100",
  Formación: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

interface Props {
  logoEmpresaUrl?: string;
  nombreEmpresa?: string;
  usuario?: { nombre: string };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Empleado({ logoEmpresaUrl, nombreEmpresa, usuario }: Props) {
  const [activeNav, setActiveNav] = useState<EmpleadoNavItem>("Inicio");

  const completed = onboardingModules.filter((m) => m.status === "completado").length;
  const totalProgress = Math.round(
    onboardingModules.reduce((acc, m) => acc + m.progress, 0) / onboardingModules.length
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <Header
        defaultActive="Inicio"
        onNavChange={(item) => setActiveNav(item as EmpleadoNavItem)}
        logoEmpresa={logoEmpresaUrl}
      />
      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Hola, {usuario?.nombre || "Empleado"} 
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {nombreEmpresa ?? "Empresa"} · 20 de marzo de 2026
          </p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Onboarding itinerary */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-800">
                Mi itinerario de onboarding
              </h2>
              <span className="text-xs text-gray-400">
                {completed} de {onboardingModules.length} completados
              </span>
            </div>

            {/* Global progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-gray-900 rounded-full transition-all"
                style={{ width: `${totalProgress}%` }}
              />
            </div>

            <div className="flex flex-col gap-2">
              {onboardingModules.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-2.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        m.status === "completado"
                          ? "bg-emerald-400"
                          : m.status === "en progreso"
                          ? "bg-blue-400"
                          : "bg-gray-200"
                      }`}
                    />
                    <p className="text-xs font-medium text-gray-800">{m.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.status === "en progreso" && (
                      <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${m.progress}%` }}
                        />
                      </div>
                    )}
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${moduleStatusStyle[m.status]}`}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Perks */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">Mis ventajas</h2>
            <div className="flex flex-col gap-3">
              {perks.map((p) => (
                <div
                  key={p.name}
                  className={`border rounded-lg px-3 py-2.5 border-gray-100 ${
                    !p.available ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{p.icon}</span>
                      <p className="text-xs font-medium text-gray-800">{p.name}</p>
                    </div>
                    {!p.available && (
                      <span className="text-[10px] text-gray-400">Próximamente</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug pl-5">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800">
              Comunicados de EGM Atalayas
            </h2>
            <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Ver todos →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {announcements.map((a, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagColor[a.tag]}`}
                  >
                    {a.tag}
                  </span>
                  <span className="text-[10px] text-gray-400">{a.date}</span>
                </div>
                <h3 className="text-xs font-semibold text-gray-900 mb-1">{a.title}</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
