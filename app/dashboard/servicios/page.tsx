"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardHero from "@/components/ui/DashboardHero";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getIconoBeneficio } from "@/lib/iconosBeneficio";
import { getServicios, crearServicio, editarServicio, desactivarServicio } from "@/lib/api/servicios";
import type { Servicio, ServicioInput, CategoriaServicio } from "@/lib/types/servicios";
import ServicioModal from "@/components/ui/ServicioModal";
import { ModalConfirm } from "@/components/ui/ModalConfirm";

// ── Mock mientras no esté el backend conectado ───────────────────────────────
const MOCK_SERVICIOS: Servicio[] = [
  // MOVILIDAD
  {
    servicioId: "m1", titulo: "Autobús lanzadera", categoria: "MOVILIDAD",
    descripcion: "Líneas 7 y 7P con frecuencias adaptadas al horario laboral. Bonos desde 7,50 €/mes.",
    iconoUrl: "transporte", urlInfo: "https://atalayas.com/autobus-lanzadera/",
    telefono: null, comoAcceder: "Adquiere tu bono en el portal de movilidad o en la parada de la línea 7.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  {
    servicioId: "m2", titulo: "Coche compartido", categoria: "MOVILIDAD",
    descripcion: "Plataforma Journify para compartir trayectos con compañeros del área. Ahorro de hasta 2.500 €/año.",
    iconoUrl: "parking", urlInfo: "https://atalayas.com/journify-coche-compartido/",
    telefono: null, comoAcceder: "Regístrate en Journify con tu correo corporativo y publica o busca tu ruta habitual.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  {
    servicioId: "m3", titulo: "Aparcamiento VAO", categoria: "MOVILIDAD",
    descripcion: "Plazas exclusivas para vehículos de alta ocupación (3-5 personas). Solicitud renovable cada 6 meses.",
    iconoUrl: "parking", urlInfo: "https://atalayas.com/aparcamientovao/",
    telefono: null, comoAcceder: "Forma un grupo de 3 a 5 trabajadores, registraos en Journify y solicitad la tarjeta VAO en recepción.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  // INSTALACIONES
  {
    servicioId: "i1", titulo: "Ludoteca", categoria: "INSTALACIONES",
    descripcion: "Centro educativo para bebés y niños en el edificio principal. Horario adaptado a la jornada laboral.",
    iconoUrl: "regalo", urlInfo: null,
    telefono: "647 76 33 89", comoAcceder: "Contacta por teléfono para reservar plaza y conocer el horario vigente.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  {
    servicioId: "i2", titulo: "Aula de formación", categoria: "INSTALACIONES",
    descripcion: "Sala con capacidad para 24-30 personas, proyector, WiFi y pizarra. Disponible para empresas del área.",
    iconoUrl: "formacion", urlInfo: null,
    telefono: null, comoAcceder: "Reserva la sala a través del formulario de solicitud en la web de EGM Atalayas.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  {
    servicioId: "i3", titulo: "Oficinas y salas de reuniones", categoria: "INSTALACIONES",
    descripcion: "Oficinas amuebladas desde 20 m² y salas de reuniones para alquiler puntual.",
    iconoUrl: "formacion", urlInfo: null,
    telefono: null, comoAcceder: "Contacta con recepción para consultar disponibilidad y tarifas.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  // INICIATIVAS
  {
    servicioId: "n1", titulo: "Empresas Solidarias", categoria: "INICIATIVAS",
    descripcion: "Programa colectivo de ayuda a familias en riesgo de exclusión. Más de 44.000 personas beneficiadas desde 2010.",
    iconoUrl: "seguro", urlInfo: "https://atalayas.com/empresas-solidarias/",
    telefono: null, comoAcceder: "Habla con tu empresa para sumarse al proyecto o contacta con EGM Atalayas directamente.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  {
    servicioId: "n2", titulo: "En Femenino", categoria: "INICIATIVAS",
    descripcion: "Red de visibilidad del talento femenino en el área empresarial. Jornadas, mesas redondas y mentoría.",
    iconoUrl: "deporte", urlInfo: "https://atalayas.com/en-femenino/",
    telefono: null, comoAcceder: "Sigue las próximas jornadas en la web y apúntate a través del formulario de inscripción.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  // COMUNES
  {
    servicioId: "c1", titulo: "Seguridad 24 h", categoria: "COMUNES",
    descripcion: "Vigilancia y protección de zonas comunes del área empresarial durante todo el día.",
    iconoUrl: "seguro", urlInfo: null,
    telefono: null, comoAcceder: "Servicio permanente. Ante cualquier incidencia, usa el canal de notificación en el dashboard.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
  {
    servicioId: "c2", titulo: "Correos y paquetería", categoria: "COMUNES",
    descripcion: "Buzones centralizados para todas las empresas del parque. Atención al público de 11:30 a 13:30.",
    iconoUrl: "compras", urlInfo: null,
    telefono: null, comoAcceder: "Accede directamente a la zona de buzones en el edificio central en el horario indicado.",
    creadoPor: null, activo: true, creadoEn: "", actualizadoEn: "",
  },
];

const CATEGORIAS: { value: CategoriaServicio; label: string; icono: React.ReactNode }[] = [
  {
    value: "MOVILIDAD",
    label: "Movilidad",
    icono: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM19.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>,
  },
  {
    value: "INSTALACIONES",
    label: "Instalaciones",
    icono: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m-2 0h2M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    value: "INICIATIVAS",
    label: "Iniciativas",
    icono: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    value: "COMUNES",
    label: "Servicios comunes",
    icono: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

// ── Fila de servicio ──────────────────────────────────────────────────────────
function FilaServicio({
  servicio, esSuperAdmin, onEditar, onDesactivar,
}: {
  servicio: Servicio; esSuperAdmin: boolean;
  onEditar: (s: Servicio) => void; onDesactivar: (s: Servicio) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const iconoNode = getIconoBeneficio(servicio.iconoUrl);

  useEffect(() => {
    if (!menuOpen) return;
    function onOut(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, [menuOpen]);

  return (
    <div
      className="flex flex-col"
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        transition: "background 0.15s ease",
      }}
    >
      {/* Fila principal */}
      <button
        type="button"
        onClick={() => setExpandido(p => !p)}
        className="flex items-center gap-4 px-5 py-4 text-left w-full"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(27,63,126,0.03)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        {/* Icono */}
        <div
          className="shrink-0 rounded-xl flex items-center justify-center"
          style={{
            width: "44px", height: "44px",
            background: "linear-gradient(135deg, #e8eef8 0%, #d4e0f5 100%)",
            color: "var(--azul-egm)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.8), 0 1px 4px rgba(27,63,126,0.10)",
            position: "relative", overflow: "hidden", flexShrink: 0,
          }}
        >
          {iconoNode ? (
            <span style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%) scale(0.61)", display: "flex",
            }}>
              {iconoNode}
            </span>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug" style={{ color: "#111827" }}>
            {servicio.titulo}
          </p>
          {servicio.descripcion && !expandido && (
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#6b7280" }}>
              {servicio.descripcion}
            </p>
          )}
        </div>

        {/* Acciones SuperAdmin */}
        {esSuperAdmin && (
          <div ref={menuRef} onClick={e => e.stopPropagation()} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="flex items-center justify-center rounded-lg"
              style={{
                width: "30px", height: "30px",
                background: menuOpen ? "rgba(0,0,0,0.06)" : "transparent",
                border: "none", cursor: "pointer", color: "#9ca3af",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)", width: "180px", zIndex: 20,
                background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "14px",
                boxShadow: "0 8px 28px rgba(0,0,0,0.12)", padding: "6px",
              }}>
                <MenuBtn label="Editar" onClick={() => { setMenuOpen(false); onEditar(servicio); }}
                  icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                />
                <MenuBtn label="Desactivar" danger onClick={() => { setMenuOpen(false); onDesactivar(servicio); }}
                  icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                />
              </div>
            )}
          </div>
        )}

        {/* Chevron expandir */}
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          style={{
            color: "#9ca3af", flexShrink: 0,
            transform: expandido ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s cubic-bezier(0.34,1.20,0.64,1)",
          }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Detalle expandido */}
      <div style={{
        overflow: "hidden",
        maxHeight: expandido ? "400px" : "0px",
        opacity: expandido ? 1 : 0,
        transition: "max-height 0.28s cubic-bezier(0.34,1.20,0.64,1), opacity 0.2s ease",
      }}>
        <div className="px-5 pb-5 flex flex-col gap-3" style={{ paddingLeft: "77px" }}>
          {servicio.descripcion && (
            <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{servicio.descripcion}</p>
          )}
          {servicio.comoAcceder && (
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ background: "rgba(27,63,126,0.05)" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                style={{ color: "var(--azul-egm)", flexShrink: 0, marginTop: "2px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: "var(--azul-egm)" }}>{servicio.comoAcceder}</p>
            </div>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            {servicio.urlInfo && (
              <a href={servicio.urlInfo} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "var(--azul-egm)" }}>
                Más información
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {servicio.telefono && (
              <a href={`tel:${servicio.telefono}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "#6b7280" }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {servicio.telefono}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Botón mini menú ───────────────────────────────────────────────────────────
function MenuBtn({ label, icon, danger = false, onClick }: {
  label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "10px", width: "100%",
        padding: "7px 10px", borderRadius: "10px", border: "none", cursor: "pointer",
        background: hov ? (danger ? "rgba(239,68,68,0.07)" : "rgba(0,0,0,0.045)") : "transparent",
        transition: "background 0.15s",
      }}
    >
      <span style={{
        width: "28px", height: "28px", borderRadius: "8px", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: danger ? "rgba(239,68,68,0.07)" : "rgba(0,0,0,0.05)",
        color: danger ? "#ef4444" : "#374151", flexShrink: 0,
      }}>{icon}</span>
      <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: danger ? "#ef4444" : "#111827" }}>{label}</span>
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}
        style={{ color: danger ? "#ef4444" : "#9ca3af" }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonFila() {
  return (
    <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="rounded-xl shrink-0" style={{ width: 44, height: 44, background: "#e5e7eb" }} />
      <div className="flex-1 flex flex-col gap-2">
        <div style={{ height: 14, width: "40%", background: "#e5e7eb", borderRadius: 6 }} />
        <div style={{ height: 11, width: "65%", background: "#f3f4f6", borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ServiciosPage() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.codigoRol === "ROLE_ADMIN";

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [confirmDes, setConfirmDes] = useState<Servicio | null>(null);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "err" } | null>(null);

  const mostrarToast = useCallback((msg: string, tipo: "ok" | "err" = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    const useMock = true; // ← cambiar a false cuando el backend esté conectado
    if (useMock) {
      const timer = setTimeout(() => { setServicios(MOCK_SERVICIOS); setCargando(false); }, 600);
      return () => clearTimeout(timer);
    }
    getServicios()
      .then(setServicios)
      .catch(() => mostrarToast("Error al cargar los servicios", "err"))
      .finally(() => setCargando(false));
  }, [mostrarToast]);

  async function handleGuardar(data: ServicioInput) {
    if (editando) {
      const updated = await editarServicio(editando.servicioId, data);
      setServicios(prev => prev.map(s => s.servicioId === updated.servicioId ? updated : s));
    } else {
      const nuevo = await crearServicio(data);
      setServicios(prev => [nuevo, ...prev]);
    }
  }

  async function confirmarDesactivar(servicio: Servicio) {
    try {
      await desactivarServicio(servicio.servicioId);
      setServicios(prev => prev.filter(s => s.servicioId !== servicio.servicioId));
      mostrarToast("Servicio desactivado");
    } catch {
      mostrarToast("Error al desactivar el servicio", "err");
    }
    setConfirmDes(null);
  }

  // Agrupar por categoría en el orden definido
  const porCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    items: servicios.filter(s => s.categoria === cat.value),
  })).filter(g => g.items.length > 0 || cargando);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <DashboardHero
        titulo="Servicios"
        subtitulo="Recursos y servicios del área empresarial EGM Atalayas disponibles para todos los trabajadores."
        variante="seccion"
      />
      {esSuperAdmin && (
        <div className="px-4 sm:px-6 lg:px-8 -mt-2">
          <Button variant="primary" onClick={() => { setEditando(null); setModalOpen(true); }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="mr-1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo servicio
          </Button>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
        {cargando ? (
          // Skeleton agrupado
          CATEGORIAS.map(cat => (
            <div key={cat.value} className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#f9fafb" }}>
                <div style={{ width: 18, height: 18, background: "#e5e7eb", borderRadius: 4 }} />
                <div style={{ width: 100, height: 14, background: "#e5e7eb", borderRadius: 6 }} />
              </div>
              {[1, 2].map(i => <SkeletonFila key={i} />)}
            </div>
          ))
        ) : (
          porCategoria.map(grupo => (
            <div key={grupo.value}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
            >
              {/* Cabecera de categoría */}
              <div className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#f9fafb" }}>
                <span style={{ color: "var(--azul-egm)" }}>{grupo.icono}</span>
                <span className="font-semibold text-sm" style={{ color: "#374151" }}>{grupo.label}</span>
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(27,63,126,0.08)", color: "var(--azul-egm)" }}>
                  {grupo.items.length}
                </span>
              </div>

              {/* Filas */}
              {grupo.items.map(s => (
                <FilaServicio
                  key={s.servicioId}
                  servicio={s}
                  esSuperAdmin={esSuperAdmin}
                  onEditar={s => { setEditando(s); setModalOpen(true); }}
                  onDesactivar={s => setConfirmDes(s)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Modal crear / editar */}
      {modalOpen && (
        <ServicioModal
          inicial={editando}
          onGuardar={handleGuardar}
          onCerrar={() => { setModalOpen(false); setEditando(null); }}
        />
      )}

      <ModalConfirm
        abierto={!!confirmDes}
        titulo="¿Desactivar servicio?"
        descripcion={confirmDes ? `"${confirmDes.titulo}" dejará de ser visible para los empleados.` : ""}
        textoConfirmar="Desactivar"
        variante="danger"
        onConfirmar={() => { confirmarDesactivar(confirmDes!); setConfirmDes(null); }}
        onCancelar={() => setConfirmDes(null)}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: `calc(28px + env(safe-area-inset-bottom))`,
          left: "50%", transform: "translateX(-50%)", zIndex: 99999,
          background: toast.tipo === "ok" ? "#111827" : "#dc2626",
          color: "#fff", borderRadius: "14px", padding: "12px 20px",
          fontSize: "0.875rem", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          animation: "toast-in 0.25s cubic-bezier(0.34,1.20,0.64,1) both",
          whiteSpace: "nowrap",
        }}>
          <style>{`@keyframes toast-in { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
          {toast.tipo === "ok"
            ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}
