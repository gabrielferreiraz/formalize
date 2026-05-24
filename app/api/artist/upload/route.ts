import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { requestLogger, getRequestId } from "@/lib/logger";

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
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadedKey = await uploadToR2(key, buffer, file.type);
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
