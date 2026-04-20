import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const doc = await prisma.document.findFirst({
    where: { id, artistId: session.user.artistId },
    select: { id: true, type: true, title: true, pdfUrl: true, createdAt: true, data: true },
  });

  if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(doc);
}
