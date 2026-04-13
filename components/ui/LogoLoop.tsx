"use client";

import React from "react";

interface LogoItem {
  src: string;
  alt: string;
  href?: string;
}

interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number; // segundos para un ciclo completo
  size?: number;  // altura en px de cada logo
  gap?: number;   // gap en px entre logos
}

export default function LogoLoop({
  logos,
  speed = 30,
  size = 48,
  gap = 64,
}: LogoLoopProps) {
  // Duplicamos los logos para el efecto loop infinito
  const items = [...logos, ...logos];

  return (
    <div
      className="w-full overflow-hidden"
      style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
    >
      <div
        className="flex items-center"
        style={{
          display: "flex",
          width: "max-content",
          animation: `logoLoop ${speed}s linear infinite`,
          gap: `${gap}px`,
        }}
      >
        {items.map((logo, idx) => {
          const img = (
            <img
              key={idx}
              src={logo.src}
              alt={logo.alt}
              style={{
                height: `${size}px`,
                width: "auto",
                objectFit: "contain",
                filter: "grayscale(100%) brightness(0) invert(0.6)",
                flexShrink: 0,
                transition: "filter 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "none")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "grayscale(100%) brightness(0) invert(0.6)")}
            />
          );
          return logo.href ? (
            <a key={idx} href={logo.href} target="_blank" rel="noopener noreferrer">
              {img}
            </a>
          ) : (
            <React.Fragment key={idx}>{img}</React.Fragment>
          );
        })}
      </div>

      <style>{`
        @keyframes logoLoop {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
