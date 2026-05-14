"use client";

// ============================================================
// MisDocumentos — sección del perfil del empleado con sus
// documentos asignados (nóminas, certificados, etc.).
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { listarMisDocumentos, marcarDocumentoVisto } from "@/lib/api/documentos";
import {
  type Documento, type TipoDocumento,
  TIPO_DOCUMENTO_LABEL, TIPO_DOCUMENTO_COLOR,
} from "@/lib/types/documentos";
import { FileText, Download, Eye, Check, ClipboardSignature, PenLine } from "lucide-react";
import { ModalFirma } from "./ModalFirma";

type Filtro = "todos" | "pendientes" | "firmados" | TipoDocumento;

export function MisDocumentos() {
  const [documentos, setDocumentos]         = useState<Documento[]>([]);
  const [cargando, setCargando]             = useState(true);
  const [filtro, setFiltro]                 = useState<Filtro>("todos");
  const [documentoAFirmar, setDocumentoAFirmar] = useState<Documento | null>(null);

  useEffect(() => {
    listarMisDocumentos()
      .then(setDocumentos)
      .catch(() => setDocumentos([]))
      .finally(() => setCargando(false));
  }, []);

  const verDocumento = async (d: Documento) => {
    if (!d.visto) {
      marcarDocumentoVisto(d.documentoId).catch(() => null);
      setDocumentos((prev) => prev.map((x) =>
        x.documentoId === d.documentoId ? { ...x, visto: true, fechaVisto: new Date().toISOString() } : x
      ));
    }
    // Si está firmado y tiene URL del PDF firmado, abrirlo en lugar del original
    const urlAAbrir = d.firmado && d.firmaUrl ? d.firmaUrl : d.archivoUrl;
    window.open(urlAAbrir, "_blank", "noopener,noreferrer");
  };

  const onFirmado = (documentoId: string, firmaUrl: string) => {
    setDocumentos((prev) => prev.map((x) =>
      x.documentoId === documentoId
        ? { ...x, firmado: true, fechaFirma: new Date().toISOString(), firmaUrl }
        : x
    ));
    setDocumentoAFirmar(null);
  };

  const filtrados = useMemo(() => {
    switch (filtro) {
      case "todos":      return documentos;
      case "pendientes": return documentos.filter((d) => !d.visto || (d.requiereFirma && !d.firmado));
      case "firmados":   return documentos.filter((d) => d.firmado);
      default:           return documentos.filter((d) => d.tipo === filtro);
    }
  }, [documentos, filtro]);

  const contadorPendientes = documentos.filter((d) => !d.visto || (d.requiereFirma && !d.firmado)).length;

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" />
              Mis documentos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Documentos asignados por tu empresa (nóminas, certificados, contratos...)
            </p>
          </div>
          {contadorPendientes > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
              {contadorPendientes} pendiente{contadorPendientes !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["todos", "pendientes", "firmados", "NOMINA", "CONTRATO", "CERTIFICADO", "POLITICA", "OTRO"] as Filtro[]).map((f) => {
            const label = f === "todos" ? "Todos"
              : f === "pendientes" ? "Pendientes"
              : f === "firmados"   ? "Firmados"
              : TIPO_DOCUMENTO_LABEL[f as TipoDocumento];
            const active = filtro === f;
            return (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={{
                  background: active ? "var(--azul-egm)" : "var(--gris-superficie)",
                  color:      active ? "white" : "var(--texto-primario)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {filtro === "todos" ? "Aún no tienes documentos asignados" : "No hay documentos con este filtro"}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtrados.map((d) => {
              const color = TIPO_DOCUMENTO_COLOR[d.tipo];
              return (
                <li key={d.documentoId} className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: color.bg, color: color.text }}>
                          {TIPO_DOCUMENTO_LABEL[d.tipo]}
                        </span>
                        {!d.visto && (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700">
                            Nuevo
                          </span>
                        )}
                        {d.requiereFirma && !d.firmado && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700">
                            <ClipboardSignature className="w-3 h-3" />
                            Pendiente firma
                          </span>
                        )}
                        {d.firmado && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                            <Check className="w-3 h-3" />
                            Firmado
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800 truncate">{d.titulo}</p>
                      {d.descripcion && !d.descripcion.startsWith("cert:") && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{d.descripcion}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        Asignado el {new Date(d.fechaSubida).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      {d.firmado && d.fechaFirma && (
                        <p className="text-[11px] text-emerald-600 mt-0.5">
                          Firmado el {new Date(d.fechaFirma).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => verDocumento(d)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: "var(--azul-egm)", color: "white" }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>

                      {/* Botón firmar: solo si requiere firma y no está firmado */}
                      {d.requiereFirma && !d.firmado && (
                        <button
                          onClick={() => setDocumentoAFirmar(d)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors bg-amber-500 text-white hover:bg-amber-600"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                          Firmar
                        </button>
                      )}

                      <a
                        href={d.firmado && d.firmaUrl ? d.firmaUrl : d.archivoUrl}
                        download={d.archivoNombre}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Modal firma */}
      {documentoAFirmar && (
        <ModalFirma
          documento={documentoAFirmar}
          onClose={() => setDocumentoAFirmar(null)}
          onFirmado={(firmaUrl) => onFirmado(documentoAFirmar.documentoId, firmaUrl)}
        />
      )}
    </>
  );
}
