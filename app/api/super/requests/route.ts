import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const { id, status, rejectedNote } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 });
  }

  const updated = await prisma.artistRequest.update({
    where: { id },
    data: { status, rejectedNote: rejectedNote ?? null },
  });

  return NextResponse.json(updated);
}
