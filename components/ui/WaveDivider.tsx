"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Forma inicial: ola pronunciada hacia arriba
const WAVE = "M0-0.3C0-0.3,464,156,1139,156S2278-0.3,2278-0.3V683H0V-0.3z";
// Forma final: plana
const FLAT = "M0-0.3C0-0.3,464,0,1139,0s1139-0.3,1139-0.3V683H0V-0.3z";

interface WaveDividerProps {
  /** Color de relleno del SVG — debe coincidir con el fondo de la sección siguiente */
  fill?: string;
  /** Color de fondo del contenedor — debe coincidir con el fondo de la sección anterior */
  background?: string;
}

export default function WaveDivider({ fill = "#ffffff", background = "transparent" }: WaveDividerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const path = pathRef.current;
    if (!container || !path) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top bottom",
      toggleActions: "play pause resume reverse",
      onEnter: (self) => {
        const velocity = self.getVelocity();
        const variation = Math.min(Math.abs(velocity / 10000), 0.8);

        gsap.fromTo(
          path,
          { attr: { d: WAVE } },
          {
            duration: 2,
            attr: { d: FLAT },
            ease: `elastic.out(${1 + variation}, ${1 - variation})`,
            overwrite: true,
          }
        );
      },
      onLeaveBack: () => {
        gsap.to(path, {
          duration: 1,
          attr: { d: WAVE },
          ease: "power2.inOut",
          overwrite: true,
        });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full pointer-events-none"
      style={{ marginBottom: "-2px", lineHeight: 0, background }}
    >
      <svg
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2278 683"
        style={{ width: "100%", height: "clamp(60px, 10vw, 120px)", display: "block", overflow: "visible" }}
      >
        <path ref={pathRef} d={WAVE} fill={fill} />
      </svg>
    </div>
  );
}
