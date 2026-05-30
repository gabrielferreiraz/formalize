import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requestLogger, getRequestId } from "@/lib/logger";
import { sendWhatsAppTextMessage, formatWhatsAppNumber } from "@/lib/whatsapp";

const TOKEN_TTL_HOURS = 2;

// Simple in-memory rate limit: 3 requests per IP per 15 min
const ipMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || entry.resetAt < now) {
    ipMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = requestLogger({ requestId, action: "auth.forgotPassword" });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!rateLimit(ip)) {
    log.warn({ ip }, "rate limit exceeded for forgot-password");
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    log.warn("invalid JSON body");
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { email } = body;

  if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    log.warn("invalid email format in forgot-password request");
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  // Always return success to avoid user enumeration
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, artistId: true },
  });

  if (user) {
    try {
      await prisma.passwordResetToken.deleteMany({
        where: { email: email.toLowerCase().trim(), usedAt: null },
      });

      const resetToken = await prisma.passwordResetToken.create({
        data: {
          email: email.toLowerCase().trim(),
          expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000),
        },
      });

      // Log without email to avoid PII in logs
      log.info({ userId: user.id }, "password reset token created");

      // Helper function to add delays
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Busca o artista para obter o WhatsApp
      if (user.artistId) {
        const artist = await prisma.artist.findUnique({
          where: { id: user.artistId },
          select: { whatsapp: true, name: true },
        });

        if (artist?.whatsapp) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
          const resetLink = `${appUrl}/reset-password?token=${resetToken.token}`;

          // Mensagem 1: Aviso inicial
          const waMsg1 = `Olá! Você solicitou a redefinição de senha no Formalize.`;
          
          // Mensagem 2: Link de redefinição
          const waMsg2 = `Link para redefinir senha:\n${resetLink}`;
          
          // Mensagem 3: Aviso de validade
          const waMsg3 = `Este link é válido por ${TOKEN_TTL_HOURS} horas.`;

          const formattedNumber = formatWhatsAppNumber(artist.whatsapp);
          
          try {
            // Envia primeira mensagem
            await sendWhatsAppTextMessage({
              number: formattedNumber,
              message: waMsg1,
            });
            
            await delay(1500);
            
            await sendWhatsAppTextMessage({
              number: formattedNumber,
              message: waMsg2,
            });
            
            await delay(1500);
            
            await sendWhatsAppTextMessage({
              number: formattedNumber,
              message: waMsg3,
            });
            
          } catch (err) {
            log.error({ err }, "Error sending WhatsApp messages for password reset");
          }
        }
      }
    } catch (err) {
      log.error({ err }, "failed to create password reset token or send WhatsApp message");
      // Still return success to avoid enumeration
    }
  } else {
    // Don't log "user not found" to avoid enumeration via log inspection
    log.debug("forgot-password request for unknown email (returning success)");
  }

  return NextResponse.json({ ok: true });
}
