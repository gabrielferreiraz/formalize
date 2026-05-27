import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TIPO_ALLOWLIST = ["banda", "solo", "dj", "generico", "custom"];
const MAX_CLAUSULAS = 50;
const MAX_NOME = 200;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.contratoTemplate.findMany({
    where: { artistId: session.user.artistId },
    orderBy: { createdAt: "asc" },
    select: { id: true, nome: true, tipo: true, titulo: true, isDefault: true, createdAt: true },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { nome?: unknown; tipo?: unknown; titulo?: unknown; clausulas?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const tipo = typeof body.tipo === "string" ? body.tipo : "custom";
  const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "Contrato de Prestação de Serviços";
  const clausulas = body.clausulas;

  if (!nome || nome.length > MAX_NOME) {
    return NextResponse.json({ error: "nome inválido (máx 200 caracteres)" }, { status: 400 });
  }
  if (!TIPO_ALLOWLIST.includes(tipo)) {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }
  if (!Array.isArray(clausulas) || clausulas.length === 0) {
    return NextResponse.json({ error: "clausulas deve ser um array não vazio" }, { status: 400 });
  }
  if (clausulas.length > MAX_CLAUSULAS) {
    return NextResponse.json({ error: `máximo de ${MAX_CLAUSULAS} cláusulas` }, { status: 400 });
  }

  const template = await prisma.contratoTemplate.create({
    data: { artistId: session.user.artistId, nome, tipo, titulo, clausulas },
  });

  return NextResponse.json(template, { status: 201 });
}
