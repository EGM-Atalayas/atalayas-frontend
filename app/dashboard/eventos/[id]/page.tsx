"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getEventoComunidad,
  getEventosComunidad,
  type ComunidadEvento,
} from "@/lib/api/comunidad";
import { ModalUbicacion } from "@/components/eventos/ModalUbicacion";
import { MapaUbicacion } from "@/components/eventos/MapaUbicacion";

// ── Helpers ────────────────────────────────────────────────────────────────
type EstadoEvento = "PROXIMO" | "EN_CURSO" | "FINALIZADO";

const ESTADO_CONFIG: Record<EstadoEvento, { label: string; bg: string; color: string }> = {
  PROXIMO:    { label: "Próximo",    bg: "#EFF6FF", color: "#1B3F7E" },
  EN_CURSO:   { label: "Hoy",        bg: "#F0FDF4", color: "#166534" },
  FINALIZADO: { label: "Finalizado", bg: "#F1F5F9", color: "#475569" },
};

function calcEstado(ev: ComunidadEvento): EstadoEvento {
  const ahora = Date.now();
  const ini   = new Date(ev.fechaInicio).getTime();
  const fin   = ev.fechaFin ? new Date(ev.fechaFin).getTime() : ini;
  if (ini > ahora) return "PROXIMO";
  if (ahora <= fin) return "EN_CURSO";
  return "FINALIZADO";
}

function formatFull(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return ""; }
}

function formatHoras(ev: ComunidadEvento) {
  const ini = new Date(ev.fechaInicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (!ev.fechaFin) return ini;
  const fin = new Date(ev.fechaFin).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${ini} – ${fin}`;
}

function parsInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p)}</>;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      out.push(<h3 key={i} style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827", margin: "16px 0 6px" }}>{parsInline(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      out.push(<h2 key={i} style={{ fontWeight: 800, fontSize: "1.25rem", color: "#111827", margin: "18px 0 6px" }}>{parsInline(line.slice(2))}</h2>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(<li key={i} style={{ marginLeft: "20px", listStyleType: "disc" }}>{parsInline(lines[i].slice(2))}</li>);
        i++;
      }
      out.push(<ul key={`ul${i}`} style={{ margin: "6px 0 10px" }}>{items}</ul>);
      continue;
    } else if (line.trim() === "") {
      out.push(<div key={i} style={{ height: "10px" }} />);
    } else {
      out.push(<p key={i} style={{ margin: "3px 0", lineHeight: 1.8 }}>{parsInline(line)}</p>);
    }
    i++;
  }
  return <>{out}</>;
}

// ── Página ─────────────────────────────────────────────────────────────────
export default function EventoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [evento, setEvento]       = useState<ComunidadEvento | null>(null);
  const [otros, setOtros]         = useState<ComunidadEvento[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [verUbicacion, setVerUbicacion] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getEventoComunidad(id),
      getEventosComunidad(),
    ]).then(([ev, todos]) => {
      if (!ev) { setNotFound(true); return; }
      setEvento(ev);
      const ahora = Date.now();
      const restantes = todos
        .filter((e) => e.eventoId !== id)
        .sort((a, b) => {
          const ta = new Date(a.fechaInicio).getTime();
          const tb = new Date(b.fechaInicio).getTime();
          const fa = ta >= ahora, fb = tb >= ahora;
          if (fa && !fb) return -1;
          if (!fa && fb) return 1;
          return fa ? ta - tb : tb - ta;
        })
        .slice(0, 3);
      setOtros(restantes);
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Estados ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#f9fafb" }}>
        <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (notFound || !evento) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center" style={{ background: "#f9fafb" }}>
        <p className="text-2xl font-bold" style={{ color: "#111827" }}>Evento no encontrado</p>
        <Link href="/dashboard/eventos" className="text-sm font-semibold underline" style={{ color: "#1B3F7E" }}>
          ← Volver a Eventos
        </Link>
      </div>
    );
  }

  const estado     = calcEstado(evento);
  const cfg        = ESTADO_CONFIG[estado];

  return (
    <div className="min-h-screen" style={{ background: "#f9fafb", fontFamily: "'Instrument Sans', sans-serif" }}>

      <main className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 pt-28 sm:pt-32 pb-16">

        {/* Volver */}
        <button
          onClick={() => router.push("/dashboard/eventos")}
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:underline"
          style={{ color: "#1B3F7E" }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Eventos
        </button>

        {/* Imagen */}
        {evento.imagenUrl && (
          <div className="w-full rounded-2xl overflow-hidden mb-8" style={{ aspectRatio: "21/9" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={evento.imagenUrl} alt={evento.titulo} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Badges + fecha */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: evento.esGlobal ? "#EFF6FF" : "#F0FDF4",
              color:      evento.esGlobal ? "#1B3F7E" : "#166534",
            }}>
            {evento.esGlobal ? "EGM Atalayas" : "Tu empresa"}
          </span>
          <span className="text-sm" style={{ color: "#9ca3af" }}>{formatFull(evento.fechaInicio)} · {formatHoras(evento)}</span>
        </div>

        {/* Título */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-8" style={{ color: "#111827" }}>
          {evento.titulo}
        </h1>

        {/* Divisor */}
        <div className="mb-8" style={{ borderTop: "1px solid #e5e7eb" }} />

        {/* Contenido */}
        <div style={{ fontSize: "1rem", color: "#374151", lineHeight: 1.85, overflowWrap: "break-word" }}>
          {evento.descripcion ? renderMarkdown(evento.descripcion) : (
            <p style={{ color: "#9ca3af", fontStyle: "italic" }}>Sin descripción detallada</p>
          )}
        </div>

        {/* Recursos: ubicación */}
        {evento.latitud != null && evento.longitud != null && (
          <div className="mt-10 pt-8 flex flex-col gap-4" style={{ borderTop: "1px solid #e5e7eb" }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Ubicación</p>
              <button
                type="button"
                onClick={() => setVerUbicacion(true)}
                className="text-xs font-semibold inline-flex items-center gap-1.5 hover:underline"
                style={{ color: "#1B3F7E" }}
              >
                Ampliar
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
            {evento.lugar && (
              <a
                href={`https://www.google.com/maps?q=${evento.latitud},${evento.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "#f1f5f9", border: "1px solid #e5e7eb", textDecoration: "none" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#dbeafe" }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium" style={{ color: "#2563eb" }}>{evento.lugar}</span>
              </a>
            )}
            <MapaUbicacion
              latitud={evento.latitud}
              longitud={evento.longitud}
              etiqueta={evento.lugar ?? undefined}
              alturaPx={400}
              zoom={15}
            />
          </div>
        )}

      </main>

      {/* Otros eventos */}
      {otros.length > 0 && (
        <section className="w-full px-6 sm:px-12 lg:px-16 py-16" style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-8" style={{ color: "#111827" }}>Otros eventos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otros.map((e) => {
                const f = new Date(e.fechaInicio);
                return (
                  <Link key={e.eventoId} href={`/dashboard/eventos/${e.eventoId}`} style={{ textDecoration: "none" }}>
                    <article
                      className="group relative rounded-2xl overflow-hidden cursor-pointer"
                      style={{ aspectRatio: "4/3", background: "#1a1a2e", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
                      onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (ev.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.2)"; }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.transform = "translateY(0)"; (ev.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                    >
                      {/* Imagen de fondo */}
                      {e.imagenUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.imagenUrl} alt={e.titulo}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          style={{ opacity: 0.85 }} />
                      )}
                      {/* Gradiente inferior */}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)" }} />
                      {/* Bloque fecha (esquina sup. izq.) */}
                      <div className="absolute top-3 left-3 rounded-lg px-2 py-1" style={{ background: "rgba(255,255,255,0.95)" }}>
                        <p className="text-sm font-bold leading-none" style={{ color: "#1B3F7E" }}>{f.getDate()}</p>
                        <p className="text-[9px] uppercase font-semibold leading-none mt-0.5" style={{ color: "#1B3F7E" }}>
                          {f.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")}
                        </p>
                      </div>
                      {/* Texto */}
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="font-bold text-base leading-snug text-white line-clamp-2">{e.titulo}</h3>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Modal Ver ubicación */}
      {verUbicacion && evento.latitud != null && evento.longitud != null && (
        <ModalUbicacion
          titulo={evento.titulo}
          lugar={evento.lugar}
          latitud={evento.latitud}
          longitud={evento.longitud}
          onClose={() => setVerUbicacion(false)}
        />
      )}
    </div>
  );
}
