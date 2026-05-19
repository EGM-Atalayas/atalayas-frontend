"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_URL, apiFetch } from "@/lib/api";
import { MisDocumentos } from "@/components/documentos/MisDocumentos";
import {
  Camera, Pencil, Check, X, Briefcase, Phone,
  Calendar, Clock, BookOpen, Award, ChevronRight, Building2, Mail,
  BarChart3, Users, AlertTriangle, ExternalLink, ArrowRight, Upload,
} from "lucide-react";
import { getEstadisticasSuperadmin } from "@/lib/api/estadisticas";
import { subirImagenBanner } from "@/lib/supabase";
import { getEmpresas } from "@/lib/api/empresas";
import { getIncidencias } from "@/lib/api/incidencias";
import { getModulosConProgreso } from "@/lib/api/modulos";
import { getMisProgresosModulo } from "@/lib/api/moduloProgreso";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import type { ModuloProgresoResponse } from "@/lib/api/moduloProgreso";

type Disponibilidad = "DISPONIBLE" | "OCUPADO" | "TELETRABAJO" | "AUSENTE" | "VACACIONES";

interface PerfilCompleto {
  usuarioId: string;
  nombre: string;
  apellidos: string;
  email: string;
  puestoTrabajo?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  telefono?: string;
  disponibilidad?: Disponibilidad;
  nombreEmpresa?: string;
  nombreRol?: string;
  fechaRegistro?: string;
  ultimoLogin?: string;
}

const DISPONIBILIDAD_CONFIG: Record<Disponibilidad, { label: string; color: string; bg: string; dot: string }> = {
  DISPONIBLE:  { label: "Disponible",  color: "#16a34a", bg: "#dcfce7", dot: "#16a34a" },
  TELETRABAJO: { label: "Teletrabajo", color: "#2563eb", bg: "#dbeafe", dot: "#2563eb" },
  OCUPADO:     { label: "Ocupado",     color: "#dc2626", bg: "#fee2e2", dot: "#dc2626" },
  VACACIONES:  { label: "Vacaciones",  color: "#d97706", bg: "#fef3c7", dot: "#d97706" },
  AUSENTE:     { label: "Ausente",     color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

const BANNER_GRUPOS = [
  {
    grupo: "Atalayas",
    imagenes: [
      "/background-dashboard.webp",
      "/background-empresa.webp",
      "/atalayas-circular.webp",
    ],
  },
  {
    grupo: "Formación",
    imagenes: [
      "/background-formacion-empleado.webp",
      "/herramientas-digitales.webp",
      "/metodologias-agiles.webp",
      "/ciberseguridad-datos.webp",
      "/negociacion-habilidades.webp",
    ],
  },
  {
    grupo: "Comunidad",
    imagenes: [
      "/background-comunidad.webp",
      "/comunidad.webp",
      "/diversidad.webp",
      "/comunicacion-trabajo.webp",
    ],
  },
  {
    grupo: "Otros",
    imagenes: [
      "/background-login.webp",
      "/background-invitado.webp",
      "/background-comunicacion-empleado.webp",
    ],
  },
];

function getInitials(nombre: string, apellidos = "") {
  return ((nombre?.[0] ?? "") + (apellidos?.[0] ?? "")).toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "#1e3a5f", "#2d6a4f", "#6b3fa0", "#9b2335", "#b5450b",
  "#1a5276", "#145a32", "#512e5f", "#78281f", "#1b4f72",
];

function getAvatarColor(nombre: string) {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function formatRelative(iso?: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "hace un momento";
  if (mins < 60) return `hace ${mins} minutos`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} horas`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days} días`;
  return formatDate(iso);
}

function normalizeTelefono(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0034")) digits = digits.slice(4);
  else if (digits.startsWith("34") && digits.length > 9) digits = digits.slice(2);
  digits = digits.slice(0, 9);
  return digits.replace(/(\d{3})(\d{0,3})(\d{0,3})/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join(" ")
  );
}

/** Normaliza texto de nombre/apellidos: trim + colapsa espacios múltiples */
function normalizarNombre(raw: string): string {
  return raw.replace(/\s+/g, " ").trimStart();
}

const MAX_PUESTO = 60;

export default function PerfilPage() {
  const { usuario, guardarUsuario } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [modulos, setModulos] = useState<ModuloConProgreso[]>([]);
  const [progresosModulo, setProgresosModulo] = useState<ModuloProgresoResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const esAdmin = usuario?.codigoRol === "ROLE_ADMIN_EMPRESA" || usuario?.codigoRol === "ROLE_ADMIN";
  const isSuperAdmin = usuario?.codigoRol === "ROLE_ADMIN";

  const [editando, setEditando] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formApellidos, setFormApellidos] = useState("");
  const [formPuesto, setFormPuesto] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDisponibilidad, setFormDisponibilidad] = useState<Disponibilidad>("DISPONIBLE");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errores, setErrores] = useState<{ nombre?: string; apellidos?: string; telefono?: string }>({});
  const [sugerencia, setSugerencia]       = useState("");
  const [enviandoSug, setEnviandoSug]     = useState(false);
  const [estadoSug, setEstadoSug]         = useState<"idle" | "ok" | "error">("idle");
  const [destinatarioSug] = useState<"EGM">("EGM");
  const [dispOpen, setDispOpen] = useState(false);
  const dispRef = useRef<HTMLDivElement>(null);

  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // ── Datos de empresa ──
  const [editandoEmpresa, setEditandoEmpresa] = useState(false);
  const [empresaData, setEmpresaData] = useState<{ nombreEmpresa: string; cif: string; emailContacto: string; logoEmpresaUrl?: string } | null>(null);
  const [formEmpNombre, setFormEmpNombre] = useState("");
  const [formEmpCif, setFormEmpCif] = useState("");
  const [formEmpEmail, setFormEmpEmail] = useState("");
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [empresaLoaded, setEmpresaLoaded] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Superadmin KPIs ──
  const [statsSuper, setStatsSuper] = useState<{ empresas: number; empleados: number; pendientes: number; incidenciasAbiertas: number } | null>(null);
  const [cargandoStats, setCargandoStats] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    setCargandoStats(true);
    Promise.all([
      getEstadisticasSuperadmin().catch(() => null),
      getEmpresas().catch(() => []),
      getIncidencias().catch(() => []),
    ]).then(([stats, empresas, incidencias]) => {
      const ultimo = stats?.crecimiento?.[stats.crecimiento.length - 1];
      setStatsSuper({
        empresas: ultimo?.empresas ?? 0,
        empleados: ultimo?.empleados ?? 0,
        pendientes: Array.isArray(empresas) ? empresas.filter((e: any) => e.estadoSolicitud === "PENDIENTE").length : 0,
        incidenciasAbiertas: Array.isArray(incidencias) ? incidencias.filter((i: any) => i.estado === "ABIERTA" || i.estado === "EN_CURSO").length : 0,
      });
    }).finally(() => setCargandoStats(false));
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!showBannerPicker) return;
    const scrollY = window.scrollY;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = prev;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [showBannerPicker]);

  useEffect(() => {
    if (!esAdmin || !usuario?.empresaId || empresaLoaded) return;
    (async () => {
      try {
        const data = await getEmpresaById(usuario.empresaId!);
        setEmpresaData({
          nombreEmpresa: data.nombreEmpresa ?? "",
          cif: data.cif ?? "",
          emailContacto: data.emailContacto ?? "",
          logoEmpresaUrl: usuario.logoEmpresaUrl,
        });
        setFormEmpNombre(data.nombreEmpresa ?? "");
        setFormEmpCif(data.cif ?? "");
        setFormEmpEmail(data.emailContacto ?? "");
      } catch {} finally {
        setEmpresaLoaded(true);
      }
    })();
  }, [esAdmin, usuario?.empresaId, empresaLoaded]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dispOpen) return;
    const handler = (e: MouseEvent) => {
      if (dispRef.current && !dispRef.current.contains(e.target as Node)) setDispOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dispOpen]);

  // Se dispara en el montaje inicial Y cada vez que el usuario vuelve a esta ruta.
  // usePathname cambia incluso cuando Next.js sirve la página desde la router cache,
  // lo que garantiza la recarga aunque el componente no se haya desmontado.
  useEffect(() => {
    if (!usuario) return;
    setLoading(true);
    loadPerfil();
    loadProgreso();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, usuario?.email]);

  const loadPerfil = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/users/me`);
      if (res.ok) {
        const data: PerfilCompleto = await res.json();
        setPerfil(data);
        resetForm(data);
        return;
      }
    } catch {
      // error de red — cae al fallback
    } finally {
      setLoading(false);
    }
    // Fallback: respuesta no-ok o error de red
    if (usuario) {
      const fallback: PerfilCompleto = {
        usuarioId: usuario.usuarioId ?? "",
        nombre: usuario.nombre ?? "",
        apellidos: usuario.apellidos ?? "",
        email: usuario.email ?? "",
        avatarUrl: usuario.avatarUrl,
        nombreEmpresa: usuario.nombreEmpresa,
        nombreRol: usuario.nombreRol,
      };
      setPerfil(fallback);
      resetForm(fallback);
    }
  };

  const resetForm = (data: PerfilCompleto) => {
    setFormNombre(data.nombre ?? "");
    setFormApellidos(data.apellidos ?? "");
    setFormPuesto(data.puestoTrabajo ?? "");
    // Guardar solo los dígitos sin el prefijo +34 para evitar duplicados al guardar
    setFormTelefono((data.telefono ?? "").replace(/^\+34\s?/, ""));
    setFormEmail(data.email ?? "");
    setFormDisponibilidad(data.disponibilidad ?? "DISPONIBLE");
  };

  const loadProgreso = async () => {
    try {
      const [modulosCP, progresosModuloData] = await Promise.all([
        getModulosConProgreso(usuario?.empresaId),
        getMisProgresosModulo(),
      ]);
      setModulos(modulosCP);
      setProgresosModulo(progresosModuloData);
    } catch {}
  };

  const patchPerfil = async (payload: Record<string, unknown>) => {
    if (!perfil) return false;
    try {
      const res = await apiFetch(`${API_URL}/users/me`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated: PerfilCompleto = await res.json();
        setPerfil(updated);
        resetForm(updated);
        // Actualizar contexto solo con los campos que usa la UI global (navbar, etc.)
        guardarUsuario({
          ...usuario!,
          nombre:     updated.nombre,
          apellidos:  updated.apellidos,
          avatarUrl:  updated.avatarUrl,
          bannerUrl:  updated.bannerUrl,
        });
        return true;
      }
    } catch {}
    return false;
  };

  const handleGuardar = async () => {
    const nombreFinal    = formNombre.trim().replace(/\s+/g, " ");
    const apellidosFinal = formApellidos.trim().replace(/\s+/g, " ");
    const puestoFinal    = formPuesto.trim().replace(/\s+/g, " ");
    const digits         = formTelefono.replace(/\D/g, "");
    // formTelefono guarda solo dígitos sin +34, lo reconstruimos al guardar
    const telefonoFinal = formTelefono.trim() ? `+34 ${formTelefono.trim()}` : "";
    // Para comparar sin cambios: la versión almacenada en perfil también sin prefijo
    const telefonoOriginal = (perfil?.telefono ?? "").replace(/^\+34\s?/, "");

    // Validación
    const nuevosErrores: typeof errores = {};
    if (!nombreFinal)                    nuevosErrores.nombre    = "El nombre es obligatorio";
    else if (nombreFinal.length < 2)     nuevosErrores.nombre    = "Mínimo 2 caracteres";
    if (!apellidosFinal)                 nuevosErrores.apellidos = "Los apellidos son obligatorios";
    else if (apellidosFinal.length < 2)  nuevosErrores.apellidos = "Mínimo 2 caracteres";
    if (digits.length > 0 && digits.length < 9) nuevosErrores.telefono = "Debe tener 9 dígitos";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const emailFinal = formEmail.trim();

    // Sin cambios reales → no llamar al backend
    const sinCambios = esAdmin
      ? (nombreFinal        === (perfil?.nombre        ?? "")      &&
         apellidosFinal     === (perfil?.apellidos      ?? "")      &&
         puestoFinal        === (perfil?.puestoTrabajo  ?? "")      &&
         formTelefono.trim() === telefonoOriginal                    &&
         formDisponibilidad  === (perfil?.disponibilidad ?? "DISPONIBLE") &&
         emailFinal         === (perfil?.email          ?? ""))
      : (emailFinal         === (perfil?.email          ?? "")      &&
         formTelefono.trim() === telefonoOriginal);

    if (sinCambios) { setEditando(false); return; }

    setSaving(true);
    const payload: Record<string, unknown> = esAdmin
      ? {
          nombre:         nombreFinal,
          apellidos:      apellidosFinal,
          puestoTrabajo:  puestoFinal,
          telefono:       telefonoFinal,
          disponibilidad: formDisponibilidad,
          email:          emailFinal,
        }
      : {
          email:          emailFinal,
          telefono:       telefonoFinal,
        };
    const ok = await patchPerfil(payload);
    setSaving(false);
    if (ok) { setErrores({}); setEditando(false); }
  };

  const handleCancelar = () => {
    if (perfil) resetForm(perfil);
    setErrores({});
    setEditando(false);
  };

  const handleSelectBanner = async (src: string) => {
    setSavingBanner(true);
    await patchPerfil({ bannerUrl: src });
    setSavingBanner(false);
    setShowBannerPicker(false);
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > 50 * 1024 * 1024) {
      alert("La imagen no debe exceder 50 MB.");
      return;
    }
    setUploadingBanner(true);
    try {
      const url = await subirImagenBanner(file);
      await patchPerfil({ bannerUrl: url });
      setShowBannerPicker(false);
    } catch {
      alert("No se pudo subir la imagen. Intenta con un archivo JPG, PNG o WebP de menos de 50 MB.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleEnviarSugerencia = async () => {
    if (!sugerencia.trim()) return;
    setEnviandoSug(true);
    try {
      const res = await apiFetch(`${API_URL}/sugerencias`, {
        method: "POST",
        body: JSON.stringify({ mensaje: sugerencia.trim(), destinatario: destinatarioSug }),
      });
      if (res.ok) {
        setEstadoSug("ok");
        setSugerencia("");
        setTimeout(() => setEstadoSug("idle"), 4000);
      } else {
        setEstadoSug("error");
        setTimeout(() => setEstadoSug("idle"), 4000);
      }
    } catch {
      setEstadoSug("error");
      setTimeout(() => setEstadoSug("idle"), 4000);
    } finally {
      setEnviandoSug(false);
    }
  };

  const handleGuardarEmpresa = async () => {
    if (!usuario?.empresaId) return;
    const nombreFinal = formEmpNombre.trim();
    const cifFinal = formEmpCif.trim();
    const emailFinal = formEmpEmail.trim();
    if (!nombreFinal) return;

    setSavingEmpresa(true);
    try {
      const updated = await actualizarEmpresa(usuario.empresaId, {
        nombreEmpresa: nombreFinal,
        cif: cifFinal,
        emailContacto: emailFinal,
      });
      setEmpresaData({
        nombreEmpresa: updated.nombreEmpresa ?? "",
        cif: updated.cif ?? "",
        emailContacto: updated.emailContacto ?? "",
        logoEmpresaUrl: empresaData?.logoEmpresaUrl,
      });
      setFormEmpNombre(updated.nombreEmpresa ?? "");
      setFormEmpCif(updated.cif ?? "");
      setFormEmpEmail(updated.emailContacto ?? "");
      guardarUsuario({
        ...usuario!,
        nombreEmpresa: updated.nombreEmpresa,
      });
      setEditandoEmpresa(false);
    } catch {
      alert("Error al guardar los datos de la empresa");
    } finally {
      setSavingEmpresa(false);
    }
  };

  const handleCancelarEmpresa = () => {
    if (empresaData) {
      setFormEmpNombre(empresaData.nombreEmpresa);
      setFormEmpCif(empresaData.cif);
      setFormEmpEmail(empresaData.emailContacto);
    }
    setEditandoEmpresa(false);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuario?.empresaId) return;
    e.target.value = "";
    setUploadingLogo(true);
    try {
      const result = await subirLogoEmpresa(usuario.empresaId, file);
      setEmpresaData(prev => prev ? { ...prev, logoEmpresaUrl: result.logoEmpresaUrl } : prev);
      guardarUsuario({ ...usuario!, logoEmpresaUrl: result.logoEmpresaUrl });
    } catch {
      alert("No se pudo subir el logo. Intenta con un archivo JPG, PNG o WebP de menos de 5 MB.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > 50 * 1024 * 1024) {
      alert("La imagen no debe exceder 50 MB.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir la imagen");
      const data = await res.json();
      setPerfil((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : prev);
      guardarUsuario({ ...usuario!, avatarUrl: data.avatarUrl });
    } catch {
      alert("No se pudo subir la imagen. Intenta con un archivo JPG, PNG o WebP de menos de 50 MB.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const completados   = modulos.filter((m) => m.status === "completado").length;
  const pendientes    = modulos.filter((m) => m.status === "pendiente").length;
  const pctOnboarding = modulos.length > 0 ? Math.round((completados / modulos.length) * 100) : 0;

  // Módulo actual: primero "en progreso", luego el primer pendiente
  const moduloActual = (() => {
    const enProgreso = modulos.find(m => m.status === "en progreso");
    if (enProgreso) return enProgreso;
    return modulos.find(m => m.status === "pendiente");
  })();

  const progresoModuloActual = moduloActual
    ? progresosModulo.find(p => p.moduloId === moduloActual.moduloId) ?? null
    : null;

  const pctModuloActual = progresoModuloActual?.porcentaje ?? 0;

  // La segunda tarjeta tiene contenido si hay módulos y (hay pendientes o todo completado)
  const haySegundaTarjeta = modulos.length > 0 && (moduloActual != null || pctOnboarding === 100);

  // PREVIEW para desarrollo: módulo de ejemplo cuando no hay datos reales
  const moduloPreview = modulos.length === 0
    ? { moduloId: "__preview__", titulo: "Prevención de Riesgos Laborales", tipoModulo: "Formación básica" }
    : null;
  const pctPreview = 35;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gris-pagina)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--azul-egm)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const disp = DISPONIBILIDAD_CONFIG[perfil?.disponibilidad ?? "DISPONIBLE"];
  const initials = getInitials(perfil?.nombre ?? "", perfil?.apellidos ?? "");
  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--gris-pagina)" }}>

      <style>{`
        .buzon-card.buzon-focused {
          border-color: var(--azul-egm) !important;
        }
      `}</style>

      {/* ── Hero con imagen de fondo + contenido encima ── */}
      <div className="relative overflow-hidden flex items-center group"
        style={{ minHeight: "clamp(200px, 26vw, 300px)", boxShadow: "0 6px 32px rgba(0,0,0,0.22)" }}>
        <img
          src={perfil?.bannerUrl ?? "/background-dashboard.webp"}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 40%" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(13,27,46,0.92) 0%, rgba(13,27,46,0.55) 50%, rgba(13,27,46,0.30) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,27,46,0.50) 0%, transparent 40%)" }} />

        {/* Contenido sobre la imagen */}
        <div className="relative z-10 w-full px-6 sm:px-9 lg:px-14 py-10 sm:py-14" style={{ paddingTop: "80px" }}>
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0" style={{ animation: "heroFadeUp 0.5s ease both" }}>
              <div
                className="rounded-full overflow-hidden flex items-center justify-center font-bold"
                style={{ width: "90px", height: "90px", background: perfil?.avatarUrl ? "transparent" : getAvatarColor(perfil?.nombre ?? ""), color: "#fff", border: "3px solid rgba(255,255,255,0.4)", fontSize: "2rem" }}
              >
                {uploadingAvatar ? (
                  <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                  </svg>
                ) : perfil?.avatarUrl ? (
                  <Image src={perfil.avatarUrl} alt="Avatar" width={90} height={90} className="object-cover rounded-full" />
                ) : initials}
              </div>
              <button
                type="button"
                onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-11 h-11 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: "rgba(0,0,0,0.65)", color: "#fff", border: "2px solid rgba(255,255,255,0.3)", opacity: uploadingAvatar ? 0.5 : 1 }}
              >
                <Camera className="sm:hidden" size={20} />
                <Camera className="hidden sm:block" size={17} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Nombre + empresa */}
            <div className="text-center sm:text-left min-w-0 overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5 truncate"
                style={{ color: "rgba(255,255,255,0.85)", animation: "heroFadeUp 0.6s ease both" }}>
                {perfil?.nombreEmpresa ?? ""}
              </p>
              <div style={{ animation: "heroFadeUp 0.6s ease 0.08s both" }}>
                <span
                  style={{
                    fontFamily:           "'Instrument Serif', serif",
                    fontStyle:            "italic",
                    fontWeight:           700,
                    fontSize:             "clamp(2.2rem, 5vw, 3.5rem)",
                    lineHeight:           1.05,
                    backgroundImage:      "linear-gradient(90deg, #ffffff, var(--verde-oliva-hover), #ffffff)",
                    backgroundSize:       "300% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor:  "transparent",
                    backgroundClip:       "text",
                    animation:            "heroFadeUp 0.6s ease 0.08s both, gradientShift 6s ease infinite",
                    display:              "block",
                    overflowWrap:         "break-word",
                    wordBreak:            "break-word",
                  }}
                >
                  {perfil?.nombre} {perfil?.apellidos}
                </span>
              </div>
              {perfil?.puestoTrabajo && (
                <p className="text-sm mt-1.5 truncate" style={{ color: "rgba(255,255,255,0.55)", animation: "heroFadeUp 0.6s ease 0.2s both" }}>
                  {perfil.puestoTrabajo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botón cambiar portada — esquina inferior derecha */}
        <button
          type="button"
          onClick={() => setShowBannerPicker(true)}
          className="absolute z-20 flex items-center gap-2 bottom-4 right-4 sm:bottom-5 sm:right-5"
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            background: "rgba(0,0,0,0.50)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(255,255,255,0.15)",
            cursor: "pointer",
            userSelect: "none",
            fontSize: "13px",
            fontWeight: 500,
            transition: "background 0.15s ease, border-color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.70)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.30)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.50)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          }}
        >
          <Camera size={14} strokeWidth={2} />
          <span>Cambiar portada</span>
        </button>
      </div>

      {/* ── Contenido ── */}
      <div className="px-6 sm:px-12 lg:px-20 pt-12 pb-16 flex flex-col gap-14">

        {/* ── Datos personales — ancho completo ── */}
        <div className="flex flex-col gap-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 style={{
              fontFamily:  "var(--font-raleway), sans-serif",
              fontWeight:  800,
              fontSize:    "clamp(1.6rem, 3vw, 2.2rem)",
              lineHeight:  1.1,
              color:       "var(--texto-primario)",
              letterSpacing: "-0.02em",
            }}>Datos personales</h2>
            {!editando ? (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
              >
                <Pencil size={13} /> Editar
              </button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <button onClick={handleCancelar}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: "var(--gris-borde)", color: "var(--texto-muted)" }}>
                  <X size={13} /> Cancelar
                </button>
                <button onClick={handleGuardar} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-opacity"
                  style={{ background: "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)", color: "#fff", opacity: saving ? 0.7 : 1 }}>
                  <Check size={13} /> {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 min-w-0">

            {/* Nombre */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Nombre</p>
              {editando && esAdmin ? (
                <div className="flex flex-col gap-1">
                  <input
                    value={formNombre}
                    onChange={(e) => { setFormNombre(normalizarNombre(e.target.value)); if (errores.nombre) setErrores(p => ({ ...p, nombre: undefined })); }}
                    onBlur={(e) => { e.target.style.borderColor = errores.nombre ? "var(--error)" : "var(--gris-borde)"; }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; }}
                    maxLength={50}
                    className="w-full px-3 py-2.5 text-base rounded-xl border outline-none transition-colors"
                    style={{ borderColor: errores.nombre ? "var(--error)" : "var(--gris-borde)", color: "var(--texto-primario)" }}
                  />
                  <p className="text-xs h-4" style={{ color: "var(--error)" }}>{errores.nombre ?? ""}</p>
                </div>
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: "var(--texto-primario)" }}>{perfil?.nombre ?? "—"}</p>
              )}
            </div>

            {/* Apellidos */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Apellidos</p>
              {editando && esAdmin ? (
                <div className="flex flex-col gap-1">
                  <input
                    value={formApellidos}
                    onChange={(e) => { setFormApellidos(normalizarNombre(e.target.value)); if (errores.apellidos) setErrores(p => ({ ...p, apellidos: undefined })); }}
                    onBlur={(e) => { e.target.style.borderColor = errores.apellidos ? "var(--error)" : "var(--gris-borde)"; }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; }}
                    maxLength={80}
                    className="w-full px-3 py-2.5 text-base rounded-xl border outline-none transition-colors"
                    style={{ borderColor: errores.apellidos ? "var(--error)" : "var(--gris-borde)", color: "var(--texto-primario)" }}
                  />
                  <p className="text-xs h-4" style={{ color: "var(--error)" }}>{errores.apellidos ?? ""}</p>
                </div>
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: perfil?.apellidos ? "var(--texto-primario)" : "var(--texto-muted)" }}>{perfil?.apellidos || "—"}</p>
              )}
            </div>

            {/* Puesto */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Puesto de trabajo</p>
              {editando && esAdmin ? (
                <div className="flex flex-col gap-1">
                  <input
                    value={formPuesto}
                    onChange={(e) => setFormPuesto(e.target.value.slice(0, MAX_PUESTO))}
                    onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--gris-borde)"; }}
                    placeholder="Ej: Responsable de calidad"
                    maxLength={MAX_PUESTO}
                    className="w-full px-3 py-2.5 text-base rounded-xl border outline-none transition-colors"
                    style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                  />
                  <p className="text-xs h-4 text-right" style={{ color: formPuesto.length >= MAX_PUESTO - 10 ? "var(--advertencia)" : "var(--texto-muted)" }}>
                    {formPuesto.length > 0 ? `${formPuesto.length}/${MAX_PUESTO}` : ""}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: perfil?.puestoTrabajo ? "var(--texto-primario)" : "var(--texto-muted)" }}>{perfil?.puestoTrabajo || "—"}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Teléfono</p>
              {editando ? (
                <div className="flex flex-col gap-1">
                  <div
                    className="flex items-center rounded-xl border overflow-hidden transition-colors"
                    style={{ borderColor: errores.telefono ? "var(--error)" : "var(--gris-borde)" }}
                    onFocusCapture={(e) => {
                      if (!errores.telefono) (e.currentTarget as HTMLElement).style.borderColor = "var(--azul-egm)";
                    }}
                    onBlurCapture={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = errores.telefono ? "var(--error)" : "var(--gris-borde)";
                    }}
                  >
                    <span className="px-3 py-2.5 text-base select-none shrink-0 border-r"
                      style={{ color: "var(--texto-muted)", borderColor: "var(--gris-borde)", background: "#f5f6f8" }}>
                      +34
                    </span>
                    <input
                      value={formTelefono.replace(/^\+34\s?/, "")}
                      onChange={(e) => {
                        setFormTelefono(normalizeTelefono(e.target.value));
                        if (errores.telefono) setErrores(p => ({ ...p, telefono: undefined }));
                      }}
                      onBlur={() => {
                        const digits = formTelefono.replace(/\D/g, "");
                        if (digits.length > 0 && digits.length < 9)
                          setErrores(p => ({ ...p, telefono: "Debe tener 9 dígitos" }));
                        else setErrores(p => ({ ...p, telefono: undefined }));
                      }}
                      placeholder="600 000 000"
                      className="flex-1 px-3 py-2.5 text-base outline-none"
                      style={{ color: "var(--texto-primario)" }}
                      inputMode="tel"
                    />
                  </div>
                  <p className="text-xs h-4" style={{ color: "var(--error)" }}>{errores.telefono ?? ""}</p>
                </div>
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: perfil?.telefono ? "var(--texto-primario)" : "var(--texto-muted)" }}>{perfil?.telefono || "—"}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Email</p>
              {editando ? (
                <input
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  type="email"
                  className="w-full px-3 py-2.5 text-base rounded-xl border outline-none transition-colors"
                  style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--gris-borde)"; }}
                />
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: "var(--texto-primario)" }}>{perfil?.email ?? "—"}</p>
              )}
            </div>

            {/* Empresa — siempre solo lectura */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Empresa</p>
              {editando ? (
                <input value={perfil?.nombreEmpresa ?? ""} readOnly
                  className="w-full px-3 py-2.5 text-base rounded-xl border cursor-not-allowed select-none"
                  style={{ borderColor: "var(--gris-borde)", color: "var(--texto-muted)", background: "#e8eaed", outline: "none" }}
                  onFocus={(e) => e.target.blur()} />
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: "var(--texto-primario)" }}>{perfil?.nombreEmpresa ?? "—"}</p>
              )}
            </div>

            {/* Incorporación — siempre solo lectura */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Incorporación</p>
              {editando ? (
                <input value={formatDate(perfil?.fechaRegistro)} readOnly
                  className="w-full px-3 py-2.5 text-base rounded-xl border cursor-not-allowed select-none"
                  style={{ borderColor: "var(--gris-borde)", color: "var(--texto-muted)", background: "#e8eaed", outline: "none" }}
                  onFocus={(e) => e.target.blur()} />
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: "var(--texto-primario)" }}>{formatDate(perfil?.fechaRegistro)}</p>
              )}
            </div>

            {/* Disponibilidad */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Disponibilidad</p>
              {editando && esAdmin ? (
                <div ref={dispRef} className="relative w-full">
                  {/* Trigger */}
                  <button
                    type="button"
                    onClick={() => setDispOpen(o => !o)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-base rounded-xl border outline-none transition-colors text-left"
                    style={{
                      borderColor: dispOpen ? "var(--azul-egm)" : "var(--gris-borde)",
                      color: "var(--texto-primario)",
                      background: "#fff",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DISPONIBILIDAD_CONFIG[formDisponibilidad].dot }} />
                      {DISPONIBILIDAD_CONFIG[formDisponibilidad].label}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ color: "var(--texto-muted)", transform: dispOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Dropdown panel */}
                  {dispOpen && (
                    <div
                      className="absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden"
                      style={{
                        border: "1.5px solid var(--azul-egm)",
                        background: "#fff",
                        boxShadow: "0 8px 24px rgba(27,63,126,0.13)",
                      }}
                    >
                      {Object.entries(DISPONIBILIDAD_CONFIG).map(([k, v]) => {
                        const isSelected = formDisponibilidad === k;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => { setFormDisponibilidad(k as Disponibilidad); setDispOpen(false); }}
                            className={`disp-option${isSelected ? " disp-option--selected" : ""}`}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: v.dot }} />
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full text-base font-medium"
                  style={{ background: disp.bg, color: disp.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: disp.dot }} />
                  {disp.label}
                </span>
              )}
            </div>

          </div>

        </div>

        {/* ── Datos de empresa (solo admin) ── */}
        {esAdmin && (
        <div className="flex flex-col gap-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 style={{
              fontFamily:  "var(--font-raleway), sans-serif",
              fontWeight:  800,
              fontSize:    "clamp(1.6rem, 3vw, 2.2rem)",
              lineHeight:  1.1,
              color:       "var(--texto-primario)",
              letterSpacing: "-0.02em",
            }}>Datos de empresa</h2>
            {!editandoEmpresa ? (
              <button
                onClick={() => setEditandoEmpresa(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
                style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
              >
                <Pencil size={13} /> Editar
              </button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <button onClick={handleCancelarEmpresa}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: "var(--gris-borde)", color: "var(--texto-muted)" }}>
                  <X size={13} /> Cancelar
                </button>
                <button onClick={handleGuardarEmpresa} disabled={savingEmpresa}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-opacity"
                  style={{ background: "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)", color: "#fff", opacity: savingEmpresa ? 0.7 : 1 }}>
                  <Check size={13} /> {savingEmpresa ? "Guardando…" : "Guardar"}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 min-w-0">
            {/* Logo empresa */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Logo</p>
              <div className="flex items-center gap-4">
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                  style={{
                    width: 80, height: 80,
                    background: "var(--gris-superficie)",
                    border: "1px solid var(--gris-borde)",
                  }}
                >
                  {uploadingLogo ? (
                    <div className="w-6 h-6 rounded-full border-2 animate-spin"
                      style={{ borderColor: "var(--azul-egm)", borderTopColor: "transparent" }} />
                  ) : empresaData?.logoEmpresaUrl ? (
                    <img src={empresaData.logoEmpresaUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <Building2 size={28} style={{ color: "var(--texto-muted)" }} />
                  )}
                </div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{ background: "var(--gris-superficie)", color: "var(--texto-secundario)", opacity: uploadingLogo ? 0.6 : 1 }}
                >
                  <Camera size={13} /> {empresaData?.logoEmpresaUrl ? "Cambiar" : "Subir logo"}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
            </div>

            {/* Nombre empresa */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Nombre de la empresa</p>
              {editandoEmpresa ? (
                <div className="flex flex-col gap-1">
                  <input
                    value={formEmpNombre}
                    onChange={(e) => setFormEmpNombre(e.target.value)}
                    onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--gris-borde)"; }}
                    placeholder="Nombre de la empresa"
                    className="w-full px-3 py-2.5 text-base rounded-xl border outline-none transition-colors"
                    style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                  />
                </div>
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: "var(--texto-primario)" }}>{empresaData?.nombreEmpresa || "—"}</p>
              )}
            </div>

            {/* CIF */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>CIF</p>
              {editandoEmpresa ? (
                <div className="flex flex-col gap-1">
                  <input
                    value={formEmpCif}
                    onChange={(e) => setFormEmpCif(e.target.value.toUpperCase())}
                    onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--gris-borde)"; }}
                    placeholder="B12345678"
                    className="w-full px-3 py-2.5 text-base rounded-xl border outline-none transition-colors"
                    style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                  />
                </div>
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: "var(--texto-primario)" }}>{empresaData?.cif || "—"}</p>
              )}
            </div>

            {/* Email contacto */}
            <div className="flex flex-col gap-2 min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>Email de contacto</p>
              {editandoEmpresa ? (
                <div className="flex flex-col gap-1">
                  <input
                    value={formEmpEmail}
                    onChange={(e) => setFormEmpEmail(e.target.value)}
                    type="email"
                    onFocus={(e) => { e.target.style.borderColor = "var(--azul-egm)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--gris-borde)"; }}
                    placeholder="empresa@ejemplo.com"
                    className="w-full px-3 py-2.5 text-base rounded-xl border outline-none transition-colors"
                    style={{ borderColor: "var(--gris-borde)", color: "var(--texto-primario)" }}
                  />
                </div>
              ) : (
                <p className="text-lg font-medium truncate min-w-0" style={{ color: "var(--texto-primario)" }}>{empresaData?.emailContacto || "—"}</p>
              )}
            </div>
          </div>
        </div>
        )}

        {/* ── Sección formación ── */}
        {!isSuperAdmin && (
        <div className="flex flex-col gap-7">
        <h2 style={{
          fontFamily: "var(--font-raleway), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          lineHeight: 1.1,
          color: "var(--texto-primario)",
          letterSpacing: "-0.02em",
        }}>Formación</h2>

        {/* ── Fila de estadísticas ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Quesito formación — ocupa todo el ancho si no hay segunda tarjeta */}
          <div className={`rounded-2xl p-5 sm:p-7 flex items-center gap-5 sm:gap-7 relative overflow-hidden${!haySegundaTarjeta && !moduloPreview ? " sm:col-span-2" : ""}`}
            style={{ background: "var(--azul-egm)", border: "1px solid transparent" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 90% 20%, rgba(163,181,53,0.45) 0%, transparent 60%)", pointerEvents: "none" }} />
            <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
              <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
                <path fill="none" strokeWidth="2.5" stroke="rgba(255,255,255,0.12)"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path fill="none" strokeWidth="2.5" stroke="var(--verde-oliva-hover)" strokeLinecap="round"
                  strokeDasharray={`${pctOnboarding}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold" style={{ color: "#fff", fontSize: "1.2rem" }}>{pctOnboarding}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Progreso formación</p>
              <p className="font-bold leading-tight" style={{ color: "#fff", fontSize: "1.35rem" }}>
                {completados} <span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.5)" }}>de {modulos.length} cursos</span>
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {pendientes > 0 ? `${pendientes} curso${pendientes !== 1 ? "s" : ""} pendiente${pendientes !== 1 ? "s" : ""}` : "¡Todo completado!"}
              </p>
            </div>
          </div>

          {/* Módulo actual / Preview / Completado */}
          {moduloPreview ? (
            <div className="rounded-2xl p-5 sm:p-7 flex items-center gap-5 sm:gap-7"
              style={{ background: "var(--azul-egm-light)", border: "1px solid rgba(27,63,126,0.15)" }}>
              <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
                <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
                  <path fill="none" strokeWidth="2.5" stroke="rgba(27,63,126,0.12)"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path fill="none" strokeWidth="2.5" stroke="var(--azul-egm)" strokeLinecap="round"
                    strokeDasharray={`${pctPreview}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-bold" style={{ color: "var(--azul-egm)", fontSize: "1.2rem" }}>{pctPreview}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--azul-egm)" }}>Continúa donde lo dejaste</p>
                  <p className="font-bold leading-tight truncate" style={{ color: "var(--texto-primario)", fontSize: "1.1rem" }}>{moduloPreview.titulo}</p>
                </div>
                <button
                  onClick={() => router.push("/dashboard/formacion")}
                  className="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)", color: "#fff" }}
                >
                  Continuar <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ) : pctOnboarding === 100 ? (
            <div className="rounded-2xl p-5 sm:p-7 flex items-center gap-5 sm:gap-7"
              style={{ background: "var(--azul-egm-light)", border: "1.5px solid var(--azul-egm)" }}>
              <div className="shrink-0 flex items-center justify-center rounded-2xl"
                style={{ width: 84, height: 84, background: "rgba(27,63,126,0.1)" }}>
                <Award size={38} style={{ color: "var(--azul-egm)" }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--azul-egm)" }}>Formación completada</p>
                <p className="font-bold leading-tight" style={{ color: "var(--texto-primario)", fontSize: "1.35rem" }}>¡Enhorabuena!</p>
                <p className="text-sm" style={{ color: "var(--texto-secundario)" }}>Has completado todos los cursos</p>
              </div>
            </div>
          ) : moduloActual ? (
            <div className="rounded-2xl p-5 sm:p-7 flex items-center gap-5 sm:gap-7"
              style={{ background: "var(--azul-egm-light)", border: "1px solid rgba(27,63,126,0.15)" }}>

              {/* Quesito del módulo actual — mismo tamaño que el principal */}
              <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
                <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
                  <path fill="none" strokeWidth="2.5" stroke="rgba(27,63,126,0.12)"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path fill="none" strokeWidth="2.5" stroke="var(--azul-egm)" strokeLinecap="round"
                    strokeDasharray={`${pctModuloActual}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-bold" style={{ color: "var(--azul-egm)", fontSize: "1.2rem" }}>{pctModuloActual}%</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--azul-egm)" }}>
                    {pctModuloActual > 0 ? "Continúa donde lo dejaste" : "Siguiente curso"}
                  </p>
                  <p className="font-bold leading-tight truncate" style={{ color: "var(--texto-primario)", fontSize: "1.1rem" }}>{moduloActual.nombre}</p>
                </div>
                <button
                  onClick={() => router.push("/dashboard/formacion")}
                  className="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)", color: "#fff" }}
                >
                  {pctModuloActual > 0 ? "Continuar" : "Empezar"} <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ) : null}

        </div>

        </div>
        )}

{/* ── Mis documentos (solo para empleados; admins no lo necesitan) ── */}
{!esAdmin && (
  <div id="mis-documentos" className="scroll-mt-20">
    <MisDocumentos />
  </div>
)}

{/* ── Buzón de sugerencias ── */}
  {!isSuperAdmin && (
  <div className="grid grid-cols-1 gap-8 items-start">

          {/* ── Buzón ── */}
          <div className="flex flex-col gap-4">
            <h2 style={{
              fontFamily: "var(--font-raleway), sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)",
              lineHeight: 1.2,
              color: "var(--texto-primario)",
              letterSpacing: "-0.01em",
            }}>Buzón de sugerencias</h2>

            {/* Card unificada */}
            <div className="buzon-card flex flex-col rounded-2xl overflow-hidden flex-1"
              style={{ border: "1px solid var(--gris-borde)", background: "var(--blanco)", transition: "border-color 0.15s" }}>

              {/* Cabecera: destinatario */}
              <div className="flex items-center gap-4 px-5 py-3"
                style={{ borderBottom: "1px solid var(--gris-borde)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: "var(--texto-muted)" }}>
                  Enviar a
                </p>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "var(--azul-egm)", color: "#fff", boxShadow: "0 2px 8px rgba(27,63,126,0.25)" }}>
                  EGM Atalayas
                </span>
              </div>

              {/* Textarea */}
              <textarea
                value={sugerencia}
                onChange={(e) => { setSugerencia(e.target.value.slice(0, 500)); if (estadoSug !== "idle") setEstadoSug("idle"); }}
                placeholder="Escribe tu sugerencia para EGM Atalayas…"
                rows={3}
                className="w-full px-5 py-4 text-base outline-none resize-none flex-1"
                style={{ color: "var(--texto-primario)", lineHeight: 1.6, background: "transparent", border: "none", minHeight: "140px" }}
                onFocus={(e) => e.currentTarget.closest(".buzon-card")?.classList.add("buzon-focused")}
                onBlur={(e) => e.currentTarget.closest(".buzon-card")?.classList.remove("buzon-focused")}
              />

              {/* Footer: barra de progreso + botón */}
              <div className="flex flex-col gap-0"
                style={{ borderTop: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                {/* Barra de progreso */}
                <div style={{ height: "2px", background: "var(--gris-borde)" }}>
                  <div style={{
                    height: "100%",
                    width: `${(sugerencia.length / 500) * 100}%`,
                    background: sugerencia.length >= 450 ? "var(--advertencia)" : "var(--azul-egm)",
                    transition: "width 0.2s, background 0.3s",
                    borderRadius: "0 2px 2px 0",
                  }} />
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <p className="text-xs" style={{ color: sugerencia.length >= 450 ? "var(--advertencia)" : "var(--texto-muted)", opacity: sugerencia.length === 0 ? 0.4 : 1, transition: "opacity 0.2s, color 0.3s" }}>
                    {sugerencia.length}/500
                  </p>
                  <div>
                    {estadoSug === "ok" ? (
                      <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--exito)" }}>
                        <Check size={14} strokeWidth={2.5} /> Enviado
                      </div>
                    ) : estadoSug === "error" ? (
                      <p className="text-xs font-medium" style={{ color: "var(--error)" }}>Error al enviar, inténtalo de nuevo</p>
                    ) : (
                      <button
                        onClick={handleEnviarSugerencia}
                        disabled={!sugerencia.trim() || enviandoSug}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold"
                        style={{
                          background: "linear-gradient(135deg, #2563eb 0%, #1b3f7e 100%)",
                          color: "#fff",
                          opacity: (!sugerencia.trim() || enviandoSug) ? 0.45 : 1,
                          transition: "opacity 0.2s",
                          cursor: (!sugerencia.trim() || enviandoSug) ? "not-allowed" : "pointer",
                        }}
                      >
                        {enviandoSug ? "Enviando…" : "Enviar"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
        )}

      </div>

      {/* ── Modal selector de portada ── */}
      {showBannerPicker && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBannerPicker(false); }}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ background: "var(--blanco)", boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between px-7 py-5" style={{ background: "var(--azul-egm)" }}>
              <div>
                <p className="font-bold text-lg" style={{ color: "#fff" }}>Elige tu portada</p>
                <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>Se aplicará aquí y en tu inicio</p>
              </div>
              <button
                onClick={() => setShowBannerPicker(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
              >
                <X size={16} />
              </button>
            </div>

            {/* Grupos de imágenes */}
            <div className="px-8 py-7 flex flex-col gap-8 overflow-y-auto" style={{ maxHeight: "65vh" }}>

              {/* Subir imagen personalizada */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--texto-muted)" }}>
                  Subir imagen
                </p>
                <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadBanner} />
                <button
                  onClick={() => bannerFileRef.current?.click()}
                  disabled={uploadingBanner}
                  className="w-full flex items-center justify-center gap-3 px-5 py-6 rounded-xl border-2 border-dashed transition-all"
                  style={{
                    borderColor: "var(--gris-borde)",
                    color: "var(--texto-muted)",
                    background: uploadingBanner ? "var(--gris-pagina)" : "transparent",
                    cursor: uploadingBanner ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => { if (!uploadingBanner) { e.currentTarget.style.borderColor = "var(--azul-egm)"; e.currentTarget.style.background = "var(--azul-egm-light)"; e.currentTarget.style.color = "var(--azul-egm)"; }}}
                  onMouseLeave={(e) => { if (!uploadingBanner) { e.currentTarget.style.borderColor = "var(--gris-borde)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--texto-muted)"; }}}
                >
                  {uploadingBanner ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
                      <span className="text-sm font-semibold">Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      <span className="text-sm font-semibold">Elige un archivo de tu ordenador</span>
                    </>
                  )}
                </button>
              </div>

              {BANNER_GRUPOS.map((grupo) => (
                <div key={grupo.grupo}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--texto-muted)" }}>
                    {grupo.grupo}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {grupo.imagenes.map((src) => {
                      const isActive = perfil?.bannerUrl === src;
                      return (
                        <button
                          key={src}
                          onClick={() => handleSelectBanner(src)}
                          disabled={savingBanner}
                          className="relative rounded-xl overflow-hidden transition-all"
                          style={{
                            height: "88px",
                            border: isActive ? "3px solid var(--azul-egm)" : "3px solid transparent",
                            opacity: savingBanner ? 0.6 : 1,
                            transform: isActive ? "scale(1.03)" : "scale(1)",
                          }}
                          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.transform = "scale(1.02)"; }}
                          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.transform = "scale(1)"; }}
                        >
                          <Image src={src} alt="" fill className="object-cover" />
                          {isActive && (
                            <div className="absolute inset-0 flex items-center justify-center"
                              style={{ background: "rgba(30,64,175,0.4)" }}>
                              <Check size={20} color="#fff" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function InfoField({ icon, label, value, muted = false }: {
  icon: React.ReactNode; label: string; value: string; muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--texto-muted)" }}>
        {icon} {label}
      </div>
      <p className="text-lg font-medium truncate min-w-0" style={{ color: muted ? "var(--texto-muted)" : "var(--texto-primario)" }}>
        {value}
      </p>
    </div>
  );
}

function FormField({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
        style={{ color: "var(--texto-muted)" }}>
        {label}
        {hint && <span className="normal-case tracking-normal font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
