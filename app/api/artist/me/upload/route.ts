import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { requestLogger, getRequestId } from "@/lib/logger";

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
  const requestId = getRequestId(req);
  const session = await getServerSession(authOptions);

  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artistId = session.user.artistId;
  const log = requestLogger({ requestId, artistId, action: "upload.asset" });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    log.warn({ err }, "failed to parse form data");
    return NextResponse.json({ error: "Formulário inválido" }, { status: 400 });
  }

  const type = formData.get("type") as string;
  const file = formData.get("file") as File | null;

  if (!type || !ASSET_MAP[type]) {
    log.warn({ type }, "invalid asset type");
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!file) {
    log.warn({ type }, "file not provided");
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const asset = ASSET_MAP[type];
  const key = asset.key(artistId);

  log.info({ type, key, fileSizeBytes: file.size }, "asset upload started");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, asset.mime);
    const url = getPublicUrl(key);

    await prisma.artist.update({
      where: { id: artistId },
      data: { [asset.field]: url },
    });

    log.info({ type, key }, "asset uploaded successfully");
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    log.error({ err, type, key }, "asset upload failed");
    return NextResponse.json({ error: "Erro ao fazer upload. Tente novamente." }, { status: 500 });
  }
}
