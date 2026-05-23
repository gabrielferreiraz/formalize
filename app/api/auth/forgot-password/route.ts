import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_HOURS = 2;

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });

  // Always return success to avoid user enumeration
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim() },
    select: { id: true },
  });

  if (user) {
    // Invalidate any previous unused tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase().trim(), usedAt: null },
    });

    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase().trim(),
        expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
