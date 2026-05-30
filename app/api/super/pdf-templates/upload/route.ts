import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const artistId = form.get("artistId") as string | null;
  const type = form.get("type") as string | null;

  if (!file || !artistId || !type) {
    return NextResponse.json({ error: "file, artistId e type são obrigatórios" }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Apenas arquivos PDF são aceitos" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF deve ter no máximo 20MB" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate magic bytes (%PDF)
  if (buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
    return NextResponse.json({ error: "Arquivo inválido — não é um PDF" }, { status: 400 });
  }

  let pageCount = 1;
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();
  } catch {
    return NextResponse.json({ error: "PDF corrompido ou protegido" }, { status: 400 });
  }

  const key = `assets/${artistId}/pdf-template-${type}-${Date.now()}.pdf`;
  await uploadToR2(key, buffer, "application/pdf");
  const url = getPublicUrl(key);

  return NextResponse.json({ url, pageCount });
}
