"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import FormOrcamento from "@/components/forms/FormOrcamento";
import { RecentDocs } from "@/components/ui/RecentDocs";
import { PdfReadyModal } from "@/components/ui/PdfReadyModal";
import { LoadingDocument } from "@/components/ui/LoadingDocument";
import { gerarNumeroDoc, hoje } from "@/utils/form";
import { useFormContext } from "@/context/FormContext";
import { defaultContratoValues } from "@/components/forms/FormContrato";

export default function OrcamentoPage() {
  const router = useRouter();
  const {
    artistDisplayName,
    orcamento, setOrcamento,
    numeroOrc, setNumeroOrc,
    setContrato,
    orcamentoFontScale, setOrcamentoFontScale,
    orcamentoLogoScale, setOrcamentoLogoScale
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!numeroOrc) setNumeroOrc(gerarNumeroDoc("ORC"));
  }, [numeroOrc, setNumeroOrc]);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setPdfUrl(null);
    
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({ 
          type: "orcamento", 
          data: { 
            numero: numeroOrc, 
            ...orcamento,
            fontScale: orcamentoFontScale,
            logoScale: orcamentoLogoScale
          } 
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao gerar PDF");
      setPdfUrl(json.pdfUrl);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setLoading(false);
  }

  function orcamentoToContrato(d: Record<string, unknown>) {
    setContrato((prev: any) => ({
      ...prev,
      evento: d.evento || prev.evento,
      local: d.local || prev.local,
      cidadeEvento: d.cidade || prev.cidadeEvento,
      data: d.data || prev.data,
      dataAssinatura: hoje(),
      horario: d.horario || prev.horario,
      horas: d.horas || prev.horas,
      cache: d.cache || prev.cache,
      formaPagamento: d.formaPagamento || prev.formaPagamento,
      fraseRodape: d.fraseRodape || prev.fraseRodape,
    }));
    router.push("/admin/contrato");
  }

  function handleFazerContrato() {
    orcamentoToContrato(orcamento as unknown as Record<string, unknown>);
  }

  return (
    <div>
      {/* Header com visual do design */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        padding: "22px 0 18px",
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: "-0.02em",
            color: "#f1f5f9",
            lineHeight: 1.15,
          }}>Novo Orçamento</h1>
          <div style={{ marginTop: 4, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#6b7280" }}>
            Preencha os dados do evento
          </div>
        </div>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          borderRadius: 999,
          background: "rgba(230,184,0,0.08)",
          border: "1px solid rgba(230,184,0,0.25)",
          color: "#f5c842",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}>
          {numeroOrc || "—"}
        </div>
      </div>

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 13,
          color: "#f87171",
          marginBottom: 14,
        }}>
          {error}
        </div>
      )}

      <FormOrcamento
        values={orcamento}
        onChange={setOrcamento}
        onSubmit={handleSubmit}
        onFazerContrato={handleFazerContrato}
        artistName={artistDisplayName}
        loading={loading}
      />

      {loading && (
        <LoadingDocument 
          documentType="orcamento" 
          onCancel={handleCancel}
        />
      )}

      {pdfUrl && (
        <PdfReadyModal
          pdfUrl={pdfUrl}
          documentType="orcamento"
          onClose={() => setPdfUrl(null)}
        />
      )}

      <RecentDocs
        type="BUDGET"
        onLoad={(d) => setOrcamento({ ...orcamento, ...(d as Partial<typeof orcamento>) })}
        onToContrato={orcamentoToContrato}
      />
    </div>
  );
}
