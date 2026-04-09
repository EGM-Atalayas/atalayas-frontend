"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, API_URL } from "@/lib/api";

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface ResumenAdmin {
  nombreEmpresa: string;
  usuariosActivos: number;
  usuariosInactivos: number;
}

interface Anuncio {
  anuncioId: string;
  empresaId: string;
  titulo: string;
  contenido: string;
  esGlobal: boolean;
  activo: boolean;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function AdminEmpresa() {
  const { usuario } = useAuth();
  const router = useRouter();

  const [resumen, setResumen]   = useState<ResumenAdmin | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [cargando, setCargando] = useState(true);

  // Cargamos los datos del dashboard al montar el componente
  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resRes, anunciosRes] = await Promise.all([
          apiFetch(`${API_URL}/dashboard/admin/resumen`),
          apiFetch(`${API_URL}/anuncios`),
        ]);

        if (resRes.ok) {
          const data = await resRes.json();
          setResumen(data);
        }

        if (anunciosRes.ok) {
          const data = await anunciosRes.json();
          // Solo mostramos los 3 más recientes en el resumen
          setAnuncios(data.filter((a: Anuncio) => a.activo).slice(0, 3));
        }
      } catch {
        // Silencioso — cada sección maneja su propio estado vacío
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{
            borderColor:    "var(--gris-borde)",
            borderTopColor: "var(--azul-egm)",
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Saludo */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--texto-primario)" }}
        >
          Hola, {usuario?.nombre ?? "Administrador"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {resumen?.nombreEmpresa ?? usuario?.nombreEmpresa ?? "Mi empresa"} ·{" "}
          {new Date().toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Empleados activos"
          value={resumen?.usuariosActivos ?? "—"}
        />
        <MetricCard
          label="Empleados inactivos"
          value={resumen?.usuariosInactivos ?? "—"}
        />
        <MetricCard
          label="Progreso medio"
          value="—"
          nota="Próximamente"
        />
        <MetricCard
          label="Módulos activos"
          value="—"
          nota="Próximamente"
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Accesos rápidos */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--blanco)",
            border:     "1px solid var(--gris-borde)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-4"
            style={{ color: "var(--texto-primario)" }}
          >
            Acciones rápidas
          </h2>
          <div className="flex flex-col gap-2">
            <AccionRapida
              label="Añadir empleado"
              descripcion="Registra un nuevo miembro del equipo"
              color="azul"
              onClick={() => router.push("/dashboard/admin?tab=empleados")}
            />
            <AccionRapida
              label="Nuevo módulo"
              descripcion="Crea contenido formativo para tu equipo"
              color="verde"
              onClick={() => router.push("/dashboard/admin?tab=modulos")}
            />
            <AccionRapida
              label="Nuevo anuncio"
              descripcion="Comunica algo a tus empleados"
              color="naranja"
              onClick={() => router.push("/dashboard/admin?tab=anuncios")}
            />
          </div>
        </div>

        {/* Últimos anuncios */}
        <div
          className="lg:col-span-2 rounded-xl p-6"
          style={{
            background: "var(--blanco)",
            border:     "1px solid var(--gris-borde)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--texto-primario)" }}
            >
              Últimos anuncios
            </h2>
            <button
              onClick={() => router.push("/dashboard/noticias")}
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--azul-egm)" }}
            >
              Ver todos →
            </button>
          </div>

          {anuncios.length === 0 ? (
            <EstadoVacio
              mensaje="No hay anuncios publicados"
              accion="Crear el primero"
              onAccion={() => router.push("/dashboard/admin?tab=anuncios")}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {anuncios.map((a) => (
                <div
                  key={a.anuncioId}
                  className="flex items-start justify-between rounded-lg px-4 py-3"
                  style={{
                    border:     "1px solid var(--gris-borde)",
                    background: "var(--gris-pagina)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: "var(--texto-primario)" }}
                    >
                      {a.titulo}
                    </p>
                    <p
                      className="text-[11px] mt-0.5 line-clamp-1"
                      style={{ color: "var(--texto-muted)" }}
                    >
                      {a.contenido}
                    </p>
                  </div>
                  <span
                    className="text-[10px] ml-4 shrink-0"
                    style={{ color: "var(--texto-muted)" }}
                  >
                    {formatFecha(a.creadoEn)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sección módulos — pendiente de backend */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "var(--blanco)",
          border:     "1px solid var(--gris-borde)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--texto-primario)" }}
          >
            Módulos de formación
          </h2>
          <button
            onClick={() => router.push("/dashboard/admin?tab=modulos")}
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--azul-egm)" }}
          >
            Gestionar →
          </button>
        </div>
        <EstadoVacio
          mensaje="Los módulos estarán disponibles próximamente"
          accion="Crear primer módulo"
          onAccion={() => router.push("/dashboard/admin?tab=modulos")}
        />
      </div>
    </div>
  );
}

// ── SUBCOMPONENTES ────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  nota,
}: {
  label: string;
  value: string | number;
  nota?: string;
}) {
  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{
        background: "var(--blanco)",
        border:     "1px solid var(--gris-borde)",
      }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--texto-muted)" }}>
        {label}
      </p>
      <p
        className="text-2xl font-semibold"
        style={{ color: "var(--texto-primario)" }}
      >
        {value}
      </p>
      {nota && (
        <p className="text-[10px] mt-1" style={{ color: "var(--texto-muted)" }}>
          {nota}
        </p>
      )}
    </div>
  );
}

function AccionRapida({
  label,
  descripcion,
  color,
  onClick,
}: {
  label:       string;
  descripcion: string;
  color:       "azul" | "verde" | "naranja";
  onClick:     () => void;
}) {
  const colores = {
    azul:    { bg: "var(--azul-egm-light)",    text: "var(--azul-egm)" },
    verde:   { bg: "var(--verde-oliva-light)",  text: "var(--verde-oliva)" },
    naranja: { bg: "var(--advertencia-light)",  text: "var(--advertencia)" },
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-3 transition-colors"
      style={{ border: "1px solid var(--gris-borde)", background: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gris-superficie)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Icono + */}
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-semibold shrink-0"
        style={{
          background: colores[color].bg,
          color:      colores[color].text,
        }}
      >
        +
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: "var(--texto-primario)" }}>
          {label}
        </p>
        <p className="text-[11px]" style={{ color: "var(--texto-muted)" }}>
          {descripcion}
        </p>
      </div>
    </button>
  );
}

function EstadoVacio({
  mensaje,
  accion,
  onAccion,
}: {
  mensaje:  string;
  accion:   string;
  onAccion: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm" style={{ color: "var(--texto-muted)" }}>
        {mensaje}
      </p>
      <button
        onClick={onAccion}
        className="mt-2 text-xs font-medium hover:underline"
        style={{ color: "var(--azul-egm)" }}
      >
        {accion} →
      </button>
    </div>
  );
}