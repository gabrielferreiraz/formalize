// utils/places.ts — Busca de locais online (stub)

export interface PlaceResult {
  name: string;
  address: string;
}

/** Stub — retorna array vazio. Implementar com Google Places / Mapbox futuramente. */
export async function buscarLocaisOnline(_query: string): Promise<PlaceResult[]> {
  return [];
}
