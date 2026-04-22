"use client";

import { useEffect, useState } from "react";
import FormContrato from "@/components/forms/FormContrato";
import { RecentDocs } from "@/components/ui/RecentDocs";
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

  useEffect(() => {
    if (!numeroCtr) setNumeroCtr(gerarNumeroDoc("CTR"));
  }, [numeroCtr, setNumeroCtr]);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      window.open(json.pdfUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">Novo Contrato</h1>
        <span className="text-xs font-mono text-gray-500 bg-stage-800 border border-stage-600 px-3 py-1 rounded-full">
          {numeroCtr || "—"}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 animate-fade-in">
          {error}
        </div>
      )}

      <FormContrato
        values={contrato}
        onChange={setContrato}
        onSubmit={handleSubmit}
        artistName={artistDisplayName}
        loading={loading}
        fontScale={contratoFontScale}
        onFontScaleChange={setContratoFontScale}
        logoScale={contratoLogoScale}
        onLogoScaleChange={setContratoLogoScale}
      />

      <RecentDocs
        type="CONTRACT"
        onLoad={(d) => setContrato((prev) => ({ ...prev, ...d }))}
      />
    </div>
  );
}
