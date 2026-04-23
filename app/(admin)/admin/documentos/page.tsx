"use client";

import { useCallback, useState, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

type Doc = {
  id: string;
  type: "BUDGET" | "CONTRACT";
  title: string;
  pdfUrl: string | null;
  sentAt: string | null;
  createdAt: string;
  data?: Record<string, unknown>;
};

const TYPE_LABEL: Record<string, string> = {
  BUDGET: "Orçamento",
  CONTRACT: "Contrato",
};

const TYPE_COLOR: Record<string, string> = {
  BUDGET: "text-gold-400 bg-gold-500/10 border-gold-500/30",
  CONTRACT: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const CALENDAR_CARD: Record<string, string> = {
  BUDGET: "border-orange-500/45 bg-orange-500/10 text-orange-200",
  CONTRACT: "border-blue-800/70 bg-blue-950/70 text-blue-100",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function monthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDataName(doc: Doc): string {
  const d = doc.data ?? {};
  const fromData = (d.contratanteNome as string) || (d.contratante as string);
  return (fromData || doc.title || "Sem contratante").trim();
}

function parseEventLocal(doc: Doc): string {
  const d = doc.data ?? {};
  return String((d.local as string) || (d.cidade as string) || "Local não informado").trim();
}

function docNegotiationKey(doc: Doc): string {
  const d = doc.data ?? {};
  const contratante = String((d.contratanteNome as string) || (d.contratante as string) || "").trim().toLowerCase();
  const evento = String((d.evento as string) || "").trim().toLowerCase();
  const dataEvento = String((d.data as string) || "").trim();
  const local = String((d.local as string) || "").trim().toLowerCase();
  return [doc.type, contratante, evento, dataEvento, local].join("|");
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

function formatMoneyFromCache(raw: unknown): string {
  if (typeof raw !== "string" && typeof raw !== "number") return "—";
  const value = Number(raw);
  if (!Number.isFinite(value)) return "—";
  const reais = value > 1000 ? value / 100 : value;
  return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function eventDateLabel(doc: Doc): string {
  const d = doc.data ?? {};
  const iso = (d.data as string) || doc.createdAt;
  if (!iso) return "—";
  const date = formatDate(iso);
  const hour = (d.horario as string) || "";
  return hour ? `${date} às ${hour}` : date;
}

function getDocMonthAndDay(doc: Doc) {
  const d = doc.data ?? {};
  const iso = (d.data as string) || doc.createdAt;
  if (!iso) return { month: "—", day: "—", date: new Date() };
  const date = new Date(iso);
  const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  return { 
    month: monthNames[date.getMonth()], 
    day: date.getDate().toString().padStart(2, '0'),
    date
  };
}

function getDocStatus(doc: Doc) {
  if (doc.type === "CONTRACT") {
    return doc.sentAt ? { label: "Assinado", color: "bg-green-500", text: "text-gray-300" } : { label: "Enviado", color: "bg-blue-500", text: "text-gray-300" };
  } else {
    return { label: "Pendente", color: "bg-gold-500", text: "text-gray-300" };
  }
}

function getDocNumber(doc: Doc): string {
  const d = doc.data ?? {};
  const num = d.numero || d.numeroContrato;
  if (num) return String(num);
  return doc.id ? String(doc.id).split('-')[0].toUpperCase() : "DOC";
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DocumentosPage() {
  const router = useRouter();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "BUDGET" | "CONTRACT">("all");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [dayModal, setDayModal] = useState<{ day: string; docs: Doc[] } | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // reset page when filter changes
  useMemo(() => {
    setPage(1);
  }, [filter, view]);

  const currentMonthTarget = view === "calendar" ? monthCursor : new Date();
  const metricsUrl = `/api/documents/metrics?month=${currentMonthTarget.toISOString().slice(0, 7)}&type=${filter}`;
  const { data: metricsCache, mutate: mutateMetrics } = useSWR(metricsUrl, fetcher);

  const docsUrl = useMemo(() => {
    if (view === "list") {
      return `/api/documents?type=${filter}&page=${page}&includeData=1`;
    }
    const { start, end } = monthBounds(monthCursor);
    return `/api/documents?type=${filter}&calendar=1&includeData=1&from=${dayKey(start)}&to=${dayKey(end)}`;
  }, [view, filter, page, monthCursor]);

  const { data: docsData, isLoading: loading, mutate: mutateDocs } = useSWR(docsUrl, fetcher, {
    keepPreviousData: true,
  });

  const docs = (docsData?.documents ?? []) as Doc[];
  const total = docsData?.total ?? 0;
  const pages = docsData?.pages ?? 1;

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    setDeleting(id);
    try {
      await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      mutateDocs();
      mutateMetrics();
    } finally {
      setDeleting(null);
    }
  }

  async function openOrGenerate(doc: Doc) {
    if (doc.pdfUrl) {
      window.open(doc.pdfUrl, "_blank");
      return;
    }
    if (!doc.data || regenerating) return;

    setRegenerating(true);
    try {
      const type = doc.type === "CONTRACT" ? "contrato" : "orcamento";
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data: doc.data }),
      });
      const json = await res.json();
      if (res.ok && json.pdfUrl) {
        window.open(json.pdfUrl, "_blank");
        mutateDocs();
        mutateMetrics();
      }
    } finally {
      setRegenerating(false);
    }
  }

  const monthLabel = formatMonthLabel(monthCursor);
  const gridDays = useMemo(() => {
    const firstOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [monthCursor]);

  const latestCalendarDocs = useMemo(() => {
    // Comparador de revisões: mantém somente a versão mais recente por negociação.
    const sorted = [...docs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const map = new Map<string, Doc>();
    for (const doc of sorted) {
      const key = docNegotiationKey(doc);
      if (!map.has(key)) map.set(key, doc);
    }
    return Array.from(map.values());
  }, [docs]);

  const docsByDay = useMemo(() => {
    const map = new Map<string, Doc[]>();
    for (const doc of latestCalendarDocs) {
      const created = dayKey(new Date(doc.createdAt));
      if (!map.has(created)) map.set(created, []);
      map.get(created)!.push(doc);

      if (doc.sentAt) {
        const signed = dayKey(new Date(doc.sentAt));
        if (signed !== created) {
          if (!map.has(signed)) map.set(signed, []);
          map.get(signed)!.push(doc);
        }
      }
    }
    return map;
  }, [latestCalendarDocs]);

  void metricsCache;

  return (
    <div>
      {/* ── Header estilo design ── */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        padding: "22px 0 14px",
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: 28,
            color: "#f1f5f9",
            letterSpacing: "-0.02em",
          }}>Documentos</h1>
          <div style={{ marginTop: 4, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#94a3b8" }}>
            <span style={{ color: "#f5c842", fontWeight: 700 }}>{total}</span>
            {" "}gerados · {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(monthCursor).replace(/^\w/, c => c.toUpperCase())}
          </div>
        </div>
        <button onClick={() => setDayModal({ day: dayKey(new Date()), docs: [] })} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#f5c842", color: "#1a1200",
          border: "none", borderRadius: 999,
          padding: "8px 16px",
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(245, 200, 66, 0.2)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 200, 66, 0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(245, 200, 66, 0.2)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Novo
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-3 rounded-2xl flex flex-col justify-between border border-stage-700/50 bg-stage-800/40">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">TOTAL</span>
          <div className="text-2xl font-bold text-white mt-1">{metricsCache?.totalGenerated || 0}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">neste mês</div>
        </div>
        <div className="card p-3 rounded-2xl flex flex-col justify-between border border-stage-700/50 bg-stage-800/40">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">ORÇAMENTOS</span>
          <div className="text-2xl font-bold text-gold-400 mt-1">{metricsCache?.totalBudgets || 0}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">neste mês</div>
        </div>
        <div className="card p-3 rounded-2xl flex flex-col justify-between border border-stage-700/50 bg-stage-800/40">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">CONTRATOS</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">{metricsCache?.totalContracts || 0}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {metricsCache?.totalSigned || 0} assinados
          </div>
        </div>
      </div>

      {/* ── View toggle ── */}
      <div style={{ display: "flex", gap: 4, padding: 4, background: "#141824", border: "1px solid #252d3d", borderRadius: 12, marginBottom: 20 }}>
        {(["list", "calendar"] as const).map(v => {
          const on = view === (v === "list" ? "list" : "calendar");
          return (
            <button key={v} onClick={() => setView(v === "list" ? "list" : "calendar")} style={{
              flex: 1, height: 36, borderRadius: 8, border: "none",
              background: on ? "#e6b800" : "transparent",
              color: on ? "#0e1118" : "#94a3b8",
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              cursor: "pointer",
              transition: "all 0.2s"
            }}>
              {v === "list" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              )}
              {v === "list" ? "Lista" : "Calendário"}
            </button>
          );
        })}
      </div>

      {/* ── Filter chips ── */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, marginBottom: 24, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
        {(["all", "BUDGET", "CONTRACT"] as const).map(t => {
          const on = filter === t;
          let count = 0;
          if (t === "all") count = metricsCache?.totalGenerated || 0;
          else if (t === "BUDGET") count = metricsCache?.totalBudgets || 0;
          else if (t === "CONTRACT") count = metricsCache?.totalContracts || 0;
          
          return (
            <button key={t} onClick={() => setFilter(t)} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 999,
              background: on ? "#e6b800" : "transparent",
              border: on ? "1px solid #e6b800" : "1px solid #252d3d",
              color: on ? "#0e1118" : "#94a3b8",
              fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.2s"
            }}>
              {t === "all" ? "Todos" : TYPE_LABEL[t]}
              <span style={{ 
                background: on ? "rgba(0,0,0,0.15)" : "#252d3d", 
                padding: "2px 6px", 
                borderRadius: 6,
                fontSize: 10,
                color: on ? "#0e1118" : "#6b7280"
              }}>{count}</span>
            </button>
          );
        })}
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 999,
          background: "transparent",
          border: "1px solid #252d3d",
          color: "#94a3b8",
          fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer",
          flexShrink: 0,
        }}>
          Assinados
          <span style={{ background: "#252d3d", padding: "2px 6px", borderRadius: 6, fontSize: 10, color: "#6b7280" }}>
            {metricsCache?.totalSigned || 0}
          </span>
        </button>
      </div>

      {view === "calendar" && (
        <div style={{ marginBottom: 16 }}>
          <div className="card p-3 flex items-center justify-between rounded-2xl bg-stage-800 border-stage-700">
            <button
              onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="px-3 py-1.5 text-xs rounded-xl border border-stage-600 text-gray-300 hover:border-gold-600 hover:text-gold-400 transition-colors"
            >
              ← Anterior
            </button>
            <div className="text-sm font-semibold text-gray-100 capitalize">{monthLabel}</div>
            <button
              onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="px-3 py-1.5 text-xs rounded-xl border border-stage-600 text-gray-300 hover:border-gold-600 hover:text-gold-400 transition-colors"
            >
              Próximo →
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-32 animate-pulse bg-stage-800/50 border-stage-700/50 rounded-2xl" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="card text-center py-16 text-gray-500 text-sm border-dashed border-stage-600 rounded-2xl">
          Nenhum documento encontrado.
        </div>
      ) : view === "calendar" ? (
        <div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((w) => (
              <div key={w} className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase px-1 sm:px-2 text-center sm:text-left tracking-wider">
                {w}
              </div>
            ))}

            {gridDays.map((day) => {
              const key = dayKey(day);
              const dayDocs = docsByDay.get(key) ?? [];
              const inMonth = day.getMonth() === monthCursor.getMonth();
              return (
                <div
                  key={key}
                  className={`rounded-xl sm:rounded-2xl border p-1.5 sm:p-3 shadow-sm transition-all duration-300 hover:border-stage-500 hover:-translate-y-0.5 animate-fade-in ${inMonth ? "border-stage-700 bg-stage-800" : "border-stage-800 bg-stage-900/50 opacity-60"}`}
                  style={{ animationDelay: `${(day.getDate() % 7) * 30}ms` }}
                >
                  <div className="w-full text-left">
                    <div className="text-[11px] text-gray-400 font-semibold text-center sm:text-left">{day.getDate()}</div>

                    {/* Mobile-first: compacto, sem cards esticados */}
                    <div className="sm:hidden mt-1.5 space-y-1.5">
                      {dayDocs.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setDayModal({ day: key, docs: [] })}
                          className="h-6 w-full rounded-md hover:bg-stage-700/40"
                          aria-label="Abrir dia sem registros"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (dayDocs.length === 1) setSelectedDoc(dayDocs[0]);
                            else setDayModal({ day: key, docs: dayDocs });
                          }}
                          className="w-full text-left space-y-1 flex flex-col items-center"
                        >
                          <div className="flex flex-col gap-1 items-center">
                            {dayDocs.filter(d => d.type === "BUDGET").map((_, i) => (
                              <span key={`b-${i}`} className="inline-block h-1.5 w-4 rounded-full bg-gold-400" />
                            ))}
                            {dayDocs.filter(d => d.type === "CONTRACT").map((_, i) => (
                              <span key={`c-${i}`} className="inline-block h-1.5 w-4 rounded-full bg-blue-400" />
                            ))}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop: cartões completos */}
                  <div className="hidden sm:block mt-2 space-y-1.5">
                    {dayDocs.slice(0, 3).map((doc) => (
                      <button
                        key={`${doc.id}-${key}`}
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        className={`block w-full text-left rounded-lg border px-2 py-1.5 text-[10px] leading-snug hover:opacity-80 transition-opacity ${
                          doc.type === "BUDGET" ? "border-gold-500/20 bg-gold-500/10 text-gold-200" : "border-blue-500/20 bg-blue-500/10 text-blue-200"
                        }`}
                      >
                        <div className="font-semibold truncate">{parseDataName(doc)}</div>
                        <div className="truncate opacity-80">{parseEventLocal(doc)}</div>
                      </button>
                    ))}
                    {dayDocs.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setDayModal({ day: key, docs: dayDocs })}
                        className="text-[10px] text-gray-500 px-1 hover:text-gold-400 w-full text-center mt-1"
                      >
                        +{dayDocs.length - 3} mais
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Timeline Wrapper (simplified for all docs) */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h3 className="text-[10px] font-extrabold tracking-[0.15em] text-gray-100 uppercase">Lista de Documentos</h3>
              <div className="h-px bg-stage-700 flex-1"></div>
              <span className="text-[10px] font-medium text-gray-500">{docs.length} documentos</span>
            </div>
            
            <div className="space-y-3">
              {docs.map((doc, i) => {
                const dateInfo = getDocMonthAndDay(doc);
                const status = getDocStatus(doc);
                const isContrato = doc.type === "CONTRACT";
                const badgeColor = isContrato ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-gold-500/10 border-gold-500/30 text-gold-400";
                
                return (
                  <button 
                    key={doc.id} 
                    onClick={() => setSelectedDoc(doc)}
                    className="w-full text-left card bg-stage-800 border-stage-700 p-4 rounded-2xl flex gap-4 hover:border-stage-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 group animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {/* Date Block */}
                    <div className="shrink-0 w-[52px] h-[60px] rounded-xl border border-stage-600 bg-stage-900/50 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{dateInfo.month}</span>
                      <span className="text-[18px] font-black text-white leading-tight">{dateInfo.day}</span>
                    </div>

                    {/* Content Block */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider ${badgeColor}`}>
                          {TYPE_LABEL[doc.type]}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">{getDocNumber(doc)}</span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-gray-100 truncate mb-0.5 group-hover:text-gold-400 transition-colors">
                        {parseDataName(doc)} {doc.data?.evento ? `— ${doc.data.evento}` : ''}
                      </h4>
                      
                      <p className="text-xs text-gray-500 truncate mb-2">
                        {String(doc.data?.contratanteNome || doc.data?.contratante || "Sem contratante")} · {parseEventLocal(doc)} {doc.data?.horas ? `· ${String(doc.data.horas)}h show` : ''}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${status.color}`}></span>
                          <span className={`text-[11px] font-medium ${status.text}`}>{status.label}</span>
                        </div>
                        <div className="text-[11px] font-bold text-gold-400 font-mono bg-gold-500/5 px-2 py-0.5 rounded border border-gold-500/10">
                          {formatMoneyFromCache(doc.data?.cache)}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhe */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-stage-800 border border-stage-600 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-[4px] border uppercase tracking-wider mb-2 ${selectedDoc.type === "CONTRACT" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-gold-500/10 border-gold-500/30 text-gold-400"}`}>
                  {TYPE_LABEL[selectedDoc.type]}
                </span>
                <h3 className="text-lg font-bold text-gray-100">{parseDataName(selectedDoc)}</h3>
                <p className="text-xs text-gray-400 mt-1">{parseEventLocal(selectedDoc)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="text-gray-500 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-stage-600 bg-stage-900/50 px-3 py-2">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-0.5">Data do evento</p>
                <p className="text-gray-200 font-medium text-sm">{eventDateLabel(selectedDoc)}</p>
              </div>
              <div className="rounded-xl border border-stage-600 bg-stage-900/50 px-3 py-2">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-0.5">Cache</p>
                <p className="text-gold-400 font-bold font-mono text-sm">{formatMoneyFromCache(selectedDoc.data?.cache)}</p>
              </div>
              <div className="rounded-xl border border-stage-600 bg-stage-900/50 px-3 py-2">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-0.5">Gerado em</p>
                <p className="text-gray-200 font-medium text-sm">{formatDate(selectedDoc.createdAt)}</p>
              </div>
              <div className="rounded-xl border border-stage-600 bg-stage-900/50 px-3 py-2">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-0.5">Assinado em</p>
                <p className="text-gray-200 font-medium text-sm">
                  {selectedDoc.type === "CONTRACT" && selectedDoc.sentAt ? formatDate(selectedDoc.sentAt) : "—"}
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-stage-700">
              <button
                onClick={() => {
                  setPendingDelete({ id: selectedDoc.id, title: selectedDoc.title || "este documento" });
                  setSelectedDoc(null);
                }}
                disabled={deleting === selectedDoc.id}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                Excluir
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-stage-500 text-gray-400 hover:text-gray-200 hover:border-stage-400 transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => void openOrGenerate(selectedDoc)}
                  disabled={regenerating}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gold-500 hover:bg-gold-400 text-stage-900 transition-colors disabled:opacity-40 shadow-md"
                >
                  {selectedDoc.pdfUrl ? "Abrir PDF" : regenerating ? "Gerando..." : "Gerar PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal dia inteiro */}
      {dayModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
          onClick={() => setDayModal(null)}
        >
          <div
            className="bg-stage-800 border border-stage-600 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[80vh] flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500">Dia completo</p>
                <h3 className="text-lg font-bold text-gray-100">{formatDate(dayModal.day)}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDayModal(null)}
                className="text-gray-500 hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 pr-1">
              {dayModal.docs.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-stage-600 bg-stage-900/50 px-4 py-4 text-sm text-gray-400">
                    Não há dados registrados.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDayModal(null);
                        router.push("/admin/orcamento");
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-sm font-semibold text-gold-400 hover:bg-gold-500/20"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      Novo orçamento
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDayModal(null);
                        router.push("/admin/contrato");
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl border border-blue-700/50 bg-blue-900/40 px-4 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-900/60"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                      Novo contrato
                    </button>
                  </div>
                </div>
              ) : (
                dayModal.docs.map((doc) => (
                  <button
                    type="button"
                    key={`${dayModal.day}-${doc.id}`}
                    onClick={() => {
                      setSelectedDoc(doc);
                      setDayModal(null);
                    }}
                    className={`w-full text-left rounded-xl border px-3 py-2 hover:opacity-80 ${doc.type === "BUDGET" ? "border-gold-500/30 bg-gold-500/10 text-gold-200" : "border-blue-500/30 bg-blue-500/10 text-blue-200"}`}
                  >
                    <div className="font-semibold">{parseDataName(doc)}</div>
                    <div className="text-xs opacity-90">{parseEventLocal(doc)}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-70">{TYPE_LABEL[doc.type]}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="bg-stage-800 border border-stage-600 rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-100">Excluir documento</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  <span className="text-gray-200 font-medium">{pendingDelete.title}</span> será removido permanentemente. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-stage-500 text-gray-400 hover:text-gray-200 hover:border-stage-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-500 hover:bg-red-400 text-white transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paginação */}
      {view === "list" && pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <span className="text-xs text-gray-500">{page} / {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 text-xs rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}
