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

  const [position, setPosition]   = useState(loop ? 1 : 0);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isAnimating, setIsAnim]  = useState(false);
  const x = useMotionValue(-(loop ? 1 : 0) * trackOffset);

  // Reset on items change
  useEffect(() => {
    const start = loop ? 1 : 0;
    setPosition(start);
    x.set(-start * trackOffset);
  }, [items.length, loop]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return;
    if (pauseOnHover && isHovered) return;
    const t = setInterval(() => {
      setPosition((p) => Math.min(p + 1, itemsForRender.length - 1));
    }, autoplayDelay);
    return () => clearInterval(t);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  const effectiveTrans = isJumping ? { duration: 0 } : SPRING;

  function onAnimComplete() {
    if (!loop || itemsForRender.length <= 1) { setIsAnim(false); return; }
    if (position === itemsForRender.length - 1) {
      setIsJumping(true);
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

  function onDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    const dir =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESH ? 1
      : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESH ? -1 : 0;
    if (!dir) return;
    setPosition((p) => Math.max(0, Math.min(p + dir, itemsForRender.length - 1)));
  }

  const activeIndex = items.length === 0 ? 0
    : loop ? (position - 1 + items.length) % items.length
    : Math.min(position, items.length - 1);

  const dragConstraints = loop ? undefined : {
    left:  -trackOffset * Math.max(itemsForRender.length - 1, 0),
    right: 0,
  };

  if (items.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-4 h-full">
      {/* Carousel track */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl flex-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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

      {/* Dots centrados */}
      <div className="flex items-center justify-center gap-2">
        {items.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => setPosition(loop ? i + 1 : i)}
            animate={{ scale: activeIndex === i ? 1.3 : 1, opacity: activeIndex === i ? 1 : 0.35 }}
            transition={{ duration: 0.15 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--azul-egm)" }}
          />
        ))}
      </div>
    </div>
  );
}
