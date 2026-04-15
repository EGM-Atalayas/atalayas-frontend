"use client";

import { useRef, useCallback, useEffect, ReactNode } from "react";
import { motion, useMotionValue, useAnimationFrame, useTransform } from "motion/react";

interface GradientTextProps {
  children:       ReactNode;
  className?:     string;
  style?:         React.CSSProperties;
  /** Color stops – must be valid CSS colors */
  colors?:        string[];
  animationSpeed?: number;   // seconds for one half-cycle
  pauseOnHover?:  boolean;
  yoyo?:          boolean;
}

export default function GradientText({
  children,
  className    = "",
  style: styleProp,
  colors       = ["#ffffff", "#d0e8a0", "#8fb040", "#d0e8a0", "#ffffff"],
  animationSpeed = 6,
  pauseOnHover = false,
  yoyo         = true,
}: GradientTextProps) {
  const isPausedRef  = useRef(false);
  const elapsedRef   = useRef(0);
  const lastTimeRef  = useRef<number | null>(null);
  const progress     = useMotionValue(0);           // 0 → 1

  useAnimationFrame((time) => {
    if (isPausedRef.current) { lastTimeRef.current = null; return; }
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }

    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += delta;

    const duration = animationSpeed * 1000;
    if (yoyo) {
      const full  = duration * 2;
      const cycle = elapsedRef.current % full;
      progress.set(cycle < duration ? cycle / duration : 1 - (cycle - duration) / duration);
    } else {
      progress.set((elapsedRef.current / duration) % 1);
    }
  });

  useEffect(() => { elapsedRef.current = 0; progress.set(0); }, [animationSpeed, yoyo]);

  const handleMouseEnter = useCallback(() => { if (pauseOnHover) isPausedRef.current = true;  }, [pauseOnHover]);
  const handleMouseLeave = useCallback(() => { if (pauseOnHover) isPausedRef.current = false; }, [pauseOnHover]);

  /** Interpolate between color stops at the current progress value */
  const color = useTransform(progress, (t: number) => {
    const stops  = colors.length - 1;
    const scaled = t * stops;
    const i      = Math.min(Math.floor(scaled), stops - 1);
    const frac   = scaled - i;
    return lerpColor(colors[i], colors[i + 1], frac);
  });

  return (
    <motion.span
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: "inline", color, ...styleProp }}
    >
      {children}
    </motion.span>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function lerpColor(a: string, b: string, t: number) {
  // handle both hex and rgb(...) strings
  const ca = parseColor(a);
  const cb = parseColor(b);
  return rgbToHex(
    ca[0] + (cb[0] - ca[0]) * t,
    ca[1] + (cb[1] - ca[1]) * t,
    ca[2] + (cb[2] - ca[2]) * t,
  );
}

function parseColor(c: string): [number, number, number] {
  if (c.startsWith("#")) return hexToRgb(c);
  const m = c.match(/\d+/g);
  return m ? [+m[0], +m[1], +m[2]] : [255, 255, 255];
}
