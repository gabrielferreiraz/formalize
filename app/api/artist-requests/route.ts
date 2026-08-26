import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";
import { logger } from "@/lib/logger";

// Simple in-memory rate limit: 5 requests per IP per 15 min
const ipMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || entry.resetAt < now) {
    ipMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

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
    logger.warn({ err, action: "notify.new-request" }, "WhatsApp admin notification failed");
  });

  return NextResponse.json({ ok: true });
}
