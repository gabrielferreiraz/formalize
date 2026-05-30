import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sendWhatsAppTextMessage, formatWhatsAppNumber } from "@/lib/whatsapp";

type Ctx = { params: Promise<{ id: string; uid: string }> };

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  forcePasswordChange: true,
  createdAt: true,
} as const;

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const { id: artistId, uid } = await params;
  const body = await req.json();

  const user = await prisma.user.findFirst({ where: { id: uid, artistId } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.password) data.password = await hash(body.password, 12);
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.forcePasswordChange === "boolean") data.forcePasswordChange = body.forcePasswordChange;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: uid },
    data,
    select: USER_SELECT,
  });

  // If password was updated, send WhatsApp message
  let whatsappStatus: { sent: boolean; message?: string } = { sent: false };
  if (body.password) {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { whatsapp: true },
    });

    if (!artist?.whatsapp) {
      whatsappStatus = { sent: false, message: "WhatsApp do artista não cadastrado" };
    } else {
      const appUrl = process.env.NEXT_PUBLIC_ROOT_DOMAIN
        ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
        : process.env.NEXTAUTH_URL || "http://localhost:3000";

      const waMsg1 = `Olá! Sua senha no *Formalize* foi redefinida.\n\nAcesse pelo link:\n${appUrl}/login\n\nSeu e-mail de login: *${user.email}*\n\nVou enviar sua nova senha temporária na próxima mensagem.`;
      const waMsg2 = `🔑 Sua nova senha temporária:\n\n*${body.password}*\n\nNo próximo login você será solicitado a criar uma senha nova.`;

      const formattedNumber = formatWhatsAppNumber(artist.whatsapp);

      // Send first message
      await sendWhatsAppTextMessage({
        number: formattedNumber,
        message: waMsg1,
      });

      // Send second message with password
      const result = await sendWhatsAppTextMessage({
        number: formattedNumber,
        message: waMsg2,
      });

      if (result) {
        whatsappStatus = { sent: true };
      } else {
        whatsappStatus = { sent: false, message: "Falha ao enviar mensagem WhatsApp" };
      }
    }
  }

  return NextResponse.json({ ...updated, whatsappStatus });
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const { id: artistId, uid } = await params;

  const user = await prisma.user.findFirst({ where: { id: uid, artistId } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  await prisma.user.delete({ where: { id: uid } });
  return NextResponse.json({ ok: true });
}
