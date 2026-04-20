"use client";

import { useEffect, useState, useCallback } from "react";

type Doc = {
  id: string;
  type: "BUDGET" | "CONTRACT";
  title: string;
  pdfUrl: string | null;
  sentAt: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  BUDGET: "Orçamento",
  CONTRACT: "Contrato",
};

const TYPE_COLOR: Record<string, string> = {
  BUDGET: "text-gold-400 bg-gold-500/10 border-gold-500/30",
  CONTRACT: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?type=${filter}&page=${page}`);
      const json = await res.json();
      setDocs(json.documents ?? []);
      setTotal(json.total ?? 0);
      setPages(json.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  // reset page when filter changes
  useEffect(() => { setPage(1); }, [filter]);

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
      load();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Documentos</h1>
          <p className="text-xs text-gray-500 mt-0.5">{total} gerado{total !== 1 ? "s" : ""}</p>
        </div>

        {/* Filtro */}
        <div className="flex rounded-xl overflow-hidden border border-stage-500">
          {(["all", "BUDGET", "CONTRACT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                filter === t
                  ? "bg-gold-500 text-stage-900"
                  : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-stage-700/50"
              }`}
            >
              {t === "all" ? "Todos" : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-stage-700/50" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 text-sm">
          Nenhum documento encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="card flex items-center gap-4">
              {/* Badge tipo */}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${TYPE_COLOR[doc.type]}`}>
                {TYPE_LABEL[doc.type]}
              </span>

              {/* Título */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate font-medium">{doc.title || "—"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(doc.createdAt)}</p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 shrink-0">
                {doc.pdfUrl && (
                  <a
                    href={doc.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors"
                  >
                    Abrir PDF
                  </a>
                )}
                <button
                  onClick={() => setPendingDelete({ id: doc.id, title: doc.title || "este documento" })}
                  disabled={deleting === doc.id}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  title="Remover"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-stage-800 border border-stage-600 rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
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
        </div>
      )}

      {/* Paginação */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
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
