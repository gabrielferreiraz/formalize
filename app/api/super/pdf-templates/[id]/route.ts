import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromR2, getKeyFromUrl } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mapping = await prisma.pdfTemplateMapping.findUnique({
    where: { id: params.id },
    include: { artist: { select: { name: true, legalName: true, cnpj: true, pixKey: true } } },
  });

  if (!mapping) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(mapping);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { fields, isActive, name } = body;

  const current = await prisma.pdfTemplateMapping.findUnique({
    where: { id: params.id },
    select: { artistId: true, type: true },
  });
  if (!current) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // When activating, deactivate all others of same artist+type
  if (isActive === true) {
    await prisma.pdfTemplateMapping.updateMany({
      where: {
        artistId: current.artistId,
        type: current.type,
        id: { not: params.id },
      },
      data: { isActive: false },
    });
  }

  const updated = await prisma.pdfTemplateMapping.update({
    where: { id: params.id },
    data: {
      ...(fields !== undefined && { fields }),
      ...(isActive !== undefined && { isActive }),
      ...(name !== undefined && { name }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mapping = await prisma.pdfTemplateMapping.findUnique({
    where: { id: params.id },
    select: { pdfUrl: true },
  });
  if (!mapping) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Delete PDF from R2
  try {
    const key = getKeyFromUrl(mapping.pdfUrl);
    await deleteFromR2(key);
  } catch {
    // Continue even if R2 delete fails
  }

  await prisma.pdfTemplateMapping.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
