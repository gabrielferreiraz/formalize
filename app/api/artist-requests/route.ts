import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  let body: { name: string; email: string; whatsapp: string; artistName: string; message?: string; categoria?: string; temContrato?: boolean };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { name, email, whatsapp, artistName, message, categoria, temContrato } = body;

  if (!name?.trim() || !email?.trim() || !whatsapp?.trim() || !artistName?.trim()) {
    return NextResponse.json({ error: "Preencha todos os campos obrigatórios" }, { status: 400 });
  }

  // Reject duplicate submissions from the same email that are still pending or already approved
  const existing = await prisma.artistRequest.findFirst({
    where: { email: email.trim(), status: { in: ["PENDING", "APPROVED"] } },
    select: { id: true, status: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === "APPROVED"
            ? "Este e-mail j\u00e1 possui uma conta ativa no Formalize."
            : "J\u00e1 existe uma solicita\u00e7\u00e3o pendente com este e-mail. Aguarde o contato da nossa equipe.",
      },
      { status: 409 }
    );
  }

  await prisma.artistRequest.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      artistName: artistName.trim(),
      message: message?.trim() || null,
      categoria: categoria?.trim() || null,
      temContrato: temContrato === true,
    },
  });

  // Notify owner — fire and forget, never blocks the response
  const appUrl = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
    : "https://app.formalize.com.br";

  const lines = [
    "🎵 *Nova solicitação no Formalize!*",
    "",
    `*Nome:* ${name.trim()}`,
    `*Artista:* ${artistName.trim()}`,
    ...(categoria?.trim() ? [`*Categoria:* ${categoria.trim()}`] : []),
    `*WhatsApp:* ${whatsapp.trim()}`,
    `*E-mail:* ${email.trim()}`,
    `*Tem contrato próprio:* ${temContrato ? "Sim ✅" : "Não"}`,
    ...(message?.trim() ? ["", `*Mensagem:* "${message.trim()}"`] : []),
    "",
    `👉 ${appUrl}/super-admin/solicitacoes`,
  ];

  sendWhatsAppTextMessage({
    number: process.env.ADMIN_NOTIFY_WHATSAPP ?? "5567981783902",
    message: lines.join("\n"),
  }).catch((err: unknown) => {
    const { logger } = require("@/lib/logger");
    logger.warn({ err, action: "notify.new-request" }, "WhatsApp admin notification failed");
  });

  return NextResponse.json({ ok: true });
}
