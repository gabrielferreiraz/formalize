import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const artistId = req.nextUrl.searchParams.get("artistId");
  if (!artistId) {
    return NextResponse.json({ error: "artistId é obrigatório" }, { status: 400 });
  }

  const mappings = await prisma.pdfTemplateMapping.findMany({
    where: { artistId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, artistId: true, type: true, name: true,
      pdfUrl: true, pageCount: true, isActive: true,
      createdAt: true, updatedAt: true,
      fields: true,
    },
  });

  return NextResponse.json(mappings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { artistId, type, name, pdfUrl, pageCount } = body;

  if (!artistId || !type || !name || !pdfUrl) {
    return NextResponse.json({ error: "artistId, type, name e pdfUrl são obrigatórios" }, { status: 400 });
  }

  const mapping = await prisma.pdfTemplateMapping.create({
    data: {
      artistId,
      type,
      name,
      pdfUrl,
      pageCount: pageCount ?? 1,
      fields: [],
      isActive: false,
    },
  });

  return NextResponse.json(mapping, { status: 201 });
}
