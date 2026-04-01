"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NAV_ROUTES } from "@/lib/routes";
import { getFormaciones } from "@/lib/api/formaciones";
import { Formacion } from "@/lib/types/formaciones";
import FormacionForm from "@/components/FormacionForm";

export default function FormacionPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [modules, setModules] = useState<Formacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFormacion, setEditingFormacion] = useState<Formacion | null>(null);

  const refreshData = () => {
    setLoading(true);
    getFormaciones(usuario?.empresaId as string)
      .then((data) => setModules(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
  }, [usuario?.empresaId]);

  const isAdmin = usuario && usuario.codigoRol !== "ROLE_EMPLEADO" && usuario.codigoRol !== "INVITADO";

  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <Header defaultActive="Formación" onNavChange={(item) => router.push(NAV_ROUTES[item])} />
      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex items-start justify-between mb-8">
          <div className="font-primary">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Centro de Formación</h1>
            <p className="text-sm text-gray-400 mt-1">Accede a tus cursos y materiales de capacitación técnica y normativa.</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingFormacion(null); setShowForm(true); }}
                className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                + Nueva formación
              </button>
              <button
                onClick={() => router.push("/dashboard/admin?tab=formaciones")}
                className="bg-white border border-gray-200 text-gray-700 text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span>⚙️</span> Administración
              </button>
            </div>
          )}
        </div>

        {showForm && isAdmin && (
          <FormacionForm
            editando={editingFormacion}
            empresaId={usuario?.empresaId as string}
            onSave={() => { setShowForm(false); refreshData(); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded transition-colors group-hover:bg-blue-100">
                      {m.category}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { setEditingFormacion(m); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 whitespace-nowrap"
                      title="Editar esta formación"
                    >
                      EDITAR
                    </button>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">{m.name}</h3>
                <p className="text-xs text-gray-400 mb-6 flex-1 leading-snug">{m.description}</p>
                <button 
                  className={`w-full py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    m.status === "completado" 
                    ? "bg-gray-50 text-gray-500 cursor-default" 
                    : "bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98]"
                  }`}
                >
                  {m.status === "completado" ? "Repasar contenido" : "Comenzar módulo →"}
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
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
