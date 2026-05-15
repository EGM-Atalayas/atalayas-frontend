"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";

export interface ComunicadoItem {
  id:         string;
  titulo:     string;
  mensaje:    string;
  fecha:      string;
  categoria?: string;
  imagenUrl?: string | null;
  tipo:       "egm" | "empresa";
}

interface Props {
  items:           ComunicadoItem[];
  autoplay?:       boolean;
  autoplayDelay?:  number;
  pauseOnHover?:   boolean;
  loop?:           boolean;
  /** Altura mínima del carrusel en px. Por defecto 320 */
  minHeight?:      number;
}

const GAP              = 16;
const DRAG_BUFFER      = 0;
const VELOCITY_THRESH  = 500;
const SPRING           = { type: "spring" as const, stiffness: 300, damping: 30 };

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

// ── Single card ───────────────────────────────────────────────────────────────
function Card({
  item, index, itemWidth, trackOffset, x, transition,
}: {
  item: ComunicadoItem; index: number; itemWidth: number;
  trackOffset: number; x: ReturnType<typeof useMotionValue<number>>;
  transition: object;
}) {
  const range      = [-(index + 1) * trackOffset, -index * trackOffset, -(index - 1) * trackOffset];
  const rotateY    = useTransform(x, range, [90, 0, -90], { clamp: false });
  const acento     = item.tipo === "egm" ? "var(--azul-egm)" : "var(--verde-oliva)";
  const labelTipo  = item.tipo === "egm" ? "EGM Atalayas" : "Tu empresa";

  const GRADIENTS: Record<string, string> = {
    egm:     "linear-gradient(135deg,#1b3f7e 0%,#0d1b2e 100%)",
    empresa: "linear-gradient(135deg,#4a6741 0%,#1a2a18 100%)",
  };

  return (
    <motion.div
      className="relative shrink-0 overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
      style={{
        width: itemWidth, height: "100%",
        rotateY,
        border: "1px solid var(--gris-borde)",
      }}
      transition={transition}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {item.imagenUrl ? (
          <img src={item.imagenUrl} alt={item.titulo}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: GRADIENTS[item.tipo] }} />
        )}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,18,36,0.95) 45%, rgba(10,18,36,0.3) 100%)" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6">
        {/* Top badge */}
        <div className="absolute top-4 right-4">
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
            style={{ background: acento, color: "#fff" }}
          >
            {item.categoria ?? labelTipo}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-px" style={{ background: "rgba(255,255,255,0.5)" }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            {formatFecha(item.fecha)}
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-snug mb-2 text-white line-clamp-2">
          {item.titulo}
        </h3>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.6)" }}>
          {item.mensaje}
        </p>
      </div>
    </motion.div>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────────
export default function ComunicadosCarousel({
  items,
  autoplay      = true,
  autoplayDelay = 4000,
  pauseOnHover  = true,
  loop          = true,
  minHeight     = 320,
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const [cWidth, setCWidth] = useState(600);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setCWidth(e.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const PADDING     = 0;
  const itemWidth   = cWidth;
  const trackOffset = itemWidth + GAP;

  const itemsForRender = useMemo(() => {
    if (!loop || items.length === 0) return items;
    return [items[items.length - 1], ...items, items[0]];
  }, [items, loop]);

  const [position, setPosition]       = useState(loop ? 1 : 0);
  const [isHovered, setIsHovered]     = useState(false);
  const [isJumping, setIsJumping]     = useState(false);
  const [isAnimating, setIsAnim]      = useState(false);
  // Track autoplay: running → stops after one full cycle → shows arrows
  const [autoplayDone, setAutoplayDone] = useState(false);
  const autoplayCycles                  = useRef(0);
  const x = useMotionValue(-(loop ? 1 : 0) * trackOffset);

  // Reset on items change
  useEffect(() => {
    const start = loop ? 1 : 0;
    setPosition(start);
    x.set(-start * trackOffset);
    autoplayCycles.current = 0;
    setAutoplayDone(false);
  }, [items.length, loop]);

  // Autoplay — stops after one full cycle
  useEffect(() => {
    if (!autoplay || autoplayDone || itemsForRender.length <= 1) return;
    if (pauseOnHover && isHovered) return;
    const t = setInterval(() => {
      setPosition((p) => {
        const next = p + 1;
        // Reached the last clone → one full cycle done
        if (next >= itemsForRender.length - 1) {
          autoplayCycles.current += 1;
          if (autoplayCycles.current >= 1) {
            clearInterval(t);
            setAutoplayDone(true);
          }
        }
        return Math.min(next, itemsForRender.length - 1);
      });
    }, autoplayDelay);
    return () => clearInterval(t);
  }, [autoplay, autoplayDone, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  const effectiveTrans = isJumping ? { duration: 0 } : SPRING;

  function onAnimComplete() {
    if (!loop || itemsForRender.length <= 1) { setIsAnim(false); return; }
    if (position === itemsForRender.length - 1) {
      setIsJumping(true);
      // If autoplay just finished its last jump, land on first real item
      setPosition(1); x.set(-trackOffset);
      requestAnimationFrame(() => { setIsJumping(false); setIsAnim(false); });
      return;
    }
    if (position === 0) {
      setIsJumping(true);
      setPosition(items.length); x.set(-items.length * trackOffset);
      requestAnimationFrame(() => { setIsJumping(false); setIsAnim(false); });
      return;
    }
    setIsAnim(false);
  }

  function navigate(dir: 1 | -1) {
    setPosition((p) => {
      const next = p + dir;
      const max  = itemsForRender.length - 1;
      if (loop) return Math.max(0, Math.min(next, max));
      return Math.max(1, Math.min(next, items.length));
    });
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    const dir =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESH ? 1
      : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESH ? -1 : 0;
    if (!dir) return;
    navigate(dir as 1 | -1);
  }

  const activeIndex = items.length === 0 ? 0
    : loop ? (position - 1 + items.length) % items.length
    : Math.min(position - 1, items.length - 1);

  const dragConstraints = loop ? undefined : {
    left:  -trackOffset * Math.max(itemsForRender.length - 1, 0),
    right: 0,
  };

  if (items.length === 0) return null;

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      {/* Carousel track */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl"
        style={{ height: `${minHeight}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Flechas — aparecen cuando el autoplay termina */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: autoplayDone ? 1 : 0, x: autoplayDone ? 0 : -8, pointerEvents: autoplayDone ? "auto" : "none" }}
          transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          onClick={() => navigate(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(6px)" }}
          aria-label="Anterior"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: autoplayDone ? 1 : 0, x: autoplayDone ? 0 : 8, pointerEvents: autoplayDone ? "auto" : "none" }}
          transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          onClick={() => navigate(1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(6px)" }}
          aria-label="Siguiente"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>

        {/* Dots — sobre la tarjeta */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 z-20">
          {items.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setPosition(loop ? i + 1 : i)}
              animate={{ scale: activeIndex === i ? 1.3 : 1, opacity: activeIndex === i ? 1 : 0.4 }}
              transition={{ duration: 0.15 }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#fff" }}
            />
          ))}
        </div>

        <motion.div
          className="flex h-full"
          drag={isAnimating ? false : "x"}
          dragConstraints={dragConstraints}
          style={{
            gap:               `${GAP}px`,
            perspective:       1000,
            perspectiveOrigin: `${position * trackOffset + itemWidth / 2}px 50%`,
            x,
            paddingLeft:       PADDING,
          }}
          onDragEnd={onDragEnd}
          animate={{ x: -(position * trackOffset) }}
          transition={effectiveTrans}
          onAnimationStart={() => setIsAnim(true)}
          onAnimationComplete={onAnimComplete}
        >
          {itemsForRender.map((item, index) => (
            <Card
              key={`${item.id}-${index}`}
              item={item}
              index={index}
              itemWidth={itemWidth}
              trackOffset={trackOffset}
              x={x}
              transition={effectiveTrans}
            />
          ))}
        </motion.div>
      </div>

    </div>
  );
}
