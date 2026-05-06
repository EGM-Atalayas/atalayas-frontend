"use client";

import { useEffect, useState, useCallback } from "react";
import Link          from "next/link";
import DashboardHero from "@/components/ui/DashboardHero";
import { useAuth } from "@/context/AuthContext";
import { getBeneficios, crearBeneficio, editarBeneficio, desactivarBeneficio } from "@/lib/api/beneficios";
import type { Beneficio, BeneficioInput } from "@/lib/types/beneficios";
import BeneficioModal  from "@/components/ui/BeneficioModal";
import ConfirmDialog   from "@/components/ui/ConfirmDialog";

// ── Icono genérico por defecto ────────────────────────────────────────────────
function IconoDefault() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

// ── Badge caducidad ───────────────────────────────────────────────────────────
function BadgeCaducidad({ fechaFin }: { fechaFin: string }) {
  const fecha  = new Date(fechaFin);
  const hoy    = new Date();
  const dias   = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  const caduca = dias <= 30;

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: caduca ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
        color:      caduca ? "#dc2626"               : "#059669",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: caduca ? "#dc2626" : "#059669" }}
      />
      {dias <= 0
        ? "Caducada"
        : `Hasta ${fecha.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`}
    </span>
  );
}

// ── Card de beneficio ─────────────────────────────────────────────────────────
function BeneficioCard({
  beneficio,
  esSuperAdmin,
  onEditar,
  onDesactivar,
}: {
  beneficio:    Beneficio;
  esSuperAdmin: boolean;
  onEditar:     (b: Beneficio) => void;
  onDesactivar: (b: Beneficio) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        background:  "#ffffff",
        border:      "1px solid rgba(0,0,0,0.07)",
        boxShadow:   "0 2px 12px rgba(0,0,0,0.06)",
        animation:   "heroFadeUp 0.45s ease both",
      }}
    >
      {/* Cabecera — icono + título */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-3">
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "var(--azul-egm-light, #eef2ff)", color: "var(--azul-egm)" }}
        >
          {beneficio.iconoUrl ? (
            <img src={beneficio.iconoUrl} alt="" className="w-7 h-7 object-contain rounded" />
          ) : (
            <IconoDefault />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="font-semibold leading-snug"
            style={{ fontSize: "0.95rem", color: "#111827" }}
          >
            {beneficio.titulo}
          </h3>
          {beneficio.fechaFin && (
            <div className="mt-1">
              <BadgeCaducidad fechaFin={beneficio.fechaFin} />
            </div>
          )}
        </div>

        {/* Menú acciones — solo SuperAdmin */}
        {esSuperAdmin && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: menuOpen ? "rgba(0,0,0,0.06)" : "transparent",
                color:      "#9ca3af",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
              onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5"  r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-10 rounded-xl overflow-hidden"
                style={{
                  width:     "148px",
                  background: "#ffffff",
                  border:    "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                }}
              >
                <button
                  onClick={() => { setMenuOpen(false); onEditar(beneficio); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left"
                  style={{ color: "#374151", transition: "background 0.12s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDesactivar(beneficio); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left"
                  style={{ color: "#dc2626", transition: "background 0.12s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Desactivar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Separador */}
      <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />

      {/* Cuerpo */}
      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        {beneficio.descripcion && (
          <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>
            {beneficio.descripcion}
          </p>
        )}

        {beneficio.comoAcceder && (
          <div
            className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(var(--azul-egm-rgb, 22,50,105),0.05)" }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              style={{ color: "var(--azul-egm)", flexShrink: 0, marginTop: "1px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "var(--azul-egm)" }}>
              {beneficio.comoAcceder}
            </p>
          </div>
        )}
      </div>

      {/* Footer — enlace externo */}
      {beneficio.urlInfo && (
        <div className="px-5 pb-4">
          <a
            href={beneficio.urlInfo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: "var(--azul-egm)", transition: "opacity 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Más información
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

// ── Estado vacío ──────────────────────────────────────────────────────────────
function EstadoVacio({ esSuperAdmin, onNuevo }: { esSuperAdmin: boolean; onNuevo: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--azul-egm-light, #eef2ff)", color: "var(--azul-egm)" }}
      >
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: "#111827" }}>Sin ventajas publicadas</p>
        <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
          {esSuperAdmin ? "Crea la primera ventaja para los empleados del área." : "Pronto habrá ventajas disponibles."}
        </p>
      </div>
      {esSuperAdmin && (
        <button
          onClick={onNuevo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--azul-egm)", transition: "opacity 0.15s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva ventaja
        </button>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="px-5 pt-5 pb-3 flex items-start gap-3">
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f3f4f6", flexShrink: 0 }} />
            <div className="flex-1 flex flex-col gap-2">
              <div style={{ height: "14px", borderRadius: "6px", background: "#f3f4f6", width: "60%" }} />
              <div style={{ height: "10px", borderRadius: "6px", background: "#f3f4f6", width: "35%" }} />
            </div>
          </div>
          <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "0 20px" }} />
          <div className="px-5 py-4 flex flex-col gap-2">
            <div style={{ height: "10px", borderRadius: "6px", background: "#f3f4f6", width: "100%" }} />
            <div style={{ height: "10px", borderRadius: "6px", background: "#f3f4f6", width: "75%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function VentajasPage() {
  const { usuario } = useAuth();
  const esSuperAdmin = usuario?.codigoRol === "ROLE_ADMIN";

  const [beneficios, setBeneficios]     = useState<Beneficio[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editando, setEditando]           = useState<Beneficio | null>(null);
  const [confirmando, setConfirmando]     = useState<Beneficio | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await getBeneficios();
      setBeneficios(data);
    } catch (e) {
      console.error("[Ventajas] Error cargando beneficios:", e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirNuevo()             { setEditando(null); setModalOpen(true); }
  function abrirEditar(b: Beneficio) { setEditando(b);   setModalOpen(true); }

  async function handleGuardar(data: BeneficioInput) {
    if (editando) {
      await editarBeneficio(editando.beneficioId, data);
    } else {
      await crearBeneficio(data);
    }
    setModalOpen(false);
    cargar();
  }

  async function handleDesactivar(b: Beneficio) {
    setConfirmando(b);
  }

  async function confirmarDesactivar() {
    if (!confirmando) return;
    await desactivarBeneficio(confirmando.beneficioId);
    setConfirmando(null);
    cargar();
  }

  return (
    <div style={{ background: "var(--gris-pagina)", minHeight: "100vh" }}>
      <DashboardHero
        titulo="Ventajas"
        imagenFondo="/bg-ventajas.webp"
        objectPosition="center 40%"
        variante="seccion"
      />

      <div className="px-5 sm:px-9 lg:px-14 py-8 sm:py-12">

        {/* Breadcrumb */}
        <Link
          href="/dashboard/comunidad"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 sm:mb-8"
          style={{ color: "#9ca3af", transition: "color 0.15s ease" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--azul-egm)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9ca3af"; }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Comunidad
        </Link>

        {/* Cabecera — título + botón nuevo (solo SuperAdmin) */}
        {esSuperAdmin && (
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <p className="text-sm" style={{ color: "#6b7280" }}>
              {cargando ? "" : `${beneficios.length} ventaja${beneficios.length !== 1 ? "s" : ""} publicada${beneficios.length !== 1 ? "s" : ""}`}
            </p>
            <button
              onClick={abrirNuevo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--azul-egm)", transition: "opacity 0.15s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva ventaja
            </button>
          </div>
        )}

        {/* Contenido */}
        {cargando ? (
          <Skeleton />
        ) : beneficios.length === 0 ? (
          <EstadoVacio esSuperAdmin={esSuperAdmin} onNuevo={abrirNuevo} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {beneficios.map(b => (
              <BeneficioCard
                key={b.beneficioId}
                beneficio={b}
                esSuperAdmin={esSuperAdmin}
                onEditar={abrirEditar}
                onDesactivar={handleDesactivar}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar — solo SuperAdmin */}
      {esSuperAdmin && modalOpen && (
        <BeneficioModal
          inicial={editando}
          onGuardar={handleGuardar}
          onCerrar={() => setModalOpen(false)}
        />
      )}

      {/* Confirmación desactivar */}
      {confirmando && (
        <ConfirmDialog
          titulo="Desactivar ventaja"
          mensaje={`"${confirmando.titulo}" dejará de ser visible para los empleados. ¿Continuar?`}
          labelOk="Desactivar"
          peligro
          onOk={confirmarDesactivar}
          onCerrar={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}
