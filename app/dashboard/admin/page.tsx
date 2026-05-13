"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import { getProgresoEmpresa } from "@/lib/api/progreso";
import { QK } from "@/lib/queryKeys";

import FormAnuncio from "@/components/ui/FormAnuncio";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { apiFetch, API_URL } from "@/lib/api";
import DashboardHero from "@/components/ui/DashboardHero";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, LabelList,
} from "recharts";
import { getEstadisticasAdminEmpresa, type EstadisticasEmpresaResponse, type FiltrosEstadisticas } from "@/lib/api/estadisticas";
import { exportStats, type ExportFormat, type StatsSection } from "@/lib/utils/statsExport";
import GestionIncidencias from "@/components/pages/GestionIncidencias";
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

  const [activeTab, setActiveTab] = useState<"empleados" | "anuncios" | "formaciones" | "incidencias" | "estadisticas">("empleados");

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

  const { data: formaciones = [] } = useQuery({
    queryKey: QK.modulos(usuario?.empresaId),
    queryFn: () => getModulosConProgreso(usuario?.empresaId),
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
  const [empPage, setEmpPage] = useState(0);
  const [progPage, setProgPage] = useState(0);

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
  const [importResult, setImportResult] = useState<{ ok: number; errors: string[] } | null>(null);

  const [showFormAnuncio, setShowFormAnuncio] = useState(false);
  const [editando, setEditando] = useState<Noticia | null>(null);
  const [initialForm, setInitialForm] = useState<NoticiaInput>(EMPTY_ANUNCIO);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showBorradores, setShowBorradores] = useState(true);

  // ── Estadísticas state ─────────────────────────────────────────────────────────
  const [statsRango, setStatsRango] = useState<3 | 6 | 12>(6);
  const [statsDpto, setStatsDpto] = useState<string | null>(null);
  const [statsEstado, setStatsEstado] = useState<"activos" | "inactivos" | "todos">("todos");
  const [statsTipoMod, setStatsTipoMod] = useState<string | null>(null);
  const [cargandoStats, setCargandoStats] = useState(false);
  const [statsEmpresa, setStatsEmpresa] = useState<EstadisticasEmpresaResponse | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [showKpis, setShowKpis] = useState(true);
  const [showMovimiento, setShowMovimiento] = useState(true);
  const [showProgreso, setShowProgreso] = useState(true);
  const [showEstadoFormacion, setShowEstadoFormacion] = useState(true);
  const [showPersonalizar, setShowPersonalizar] = useState(false);
  const [drillMes, setDrillMes] = useState<string | null>(null);

  const hayPersonalizacion = showKpis !== true || showMovimiento !== true || showProgreso !== true || showEstadoFormacion !== true;

  const resetVistaEstadisticas = () => {
    setShowKpis(true);
    setShowMovimiento(true);
    setShowProgreso(true);
    setShowEstadoFormacion(true);
  };

  const handleExportEstadisticas = async () => {
    if (!statsEmpresa) return;
    try {
      const secciones: StatsSection[] = [];
      if (showKpis) {
        secciones.push({
          id: "kpis",
          title: "KPIs resumen",
          headers: ["Indicador", "Valor"],
          rows: [
            ["Total empleados", statsEmpresa.kpis.totalEmpleados],
            ["Altas este mes", statsEmpresa.kpis.altasEsteMes],
            ["Tasa de rotación anual", `${statsEmpresa.kpis.tasaRotacion}%`],
            ["Completitud formación", `${statsEmpresa.kpis.pctCompletitudGlobal}%`],
            ["Sin iniciar formación", statsEmpresa.empleadosSinFormacion],
            ["Formación completada", statsEmpresa.empleadosCompletados],
          ],
        });
      }
      if (showMovimiento) {
        secciones.push({
          id: "movimiento",
          title: "Incorporaciones y salidas",
          headers: ["Mes", "Altas", "Bajas"],
          rows: statsEmpresa.movimientoMensual.map((m) => [m.mes, m.altas, m.bajas]),
        });
      }
      if (showProgreso) {
        secciones.push({
          id: "progreso",
          title: "Progreso por módulo",
          headers: ["Módulo", "Completitud (%)"],
          rows: statsEmpresa.progresoModulos.map((m) => [m.nombre, m.porcentaje]),
        });
      }
      if (showEstadoFormacion) {
        secciones.push({
          id: "estadoFormacion",
          title: "Estado de formación de la plantilla",
          headers: ["Estado", "Empleados"],
          rows: [
            ["Sin iniciar", statsEmpresa.empleadosSinFormacion],
            ["En progreso", statsEmpresa.empleadosEnProgreso],
            ["Completada", statsEmpresa.empleadosCompletados],
          ],
        });
      }
      const filtrosPartes: string[] = [];
      filtrosPartes.push(`Rango: ${statsRango} meses`);
      if (statsDpto) filtrosPartes.push(`Dpto: ${DEPARTAMENTOS.find(d => d.id === statsDpto)?.label ?? statsDpto}`);
      if (statsEstado !== "todos") filtrosPartes.push(`Estado: ${statsEstado}`);
      if (statsTipoMod) filtrosPartes.push(`Tipo: ${statsTipoMod}`);

      exportStats(exportFormat, {
        title: "Estadísticas de empresa",
        subtitle: undefined,
        filtros: filtrosPartes.join(" · "),
        fileName: `estadisticas_${new Date().toISOString().split("T")[0]}`,
        sections: secciones,
      });
    } catch (err) {
      console.error("Error al exportar estadísticas:", err);
    }
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
    const editId = searchParams.get("edit");
    if (editId && formaciones.length > 0) {
      const f = formaciones.find((x) => x.moduloId === editId);
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
      const existe = empleados.some((e) => e.departamento === statsDpto);
      if (!existe) {
        setStatsDpto(null);
        return; // el cambio dispara otro render
      }
    }

    setCargandoStats(true);
    try {
      const filtros: FiltrosEstadisticas = {
        rangoMeses:   statsRango,
        departamento: statsDpto,
        estado:       statsEstado,
        tipoModulo:   statsTipoMod,
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
    } catch (e: unknown) {
      setErrorEmpleado(e instanceof Error ? e.message : "Error al crear el empleado");
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
    } catch { }
  };

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }


  function abrirCrear() {
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

  function abrirEditar(n: Noticia) {
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

  function cerrarForm() {
    setShowFormAnuncio(false);
    setEditando(null);
    setInitialForm(EMPTY_ANUNCIO);
    setFormError(null);
  }

  async function handleSubmitAnuncio(data: NoticiaInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editando) await editarNoticia(editando.anuncioId, data);
      else await crearNoticia({ ...data, empresaId: usuario?.empresaId ?? null });
      queryClient.invalidateQueries({ queryKey: QK.noticias(usuario?.empresaId) });
      cerrarForm();
      mostrarToast(editando ? "Anuncio actualizado correctamente" : data.estado === "borrador" ? "Borrador guardado" : "Anuncio publicado correctamente");
    } catch { setFormError("Error al guardar. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  }

  async function handleDesactivarAnuncio(id: string) {
    try {
      await desactivarNoticia(id);
      queryClient.invalidateQueries({ queryKey: QK.noticias(usuario?.empresaId) });
      mostrarToast("Anuncio desactivado");
    } catch { }
  }

  async function publicarBorrador(n: Noticia) {
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
    } catch { mostrarToast("Error al publicar el anuncio"); }
  }
  const handleEditModulo = (f: ModuloConProgreso) => { router.push(`/dashboard/admin/modulos/crear?edit=${f.moduloId}`); };

  const handleDesactivarModulo = async (modulo: ModuloConProgreso) => {
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
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.message ?? "Error"); return; }
      queryClient.invalidateQueries({ queryKey: QK.modulos(usuario?.empresaId) });
    } catch { alert("Error al cambiar el estado del módulo"); }
  };

  const handleEliminarModulo = async (moduloId: string) => {
    if (!confirm("¿Eliminar este módulo permanentemente? Esta acción no se puede deshacer.")) return;
    try {
      const res = await apiFetch(`${API_URL}/modulos/${moduloId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) { alert("Error al eliminar el módulo"); return; }
      queryClient.invalidateQueries({ queryKey: QK.modulos(usuario?.empresaId) });
    } catch { alert("Error al eliminar el módulo"); }
  };

  function getInitials(nombre: string, apellidos?: string | null) {
    return [nombre, apellidos].filter(Boolean).join(" ").split(" ")
      .slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  }

  const exportarEmpleadosExcel = async () => {
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

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2D5A3D" },
      };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    empleados.forEach((e) => {
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
  };

  const importarEmpleados = async (file: File) => {
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
      worksheet.eachRow((row, rowIdx) => {
        if (rowIdx === 1) return;
        const values = (row.values as any[]).slice(1).map((v) => String(v ?? "").trim());
        if (values.some((v) => v)) filas.push({ rowNum: rowIdx, values });
      });
      for (const { rowNum, values } of filas) {
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
    } catch { errores.push("El archivo no es un Excel válido"); }
    setImportando(false);
    setImportResult({ ok, errors: errores });
    queryClient.invalidateQueries({ queryKey: QK.empleados(usuario?.empresaId) });
  };

  const tabs = [
    {
      key: "empleados" as const,
      label: "Empleados",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: "anuncios" as const,
      label: "Anuncios",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l19-9-9 19-2-8-8-2z" />
        </svg>
      ),
    },
    {
      key: "formaciones" as const,
      label: "Módulos formativos",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      key: "incidencias" as const,
      label: "Incidencias",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      key: "estadisticas" as const,
      label: "Estadísticas",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
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
        imagenFondo="/background-formacion-empleado.webp"
      />

      <div className="px-10 lg:px-16 pt-10 pb-16">
        {/* Tabs — desktop (pill style) */}
        <div className="hidden sm:flex gap-2 mb-10 p-1 rounded-2xl w-fit"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.key ? "var(--azul-egm)" : "transparent",
                color: activeTab === tab.key ? "white" : "var(--texto-muted)",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tabs — móvil (selector) */}
        <div className="sm:hidden mb-8">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as "empleados" | "anuncios" | "formaciones" | "incidencias" | "estadisticas")}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none"
            style={{
              border: "1px solid var(--gris-borde)",
              background: "var(--blanco)",
              color: "var(--texto-primario)",
            }}
          >
            <option value="empleados">Empleados</option>
            <option value="anuncios">Anuncios</option>
            <option value="formaciones">Módulos formativos</option>
            <option value="incidencias">Incidencias</option>
            <option value="estadisticas">Estadísticas</option>
          </select>
        </div>

        {/* ── TAB EMPLEADOS ── */}
        {activeTab === "empleados" && (
          <div className="relative">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  Empleados
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                  {empleados.length} persona{empleados.length !== 1 ? "s" : ""} en tu empresa
                </p>
              </div>
              <div className="flex gap-3">
                <input ref={inputImportRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) importarEmpleados(f); }} />
                <button
                  onClick={() => inputImportRef.current?.click()}
                  disabled={importando}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ background: "var(--blanco)", color: "var(--azul-egm)", border: "1.5px solid var(--azul-egm)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--azul-egm-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blanco)"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {importando ? "Importando..." : "Importar Excel"}
                </button>
                <button
                  onClick={exportarEmpleadosExcel}
                  disabled={empleados.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ background: "var(--verde-oliva)", color: "var(--blanco)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#15803d")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--verde-oliva)")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Exportar Excel
                </button>
                <button
                  onClick={() => { setShowFormEmpleado(true); setErrorEmpleado(null); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Añadir empleado
                </button>
              </div>
            </div>

            {/* Formulario nuevo empleado - Diseño simple */}
            {showFormEmpleado && (
              <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowFormEmpleado(false)}>
                <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #1b3f7e, #0d1b2e)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white text-2xl font-bold">Añadir nuevo empleado</h3>
                        <p className="text-white text-sm opacity-70 mt-1">Crea una cuenta para un nuevo miembro</p>
                      </div>
                      <button onClick={() => setShowFormEmpleado(false)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-800 font-bold hover:bg-gray-200 transition-colors">
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Formulario */}
                  <form onSubmit={(e) => { e.preventDefault(); if (formEmpleado.nombre.trim() && formEmpleado.email.trim() && formEmpleado.password.trim()) handleCrearEmpleado(); }} className="p-8 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Nombre *</label>
                      <input type="text" value={formEmpleado.nombre} onChange={(e) => setFormEmpleado({ ...formEmpleado, nombre: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:border-blue-400" placeholder="María" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Apellidos</label>
                      <input type="text" value={formEmpleado.apellidos} onChange={(e) => setFormEmpleado({ ...formEmpleado, apellidos: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:border-blue-400" placeholder="García López" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email *</label>
                      <input type="email" value={formEmpleado.email} onChange={(e) => setFormEmpleado({ ...formEmpleado, email: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:border-blue-400" placeholder="m.garcia@empresa.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Contraseña inicial *</label>
                      <input type="password" value={formEmpleado.password} onChange={(e) => setFormEmpleado({ ...formEmpleado, password: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:border-blue-400" placeholder="Mínimo 8 caracteres" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Puesto de trabajo</label>
                      <input type="text" value={formEmpleado.puestoTrabajo} onChange={(e) => setFormEmpleado({ ...formEmpleado, puestoTrabajo: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:border-blue-400" placeholder="Ej: Técnico de producción" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Departamento</label>
                      <select value={formEmpleado.departamento} onChange={(e) => setFormEmpleado({ ...formEmpleado, departamento: e.target.value })}
                        className="w-full rounded-xl px-4 py-3 border border-gray-300 focus:outline-none focus:border-blue-400">
                        <option value="">Sin departamento</option>
                        <option value="PRODUCCION">Producción</option>
                        <option value="RRHH">RRHH</option>
                        <option value="LOGISTICA">Logística</option>
                        <option value="CALIDAD">Calidad</option>
                        <option value="MANTENIMIENTO">Mantenimiento</option>
                        <option value="VENTAS">Ventas</option>
                        <option value="ADMINISTRACION">Administración</option>
                        <option value="IT">IT</option>
                        <option value="SEGURIDAD">Seguridad</option>
                        <option value="FORMACION">Formación</option>
                      </select>
                    </div>
                    {errorEmpleado && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs">
                        {errorEmpleado}
                      </div>
                    )}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button type="button" onClick={() => setShowFormEmpleado(false)}
                        className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-300 bg-gray-50">
                        Cancelar
                      </button>
                      <button type="submit" disabled={guardandoEmpleado}
                        className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white disabled:opacity-50">
                        {guardandoEmpleado ? <span className="loading-dots">Creando</span> : "Crear empleado"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Layout tabla + drawer */}
            <div className="flex gap-6">
              <div className="rounded-2xl overflow-hidden flex-1 min-w-0"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                {cargandoEmpleados ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-2 rounded-full animate-spin"
                      style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
                  </div>
                ) : empleados.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: "var(--gris-pagina)" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--texto-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>No hay empleados todavía</p>
                    <p className="text-xs mt-1 mb-4" style={{ color: "var(--texto-muted)" }}>Añade el primer empleado a tu empresa</p>
                    <button onClick={() => setShowFormEmpleado(true)}
                      className="text-xs font-semibold px-4 py-2 rounded-xl"
                      style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                      Añadir el primero →
                    </button>
                  </div>
                ) : (
                    <>
                      {/* Vista desktop — tabla */}
                      <div className="hidden md:block">
                        <table className="w-full">
                          <thead>
                            <tr style={{ background: "var(--gris-pagina)", borderBottom: "1px solid var(--gris-borde)" }}>
                              {["Empleado", "Puesto", "Departamento", "Rol", "Alta", "Estado"].map((h) => (
                                <th key={h} className="text-left py-3.5 px-5 text-xs font-bold uppercase tracking-wider"
                                  style={{ color: "var(--texto-muted)" }}>{h}</th>
                              ))}
                              <th className="py-3.5 px-5" />
                            </tr>
                          </thead>
                          <tbody>
                            {empleados.slice(empPage * PAGE_SIZE, (empPage + 1) * PAGE_SIZE).map((e, idx) => (
                            <tr
                              key={e.usuarioId}
                              className="cursor-pointer transition-colors"
                              style={{
                                borderBottom: idx < Math.min(empleados.length, PAGE_SIZE) - 1 ? "1px solid var(--gris-borde)" : "none",
                                background: empleadoSeleccionado?.usuarioId === e.usuarioId
                                  ? "var(--azul-egm-light)" : "transparent",
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
                                  el.currentTarget.style.background = "transparent";
                              }}
                            >
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                    {getInitials(e.nombre, e.apellidos)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                                      {e.nombre} {e.apellidos}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>{e.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5 text-sm" style={{ color: "var(--texto-secundario)" }}>
                                {e.puestoTrabajo ?? "—"}
                              </td>
                              <td className="py-4 px-5">
                                {e.departamento ? (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                    style={{ background: "#fffbeb", color: "#d97706" }}>
                                    {DEPARTAMENTOS.find((d) => d.id === e.departamento)?.label ?? e.departamento}
                                  </span>
                                ) : (
                                  <span className="text-sm" style={{ color: "var(--texto-muted)" }}>—</span>
                                )}
                              </td>
                              <td className="py-4 px-5">
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                  style={e.codigoRol === "ROLE_ADMIN_EMPRESA"
                                    ? { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }
                                    : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                  {e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Admin" : "Empleado"}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-sm" style={{ color: "var(--texto-muted)" }}>
                                {formatFecha(e.fechaRegistro)}
                              </td>
                              <td className="py-4 px-5">
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                  style={e.activo
                                    ? { background: "var(--exito-light)", color: "var(--exito)" }
                                    : { background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                  {e.activo ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--gris-borde)" }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        </table>
                        {/* Paginación desktop empleados */}
                        {empleados.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                            <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                              {empPage * PAGE_SIZE + 1}–{Math.min((empPage + 1) * PAGE_SIZE, empleados.length)} de {empleados.length}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => setEmpPage(p => Math.max(0, p - 1))} disabled={empPage === 0}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                                style={{ background: "var(--gris-pagina)", color: "var(--texto-primario)" }}>← Anterior</button>
                              <button onClick={() => setEmpPage(p => p + 1)} disabled={(empPage + 1) * PAGE_SIZE >= empleados.length}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                                style={{ background: "var(--gris-pagina)", color: "var(--texto-primario)" }}>Siguiente →</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Vista móvil — tarjetas */}
                      <div className="md:hidden flex flex-col divide-y"
                        style={{ borderColor: "var(--gris-borde)" }}>
                        {empleados.slice(empPage * PAGE_SIZE, (empPage + 1) * PAGE_SIZE).map((e) => (
                        <div
                          key={e.usuarioId}
                          className="px-5 py-4 flex items-center justify-between gap-3 cursor-pointer"
                          onClick={() => setEmpleadoSeleccionado(
                            empleadoSeleccionado?.usuarioId === e.usuarioId ? null : e
                          )}
                          style={{
                            background: empleadoSeleccionado?.usuarioId === e.usuarioId
                              ? "var(--azul-egm-light)" : "transparent"
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                              style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                              {getInitials(e.nombre, e.apellidos)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: "var(--texto-primario)" }}>
                                {e.nombre} {e.apellidos}
                              </p>
                              <p className="text-xs truncate" style={{ color: "var(--texto-muted)" }}>{e.email}</p>
                              {e.puestoTrabajo && (
                                <p className="text-xs mt-0.5" style={{ color: "var(--texto-secundario)" }}>
                                  {e.puestoTrabajo}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={e.codigoRol === "ROLE_ADMIN_EMPRESA"
                                ? { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }
                                : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                              {e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Admin" : "Empleado"}
                            </span>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={e.activo
                                ? { background: "var(--exito-light)", color: "var(--exito)" }
                                : { background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                              {e.activo ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </div>
                        ))}
                        {/* Paginación móvil empleados */}
                        {empleados.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                            <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                              {empPage * PAGE_SIZE + 1}–{Math.min((empPage + 1) * PAGE_SIZE, empleados.length)} de {empleados.length}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => setEmpPage(p => Math.max(0, p - 1))} disabled={empPage === 0}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                                style={{ background: "var(--gris-pagina)", color: "var(--texto-primario)" }}>←</button>
                              <button onClick={() => setEmpPage(p => p + 1)} disabled={(empPage + 1) * PAGE_SIZE >= empleados.length}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                                style={{ background: "var(--gris-pagina)", color: "var(--texto-primario)" }}>→</button>
                            </div>
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>

              {/* Drawer desktop */}
              {empleadoSeleccionado && (
                <div className="hidden md:flex w-80 shrink-0 rounded-2xl p-6 flex-col gap-5"
                  style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>Perfil del empleado</h3>
                    <button onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none transition-colors"
                      style={{ color: "var(--texto-muted)", background: "var(--gris-pagina)" }}>×</button>
                  </div>
                  {editandoEmpleado ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Nombre</label>
                        <input value={editEmpleadoForm.nombre} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, nombre: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Apellidos</label>
                        <input value={editEmpleadoForm.apellidos} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, apellidos: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Email</label>
                        <input value={editEmpleadoForm.email} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, email: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Puesto</label>
                        <input value={editEmpleadoForm.puestoTrabajo} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, puestoTrabajo: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Departamento</label>
                        <select value={editEmpleadoForm.departamento} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, departamento: e.target.value }))}
                          className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}>
                          <option value="">Sin departamento</option>
                          {DEPARTAMENTOS.map((d) => (
                            <option key={d.id} value={d.id}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                        <button onClick={() => setEditandoEmpleado(false)}
                          className="flex-1 text-sm font-semibold py-2 rounded-xl border"
                          style={{ borderColor: "var(--gris-borde)", color: "var(--texto-muted)" }}>
                          Cancelar
                        </button>
                        <button onClick={handleGuardarEditEmpleado} disabled={guardandoEditEmpleado}
                          className="flex-1 text-sm font-semibold py-2 rounded-xl transition-opacity"
                          style={{ background: "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)", color: "#fff", opacity: guardandoEditEmpleado ? 0.7 : 1 }}>
                          {guardandoEditEmpleado ? "Guardando…" : "Guardar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 p-4 rounded-xl"
                        style={{ background: "var(--gris-pagina)" }}>
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                          {getInitials(empleadoSeleccionado.nombre, empleadoSeleccionado.apellidos)}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>
                            {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellidos}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                            {empleadoSeleccionado.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 pt-1" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                        <DrawerRow label="Puesto" value={empleadoSeleccionado.puestoTrabajo ?? "—"} />
                        <DrawerRow label="Departamento" value={DEPARTAMENTOS.find((d) => d.id === empleadoSeleccionado.departamento)?.label ?? "—"} />
                        <DrawerRow label="Rol" value={empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"} />
                        <DrawerRow label="Estado" value={empleadoSeleccionado.activo ? "Activo" : "Inactivo"} />
                        <DrawerRow label="Alta" value={formatFecha(empleadoSeleccionado.fechaRegistro)} />
                      </div>
                      <div className="flex flex-col gap-2 pt-1" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                        <button onClick={iniciarEditEmpleado}
                          className="w-full text-sm font-semibold py-2.5 rounded-xl transition-colors"
                          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                          Editar empleado
                        </button>
                        <button
                          onClick={() => handleToggleEmpleado(empleadoSeleccionado.usuarioId, empleadoSeleccionado.activo)}
                          className="w-full text-sm font-semibold py-2.5 rounded-xl transition-colors"
                          style={empleadoSeleccionado.activo
                            ? { background: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error)" }
                            : { background: "var(--exito-light)", color: "var(--exito)", border: "1px solid var(--exito)" }}
                        >
                          {empleadoSeleccionado.activo ? "Desactivar empleado" : "Activar empleado"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom sheet móvil */}
            {empleadoSeleccionado && (
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-6 flex flex-col gap-4"
                style={{
                  background: "var(--blanco)",
                  border: "1px solid var(--gris-borde)",
                  boxShadow: "0 -4px 24px rgba(0,0,0,0.12)"
                }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>Perfil del empleado</h3>
                  <button onClick={() => { setEmpleadoSeleccionado(null); setEditandoEmpleado(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none"
                    style={{ color: "var(--texto-muted)", background: "var(--gris-pagina)" }}>×</button>
                </div>
                {editandoEmpleado ? (
                  <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Nombre</label>
                      <input value={editEmpleadoForm.nombre} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, nombre: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                        style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Apellidos</label>
                      <input value={editEmpleadoForm.apellidos} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, apellidos: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                        style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Email</label>
                      <input value={editEmpleadoForm.email} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                        style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Puesto</label>
                      <input value={editEmpleadoForm.puestoTrabajo} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, puestoTrabajo: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                        style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold" style={{ color: "var(--texto-muted)" }}>Departamento</label>
                      <select value={editEmpleadoForm.departamento} onChange={(e) => setEditEmpleadoForm((f) => ({ ...f, departamento: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none"
                        style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}>
                        <option value="">Sin departamento</option>
                        {DEPARTAMENTOS.map((d) => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setEditandoEmpleado(false)}
                        className="flex-1 text-sm font-semibold py-2 rounded-xl border"
                        style={{ borderColor: "var(--gris-borde)", color: "var(--texto-muted)" }}>
                        Cancelar
                      </button>
                      <button onClick={handleGuardarEditEmpleado} disabled={guardandoEditEmpleado}
                        className="flex-1 text-sm font-semibold py-2 rounded-xl transition-opacity"
                        style={{ background: "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)", color: "#fff", opacity: guardandoEditEmpleado ? 0.7 : 1 }}>
                        {guardandoEditEmpleado ? "Guardando…" : "Guardar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                        {getInitials(empleadoSeleccionado.nombre, empleadoSeleccionado.apellidos)}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--texto-primario)" }}>
                          {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellidos}
                        </p>
                        <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{empleadoSeleccionado.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3" style={{ borderTop: "1px solid var(--gris-borde)", paddingTop: "12px" }}>
                      <DrawerRow label="Puesto" value={empleadoSeleccionado.puestoTrabajo ?? "—"} />
                      <DrawerRow label="Departamento" value={DEPARTAMENTOS.find((d) => d.id === empleadoSeleccionado.departamento)?.label ?? "—"} />
                      <DrawerRow label="Rol" value={empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"} />
                      <DrawerRow label="Estado" value={empleadoSeleccionado.activo ? "Activo" : "Inactivo"} />
                    </div>
                    <button onClick={iniciarEditEmpleado}
                      className="w-full text-sm font-semibold py-3 rounded-xl transition-colors"
                      style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                      Editar empleado
                    </button>
                    <button
                      onClick={() => handleToggleEmpleado(empleadoSeleccionado.usuarioId, empleadoSeleccionado.activo)}
                      className="w-full text-sm font-semibold py-3 rounded-xl"
                      style={empleadoSeleccionado.activo ? { background: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error)" } : { background: "var(--exito-light)", color: "var(--exito)", border: "1px solid var(--exito)" }}
                    >
                      {empleadoSeleccionado.activo ? "Desactivar empleado" : "Activar empleado"}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Import result notification */}
            {importResult && (
              <div className="mt-6 rounded-2xl overflow-hidden fade-up" style={{ border: `1.5px solid ${importResult.errors.length === 0 ? "var(--exito)" : "#fcd34d"}`, background: importResult.errors.length === 0 ? "#f0fdf4" : "#fffbeb" }}>
                <div className="px-5 py-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: importResult.errors.length === 0 ? "var(--exito-light)" : "#fde68a" }}>
                    {importResult.errors.length === 0 ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--exito)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "#d97706" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
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
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2.5}
                          style={{ transition: "transform 0.2s", transform: showBorradores ? "rotate(0deg)" : "rotate(-90deg)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showBorradores && (
                        <div className="flex flex-col" style={{ borderTop: "1px solid #bfdbfe" }}>
                          {borradores.map((n, i) => (
                            <div key={n.anuncioId} className="flex items-center gap-3 px-4 py-3"
                              style={{ borderTop: i > 0 ? "1px solid #dbeafe" : undefined, background: "var(--blanco)" }}>
                              {n.imagenUrl
                                ? <img src={n.imagenUrl} alt="" className="rounded-xl object-cover shrink-0" style={{ width: 44, height: 44 }} />
                                : <div className="rounded-xl shrink-0 flex items-center justify-center" style={{ width: 44, height: 44, background: "#eff6ff" }}>
                                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
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
                              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1} style={{ opacity: 0.2 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                              </svg>
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
                                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1} style={{ opacity: 0.2 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                      </svg>
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

        {/* ── TAB PROGRESO DEL EQUIPO ── */}
        {activeTab === "empleados" && (
          <div className="rounded-2xl overflow-hidden mt-6" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
              <div>
                <p style={{ fontFamily: "var(--font-raleway), sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "var(--texto-primario)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  Progreso del equipo
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>Seguimiento individual por empleado</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                {progresoEmpresa.length} empleado{progresoEmpresa.length !== 1 ? "s" : ""}
              </span>
            </div>
            {cargandoProgreso ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
              </div>
            ) : progresoEmpresa.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>No hay datos de progreso</p>
                <p className="text-xs mt-1" style={{ color: "var(--texto-muted)" }}>Los datos aparecerán cuando los empleados completen módulos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--gris-pagina)", borderBottom: "1px solid var(--gris-borde)" }}>
                      <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Empleado</th>
                      {progresoEmpresa[0]?.modulos.map((m) => (
                        <th key={m.moduloId} className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                          {m.nombreModulo}
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Media</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progresoEmpresa.slice(progPage * PAGE_SIZE, (progPage + 1) * PAGE_SIZE).map((emp, idx, arr) => {
                      const media = emp.modulos.length > 0
                        ? Math.round(emp.modulos.reduce((acc, m) => acc + m.porcentaje, 0) / emp.modulos.length)
                        : 0;
                      const initials = [emp.nombre, emp.apellidos].join(" ").split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
                      return (
                        <tr key={emp.usuarioId} style={{ borderBottom: idx < arr.length - 1 ? "1px solid var(--gris-borde)" : "none" }}>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                {initials}
                              </div>
                              <div>
                                <p className="text-sm font-medium" style={{ color: "var(--texto-primario)" }}>{emp.nombre} {emp.apellidos}</p>
                              </div>
                            </div>
                          </td>
                          {emp.modulos.map((m) => (
                            <td key={m.moduloId} className="py-3.5 px-4">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 rounded-full overflow-hidden" style={{ height: "5px", background: "var(--gris-superficie)" }}>
                                  <div style={{ width: `${m.porcentaje}%`, height: "100%", background: m.porcentaje === 100 ? "var(--verde-oliva)" : m.porcentaje >= 50 ? "var(--azul-egm)" : "#f59e0b", borderRadius: "9999px" }} />
                                </div>
                                <span className="text-xs font-semibold" style={{ color: m.porcentaje === 100 ? "var(--verde-oliva)" : m.porcentaje >= 50 ? "var(--azul-egm)" : "#b45309" }}>{m.porcentaje}%</span>
                              </div>
                            </td>
                          ))}
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-sm font-bold" style={{ color: media >= 80 ? "var(--verde-oliva)" : media >= 50 ? "var(--azul-egm)" : "#b45309" }}>{media}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Paginación progreso */}
                {progresoEmpresa.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                    <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                      {progPage * PAGE_SIZE + 1}–{Math.min((progPage + 1) * PAGE_SIZE, progresoEmpresa.length)} de {progresoEmpresa.length}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setProgPage(p => Math.max(0, p - 1))} disabled={progPage === 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                        style={{ background: "var(--gris-pagina)", color: "var(--texto-primario)" }}>← Anterior</button>
                      <button onClick={() => setProgPage(p => p + 1)} disabled={(progPage + 1) * PAGE_SIZE >= progresoEmpresa.length}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                        style={{ background: "var(--gris-pagina)", color: "var(--texto-primario)" }}>Siguiente →</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>Administra los módulos formativos de tu empresa</p>
              </div>
              <button
                onClick={() => router.push("/dashboard/admin/modulos/crear")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nuevo módulo
              </button>
            </div>

            {/* Grid de módulos */}
            {formaciones.length === 0 ? (
              <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center mb-6"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "var(--gris-pagina)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--texto-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
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

        {/* ── TAB ESTADÍSTICAS ── */}
        {activeTab === "estadisticas" && (
          <div className="animate-fadeIn">
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
                        color:      statsRango === n ? "white" : "var(--texto-muted)",
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
                      formaciones.map((m: any) => m.tipoModulo).filter((t): t is string => !!t)
                    );
                    return Array.from(tipos).map((t) => {
                      const n = formaciones.filter((m: any) => m.tipoModulo === t).length;
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
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
                  onClick={() => setShowPersonalizar((v) => !v)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                  style={{
                    background: showPersonalizar ? "var(--azul-egm)" : "var(--gris-superficie)",
                    color:      showPersonalizar ? "white" : "var(--texto-primario)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  Personalizar
                </button>

                {/* Panel desplegable de personalización */}
                {showPersonalizar && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Mostrar secciones</p>
                    {[
                      { label: "KPIs resumen",            value: showKpis,            set: setShowKpis },
                      { label: "Incorporaciones y salidas", value: showMovimiento,    set: setShowMovimiento },
                      { label: "Progreso por módulo",     value: showProgreso,        set: setShowProgreso },
                      { label: "Estado de formación",     value: showEstadoFormacion, set: setShowEstadoFormacion },
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
                    { label: "Total empleados",        value: String(statsEmpresa.kpis.totalEmpleados),          color: "text-blue-600"    },
                    { label: "Altas este mes",          value: String(statsEmpresa.kpis.altasEsteMes),            color: "text-emerald-600" },
                    { label: "Tasa de rotación anual",  value: `${statsEmpresa.kpis.tasaRotacion}%`,              color: "text-amber-600"   },
                    { label: "Completitud formación",   value: `${statsEmpresa.kpis.pctCompletitudGlobal}%`,      color: "text-violet-600"  },
                    { label: "Sin iniciar formación",   value: String(statsEmpresa.empleadosSinFormacion),        color: "text-red-500"     },
                    { label: "Formación completada",    value: String(statsEmpresa.empleadosCompletados),         color: "text-emerald-600" },
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
                        onClick={(e: any) => {
                          const label = e?.activeLabel as string | undefined;
                          if (label) setDrillMes(label);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <defs>
                          <linearGradient id="gradAltas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}   />
                          </linearGradient>
                          <linearGradient id="gradBajas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#F43F5E" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area type="monotone" name="Altas"  dataKey="altas"  stroke="#3B82F6" strokeWidth={3} fill="url(#gradAltas)" />
                        <Area type="monotone" name="Bajas"  dataKey="bajas"  stroke="#F43F5E" strokeWidth={3} fill="url(#gradBajas)" />
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
                            { name: "Sin iniciar",  value: statsEmpresa.empleadosSinFormacion, fill: "#F59E0B" },
                            { name: "En progreso",  value: statsEmpresa.empleadosEnProgreso,   fill: "#3B82F6" },
                            { name: "Completada",   value: statsEmpresa.empleadosCompletados,  fill: "#10B981" },
                          ].filter((d) => d.value > 0)}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {[
                            { name: "Sin iniciar",  value: statsEmpresa.empleadosSinFormacion, fill: "#F59E0B" },
                            { name: "En progreso",  value: statsEmpresa.empleadosEnProgreso,   fill: "#3B82F6" },
                            { name: "Completada",   value: statsEmpresa.empleadosCompletados,  fill: "#10B981" },
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
      </div>



      {/* ── Modal de drill-down de mes ── */}
      {drillMes && (() => {
        const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
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
        if (statsEstado === "activos")  empFiltrados = empFiltrados.filter((e) => e.activo !== false);
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
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
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-300 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
          style={{ transform: "translateX(-50%)", background: "linear-gradient(135deg, #1b3f7e 0%, #2563eb 100%)", color: "#fff", animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
          <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(12px) scale(0.95); } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }`}</style>
        </div>
      )}
    </>
  );
}

function DrawerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--texto-muted)" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>{value}</span>
    </div>
  );
}
