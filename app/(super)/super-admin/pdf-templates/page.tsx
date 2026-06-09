"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Artist = { id: string; name: string; primaryColor: string; logoUrl?: string | null };
type Mapping = {
  id: string;
  artistId: string;
  type: string;
  name: string;
  pdfUrl: string;
  pageCount: number;
  isActive: boolean;
  fields: unknown[];
  createdAt: string;
};
type CreatedMapping = { id: string; name: string; type: string };

const TYPE_LABEL: Record<string, string> = { orcamento: "Orçamento", contrato: "Contrato" };
const TYPE_COLOR: Record<string, string> = {
  orcamento: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  contrato: "bg-purple-500/15 text-purple-400 border-purple-500/25",
};
const TYPE_DOT: Record<string, string> = { orcamento: "#60a5fa", contrato: "#a78bfa" };

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function ArtistAvatar({ artist, size = 36 }: { artist: Artist; size?: number }) {
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
      className="rounded-xl flex items-center justify-center shrink-0 font-bold select-none"
      style={{
        width: size, height: size,
        background: `${artist.primaryColor}20`,
        border: `1.5px solid ${artist.primaryColor}45`,
        color: artist.primaryColor,
        fontSize: size * 0.36,
      }}
    >
      {initials(artist.name)}
    </div>
  );
}

// ─── New Template Modal ───────────────────────────────────────────────────────

function NewTemplateModal({ artists, preselectedArtistId, onClose, onCreated }: {
  artists: Artist[];
  preselectedArtistId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ artistId: preselectedArtistId, type: "contrato", name: "" });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedMapping | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecione um arquivo PDF"); return; }
    if (!form.artistId) { setError("Selecione um artista"); return; }
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("artistId", form.artistId);
      fd.append("type", form.type);
      const upRes = await fetch("/api/super/pdf-templates/upload", { method: "POST", body: fd });
      const upJson = await upRes.json();
      if (!upRes.ok) throw new Error(upJson.error);

      const createRes = await fetch("/api/super/pdf-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: form.artistId,
          type: form.type,
          name: form.name || `Template ${TYPE_LABEL[form.type]}`,
          pdfUrl: upJson.url,
          pageCount: upJson.pageCount,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.error);
      onCreated();
      setCreated({ id: createJson.id, name: createJson.name, type: createJson.type });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar template");
    } finally { setLoading(false); }
  }

  async function handleActivate() {
    if (!created) return;
    setActivating(true);
    await fetch(`/api/super/pdf-templates/${created.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    setActivating(false); onCreated(); onClose();
  }

  if (created) {
    return (
      <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/70 animate-backdrop-fade"
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100dvh" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-stage-800 border border-stage-600 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm animate-scale-in overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-stage-600/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-100">Template criado</p>
                <p className="text-xs text-gray-500">{created.name} · {TYPE_LABEL[created.type]}</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {[
              {
                label: "Posicionar campos",
                sub: "Abrir editor de canvas",
                icon: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />,
                icon2: <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
                onClick: () => router.push(`/super-admin/pdf-templates/${created.id}/editor`),
              },
              {
                label: "Testar PDF",
                sub: "Prévia com dados de exemplo",
                icon: <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />,
                icon2: <circle cx="12" cy="12" r="3" />,
                onClick: () => window.open(`/api/super/pdf-templates/${created.id}/test`, "_blank"),
              },
            ].map(({ label, sub, icon, icon2, onClick }) => (
              <button key={label} onClick={onClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stage-500 bg-stage-700/40 hover:bg-stage-700 text-left transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {icon}{icon2}
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-200">{label}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
              </button>
            ))}
            <button onClick={handleActivate} disabled={activating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gold-500/35 bg-gold-500/5 hover:bg-gold-500/10 text-left transition-colors disabled:opacity-50">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e6b800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gold-400">{activating ? "Ativando…" : "Ativar template"}</p>
                <p className="text-xs text-gray-500">Usar este PDF na geração de documentos</p>
              </div>
            </button>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-stage-600 text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/70 animate-backdrop-fade"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100dvh" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-stage-800 border border-stage-600 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stage-600/60">
          <div>
            <h2 className="text-base font-bold text-gray-100">Novo template PDF</h2>
            <p className="text-xs text-gray-500 mt-0.5">Upload do PDF base + configuração</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-200 hover:bg-stage-700 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!preselectedArtistId && (
            <div>
              <label className="label">Artista</label>
              <select className="input-field" value={form.artistId} onChange={(e) => set("artistId", e.target.value)} required>
                <option value="">Selecionar artista…</option>
                {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Tipo de documento</label>
            <div className="grid grid-cols-2 gap-2">
              {(["contrato", "orcamento"] as const).map((t) => (
                <button key={t} type="button" onClick={() => set("type", t)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    form.type === t
                      ? "border-gold-500/60 bg-gold-500/10 text-gold-400"
                      : "border-stage-500 text-gray-400 hover:border-stage-400 hover:text-gray-200"
                  }`}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Nome do template</label>
            <input type="text" className="input-field"
              placeholder={`Template ${TYPE_LABEL[form.type]} 2025`}
              value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div>
            <label className="label">Arquivo PDF base</label>
            {file ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-sm text-gray-200 truncate flex-1 font-medium">{file.name}</span>
                <button type="button"
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="shrink-0 text-gray-500 hover:text-red-400 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") setFile(f); }}
                className={`w-full rounded-xl p-6 text-center transition-all ${
                  dragging
                    ? "border-2 border-gold-500/70 bg-gold-500/8"
                    : "border-2 border-dashed border-stage-500 hover:border-gold-500/50 hover:bg-stage-700/40"
                }`}>
                <svg className="mx-auto mb-2.5 text-gray-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm text-gray-400 font-medium">Arraste ou clique para selecionar</p>
                <p className="text-xs text-gray-600 mt-1">Apenas .pdf · máx 20 MB</p>
              </button>
            )}
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-stage-500 text-gray-400 hover:text-gray-200 hover:border-stage-400 text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-stage-900 text-sm font-bold transition-colors disabled:opacity-50">
              {loading ? "Enviando…" : "Criar template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({ mapping, onToggleActive, onDelete, deleting }: {
  mapping: Mapping;
  onToggleActive: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const dot = TYPE_DOT[mapping.type];
  return (
    <div className={`flex flex-col rounded-2xl border bg-stage-800 transition-all overflow-hidden ${
      mapping.isActive ? "border-gold-500/30" : "border-stage-600 hover:border-stage-500"
    }`}>
      {/* Top accent bar */}
      {mapping.isActive && <div className="h-[2px] w-full bg-gradient-to-r from-gold-500/80 via-gold-400/60 to-transparent" />}

      <div className="p-4 flex-1">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wide ${TYPE_COLOR[mapping.type] ?? "bg-stage-600 text-gray-400 border-stage-500"}`}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
            {TYPE_LABEL[mapping.type] ?? mapping.type}
          </span>
          {mapping.isActive && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-500/12 border border-gold-500/30 text-gold-400 font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              Ativo
            </span>
          )}
        </div>

        {/* Name */}
        <p className="text-sm font-bold text-gray-100 truncate mb-1">{mapping.name}</p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            {mapping.pageCount} {mapping.pageCount === 1 ? "página" : "páginas"}
          </span>
          <span className="text-stage-500">·</span>
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            {(mapping.fields as unknown[]).length} campos
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-stage-700/80 divide-x divide-stage-700/80">
        <Link href={`/super-admin/pdf-templates/${mapping.id}/editor`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:text-gray-200 hover:bg-stage-700/50 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Editar
        </Link>
        <button onClick={() => window.open(`/api/super/pdf-templates/${mapping.id}/test`, "_blank")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:text-gray-200 hover:bg-stage-700/50 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
          Testar
        </button>
        <button onClick={onToggleActive}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors hover:bg-stage-700/50 ${
            mapping.isActive ? "text-yellow-500 hover:text-yellow-400" : "text-green-500 hover:text-green-400"
          }`}>
          {mapping.isActive ? "Desativar" : "Ativar"}
        </button>
        <button onClick={onDelete} disabled={deleting} title="Excluir"
          className="px-3 py-2.5 text-gray-700 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PdfTemplatesPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [search, setSearch] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/super/artists")
      .then((r) => r.json())
      .then((data: Artist[]) => setArtists(Array.isArray(data) ? data : []));
  }, []);

  function loadMappings(artistId: string) {
    setLoadingMappings(true);
    fetch(`/api/super/pdf-templates?artistId=${artistId}`)
      .then((r) => r.json())
      .then((data) => setMappings(Array.isArray(data) ? data : []))
      .finally(() => setLoadingMappings(false));
  }

  function selectArtist(a: Artist) { setSelectedArtist(a); loadMappings(a.id); }

  async function toggleActive(m: Mapping) {
    await fetch(`/api/super/pdf-templates/${m.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    if (selectedArtist) loadMappings(selectedArtist.id);
  }

  async function handleDelete(m: Mapping) {
    if (!confirm(`Excluir "${m.name}"? O PDF será removido do armazenamento.`)) return;
    setDeletingId(m.id);
    await fetch(`/api/super/pdf-templates/${m.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (selectedArtist) loadMappings(selectedArtist.id);
  }

  const filteredArtists = artists.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = mappings.filter((m) => m.isActive).length;

  return (
    <>
      {showNew && (
        <NewTemplateModal
          artists={artists}
          preselectedArtistId={selectedArtist?.id ?? ""}
          onClose={() => setShowNew(false)}
          onCreated={() => selectedArtist && loadMappings(selectedArtist.id)}
        />
      )}

      <div className="flex h-[calc(100dvh-64px-60px)] md:h-[calc(100dvh-64px)] gap-0 -mx-4 -mt-2">

        {/* ── Sidebar ── */}
        <div className="w-60 shrink-0 border-r border-stage-700/80 flex flex-col bg-stage-900/60">
          <div className="px-3 py-3 border-b border-stage-700/80">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar artista…"
                className="w-full bg-stage-800 border border-stage-600/80 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-stage-400 transition-colors"
              />
            </div>
          </div>

          <div className="px-2 py-1.5 border-b border-stage-700/50">
            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest px-2 py-1">
              {filteredArtists.length} artista{filteredArtists.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-0.5">
            {filteredArtists.length === 0 && (
              <p className="text-xs text-gray-700 text-center py-8">
                {artists.length === 0 ? "Carregando…" : "Nenhum resultado"}
              </p>
            )}
            {filteredArtists.map((a) => {
              const isSelected = selectedArtist?.id === a.id;
              return (
                <button key={a.id} onClick={() => selectArtist(a)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-stage-700/80 border border-stage-500"
                      : "border border-transparent hover:bg-stage-800 hover:border-stage-700/60"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-2 w-[2px] h-6 rounded-full bg-gold-500" style={{ position: "relative", width: 2, height: 24, background: "#f5c200", borderRadius: 2, flexShrink: 0 }} />
                  )}
                  <ArtistAvatar artist={a} size={30} />
                  <p className={`text-xs font-semibold truncate flex-1 ${isSelected ? "text-gray-100" : "text-gray-400"}`}>
                    {a.name}
                  </p>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f5c200" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-stage-900/30">
          {!selectedArtist ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-stage-800 border border-stage-700 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400">Selecione um artista</p>
                <p className="text-xs text-gray-600 mt-1.5 max-w-[240px]">Escolha um artista na lista para visualizar e gerenciar seus templates PDF</p>
              </div>
            </div>
          ) : (
            <>
              {/* Artist header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-stage-700/80 shrink-0 bg-stage-800/40">
                <ArtistAvatar artist={selectedArtist} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-100 truncate">{selectedArtist.name}</p>
                  {!loadingMappings && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {mappings.length} template{mappings.length !== 1 ? "s" : ""}
                      {activeCount > 0 && <span className="text-gold-600 ml-1.5">· {activeCount} ativo{activeCount !== 1 ? "s" : ""}</span>}
                    </p>
                  )}
                </div>
                <button onClick={() => setShowNew(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gold-500 hover:bg-gold-400 text-stage-900 text-xs font-bold rounded-xl transition-colors shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Novo template
                </button>
              </div>

              {/* Templates grid */}
              <div className="flex-1 overflow-y-auto p-5">
                {loadingMappings && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-2xl border border-stage-700 h-36 animate-pulse bg-stage-800/60" style={{ animationDelay: `${(i - 1) * 80}ms` }} />
                    ))}
                  </div>
                )}

                {!loadingMappings && mappings.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-stage-800 border border-stage-700 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="13" x2="12" y2="17" /><line x1="12" y1="10" x2="12.01" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Nenhum template ainda</p>
                      <p className="text-xs text-gray-600 mt-1">Crie o primeiro template para {selectedArtist.name}</p>
                    </div>
                    <button onClick={() => setShowNew(true)}
                      className="px-4 py-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-semibold hover:bg-gold-500/15 transition-colors">
                      + Criar template
                    </button>
                  </div>
                )}

                {!loadingMappings && mappings.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {mappings.map((m) => (
                      <TemplateCard
                        key={m.id} mapping={m}
                        onToggleActive={() => toggleActive(m)}
                        onDelete={() => handleDelete(m)}
                        deleting={deletingId === m.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
