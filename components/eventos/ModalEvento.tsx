"use client";

import { useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Loader2, MapPin, Search, Check, ImagePlus, Trash2, Globe2,
} from "lucide-react";
import {
  crearEventoComunidad,
  actualizarEventoComunidad,
  subirImagenEvento,
  type ComunidadEvento,
  type ComunidadEventoInput,
} from "@/lib/api/comunidad";
import { buscarDireccion, type GeocodingResult } from "@/lib/geocoding";
import { MapaUbicacion } from "./MapaUbicacion";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import Grainient from "@/components/ui/Grainient";

const TAB_COLOR = "#0F766E";

const inputBase: React.CSSProperties = {
  background:    "var(--blanco)",
  border:        "1px solid rgba(0,0,0,0.12)",
  borderRadius:  "var(--radius-lg)",
  color:         "var(--texto-primario)",
  fontSize:      "0.875rem",
  width:         "100%",
  height:        "44px",
  paddingLeft:   "14px",
  paddingRight:  "14px",
  outline:       "none",
  transition:    "border-color 0.15s",
};

const textareaBase: React.CSSProperties = {
  ...inputBase,
  height:        "auto",
  padding:       "10px 14px",
  resize:        "none",
};

const labelBase: React.CSSProperties = {
  display:       "block",
  fontSize:      "0.875rem",
  fontWeight:    600,
  color:         "var(--texto-label)",
  marginBottom:  6,
};

interface Props {
  evento:       ComunidadEvento | null;
  esSuperAdmin: boolean;
  onClose:      () => void;
  onGuardado:   (evento: ComunidadEvento) => void;
}

export function ModalEvento({ evento, esSuperAdmin, onClose, onGuardado }: Props) {
  type TabId = "informacion" | "detalles";

  const esNuevo = !evento;

  const isoToLocal = (iso: string | null | undefined): string => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  // ── Form state ────────────────────────────────────────────────────────────────
  const [titulo,       setTitulo]      = useState(evento?.titulo ?? "");
  const [descripcion,  setDescripcion] = useState(evento?.descripcion ?? "");
  const [fechaInicio,  setFechaInicio] = useState(isoToLocal(evento?.fechaInicio));
  const [fechaFin,     setFechaFin]    = useState(isoToLocal(evento?.fechaFin));
  const [esGlobal,     setEsGlobal]    = useState(evento?.esGlobal ?? false);
  const [enviando,     setEnviando]    = useState(false);
  const [error,        setError]       = useState<string | null>(null);

  // ── Tabs ──────────────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]   = useState<TabId>("informacion");
  const visitedTabs = useRef<Set<TabId>>(new Set(["informacion"]));

  const TABS: { id: TabId; label: string }[] = [
    { id: "informacion", label: "Información" },
    { id: "detalles",    label: "Detalles"    },
  ];

  const goTab = (id: TabId) => {
    visitedTabs.current.add(id);
    setActiveTab(id);
  };

  // ── Ubicación ────────────────────────────────────────────────────────────────
  const [lugar,          setLugar]          = useState(evento?.lugar ?? "");
  const [latitud,        setLatitud]        = useState<number | null>(evento?.latitud ?? null);
  const [longitud,       setLongitud]       = useState<number | null>(evento?.longitud ?? null);
  const [buscandoMapa,   setBuscandoMapa]   = useState(false);
  const [resultadosMapa, setResultadosMapa] = useState<GeocodingResult[]>([]);
  const [erroresMapa,    setErroresMapa]    = useState<string | null>(null);

  // ── Imagen ────────────────────────────────────────────────────────────────────
  const [imagenUrl,    setImagenUrl]    = useState<string | null>(evento?.imagenUrl ?? null);
  const [subiendoImg,  setSubiendoImg]  = useState(false);
  const [errorImg,     setErrorImg]     = useState<string | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragOver,    setDragOver]    = useState(false);

  const onSeleccionarImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrorImg("La imagen no puede pesar más de 5 MB"); return; }
    setSubiendoImg(true); setErrorImg(null);
    try {
      const url = await subirImagenEvento(file);
      if (!url) { setErrorImg("Error al subir la imagen"); return; }
      setImagenUrl(url);
    } finally {
      setSubiendoImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const buscar = useCallback(async (query?: string) => {
    const q = (query ?? lugar).trim();
    if (!q) return;
    setBuscandoMapa(true); setErroresMapa(null); setResultadosMapa([]);
    try {
      const res = await buscarDireccion(q, 5);
      if (res.length === 0) setErroresMapa("Sin resultados — prueba con más detalles");
      else setResultadosMapa(res);
    } finally { setBuscandoMapa(false); }
  }, [lugar]);

  const onLugarChange = (val: string) => {
    setLugar(val);
    setResultadosMapa([]); setErroresMapa(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 3) {
      debounceRef.current = setTimeout(() => buscar(val), 900);
    }
  };

  const seleccionar = (r: GeocodingResult) => {
    setLatitud(r.latitud); setLongitud(r.longitud);
    setLugar(r.etiqueta); setResultadosMapa([]);
  };

  const limpiarUbicacion = () => {
    setLatitud(null); setLongitud(null);
    setLugar(""); setResultadosMapa([]); setErroresMapa(null);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !fechaInicio) {
      setError("Título y fecha de inicio son obligatorios");
      goTab("informacion");
      return;
    }
    setEnviando(true); setError(null);
    try {
      const payload: ComunidadEventoInput = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin: fechaFin ? new Date(fechaFin).toISOString() : null,
        lugar: lugar.trim() || null,
        latitud, longitud, imagenUrl,
        ...(esSuperAdmin && { esGlobal }),
      };
      const guardado = esNuevo
        ? await crearEventoComunidad(payload)
        : await actualizarEventoComunidad(evento!.eventoId, payload);
      onGuardado(guardado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setEnviando(false); }
  };

  const focusOn  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    { e.currentTarget.style.borderColor = TAB_COLOR; e.currentTarget.style.boxShadow = `0 0 0 3px ${TAB_COLOR}18`; };
  const focusOff = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.boxShadow = "none"; };

  const content = (
    <AnimatePresence>
      <motion.div
        key="modal-evento-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "var(--overlay)" }}
        onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal-evento-panel"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.26, ease: [0.34, 1.15, 0.64, 1] }}
          className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "92dvh", background: "var(--gris-panel)", boxShadow: "0 24px 56px rgba(0,0,0,0.18)" }}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* ── Header con Grainient ── */}
          <div className="relative shrink-0 flex items-center justify-between px-5 sm:px-6"
            style={{ paddingTop: 20, paddingBottom: 20, background: TAB_COLOR, overflow: "hidden" }}>
            <div className="absolute inset-0 pointer-events-none">
              <Grainient
                color1="#0F766E" color2="#0D9488" color3="#065F46"
                timeSpeed={0.15} warpStrength={1.0} warpFrequency={3.5}
                warpSpeed={1.2} warpAmplitude={50} grainAmount={0.07}
              />
            </div>
            <div className="relative z-10 flex flex-col gap-0.5 min-w-0">
              <h2 style={{
                fontFamily: "var(--font-raleway), sans-serif",
                fontWeight: 800, fontSize: "clamp(1.4rem, 4vw, 1.8rem)",
                lineHeight: 1.1, letterSpacing: "-0.03em", color: "#fff", margin: 0,
              }}>
                {esNuevo ? "Crear evento" : "Editar evento"}
              </h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                {esNuevo ? "Visible para los empleados de tu empresa" : "Los cambios se aplicarán inmediatamente"}
              </p>
            </div>
            <div className="relative z-10 shrink-0 ml-4">
              <IconButton onClick={onClose} variant="glass" label="Cerrar" />
            </div>
          </div>

          {/* ── Tabs internos ── */}
          <div className="shrink-0 relative"
            style={{ background: "var(--gris-superficie)", borderBottom: "1px solid var(--gris-borde)" }}>
            <div className="flex">
              {TABS.map(({ id, label }) => {
                const isActive = activeTab === id;
                return (
                  <button key={id} type="button" onClick={() => goTab(id)}
                    className="flex-1 py-3.5 text-sm font-semibold focus:outline-none cursor-pointer"
                    style={{
                      color: isActive ? TAB_COLOR : "var(--texto-muted)",
                      background: "none", border: "none",
                      transition: "color 0.18s ease",
                    }}>
                    {label}
                  </button>
                );
              })}
            </div>
            {/* Underline animado */}
            <div style={{
              position: "absolute", bottom: -1, left: 0,
              width: `${100 / TABS.length}%`, height: 2,
              background: TAB_COLOR,
              transform: `translateX(${TABS.findIndex(t => t.id === activeTab) * 100}%)`,
              transition: "transform 0.24s cubic-bezier(0.4,0,0.2,1)",
              borderRadius: 2,
            }} />
          </div>

          {/* ── Body scrollable ── */}
          <form onSubmit={enviar} className="flex flex-col overflow-hidden flex-1 min-h-0">
            <div className="overflow-y-auto flex-1" style={{ background: "var(--gris-panel)" }}>

              {/* ══ TAB: Información ══ */}
              <div style={{ display: activeTab === "informacion" ? "block" : "none" }}>
                <div className="flex flex-col gap-5 px-5 sm:px-6 py-6">

                  {/* Imagen de portada */}
                  <div>
                    <label style={labelBase}>
                      Imagen de portada{" "}
                      <span style={{ color: "var(--texto-muted)", fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                      onChange={onSeleccionarImagen} className="hidden" />

                    {imagenUrl ? (
                      <div className="relative rounded-xl overflow-hidden group"
                        style={{ height: 160, background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagenUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "rgba(0,0,0,0.45)" }}>
                          <motion.button type="button" onClick={() => fileInputRef.current?.click()}
                            whileTap={{ scale: 0.93 }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                            style={{ background: "#fff", color: "var(--texto-primario)", transition: "background 0.15s, box-shadow 0.15s" }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--gris-superficie)"; el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.18)"; }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#fff"; el.style.boxShadow = "none"; }}>
                            <ImagePlus size={13} strokeWidth={2} /> Cambiar
                          </motion.button>
                          <motion.button type="button" onClick={() => { setImagenUrl(null); setErrorImg(null); }}
                            whileTap={{ scale: 0.93 }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                            style={{ background: "var(--error)", color: "#fff", transition: "background 0.15s, box-shadow 0.15s" }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#b91c1c"; el.style.boxShadow = "0 4px 14px rgba(220,38,38,0.40)"; }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--error)"; el.style.boxShadow = "none"; }}>
                            <Trash2 size={13} strokeWidth={2} /> Quitar
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        disabled={subiendoImg}
                        className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer disabled:opacity-50 transition-all"
                        style={{
                          height: 130,
                          borderColor: dragOver ? TAB_COLOR : "var(--gris-borde)",
                          background: dragOver ? `${TAB_COLOR}08` : "var(--blanco)",
                          color: "var(--texto-muted)",
                          transition: "border-color 0.18s, background 0.18s, color 0.18s",
                        }}
                        onMouseEnter={e => { if (!subiendoImg) { const el = e.currentTarget as HTMLElement; el.style.borderColor = TAB_COLOR; el.style.background = `${TAB_COLOR}08`; } }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = dragOver ? TAB_COLOR : "var(--gris-borde)"; el.style.background = dragOver ? `${TAB_COLOR}08` : "var(--blanco)"; }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => {
                          e.preventDefault(); setDragOver(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) onSeleccionarImagen({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                        }}
                      >
                        {subiendoImg ? (
                          <><Loader2 size={22} className="animate-spin" style={{ color: TAB_COLOR }} />
                          <span className="text-sm font-medium">Subiendo imagen…</span></>
                        ) : (
                          <>
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                              style={{ background: "var(--gris-superficie)" }}>
                              <ImagePlus size={20} style={{ color: "var(--texto-secundario)" }} />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold" style={{ color: "var(--texto-secundario)" }}>
                                Arrastra o <span style={{ color: TAB_COLOR }}>selecciona imagen</span>
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--texto-muted)" }}>PNG, JPG o WebP · máx 5 MB</p>
                            </div>
                          </>
                        )}
                      </button>
                    )}
                    {errorImg && <p className="mt-1.5 text-xs" style={{ color: "var(--error)" }}>{errorImg}</p>}
                  </div>

                  {/* Título */}
                  <div>
                    <label style={labelBase}>
                      Título
                      <span className="relative group ml-0.5 inline-block" style={{ color: "#ef4444" }}>
                        *
                        <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                          style={{ background: "#1f2937", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", zIndex: 99 }}>
                          Obligatorio
                        </span>
                      </span>
                    </label>
                    <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                      maxLength={150} required placeholder="Ej: Jornada de Networking EGM"
                      style={inputBase} onFocus={focusOn} onBlur={focusOff} />
                  </div>

                  {/* Descripción */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label style={{ ...labelBase, marginBottom: 0 }}>Descripción</label>
                      <span className="text-[11px] tabular-nums" style={{ color: "var(--texto-muted)" }}>
                        {(descripcion ?? "").length}/500
                      </span>
                    </div>
                    <textarea value={descripcion ?? ""} onChange={e => setDescripcion(e.target.value)}
                      maxLength={500} rows={4} placeholder="Detalles, ponentes, programa…"
                      style={textareaBase}
                      onFocus={focusOn} onBlur={focusOff} />
                  </div>

                </div>
              </div>

              {/* ══ TAB: Detalles ══ */}
              {visitedTabs.current.has("detalles") && (
                <div style={{ display: activeTab === "detalles" ? "block" : "none" }}>
                  <div className="flex flex-col gap-5 px-5 sm:px-6 py-6">

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={labelBase}>
                          Inicio
                          <span className="relative group ml-0.5 inline-block" style={{ color: "#ef4444" }}>
                            *
                            <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                              style={{ background: "#1f2937", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", zIndex: 99 }}>
                              Obligatorio
                            </span>
                          </span>
                        </label>
                        <input type="datetime-local" value={fechaInicio}
                          onChange={e => { setFechaInicio(e.target.value); if (fechaFin && e.target.value > fechaFin) setFechaFin(""); }}
                          min={new Date().toISOString().slice(0, 16)}
                          required
                          style={{ ...inputBase, cursor: "pointer" }} onFocus={focusOn} onBlur={focusOff} />
                      </div>
                      <div>
                        <label style={labelBase}>
                          Fin{" "}
                          <span style={{ color: "var(--texto-muted)", fontWeight: 400 }}>(opcional)</span>
                        </label>
                        <input type="datetime-local" value={fechaFin}
                          onChange={e => setFechaFin(e.target.value)}
                          min={fechaInicio || new Date().toISOString().slice(0, 16)}
                          style={{ ...inputBase, cursor: "pointer" }} onFocus={focusOn} onBlur={focusOff} />
                      </div>
                    </div>

                    {/* Ubicación */}
                    <div>
                      <label style={labelBase}>
                        Ubicación{" "}
                        <span style={{ color: "var(--texto-muted)", fontWeight: 400 }}>(opcional)</span>
                      </label>
                      <div className="flex gap-2">
                        <input type="text" value={lugar ?? ""} onChange={e => onLugarChange(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (debounceRef.current) clearTimeout(debounceRef.current); buscar(); } }}
                          placeholder="Ej: Edificio Central EGM Atalayas, Alicante"
                          style={{ ...inputBase, flex: 1 }} onFocus={focusOn} onBlur={focusOff} />
                        <button type="button" onClick={() => buscar()}
                          disabled={!lugar.trim() || buscandoMapa}
                          className="inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50"
                          style={{
                            background: "var(--gris-superficie)",
                            border: "1px solid var(--gris-borde)",
                            color: "var(--texto-secundario)",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = TAB_COLOR; el.style.color = "#fff"; el.style.borderColor = TAB_COLOR; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "var(--gris-superficie)"; el.style.color = "var(--texto-secundario)"; el.style.borderColor = "var(--gris-borde)"; }}
                        >
                          {buscandoMapa ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} strokeWidth={2} />}
                          Buscar
                        </button>
                      </div>

                      {resultadosMapa.length > 0 && (
                        <ul className="mt-2 overflow-hidden rounded-xl"
                          style={{ border: "1px solid var(--gris-borde)" }}>
                          {resultadosMapa.map((r, i) => (
                            <li key={i} style={{ borderTop: i > 0 ? "1px solid var(--gris-superficie)" : "none" }}>
                              <button type="button" onClick={() => seleccionar(r)}
                                className="w-full text-left px-3 py-2.5 text-xs flex items-start gap-2 cursor-pointer"
                                style={{ transition: "background 0.1s" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${TAB_COLOR}12`; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                                <MapPin size={12} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: TAB_COLOR }} />
                                <span className="line-clamp-2" style={{ color: "var(--texto-primario)" }}>{r.etiqueta}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {erroresMapa && (
                        <p className="mt-1.5 text-xs" style={{ color: "var(--advertencia)" }}>{erroresMapa}</p>
                      )}

                      {latitud !== null && longitud !== null && (
                        <div className="mt-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold inline-flex items-center gap-1"
                              style={{ color: "var(--exito)" }}>
                              <Check size={12} strokeWidth={2.5} /> Ubicación seleccionada
                            </span>
                            <button type="button" onClick={limpiarUbicacion}
                              className="text-xs font-semibold cursor-pointer"
                              style={{ color: "var(--error)" }}>
                              Quitar
                            </button>
                          </div>
                          <div className="rounded-xl overflow-hidden"
                            style={{ border: "1px solid var(--gris-borde)" }}>
                            <MapaUbicacion latitud={latitud} longitud={longitud}
                              etiqueta={lugar ?? undefined} alturaPx={180} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Global toggle — solo superadmin */}
                    {esSuperAdmin && (
                      <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl"
                        style={{ background: "var(--gris-panel)", border: "1px solid var(--gris-borde)" }}>
                        <input type="checkbox" checked={esGlobal}
                          onChange={e => setEsGlobal(e.target.checked)}
                          className="w-4 h-4 shrink-0 cursor-pointer"
                          style={{ accentColor: TAB_COLOR }} />
                        <Globe2 size={15} strokeWidth={2} style={{ color: TAB_COLOR, flexShrink: 0 }} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold" style={{ color: "var(--texto-primario)" }}>
                            Evento global EGM
                          </span>
                          <span className="text-xs" style={{ color: "var(--texto-muted)" }}>
                            Visible para todas las empresas
                          </span>
                        </div>
                      </label>
                    )}

                  </div>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 shrink-0"
              style={{
                borderTop: "1px solid rgba(0,0,0,0.07)",
                background: "var(--blanco)",
                paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
              }}>
              <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={enviando}>
                Cancelar
              </Button>
              <div className="flex items-center gap-2">
                {error && (
                  <p className="text-xs font-semibold truncate max-w-[140px]"
                    style={{ color: "var(--error)" }}>
                    {error}
                  </p>
                )}
                {activeTab === "informacion" ? (
                  <Button type="button" variant="primary" size="md" onClick={() => goTab("detalles")}>
                    Detalles →
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" size="md" disabled={enviando}>
                    {enviando
                      ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
                      : esNuevo ? "Crear evento" : "Guardar cambios"
                    }
                  </Button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
