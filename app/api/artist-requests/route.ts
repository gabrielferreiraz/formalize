import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let body: { name: string; email: string; whatsapp: string; artistName: string; message?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { name, email, whatsapp, artistName, message } = body;

  if (!name?.trim() || !email?.trim() || !whatsapp?.trim() || !artistName?.trim()) {
    return NextResponse.json({ error: "Preencha todos os campos obrigatórios" }, { status: 400 });
  }

  const subdomain = artistName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") || "sem-subdomain";

  await prisma.artistRequest.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      artistName: artistName.trim(),
      subdomain,
      message: message?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true });
}
