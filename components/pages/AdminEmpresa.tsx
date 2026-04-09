"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, API_URL } from "@/lib/api";

interface ResumenAdmin {
  nombreEmpresa:    string;
  usuariosActivos:  number;
  usuariosInactivos: number;
}

interface Anuncio {
  anuncioId:    string;
  empresaId:    string;
  titulo:       string;
  contenido:    string;
  esGlobal:     boolean;
  activo:       boolean;
  creadoPor:    string;
  creadoEn:     string;
  actualizadoEn: string;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function AdminEmpresa() {
  const { usuario } = useAuth();
  const router      = useRouter();

  const [resumen, setResumen]   = useState<ResumenAdmin | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resRes, anunciosRes] = await Promise.all([
          apiFetch(`${API_URL}/dashboard/admin/resumen`),
          apiFetch(`${API_URL}/anuncios`),
        ]);
        if (resRes.ok)      setResumen(await resRes.json());
        if (anunciosRes.ok) {
          const data = await anunciosRes.json();
          setAnuncios(data.filter((a: Anuncio) => a.activo).slice(0, 3));
        }
      } catch {}
      finally { setCargando(false); }
    }
    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
      </div>
    );
  }

  const nombreEmpresa = resumen?.nombreEmpresa ?? usuario?.nombreEmpresa ?? "Mi empresa";

  return (
    <div>
      {/* ── BANDA DE BIENVENIDA ── */}
      <div
        className="-mx-8 -mt-8 px-8 pt-10 pb-8 mb-8"
        style={{ background: "var(--marino)" }}
      >
        {/* Saludo */}
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--verde-oliva-hover)" }}>
            Panel de administración
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Hola, {usuario?.nombre ?? "Administrador"}
          </h1>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            {nombreEmpresa} · {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {/* Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              label="Empleados activos"
              value={resumen?.usuariosActivos ?? "—"}
              acento="azul"
              onClick={() => router.push("/dashboard/admin?tab=empleados")}
            />
            <MetricCard
              label="Empleados inactivos"
              value={resumen?.usuariosInactivos ?? "—"}
              acento="gris"
              onClick={() => router.push("/dashboard/admin?tab=empleados")}
            />
            <MetricCard
              label="Progreso medio"
              value="—"
              nota="Próximamente"
              acento="verde"
            />
            <MetricCard
              label="Módulos activos"
              value="—"
              nota="Próximamente"
              acento="naranja"
            />
          </div>
        </div>
      </div>

      {/* ── ACCIONES RÁPIDAS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <AccionCard
          titulo="Añadir empleado"
          descripcion="Registra un nuevo miembro del equipo"
          acento="azul"
          icono={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
          onClick={() => router.push("/dashboard/admin?tab=empleados")}
        />
        <AccionCard
          titulo="Nuevo módulo"
          descripcion="Crea contenido formativo para tu equipo"
          acento="verde"
          icono={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          onClick={() => router.push("/dashboard/admin?tab=formaciones")}
        />
        <AccionCard
          titulo="Nuevo anuncio"
          descripcion="Comunica algo importante a tu equipo"
          acento="naranja"
          icono={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          }
          onClick={() => router.push("/dashboard/admin?tab=anuncios")}
        />
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Últimos anuncios */}
        <div className="lg:col-span-2 rounded-xl p-6"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
              Últimos anuncios
            </h2>
            <button
              onClick={() => router.push("/dashboard/admin?tab=anuncios")}
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--azul-egm)" }}
            >
              Ver todos →
            </button>
          </div>

          {anuncios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg"
              style={{ background: "var(--gris-pagina)", border: "1px dashed var(--gris-borde)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: "var(--azul-egm-light)" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                  style={{ color: "var(--azul-egm)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
                Sin anuncios publicados
              </p>
              <p className="text-xs mb-3" style={{ color: "var(--texto-muted)" }}>
                Comunica novedades a tu equipo
              </p>
              <button
                onClick={() => router.push("/dashboard/admin?tab=anuncios")}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ background: "var(--azul-egm)", color: "var(--blanco)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--azul-egm-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm)")}
              >
                Crear primer anuncio
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {anuncios.map((a) => (
                <div key={a.anuncioId}
                  className="flex items-start justify-between rounded-lg px-4 py-3"
                  style={{ border: "1px solid var(--gris-borde)", background: "var(--gris-pagina)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--texto-primario)" }}>{a.titulo}</p>
                    <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--texto-muted)" }}>{a.contenido}</p>
                  </div>
                  <span className="text-[10px] ml-4 shrink-0" style={{ color: "var(--texto-muted)" }}>
                    {formatFecha(a.creadoEn)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estado del equipo */}
        <div className="rounded-xl p-6"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--texto-primario)" }}>
            Estado del equipo
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--texto-muted)" }}>Empleados activos</span>
              <span className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                {resumen?.usuariosActivos ?? "—"}
              </span>
            </div>
            <div className="h-px" style={{ background: "var(--gris-borde)" }} />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--texto-muted)" }}>Empleados inactivos</span>
              <span className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                {resumen?.usuariosInactivos ?? "—"}
              </span>
            </div>
            <div className="h-px" style={{ background: "var(--gris-borde)" }} />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--texto-muted)" }}>Progreso medio</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                Próximamente
              </span>
            </div>
            <div className="h-px" style={{ background: "var(--gris-borde)" }} />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--texto-muted)" }}>Módulos activos</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                Próximamente
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/admin?tab=empleados")}
            className="w-full mt-6 text-xs font-medium py-2.5 rounded-lg transition-colors"
            style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--azul-egm-light)")}
          >
            Ver todos los empleados →
          </button>
        </div>
      </div>

      {/* ── MÓDULOS ── */}
      <div className="rounded-xl p-6"
        style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
            Módulos de formación
          </h2>
          <button
            onClick={() => router.push("/dashboard/admin?tab=formaciones")}
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--azul-egm)" }}
          >
            Gestionar →
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg"
          style={{ background: "var(--gris-pagina)", border: "1px dashed var(--gris-borde)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
            style={{ background: "var(--verde-oliva-light)" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              style={{ color: "var(--verde-oliva)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--texto-primario)" }}>
            Sin módulos creados
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--texto-muted)" }}>
            Crea el primer módulo formativo para tu equipo
          </p>
          <button
            onClick={() => router.push("/dashboard/admin?tab=formaciones")}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            style={{ background: "var(--verde-oliva)", color: "var(--blanco)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Crear primer módulo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SUBCOMPONENTES ────────────────────────────────────────────────────────────

function MetricCard({
  label, value, nota, acento, onClick,
}: {
  label:    string;
  value:    string | number;
  nota?:    string;
  acento:   "azul" | "verde" | "naranja" | "gris";
  onClick?: () => void;
}) {
  const acentos = {
    azul:    "var(--azul-egm)",
    verde:   "var(--verde-oliva)",
    naranja: "var(--advertencia)",
    gris:    "var(--texto-muted)",
  };

  return (
    <div
      className="rounded-xl px-5 py-4 cursor-pointer transition-opacity"
      style={{
        background:  "rgba(255,255,255,0.08)",
        border:      `1px solid rgba(255,255,255,0.12)`,
        borderLeft:  `3px solid ${acentos[acento]}`,
      }}
      onClick={onClick}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
    >
      <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {nota && <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{nota}</p>}
    </div>
  );
}

function AccionCard({
  titulo, descripcion, acento, icono, onClick,
}: {
  titulo:      string;
  descripcion: string;
  acento:      "azul" | "verde" | "naranja";
  icono:       React.ReactNode;
  onClick:     () => void;
}) {
  const acentos = {
    azul:    { bg: "var(--azul-egm-light)",   text: "var(--azul-egm)",   hover: "var(--azul-egm)",   hoverText: "var(--blanco)" },
    verde:   { bg: "var(--verde-oliva-light)", text: "var(--verde-oliva)", hover: "var(--verde-oliva)", hoverText: "var(--blanco)" },
    naranja: { bg: "var(--advertencia-light)", text: "var(--advertencia)", hover: "var(--advertencia)", hoverText: "var(--blanco)" },
  };

  const c = acentos[acento];

  return (
    <button
      onClick={onClick}
      className="rounded-xl p-5 text-left flex items-center gap-4 transition-all w-full group"
      style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background    = c.hover;
        e.currentTarget.style.borderColor   = c.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background  = "var(--blanco)";
        e.currentTarget.style.borderColor = "var(--gris-borde)";
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ background: c.bg, color: c.text }}
      >
        {icono}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>{titulo}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>{descripcion}</p>
      </div>
    </button>
  );
}