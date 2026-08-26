import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolvePreviewHtml } from "@/lib/templates/preview-data";

/**
 * Igual a /api/templates/preview, mas devolve o HTML direto — sem Gotenberg,
 * sem PDF. Usado pelo preview web do onboarding e de /admin/templates.
 */
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

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
