import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function endOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.artistId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  const type = searchParams.get("type");

  const baseDate = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();
  const from = startOfMonth(baseDate);
  const to = endOfMonth(baseDate);

  const where = {
    artistId: session.user.artistId,
    createdAt: { gte: from, lte: to },
    ...(type && type !== "all" ? { type: type as "BUDGET" | "CONTRACT" } : {}),
  };

  const docs = await prisma.document.findMany({
    where,
    select: { type: true, createdAt: true, sentAt: true },
  });

  const totalGenerated = docs.length;
  const totalBudgets = docs.filter((d) => d.type === "BUDGET").length;
  const totalContracts = docs.filter((d) => d.type === "CONTRACT").length;
  const totalSigned = docs.filter((d) => d.type === "CONTRACT" && d.sentAt).length;
  const signRate = totalContracts > 0 ? Math.round((totalSigned / totalContracts) * 10000) / 100 : 0;

  return NextResponse.json({
    month: from.toISOString().slice(0, 7),
    totalGenerated,
    totalBudgets,
    totalContracts,
    totalSigned,
    signRate,
  });
}
