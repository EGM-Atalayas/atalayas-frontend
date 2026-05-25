"use client";

import { useState } from "react";
import type { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";
import { descargarCertificado } from "@/lib/certificado";
import { obtenerCertificadoModulo } from "@/lib/api/documentos";
import { TIPO_GRADIENT, getFormacionImg, type ModuloEnriquecido } from "@/lib/formacion-helpers";

interface CourseCardProps {
  m: ModuloEnriquecido;
  isAdmin: boolean;
  router: ReturnType<typeof useRouter>;
}

export function CourseCard({ m, isAdmin, router }: CourseCardProps) {
  const { usuario } = useAuth();
  const isCompletado = m.status === "completado";
  const isEnProgreso = m.status === "en progreso";

  const [descargando, setDescargando] = useState(false);

  const handleDescargarCertificado = async () => {
    setDescargando(true);
    try {
      const url = await obtenerCertificadoModulo(m.moduloId);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        setDescargando(false);
        return;
      }
    } catch { /* fallback */ }

    descargarCertificado({
      nombreEmpleado: usuario?.nombre ?? "Empleado",
      apellidosEmpleado: usuario?.apellidos,
      nombreModulo: m.nombre,
      tipoModulo: MODULO_TIPO_LABEL[m.tipoModulo] ?? m.tipoModulo,
      nombreEmpresa: usuario?.nombreEmpresa,
      fechaCompletado: new Date(),
    });
    setDescargando(false);
  };

  const img = getFormacionImg(m.moduloId, m.nombre, m.imagenPortadaUrl);

  return (
    <div
      className="rounded-2xl overflow-hidden flex group relative transition-shadow hover:shadow-md cursor-pointer"
      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
      onClick={() => router.push(`/dashboard/formacion/${m.moduloId}`)}
    >
      {/* Botón editar admin */}
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/admin?tab=formaciones&edit=${m.moduloId}`); }}
          className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #4338CA 0%, #0EA5E9 100%)",
            color: "#fff",
            boxShadow: "0 4px 12px -3px rgba(67,56,202,0.55)",
            backdropFilter: "blur(6px)",
          }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar
        </button>
      )}

      {/* Thumbnail — IZQUIERDA */}
      <div className="shrink-0 relative overflow-hidden" style={{ width: "200px" }}>
        {img ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={img} alt={m.nombre} className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <div className="w-full h-full absolute inset-0" style={{ background: TIPO_GRADIENT[m.tipoModulo] }} />
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(10,20,40,0.15)" }} />
        {isCompletado && (
          <div className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--exito, #16a34a)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Contenido — DERECHA */}
      <div className="flex flex-col flex-1 p-4 gap-2 min-w-0">
        <h3 className="text-base font-bold leading-snug line-clamp-2" style={{ color: "var(--texto-primario)" }}>
          {m.nombre}
        </h3>

        {m.descripcion && (
          <p className="text-sm leading-snug line-clamp-2" style={{ color: "var(--texto-muted)" }}>
            {m.descripcion}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "var(--texto-muted)" }}>
          <span className="inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
            </svg>
            {m.duracion}
          </span>
          {MODULO_TIPO_LABEL[m.tipoModulo] && (
            <>
              <span>·</span>
              <span className="font-semibold" style={{ color: "var(--azul-egm)" }}>
                {MODULO_TIPO_LABEL[m.tipoModulo]}
              </span>
            </>
          )}
          {m.esEspecializadoIa && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: "#f3e8ff", color: "#7c3aed" }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.09 7.26L22 12l-7.91 2.74L12 22l-2.09-7.26L2 12l7.91-2.74z" />
              </svg>
              IA
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--gris-borde)" }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${m.porcentaje}%`,
                background: isCompletado ? "var(--exito, #16a34a)" : "var(--azul-egm)",
              }} />
          </div>
          <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: isCompletado ? "var(--exito, #16a34a)" : "var(--azul-egm)" }}>
            {m.porcentaje}%
          </span>
        </div>

        <div className="mt-auto pt-2 flex justify-end">
          {isCompletado ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleDescargarCertificado(); }}
              disabled={descargando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-70"
              style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
              onMouseEnter={(e) => { if (!descargando) e.currentTarget.style.background = "var(--azul-egm-hover)"; }}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
            >
              {descargando ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {descargando ? "Obteniendo…" : "Certificado"}
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/formacion/${m.moduloId}`); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={
                isEnProgreso
                  ? { background: "var(--blanco)", border: "1px solid var(--azul-egm)", color: "var(--azul-egm)" }
                  : { background: "var(--azul-egm)", color: "var(--blanco)" }
              }
              onMouseEnter={(e) => {
                if (isEnProgreso) e.currentTarget.style.background = "var(--azul-egm-light)";
                else e.currentTarget.style.background = "var(--azul-egm-hover)";
              }}
              onMouseLeave={(e) => {
                if (isEnProgreso) e.currentTarget.style.background = "var(--blanco)";
                else e.currentTarget.style.background = "var(--azul-egm)";
              }}
            >
              {isEnProgreso ? "Continuar" : "Empezar"}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
