"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { formatarTelefone } from "@/utils/form";

// ── Types ────────────────────────────────────────────────────────────────────

type Artist = {
  id: string; name: string;
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

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  active: boolean;
  forcePasswordChange: boolean;
  createdAt: string;
};
type Doc = { id: string; type: string; title: string; pdfUrl: string | null; createdAt: string };

const STATUS_OPTIONS = ["ACTIVE", "SUSPENDED", "CANCELLED"] as const;
const STATUS_LABEL = { ACTIVE: "Ativo", SUSPENDED: "Suspenso", CANCELLED: "Cancelado" };

// ── Tab: Dados ───────────────────────────────────────────────────────────────

function TabDados({ artist, onSaved }: { artist: Artist; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: artist.name ?? "", customDomain: "",
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function genPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789!@#";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs text-gold-400 hover:text-gold-300 font-medium shrink-0 transition-colors"
    >
      {copied ? "Copiado!" : label}
    </button>
  );
}

// ── Tab: Usuários ────────────────────────────────────────────────────────────

function TabUsuarios({ artist, onRefresh }: { artist: Artist; onRefresh: () => void }) {
  const [users, setUsers] = useState<User[]>(artist.users);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", email: "", password: genPassword(), forcePasswordChange: true });
  const [showNewPass, setShowNewPass] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Per-user reset state
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPass, setResetPass] = useState(() => genPassword());
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{ sent: boolean; message?: string } | null>(null);

  // Per-user toggling (active / forcePasswordChange)
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => { setUsers(artist.users); }, [artist.users]);

  function openReset(uid: string) {
    setResetId(uid);
    setResetPass(genPassword());
    setShowResetPass(false);
    setResetDone(false);
    setWhatsappStatus(null);
  }

  function closeReset() {
    setResetId(null);
    setResetDone(false);
    setWhatsappStatus(null);
  }

  function patchUser(updated: User) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch(`/api/super/artists/${artist.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers((u) => [...u, json]);
      setShowNew(false);
      setNewForm({ name: "", email: "", password: genPassword(), forcePasswordChange: true });
      onRefresh();
    } catch (err) { setCreateError(err instanceof Error ? err.message : "Erro"); }
    finally { setCreating(false); }
  }

  async function resetPassword() {
    if (!resetId || !resetPass.trim()) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/super/artists/${artist.id}/users/${resetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPass, forcePasswordChange: true }),
      });
      const json = await res.json();
      if (res.ok) { 
        patchUser(json); 
        setResetDone(true); 
        if (json.whatsappStatus) {
          setWhatsappStatus(json.whatsappStatus);
        }
      }
    } finally { setResetting(false); }
  }

  async function toggleActive(u: User) {
    setToggling(u.id);
    try {
      const res = await fetch(`/api/super/artists/${artist.id}/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !u.active }),
      });
      const json = await res.json();
      if (res.ok) patchUser(json);
    } finally { setToggling(null); }
  }

  async function toggleForcePasswordChange(u: User) {
    setToggling(u.id);
    try {
      const res = await fetch(`/api/super/artists/${artist.id}/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forcePasswordChange: !u.forcePasswordChange }),
      });
      const json = await res.json();
      if (res.ok) patchUser(json);
    } finally { setToggling(null); }
  }

  async function deleteUser(uid: string) {
    if (!confirm("Remover este usuário permanentemente?")) return;
    await fetch(`/api/super/artists/${artist.id}/users/${uid}`, { method: "DELETE" });
    setUsers((u) => u.filter((x) => x.id !== uid));
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{users.length} usuário{users.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { setShowNew(!showNew); setCreateError(""); }}
          className="px-3 py-1.5 text-xs font-medium rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors"
        >
          + Novo usuário
        </button>
      </div>

      {/* ── Create user form ── */}
      {showNew && (
        <form onSubmit={createUser} className="card space-y-3 animate-fade-in border-gold-500/30">
          <p className="text-sm font-semibold text-gray-200">Novo usuário</p>

          <div>
            <label className="label">Nome</label>
            <input type="text" className="input-field" value={newForm.name}
              onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} />
          </div>

          <div>
            <label className="label">E-mail</label>
            <input type="email" className="input-field" value={newForm.email}
              onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Senha inicial</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setNewForm((f) => ({ ...f, password: genPassword() }))}
                  className="text-xs text-gold-400 hover:text-gold-300">Gerar nova</button>
                <CopyBtn text={newForm.password} />
              </div>
            </div>
            <div className="relative">
              <input type={showNewPass ? "text" : "password"} className="input-field pr-14 font-mono"
                value={newForm.password} onChange={(e) => setNewForm((f) => ({ ...f, password: e.target.value }))}
                required minLength={6} />
              <button type="button" onClick={() => setShowNewPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300">
                {showNewPass ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={newForm.forcePasswordChange}
              onChange={(e) => setNewForm((f) => ({ ...f, forcePasswordChange: e.target.checked }))}
              className="accent-gold-500 w-4 h-4" />
            <span className="text-xs text-gray-400">Forçar troca de senha no primeiro acesso</span>
          </label>

          {createError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{createError}</p>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowNew(false)}
              className="flex-1 py-2 rounded-xl border border-stage-500 text-gray-400 text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={creating} className="flex-1 btn-primary text-sm py-2">
              {creating ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>
      )}

      {/* ── User list ── */}
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card space-y-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-200 truncate">{u.name || "—"}</p>
                  {/* Active / blocked badge */}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                    u.active
                      ? "text-green-400 bg-green-500/10 border-green-500/30"
                      : "text-red-400 bg-red-500/10 border-red-500/30"
                  }`}>
                    {u.active ? "Ativo" : "Bloqueado"}
                  </span>
                  {/* Force password change badge */}
                  {u.forcePasswordChange && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md border text-yellow-400 bg-yellow-500/10 border-yellow-500/30 shrink-0">
                      Senha pendente
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                <p className="text-xs text-gray-700 mt-0.5">Criado {new Date(u.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Reset password */}
                <button
                  onClick={() => resetId === u.id ? setResetId(null) : openReset(u.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    resetId === u.id
                      ? "border-gold-500/60 text-gold-400 bg-gold-500/10"
                      : "border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400"
                  }`}
                >
                  Senha
                </button>
                {/* Block / Unblock */}
                <button
                  onClick={() => toggleActive(u)}
                  disabled={toggling === u.id}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    u.active
                      ? "border-stage-500 text-gray-400 hover:border-red-500/50 hover:text-red-400"
                      : "border-green-500/40 text-green-400 hover:bg-green-500/10"
                  }`}
                >
                  {toggling === u.id ? "..." : u.active ? "Bloquear" : "Ativar"}
                </button>
                {/* Delete */}
                <button
                  onClick={() => deleteUser(u.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Force password change toggle row */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-stage-700">
              <span className="text-xs text-gray-500">
                {u.forcePasswordChange ? "Troca de senha obrigatória no próximo login" : "Senha confirmada pelo usuário"}
              </span>
              <button
                type="button"
                onClick={() => toggleForcePasswordChange(u)}
                disabled={toggling === u.id}
                className="text-xs text-gold-400 hover:text-gold-300 transition-colors shrink-0"
              >
                {u.forcePasswordChange ? "Remover obrigação" : "Forçar troca"}
              </button>
            </div>

            {/* Password reset panel */}
            {resetId === u.id && (() => {
              const appUrl = process.env.NEXT_PUBLIC_ROOT_DOMAIN
                ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
                : "https://app.formalize.com.br";
              const waPhone = (artist.whatsapp ?? "").replace(/\D/g, "");
              const waMsg1 = `Olá! Sua senha no *Formalize* foi redefinida.\n\nAcesse pelo link:\n${appUrl}/login\n\nSeu e-mail de login: *${u.email}*\n\nVou enviar sua nova senha temporária na próxima mensagem.\n\n📲 *Lembre-se:* instale o app tocando em "Adicionar à tela inicial" para acesso rápido!`;
              const waMsg2 = `🔑 Sua nova senha temporária:\n\n*${resetPass}*\n\nNo próximo login você será solicitado a criar uma senha nova.`;

              if (resetDone) {
                return (
                  <div className="space-y-2 pt-2 border-t border-stage-700 animate-fade-in">
                    <p className="text-xs font-semibold text-green-400">✓ Senha alterada</p>
                    
                    {/* WhatsApp Status */}
                    {whatsappStatus && (
                      whatsappStatus.sent ? (
                        <p className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
                          ✓ Mensagem enviada automaticamente via WhatsApp
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                          ✗ {whatsappStatus.message}
                        </p>
                      )
                    )}

                    <div className="bg-stage-700 border border-stage-600 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Nova senha temporária</p>
                        <p className="text-sm font-mono text-gray-200">{resetPass}</p>
                      </div>
                      <CopyBtn text={resetPass} />
                    </div>
                    
                    {/* Manual buttons (fallback if WhatsApp failed) */}
                    
                    <button type="button" onClick={closeReset}
                      className="w-full py-1.5 rounded-xl border border-stage-500 text-gray-400 text-xs transition-colors">
                      Fechar
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-2 pt-2 border-t border-stage-700 animate-fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 font-medium">Nova senha</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setResetPass(genPassword())}
                        className="text-xs text-gold-400 hover:text-gold-300">Gerar nova</button>
                      <CopyBtn text={resetPass} />
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type={showResetPass ? "text" : "password"}
                      className="input-field text-sm font-mono pr-14"
                      value={resetPass}
                      onChange={(e) => setResetPass(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowResetPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300">
                      {showResetPass ? "Ocultar" : "Ver"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">A troca de senha no próximo login será ativada automaticamente.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={closeReset}
                      className="flex-1 py-1.5 rounded-xl border border-stage-500 text-gray-400 text-xs transition-colors">
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={resetPassword}
                      disabled={resetting || resetPass.length < 6}
                      className="flex-1 btn-primary text-xs py-1.5"
                    >
                      {resetting ? "Salvando..." : "Confirmar nova senha"}
                    </button>
                  </div>
                </div>
              );
            })()}
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
            <p className="text-xs text-gray-500">ID: {artist.id.slice(0, 8)}...</p>
          </div>
        </div>
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
