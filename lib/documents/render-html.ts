import type { DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchWithCache } from "@/lib/cache";
import { buildTemplate } from "@/lib/templates";
import { logger } from "@/lib/logger";

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
  try {
    const templateType = DOC_TYPE_TO_TEMPLATE[docType];
    if (!templateType) return null;

    const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: ARTIST_SELECT });
    if (!artist) return null;

    const isContrato = templateType === "contrato";
    const templateId = isContrato ? (artist.contratoTemplate ?? "ctr-001") : (artist.orcamentoTemplate ?? "orc-001");

    if (templateId.startsWith("pdf:")) return null;

    // O template visual escolhido (artist.contratoTemplate) manda no design
    // do PDF — ver comentário em lib/templates/index.ts#buildTemplate.
    const buildData: Record<string, unknown> = data;

    // Logo/background quebrados (URL fora do ar, deletada do R2 etc.) não
    // podem derrubar o documento inteiro — degrada pra "sem logo" e loga.
    const [logoResult, backgroundResult] = await Promise.all([
      artist.logoUrl
        ? fetchWithCache(artist.logoUrl).catch((err) => {
            logger.warn({ err, artistId, action: "document.render.logo" }, "falha ao buscar logo — renderizando sem ela");
            return null;
          })
        : Promise.resolve(null),
      artist.backgroundUrl
        ? fetchWithCache(artist.backgroundUrl).catch((err) => {
            logger.warn({ err, artistId, action: "document.render.background" }, "falha ao buscar background — renderizando sem ele");
            return null;
          })
        : Promise.resolve(null),
    ]);
    const preloaded = {
      logo: logoResult ? { base64: logoResult.buffer.toString("base64"), mime: logoResult.mime } : null,
      background: backgroundResult ? { base64: backgroundResult.buffer.toString("base64"), mime: backgroundResult.mime } : null,
    };

    return await buildTemplate(
      templateType,
      artist,
      buildData,
      undefined,
      preloaded,
    );
  } catch (err) {
    logger.error({ err, artistId, docType, action: "document.render" }, "falha ao renderizar HTML do documento");
    return null;
  }
}
