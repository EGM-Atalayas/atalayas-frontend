"use client";

// ============================================================
// ModalFirma — canvas de firma manuscrita para documentos que
// requieren firma del empleado.
//
// El usuario dibuja su firma, se exporta como PNG base64 y
// se envía al backend, que la estampa sobre el PDF original
// y devuelve la URL del nuevo PDF firmado.
// ============================================================

import { useRef, useEffect, useState, useCallback } from "react";
import { X, RotateCcw, PenLine, Check, Loader2 } from "lucide-react";
import { firmarDocumento } from "@/lib/api/documentos";
import type { Documento } from "@/lib/types/documentos";

interface ModalFirmaProps {
  documento: Documento;
  onClose: () => void;
  onFirmado: (firmaUrl: string) => void;
}

export function ModalFirma({ documento, onClose, onFirmado }: ModalFirmaProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const isDrawing   = useRef(false);
  const lastPos     = useRef<{ x: number; y: number } | null>(null);

  const [hasTrazos, setHasTrazos]   = useState(false);
  const [enviando, setEnviando]     = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ── Inicializar canvas ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e3a8a";  // azul oscuro
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
  }, []);

  // ── Helpers de posición (mouse + touch) ──────────────────────────
  const getPos = (
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const t = e.touches[0];
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: ((e as MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as MouseEvent).clientY - rect.top)  * scaleY,
    };
  };

  // ── Dibujo ────────────────────────────────────────────────────────
  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current   = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPos.current) return;

    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasTrazos(true);
  }, []);

  const endDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current   = null;
  }, []);

  // ── Limpiar ───────────────────────────────────────────────────────
  const limpiar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasTrazos(false);
    setError(null);
  };

  // ── Enviar firma ──────────────────────────────────────────────────
  const confirmar = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasTrazos) return;

    setEnviando(true);
    setError(null);

    try {
      const firmaBase64 = canvas.toDataURL("image/png");
      const { firmaUrl } = await firmarDocumento(documento.documentoId, firmaBase64);
      onFirmado(firmaUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al firmar el documento");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-blue-700" />
            <div>
              <h2 className="text-base font-bold text-slate-800">Firma del documento</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">{documento.titulo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Instrucciones */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-sm text-slate-600">
            Dibuja tu firma en el recuadro de abajo. Puedes usar el ratón o la pantalla táctil.
          </p>
        </div>

        {/* Canvas */}
        <div className="px-6 pb-2">
          <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-white"
               style={{ touchAction: "none" }}>
            <canvas
              ref={canvasRef}
              width={560}
              height={200}
              className="w-full cursor-crosshair"
              style={{ display: "block" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            {!hasTrazos && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-300 text-sm font-medium select-none">Dibuja aquí tu firma</p>
              </div>
            )}
            {/* Línea de firma */}
            <div className="absolute bottom-8 left-8 right-8 border-b border-slate-200 pointer-events-none" />
            <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-slate-300 pointer-events-none select-none">
              Firma del empleado
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Aviso legal */}
        <div className="mx-6 mt-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800">
            Al confirmar, aceptas que esta firma digital tiene validez como conformidad con el contenido del documento.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 px-6 py-4">
          <button
            onClick={limpiar}
            disabled={!hasTrazos || enviando}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </button>
          <button
            onClick={confirmar}
            disabled={!hasTrazos || enviando}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ background: "var(--azul-egm)", color: "white" }}
          >
            {enviando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Firmando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar firma
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
