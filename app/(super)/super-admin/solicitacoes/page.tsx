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

type PasswordReset = {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
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

function genPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789!@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="ml-2 text-xs text-gold-400 hover:text-gold-300 font-medium shrink-0"
    >
      {copied ? "Copiado!" : "Copiar"}
    </button>
  );
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
  const [error, setError] = useState("");
  const [note, setNote] = useState(req.rejectedNote || "");
  const [password, setPassword] = useState(() => genPassword());
  const [showPass, setShowPass] = useState(false);
  // Credentials shown after successful approval
  const [credentials, setCredentials] = useState<{ email: string; password: string; subdomain: string } | null>(null);

  async function approve() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/super/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, status: "APPROVED", initialPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao aprovar."); return; }
      setCredentials({ email: req.email, password, subdomain: req.subdomain });
      onUpdate(data);
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/super/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, status: "REJECTED", rejectedNote: note || null }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data);
      else setError(data.error ?? "Erro ao rejeitar.");
    } finally {
      setLoading(false);
    }
  }

  const whatsappMsg = credentials
    ? `Olá ${req.name}! Seu acesso ao Formalize foi criado 🎉\n\nAcesse: https://${credentials.subdomain}.formalize.com.br\nE-mail: ${credentials.email}\nSenha temporária: ${credentials.password}\n\nNo primeiro acesso você será solicitado a trocar a senha.`
    : "";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100dvh" }}
    >
      <div className="bg-stage-800 border border-stage-600 rounded-2xl p-6 w-full max-w-lg space-y-4 animate-scale-in max-h-[90dvh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-100">{req.artistName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{req.subdomain}.formalize.com.br</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0 ${STATUS_STYLE[req.status]}`}>
            {STATUS_LABEL[req.status]}
          </span>
        </div>

        {/* Requester details */}
        <div className="space-y-1.5">
          {([["Nome", req.name], ["E-mail", req.email], ["WhatsApp", req.whatsapp], ["Solicitado em", formatDate(req.createdAt)]] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">{label}</span>
              <span className="text-sm text-gray-200 break-all">{value}</span>
            </div>
          ))}
          {req.message && (
            <div className="flex gap-3">
              <span className="text-xs text-gray-500 w-24 shrink-0 pt-0.5">Mensagem</span>
              <span className="text-sm text-gray-300 leading-relaxed">{req.message}</span>
            </div>
          )}
        </div>

        {/* Credentials panel shown after approval */}
        {credentials && (
          <div className="space-y-3 pt-2 border-t border-stage-600">
            <p className="text-xs font-semibold tracking-widest uppercase text-green-400">Conta criada! Envie as credenciais</p>
            <div className="bg-stage-700 border border-stage-600 rounded-xl p-3 space-y-2">
              {[["Acesso", `https://${credentials.subdomain}.formalize.com.br`], ["E-mail", credentials.email], ["Senha temporária", credentials.password]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500">{k}</p>
                    <p className="text-sm text-gray-200 font-mono">{v}</p>
                  </div>
                  <CopyButton text={v} />
                </div>
              ))}
            </div>
            <a
              href={`https://wa.me/${req.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.538 4.066 1.482 5.782L0 24l6.382-1.465A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.502-5.17-1.38l-.37-.22-3.789.869.936-3.68-.242-.379A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Enviar pelo WhatsApp
            </a>
          </div>
        )}

        {/* Pending actions */}
        {req.status === "PENDING" && !credentials && (
          <div className="space-y-3 pt-2 border-t border-stage-600">
            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Senha inicial do artista</label>
                <button
                  type="button"
                  onClick={() => setPassword(genPassword())}
                  className="text-xs text-gold-400 hover:text-gold-300"
                >
                  Gerar nova
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="input-field pr-16 font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
                >
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">O artista será obrigado a trocar no primeiro acesso.</p>
            </div>

            {/* Rejection note */}
            <textarea
              className="input-field text-sm resize-none h-16"
              placeholder="Nota de rejeição (opcional, só ao rejeitar)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={reject}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
              >
                Rejeitar
              </button>
              <button
                onClick={approve}
                disabled={loading || password.length < 6}
                className="flex-1 btn-primary py-2.5 text-sm"
              >
                {loading ? "Criando acesso..." : "Aprovar e criar acesso"}
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
  const [resets, setResets] = useState<PasswordReset[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  function loadResets() {
    fetch("/api/super/password-resets")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setResets(data); });
  }

  useEffect(() => { load(); loadResets(); }, []);

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

      {/* ── Resets de senha pendentes ── */}
      {resets.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-stage-700">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-300">Resets de senha pendentes</h2>
            <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-lg">
              {resets.length} aguardando
            </span>
          </div>
          <p className="text-xs text-gray-600">Copie o link e envie pelo WhatsApp do usuário. Expira em 2 horas após a solicitação.</p>
          <div className="space-y-2">
            {resets.map((r) => {
              const link = `${process.env.NEXT_PUBLIC_ROOT_DOMAIN ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : ""}/reset-password?token=${r.token}`;
              const waMsg = `Olá! Aqui está seu link para redefinir a senha do Formalize (válido por 2h):\n${link}`;
              const isCopied = copiedId === r.id;
              return (
                <div key={r.id} className="card space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{r.email}</p>
                      <p className="text-xs text-gray-600">
                        {mounted ? formatDate(r.createdAt) : "—"} · expira {mounted ? formatDate(r.expiresAt) : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(link);
                          setCopiedId(r.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors"
                      >
                        {isCopied ? "Copiado!" : "Copiar link"}
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.538 4.066 1.482 5.782L0 24l6.382-1.465A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.502-5.17-1.38l-.37-.22-3.789.869.936-3.68-.242-.379A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
