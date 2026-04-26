"use client";

import { useEffect, useState, useRef } from "react";
import FormContrato from "@/components/forms/FormContrato";
import { RecentDocs } from "@/components/ui/RecentDocs";
import { PdfReadyModal } from "@/components/ui/PdfReadyModal";
import { LoadingDocument } from "@/components/ui/LoadingDocument";
import { gerarNumeroDoc } from "@/utils/form";
import { useFormContext } from "@/context/FormContext";

export default function ContratoPage() {
  const {
    artistDisplayName,
    contrato, setContrato,
    numeroCtr, setNumeroCtr,
    contratoFontScale, setContratoFontScale,
    contratoLogoScale, setContratoLogoScale
  } = useFormContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!numeroCtr) setNumeroCtr(gerarNumeroDoc("CTR"));
  }, [numeroCtr, setNumeroCtr]);

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
          type: "contrato", 
          data: { 
            numeroContrato: numeroCtr, 
            ...contrato,
            fontScale: contratoFontScale,
            logoScale: contratoLogoScale
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
          }}>Novo Contrato</h1>
          <div style={{ marginTop: 4, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#6b7280" }}>
            Dados do contratante
          </div>
        </div>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          borderRadius: 999,
          background: "rgba(96,165,250,0.08)",
          border: "1px solid rgba(96,165,250,0.25)",
          color: "#60a5fa",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}>
          {numeroCtr || "—"}
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

      <FormContrato
        values={contrato}
        onChange={setContrato}
        onSubmit={handleSubmit}
        artistName={artistDisplayName}
        loading={loading}
      />

      {loading && (
        <LoadingDocument 
          documentType="contrato" 
          onCancel={handleCancel}
        />
      )}

      {pdfUrl && (
        <PdfReadyModal
          pdfUrl={pdfUrl}
          documentType="contrato"
          onClose={() => setPdfUrl(null)}
        />
      )}

      <RecentDocs
        type="CONTRACT"
        onLoad={(d) => setContrato((prev) => ({ ...prev, ...d }))}
      />
    </div>
  );
}
