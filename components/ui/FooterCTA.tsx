"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Hls from "hls.js";
import { motion } from "motion/react";

const VIDEO_SRC = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";
const POSTER = "https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3Njg5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080";

export default function FooterCTA() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(VIDEO_SRC);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = VIDEO_SRC;
      video.play().catch(() => {});
    }
  }, []);

  return (
    <footer
      className="relative w-full min-h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#000000", color: "white" }}
    >
      {/* Background video */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        poster={POSTER}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.6 }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: "blur(2px)" }} />

      {/* Decorative gradients */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%", left: "20%",
          width: 600, height: 600,
          background: "rgba(30,58,138,0.2)",
          filter: "blur(120px)",
          mixBlendMode: "screen",
          borderRadius: "50%",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%", right: "20%",
          width: 500, height: 500,
          background: "rgba(55,48,163,0.2)",
          filter: "blur(120px)",
          mixBlendMode: "screen",
          borderRadius: "50%",
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center mt-20 space-y-12 px-6"
      >
        {/* Pre-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl text-white leading-[1.1]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Únete a Atalayas
        </motion.p>

        {/* Main headline */}
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-6xl sm:text-8xl font-semibold leading-[0.9] tracking-tighter"
          style={{
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: "clamp(3.5rem, 10vw, 136px)",
            background: "linear-gradient(to bottom, #ffffff, #ffffff, #b4c0ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ¿Tu empresa está en el parque empresarial?
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.7 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg sm:text-[20px] leading-[1.65] max-w-xl"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          Digitaliza la incorporación y formación interna de tu equipo en minutos. Sin conocimientos técnicos.
        </motion.p>

        {/* CTA */}
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
    </footer>
  );
}
