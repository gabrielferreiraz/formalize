import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

type Ctx = { params: Promise<{ id: string; uid: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const { id: artistId, uid } = await params;
  const body = await req.json();

  const user = await prisma.user.findFirst({ where: { id: uid, artistId } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.email) data.email = body.email;
  if (body.password) data.password = await hash(body.password, 12);

  await prisma.user.update({ where: { id: uid }, data });
  return NextResponse.json({ ok: true });
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
