"use client";

import { useEffect, useState, useMemo } from "react";

type Request = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  artistName: string;
  message: string | null;
  categoria: string | null;
  temContrato: boolean;
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
const STATUS_ACCENT = { PENDING: "#facc15", APPROVED: "#4ade80", REJECTED: "#f87171" };

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.096.538 4.066 1.482 5.782L0 24l6.382-1.465A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.502-5.17-1.38l-.37-.22-3.789.869.936-3.68-.242-.379A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z";

function WaIcon({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function genPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789!@#";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`text-xs font-medium shrink-0 transition-colors ${copied ? "text-green-400" : "text-gold-400 hover:text-gold-300"}`}
    >
      {copied ? "Copiado!" : label}
    </button>
  );
}

function RequestAvatar({ req }: { req: Pick<Request, "artistName" | "status"> }) {
  const color = STATUS_ACCENT[req.status];
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm select-none"
      style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
    >
      {initials(req.artistName)}
    </div>
  );
}

function DetailModal({ req, onClose, onUpdate }: {
  req: Request;
  onClose: () => void;
  onUpdate: (updated: Request) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState(req.rejectedNote || "");
  const [password, setPassword] = useState(() => genPassword());
  const [showPass, setShowPass] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  async function approve() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/super/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, status: "APPROVED", initialPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao aprovar."); return; }
      setCredentials({ email: req.email, password });
      onUpdate(data);
    } finally { setLoading(false); }
  }

  async function reject() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/super/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, status: "REJECTED", rejectedNote: note || null }),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data);
      else setError(data.error ?? "Erro ao rejeitar.");
    } finally { setLoading(false); }
  }

  const appUrl = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
    : "https://app.formalize.com.br";

  const whatsappMsg1 = credentials
    ? `Olá, ${req.name}! 🎉 Seu acesso ao *Formalize* foi criado!\n\nAcesse pelo link:\n${appUrl}/login\n\nSeu e-mail de login: *${credentials.email}*\n\nVou enviar sua senha temporária na próxima mensagem.\n\n📲 *Dica importante:* depois de fazer o login, instale o app tocando em "Adicionar à tela inicial" (ou "Instalar app" no banner) — fica muito mais fácil de acessar no dia a dia sem precisar abrir o navegador toda vez!`
    : "";

  const whatsappMsg2 = credentials
    ? `🔑 Sua senha temporária:\n\n*${credentials.password}*\n\nNo primeiro acesso você vai precisar criar uma senha nova.`
    : "";

  const accent = STATUS_ACCENT[req.status];

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/70 animate-backdrop-fade"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100dvh" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-stage-800 border border-stage-600 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg animate-scale-in max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-stage-800 border-b border-stage-600/60 px-6 pt-6 pb-4 flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm select-none shrink-0"
              style={{ background: `${accent}18`, border: `1px solid ${accent}40`, color: accent }}
            >
              {initials(req.artistName)}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100 leading-tight">{req.artistName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{req.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${STATUS_STYLE[req.status]}`}>
              {STATUS_LABEL[req.status]}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-200 hover:bg-stage-700 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {([
              ["Nome", req.name],
              ["E-mail", req.email],
              ["WhatsApp", req.whatsapp],
              ["Solicitado em", fmtDateTime(req.createdAt)],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm text-gray-200 break-all">{value}</p>
              </div>
            ))}
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2">
            {req.categoria && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 font-medium">
                {req.categoria}
              </span>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${req.temContrato ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-400" : "bg-stage-700 border-stage-600 text-gray-500"}`}>
              {req.temContrato ? "Já usa modelo próprio" : "Criará contrato do zero"}
            </span>
          </div>

          {req.message && (
            <div className="bg-stage-700/60 border border-stage-600/60 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Mensagem</p>
              <p className="text-sm text-gray-300 leading-relaxed">{req.message}</p>
            </div>
          )}

          {/* ── Credentials panel (post-approval) ── */}
          {credentials && (
            <div className="space-y-3 pt-1 border-t border-stage-600/60">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-green-400 tracking-wide uppercase">Conta criada — envie as credenciais</p>
              </div>

              <div className="bg-stage-700 border border-stage-600 rounded-xl overflow-hidden divide-y divide-stage-600/60">
                {([["E-mail de login", credentials.email], ["Senha temporária", credentials.password]] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest mb-0.5">{k}</p>
                      <p className="text-sm text-gray-200 font-mono break-all">{v}</p>
                    </div>
                    <CopyButton text={v} />
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-600">Envie as mensagens em sequência — a senha separada fica fácil de copiar.</p>
              <div className="grid grid-cols-1 gap-2">
                <a
                  href={`https://wa.me/${req.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMsg1)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-bold transition-colors"
                >
                  <WaIcon /> 1ª msg — Boas-vindas + link
                </a>
                <a
                  href={`https://wa.me/${req.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMsg2)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600/80 hover:bg-green-600 text-white text-sm font-bold transition-colors"
                >
                  <WaIcon /> 2ª msg — Senha temporária
                </a>
              </div>
            </div>
          )}

          {/* ── Pending actions ── */}
          {req.status === "PENDING" && !credentials && (
            <div className="space-y-4 pt-1 border-t border-stage-600/60">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Senha inicial</label>
                  <button onClick={() => setPassword(genPassword())} className="text-xs text-gold-400 hover:text-gold-300 font-medium">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300 font-medium"
                  >
                    {showPass ? "Ocultar" : "Ver"}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Artista troca obrigatoriamente no primeiro acesso.</p>
              </div>

              <div>
                <label className="label">Nota de rejeição <span className="normal-case text-gray-600 font-normal">(opcional)</span></label>
                <textarea
                  className="input-field text-sm resize-none h-20"
                  placeholder="Motivo da rejeição, se necessário..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">{error}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={reject}
                  disabled={loading}
                  className="py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Rejeitar
                </button>
                <button
                  onClick={approve}
                  disabled={loading || password.length < 6}
                  className="py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Criando..." : "Aprovar"}
                </button>
              </div>
            </div>
          )}

          {req.status === "REJECTED" && req.rejectedNote && (
            <div className="bg-red-500/8 border border-red-500/25 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest mb-1">Motivo da rejeição</p>
              <p className="text-sm text-red-400">{req.rejectedNote}</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-stage-500 text-gray-400 hover:text-gray-200 hover:border-stage-400 text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SolicitacoesPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Request | null>(null);
  const [mounted, setMounted] = useState(false);
  const [resets, setResets] = useState<PasswordReset[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  function load() {
    setLoading(true);
    fetch("/api/super/requests")
      .then((r) => r.json())
      .then(setRequests)
      .finally(() => setLoading(false));
  }

  function loadResets() {
    fetch("/api/super/password-resets")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setResets(data); });
  }

  useEffect(() => { load(); loadResets(); }, []);

  const counts = useMemo(() => ({
    total: requests.length,
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  }), [requests]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((r) => {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.artistName.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, requests]);

  function handleUpdate(updated: Request) {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelected(updated);
  }

  return (
    <div className="space-y-6">
      {selected && <DetailModal req={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Solicitações</h1>
          <p className="text-sm text-gray-500 mt-0.5">{counts.total} no total</p>
        </div>
        {counts.PENDING > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-xs font-bold animate-pulse-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
            {counts.PENDING} pendente{counts.PENDING !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Pendentes", key: "PENDING", color: "#facc15", bg: "rgba(250,204,21,0.07)", border: "rgba(250,204,21,0.18)" },
          { label: "Aprovados", key: "APPROVED", color: "#4ade80", bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.18)" },
          { label: "Rejeitados", key: "REJECTED", color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.18)" },
        ] as const).map(({ label, key, color, bg, border }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "ALL" : key)}
            className="rounded-2xl p-4 flex flex-col gap-1 text-left transition-all"
            style={{
              background: statusFilter === key ? `${color}18` : bg,
              border: `1px solid ${statusFilter === key ? color + "55" : border}`,
            }}
          >
            <span className="text-2xl font-black" style={{ color }}>{counts[key]}</span>
            <span className="text-xs font-medium" style={{ color: statusFilter === key ? color : "#6b7280" }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="input-field pl-10"
            placeholder="Buscar por nome, e-mail ou artista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                statusFilter === s
                  ? "bg-gold-500 text-stage-900 border-gold-500"
                  : "text-gray-400 border-stage-600 hover:border-stage-400 hover:text-gray-200"
              }`}
            >
              {s === "ALL" ? "Todos" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-[72px] animate-pulse bg-stage-700/40" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-stage-700 border border-stage-600 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Nenhuma solicitação encontrada</p>
            {search && <p className="text-xs text-gray-600 mt-1">Tente outro termo de busca</p>}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stage-600 divide-y divide-stage-600/60">
          {filtered.map((r, i) => {
            const accent = STATUS_ACCENT[r.status];
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="group w-full flex items-center gap-4 px-4 py-3.5 bg-stage-800 hover:bg-stage-700/60 transition-colors text-left relative"
                style={
                  i === 0 ? { borderRadius: "16px 16px 0 0" }
                  : i === filtered.length - 1 ? { borderRadius: "0 0 16px 16px" }
                  : undefined
                }
              >
                <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-60" style={{ background: accent }} />

                <RequestAvatar req={r} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-200 truncate">{r.artistName}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500 truncate">{r.name}</span>
                    {r.categoria && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium shrink-0">
                        {r.categoria}
                      </span>
                    )}
                    {r.temContrato && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-medium shrink-0">
                        tem modelo
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden sm:block text-xs text-gray-600 shrink-0 text-right">
                  {mounted ? fmtDate(r.createdAt) : "—"}
                </div>

                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>

                <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0 -mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {/* Password resets */}
      {resets.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-stage-600/60" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resets de senha</span>
              <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded-lg font-semibold">
                {resets.length}
              </span>
            </div>
            <div className="flex-1 h-px bg-stage-600/60" />
          </div>

          <p className="text-xs text-gray-600 text-center">Copie o link e envie pelo WhatsApp. Expira 2h após a solicitação.</p>

          <div className="overflow-hidden rounded-2xl border border-stage-600 divide-y divide-stage-600/60">
            {resets.map((r) => {
              const link = `${process.env.NEXT_PUBLIC_ROOT_DOMAIN ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : ""}/reset-password?token=${r.token}`;
              const waMsg = `Olá! Aqui está seu link para redefinir a senha do Formalize (válido por 2h):\n${link}`;
              const isCopied = copiedId === r.id;
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3.5 bg-stage-800">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{r.email}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {mounted ? fmtDateTime(r.createdAt) : "—"} · expira {mounted ? fmtDateTime(r.expiresAt) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { navigator.clipboard.writeText(link); setCopiedId(r.id); setTimeout(() => setCopiedId(null), 2000); }}
                      className={`px-2.5 py-1.5 text-xs rounded-xl border font-medium transition-colors ${
                        isCopied
                          ? "border-green-500/40 text-green-400 bg-green-500/10"
                          : "border-stage-500 text-gray-400 hover:border-gold-600/60 hover:text-gold-400"
                      }`}
                    >
                      {isCopied ? "Copiado!" : "Copiar link"}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
                    >
                      <WaIcon size={12} /> WhatsApp
                    </a>
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
