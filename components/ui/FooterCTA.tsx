"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Hls from "hls.js";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const VIDEO_SRC = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";
const POSTER = "https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3Njg5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080";

// Heading split into chars for stagger animation
const HEADING = "¿Tu empresa está en el parque empresarial?";

export default function FooterCTA() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const footerRef   = useRef<HTMLElement>(null);
  const outerRef    = useRef<HTMLDivElement>(null);
  const innerRef    = useRef<HTMLDivElement>(null);
  const charsRef    = useRef<(HTMLSpanElement | null)[]>([]);

  // ─── HLS video setup ────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(VIDEO_SRC);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = VIDEO_SRC;
      video.play().catch(() => {});
    }
  }, []);

  // ─── GSAP: outer/inner reveal + video parallax + char stagger ───────────
  useEffect(() => {
    const footer = footerRef.current;
    const outer  = outerRef.current;
    const inner  = innerRef.current;
    const video  = videoRef.current;
    const chars  = charsRef.current.filter(Boolean) as HTMLSpanElement[];

    if (!footer || !outer || !inner || !chars.length) return;

    // Initial states (like the CodePen but adapted for scroll-trigger)
    gsap.set(outer, { yPercent: 12 });
    gsap.set(inner, { yPercent: -12 });
    if (video) gsap.set(video, { yPercent: 15 });
    gsap.set(chars, { autoAlpha: 0, yPercent: 150 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: footer,
        start: "top 90%",
        toggleActions: "play pause resume reverse",
      },
      defaults: { duration: 1.25, ease: "power1.inOut" },
    });

    // Outer + inner sliding reveal (the CodePen core effect)
    tl.to([outer, inner], { yPercent: 0 }, 0);

    // Video parallax
    if (video) tl.to(video, { yPercent: 0 }, 0);

    // Char stagger (from CodePen: autoAlpha + yPercent from random)
    tl.to(chars, {
      autoAlpha: 1,
      yPercent: 0,
      duration: 1,
      ease: "power2.out",
      stagger: { each: 0.025, from: "random" },
    }, 0.2);

    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative w-full flex flex-col"
      style={{ background: "#000000", color: "white", minHeight: "60vh" }}
    >
      {/* ── outer/inner wrapper (ClipCode adaptation) ─────────────────── */}
      <div ref={outerRef} className="w-full h-full flex flex-col" style={{ overflow: "hidden", flex: 1 }}>
        <div ref={innerRef} className="relative w-full flex flex-col" style={{ flex: 1 }}>

          {/* Background video */}
          <video
            ref={videoRef}
            muted loop playsInline poster={POSTER}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.6 }}
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: "blur(2px)" }} />

          {/* Fade superior — mezcla con LogoLoop */}
          <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none z-10"
            style={{ background: "linear-gradient(to bottom, #0D1B2E, transparent)" }} />

          {/* Decorative gradients */}
          <div className="absolute pointer-events-none" style={{
            top: "-20%", left: "20%", width: 600, height: 600,
            background: "rgba(30,58,138,0.2)", filter: "blur(120px)",
            mixBlendMode: "screen", borderRadius: "50%",
          }} />
          <div className="absolute pointer-events-none" style={{
            bottom: "-10%", right: "20%", width: 500, height: 500,
            background: "rgba(55,48,163,0.2)", filter: "blur(120px)",
            mixBlendMode: "screen", borderRadius: "50%",
          }} />

          {/* Content */}
          <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center mt-12 space-y-8 px-6 py-12">

            {/* Pre-headline — motion fade-up (existing) */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-xl sm:text-3xl text-white leading-[1.1]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Únete a Atalayas
            </motion.p>

            {/* Main headline — GSAP char stagger (CodePen adaptation) */}
            <h2
              className="text-4xl sm:text-6xl font-semibold leading-[1] tracking-tighter"
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "clamp(2rem, 6vw, 72px)",
              }}
            >
              {HEADING.split("").map((char, i) => (
                <span
                  key={i}
                  style={{ overflow: "hidden", display: "inline-block" }}
                >
                  <span
                    ref={(el) => { charsRef.current[i] = el; }}
                    style={{
                      display: "inline-block",
                      background: "linear-gradient(to bottom, #ffffff, #ffffff, #b4c0ff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      whiteSpace: char === " " ? "pre" : "normal",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                </span>
              ))}
            </h2>

            {/* Subheadline — motion fade (existing) */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.7 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm sm:text-base leading-[1.65] max-w-xl"
              style={{ fontFamily: "'Instrument Sans', sans-serif" }}
            >
              Digitaliza la incorporación y formación interna de tu equipo en minutos. Sin conocimientos técnicos.
            </motion.p>

            {/* CTA — motion fade-up (existing) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link
                href="/register-empresa"
                className="liquid-glass rounded-full px-10 py-4 text-xl font-semibold text-white hover:scale-[1.03] transition-transform inline-flex items-center justify-center"
                style={{ background: "rgba(59, 130, 246, 0.25)", fontFamily: "'Instrument Sans', sans-serif" }}
              >
                Solicitar alta
              </Link>
            </motion.div>
          </div>

          {/* Bottom bar */}
          <div className="relative z-10 w-full mt-auto px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
            <p className="text-sm text-white/40" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
              © {new Date().getFullYear()} EGM Atalayas Ciudad Empresarial. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                Iniciar sesión
              </Link>
              <Link href="/register-empresa" className="text-sm text-white/40 hover:text-white transition-colors" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
                Registrar empresa
              </Link>
            </div>
          </div>


        </div>
      </div>
    </footer>
  );
}
