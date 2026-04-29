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
import Colaboradores from "../ui/Colaboradores";
import type { Comunicado, Noticia } from "@/lib/types/noticias";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const comunidadItems = [
  { label: "En Femenino", sub: "Liderazgo e igualdad en el entorno empresarial", imagen: "/logo-en-femenino.png", bg: "#8878c8", icono: null, url: "https://atalayas.com/en-femenino/" },
  { label: "Autobús lanzadera", sub: "Servicio de transporte directo al área empresarial", imagen: "/autobus.jpg", bg: null, icono: null, url: "https://atalayas.com/autobus-lanzadera/" },
  { label: "Coche compartido", sub: "Coordina rutas con compañeros del área", imagen: "/coche-compartido.jpg", bg: null, icono: null, url: "https://atalayas.com/journify-coche-compartido/" },
  { label: "Aparcamiento VAO", sub: "Plazas exclusivas para vehículos de alta ocupación", imagen: "/aparcamiento-vao.png", bg: null, icono: null, url: "https://atalayas.com/aparcamientovao/" },
  { label: "Empresarios de hoy y de mañana", sub: "Networking y actividades entre empresas del área", imagen: "/empresas-hoy.jpg", bg: null, icono: null, url: "https://atalayas.com/100-estudiantes-20-empresarios/" },
  { label: "Proyecto empresas solidarias", sub: "Más de 44.000 personas ya han sido beneficiadas.", imagen: "/empresas-solidarias.png", bg: "#ffffff", icono: null, url: "https://atalayas.com/empresas-solidarias/" },
  { label: "Voy en bici al trabajo", sub: "Semana de la movilidad", imagen: "/trabajo-bici.jpg", bg: null, icono: null, url: "https://atalayas.com/semana-de-la-movilidad/" },
  { label: "Atalayas circular", sub: "3R: REDUCIR, REUTILIZAR Y RECICLAR", imagen: "/atalayas-circular.jpg", bg: null, icono: null, url: "https://atalayas.com/atalayas-circular/" },
];

// Tipo normalizado para mostrar en la lista
interface ItemLista {
  id: string;
  img: string | null;
  title: string;
  tag: string;
  extracto: string;
  day: string;
  month: string;
  year: string;
  fuente: "egm" | "empresa";
}

function comunicadoToItem(c: Comunicado): ItemLista {
  const fecha = c.fechaPublicacion ? new Date(c.fechaPublicacion) : new Date(c.actualizadoEn ?? "");
  return {
    id: c.comunicadoId,
    img: c.imagenUrl ?? null,
    title: c.titulo,
    tag: c.categoria ?? "General",
    extracto: c.mensaje?.slice(0, 120) ?? "",
    day: fecha.getDate().toString().padStart(2, "0"),
    month: fecha.toLocaleDateString("es-ES", { month: "short" }),
    year: fecha.getFullYear().toString(),
    fuente: "egm",
  };
}

function anuncioToItem(n: Noticia): ItemLista {
  const fecha = new Date(n.creadoEn);
  return {
    id: n.anuncioId,
    img: n.imagenUrl ?? null,
    title: n.titulo,
    tag: n.empresaId ? "Empresa" : "General",
    extracto: n.contenido?.slice(0, 120) ?? "",
    day: fecha.getDate().toString().padStart(2, "0"),
    month: fecha.toLocaleDateString("es-ES", { month: "short" }),
    year: fecha.getFullYear().toString(),
    fuente: "empresa",
  };
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function Invitado() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [tabActivo, setTabActivo] = useState(0);
  const [todosLosComunicados, setTodosLosComunicados] = useState<Comunicado[]>([]);
  const [todosLosAnuncios, setTodosLosAnuncios] = useState<Noticia[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);

  // Destacado (primero con imagenUrl o el primero)
  const destacadoRaw = todosLosComunicados.find(c => c.destacado && c.imagenUrl) 
    ?? todosLosComunicados.find(c => c.imagenUrl) 
    ?? todosLosComunicados[0] 
    ?? todosLosAnuncios[0]
    ?? null;

  const destacado = destacadoRaw
    ? { ...comunicadoToItem(destacadoRaw as Comunicado), fuente: "egm" as const }
    : (todosLosAnuncios.length > 0 ? anuncioToItem(todosLosAnuncios[0]) : null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/comunicados`).then((res) => { if (!res.ok) throw new Error(); return res.json(); }),
      fetch(`${API_URL}/anuncios`).then((res) => { if (!res.ok) throw new Error(); return res.json(); }),
    ])
      .then(([comunicadosData, anunciosData]) => {
        const comunicadosActivos = (comunicadosData as Comunicado[]).filter(c => c.activo && c.estado !== "borrador");
        comunicadosActivos.sort((a, b) => new Date(b.fechaPublicacion ?? "").getTime() - new Date(a.fechaPublicacion ?? "").getTime());
        setTodosLosComunicados(comunicadosActivos);

        const anunciosActivos = (anunciosData as Noticia[]).filter(n => n.activo && n.estado !== "borrador");
        anunciosActivos.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
        setTodosLosAnuncios(anunciosActivos);
      })
      .catch(() => {})
      .finally(() => setLoadingNoticias(false));
  }, []);

  // Filtrar por tab — combina comunicados EGM + anuncios de empresas
  const itemsComunicados = todosLosComunicados.map(comunicadoToItem);
  const itemsAnuncios = todosLosAnuncios.map(anuncioToItem);

  const itemsPorTab: ItemLista[][] = [
    // Tab 0: Noticias → comunicados (Novedad/General) + anuncios de empresas
    [
      ...todosLosComunicados
        .filter(c => !c.categoria || c.categoria === "Novedad" || c.categoria === "General")
        .map(comunicadoToItem),
      ...itemsAnuncios,
    ].sort((a, b) => {
      const dateA = new Date(`${a.year}-${MESES.indexOf(a.month)}-${a.day}`).getTime();
      const dateB = new Date(`${b.year}-${MESES.indexOf(b.month)}-${b.day}`).getTime();
      return dateB - dateA;
    }),
    // Tab 1: Eventos
    todosLosComunicados
      .filter(c => c.categoria === "Evento")
      .map(comunicadoToItem),
    // Tab 2: Comunicados → todos los comunicados EGM
    itemsComunicados,
    // Tab 3: Convocatorias → Aviso
    todosLosComunicados
      .filter(c => c.categoria === "Aviso")
      .map(comunicadoToItem),
  ];

  const itemsActivos = itemsPorTab[tabActivo];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--gris-pagina)" }}>

      {/* HERO */}
      <section className="relative w-full min-h-screen flex flex-col overflow-hidden">
        <img src="/background-invitado.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover z-0" />
        <div className="absolute inset-0 z-1" style={{ background: "rgba(0,0,0,0.52)" }} />

        <nav className="absolute top-0 left-0 right-0 z-20 w-full px-8 py-6 flex flex-row items-center justify-between md:grid md:grid-cols-3">
          <Image src={logo} alt="Atalayas EGM" className="h-14 w-auto brightness-0 invert" />
          <div className="hidden md:flex items-center justify-center gap-8">
            <span className="text-2xl text-white cursor-default transition-colors">Inicio</span>
            <a href="#noticias" className="text-2xl text-white/50 hover:text-white transition-colors">Noticias</a>
            <a href="#comunidad" className="text-2xl text-white/50 hover:text-white transition-colors">Comunidad</a>
            <a href="#colaboradores" className="text-2xl text-white/50 hover:text-white transition-colors">Colaboradores</a>
          </div>
          <button className="md:hidden text-white p-2 flex flex-col gap-1.5" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menu">
            <div className="w-6 h-0.5 bg-white" />
            <div className="w-6 h-0.5 bg-white" />
            <div className="w-6 h-0.5 bg-white" />
          </button>
        </nav>

        {menuAbierto && (
          <div className="md:hidden absolute top-[88px] left-0 right-0 z-20 px-6 pb-6 flex flex-col" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
            <a href="#noticias" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Noticias</a>
            <a href="#comunidad" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Comunidad</a>
            <a href="#colaboradores" onClick={() => setMenuAbierto(false)} className="text-sm py-3 text-white/80" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Colaboradores</a>
            <Link href="/login" onClick={() => setMenuAbierto(false)} className="text-sm font-semibold py-3 text-white">Entrar</Link>
          </div>
        )}

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-40">
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
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-px" style={{ background: "var(--azul-egm)" }} />
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--texto-muted)" }}>Blog, Noticias, Eventos</p>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-3" style={{ color: "var(--texto-primario)" }}>
            Noticias y actualidad<br />del área empresarial
          </h2>
          <p className="text-base leading-relaxed max-w-xl" style={{ color: "var(--texto-muted)" }}>
            Descubre los últimos eventos, comunicados y convocatorias de Atalayas Ciudad Empresarial.
            Mantente informado de todo lo que ocurre en el parque.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">

          {/* Featured card — usa datos reales si hay destacado */}
          <Link href="/login" className="relative rounded-2xl overflow-hidden shrink-0 lg:w-[48%] min-h-[480px] sm:min-h-[560px] group block">
            {destacado?.img ? (
              <img src={destacado.img} alt={destacado.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <Image src="/background-invitado.jpg" alt="Noticia destacada" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
            <div className="absolute bottom-0 left-0 p-8 sm:p-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-px bg-white/60" />
                <span className="text-sm text-white/70 font-medium uppercase tracking-wider">Destacado</span>
              </div>
              <h3 className="text-white text-2xl sm:text-3xl font-bold leading-snug max-w-sm">
                {destacado?.title ?? "EGM Atalayas lanza su nueva plataforma digital para empresas del área"}
              </h3>
            </div>
            <div className="absolute top-5 right-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm text-white text-base">↗</div>
            </div>
          </Link>

          {/* Right column */}
          <div className="flex-1 flex flex-col">

            {/* Tabs interactivos */}
            <div className="flex items-center gap-8 mb-8 overflow-x-auto pb-1" style={{ borderBottom: "1px solid var(--gris-borde)" }}>
              {["Noticias", "Eventos", "Comunicados", "Convocatorias"].map((tab, i) => (
                <div
                  key={tab}
                  onClick={() => setTabActivo(i)}
                  className="flex items-center gap-1.5 pb-4 shrink-0 cursor-pointer transition-colors"
                  style={{
                    borderBottom: tabActivo === i ? "2px solid var(--azul-egm)" : "2px solid transparent",
                    marginBottom: "-1px",
                  }}
                >
                  <span className="text-base font-medium whitespace-nowrap transition-colors"
                    style={{ color: tabActivo === i ? "var(--azul-egm)" : "var(--texto-muted)" }}>
                    {tab}
                  </span>
                  <span style={{ color: tabActivo === i ? "var(--azul-egm)" : "var(--texto-muted)" }}>↗</span>
                </div>
              ))}
            </div>

            {/* Lista artículos */}
            {loadingNoticias ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
              </div>
            ) : itemsActivos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-base font-medium mb-1" style={{ color: "var(--texto-primario)" }}>No hay contenido en esta categoría</p>
                <p className="text-sm" style={{ color: "var(--texto-muted)" }}>Vuelve pronto para ver las novedades.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y" style={{ borderColor: "var(--gris-borde)" }}>
                {itemsActivos.slice(0, 3).map((item) => (
                  <Link href="/login" key={item.id} className="flex gap-6 py-7 group items-start">
                    <div className="relative w-32 h-22 sm:w-40 sm:h-28 rounded-xl overflow-hidden shrink-0" style={{ minHeight: "88px" }}>
                      {item.img ? (
                        <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <Image src="/background-comunidad.jpg" alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold mb-2 px-2.5 py-1 rounded-full inline-block"
                        style={{ background: item.fuente === "egm" ? "var(--gris-superficie)" : "rgba(45,90,61,0.12)", color: item.fuente === "egm" ? "var(--texto-muted)" : "var(--verde-oliva)", border: `1px solid ${item.fuente === "egm" ? "var(--gris-borde)" : "rgba(45,90,61,0.25)"}` }}>
                        {item.fuente === "egm" ? item.tag : item.tag}
                      </p>
                      <h4 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 group-hover:underline"
                        style={{ color: "var(--texto-primario)" }}>
                        {item.title}
                      </h4>
                      <p className="text-sm mt-1.5 line-clamp-2" style={{ color: "var(--texto-muted)" }}>
                        {item.extracto || "Sin extracto disponible."}
                      </p>
                    </div>
                    <div className="shrink-0 text-right ml-3">
                      <p className="text-3xl font-bold leading-none" style={{ color: "var(--texto-primario)" }}>{item.day}</p>
                      <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>{item.month}</p>
                      <p className="text-sm" style={{ color: "var(--texto-muted)" }}>{item.year}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LOGO LOOP */}
      <section className="relative w-full pt-10 pb-20 sm:pt-14 sm:pb-28" style={{ background: "#F5F6F8" }}>
        <LogoLoop
          speed={35} size={70} gap={90}
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
                {(item.label === "Autobús lanzadera" || item.label === "Coche compartido" || item.label === "Aparcamiento VAO" || item.label === "Empresarios de hoy y de mañana" || item.label === "Voy en bici al trabajo" || item.label === "Atalayas circular") && 'imagen' in item && item.imagen ? (
                  <>
                    <img src={item.imagen as string} alt={item.label} className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                    <div className="absolute inset-0 rounded-2xl bg-black/40" />
                    <div className="flex-1" />
                  </>
                ) : item.label !== "Autobús lanzadera" && item.label !== "Coche compartido" && item.label !== "Aparcamiento VAO" && item.label !== "Empresarios de hoy y de mañana" && item.label !== "Voy en bici al trabajo" && item.label !== "Atalayas circular" && 'imagen' in item && item.imagen ? (
                  <div className="flex-1 flex items-center justify-center">
                    <img src={item.imagen as string} alt={item.label} className="w-full h-full object-contain p-3" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
                    {item.icono}
                  </div>
                )}
                <div className="flex flex-col gap-1 relative z-10">
                  <p className="text-sm font-semibold leading-snug"
                    style={{ color: 'bg' in item && item.bg === "#ffffff" ? "#111827" : "#ffffff" }}>
                    {item.label}
                  </p>
                  <p className="text-xs leading-relaxed line-clamp-2"
                    style={{ color: 'bg' in item && item.bg === "#ffffff" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)" }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Colaboradores />
      <FooterCTA />

    </div>
  );
}