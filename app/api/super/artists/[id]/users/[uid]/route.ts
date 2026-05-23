import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

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

  return NextResponse.json(updated);
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
