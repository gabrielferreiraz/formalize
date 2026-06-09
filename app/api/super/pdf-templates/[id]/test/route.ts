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

async function runTest(id: string, fieldsOverride?: FieldPlacement[]) {
  const mapping = await prisma.pdfTemplateMapping.findUnique({
    where: { id },
    include: { artist: { select: { name: true, legalName: true, cnpj: true, pixKey: true } } },
  });
  if (!mapping) return null;

  const baseRes = await fetch(mapping.pdfUrl);
  if (!baseRes.ok) throw new Error("Falha ao baixar PDF base");

  const baseBuffer = Buffer.from(await baseRes.arrayBuffer());
  const vars = buildTestVars(mapping.artist);
  const fields = fieldsOverride ?? (mapping.fields as unknown as FieldPlacement[]) ?? [];
  const pdfBytes = await applyFieldsToBasePdf(baseBuffer, vars, fields);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="teste-${id}.pdf"`,
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const res = await runTest(params.id);
    if (!res) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return res;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 502 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const fields = Array.isArray(body.fields) ? (body.fields as FieldPlacement[]) : undefined;

  try {
    const res = await runTest(params.id, fields);
    if (!res) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return res;
  } catch (e) {
    console.error("[pdf-test] POST error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
