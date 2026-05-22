import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function nextBillingDate(planStartDate: Date, cycleMonths: number): Date {
  const now = new Date();
  const start = new Date(planStartDate);
  const next = new Date(start);

  while (next <= now) {
    next.setMonth(next.getMonth() + cycleMonths);
  }
  return next;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [artists, monthlyDocs] = await Promise.all([
    prisma.artist.findMany({
      include: {
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    // Documents created per month, last 6 months, grouped by type
    prisma.$queryRaw<{ month: string; type: string; count: bigint }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        type,
        COUNT(*) AS count
      FROM "Document"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY month, type
      ORDER BY month ASC
    `,
  ]);

  // Per-artist budget/contract counts
  const docTypeCounts = await prisma.document.groupBy({
    by: ["artistId", "type"],
    _count: true,
  });

  const countMap: Record<string, { BUDGET: number; CONTRACT: number; total: number }> = {};
  for (const row of docTypeCounts) {
    if (!countMap[row.artistId]) countMap[row.artistId] = { BUDGET: 0, CONTRACT: 0, total: 0 };
    if (row.type === "BUDGET") countMap[row.artistId].BUDGET = row._count;
    if (row.type === "CONTRACT") countMap[row.artistId].CONTRACT = row._count;
    countMap[row.artistId].total += row._count;
  }

  const artistsWithBilling = artists.map((a) => {
    const billing = nextBillingDate(a.planStartDate, a.billingCycleMonths);
    const daysUntil = Math.ceil((billing.getTime() - Date.now()) / 86_400_000);
    const counts = countMap[a.id] ?? { BUDGET: 0, CONTRACT: 0, total: 0 };
    return {
      id: a.id,
      name: a.name,
      subdomain: a.subdomain,
      status: a.status,
      planLabel: a.planLabel,
      planStartDate: a.planStartDate.toISOString(),
      billingCycleMonths: a.billingCycleMonths,
      nextBillingDate: billing.toISOString(),
      daysUntilBilling: daysUntil,
      createdAt: a.createdAt.toISOString(),
      users: a.users,
      budgets: counts.BUDGET,
      contracts: counts.CONTRACT,
      totalDocs: counts.total,
    };
  });

  // Build monthly chart data
  const monthMap: Record<string, { month: string; BUDGET: number; CONTRACT: number }> = {};
  for (const row of monthlyDocs) {
    const m = row.month;
    if (!monthMap[m]) monthMap[m] = { month: m, BUDGET: 0, CONTRACT: 0 };
    if (row.type === "BUDGET") monthMap[m].BUDGET = Number(row.count);
    if (row.type === "CONTRACT") monthMap[m].CONTRACT = Number(row.count);
  }
  const chartMonthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

  const totalBudgets = artistsWithBilling.reduce((s, a) => s + a.budgets, 0);
  const totalContracts = artistsWithBilling.reduce((s, a) => s + a.contracts, 0);

  return NextResponse.json({
    artists: artistsWithBilling,
    chartMonthly,
    totals: {
      artists: artists.length,
      active: artists.filter((a) => a.status === "ACTIVE").length,
      suspended: artists.filter((a) => a.status === "SUSPENDED").length,
      budgets: totalBudgets,
      contracts: totalContracts,
      billingNext7: artistsWithBilling.filter((a) => a.daysUntilBilling <= 7).length,
    },
  });
}
