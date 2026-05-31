import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { buildVars } from "@/lib/templates/contrato/build-from-clausulas";
import { formatData, valorPorExtenso } from "@/lib/templates/utils";
import { logger } from "@/lib/logger";

export type FieldPlacement = {
  id: string;
  key: string;
  label: string;
  page: number;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
};

type ArtistData = Record<string, any>;

// ─── Standard PDF fonts ───────────────────────────────────────────────────────

const STANDARD_FONT_MAP: Record<string, StandardFonts> = {
  "Helvetica":             StandardFonts.Helvetica,
  "Helvetica-Bold":        StandardFonts.HelveticaBold,
  "Helvetica-Oblique":     StandardFonts.HelveticaOblique,
  "Helvetica-BoldOblique": StandardFonts.HelveticaBoldOblique,
  "Times-Roman":           StandardFonts.TimesRoman,
  "Times-Bold":            StandardFonts.TimesRomanBold,
  "Times-Italic":          StandardFonts.TimesRomanItalic,
  "Times-BoldItalic":      StandardFonts.TimesRomanBoldItalic,
  "Courier":               StandardFonts.Courier,
  "Courier-Bold":          StandardFonts.CourierBold,
  "Courier-Oblique":       StandardFonts.CourierOblique,
  "Courier-BoldOblique":   StandardFonts.CourierBoldOblique,
};

// ─── Google Fonts (fetched as TTF on demand) ──────────────────────────────────

const GOOGLE_FONT_SPECS: Record<string, { family: string; weight: number; italic?: boolean }> = {
  "Roboto":              { family: "Roboto",           weight: 400 },
  "Roboto-Bold":         { family: "Roboto",           weight: 700 },
  "Roboto-Italic":       { family: "Roboto",           weight: 400, italic: true },
  "OpenSans":            { family: "Open Sans",        weight: 400 },
  "OpenSans-Bold":       { family: "Open Sans",        weight: 700 },
  "Montserrat":          { family: "Montserrat",       weight: 400 },
  "Montserrat-Bold":     { family: "Montserrat",       weight: 700 },
  "Lato":                { family: "Lato",             weight: 400 },
  "Lato-Bold":           { family: "Lato",             weight: 700 },
  "Inter":               { family: "Inter",            weight: 400 },
  "Inter-Bold":          { family: "Inter",            weight: 700 },
  "Raleway":             { family: "Raleway",          weight: 400 },
  "Raleway-Bold":        { family: "Raleway",          weight: 700 },
  "Playfair":            { family: "Playfair Display", weight: 400 },
  "Playfair-Bold":       { family: "Playfair Display", weight: 700 },
  "Merriweather":        { family: "Merriweather",     weight: 400 },
  "Merriweather-Bold":   { family: "Merriweather",     weight: 700 },
  "PTSans":              { family: "PT Sans",          weight: 400 },
  "PTSans-Bold":         { family: "PT Sans",          weight: 700 },
  "SourceSans":          { family: "Source Sans 3",    weight: 400 },
  "SourceSans-Bold":     { family: "Source Sans 3",    weight: 700 },
};

// Module-level cache: survives across requests in the same Node.js process
const googleFontBytesCache = new Map<string, Buffer>();

// Google Fonts v1 API uses legacy family names for some fonts
const V1_FAMILY_ALIASES: Record<string, string> = {
  "Source Sans 3": "Source Sans Pro",
};

async function fetchGoogleFontTTF(key: string): Promise<Buffer | null> {
  if (googleFontBytesCache.has(key)) return googleFontBytesCache.get(key)!;

  const spec = GOOGLE_FONT_SPECS[key];
  if (!spec) return null;

  const UA = "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)";

  // Try v1 API first — IE6 UA reliably returns TTF format from v1
  // v2 (/css2) ignores the UA and always returns WOFF2
  const v1Family = V1_FAMILY_ALIASES[spec.family] ?? spec.family;
  const v1Weight = spec.italic ? `${spec.weight}italic` : `${spec.weight}`;

  const cssUrls = [
    `https://fonts.googleapis.com/css?family=${encodeURIComponent(v1Family)}:${v1Weight}`,
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(spec.family)}:ital,wght@${spec.italic ? "1," : "0,"}${spec.weight}&display=swap`,
  ];

  for (const cssUrl of cssUrls) {
    try {
      const cssRes = await fetch(cssUrl, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(8000),
      });
      if (!cssRes.ok) continue;
      const css = await cssRes.text();

      const match = css.match(/src:\s*url\(([^)]+\.ttf)\)/i) ?? css.match(/url\(([^)]+\.ttf)\)/i);
      if (!match) continue;

      const fontRes = await fetch(match[1], { signal: AbortSignal.timeout(8000) });
      if (!fontRes.ok) continue;

      const bytes = Buffer.from(await fontRes.arrayBuffer());
      googleFontBytesCache.set(key, bytes);
      return bytes;
    } catch {
      continue;
    }
  }

  logger.warn({ fontKey: key }, "pdf-overlay: font download failed, falling back to Helvetica");
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMoney(raw: string | number | undefined): number {
  if (!raw) return 0;
  return (parseFloat(String(raw)) || 0) / 100;
}

function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

export function buildOverlayVars(
  artist: ArtistData,
  data: Record<string, any>
): Record<string, string> {
  const contractVars = buildVars(artist as any, data);

  const cacheN = parseMoney(data.cache);
  const backlineN = data.backline === "valor" ? parseMoney(data.backlineValor) : 0;
  const transporteN = data.transporte === "valor" ? parseMoney(data.transporteValor) : 0;
  const alimentacaoN = data.alimentacao === "valor" ? parseMoney(data.alimentacaoValor) : 0;
  const hospedagemN = data.hospedagem === "valor" ? parseMoney(data.hospedagemValor) : 0;

  const orcExtra: Record<string, string> = {
    contratante: String(data.contratante || ""),
    valorCacheFormatado: contractVars.valorCacheFormatado || fmt(cacheN),
    valorTotalFormatado: contractVars.valorTotalFormatado || fmt(cacheN + backlineN + transporteN),
    valorTotalExtenso: contractVars.valorTotalExtenso || valorPorExtenso(cacheN + backlineN + transporteN),
    backlineFmt: backlineN > 0 ? fmt(backlineN) : data.backline === "incluso" ? "Incluso" : "",
    transporteFmt: transporteN > 0 ? fmt(transporteN) : data.transporte === "incluso" ? "Incluso" : "",
    alimentacaoFmt: alimentacaoN > 0 ? fmt(alimentacaoN) : data.alimentacao === "incluso" ? "Incluso" : "",
    hospedagemFmt: hospedagemN > 0 ? fmt(hospedagemN) : data.hospedagem === "incluso" ? "Incluso" : "",
  };

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(contractVars)) out[k] = String(v ?? "");
  for (const [k, v] of Object.entries(orcExtra)) { if (!out[k]) out[k] = v; }
  return out;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

// ─── Main overlay function ────────────────────────────────────────────────────

export async function applyFieldsToBasePdf(
  basePdfBuffer: Buffer,
  vars: Record<string, string>,
  placements: FieldPlacement[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(basePdfBuffer);
  pdfDoc.registerFontkit(fontkit);
  const pages = pdfDoc.getPages();

  const byPage = new Map<number, FieldPlacement[]>();
  for (const p of placements) {
    if (!byPage.has(p.page)) byPage.set(p.page, []);
    byPage.get(p.page)!.push(p);
  }

  // Embed all used fonts (standard or Google)
  const fontCache = new Map<string, PDFFont>();
  const usedFamilies = Array.from(new Set(placements.map((p) => p.fontFamily)));

  await Promise.all(
    usedFamilies.map(async (fam) => {
      if (STANDARD_FONT_MAP[fam]) {
        fontCache.set(fam, await pdfDoc.embedFont(STANDARD_FONT_MAP[fam]));
      } else {
        const bytes = await fetchGoogleFontTTF(fam);
        if (bytes) {
          fontCache.set(fam, await pdfDoc.embedFont(bytes));
        } else {
          logger.warn({ fontFamily: fam }, "pdf-overlay: using Helvetica fallback — font unavailable");
          fontCache.set(fam, await pdfDoc.embedFont(StandardFonts.Helvetica));
        }
      }
    })
  );

  for (const [pageIdx, fields] of Array.from(byPage.entries())) {
    const page = pages[pageIdx];
    if (!page) continue;
    const { width, height } = page.getSize();

    for (const field of fields) {
      const text = vars[field.key] ?? "";
      if (!text) continue;

      const font = fontCache.get(field.fontFamily)!;
      const x = (field.x / 100) * width;
      // Canvas positions token top-left at y%. pdf-lib drawText uses baseline.
      // Subtract cap-height (~0.72em) to align text top with canvas token top.
      const capHeight = field.fontSize * 0.72;
      const y = height - (field.y / 100) * height - capHeight;
      const { r, g, b } = hexToRgb(field.color || "#000000");

      page.drawText(text, { x, y, size: field.fontSize, font, color: rgb(r, g, b) });
    }
  }

  return pdfDoc.save();
}
