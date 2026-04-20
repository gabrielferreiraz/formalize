"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { formatarTelefone } from "@/utils/form";

// ── Types ────────────────────────────────────────────────────────────────────

type Artist = {
  id: string; name: string; subdomain: string; customDomain: string | null;
  logoUrl: string | null; backgroundUrl: string | null;
  primaryColor: string; secondaryColor: string;
  whatsapp: string | null; email: string | null; instagram: string | null;
  spotify: string | null; x: string | null; youtube: string | null; website: string | null;
  pixKey: string | null; legalName: string | null; cnpj: string | null;
  basePdfUrl: string | null; baseContractPdfUrl: string | null;
  paperWidth: string | null; paperHeight: string | null; instruments: string | null;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  bankInfo: Record<string, string> | null;
  address: Record<string, string> | null;
  users: User[];
  _count: { documents: number };
};

type User = { id: string; name: string | null; email: string; role: string; createdAt: string };
type Doc = { id: string; type: string; title: string; pdfUrl: string | null; createdAt: string };

const STATUS_OPTIONS = ["ACTIVE", "SUSPENDED", "CANCELLED"] as const;
const STATUS_LABEL = { ACTIVE: "Ativo", SUSPENDED: "Suspenso", CANCELLED: "Cancelado" };

// ── Tab: Dados ───────────────────────────────────────────────────────────────

function TabDados({ artist, onSaved }: { artist: Artist; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: artist.name ?? "", subdomain: artist.subdomain ?? "", customDomain: artist.customDomain ?? "",
    logoUrl: artist.logoUrl ?? "", backgroundUrl: artist.backgroundUrl ?? "",
    primaryColor: artist.primaryColor ?? "#f5c200", secondaryColor: artist.secondaryColor ?? "#ffffff",
    whatsapp: artist.whatsapp ?? "", email: artist.email ?? "",
    instagram: artist.instagram ?? "", spotify: artist.spotify ?? "",
    x: artist.x ?? "", youtube: artist.youtube ?? "", website: artist.website ?? "",
    pixKey: artist.pixKey ?? "", legalName: artist.legalName ?? "", cnpj: artist.cnpj ?? "",
    basePdfUrl: artist.basePdfUrl ?? "", baseContractPdfUrl: artist.baseContractPdfUrl ?? "",
    paperWidth: artist.paperWidth ?? "", paperHeight: artist.paperHeight ?? "",
    instruments: artist.instruments ?? "", status: artist.status,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); setSaved(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(`/api/super/artists/${artist.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true); onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Erro"); }
    finally { setSaving(false); }
  }

  function F({ label, k, type = "text", placeholder = "" }: { label: string; k: keyof typeof form; type?: string; placeholder?: string }) {
    return (
      <div>
        <label className="label">{label}</label>
        <input type={type} className="input-field" value={form[k]} placeholder={placeholder}
          onChange={(e) => set(k, e.target.value)} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Identidade</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Nome" k="name" />
          <F label="Subdomínio" k="subdomain" placeholder="givago" />
          <F label="Domínio customizado" k="customDomain" placeholder="meudoc.com.br" />
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <F label="Logo URL" k="logoUrl" />
          <F label="Background URL" k="backgroundUrl" />
          <div>
            <label className="label">Cor primária</label>
            <div className="flex gap-3">
              <input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)}
                className="w-10 h-10 rounded-lg border border-stage-500 bg-stage-700 cursor-pointer p-1" />
              <input className="input-field font-mono uppercase" value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)} maxLength={7} />
            </div>
          </div>
          <div>
            <label className="label">Cor secundária</label>
            <div className="flex gap-3">
              <input type="color" value={form.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)}
                className="w-10 h-10 rounded-lg border border-stage-500 bg-stage-700 cursor-pointer p-1" />
              <input className="input-field font-mono uppercase" value={form.secondaryColor}
                onChange={(e) => set("secondaryColor", e.target.value)} maxLength={7} />
            </div>
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Contato e Redes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">WhatsApp</label>
            <input className="input-field" value={form.whatsapp}
              onChange={(e) => set("whatsapp", formatarTelefone(e.target.value))} placeholder="(00) 00000-0000" />
          </div>
          <F label="E-mail" k="email" type="email" />
          <F label="Website" k="website" />
          <F label="Instagram" k="instagram" />
          <F label="Spotify" k="spotify" />
          <F label="X (Twitter)" k="x" />
          <F label="YouTube" k="youtube" />
        </div>
      </section>

      <section className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Dados Jurídicos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Nome legal" k="legalName" />
          <F label="CNPJ" k="cnpj" />
          <F label="Chave Pix" k="pixKey" />
        </div>
      </section>

      <section className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">PDFs e Documentos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Base PDF (orçamento)" k="basePdfUrl" />
          <F label="Base PDF (contrato)" k="baseContractPdfUrl" />
          <F label="Largura do papel (cm)" k="paperWidth" placeholder="34.44" />
          <F label="Altura do papel (cm)" k="paperHeight" placeholder="48.71" />
          <div className="sm:col-span-2">
            <F label="Instrumentos" k="instruments" placeholder="Bateria, Guitarra, Baixo..." />
          </div>
        </div>
      </section>

      {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>}
      {saved && <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2 animate-fade-in">Salvo com sucesso.</p>}

      <button type="submit" disabled={saving} className="btn-primary">{saving ? "Salvando..." : "Salvar alterações"}</button>
    </form>
  );
}

// ── Tab: Usuários ────────────────────────────────────────────────────────────

function TabUsuarios({ artist, onRefresh }: { artist: Artist; onRefresh: () => void }) {
  const [users, setUsers] = useState<User[]>(artist.users);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");
  const [resetResult, setResetResult] = useState<Record<string, string>>({});

  useEffect(() => { setUsers(artist.users); }, [artist.users]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`/api/super/artists/${artist.id}/users`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers((u) => [...u, json]);
      setShowNew(false);
      setNewForm({ name: "", email: "", password: "" });
      onRefresh();
    } catch (err) { alert(err instanceof Error ? err.message : "Erro"); }
    finally { setCreating(false); }
  }

  async function resetPassword(uid: string) {
    if (!newPass.trim()) return;
    const res = await fetch(`/api/super/artists/${artist.id}/users/${uid}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: newPass }),
    });
    if (res.ok) { setResetResult((r) => ({ ...r, [uid]: "Senha alterada!" })); setResetId(null); setNewPass(""); }
  }

  async function deleteUser(uid: string) {
    if (!confirm("Remover este usuário?")) return;
    await fetch(`/api/super/artists/${artist.id}/users/${uid}`, { method: "DELETE" });
    setUsers((u) => u.filter((x) => x.id !== uid));
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{users.length} usuário{users.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowNew(!showNew)}
          className="px-3 py-1.5 text-xs font-medium rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors">
          + Novo usuário
        </button>
      </div>

      {showNew && (
        <form onSubmit={createUser} className="card space-y-3 animate-fade-in">
          <p className="text-sm font-semibold text-gray-300">Novo usuário</p>
          {(["name", "email", "password"] as const).map((k) => (
            <div key={k}>
              <label className="label">{k === "name" ? "Nome" : k === "email" ? "E-mail" : "Senha"}</label>
              <input type={k === "password" ? "password" : k === "email" ? "email" : "text"}
                className="input-field" value={newForm[k]}
                onChange={(e) => setNewForm((f) => ({ ...f, [k]: e.target.value }))}
                required={k !== "name"} />
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowNew(false)}
              className="flex-1 py-2 rounded-xl border border-stage-500 text-gray-400 text-sm transition-colors">Cancelar</button>
            <button type="submit" disabled={creating} className="flex-1 btn-primary text-sm py-2">
              {creating ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{u.name || "—"}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-600 hidden sm:block">
                  {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                </span>
                <button onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPass(""); }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors">
                  Senha
                </button>
                <button onClick={() => deleteUser(u.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>
            {resetId === u.id && (
              <div className="flex gap-2 animate-fade-in">
                <input type="password" className="input-field text-sm" placeholder="Nova senha"
                  value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                <button onClick={() => resetPassword(u.id)}
                  className="px-3 py-2 bg-gold-500 text-stage-900 text-xs font-bold rounded-xl hover:bg-gold-400 transition-colors whitespace-nowrap">
                  Confirmar
                </button>
              </div>
            )}
            {resetResult[u.id] && (
              <p className="text-xs text-green-400 animate-fade-in">{resetResult[u.id]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Documentos ──────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = { BUDGET: "Orçamento", CONTRACT: "Contrato" };
const TYPE_COLOR: Record<string, string> = {
  BUDGET: "text-gold-400 bg-gold-500/10 border-gold-500/30",
  CONTRACT: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

function TabDocumentos({ artistId }: { artistId: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/super/artists/${artistId}/documents?page=${page}`);
    const json = await res.json();
    setDocs(json.documents ?? []);
    setTotal(json.total ?? 0);
    setPages(json.pages ?? 1);
    setLoading(false);
  }, [artistId, page]);

  useEffect(() => { load(); }, [load]);

  async function deleteDoc(docId: string) {
    if (!confirm("Remover este documento?")) return;
    await fetch(`/api/super/artists/${artistId}/documents`, {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ docId }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">{total} documento{total !== 1 ? "s" : ""}</p>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card h-14 animate-pulse bg-stage-700/50" />)}</div>
      ) : docs.length === 0 ? (
        <div className="card text-center py-10 text-gray-500 text-sm">Nenhum documento.</div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="card flex items-center gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${TYPE_COLOR[doc.type] ?? ""}`}>
                {TYPE_LABEL[doc.type] ?? doc.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{doc.title || "—"}</p>
                <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {doc.pdfUrl && (
                  <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors">
                    PDF
                  </a>
                )}
                <button onClick={() => deleteDoc(doc.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors disabled:opacity-30">← Anterior</button>
          <span className="text-xs text-gray-500">{page} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1.5 text-xs rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors disabled:opacity-30">Próximo →</button>
        </div>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

const TABS = ["Dados", "Usuários", "Documentos"] as const;

export default function ArtistDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Dados");

  const load = useCallback(async () => {
    const res = await fetch(`/api/super/artists/${id}`);
    if (!res.ok) { router.replace("/super-admin/artistas"); return; }
    setArtist(await res.json());
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  if (!artist) {
    return (
      <div className="space-y-6">
        <div className="card h-12 w-48 animate-pulse bg-stage-700/50" />
        <div className="card h-64 animate-pulse bg-stage-700/50" />
      </div>
    );
  }

  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "formalize.com.br";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push("/super-admin/artistas")}
            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-100">{artist.name}</h1>
            <p className="text-xs text-gray-500">{artist.subdomain}.{ROOT_DOMAIN}</p>
          </div>
        </div>
        <a
          href={`http://${artist.subdomain}.${ROOT_DOMAIN}/admin`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-xs font-medium rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors shrink-0"
        >
          Abrir painel do artista ↗
        </a>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-stage-500 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium transition-all duration-150 ${
              tab === t
                ? "bg-gold-500 text-stage-900"
                : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-stage-700/50"
            }`}>
            {t}
            {t === "Documentos" && <span className="ml-1.5 text-xs opacity-60">{artist._count.documents}</span>}
            {t === "Usuários" && <span className="ml-1.5 text-xs opacity-60">{artist.users.length}</span>}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      {tab === "Dados" && <TabDados artist={artist} onSaved={load} />}
      {tab === "Usuários" && <TabUsuarios artist={artist} onRefresh={load} />}
      {tab === "Documentos" && <TabDocumentos artistId={artist.id} />}
    </div>
  );
}
