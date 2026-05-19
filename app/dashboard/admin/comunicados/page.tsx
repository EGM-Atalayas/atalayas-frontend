"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHero from "@/components/ui/DashboardHero";
import {
  getComunicados,
  desactivarComunicado,
} from "@/lib/api/noticias";
import type { Comunicado } from "@/lib/types/noticias";
import { ModalConfirm } from "@/components/ui/ModalConfirm";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default function ComunicadosAdminPage() {
  const router = useRouter();
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "expirados">("activos");
  const [confirmDesactivar, setConfirmDesactivar] = useState<string | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await getComunicados();
      data.sort((a, b) => new Date(b.fechaPublicacion ?? "").getTime() - new Date(a.fechaPublicacion ?? "").getTime());
      setComunicados(data);
    } catch {
      setComunicados([]);
    } finally {
      setLoading(false);
    }
  }

  const handleDesactivar = (id: string) => setConfirmDesactivar(id);

  const ejecutarDesactivar = async () => {
    if (!confirmDesactivar) return;
    try {
      await desactivarComunicado(confirmDesactivar);
      await cargar();
    } finally {
      setConfirmDesactivar(null);
    }
  };

  const ahora = Date.now();
  const lista = comunicados.filter((c) => {
    if (filtroEstado === "activos")   return c.activo && (!c.fechaExpiracion || new Date(c.fechaExpiracion).getTime() > ahora);
    if (filtroEstado === "expirados") return !c.activo || (!!c.fechaExpiracion && new Date(c.fechaExpiracion).getTime() <= ahora);
    return true;
  });

  return (
    <>
      <DashboardHero prefijo="Panel de " titulo="Comunicados" imagenFondo="/hero-comunicacion.webp" />

      <div className="px-6 md:px-10 lg:px-16 pt-10 pb-16">

        {/* Cabecera con acciones */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--texto-primario)" }}>Comunicados EGM</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--texto-muted)" }}>
              Visibles para todos los usuarios de la plataforma
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/admin/comunicados/crear")}
            className="text-sm font-semibold px-4 py-2.5 rounded-lg"
            style={{ background: "var(--azul-egm)", color: "#fff" }}
          >
            + Nuevo comunicado
          </button>
        </div>

        {/* Filtro estado */}
        <div className="flex gap-2 mb-6">
          {(["activos", "expirados", "todos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className="px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all"
              style={{
                background: filtroEstado === f ? "var(--azul-egm)" : "var(--gris-superficie)",
                color:      filtroEstado === f ? "#fff"   : "var(--texto-secundario)",
                border:     `1.5px solid ${filtroEstado === f ? "transparent" : "var(--gris-borde)"}`,
                boxShadow:  filtroEstado === f ? "0 2px 8px rgba(37,99,235,0.22)" : "none",
              }}
            >
              {f === "activos" ? "Activos" : f === "expirados" ? "Expirados / Inactivos" : "Todos"}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
          </div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl text-center" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
            <p className="text-base font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
              {filtroEstado === "activos" ? "No hay comunicados activos" : "No hay comunicados en este filtro"}
            </p>
            <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
              {filtroEstado === "activos" ? "Crea el primer comunicado para que aparezca en la plataforma." : "Prueba con otro filtro."}
            </p>
            {filtroEstado === "activos" && (
              <button onClick={() => router.push("/dashboard/admin/comunicados/crear")} className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "var(--azul-egm)", color: "#fff" }}>
                Crear primer comunicado
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {lista.map((c) => {
              const expirado = c.fechaExpiracion && new Date(c.fechaExpiracion).getTime() <= ahora;
              const estaExpirado = expirado || !c.activo;
              return (
                <div key={c.comunicadoId} className="rounded-xl px-5 py-4 flex items-start gap-4 flex-wrap" style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)", borderLeft: `3px solid ${estaExpirado ? "var(--gris-borde)" : "var(--azul-egm)"}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>{c.titulo}</p>
                      <span className="text-xs shrink-0 px-2 py-0.5 rounded-full font-medium" style={{
                        background: c.categoria === "Novedad" ? "#e8f5ee" : c.categoria === "Aviso" ? "#fef3c7" : c.categoria === "Evento" ? "#ede9fe" : "#f3f4f6",
                        color:      c.categoria === "Novedad" ? "#1a6b3a" : c.categoria === "Aviso" ? "#92400e" : c.categoria === "Evento" ? "#4c1d95" : "#374151",
                      }}>
                        {c.categoria}
                      </span>
                    </div>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--texto-muted)" }}>{c.mensaje}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs" style={{ color: "var(--texto-muted)" }}>Publicado: {formatDate(c.fechaPublicacion)}</span>
                      {c.fechaExpiracion && (
                        <span className="text-xs" style={{ color: estaExpirado ? "var(--error)" : "var(--texto-muted)" }}>
                          Expira: {formatDate(c.fechaExpiracion)}
                        </span>
                      )}
                      {c.destacado && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#92400e" }}>
                          Destacado
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDesactivar(c.comunicadoId)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: "rgba(239,68,68,0.1)", color: "var(--error)", border: "1px solid rgba(239,68,68,0.2)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                  >
                    Desactivar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ModalConfirm
        abierto={!!confirmDesactivar}
        titulo="¿Desactivar comunicado?"
        descripcion="Dejará de ser visible para todos los usuarios de la plataforma."
        textoConfirmar="Desactivar"
        variante="danger"
        onConfirmar={ejecutarDesactivar}
        onCancelar={() => setConfirmDesactivar(null)}
      />
    </>
  );
}
