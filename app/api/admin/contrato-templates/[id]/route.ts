import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TIPO_ALLOWLIST = ["banda", "solo", "dj", "generico", "custom"];
const MAX_CLAUSULAS = 50;
const MAX_NOME = 200;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const template = await prisma.contratoTemplate.findFirst({
    where: { id: params.id, artistId: session.user.artistId },
  });

  if (!template) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (body.nome !== undefined) {
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    if (!nome || nome.length > MAX_NOME) {
      return NextResponse.json({ error: "nome inválido (máx 200 caracteres)" }, { status: 400 });
    }
    patch.nome = nome;
  }

  if (body.tipo !== undefined) {
    if (!TIPO_ALLOWLIST.includes(String(body.tipo))) {
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
    }
    patch.tipo = body.tipo;
  }

  if (body.titulo !== undefined) {
    patch.titulo = typeof body.titulo === "string" ? body.titulo.trim() : "Contrato de Prestação de Serviços";
  }

  if (body.clausulas !== undefined) {
    if (!Array.isArray(body.clausulas) || body.clausulas.length === 0) {
      return NextResponse.json({ error: "clausulas deve ser um array não vazio" }, { status: 400 });
    }
    if (body.clausulas.length > MAX_CLAUSULAS) {
      return NextResponse.json({ error: `máximo de ${MAX_CLAUSULAS} cláusulas` }, { status: 400 });
    }
    patch.clausulas = body.clausulas;
  }

  if (body.isDefault !== undefined) {
    patch.isDefault = Boolean(body.isDefault);
    if (patch.isDefault) {
      await prisma.contratoTemplate.updateMany({
        where: { artistId: session.user.artistId },
        data: { isDefault: false },
      });
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nenhum campo para atualizar" }, { status: 400 });
  }

  const result = await prisma.contratoTemplate.updateMany({
    where: { id: params.id, artistId: session.user.artistId },
    data: patch,
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.contratoTemplate.deleteMany({
    where: { id: params.id, artistId: session.user.artistId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
