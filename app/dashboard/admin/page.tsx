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

  return (
    <>
      {/* Tabs — desktop */}
      <div className="hidden sm:flex gap-1 mb-8" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
        {(["empleados", "anuncios", "formaciones"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="pb-4 px-3 text-sm font-medium transition-colors relative"
            style={{ color: activeTab === tab ? "var(--azul-egm)" : "var(--texto-muted)" }}
          >
            {tab === "empleados" ? "Empleados" : tab === "anuncios" ? "Anuncios" : "Módulos formativos"}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 rounded-full"
                style={{ background: "var(--azul-egm)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Tabs — móvil (selector) */}
      <div className="sm:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as "empleados" | "anuncios" | "formaciones")}
          className="w-full rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none"
          style={{
            border:      "1px solid var(--gris-borde)",
            background:  "var(--blanco)",
            color:       "var(--texto-primario)",
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
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "var(--texto-primario)" }}>Empleados</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
                {empleados.length} persona{empleados.length !== 1 ? "s" : ""} en tu empresa
              </p>
            </div>
            <button
              onClick={() => { setShowFormEmpleado(true); setErrorEmpleado(null); }}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
            >
              + Añadir empleado
            </button>
          </div>

          {/* Formulario nuevo empleado */}
          {showFormEmpleado && (
            <div className="rounded-xl p-6 mb-6"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Nuevo empleado</h2>
                <button onClick={() => setShowFormEmpleado(false)} className="text-lg leading-none"
                  style={{ color: "var(--texto-muted)" }}>×</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Nombre", key: "nombre", type: "text", placeholder: "María", required: true },
                  { label: "Apellidos", key: "apellidos", type: "text", placeholder: "García López", required: false },
                  { label: "Email", key: "email", type: "email", placeholder: "m.garcia@empresa.com", required: true },
                  { label: "Contraseña inicial", key: "password", type: "password", placeholder: "Mínimo 8 caracteres", required: true },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                      {f.label} {f.required && <span style={{ color: "var(--error)" }}>*</span>}
                    </label>
                    <input
                      type={f.type}
                      value={formEmpleado[f.key as keyof NuevoEmpleadoForm]}
                      onChange={(e) => setFormEmpleado({ ...formEmpleado, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                    />
                  </div>
                ))}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                    Puesto de trabajo
                  </label>
                  <input
                    type="text"
                    value={formEmpleado.puestoTrabajo}
                    onChange={(e) => setFormEmpleado({ ...formEmpleado, puestoTrabajo: e.target.value })}
                    placeholder="Ej: Técnico de producción"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }}
                  />
                </div>
              </div>
              {errorEmpleado && (
                <p className="text-xs mt-3" style={{ color: "var(--error)" }}>{errorEmpleado}</p>
              )}
              <div className="flex gap-2 justify-end pt-4 mt-2"
                style={{ borderTop: "1px solid var(--gris-superficie)" }}>
                <button onClick={() => setShowFormEmpleado(false)}
                  className="text-sm px-4 py-2 rounded-lg"
                  style={{ color: "var(--texto-secundario)" }}>Cancelar</button>
                <button
                  onClick={handleCrearEmpleado}
                  disabled={guardandoEmpleado}
                  className="text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
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
            <div className="rounded-xl overflow-hidden flex-1 min-w-0"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              {cargandoEmpleados ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin"
                    style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
                </div>
              ) : empleados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm" style={{ color: "var(--texto-muted)" }}>No hay empleados todavía</p>
                  <button onClick={() => setShowFormEmpleado(true)}
                    className="mt-2 text-xs font-medium hover:underline"
                    style={{ color: "var(--azul-egm)" }}>Añadir el primero →</button>
                </div>
              ) : (
                <>
                  {/* Vista desktop — tabla */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--gris-borde)" }}>
                          {["Empleado", "Puesto", "Rol", "Alta", "Estado"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-medium"
                              style={{ color: "var(--texto-muted)" }}>{h}</th>
                          ))}
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {empleados.map((e) => (
                          <tr
                            key={e.usuarioId}
                            className="cursor-pointer transition-colors"
                            style={{
                              borderBottom: "1px solid var(--gris-borde)",
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
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                                  style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                  {getInitials(e.nombre, e.apellidos)}
                                </div>
                                <div>
                                  <p className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>
                                    {e.nombre} {e.apellidos}
                                  </p>
                                  <p className="text-[10px]" style={{ color: "var(--texto-muted)" }}>{e.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--texto-secundario)" }}>
                              {e.puestoTrabajo ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                style={e.codigoRol === "ROLE_ADMIN_EMPRESA"
                                  ? { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }
                                  : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                                {e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Admin" : "Empleado"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--texto-muted)" }}>
                              {formatFecha(e.fechaRegistro)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                style={e.activo
                                  ? { background: "var(--exito-light)", color: "var(--exito)" }
                                  : { background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                                {e.activo ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(ev) => { ev.stopPropagation(); handleDesactivarEmpleado(e.usuarioId); }}
                                className="text-[11px] font-medium hover:underline"
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
                        className="px-4 py-4 flex items-center justify-between gap-3 cursor-pointer"
                        onClick={() => setEmpleadoSeleccionado(
                          empleadoSeleccionado?.usuarioId === e.usuarioId ? null : e
                        )}
                        style={{
                          background: empleadoSeleccionado?.usuarioId === e.usuarioId
                            ? "var(--azul-egm-light)" : "transparent"
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                            style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                            {getInitials(e.nombre, e.apellidos)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--texto-primario)" }}>
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
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={e.codigoRol === "ROLE_ADMIN_EMPRESA"
                              ? { background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }
                              : { background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                            {e.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Admin" : "Empleado"}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
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
              <div className="hidden md:flex w-72 shrink-0 rounded-xl p-5 flex-col gap-4"
                style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Perfil</h3>
                  <button onClick={() => setEmpleadoSeleccionado(null)}
                    className="text-lg leading-none" style={{ color: "var(--texto-muted)" }}>×</button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold shrink-0"
                    style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                    {getInitials(empleadoSeleccionado.nombre, empleadoSeleccionado.apellidos)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                      {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellidos}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>
                      {empleadoSeleccionado.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-3" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                  <DrawerRow label="Puesto" value={empleadoSeleccionado.puestoTrabajo ?? "—"} />
                  <DrawerRow label="Rol" value={empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"} />
                  <DrawerRow label="Estado" value={empleadoSeleccionado.activo ? "Activo" : "Inactivo"} />
                  <DrawerRow label="Alta" value={formatFecha(empleadoSeleccionado.fechaRegistro)} />
                </div>
                <div className="flex flex-col gap-2 pt-3" style={{ borderTop: "1px solid var(--gris-borde)" }}>
                  <button
                    onClick={() => handleDesactivarEmpleado(empleadoSeleccionado.usuarioId)}
                    className="w-full text-sm font-medium py-2 rounded-lg transition-colors"
                    style={{ background: "var(--error-light)", color: "var(--error)" }}
                  >
                    Desactivar empleado
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom sheet móvil */}
          {empleadoSeleccionado && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-5 flex flex-col gap-4"
              style={{
                background: "var(--blanco)",
                border: "1px solid var(--gris-borde)",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.12)"
              }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>Perfil</h3>
                <button onClick={() => setEmpleadoSeleccionado(null)}
                  className="text-lg leading-none" style={{ color: "var(--texto-muted)" }}>×</button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                  style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                  {getInitials(empleadoSeleccionado.nombre, empleadoSeleccionado.apellidos)}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                    {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellidos}
                  </p>
                  <p className="text-xs" style={{ color: "var(--texto-muted)" }}>{empleadoSeleccionado.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2" style={{ borderTop: "1px solid var(--gris-borde)", paddingTop: "12px" }}>
                <DrawerRow label="Puesto" value={empleadoSeleccionado.puestoTrabajo ?? "—"} />
                <DrawerRow label="Rol" value={empleadoSeleccionado.codigoRol === "ROLE_ADMIN_EMPRESA" ? "Administrador" : "Empleado"} />
                <DrawerRow label="Estado" value={empleadoSeleccionado.activo ? "Activo" : "Inactivo"} />
              </div>
              <button
                onClick={() => handleDesactivarEmpleado(empleadoSeleccionado.usuarioId)}
                className="w-full text-sm font-medium py-2.5 rounded-lg"
                style={{ background: "var(--error-light)", color: "var(--error)" }}>
                Desactivar empleado
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB ANUNCIOS ── */}
      {activeTab === "anuncios" && (
        <>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "var(--texto-primario)" }}>Gestión de Anuncios</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>Comunica novedades a todos los empleados</p>
            </div>
            <button
              onClick={() => { resetFormAnuncio(); setShowFormAnuncio(true); }}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
            >
              + Nuevo anuncio
            </button>
          </div>

          {showFormAnuncio && (
            <div className="rounded-xl p-6 mb-6"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                  {editingAnuncioId ? "Editar anuncio" : "Crear anuncio"}
                </h2>
                <button onClick={resetFormAnuncio} className="text-lg leading-none"
                  style={{ color: "var(--texto-muted)" }}>×</button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                    Título <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input type="text" value={formAnuncio.titulo}
                    onChange={(e) => setFormAnuncio({ ...formAnuncio, titulo: e.target.value })}
                    placeholder="Ej: Actualización del protocolo de acceso"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--texto-secundario)" }}>
                    Contenido <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <textarea value={formAnuncio.contenido}
                    onChange={(e) => setFormAnuncio({ ...formAnuncio, contenido: e.target.value })}
                    rows={4} placeholder="Escribe el contenido del anuncio..."
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", color: "var(--texto-primario)" }} />
                </div>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setFormAnuncio({ ...formAnuncio, esGlobal: !formAnuncio.esGlobal })}
                    className="relative w-9 h-5 rounded-full transition-colors"
                    style={{ background: formAnuncio.esGlobal ? "var(--azul-egm)" : "var(--gris-superficie)" }}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                      style={{ left: formAnuncio.esGlobal ? "calc(100% - 18px)" : "2px" }} />
                  </button>
                  <label className="text-xs" style={{ color: "var(--texto-secundario)" }}>Visible para todos (global)</label>
                </div>
                <div className="flex gap-2 justify-end pt-2" style={{ borderTop: "1px solid var(--gris-superficie)" }}>
                  <button onClick={resetFormAnuncio} className="text-sm px-4 py-2 rounded-lg"
                    style={{ color: "var(--texto-secundario)" }}>Cancelar</button>
                  <button onClick={handleSaveAnuncio}
                    className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}>
                    {editingAnuncioId ? "Guardar cambios" : "Publicar anuncio"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl p-6" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--texto-primario)" }}>Anuncios publicados</h2>
            {noticias.filter((n) => n.activo).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm" style={{ color: "var(--texto-muted)" }}>No hay anuncios publicados todavía</p>
                <button onClick={() => { resetFormAnuncio(); setShowFormAnuncio(true); }}
                  className="mt-2 text-xs font-medium hover:underline" style={{ color: "var(--azul-egm)" }}>
                  Crear el primero →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {noticias.filter((n) => n.activo).map((n) => (
                  <div key={n.anuncioId} className="flex items-start justify-between rounded-lg px-4 py-3"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {n.esGlobal && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                            Global
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>{n.titulo}</p>
                      <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>{n.contenido}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <button onClick={() => handleEditAnuncio(n)}
                        className="text-[11px] font-medium hover:underline" style={{ color: "var(--azul-egm)" }}>
                        Editar
                      </button>
                      <button onClick={() => handleDeleteAnuncio(n.anuncioId)}
                        className="text-[11px] font-medium hover:underline" style={{ color: "var(--error)" }}>
                        Desactivar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB MÓDULOS FORMATIVOS ── */}
      {activeTab === "formaciones" && (
        <>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "var(--texto-primario)" }}>Gestión de Módulos</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>Administra los módulos formativos de tu empresa</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/admin/modulos/crear")}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
            >
              + Nuevo módulo
            </button>
          </div>

          {showFormModulo && (
            <div className="mb-6">
              <ModuloForm
                editando={editingModulo}
                empresaId={usuario?.empresaId}
                onSave={() => { resetFormModulo(); refreshData(); }}
                onCancel={resetFormModulo}
              />
            </div>
          )}

          <div className="rounded-xl p-6" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--texto-primario)" }}>Módulos activos</h2>
            {formaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm" style={{ color: "var(--texto-muted)" }}>No hay módulos creados todavía</p>
                <button onClick={() => { resetFormModulo(); setShowFormModulo(true); }}
                  className="mt-2 text-xs font-medium hover:underline" style={{ color: "var(--azul-egm)" }}>
                  Crear el primero →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {formaciones.map((f) => (
                  <div key={f.moduloId} className="flex items-start justify-between rounded-lg px-4 py-3"
                    style={{ border: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
                          {MODULO_TIPO_LABEL[f.tipoModulo] ?? f.tipoModulo}
                        </span>
                        {f.empresaId === null ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full italic"
                            style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                            EGM Global
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: "var(--verde-oliva-light)", color: "var(--verde-oliva)" }}>
                            Tu empresa
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>{f.nombre}</p>
                      <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>{f.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {f.empresaId !== null ? (
                        <>
                          <button onClick={() => handleEditModulo(f)}
                            className="text-[11px] font-medium hover:underline" style={{ color: "var(--azul-egm)" }}>
                            Editar
                          </button>
                          <button onClick={() => handleDeleteModulo(f.moduloId)}
                            className="text-[11px] font-medium hover:underline" style={{ color: "var(--error)" }}>
                            Desactivar
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>
                          Solo lectura
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl p-6 mt-6" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--texto-primario)" }}>Seguimiento de empleados</h2>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm" style={{ color: "var(--texto-muted)" }}>Próximamente — progreso por empleado</p>
            </div>
          </div>
        </>
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