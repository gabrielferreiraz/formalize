"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { PageTutorial, type TutorialStep } from "@/components/ui/PageTutorial";

const DOCS_TUTORIAL: TutorialStep[] = [
  {
    icon: "➕",
    title: "Adicione um evento",
    body: "Toque aqui para adicionar shows, viagens ou reuniões ao calendário — mesmo sem gerar documento.",
    targetId: "tut-docs-novo",
  },
  {
    icon: "📅",
    title: "Lista ou Calendário",
    body: "Alterne entre visualizar seus documentos em lista ou como um calendário mensal de eventos.",
    targetId: "tut-docs-toggle",
  },
];

type Doc = {
  id: string;
  type: "BUDGET" | "CONTRACT" | "GENERIC_EVENT";
  title: string;
  pdfUrl: string | null;
  sentAt: string | null;
  createdAt: string;
  data?: Record<string, unknown>;
};

const TYPE_LABEL: Record<string, string> = {
  BUDGET: "Orçamento",
  CONTRACT: "Contrato",
  GENERIC_EVENT: "Evento",
};

const TYPE_COLOR: Record<string, string> = {
  BUDGET: "text-gold-400 bg-gold-500/10 border-gold-500/30",
  CONTRACT: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  GENERIC_EVENT: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

const CALENDAR_CARD: Record<string, string> = {
  BUDGET: "border-orange-500/45 bg-orange-500/10 text-orange-200",
  CONTRACT: "border-blue-800/70 bg-blue-950/70 text-blue-100",
  GENERIC_EVENT: "border-emerald-800/70 bg-emerald-950/70 text-emerald-100",
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

function parseEventName(doc: Doc): string {
  const d = doc.data ?? {};
  // Para eventos genéricos, o título é o que o usuário digitou
  if (doc.type === "GENERIC_EVENT") return doc.title || "—";
  
  // Para Orçamentos e Contratos, prioriza o nome do contratante (dono da festa)
  const contratante = ((d.contratanteNome as string) || (d.contratante as string))?.trim();
  const evento = (d.evento as string)?.trim();
  
  return contratante || evento || doc.title || "—";
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
  if (doc.type === "GENERIC_EVENT") {
    return { label: "Agendado", color: "bg-emerald-500", text: "text-gray-300" };
  }
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Bloquear scroll quando houver modal aberto
  useEffect(() => {
    const hasModal = !!selectedDoc || !!dayModal || !!pendingDelete;
    if (hasModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedDoc, dayModal, pendingDelete]);

  // reset page when filter changes
  useMemo(() => {
    setPage(1);
  }, [filter, view]);

  const currentMonthTarget = view === "calendar" ? monthCursor : new Date();
  const metricsUrl = `/api/documents/metrics?month=${currentMonthTarget.toISOString().slice(0, 7)}&type=${filter}`;
  const { data: metricsCache, mutate: mutateMetrics } = useSWR(metricsUrl, fetcher);

  const globalMetricsUrl = `/api/documents/metrics?type=${filter}`;
  const { data: globalMetrics } = useSWR(globalMetricsUrl, fetcher);

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

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  async function handleCreateGenericEvent() {
    if (!dayModal || !newEventTitle.trim() || isSavingEvent) return;
    setIsSavingEvent(true);
    try {
      const res = await fetch("/api/documents/generic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle,
          data: dayModal.day,
          time: newEventTime,
        }),
      });
      if (res.ok) {
        setNewEventTitle("");
        setNewEventTime("");
        mutateDocs();
        setDayModal(null);
      }
    } finally {
      setIsSavingEvent(false);
    }
  }

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
      let key = "";
      if (doc.type === "GENERIC_EVENT" && doc.data?.data) {
        key = String(doc.data.data);
      } else {
        key = dayKey(new Date(doc.createdAt));
      }
      
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(doc);

      if (doc.sentAt) {
        const signed = dayKey(new Date(doc.sentAt));
        if (signed !== key) {
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
        <button id="tut-docs-novo" onClick={() => setDayModal({ day: dayKey(new Date()), docs: [] })} style={{
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
          <div className="text-2xl font-bold text-white mt-1">{globalMetrics?.totalGenerated || 0}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">acumulado</div>
        </div>
        <div className="card p-3 rounded-2xl flex flex-col justify-between border border-stage-700/50 bg-stage-800/40">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">ORÇAMENTOS</span>
          <div className="text-2xl font-bold text-gold-400 mt-1">{globalMetrics?.totalBudgets || 0}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">acumulado</div>
        </div>
        <div className="card p-3 rounded-2xl flex flex-col justify-between border border-stage-700/50 bg-stage-800/40">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">CONTRATOS</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">{globalMetrics?.totalContracts || 0}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {globalMetrics?.totalSigned || 0} assinados
          </div>
        </div>
      </div>

      {/* ── View toggle ── */}
      <div id="tut-docs-toggle" style={{ display: "flex", gap: 4, padding: 4, background: "#141824", border: "1px solid #252d3d", borderRadius: 12, marginBottom: 20 }}>
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
          if (t === "all") count = globalMetrics?.totalGenerated || 0;
          else if (t === "BUDGET") count = globalMetrics?.totalBudgets || 0;
          else if (t === "CONTRACT") count = globalMetrics?.totalContracts || 0;
          
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

      {/* ── Content ── */}
      {loading && docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Carregando documentos...</p>
        </div>
      ) : view === "calendar" ? (
        <div className="w-full">
          {/* ── Compact calendar header ── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonthCursor(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; })}
                className="p-2 rounded-xl bg-stage-800 border border-stage-700 text-gray-400 hover:text-white transition-colors"
              >←</button>
              <div className="flex flex-col items-center min-w-[110px]">
                <h2 className="text-sm font-bold text-gray-200 text-center leading-tight">{monthLabel}</h2>
                {latestCalendarDocs.length > 0 && (
                  <span className="mt-0.5 inline-flex px-2 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-[10px] font-bold">
                    {latestCalendarDocs.length} {latestCalendarDocs.length === 1 ? "evento" : "eventos"}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMonthCursor(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; })}
                className="p-2 rounded-xl bg-stage-800 border border-stage-700 text-gray-400 hover:text-white transition-colors"
              >→</button>
            </div>
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-2 h-9 px-3 rounded-xl bg-stage-800 border border-stage-700 text-gray-400 hover:text-white hover:border-stage-500 transition-colors text-xs font-semibold"
              title="Expandir calendário"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              Expandir
            </button>
          </div>

          {/* ── Compact grid ── */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["D","S","T","Q","Q","S","S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-gray-600 uppercase py-1">{d}</div>
            ))}
            {gridDays.map((date, idx) => {
              const key = dayKey(date);
              const isToday = key === dayKey(new Date());
              const isCurrentMonth = date.getMonth() === monthCursor.getMonth();
              const dayDocs = docsByDay.get(key) || [];
              const firstDoc = dayDocs[0];
              const hasBudget = dayDocs.some(d => d.type === "BUDGET");
              const hasContract = dayDocs.some(d => d.type === "CONTRACT");
              return (
                <div
                  key={idx}
                  onClick={() => isCurrentMonth && setDayModal({ day: key, docs: dayDocs })}
                  className={[
                    "min-h-[72px] rounded-lg border flex flex-col overflow-hidden transition-all select-none",
                    isCurrentMonth
                      ? "cursor-pointer active:scale-[0.96] " + (dayDocs.length > 0 ? "bg-stage-800/60 border-stage-600/60 hover:border-stage-500" : "bg-stage-800/20 border-stage-700/30 hover:border-stage-600")
                      : "bg-transparent border-transparent opacity-10 pointer-events-none",
                  ].join(" ")}
                >
                  {isCurrentMonth && dayDocs.length > 0 && (
                    <div className={["h-[3px] w-full flex-shrink-0", hasBudget && hasContract ? "bg-gradient-to-r from-orange-400 to-blue-400" : hasBudget ? "bg-orange-400/80" : hasContract ? "bg-blue-400/80" : "bg-emerald-400/80"].join(" ")} />
                  )}
                  <div className="flex flex-col flex-1 p-1 gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold leading-none ${isToday ? "bg-gold-500 text-stage-900 w-5 h-5 rounded-full flex items-center justify-center" : "text-gray-500"}`}>
                        {date.getDate()}
                      </span>
                      {dayDocs.length > 1 && (
                        <span className="text-[9px] font-bold text-gray-600 bg-stage-700/60 rounded px-0.5 leading-[14px]">{dayDocs.length}</span>
                      )}
                    </div>
                    {firstDoc && (
                      <span className={`text-[10px] font-semibold leading-tight ${firstDoc.type === "BUDGET" ? "text-orange-300/80" : firstDoc.type === "CONTRACT" ? "text-blue-300/80" : "text-emerald-300/80"}`}
                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {parseEventName(firstDoc)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : docs.length === 0 ? (
        <div className="card text-center py-16 text-gray-500 text-sm border-dashed border-stage-600 rounded-2xl">
          Nenhum documento encontrado.
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
                    <div className="shrink-0 w-[52px] h-[80px] rounded-[18px] border border-stage-600 bg-stage-900/50 flex flex-col items-center justify-center shadow-inner font-['Segoe_UI_Emoji']">
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`w-1.5 h-1.5 rounded-full ${status.color}`}></span>
                          <span className={`text-[11px] font-medium ${status.text}`}>{status.label}</span>
                          {!doc.pdfUrl && doc.type !== "GENERIC_EVENT" && (
                            <span className="text-[9px] font-bold text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-[4px]">
                              PDF expirado
                            </span>
                          )}
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

      {/* ── Fullscreen calendar portal ── */}
      {isFullscreen && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9990, background: "#0e1118", display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", width: "100%" }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #252d3d", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setMonthCursor(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; })}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #252d3d", background: "#141824", color: "#94a3b8", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >←</button>
              <div style={{ textAlign: "center", minWidth: 140 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, color: "#f1f5f9", textTransform: "capitalize" }}>{monthLabel}</div>
                {latestCalendarDocs.length > 0 && (
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#e6b800", marginTop: 2 }}>
                    {latestCalendarDocs.length} {latestCalendarDocs.length === 1 ? "evento" : "eventos"}
                  </div>
                )}
              </div>
              <button
                onClick={() => setMonthCursor(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; })}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #252d3d", background: "#141824", color: "#94a3b8", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >→</button>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #252d3d", background: "#141824", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
            >✕</button>
          </div>

          {/* Weekday labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #1a2030", flexShrink: 0 }}>
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
              <div key={d} style={{ textAlign: "center", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", color: "#4b5563", textTransform: "uppercase", padding: "8px 0" }}>{d}</div>
            ))}
          </div>

          {/* Full grid — scrollable */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(110px, 1fr)", gap: 0 }}>
              {gridDays.map((date, idx) => {
                const key = dayKey(date);
                const isToday = key === dayKey(new Date());
                const isCurrentMonth = date.getMonth() === monthCursor.getMonth();
                const dayDocs = docsByDay.get(key) || [];
                const hasBudget = dayDocs.some(d => d.type === "BUDGET");
                const hasContract = dayDocs.some(d => d.type === "CONTRACT");
                const MAX_VISIBLE = 3;
                const visible = dayDocs.slice(0, MAX_VISIBLE);
                const overflow = dayDocs.length - MAX_VISIBLE;
                return (
                  <div
                    key={idx}
                    onClick={() => isCurrentMonth && setDayModal({ day: key, docs: dayDocs })}
                    style={{
                      borderRight: (idx + 1) % 7 === 0 ? "none" : "1px solid #1a2030",
                      borderBottom: "1px solid #1a2030",
                      padding: "6px 6px 4px",
                      display: "flex", flexDirection: "column", gap: 3,
                      background: isCurrentMonth && dayDocs.length > 0 ? "#141f30" : "transparent",
                      opacity: isCurrentMonth ? 1 : 0.15,
                      cursor: isCurrentMonth ? "pointer" : "default",
                      transition: "background 0.15s",
                      overflow: "hidden", minWidth: 0,
                    }}
                    onMouseEnter={e => { if (isCurrentMonth) (e.currentTarget as HTMLElement).style.background = dayDocs.length > 0 ? "#1a2840" : "#141824"; }}
                    onMouseLeave={e => { if (isCurrentMonth) (e.currentTarget as HTMLElement).style.background = dayDocs.length > 0 ? "#141f30" : "transparent"; }}
                  >
                    {/* Top bar */}
                    {isCurrentMonth && dayDocs.length > 0 && (
                      <div style={{ height: 2, borderRadius: 1, background: hasBudget && hasContract ? "linear-gradient(to right, #fb923c, #60a5fa)" : hasBudget ? "#fb923c" : hasContract ? "#60a5fa" : "#34d399", flexShrink: 0, marginBottom: 2 }} />
                    )}

                    {/* Day number */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{
                        fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13,
                        ...(isToday ? { background: "#e6b800", color: "#111", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" } : { color: "#6b7280" })
                      }}>{date.getDate()}</span>
                      {dayDocs.length > 0 && (
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, fontWeight: 700, color: "#4b5563", background: "#1a2030", borderRadius: 4, padding: "1px 4px" }}>
                          {dayDocs.length}
                        </span>
                      )}
                    </div>

                    {/* Event pills */}
                    {visible.map((doc) => (
                      <div key={doc.id} style={{
                        padding: "3px 6px", borderRadius: 5, fontSize: 10, fontWeight: 600,
                        fontFamily: "'Inter', sans-serif", lineHeight: 1.3,
                        background: doc.type === "BUDGET" ? "rgba(251,146,60,0.12)" : doc.type === "CONTRACT" ? "rgba(96,165,250,0.12)" : "rgba(52,211,153,0.12)",
                        color: doc.type === "BUDGET" ? "#fed7aa" : doc.type === "CONTRACT" ? "#bfdbfe" : "#a7f3d0",
                        borderLeft: `2px solid ${doc.type === "BUDGET" ? "#fb923c" : doc.type === "CONTRACT" ? "#60a5fa" : "#34d399"}`,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {parseEventName(doc)}
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#6b7280", fontWeight: 600, paddingLeft: 4 }}>
                        +{overflow} mais
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de detalhe */}
      {selectedDoc && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh' }}
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

            {!selectedDoc.pdfUrl && selectedDoc.type !== "GENERIC_EVENT" && (
              <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 leading-relaxed">
                O PDF foi removido automaticamente pela política de armazenamento do plano. Os dados estão preservados — clique em <strong>Gerar PDF</strong> para recriar.
              </p>
            )}

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
        </div>,
        document.body
      )}

      {/* Modal dia inteiro */}
      {dayModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh' }}
          onClick={() => {
            setDayModal(null);
            setNewEventTitle("");
            setNewEventTime("");
          }}
        >
          <div
            className="bg-stage-800 border border-stage-600 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1">Dia completo</p>
                <h3 className="text-xl font-bold text-gray-100">{formatDate(dayModal.day)}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDayModal(null);
                  setNewEventTitle("");
                  setNewEventTime("");
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-stage-700 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              {/* Quick Add Form - Estilo Google Agenda */}
              <div className="bg-stage-900/40 border border-stage-700/50 rounded-2xl p-5 space-y-4 shadow-inner">
                <input 
                  autoFocus
                  placeholder="Adicionar título (ex: Show Particular, Viagem)"
                  className="w-full bg-transparent border-b border-stage-700 py-2 text-lg font-bold text-gray-100 outline-none focus:border-emerald-500 transition-colors placeholder-gray-700"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateGenericEvent()}
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-stage-800 border border-stage-700 rounded-xl px-3 py-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <input 
                      placeholder="Horário (ex: 20:00)"
                      className="bg-transparent border-none outline-none text-xs text-gray-300 w-full placeholder-gray-600"
                      value={newEventTime}
                      onChange={e => setNewEventTime(e.target.value)}
                    />
                  </div>
                  <button 
                    disabled={!newEventTitle.trim() || isSavingEvent}
                    onClick={handleCreateGenericEvent}
                    className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stage-900 text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/10 active:scale-95"
                  >
                    {isSavingEvent ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>

              {/* Lista de documentos existentes */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Agendados para este dia</p>
                  <div className="h-px bg-stage-700 flex-1"></div>
                </div>

                {dayModal.docs.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-600 italic">Nenhum outro compromisso ou documento.</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-x-hidden">
                    {dayModal.docs.map((doc) => (
                      <button
                        type="button"
                        key={`${dayModal.day}-${doc.id}`}
                        onClick={() => {
                          setSelectedDoc(doc);
                          setDayModal(null);
                        }}
                        className={`w-full text-left rounded-xl border p-3 hover:scale-[1.01] transition-all flex flex-col gap-1 overflow-hidden ${doc.type === "BUDGET" ? "border-gold-500/20 bg-gold-500/5 text-gold-200" : doc.type === "CONTRACT" ? "border-blue-500/20 bg-blue-500/5 text-blue-200" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"}`}
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="font-bold text-sm truncate min-w-0">{parseDataName(doc)}</span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/20 tracking-tighter shrink-0 opacity-60">
                            {TYPE_LABEL[doc.type]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] opacity-60 min-w-0 overflow-hidden">
                            {typeof doc.data?.horario === "string" && doc.data.horario && (
                              <span className="flex items-center gap-1 shrink-0">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {doc.data.horario}
                              </span>
                            )}
                            <span className="truncate">{parseEventLocal(doc)}</span>
                          </div>
                          {doc.type !== "GENERIC_EVENT" && !!doc.data?.cache && (
                            <span className="text-[11px] font-bold font-mono shrink-0 opacity-90 ml-1">
                              {formatMoneyFromCache(doc.data.cache)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer com opções de documentos */}
            <div className="mt-8 pt-6 border-t border-stage-700 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setDayModal(null);
                  router.push(`/admin/orcamento?date=${dayModal.day}`);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-xs font-bold text-gold-400 hover:bg-gold-500/20 transition-all active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Gerar Orçamento
              </button>
              <button
                type="button"
                onClick={() => {
                  setDayModal(null);
                  router.push(`/admin/contrato?date=${dayModal.day}`);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-all active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                Gerar Contrato
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de confirmação de exclusão */}
      {pendingDelete && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-backdrop-fade"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh' }}
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
        </div>,
        document.body
      )}

      <PageTutorial pageKey="documentos" steps={DOCS_TUTORIAL} />

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
