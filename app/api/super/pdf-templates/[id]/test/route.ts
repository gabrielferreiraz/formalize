import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyFieldsToBasePdf, type FieldPlacement, type ShapeAnnotation } from "@/lib/pdf-overlay";

// Cache em memória do buffer do PDF base — evita re-download a cada teste
const pdfBufferCache = new Map<string, { buf: Buffer; ts: number }>();
const PDF_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function fetchPdfBuffer(url: string): Promise<Buffer> {
  const cached = pdfBufferCache.get(url);
  if (cached && Date.now() - cached.ts < PDF_CACHE_TTL) return cached.buf;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("Falha ao baixar PDF base");
  const buf = Buffer.from(await res.arrayBuffer());
  pdfBufferCache.set(url, { buf, ts: Date.now() });
  return buf;
}

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

async function runTest(id: string, fieldsOverride?: FieldPlacement[], shapesOverride?: ShapeAnnotation[]) {
  const mapping = await prisma.pdfTemplateMapping.findUnique({
    where: { id },
    include: { artist: { select: { name: true, legalName: true, cnpj: true, pixKey: true } } },
  });
  if (!mapping) return null;

  const baseBuffer = await fetchPdfBuffer(mapping.pdfUrl);
  const vars = buildTestVars(mapping.artist);
  // Support both legacy array format and new { placements, shapes } format
  const savedFields = mapping.fields as any;
  const defaultFields: FieldPlacement[] = Array.isArray(savedFields)
    ? savedFields
    : Array.isArray(savedFields?.placements) ? savedFields.placements : [];
  const defaultShapes: ShapeAnnotation[] = Array.isArray(savedFields?.shapes) ? savedFields.shapes : [];

  const fields = fieldsOverride ?? defaultFields;
  const shapes = shapesOverride ?? defaultShapes;
  const pdfBytes = await applyFieldsToBasePdf(baseBuffer, vars, fields, shapes);

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
  const shapes = Array.isArray(body.shapes) ? (body.shapes as ShapeAnnotation[]) : undefined;

  try {
    const res = await runTest(params.id, fields, shapes);
    if (!res) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return res;
  } catch (e) {
    console.error("[pdf-test] POST error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
