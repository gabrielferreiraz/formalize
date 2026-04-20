import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToR2, getPublicUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const artistId = session.user.artistId;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string;

  if (!file || !type) {
    return NextResponse.json({ error: "Faltam campos" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
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
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const uploadedKey = await uploadToR2(key, buffer, file.type);
  const publicUrl = getPublicUrl(uploadedKey);

  await prisma.artist.update({
    where: { id: artistId },
    data: { [dbField]: publicUrl },
  });

  return NextResponse.json({ url: publicUrl });
}
