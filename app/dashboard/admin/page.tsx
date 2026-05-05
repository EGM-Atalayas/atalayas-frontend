"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import { getProgresoEmpresa } from "@/lib/api/progreso";
import type { ProgresoEmpleado } from "@/lib/types/progreso";
import ModuloForm from "@/components/ModuloForm";
import FormAnuncio from "@/components/ui/FormAnuncio";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { apiFetch, API_URL } from "@/lib/api";
import DashboardHero from "@/components/ui/DashboardHero";
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
}

interface NuevoEmpleadoForm {
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

  const [activeTab, setActiveTab] = useState<"empleados" | "anuncios" | "formaciones">("empleados");

  const [empleados, setEmpleados] = useState<Usuario[]>([]);
  const [cargandoEmpleados, setCargandoEmpleados] = useState(true);
  const [showFormEmpleado, setShowFormEmpleado] = useState(false);
  const [formEmpleado, setFormEmpleado] = useState<NuevoEmpleadoForm>(EMPTY_EMPLEADO);
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);
  const [errorEmpleado, setErrorEmpleado] = useState<string | null>(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Usuario | null>(null);

  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [showFormAnuncio, setShowFormAnuncio] = useState(false);
  const [editando, setEditando] = useState<Noticia | null>(null);
  const [initialForm, setInitialForm] = useState<NoticiaInput>(EMPTY_ANUNCIO);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showBorradores, setShowBorradores] = useState(true);

  const [formaciones, setFormaciones] = useState<ModuloConProgreso[]>([]);
  const [progresoEmpresa, setProgresoEmpresa] = useState<ProgresoEmpleado[]>([]);
  const [cargandoProgreso, setCargandoProgreso] = useState(true);
  const [showFormModulo, setShowFormModulo] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloConProgreso | null>(null);

  const cargarEmpleados = async () => {
    setCargandoEmpleados(true);
    try {
      const res = await apiFetch(`${API_URL}/users`);
      if (res.ok) setEmpleados(await res.json());
    } catch { }
    finally { setCargandoEmpleados(false); }
  };

  const refreshData = async () => {
    if (!usuario?.empresaId) return;
    const [news, modulos, progreso] = await Promise.allSettled([
      getNoticias(usuario.empresaId),
      getModulosConProgreso(),
      getProgresoEmpresa(usuario.empresaId),
    ]);
    if (news.status === "fulfilled") setNoticias(news.value);
    if (modulos.status === "fulfilled") setFormaciones(modulos.value);
    if (progreso.status === "fulfilled") {
      setProgresoEmpresa(progreso.value);
      setCargandoProgreso(false);
    }
  };

  useEffect(() => {
    if (usuario && (usuario.codigoRol === "ROLE_EMPLEADO" || usuario.codigoRol === "INVITADO")) {
      router.replace("/dashboard");
    }
  }, [usuario, router]);

  useEffect(() => {
    if (usuario?.empresaId) { cargarEmpleados(); refreshData(); cargarAnuncios(); }
  }, [usuario?.empresaId]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "formaciones") setActiveTab("formaciones");
    if (tab === "anuncios") setActiveTab("anuncios");
    if (tab === "empleados") setActiveTab("empleados");
    const editId = searchParams.get("edit");
    if (editId && formaciones.length > 0) {
      const f = formaciones.find((x) => x.moduloId === editId);
      if (f) { setEditingModulo(f); setShowFormModulo(true); }
    }
  }, [searchParams, formaciones]);

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
      await cargarEmpleados();
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
      await cargarEmpleados();
      if (empleadoSeleccionado?.usuarioId === usuarioId) setEmpleadoSeleccionado(null);
    } catch { }
  };

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  async function cargarAnuncios() {
    if (!usuario?.empresaId) return;
    try {
      const data = await getNoticias(usuario.empresaId);
      setNoticias(data);
    } catch { setNoticias([]); }
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
      await cargarAnuncios();
      cerrarForm();
      mostrarToast(editando ? "Anuncio actualizado correctamente" : data.estado === "borrador" ? "Borrador guardado" : "Anuncio publicado correctamente");
    } catch { setFormError("Error al guardar. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  }

  async function handleDesactivarAnuncio(id: string) {
    try {
      await desactivarNoticia(id);
      await cargarAnuncios();
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
      await cargarAnuncios();
      mostrarToast("Anuncio publicado correctamente");
    } catch { mostrarToast("Error al publicar el anuncio"); }
  }

  const resetFormModulo = () => { setEditingModulo(null); setShowFormModulo(false); };
  const handleEditModulo = (f: ModuloConProgreso) => { setEditingModulo(f); setShowFormModulo(true); };

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
      await refreshData();
    } catch { alert("Error al cambiar el estado del módulo"); }
  };

  const handleEliminarModulo = async (moduloId: string) => {
    if (!confirm("¿Eliminar este módulo permanentemente? Esta acción no se puede deshacer.")) return;
    try {
      const res = await apiFetch(`${API_URL}/modulos/${moduloId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) { alert("Error al eliminar el módulo"); return; }
      await refreshData();
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
            onChange={(e) => setActiveTab(e.target.value as "empleados" | "anuncios" | "formaciones")}
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

            {/* Formulario nuevo empleado */}
            {showFormEmpleado && (
              <div className="rounded-2xl p-6 mb-8"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--azul-egm-light)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--azul-egm)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                    </div>
                    <h2 className="text-base font-bold" style={{ color: "var(--texto-primario)" }}>Añadir nuevo empleado</h2>
                  </div>
                  <button onClick={() => setShowFormEmpleado(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none transition-colors"
                    style={{ color: "var(--texto-muted)", background: "var(--gris-pagina)" }}>×</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Nombre", key: "nombre", type: "text", placeholder: "María", required: true },
                    { label: "Apellidos", key: "apellidos", type: "text", placeholder: "García López", required: false },
                    { label: "Email", key: "email", type: "email", placeholder: "m.garcia@empresa.com", required: true },
                    { label: "Contraseña inicial", key: "password", type: "password", placeholder: "Mínimo 8 caracteres", required: true },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold mb-2" style={{ color: "var(--texto-secundario)" }}>
                        {f.label} {f.required && <span style={{ color: "var(--error)" }}>*</span>}
                      </label>
                      <input
                        type={f.type}
                        value={formEmpleado[f.key as keyof NuevoEmpleadoForm]}
                        onChange={(e) => setFormEmpleado({ ...formEmpleado, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                        style={{ border: "1px solid var(--gris-borde)", background: "var(--gris-pagina)", color: "var(--texto-primario)" }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: "var(--texto-secundario)" }}>
                      Puesto de trabajo
                    </label>
                    <input
                      type="text"
                      value={formEmpleado.puestoTrabajo}
                      onChange={(e) => setFormEmpleado({ ...formEmpleado, puestoTrabajo: e.target.value })}
                      placeholder="Ej: Técnico de producción"
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--gris-pagina)", color: "var(--texto-primario)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: "var(--texto-secundario)" }}>
                      Departamento
                    </label>
                    <select
                      value={formEmpleado.departamento}
                      onChange={(e) => setFormEmpleado({ ...formEmpleado, departamento: e.target.value })}
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--gris-pagina)", color: formEmpleado.departamento ? "var(--texto-primario)" : "var(--texto-muted)" }}
                    >
                      <option value="">Sin departamento</option>
                      {DEPARTAMENTOS.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {errorEmpleado && (
                  <div className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl"
                    style={{ background: "var(--error-light)", border: "1px solid var(--error)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-xs font-medium" style={{ color: "var(--error)" }}>{errorEmpleado}</p>
                  </div>
                )}
                <div className="flex gap-3 justify-end pt-5 mt-4"
                  style={{ borderTop: "1px solid var(--gris-borde)" }}>
                  <button onClick={() => setShowFormEmpleado(false)}
                    className="text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                    style={{ color: "var(--texto-secundario)", background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                    Cancelar
                  </button>
                  <button
                    onClick={handleCrearEmpleado}
                    disabled={guardandoEmpleado}
                    className="text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
                    style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
                  >
                    {guardandoEmpleado ? "Creando..." : "Crear empleado"}
                  </button>
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
                          {empleados.map((e, idx) => (
                            <tr
                              key={e.usuarioId}
                              className="cursor-pointer transition-colors"
                              style={{
                                borderBottom: idx < empleados.length - 1 ? "1px solid var(--gris-borde)" : "none",
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
                    </div>

                    {/* Vista móvil — tarjetas */}
                    <div className="md:hidden flex flex-col divide-y"
                      style={{ borderColor: "var(--gris-borde)" }}>
                      {empleados.map((e) => (
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
                    <button onClick={() => setEmpleadoSeleccionado(null)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none transition-colors"
                      style={{ color: "var(--texto-muted)", background: "var(--gris-pagina)" }}>×</button>
                  </div>
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
                  <div className="pt-1" style={{ borderTop: "1px solid var(--gris-borde)" }}>
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
                  <button onClick={() => setEmpleadoSeleccionado(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none"
                    style={{ color: "var(--texto-muted)", background: "var(--gris-pagina)" }}>×</button>
                </div>
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
                  <button
                    onClick={() => handleToggleEmpleado(empleadoSeleccionado.usuarioId, empleadoSeleccionado.activo)}
                    className="w-full text-sm font-semibold py-3 rounded-xl"
                    style={empleadoSeleccionado.activo
                      ? { background: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error)" }
                      : { background: "var(--exito-light)", color: "var(--exito)", border: "1px solid var(--exito)" }}
                  >
                    {empleadoSeleccionado.activo ? "Desactivar empleado" : "Activar empleado"}
                  </button>
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
                    {progresoEmpresa.map((emp, idx, arr) => {
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
      </div>

      {/* Modal edicion modulo — overlay global */}
      {showFormModulo && (
        <ModuloForm
          editando={editingModulo}
          empresaId={usuario?.empresaId}
          onSave={() => { resetFormModulo(); refreshData(); }}
          onCancel={resetFormModulo}
        />
      )}

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
