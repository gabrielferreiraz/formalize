import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

function nextBillingDate(planStartDate: Date, cycleMonths: number): Date {
  const now = new Date();
  const next = new Date(planStartDate);
  while (next <= now) {
    next.setMonth(next.getMonth() + cycleMonths);
  }
  return next;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  // Run all independent queries in parallel.
  // allArtistsSummary: lightweight (no joins) — used only for global totals.
  // pagedArtists: full detail with users — only current page.
  const [allArtistsSummary, pagedArtists, monthlyDocs, globalDocTotals] = await Promise.all([
    prisma.artist.findMany({
      select: { id: true, status: true, source: true, planStartDate: true, billingCycleMonths: true },
    }),

    prisma.artist.findMany({
      include: {
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),

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

    prisma.document.groupBy({
      by: ["type"],
      _count: true,
      where: { type: { in: ["BUDGET", "CONTRACT"] } },
    }),
  ]);

  // Doc counts only for the artists on the current page — avoids scanning every document row.
  const pagedIds = pagedArtists.map((a) => a.id);
  const pagedDocCounts = pagedIds.length
    ? await prisma.document.groupBy({
        by: ["artistId", "type"],
        _count: true,
        where: { artistId: { in: pagedIds } },
      })
    : [];

  // Build per-artist count map for the current page.
  const countMap: Record<string, { BUDGET: number; CONTRACT: number; total: number }> = {};
  for (const row of pagedDocCounts) {
    if (!countMap[row.artistId]) countMap[row.artistId] = { BUDGET: 0, CONTRACT: 0, total: 0 };
    if (row.type === "BUDGET") countMap[row.artistId].BUDGET = row._count;
    if (row.type === "CONTRACT") countMap[row.artistId].CONTRACT = row._count;
    countMap[row.artistId].total += row._count;
  }

  const artistsWithBilling = pagedArtists.map((a) => {
    const billing = nextBillingDate(a.planStartDate, a.billingCycleMonths);
    const daysUntil = Math.ceil((billing.getTime() - Date.now()) / 86_400_000);
    const counts = countMap[a.id] ?? { BUDGET: 0, CONTRACT: 0, total: 0 };
    return {
      id: a.id,
      name: a.name,
      status: a.status,
      source: a.source,
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

  // Monthly chart
  const monthMap: Record<string, { month: string; BUDGET: number; CONTRACT: number }> = {};
  for (const row of monthlyDocs) {
    const m = row.month;
    if (!monthMap[m]) monthMap[m] = { month: m, BUDGET: 0, CONTRACT: 0 };
    if (row.type === "BUDGET") monthMap[m].BUDGET = Number(row.count);
    if (row.type === "CONTRACT") monthMap[m].CONTRACT = Number(row.count);
  }
  const chartMonthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

  // Global totals computed from the lightweight summary (no joins).
  const totalCount = allArtistsSummary.length;
  const fromLP = allArtistsSummary.filter((a) => a.source === "LP").length;
  const fromManual = allArtistsSummary.filter((a) => a.source !== "LP").length;
  const billingNext7 = allArtistsSummary.filter((a) => {
    const billing = nextBillingDate(a.planStartDate, a.billingCycleMonths);
    return Math.ceil((billing.getTime() - Date.now()) / 86_400_000) <= 7;
  }).length;

  const totalBudgets = globalDocTotals.find((r) => r.type === "BUDGET")?._count ?? 0;
  const totalContracts = globalDocTotals.find((r) => r.type === "CONTRACT")?._count ?? 0;

  return NextResponse.json({
    artists: artistsWithBilling,
    chartMonthly,
    totals: {
      artists: totalCount,
      active: allArtistsSummary.filter((a) => a.status === "ACTIVE").length,
      suspended: allArtistsSummary.filter((a) => a.status === "SUSPENDED").length,
      budgets: totalBudgets,
      contracts: totalContracts,
      billingNext7,
      fromLP,
      fromManual,
    },
    pagination: {
      page,
      pages: Math.ceil(totalCount / PAGE_SIZE),
      total: totalCount,
      limit: PAGE_SIZE,
    },
  });
}
