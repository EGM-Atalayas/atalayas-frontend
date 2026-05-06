"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DashboardHero from "@/components/ui/DashboardHero";

interface HubItem {
  titulo:      string;
  descripcion: string;
  imagen:      string;
  href:        string;
}

const HUB_ITEMS: HubItem[] = [
  {
    titulo:      "Eventos",
    descripcion: "Jornadas, networking y actividades del área empresarial",
    imagen:      "/bg-eventos.webp",
    href:        "/dashboard/eventos",
  },
  {
    titulo:      "Servicios",
    descripcion: "Bus lanzadera, coche compartido, aparcamiento y más",
    imagen:      "/bg-servicios.webp",
    href:        "/dashboard/servicios",
  },
  {
    titulo:      "Ventajas",
    descripcion: "Descuentos en comercios, servicios y ocio del área empresarial",
    imagen:      "/bg-ventajas.webp",
    href:        "/dashboard/ventajas",
  },
];

function HubCard({ item, index }: { item: HubItem; index: number }) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(item.href)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden cursor-pointer w-full text-left border-none p-0 bg-transparent"
      style={{
        height:       "clamp(280px, 38vw, 420px)",
        borderRadius: "16px",
        boxShadow:    hovered
          ? "0 20px 56px rgba(0,0,0,0.28)"
          : "0 4px 18px rgba(0,0,0,0.12)",
        transform:    hovered ? "translateY(-6px)" : "translateY(0)",
        transition:   "box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.20, 0.64, 1)",
        animation:    `heroFadeUp 0.55s ease ${index * 0.18}s both`,
        outline:      "none",
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px var(--verde-oliva-hover)"; }}
      onBlur={(e)  => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.12)"; }}
    >
      {/* Imagen de fondo */}
      <Image
        src={item.imagen}
        alt={item.titulo}
        fill
        className="object-cover"
        style={{
          transform:  hovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Overlay base — se oscurece en hover */}
      <div
        className="absolute inset-0 hidden sm:block"
        style={{
          background: hovered
            ? "linear-gradient(to top, rgba(8,17,34,0.92) 0%, rgba(8,17,34,0.55) 50%, rgba(8,17,34,0.10) 100%)"
            : "linear-gradient(to top, rgba(8,17,34,0.72) 0%, rgba(8,17,34,0.22) 50%, transparent 100%)",
          transition: "background 0.4s ease",
        }}
      />
      {/* Overlay móvil */}
      <div
        className="absolute inset-0 sm:hidden"
        style={{
          background: "linear-gradient(to top, rgba(4,10,22,0.88) 0%, rgba(4,10,22,0.55) 35%, rgba(4,10,22,0.10) 65%, transparent 100%)",
        }}
      />

      {/* Texto flotante móvil */}
      <div
        className="absolute left-0 right-0 px-6 sm:hidden"
        style={{ bottom: "24px", pointerEvents: "none" }}
      >
        <h2
          style={{
            fontFamily:    "var(--font-poppins), sans-serif",
            fontSize:      "1.5rem",
            fontWeight:    700,
            lineHeight:    1.15,
            letterSpacing: "-0.02em",
            color:         "#ffffff",
            textShadow:    "0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95), 0 8px 48px rgba(0,0,0,0.8)",
            marginBottom:  "6px",
          }}
        >
          {item.titulo}
        </h2>
        <p
          style={{
            fontSize:   "0.85rem",
            lineHeight: 1.5,
            color:      "rgba(255,255,255,0.92)",
            textShadow: "0 1px 6px rgba(0,0,0,1), 0 3px 16px rgba(0,0,0,0.95)",
          }}
        >
          {item.descripcion}
        </p>
      </div>

      {/* Título desktop — visible sin hover, desaparece al hacer hover */}
      <div
        className="absolute left-0 right-0 px-7 hidden sm:block"
        style={{
          bottom:        "30px",
          opacity:       hovered ? 0 : 1,
          transform:     hovered ? "translateY(6px)" : "translateY(0)",
          transition:    "opacity 0.25s ease, transform 0.30s ease",
          pointerEvents: "none",
        }}
      >
        <h2
          className="text-white"
          style={{
            fontFamily:    "var(--font-poppins), sans-serif",
            fontSize:      "clamp(1.75rem, 2.6vw, 2.15rem)",
            fontWeight:    700,
            lineHeight:    1.1,
            letterSpacing: "-0.03em",
            textShadow:    "0 2px 20px rgba(0,0,0,0.60)",
          }}
        >
          {item.titulo}
        </h2>
      </div>

      {/* Panel hover — solo desktop */}
      <div
        className="absolute bottom-0 left-0 right-0 hidden sm:block"
        style={{
          background: "linear-gradient(to top, rgba(6,13,28,0.96) 0%, rgba(6,13,28,0.80) 55%, rgba(6,13,28,0.0) 100%)",
          opacity:    hovered ? 1 : 0,
          transform:  hovered ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.40s cubic-bezier(0.34, 1.10, 0.64, 1)",
          padding:    "48px 22px 22px",
        }}
      >
        <h2
          style={{
            fontFamily:    "var(--font-poppins), sans-serif",
            fontSize:      "clamp(1.25rem, 1.9vw, 1.5rem)",
            fontWeight:    700,
            lineHeight:    1.2,
            letterSpacing: "-0.02em",
            color:         "#ffffff",
            marginBottom:  "6px",
            textShadow:    "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {item.titulo}
        </h2>

        <p
          style={{
            fontSize:     "0.875rem",
            lineHeight:   1.65,
            color:        "rgba(255,255,255,0.80)",
            marginBottom: "20px",
          }}
        >
          {item.descripcion}
        </p>

        {/* CTA */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              border:     "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.10)",
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <span
            style={{
              fontSize:      "0.82rem",
              fontWeight:    600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color:         "rgba(255,255,255,0.88)",
            }}
          >
            Explorar
          </span>
        </div>
      </div>
    </button>
  );
}

export default function ComunidadPage() {
  return (
    <div style={{ background: "var(--gris-pagina)", minHeight: "100vh" }}>
      <DashboardHero
        prefijo="Nuestra "
        titulo="Comunidad"
        imagenFondo="/background-comunidad.webp"
        objectPosition="center 55%"
      />

      <div className="px-5 sm:px-9 lg:px-14 pt-14 sm:pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-9 lg:gap-14">
          {HUB_ITEMS.map((item, index) => (
            <HubCard key={item.href} item={item} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
