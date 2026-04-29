"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { AiFillEye } from "react-icons/ai";
import {
    FlaskConical, Cpu, ChevronDown, University
} from "lucide-react";

interface ColaboradoresProps {
    variant?: "invitado" | "dashboard";
}

const colaboradoresData = [
    {
        categoria: "Universidades",
        descripcion: "Investigación y transferencia de conocimiento",
        icono: University,
        imagen: "/bg-universidad.webp",
        entidades: [
            {
                nombre: "Universidad de Alicante",
                icon: "/ua-icono.webp",
                color: "#003DA5",
                descripcion: "Universidad pública con una fuerte vocación de I+D+i, conexión con empresas y proyectos de transferencia tecnológica.",
                web: "https://www.ua.es",
            },
            {
                nombre: "Universidad Miguel Hernández de Elche",
                icon: "/umh-icono.webp",
                color: "#8B1A1A",
                descripcion: "Universidad pública con múltiples programas de innovación, transferencia y colaboración con empresas e instituciones.",
                web: "https://www.umh.es",
            },
        ],
    },
    {
        categoria: "Parques Científicos",
        descripcion: "Innovación y conexión empresarial",
        icono: FlaskConical,
        imagen: "/bg-parque.webp",
        entidades: [
            {
                nombre: "Parque Científico de Alicante",
                icon: "/pca-icono.webp",
                color: "#2E7D32",
                descripcion: "Espacio de innovación que conecta la investigación universitaria con el mundo empresarial, ofreciendo infraestructuras y servicios de apoyo.",
                web: "https://pca.ua.es",
            },
            {
                nombre: "Parque Científico UMH",
                icon: "/pcumh-icono.webp",
                color: "#C62828",
                descripcion: "Entorno tecnológico que facilita la transferencia de conocimiento y la creación de empresas de base tecnológica.",
                web: "https://parquecientificoumh.es",
            },
        ],
    },
    {
        categoria: "Institutos Tecnológicos",
        descripcion: "Desarrollo tecnológico especializado",
        icono: Cpu,
        imagen: "/bg-instituto.webp",
        entidades: [
            {
                nombre: "AIJU — Instituto Tecnológico de producto infantil y recreativo",
                icon: "/aiju-icono.webp",
                color: "#1565C0",
                descripcion: "Centro tecnológico especializado en el sector del producto infantil y recreativo, ofreciendo servicios de investigación, desarrollo e innovación.",
                web: "https://www.aiju.es",
            },
            {
                nombre: "INESCOP Instituto Tecnológico del Calzado",
                icon: "/inescop-icono.webp",
                color: "#1565C0",
                descripcion: "Centro de investigación aplicada en el calzado, servicios de investigacion y diferentes competitividades.",
                web: "https://www.iti.es",
            },
            {
                nombre: "AITEX — Instituto Tecnológico Textil",
                icon: "/aitex-icono.webp",
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
    const gruposRef = useRef<Record<string, HTMLDivElement | null>>({});
    const animateGrupo = (categoria: string, open: boolean) => {
        const el = gruposRef.current[categoria];
        if (!el) return;

        const cards = el.querySelectorAll(".card-item");

        if (open) {
            gsap.fromTo(
                cards,
                {
                    opacity: 0,
                    y: 40,
                    scale: 0.98,
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: "power3.out",
                    stagger: 0.08,
                }
            );
        } else {
            gsap.to(cards, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                ease: "power2.in",
            });
        }
    };

    const d = variant === "dashboard";

    // Tokens (mantengo los tuyos)
    const bgSeccion = d ? "var(--gris-pagina)" : "#0a0a0f";
    const colorLabel = d ? "var(--azul-egm)" : "rgba(147,197,253,0.7)";
    const colorTitulo = d ? "var(--texto-primario)" : "#ffffff";
    const colorSubtitulo = d ? "var(--texto-muted)" : "rgba(255,255,255,0.5)";
    const overlayGrupo = d
        ? "rgba(255,255,255,0.82)"
        : "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))";
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
                {!d && (
                    <div className="text-center mb-16">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: colorLabel }}>
                            Colaboradores
                        </p>
                        <h2
                            className="text-5xl sm:text-7xl tracking-tight font-bold leading-[0.95] mb-6"
                            style={{ fontFamily: "'Instrument Serif', serif", color: colorTitulo, letterSpacing: "-1px" }}
                        >
                            Ecosistema de Proximidad
                        </h2>
                        <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: colorSubtitulo }}>
                            Universidades, centros de investigación, parques científicos e institutos tecnológicos. Conectamos necesidades reales con capacidades estratégicas del territorio.
                        </p>
                    </div>
                )}

                {/* Descripción del Ecosistema - Solo en Dashboard */}
                {d && (
                    <div className="max-w-3xl mx-auto text-center mb-16 px-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-(--azul-egm-light)/20 border border-(--azul-egm)/30 mb-6">
                            <AiFillEye className="text-xl text-(--azul-egm)" />
                            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--azul-egm)" }}>
                                NUESTRO ENFOQUE
                            </span>
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--texto-primario)" }}>
                            Conectando talento, conocimiento y empresa
                        </h3>

                        <p className="text-base sm:text-lg leading-relaxed mt-4" style={{ color: "var(--texto-muted)" }}>
                            Facilitamos la colaboración estratégica entre universidades, parques científicos,
                            institutos tecnológicos y empresas del territorio.
                            Aceleramos proyectos de innovación con impacto real y cercano.
                        </p>
                    </div>
                )}

                {/* Grupos*/}
                <div className="flex flex-col gap-8 max-w-[1600px] w-[95%] lg:w-full mx-auto pt-8 pb-8">
                    {colaboradoresData.map((grupo) => {
                        const isOpen = categoriasAbiertas[grupo.categoria];
                        const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

                        return (
                            <div
                                key={grupo.categoria}
                                onMouseEnter={() => {
                                    // Solo activar hover en pantallas grandes
                                    if (isDesktop) {
                                        if (closeTimeoutRef.current[grupo.categoria]) {
                                            clearTimeout(closeTimeoutRef.current[grupo.categoria]);
                                        }
                                        setCategoriasAbiertas(prev => {
                                            const newState = !prev[grupo.categoria];
                                            animateGrupo(grupo.categoria, newState);

                                            return {
                                                ...prev,
                                                [grupo.categoria]: newState
                                            };
                                        });
                                    }
                                }}
                                onMouseLeave={() => {
                                    if (window.innerWidth >= 768) {
                                        closeTimeoutRef.current[grupo.categoria] = setTimeout(() => {
                                            setCategoriasAbiertas(prev => ({ ...prev, [grupo.categoria]: false }));
                                        }, 250);
                                    }
                                }}
                                className="rounded-3xl overflow-hidden transition-all duration-500 ease-in-out relative hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]"
                                style={{
                                    backgroundImage: `url(${grupo.imagen})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
                                }}
                            >
                                {/* Overlay */}
                                <div className="absolute inset-0 z-0" style={{ background: overlayGrupo, borderRadius: "inherit" }} />
                                {/* Cabecera - Soporte Hover + Click (mejor para móvil) */}
                                <button
                                    onClick={() => {
                                        setCategoriasAbiertas(prev => ({
                                            ...prev,
                                            [grupo.categoria]: !prev[grupo.categoria]
                                        }));
                                    }}
                                    className="w-full flex items-center justify-between p-6 sm:p-10 cursor-pointer transition-all relative z-10 group active:scale-[0.985]"
                                    style={{ minHeight: "100px" }}
                                >
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {/* Icono con animación */}
                                        <div
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:rotate-6 group-active:scale-95"
                                            style={{
                                                background: d ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)",
                                                color: d ? "var(--azul-egm)" : "#ffffff",
                                            }}
                                        >
                                            <grupo.icono className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300" />
                                        </div>

                                        <h3
                                            className="text-xl sm:text-3xl font-bold tracking-wide"
                                            style={{ color: colorCabecera }}
                                        >
                                            {grupo.categoria}
                                        </h3>

                                        <span
                                            className="text-sm sm:text-base flex items-center gap-2"
                                            style={{ color: colorCabecera }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                                            {grupo.descripcion}
                                        </span>

                                    </div>

                                    {/* Chevron */}
                                    <div
                                        className="shrink-0 ml-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300"
                                        style={{ background: bgChevron, color: colorChevron }}
                                    >
                                        <ChevronDown
                                            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                                        />
                                    </div>
                                </button>

                                {/* Cards - Animación optimizada */}
                                <div
                                    className={`relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-6 sm:px-10 overflow-hidden transition-all duration-500 ease-out ${isOpen ? "pb-12 opacity-100" : "pb-0 opacity-0 pointer-events-none"}`}
                                    style={{
                                        transition: "all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
                                        willChange: isOpen ? "transform, opacity" : "auto",
                                        maxHeight: isOpen ? "1200px" : "10px"
                                    }}
                                    ref={(el) => {
                                        gruposRef.current[grupo.categoria] = el;
                                    }}
                                >
                                    {grupo.entidades.map((entidad, cardIndex) => (
                                        <a
                                            key={entidad.nombre}
                                            href={entidad.web}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="card-item group relative flex flex-col p-6 sm:p-8 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-xl cursor-pointer overflow-hidden"
                                            style={{
                                                background: bgCard,
                                                border: bordeCard,
                                                backdropFilter: "blur(12px)",
                                                transitionDelay: `${cardIndex * 30}ms`,
                                                boxShadow: `0 10px 30px ${entidad.color}22`
                                            }}
                                        >
                                            {/* Contenido de la card (exactamente como lo tenías) */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500"
                                                style={{
                                                    background: `linear-gradient(120deg, transparent, ${entidad.color}15, transparent)`
                                                }}
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