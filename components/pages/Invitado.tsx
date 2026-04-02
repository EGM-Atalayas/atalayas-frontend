"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { API_URL } from "@/lib/api";
import { Noticia } from "@/lib/types/noticias";
import { useRouter } from "next/navigation";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const perks = [
  {
    icon: "🚗",
    name: "Coche compartido",
    desc: "Coordina rutas con compañeros del parque y reduce costes de desplazamiento.",
    available: true,
    hasModal: true,
  },
  {
    icon: "🧒",
    name: "Guardería bonificada",
    desc: "Plazas con precio reducido en centro infantil próximo al área empresarial.",
    available: true,
    hasModal: true,
  },
  {
    icon: "🅿️",
    name: "Preferencias de parking",
    desc: "Plazas exclusivas VAO para fomentar el uso compartido del vehículo en el área empresarial.",
    available: true,
    hasModal: true,
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

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Invitado() {
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [modalPerk, setModalPerk] = useState<string | null>(null);

  useEffect(() => {
    // Fetch público sin credenciales para invitados
    fetch(`${API_URL}/anuncios`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar noticias");
        return res.json();
      })
      .then((data: Noticia[]) =>
        setNoticias(data.filter((n) => n.esGlobal && n.activo))
      )
      .catch(() => {})
      .finally(() => setLoadingNoticias(false));
  }, []);


  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center h-full">
            <Image src={logo} alt="Logo" className="h-10 sm:h-14 w-auto" />
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="bg-gray-900 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-8 lg:px-12 py-10">
        
        {/* ─ Welcome Hero ─ */}
        <section className="bg-[#100D3E] text-white rounded-3xl p-8 sm:p-12 mb-10 overflow-hidden relative shadow-xl text-center">
          <div className="relative z-10 flex flex-col items-center">
            <Image src={logo} alt="Logo" className="h-16 sm:h-20 w-auto mb-6 brightness-0 invert" />
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2">Bienvenido</h1>
            <p className="text-base sm:text-xl font-medium text-blue-200 mb-8 max-w-lg">
              Plataforma de comunicación, onboarding y formación de EGM Atalayas Ciudad Empresarial
            </p>
            <div>
              <Link href="/login" className="bg-white text-[#100D3E] px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg inline-block">
                Acceso para empleados
              </Link>
            </div>
          </div>
          {/* Abstract light effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -ml-20 -mb-20" />
        </section>

        {/* ── Comunicados y anuncios ── */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Comunicados y anuncios
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Información de interés general para la comunidad de EGM Atalayas
          </p>
        </div>

        {loadingNoticias ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Cargando anuncios...</p>
            </div>
          </div>
        ) : noticias.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center mb-10">
            <p className="text-sm text-gray-400">No hay comunicados recientes.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-14">
            {noticias.map((n) => (
              <div
                key={n.anuncioId}
                className="bg-white rounded-xl border border-gray-100 px-6 py-5 hover:border-blue-100 transition-all hover:shadow-sm"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    {n.esGlobal && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-wide">
                        Global
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 font-medium">
                      {new Date(n.creadoEn).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{n.titulo}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{n.mensaje}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Servicios y ventajas ── */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Servicios y ventajas
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Beneficios disponibles para todas las empresas y empleados del parque
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {perks.map((p) => (
            <div
              key={p.name}
              onClick={() => "hasModal" in p && p.hasModal && p.available ? setModalPerk(p.name) : undefined}
              className={`bg-white rounded-xl border border-gray-100 px-5 py-4 ${!p.available ? "opacity-50" : ""} ${"hasModal" in p && p.hasModal && p.available ? "cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all" : ""}`}
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
                {"hasModal" in p && p.hasModal && p.available && (
                  <span className="text-[10px] text-blue-500 shrink-0">Ver más →</span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed pl-6">{p.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── MODALS ── */}
      {modalPerk === "Guardería bonificada" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setModalPerk(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 leading-snug">Atención para tu Familia</h2>
              <button onClick={() => setModalPerk(null)} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer bg-transparent border-none">✕</button>
            </div>
            <p className="text-xs text-gray-500 mb-5">Guardería para Niños y Niñas: Sabemos lo importante que es la conciliación familiar. Por ello, disponemos de una ludoteca infantil en Atalayas, ofreciendo un espacio seguro para los más pequeños.</p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5 text-center">
              <p className="text-sm font-bold text-emerald-700 mb-1">Centro Infantil Atalayas</p>
              <p className="text-xs text-emerald-600 font-medium">Matrícula abierta todo el año</p>
            </div>
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-2 text-center">
              <p className="text-xs font-semibold text-gray-700">📞 647 763 389</p>
              <p className="text-xs text-gray-500">laescuelainfantilatalayas@gmail.com</p>
            </div>
          </div>
        </div>
      )}

      {modalPerk === "Preferencias de parking" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setModalPerk(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Plazas de parking VAO</h2>
              <button onClick={() => setModalPerk(null)} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer bg-transparent border-none">✕</button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Atalayas ha implementado plazas exclusivas para vehículos de alta ocupación (VAO), fomentando la movilidad sostenible en el área empresarial.</p>
          </div>
        </div>
      )}

      {modalPerk === "Coche compartido" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setModalPerk(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900">Plataforma de Carpooling</h2>
              <button onClick={() => setModalPerk(null)} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer bg-transparent border-none">✕</button>
            </div>
            <p className="text-xs text-gray-500 mb-6">Conecta con otros trabajadores del parque para compartir trayecto, ahorrar costes y reducir emisiones.</p>
            <a href="https://www.lokinn.com/compartir-coche/atalayas" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors">Acceder a la plataforma →</a>
          </div>
        </div>
      )}
    </div>
  );
}
