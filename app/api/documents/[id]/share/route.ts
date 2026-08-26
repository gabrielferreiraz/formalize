import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePublicToken } from "@/lib/documents/public-token";
import { DOC_TYPE_TO_TEMPLATE } from "@/lib/documents/render-html";

function publicUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
    : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  return `${base}/ver/${token}`;
}

/** Retorna (gerando se preciso) o link público de visualização web do documento. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const doc = await prisma.document.findFirst({
    where: { id, artistId: session.user.artistId },
    select: { id: true, publicToken: true, type: true },
  });
  if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (!DOC_TYPE_TO_TEMPLATE[doc.type]) {
    return NextResponse.json({ error: "Este tipo de documento não tem página web" }, { status: 400 });
  }

  let token = doc.publicToken;
  if (!token) {
    token = generatePublicToken();
    await prisma.document.update({ where: { id: doc.id }, data: { publicToken: token } });
  }

  return NextResponse.json({ url: publicUrl(token) });
}
