"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Users, CheckCircle2, PauseCircle, FileText, FileSignature, AlertTriangle,
  Globe, Settings2, Percent, TrendingUp, TrendingDown, ChevronRight, Search as SearchIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

type ArtistRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  source: string;
  planLabel: string;
  planStartDate: string;
  billingCycleMonths: number;
  nextBillingDate: string;
  daysUntilBilling: number;
  createdAt: string;
  users: UserRow[];
  budgets: number;
  contracts: number;
  totalDocs: number;
};

type MonthPoint = { month: string; BUDGET: number; CONTRACT: number };

type Totals = {
  artists: number;
  active: number;
  suspended: number;
  budgets: number;
  contracts: number;
  billingNext7: number;
  fromLP: number;
  fromManual: number;
  newLast30d: number;
};

type Pagination = {
  page: number;
  pages: number;
  total: number;
  limit: number;
};

type DashData = {
  artists: ArtistRow[];
  chartMonthly: MonthPoint[];
  totals: Totals;
  pagination: Pagination;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const GOLD = "#f5c200";
const BLUE = "#60a5fa";
const GREEN = "#4ade80";
const RED = "#f87171";
const SURFACE = "#141824"; // stage-800 — used as the ring/gap color on marks
const STATUS_STYLE = {
  ACTIVE: "text-green-400 bg-green-500/10 border-green-500/30",
  SUSPENDED: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  CANCELLED: "text-red-400 bg-red-500/10 border-red-500/30",
};
const STATUS_LABEL = { ACTIVE: "Ativo", SUSPENDED: "Suspenso", CANCELLED: "Cancelado" };

function daysColor(d: number) {
  if (d <= 3) return "text-red-400";
  if (d <= 7) return "text-yellow-400";
  return "text-green-400";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-gray-500" strokeWidth={2.25} />
      <h3 className="text-sm font-bold text-gray-300 tracking-wide uppercase">{title}</h3>
    </div>
  );
}

// ── Sparkline (stat-tile trend) ──────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 64, h = 22, pad = 3;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = pad + (h - 2 * pad) - ((v - min) / range) * (h - 2 * pad);
    return [x, y] as const;
  });
  const lastPt = pts[pts.length - 1];
  return (
    <svg width={w} height={h} className="overflow-visible shrink-0" aria-hidden="true">
      <polyline
        points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke={color}
        strokeOpacity={0.4}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPt[0]} cy={lastPt[1]} r={2.5} fill={color} />
    </svg>
  );
}

// ── Shared chart tooltip (value leads/bold, series swatch secondary) ────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-stage-800 border border-stage-600 rounded-xl px-3 py-2 shadow-xl min-w-[150px]">
      {label && <p className="text-[11px] text-gray-500 font-semibold mb-1.5">{label}</p>}
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey ?? p.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="font-bold text-gray-100 tabular-nums">{p.value}</span>
            <span className="flex items-center gap-1.5 text-gray-500">
              {p.name}
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieTooltip({ active, payload, total }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const color = p.name === "Orçamentos" ? GOLD : BLUE;
  const pct = total ? Math.round((p.value / total) * 100) : 0;
  return (
    <div className="bg-stage-800 border border-stage-600 rounded-xl px-3 py-2 shadow-xl">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold mb-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        {p.name}
      </div>
      <p className="text-sm font-bold text-gray-100 tabular-nums">
        {p.value} <span className="text-gray-500 font-medium">({pct}%)</span>
      </p>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, accent, delta, trend, trendColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  delta?: { pct: number; positive: boolean } | null;
  trend?: number[];
  trendColor?: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">{label}</span>
        <Icon className="w-3.5 h-3.5 text-gray-600" strokeWidth={2.25} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-black tabular-nums" style={{ color: accent ?? "#e8e8e8" }}>{value}</span>
        {trend && trend.length >= 2 && <Sparkline data={trend} color={trendColor ?? accent ?? "#888"} />}
      </div>
      {(sub || delta) && (
        <div className="flex items-center gap-2">
          {delta && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
                delta.positive ? "text-green-400" : "text-red-400"
              }`}
            >
              {delta.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {delta.positive ? "+" : ""}{delta.pct}%
            </span>
          )}
          {sub && <span className="text-xs text-gray-600">{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ── Artist expand row ─────────────────────────────────────────────────────────

function ArtistExpandRow({ artist }: { artist: ArtistRow }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        onClick={() => setOpen((v) => !v)}
        className="border-b border-stage-700 hover:bg-stage-700/30 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={`w-3.5 h-3.5 text-gray-500 transition-transform shrink-0 ${open ? "rotate-90" : ""}`}
              strokeWidth={2.5}
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-200">{artist.name}</p>
              {artist.source === "LP"
                  ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">LP</span>
                  : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/25">Manual</span>
                }
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${STATUS_STYLE[artist.status]}`}>
            {STATUS_LABEL[artist.status]}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gold-400 font-bold tabular-nums">{artist.budgets}</td>
        <td className="px-4 py-3 text-sm text-blue-400 font-bold tabular-nums">{artist.contracts}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{artist.planLabel}</td>
        <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(artist.nextBillingDate)}</td>
        <td className="px-4 py-3">
          <span className={`text-sm font-bold tabular-nums ${daysColor(artist.daysUntilBilling)}`}>
            {artist.daysUntilBilling}d
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">{artist.users.length}</td>
        <td className="px-4 py-3">
          <Link
            href={`/super-admin/artistas/${artist.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gold-400 hover:text-gold-300 font-medium"
          >
            Editar →
          </Link>
        </td>
      </tr>
      {open && (
        <tr className="bg-stage-800/50 border-b border-stage-700">
          <td colSpan={9} className="px-6 py-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                Usuários ({artist.users.length})
              </p>
              {artist.users.length === 0 ? (
                <p className="text-xs text-gray-600">Nenhum usuário.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {artist.users.map((u) => (
                    <div key={u.id} className="bg-stage-700 border border-stage-600 rounded-xl px-3 py-2 text-xs space-y-0.5">
                      <p className="text-gray-200 font-medium">{u.name ?? u.email}</p>
                      <p className="text-gray-500">{u.email}</p>
                      <p className="text-gray-600">{u.role} · desde {fmtDate(u.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-6 pt-1 text-xs text-gray-500">
                <span>Plano iniciou: <span className="text-gray-300">{fmtDate(artist.planStartDate)}</span></span>
                <span>Ciclo: <span className="text-gray-300">{artist.billingCycleMonths} mês(es)</span></span>
                <span>Próxima cobrança: <span className={`font-bold ${daysColor(artist.daysUntilBilling)}`}>{fmtDate(artist.nextBillingDate)}</span></span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardContent() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "CANCELLED">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "budgets" | "contracts" | "billing">("billing");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/super/dashboard?page=${page}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.artists
      .filter((a) => {
        const matchSearch = !q || a.name.toLowerCase().includes(q);
        const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "budgets") return b.budgets - a.budgets;
        if (sortBy === "contracts") return b.contracts - a.contracts;
        if (sortBy === "billing") return a.daysUntilBilling - b.daysUntilBilling;
        return a.name.localeCompare(b.name);
      });
  }, [data, search, statusFilter, sortBy]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Orçamentos", value: data.totals.budgets },
      { name: "Contratos", value: data.totals.contracts },
    ];
  }, [data]);

  const barData = useMemo(() => {
    if (!data) return [];
    return [...data.artists]
      .sort((a, b) => b.totalDocs - a.totalDocs)
      .slice(0, 10)
      .map((a) => ({ name: a.name.split(" ")[0], Orçamentos: a.budgets, Contratos: a.contracts }));
  }, [data]);

  const chartMonthly = useMemo(() => {
    if (!data) return [];
    return data.chartMonthly.map((m) => ({
      ...m,
      month: fmtMonth(m.month),
      Orçamentos: m.BUDGET,
      Contratos: m.CONTRACT,
    }));
  }, [data]);

  // Month-over-month deltas for the doc KPI tiles (needs at least 2 points).
  const budgetTrend = useMemo(() => data?.chartMonthly.map((m) => m.BUDGET) ?? [], [data]);
  const contractTrend = useMemo(() => data?.chartMonthly.map((m) => m.CONTRACT) ?? [], [data]);

  function monthDelta(arr: number[]) {
    if (arr.length < 2) return null;
    const cur = arr[arr.length - 1];
    const prev = arr[arr.length - 2];
    if (prev === 0) return null;
    return { pct: Math.round(((cur - prev) / prev) * 100), positive: cur >= prev };
  }
  const budgetDelta = useMemo(() => monthDelta(budgetTrend), [budgetTrend]);
  const contractDelta = useMemo(() => monthDelta(contractTrend), [contractTrend]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-stage-700/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card h-64 animate-pulse bg-stage-700/50 lg:col-span-2" />
          <div className="card h-64 animate-pulse bg-stage-700/50" />
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-red-400 p-6">Erro ao carregar dados.</div>;

  const { totals } = data;
  const docsTotal = totals.budgets + totals.contracts;

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={Users}
          label="Artistas"
          value={totals.artists}
          sub={totals.newLast30d > 0 ? `${totals.newLast30d} novo(s) em 30d` : undefined}
        />
        <KpiCard icon={CheckCircle2} label="Ativos" value={totals.active} accent={GREEN} />
        <KpiCard icon={PauseCircle} label="Suspensos" value={totals.suspended} accent="#facc15" />
        <KpiCard
          icon={FileText}
          label="Orçamentos"
          value={totals.budgets}
          accent={GOLD}
          delta={budgetDelta}
          trend={budgetTrend}
          trendColor={GOLD}
        />
        <KpiCard
          icon={FileSignature}
          label="Contratos"
          value={totals.contracts}
          accent={BLUE}
          delta={contractDelta}
          trend={contractTrend}
          trendColor={BLUE}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Cobrar em ≤7d"
          value={totals.billingNext7}
          accent={totals.billingNext7 > 0 ? RED : GREEN}
          sub="artistas urgentes"
        />
      </div>

      {/* Origem dos artistas */}
      <div className="card p-5">
        <SectionHeader icon={Globe} title="Origem dos artistas" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* LP */}
          <div className="flex items-center gap-4 bg-stage-800 rounded-2xl px-5 py-4 border border-stage-700">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-400" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400 tabular-nums">{totals.fromLP}</p>
              <p className="text-xs text-gray-500 font-medium">Formulário do site (LP)</p>
            </div>
          </div>
          {/* Manual */}
          <div className="flex items-center gap-4 bg-stage-800 rounded-2xl px-5 py-4 border border-stage-700">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-blue-400" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-400 tabular-nums">{totals.fromManual}</p>
              <p className="text-xs text-gray-500 font-medium">Criado manualmente</p>
            </div>
          </div>
          {/* Conversão */}
          <div className="flex items-center gap-4 bg-stage-800 rounded-2xl px-5 py-4 border border-stage-700">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-gold-400" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-2xl font-black text-gold-400 tabular-nums">
                {totals.artists === 0 ? "—" : `${Math.round((totals.fromLP / totals.artists) * 100)}%`}
              </p>
              <p className="text-xs text-gray-500 font-medium">Vieram da LP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <SectionHeader icon={TrendingUp} title="Documentos — últimos 6 meses" />
          {chartMonthly.length === 0 ? (
            <p className="text-xs text-gray-600 py-8 text-center">Sem dados ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartMonthly} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="1 0" vertical={false} stroke="#242c3d" />
                <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 12 }} axisLine={{ stroke: "#242c3d" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#666", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ stroke: "#333c52", strokeWidth: 1 }} content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#888" }} iconType="plainline" />
                <Line
                  type="monotone" dataKey="Orçamentos" stroke={GOLD} strokeWidth={2}
                  dot={{ r: 4, fill: GOLD, stroke: SURFACE, strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: SURFACE, strokeWidth: 2 }}
                />
                <Line
                  type="monotone" dataKey="Contratos" stroke={BLUE} strokeWidth={2}
                  dot={{ r: 4, fill: BLUE, stroke: SURFACE, strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: SURFACE, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <SectionHeader icon={Percent} title="Distribuição" />
          {docsTotal === 0 ? (
            <p className="text-xs text-gray-600 py-8 text-center">Sem documentos.</p>
          ) : (
            <>
              <div className="relative" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value" stroke={SURFACE} strokeWidth={2}>
                      <Cell fill={GOLD} />
                      <Cell fill={BLUE} />
                    </Pie>
                    <Tooltip content={<PieTooltip total={docsTotal} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-gray-100 tabular-nums">{docsTotal}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Total</span>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                {pieData.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: i === 0 ? GOLD : BLUE }} />
                    {p.name} <span className="text-gray-500 tabular-nums">({p.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {barData.length > 0 && (
        <div className="card p-5">
          <SectionHeader icon={FileText} title="Top artistas por documentos" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }} barGap={4} barCategoryGap="24%">
              <CartesianGrid strokeDasharray="1 0" vertical={false} stroke="#242c3d" />
              <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 12 }} axisLine={{ stroke: "#242c3d" }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#666", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#888" }} iconType="rect" />
              <Bar dataKey="Orçamentos" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Contratos" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-100">Todos os artistas</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2.25} />
            <input
              className="input-field pl-10"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {(["ALL", "ACTIVE", "SUSPENDED", "CANCELLED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  statusFilter === s
                    ? "bg-gold-500 text-stage-900 border-gold-500"
                    : "text-gray-400 hover:text-gray-200 border-stage-600 hover:bg-stage-700"
                }`}
              >
                {s === "ALL" ? "Todos" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="input-field text-sm w-auto"
          >
            <option value="billing">Cobrança mais próxima</option>
            <option value="budgets">Mais orçamentos</option>
            <option value="contracts">Mais contratos</option>
            <option value="name">Nome A→Z</option>
          </select>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stage-700 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Artista</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-gold-500">Orç.</th>
                  <th className="px-4 py-3 font-semibold text-blue-400">Cont.</th>
                  <th className="px-4 py-3 font-semibold">Plano</th>
                  <th className="px-4 py-3 font-semibold">Próx. cobrança</th>
                  <th className="px-4 py-3 font-semibold">Faltam</th>
                  <th className="px-4 py-3 font-semibold">Usuários</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-600 text-sm">
                      Nenhum resultado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => <ArtistExpandRow key={a.id} artist={a} />)
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination controls */}
        {data.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              Página {data.pagination.page} de {data.pagination.pages} · {data.pagination.total} artistas
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-stage-600 text-gray-400 hover:text-gray-200 hover:bg-stage-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.pagination.pages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-gray-600">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-30 ${
                        page === p
                          ? "bg-gold-500 text-stage-900 border-gold-500"
                          : "border-stage-600 text-gray-400 hover:text-gray-200 hover:bg-stage-700"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page >= data.pagination.pages || loading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-stage-600 text-gray-400 hover:text-gray-200 hover:bg-stage-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
