"use client";

import useSWR from "swr";

type Doc = {
  id: string;
  title: string;
  pdfUrl: string | null;
  createdAt: string;
  data: Record<string, unknown>;
};

interface Props {
  type: "BUDGET" | "CONTRACT";
  onLoad: (data: Record<string, unknown>) => void;
  onToContrato?: (data: Record<string, unknown>) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function extractSubtitle(doc: Doc): string {
  const d = doc.data;
  const parts: string[] = [];
  if (d.evento) parts.push(d.evento as string);
  if (d.data) {
    const [y, m, day] = (d.data as string).split("-");
    parts.push(`${day}/${m}/${y}`);
  }
  return parts.join(" · ") || doc.title;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function RecentDocs({ type, onLoad, onToContrato }: Props) {
  const { data, isLoading: loading } = useSWR(`/api/documents?type=${type}&page=1&limit=3&includeData=1`, fetcher);
  const docs = (data?.documents ?? []) as Doc[];

  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-stage-700/40 animate-pulse" />
      ))}
    </div>
  );

  if (docs.length === 0) return null;

  const label = type === "BUDGET" ? "Orçamentos recentes" : "Contratos recentes";

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="!mt-5 space-y-2">
        {docs.map((doc, i) => (
          <div 
            key={doc.id} 
            className="card flex items-center gap-3 py-3 animate-fade-in transition-all duration-200 hover:-translate-y-0.5 hover:border-stage-500"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-300 truncate">
                {(doc.data.contratanteNome as string) || (doc.data.contratante as string) || "—"}
              </p>
              <p className="text-xs text-gray-600 truncate">{extractSubtitle(doc)}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {doc.pdfUrl && (
                <a
                  href={doc.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-600 hover:text-gold-400 transition-colors"
                  title="Abrir PDF"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}

              <button
                onClick={() => onLoad(doc.data)}
                className="px-2.5 py-1 text-xs rounded-lg border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors"
                title="Carregar no formulário"
              >
                Carregar
              </button>

              {onToContrato && (
                <button
                  onClick={() => onToContrato(doc.data)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-gold-600/50 text-gold-500 hover:bg-gold-500/10 transition-colors"
                  title="Usar como base para contrato"
                >
                  → Contrato
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
