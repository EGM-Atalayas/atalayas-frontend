"use client";

import React from "react";

interface LogoItem {
  src: string;
  alt: string;
  href?: string;
}

interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  size?: number;
  gap?: number;
}

export default function LogoLoop({
  logos,
  speed = 30,
  size = 48,
  gap = 64,
}: LogoLoopProps) {
  const items = [...logos, ...logos];

  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex items-center"
        style={{
          display: "flex",
          width: "max-content",
          animation: `logoLoop ${speed}s linear infinite`,
          gap: `${gap}px`,
          willChange: "transform",
        }}
      >
        {items.map((logo, idx) => {
          const img = (
            <img
              key={idx}
              src={logo.src}
              alt={logo.alt}
              loading="lazy"
              decoding="async"
              style={{
                height: `${size}px`,
                width: "auto",
                objectFit: "contain",
                flexShrink: 0,
                opacity: 0.5,
                transition: "opacity 0.3s",
                pointerEvents: "auto",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
            />
          );
          return logo.href ? (
            <a key={idx} href={logo.href} target="_blank" rel="noopener noreferrer" style={{ cursor: "pointer", pointerEvents: "auto" }}>
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
