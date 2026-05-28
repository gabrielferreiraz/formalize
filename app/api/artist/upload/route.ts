import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import sharp from "sharp";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { requestLogger, getRequestId } from "@/lib/logger";

async function normalizeLogo(input: Buffer): Promise<Buffer> {
  const MAX_W = 1200, MAX_H = 480, MIN_LONGEST = 280;
  try {
    const meta = await sharp(input).metadata();
    const w = meta.width ?? 1, h = meta.height ?? 1;
    let targetW = w, targetH = h;
    if (w > MAX_W || h > MAX_H) {
      const scale = Math.min(MAX_W / w, MAX_H / h);
      targetW = Math.round(w * scale);
      targetH = Math.round(h * scale);
    }
    const longest = Math.max(targetW, targetH);
    if (longest < MIN_LONGEST) {
      const up = Math.min(MIN_LONGEST / longest, 4);
      targetW = Math.round(targetW * up);
      targetH = Math.round(targetH * up);
    }
    const needsResize = targetW !== w || targetH !== h;
    return needsResize
      ? await sharp(input).resize(targetW, targetH, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 6 }).toBuffer()
      : await sharp(input).png({ compressionLevel: 6 }).toBuffer();
  } catch {
    return input;
  }
}

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

  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;

  if (!file || !type) {
    log.warn({ hasFile: !!file, type }, "missing file or type");
    return NextResponse.json({ error: "Faltam campos" }, { status: 400 });
  }

  let key = "";
  let dbField = "";

  switch (type) {
    case "logo":
      key = `assets/${artistId}/logo.png`;
      dbField = "logoUrl";
      break;
    case "background":
      key = `assets/${artistId}/background.jpg`;
      dbField = "backgroundUrl";
      break;
    case "base-pdf":
      key = `assets/${artistId}/base.pdf`;
      dbField = "basePdfUrl";
      break;
    case "base-contrato-pdf":
      key = `assets/${artistId}/base-contrato.pdf`;
      dbField = "baseContractPdfUrl";
      break;
    default:
      log.warn({ type }, "invalid asset type");
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  log.info({ type, key, fileSizeBytes: file.size }, "asset upload started");

  try {
    let buffer: Buffer = Buffer.from(await file.arrayBuffer());
    let mimeType = file.type;
    if (type === "logo") {
      buffer = await normalizeLogo(buffer);
      mimeType = "image/png";
    }
    const uploadedKey = await uploadToR2(key, buffer, mimeType);
    const publicUrl = getPublicUrl(uploadedKey);

    await prisma.artist.update({
      where: { id: artistId },
      data: { [dbField]: publicUrl },
    });

    log.info({ type, key }, "asset uploaded successfully");
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    log.error({ err, type, key }, "asset upload failed");
    return NextResponse.json({ error: "Erro ao fazer upload. Tente novamente." }, { status: 500 });
  }
}
