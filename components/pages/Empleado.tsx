"use client";

import { useEffect, useState } from "react";
import Header from "../Header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Noticia } from "@/lib/types/noticias";
import { getNoticias } from "@/lib/api/noticias";
import { NAV_ROUTES } from "@/lib/routes";

// ─── Data ─────────────────────────────────────────────────────────────────────

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
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    getNoticias().then((data) => setNoticias(data.slice(0, 3))); // mostrar solo las 3 más recientes
  }, []);

  const completed = onboardingModules.filter((m) => m.status === "completado").length;
  const totalProgress = Math.round(
    onboardingModules.reduce((acc, m) => acc + m.progress, 0) / onboardingModules.length
  );

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <Header
        defaultActive="Inicio"
        onNavChange={(item) => router.push(NAV_ROUTES[item])}
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

            {/* Next step CTA - Automated Onboarding */}
            <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">
                  🚀
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Tu siguiente paso</p>
                  <h3 className="text-sm font-semibold text-slate-800">Calidad y Protocolos comunes</h3>
                </div>
              </div>
              <button 
                onClick={() => router.push(NAV_ROUTES["Formación"])}
                className="bg-blue-600 text-white text-[11px] font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Comenzar ahora →
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {onboardingModules.map((m) => (
                <div key={m.name} onClick={() => router.push(NAV_ROUTES["Formación"])} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-2.5 hover:bg-gray-50/80 hover:border-gray-200 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.status === "completado" ? "bg-emerald-400" : m.status === "en progreso" ? "bg-blue-400" : "bg-gray-200"}`} />
                    <p className="text-xs font-medium text-gray-800">{m.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.status === "en progreso" && (
                      <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${m.progress}%` }} />
                      </div>
                    )}
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${moduleStatusStyle[m.status]}`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Perks / Servicios */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">Mis Servicios</h2>
              <div className="flex flex-col gap-3">
                {perks.map((p) => (
                  <div
                    key={p.name}
                    className={`border rounded-lg px-3 py-2.5 border-gray-100 ${!p.available ? "opacity-40" : ""
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

            {/* Credentials / Carnés - Pliego requirement */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-gray-800">Mis Carnés</h2>
                <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 font-medium">Todo al día</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-lg shadow-sm border border-gray-100">🏗️</div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-800">Operador Carretilla</p>
                    <p className="text-[10px] text-gray-400">Expira en 14 meses</p>
                  </div>
                  <button className="text-[10px] text-blue-600 font-medium hover:underline">Ver PDF</button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 opacity-60">
                  <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-lg shadow-sm border border-gray-100">🚑</div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-800">Primeros Auxilios</p>
                    <p className="text-[10px] text-gray-400">Pendiente de formación</p>
                  </div>
                  <button className="text-[10px] text-gray-400 font-medium">Inscribirse</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview de noticias */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800">Últimas noticias</h2>
            <Link
              href="/dashboard/noticias"
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Ver todas →
            </Link>
          </div>

          {noticias.length === 0 ? (
            <p className="text-xs text-gray-400">No hay noticias publicadas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {noticias.map((n) => (
                <Link
                  key={n.anuncio_id}
                  href="/dashboard/noticias"
                  className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {n.tag}
                      </span>
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
