import type { DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchWithCache } from "@/lib/cache";
import { buildTemplate } from "@/lib/templates";
import { getPresetClausulas } from "@/lib/contrato-clausulas";

export const DOC_TYPE_TO_TEMPLATE: Partial<Record<DocumentType, "orcamento" | "contrato">> = {
  BUDGET: "orcamento",
  CONTRACT: "contrato",
};

const ARTIST_SELECT = {
  name: true, legalName: true, cnpj: true,
  logoUrl: true, backgroundUrl: true,
  primaryColor: true, secondaryColor: true,
  whatsapp: true, instagram: true, spotify: true, x: true, youtube: true, website: true,
  pixKey: true, bankInfo: true, address: true, instruments: true,
  paperWidth: true, paperHeight: true, contractPaperWidth: true, contractPaperHeight: true,
  orcamentoFontScale: true, contratoFontScale: true, orcamentoLogoScale: true, contratoLogoScale: true,
  orcamentoTemplate: true, contratoTemplate: true,
  categoria: true,
} as const;

/**
 * Re-renderiza o HTML de um documento já gerado, direto dos dados salvos em
 * `Document.data` — sem Gotenberg, sem PDF. Usado pela página pública
 * (/ver/[token]) e pelo endpoint de share.
 *
 * Espelha de propósito a resolução de template/cláusulas que
 * /api/documents/generate faz antes de mandar pro Gotenberg, pra a versão
 * web bater com o PDF gerado originalmente. Se um dia divergir, é porque
 * generate mudou e este helper não acompanhou — checar os dois juntos.
 *
 * Retorna null quando não há equivalente web possível:
 *   - tipo de documento sem template (GENERIC_EVENT, etc.)
 *   - artista não encontrado
 *   - artista usando template PDF customizado (canvas) — pausado, sem
 *     equivalente HTML por enquanto.
 */
export async function resolveDocumentHtml(
  artistId: string,
  docType: DocumentType,
  data: Record<string, unknown>,
): Promise<string | null> {
  const templateType = DOC_TYPE_TO_TEMPLATE[docType];
  if (!templateType) return null;

  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: ARTIST_SELECT });
  if (!artist) return null;

  const isContrato = templateType === "contrato";
  const templateId = isContrato ? (artist.contratoTemplate ?? "ctr-001") : (artist.orcamentoTemplate ?? "orc-001");

  if (templateId.startsWith("pdf:")) return null;

  let buildData: Record<string, unknown> = data;
  if (isContrato) {
    const clausulasTemplateId = data.clausulasTemplateId as string | undefined;
    const preset = data.clausulasPreset as string | undefined;
    if (clausulasTemplateId) {
      const cTemplate = await prisma.contratoTemplate.findFirst({
        where: { id: clausulasTemplateId, artistId },
        select: { clausulas: true, titulo: true },
      });
      if (cTemplate && Array.isArray(cTemplate.clausulas)) {
        buildData = { ...data, _clausulas: cTemplate.clausulas, _clausulasTitulo: cTemplate.titulo };
      }
    } else if (preset && ["banda", "solo", "dj", "generico"].includes(preset)) {
      buildData = { ...data, _clausulas: getPresetClausulas(preset as "banda" | "solo" | "dj" | "generico") };
    }
  }

  const effectivePaperWidth = isContrato ? (artist.contractPaperWidth ?? "21.0") : (artist.paperWidth ?? "21.0");
  const effectivePaperHeight = isContrato ? (artist.contractPaperHeight ?? "29.7") : (artist.paperHeight ?? "29.7");

  const [logoResult, backgroundResult] = await Promise.all([
    artist.logoUrl ? fetchWithCache(artist.logoUrl) : Promise.resolve(null),
    artist.backgroundUrl ? fetchWithCache(artist.backgroundUrl) : Promise.resolve(null),
  ]);
  const preloaded = {
    logo: logoResult ? { base64: logoResult.buffer.toString("base64"), mime: logoResult.mime } : null,
    background: backgroundResult ? { base64: backgroundResult.buffer.toString("base64"), mime: backgroundResult.mime } : null,
  };

  return buildTemplate(
    templateType,
    artist,
    buildData,
    { width: effectivePaperWidth, height: effectivePaperHeight },
    preloaded,
  );
}
