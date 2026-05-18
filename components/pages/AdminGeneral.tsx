"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FaBuilding,
  FaUsers,
  FaExclamationTriangle,
  FaArrowRight,
  FaFileAlt,
  FaCheckCircle,
  FaCircle,
  FaBullhorn,
  FaChartBar,
  FaCog,
  FaRocket,
  FaStar,
} from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { API_URL, apiFetch } from "@/lib/api";
import { QK } from "@/lib/queryKeys";

export interface Actividad {
  id: number;
  texto: string;
  tiempo: string;
  tipo: "info" | "success" | "error" | "warning";
}

export interface DashboardResponse {
  empresasAdheridas: number;
  empresasNuevasMes: number;
  empleadosRegistrados: number;
  empleadosNuevosMes: number;
  modulosPublicados: number;
  incidenciasAbiertas: number;
  incidenciasCriticas: number;
  actividadReciente?: Actividad[];
}

// ── Pasos del onboarding ──────────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    id: 1,
    titulo: "Aprueba las primeras empresas",
    descripcion: "Revisa las solicitudes pendientes y aprueba las empresas que quieran unirse al parque empresarial.",
    icono: <FaBuilding size={18} />,
    color: "#2563eb",
    bg: "#eff6ff",
    ruta: "/superadmin/administracion",
    accion: "Ir a Solicitudes",
  },
  {
    id: 2,
    titulo: "Configura los módulos de formación",
    descripcion: "Crea y publica módulos formativos para que los empleados puedan comenzar su onboarding.",
    icono: <FaFileAlt size={18} />,
    color: "#7c3aed",
    bg: "#f5f3ff",
    ruta: "/superadmin/comunicados",
    accion: "Ir a Módulos",
  },
  {
    id: 3,
    titulo: "Publica tu primer comunicado",
    descripcion: "Informa a todas las empresas y empleados del área empresarial con un comunicado oficial.",
    icono: <FaBullhorn size={18} />,
    color: "#059669",
    bg: "#ecfdf5",
    ruta: "/superadmin/comunicados",
    accion: "Crear comunicado",
  },
  {
    id: 4,
    titulo: "Revisa las estadísticas",
    descripcion: "Analiza el crecimiento de la plataforma, los sectores y la distribución de usuarios.",
    icono: <FaChartBar size={18} />,
    color: "#d97706",
    bg: "#fffbeb",
    ruta: "/superadmin/administracion",
    accion: "Ver estadísticas",
  },
  {
    id: 5,
    titulo: "Configura la plataforma",
    descripcion: "Ajusta los parámetros generales, permisos y opciones avanzadas del sistema.",
    icono: <FaCog size={18} />,
    color: "#0891b2",
    bg: "#ecfeff",
    ruta: "/superadmin/configuracion",
    accion: "Ir a Configuración",
  },
];

const STORAGE_KEY = "superadmin-onboarding-completados";

const AdminGeneral: React.FC = () => {
  const router = useRouter();
  const [completados, setCompletados] = useState<number[]>([]);
  const [expandido, setExpandido] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompletados(JSON.parse(saved));
    } catch {}
  }, []);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: QK.dashboardSuperadmin(),
    queryFn: async () => {
      const response = await apiFetch(`${API_URL}/dashboard/superadmin`);
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.code === 403 || json.code === 401) {
        throw new Error(`Acceso denegado (Error ${json.code || response.status}).`);
      }
      return json as DashboardResponse;
    },
    staleTime: 60_000,
  });
  const error = queryError ? (queryError as Error).message : "";

  function toggleCompletado(id: number) {
    setCompletados((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const progreso = Math.round((completados.length / ONBOARDING_STEPS.length) * 100);

  const getDotColor = (tipo: string) => {
    switch (tipo) {
      case "success": return "bg-emerald-500";
      case "error":   return "bg-rose-500";
      case "warning": return "bg-amber-500";
      default:        return "bg-blue-500";
    }
  };

  const estadisticasResumen = [
    { label: "Empresas adheridas", value: data?.empresasAdheridas || 0 },
    { label: "Empleados registrados", value: data?.empleadosRegistrados || 0 },
    { label: "Módulos publicados", value: data?.modulosPublicados || 0 },
    { label: "Incidencias abiertas", value: data?.incidenciasAbiertas || 0 },
    { label: "Nuevas empresas este mes", value: data?.empresasNuevasMes || 0 },
    { label: "Nuevos empleados este mes", value: data?.empleadosNuevosMes || 0 },
  ];

  const handleExportStats = () => {
    const rows = [
      ["Métrica", "Valor"],
      ["Empresas adheridas", String(data?.empresasAdheridas ?? 0)],
      ["Empleados registrados", String(data?.empleadosRegistrados ?? 0)],
      ["Módulos publicados", String(data?.modulosPublicados ?? 0)],
      ["Incidencias abiertas", String(data?.incidenciasAbiertas ?? 0)],
      ["Incidencias críticas", String(data?.incidenciasCriticas ?? 0)],
      ["Nuevas empresas este mes", String(data?.empresasNuevasMes ?? 0)],
      ["Nuevos empleados este mes", String(data?.empleadosNuevosMes ?? 0)],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estadisticas-superadmin-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    {
      label: "Empresas Adheridas",
      value: data?.empresasAdheridas || 0,
      icon: <FaBuilding size={20} />,
      color: "text-blue-600", bg: "bg-blue-50",
      trend: `+${data?.empresasNuevasMes || 0} este mes`,
      trendColor: "text-blue-500",
    },
    {
      label: "Empleados Registrados",
      value: data?.empleadosRegistrados || 0,
      icon: <FaUsers size={20} />,
      color: "text-indigo-600", bg: "bg-indigo-50",
      trend: `+${data?.empleadosNuevosMes || 0} este mes`,
      trendColor: "text-indigo-500",
    },
    {
      label: "Incidencias Abiertas",
      value: data?.incidenciasAbiertas || 0,
      icon: <FaExclamationTriangle size={20} />,
      color: "text-rose-600", bg: "bg-rose-50",
      trend: `${data?.incidenciasCriticas || 0} críticas`,
      trendColor: "text-rose-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="px-6 md:px-8 lg:px-10 w-full animate-fadeIn mt-6 pb-10 pt-20">

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── BIENVENIDA ──────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden mb-8 p-8 md:p-10"
        style={{ background: "linear-gradient(135deg, #0d1b2e 0%, #1b3f7e 60%, #2563eb 100%)" }}>
        {/* Decoración */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8, transparent)", transform: "translate(-30%, 30%)" }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FaRocket className="text-blue-300" size={16} />
              <span className="text-blue-300 text-sm font-semibold tracking-wider uppercase">
                Panel de Superadmin
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
              Bienvenido al centro<br />de control
            </h1>
            <p className="text-blue-200 text-sm max-w-md">
              Desde aquí puedes gestionar todo el ecosistema empresarial de Atalayas. Sigue la guía de inicio para configurar la plataforma.
            </p>
          </div>

          {/* Progreso onboarding */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-w-[200px] border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <FaStar className="text-amber-400" size={14} />
              <span className="text-white text-sm font-semibold">Configuración</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{progreso}%</div>
            <div className="text-blue-200 text-xs mb-3">
              {completados.length} de {ONBOARDING_STEPS.length} pasos completados
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${progreso}%`, background: "linear-gradient(90deg, #34d399, #10b981)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── ESTADÍSTICAS GENERALES ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Estadísticas</p>
            <h2 className="text-2xl font-bold mt-1" style={{ color: "var(--texto-primario)" }}>
              Visión general de la plataforma
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={handleExportStats}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-slate-200"
            >
              <FaFileAlt size={14} />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => router.push("/superadmin/administracion")}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-700"
            >
              <FaChartBar size={14} />
              Ver empresas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
          {[
            { value: data?.empresasAdheridas ?? 0, label: "Empresas adheridas", sub: "Ver empresas →", href: "/superadmin/administracion", color: "var(--azul-egm)" },
            { value: data?.empresasNuevasMes ?? 0, label: "Empresas nuevas este mes", sub: null, href: null, color: "var(--texto-primario)" },
            { value: data?.empleadosRegistrados ?? 0, label: "Empleados registrados", sub: "Ver empleados →", href: "/dashboard/admin?tab=empleados", color: "var(--verde-oliva)" },
            { value: data?.empleadosNuevosMes ?? 0, label: "Empleados nuevos este mes", sub: null, href: null, color: "var(--texto-muted)" },
            { value: data?.modulosPublicados ?? 0, label: "Módulos publicados", sub: "Ver formaciones →", href: "/dashboard/admin?tab=formaciones", color: "var(--texto-primario)" },
            { value: data?.incidenciasCriticas ?? 0, label: "Incidencias críticas", sub: null, href: null, color: "var(--texto-muted)" },
          ].map((stat, index) => (
            <div
              key={index}
              onClick={() => stat.href && router.push(stat.href)}
              className="rounded-2xl px-5 py-5 transition-colors"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", cursor: stat.href ? "pointer" : "default" }}
              onMouseEnter={(e) => { if (stat.href) (e.currentTarget as HTMLDivElement).style.background = "var(--gris-pagina)"; }}
              onMouseLeave={(e) => { if (stat.href) (e.currentTarget as HTMLDivElement).style.background = "var(--blanco)"; }}
            >
              <p className="text-2xl font-semibold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>{stat.label}</p>
              {stat.sub && (
                <p className="text-xs mt-2" style={{ color: stat.href ? "var(--azul-egm)" : "var(--texto-muted)" }}>{stat.sub}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ONBOARDING CHECKLIST */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--texto-primario)" }}>Guía de configuración</h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>Completa estos pasos para tener la plataforma lista</p>
            </div>
            {progreso === 100 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <FaCheckCircle /> ¡Todo listo!
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {ONBOARDING_STEPS.map((step, idx) => {
              const isCompleto = completados.includes(step.id);
              const isExp = expandido === step.id;

              return (
                <div
                  key={step.id}
                  className="bg-white rounded-2xl border transition-all duration-200 overflow-hidden"
                  style={{
                    borderColor: isCompleto ? "#bbf7d0" : isExp ? "#bfdbfe" : "#e2e8f0",
                    boxShadow: isExp ? "0 4px 20px rgba(37,99,235,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandido(isExp ? null : step.id)}
                  >
                    {/* Número / check */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-all"
                      style={{
                        background: isCompleto ? "#dcfce7" : step.bg,
                        color: isCompleto ? "#16a34a" : step.color,
                        border: `2px solid ${isCompleto ? "#86efac" : "transparent"}`,
                      }}
                    >
                      {isCompleto ? <FaCheckCircle size={16} /> : idx + 1}
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: isCompleto ? "var(--texto-placeholder)" : "var(--texto-primario)", textDecoration: isCompleto ? "line-through" : "none" }}>
                          {step.titulo}
                        </p>
                      </div>
                      {!isExp && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--texto-placeholder)" }}>{step.descripcion}</p>
                      )}
                    </div>

                    {/* Icono del paso */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: step.bg, color: step.color }}
                    >
                      {step.icono}
                    </div>

                    {/* Flecha */}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round"
                      className={`transition-transform shrink-0 ${isExp ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  {/* Expandido */}
                  {isExp && (
                    <div className="px-4 pb-4 pt-0" style={{ borderTop: "1px solid var(--gris-superficie)" }}>
                      <p className="text-sm mt-3 mb-4 leading-relaxed" style={{ color: "var(--texto-secundario)" }}>
                        {step.descripcion}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(step.ruta)}
                          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}
                        >
                          {step.accion} <FaArrowRight size={12} />
                        </button>
                        <button
                          onClick={() => toggleCompletado(step.id)}
                          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                          style={{
                            background: isCompleto ? "#fef2f2" : "#f0fdf4",
                            color: isCompleto ? "#dc2626" : "#16a34a",
                            border: `1px solid ${isCompleto ? "#fecaca" : "#bbf7d0"}`,
                          }}
                        >
                          {isCompleto ? (
                            <><FaCircle size={10} /> Marcar como pendiente</>
                          ) : (
                            <><FaCheckCircle size={12} /> Marcar como completado</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="flex flex-col gap-4">

          {/* Accesos rápidos */}
          <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "var(--marino)" }}>
            <div className="absolute -right-6 -top-6 opacity-10">
              <FaBuilding size={100} />
            </div>
            <div className="relative z-10">
              <h3 className="text-base font-bold mb-1">Gestión de Empresas</h3>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>Administra el estado y acceso de las empresas del área.</p>
              <button
                onClick={() => router.push("/superadmin/administracion")}
                className="font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 transition-colors"
                style={{ background: "var(--blanco)", color: "var(--texto-primario)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--gris-pagina)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--blanco)")}
              >
                Ir a Empresas <FaArrowRight size={12} />
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--azul-accion-light)", color: "var(--azul-accion)" }}>
              <FaFileAlt size={18} />
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: "var(--texto-primario)" }}>Solicitudes Pendientes</h3>
            <p className="text-sm mb-4" style={{ color: "var(--texto-muted)" }}>Revisa y aprueba las nuevas empresas que han solicitado unirse.</p>
            <button
              onClick={() => router.push("/superadmin/administracion")}
              className="font-bold text-sm flex items-center gap-2 transition-colors"
              style={{ color: "var(--azul-accion)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--azul-accion-hover)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--azul-accion)")}
            >
              Ver solicitudes <FaArrowRight size={12} />
            </button>
          </div>

          {/* Actividad reciente */}
          <div className="card p-6">
            <h2 className="text-base font-bold mb-4" style={{ color: "var(--texto-primario)" }}>Actividad reciente</h2>
            <div className="flex flex-col gap-4">
              {!data?.actividadReciente || data.actividadReciente.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="Sin actividad reciente"
                  description="El servidor aún no envía el log de acciones."
                  icon={<FaFileAlt size={20} />}
                />
              ) : (
                data.actividadReciente.map((item, index, array) => (
                  <div key={item.id || index} className="flex gap-3 items-start">
                    <div className="relative mt-1.5 shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${getDotColor(item.tipo)} ring-4 ring-slate-50 z-10 relative`} />
                      {index !== array.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-8" style={{ background: "var(--gris-superficie)" }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm leading-snug" style={{ color: "var(--texto-secundario)" }}>{item.texto}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--texto-placeholder)" }}>{item.tiempo}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminGeneral;