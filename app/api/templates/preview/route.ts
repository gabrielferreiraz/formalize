import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendToGotenberg } from "@/lib/gotenberg";
import { resolvePreviewHtml } from "@/lib/templates/preview-data";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get("id");
  const type = searchParams.get("type") as "orcamento" | "contrato" | null;

  if (!templateId || !type || !["orcamento", "contrato"].includes(type)) {
    return NextResponse.json({ error: "id e type obrigatórios" }, { status: 400 });
  }

  const html = await resolvePreviewHtml(session.user.artistId, templateId, type);
  if (!html) {
    return NextResponse.json({ error: "Artista não encontrado" }, { status: 404 });
  }

  const pdfBuffer = await sendToGotenberg(html);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="preview-${templateId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
