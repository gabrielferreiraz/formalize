import { NextRequest, NextResponse } from "next/server";

const GOOGLE_PLACES_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
// Campo Grande - MS (viés geográfico para priorizar resultados locais)
const CG_MS_COORDS = "-20.4697,-54.6201";
const CG_MS_RADIUS_METERS = "150000";

function isAddressLikeQuery(query: string): boolean {
  const q = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  return /^(rua|r\.|avenida|av\.|travessa|tv\.|alameda|rodovia|estrada|praca|praça)\b/.test(q);
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query || query.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY não configurada." }, { status: 500 });
  }

  const url = new URL(GOOGLE_PLACES_URL);
  url.searchParams.set("input", query);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "br");
  url.searchParams.set("components", "country:br");
  url.searchParams.set("location", CG_MS_COORDS);
  url.searchParams.set("radius", CG_MS_RADIUS_METERS);
  if (isAddressLikeQuery(query)) {
    url.searchParams.set("types", "address");
  }
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: "Falha ao consultar Google Places.", details: data }, { status: 502 });
    }

    const predictions = Array.isArray(data?.predictions)
      ? data.predictions
          .map((p: any) => p?.description)
          .filter((d: unknown): d is string => typeof d === "string" && d.trim().length > 0)
      : [];

    return NextResponse.json({ predictions });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro inesperado ao consultar Google Places.",
        details: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
