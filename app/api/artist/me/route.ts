import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  const session = await getServerSession(authOptions);
  logger.info({ hasSession: !!session, artistId: session?.user.artistId, userId: session?.user.id, action: "api.artist.me.GET" }, "[DEBUG] GET /api/artist/me — session check");
  if (!session?.user.artistId) {
    logger.warn({ hasSession: !!session, userId: session?.user.id, action: "api.artist.me.GET" }, "[DEBUG] GET /api/artist/me — unauthorized (no artistId in session)");
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
      usarBasePdfOrcamento: true,
      usarBasePdfContrato: true,
      onboardingDone: true,
      categoria: true,
    },
  });

  logger.info({ artistId: session.user.artistId, found: !!artist, onboardingDone: artist?.onboardingDone, action: "api.artist.me.GET" }, "[DEBUG] GET /api/artist/me — db result");
  if (!artist) return NextResponse.json({ error: "Artista não encontrado" }, { status: 404 });
  return NextResponse.json(artist);
}

const ALLOWED_FIELDS = [
  "name",
  "logoUrl", "backgroundUrl",
  "whatsapp", "email", "instagram", "spotify", "x", "youtube", "website",
  "legalName", "cnpj", "instruments",
  "address", "bankInfo", "pixKey",
  "paperWidth", "paperHeight",
  "contractPaperWidth", "contractPaperHeight",
  "primaryColor", "secondaryColor",
  "orcamentoFontScale", "contratoFontScale",
  "orcamentoLogoScale", "contratoLogoScale",
  "orcamentoTemplate", "contratoTemplate",
  "usarBasePdfOrcamento", "usarBasePdfContrato",
  "onboardingDone",
  "categoria",
] as const;

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  logger.info({ hasSession: !!session, artistId: session?.user.artistId, userId: session?.user.id, action: "api.artist.me.PUT" }, "[DEBUG] PUT /api/artist/me — session check");
  if (!session?.user.artistId) {
    logger.warn({ hasSession: !!session, userId: session?.user.id, action: "api.artist.me.PUT" }, "[DEBUG] PUT /api/artist/me — unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  logger.info({ artistId: session.user.artistId, bodyKeys: Object.keys(body), action: "api.artist.me.PUT" }, "[DEBUG] PUT /api/artist/me — body keys received");

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
    logger.warn({ artistId: session.user.artistId, bodyKeys: Object.keys(body), action: "api.artist.me.PUT" }, "[DEBUG] PUT /api/artist/me — no valid fields in body");
    return NextResponse.json({ error: "Nenhum campo válido" }, { status: 400 });
  }

  logger.info({ artistId: session.user.artistId, updateFields: Object.keys(update), action: "api.artist.me.PUT" }, "[DEBUG] PUT /api/artist/me — writing to DB");

  const artist = await prisma.artist.update({
    where: { id: session.user.artistId },
    data: update,
    select: { id: true },
  });

  logger.info({ artistId: session.user.artistId, id: artist.id, action: "api.artist.me.PUT" }, "[DEBUG] PUT /api/artist/me — success");
  return NextResponse.json({ ok: true, id: artist.id, artist });
}

// Keep PATCH for backwards compat with existing config page
export async function PATCH(req: NextRequest) {
  return PUT(req);
}
