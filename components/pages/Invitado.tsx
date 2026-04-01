"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { getNoticias } from "@/lib/api/noticias";
import { Noticia } from "@/lib/types/noticias";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Section = "Noticias" | "Mis Servicios";


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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const tagColor: Record<string, string> = {
  Evento: "bg-blue-50 text-blue-600 border-blue-100",
  Comunidad: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Formación: "bg-indigo-50 text-indigo-600 border-indigo-100",
  Institucional: "bg-gray-100 text-gray-600 border-gray-200",
  Ventajas: "bg-amber-50 text-amber-700 border-amber-100",
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Invitado() {
  const [activeSection, setActiveSection] = useState<Section>("Noticias");
  const [modalPerk, setModalPerk] = useState<string | null>(null);
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    getNoticias().then((data) =>
      setNoticias(data.filter((n) => n.esGlobal && n.activo))
    );
  }, []);


  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      {/*
        El invitado no tiene sesión, así que usamos un header propio simplificado
        en lugar del Header con nav de usuario autenticado.
      */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center h-full">
            <Image src={logo} alt="Logo" className="h-10 sm:h-14 w-auto" />
          </div>

          {/* Section tabs */}
          <nav className="hidden sm:flex items-center gap-1">
            {(["Noticias", "Mis Servicios"] as Section[]).map((s) => (
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
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-500 hover:text-blue-700 transition-colors px-2 sm:px-3 py-1.5"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register-empresa"
              className="bg-gray-900 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Registrar empresa
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile section tabs */}
      <div className="sm:hidden bg-white border-b border-slate-200 px-4 flex gap-1">
        {(["Noticias", "Mis Servicios"] as Section[]).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`relative px-4 py-3 text-sm font-semibold transition-colors border-none cursor-pointer
              ${activeSection === s ? "text-blue-700" : "text-slate-500"}`}
          >
            {s}
            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-blue-700 transition-all duration-200 ${activeSection === s ? "w-[calc(100%-24px)]" : "w-0"}`} />
          </button>
        ))}
      </div>

      <main className="w-full px-4 sm:px-8 lg:px-12 py-10">
        
        {/* ─ Welcome Hero (from Landing) ─ */}
        <section className="bg-[#100D3E] text-white rounded-3xl p-8 sm:p-12 mb-10 overflow-hidden relative shadow-xl">
          <div className="relative z-10 flex flex-col items-center text-center">
            <Image src={logo} alt="Logo" className="h-16 sm:h-20 w-auto mb-6 brightness-0 invert" />
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2">Bienvenido</h1>
            <p className="text-base sm:text-xl font-medium text-blue-200 mb-8 max-w-lg">
              Plataforma de Onboarding y Formación de EGM Atalayas Ciudad Empresarial
            </p>
            <div className="flex gap-4">
              <Link href="/login" className="bg-white text-[#100D3E] px-6 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">
                Iniciar sesión
              </Link>
              <Link href="/register-empresa" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg">
                Registrar empresa
              </Link>
            </div>
          </div>
          {/* Abstract light effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -ml-20 -mb-20" />
        </section>

        {/* Banner informativo suave */}
        <div className="bg-white border border-gray-100 rounded-xl px-6 py-5 flex items-center justify-between mb-8 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-lg">ℹ️</div>
             <div>
               <p className="text-sm font-semibold text-gray-800">Acceso Restringido</p>
               <p className="text-xs text-gray-400">Si eres empleado, inicia sesión para ver tus cursos y formación personalizada.</p>
             </div>
          </div>
          <Link href="/login" className="text-blue-600 text-sm font-bold hover:underline">Ir a login →</Link>
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
                      key={n.anuncioId}
                      href="/noticias"
                      className="flex items-start justify-between border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {n.esGlobal && (
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              Global
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-800 truncate">{n.titulo}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.mensaje}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-4 mt-0.5">
                        {new Date(n.creadoEn).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>

        )}

        {/* ── Mis Servicios (asociado a Ventajas) ── */}
        {activeSection === "Mis Servicios" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Mis Servicios
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Beneficios disponibles para los empleados de EGM Atalayas
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
            <p className="text-xs text-gray-400 text-center mt-8">
              Estos servicios están disponibles para empleados de empresas adheridas a EGM Atalayas Ciudad Empresarial.
            </p>
          </>
        )}
      </main>

      {/* ── Modal: Guardería bonificada ── */}
      {modalPerk === "Guardería bonificada" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setModalPerk(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 leading-snug pr-4">
                Atención para tu Familia
              </h2>
              <button
                onClick={() => setModalPerk(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0 cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              <span className="font-semibold text-gray-800">Guardería para Niños y Niñas:</span> Sabemos lo importante que es la conciliación familiar. Por ello, disponemos de una ludoteca infantil en Atalayas, ofreciendo un espacio seguro y divertido para los más pequeños, más cerca de tu lugar de trabajo.
            </p>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5 text-center">
              <p className="text-sm font-bold text-emerald-700 mb-1">Centro Infantil Atalayas</p>
              <p className="text-xs text-emerald-600 font-medium">Matrícula abierta todo el año</p>
              <div className="mt-2 flex flex-col gap-0.5">
                <p className="text-xs text-gray-600">Horario flexible · Comida casera y ambiente familiar</p>
                <p className="text-xs font-semibold text-gray-700 mt-1">Abierto NAVIDAD, SEMANA SANTA Y VERANO</p>
                <p className="text-xs text-gray-500">Centro Educativo, Ludoteca y Escuela de verano</p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-3">Ludoteca · hasta los 12 años</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                  <p className="text-xs text-gray-700">Media jornada (hasta las 13:00)</p>
                  <p className="text-xs font-bold text-gray-900">10€ / día</p>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                  <p className="text-xs text-gray-700">Jornada completa</p>
                  <p className="text-xs font-bold text-gray-900">15€ / día</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">Talleres · Clases de repaso · Proyector de cine...</p>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
              <a
                href="tel:647763389"
                className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                📞 647 763 389
              </a>
              <a
                href="mailto:laescuelainfantilatalayas@gmail.com"
                className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ✉️ laescuelainfantilatalayas@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Preferencias de parking ── */}
      {modalPerk === "Preferencias de parking" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setModalPerk(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 leading-snug pr-4">
                Plazas de parking VAO en Atalayas
              </h2>
              <button
                onClick={() => setModalPerk(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0 cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              Atalayas ha implementado plazas exclusivas para vehículos de alta ocupación (VAO), enmarcadas en la Línea Estratégica de movilidad sostenible del Plan de Movilidad Urbana de Alicante, respaldada por el Ayuntamiento y EGM Atalayas Ciudad Empresarial.
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <span className="text-lg shrink-0">🚗</span>
                <div>
                  <p className="text-xs font-semibold text-blue-800 mb-0.5">Complemento al carpooling</p>
                  <p className="text-xs text-blue-700 leading-relaxed">Las plazas VAO refuerzan la plataforma de coche compartido, recompensando a quienes ya comparten desplazamiento con acceso preferente y menos tiempo buscando aparcamiento.</p>
                </div>
              </div>
              <div className="flex gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <span className="text-lg shrink-0">🌿</span>
                <div>
                  <p className="text-xs font-semibold text-emerald-800 mb-0.5">Impacto sostenible</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">Reducción de emisiones de CO₂, menos vehículos en circulación y mayor habitabilidad en el área empresarial. Parte del proyecto <span className="font-semibold">«Atalayas Circular»</span> y los ODS.</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Iniciativa promovida por el Ayuntamiento de Alicante y EGM Atalayas Ciudad Empresarial.
            </p>
          </div>
        </div>
      )}

      {/* ── Modal: Coche compartido ── */}
      {modalPerk === "Coche compartido" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setModalPerk(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900 leading-snug pr-4">
                ¿Cómo funciona la plataforma de compartir coche en Atalayas?
              </h2>
              <button
                onClick={() => setModalPerk(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0 cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            </div>

            {/* Pasajero */}
            <div className="mb-6">
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-4">Si eres pasajero</p>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">1. Busca</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Elige origen y destino y selecciona el trayecto que más se adapte a tu ruta diaria.</p>
                  <p className="text-xs text-blue-500 font-medium mt-1">¡Miles de conductores te están esperando!</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">2. Disfruta</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Sólo te queda reservar tu trayecto y disfrutar de él. Te daremos toda la información del conductor para que puedas comunicarte con él.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 my-4" />

            {/* Conductor */}
            <div className="mb-6">
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-4">Si eres conductor</p>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">1. Publica</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Publica la rutina habitual que haces con tu coche. Elige punto de origen y destino, el número de plazas disponibles y el precio de cada una.</p>
                  <p className="text-xs text-blue-500 font-medium mt-1">¡Y listo! El resto lo gestionamos nosotros.</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">2. Conecta</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Espera a que los pasajeros se pongan en contacto contigo y chatea con ellos para concretar el punto de recogida.</p>
                  <p className="text-xs text-blue-500 font-medium mt-1">¡Miles de pasajeros te están esperando!</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">3. Disfruta</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Disfruta del viaje y de la compañía.</p>
                </div>
              </div>
            </div>

            <a
              href="https://www.lokinn.com/compartir-coche/atalayas"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Acceder a la plataforma →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
