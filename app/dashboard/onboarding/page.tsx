"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BiIcon from "@/components/ui/BiIcon";

export default function OnboardingPage() {
  const router = useRouter();
  const { usuario } = useAuth();

  const steps = [
    { title: "Bienvenida", desc: "Mensaje del CEO y cultura EGM.", icon: "hand-wave" as const, done: true },
    { title: "Valores y Cultura", desc: "Entiende qué nos mueve.", icon: "gem" as const, done: true },
    { title: "Organigrama", desc: "Conoce a tus responsables.", icon: "building" as const, done: false },
    { title: "Tu puesto de trabajo", desc: "Primeros pasos en tu rol.", icon: "laptop" as const, done: false },
    { title: "Finalización", desc: "Tu onboarding está casi listo.", icon: "balloon-fill" as const, done: false },
  ];

  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Tu ruta de incorporación</h1>
        <p className="text-sm text-gray-400 mt-2">Sigue estos pasos para completar tu llegada a {usuario?.nombreEmpresa || "la empresa"}.</p>
      </div>

        <div className="relative">
          <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gray-100" />

          <div className="space-y-8">
            {steps.map((s, i) => (
              <div key={i} className="relative flex items-start gap-8 group">
                <div className={`z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-[#F7F6F3] transition-all 
                  ${s.done ? "bg-emerald-500 text-white" : "bg-white border-gray-100 text-gray-300 group-hover:border-gray-200"}`}>
                  {s.done ? <BiIcon name="check-lg" size={20} color="#fff" /> : <BiIcon name={s.icon} size={20} color={s.done ? "#10b981" : "#9ca3af"} />}
                </div>
                <div className="pt-2">
                  <h3 className={`text-sm font-semibold ${s.done ? "text-gray-900" : "text-gray-400"}`}>{s.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
                  {!s.done && i === 2 && (
                    <button className="mt-4 bg-gray-900 text-white text-[11px] font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                      Comenzar ahora
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
