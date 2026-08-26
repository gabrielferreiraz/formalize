import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { requestLogger, getRequestId } from "@/lib/logger";
import { BCRYPT_COST } from "@/lib/password";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expirado ou inválido" }, { status: 400 });
  }

  return NextResponse.json({ email: record.email });
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const log = requestLogger({ requestId, action: "auth.resetPassword" });

  let body: { token?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    log.warn("invalid JSON body");
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { token, newPassword } = body;

  if (!token || !newPassword || newPassword.length < 6) {
    log.warn({ hasToken: !!token, passwordLength: newPassword?.length }, "invalid reset-password payload");
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    log.warn({ tokenExpired: !!record?.expiresAt && record.expiresAt < new Date(), tokenUsed: !!record?.usedAt }, "invalid or expired reset token");
    return NextResponse.json({ error: "Link expirado ou inválido" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email: record.email },
    select: { id: true },
  });

  if (!user) {
    log.error({ action: "auth.resetPassword" }, "user not found for valid reset token — data inconsistency");
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  try {
    const hashed = await hash(newPassword, BCRYPT_COST);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashed, forcePasswordChange: false },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    log.info({ userId: user.id }, "password reset completed");
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err, userId: user.id }, "password reset transaction failed");
    return NextResponse.json({ error: "Erro ao redefinir senha. Tente novamente." }, { status: 500 });
  }
}
