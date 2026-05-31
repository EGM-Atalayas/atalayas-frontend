"use client";

// ============================================================
// AnunciosAdminTab — tab del panel admin para gestionar anuncios.
// Lista, crea, edita, publica y desactiva anuncios de empresa.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Megaphone, Plus, Search, X } from "lucide-react";
import {
  getNoticias,
  crearNoticia,
  editarNoticia,
  desactivarNoticia,
} from "@/lib/api/noticias";
import { QK } from "@/lib/queryKeys";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import FormAnuncio from "@/components/ui/FormAnuncio";
import { AnuncioCard } from "@/components/ui/AnuncioCard";
import { ModalConfirm } from "@/components/ui/ModalConfirm";
import { EMPTY_ANUNCIO } from "@/lib/constants/admin";

const TAB_COLOR = "#0284C7";

interface Props {
  empresaId?: string | null;
  onToast: (msg: string, tipo?: "ok" | "error") => void;
}

export function AnunciosAdminTab({ empresaId, onToast }: Props) {
  const queryClient = useQueryClient();

  const { data: noticias = [], isLoading: cargandoNoticias } = useQuery({
    queryKey: QK.noticias(empresaId),
    queryFn: () => getNoticias(empresaId!),
    enabled: !!empresaId,
  });

  const [showFormAnuncio, setShowFormAnuncio] = useState(false);
  const [editando, setEditando] = useState<Noticia | null>(null);
  const [initialForm, setInitialForm] = useState<NoticiaInput>(EMPTY_ANUNCIO);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [anuncioSearch, setAnuncioSearch] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "publicados" | "borradores">("todos");
  const [publicandoId, setPublicandoId] = useState<string | null>(null);
  const [confirmAnuncio, setConfirmAnuncio] = useState<{
    tipo: "desactivar" | "eliminar";
    id: string;
  } | null>(null);

  function abrirCrear() {
    setInitialForm({
      titulo: "",
      contenido: "",
      esGlobal: false,
      empresaId: empresaId ?? null,
      imagenUrl: null,
      enlaceUrl: null,
      enlaceTexto: null,
      videoUrl: null,
      adjuntoUrl: null,
      adjuntoNombre: null,
      estado: "publicado",
      fijado: false,
      categoria: null,
    });
    setEditando(null);
    setShowFormAnuncio(true);
    setFormError(null);
  }

  function abrirEditar(n: Noticia) {
    setInitialForm({
      titulo: n.titulo,
      contenido: n.contenido,
      esGlobal: n.esGlobal,
      empresaId: n.empresaId,
      imagenUrl: n.imagenUrl ?? null,
      enlaceUrl: n.enlaceUrl ?? null,
      enlaceTexto: n.enlaceTexto ?? null,
      videoUrl: n.videoUrl ?? null,
      adjuntoUrl: n.adjuntoUrl ?? null,
      adjuntoNombre: n.adjuntoNombre ?? null,
      estado: n.estado ?? "publicado",
      fijado: n.fijado ?? false,
      categoria: n.categoria ?? null,
    });
    setEditando(n);
    setShowFormAnuncio(true);
    setFormError(null);
  }

  function cerrarForm() {
    setShowFormAnuncio(false);
    setEditando(null);
    setInitialForm(EMPTY_ANUNCIO);
    setFormError(null);
  }

  async function handleSubmitAnuncio(data: NoticiaInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editando) await editarNoticia(editando.anuncioId, data);
      else await crearNoticia({ ...data, empresaId: empresaId ?? null });
      queryClient.invalidateQueries({ queryKey: QK.noticias(empresaId) });
      cerrarForm();
      onToast(
        editando
          ? "Anuncio actualizado correctamente"
          : data.estado === "borrador"
          ? "Borrador guardado"
          : "Anuncio publicado correctamente"
      );
    } catch {
      setFormError("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEliminarBorrador(id: string) {
    setConfirmAnuncio({ tipo: "eliminar", id });
  }

  function handleDesactivarAnuncio(id: string) {
    setConfirmAnuncio({ tipo: "desactivar", id });
  }

  async function ejecutarConfirmAnuncio() {
    if (!confirmAnuncio) return;
    const { tipo, id } = confirmAnuncio;
    setConfirmAnuncio(null);
    try {
      await desactivarNoticia(id);
      queryClient.invalidateQueries({ queryKey: QK.noticias(empresaId) });
      onToast(tipo === "eliminar" ? "Borrador eliminado" : "Anuncio desactivado");
    } catch {
      onToast(
        tipo === "eliminar"
          ? "Error al eliminar el borrador"
          : "Error al desactivar el anuncio",
        "error"
      );
    }
  }

  async function publicarBorrador(n: Noticia) {
    setPublicandoId(n.anuncioId);
    try {
      await editarNoticia(n.anuncioId, {
        titulo: n.titulo,
        contenido: n.contenido,
        esGlobal: n.esGlobal,
        empresaId: n.empresaId,
        imagenUrl: n.imagenUrl ?? null,
        enlaceUrl: n.enlaceUrl ?? null,
        enlaceTexto: n.enlaceTexto ?? null,
        videoUrl: n.videoUrl ?? null,
        adjuntoUrl: n.adjuntoUrl ?? null,
        adjuntoNombre: n.adjuntoNombre ?? null,
        fijado: n.fijado ?? false,
        categoria: n.categoria ?? null,
        estado: "publicado",
      });
      queryClient.invalidateQueries({ queryKey: QK.noticias(empresaId) });
      onToast("Anuncio publicado correctamente");
    } catch {
      onToast("Error al publicar el anuncio", "error");
    } finally {
      setPublicandoId(null);
    }
  }

  const publicados_count = noticias.filter(
    (n) => n.activo && (n.estado ?? "publicado") === "publicado"
  ).length;
  const borradores_count = noticias.filter(
    (n) => n.activo && n.estado === "borrador"
  ).length;

  const q = anuncioSearch.toLowerCase().trim();
  const todas = noticias.filter((n) => n.activo);
  const borradores = todas.filter(
    (n) =>
      n.estado === "borrador" &&
      filtro !== "publicados" &&
      (!q || n.titulo?.toLowerCase().includes(q) || n.contenido?.toLowerCase().includes(q))
  );
  const publicados = todas
    .filter(
      (n) =>
        (n.estado ?? "publicado") === "publicado" &&
        filtro !== "borradores" &&
        (!q || n.titulo?.toLowerCase().includes(q) || n.contenido?.toLowerCase().includes(q))
    )
    .sort((a, b) => (b.fijado ? 1 : 0) - (a.fijado ? 1 : 0));

  const hayNoticias = todas.length > 0;
  const hayFiltrosActivos = q.length > 0 || filtro !== "todos";
  const totalFiltrados = borradores.length + publicados.length;
  const limpiarFiltros = () => { setAnuncioSearch(""); setFiltro("todos"); };

  return (
    <>
      {/* ── Título ── */}
      <div className="mb-8 text-center sm:text-left">
        <h1 style={{
          fontFamily: "var(--font-raleway), sans-serif",
          fontWeight: 800,
          fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)",
          color: "var(--texto-primario)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          Anuncios
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {cargandoNoticias ? (
            "Cargando anuncios…"
          ) : publicados_count === 0 && borradores_count === 0 ? (
            "Crea anuncios para que los vean tus empleados"
          ) : (
            <>
              {publicados_count} publicado{publicados_count !== 1 ? "s" : ""}
              {borradores_count > 0 && (
                <span style={{ color: "var(--advertencia)", fontWeight: 600 }}>
                  {" "}· {borradores_count} borrador{borradores_count !== 1 ? "es" : ""}
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-6">

        {/* Desktop: una sola fila — buscador · pills · limpiar · botón */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="relative" style={{ width: 260 }}>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar anuncio…"
              value={anuncioSearch}
              onChange={(e) => setAnuncioSearch(e.target.value)}
              className="w-full pl-10 py-2.5 text-base rounded-2xl outline-none transition-colors"
              style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", paddingRight: anuncioSearch ? "2.2rem" : "14px" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = TAB_COLOR)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
            />
            {anuncioSearch && (
              <button type="button" onClick={() => setAnuncioSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--texto-muted)", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Pills */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--gris-superficie)", border: "1px solid var(--gris-borde)" }}>
            {(["todos", "publicados", "borradores"] as const).map((id) => {
              const label = id === "todos" ? "Todos" : id === "publicados" ? "Publicados" : "Borradores";
              const active = filtro === id;
              return (
                <motion.button key={id} type="button"
                  onClick={() => setFiltro(id)}
                  className="relative text-xs font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer whitespace-nowrap"
                  style={{ color: active ? (id === "todos" ? "#fff" : TAB_COLOR) : "var(--texto-muted)", background: "transparent", border: "none", transition: "color 0.15s ease", zIndex: 1 }}
                  whileTap={{ scale: 0.94 }}
                >
                  {active && (
                    <motion.span layoutId="anuncios-filtro-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: id === "todos" ? TAB_COLOR : `${TAB_COLOR}18`, border: id === "todos" ? "none" : `1px solid ${TAB_COLOR}40`, zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  {label}
                </motion.button>
              );
            })}
          </div>

          {/* Botón limpiar */}
          <AnimatePresence>
            {hayFiltrosActivos && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <IconButton variant="surface" size="sm" label="Limpiar filtros" onClick={limpiarFiltros}>
                  <X size={14} strokeWidth={2.5} />
                </IconButton>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1" />
          <Button variant="primary" size="md" onClick={abrirCrear}>
            <Plus size={16} strokeWidth={2.5} /> Nuevo anuncio
          </Button>
        </div>

        {/* Móvil: dos filas — fila 1: buscador + botón · fila 2: dropdown + limpiar */}
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--texto-muted)" }}>
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Buscar anuncio…"
                value={anuncioSearch}
                onChange={(e) => setAnuncioSearch(e.target.value)}
                className="w-full pl-10 py-2.5 text-base rounded-2xl outline-none transition-colors"
                style={{ background: "var(--blanco)", border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", paddingRight: anuncioSearch ? "2.2rem" : "14px" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = TAB_COLOR)}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
              />
              {anuncioSearch && (
                <button type="button" onClick={() => setAnuncioSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--texto-muted)", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                  <X size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
            <Button variant="primary" size="md" onClick={abrirCrear}>
              <Plus size={16} strokeWidth={2.5} /> Añadir
            </Button>
          </div>
          <AnuncioSelect
            value={filtro === "todos" ? "" : filtro}
            onChange={(v) => setFiltro((v as "publicados" | "borradores") || "todos")}
            options={[
              { id: "publicados", label: "Publicados" },
              { id: "borradores", label: "Borradores" },
            ]}
            placeholder="Todos los estados"
            accentColor={TAB_COLOR}
          />
        </div>
      </div>

      {/* ── Formulario (overlay fijo) ── */}
      {showFormAnuncio && (
        <FormAnuncio
          initialValues={initialForm}
          editando={editando}
          submitting={submitting}
          formError={formError}
          onClose={cerrarForm}
          onSubmit={handleSubmitAnuncio}
          onPreview={() => {}}
        />
      )}

      {/* ── Contenido ── */}
      {!hayNoticias ? (
        /* Empty state */
        <div
          className="flex flex-col items-center justify-center py-14 sm:py-24 px-6 rounded-2xl text-center"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: `${TAB_COLOR}12` }}>
            <Megaphone size={28} style={{ color: TAB_COLOR, opacity: 0.7 }} strokeWidth={1.5} />
          </div>
          <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>
            Todavía no hay anuncios
          </p>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>
            Crea el primer anuncio para que lo vean tus empleados
          </p>
          <button
            onClick={abrirCrear}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
            style={{ background: `${TAB_COLOR}12`, color: TAB_COLOR, border: `1.5px solid ${TAB_COLOR}30` }}
          >
            <Plus size={13} strokeWidth={2.5} /> Nuevo anuncio
          </button>
        </div>
      ) : hayFiltrosActivos && totalFiltrados === 0 ? (
        /* Sin resultados */
        <div
          className="flex flex-col items-center justify-center py-14 sm:py-20 px-6 text-center rounded-2xl"
          style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: `${TAB_COLOR}12` }}>
            <Search size={28} strokeWidth={1.5} style={{ color: TAB_COLOR, opacity: 0.7 }} />
          </div>
          <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>
            Sin resultados
          </p>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>
            {q
              ? <>No hay anuncios que coincidan con{" "}<span className="font-semibold" style={{ color: "var(--texto-primario)" }}>&quot;{anuncioSearch}&quot;</span></>
              : filtro === "borradores"
                ? "No tienes borradores guardados"
                : "No tienes anuncios publicados"}
          </p>
          <motion.button
            onClick={limpiarFiltros}
            whileTap={{ scale: 0.95 }}
            className="text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
            style={{ background: `${TAB_COLOR}12`, color: TAB_COLOR, border: `1.5px solid ${TAB_COLOR}30` }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${TAB_COLOR}22`; el.style.borderColor = `${TAB_COLOR}50`; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${TAB_COLOR}12`; el.style.borderColor = `${TAB_COLOR}30`; }}
          >
            {q ? "Limpiar búsqueda" : "Ver todos"}
          </motion.button>
        </div>
      ) : (
        <>
          {/* ── Borradores ── */}
          {borradores.length > 0 && (
            <div className="mb-8">
              {filtro === "todos" && (
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#92400e" }}>
                    Borradores
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#fde68a", color: "#78350f" }}>
                    {borradores.length}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "#fcd34d" }} />
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={"borradores-" + q}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.18, ease: "easeOut" } }}
                  exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
                >
                  {borradores.map((n, idx) => (
                    <motion.div key={n.anuncioId}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1], delay: idx * 0.04 }}
                    >
                      <AnuncioCard
                        n={n}
                        esBorrador={true}
                        publicandoId={publicandoId}
                        abrirEditar={abrirEditar}
                        publicarBorrador={publicarBorrador}
                        handleEliminarBorrador={handleEliminarBorrador}
                        handleDesactivarAnuncio={handleDesactivarAnuncio}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ── Publicados ── */}
          {filtro !== "borradores" && (publicados.length === 0 ? (
            <div
              className="rounded-2xl flex flex-col items-center justify-center py-14 sm:py-20 px-6 text-center"
              style={{ background: "var(--blanco)", border: "1px solid var(--gris-borde)" }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: `${TAB_COLOR}12` }}>
                <Megaphone size={28} style={{ color: TAB_COLOR, opacity: 0.7 }} strokeWidth={1.5} />
              </div>
              <p className="text-lg font-bold mb-1.5" style={{ color: "var(--texto-primario)" }}>
                No hay anuncios publicados
              </p>
              <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}>
                Publica uno de tus borradores o crea un anuncio nuevo
              </p>
              <button
                onClick={abrirCrear}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                style={{ background: `${TAB_COLOR}12`, color: TAB_COLOR, border: `1.5px solid ${TAB_COLOR}30` }}
              >
                <Plus size={13} strokeWidth={2.5} /> Nuevo anuncio
              </button>
            </div>
          ) : (
            <div>
              {filtro === "todos" && borradores.length > 0 && (
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                    Publicados
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)" }}>
                    {publicados.length}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--gris-borde)" }} />
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={"publicados-" + q}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.18, ease: "easeOut" } }}
                  exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
                >
                  {publicados.map((n, idx) => (
                    <motion.div key={n.anuncioId}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1], delay: idx * 0.04 }}
                    >
                      <AnuncioCard
                        n={n}
                        esBorrador={false}
                        publicandoId={publicandoId}
                        abrirEditar={abrirEditar}
                        publicarBorrador={publicarBorrador}
                        handleEliminarBorrador={handleEliminarBorrador}
                        handleDesactivarAnuncio={handleDesactivarAnuncio}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          ))}
        </>
      )}

      {/* ── Modal confirmación ── */}
      <ModalConfirm
        abierto={!!confirmAnuncio}
        titulo={confirmAnuncio?.tipo === "eliminar" ? "¿Eliminar borrador?" : "¿Desactivar anuncio?"}
        descripcion={
          confirmAnuncio?.tipo === "eliminar"
            ? "Se borrará permanentemente. Esta acción no se puede deshacer."
            : "El anuncio dejará de ser visible para los empleados. Esta acción no se puede deshacer."
        }
        textoConfirmar={confirmAnuncio?.tipo === "eliminar" ? "Eliminar borrador" : "Desactivar anuncio"}
        variante="danger"
        onConfirmar={ejecutarConfirmAnuncio}
        onCancelar={() => setConfirmAnuncio(null)}
      />
    </>
  );
}

// ─── AnuncioSelect — dropdown estilizado (mismo patrón que DocSelect) ─────────
function AnuncioSelect({ value, onChange, options, placeholder, accentColor }: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isActive = value !== "";
  const selected = options.find(o => o.id === value);

  function calcPos() {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + window.scrollY + 6, left: r.left, width: r.width });
  }

  useEffect(() => {
    if (!open) return;
    function onClickOut(e: MouseEvent) {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex-1">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { calcPos(); setOpen(p => !p); }}
        className="w-full flex items-center gap-2 rounded-2xl pl-3 pr-2.5 h-10 text-sm font-semibold cursor-pointer focus:outline-none"
        style={{
          background: "var(--blanco)",
          border: `1.5px solid ${isActive || open ? accentColor : "var(--gris-borde)"}`,
          color: isActive ? accentColor : "var(--texto-primario)",
          transition: "border-color 0.15s, color 0.15s",
        }}
      >
        <span className="flex-1 text-left truncate">{selected?.label ?? placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}
          style={{ display: "flex", flexShrink: 0, color: isActive ? accentColor : "var(--texto-muted)" }}>
          <ChevronDown size={13} strokeWidth={2.5} />
        </motion.span>
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: pos.top,
                left: Math.min(pos.left, window.innerWidth - Math.max(pos.width, 180) - 12),
                width: Math.max(pos.width, 180),
                zIndex: 9999,
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.10)",
                borderRadius: "16px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                overflow: "hidden",
              }}
            >
              {[{ id: "", label: placeholder }, ...options].map((opt, idx, arr) => {
                const isSel = value === opt.id;
                return (
                  <button key={opt.id} type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-sm font-semibold cursor-pointer"
                    style={{
                      background: isSel ? `${accentColor}12` : "transparent",
                      color: isSel ? accentColor : "var(--texto-primario)",
                      borderBottom: idx < arr.length - 1 ? "1px solid var(--gris-borde)" : "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--gris-pagina)"; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = isSel ? `${accentColor}12` : "transparent"; }}
                  >
                    <span>{opt.label}</span>
                    {isSel && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
