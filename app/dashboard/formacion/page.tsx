"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NAV_ROUTES } from "@/lib/routes";
import { getModulosConProgreso } from "@/lib/api/modulos";
import type { ModuloConProgreso } from "@/lib/types/modulos";
import { MODULO_TIPO_LABEL } from "@/lib/types/modulos";

export default function FormacionPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [modules, setModules] = useState<ModuloConProgreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getModulosConProgreso()
      .then((data) => {
        // Ordenamos por campo orden del backend
        setModules(data.sort((a, b) => a.orden - b.orden));
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar los módulos. Inténtalo de nuevo.");
      })
      .finally(() => setLoading(false));
  }, []);

  const isAdmin =
    usuario &&
    usuario.codigoRol !== "ROLE_EMPLEADO" &&
    usuario.codigoRol !== "INVITADO";

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <Header
        defaultActive="Formación"
        onNavChange={(item) => router.push(NAV_ROUTES[item])}
      />
      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Centro de Formación
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Accede a tus cursos y materiales de capacitación técnica y normativa.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => router.push("/dashboard/admin?tab=formaciones")}
              className="bg-white border border-gray-200 text-gray-700 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <span>⚙️</span> Gestionar Módulos
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-6 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && modules.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-16 text-center">
            <p className="text-sm text-gray-400">
              No hay módulos disponibles aún. El administrador de tu empresa los publicará pronto.
            </p>
          </div>
        )}

        {!loading && !error && modules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <div
                key={m.moduloId}
                className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow group relative"
              >
                {isAdmin && (
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/admin?tab=modulos&edit=${m.moduloId}`
                      )
                    }
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100 hover:bg-blue-100"
                  >
                    EDITAR
                  </button>
                )}

                <div className="flex items-center justify-between mb-4">
                  {/* Categoría legible */}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded group-hover:bg-blue-100 transition-colors">
                    {MODULO_TIPO_LABEL[m.tipoModulo] ?? m.tipoModulo}
                  </span>
                  <StatusBadge status={m.status} />
                </div>

                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  {m.nombre}
                </h3>
                <p className="text-xs text-gray-400 mb-6 flex-1 leading-snug">
                  {m.descripcion}
                </p>

                <button
                  className={`w-full py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    m.status === "completado"
                      ? "bg-gray-50 text-gray-500 cursor-default"
                      : "bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98]"
                  }`}
                >
                  {m.status === "completado"
                    ? "Repasar contenido"
                    : "Comenzar módulo →"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completado: "bg-emerald-50 text-emerald-700 border-emerald-100",
    "en progreso": "bg-blue-50 text-blue-700 border-blue-100",
    pendiente: "bg-gray-50 text-gray-400 border-gray-100",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
        styles[status] ?? styles.pendiente
      }`}
    >
      {status}
    </span>
  );
}