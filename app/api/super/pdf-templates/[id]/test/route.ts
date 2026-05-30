import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyFieldsToBasePdf, type FieldPlacement } from "@/lib/pdf-overlay";

function buildTestVars(artist: {
  name: string;
  legalName?: string | null;
  cnpj?: string | null;
  pixKey?: string | null;
}): Record<string, string> {
  return {
    evento: "Show de Verão 2025",
    dataEventoBr: "15/08/2025",
    horario: "21:00",
    local: "Arena Music Hall",
    cidadeEvento: "São Paulo - SP",
    horasFormatado: "2h",
    contratanteNome: "João da Silva",
    contratanteCpfCnpj: "123.456.789-00",
    contratanteRg: "12.345.678-9",
    cidadeEstadoContratante: "São Paulo - SP",
    contratante: "Empresa de Eventos Ltda.",
    valorCacheFormatado: "R$ 5.000,00",
    valorTotalFormatado: "R$ 6.200,00",
    valorTotalExtenso: "seis mil e duzentos reais",
    formaPagamento: "50% entrada + 50% no dia",
    backlineFmt: "Incluso",
    transporteFmt: "R$ 800,00",
    alimentacaoFmt: "Incluso",
    hospedagemFmt: "R$ 400,00",
    artistaNome: artist.name,
    artistaLegalNome: artist.legalName ?? "Artista LTDA",
    artistaCnpj: artist.cnpj ?? "12.345.678/0001-90",
    pixKey: artist.pixKey ?? "12.345.678/0001-90",
    artistaInstrumentos: "Guitarra, Baixo, Bateria, Voz",
    dataAssinaturaBr: "29/05/2025",
    foro: "São Paulo - SP",
    hashContrato: "a1b2c3d4e5f6",
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mapping = await prisma.pdfTemplateMapping.findUnique({
    where: { id: params.id },
    include: { artist: { select: { name: true, legalName: true, cnpj: true, pixKey: true } } },
  });

  if (!mapping) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const baseRes = await fetch(mapping.pdfUrl);
  if (!baseRes.ok) {
    return NextResponse.json({ error: "Falha ao baixar PDF base" }, { status: 502 });
  }

  const baseBuffer = Buffer.from(await baseRes.arrayBuffer());
  const vars = buildTestVars(mapping.artist);
  const pdfBytes = await applyFieldsToBasePdf(
    baseBuffer,
    vars,
    (mapping.fields as unknown as FieldPlacement[]) ?? []
  );

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="teste-${mapping.id}.pdf"`,
    },
  });
}
