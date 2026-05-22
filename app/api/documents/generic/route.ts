import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, data, time, notes } = await req.json();

  if (!title || !data) {
    return NextResponse.json({ error: "Título e data são obrigatórios" }, { status: 400 });
  }

  try {
    const document = await prisma.document.create({
      data: {
        artistId: session.user.artistId,
        type: "GENERIC_EVENT",
        title,
        data: {
          data,
          horario: time || "",
          notes: notes || "",
        },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("[generic-event-create] Error:", error);
    return NextResponse.json({ error: "Erro ao criar evento" }, { status: 500 });
  }
}
