import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendToGotenberg } from "@/lib/gotenberg";
import { buildTemplate } from "@/lib/templates";
import { fetchWithCache } from "@/lib/cache";

// Sample data used to populate the preview PDF
const SAMPLE_ORC: Record<string, string> = {
  contratante: "Espaço de Eventos Exemplo",
  evento: "Aniversário Corporativo",
  data: "2025-12-20",
  horario: "21:00",
  local: "Salão Garden Premium",
  cidade: "Campo Grande",
  horas: "3",
  cache: "1800000",       // R$ 18.000,00
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
  cache: "1800000",       // R$ 18.000,00
  backline: "incluso",
  transporte: "incluso",
  pessoasBanda: "7",
  formaPagamento: "50% na assinatura e 50% uma semana antes do evento",
  fraseRodape: "Depois do Sim, é hora do Show",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get("id");
  const type = searchParams.get("type") as "orcamento" | "contrato" | null;

  if (!templateId || !type || !["orcamento", "contrato"].includes(type)) {
    return NextResponse.json({ error: "id e type obrigatórios" }, { status: 400 });
  }

  const artistId = session.user.artistId;
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      name: true, legalName: true, cnpj: true,
      logoUrl: true, backgroundUrl: true,
      primaryColor: true, website: true,
      instagram: true, spotify: true, x: true, youtube: true,
      address: true, bankInfo: true, instruments: true,
      paperWidth: true, paperHeight: true,
      contractPaperWidth: true, contractPaperHeight: true,
      orcamentoFontScale: true, contratoFontScale: true,
      pixKey: true,
    },
  });

  if (!artist) {
    return NextResponse.json({ error: "Artista não encontrado" }, { status: 404 });
  }

  // Override template to the one being previewed
  const artistWithTemplate = {
    ...artist,
    orcamentoTemplate: type === "orcamento" ? templateId : undefined,
    contratoTemplate: type === "contrato" ? templateId : undefined,
  };

  const sampleData = type === "orcamento" ? SAMPLE_ORC : SAMPLE_CTR;

  const isContrato = type === "contrato";
  const effectivePaperWidth = isContrato
    ? (artist.contractPaperWidth ?? "21.0")
    : (artist.paperWidth ?? "21.0");
  const effectivePaperHeight = isContrato
    ? (artist.contractPaperHeight ?? "29.7")
    : (artist.paperHeight ?? "29.7");

  // Preload assets
  const [logoResult, backgroundResult] = await Promise.all([
    artist.logoUrl ? fetchWithCache(artist.logoUrl) : Promise.resolve(null),
    artist.backgroundUrl ? fetchWithCache(artist.backgroundUrl) : Promise.resolve(null),
  ]);

  const preloaded = {
    logo: logoResult ? { base64: logoResult.buffer.toString("base64"), mime: logoResult.mime } : null,
    background: backgroundResult ? { base64: backgroundResult.buffer.toString("base64"), mime: backgroundResult.mime } : null,
  };

  const html = await buildTemplate(
    type,
    artistWithTemplate,
    sampleData,
    { width: effectivePaperWidth, height: effectivePaperHeight },
    preloaded,
  );

  const pdfBuffer = await sendToGotenberg(html, {
    paperWidth: effectivePaperWidth,
    paperHeight: effectivePaperHeight,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="preview-${templateId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
