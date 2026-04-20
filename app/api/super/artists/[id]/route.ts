import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.status) {
    return NextResponse.json({ error: "Status não fornecido" }, { status: 400 });
  }

  try {
    const artist = await prisma.artist.update({
      where: { id: params.id },
      data: { status: body.status },
    });
    return NextResponse.json(artist);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
