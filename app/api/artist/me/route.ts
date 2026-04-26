import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artist = await prisma.artist.findUnique({
    where: { id: session.user.artistId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      backgroundUrl: true,
      basePdfUrl: true,
      baseContractPdfUrl: true,
      primaryColor: true,
      secondaryColor: true,
      whatsapp: true,
      email: true,
      instagram: true,
      spotify: true,
      x: true,
      youtube: true,
      website: true,
      legalName: true,
      cnpj: true,
      instruments: true,
      address: true,
      bankInfo: true,
      pixKey: true,
      paperWidth: true,
      paperHeight: true,
      contractPaperWidth: true,
      contractPaperHeight: true,
      orcamentoFontScale: true,
      contratoFontScale: true,
      orcamentoLogoScale: true,
      contratoLogoScale: true,
      orcamentoTemplate: true,
      contratoTemplate: true,
    },
  });

  if (!artist) return NextResponse.json({ error: "Artista não encontrado" }, { status: 404 });
  return NextResponse.json(artist);
}

const ALLOWED_FIELDS = [
  "name",
  "whatsapp", "email", "instagram", "spotify", "x", "youtube", "website",
  "legalName", "cnpj", "instruments",
  "address", "bankInfo", "pixKey",
  "paperWidth", "paperHeight",
  "contractPaperWidth", "contractPaperHeight",
  "primaryColor", "secondaryColor",
  "orcamentoFontScale", "contratoFontScale",
  "orcamentoLogoScale", "contratoLogoScale",
  "orcamentoTemplate", "contratoTemplate",
] as const;

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const update: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      if (
        (field === "address" || field === "bankInfo") &&
        typeof body[field] === "object" &&
        body[field] !== null
      ) {
        update[field] = body[field];
      } else {
        update[field] = body[field];
      }
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
  }

  const artist = await prisma.artist.update({
    where: { id: session.user.artistId },
    data: update,
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: artist.id, artist });
}

// Keep PATCH for backwards compat with existing config page
export async function PATCH(req: NextRequest) {
  return PUT(req);
}
