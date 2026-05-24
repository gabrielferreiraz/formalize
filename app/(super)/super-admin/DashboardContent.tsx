"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

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
  subdomain: string;
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

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">{label}</span>
      <span className="text-3xl font-black" style={{ color: accent ?? "#e8e8e8" }}>{value}</span>
      {sub && <span className="text-xs text-gray-600">{sub}</span>}
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
            <svg
              className={`w-3 h-3 text-gray-500 transition-transform ${open ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-200">{artist.name}</p>
                {artist.source === "LP"
                  ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">LP</span>
                  : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/25">Manual</span>
                }
              </div>
              <p className="text-xs text-gray-500">{artist.subdomain}.formalize.com.br</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border ${STATUS_STYLE[artist.status]}`}>
            {STATUS_LABEL[artist.status]}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gold-400 font-bold">{artist.budgets}</td>
        <td className="px-4 py-3 text-sm text-blue-400 font-bold">{artist.contracts}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{artist.planLabel}</td>
        <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(artist.nextBillingDate)}</td>
        <td className="px-4 py-3">
          <span className={`text-sm font-bold ${daysColor(artist.daysUntilBilling)}`}>
            {artist.daysUntilBilling}d
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{artist.users.length}</td>
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
        const matchSearch = !q || a.name.toLowerCase().includes(q) || a.subdomain.toLowerCase().includes(q);
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

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Artistas" value={totals.artists} />
        <KpiCard label="Ativos" value={totals.active} accent="#4ade80" />
        <KpiCard label="Suspensos" value={totals.suspended} accent="#facc15" />
        <KpiCard label="Orçamentos" value={totals.budgets} accent={GOLD} />
        <KpiCard label="Contratos" value={totals.contracts} accent={BLUE} />
        <KpiCard
          label="Cobrar em ≤7d"
          value={totals.billingNext7}
          accent={totals.billingNext7 > 0 ? "#f87171" : "#4ade80"}
          sub="artistas urgentes"
        />
      </div>

      {/* Origem dos artistas */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-300 mb-4 tracking-wide uppercase">Origem dos artistas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* LP */}
          <div className="flex items-center gap-4 bg-stage-800 rounded-2xl px-5 py-4 border border-stage-700">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">🌐</div>
            <div>
              <p className="text-2xl font-black text-emerald-400">{totals.fromLP}</p>
              <p className="text-xs text-gray-500 font-medium">Formulário do site (LP)</p>
            </div>
          </div>
          {/* Manual */}
          <div className="flex items-center gap-4 bg-stage-800 rounded-2xl px-5 py-4 border border-stage-700">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg">⚙️</div>
            <div>
              <p className="text-2xl font-black text-blue-400">{totals.fromManual}</p>
              <p className="text-xs text-gray-500 font-medium">Criado manualmente</p>
            </div>
          </div>
          {/* Conversão */}
          <div className="flex items-center gap-4 bg-stage-800 rounded-2xl px-5 py-4 border border-stage-700">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-lg">📊</div>
            <div>
              <p className="text-2xl font-black text-gold-400">
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
          <h3 className="text-sm font-bold text-gray-300 mb-4 tracking-wide uppercase">
            Documentos — últimos 6 meses
          </h3>
          {chartMonthly.length === 0 ? (
            <p className="text-xs text-gray-600 py-8 text-center">Sem dados ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartMonthly} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#666", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 13 }} labelStyle={{ color: "#ccc" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#888" }} />
                <Line type="monotone" dataKey="Orçamentos" stroke={GOLD} strokeWidth={2} dot={{ r: 3, fill: GOLD }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Contratos" stroke={BLUE} strokeWidth={2} dot={{ r: 3, fill: BLUE }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-300 mb-4 tracking-wide uppercase">Distribuição</h3>
          {totals.budgets + totals.contracts === 0 ? (
            <p className="text-xs text-gray-600 py-8 text-center">Sem documentos.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    <Cell fill={GOLD} />
                    <Cell fill={BLUE} />
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {pieData.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: i === 0 ? GOLD : BLUE }} />
                    {p.name} <span className="text-gray-500">({p.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {barData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-300 mb-4 tracking-wide uppercase">Top artistas por documentos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#666", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 13 }} labelStyle={{ color: "#ccc" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#888" }} />
              <Bar dataKey="Orçamentos" fill={GOLD} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Contratos" fill={BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-100">Todos os artistas</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input-field flex-1"
            placeholder="Buscar por nome ou subdomínio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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

        <div className="card overflow-hidden">
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
