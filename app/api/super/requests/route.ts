import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendWhatsAppTextMessage, formatWhatsAppNumber } from "@/lib/whatsapp";
import { BCRYPT_COST } from "@/lib/password";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.artistRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status, rejectedNote, sendWhatsApp } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 });
  }

  let firstLoginLink: string | null = null;

  if (status === "APPROVED") {
    const request = await prisma.artistRequest.findUnique({ where: { id } });
    if (!request) return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });

    // Random unguessable password — artist will never use it, they set their own via the magic link
    const hashedPassword = await bcrypt.hash(randomBytes(32).toString("hex"), BCRYPT_COST);

    let firstLoginToken: { token: string } | null = null;

    try { await prisma.$transaction(async (tx) => {
      const artist = await tx.artist.create({
        data: {
          name: request.artistName,
          email: request.email,
          whatsapp: request.whatsapp,
          source: "LP",
          ...(request.categoria ? { categoria: request.categoria } : {}),
        },
      });

      await tx.user.create({
        data: {
          email: request.email,
          password: hashedPassword,
          name: request.name,
          role: "ARTIST_ADMIN",
          artistId: artist.id,
          forcePasswordChange: true,
        },
      });

      // First-login token: 48h TTL so artist has time to set password
      firstLoginToken = await tx.passwordResetToken.create({
        data: {
          email: request.email,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });
    }); } catch (err) {
      const msg = err instanceof Error && err.message.includes("Unique constraint")
        ? "E-mail já possui uma conta ativa."
        : "Erro ao criar a conta. Tente novamente.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_ROOT_DOMAIN
      ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
      : "https://app.formalize.com.br";

    firstLoginLink = firstLoginToken
      ? `${appUrl}/reset-password?token=${(firstLoginToken as { token: string }).token}`
      : null;

    const updated = await prisma.artistRequest.update({
      where: { id },
      data: { status, rejectedNote: rejectedNote ?? null },
    });

    let whatsappSent = false;
    if (sendWhatsApp !== false && firstLoginLink) {
      const to = formatWhatsAppNumber(request.whatsapp);
      const msg = `Olá, ${request.name}! 🎉 Seu acesso ao *Formalize* foi aprovado!\n\nClique no link abaixo para definir sua senha e entrar:\n${firstLoginLink}\n\n_(Link válido por 48 horas)_\n\n📲 *Dica:* depois de entrar, instale o app tocando em "Adicionar à tela inicial" para acesso rápido no dia a dia!`;
      const r = await sendWhatsAppTextMessage({ number: to, message: msg });
      whatsappSent = !!r;
    }

    return NextResponse.json({ ...updated, whatsappSent, firstLoginLink });
  }

  const updated = await prisma.artistRequest.update({
    where: { id },
    data: { status, rejectedNote: rejectedNote ?? null },
  });

  return NextResponse.json({ ...updated, whatsappSent: false, firstLoginLink: null });
}
