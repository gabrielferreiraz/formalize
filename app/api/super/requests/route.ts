import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.artistRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status, rejectedNote, initialPassword } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 });
  }

  // When approving, create the Artist + User records
  if (status === "APPROVED") {
    if (!initialPassword || initialPassword.length < 6) {
      return NextResponse.json(
        { error: "Defina uma senha inicial (mínimo 6 caracteres) para criar o acesso." },
        { status: 400 }
      );
    }

    const request = await prisma.artistRequest.findUnique({ where: { id } });
    if (!request) return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });

    // Check if subdomain is already taken
    const existing = await prisma.artist.findUnique({ where: { subdomain: request.subdomain } });
    if (existing) {
      return NextResponse.json(
        { error: `Subdomínio "${request.subdomain}" já está em uso. Edite-o antes de aprovar.` },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(initialPassword, 12);

    await prisma.$transaction(async (tx) => {
      const artist = await tx.artist.create({
        data: {
          name: request.artistName,
          subdomain: request.subdomain,
          email: request.email,
          whatsapp: request.whatsapp,
          source: "LP",
          ...(request.categoria ? { categoria: request.categoria } : {}),
        },
      });

      await tx.user.create({
        data: {
          email: request.email,
          password: hashedPassword,
          name: request.name,
          role: "ARTIST_ADMIN",
          artistId: artist.id,
          forcePasswordChange: true,
        },
      });
    });
  }

  const updated = await prisma.artistRequest.update({
    where: { id },
    data: { status, rejectedNote: rejectedNote ?? null },
  });

  return NextResponse.json(updated);
}
