import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mappings = await prisma.pdfTemplateMapping.findMany({
    where: { artistId: session.user.artistId, isActive: true },
    select: { id: true, type: true, name: true, pageCount: true },
  });

  const result: Record<string, { id: string; name: string; pageCount: number } | null> = {
    orcamento: null,
    contrato: null,
  };
  for (const m of mappings) {
    if (m.type === "orcamento" || m.type === "contrato") {
      result[m.type] = { id: m.id, name: m.name, pageCount: m.pageCount };
    }
  }

  return NextResponse.json(result);
}
