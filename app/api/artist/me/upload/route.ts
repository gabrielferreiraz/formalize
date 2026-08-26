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
};

const ALLOWED_MIMES: Record<string, string[]> = {
  logo:            ["image/png", "image/jpeg", "image/webp"],
  background:      ["image/png", "image/jpeg", "image/webp"],
};

const MAX_BYTES: Record<string, number> = {
  logo:            5  * 1024 * 1024,
  background:      10 * 1024 * 1024,
};

function hasValidMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // WebP: RIFF....WEBP
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return true;
  return false;
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

  // Validate file size before reading the entire buffer into memory
  const maxBytes = MAX_BYTES[type];
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    log.warn({ type, fileSizeBytes: file.size, maxBytes }, "file exceeds size limit");
    return NextResponse.json({ error: `Arquivo muito grande. Limite para este campo: ${mb}MB.` }, { status: 400 });
  }

  // Validate declared MIME type against allowlist
  const allowedMimes = ALLOWED_MIMES[type];
  if (!allowedMimes.includes(file.type)) {
    log.warn({ type, receivedMime: file.type }, "MIME type not allowed");
    return NextResponse.json(
      { error: `Formato não aceito. Tipos permitidos: ${allowedMimes.join(", ")}` },
      { status: 400 }
    );
  }

  const asset = ASSET_MAP[type];
  const key = asset.key(artistId);

  log.info({ type, key, fileSizeBytes: file.size }, "asset upload started");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate magic bytes — prevents spoofed MIME types from reaching R2
    if (!hasValidMagicBytes(buffer)) {
      log.warn({ type, fileSizeBytes: buffer.length }, "magic bytes validation failed");
      return NextResponse.json(
        { error: "O arquivo enviado não é válido ou está corrompido." },
        { status: 400 }
      );
    }
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
