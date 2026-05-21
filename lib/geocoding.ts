/**
 * Cliente ligero del API de Nominatim (OpenStreetMap) para geocoding.
 *
 * Nominatim es gratis y sin API key, pero la política de uso pide:
 *   - User-Agent identificativo
 *   - Máximo ~1 req/seg
 *   - Cachear resultados cuando sea posible
 *
 * Para uso pesado en producción habría que montar instancia propia o usar
 * un servicio comercial (Mapbox, Google), pero para crear unos pocos eventos
 * desde el panel admin esto sobra.
 */

export interface GeocodingResult {
  latitud:   number;
  longitud:  number;
  /** Etiqueta canónica devuelta por Nominatim (calle, ciudad, país...) */
  etiqueta:  string;
}

/**
 * Busca una dirección y devuelve hasta `limit` resultados.
 * Devuelve [] si no hay resultados o si la red falla.
 */
export async function buscarDireccion(query: string, limit = 5): Promise<GeocodingResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q",      q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit",  String(limit));
    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "es" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: { lat: string; lon: string; display_name: string }) => ({
      latitud:  parseFloat(item.lat),
      longitud: parseFloat(item.lon),
      etiqueta: item.display_name,
    }));
  } catch {
    return [];
  }
}
