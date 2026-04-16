"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { getNoticias, crearNoticia, editarNoticia, desactivarNoticia } from "@/lib/api/noticias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import ModuloForm from "@/components/ModuloForm";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { apiFetch, API_URL } from "@/lib/api";
import DashboardHero from "@/components/ui/DashboardHero";

const EMPTY_ANUNCIO: NoticiaInput = {
  titulo: "", contenido: "", esGlobal: false, empresaId: null,
};

const ROL_EMPLEADO_ID = "6251ef28-e6a3-4a3b-8121-e622da855d86";

interface Usuario {
  usuarioId: string;
  nombre: string;
  apellidos: string;
  email: string;
  codigoRol: string;
  nombreRol: string;
  puestoTrabajo: string | null;
  activo: boolean;
  fechaRegistro: string;
}

interface NuevoEmpleadoForm {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  puestoTrabajo: string;
}

const EMPTY_EMPLEADO: NuevoEmpleadoForm = {
  nombre: "", apellidos: "", email: "", password: "", puestoTrabajo: "",
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
  const [editingAnuncioId, setEditingAnuncioId] = useState<string | null>(null);
  const [formAnuncio, setFormAnuncio] = useState<NoticiaInput>(EMPTY_ANUNCIO);

  const [formaciones, setFormaciones] = useState<ModuloConProgreso[]>([]);
  const [showFormModulo, setShowFormModulo] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloConProgreso | null>(null);

  const cargarEmpleados = async () => {
    setCargandoEmpleados(true);
    try {
      const res = await apiFetch(`${API_URL}/users`);
      if (res.ok) setEmpleados(await res.json());
    } catch {}
    finally { setCargandoEmpleados(false); }
  };

  const refreshData = async () => {
    if (!usuario?.empresaId) return;
    const [news, modulos] = await Promise.allSettled([
      getNoticias(usuario.empresaId),
      getModulosConProgreso(),
    ]);
    if (news.status === "fulfilled") setNoticias(news.value);
    if (modulos.status === "fulfilled") setFormaciones(modulos.value);
  };

  useEffect(() => {
    if (usuario && (usuario.codigoRol === "ROLE_EMPLEADO" || usuario.codigoRol === "INVITADO")) {
      router.replace("/dashboard");
    }
  }, [usuario, router]);

  useEffect(() => {
    if (usuario?.empresaId) { cargarEmpleados(); refreshData(); }
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

  const handleDesactivarEmpleado = async (usuarioId: string) => {
    if (!confirm("¿Seguro que quieres desactivar este empleado?")) return;
    try {
      await apiFetch(`${API_URL}/users/${usuarioId}/desactivar`, { method: "DELETE" });
      await cargarEmpleados();
      if (empleadoSeleccionado?.usuarioId === usuarioId) setEmpleadoSeleccionado(null);
    } catch {}
  };

  const resetFormAnuncio = () => {
    setFormAnuncio({ ...EMPTY_ANUNCIO, empresaId: usuario?.empresaId ?? null });
    setEditingAnuncioId(null);
    setShowFormAnuncio(false);
  };

  const handleSaveAnuncio = async () => {
    if (!formAnuncio.titulo.trim() || !formAnuncio.contenido.trim()) return;
    try {
      if (editingAnuncioId) {
        await editarNoticia(editingAnuncioId, formAnuncio);
      } else {
        await crearNoticia({ ...formAnuncio, empresaId: usuario?.empresaId ?? null });
      }
      await refreshData();
      resetFormAnuncio();
    } catch { console.error("Error al guardar anuncio"); }
  };

  const handleEditAnuncio = (n: Noticia) => {
    setFormAnuncio({ titulo: n.titulo, contenido: n.contenido, esGlobal: n.esGlobal, empresaId: n.empresaId });
    setEditingAnuncioId(n.anuncioId);
    setShowFormAnuncio(true);
  };

  const handleDeleteAnuncio = async (id: string) => {
    try { await desactivarNoticia(id); await refreshData(); }
    catch { console.error("Error al desactivar anuncio"); }
  };

  const resetFormModulo = () => { setEditingModulo(null); setShowFormModulo(false); };
  const handleEditModulo = (f: ModuloConProgreso) => { setEditingModulo(f); setShowFormModulo(true); };
  const handleDeleteModulo = async (moduloId: string) => {
    try {
      await apiFetch(`${API_URL}/modulos/${moduloId}/desactivar`, { method: "PATCH" });
      await refreshData();
    } catch { console.error("Error al desactivar módulo"); }
  };

  function getInitials(nombre: string, apellidos?: string | null) {
    return [nombre, apellidos].filter(Boolean).join(" ").split(" ")
      .slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
  }

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  }

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
        titulo="Administración."
        imagenFondo="/background-formacion-empleado.jpg"
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
                <h1 className="text-2xl font-bold" style={{ color: "var(--texto-primario)" }}>Empleados</h1>
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                  {empleados.length} persona{empleados.length !== 1 ? "s" : ""} en tu empresa
                </p>
              </div>
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
                  <div className="col-span-1 sm:col-span-2">
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
                            {["Empleado", "Puesto", "Rol", "Alta", "Estado"].map((h) => (
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
                                <button
                                  onClick={(ev) => { ev.stopPropagation(); handleDesactivarEmpleado(e.usuarioId); }}
                                  className="text-xs font-semibold hover:underline"
                                  style={{ color: "var(--error)" }}>
                                  Desactivar
                                </button>
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
                    <DrawerRow label="Rol" value={empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"} />
                    <DrawerRow label="Estado" value={empleadoSeleccionado.activo ? "Activo" : "Inactivo"} />
                    <DrawerRow label="Alta" value={formatFecha(empleadoSeleccionado.fechaRegistro)} />
                  </div>
                  <div className="pt-1" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                    <button
                      onClick={() => handleDesactivarEmpleado(empleadoSeleccionado.usuarioId)}
                      className="w-full text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      style={{ background: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error)" }}
                    >
                      Desactivar empleado
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
                  <DrawerRow label="Rol" value={empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"} />
                  <DrawerRow label="Estado" value={empleadoSeleccionado.activo ? "Activo" : "Inactivo"} />
                </div>
                <button
                  onClick={() => handleDesactivarEmpleado(empleadoSeleccionado.usuarioId)}
                  className="w-full text-sm font-semibold py-3 rounded-xl"
                  style={{ background: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error)" }}>
                  Desactivar empleado
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB ANUNCIOS ── */}
        {activeTab === "anuncios" && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--texto-primario)" }}>Gestión de Anuncios</h1>
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>Comunica novedades a todos los empleados</p>
              </div>
              <button
                onClick={() => { resetFormAnuncio(); setShowFormAnuncio(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nuevo anuncio
              </button>
            </div>

            {/* Formulario anuncio */}
            {showFormAnuncio && (
              <div className="rounded-2xl p-6 mb-8"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--azul-egm-light)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--azul-egm)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 11l19-9-9 19-2-8-8-2z" />
                      </svg>
                    </div>
                    <h2 className="text-base font-bold" style={{ color: "var(--texto-primario)" }}>
                      {editingAnuncioId ? "Editar anuncio" : "Crear anuncio"}
                    </h2>
                  </div>
                  <button onClick={resetFormAnuncio}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-lg leading-none"
                    style={{ color: "var(--texto-muted)", background: "var(--gris-pagina)" }}>×</button>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: "var(--texto-secundario)" }}>
                      Título <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <input type="text" value={formAnuncio.titulo}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, titulo: e.target.value })}
                      placeholder="Ej: Actualización del protocolo de acceso"
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--gris-pagina)", color: "var(--texto-primario)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: "var(--texto-secundario)" }}>
                      Contenido <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <textarea value={formAnuncio.contenido}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, contenido: e.target.value })}
                      rows={5} placeholder="Escribe el contenido del anuncio..."
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--gris-pagina)", color: "var(--texto-primario)" }} />
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button"
                      onClick={() => setFormAnuncio({ ...formAnuncio, esGlobal: !formAnuncio.esGlobal })}
                      className="relative w-9 h-5 rounded-full transition-colors shrink-0"
                      style={{ background: formAnuncio.esGlobal ? "var(--azul-egm)" : "var(--gris-superficie)" }}>
                      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                        style={{ left: formAnuncio.esGlobal ? "calc(100% - 18px)" : "2px" }} />
                    </button>
                    <label className="text-sm font-medium" style={{ color: "var(--texto-secundario)" }}>Visible para todos (global)</label>
                  </div>
                  <div className="flex gap-3 justify-end pt-4" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                    <button onClick={resetFormAnuncio}
                      className="text-sm font-medium px-5 py-2.5 rounded-xl"
                      style={{ color: "var(--texto-secundario)", background: "var(--gris-pagina)", border: "1px solid var(--gris-borde)" }}>
                      Cancelar
                    </button>
                    <button onClick={handleSaveAnuncio}
                      className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                      style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}>
                      {editingAnuncioId ? "Guardar cambios" : "Publicar anuncio"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de anuncios */}
            {noticias.filter((n) => n.activo).length === 0 ? (
              <div className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "var(--gris-pagina)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--texto-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 11l19-9-9 19-2-8-8-2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>No hay anuncios publicados todavía</p>
                <p className="text-xs mt-1 mb-4" style={{ color: "var(--texto-muted)" }}>Crea tu primer anuncio para comunicar novedades</p>
                <button onClick={() => { resetFormAnuncio(); setShowFormAnuncio(true); }}
                  className="text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                  Crear el primero →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {noticias.filter((n) => n.activo).map((n) => (
                  <div key={n.anuncioId}
                    className="rounded-2xl px-5 py-4"
                    style={{
                      background: "var(--blanco)",
                      border: "1px solid var(--gris-borde)",
                      borderLeft: `4px solid ${n.esGlobal ? "var(--verde-oliva)" : "var(--azul-egm)"}`,
                    }}>
                    <p className="text-base font-semibold" style={{ color: "var(--texto-primario)" }}>{n.titulo}</p>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--texto-secundario)" }}>{n.contenido}</p>
                    <div className="flex items-center justify-between mt-3 pt-3"
                      style={{ borderTop: "1px solid var(--gris-borde)" }}>
                      <div className="flex items-center gap-2">
                        {n.esGlobal && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                            Global
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                          {formatFecha(n.creadoEn)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleEditAnuncio(n)}
                          className="text-xs font-semibold hover:underline" style={{ color: "var(--azul-egm)" }}>
                          Editar
                        </button>
                        <button onClick={() => handleDeleteAnuncio(n.anuncioId)}
                          className="text-xs font-semibold hover:underline" style={{ color: "var(--error)" }}>
                          Desactivar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB MÓDULOS FORMATIVOS ── */}
        {activeTab === "formaciones" && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--texto-primario)" }}>Gestión de Módulos</h1>
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

            {/* ModuloForm */}
            {showFormModulo && (
              <div className="mb-8">
                <ModuloForm
                  editando={editingModulo}
                  empresaId={usuario?.empresaId}
                  onSave={() => { resetFormModulo(); refreshData(); }}
                  onCancel={resetFormModulo}
                />
              </div>
            )}

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
                <button onClick={() => { resetFormModulo(); setShowFormModulo(true); }}
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
                      className="rounded-2xl p-5 flex flex-col transition-shadow"
                      style={{
                        background: "var(--blanco)",
                        border: "1px solid var(--gris-borde)",
                        borderTop: `3px solid ${accentColor}`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                          {MODULO_TIPO_LABEL[f.tipoModulo] ?? f.tipoModulo}
                        </span>
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
                      </div>

                      {/* Title + description */}
                      <p className="text-base font-semibold mt-3 mb-1" style={{ color: "var(--texto-primario)" }}>
                        {f.nombre}
                      </p>
                      <p className="text-sm line-clamp-2 flex-1" style={{ color: "var(--texto-muted)" }}>
                        {f.descripcion}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 mt-4 pt-3"
                        style={{ borderTop: "1px solid var(--gris-borde)" }}>
                        {f.empresaId !== null ? (
                          <>
                            <button onClick={() => handleEditModulo(f)}
                              className="text-xs font-semibold hover:underline" style={{ color: "var(--azul-egm)" }}>
                              Editar
                            </button>
                            <button onClick={() => handleDeleteModulo(f.moduloId)}
                              className="text-xs font-semibold hover:underline" style={{ color: "var(--error)" }}>
                              Desactivar
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
                  );
                })}
              </div>
            )}

            {/* Seguimiento de empleados */}
            <div className="rounded-2xl p-8"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="flex flex-col items-center justify-center text-center py-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "var(--azul-egm-light)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--azul-egm)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <polyline points="22 12 18 12 20 9 18 6" />
                    <line x1="22" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-bold" style={{ color: "var(--texto-primario)" }}>Seguimiento de empleados</h2>
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: "var(--azul-egm)", color: "white", letterSpacing: "0.05em" }}>
                    PRÓXIMAMENTE
                  </span>
                </div>
                <p className="text-sm max-w-sm" style={{ color: "var(--texto-muted)" }}>
                  Pronto podrás consultar el progreso individual de cada empleado en sus módulos formativos.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
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
