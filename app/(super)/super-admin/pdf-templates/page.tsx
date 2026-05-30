"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Artist = { id: string; name: string; subdomain: string; primaryColor: string };
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

const TYPE_LABEL: Record<string, string> = { orcamento: "Orçamento", contrato: "Contrato" };
const TYPE_COLOR: Record<string, string> = {
  orcamento: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
  contrato:  "bg-purple-500/15 text-purple-400 border border-purple-500/25",
};

type CreatedMapping = { id: string; name: string; type: string };

// ─── New Template Modal ───────────────────────────────────────────────────────

function NewTemplateModal({
  artists,
  preselectedArtistId,
  onClose,
  onCreated,
}: {
  artists: Artist[];
  preselectedArtistId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    artistId: preselectedArtistId,
    type: "contrato",
    name: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedMapping | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecione um arquivo PDF"); return; }
    if (!form.artistId) { setError("Selecione um artista"); return; }
    setLoading(true);
    setError("");
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
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate() {
    if (!created) return;
    setActivating(true);
    await fetch(`/api/super/pdf-templates/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    setActivating(false);
    onCreated();
    onClose();
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4">
        <div className="bg-stage-800 border border-stage-600 rounded-2xl p-6 w-full max-w-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-100">Template criado!</p>
              <p className="text-xs text-gray-500">{created.name} · {TYPE_LABEL[created.type]}</p>
            </div>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => router.push(`/super-admin/pdf-templates/${created.id}/editor`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stage-500 bg-stage-700/50 hover:bg-stage-700 text-left transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gray-200">Posicionar campos</p>
                <p className="text-xs text-gray-500">Abrir o editor de canvas</p>
              </div>
            </button>
            <button
              onClick={() => window.open(`/api/super/pdf-templates/${created.id}/test`, "_blank")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-stage-500 bg-stage-700/50 hover:bg-stage-700 text-left transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gray-200">Testar PDF</p>
                <p className="text-xs text-gray-500">Prévia com dados de exemplo</p>
              </div>
            </button>
            <button
              onClick={handleActivate}
              disabled={activating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gold-500/40 bg-gold-500/5 hover:bg-gold-500/10 text-left transition-colors disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e6b800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gold-400">{activating ? "Ativando…" : "Ativar template"}</p>
                <p className="text-xs text-gray-500">Usar este PDF na geração de documentos</p>
              </div>
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-stage-600 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-stage-800 border border-stage-600 rounded-2xl p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-100">Novo Template PDF</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Artist select (only shown if none pre-selected) */}
          {!preselectedArtistId && (
            <div>
              <label className="label">Artista</label>
              <select
                className="input-field"
                value={form.artistId}
                onChange={(e) => set("artistId", e.target.value)}
                required
              >
                <option value="">Selecionar artista…</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label className="label">Tipo de documento</label>
            <div className="grid grid-cols-2 gap-2">
              {(["contrato", "orcamento"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.type === t
                      ? "border-gold-500 bg-gold-500/10 text-gold-400"
                      : "border-stage-500 text-gray-400 hover:border-stage-400 hover:text-gray-200"
                  }`}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label">Nome do template</label>
            <input
              type="text"
              className="input-field"
              placeholder={`Template ${TYPE_LABEL[form.type]} 2025`}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* PDF upload */}
          <div>
            <label className="label">Arquivo PDF base</label>
            {file ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-green-500/30 bg-green-500/5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-xs text-gray-300 truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="shrink-0 text-gray-500 hover:text-red-400 transition-colors text-base leading-none"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-stage-500 rounded-xl p-5 text-center hover:border-gold-500/60 hover:bg-gold-500/3 transition-all group"
              >
                <svg className="mx-auto mb-2 text-gray-600 group-hover:text-gold-600 transition-colors" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm text-gray-500 group-hover:text-gray-400">Clique para selecionar o PDF</p>
                <p className="text-xs text-gray-600 mt-0.5">Máx 20MB · apenas .pdf</p>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stage-500 text-gray-400 hover:text-gray-200 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-2.5 text-sm"
            >
              {loading ? "Criando…" : "Criar Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Artist avatar ────────────────────────────────────────────────────────────

function ArtistAvatar({ artist, size = 36 }: { artist: Artist; size?: number }) {
  const initials = artist.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        background: `${artist.primaryColor}22`,
        border: `1.5px solid ${artist.primaryColor}55`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: artist.primaryColor || "#e6b800",
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  mapping,
  onToggleActive,
  onDelete,
  deleting,
}: {
  mapping: Mapping;
  onToggleActive: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="card flex flex-col gap-3 hover:border-stage-500 transition-colors">
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* PDF icon */}
        <div className="w-9 h-9 rounded-lg bg-stage-700 border border-stage-600 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${TYPE_COLOR[mapping.type] ?? "bg-stage-600 text-gray-400"}`}>
              {TYPE_LABEL[mapping.type] ?? mapping.type}
            </span>
            {mapping.isActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-semibold">
                Ativo
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-200 mt-1 truncate">{mapping.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {mapping.pageCount} {mapping.pageCount === 1 ? "página" : "páginas"} · {(mapping.fields as unknown[]).length} campos
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 border-t border-stage-700 pt-3">
        <Link
          href={`/super-admin/pdf-templates/${mapping.id}/editor`}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-stage-500 text-xs text-gray-300 hover:text-white hover:border-stage-400 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Editar
        </Link>

        <button
          onClick={() => window.open(`/api/super/pdf-templates/${mapping.id}/test`, "_blank")}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-stage-500 text-xs text-gray-300 hover:text-white hover:border-stage-400 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
          Testar
        </button>

        <button
          onClick={onToggleActive}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs transition-colors ${
            mapping.isActive
              ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/8"
              : "border-green-500/30 text-green-400 hover:bg-green-500/8"
          }`}
        >
          {mapping.isActive ? "Desativar" : "Ativar"}
        </button>

        <button
          onClick={onDelete}
          disabled={deleting}
          title="Excluir template"
          className="p-1.5 rounded-lg border border-red-500/20 text-red-500/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/8 transition-colors disabled:opacity-40"
        >
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
      .then((data: Artist[]) => {
        setArtists(Array.isArray(data) ? data : []);
      });
  }, []);

  function loadMappings(artistId: string) {
    setLoadingMappings(true);
    fetch(`/api/super/pdf-templates?artistId=${artistId}`)
      .then((r) => r.json())
      .then((data) => setMappings(Array.isArray(data) ? data : []))
      .finally(() => setLoadingMappings(false));
  }

  function selectArtist(artist: Artist) {
    setSelectedArtist(artist);
    loadMappings(artist.id);
  }

  async function toggleActive(m: Mapping) {
    await fetch(`/api/super/pdf-templates/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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

  const filteredArtists = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.subdomain.toLowerCase().includes(search.toLowerCase())
  );

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

      <div className="flex h-[calc(100vh-64px-60px)] gap-0 -mx-4 -mt-2">

        {/* ── Left panel: artist list ──────────────────────────────────────── */}
        <div className="w-64 shrink-0 border-r border-stage-700 flex flex-col bg-stage-800/40">
          {/* Search */}
          <div className="p-3 border-b border-stage-700">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar artista…"
                className="w-full bg-stage-700 border border-stage-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Artist list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredArtists.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-6">
                {artists.length === 0 ? "Carregando…" : "Nenhum artista encontrado"}
              </p>
            )}
            {filteredArtists.map((a) => {
              const isSelected = selectedArtist?.id === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => selectArtist(a)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-gold-500/10 border border-gold-500/25"
                      : "border border-transparent hover:bg-stage-700/60 hover:border-stage-600"
                  }`}
                >
                  <ArtistAvatar artist={a} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isSelected ? "text-gold-300" : "text-gray-200"}`}>
                      {a.name}
                    </p>
                    <p className="text-[10px] text-gray-600 truncate">{a.subdomain}</p>
                  </div>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right panel: templates ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedArtist ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-stage-700 border border-stage-600 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-400">Selecione um artista</p>
                <p className="text-xs text-gray-600 mt-1">Escolha um artista na lista ao lado para ver e gerenciar seus templates PDF</p>
              </div>
            </div>
          ) : (
            <>
              {/* Artist header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-stage-700 shrink-0">
                <ArtistAvatar artist={selectedArtist} size={38} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-100 truncate">{selectedArtist.name}</p>
                  <p className="text-xs text-gray-500">{selectedArtist.subdomain}</p>
                </div>
                <button
                  onClick={() => setShowNew(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gold-500 text-stage-900 text-sm font-bold rounded-xl hover:bg-gold-400 transition-colors shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Novo Template
                </button>
              </div>

              {/* Templates area */}
              <div className="flex-1 overflow-y-auto p-5">
                {loadingMappings && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="card h-32 animate-pulse bg-stage-700/40" />
                    ))}
                  </div>
                )}

                {!loadingMappings && mappings.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                    <div className="w-12 h-12 rounded-xl bg-stage-700 border border-stage-600 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-medium">Nenhum template ainda</p>
                      <p className="text-xs text-gray-600 mt-1">Crie o primeiro template PDF para {selectedArtist.name}</p>
                    </div>
                    <button
                      onClick={() => setShowNew(true)}
                      className="mt-1 px-4 py-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm hover:bg-gold-500/20 transition-colors"
                    >
                      + Criar template
                    </button>
                  </div>
                )}

                {!loadingMappings && mappings.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {mappings.map((m) => (
                      <TemplateCard
                        key={m.id}
                        mapping={m}
                        onToggleActive={() => toggleActive(m)}
                        onDelete={() => handleDelete(m)}
                        deleting={deletingId === m.id}
                      />
                    ))}
                  </div>
                )  }
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
