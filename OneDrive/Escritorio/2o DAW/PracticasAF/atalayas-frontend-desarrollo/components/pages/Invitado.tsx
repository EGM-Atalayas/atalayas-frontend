"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { getNoticias } from "@/lib/api/noticias";
import { Noticia } from "@/lib/types/noticias";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "Noticias" | "Ventajas";

// ─── Data ─────────────────────────────────────────────────────────────────────

const perks = [
  {
    icon: "🚗",
    name: "Coche compartido",
    desc: "Coordina rutas con compañeros del parque y reduce costes de desplazamiento.",
    available: true,
  },
  {
    icon: "🧒",
    name: "Guardería bonificada",
    desc: "Plazas con precio reducido en centro infantil próximo al área empresarial.",
    available: true,
  },
  {
    icon: "🍽️",
    name: "Descuentos en restaurantes",
    desc: "Precios especiales en establecimientos del entorno para empleados del parque.",
    available: true,
  },
  {
    icon: "🎓",
    name: "Formación externa",
    desc: "Cursos homologados con tarifas negociadas para empresas adheridas.",
    available: true,
  },
  {
    icon: "🏋️",
    name: "Gimnasio y bienestar",
    desc: "Convenios con instalaciones deportivas cercanas al área.",
    available: false,
  },
  {
    icon: "🎉",
    name: "Eventos de comunidad",
    desc: "Team building, jornadas culturales y actividades colectivas del parque.",
    available: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tagColor: Record<string, string> = {
  Evento: "bg-blue-50 text-blue-600 border-blue-100",
  Comunidad: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Formación: "bg-indigo-50 text-indigo-600 border-indigo-100",
  Institucional: "bg-gray-100 text-gray-600 border-gray-200",
  Ventajas: "bg-amber-50 text-amber-700 border-amber-100",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Invitado() {
  const [activeSection, setActiveSection] = useState<Section>("Noticias");
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    getNoticias().then((data) =>
      setNoticias(data.filter((n) => n.visible_invitados && n.activo))
    );
  }, []);


  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      {/*
        El invitado no tiene sesión, así que usamos un header propio simplificado
        en lugar del Header con nav de usuario autenticado.
      */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center h-full">
            <Image src={logo} alt="Logo" className="h-24 w-auto" />
          </div>

          {/* Section tabs */}
          <nav className="flex items-center gap-1">
            {(["Noticias", "Ventajas"] as Section[]).map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`
                  relative px-4 py-1.5 text-sm font-semibold rounded-md
                  transition-colors duration-150 whitespace-nowrap border-none cursor-pointer
                  ${activeSection === s
                    ? "text-blue-700"
                    : "text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                  }
                `}
              >
                {s}
                <span
                  className={`
                    absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-blue-700
                    transition-all duration-200
                    ${activeSection === s ? "w-[calc(100%-24px)]" : "w-0"}
                  `}
                />
              </button>
            ))}
          </nav>

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-500 hover:text-blue-700 transition-colors px-3 py-1.5"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register-empresa"
              className="bg-gray-900 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Registrar empresa
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Banner login */}
        <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium text-gray-800">
              ¿Eres empleado de una empresa del parque?
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Inicia sesión para acceder a tu formación y contenidos personalizados.
            </p>
          </div>
          <Link
            href="/login"
            className="shrink-0 ml-4 bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Iniciar sesión →
          </Link>
        </div>

        {/* ── Noticias ── */}
        {activeSection === "Noticias" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Noticias
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Anuncios disponibles para los empleados de EGM Atalayas
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6">

              {noticias.length === 0 ? (
                <p className="text-xs text-gray-400">No hay noticias publicadas.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {noticias.map((n) => (
                    <Link
                      key={n.anuncio_id}
                      href="/noticias"
                      className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {n.tag}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-800 truncate">{n.titulo}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.cuerpo}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-4 mt-0.5">
                        {new Date(n.creado_en).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>

        )}

        {/* ── Ventajas ── */}
        {activeSection === "Ventajas" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Ventajas
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Beneficios disponibles para los empleados de EGM Atalayas
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {perks.map((p) => (
                <div
                  key={p.name}
                  className={`bg-white rounded-xl border border-gray-100 px-5 py-4 ${!p.available ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    </div>
                    {!p.available && (
                      <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full shrink-0">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed pl-6">{p.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-8">
              Las ventajas están disponibles para empleados de empresas adheridas a EGM Atalayas Ciudad Empresarial.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
