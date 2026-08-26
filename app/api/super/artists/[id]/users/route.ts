import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { BCRYPT_COST } from "@/lib/password";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const { id: artistId } = await params;
  const { name, email, password, forcePasswordChange } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "email e password são obrigatórios" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });

  const hashed = await hash(password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: name ?? email,
      role: "ARTIST_ADMIN",
      artistId,
      forcePasswordChange: forcePasswordChange ?? true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      forcePasswordChange: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
