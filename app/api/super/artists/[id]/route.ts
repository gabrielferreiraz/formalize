import { NextRequest, NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  forcePasswordChange: true,
  createdAt: true,
} as const;

export async function GET(_: NextRequest, { params }: Ctx) {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const { id } = await params;

  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      users: { select: USER_SELECT, orderBy: { createdAt: "asc" } },
      _count: { select: { documents: true } },
    },
  });

  if (!artist) return NextResponse.json({ error: "Artista não encontrado" }, { status: 404 });

  return NextResponse.json(artist);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "name", "status", "logoUrl", "backgroundUrl", "primaryColor", "secondaryColor",
    "whatsapp", "email", "instagram", "spotify", "x", "youtube", "website",
    "pixKey", "legalName", "cnpj", "basePdfUrl", "baseContractPdfUrl",
    "paperWidth", "paperHeight", "instruments",
    "planLabel", "billingCycleMonths", "planStartDate",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  try {
    const artist = await prisma.artist.update({
      where: { id },
      data,
      include: {
        users: { select: USER_SELECT, orderBy: { createdAt: "asc" } },
        _count: { select: { documents: true } },
      },
    });
    return NextResponse.json(artist);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
