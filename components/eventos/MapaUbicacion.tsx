"use client";

// ============================================================
// MapaUbicacion — wrapper de Leaflet con marker. Usado en:
//  - ModalEvento (preview al buscar dirección)
//  - ModalUbicacion (visualización completa al pulsar "Ver ubicación")
//
// Leaflet usa el DOM directamente, así que importamos dinámicamente
// para evitar errores de SSR de Next.js.
// ============================================================

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

interface Props {
  latitud:   number;
  longitud:  number;
  /** Texto opcional en el popup del marker (nombre del lugar) */
  etiqueta?: string;
  /** Altura en píxeles del contenedor del mapa */
  alturaPx?: number;
  /** Zoom inicial (default 15) */
  zoom?:     number;
}

// Carga del componente real solo en cliente (evita SSR)
const MapaInner = dynamic(() => import("./MapaUbicacionInner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl flex items-center justify-center bg-slate-100"
      style={{ height: 240 }}>
      <p className="text-xs text-slate-400">Cargando mapa…</p>
    </div>
  ),
});

export function MapaUbicacion(props: Props) {
  return <MapaInner {...props} />;
}
