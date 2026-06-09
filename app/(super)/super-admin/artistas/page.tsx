"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type Artist = {
  id: string;
  name: string;
  primaryColor: string;
  logoUrl: string | null;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  createdAt: string;
  _count: { users: number; documents: number };
};

const STATUS_STYLE = {
  ACTIVE: "text-green-400 bg-green-500/10 border-green-500/30",
  SUSPENDED: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  CANCELLED: "text-red-400 bg-red-500/10 border-red-500/30",
};
const STATUS_LABEL = { ACTIVE: "Ativo", SUSPENDED: "Suspenso", CANCELLED: "Cancelado" };

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function ArtistAvatar({ artist, size = 42 }: { artist: Pick<Artist, "name" | "primaryColor" | "logoUrl">; size?: number }) {
  if (artist.logoUrl) {
    return (
      <img
        src={artist.logoUrl}
        alt={artist.name}
        width={size}
        height={size}
        className="rounded-xl object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0 font-bold text-sm select-none"
      style={{
        width: size,
        height: size,
        background: `${artist.primaryColor}20`,
        border: `1px solid ${artist.primaryColor}40`,
        color: artist.primaryColor,
      }}
    >
      {initials(artist.name)}
    </div>
  );
}

function NewArtistModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", primaryColor: "#f5c200" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/super/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/70 animate-backdrop-fade"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100dvh" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-stage-800 border border-stage-600 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stage-600/60">
          <div>
            <h2 className="text-base font-bold text-gray-100">Novo artista</h2>
            <p className="text-xs text-gray-500 mt-0.5">Cria conta e acesso imediato</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-200 hover:bg-stage-700 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3">
            {([
              ["name", "Nome artístico", "text", "ex: Banda Girassol"],
              ["email", "E-mail de acesso", "email", "admin@banda.com"],
              ["password", "Senha inicial", "password", "mín. 6 caracteres"],
            ] as [keyof typeof form, string, string, string][]).map(([k, label, type, placeholder]) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input
                  type={type}
                  className="input-field"
                  placeholder={placeholder}
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value)}
                  required
                  minLength={k === "password" ? 6 : undefined}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="label">Cor da identidade</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
                className="w-12 h-12 rounded-xl border border-stage-500 bg-stage-700 cursor-pointer p-1.5 block shrink-0"
              />
              <input
                className="input-field font-mono uppercase flex-1"
                value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
                maxLength={7}
              />
              <div
                className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold select-none"
                style={{
                  background: `${form.primaryColor}20`,
                  border: `2px solid ${form.primaryColor}60`,
                  color: form.primaryColor,
                }}
              >
                {form.name ? initials(form.name) : "A"}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-stage-500 text-gray-400 hover:text-gray-200 hover:border-stage-400 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-stage-900 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Criando..." : "Criar artista"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ArtistasPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "CANCELLED">("ALL");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    document.body.style.overflow = showNew ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showNew]);

  function load() {
    setLoading(true);
    fetch("/api/super/artists")
      .then((r) => r.json())
      .then(setArtists)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    total: artists.length,
    ACTIVE: artists.filter((a) => a.status === "ACTIVE").length,
    SUSPENDED: artists.filter((a) => a.status === "SUSPENDED").length,
    CANCELLED: artists.filter((a) => a.status === "CANCELLED").length,
  }), [artists]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return artists.filter((a) => {
      const matchSearch = !q || a.name.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, artists]);

  return (
    <div className="space-y-6">
      {showNew && <NewArtistModal onClose={() => setShowNew(false)} onCreated={load} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Artistas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {counts.total} cadastrado{counts.total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold-500 hover:bg-gold-400 text-stage-900 text-sm font-bold rounded-xl transition-colors shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo artista
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Ativos", key: "ACTIVE", color: "#4ade80", bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.18)" },
          { label: "Suspensos", key: "SUSPENDED", color: "#facc15", bg: "rgba(250,204,21,0.07)", border: "rgba(250,204,21,0.18)" },
          { label: "Cancelados", key: "CANCELLED", color: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.18)" },
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
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-[72px] animate-pulse bg-stage-700/40" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-stage-700 border border-stage-600 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Nenhum artista encontrado</p>
            {search && <p className="text-xs text-gray-600 mt-1">Tente outro termo de busca</p>}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stage-600 divide-y divide-stage-600/60">
          {filtered.map((a, i) => (
            <Link
              key={a.id}
              href={`/super-admin/artistas/${a.id}`}
              className="group flex items-center gap-4 px-4 py-3.5 bg-stage-800 hover:bg-stage-700/60 transition-colors cursor-pointer relative"
              style={i === 0 ? { borderRadius: "16px 16px 0 0" } : i === filtered.length - 1 ? { borderRadius: "0 0 16px 16px" } : undefined}
            >
              {/* color accent */}
              <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-70" style={{ background: a.primaryColor }} />

              <ArtistAvatar artist={a} size={42} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate">{a.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{fmtDate(a.createdAt)}</p>
              </div>

              <div className="hidden sm:flex items-center gap-5 text-xs text-gray-500 shrink-0">
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  {a._count.users}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {a._count.documents}
                </span>
              </div>

              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0 ${STATUS_STYLE[a.status]}`}>
                {STATUS_LABEL[a.status]}
              </span>

              <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0 -mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
