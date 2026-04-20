import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // BUDGET | CONTRACT | all
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  const where = {
    artistId: session.user.artistId,
    ...(type && type !== "all" ? { type: type as "BUDGET" | "CONTRACT" } : {}),
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        pdfUrl: true,
        sentAt: true,
        createdAt: true,
      },
    }),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json({ documents, total, page, pages: Math.ceil(total / limit) });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const doc = await prisma.document.findFirst({
    where: { id, artistId: session.user.artistId },
  });
  if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
