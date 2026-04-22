"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FormOrcamento from "@/components/forms/FormOrcamento";
import { RecentDocs } from "@/components/ui/RecentDocs";
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

  useEffect(() => {
    if (!numeroOrc) setNumeroOrc(gerarNumeroDoc("ORC"));
  }, [numeroOrc, setNumeroOrc]);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      window.open(json.pdfUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">Novo Orçamento</h1>
        <span className="text-xs font-mono text-gray-500 bg-stage-800 border border-stage-600 px-3 py-1 rounded-full">
          {numeroOrc || "—"}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 animate-fade-in">
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
        fontScale={orcamentoFontScale}
        onFontScaleChange={setOrcamentoFontScale}
        logoScale={orcamentoLogoScale}
        onLogoScaleChange={setOrcamentoLogoScale}
      />

      <RecentDocs
        type="BUDGET"
        onLoad={(d) => setOrcamento({ ...orcamento, ...(d as Partial<typeof orcamento>) })}
        onToContrato={orcamentoToContrato}
      />
    </div>
  );
}
