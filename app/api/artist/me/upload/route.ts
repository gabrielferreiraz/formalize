import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, getPublicUrl } from "@/lib/r2";

const ASSET_MAP: Record<string, { key: (id: string) => string; field: string; mime: string }> = {
  logo: {
    key: (id) => `assets/${id}/logo.png`,
    field: "logoUrl",
    mime: "image/png",
  },
  background: {
    key: (id) => `assets/${id}/background.jpg`,
    field: "backgroundUrl",
    mime: "image/jpeg",
  },
  basePdf: {
    key: (id) => `assets/${id}/base.pdf`,
    field: "basePdfUrl",
    mime: "application/pdf",
  },
  baseContractPdf: {
    key: (id) => `assets/${id}/base-contrato.pdf`,
    field: "baseContractPdfUrl",
    mime: "application/pdf",
  },
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const type = formData.get("type") as string;
  const file = formData.get("file") as File | null;

  if (!type || !ASSET_MAP[type]) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const asset = ASSET_MAP[type];
  const artistId = session.user.artistId;
  const key = asset.key(artistId);

  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadToR2(key, buffer, asset.mime);
  const url = getPublicUrl(key);

  await prisma.artist.update({
    where: { id: artistId },
    data: { [asset.field]: url },
  });

  return NextResponse.json({ ok: true, url });
}
