"use client";

// ============================================================
// AnunciosAdminTab — tab del panel admin para gestionar anuncios.
// Lista, crea, edita, publica y desactiva anuncios de empresa.
// ============================================================

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Search } from "lucide-react";
import {
  getNoticias,
  crearNoticia,
  editarNoticia,
  desactivarNoticia,
} from "@/lib/api/noticias";
import { QK } from "@/lib/queryKeys";
import type { Noticia, NoticiaInput } from "@/lib/types/noticias";
import { Button } from "@/components/ui/Button";
import FormAnuncio from "@/components/ui/FormAnuncio";
import { AnuncioCard } from "@/components/ui/AnuncioCard";
import { ModalConfirm } from "@/components/ui/ModalConfirm";
import { EMPTY_ANUNCIO } from "@/lib/constants/admin";

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

  return (
    <>
      {/* Título */}
      <div className="mb-8 text-center sm:text-left">
        <h1
          style={{
            fontFamily: "var(--font-raleway), sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)",
            color: "var(--texto-primario)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Gestión de anuncios
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
          {cargandoNoticias ? (
            "Cargando anuncios…"
          ) : publicados_count === 0 && borradores_count === 0 ? (
            "Sin anuncios publicados"
          ) : (
            <>
              {publicados_count} publicado{publicados_count !== 1 ? "s" : ""}
              {borradores_count > 0 && (
                <span style={{ color: "var(--advertencia)", fontWeight: 600 }}>
                  {" "}· {borradores_count} borrador
                  {borradores_count !== 1 ? "es" : ""}
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-row items-center gap-2 sm:gap-3 mb-6">
        <div className="relative flex-1 sm:w-64 sm:flex-none shrink-0">
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--texto-muted)" }}
          >
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Buscar anuncio…"
            value={anuncioSearch}
            onChange={(e) => setAnuncioSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-colors"
            style={{
              background: "var(--blanco)",
              border: "1.5px solid var(--gris-borde)",
              color: "var(--texto-primario)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0EA5E9")}
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--gris-borde)")
            }
          />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="primary" size="md" onClick={abrirCrear}>
            <Plus size={14} />
            <span className="hidden sm:inline">Nuevo anuncio</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {showFormAnuncio && (
        <div className="mb-8">
          <FormAnuncio
            initialValues={initialForm}
            editando={editando}
            submitting={submitting}
            formError={formError}
            onClose={cerrarForm}
            onSubmit={handleSubmitAnuncio}
            onPreview={() => {}}
          />
        </div>
      )}

      {/* Panel anuncios */}
      {(() => {
        const q = anuncioSearch.toLowerCase().trim();
        const todas = noticias.filter((n) => n.activo);
        const borradores = todas.filter(
          (n) =>
            n.estado === "borrador" &&
            (!q ||
              n.titulo?.toLowerCase().includes(q) ||
              n.contenido?.toLowerCase().includes(q))
        );
        const publicados = todas
          .filter(
            (n) =>
              (n.estado ?? "publicado") === "publicado" &&
              (!q ||
                n.titulo?.toLowerCase().includes(q) ||
                n.contenido?.toLowerCase().includes(q))
          )
          .sort((a, b) => (b.fijado ? 1 : 0) - (a.fijado ? 1 : 0));
        const hayNoticias = todas.length > 0;

        if (!hayNoticias)
          return (
            <div
              className="flex flex-col items-center justify-center py-14 sm:py-24 px-6 rounded-2xl text-center"
              style={{
                background: "var(--blanco)",
                border: "1px solid var(--gris-borde)",
              }}
            >
              <div
                className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                style={{ background: "var(--azul-accion-light)" }}
              >
                <Megaphone
                  size={30}
                  style={{ color: "var(--azul-accion)" }}
                  strokeWidth={1.5}
                />
              </div>
              <p
                className="text-lg font-bold mb-1.5"
                style={{ color: "var(--texto-primario)" }}
              >
                Todavía no hay anuncios
              </p>
              <p
                className="text-sm mb-6 max-w-xs"
                style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}
              >
                Crea el primer anuncio para que lo vean tus empleados
              </p>
              <Button variant="primary" size="md" onClick={abrirCrear}>
                <Plus size={14} /> Nuevo anuncio
              </Button>
            </div>
          );

        if (q && borradores.length === 0 && publicados.length === 0)
          return (
            <div
              className="flex flex-col items-center justify-center py-14 sm:py-20 px-6 text-center rounded-2xl"
              style={{
                background: "var(--blanco)",
                border: "1px solid var(--gris-borde)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(27,63,126,0.08)" }}
              >
                <Search
                  size={28}
                  strokeWidth={1.5}
                  style={{ color: "var(--azul-egm)", opacity: 0.7 }}
                />
              </div>
              <p
                className="text-lg font-bold mb-1.5"
                style={{ color: "var(--texto-primario)" }}
              >
                Sin resultados
              </p>
              <p
                className="text-sm mb-6 max-w-xs"
                style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}
              >
                No hay anuncios que coincidan con{" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--texto-primario)" }}
                >
                  &quot;{anuncioSearch}&quot;
                </span>
              </p>
              <button
                onClick={() => setAnuncioSearch("")}
                className="text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                style={{
                  background: "rgba(27,63,126,0.08)",
                  color: "var(--azul-egm)",
                  border: "1.5px solid rgba(27,63,126,0.20)",
                }}
              >
                Limpiar búsqueda
              </button>
            </div>
          );

        return (
          <>
            {/* Borradores */}
            {borradores.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "#92400e" }}
                  >
                    Borradores
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "#fde68a", color: "#78350f" }}
                  >
                    {borradores.length}
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: "#fcd34d" }}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {borradores.map((n) => (
                    <AnuncioCard
                      key={n.anuncioId}
                      n={n}
                      esBorrador={true}
                      publicandoId={publicandoId}
                      abrirEditar={abrirEditar}
                      publicarBorrador={publicarBorrador}
                      handleEliminarBorrador={handleEliminarBorrador}
                      handleDesactivarAnuncio={handleDesactivarAnuncio}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Publicados */}
            {publicados.length === 0 ? (
              <div
                className="rounded-2xl flex flex-col items-center justify-center py-14 sm:py-24 px-6 text-center"
                style={{
                  background: "var(--blanco)",
                  border: "1px solid var(--gris-borde)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "var(--azul-accion-light)" }}
                >
                  <Megaphone
                    size={30}
                    style={{ color: "var(--azul-accion)" }}
                    strokeWidth={1.5}
                  />
                </div>
                <p
                  className="text-lg font-bold mb-1.5"
                  style={{ color: "var(--texto-primario)" }}
                >
                  No hay anuncios publicados
                </p>
                <p
                  className="text-sm mb-6 max-w-xs"
                  style={{ color: "var(--texto-muted)", lineHeight: 1.6 }}
                >
                  Publica uno de tus borradores o crea un anuncio nuevo
                </p>
                <Button variant="primary" size="md" onClick={abrirCrear}>
                  <Plus size={14} /> Nuevo anuncio
                </Button>
              </div>
            ) : (
              <div>
                {borradores.length > 0 && (
                  <div className="flex items-center gap-2.5 mb-4">
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--texto-muted)" }}
                    >
                      Publicados
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: "var(--gris-superficie)",
                        color: "var(--texto-muted)",
                      }}
                    >
                      {publicados.length}
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: "var(--gris-borde)" }}
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {publicados.map((n) => (
                    <AnuncioCard
                      key={n.anuncioId}
                      n={n}
                      esBorrador={false}
                      publicandoId={publicandoId}
                      abrirEditar={abrirEditar}
                      publicarBorrador={publicarBorrador}
                      handleEliminarBorrador={handleEliminarBorrador}
                      handleDesactivarAnuncio={handleDesactivarAnuncio}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Modal confirmación anuncio */}
      <ModalConfirm
        abierto={!!confirmAnuncio}
        titulo={
          confirmAnuncio?.tipo === "eliminar"
            ? "¿Eliminar borrador?"
            : "¿Desactivar anuncio?"
        }
        descripcion={
          confirmAnuncio?.tipo === "eliminar"
            ? "Se borrará permanentemente. Esta acción no se puede deshacer."
            : "El anuncio dejará de ser visible para los empleados. Esta acción no se puede deshacer."
        }
        textoConfirmar={
          confirmAnuncio?.tipo === "eliminar"
            ? "Eliminar borrador"
            : "Desactivar anuncio"
        }
        variante="danger"
        onConfirmar={ejecutarConfirmAnuncio}
        onCancelar={() => setConfirmAnuncio(null)}
      />
    </>
  );
}
