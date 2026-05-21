"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Props {
  data: { nombre: string; total: number }[];
  total: number;
  palette: string[];
}

export function DonutDepartamentos({ data, total, palette }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const active = activeIdx !== null ? data[activeIdx] : null;
  const activeColor = activeIdx !== null ? palette[activeIdx % palette.length] : null;

  return (
    <div className="flex-1 flex flex-col sm:flex-row gap-6 items-center min-h-[260px]">
      {/* Donut */}
      <div style={{ width: 240, height: 240, flexShrink: 0, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="nombre"
              cx="50%" cy="50%"
              innerRadius={74} outerRadius={108}
              paddingAngle={2}
              animationDuration={400}
              animationEasing="ease-out"
              onMouseEnter={(_, i) => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={palette[i % palette.length]}
                  stroke="none"
                  opacity={activeIdx === null || activeIdx === i ? 1 : 0.25}
                  style={{ cursor: "pointer", transition: "opacity 0.18s ease" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centro con fade suave */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", padding: "0 16px" }}>
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div key={activeIdx}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontFamily: "var(--font-raleway), sans-serif", fontSize: "1.7rem", fontWeight: 800, color: activeColor!, lineHeight: 1, fontVariantNumeric: "lining-nums", letterSpacing: "-0.03em" }}>{active.total}</span>
                <span className="text-center" style={{ fontSize: "0.58rem", fontWeight: 700, color: activeColor!, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>{active.nombre}</span>
              </motion.div>
            ) : (
              <motion.div key="total"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ fontFamily: "var(--font-raleway), sans-serif", fontSize: "1.9rem", fontWeight: 800, color: "var(--texto-primario)", lineHeight: 1, fontVariantNumeric: "lining-nums", letterSpacing: "-0.03em" }}>{total}</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--texto-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>activos</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {data.map((d, i) => {
          const color = palette[i % palette.length];
          const pct = Math.round(d.total / total * 100);
          const isActive = activeIdx === i;
          return (
            <div key={d.nombre}
              className="flex items-center gap-2 min-w-0 rounded-lg px-2 py-1"
              style={{
                background: isActive ? `${color}12` : "transparent", cursor: "default",
                transition: "background 0.15s ease"
              }}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: color, transform: isActive ? "scale(1.35)" : "scale(1)",
                  transition: "transform 0.15s ease"
                }} />
              <span className="text-xs truncate flex-1"
                style={{
                  color: isActive ? "var(--texto-primario)" : "var(--texto-secundario)",
                  fontWeight: isActive ? 600 : 500, transition: "color 0.15s ease, font-weight 0.15s ease"
                }}>
                {d.nombre}
              </span>
              <span className="text-xs font-bold shrink-0" style={{ minWidth: 18, textAlign: "right", color: isActive ? color : "var(--texto-primario)", transition: "color 0.15s ease" }}>{d.total}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: `${color}18`, color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
