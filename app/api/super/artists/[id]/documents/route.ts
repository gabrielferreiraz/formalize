import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const { id: artistId } = await params;
  const page = Math.max(1, parseInt(new URL(req.url).searchParams.get("page") ?? "1", 10));
  const limit = 20;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where: { artistId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, type: true, title: true, pdfUrl: true, createdAt: true },
    }),
    prisma.document.count({ where: { artistId } }),
  ]);

  return NextResponse.json({ documents, total, pages: Math.ceil(total / limit) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const { id: artistId } = await params;
  const { docId } = await req.json();

  const doc = await prisma.document.findFirst({ where: { id: docId, artistId } });
  if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.document.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
