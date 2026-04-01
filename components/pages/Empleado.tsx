import { useEffect, useState } from "react";
import Header from "../Header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Noticia } from "@/lib/types/noticias";
import { getNoticias } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { NAV_ROUTES } from "@/lib/routes";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const moduleStatusStyle: Record<string, string> = {
  completado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "en progreso": "bg-blue-50 text-blue-700 border-blue-200",
  pendiente: "bg-gray-100 text-gray-400 border-gray-200",
};

interface Props {
  logoEmpresaUrl?: string;
  nombreEmpresa?: string;
  usuario?: { nombre: string, empresaId?: string };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Empleado({ logoEmpresaUrl, nombreEmpresa, usuario }: Props) {
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [formaciones, setFormaciones] = useState<ModuloConProgreso[]>([]);


 useEffect(() => {
  getNoticias(usuario?.empresaId).then((data) => setNoticias(data.slice(0, 3)));
  getModulosConProgreso().then((data) =>
    setFormaciones(data.sort((a, b) => a.orden - b.orden))
  );
}, [usuario?.empresaId]);

  // Simulamos campos que no están en el modelo todavía para UI
  const completed = formaciones.filter((m) => m.status === "completado").length;
  // Para la demo, calculamos un progreso ficticio basado en el total
  const totalProgress = formaciones.length > 0 ? Math.round((completed / formaciones.length) * 100) : 0;

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
                Mi itinerario de formación y onboarding
              </h2>
              <span className="text-xs text-gray-400">
                {completed} de {formaciones.length} módulos
              </span>
            </div>

            {/* Global progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-gray-900 rounded-full transition-all"
                style={{ width: `${totalProgress}%` }}
              />
            </div>

            {/* Next step CTA */}
            {formaciones.find(f => f.status !== "completado") && (
              <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">
                    🚀
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Tu siguiente paso</p>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {formaciones.find(f => f.status !== "completado")?.nombre}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => router.push(NAV_ROUTES["Formación"])}
                  className="bg-blue-600 text-white text-[11px] font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Continuar →
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {formaciones.map((m) => (
                <div key={m.moduloId} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/80 hover:border-gray-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.status === "completado" ? "bg-emerald-400" : m.status === "en progreso" ? "bg-blue-400" : "bg-gray-200"}`} />
                    <div className="flex flex-col">
                      <p className="text-xs font-medium text-gray-800">{m.nombre}</p>
                      <div className="flex flex-col">
                      <p className="text-xs font-medium text-gray-800">{m.nombre}</p>
                    </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${moduleStatusStyle[m.status] || moduleStatusStyle.pendiente}`}>
                      {m.status}
                    </span>
                    <button 
                      onClick={() => router.push(NAV_ROUTES["Formación"])}
                      className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Ir →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Perks / Servicios - Seccion estática por ahora */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">Mis Servicios</h2>
              <div className="flex flex-col gap-3">
                {[
                  { icon: "🚗", name: "Coche compartido", desc: "Coordina rutas con compañeros" },
                  { icon: "🍽️", name: "Descuentos locales", desc: "Precios especiales en el parque" },
                ].map((p, idx) => (
                  <div key={idx} className="border rounded-lg px-3 py-2.5 border-gray-100 bg-gray-50/30">
                    <p className="text-xs font-medium text-gray-800">{p.icon} {p.name}</p>
                    <p className="text-[11px] text-gray-400 leading-snug mt-1">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Carnés */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Mis Carnés</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-lg shadow-sm border border-gray-100">🏗️</div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-800">P.R.L. Alturas</p>
                    <p className="text-[10px] text-gray-400">Todo en orden</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Noticias Recientes */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800">Últimas noticias</h2>
            <Link href="/dashboard/noticias" className="text-xs text-gray-400 hover:text-gray-700">Ver todas →</Link>
          </div>

          <div className="flex flex-col gap-3">
            {noticias.map((n, idx) => (
              <div key={n.anuncioId ?? idx} className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors">
                <div className="flex-1 min-w-0">
                  {n.esGlobal && <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Global</span>}
                  <p className="text-xs font-medium text-gray-800 truncate mt-1">{n.titulo}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.mensaje}</p>
                </div>
                <span className="text-[10px] text-gray-400 ml-4">
                  {new Date(n.creado_en).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

