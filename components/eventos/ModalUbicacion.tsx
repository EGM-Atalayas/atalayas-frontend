"use client";

// ============================================================
// ModalUbicacion — popup con mapa para ver la ubicación de un
// evento. Se abre desde la card de evento al pulsar "Ver ubicación".
// ============================================================

import { X, MapPin, ExternalLink } from "lucide-react";
import { MapaUbicacion } from "./MapaUbicacion";

interface Props {
  titulo:    string;
  lugar?:    string | null;
  latitud:   number;
  longitud:  number;
  onClose:   () => void;
}

export function ModalUbicacion({ titulo, lugar, latitud, longitud, onClose }: Props) {
  const urlGoogleMaps = `https://www.google.com/maps?q=${latitud},${longitud}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--azul-egm-light)", color: "var(--azul-egm)" }}>
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-800 truncate">{titulo}</h2>
              {lugar && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{lugar}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 shrink-0">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Mapa */}
        <div className="p-4">
          <MapaUbicacion
            latitud={latitud}
            longitud={longitud}
            etiqueta={lugar ?? undefined}
            alturaPx={400}
            zoom={16}
          />
        </div>

        {/* Footer con CTA */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">
            Coordenadas: {latitud.toFixed(5)}, {longitud.toFixed(5)}
          </p>
          <a
            href={urlGoogleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
          >
            Abrir en Google Maps
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
