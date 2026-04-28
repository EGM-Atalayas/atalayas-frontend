"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { API_URL, apiFetch } from "@/lib/api";

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
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [completados, setCompletados] = useState<number[]>([]);
  const [expandido, setExpandido] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompletados(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await apiFetch(`${API_URL}/dashboard/superadmin`);
        const json = await response.json().catch(() => ({}));
        if (!response.ok || json.code === 403 || json.code === 401) {
          throw new Error(`Acceso denegado (Error ${json.code || response.status}).`);
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || "Error de conexión al obtener los datos del panel.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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
    <div className="px-6 md:px-8 lg:px-10 w-full animate-fadeIn mt-6 pb-10">

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

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
              <div className={`text-xs font-medium mt-0.5 ${stat.trendColor}`}>{stat.trend}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ONBOARDING CHECKLIST */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Guía de configuración</h2>
              <p className="text-sm text-slate-500 mt-0.5">Completa estos pasos para tener la plataforma lista</p>
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
                        <p className={`text-sm font-semibold ${isCompleto ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {step.titulo}
                        </p>
                      </div>
                      {!isExp && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{step.descripcion}</p>
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
                    <div className="px-4 pb-4 pt-0 border-t border-slate-50">
                      <p className="text-sm text-slate-600 mt-3 mb-4 leading-relaxed">
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
          <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-10">
              <FaBuilding size={100} />
            </div>
            <div className="relative z-10">
              <h3 className="text-base font-bold mb-1">Gestión de Empresas</h3>
              <p className="text-sm text-slate-400 mb-4">Administra el estado y acceso de las empresas del área.</p>
              <button
                onClick={() => router.push("/superadmin/administracion")}
                className="bg-white text-slate-900 font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors"
              >
                Ir a Empresas <FaArrowRight size={12} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
              <FaFileAlt size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Solicitudes Pendientes</h3>
            <p className="text-sm text-slate-500 mb-4">Revisa y aprueba las nuevas empresas que han solicitado unirse.</p>
            <button
              onClick={() => router.push("/superadmin/administracion")}
              className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:text-blue-800 transition-colors"
            >
              Ver solicitudes <FaArrowRight size={12} />
            </button>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-4">Actividad reciente</h2>
            <div className="flex flex-col gap-4">
              {!data?.actividadReciente || data.actividadReciente.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="bg-slate-50 p-3 rounded-full mb-2">
                    <FaFileAlt size={20} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Sin actividad reciente</p>
                  <p className="text-xs text-slate-400 mt-1">El servidor aún no envía el log de acciones.</p>
                </div>
              ) : (
                data.actividadReciente.map((item, index, array) => (
                  <div key={item.id || index} className="flex gap-3 items-start">
                    <div className="relative mt-1.5 shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${getDotColor(item.tipo)} ring-4 ring-slate-50 z-10 relative`} />
                      {index !== array.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-100" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-700 leading-snug">{item.texto}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.tiempo}</p>
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