import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
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

// Memory cache: survives hot-reloads within the same process
const googleFontBytesCache = new Map<string, Buffer>();

// Disk cache: survives process restarts (tmpdir is writable on Vercel + local)
const DISK_FONT_DIR = join(tmpdir(), "formalize-pdf-fonts");
function readDiskCache(key: string): Buffer | null {
  try {
    const p = join(DISK_FONT_DIR, `${key}.bin`);
    return existsSync(p) ? readFileSync(p) : null;
  } catch { return null; }
}
function writeDiskCache(key: string, bytes: Buffer): void {
  try {
    if (!existsSync(DISK_FONT_DIR)) mkdirSync(DISK_FONT_DIR, { recursive: true });
    writeFileSync(join(DISK_FONT_DIR, `${key}.bin`), bytes);
  } catch { /* ignore */ }
}

// Google Fonts v1 API uses legacy family names for some fonts
const V1_FAMILY_ALIASES: Record<string, string> = {
  "Source Sans 3": "Source Sans Pro",
};

/** Extract the first Google Fonts CDN URL from a CSS response.
 *  Google Fonts now returns extensionless URLs like fonts.gstatic.com/l/font?kit=...
 *  so we match any https://fonts.gstatic.com URL instead of requiring a file extension. */
function extractGoogleFontUrl(css: string): string | null {
  const m = css.match(/url\(['"\s]*(https:\/\/fonts\.gstatic\.com\/[^'")\s]+)['"\s]*\)/i);
  return m ? m[1] : null;
}

/**
 * Fetch a Google Font TTF for use with pdf-lib + fontkit.
 *
 * Root cause of previous failures: the IE6/IE8 UA trick no longer works —
 * Google Fonts now returns EOT (font/eot) for those UAs, which fontkit cannot parse.
 * An Android 4.x WebKit UA consistently returns font/ttf for all fonts on both
 * v1 and v2 APIs.
 *
 * Attempt order:
 *   1. v1 API + Android UA — most fonts, numeric weight (e.g. :400)
 *   2. v1 API + Android UA — keyword weight variant (e.g. :regular / :bold)
 *   3. v2 API + Android UA — newer fonts not in v1 index
 */
async function fetchGoogleFont(key: string): Promise<Buffer | null> {
  if (googleFontBytesCache.has(key)) return googleFontBytesCache.get(key)!;

  const disk = readDiskCache(key);
  if (disk) { googleFontBytesCache.set(key, disk); return disk; }

  const spec = GOOGLE_FONT_SPECS[key];
  if (!spec) return null;

  const v1Family = V1_FAMILY_ALIASES[spec.family] ?? spec.family;
  const v1Weight = spec.italic ? `${spec.weight}italic` : `${spec.weight}`;
  const v1WeightAlt = spec.italic
    ? (spec.weight === 400 ? "italic" : `${spec.weight}italic`)
    : (spec.weight === 400 ? "regular" : spec.weight === 700 ? "bold" : `${spec.weight}`);
  const v2Axis = spec.italic ? `ital,wght@1,${spec.weight}` : `wght@${spec.weight}`;

  // Android 4.x WebKit → Google Fonts serves font/ttf (safe for fontkit)
  const ANDROID_UA = "Mozilla/5.0 (Linux; Android 4.1; GT-N7000) AppleWebKit/534.30 (KHTML, like Gecko)";

  const cssAttempts: string[] = [
    // v2 first — returns a full Latin+Latin-Ext TTF (includes Portuguese characters like ã ê ç)
    // v1 returns an aggressive Latin-only subset that fails on accented chars (RangeError in fontkit)
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(spec.family)}:${v2Axis}&display=swap`,
    `https://fonts.googleapis.com/css?family=${encodeURIComponent(v1Family)}:${v1Weight}`,
    `https://fonts.googleapis.com/css?family=${encodeURIComponent(v1Family)}:${v1WeightAlt}`,
  ];

  for (const cssUrl of cssAttempts) {
    try {
      const cssRes = await fetch(cssUrl, {
        headers: { "User-Agent": ANDROID_UA },
        signal: AbortSignal.timeout(10_000),
      });
      if (!cssRes.ok) continue;

      const css = await cssRes.text();
      const fontUrl = extractGoogleFontUrl(css);
      if (!fontUrl) continue;

      const fontRes = await fetch(fontUrl, {
        headers: { "User-Agent": ANDROID_UA },
        signal: AbortSignal.timeout(15_000),
      });
      if (!fontRes.ok) continue;

      const contentType = fontRes.headers.get("content-type") ?? "";
      if (!contentType.includes("ttf") && !contentType.includes("truetype") && !contentType.includes("woff") && !contentType.includes("font")) {
        logger.warn({ fontKey: key, contentType }, "pdf-overlay: unexpected font content-type, skipping");
        continue;
      }

      const bytes = Buffer.from(await fontRes.arrayBuffer());
      logger.info({ fontKey: key, contentType, bytes: bytes.length }, "pdf-overlay: font downloaded");
      googleFontBytesCache.set(key, bytes);
      writeDiskCache(key, bytes);
      return bytes;
    } catch {
      continue;
    }
  }

  logger.warn({ fontKey: key }, "pdf-overlay: all font download attempts failed, using Helvetica fallback");
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

async function buildOverlaidPdf(
  basePdfBuffer: Buffer,
  vars: Record<string, string>,
  placements: FieldPlacement[],
  forceHelvetica = false
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(basePdfBuffer);
  pdfDoc.registerFontkit(fontkit);
  const pages = pdfDoc.getPages();

  const byPage = new Map<number, FieldPlacement[]>();
  for (const p of placements) {
    if (!byPage.has(p.page)) byPage.set(p.page, []);
    byPage.get(p.page)!.push(p);
  }

  const fontCache = new Map<string, PDFFont>();
  const usedFamilies = Array.from(new Set(placements.map((p) => p.fontFamily)));

  await Promise.all(
    usedFamilies.map(async (fam) => {
      if (forceHelvetica && !STANDARD_FONT_MAP[fam]) {
        fontCache.set(fam, await pdfDoc.embedFont(StandardFonts.Helvetica));
        return;
      }
      if (STANDARD_FONT_MAP[fam]) {
        fontCache.set(fam, await pdfDoc.embedFont(STANDARD_FONT_MAP[fam]));
      } else {
        const bytes = await fetchGoogleFont(fam);
        if (bytes) {
          try {
            fontCache.set(fam, await pdfDoc.embedFont(bytes));
          } catch (embedErr) {
            logger.error({ fontFamily: fam, err: String(embedErr) }, "pdf-overlay: embedFont failed — using Helvetica fallback");
            fontCache.set(fam, await pdfDoc.embedFont(StandardFonts.Helvetica));
          }
        } else {
          logger.warn({ fontFamily: fam }, "pdf-overlay: font unavailable — using Helvetica fallback");
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
      const capHeight = field.fontSize * 0.72;
      const y = height - (field.y / 100) * height - capHeight;
      const { r, g, b } = hexToRgb(field.color || "#000000");

      page.drawText(text, { x, y, size: field.fontSize, font, color: rgb(r, g, b) });
    }
  }

  return pdfDoc.save();
}

export async function applyFieldsToBasePdf(
  basePdfBuffer: Buffer,
  vars: Record<string, string>,
  placements: FieldPlacement[]
): Promise<Uint8Array> {
  try {
    return await buildOverlaidPdf(basePdfBuffer, vars, placements, false);
  } catch (err) {
    logger.warn({ err: String(err) }, "pdf-overlay: save failed — retrying with Helvetica fallback for all custom fonts");
    return buildOverlaidPdf(basePdfBuffer, vars, placements, true);
  }
}
