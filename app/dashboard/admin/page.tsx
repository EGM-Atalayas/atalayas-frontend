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
              <div className="relative">
                {/* Título */}
                <div className="mb-8 text-center sm:text-left">
                  <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                    Gestión de equipo
                  </h1>
                  <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                    {cargandoEmpleados ? "Cargando empleados…" : (
                      <>
                        {empleados.length} persona{empleados.length !== 1 ? "s" : ""}
                        {empleados.filter(e => !e.activo).length > 0 && (
                          <span style={{ color: "var(--error)", fontWeight: 600 }}>
                            {" "}· {empleados.filter(e => !e.activo).length} inactiva{empleados.filter(e => !e.activo).length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* ── Modal nuevo empleado ── */}
                <AnimatePresence>
                  {showFormEmpleado && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                      style={{ background: "var(--overlay, rgba(0,0,0,0.45))" }}
                      onClick={() => { if (!guardandoEmpleado) { setShowFormEmpleado(false); setErrorEmpleado(null); } }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 28, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ duration: 0.26, ease: [0.34, 1.15, 0.64, 1] }}
                        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
                        style={{ background: "var(--gris-panel)", maxHeight: "92dvh", boxShadow: "0 24px 56px rgba(0,0,0,0.18)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Cabecera con Grainient — azules EGM */}
                        <div className="relative flex items-center justify-between px-5 sm:px-6 shrink-0 overflow-hidden"
                          style={{ paddingTop: "20px", paddingBottom: "20px", background: "var(--tab-empleados)" }}>
                          <div className="absolute inset-0">
                            <Grainient
                              color1="#1B3F7E" color2="#2A5298" color3="#1040A0"
                              timeSpeed={0.18} warpStrength={1.1} warpFrequency={4.0}
                              warpSpeed={1.4} warpAmplitude={55} grainAmount={0.07}
                            />
                          </div>
                          <h2 className="text-2xl font-bold relative z-10" style={{ color: "#ffffff" }}>
                            Nuevo empleado
                          </h2>
                          <div className="relative z-10">
                            <IconButton variant="glass" label="Cerrar" onClick={() => { setShowFormEmpleado(false); setErrorEmpleado(null); }} />
                          </div>
                        </div>

                        {/* Formulario scrollable */}
                        <form
                          id="form-nuevo-empleado"
                          onSubmit={(e) => { e.preventDefault(); if (formEmpleado.nombre.trim() && formEmpleado.email.trim() && formEmpleado.password.trim()) handleCrearEmpleado(); }}
                          className="flex flex-col gap-4 px-5 sm:px-6 py-5 overflow-y-auto"
                          style={{ flex: 1, opacity: guardandoEmpleado ? 0.6 : 1, pointerEvents: guardandoEmpleado ? "none" : undefined, transition: "opacity 0.2s ease" }}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Nombre */}
                            <EmpCampo label="Nombre" required placeholder="María"
                              value={formEmpleado.nombre} onChange={(v) => setFormEmpleado({ ...formEmpleado, nombre: v })} />
                            {/* Apellidos */}
                            <EmpCampo label="Apellidos" placeholder="García López"
                              value={formEmpleado.apellidos} onChange={(v) => setFormEmpleado({ ...formEmpleado, apellidos: v })} />
                          </div>
                          {/* Email */}
                          <EmpCampo label="Email" required type="email" placeholder="m.garcia@empresa.com"
                            value={formEmpleado.email} onChange={(v) => setFormEmpleado({ ...formEmpleado, email: v })} />
                          {/* Contraseña */}
                          <EmpCampo label="Contraseña inicial" required type="password" placeholder="Mínimo 8 caracteres"
                            hint="El empleado podrá cambiarla en su primer acceso"
                            value={formEmpleado.password} onChange={(v) => setFormEmpleado({ ...formEmpleado, password: v })} />
                          {/* Divisor secciones */}
                          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", margin: "2px 0" }} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Puesto */}
                            <EmpCampo label="Puesto de trabajo" placeholder="Ej: Técnico de producción"
                              value={formEmpleado.puestoTrabajo} onChange={(v) => setFormEmpleado({ ...formEmpleado, puestoTrabajo: v })} />
                            {/* Departamento */}
                            <EmpSelect
                              label="Departamento"
                              value={formEmpleado.departamento}
                              onChange={(v) => setFormEmpleado({ ...formEmpleado, departamento: v })}
                              options={DEPARTAMENTOS}
                            />
                          </div>
                          {errorEmpleado && (
                            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.07)", color: "var(--error)" }}>
                              {errorEmpleado}
                            </p>
                          )}
                        </form>

                        {/* Footer */}
                        <div className="flex flex-col sm:flex-row sm:justify-end gap-2.5 px-5 sm:px-6 py-4 shrink-0"
                          style={{ borderTop: "1px solid rgba(0,0,0,0.07)", background: "#ffffff", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
                          <Button type="button" variant="secondary" className="w-full sm:w-auto order-2 sm:order-1"
                            onClick={() => { setShowFormEmpleado(false); setErrorEmpleado(null); }} disabled={guardandoEmpleado}>
                            Cancelar
                          </Button>
                          <Button type="submit" form="form-nuevo-empleado" className="w-full sm:w-auto order-1 sm:order-2"
                            disabled={guardandoEmpleado || !formEmpleado.nombre.trim() || !formEmpleado.email.trim() || !formEmpleado.password.trim()}>
                            {guardandoEmpleado ? "Creando…" : "Crear empleado"}
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Barra de herramientas */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-8">
                  {/* Buscador */}
                  <div className="flex flex-col w-full sm:w-64 shrink-0" style={{ minHeight: 48 }}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                        <Search size={15} />
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar empleado…"
                        value={empSearchInput}
                        onChange={(e) => { setEmpSearchInput(e.target.value); setEmpPage(0); }}
                        className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl outline-none transition-colors"
                        style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--tab-empleados)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
                      />
                      {empSearch && (
                        <button
                          onClick={() => { setEmpSearch(""); setEmpSearchInput(""); setEmpPage(0); }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-colors"
                          style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                        >
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs pl-1 mt-1.5 transition-opacity duration-150"
                      style={{ color: "var(--texto-muted)", opacity: empSearch ? 1 : 0, pointerEvents: empSearch ? "auto" : "none" }}>
                      {empleadosFiltrados.length === 0
                        ? "Sin resultados"
                        : `${empleadosFiltrados.length} resultado${empleadosFiltrados.length !== 1 ? "s" : ""} para "${empSearch}"`}
                    </p>
                  </div>

                  {/* Botones */}
                  <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
                    <input ref={inputImportRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) importarEmpleados(f); }} />
                    <Button variant="success" size="md" disabled={importando} onClick={() => inputImportRef.current?.click()}
                      style={{ flexShrink: 0 }}>
                      {importando
                        ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <><Upload size={15} /><span className="hidden sm:inline">&nbsp;Importar Excel</span></>}
                    </Button>
                    <Button variant="success" size="md" disabled={exportando || empleados.length === 0} onClick={exportarEmpleadosExcel}
                      style={{ flexShrink: 0 }}>
                      {exportando
                        ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        : <><Download size={15} /><span className="hidden sm:inline">&nbsp;Exportar Excel</span></>}
                    </Button>
                    <Button variant="primary" size="md" className="flex-1 sm:flex-none" onClick={() => { setShowFormEmpleado(true); setErrorEmpleado(null); }}>
                      <Plus size={15} />
                      <span className="hidden sm:inline">Añadir empleado</span>
                      <span className="sm:hidden">Añadir</span>
                    </Button>
                  </div>
                </div>

                {/* Tabla — ocupa todo el ancho */}
                <div>
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                    {cargandoEmpleados ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 rounded-full animate-spin"
                          style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
                      </div>
                    ) : empleados.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 sm:py-24 px-6 rounded-2xl text-center"
                        style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                          style={{ background: "var(--azul-egm-light)" }}>
                          <Users size={30} style={{ color: "var(--azul-egm)" }} strokeWidth={1.5} />
                        </div>
                        <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>No hay empleados todavía</p>
                        <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>Añade el primer empleado a tu empresa</p>
                        <Button variant="primary" size="md" onClick={() => { setShowFormEmpleado(true); setErrorEmpleado(null); }}>
                          <Plus size={14} /> Añadir empleado
                        </Button>
                      </div>
                    ) : empleadosFiltrados.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 sm:py-16 px-6 rounded-2xl text-center"
                        style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                          style={{ background: "rgba(27,63,126,0.08)" }}>
                          <Users size={28} strokeWidth={1.5} style={{ color: "var(--azul-egm)", opacity: 0.7 }} />
                        </div>
                        <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>Sin resultados</p>
                        <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>
                          Ningún empleado coincide con <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>"{empSearch}"</span>
                        </p>
                        <button onClick={() => { setEmpSearch(""); setEmpSearchInput(""); }}
                          className="text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                          style={{ background: "rgba(27,63,126,0.08)", color: "var(--azul-egm)", border: "1.5px solid rgba(27,63,126,0.20)" }}>
                          Limpiar búsqueda
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Vista desktop — tabla */}
                        <div className="hidden md:block">
                          <table className="w-full table-fixed">
                            <colgroup>
                              <col style={{ width: "35%" }} />
                              <col style={{ width: "21%" }} />
                              <col style={{ width: "18%" }} />
                              <col style={{ width: "14%" }} />
                              <col style={{ width: "12%" }} />
                            </colgroup>
                            <thead>
                              <tr style={{ background: "var(--azul-egm-light)", borderBottom: "1px solid var(--surface-border)" }}>
                                {([
                                  { label: "Empleado", col: "nombre" as EmpSortCol, cls: "pl-16 pr-6 text-left" },
                                  { label: "Puesto", col: "puesto" as EmpSortCol, cls: "px-6    text-left" },
                                  { label: "Departamento", col: "departamento" as EmpSortCol, cls: "px-6    text-left" },
                                  { label: "Perfil", col: "perfil" as EmpSortCol, cls: "px-6    text-left" },
                                  { label: "Estado", col: "estado" as EmpSortCol, cls: "px-6 text-left" },
                                ]).map(({ label, col, cls }) => (
                                  <th key={label} className={`py-3.5 ${cls}`} style={{ color: "var(--azul-egm)" }}>
                                    <button
                                      onClick={() => toggleEmpSort(col!)}
                                      className="inline-flex items-center gap-1 focus:outline-none select-none uppercase tracking-wider text-sm font-bold"
                                      style={{ cursor: "pointer", background: "none", border: "none", padding: 0, color: "inherit", fontFamily: "inherit" }}
                                    >
                                      {label}
                                      <span style={{
                                        opacity: empSort.col === col ? 1 : 0.25,
                                        transition: "opacity 0.15s, transform 0.2s",
                                        display: "flex",
                                        transform: empSort.col === col && empSort.dir === "asc" ? "rotate(180deg)" : "rotate(0deg)",
                                      }}>
                                        <ChevronDown size={15} strokeWidth={2.5} />
                                      </span>
                                    </button>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <AnimatePresence mode="wait">
                              <tbody key={empPage}>
                                {empleadosFiltrados.slice(empPage * PAGE_SIZE, (empPage + 1) * PAGE_SIZE).map((e, idx) => (
                                  <motion.tr
                                    key={e.usuarioId}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.12, ease: "easeOut" }}
                                    className="cursor-pointer"
                                    style={{
                                      borderBottom: idx < Math.min(empleadosFiltrados.length, PAGE_SIZE) - 1 ? "1px solid var(--surface-border)" : "none",
                                      borderLeft: `3px solid ${empleadoSeleccionado?.usuarioId === e.usuarioId ? "var(--azul-egm)" : idx % 2 === 0 ? "#ffffff" : "#f5f7fa"}`,
                                      background: empleadoSeleccionado?.usuarioId === e.usuarioId
                                        ? "var(--azul-egm-light)"
                                        : idx % 2 === 0 ? "#ffffff" : "#f5f7fa",
                                      transition: "border-left-color 0.15s, background 0.15s",
                                    }}
                                    onClick={() => setEmpleadoSeleccionado(
                                      empleadoSeleccionado?.usuarioId === e.usuarioId ? null : e
                                    )}
                                    onMouseEnter={(el) => {
                                      if (empleadoSeleccionado?.usuarioId !== e.usuarioId)
                                        el.currentTarget.style.background = "var(--gris-superficie)";
                                    }}
                                    onMouseLeave={(el) => {
                                      if (empleadoSeleccionado?.usuarioId !== e.usuarioId)
                                        el.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#f5f7fa";
                                    }}
                                  >
                                    <td className="py-3.5 pl-16 pr-6">
                                      <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-150"
                                          style={{
                                            background: "var(--azul-egm-light)",
                                            color: "var(--azul-egm)",
                                            outline: empleadoSeleccionado?.usuarioId === e.usuarioId ? "2px solid var(--azul-egm)" : "2px solid transparent",
                                            outlineOffset: "2px",
                                          }}>
                                          {getInitials(e.nombre, e.apellidos)}
                                        </div>
                                        <div>
                                          <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>
                                            {e.nombre} {e.apellidos}
                                          </p>
                                          <p className="text-sm mt-0.5" style={{ color: "var(--texto-secundario)", opacity: 0.7 }}>{e.email}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-6 text-base" style={{ color: "var(--texto-secundario)" }}>
                                      {e.puestoTrabajo ?? <span style={{ color: "var(--texto-muted)" }}>-</span>}
                                    </td>
                                    <td className="py-3.5 px-6">
                                      {e.departamento ? (
                                        <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                          style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9" }}>
                                          {DEPARTAMENTOS.find((d) => d.id === e.departamento)?.label ?? e.departamento}
                                        </span>
                                      ) : (
                                        <span className="text-base" style={{ color: "var(--texto-muted)" }}>-</span>
                                      )}
                                    </td>
                                    <td className="py-3.5 px-6">
                                      <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                        style={e.codigoRol === "ROLE_ADMIN_EMPRESA"
                                          ? { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }
                                          : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                        {e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-6">
                                      <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                        style={e.activo
                                          ? { background: "var(--exito-light)", color: "var(--exito)" }
                                          : { background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                        {e.activo ? "Activo" : "Inactivo"}
                                      </span>
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </AnimatePresence>
                          </table>
                          {/* Paginación desktop empleados */}
                          {empleadosFiltrados.length > PAGE_SIZE && (() => {
                            const totalPages = Math.ceil(empleadosFiltrados.length / PAGE_SIZE);
                            const pages = Array.from({ length: totalPages }, (_, i) => i);
                            return (
                              <div className="flex items-center justify-center gap-1 px-5 py-4" style={{ borderTop: "1px solid var(--surface-border)" }}>
                                {/* Botón anterior */}
                                <motion.button
                                  onClick={() => setEmpPage(p => Math.max(0, p - 1))}
                                  disabled={empPage === 0}
                                  whileHover={empPage !== 0 ? { scale: 1.05 } : {}}
                                  whileTap={empPage !== 0 ? { scale: 0.95 } : {}}
                                  className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-semibold disabled:opacity-30"
                                  style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--surface-border)", cursor: empPage === 0 ? "default" : "pointer" }}
                                >
                                  <ChevronLeft size={15} strokeWidth={2} />
                                  Anterior
                                </motion.button>

                                {/* Números */}
                                <div className="flex items-center gap-1 mx-1">
                                  {pages.map(p => (
                                    <motion.button
                                      key={p}
                                      onClick={() => setEmpPage(p)}
                                      whileHover={p !== empPage ? { scale: 1.08, background: "var(--gris-superficie)" } : {}}
                                      whileTap={{ scale: 0.92 }}
                                      animate={p === empPage
                                        ? { background: "#1B3F7E", color: "#ffffff" }
                                        : { background: "transparent", color: "var(--texto-secundario)" }
                                      }
                                      transition={{ duration: 0.18, ease: [0.34, 1.2, 0.64, 1] }}
                                      className="w-9 h-9 rounded-xl text-sm font-semibold"
                                      style={{ border: p === empPage ? "none" : "1px solid transparent", cursor: "pointer" }}
                                    >{p + 1}</motion.button>
                                  ))}
                                </div>

                                {/* Botón siguiente */}
                                <motion.button
                                  onClick={() => setEmpPage(p => p + 1)}
                                  disabled={(empPage + 1) * PAGE_SIZE >= empleadosFiltrados.length}
                                  whileHover={(empPage + 1) * PAGE_SIZE < empleadosFiltrados.length ? { scale: 1.05 } : {}}
                                  whileTap={(empPage + 1) * PAGE_SIZE < empleadosFiltrados.length ? { scale: 0.95 } : {}}
                                  className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-semibold disabled:opacity-30"
                                  style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--surface-border)", cursor: (empPage + 1) * PAGE_SIZE >= empleadosFiltrados.length ? "default" : "pointer" }}
                                >
                                  Siguiente
                                  <ChevronRight size={15} strokeWidth={2} />
                                </motion.button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Vista móvil — tarjetas */}
                        <div className="md:hidden flex flex-col">
                          {empleadosFiltrados.slice(empPage * PAGE_SIZE_MOBILE, (empPage + 1) * PAGE_SIZE_MOBILE).map((e, idx) => {
                            const isSelected = empleadoSeleccionado?.usuarioId === e.usuarioId;
                            return (
                              <motion.div
                                key={e.usuarioId}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18, delay: idx * 0.04, ease: "easeOut" }}
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() => setEmpleadoSeleccionado(isSelected ? null : e)}
                                style={{
                                  padding: "12px 16px",
                                  borderBottom: idx < Math.min(empleadosFiltrados.length, PAGE_SIZE_MOBILE) - 1 ? "1px solid var(--surface-border)" : "none",
                                  borderLeft: `3px solid ${isSelected ? "var(--azul-egm)" : "transparent"}`,
                                  background: isSelected ? "var(--azul-egm-light)" : idx % 2 === 0 ? "#ffffff" : "#f5f7fa",
                                  transition: "border-left-color 0.15s, background 0.15s",
                                }}
                              >
                                {/* Avatar con dot de estado */}
                                <div className="relative shrink-0">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "2px solid var(--azul-egm)" }}>
                                    {getInitials(e.nombre, e.apellidos)}
                                  </div>
                                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                                    style={{ background: e.activo ? "var(--exito)" : "var(--texto-muted)" }} />
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <p className="text-sm font-semibold truncate min-w-0 flex-1" style={{ color: "var(--texto-primario)" }}>
                                      {e.nombre} {e.apellidos}
                                    </p>
                                    <span className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full"
                                      style={e.codigoRol === "ROLE_ADMIN_EMPRESA"
                                        ? { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }
                                        : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                      {e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Admin" : "Emp."}
                                    </span>
                                  </div>
                                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--texto-muted)" }}>
                                    {e.puestoTrabajo ? `${e.puestoTrabajo} · ${e.email}` : e.email}
                                  </p>
                                </div>

                                {/* Chevron */}
                                <ChevronRight size={16} strokeWidth={2} style={{ color: "var(--texto-muted)", flexShrink: 0, opacity: isSelected ? 1 : 0.4 }} />
                              </motion.div>
                            );
                          })}
                          {/* Paginación móvil empleados */}
                          {empleadosFiltrados.length > PAGE_SIZE_MOBILE && (
                            <div className="flex items-center justify-center gap-2 px-5 py-4" style={{ borderTop: "1px solid var(--surface-border)" }}>
                              <motion.button
                                onClick={() => setEmpPage(p => Math.max(0, p - 1))}
                                disabled={empPage === 0}
                                whileHover={empPage !== 0 ? { scale: 1.05 } : {}}
                                whileTap={empPage !== 0 ? { scale: 0.95 } : {}}
                                className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-semibold disabled:opacity-30"
                                style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--surface-border)", cursor: empPage === 0 ? "default" : "pointer" }}
                              ><ChevronLeft size={15} strokeWidth={2} /></motion.button>
                              <span className="text-sm font-semibold px-2" style={{ color: "var(--texto-secundario)" }}>
                                {empPage + 1} / {Math.ceil(empleadosFiltrados.length / PAGE_SIZE_MOBILE)}
                              </span>
                              <motion.button
                                onClick={() => setEmpPage(p => p + 1)}
                                disabled={(empPage + 1) * PAGE_SIZE_MOBILE >= empleadosFiltrados.length}
                                whileHover={(empPage + 1) * PAGE_SIZE_MOBILE < empleadosFiltrados.length ? { scale: 1.05 } : {}}
                                whileTap={(empPage + 1) * PAGE_SIZE_MOBILE < empleadosFiltrados.length ? { scale: 0.95 } : {}}
                                className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-semibold disabled:opacity-30"
                                style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", border: "1px solid var(--surface-border)", cursor: (empPage + 1) * PAGE_SIZE_MOBILE >= empleadosFiltrados.length ? "default" : "pointer" }}
                              ><ChevronRight size={15} strokeWidth={2} /></motion.button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                </div>

                {/* ── Slide-over desktop ── */}
                <AnimatePresence>
                  {empleadoSeleccionado && (
                    <>
                      {/* Backdrop sutil */}
                      <motion.div
                        className="hidden md:block fixed inset-0 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ background: "rgba(15,25,35,0.25)" }}
                        onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }}
                      />
                      {/* Panel */}
                      <motion.div
                        className="hidden md:flex fixed top-0 right-0 h-full z-50 flex-col overflow-hidden"
                        style={{
                          width: 400,
                          background: "var(--azul-egm)",
                          borderLeft: "1px solid rgba(0,0,0,0.08)",
                          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
                        }}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 340, damping: 34 }}
                      >
                        {/* Header slide-over */}
                        <div className="px-6 flex items-center justify-between shrink-0"
                          style={{ height: 80, background: "var(--azul-egm)" }}>
                          <h3 className="text-xl font-bold" style={{ color: "#ffffff" }}>Ficha de empleado</h3>
                          <IconButton variant="glass" label="Cerrar" onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }} />
                        </div>

                        {/* Contenido scroll */}
                        <div className="flex-1 overflow-y-auto" style={{ background: "var(--gris-pagina)" }}>
                          <AnimatePresence mode="wait">
                            {editandoEmpleado ? (
                              <motion.div key="edit"
                                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="flex flex-col gap-6 px-6 py-6"
                              >
                                {/* Avatar mini — reactivo al formulario */}
                                <div className="flex items-center gap-3 py-4 px-4 rounded-2xl" style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "2px solid var(--azul-egm)" }}>
                                    {getInitials(
                                      editEmpleadoForm.nombre || empleadoSeleccionado.nombre,
                                      editEmpleadoForm.apellidos || empleadoSeleccionado.apellidos
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate" style={{ color: "var(--texto-primario)" }}>
                                      {(editEmpleadoForm.nombre || empleadoSeleccionado.nombre)}{" "}
                                      {(editEmpleadoForm.apellidos || empleadoSeleccionado.apellidos)}
                                    </p>
                                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--texto-muted)" }}>
                                      {editEmpleadoForm.email || empleadoSeleccionado.email}
                                    </p>
                                  </div>
                                </div>

                                {/* Campos */}
                                <div className="flex flex-col gap-4 p-5 rounded-2xl" style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                                  {[
                                    { key: "nombre", label: "Nombre" },
                                    { key: "apellidos", label: "Apellidos" },
                                    { key: "email", label: "Email", type: "email" },
                                    { key: "puestoTrabajo", label: "Puesto" },
                                  ].map(({ key, label, type = "text" }) => (
                                    <EmpCampo key={key} label={label} type={type}
                                      value={editEmpleadoForm[key as keyof NuevoEmpleadoForm]}
                                      onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, [key]: v }))} />
                                  ))}
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>Departamento</label>
                                    <EmpSelect label="" value={editEmpleadoForm.departamento}
                                      onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, departamento: v }))}
                                      options={DEPARTAMENTOS} placeholder="Sin departamento" />
                                  </div>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div key="view"
                                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="flex flex-col gap-6 px-6 py-6"
                              >
                                {/* Avatar + contacto */}
                                <div className="flex flex-col items-center gap-3 py-6 px-4 rounded-2xl"
                                  style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                                  {/* Avatar con dot de estado */}
                                  <div className="relative">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
                                      style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)", border: "3px solid var(--azul-egm)" }}>
                                      {getInitials(empleadoSeleccionado.nombre, empleadoSeleccionado.apellidos)}
                                    </div>
                                    <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white"
                                      style={{ background: empleadoSeleccionado.activo ? "var(--exito)" : "var(--texto-muted)" }} />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-base font-bold" style={{ color: "var(--texto-primario)" }}>
                                      {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellidos}
                                    </p>
                                    <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>{empleadoSeleccionado.email}</p>
                                  </div>
                                </div>

                                {/* Datos */}
                                <div className="flex flex-col gap-0" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--surface-border)" }}>
                                  {/* Estado */}
                                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Estado</span>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                      style={empleadoSeleccionado.activo
                                        ? { background: "var(--exito-light)", color: "var(--exito)" }
                                        : { background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                      {empleadoSeleccionado.activo ? "Activo" : "Inactivo"}
                                    </span>
                                  </div>
                                  {/* Perfil */}
                                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Perfil</span>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                      style={empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA"
                                        ? { background: "rgba(180,83,9,0.10)", color: "#B45309" }
                                        : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                      {empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"}
                                    </span>
                                  </div>
                                  {/* Departamento */}
                                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Departamento</span>
                                    {empleadoSeleccionado.departamento
                                      ? <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9" }}>
                                        {DEPARTAMENTOS.find((d) => d.id === empleadoSeleccionado.departamento)?.label ?? empleadoSeleccionado.departamento}
                                      </span>
                                      : <span className="text-sm" style={{ color: "var(--texto-muted)" }}>-</span>}
                                  </div>
                                  {/* Puesto */}
                                  {empleadoSeleccionado.puestoTrabajo && (
                                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Puesto</span>
                                      <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(78,109,126,0.10)", color: "#4E6D7E" }}>
                                        {empleadoSeleccionado.puestoTrabajo}
                                      </span>
                                    </div>
                                  )}
                                  {/* Alta */}
                                  <div className="flex items-center justify-between px-5 py-4" style={{ background: "var(--blanco)" }}>
                                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Alta</span>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                      style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)" }}>
                                      {formatFecha(empleadoSeleccionado.fechaRegistro)}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Footer acciones */}
                        <div className="px-6 py-5 flex flex-col gap-2.5 shrink-0"
                          style={{ borderTop: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                          {editandoEmpleado ? (
                            <div className="flex gap-2.5">
                              <Button variant="secondary" size="md" className="flex-1" onClick={() => setEditandoEmpleado(false)}>
                                Cancelar
                              </Button>
                              <Button variant="primary" size="md" className="flex-1" onClick={handleGuardarEditEmpleado} disabled={guardandoEditEmpleado}>
                                {guardandoEditEmpleado
                                  ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />&nbsp;Guardando…</>
                                  : "Guardar cambios"}
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button variant="primary" size="md" onClick={iniciarEditEmpleado}>
                                Editar empleado
                              </Button>
                              <Button variant="ghost" size="md"
                                onClick={() => setResetPass({ usuarioId: empleadoSeleccionado.usuarioId, nombre: empleadoSeleccionado.nombre })}>
                                Resetear contraseña
                              </Button>
                              <Button
                                variant={empleadoSeleccionado.activo ? "danger" : "success"}
                                size="md"
                                onClick={() => handleToggleEmpleado(empleadoSeleccionado.usuarioId, empleadoSeleccionado.activo, empleadoSeleccionado.nombre)}>
                                {empleadoSeleccionado.activo ? "Desactivar empleado" : "Activar empleado"}
                              </Button>
                </>
            )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Bottom sheet móvil */}
                <AnimatePresence>
                  {empleadoSeleccionado && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        className="md:hidden fixed inset-0"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ background: "rgba(15,25,35,0.35)", zIndex: 1090 }}
                        onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }}
                      />
                      <motion.div
                        className="md:hidden fixed bottom-0 left-0 right-0 rounded-t-3xl flex flex-col"
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 380, damping: 36 }}
                        style={{ background: "var(--gris-pagina)", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)", maxHeight: "88vh", zIndex: 1100 }}>

                        {/* Header mobile bottom sheet */}
                        <div className="rounded-t-3xl shrink-0"
                          style={{ background: "var(--azul-egm)" }}>
                          <div className="px-5 pt-2 pb-5">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
                                {editandoEmpleado ? "Editando empleado" : "Ficha de empleado"}
                              </p>
                              <IconButton variant="glass" label="Cerrar" onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }} />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
                                  style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "2px solid rgba(255,255,255,0.4)" }}>
                                  {getInitials(
                                    editandoEmpleado ? (editEmpleadoForm.nombre || empleadoSeleccionado.nombre) : empleadoSeleccionado.nombre,
                                    editandoEmpleado ? (editEmpleadoForm.apellidos || empleadoSeleccionado.apellidos) : empleadoSeleccionado.apellidos
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <p className="text-base font-bold truncate" style={{ color: "#fff" }}>
                                  {editandoEmpleado
                                    ? `${editEmpleadoForm.nombre || empleadoSeleccionado.nombre} ${editEmpleadoForm.apellidos || empleadoSeleccionado.apellidos}`
                                    : `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellidos}`}
                                </p>
                                <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                                  {editandoEmpleado ? (editEmpleadoForm.email || empleadoSeleccionado.email) : empleadoSeleccionado.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contenido scrollable */}
                        <div className="flex-1 overflow-y-auto">
                          <AnimatePresence mode="wait">
                            {editandoEmpleado ? (
                              <motion.div key="edit"
                                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="px-4 py-4">
                                <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: "var(--blanco)", border: "1px solid var(--surface-border)" }}>
                                  {/* Nombre + Apellidos en fila */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <EmpCampo label="Nombre"
                                      value={editEmpleadoForm.nombre}
                                      onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, nombre: v }))} />
                                    <EmpCampo label="Apellidos"
                                      value={editEmpleadoForm.apellidos}
                                      onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, apellidos: v }))} />
                                  </div>
                                  <EmpCampo label="Email" type="email"
                                    value={editEmpleadoForm.email}
                                    onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, email: v }))} />
                                  <EmpCampo label="Puesto"
                                    value={editEmpleadoForm.puestoTrabajo}
                                    onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, puestoTrabajo: v }))} />
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>Departamento</label>
                                    <EmpSelect label="" value={editEmpleadoForm.departamento}
                                      onChange={(v) => setEditEmpleadoForm((f) => ({ ...f, departamento: v }))}
                                      options={DEPARTAMENTOS} placeholder="Sin departamento" />
                                  </div>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div key="view"
                                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="px-4 py-4">
                                <div className="flex flex-col gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--surface-border)" }}>
                                  {[
                                    { label: "Estado", value: empleadoSeleccionado.activo ? "Activo" : "Inactivo", badge: empleadoSeleccionado.activo ? { bg: "var(--exito-light)", color: "var(--exito)" } : { bg: "var(--gris-superficie)", color: "var(--texto-muted)" } },
                                    { label: "Perfil", value: empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado", badge: empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? { bg: "rgba(180,83,9,0.10)", color: "#B45309" } : { bg: "var(--azul-egm-light)", color: "var(--azul-egm)" } },
                                    { label: "Departamento", value: DEPARTAMENTOS.find(d => d.id === empleadoSeleccionado.departamento)?.label, badge: { bg: "var(--lima-light)", color: "var(--verde-oliva)" } },
                                    { label: "Puesto", value: empleadoSeleccionado.puestoTrabajo, badge: { bg: "rgba(78,109,126,0.10)", color: "#4E6D7E" } },
                                    { label: "Alta", value: formatFecha(empleadoSeleccionado.fechaRegistro), badge: { bg: "var(--gris-superficie)", color: "var(--texto-secundario)" } },
                                  ].map(({ label, value, badge }, idx, arr) => (
                                    <div key={label} className="flex items-center justify-between px-4 py-3"
                                      style={{ borderBottom: idx < arr.length - 1 ? "1px solid var(--surface-border)" : "none", background: "var(--blanco)" }}>
                                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>{label}</span>
                                      {value
                                        ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>{value}</span>
                                        : <span className="text-xs" style={{ color: "var(--texto-muted)" }}>-</span>}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Footer fijo */}
                        <div className="px-5 py-4 shrink-0"
                          style={{ borderTop: "1px solid var(--surface-border)", background: "var(--blanco)", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
                          {editandoEmpleado ? (
                            <div className="flex gap-2.5">
                              <Button variant="secondary" size="md" className="flex-1" onClick={() => setEditandoEmpleado(false)}>
                                Cancelar
                              </Button>
                              <Button variant="primary" size="md" className="flex-1" onClick={handleGuardarEditEmpleado} disabled={guardandoEditEmpleado}>
                                {guardandoEditEmpleado
                                  ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />&nbsp;Guardando…</>
                                  : "Guardar cambios"}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <Button variant="primary" size="md" className="w-full" onClick={iniciarEditEmpleado}>
                                Editar empleado
                              </Button>
                              <Button variant="ghost" size="md" className="w-full"
                                onClick={() => setResetPass({ usuarioId: empleadoSeleccionado.usuarioId, nombre: empleadoSeleccionado.nombre })}>
                                Resetear contraseña
                              </Button>
                              <Button variant={empleadoSeleccionado.activo ? "danger" : "success"} size="md" className="w-full"
                                onClick={() => handleToggleEmpleado(empleadoSeleccionado.usuarioId, empleadoSeleccionado.activo, empleadoSeleccionado.nombre)}>
                                {empleadoSeleccionado.activo ? "Desactivar empleado" : "Activar empleado"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Import result notification */}
                {importResult && (
                  <div className="mt-6 rounded-2xl overflow-hidden fade-up" style={{ border: `1.5px solid ${importResult.errors.length === 0 ? "var(--exito)" : "#fcd34d"}`, background: importResult.errors.length === 0 ? "#f0fdf4" : "#fffbeb" }}>
                    <div className="px-5 py-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: importResult.errors.length === 0 ? "var(--exito-light)" : "#fde68a" }}>
                        {importResult.errors.length === 0 ? (
                          <Check size={16} strokeWidth={2.5} style={{ color: "var(--exito)" }} />
                        ) : (
                          <TriangleAlert size={16} strokeWidth={2} style={{ color: "#d97706" }} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold" style={{ color: importResult.errors.length === 0 ? "var(--exito)" : "#92400e" }}>
                          Importación completada
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: importResult.errors.length === 0 ? "var(--exito)" : "#b45309" }}>
                          {importResult.ok} empleado{importResult.ok !== 1 ? "s" : ""} importado{importResult.ok !== 1 ? "s" : ""} correctamente
                          {importResult.errors.length > 0 && ` · ${importResult.errors.length} error${importResult.errors.length !== 1 ? "es" : ""}`}
                        </p>
                        {importResult.errors.length > 0 && (
                          <div className="mt-3 flex flex-col gap-1 max-h-24 overflow-y-auto">
                            {importResult.errors.map((err, i) => (
                              <p key={i} className="text-xs" style={{ color: "#dc2626" }}>• {err}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => setImportResult(null)}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 transition-colors"
                        style={{ color: importResult.errors.length === 0 ? "var(--exito)" : "#92400e", background: importResult.errors.length === 0 ? "var(--exito-light)" : "#fde68a" }}>
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB ANUNCIOS ── */}
            {activeTab === "anuncios" && (
              <>
                {/* Título */}
                <div className="mb-8 text-center sm:text-left">
                  <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                    Gestión de anuncios
                  </h1>
                  <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                    {cargandoNoticias ? "Cargando anuncios…" : (() => {
                      const publicados = noticias.filter((n) => n.activo && (n.estado ?? "publicado") === "publicado").length;
                      const borradores = noticias.filter((n) => n.activo && n.estado === "borrador").length;
                      if (publicados === 0 && borradores === 0) return "Sin anuncios publicados";
                      return (
                        <>
                          {publicados} publicado{publicados !== 1 ? "s" : ""}
                          {borradores > 0 && (
                            <span style={{ color: "var(--advertencia)", fontWeight: 600 }}>
                              {" "}· {borradores} borrador{borradores !== 1 ? "es" : ""}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </p>
                </div>

                {/* Barra de herramientas */}
                <div className="flex flex-row items-center gap-2 sm:gap-3 mb-6">
                  {/* Buscador */}
                  <div className="relative flex-1 sm:w-64 sm:flex-none shrink-0">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                      <Search size={15} />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar anuncio…"
                      value={anuncioSearch}
                      onChange={(e) => setAnuncioSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-colors"
                      style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#0EA5E9")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
                    />
                  </div>
                  {/* Botones */}
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Button variant="primary" size="md" onClick={abrirCrear}>
                      <Plus size={14} />
                      <span className="hidden sm:inline">Nuevo anuncio</span>
                      <span className="sm:hidden">Nuevo</span>
                    </Button>
                  </div>
                </div>

                {showFormAnuncio && (
                  <div className="mb-8">
                    <FormAnuncio
                      initialValues={initialForm}
                      editando={editando}
                      submitting={submitting}
                      formError={formError}
                      onClose={cerrarForm}
                      onSubmit={handleSubmitAnuncio}
                      onPreview={() => { }}
                    />
                  </div>
                )}

                {/* Panel anuncios — tarjetas independientes */}
                {(() => {
                  const q = anuncioSearch.toLowerCase().trim();
                  const todas = noticias.filter((n) => n.activo);
                  const borradores = todas.filter((n) => n.estado === "borrador" && (!q || n.titulo?.toLowerCase().includes(q) || n.contenido?.toLowerCase().includes(q)));
                  const publicados = todas
                    .filter((n) => (n.estado ?? "publicado") === "publicado" && (!q || n.titulo?.toLowerCase().includes(q) || n.contenido?.toLowerCase().includes(q)))
                    .sort((a, b) => (b.fijado ? 1 : 0) - (a.fijado ? 1 : 0));
                  const hayNoticias = todas.length > 0;
                  if (!hayNoticias) return (
                    <div className="flex flex-col items-center justify-center py-14 sm:py-24 px-6 rounded-2xl text-center"
                      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                        style={{ background: "var(--azul-accion-light)" }}>
                        <Megaphone size={30} style={{ color: "var(--azul-accion)" }} strokeWidth={1.5} />
                      </div>
                      <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>Todavía no hay anuncios</p>
                      <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>Crea el primer anuncio para que lo vean tus empleados</p>
                      <Button variant="primary" size="md" onClick={abrirCrear}>
                        <Plus size={14} /> Nuevo anuncio
                      </Button>
                    </div>
                  );
                  if (q && borradores.length === 0 && publicados.length === 0) return (
                    <div className="flex flex-col items-center justify-center py-14 sm:py-20 px-6 text-center rounded-2xl"
                      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                        style={{ background: "rgba(27,63,126,0.08)" }}>
                        <Search size={28} strokeWidth={1.5} style={{ color: "var(--azul-egm)", opacity: 0.7 }} />
                      </div>
                      <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>Sin resultados</p>
                      <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>No hay anuncios que coincidan con <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>"{anuncioSearch}"</span></p>
                      <button onClick={() => setAnuncioSearch("")} className="text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                        style={{ background: "rgba(27,63,126,0.08)", color: "var(--azul-egm)", border: "1.5px solid rgba(27,63,126,0.20)" }}>
                        Limpiar búsqueda
                      </button>
                    </div>
                  );

                  /* Card compartida para borrador y publicado — misma estructura que TarjetaCurso */
                  return (
                    <>
                      {/* Borradores */}
                      {borradores.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center gap-2.5 mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#92400e" }}>Borradores</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#fde68a", color: "#78350f" }}>{borradores.length}</span>
                            <div className="flex-1 h-px" style={{ background: "#fcd34d" }} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {borradores.map((n) => (
                              <AnuncioCard
                                key={n.anuncioId}
                                n={n}
                                esBorrador={true}
                                publicandoId={publicandoId}
                                abrirEditar={abrirEditar}
                                publicarBorrador={publicarBorrador}
                                handleEliminarBorrador={handleEliminarBorrador}
                                handleDesactivarAnuncio={handleDesactivarAnuncio}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Publicados */}
                      {publicados.length === 0 ? (
                        <div className="rounded-2xl flex flex-col items-center justify-center py-14 sm:py-24 px-6 text-center"
                          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                            style={{ background: "var(--azul-accion-light)" }}>
                            <Megaphone size={30} style={{ color: "var(--azul-accion)" }} strokeWidth={1.5} />
                          </div>
                          <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>No hay anuncios publicados</p>
                          <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>Publica uno de tus borradores o crea un anuncio nuevo</p>
                          <Button variant="primary" size="md" onClick={abrirCrear}>
                            <Plus size={14} /> Nuevo anuncio
                          </Button>
                        </div>
                      ) : (
                        <div>
                          {borradores.length > 0 && (
                            <div className="flex items-center gap-2.5 mb-4">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Publicados</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>{publicados.length}</span>
                              <div className="flex-1 h-px" style={{ background: "var(--gris-borde)" }} />
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {publicados.map((n) => (
                              <AnuncioCard
                                key={n.anuncioId}
                                n={n}
                                esBorrador={false}
                                publicandoId={publicandoId}
                                abrirEditar={abrirEditar}
                                publicarBorrador={publicarBorrador}
                                handleEliminarBorrador={handleEliminarBorrador}
                                handleDesactivarAnuncio={handleDesactivarAnuncio}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
               </>
            )}

            {/* ── Modal confirmación anuncio ── */}
            <AnimatePresence>
              {confirmAnuncio && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 flex items-center justify-center p-4"
                  style={{ zIndex: 1200, background: "rgba(0,0,0,0.45)" }}
                  onClick={() => setConfirmAnuncio(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="rounded-2xl p-6 flex flex-col items-center text-center gap-4 w-full max-w-xs"
                    style={{ background: "var(--blanco)", boxShadow: "0 24px 56px rgba(0,0,0,0.22)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Icono */}
                    <div className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: confirmAnuncio.tipo === "eliminar" ? "var(--error-light)" : "#FEF9C3" }}>
                      {confirmAnuncio.tipo === "eliminar"
                        ? <Trash2 size={26} style={{ color: "var(--error)" }} />
                        : <TriangleAlert size={26} style={{ color: "#D97706" }} />}
                    </div>
                    {/* Texto */}
                    <div>
                      <p className="font-bold text-lg" style={{ color: "var(--texto-primario)", letterSpacing: "-0.02em" }}>
                        {confirmAnuncio.tipo === "eliminar" ? "¿Eliminar borrador?" : "¿Desactivar anuncio?"}
                      </p>
                      <p className="text-sm mt-1.5" style={{ color: "var(--texto-muted)" }}>
                        {confirmAnuncio.tipo === "eliminar"
                          ? "Se borrará permanentemente. Esta acción no se puede deshacer."
                          : "El anuncio dejará de ser visible para los empleados. Esta acción no se puede deshacer."}
                      </p>
                    </div>
                    {/* Botones */}
                    <div className="flex flex-col gap-2 w-full">
                      <Button variant="primary" size="md" className="w-full justify-center" onClick={() => setConfirmAnuncio(null)}>
                        Cancelar
                      </Button>
                      <Button variant="danger" size="md" className="w-full justify-center" onClick={ejecutarConfirmAnuncio}>
                        {confirmAnuncio.tipo === "eliminar" ? "Eliminar borrador" : "Desactivar anuncio"}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>


        {/* ── Modal confirmación empleado ── */}
        <ModalConfirm
          abierto={!!confirmEmpleado}
          titulo={confirmEmpleado?.activo ? "¿Desactivar empleado?" : "¿Activar empleado?"}
          descripcion={
            confirmEmpleado?.activo
              ? `${confirmEmpleado.nombre} perderá el acceso a la plataforma.`
              : `${confirmEmpleado?.nombre} recuperará el acceso a la plataforma.`
          }
          textoConfirmar={confirmEmpleado?.activo ? "Desactivar empleado" : "Activar empleado"}
          variante={confirmEmpleado?.activo ? "danger" : "success"}
          onConfirmar={ejecutarToggleEmpleado}
          onCancelar={() => setConfirmEmpleado(null)}
        />

        {/* ── Modal confirmación toggle módulo ── */}
        <ModalConfirm
          abierto={!!confirmModulo}
          titulo={confirmModulo?.modulo.activo ? "¿Desactivar módulo?" : "¿Activar módulo?"}
          descripcion={
            confirmModulo?.modulo.activo
              ? "Dejará de ser visible para los empleados."
              : "Volverá a ser visible para los empleados."
          }
          textoConfirmar={confirmModulo?.modulo.activo ? "Desactivar módulo" : "Activar módulo"}
          variante={confirmModulo?.modulo.activo ? "warning" : "success"}
          onConfirmar={ejecutarToggleModulo}
          onCancelar={() => setConfirmModulo(null)}
        />

        {/* ── Modal confirmación eliminar módulo ── */}
        <ModalConfirm
          abierto={!!confirmEliminarModulo}
          titulo="¿Eliminar módulo?"
          descripcion={`"${confirmEliminarModulo?.nombre}" se eliminará permanentemente. Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar módulo"
          variante="danger"
          onConfirmar={ejecutarEliminarModulo}
          onCancelar={() => setConfirmEliminarModulo(null)}
        />

        {/* ── Modal reset contraseña empleado ── */}
        <ModalResetPassword
          abierto={!!resetPass}
          nombreEmpleado={resetPass?.nombre ?? ""}
          cargando={guardandoResetPass}
          onConfirmar={ejecutarResetPassword}
          onCancelar={() => setResetPass(null)}
        />

        {/* ── TAB EVENTOS ── */}
        {activeTab === "eventos" && (
          <EventosAdminTab esSuperAdmin={usuario?.codigoRol === "ROLE_ADMIN"} />
        )}

                {/* ── TAB MÓDULOS FORMATIVOS ── */}
                {activeTab === "formaciones" && (
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                          Gestión de Módulos
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                          {cargandoModulos ? "Cargando módulos…" : `${formaciones.filter(f => f.activo).length} módulo${formaciones.filter(f => f.activo).length !== 1 ? "s" : ""} activo${formaciones.filter(f => f.activo).length !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            for (let i = localStorage.length - 1; i >= 0; i--) {
                              const key = localStorage.key(i);
                              if (key?.startsWith("egm_modulo_admin_")) localStorage.removeItem(key);
                            }
                            queryClient.invalidateQueries({ queryKey: QK.modulos(usuario?.empresaId) });
                            mostrarToast("Progreso de admin reiniciado");
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          style={{ background: "var(--blanco)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blanco)")}
                          title="Reiniciar progreso de admin"
                        >
                          < RefreshCw />
                          Reiniciar
                        </button>
                        <button
                          onClick={() => router.push("/dashboard/admin/modulos/crear")}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
                        >
                          < Plus />
                          Nuevo módulo
                        </button>
                      </div>
                    </div>

                    {/* Grid de módulos */}
                    {formaciones.length === 0 ? (
                      <div className="rounded-2xl flex flex-col items-center justify-center py-14 sm:py-20 px-6 text-center mb-6"
                        style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                          style={{ background: "#EDE9FE" }}>
                          <LibraryBig size={30} strokeWidth={1.5} style={{ color: "#7B4A85" }} />
                        </div>
                        <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>No hay módulos creados todavía</p>
                        <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>Crea el primer módulo formativo para tus empleados</p>
                        <Button variant="primary" size="md" onClick={() => router.push("/dashboard/admin/modulos/crear")}>
                          <Plus size={14} /> Crear módulo
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {formaciones.map((f) => {
                          const accentColor = tipoAccentColor[f.tipoModulo] ?? "var(--azul-egm)";
                          return (
                            <div
                              key={f.moduloId}
                              className="rounded-2xl overflow-hidden flex flex-col transition-shadow"
                              style={{
                                background: f.activo ? "var(--blanco)" : "var(--gris-pagina)",
                                border: `1px solid ${f.activo ? "var(--gris-borde)" : "var(--gris-borde)"}`,
                                opacity: f.activo ? 1 : 0.65,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                            >
                              {/* Imagen de portada o franja de color */}
                              {f.imagenPortadaUrl ? (
                                <div className="w-full h-36 relative overflow-hidden shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={f.imagenPortadaUrl} alt={f.nombre} className="w-full h-full object-cover"
                                    style={{ filter: f.activo ? "none" : "grayscale(100%)" }} />
                                  <div className="absolute inset-0" style={{ background: "rgba(10,20,40,0.18)" }} />
                                </div>
                              ) : (
                                <div className="w-full h-2 shrink-0"
                                  style={{ background: f.activo ? accentColor : "var(--gris-borde)" }} />
                              )}
                              <div className="p-5 flex flex-col flex-1">
                                {/* Badges */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {MODULO_TIPO_LABEL[f.tipoModulo] && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                      style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                      {MODULO_TIPO_LABEL[f.tipoModulo]}
                                    </span>
                                  )}
                                  {f.empresaId === null ? (
                                    <span className="text-xs px-2.5 py-1 rounded-full italic"
                                      style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                      EGM Global
                                    </span>
                                  ) : (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                      style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                                      Tu empresa
                                    </span>
                                  )}
                                  {!f.activo && (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                      style={{ background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db" }}>
                                      Desactivado
                                    </span>
                                  )}
                                </div>

                                {/* Title + description */}
                                <p className="text-base font-semibold mt-3 mb-1" style={{ color: "var(--texto-primario)" }}>
                                  {f.nombre}
                                </p>
                                <p className="text-sm line-clamp-2 flex-1" style={{ color: "var(--texto-muted)" }}>
                                  {f.descripcion}
                                </p>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 mt-4 pt-3"
                              style={{ borderTop: "1px solid var(--gris-borde)" }}>
                              {f.empresaId !== null ? (
                                <>
                                  <button onClick={() => router.push(`/dashboard/formacion/${f.moduloId}`)}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                    style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                                    Ver
                                  </button>
                                  <button onClick={() => handleEditModulo(f)}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                    Editar
                                  </button>
                                  <button onClick={() => handleDesactivarModulo(f)}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                    style={{ background: "#fef9c3", color: "#854d0e" }}>
                                    {f.activo ? "Desactivar" : "Activar"}
                                  </button>
                                  <button onClick={() => handleEliminarModulo(f.moduloId, f.nombre)}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                    style={{ background: "var(--error-light)", color: "var(--error)" }}>
                                    Eliminar
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-lg"
                                  style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>
                                  Solo lectura
                                </span>
                              )}
                            </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
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

// ── Select animado para el modal de empleado ─────────────────────────────────
function EmpSelect({ label, value, onChange, options, placeholder = "Sin departamento", hidePlaceholder = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { id: string; label: string }[];
  placeholder?: string;
  hidePlaceholder?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ bottom: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  function calcPos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ bottom: window.innerHeight - r.top + 6, left: r.left, width: r.width });
  }

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={wrapRef}>
      <label className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>{label}</label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { calcPos(); setOpen(p => !p); }}
        className="w-full flex items-center justify-between rounded-lg px-3.5 text-sm border transition-all duration-150 cursor-pointer"
        style={{
          height: "44px",
          borderColor: open ? "var(--azul-egm)" : "rgba(0,0,0,0.12)",
          boxShadow: open ? "0 0 0 3px rgba(22,50,105,0.08)" : "none",
          background: "#ffffff",
          color: selected ? "var(--texto-primario)" : "var(--texto-placeholder)",
          textAlign: "left",
        }}
      >
        <span>{selected?.label ?? placeholder}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ color: "var(--texto-muted)", display: "flex", flexShrink: 0 }}
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "fixed",
                bottom: pos.bottom,
                left: pos.left,
                width: pos.width,
                zIndex: 9999,
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: "10px",
                boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
                overflow: "hidden",
                transformOrigin: "bottom center",
              }}
            >
              {(hidePlaceholder ? options : [{ id: "", label: placeholder }, ...options]).map((opt) => {
                const isSelected = value === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className="w-full text-left px-3.5 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{
                      background: isSelected ? "var(--azul-egm-light)" : "transparent",
                      color: isSelected ? "var(--azul-egm)" : "var(--texto-primario)",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--gris-pagina)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ── Select estilado para barras de filtros ────────────────────────────────────

// ── Campo reutilizable para el modal de empleado ─────────────────────────────
function EmpCampo({ label, value, onChange, placeholder, required, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string; hint?: string;
}) {
  const [foco, setFoco] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (verPass ? "text" : "password") : type;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: "var(--texto-label)" }}>
        {label}{required && (
          <span className="relative group ml-0.5 inline-block" style={{ color: "#ef4444" }}>
            *
            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: "#1f2937", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", zIndex: 99 }}>
              Obligatorio
            </span>
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          className="w-full rounded-lg text-sm outline-none border transition-all duration-150"
          style={{
            height: "44px",
            paddingLeft: "14px",
            paddingRight: isPassword ? "40px" : "14px",
            borderColor: foco ? "var(--azul-egm)" : "rgba(0,0,0,0.12)",
            boxShadow: foco ? "0 0 0 3px rgba(22,50,105,0.08)" : "none",
            background: "#ffffff",
            color: "var(--texto-primario)",
          }}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVerPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs" style={{ color: "var(--texto-placeholder)" }}>{hint}</p>}
    </div>
  );
}
