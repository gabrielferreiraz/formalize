"use client";

import { useEffect, useState } from "react";

type Request = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  artistName: string;
  subdomain: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectedNote: string | null;
  createdAt: string;
};

const STATUS_STYLE = {
  PENDING: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  APPROVED: "text-green-400 bg-green-500/10 border-green-500/30",
  REJECTED: "text-red-400 bg-red-500/10 border-red-500/30",
};
const STATUS_LABEL = { PENDING: "Pendente", APPROVED: "Aprovado", REJECTED: "Rejeitado" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function DetailModal({
  req,
  onClose,
  onUpdate,
}: {
  req: Request;
  onClose: () => void;
  onUpdate: (updated: Request) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(req.rejectedNote || "");

  async function setStatus(status: "APPROVED" | "REJECTED") {
    setLoading(true);
    try {
      const res = await fetch("/api/super/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, status, rejectedNote: status === "REJECTED" ? note : null }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100dvh" }}
    >
      <div className="bg-stage-800 border border-stage-600 rounded-2xl p-6 w-full max-w-lg space-y-4 animate-scale-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-100">{req.artistName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{req.subdomain}.formalize.com.br</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0 ${STATUS_STYLE[req.status]}`}>
            {STATUS_LABEL[req.status]}
          </span>
        </div>

        <div className="space-y-2">
          {[
            ["Nome", req.name],
            ["E-mail", req.email],
            ["WhatsApp", req.whatsapp],
            ["Solicitado em", formatDate(req.createdAt)],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">{label}</span>
              <span className="text-sm text-gray-200">{value}</span>
            </div>
          ))}
          {req.message && (
            <div className="flex gap-3">
              <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Mensagem</span>
              <span className="text-sm text-gray-300 leading-relaxed">{req.message}</span>
            </div>
          )}
        </div>

        {req.status === "PENDING" && (
          <div className="space-y-2 pt-2 border-t border-stage-600">
            <textarea
              className="input-field text-sm resize-none h-20"
              placeholder="Nota de rejeição (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStatus("REJECTED")}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
              >
                Rejeitar
              </button>
              <button
                onClick={() => setStatus("APPROVED")}
                disabled={loading}
                className="flex-1 btn-primary py-2.5 text-sm"
              >
                {loading ? "Salvando..." : "Aprovar"}
              </button>
            </div>
          </div>
        )}

        {req.rejectedNote && req.status === "REJECTED" && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
            {req.rejectedNote}
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl border border-stage-500 text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export default function SolicitacoesPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filtered, setFiltered] = useState<Request[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Request | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  function load() {
    setLoading(true);
    fetch("/api/super/requests")
      .then((r) => r.json())
      .then((data) => { setRequests(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      requests.filter((r) => {
        const matchSearch =
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.artistName.toLowerCase().includes(q);
        const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
        return matchSearch && matchStatus;
      })
    );
  }, [search, statusFilter, requests]);

  function handleUpdate(updated: Request) {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelected(updated);
  }

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      {selected && (
        <DetailModal req={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />
      )}

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-100">Solicitações</h1>
        <span className="text-sm text-gray-500">{counts.PENDING} pendente{counts.PENDING !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input-field flex-1"
          placeholder="Buscar por nome, e-mail ou artista..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-gold-500 text-stage-900"
                  : "text-gray-400 hover:text-gray-200 border border-stage-600 hover:bg-stage-700"
              }`}
            >
              {s === "ALL" ? "Todos" : STATUS_LABEL[s]}
              {counts[s] > 0 && <span className="ml-1.5 opacity-70">{counts[s]}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-stage-700/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 text-sm">Nenhuma solicitação encontrada.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="card w-full flex items-center gap-4 hover:border-stage-400 transition-colors cursor-pointer text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200">{r.artistName}</p>
                <p className="text-xs text-gray-500">{r.name} · {r.email}</p>
              </div>
              <div className="hidden sm:block text-xs text-gray-600 shrink-0">
                {mounted ? formatDate(r.createdAt) : "—"}
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0 ${STATUS_STYLE[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
