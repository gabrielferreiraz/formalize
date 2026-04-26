import { fetchWithCache } from "@/lib/cache";
import { buildOrc001 } from "./orcamento/orc-001-classic";
import { buildOrc002 } from "./orcamento/orc-002-light";
import { buildCtr001 } from "./contrato/ctr-001-classic";
import { buildCtr002 } from "./contrato/ctr-002-light";
import type { AssetResult, ArtistTemplateData } from "./types";

const ORC_BUILDERS: Record<string, Function> = {
  "orc-001": buildOrc001,
  "orc-002": buildOrc002,
};

const CTR_BUILDERS: Record<string, Function> = {
  "ctr-001": buildCtr001,
  "ctr-002": buildCtr002,
};

export async function buildTemplate(
  type: "orcamento" | "contrato",
  artist: ArtistTemplateData & Record<string, any>,
  data: Record<string, unknown>,
  pageSize?: { width: string; height: string },
  preloaded?: { logo?: AssetResult | null; background?: AssetResult | null }
): Promise<string> {
  let logo: AssetResult | null = preloaded?.logo ?? null;
  let background: AssetResult | null = preloaded?.background ?? null;

  if (!preloaded) {
    const [logoResult, backgroundResult] = await Promise.all([
      artist.logoUrl ? fetchWithCache(artist.logoUrl) : Promise.resolve(null),
      artist.backgroundUrl ? fetchWithCache(artist.backgroundUrl) : Promise.resolve(null),
    ]);

    logo = logoResult ? { base64: logoResult.buffer.toString("base64"), mime: logoResult.mime } : null;
    background = backgroundResult ? { base64: backgroundResult.buffer.toString("base64"), mime: backgroundResult.mime } : null;
  }

  if (type === "orcamento") {
    const templateId = artist.orcamentoTemplate || "orc-001";
    const builder = ORC_BUILDERS[templateId] || buildOrc001;
    if (templateId === "orc-001") return builder(artist, data, pageSize, logo, background);
    return builder(artist, data, logo);
  }

  const templateId = artist.contratoTemplate || "ctr-001";
  const builder = CTR_BUILDERS[templateId] || buildCtr001;
  if (templateId === "ctr-001") return builder(artist, data, pageSize, logo);
  return builder(artist, data, logo);
}
