import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sendWhatsAppTextMessage, formatWhatsAppNumber } from "@/lib/whatsapp";
import { requestLogger } from "@/lib/logger";
import { BCRYPT_COST } from "@/lib/password";

const TOKEN_TTL_HOURS = 2;

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

  const log = requestLogger({ action: "super.user.patch" });
  const { id: artistId, uid } = await params;
  const body = await req.json();

  const user = await prisma.user.findFirst({ where: { id: uid, artistId } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.email !== undefined) data.email = body.email;
  if (body.password) data.password = await hash(body.password, BCRYPT_COST);
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.forcePasswordChange === "boolean") data.forcePasswordChange = body.forcePasswordChange;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: uid },
      data,
      select: USER_SELECT,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }
    throw err;
  }

  // Helper function to add delays
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
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

        // Nunca envia a senha em texto puro pelo WhatsApp — gera um link de
        // reset de uso único (mesmo fluxo self-service de forgot-password) e
        // deixa o próprio usuário definir a senha final.
        await prisma.passwordResetToken.deleteMany({
          where: { email: user.email, usedAt: null },
        });
        const resetToken = await prisma.passwordResetToken.create({
          data: {
            email: user.email,
            expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000),
          },
        });
        const resetLink = `${appUrl}/reset-password?token=${resetToken.token}`;

        // Mensagem 1: Aviso inicial
        const waMsg1 = `Olá! Sua senha no Formalize foi redefinida por um administrador.`;

        // Mensagem 2: Link para o usuário definir a própria senha nova
        const waMsg2 = `🔑 Clique no link abaixo para criar sua nova senha:\n${resetLink}\n\n_(Válido por ${TOKEN_TTL_HOURS} horas)_`;

        const formattedNumber = formatWhatsAppNumber(artist.whatsapp);

        try {
          // Envia primeira mensagem
          await sendWhatsAppTextMessage({
            number: formattedNumber,
            message: waMsg1,
          });

          // Delay 1.5s para simular "digitando"
          await delay(1500);

          // Envia segunda mensagem (link de reset)
          const result = await sendWhatsAppTextMessage({
            number: formattedNumber,
            message: waMsg2,
          });

          if (result) {
            whatsappStatus = { sent: true };
          } else {
            whatsappStatus = { sent: false, message: "Falha ao enviar mensagem WhatsApp" };
          }
        } catch (err) {
          log.error({ err }, "Error sending WhatsApp messages");
          whatsappStatus = { sent: false, message: "Falha ao enviar mensagens WhatsApp" };
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
