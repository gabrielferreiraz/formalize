import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveDocumentHtml } from "@/lib/documents/render-html";
import { sendToGotenberg } from "@/lib/gotenberg";
import { getKeyFromUrl, getPublicUrl, uploadToR2 } from "@/lib/r2";
import { logger } from "@/lib/logger";

/** O token público autoriza o contratante a assinar este contrato. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let nomeAssinaturaContratante: unknown;
  try {
    ({ nomeAssinaturaContratante } = await req.json());
  } catch {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (
    typeof nomeAssinaturaContratante !== "string" ||
    nomeAssinaturaContratante.trim().length < 3 ||
    nomeAssinaturaContratante.trim().length > 120
  ) {
    return NextResponse.json({ error: "Digite seu nome completo para assinar." }, { status: 400 });
  }

  const doc = await prisma.document.findUnique({
    where: { publicToken: token },
    select: { id: true, artistId: true, type: true, data: true, pdfUrl: true, approvedAt: true },
  });
  if (!doc || doc.type !== "CONTRACT") return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  if (doc.approvedAt) return NextResponse.json({ error: "Este contrato já foi assinado." }, { status: 409 });

  const data = { ...(doc.data as Record<string, unknown>), nomeAssinaturaContratante: nomeAssinaturaContratante.trim() };
  const html = await resolveDocumentHtml(doc.artistId, doc.type, data);
  if (!html) return NextResponse.json({ error: "Não foi possível preparar o contrato para assinatura." }, { status: 500 });

  try {
    const pdf = await sendToGotenberg(html);
    const key = doc.pdfUrl ? getKeyFromUrl(doc.pdfUrl) : `documents/${doc.artistId}/${doc.id}.pdf`;
    await uploadToR2(key, pdf, "application/pdf");

    const updated = await prisma.document.updateMany({
      where: { id: doc.id, approvedAt: null },
      data: { data, pdfUrl: getPublicUrl(key), approvedAt: new Date() },
    });
    if (updated.count !== 1) return NextResponse.json({ error: "Este contrato já foi assinado." }, { status: 409 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err, docId: doc.id, action: "document.public.sign" }, "failed to sign public contract");
    return NextResponse.json({ error: "Não foi possível salvar sua assinatura. Tente novamente." }, { status: 500 });
  }
}
