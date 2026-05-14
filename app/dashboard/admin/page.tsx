"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { getModulos } from "@/lib/api/modulos";
import { getProgresoEmpresa } from "@/lib/api/progreso";
import { QK } from "@/lib/queryKeys";
import { BarChart3, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Eye, EyeOff, FileText, GraduationCap, LibraryBig, Megaphone, Plus, RefreshCw, Search, SlidersHorizontal, TriangleAlert, Upload, Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import Grainient from "@/components/ui/Grainient";
import FormAnuncio from "@/components/ui/FormAnuncio";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import type { Modulo, ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL, type ModuloTipo } from "@/lib/types/modulos";
import { apiFetch, API_URL } from "@/lib/api";
import DashboardHero from "@/components/ui/DashboardHero";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList,
} from "recharts";
import { getEstadisticasAdminEmpresa, type EstadisticasEmpresaResponse, type FiltrosEstadisticas } from "@/lib/api/estadisticas";
import { exportStats, type ExportFormat, type StatsSection } from "@/lib/utils/statsExport";
import GestionIncidencias from "@/components/pages/GestionIncidencias";
import { DocumentosAdminTab } from "@/components/documentos/DocumentosAdminTab";
import ExcelJS from "exceljs";

const EMPTY_ANUNCIO: NoticiaInput = {
  titulo: "", contenido: "", esGlobal: false, empresaId: null, imagenUrl: null,
  enlaceUrl: null, enlaceTexto: null, videoUrl: null,
  adjuntoUrl: null, adjuntoNombre: null, estado: "publicado", fijado: false,
  categoria: null,
};

const ROL_EMPLEADO_ID = "ff7abc21-9380-4e51-a55c-e2427d2a4e2d";

const GRAD_EMP = "linear-gradient(135deg, #2d5a3d 0%, #3b8256 100%)";
const SHADOW_TXT = "0 1px 4px rgba(0,0,0,0.35), 0 0 2px rgba(0,0,0,0.5)";
const CATEGORIA_COLORS_DARK: Record<string, { bg: string; text: string; border: string }> = {
  General: { bg: "rgba(255,255,255,0.15)", text: "#e5e7eb", border: "rgba(255,255,255,0.25)" },
  Formacion: { bg: "rgba(59,130,246,0.45)", text: "#bfdbfe", border: "rgba(59,130,246,0.55)" },
  Seguridad: { bg: "rgba(239,68,68,0.45)", text: "#fca5a5", border: "rgba(239,68,68,0.55)" },
  Evento: { bg: "rgba(168,85,247,0.45)", text: "#d8b4fe", border: "rgba(168,85,247,0.55)" },
  Empresa: { bg: "rgba(52,211,153,0.45)", text: "#a7f3d0", border: "rgba(52,211,153,0.55)" },
};
const CATEGORIA_COLORS_LIGHT: Record<string, { bg: string; text: string; border: string }> = {
  General: { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  Formacion: { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  Seguridad: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  Evento: { bg: "#ede9fe", text: "#6b21a8", border: "#c4b5fd" },
  Empresa: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
};

function esNuevo(fecha: string) {
  return Date.now() - new Date(fecha).getTime() < 48 * 3600000;
}

const DEPARTAMENTOS = [
  { id: "PRODUCCION", label: "Producción" },
  { id: "RRHH", label: "RRHH" },
  { id: "LOGISTICA", label: "Logística" },
  { id: "CALIDAD", label: "Calidad" },
  { id: "MANTENIMIENTO", label: "Mantenimiento" },
  { id: "VENTAS", label: "Ventas" },
  { id: "ADMINISTRACION", label: "Administración" },
  { id: "IT", label: "IT" },
  { id: "SEGURIDAD", label: "Seguridad" },
  { id: "FORMACION", label: "Formación" },
];

interface Usuario {
  usuarioId: string;
  nombre: string;
  apellidos: string;
  email: string;
  codigoRol: string;
  nombreRol: string;
  puestoTrabajo: string | null;
  departamento: string | null;
  activo: boolean;
  fechaRegistro: string;
  fechaBaja?: string | null;
}

export interface NuevoEmpleadoForm {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  puestoTrabajo: string;
  departamento: string;
}

const EMPTY_EMPLEADO: NuevoEmpleadoForm = {
  nombre: "", apellidos: "", email: "", password: "", puestoTrabajo: "", departamento: "",
};

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

  const [activeTab, setActiveTab] = useState<"empleados" | "anuncios" | "formaciones" | "incidencias" | "estadisticas" | "documentos">("empleados");
  const [tabMenuOpen, setTabMenuOpen] = useState(false);

  const queryClient = useQueryClient();

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: empleados = [], isLoading: cargandoEmpleados } = useQuery<Usuario[]>({
    queryKey: QK.empleados(usuario?.empresaId),
    queryFn: () => apiFetch(`${API_URL}/users`).then((r) => r.json()),
    enabled: !!usuario?.empresaId,
    staleTime: 30_000,
  });

  const { data: noticias = [] } = useQuery({
    queryKey: QK.noticias(usuario?.empresaId),
    queryFn: () => getNoticias(usuario!.empresaId),
    enabled: !!usuario?.empresaId && activeTab === "anuncios",
    staleTime: 30_000,
  });

  const { data: formaciones = [] } = useQuery<Modulo[]>({
    queryKey: QK.modulos(usuario?.empresaId),
    queryFn: () => getModulos(usuario?.empresaId),
    enabled: !!usuario?.empresaId && activeTab === "formaciones",
    staleTime: 60_000,
  });

  const { data: progresoEmpresa = [], isLoading: cargandoProgreso } = useQuery({
    queryKey: QK.progresoEmpresa(usuario?.empresaId),
    queryFn: () => getProgresoEmpresa(usuario!.empresaId!),
    enabled: !!usuario?.empresaId,
    staleTime: 60_000,
  });

  // Refs for stats effect to avoid infinite loops from unstable default [] references
  const formacionesRef = useRef(formaciones);
  useEffect(() => { formacionesRef.current = formaciones; }, [formaciones]);
  const progresoEmpresaRef = useRef(progresoEmpresa);
  useEffect(() => { progresoEmpresaRef.current = progresoEmpresa; }, [progresoEmpresa]);
  const empleadosRef = useRef(empleados);
  useEffect(() => { empleadosRef.current = empleados; }, [empleados]);

  // ── Pagination ───────────────────────────────────────────────────────────────
  const PAGE_SIZE = 25;
  const PAGE_SIZE_MOBILE = 10;
  const [empPage, setEmpPage] = useState(0);

  // Resetear página al cruzar el breakpoint md (768px) para evitar slices vacíos
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = () => setEmpPage(0);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Filtros empleados ────────────────────────────────────────────────────────
  const [empSearch, setEmpSearch] = useState("");

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [showFormEmpleado, setShowFormEmpleado] = useState(false);

  const [formEmpleado, setFormEmpleado] = useState<NuevoEmpleadoForm>(EMPTY_EMPLEADO);
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);
  const [errorEmpleado, setErrorEmpleado] = useState<string | null>(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Usuario | null>(null);
  const [editandoEmpleado, setEditandoEmpleado] = useState(false);
  const [editEmpleadoForm, setEditEmpleadoForm] = useState<NuevoEmpleadoForm>(EMPTY_EMPLEADO);

  const inputImportRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; errors: string[] } | null>(null);

  // ── Scroll lock — modal y slide-over ─────────────────────────────────────────
  useEffect(() => {
    if (showFormEmpleado || !!empleadoSeleccionado) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [showFormEmpleado, empleadoSeleccionado]);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "error" } | null>(null);

  const mostrarToast = (msg: string, tipo: "ok" | "error" = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const [showFormAnuncio, setShowFormAnuncio] = useState(false);
  const [editando, setEditando] = useState<Noticia | null>(null);
  const [initialForm, setInitialForm] = useState<NoticiaInput>(EMPTY_ANUNCIO);

  // ── Stats tab state ───────────────────────────────────────────────────────────
  const [statsRango, setStatsRango] = useState<3 | 6 | 12>(6);
  const [statsDpto, setStatsDpto] = useState<string | null>(null);
  const [statsEstado, setStatsEstado] = useState<"todos" | "activos" | "inactivos">("todos");
  const [statsTipoMod, setStatsTipoMod] = useState<string | null>(null);
  const [cargandoStats, setCargandoStats] = useState(false);
  const [statsEmpresa, setStatsEmpresa] = useState<EstadisticasEmpresaResponse | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [showPersonalizar, setShowPersonalizar] = useState(false);
  const [showKpis, setShowKpis] = useState(true);
  const [showMovimiento, setShowMovimiento] = useState(true);
  const [showProgreso, setShowProgreso] = useState(true);
  const [showEstadoFormacion, setShowEstadoFormacion] = useState(true);
  const [drillMes, setDrillMes] = useState<string | null>(null);

  const hayPersonalizacion = !showKpis || !showMovimiento || !showProgreso || !showEstadoFormacion;
  const resetVistaEstadisticas = () => {
    setShowKpis(true); setShowMovimiento(true); setShowProgreso(true); setShowEstadoFormacion(true);
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
        id: "progreso", title: "Progreso por módulo",
        headers: ["Módulo", "% completitud"],
        rows: statsEmpresa.progresoModulos.map(m => [m.nombre, m.porcentaje]),
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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showBorradores, setShowBorradores] = useState(true);

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
    const editId = searchParams.get("edit");
    if (editId && formaciones.length > 0) {
      const f = formaciones.find((x: Modulo) => x.moduloId === editId);
      if (f) {
        router.push(`/dashboard/admin/modulos/crear?edit=${editId}`);
      }
    }
  }, [searchParams, formaciones, router]);

  // Calcular estadísticas cuando se activa el tab o cambian los datos / filtros
  useEffect(() => {
    if (activeTab !== "estadisticas") return;

    // Si el dpto guardado ya no existe entre los empleados actuales, resetear
    if (statsDpto && empleados.length > 0) {
      const existe = empleados.some((e: Usuario) => e.departamento === statsDpto);
      if (!existe) {
        setStatsDpto(null);
        return; // el cambio dispara otro render
      }
    }

    setCargandoStats(true);
    try {
      const filtros: FiltrosEstadisticas = {
        rangoMeses: statsRango,
        departamento: statsDpto,
        estado: statsEstado,
        tipoModulo: statsTipoMod,
      };
      const stats = getEstadisticasAdminEmpresa(empleadosRef.current, formacionesRef.current, progresoEmpresaRef.current, filtros);
      setStatsEmpresa(stats);
    } finally {
      setCargandoStats(false);
    }
  }, [activeTab, empleados, statsRango, statsDpto, statsEstado, statsTipoMod]);

  const [guardandoEditEmpleado, setGuardandoEditEmpleado] = useState(false);

  const iniciarEditEmpleado = () => {
    if (!empleadoSeleccionado) return;
    setEditEmpleadoForm({
      nombre: empleadoSeleccionado.nombre,
      apellidos: empleadoSeleccionado.apellidos,
      email: empleadoSeleccionado.email,
      password: "",
      puestoTrabajo: empleadoSeleccionado.puestoTrabajo ?? "",
      departamento: empleadoSeleccionado.departamento ?? "",
    });
    setEditandoEmpleado(true);
  };

  const handleGuardarEditEmpleado = async () => {
    if (!empleadoSeleccionado) return;
    setGuardandoEditEmpleado(true);
    try {
      const res = await apiFetch(`${API_URL}/users/${empleadoSeleccionado.usuarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editEmpleadoForm.nombre.trim(),
          apellidos: editEmpleadoForm.apellidos.trim(),
          email: editEmpleadoForm.email.trim() || undefined, // ← si está vacío no lo manda
          puestoTrabajo: editEmpleadoForm.puestoTrabajo.trim() || null,
          departamento: editEmpleadoForm.departamento || null,
        }),
      });

      const data = await res.json();
      console.log("Respuesta del servidor:", data); // ← ahora verás el error real

      if (!res.ok) {
        throw new Error(data.message ?? "Error al guardar el empleado"); // ← usa data, no res.json()
      }
      queryClient.invalidateQueries({ queryKey: QK.empleados(usuario?.empresaId) });
      setEditandoEmpleado(false);
    } catch (err) {
      console.error("Error al guardar empleado:", err); // ← AÑADE

    }
    finally { setGuardandoEditEmpleado(false); }
  };

  const handleCrearEmpleado = async () => {
    if (!formEmpleado.nombre.trim() || !formEmpleado.email.trim() || !formEmpleado.password.trim()) {
      setErrorEmpleado("Nombre, email y contraseña son obligatorios");
      return;
    }
    setGuardandoEmpleado(true);
    setErrorEmpleado(null);
    try {
      const res = await apiFetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formEmpleado.nombre.trim(),
          apellidos: formEmpleado.apellidos.trim(),
          email: formEmpleado.email.trim(),
          password: formEmpleado.password,
          empresaId: usuario?.empresaId,
          rolId: ROL_EMPLEADO_ID,
          puestoTrabajo: formEmpleado.puestoTrabajo.trim() || null,
          departamento: formEmpleado.departamento || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Error al crear el empleado");
      }
      queryClient.invalidateQueries({ queryKey: QK.empleados(usuario?.empresaId) });
      setFormEmpleado(EMPTY_EMPLEADO);
      setShowFormEmpleado(false);
    } catch (err: unknown) {
      setErrorEmpleado(err instanceof Error ? err.message : "Error al crear el empleado");
    } finally {
      setGuardandoEmpleado(false);
    }
  };

  const handleToggleEmpleado = async (usuarioId: string, activo: boolean) => {
    const accion = activo ? "desactivar" : "activar";
    if (!confirm(`¿Seguro que quieres ${accion} este empleado?`)) return;
    try {
      if (activo) {
        await apiFetch(`${API_URL}/users/${usuarioId}/desactivar`, { method: "DELETE" });
      } else {
        await apiFetch(`${API_URL}/users/${usuarioId}/activar`, { method: "PATCH" });
      }
      queryClient.invalidateQueries({ queryKey: QK.empleados(usuario?.empresaId) });
      if (empleadoSeleccionado?.usuarioId === usuarioId) setEmpleadoSeleccionado(null);
    } catch (_err: unknown) { }
  };

  function abrirCrear(): void {
    setInitialForm({
      titulo: "", contenido: "", esGlobal: false, empresaId: usuario?.empresaId ?? null, imagenUrl: null,
      enlaceUrl: null, enlaceTexto: null, videoUrl: null,
      adjuntoUrl: null, adjuntoNombre: null, estado: "publicado", fijado: false,
      categoria: null,
    });
    setEditando(null);
    setShowFormAnuncio(true);
    setFormError(null);
  }

  function abrirEditar(n: Noticia): void {
    setInitialForm({
      titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal,
      empresaId: n.empresaId, imagenUrl: n.imagenUrl ?? null,
      enlaceUrl: n.enlaceUrl ?? null, enlaceTexto: n.enlaceTexto ?? null,
      videoUrl: n.videoUrl ?? null, adjuntoUrl: n.adjuntoUrl ?? null,
      adjuntoNombre: n.adjuntoNombre ?? null, estado: n.estado ?? "publicado",
      fijado: n.fijado ?? false, categoria: n.categoria ?? null,
    });
    setEditando(n);
    setShowFormAnuncio(true);
    setFormError(null);
  }

  function cerrarForm(): void {
    setShowFormAnuncio(false);
    setEditando(null);
    setInitialForm(EMPTY_ANUNCIO);
    setFormError(null);
  }

  async function handleSubmitAnuncio(data: NoticiaInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editando) await editarNoticia(editando.anuncioId, data);
      else await crearNoticia({ ...data, empresaId: usuario?.empresaId ?? null });
      queryClient.invalidateQueries({ queryKey: QK.noticias(usuario?.empresaId) });
      cerrarForm();
      mostrarToast(editando ? "Anuncio actualizado correctamente" : data.estado === "borrador" ? "Borrador guardado" : "Anuncio publicado correctamente");
    } catch (_err: unknown) { setFormError("Error al guardar. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  }

  async function handleDesactivarAnuncio(id: string): Promise<void> {
    try {
      await desactivarNoticia(id);
      queryClient.invalidateQueries({ queryKey: QK.noticias(usuario?.empresaId) });
      mostrarToast("Anuncio desactivado");
    } catch (_err: unknown) { }
  }

  async function publicarBorrador(n: Noticia): Promise<void> {
    try {
      await editarNoticia(n.anuncioId, {
        titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal,
        empresaId: n.empresaId, imagenUrl: n.imagenUrl ?? null,
        enlaceUrl: n.enlaceUrl ?? null, enlaceTexto: n.enlaceTexto ?? null,
        videoUrl: n.videoUrl ?? null, adjuntoUrl: n.adjuntoUrl ?? null,
        adjuntoNombre: n.adjuntoNombre ?? null, fijado: n.fijado ?? false,
        categoria: n.categoria ?? null, estado: "publicado",
      });
      queryClient.invalidateQueries({ queryKey: QK.noticias(usuario?.empresaId) });
      mostrarToast("Anuncio publicado correctamente");
    } catch (_err: unknown) { mostrarToast("Error al publicar el anuncio"); }
  }
  const handleEditModulo = (f: Modulo) => { router.push(`/dashboard/admin/modulos/crear?edit=${f.moduloId}`); };

  const handleDesactivarModulo = async (modulo: Modulo): Promise<void> => {
    const estaActivo = modulo.activo;
    const msg = estaActivo
      ? "¿Desactivar este módulo? Dejará de ser visible para los empleados."
      : "¿Activar este módulo? Volverá a ser visible para los empleados.";
    if (!confirm(msg)) return;
    try {
      let res;
      if (estaActivo) {
        res = await apiFetch(`${API_URL}/modulos/${modulo.moduloId}/desactivar`, { method: "PATCH" });
      } else {
        // Reactivar: PUT con activo: true preservando el resto de campos
        res = await apiFetch(`${API_URL}/modulos/${modulo.moduloId}`, {
          method: "PUT",
          body: JSON.stringify({
            nombre: modulo.nombre,
            descripcion: modulo.descripcion,
            tipoModulo: modulo.tipoModulo,
            audiencia: modulo.audiencia ?? "todos",
            activo: true,
            empresaId: modulo.empresaId,
            imagenPortadaUrl: modulo.imagenPortadaUrl ?? null,
          }),
        });
      }
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert((e as any).message ?? "Error"); return; }
      queryClient.invalidateQueries({ queryKey: QK.modulos(usuario?.empresaId) });
    } catch (_err: unknown) { alert("Error al cambiar el estado del módulo"); }
  };

  const handleEliminarModulo = async (moduloId: string): Promise<void> => {
    if (!confirm("¿Eliminar este módulo permanentemente? Esta acción no se puede deshacer.")) return;
    try {
      const res = await apiFetch(`${API_URL}/modulos/${moduloId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) { alert("Error al eliminar el módulo"); return; }
      queryClient.invalidateQueries({ queryKey: QK.modulos(usuario?.empresaId) });
    } catch (_err: unknown) { alert("Error al eliminar el módulo"); }
  };

  function getInitials(nombre: string, apellidos?: string | null): string {
    return [nombre, apellidos].filter(Boolean).join(" ").split(" ")
      .slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  }

  function formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  }

  const exportarEmpleadosExcel = async (): Promise<void> => {
    setExportando(true);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Empleados");

    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 20 },
      { header: "Apellidos", key: "apellidos", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Puesto", key: "puesto", width: 25 },
      { header: "Departamento", key: "departamento", width: 20 },
      { header: "Rol", key: "rol", width: 15 },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Fecha de alta", key: "fechaAlta", width: 18 },
    ];

    worksheet.getRow(1).eachCell((cell: any) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2D5A3D" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    empleados.forEach((e: Usuario) => {
      worksheet.addRow({
        nombre: e.nombre,
        apellidos: e.apellidos,
        email: e.email,
        puesto: e.puestoTrabajo ?? "",
        departamento: DEPARTAMENTOS.find((d) => d.id === e.departamento)?.label ?? e.departamento ?? "",
        rol: e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado",
        estado: e.activo ? "Activo" : "Inactivo",
        fechaAlta: formatFecha(e.fechaRegistro),
      });
    });

    const fecha = new Date().toISOString().split("T")[0];
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empleados_${fecha}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExportando(false);
    mostrarToast(`Excel exportado con ${empleados.length} empleados`);
  };

  const importarEmpleados = async (file: File): Promise<void> => {
    setImportando(true);
    setImportResult(null);
    const errores: string[] = [];
    let ok = 0;
    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      const filas: { rowNum: number; values: string[] }[] = [];
      worksheet.eachRow((row: any, rowIdx: number) => {
        if (rowIdx === 1) return;
        const values = (row.values as unknown[]).slice(1).map((v: unknown) => String(v ?? "").trim());
        if (values.some((v) => v)) filas.push({ rowNum: rowIdx, values });
      });
      for (const { rowNum, values } of filas as { rowNum: number; values: string[] }[]) {
        const [nombre, apellidos, email, puesto, dept] = values;
        if (!nombre || !email) { errores.push(`Fila ${rowNum}: nombre y email obligatorios`); continue; }
        try {
          const res = await apiFetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre,
              apellidos: apellidos || "",
              email,
              password: "Atalayas123!",
              empresaId: usuario?.empresaId,
              rolId: ROL_EMPLEADO_ID,
              puestoTrabajo: puesto || null,
              departamento: dept ? DEPARTAMENTOS.find((d) => d.label.toUpperCase() === dept.toUpperCase())?.id ?? dept.toUpperCase() : null,
            }),
          });
          if (res.ok) ok++;
          else {
            const err = await res.json().catch(() => ({}));
            errores.push(`${email}: ${err.message ?? "Error del servidor"}`);
          }
        } catch { errores.push(`${email}: Error de conexión`); }
      }
    } catch (_importErr: unknown) { errores.push("El archivo no es un Excel válido"); }
    setImportando(false);
    setImportResult({ ok, errors: errores });
    queryClient.invalidateQueries({ queryKey: QK.empleados(usuario?.empresaId) });
    if (errores.length === 0) {
      mostrarToast(`${ok} empleado${ok !== 1 ? "s" : ""} importado${ok !== 1 ? "s" : ""} correctamente`);
    } else if (ok > 0) {
      mostrarToast(`${ok} importado${ok !== 1 ? "s" : ""}, ${errores.length} con error`, "error");
    } else {
      mostrarToast("Error al importar el archivo", "error");
    }
  };

  // ── Ordenación tabla desktop ─────────────────────────────────────────────────
  type EmpSortCol = "nombre" | "puesto" | "departamento" | "perfil" | "estado" | null;
  const [empSort, setEmpSort] = useState<{ col: EmpSortCol; dir: "asc" | "desc" }>({ col: null, dir: "asc" });

  const toggleEmpSort = (col: Exclude<EmpSortCol, null>) => {
    setEmpSort(prev =>
      prev.col === col
        ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { col, dir: "asc" }
    );
    setEmpPage(0);
  };

  const resetEmpSort = () => { setEmpSort({ col: null, dir: "asc" }); setEmpPage(0); };

  // ── Empleados filtrados + ordenados (frontend) ───────────────────────────────
  const empleadosFiltrados = (() => {
    const q = empSearch.toLowerCase();
    const filtered = empleados.filter((e) =>
      !q || [e.nombre, e.apellidos, e.email, e.puestoTrabajo ?? ""].some((v) => v.toLowerCase().includes(q))
    );
    if (!empSort.col) return filtered;
    const dir = empSort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (empSort.col) {
        case "nombre":
          return dir * `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`, "es");
        case "puesto":
          return dir * (a.puestoTrabajo ?? "").localeCompare(b.puestoTrabajo ?? "", "es");
        case "departamento": {
          const da = DEPARTAMENTOS.find(d => d.id === a.departamento)?.label ?? "";
          const db = DEPARTAMENTOS.find(d => d.id === b.departamento)?.label ?? "";
          return dir * da.localeCompare(db, "es");
        }
        case "perfil": {
          const pa = a.codigoRol === "ROLE_ADMIN_EMPRESA" ? 0 : 1;
          const pb = b.codigoRol === "ROLE_ADMIN_EMPRESA" ? 0 : 1;
          return dir * (pa - pb);
        }
        case "estado":
          return dir * ((a.activo ? 0 : 1) - (b.activo ? 0 : 1));
        default:
          return 0;
      }
    });
  })();

  const tabs = [
    { key: "empleados"   as const, label: "Empleados",         icon: <Users size={20} />,         accent: "#1B3F7E" },
    { key: "incidencias" as const, label: "Incidencias",        icon: <TriangleAlert size={20} />, accent: "#B45309" },
    { key: "anuncios"    as const, label: "Anuncios",           icon: <Megaphone size={20} />,     accent: "#0A8A96" },
    { key: "formaciones" as const, label: "Módulos formativos", icon: <GraduationCap size={20} />, accent: "#7B4A85" },
    { key: "estadisticas"as const, label: "Estadísticas",       icon: <BarChart3 size={20} />,     accent: "#2D8653" },
    { key: "documentos"  as const, label: "Documentos",         icon: <FileText size={20} />,      accent: "#4E6D7E" },
  ];

  // Accent colors per modulo tipo for top strip
  const tipoAccentColor: Record<string, string> = {
    PREVENCION: "var(--error)",
    CALIDAD: "var(--azul-egm)",
    MEDIO_AMBIENTE: "var(--verde-oliva)",
    FORMACION_BASICA: "var(--exito)",
  };

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .28s ease both}`}</style>
      <DashboardHero
        prefijo="Panel de "
        titulo="Administración"
        imagenFondo="/background-admin.webp"
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
                      {isActive && (
                        <span className="ml-auto w-2 h-2 rounded-full shrink-0" style={{ background: tab.accent }} />
                      )}
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
                {empleados.length} persona{empleados.length !== 1 ? "s" : ""}
                {empleados.filter(e => !e.activo).length > 0 && (
                  <span style={{ color: "var(--error)", fontWeight: 600 }}>
                    {" "}· {empleados.filter(e => !e.activo).length} inactiva{empleados.filter(e => !e.activo).length !== 1 ? "s" : ""}
                  </span>
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
                  {/* Cabecera */}
                  <div className="flex items-center justify-between px-5 sm:px-6 shrink-0"
                    style={{ paddingTop: "20px", paddingBottom: "20px", position: "relative", background: "#2563EB" }}>
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                      <Grainient
                        color1="#1B3F7E" color2="#2563EB" color3="#1D4ED8"
                        timeSpeed={0.18} warpStrength={1.2} warpFrequency={4.0}
                        warpSpeed={1.5} warpAmplitude={60} grainAmount={0.08}
                        contrast={1.3} saturation={1.1} zoom={0.85}
                        style={{ width: "100%", height: "100%", display: "block" }}
                      />
                    </div>
                    <h2 className="text-2xl font-bold" style={{ color: "#ffffff", position: "relative", zIndex: 1 }}>
                      Nuevo empleado
                    </h2>
                    <div style={{ position: "relative", zIndex: 1 }}>
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
                    value={empSearch}
                    onChange={(e) => { setEmpSearch(e.target.value); setEmpPage(0); }}
                    className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl outline-none transition-colors"
                    style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--tab-empleados)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
                  />
                  {empSearch && (
                    <button
                      onClick={() => { setEmpSearch(""); setEmpPage(0); }}
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
                <Button variant="primary" size="md" disabled={importando} onClick={() => inputImportRef.current?.click()}
                  style={{ background: "#16a34a", border: "1px solid rgba(255,255,255,0.18)", flexShrink: 0 }}>
                  {importando
                    ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><Upload size={15} /><span className="hidden sm:inline">&nbsp;Importar Excel</span></>}
                </Button>
                <Button variant="primary" size="md" disabled={exportando || empleados.length === 0} onClick={exportarEmpleadosExcel}
                  style={{ background: "#16a34a", border: "1px solid rgba(255,255,255,0.18)", flexShrink: 0 }}>
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
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "var(--gris-pagina)" }}>
                      <Users size={22} color="var(--texto-muted)" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>No hay empleados todavía</p>
                    <p className="text-xs mt-1 mb-4" style={{ color: "var(--texto-muted)" }}>Añade el primer empleado a tu empresa</p>
                    <button onClick={() => setShowFormEmpleado(true)}
                      className="text-xs font-semibold px-4 py-2 rounded-xl"
                      style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                      Añadir el primero →
                    </button>
                  </div>
                ) : empleadosFiltrados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "var(--gris-pagina)" }}>
                      <Users size={22} color="var(--texto-muted)" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>Sin resultados</p>
                    <p className="text-xs mt-1 mb-4" style={{ color: "var(--texto-muted)" }}>Ningún empleado coincide con tu búsqueda</p>
                    <button onClick={() => { setEmpSearch(""); }}
                      className="text-xs font-semibold px-4 py-2 rounded-xl"
                      style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Vista desktop — tabla */}
                    <div className="hidden md:block">
                      <table className="w-full table-fixed">
                        <colgroup>
                          <col style={{ width: "30%" }} />
                          <col style={{ width: "19%" }} />
                          <col style={{ width: "19%" }} />
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "12%" }} />
                          <col style={{ width: "48px" }} />
                        </colgroup>
                        <thead>
                          <tr style={{ background: "var(--azul-egm-light)", borderBottom: "1px solid var(--surface-border)" }}>
                            {([
                              { label: "Empleado",     col: "nombre"       as EmpSortCol, pad: "pl-14 pr-6" },
                              { label: "Puesto",       col: "puesto"        as EmpSortCol, pad: "px-6"       },
                              { label: "Departamento", col: "departamento"  as EmpSortCol, pad: "px-6"       },
                              { label: "Perfil",       col: "perfil"        as EmpSortCol, pad: "px-6"       },
                              { label: "Estado",       col: "estado"        as EmpSortCol, pad: "pl-6 pr-6"  },
                            ]).map(({ label, col, pad }) => (
                              <th key={label} className={`text-left py-3.5 ${pad}`} style={{ color: "var(--azul-egm)" }}>
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
                                    <ChevronDown size={13} strokeWidth={2.5} />
                                  </span>
                                </button>
                              </th>
                            ))}
                            <th className="py-3.5 pr-3 text-right">
                              <motion.button
                                animate={{ opacity: empSort.col ? 1 : 0, scale: empSort.col ? 1 : 0.75 }}
                                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                onClick={resetEmpSort}
                                title="Quitar orden"
                                className="inline-flex items-center justify-center focus:outline-none"
                                style={{
                                  width: 30, height: 30, borderRadius: "50%",
                                  background: "rgba(255,255,255,0.52)",
                                  border: "1px solid rgba(255,255,255,0.80)",
                                  backdropFilter: "blur(10px)",
                                  WebkitBackdropFilter: "blur(10px)",
                                  boxShadow: "0 2px 8px rgba(27,63,126,0.18)",
                                  color: "var(--azul-egm)",
                                  cursor: empSort.col ? "pointer" : "default",
                                  flexShrink: 0,
                                  pointerEvents: empSort.col ? "auto" : "none",
                                }}
                              >
                                <RefreshCw size={14} strokeWidth={2.3} />
                              </motion.button>
                            </th>
                          </tr>
                        </thead>
                        <AnimatePresence mode="wait">
                        <tbody key={empPage}>
                          {empleadosFiltrados.slice(empPage * PAGE_SIZE, (empPage + 1) * PAGE_SIZE).map((e, idx) => (
                            <motion.tr
                              key={e.usuarioId}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18, delay: idx * 0.04, ease: "easeOut" }}
                              className="cursor-pointer"
                              style={{
                                borderBottom: idx < Math.min(empleadosFiltrados.length, PAGE_SIZE) - 1 ? "1px solid var(--surface-border)" : "none",
                                borderLeft: empleadoSeleccionado?.usuarioId === e.usuarioId ? "3px solid var(--azul-egm)" : "3px solid transparent",
                                background: empleadoSeleccionado?.usuarioId === e.usuarioId
                                  ? "var(--azul-egm-light)"
                                  : idx % 2 === 0 ? "#ffffff" : "#fafbfc",
                                transition: "border-left-color 0.15s, background 0.15s",
                              }}
                              onClick={() => setEmpleadoSeleccionado(
                                empleadoSeleccionado?.usuarioId === e.usuarioId ? null : e
                              )}
                              onMouseEnter={(el) => {
                                if (empleadoSeleccionado?.usuarioId !== e.usuarioId)
                                  el.currentTarget.style.background = "var(--gris-superficie)";
                              }}
                              onMouseLeave={(el: React.MouseEvent<HTMLTableRowElement>) => {
                                if (empleadoSeleccionado?.usuarioId !== e.usuarioId)
                                  el.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#fafbfc";
                              }}
                            >
                              <td className="py-3.5 pl-14 pr-6">
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
                                    <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>{e.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-6 text-base" style={{ color: "var(--texto-secundario)" }}>
                                {e.puestoTrabajo ?? <span style={{ color: "var(--texto-muted)" }}>—</span>}
                              </td>
                              <td className="py-3.5 px-6">
                                {e.departamento ? (
                                  <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                    style={{ background: "rgba(10,138,150,0.10)", color: "#0A8A96" }}>
                                    {DEPARTAMENTOS.find((d) => d.id === e.departamento)?.label ?? e.departamento}
                                  </span>
                                ) : (
                                  <span className="text-base" style={{ color: "var(--texto-muted)" }}>—</span>
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
                              <td className="py-3.5 pl-6 pr-6">
                                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                  style={e.activo
                                    ? { background: "var(--exito-light)", color: "var(--exito)" }
                                    : { background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                  {e.activo ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td />
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
                            background: isSelected ? "var(--azul-egm-light)" : idx % 2 === 0 ? "#ffffff" : "#fafbfc",
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
                      background: "#2563EB",
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
                      style={{ height: 80, borderBottom: "1px solid rgba(255,255,255,0.08)", position: "relative", background: "#2563EB" }}>
                      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                        <Grainient
                          color1="#1B3F7E" color2="#2563EB" color3="#1D4ED8"
                          timeSpeed={0.18} warpStrength={1.2} warpFrequency={4.0}
                          warpSpeed={1.5} warpAmplitude={60} grainAmount={0.08}
                          contrast={1.3} saturation={1.1} zoom={0.85}
                          style={{ width: "100%", height: "100%", display: "block" }}
                        />
                      </div>
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <h3 className="text-xl font-bold" style={{ color: "#ffffff" }}>Ficha de empleado</h3>
                      </div>
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <IconButton variant="glass" label="Cerrar" onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }} />
                      </div>
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
                              {empleadoSeleccionado.puestoTrabajo && (
                                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Puesto</span>
                                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                    {empleadoSeleccionado.puestoTrabajo}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Departamento</span>
                                {empleadoSeleccionado.departamento
                                  ? <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(10,138,150,0.10)", color: "#0A8A96" }}>
                                      {DEPARTAMENTOS.find((d) => d.id === empleadoSeleccionado.departamento)?.label ?? empleadoSeleccionado.departamento}
                                    </span>
                                  : <span className="text-sm" style={{ color: "var(--texto-muted)" }}>—</span>}
                              </div>
                              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Perfil</span>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                  style={empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA"
                                    ? { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }
                                    : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                  {empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--surface-border)", background: "var(--blanco)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Estado</span>
                                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                                  style={empleadoSeleccionado.activo
                                    ? { background: "var(--exito-light)", color: "var(--exito)" }
                                    : { background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                  {empleadoSeleccionado.activo ? "Activo" : "Inactivo"}
                                </span>
                              </div>
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
                          <Button
                            variant={empleadoSeleccionado.activo ? "danger" : "secondary"}
                            size="md"
                            onClick={() => handleToggleEmpleado(empleadoSeleccionado.usuarioId, empleadoSeleccionado.activo)}>
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

                  {/* Header con Grainient — igual que slide-over desktop */}
                  <div className="relative rounded-t-3xl overflow-hidden shrink-0"
                    style={{ background: "#2563EB" }}>
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                      <Grainient
                        color1="#1B3F7E" color2="#2563EB" color3="#1D4ED8"
                        timeSpeed={0.18} warpStrength={1.2} warpFrequency={4.0}
                        warpSpeed={1.5} warpAmplitude={60} grainAmount={0.08}
                        contrast={1.3} saturation={1.1} zoom={0.85}
                        style={{ width: "100%", height: "100%", display: "block" }}
                      />
                    </div>
                    <div className="relative z-10 px-5 pt-2 pb-5">
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
                              { label: "Puesto", value: empleadoSeleccionado.puestoTrabajo, badge: { bg: "var(--azul-egm-light)", color: "var(--azul-egm)" } },
                              { label: "Departamento", value: DEPARTAMENTOS.find(d => d.id === empleadoSeleccionado.departamento)?.label, badge: { bg: "rgba(10,138,150,0.10)", color: "#0A8A96" } },
                              { label: "Perfil", value: empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado", badge: empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? { bg: "var(--verde-oliva-light)", color: "var(--verde-oliva)" } : { bg: "var(--azul-egm-light)", color: "var(--azul-egm)" } },
                              { label: "Estado", value: empleadoSeleccionado.activo ? "Activo" : "Inactivo", badge: empleadoSeleccionado.activo ? { bg: "var(--exito-light)", color: "var(--exito)" } : { bg: "var(--gris-superficie)", color: "var(--texto-muted)" } },
                              { label: "Alta", value: formatFecha(empleadoSeleccionado.fechaRegistro), badge: { bg: "var(--gris-superficie)", color: "var(--texto-secundario)" } },
                            ].map(({ label, value, badge }, idx, arr) => (
                              <div key={label} className="flex items-center justify-between px-4 py-3"
                                style={{ borderBottom: idx < arr.length - 1 ? "1px solid var(--surface-border)" : "none", background: "var(--blanco)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>{label}</span>
                                {value
                                  ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>{value}</span>
                                  : <span className="text-xs" style={{ color: "var(--texto-muted)" }}>—</span>}
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
                        <Button variant={empleadoSeleccionado.activo ? "danger" : "secondary"} size="md" className="w-full"
                          onClick={() => handleToggleEmpleado(empleadoSeleccionado.usuarioId, empleadoSeleccionado.activo)}>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  Gestion de Anuncios
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>Comunica novedades a todos los empleados</p>
              </div>
              <button onClick={abrirCrear}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}>
                <Plus size={14} />
                Nuevo anuncio
              </button>
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

            {/* Panel borradores */}
            {(() => {
              const borradores = noticias.filter((n) => n.activo && n.estado === "borrador");
              const publicados = noticias.filter((n) => n.activo && (n.estado ?? "publicado") === "publicado");
              if (borradores.length === 0 && publicados.length === 0) return null;
              return (
                <>
                  {borradores.length > 0 && (
                    <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #fcd34d", background: "#fffbeb" }}>
                      <button onClick={() => setShowBorradores((v) => !v)} className="w-full flex items-center gap-2.5 px-4 py-3"
                        style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: "#fde68a", color: "#92400e", border: "1px solid #fcd34d" }}>
                          Borrador
                        </span>
                        <span className="text-sm font-semibold flex-1 text-left" style={{ color: "var(--texto-primario)" }}>
                          {borradores.length} {borradores.length === 1 ? "anuncio pendiente" : "anuncios pendientes"}
                        </span>
                        <ChevronDown size={14} strokeWidth={2.5} style={{ color: "#d97706", transition: "transform 0.2s", transform: showBorradores ? "rotate(0deg)" : "rotate(-90deg)" }} />
                      </button>
                      {showBorradores && (
                        <div className="flex flex-col" style={{ borderTop: "1px solid #bfdbfe" }}>
                          {borradores.map((n, i) => (
                            <div key={n.anuncioId} className="flex items-center gap-3 px-4 py-3"
                              style={{ borderTop: i > 0 ? "1px solid #dbeafe" : undefined, background: "var(--blanco)" }}>
                              {n.imagenUrl
                                ? <img src={n.imagenUrl} alt="" className="rounded-xl object-cover shrink-0" style={{ width: 44, height: 44 }} />
                                : <div className="rounded-xl shrink-0 flex items-center justify-center" style={{ width: 44, height: 44, background: "#eff6ff" }}>
                                  <FileText size={18} strokeWidth={1.8} style={{ color: "#93c5fd" }} />
                                </div>
                              }
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
                                  {n.titulo || "(Sin titulo)"}
                                </p>
                                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>
                                  {n.contenido ? n.contenido.replace(/[#*_`>]/g, "").slice(0, 90) + (n.contenido.length > 90 ? "…" : "") : "Sin contenido"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => abrirEditar(n)}
                                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                                  style={{ background: "var(--blanco)", color: "#2563eb", border: "1px solid #bfdbfe", transition: "background 0.18s ease, transform 0.18s ease" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1.06)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; e.currentTarget.style.transform = "scale(1)"; }}>
                                  Editar
                                </button>
                                <button onClick={() => publicarBorrador(n)}
                                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "#fff", border: "none", boxShadow: "0 2px 6px rgba(22,163,74,0.25)", transition: "opacity 0.18s ease, transform 0.18s ease" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.06)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}>
                                  Publicar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {publicados.length === 0 ? (
                    <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
                      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>No hay anuncios publicados</p>
                      <button onClick={abrirCrear}
                        className="text-xs font-semibold px-4 py-2 rounded-xl mt-4"
                        style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                        Crear el primero →
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Tarjetas destacadas (2 primeras) */}
                      {publicados.slice(0, 2).map((n) => (
                        <div key={n.anuncioId}
                          className="relative rounded-xl overflow-hidden cursor-pointer group"
                          style={{ outline: "1.5px solid transparent", boxShadow: "0 0 0 rgba(0,0,0,0)", transition: "outline-color 0.25s, box-shadow 0.25s", isolation: "isolate", height: "180px" }}
                          onClick={() => abrirEditar(n)}
                          onMouseEnter={(e) => { e.currentTarget.style.outline = "1.5px solid rgba(0,0,0,0.15)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.12)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.outline = "1.5px solid transparent"; e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)"; }}>
                          {n.imagenUrl ? (
                            <>
                              <img src={n.imagenUrl} alt={n.titulo} className="absolute inset-0 w-full h-full object-cover transition-transform duration-400 group-hover:scale-105" />
                              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(3,10,28,0.92) 0%, rgba(3,10,28,0.25) 50%, transparent 100%)" }} />
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center" style={{ background: GRAD_EMP }}>
                              <Megaphone size={48} strokeWidth={1} style={{ color: "white", opacity: 0.2 }} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex flex-col justify-end p-5">
                            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden mb-1.5">
                              {(() => {
                                const sm = true;
                                const cls = `font-semibold rounded-full shrink-0 ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-0.5"}`;
                                const col = CATEGORIA_COLORS_DARK[n.categoria ?? "General"] ?? CATEGORIA_COLORS_DARK.General;
                                return (
                                  <>
                                    {n.categoria && n.categoria !== "General" && (
                                      <span className={cls} style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>{n.categoria}</span>
                                    )}
                                    {n.fijado && (
                                      <span className={cls} style={{ background: "rgba(79,70,229,0.45)", color: "#c7d2fe", border: "1px solid rgba(79,70,229,0.5)" }}>★ Fijado</span>
                                    )}
                                    {esNuevo(n.creadoEn) && (
                                      <span className={cls} style={{ background: "rgba(52,211,153,0.22)", color: "#a7f3d0", border: "1px solid rgba(52,211,153,0.32)" }}>Nuevo</span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            <h3 className="text-white leading-tight line-clamp-2"
                              style={{ fontWeight: 800, fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)", letterSpacing: "-0.02em", textShadow: SHADOW_TXT }}>
                              {n.titulo}
                            </h3>
                          </div>
                          <div className="absolute top-3 right-3 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => abrirEditar(n)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg"
                              style={{ color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", transition: "background 0.18s ease, transform 0.18s ease" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,99,235,0.55)"; e.currentTarget.style.transform = "scale(1.06)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}>
                              Editar
                            </button>
                            <button onClick={() => handleDesactivarAnuncio(n.anuncioId)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg"
                              style={{ color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", transition: "background 0.18s ease, transform 0.18s ease" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.6)"; e.currentTarget.style.transform = "scale(1.06)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}>
                              Desactivar
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Lista del resto */}
                      {publicados.length > 2 && (
                        <>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-semibold uppercase" style={{ color: "var(--texto-muted)", letterSpacing: "0.07em" }}>
                              Mas anuncios
                            </span>
                            <div className="flex-1 h-px" style={{ background: "var(--gris-borde)" }} />
                          </div>
                          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)" }}>
                            {publicados.slice(2).map((n, i) => (
                              <div key={n.anuncioId}
                                className="flex items-center gap-3 cursor-pointer transition-colors"
                                style={{ borderBottom: i < publicados.slice(2).length - 1 ? "1px solid var(--gris-borde)" : "none", paddingTop: "12px", paddingBottom: "12px", paddingLeft: 0, paddingRight: "16px" }}
                                onClick={() => abrirEditar(n)}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--gris-superficie)"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                                <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: "120px", height: "80px" }}>
                                  {n.imagenUrl ? (
                                    <img src={n.imagenUrl} alt={n.titulo} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: GRAD_EMP }}>
                                      <Megaphone size={24} strokeWidth={1} style={{ color: "white", opacity: 0.2 }} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col" style={{ gap: "4px" }}>
                                  <div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
                                    <span className="text-[11px] font-medium shrink-0" style={{ color: "var(--texto-muted)" }}>{new Date(n.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
                                    <span className="shrink-0 text-xs" style={{ color: "var(--gris-borde)" }}>·</span>
                                    {(() => {
                                      const sm = true;
                                      const cls = `font-semibold rounded-full shrink-0 ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-0.5"}`;
                                      const col = CATEGORIA_COLORS_LIGHT[n.categoria ?? "General"] ?? CATEGORIA_COLORS_LIGHT.General;
                                      return (
                                        <>
                                          {n.categoria && n.categoria !== "General" && (
                                            <span className={cls} style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>{n.categoria}</span>
                                          )}
                                          {n.fijado && (
                                            <span className={cls} style={{ background: "#ede9fe", color: "#4c1d95", border: "1px solid #c4b5fd" }}>★ Fijado</span>
                                          )}
                                          {esNuevo(n.creadoEn) && (
                                            <span className={cls} style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }}>Nuevo</span>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  <h3 className="font-bold leading-snug line-clamp-1" style={{ fontSize: "0.875rem", color: "var(--texto-primario)" }}>
                                    {n.titulo}
                                  </h3>
                                  <p className="text-xs line-clamp-1" style={{ color: "var(--texto-muted)" }}>
                                    {n.contenido ? n.contenido.replace(/[#*_`>]/g, "").slice(0, 100) + (n.contenido.length > 100 ? "…" : "") : "Sin contenido"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => abrirEditar(n)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                                    style={{ background: "var(--blanco)", color: "#2563eb", border: "1px solid #bfdbfe", transition: "background 0.18s ease, transform 0.18s ease" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.transform = "scale(1.06)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; e.currentTarget.style.transform = "scale(1)"; }}>
                                    Editar
                                  </button>
                                  <button onClick={() => handleDesactivarAnuncio(n.anuncioId)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                                    style={{ background: "var(--blanco)", color: "#dc2626", border: "1px solid #fca5a5", transition: "background 0.18s ease, transform 0.18s ease" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "scale(1.06)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; e.currentTarget.style.transform = "scale(1)"; }}>
                                    Desactivar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}

        {/* ── TAB PROGRESO DEL EQUIPO — oculto hasta que formación esté operativa ── */}

        {/* ── TAB MÓDULOS FORMATIVOS ── */}
        {activeTab === "formaciones" && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  Gestión de Módulos
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>Administra los módulos formativos de tu empresa</p>
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
              <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center mb-6"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "var(--gris-pagina)" }}>
                  <LibraryBig size={24} strokeWidth={1.5} style={{ color: "var(--texto-muted)" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>No hay módulos creados todavía</p>
                <p className="text-xs mt-1 mb-4" style={{ color: "var(--texto-muted)" }}>Crea el primer módulo formativo para tus empleados</p>
                <button onClick={() => router.push("/dashboard/admin/modulos/crear")}
                  className="text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                  Crear el primero →
                </button>
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
                              <button onClick={() => handleEliminarModulo(f.moduloId)}
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
                      </div>{/* /p-5 */}
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

        {activeTab === "documentos" && usuario?.empresaId && (
          <DocumentosAdminTab
            empresaId={usuario.empresaId}
            empleados={empleados.map((e) => ({
              usuarioId: e.usuarioId,
              nombre: e.nombre,
              apellidos: e.apellidos,
              departamento: e.departamento,
            }))}
            departamentos={DEPARTAMENTOS}
          />
        )}

        {/* ── TAB ESTADÍSTICAS ── */}
        {activeTab === "estadisticas" && (
          <div>
            {/* ── Barra de filtros y personalización ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
              {/* Rango temporal */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rango</span>
                <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
                  {([3, 6, 12] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setStatsRango(n)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: statsRango === n ? "var(--azul-egm)" : "transparent",
                        color: statsRango === n ? "white" : "var(--texto-muted)",
                      }}
                    >
                      {n} meses
                    </button>
                  ))}
                </div>
              </div>

              {/* Departamento — opciones derivadas de empleados reales */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dpto.</span>
                <select
                  value={statsDpto ?? ""}
                  onChange={(e) => setStatsDpto(e.target.value === "" ? null : e.target.value)}
                  className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  style={{ background: "white", color: "var(--texto-primario)" }}
                >
                  <option value="">Todos</option>
                  {(() => {
                    const presentes = new Set(
                      empleados.map((e) => e.departamento).filter((d): d is string => !!d)
                    );
                    return DEPARTAMENTOS
                      .filter((d) => presentes.has(d.id))
                      .map((d) => {
                        const n = empleados.filter((e) => e.departamento === d.id).length;
                        return (
                          <option key={d.id} value={d.id}>
                            {d.label} ({n})
                          </option>
                        );
                      });
                  })()}
                </select>
              </div>

              {/* Estado del empleado */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</span>
                <select
                  value={statsEstado}
                  onChange={(e) => setStatsEstado(e.target.value as "activos" | "inactivos" | "todos")}
                  className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  style={{ background: "white", color: "var(--texto-primario)" }}
                >
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                  <option value="todos">Todos</option>
                </select>
              </div>

              {/* Tipo de módulo — opciones derivadas de módulos reales */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo módulo</span>
                <select
                  value={statsTipoMod ?? ""}
                  onChange={(e) => setStatsTipoMod(e.target.value === "" ? null : e.target.value)}
                  className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  style={{ background: "white", color: "var(--texto-primario)" }}
                >
                  <option value="">Todos</option>
                  {(() => {
                    const tipos = new Set(
                      formaciones.map((m: Modulo) => m.tipoModulo).filter((t): t is ModuloTipo => !!t)
                    );
                    return Array.from(tipos).map((t) => {
                      const n = formaciones.filter((m: Modulo) => m.tipoModulo === t).length;
                      const label = (MODULO_TIPO_LABEL as Record<string, string>)[t] ?? t;
                      return (
                        <option key={t} value={t}>
                          {label} ({n})
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Export */}
              <div className="flex items-center gap-1.5">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                  style={{ background: "white", color: "var(--texto-primario)" }}
                  aria-label="Formato de exportación"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="xml">XML</option>
                </select>
                <button
                  onClick={handleExportEstadisticas}
                  disabled={!statsEmpresa}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "var(--azul-egm)", color: "white" }}
                  title="Descargar reporte"
                >
                  <Download size={13} strokeWidth={2.2} />
                  Descargar
                </button>
              </div>

              {/* Badge de personalización */}
              {hayPersonalizacion && (
                <button
                  onClick={resetVistaEstadisticas}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Restablecer vista por defecto"
                >
                  Restablecer
                </button>
              )}

              {/* Botón personalizar */}
              <div className="relative">
                <button
                  onClick={() => setShowPersonalizar((v: boolean) => !v)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                  style={{
                    background: showPersonalizar ? "var(--azul-egm)" : "var(--gris-superficie)",
                    color: showPersonalizar ? "white" : "var(--texto-primario)",
                  }}
                >
                  <SlidersHorizontal size={14} />
                  Personalizar
                </button>

                {/* Panel desplegable de personalización */}
                {showPersonalizar && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Mostrar secciones</p>
                    {[
                      { label: "KPIs resumen", value: showKpis, set: setShowKpis },
                      { label: "Incorporaciones y salidas", value: showMovimiento, set: setShowMovimiento },
                      { label: "Progreso por módulo", value: showProgreso, set: setShowProgreso },
                      { label: "Estado de formación", value: showEstadoFormacion, set: setShowEstadoFormacion },
                    ].map(({ label, value, set }) => (
                      <label key={label} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => set(e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {cargandoStats ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
              </div>
            ) : !statsEmpresa ? (
              <div className="text-center py-20" style={{ color: "var(--texto-muted)" }}>
                No hay datos disponibles aún.
              </div>
            ) : !showKpis && !showMovimiento && !showProgreso && !showEstadoFormacion ? (
              <div className="text-center py-20" style={{ color: "var(--texto-muted)" }}>
                <p className="text-sm mb-3">Todas las secciones están ocultas.</p>
                <button
                  onClick={resetVistaEstadisticas}
                  className="text-xs font-semibold px-4 py-2 rounded-lg"
                  style={{ background: "var(--azul-egm)", color: "white" }}
                >
                  Restablecer vista
                </button>
              </div>
            ) : (
              <>
                {/* ── KPIs ── */}
                {showKpis && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Total empleados", value: String(statsEmpresa.kpis.totalEmpleados), color: "text-blue-600" },
                      { label: "Altas este mes", value: String(statsEmpresa.kpis.altasEsteMes), color: "text-emerald-600" },
                      { label: "Tasa de rotación anual", value: `${statsEmpresa.kpis.tasaRotacion}%`, color: "text-amber-600" },
                      { label: "Completitud formación", value: `${statsEmpresa.kpis.pctCompletitudGlobal}%`, color: "text-violet-600" },
                      { label: "Sin iniciar formación", value: String(statsEmpresa.empleadosSinFormacion), color: "text-red-500" },
                      { label: "Formación completada", value: String(statsEmpresa.empleadosCompletados), color: "text-emerald-600" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                        <p className={`text-3xl font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Incorporaciones y salidas ── */}
                {showMovimiento && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <div className="flex items-start justify-between mb-1">
                      <h2 className="text-lg font-bold text-slate-800">Incorporaciones y salidas</h2>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Clic en un mes para ver detalle</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">Movimiento de plantilla — últimos {statsRango} meses{statsDpto ? ` · Dpto. ${DEPARTAMENTOS.find(d => d.id === statsDpto)?.label ?? statsDpto}` : ""}</p>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={statsEmpresa.movimientoMensual}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          onClick={(e) => {
                            const label = e?.activeLabel;
                            if (typeof label === "string") setDrillMes(label);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <defs>
                            <linearGradient id="gradAltas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradBajas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Area type="monotone" name="Altas" dataKey="altas" stroke="#3B82F6" strokeWidth={3} fill="url(#gradAltas)" />
                          <Area type="monotone" name="Bajas" dataKey="bajas" stroke="#F43F5E" strokeWidth={3} fill="url(#gradBajas)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* ── Progreso de formación por módulo ── */}
                {showProgreso && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Progreso de formación por módulo</h2>
                    <p className="text-xs text-slate-400 mb-6">% medio de completitud entre todos los empleados</p>
                    {statsEmpresa.progresoModulos.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-12">Sin módulos con datos de progreso</p>
                    ) : (
                      <div style={{ height: Math.max(240, statsEmpresa.progresoModulos.length * 48) }} className="w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsEmpresa.progresoModulos} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" domain={[0, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                            <YAxis type="category" dataKey="nombre" axisLine={false} tickLine={false}
                              tick={{ fill: "#64748b", fontSize: 11 }} width={130}
                              tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v} />
                            <RechartsTooltip
                              cursor={{ fill: "#f8fafc" }}
                              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                              formatter={(v) => [`${v ?? 0}%`, "Completitud"]}
                            />
                            <Bar dataKey="porcentaje" radius={[0, 8, 8, 0]} barSize={24}>
                              {statsEmpresa.progresoModulos.map((entry, i) => (
                                <Cell
                                  key={`cell-${i}`}
                                  fill={entry.porcentaje >= 80 ? "#10B981" : entry.porcentaje >= 40 ? "#3B82F6" : "#F59E0B"}
                                />
                              ))}
                              <LabelList dataKey="porcentaje" position="right"
                                style={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                                formatter={(v: unknown) => `${v ?? 0}%`} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Estado de formación de la plantilla ── */}
                {showEstadoFormacion && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Estado de formación de la plantilla</h2>
                    <p className="text-xs text-slate-400 mb-6">Distribución de empleados según su avance</p>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Sin iniciar", value: statsEmpresa.empleadosSinFormacion, fill: "#F59E0B" },
                              { name: "En progreso", value: statsEmpresa.empleadosEnProgreso, fill: "#3B82F6" },
                              { name: "Completada", value: statsEmpresa.empleadosCompletados, fill: "#10B981" },
                            ].filter((d) => d.value > 0)}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {[
                              { name: "Sin iniciar", value: statsEmpresa.empleadosSinFormacion, fill: "#F59E0B" },
                              { name: "En progreso", value: statsEmpresa.empleadosEnProgreso, fill: "#3B82F6" },
                              { name: "Completada", value: statsEmpresa.empleadosCompletados, fill: "#10B981" },
                            ].filter((d) => d.value > 0).map((entry, i) => (
                              <Cell key={`cell-${i}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        </motion.div>
        </AnimatePresence>
      </div>



      {/* ── Modal de drill-down de mes ── */}
      {drillMes && (() => {
        const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const mesIdx = MESES.indexOf(drillMes);
        // Recorremos la ventana ya construida para localizar año + mes
        const hoy = new Date();
        let anioMes = hoy.getFullYear();
        for (let i = statsRango - 1; i >= 0; i--) {
          const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
          if (MESES[d.getMonth()] === drillMes) {
            anioMes = d.getFullYear();
            break;
          }
        }
        // Recolectar empleados con altas y bajas en ese mes (respetando filtros activos)
        let empFiltrados = empleados;
        if (statsEstado === "activos") empFiltrados = empFiltrados.filter((e) => e.activo !== false);
        if (statsEstado === "inactivos") empFiltrados = empFiltrados.filter((e) => e.activo === false);
        if (statsDpto) empFiltrados = empFiltrados.filter((e) => e.departamento === statsDpto);

        const altasDelMes = empFiltrados.filter((e) => {
          const f = new Date(e.fechaRegistro ?? 0);
          return f.getFullYear() === anioMes && f.getMonth() === mesIdx;
        });
        const bajasDelMes = empFiltrados.filter((e) => {
          if (!e.fechaBaja) return false;
          const f = new Date(e.fechaBaja);
          return f.getFullYear() === anioMes && f.getMonth() === mesIdx;
        });

        return (
          <div
            className="fixed inset-0 z-100 flex items-center justify-center p-4"
            style={{ background: "rgba(15, 25, 35, 0.55)", backdropFilter: "blur(2px)" }}
            onClick={() => setDrillMes(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detalle del mes</p>
                  <h3 className="text-xl font-bold text-slate-800">{drillMes} {anioMes}</h3>
                </div>
                <button
                  onClick={() => setDrillMes(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
                  aria-label="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-6">
                {/* Altas */}
                <div>
                  <div className="flex items-baseline justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800">Altas</h4>
                    <span className="text-xs font-semibold text-blue-600">{altasDelMes.length}</span>
                  </div>
                  {altasDelMes.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin incorporaciones este mes</p>
                  ) : (
                    <ul className="space-y-1">
                      {altasDelMes.map((e) => (
                        <li key={e.usuarioId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-blue-50/50 text-sm">
                          <span className="font-medium text-slate-700">{e.nombre} {e.apellidos}</span>
                          <span className="text-xs text-slate-500">{e.departamento ?? "—"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Bajas */}
                <div>
                  <div className="flex items-baseline justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800">Bajas</h4>
                    <span className="text-xs font-semibold text-rose-600">{bajasDelMes.length}</span>
                  </div>
                  {bajasDelMes.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin salidas este mes</p>
                  ) : (
                    <ul className="space-y-1">
                      {bajasDelMes.map((e) => (
                        <li key={e.usuarioId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-rose-50/50 text-sm">
                          <span className="font-medium text-slate-700">{e.nombre} {e.apellidos}</span>
                          <span className="text-xs text-slate-500">{e.departamento ?? "—"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
function EmpSelect({ label, value, onChange, options, placeholder = "Sin departamento" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  placeholder?: string;
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
              {[{ id: "", label: placeholder }, ...options].map((opt) => {
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
