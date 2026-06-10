import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTextMessage, formatWhatsAppNumber } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { requestId } = await req.json();
  if (!requestId) return NextResponse.json({ error: "requestId obrigatório" }, { status: 400 });

  const artistRequest = await prisma.artistRequest.findUnique({ where: { id: requestId } });
  if (!artistRequest || artistRequest.status !== "APPROVED") {
    return NextResponse.json({ error: "Solicitação não encontrada ou não aprovada" }, { status: 404 });
  }

  // Revoke any existing unused tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email: artistRequest.email, usedAt: null },
  });

  const token = await prisma.passwordResetToken.create({
    data: {
      email: artistRequest.email,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
    : "https://app.formalize.com.br";

  const firstLoginLink = `${appUrl}/reset-password?token=${token.token}`;

  const msg = `Olá, ${artistRequest.name}! 🎉 Seu acesso ao *Formalize* foi aprovado!\n\nClique no link abaixo para definir sua senha e entrar:\n${firstLoginLink}\n\n_(Link válido por 48 horas)_\n\n📲 *Dica:* depois de entrar, instale o app tocando em "Adicionar à tela inicial" para acesso rápido no dia a dia!`;

  const r = await sendWhatsAppTextMessage({
    number: formatWhatsAppNumber(artistRequest.whatsapp),
    message: msg,
  });

  return NextResponse.json({ firstLoginLink, whatsappSent: !!r });
}
