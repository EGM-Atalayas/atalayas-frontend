"use client";

// ============================================================
// DocumentosAdminTab — listado y subida de documentos para admin
// Se renderiza dentro del tab "Documentos" del panel de administración.
// ============================================================

import { useEffect, useState } from "react";
import {
  listarDocumentosEmpresa, subirDocumento, desactivarDocumento, listarAsignaciones,
} from "@/lib/api/documentos";
import {
  type Documento, type AsignacionDetalle, type TipoDocumento, type SubirDocumentoInput,
  TIPO_DOCUMENTO_LABEL, TIPO_DOCUMENTO_COLOR,
} from "@/lib/types/documentos";
import { FileText, Upload, Trash2, Eye, Check, X, AlertTriangle, Users, Building2 } from "lucide-react";

interface Props {
  empresaId: string;
  empleados: Array<{ usuarioId: string; nombre: string; apellidos: string; departamento: string | null }>;
  departamentos: Array<{ id: string; label: string }>;
}

const TIPOS: TipoDocumento[] = ["NOMINA", "CONTRATO", "CERTIFICADO", "POLITICA", "OTRO"];

export function DocumentosAdminTab({ empleados, departamentos }: Props) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showSubir, setShowSubir] = useState(false);
  const [verAsignacionesDe, setVerAsignacionesDe] = useState<Documento | null>(null);
  const [asignaciones, setAsignaciones] = useState<AsignacionDetalle[]>([]);
  const [cargandoAsig, setCargandoAsig] = useState(false);
  const [toast, setToast] = useState<{ tipo: "ok" | "error"; msg: string } | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await listarDocumentosEmpresa();
      setDocumentos(data);
    } catch (e: any) {
      setToast({ tipo: "error", msg: e?.message ?? "Error al cargar documentos" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirAsignaciones = async (doc: Documento) => {
    setVerAsignacionesDe(doc);
    setCargandoAsig(true);
    try {
      const data = await listarAsignaciones(doc.documentoId);
      setAsignaciones(data);
    } catch {
      setAsignaciones([]);
    } finally {
      setCargandoAsig(false);
    }
  };

  const eliminarDoc = async (doc: Documento) => {
    if (!confirm(`¿Eliminar el documento "${doc.titulo}"? Esta acción es irreversible para los empleados.`)) return;
    try {
      await desactivarDocumento(doc.documentoId);
      setDocumentos((prev) => prev.filter((d) => d.documentoId !== doc.documentoId));
      setToast({ tipo: "ok", msg: "Documento eliminado" });
    } catch (e: any) {
      setToast({ tipo: "error", msg: e?.message ?? "Error al eliminar" });
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            Documentos
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sube documentos (nóminas, contratos, certificados...) y asígnalos a empleados o departamentos.
          </p>
        </div>
        <button
          onClick={() => setShowSubir(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          style={{ background: "var(--azul-egm)", color: "white" }}
        >
          <Upload className="w-4 h-4" />
          Subir documento
        </button>
      </div>

      {/* Listado */}
      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
        </div>
      ) : documentos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Aún no hay documentos subidos</p>
          <p className="text-xs text-slate-400 mt-1">Empieza subiendo uno con el botón de arriba.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subido</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Asignaciones</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documentos.map((d) => {
                const color = TIPO_DOCUMENTO_COLOR[d.tipo];
                return (
                  <tr key={d.documentoId} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{d.titulo}</p>
                          {d.descripcion && <p className="text-xs text-slate-500 mt-0.5">{d.descripcion}</p>}
                          <p className="text-xs text-slate-400 mt-0.5">{d.archivoNombre}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold"
                        style={{ background: color.bg, color: color.text }}>
                        {TIPO_DOCUMENTO_LABEL[d.tipo]}
                      </span>
                      {d.requiereFirma && (
                        <span className="block text-[10px] text-amber-600 font-semibold mt-1 uppercase tracking-wider">
                          Requiere firma
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(d.fechaSubida).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold">{d.totalAsignados ?? 0}</span> asignados
                        <span className="text-slate-400"> · </span>
                        <span className="text-emerald-600 font-semibold">{d.totalVistos ?? 0}</span> vistos
                        {d.requiereFirma && (
                          <>
                            <span className="text-slate-400"> · </span>
                            <span className="text-violet-600 font-semibold">{d.totalFirmados ?? 0}</span> firmados
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirAsignaciones(d)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="Ver detalle de asignaciones"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <a
                          href={d.archivoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="Ver documento"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => eliminarDoc(d)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal subir */}
      {showSubir && (
        <ModalSubirDocumento
          empleados={empleados}
          departamentos={departamentos}
          onCancel={() => setShowSubir(false)}
          onUploaded={(d) => {
            setDocumentos((prev) => [d, ...prev]);
            setShowSubir(false);
            setToast({ tipo: "ok", msg: "Documento subido correctamente" });
          }}
          onError={(msg) => setToast({ tipo: "error", msg })}
        />
      )}

      {/* Modal asignaciones */}
      {verAsignacionesDe && (
        <ModalAsignaciones
          documento={verAsignacionesDe}
          asignaciones={asignaciones}
          cargando={cargandoAsig}
          onClose={() => { setVerAsignacionesDe(null); setAsignaciones([]); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-300 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl"
          style={{
            transform: "translateX(-50%)",
            background: toast.tipo === "ok"
              ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
              : "linear-gradient(135deg, #B91C1C 0%, #EF4444 100%)",
            color: "#fff",
            animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onAnimationEnd={() => setTimeout(() => setToast(null), 3000)}
        >
          {toast.tipo === "ok" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Modal: subir documento ─────────────────────────────────────────────────

function ModalSubirDocumento({
  empleados, departamentos, onCancel, onUploaded, onError,
}: {
  empleados: Props["empleados"];
  departamentos: Props["departamentos"];
  onCancel: () => void;
  onUploaded: (d: Documento) => void;
  onError: (msg: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<TipoDocumento>("NOMINA");
  const [requiereFirma, setRequiereFirma] = useState(false);
  const [notificar, setNotificar] = useState(true);
  const [destino, setDestino] = useState<"todos" | "departamentos" | "empleados">("empleados");
  const [dptosSel, setDptosSel] = useState<Set<string>>(new Set());
  const [usersSel, setUsersSel] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);

  const toggleSet = (s: Set<string>, v: string) => {
    const ns = new Set(s);
    if (ns.has(v)) ns.delete(v); else ns.add(v);
    return ns;
  };

  const puedeEnviar = !!file && titulo.trim().length > 0 && (
    destino === "todos" ||
    (destino === "departamentos" && dptosSel.size > 0) ||
    (destino === "empleados" && usersSel.size > 0)
  );

  const submit = async () => {
    if (!puedeEnviar || !file) return;
    setEnviando(true);
    const input: SubirDocumentoInput = {
      file,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo,
      requiereFirma,
      notificar,
      asignarATodos: destino === "todos",
      departamentos: destino === "departamentos" ? Array.from(dptosSel) : [],
      usuariosIds: destino === "empleados" ? Array.from(usersSel) : [],
    };
    try {
      const doc = await subirDocumento(input);
      onUploaded(doc);
    } catch (e: any) {
      onError(e?.message ?? "No se pudo subir el documento");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 25, 35, 0.55)", backdropFilter: "blur(2px)" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nuevo documento</p>
            <h3 className="text-xl font-bold text-slate-800">Subir y asignar</h3>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* Archivo */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Archivo</label>
            <label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center gap-2 text-slate-700">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-sm text-slate-600">Selecciona un archivo (PDF o imagen)</p>
                  <p className="text-xs text-slate-400">Máximo 25 MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Nómina octubre 2026"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Descripción (opcional)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Comentario o instrucciones para el empleado"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Tipo + firma + notificar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoDocumento)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{TIPO_DOCUMENTO_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 pt-5">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={requiereFirma} onChange={(e) => setRequiereFirma(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                Requiere firma
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={notificar} onChange={(e) => setNotificar(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                Notificar al empleado
              </label>
            </div>
          </div>

          {/* Asignación */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">Asignar a</label>
            <div className="flex gap-2 mb-3">
              {([
                { id: "empleados",      label: "Empleados",     icon: Users },
                { id: "departamentos",  label: "Departamentos", icon: Building2 },
                { id: "todos",          label: "Toda la empresa", icon: Users },
              ] as const).map((opt) => {
                const Icon = opt.icon;
                const active = destino === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setDestino(opt.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{
                      background: active ? "var(--azul-egm)" : "var(--gris-superficie)",
                      color:      active ? "white" : "var(--texto-primario)",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {destino === "empleados" && (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                {empleados.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No hay empleados</p>
                ) : empleados.map((e) => (
                  <label key={e.usuarioId} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usersSel.has(e.usuarioId)}
                      onChange={() => setUsersSel((s) => toggleSet(s, e.usuarioId))}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">{e.nombre} {e.apellidos}</span>
                    {e.departamento && <span className="text-xs text-slate-400">({e.departamento})</span>}
                  </label>
                ))}
              </div>
            )}

            {destino === "departamentos" && (
              <div className="flex flex-wrap gap-2">
                {departamentos.map((d) => {
                  const sel = dptosSel.has(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDptosSel((s) => toggleSet(s, d.id))}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                      style={{
                        background:  sel ? "var(--azul-egm)" : "white",
                        color:       sel ? "white" : "var(--texto-primario)",
                        borderColor: sel ? "var(--azul-egm)" : "var(--gris-borde)",
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}

            {destino === "todos" && (
              <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-600" />
                El documento se asignará a todos los empleados activos de la empresa.
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!puedeEnviar || enviando}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--azul-egm)", color: "white" }}
          >
            {enviando ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Subir y asignar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: detalle de asignaciones ─────────────────────────────────────────

function ModalAsignaciones({
  documento, asignaciones, cargando, onClose,
}: {
  documento: Documento;
  asignaciones: AsignacionDetalle[];
  cargando: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 25, 35, 0.55)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asignaciones</p>
            <h3 className="text-xl font-bold text-slate-800">{documento.titulo}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {cargando ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--gris-borde)", borderTopColor: "var(--azul-egm)" }} />
            </div>
          ) : asignaciones.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin asignaciones</p>
          ) : (
            <ul className="space-y-2">
              {asignaciones.map((a) => (
                <li key={a.asignacionId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{a.nombre} {a.apellidos}</p>
                    {a.departamento && <p className="text-xs text-slate-400">{a.departamento}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.visto ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Visto
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Pendiente</span>
                    )}
                    {documento.requiereFirma && a.firmado && (
                      <span className="inline-flex items-center gap-1 text-xs text-violet-700 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Firmado
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
