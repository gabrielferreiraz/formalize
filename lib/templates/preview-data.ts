import { prisma } from "@/lib/prisma";
import { fetchWithCache } from "@/lib/cache";
import { buildTemplate } from "@/lib/templates";

// Dado de exemplo usado pra popular o preview de um template (onboarding,
// /admin/templates) — não é um documento real, artista ainda não preencheu nada.
const SAMPLE_ORC: Record<string, string> = {
  contratante: "Espaço de Eventos Exemplo",
  evento: "Aniversário Corporativo",
  data: "2025-12-20",
  horario: "21:00",
  local: "Salão Garden Premium",
  cidade: "Campo Grande",
  horas: "3",
  cache: "1800000", // R$ 18.000,00
  backline: "incluso",
  transporte: "incluso",
  alimentacao: "incluso",
  hospedagem: "nao",
  formaPagamento: "50% na assinatura + 50% no dia do evento",
};

const SAMPLE_CTR: Record<string, string> = {
  contratanteNome: "João Carlos Pereira",
  contratanteCpfCnpj: "123.456.789-00",
  contratanteRg: "1.234.567",
  contratanteOrgao: "SSP/MS",
  logradouro: "Rua das Palmeiras",
  numero: "456",
  bairro: "Jardim dos Estados",
  cep: "79020-350",
  cidade: "Campo Grande",
  uf: "MS",
  contratanteTelefone: "(67) 99999-1234",
  data: "2025-12-20",
  horario: "21:00",
  local: "Salão Garden Premium",
  cidadeEvento: "Campo Grande/MS",
  horas: "3",
  cache: "1800000",
  backline: "incluso",
  transporte: "incluso",
  pessoasBanda: "7",
  formaPagamento: "50% na assinatura e 50% uma semana antes do evento",
  fraseRodape: "Depois do Sim, é hora do Show",
};

const ARTIST_SELECT = {
  name: true, legalName: true, cnpj: true,
  logoUrl: true, backgroundUrl: true,
  primaryColor: true, website: true,
  instagram: true, spotify: true, x: true, youtube: true,
  address: true, bankInfo: true, instruments: true,
  orcamentoFontScale: true, contratoFontScale: true,
  pixKey: true,
} as const;

// Cache curto do HTML já montado — quem tá comparando templates clica em
// vários seguidos, sem editar nada no meio. Evita reconsultar o artista e
// rebaixar logo/background do R2 a cada clique nesse fluxo de comparação.
const PREVIEW_HTML_CACHE = new Map<string, { html: string; ts: number }>();
const PREVIEW_CACHE_TTL = 5 * 60 * 1000;

/**
 * Monta o HTML de um template específico com dado de exemplo — usado tanto
 * pelo preview em PDF (/api/templates/preview, via Gotenberg) quanto pelo
 * preview web (/api/templates/preview-html, sem Gotenberg). Centralizado
 * aqui pra não duplicar a amostra de dados nem a lógica de override de
 * template entre as duas rotas.
 */
export async function resolvePreviewHtml(
  artistId: string,
  templateId: string,
  type: "orcamento" | "contrato",
): Promise<string | null> {
  const cacheKey = `${artistId}:${type}:${templateId}`;
  const cached = PREVIEW_HTML_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < PREVIEW_CACHE_TTL) return cached.html;

  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: ARTIST_SELECT });
  if (!artist) return null;

  const artistWithTemplate = {
    ...artist,
    orcamentoTemplate: type === "orcamento" ? templateId : undefined,
    contratoTemplate: type === "contrato" ? templateId : undefined,
  };

  const sampleData = type === "orcamento" ? SAMPLE_ORC : SAMPLE_CTR;

  const [logoResult, backgroundResult] = await Promise.all([
    artist.logoUrl ? fetchWithCache(artist.logoUrl) : Promise.resolve(null),
    artist.backgroundUrl ? fetchWithCache(artist.backgroundUrl) : Promise.resolve(null),
  ]);
  const preloaded = {
    logo: logoResult ? { base64: logoResult.buffer.toString("base64"), mime: logoResult.mime } : null,
    background: backgroundResult ? { base64: backgroundResult.buffer.toString("base64"), mime: backgroundResult.mime } : null,
  };

  const html = await buildTemplate(type, artistWithTemplate, sampleData, undefined, preloaded);
  PREVIEW_HTML_CACHE.set(cacheKey, { html, ts: Date.now() });
  return html;
}
