import { fetchWithCache } from "@/lib/cache";
import { buildOrc001 } from "./orcamento/orc-001-classic";
import { buildOrc002 } from "./orcamento/orc-002-light";
import { buildOrc003 } from "./orcamento/orc-003-executive";
import { buildOrc004 } from "./orcamento/orc-004-prestige";
import { buildCtr001 } from "./contrato/ctr-001-classic";
import { buildCtr002 } from "./contrato/ctr-002-light";
import { buildCtr003 } from "./contrato/ctr-003-premium";
import { buildCtr004 } from "./contrato/ctr-004-formal";
import { buildFromClausulas } from "./contrato/build-from-clausulas";
import type { AssetResult, ArtistTemplateData } from "./types";
import type { ClausulaContrato } from "@/lib/contrato-clausulas";

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

const WATERMARK = `
<div style="position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:9997;user-select:none;overflow:hidden;">
  <div style="transform:rotate(-38deg);font-family:Helvetica,Arial,sans-serif;font-size:86px;font-weight:900;letter-spacing:0.12em;color:rgba(0,0,0,0.055);white-space:nowrap;">FORMALIZE</div>
</div>
<div style="position:fixed;bottom:0;left:0;right:0;padding:5px 0 6px;border-top:1px solid rgba(0,0,0,0.08);text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:8.5px;letter-spacing:0.09em;color:rgba(40,40,40,0.52);pointer-events:none;z-index:9999;user-select:none;background:rgba(255,255,255,0.6);">Criado com&nbsp;<span style="font-weight:800;letter-spacing:0.05em;">Formalize</span></div>`;

function injectWatermark(html: string): string {
  return html.includes("</body>")
    ? html.replace("</body>", `${WATERMARK}</body>`)
    : html + WATERMARK;
}

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
    return injectWatermark(await builder(artist, data as Record<string, any>, pageSize, logo, background));
  }

  const clausulas = data._clausulas;
  if (Array.isArray(clausulas) && clausulas.length > 0) {
    const titulo = data._clausulasTitulo as string | undefined;
    return injectWatermark(await buildFromClausulas(artist, data as Record<string, any>, clausulas as ClausulaContrato[], pageSize, logo, titulo));
  }

  const templateId = artist.contratoTemplate || "ctr-001";
  const builder = CTR_BUILDERS[templateId] ?? CTR_BUILDERS["ctr-001"];
  return injectWatermark(await builder(artist, data as Record<string, any>, pageSize, logo, background));
}
