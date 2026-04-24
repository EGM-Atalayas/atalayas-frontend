"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.webp";
import { API_URL } from "@/lib/api";
import { Playfair_Display } from "next/font/google";
import LogoLoop from "@/components/ui/LogoLoop";
import FooterCTA from "@/components/ui/FooterCTA";
import {
  GraduationCap, BookOpen, Network,
  FlaskConical, Sprout, Building2,
  Rocket, Lightbulb, MonitorDot,
  Microchip, Cpu, Factory,
  ChevronDown
} from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

interface Comunicado {
  comunicadoId: string;
  titulo: string;
  mensaje: string;
  imagenUrl?: string | null;
  fechaPublicacion: string;
  activo: boolean;
}

const comunidadItems = [
  {
    label: "En Femenino",
    sub: "Liderazgo e igualdad en el entorno empresarial",
    imagen: "/logo-en-femenino.png",
    bg: "#8878c8",
    icono: null,
    url: "https://atalayas.com/en-femenino/",
  },
  {
    label: "Autobús lanzadera",
    sub: "Servicio de transporte directo al área empresarial",
    imagen: "/autobus.jpg",
    bg: null,
    icono: null,
    url: "https://atalayas.com/autobus-lanzadera/",
  },
  {
    label: "Coche compartido",
    sub: "Coordina rutas con compañeros del área",
    imagen: "/coche-compartido.jpg",
    bg: null,
    icono: null,
    url: "https://atalayas.com/journify-coche-compartido/",
  },
  {
    label: "Aparcamiento VAO",
    sub: "Plazas exclusivas para vehículos de alta ocupación",
    imagen: "/aparcamiento-vao.png",
    bg: null,
    icono: null,
    url: "https://atalayas.com/aparcamientovao/",
  },
  {
    label: "Empresarios de hoy y de mañana",
    sub: "Networking y actividades entre empresas del área",
    imagen: "/empresas-hoy.jpg",
    bg: null,
    icono: null,
    url: "https://atalayas.com/100-estudiantes-20-empresarios/",
  },
  {
    label: "Proyecto empresas solidarias",
    sub: "Más de 44.000 personas ya han sido beneficiadas.",
    imagen: "/empresas-solidarias.png",
    bg: "#ffffff",
    icono: null,
    url: "https://atalayas.com/empresas-solidarias/",
  },
  {
    label: "Voy en bici al trabajo",
    sub: "Semana de la movilidad",
    imagen: "/trabajo-bici.jpg",
    bg: null,
    icono: null,
    url: "https://tu-url.com/bici",
  },
  {
    label: "Atalayas circular",
    sub: "3R: REDUCIR, REUTILIZAR Y RECICLAR",
    imagen: "/atalayas-circular.jpg",
    bg: null,
    icono: null,
    url: "https://tu-url.com/circular",
  },
];

const colaboradoresData = [
  {
    categoria: "Universidades y Centros de Investigación",
    icono: GraduationCap,
    imagen: "/bg-universidad.avif",
    entidades: [
      {
        nombre: "Universidad de Alicante",
        icon: "/ua-icono.png",
        color: "#003DA5",
        descripcion: "Universidad pública con una fuerte vocación de I+D+i, conexión con empresas y proyectos de transferencia tecnológica.",
        web: "https://www.ua.es",
      },
      {
        nombre: "Universidad Miguel Hernández de Elche",
        icon: "/umh-icono.jpg",
        color: "#8B1A1A",
        descripcion: "Universidad pública con múltiples programas de innovación, transferencia y colaboración con empresas e instituciones.",
        web: "https://www.umh.es",
      },
      {
        nombre: "Universidad de Alicante — CENID",
        icon: "/cenid-icono.jpg",
        color: "#0077B6",
        descripcion: "Centro de investigación multidisciplinar enfocado en el desarrollo e innovación digital para el tejido empresarial.",
        web: "https://cenid.es",
      },
    ],
  },
  {
    categoria: "Parques Científicos y Tecnológicos",
    icono: FlaskConical,
    imagen: "/bg-parque.avif",

    entidades: [
      {
        nombre: "Parque Científico de Alicante",
        icon: "/pca-icono.png",
        color: "#2E7D32",
        descripcion: "Espacio de innovación que conecta la investigación universitaria con el mundo empresarial, ofreciendo infraestructuras y servicios de apoyo.",
        web: "https://pca.ua.es",
      },
      {
        nombre: "Parque Científico UMH",
        icon: "/pcumh-icono.png",
        color: "#C62828",
        descripcion: "Entorno tecnológico que facilita la transferencia de conocimiento y la creación de empresas de base tecnológica.",
        web: "https://parquecientificoumh.es",
      },
    ],
  },
  {
    categoria: "Hubs de Innovación y Aceleración",
    icono: Rocket,
    imagen: "/bg-innova.jpg",

    entidades: [
      {
        nombre: "Alicante Futura",
        icon: "/af-icono.png",
        color: "#6A1B9A",
        descripcion: "Hub urbano de innovación del Ayuntamiento de Alicante, orientado a impulsar el ecosistema tecnológico y la cultura emprendedora de la ciudad.",
        web: "https://alicantefutura.org",
      },
      {
        nombre: "CEEI Alcoy — Valencia",
        icon: "/ceei-icono.png",
        color: "#E65100",
        descripcion: "Centro Europeo de Empresas e Innovación que apoya la creación y consolidación de empresas innovadoras mediante asesoramiento y recursos.",
        web: "https://ceeialcoi.emprenemjunts.es",
      },
      {
        nombre: "Distrito Digital",
        icon: "/ddcv-icono.png",
        color: "#0097A7",
        descripcion: "Ecosistema de innovación de la Generalitat Valenciana que concentra talento, tecnología y empresas digitales en la provincia de Alicante.",
        web: "https://distritodigitalcv.es",
      },
    ],
  },
  {
    categoria: "Institutos Tecnológicos",
    icono: Microchip,
    imagen: "/bg-instituto.jpg",

    entidades: [
      {
        nombre: "Instituto Tecnológico de Informática (ITI)",
        icon: "/iti-icono.jpg",
        color: "#1565C0",
        descripcion: "Centro de investigación aplicada en tecnologías de la información, inteligencia artificial y transformación digital.",
        web: "https://www.iti.es",
      },
      {
        nombre: "AITEX — Instituto Tecnológico Textil",
        icon: "/aitex-icono.jpg",
        color: "#AD1457",
        descripcion: "Instituto tecnológico referente en innovación textil, materiales avanzados y sostenibilidad industrial.",
        web: "https://www.aitex.es",
      },
    ],
  },
];

export default function Invitado() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loadingComunicados, setLoadingComunicados] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<Record<string, boolean>>({
    "Universidades y Centros de Investigación": false,
    "Parques Científicos y Tecnológicos": false,
    "Hubs de Innovación y Aceleración": false,
    "Institutos Tecnológicos": false,
  });
  const closeTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const toggleCategoria = (cat: string) => {
    setCategoriasAbiertas(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  useEffect(() => {
    fetch(`${API_URL}/comunicados`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Comunicado[]) =>
        setComunicados(data.filter((c) => c.activo).slice(0, 3))
      )
      .catch(() => { })
      .finally(() => setLoadingComunicados(false));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--gris-pagina)" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — fullscreen background image with cinematic typography
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-screen flex flex-col overflow-hidden">

        {/* Background image */}
        <img
          src="/background-invitado.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 z-1" style={{ background: "rgba(0,0,0,0.52)" }} />

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <nav className="relative z-20 w-full px-8 py-6 flex flex-row items-center justify-between md:grid md:grid-cols-3">
          {/* Logo */}
          <Image src={logo} alt="Atalayas EGM" className="h-14 w-auto brightness-0 invert" />

          {/* Nav links — desktop only */}
          <div className="hidden md:flex items-center justify-center gap-8">
            <span className="text-2xl text-white cursor-default transition-colors">Inicio</span>
            <a href="#noticias" className="text-2xl text-white/50 hover:text-white transition-colors">Noticias</a>
            <a href="#comunidad" className="text-2xl text-white/50 hover:text-white transition-colors">Comunidad</a>
            <a href="#colaboradores" className="text-2xl text-white/50 hover:text-white transition-colors">Colaboradores</a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 flex flex-col gap-1.5"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Menu"
          >
            <div className="w-6 h-0.5 bg-white" />
            <div className="w-6 h-0.5 bg-white" />
            <div className="w-6 h-0.5 bg-white" />
          </button>
        </nav>

        {/* Mobile menu */}
        {menuAbierto && (
          <div className="md:hidden relative z-20 px-6 pb-6 flex flex-col" style={{ background: "rgba(0,0,0,0.85)" }}>
            <a href="#noticias" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Noticias</a>
            <a href="#comunidad" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Comunidad</a>
            <a href="#colaboradores" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Colaboradores</a>
            <Link href="/login" onClick={() => setMenuAbierto(false)} className="text-sm font-semibold py-3 text-white">Entrar</Link>
          </div>
        )}

        {/* ── Hero content ───────────────────────────────────────────── */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-40">
          <h1
            className="text-7xl sm:text-[9rem] md:text-[12rem] text-white leading-[0.9] max-w-7xl font-normal animate-fade-rise"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-2.46px" }}
          >
            Atalayas Área Empresarial.
          </h1>

          <p className={`${playfair.className} text-white/60 text-xl sm:text-2xl max-w-3xl mt-8 leading-relaxed animate-fade-rise-delay`}>
            La plataforma digital de incorporación y formación empresarial para las empresas del área industrial de Atalayas, Alicante.
          </p>

          <Link
            href="/login"
            className="liquid-glass rounded-full px-14 py-5 text-xl text-white mt-12 hover:scale-[1.03] transition-transform animate-fade-rise-delay-2 inline-flex items-center justify-center"
            style={{ background: "rgba(59, 130, 246, 0.25)" }}
          >
            Iniciar Sesión
          </Link>
        </div>
      </section>

      {/* NOTICIAS */}
      <section id="noticias" className="w-full px-6 sm:px-16 lg:px-24 xl:px-32 py-24 sm:py-36">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-px" style={{ background: "var(--azul-egm)" }} />
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--texto-muted)" }}>Blog, Noticias, Eventos</p>
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold leading-tight" style={{ color: "var(--texto-primario)" }}>
            Mantente al día<br />con Atalayas
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Featured card */}
          <Link href="/login" className="relative rounded-2xl overflow-hidden shrink-0 lg:w-[48%] min-h-[480px] sm:min-h-[560px] group block">
            <Image
              src="/background-invitado.jpg"
              alt="Noticia destacada"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
            <div className="absolute bottom-0 left-0 p-8 sm:p-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-px bg-white/60" />
                <span className="text-sm text-white/70 font-medium uppercase tracking-wider">Destacado</span>
              </div>
              <h3 className="text-white text-2xl sm:text-3xl font-bold leading-snug max-w-sm">
                EGM Atalayas lanza su nueva plataforma digital para empresas del área
              </h3>
            </div>
            <div className="absolute top-5 right-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white text-base">↗</div>
            </div>
          </Link>

          {/* Right column */}
          <div className="flex-1 flex flex-col">
            {/* Category tabs */}
            <div className="flex items-center gap-8 mb-8 overflow-x-auto pb-1" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
              {["Noticias", "Eventos", "Comunicados", "Convocatorias"].map((tab, i) => (
                <div key={tab} className="flex items-center gap-1.5 pb-4 shrink-0 cursor-pointer" style={{ borderBottom: i === 0 ? "2px solid var(--azul-egm)" : "2px solid transparent", marginBottom: "-1px" }}>
                  <span className="text-base font-medium whitespace-nowrap" style={{ color: i === 0 ? "var(--azul-egm)" : "var(--texto-muted)" }}>{tab}</span>
                  <span className="text-sm" style={{ color: i === 0 ? "var(--azul-egm)" : "var(--texto-muted)" }}>↗</span>
                </div>
              ))}
            </div>

            {/* Article list */}
            <div className="flex flex-col divide-y" style={{ borderColor: "var(--gris-borde)" }}>
              {[
                {
                  img: "/background-comunidad.jpg",
                  title: "Jornada de networking: conecta con +150 empresas del área",
                  tag: "Evento",
                  day: "18", month: "Abr", year: "2026",
                },
                {
                  img: "/background-invitado.jpg",
                  title: "Nuevos servicios de transporte lanzadera desde Alicante",
                  tag: "Noticia",
                  day: "10", month: "Abr", year: "2026",
                },
                {
                  img: "/background-comunidad.jpg",
                  title: "Convocatoria: Programa de formación para pymes del área empresarial",
                  tag: "Convocatoria",
                  day: "03", month: "Abr", year: "2026",
                },
              ].map((item) => (
                <Link href="/login" key={item.title} className="flex gap-6 py-7 group items-start">
                  <div className="relative w-32 h-22 sm:w-40 sm:h-28 rounded-xl overflow-hidden shrink-0" style={{ minHeight: "88px" }}>
                    <Image src={item.img} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-2 px-2.5 py-1 rounded-full inline-block" style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}>{item.tag}</p>
                    <h4 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 group-hover:underline" style={{ color: "var(--texto-primario)" }}>{item.title}</h4>
                    <p className="text-sm mt-1.5" style={{ color: "var(--texto-muted)" }}>Sin extracto disponible.</p>
                  </div>
                  <div className="shrink-0 text-right ml-3">
                    <p className="text-3xl font-bold leading-none" style={{ color: "var(--texto-primario)" }}>{item.day}</p>
                    <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>{item.month}</p>
                    <p className="text-sm" style={{ color: "var(--texto-muted)" }}>{item.year}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LOGO LOOP */}
      <section className="relative w-full pt-10 pb-20 sm:pt-14 sm:pb-28" style={{ background: "#F5F6F8" }}>
        <LogoLoop
          speed={35}
          size={70}
          gap={90}
          logos={[
            { src: "/logo.webp", alt: "EGM Atalayas" },
            { src: "/logo-famosa.png", alt: "Empresa 2" },
            { src: "/logo-aliaxis.png", alt: "Empresa 3" },
            { src: "/logo-blinker.png", alt: "Empresa 4" },
            { src: "/logo-seur.png", alt: "Empresa 5" },
            { src: "/logo-gofre.png", alt: "Empresa 6" },
            { src: "/logo-itae.png", alt: "Empresa 7" },
            { src: "/logo-pompadour.png", alt: "Empresa 8" },
            { src: "/logo-sprinter.png", alt: "Empresa 9" },
          ]}
        />
      </section>

      {/* COMUNIDAD */}
      <section
        id="comunidad"
        className="relative w-full mt-2"
        style={{ backgroundImage: "url('/background-comunidad.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.3) 100%)" }} />
        <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10" style={{ background: "linear-gradient(to bottom, #0d0d0d, transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, #000000)" }} />
        <div className="relative z-10 w-full px-6 sm:px-16 lg:px-24 xl:px-32 py-24 sm:py-36">
          <h2 className="text-5xl sm:text-6xl font-bold leading-tight mb-12 text-center" style={{ color: "white" }}>
            Nuestra Comunidad
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {comunidadItems.map((item) => (
              <div
              key={item.label}
              onClick={() => item.url && window.open(item.url, "_blank")}
              className="relative aspect-square flex flex-col justify-between p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] overflow-hidden"
                style={{
                  background: 'bg' in item && item.bg ? item.bg as string : "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: 'bg' in item ? undefined : "blur(8px)",
                }}
              >
                {/* Imagen (En Femenino) */}
                {(item.label === "Autobús lanzadera" || item.label === "Coche compartido" || item.label === "Aparcamiento VAO" || item.label === "Empresarios de hoy y de mañana" || item.label === "Voy en bici al trabajo" || item.label === "Atalayas circular") && 'imagen' in item && item.imagen ? (
                  <>
                    <img src={item.imagen as string} alt={item.label}
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl bg-black/40" />
                    <div className="flex-1" />
                  </>
                ) : item.label !== "Autobús lanzadera" && item.label !== "Coche compartido" && item.label !== "Aparcamiento VAO" && item.label !== "Empresarios de hoy y de mañana" && item.label !== "Voy en bici al trabajo" && item.label !== "Atalayas circular" && 'imagen' in item && item.imagen ? (
                  <div className="flex-1 flex items-center justify-center">
                    <img src={item.imagen as string} alt={item.label}
                      className="w-full h-full object-contain p-3" />
                  </div>
                ) : (
                  /* Icono */
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}
                  >
                    {item.icono}
                  </div>
                )}

                {/* Texto */}
                <div className="flex flex-col gap-1 relative z-10">
                  <p className="text-sm font-semibold leading-snug" style={{ color: 'bg' in item && item.bg === "#ffffff" ? "#111827" : "#ffffff" }}>
                    {item.label}
                  </p>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'bg' in item && item.bg === "#ffffff" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)" }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          COLABORADORES — Ecosistema de Proximidad
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="colaboradores"
        className="relative w-full"
        style={{ background: "#0a0a0f" }}
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.06) 0%, transparent 50%)" }} />
        {/* Top fade from previous dark section */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-10" style={{ background: "linear-gradient(to bottom, #000000, transparent)" }} />

        <div className="relative z-10 w-full px-6 sm:px-16 lg:px-24 xl:px-32 py-28 sm:py-40">
          {/* Section header */}
          <div className="text-center mb-20">
            <p className="text-2xl font-semibold uppercase tracking-[0.2em] mb-5" style={{ color: "rgba(147,197,253,0.7)" }}>
              Colaboradores
            </p>
            <h2
              className="text-5xl sm:text-8xl font-bold leading-[0.95] mb-8"
              style={{ fontFamily: "'Instrument Serif', serif", color: "#ffffff", letterSpacing: "-1px" }}
            >
              Ecosistema de Proximidad
            </h2>
            <p className="text-base sm:text-lg leading-relaxed max-w-3xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              Universidades, parques científicos, institutos tecnológicos y hubs de innovación. Conectamos necesidades reales con capacidades estratégicas del territorio.
            </p>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            {colaboradoresData.map((grupo) => {
              const Icon = grupo.icono;
              const isOpen = categoriasAbiertas[grupo.categoria];
              return (
                <button
                  key={grupo.categoria}
                  onMouseEnter={() => {
                    closeTimeoutRef.current[grupo.categoria] = setTimeout(() => {
                      setCategoriasAbiertas(prev => ({ ...prev, [grupo.categoria]: true }));
                    }, 300); // espera 300ms antes de abrir
                  }}
                  onMouseLeave={() => {
                    clearTimeout(closeTimeoutRef.current[grupo.categoria]);
                    setCategoriasAbiertas(prev => ({ ...prev, [grupo.categoria]: false }));
                  }}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:scale-105 flex items-center gap-2 ${isOpen
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"
                    }`}
                  style={{
                    borderWidth: "1px",
                    borderStyle: "solid",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {grupo.categoria}
                </button>
              );
            })}
          </div>

          {/* Category groups */}
          <div className="flex flex-col gap-10 max-w-[1600px] w-[95%] lg:w-full mx-auto pb-10">
            {colaboradoresData.map((grupo) => {
              const isOpen = categoriasAbiertas[grupo.categoria];
              const SectionIcon = grupo.icono;

              return (
                <div
                  key={grupo.categoria}
                  id={`cat-${grupo.categoria.replace(/\s+/g, "-").toLowerCase()}`}
                  onMouseEnter={() => {
                    closeTimeoutRef.current[grupo.categoria] = setTimeout(() => {
                      setCategoriasAbiertas(prev => ({ ...prev, [grupo.categoria]: true }));
                    }, 300); // espera 300ms antes de abrir
                  }}
                  onMouseLeave={() => {
                    clearTimeout(closeTimeoutRef.current[grupo.categoria]);
                    setCategoriasAbiertas(prev => ({ ...prev, [grupo.categoria]: false }));
                  }}
                  className="rounded-3xl overflow-hidden transition-all duration-500 ease-in-out relative"
                  style={{
                    border: "1px solid rgba(255,255,255,0.05)",
                    backgroundImage: `url(${grupo.imagen})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundAttachment: "local",
                  }}
                >
                  {/* UN SOLO overlay para todo el grupo */}
                  <div className="absolute inset-0 z-0" style={{ background: "rgba(0,0,0,0.75)" }} />

                  {/* Cabecera */}
                  <button
                    className="w-full flex items-center justify-between p-8 sm:p-12 cursor-pointer transition-colors relative z-10"
                    style={{ minHeight: "140px" }}
                  >
                    <div className="flex items-center gap-6">
                      <h3 className="text-2xl sm:text-4xl font-bold tracking-wide text-white text-left">
                        {grupo.categoria}
                      </h3>
                    </div>
                    <div className="shrink-0 ml-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                      <ChevronDown className={`w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {/* Grid de cards original */}
                  <div
                    className={`relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-8 sm:px-12 transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'pb-12 opacity-100 max-h-[3000px]' : 'max-h-0 opacity-0 pb-0'}`}
                  >
                    {grupo.entidades.map((entidad) => {
                      const EntidadIcon = entidad.icon;
                      return (
                        <a
                          key={entidad.nombre}
                          href={entidad.web}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex flex-col p-8 sm:p-10 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-4px] cursor-pointer overflow-hidden"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backdropFilter: "blur(12px)",
                          }}
                        >
                          {/* Hover glow */}
                          <div
                            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at 50% 0%, ${entidad.color}15, transparent 70%)` }}
                          />

                          {/* Icon badge */}
                          <div className="flex items-start justify-between mb-8 relative z-10">
                            <div
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center bg-white transition-transform duration-300 group-hover:scale-110 overflow-hidden relative p-2"
                              style={{
                                boxShadow: `0 8px 24px ${entidad.color}44`,
                              }}
                            >
                              <img src={entidad.icon as string} alt={entidad.nombre} className="w-full h-full object-contain" />
                            </div>
                            <div
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white/30 group-hover:text-white/80 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 17L17 7" />
                                <path d="M7 7h10v10" />
                              </svg>
                            </div>
                          </div>

                          {/* Name & description */}
                          <div className="flex-1 relative z-10">
                            <h4 className="text-xl sm:text-2xl font-bold leading-snug mb-4 group-hover:text-white transition-colors duration-300" style={{ color: "rgba(255,255,255,0.9)" }}>
                              {entidad.nombre}
                            </h4>
                            <p className="text-base sm:text-lg leading-relaxed line-clamp-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                              {entidad.descripcion}
                            </p>
                          </div>

                          {/* Bottom label */}
                          <div className="mt-8 pt-5 relative z-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <span className="text-sm font-medium uppercase tracking-widest group-hover:text-blue-400 transition-colors duration-300" style={{ color: "rgba(255,255,255,0.3)" }}>
                              Visitar web →
                            </span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>

              );
            })}
          </div>
        </div>
      </section >

      {/* FOOTER */}
      < FooterCTA />

    </div >
  );
}
