import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // BUDGET | CONTRACT | all
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limitRaw = parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));
  const includeData = searchParams.get("includeData") === "1" || searchParams.get("includeData") === "true";
  const calendarMode = searchParams.get("calendar") === "1" || searchParams.get("calendar") === "true";

  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : null;
  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : null;

  const where = {
    artistId: session.user.artistId,
    ...(type && type !== "all" ? { type: type as "BUDGET" | "CONTRACT" } : {}),
    ...(fromDate && toDate
      ? {
          OR: [
            { createdAt: { gte: fromDate, lte: toDate } },
            { sentAt: { gte: fromDate, lte: toDate } },
          ],
        }
      : {}),
  };

  const select = {
    id: true,
    type: true,
    title: true,
    pdfUrl: true,
    sentAt: true,
    createdAt: true,
    ...(includeData ? { data: true } : {}),
  } as const;

  const query = {
    where,
    orderBy: { createdAt: "desc" as const },
    select,
    ...(calendarMode
      ? { take: 2000 }
      : { skip: (page - 1) * limit, take: limit }),
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany(query),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json({
    documents,
    total,
    page: calendarMode ? 1 : page,
    pages: calendarMode ? 1 : Math.ceil(total / limit),
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const doc = await prisma.document.findFirst({
    where: { id, artistId: session.user.artistId },
  });
  if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
