import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Registra uma visualização da página pública de um documento.
 * Chamado via navigator.sendBeacon — sem corpo, sem sessão. O token em si é
 * a única barreira de acesso (ver lib/documents/public-token.ts).
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const doc = await prisma.document.findUnique({
    where: { publicToken: token },
    select: { id: true, viewedAt: true },
  }).catch(() => null);

  if (!doc) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.document
    .update({
      where: { id: doc.id },
      data: { viewCount: { increment: 1 }, viewedAt: doc.viewedAt ?? new Date() },
    })
    .catch((err) => {
      logger.warn({ err, docId: doc.id, action: "document.view.track" }, "failed to record document view");
    });

  return NextResponse.json({ ok: true });
}
