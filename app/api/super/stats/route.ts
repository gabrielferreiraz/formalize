import { NextResponse } from "next/server";
import { assertSuperAdmin } from "@/lib/super-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await assertSuperAdmin();
  if (error) return error;

  const [artists, documents, pendingRequests] = await Promise.all([
    prisma.artist.groupBy({ by: ["status"], _count: true }),
    prisma.document.count(),
    prisma.artistRequest.count({ where: { status: "PENDING" } }),
  ]);

  const artistCounts = Object.fromEntries(artists.map((a) => [a.status, a._count]));

  return NextResponse.json({
    artists: {
      total: artists.reduce((s, a) => s + a._count, 0),
      active: artistCounts["ACTIVE"] ?? 0,
      suspended: artistCounts["SUSPENDED"] ?? 0,
      cancelled: artistCounts["CANCELLED"] ?? 0,
    },
    documents,
    pendingRequests,
  });
}
