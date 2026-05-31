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

function buildGCalLink(doc: Doc): string {
  const d = doc.data;
  const dateStr = (d.data as string) || new Date(doc.createdAt).toISOString().slice(0, 10);
  const [y, m, dy] = dateStr.split("-");
  const horario = (d.horario as string) || "";
  const tm = horario.match(/(\d{1,2})[:h](\d{0,2})/);
  let datePart: string;
  if (tm) {
    const h = String(parseInt(tm[1], 10)).padStart(2, "0");
    const mi = String(parseInt(tm[2] || "0", 10)).padStart(2, "0");
    const eh = String((parseInt(tm[1], 10) + 2) % 24).padStart(2, "0");
    datePart = `${y}${m}${dy}T${h}${mi}00/${y}${m}${dy}T${eh}${mi}00`;
  } else {
    const nd = new Date(parseInt(y), parseInt(m) - 1, parseInt(dy) + 1);
    datePart = `${y}${m}${dy}/${nd.getFullYear()}${String(nd.getMonth() + 1).padStart(2, "0")}${String(nd.getDate()).padStart(2, "0")}`;
  }
  const contratante = (d.contratanteNome as string) || (d.contratante as string) || "";
  const evento = (d.evento as string) || "";
  const title = encodeURIComponent(contratante ? `${contratante}${evento ? ` — ${evento}` : ""}` : doc.title);
  const local = (d.local as string) || (d.cidade as string) || "";
  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datePart}`;
  if (local) url += `&location=${encodeURIComponent(local)}`;
  return url;
}

const EXEMPLOS = {
  BUDGET: [
    { contratante: "João da Silva", evento: "Aniversário 30 Anos", data: "15/06/26" },
    { contratante: "Espaço Monteiro", evento: "Casamento · Sábado", data: "20/07/26" },
  ],
  CONTRACT: [
    { contratante: "Ana Paula Santos", evento: "Formatura Turma", data: "30/05/26" },
    { contratante: "Bar Estação Viva", evento: "Show Semanal", data: "05/06/26" },
  ],
};

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

  const label = type === "BUDGET" ? "Orçamentos recentes" : "Contratos recentes";

  if (docs.length === 0) return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="!mt-3 space-y-2" style={{ opacity: 0.4, pointerEvents: "none" }}>
        {EXEMPLOS[type].map((ex, i) => (
          <div key={i} className="card flex items-center gap-3 py-3" style={{ borderStyle: "dashed" }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-300 truncate">{ex.contratante}</p>
              <p className="text-xs text-gray-600 truncate">{ex.evento} · {ex.data}</p>
            </div>
            <span style={{ fontSize: 9, color: "#4b5563", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              exemplo
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-700" style={{ marginTop: 4 }}>
        {label} aparecerão aqui
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="!mt-3 space-y-2">
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
              <a
                href={buildGCalLink(doc)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors"
                title="Adicionar ao Google Agenda"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </a>
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
                type="button"
                onClick={() => onLoad(doc.data)}
                className="px-2.5 py-1 text-xs rounded-lg border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors"
                title="Carregar no formulário"
              >
                Carregar
              </button>

              {onToContrato && (
                <button
                  type="button"
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
