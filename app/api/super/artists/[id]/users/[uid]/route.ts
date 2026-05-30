import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sendWhatsAppTextMessage, formatWhatsAppNumber } from "@/lib/whatsapp";
import { requestLogger } from "@/lib/logger";

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

        // Mensagem 1: Aviso inicial
        const waMsg1 = `Olá! Sua senha no Formalize foi redefinida.`;
        
        // Mensagem 2: Dados de acesso
        const waMsg2 = `Acesse: ${appUrl}/login\nE-mail: ${user.email}`;
        
        // Mensagem 3: Apenas a senha (fácil de copiar no mobile)
        const waMsg3 = `${body.password}`;

        const formattedNumber = formatWhatsAppNumber(artist.whatsapp);

        try {
          // Envia primeira mensagem
          await sendWhatsAppTextMessage({
            number: formattedNumber,
            message: waMsg1,
          });

          // Delay 1.5s para simular "digitando"
          await delay(1500);

          // Envia segunda mensagem
          await sendWhatsAppTextMessage({
            number: formattedNumber,
            message: waMsg2,
          });

          // Delay 1.5s para simular "digitando"
          await delay(1500);

          // Envia terceira mensagem (apenas a senha)
          const result = await sendWhatsAppTextMessage({
            number: formattedNumber,
            message: waMsg3,
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
