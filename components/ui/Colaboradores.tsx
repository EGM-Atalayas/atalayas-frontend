
"use client";

import { useState, useRef, useEffect } from "react";
import {
    GraduationCap, FlaskConical, Rocket, Microchip, ChevronDown
} from "lucide-react";

interface ColaboradoresProps {
    variant?: "invitado" | "dashboard";
}

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

export default function Colaboradores({ variant = "invitado" }: ColaboradoresProps) {
    const [categoriasAbiertas, setCategoriasAbiertas] = useState<Record<string, boolean>>({
        "Universidades y Centros de Investigación": false,
        "Parques Científicos y Tecnológicos": false,
        "Hubs de Innovación y Aceleración": false,
        "Institutos Tecnológicos": false,
    });

    const closeTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
    const sectionRef = useRef<HTMLElement>(null);

    const d = variant === "dashboard";

    // Tokens (mantengo los tuyos)
    const bgSeccion = d ? "var(--gris-pagina)" : "#0a0a0f";
    const colorLabel = d ? "var(--azul-egm)" : "rgba(147,197,253,0.7)";
    const colorTitulo = d ? "var(--texto-primario)" : "#ffffff";
    const colorSubtitulo = d ? "var(--texto-muted)" : "rgba(255,255,255,0.5)";
    const pillActivo = d ? "bg-[var(--azul-egm-light)] text-[var(--azul-egm)] border-[var(--azul-egm)]"
        : "bg-white/10 text-white border-white/20";
    const pillInactivo = d ? "bg-white text-[var(--texto-muted)] border-[var(--gris-borde)] hover:text-[var(--azul-egm)] hover:border-[var(--azul-egm)]"
        : "bg-white/5 text-white/50 border-white/10 hover:text-white/80";
    const bordeGrupo = d ? "1px solid var(--gris-borde)" : "1px solid rgba(255,255,255,0.05)";
    const overlayGrupo = d ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.75)";
    const colorCabecera = d ? "var(--texto-primario)" : "#ffffff";
    const bgChevron = d ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)";
    const colorChevron = d ? "var(--texto-muted)" : "rgba(255,255,255,0.5)";
    const bgCard = d ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.04)";
    const bordeCard = d ? "1px solid var(--gris-borde)" : "1px solid rgba(255,255,255,0.08)";
    const colorNombreCard = d ? "var(--texto-primario)" : "rgba(255,255,255,0.9)";
    const colorDescCard = d ? "var(--texto-muted)" : "rgba(255,255,255,0.5)";
    const colorFlechaCard = d ? "var(--texto-muted)" : "rgba(255,255,255,0.3)";
    const bordeBottomCard = d ? "1px solid var(--gris-borde)" : "1px solid rgba(255,255,255,0.06)";
    const colorVisitar = d ? "var(--azul-egm)" : "rgba(255,255,255,0.3)";
    const bgFlechaCard = d ? "var(--gris-superficie)" : "rgba(255,255,255,0.06)";

    // Animación suave de entrada solo en dashboard
    useEffect(() => {
        if (!d || !sectionRef.current) return;

        const section = sectionRef.current;
        section.style.opacity = "0";
        section.style.transform = "translateY(30px)";

        setTimeout(() => {
            section.style.transition = "opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)";
            section.style.opacity = "1";
            section.style.transform = "translateY(0)";
        }, 100);
    }, [d]);

    return (
        <section
            id="colaboradores"
            ref={sectionRef}
            className="relative w-full"
            style={{ background: bgSeccion }}
        >
            <div className="relative z-10 w-full px-6 sm:px-16 lg:px-24 xl:px-32 py-16 sm:py-24">

                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: colorLabel }}>
                        Colaboradores
                    </p>
                    <h2
                        className="text-4xl sm:text-6xl font-bold leading-[0.95] mb-6"
                        style={{ fontFamily: "'Instrument Serif', serif", color: colorTitulo, letterSpacing: "-1px" }}
                    >
                        Ecosistema de Proximidad
                    </h2>
                    <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: colorSubtitulo }}>
                        Universidades, parques científicos, institutos tecnológicos y hubs de innovación. Conectamos necesidades reales con capacidades estratégicas del territorio.
                    </p>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                    {colaboradoresData.map((grupo, index) => {
                        const Icon = grupo.icono;
                        const isOpen = categoriasAbiertas[grupo.categoria];

                        return (
                            <button
                                key={grupo.categoria}
                                className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:scale-105 flex items-center gap-2 ${isOpen ? pillActivo : pillInactivo}`}
                                style={{
                                    borderWidth: "1px",
                                    borderStyle: "solid",
                                    backdropFilter: "blur(8px)",
                                    transitionDelay: `${80 + index * 50}ms`
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                {grupo.categoria}
                            </button>
                        );
                    })}
                </div>

                {/* Grupos - Versión corregida (solo hover) */}
                <div className="flex flex-col gap-8 max-w-[1600px] w-[95%] lg:w-full mx-auto pb-8">
                    {colaboradoresData.map((grupo) => {
                        const isOpen = categoriasAbiertas[grupo.categoria];

                        return (
                            <div
                                key={grupo.categoria}
                                onMouseEnter={() => {
                                    if (closeTimeoutRef.current[grupo.categoria]) {
                                        clearTimeout(closeTimeoutRef.current[grupo.categoria]);
                                    }
                                    setCategoriasAbiertas(prev => ({ ...prev, [grupo.categoria]: true }));
                                }}
                                onMouseLeave={() => {
                                    closeTimeoutRef.current[grupo.categoria] = setTimeout(() => {
                                        setCategoriasAbiertas(prev => ({ ...prev, [grupo.categoria]: false }));
                                    }, 250);
                                }}
                                className="rounded-3xl overflow-hidden transition-all duration-500 ease-in-out relative"
                                style={{
                                    border: "none",                    // ← Eliminamos el borde
                                    backgroundImage: `url(${grupo.imagen})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    boxShadow: d ? "0 4px 20px rgba(0, 0, 0, 0.08)" : "0 4px 30px rgba(0, 0, 0, 0.4)",
                                }}
                            >
                                {/* Overlay */}
                                <div className="absolute inset-0 z-0" style={{ background: overlayGrupo, borderRadius: "inherit" }} />
                                {/* Cabecera */}
                                <button
                                    className="w-full flex items-center justify-between p-6 sm:p-10 cursor-pointer transition-colors relative z-10"
                                    style={{ minHeight: "100px" }}
                                >
                                    <h3 className="text-xl sm:text-3xl font-bold tracking-wide text-left" style={{ color: colorCabecera }}>
                                        {grupo.categoria}
                                    </h3>
                                    <div
                                        className="shrink-0 ml-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors"
                                        style={{ background: bgChevron, color: colorChevron }}
                                    >
                                        <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                                    </div>
                                </button>

                                {/* Cards - Animación optimizada */}
                                {/* Cards - Más cerrado por defecto */}
                                <div
                                    className={`relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-6 sm:px-10 overflow-hidden transition-all duration-500 ease-out ${isOpen ? "pb-12" : "pb-2"}`}
                                    style={{
                                        opacity: isOpen ? 1 : 0,
                                        transform: isOpen ? "translateY(0px)" : "translateY(40px)",
                                        transition: "all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
                                        willChange: isOpen ? "transform, opacity" : "auto",
                                        maxHeight: isOpen ? "1200px" : "0px"
                                    }}
                                >
                                    {grupo.entidades.map((entidad, cardIndex) => (
                                        <a
                                            key={entidad.nombre}
                                            href={entidad.web}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative flex flex-col p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden"
                                            style={{
                                                background: bgCard,
                                                border: bordeCard,
                                                backdropFilter: "blur(12px)",
                                                transitionDelay: `${cardIndex * 30}ms`
                                            }}
                                        >
                                            {/* Contenido de la card (exactamente como lo tenías) */}
                                            <div
                                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                                style={{ background: `radial-gradient(ellipse at 50% 0%, ${entidad.color}20, transparent 70%)` }}
                                            />

                                            <div className="flex items-start justify-between mb-6 relative z-10">
                                                <div
                                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center bg-white transition-transform duration-300 group-hover:scale-110 overflow-hidden p-2"
                                                    style={{ boxShadow: `0 6px 20px ${entidad.color}33` }}
                                                >
                                                    <img src={entidad.icon} alt={entidad.nombre} className="w-full h-full object-contain" />
                                                </div>
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                                                    style={{ background: bgFlechaCard, color: colorFlechaCard }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                                                    </svg>
                                                </div>
                                            </div>

                                            <div className="flex-1 relative z-10">
                                                <h4 className="text-lg sm:text-xl font-bold leading-snug mb-3" style={{ color: colorNombreCard }}>
                                                    {entidad.nombre}
                                                </h4>
                                                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: colorDescCard }}>
                                                    {entidad.descripcion}
                                                </p>
                                            </div>

                                            <div className="mt-6 pt-4 relative z-10" style={{ borderTop: bordeBottomCard }}>
                                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: colorVisitar }}>
                                                    Visitar web →
                                                </span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}