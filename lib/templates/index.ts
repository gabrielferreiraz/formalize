import { fetchWithCache } from "@/lib/cache";
import { buildOrc001 } from "./orcamento/orc-001-classic";
import { buildOrc002 } from "./orcamento/orc-002-light";
import { buildOrc003 } from "./orcamento/orc-003-executive";
import { buildOrc004 } from "./orcamento/orc-004-prestige";
import { buildCtr001 } from "./contrato/ctr-001-classic";
import { buildCtr002 } from "./contrato/ctr-002-light";
import { buildCtr003 } from "./contrato/ctr-003-premium";
import { buildCtr004 } from "./contrato/ctr-004-formal";
import type { AssetResult, ArtistTemplateData } from "./types";

type TemplateBuilder = (
  artist: ArtistTemplateData & Record<string, any>,
  data: Record<string, any>,
  pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  background?: AssetResult | null,
) => Promise<string>;

const ORC_BUILDERS: Record<string, TemplateBuilder> = {
  "orc-001": buildOrc001 as TemplateBuilder,
  "orc-002": buildOrc002 as TemplateBuilder,
  "orc-003": buildOrc003,
  "orc-004": buildOrc004,
};

const CTR_BUILDERS: Record<string, TemplateBuilder> = {
  "ctr-001": buildCtr001 as TemplateBuilder,
  "ctr-002": buildCtr002 as TemplateBuilder,
  "ctr-003": buildCtr003,
  "ctr-004": buildCtr004,
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
    const builder = ORC_BUILDERS[templateId] ?? ORC_BUILDERS["orc-001"];
    return builder(artist, data as Record<string, any>, pageSize, logo, background);
  }

  const templateId = artist.contratoTemplate || "ctr-001";
  const builder = CTR_BUILDERS[templateId] ?? CTR_BUILDERS["ctr-001"];
  return builder(artist, data as Record<string, any>, pageSize, logo, background);
}
