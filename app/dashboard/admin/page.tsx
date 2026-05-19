"use client";

import React, { useEffect, useState, useRef, useMemo, useTransition, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getModulos } from "@/lib/api/modulos";
import { getProgresoEmpresa } from "@/lib/api/progreso";
import { QK } from "@/lib/queryKeys";
import { listarDocumentosEmpresa } from "@/lib/api/documentos";
import type { Documento } from "@/lib/types/documentos";
import { BarChart3, Calendar, Check, ChevronDown, FileText, GraduationCap, Megaphone, TriangleAlert, Users, X } from "lucide-react";
import type { Modulo } from "@/lib/types/modulos";
import { apiFetch, API_URL } from "@/lib/api";
import DashboardHero from "@/components/ui/DashboardHero";
import { getEstadisticasAdminEmpresa, type EstadisticasEmpresaResponse, type FiltrosEstadisticas } from "@/lib/api/estadisticas";
import { exportStats, type ExportFormat, type StatsSection } from "@/lib/utils/statsExport";
import GestionIncidencias from "@/components/pages/GestionIncidencias";
import { DocumentosAdminTab } from "@/components/documentos/DocumentosAdminTab";
import { EventosAdminTab } from "@/components/eventos/EventosAdminTab";
import { AnunciosAdminTab } from "@/components/anuncios/AnunciosAdminTab";
import { FormacionesAdminTab } from "@/components/formaciones/FormacionesAdminTab";
import { EmpleadosAdminTab } from "@/components/empleados/EmpleadosAdminTab";
import { StatsTab } from "@/components/pages/StatsTab";
import type { Usuario } from "@/lib/types/usuario";
import { DEPARTAMENTOS } from "@/lib/constants/admin";


export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();

  const [activeTab, setActiveTab] = useState<"empleados" | "anuncios" | "formaciones" | "incidencias" | "estadisticas" | "documentos" | "eventos">("empleados");
  const [tabMenuOpen, setTabMenuOpen] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  // Empleados — siempre activo (necesario en empleados, formaciones, estadísticas y documentos)
  const { data: _empleadosData, isLoading: cargandoEmpleados } = useQuery<Usuario[]>({
    queryKey: QK.empleados(usuario?.empresaId),
    queryFn: () => apiFetch(`${API_URL}/users`).then((r) => r.json()),
    enabled: !!usuario?.empresaId,
  });
  const empleados = useMemo(() => Array.isArray(_empleadosData) ? _empleadosData : [], [_empleadosData]);

  // Módulos — siempre activo
  const { data: _formacionesData, isLoading: cargandoModulos } = useQuery<Modulo[]>({
    queryKey: QK.modulos(usuario?.empresaId),
    queryFn: () => getModulos(usuario?.empresaId),
    enabled: !!usuario?.empresaId,
  });
  const formaciones = useMemo(() => Array.isArray(_formacionesData) ? _formacionesData : [], [_formacionesData]);

  // Documentos — gestionado aquí igual que empleados para evitar re-loading al cambiar de tab
  const { data: documentosData = [], isLoading: cargandoDocumentos } = useQuery<Documento[]>({
    queryKey: QK.documentos(usuario?.empresaId),
    queryFn: listarDocumentosEmpresa,
    enabled: !!usuario?.empresaId,
  });

  // Progreso — siempre activo
  const { data: _progresoData } = useQuery({
    queryKey: QK.progresoEmpresa(usuario?.empresaId),
    queryFn: () => getProgresoEmpresa(usuario!.empresaId!),
    enabled: !!usuario?.empresaId,
  });
  const progresoEmpresa = useMemo(() => Array.isArray(_progresoData) ? _progresoData : [], [_progresoData]);

  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "error" } | null>(null);

  const mostrarToast = (msg: string, tipo: "ok" | "error" = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Stats tab state ───────────────────────────────────────────────────────────
  const [statsRango, setStatsRango] = useState<1 | 3 | 6 | 12 | 24>(6);
  const statsRangoLabel = statsRango === 1 ? "Último mes" : statsRango === 12 ? "Último año" : statsRango === 24 ? "Últimos 2 años" : `Últimos ${statsRango} meses`;
  const statsRangoLabelMin = statsRango === 1 ? "último mes" : statsRango === 12 ? "último año" : statsRango === 24 ? "últimos 2 años" : `últimos ${statsRango} meses`;
  const [statsDpto, setStatsDpto] = useState<string | null>(null);
  const [statsEstado, setStatsEstado] = useState<"todos" | "activos" | "inactivos">("activos");
  const [statsTipoMod, setStatsTipoMod] = useState<string | null>(null);
  const [isPendingStats, startStatsTransition] = useTransition();
  const cargandoStats = isPendingStats;

  const setStatsRangoT = useCallback((v: 1 | 3 | 6 | 12 | 24) => startStatsTransition(() => setStatsRango(v)), [startStatsTransition]);
  const setStatsDptoT = useCallback((v: string | null) => startStatsTransition(() => setStatsDpto(v)), [startStatsTransition]);
  const setStatsEstadoT = useCallback((v: "todos" | "activos" | "inactivos") => startStatsTransition(() => setStatsEstado(v)), [startStatsTransition]);
  const setStatsTipoModT = useCallback((v: string | null) => startStatsTransition(() => setStatsTipoMod(v)), [startStatsTransition]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [showPersonalizar, setShowPersonalizar] = useState(false);
  const personalizarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showPersonalizar) return;
    const handler = (e: MouseEvent) => {
      if (personalizarRef.current && !personalizarRef.current.contains(e.target as Node)) {
        setShowPersonalizar(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPersonalizar]);
  const [showKpis, setShowKpis] = useState(true);
  const [showMovimiento, setShowMovimiento] = useState(true);
  const [showEstadoFormacion, setShowEstadoFormacion] = useState(true);

  const hayPersonalizacion = !showKpis || !showMovimiento || !showEstadoFormacion;
  const resetVistaEstadisticas = () => {
    setShowKpis(true); setShowMovimiento(true); setShowEstadoFormacion(true);
  };
  const handleExportEstadisticas = () => {
    if (!statsEmpresa) return;
    const filtrosLabel = [
      statsDpto ? `Dpto: ${DEPARTAMENTOS.find(d => d.id === statsDpto)?.label ?? statsDpto}` : null,
      statsEstado !== "todos" ? `Estado: ${statsEstado}` : null,
      statsTipoMod ? `Módulo: ${statsTipoMod}` : null,
    ].filter(Boolean).join(" · ") || undefined;
    const sections: StatsSection[] = [
      {
        id: "kpis", title: "KPIs resumen",
        headers: ["Indicador", "Valor"],
        rows: [
          ["Total empleados", statsEmpresa.kpis.totalEmpleados],
          ["Altas este mes", statsEmpresa.kpis.altasEsteMes],
          ["Bajas este mes", statsEmpresa.kpis.bajasEsteMes],
          ["Tasa rotación anual %", statsEmpresa.kpis.tasaRotacion],
          ["Completitud formación %", statsEmpresa.kpis.pctCompletitudGlobal],
        ],
      },
      {
        id: "movimiento", title: "Incorporaciones y salidas por mes",
        headers: ["Mes", "Altas", "Bajas"],
        rows: statsEmpresa.movimientoMensual.map(m => [m.mes, m.altas, m.bajas]),
      },
      {
        id: "estado_formacion", title: "Estado de formación",
        headers: ["Estado", "Empleados"],
        rows: [
          ["Sin iniciar", statsEmpresa.empleadosSinFormacion],
          ["En progreso", statsEmpresa.empleadosEnProgreso],
          ["Completada", statsEmpresa.empleadosCompletados],
        ],
      },
    ];
    exportStats(exportFormat, {
      title: "Estadísticas de empresa",
      filtros: filtrosLabel,
      fileName: `estadisticas-empresa-${new Date().toISOString().split("T")[0]}`,
      sections,
    });
  };

  useEffect(() => {
    if (usuario && (usuario.codigoRol === "ROLE_EMPLEADO" || usuario.codigoRol === "INVITADO")) {
      router.replace("/dashboard");
    }
  }, [usuario, router]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "formaciones") setActiveTab("formaciones");
    if (tab === "anuncios") setActiveTab("anuncios");
    if (tab === "empleados") setActiveTab("empleados");
    if (tab === "estadisticas") setActiveTab("estadisticas");
    if (tab === "documentos") setActiveTab("documentos");
    if (tab === "eventos") setActiveTab("eventos");
    const editId = searchParams.get("edit");
    if (editId && formaciones.length > 0) {
      const f = formaciones.find((x) => x.moduloId === editId);
      if (f) {
        router.push(`/dashboard/admin/modulos/crear?edit=${editId}`);
      }
    }
  }, [searchParams, formaciones, router]);

  // Calcular estadísticas — useMemo para evitar setState doble y re-renders innecesarios
  const statsEmpresa = useMemo<EstadisticasEmpresaResponse | null>(() => {
    if (activeTab !== "estadisticas") return null;
    if (!empleados.length && !progresoEmpresa.length) return null;
    const filtros: FiltrosEstadisticas = {
      rangoMeses: statsRango,
      departamento: statsDpto,
      estado: statsEstado,
      tipoModulo: statsTipoMod,
    };
    return getEstadisticasAdminEmpresa(empleados, formaciones, progresoEmpresa, filtros);
  }, [activeTab, empleados, formaciones, progresoEmpresa, statsRango, statsDpto, statsEstado, statsTipoMod]);


  const tabs = [
    { key: "empleados" as const, label: "Empleados", icon: <Users size={20} />, accent: "#1B3F7E", badge: 0 },
    { key: "incidencias" as const, label: "Incidencias", icon: <TriangleAlert size={20} />, accent: "#B45309", badge: 0 },
    { key: "anuncios" as const, label: "Anuncios", icon: <Megaphone size={20} />, accent: "#0EA5E9", badge: 0 },
    { key: "formaciones" as const, label: "Módulos formativos", icon: <GraduationCap size={20} />, accent: "#7B4A85", badge: 0 },
    { key: "eventos" as const, label: "Eventos", icon: <Calendar size={20} />, accent: "#0F766E", badge: 0 },
    { key: "estadisticas" as const, label: "Estadísticas", icon: <BarChart3 size={20} />, accent: "#2D8653", badge: 0 },
    { key: "documentos" as const, label: "Documentos", icon: <FileText size={20} />, accent: "#4E6D7E", badge: 0 },
  ];

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .28s ease both}`}</style>
      <DashboardHero
        prefijo="Panel de "
        titulo="Administración"
        imagenFondo="/hero-administracion.webp"
      />

      <div className="px-10 lg:px-16 pt-10 pb-16">
        {/* Tabs — desktop */}
        <div className="hidden sm:block mb-8"
          style={{ borderBottom: "1px solid var(--gris-borde)" }}>
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative flex items-center gap-2 px-5 py-3 text-base font-semibold focus:outline-none"
                  animate={{ color: isActive ? tab.accent : "var(--texto-muted)" }}
                  transition={{ duration: 0.18 }}
                  style={{ background: "transparent", border: "none", cursor: "pointer" }}
                  whileHover={{ color: isActive ? tab.accent : "var(--texto-primario)" }}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge > 0 && !isActive && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none"
                      style={{ background: tab.accent, color: "#fff" }}>
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="admin-tab-underline"
                      style={{
                        position: "absolute",
                        bottom: -1,
                        left: 0,
                        right: 0,
                        height: 2,
                        borderRadius: 2,
                        background: tab.accent,
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Tabs — móvil (selector compacto con dropdown) */}
        <div className="sm:hidden mb-6 relative">
          {/* Botón selector — muestra tab activo */}
          {(() => {
            const activeTabData = tabs.find(t => t.key === activeTab)!;
            return (
              <motion.button
                onClick={() => setTabMenuOpen(o => !o)}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl focus:outline-none"
                style={{
                  background: "var(--blanco)",
                  border: `1.5px solid ${tabMenuOpen ? activeTabData.accent : "var(--gris-borde)"}`,
                  cursor: "pointer",
                  transition: "border-color 0.18s",
                }}
              >
                {/* Icono con color de acento */}
                <span style={{ color: activeTabData.accent }}>
                  {React.cloneElement(activeTabData.icon, { size: 20 })}
                </span>
                <span className="flex-1 text-left text-sm font-bold" style={{ color: "var(--texto-primario)" }}>
                  {activeTabData.label}
                </span>
                <motion.span
                  animate={{ rotate: tabMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: "var(--texto-muted)", display: "flex" }}
                >
                  <ChevronDown size={18} />
                </motion.span>
              </motion.button>
            );
          })()}

          {/* Dropdown de opciones */}
          <AnimatePresence>
            {tabMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.34, 1.2, 0.64, 1] }}
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-30"
                style={{
                  background: "var(--blanco)",
                  border: "1px solid var(--surface-border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                }}
              >
                {tabs.map((tab, idx) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <motion.button
                      key={tab.key}
                      onClick={() => { setActiveTab(tab.key); setTabMenuOpen(false); }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold focus:outline-none"
                      style={{
                        background: isActive ? tab.accent + "12" : "transparent",
                        borderBottom: idx < tabs.length - 1 ? "1px solid var(--surface-border)" : "none",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ color: isActive ? tab.accent : "var(--texto-muted)" }}>
                        {React.cloneElement(tab.icon, { size: 18 })}
                      </span>
                      <span style={{ color: isActive ? tab.accent : "var(--texto-primario)" }}>
                        {tab.label}
                      </span>
                      <span className="ml-auto flex items-center gap-1.5">
                        {tab.badge > 0 && (
                          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none"
                            style={{ background: tab.accent, color: "#fff" }}>
                            {tab.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tab.accent }} />
                        )}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Contenido de tabs con animación ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >

            {/* ── TAB EMPLEADOS ── */}
            {activeTab === "empleados" && (
              <EmpleadosAdminTab
                empleados={empleados}
                cargandoEmpleados={cargandoEmpleados}
                empresaId={usuario?.empresaId}
                onToast={mostrarToast}
              />
            )}

            {/* ── TAB ANUNCIOS ── */}
            {activeTab === "anuncios" && (
              <AnunciosAdminTab
                empresaId={usuario?.empresaId}
                onToast={mostrarToast}
              />
            )}

            {/* ── TAB MÓDULOS FORMATIVOS ── */}
            {activeTab === "formaciones" && (
              <FormacionesAdminTab
                formaciones={formaciones}
                cargandoModulos={cargandoModulos}
                empresaId={usuario?.empresaId}
                onToast={mostrarToast}
              />
            )}

            {/* ── TAB INCIDENCIAS ── */}
            {activeTab === "incidencias" && (
              <GestionIncidencias empresaId={usuario?.empresaId} />
            )}

            {/* ── TAB ESTADÍSTICAS ── */}
            {activeTab === "estadisticas" && (
              <StatsTab
                statsEmpresa={statsEmpresa}
                cargandoStats={cargandoStats}
                statsRango={statsRango}
                setStatsRangoT={setStatsRangoT}
                statsDpto={statsDpto}
                setStatsDptoT={setStatsDptoT}
                statsEstado={statsEstado}
                setStatsEstadoT={setStatsEstadoT}
                statsTipoMod={statsTipoMod}
                setStatsTipoModT={setStatsTipoModT}
                startStatsTransition={startStatsTransition}
                statsRangoLabel={statsRangoLabel}
                statsRangoLabelMin={statsRangoLabelMin}
                showKpis={showKpis}
                setShowKpis={setShowKpis}
                showMovimiento={showMovimiento}
                setShowMovimiento={setShowMovimiento}
                showEstadoFormacion={showEstadoFormacion}
                setShowEstadoFormacion={setShowEstadoFormacion}
                hayPersonalizacion={hayPersonalizacion}
                resetVistaEstadisticas={resetVistaEstadisticas}
                showPersonalizar={showPersonalizar}
                setShowPersonalizar={setShowPersonalizar}
                personalizarRef={personalizarRef}
                exportFormat={exportFormat}
                setExportFormat={setExportFormat}
                handleExportEstadisticas={handleExportEstadisticas}
                empleados={empleados}
                formaciones={formaciones}
              />
            )}

            {/* ── TAB EVENTOS ── */}
            {activeTab === "eventos" && (
              <EventosAdminTab esSuperAdmin={usuario?.codigoRol === "ROLE_ADMIN"} />
            )}

              </motion.div>
        </AnimatePresence>

        {/* DocumentosAdminTab oculto con CSS display para evitar remount al cambiar de tab. */}
        {usuario?.empresaId && (
          <div style={{ display: activeTab === "documentos" ? "block" : "none" }}>
            <DocumentosAdminTab
              empresaId={usuario.empresaId}
              documentosIniciales={documentosData}
              cargandoInicial={cargandoDocumentos}
              empleados={empleados.map((e) => ({
                usuarioId: e.usuarioId,
                nombre: e.nombre,
                apellidos: e.apellidos,
                departamento: e.departamento,
              }))}
              departamentos={DEPARTAMENTOS}
            />
          </div>
        )}
      </div>





      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.msg}
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
            className="fixed bottom-6 left-1/2 z-[300] flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
            style={{
              translateX: "-50%",
              background: toast.tipo === "error"
                ? "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)"
                : "linear-gradient(135deg, #1b3f7e 0%, #2563eb 100%)",
              color: "#fff",
            }}>
            {toast.tipo === "error"
              ? <X size={16} strokeWidth={2.5} />
              : <Check size={16} strokeWidth={2.5} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
