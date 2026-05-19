"use client";

// ============================================================
// MapaUbicacionInner — componente real de Leaflet.
// SOLO se importa dinámicamente desde MapaUbicacion (no SSR).
// ============================================================

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix para los iconos por defecto de Leaflet que no cargan bien con bundlers
// Apuntamos a las URLs públicas del CDN (sin necesidad de copiar assets).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  latitud:   number;
  longitud:  number;
  etiqueta?: string;
  alturaPx?: number;
  zoom?:     number;
}

export default function MapaUbicacionInner({
  latitud, longitud, etiqueta, alturaPx = 240, zoom = 15,
}: Props) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200"
      style={{ height: alturaPx }}>
      <MapContainer
        center={[latitud, longitud]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitud, longitud]}>
          {etiqueta && <Popup>{etiqueta}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}
