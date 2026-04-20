"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Artist = {
  id: string;
  name: string;
  subdomain: string;
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

function NewArtistModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", subdomain: "", email: "", password: "", primaryColor: "#f5c200" });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-stage-800 border border-stage-600 rounded-2xl p-6 w-full max-w-md space-y-4 animate-scale-in">
        <h2 className="text-base font-bold text-gray-100">Novo Artista</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {([
            ["name", "Nome do artista", "text"],
            ["subdomain", "Subdomínio", "text"],
            ["email", "E-mail de acesso", "email"],
            ["password", "Senha inicial", "password"],
          ] as [keyof typeof form, string, string][]).map(([k, label, type]) => (
            <div key={k}>
              <label className="label">{label}</label>
              <input
                type={type}
                className="input-field"
                value={form[k]}
                onChange={(e) => set(k, e.target.value)}
                required
              />
            </div>
          ))}
          <div>
            <label className="label">Cor primária</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)}
                className="w-10 h-10 rounded-lg border border-stage-500 bg-stage-700 cursor-pointer p-1" />
              <input className="input-field font-mono uppercase" value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)} maxLength={7} />
            </div>
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stage-500 text-gray-400 hover:text-gray-200 text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary py-2.5 text-sm">
              {loading ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ArtistasPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filtered, setFiltered] = useState<Artist[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/super/artists").then((r) => r.json()).then((data) => {
      setArtists(data);
      setFiltered(data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(artists.filter((a) =>
      a.name.toLowerCase().includes(q) || a.subdomain.toLowerCase().includes(q)
    ));
  }, [search, artists]);

  return (
    <div className="space-y-6">
      {showNew && <NewArtistModal onClose={() => setShowNew(false)} onCreated={load} />}

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-100">Artistas</h1>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-gold-500 text-stage-900 text-sm font-bold rounded-xl hover:bg-gold-400 transition-colors">
          + Novo artista
        </button>
      </div>

      <input
        className="input-field"
        placeholder="Buscar por nome ou subdomínio..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-stage-700/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 text-sm">Nenhum artista encontrado.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Link key={a.id} href={`/super-admin/artistas/${a.id}`}
              className="card flex items-center gap-4 hover:border-stage-400 transition-colors cursor-pointer">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: a.primaryColor }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200">{a.name}</p>
                <p className="text-xs text-gray-500">{a.subdomain}.formalize.com.br</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-600 shrink-0">
                <span>{a._count.users} usuário{a._count.users !== 1 ? "s" : ""}</span>
                <span>{a._count.documents} docs</span>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border shrink-0 ${STATUS_STYLE[a.status]}`}>
                {STATUS_LABEL[a.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
