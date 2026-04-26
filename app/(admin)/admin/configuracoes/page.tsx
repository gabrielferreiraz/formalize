"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconUpload, IconCheck } from "@/components/ui/icons";

// ── File upload row component (design system style) ──
function FileUploadRow({
  label, preview, pdfName, uploaded, uploading, accept, onChange,
}: {
  label: string;
  preview?: React.ReactNode;
  pdfName?: string;
  uploaded: boolean;
  uploading: boolean;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div style={{ padding: 14, background: "#1a1f2e", border: "1px solid #252d3d", borderRadius: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#94a3b8" }}>
          {label}
        </div>
        {uploaded && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Inter', sans-serif", fontSize: 10.5, fontWeight: 600, color: "#4ade80", letterSpacing: "0.02em" }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: "rgba(74,222,128,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <IconCheck size={10} />
            </span>
            Enviado
          </div>
        )}
      </div>

      {preview && <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", border: "1px solid #252d3d" }}>{preview}</div>}

      {pdfName && (
        <div style={{ height: 52, borderRadius: 10, background: "#141824", border: "1px dashed #252d3d", display: "flex", alignItems: "center", gap: 10, padding: "0 12px", marginBottom: 12 }}>
          <div style={{ width: 34, height: 40, borderRadius: 4, background: "#0e1118", border: "1px solid #252d3d", position: "relative" as const, flexShrink: 0 }}>
            <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 7, fontWeight: 700, color: "#f5c842", textAlign: "center" as const }}>PDF</div>
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, color: "#f1f5f9" }}>{pdfName}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <label style={{
          flex: 1, height: 40, borderRadius: 10,
          background: "#141824", border: "1px solid #252d3d",
          color: uploading ? "#6b7280" : "#f1f5f9",
          fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: uploading ? "not-allowed" : "pointer",
        }}>
          <IconUpload size={14} />
          {uploading ? "Enviando..." : "Escolher arquivo"}
          <input type="file" accept={accept} onChange={onChange} disabled={uploading} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );
}


interface ArtistConfig {
  id: string;
  name: string;
  primaryColor: string | null;
  website: string | null;
  instagram: string | null;
  legalName: string | null;
  cnpj: string | null;
  instruments: string | null;
  whatsapp: string | null;
  email: string | null;
  address: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
  } | null;
  bankInfo: {
    titular: string;
    pix: string;
    banco: string;
    conta: string;
    agencia: string;
  } | null;
  paperWidth: string | null;
  paperHeight: string | null;
  contractPaperWidth: string | null;
  contractPaperHeight: string | null;
  logoUrl: string | null;
  backgroundUrl: string | null;
  basePdfUrl: string | null;
  baseContractPdfUrl: string | null;
  orcamentoTemplate: string | null;
  contratoTemplate: string | null;
  usarBasePdfOrcamento: boolean;
  usarBasePdfContrato: boolean;
}

interface TemplateInfo {
  id: string;
  type: "orcamento" | "contrato";
  name: string;
  description: string;
  style: "dark" | "light" | "colorful";
  previewBg: string;
  previewAccent: string;
}

const PDF_PRESETS = [
  { id: "a4", label: "A4", sub: "21 × 29,7 cm", w: "21.0", h: "29.7" },
  { id: "a3", label: "A3", sub: "29,7 × 42 cm", w: "29.7", h: "42.0" },
  { id: "large", label: "Grande", sub: "34 × 49 cm", w: "34.44", h: "48.71" },
] as const;

const CM_STEP = 0.5;
const CM_MIN = 10;
const CM_MAX = 120;

function parseCm(s: string | null | undefined, whenEmpty = 21): number {
  const raw = String(s ?? "").trim().replace(",", ".");
  if (!raw) return whenEmpty;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : whenEmpty;
}

function formatCmPtBr(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function presetActive(
  w: string | null,
  h: string | null,
  pw: string,
  ph: string,
  wEmpty = 21,
  hEmpty = 29.7
): boolean {
  return (
    Math.abs(parseCm(w, wEmpty) - parseFloat(pw)) < 0.06 &&
    Math.abs(parseCm(h, hEmpty) - parseFloat(ph)) < 0.06
  );
}

type PaperWKey = "paperWidth" | "contractPaperWidth";
type PaperHKey = "paperHeight" | "contractPaperHeight";

function PdfPaperControls({
  data,
  title,
  hint,
  wKey,
  hKey,
  wEmpty,
  hEmpty,
  onPatch,
}: {
  data: ArtistConfig;
  title: string;
  hint: string;
  wKey: PaperWKey;
  hKey: PaperHKey;
  wEmpty: number;
  hEmpty: number;
  onPatch: (patch: Partial<ArtistConfig>) => void;
}) {
  const wCur = parseCm(data[wKey], wEmpty);
  const hCur = parseCm(data[hKey], hEmpty);

  const step = (key: PaperWKey | PaperHKey, delta: number, emptyFallback: number) => {
    const cur = parseCm(data[key] as string | null, emptyFallback);
    const next = Math.min(CM_MAX, Math.max(CM_MIN, Math.round((cur + delta) * 2) / 2));
    onPatch({ [key]: next.toFixed(2) } as Partial<ArtistConfig>);
  };

  return (
    <div className="rounded-xl border border-stage-700 bg-stage-800/40 p-5 space-y-5">
      <div>
        <h3 className="text-base font-bold text-gray-200">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      </div>

      <div>
        <p className="label mb-3">Formato rápido</p>
        <div className="flex flex-wrap gap-2">
          {PDF_PRESETS.map((p) => {
            const on = presetActive(data[wKey], data[hKey], p.w, p.h, wEmpty, hEmpty);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPatch({ [wKey]: p.w, [hKey]: p.h } as Partial<ArtistConfig>)}
                className={`rounded-xl border px-4 py-2.5 text-left transition-colors duration-150 min-w-[7.5rem] ${
                  on
                    ? "border-gold-500 bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/40"
                    : "border-stage-500 bg-stage-900/80 text-gray-300 hover:border-stage-400 hover:bg-stage-700/40"
                }`}
              >
                <span className="block text-sm font-bold">{p.label}</span>
                <span className="block text-[11px] text-gray-500 mt-0.5">{p.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-stage-600 bg-stage-900/50 p-4">
          <span className="label mb-3">Largura</span>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Diminuir largura"
              onClick={() => step(wKey, -CM_STEP, wEmpty)}
              disabled={wCur <= CM_MIN}
              className="shrink-0 w-11 h-11 rounded-xl border border-stage-500 text-lg font-bold text-gray-200 hover:bg-stage-700 hover:border-gold-600/50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center min-w-0">
              <span className="text-2xl font-black text-gray-100 tabular-nums tracking-tight">
                {formatCmPtBr(wCur)}
              </span>
              <span className="text-sm text-gray-500 ml-1">cm</span>
            </div>
            <button
              type="button"
              aria-label="Aumentar largura"
              onClick={() => step(wKey, CM_STEP, wEmpty)}
              disabled={wCur >= CM_MAX}
              className="shrink-0 w-11 h-11 rounded-xl border border-stage-500 text-lg font-bold text-gray-200 hover:bg-stage-700 hover:border-gold-600/50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <p className="text-[11px] text-gray-600 mt-2 text-center">passo {CM_STEP} cm</p>
        </div>

        <div className="rounded-xl border border-stage-600 bg-stage-900/50 p-4">
          <span className="label mb-3">Altura</span>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Diminuir altura"
              onClick={() => step(hKey, -CM_STEP, hEmpty)}
              disabled={hCur <= CM_MIN}
              className="shrink-0 w-11 h-11 rounded-xl border border-stage-500 text-lg font-bold text-gray-200 hover:bg-stage-700 hover:border-gold-600/50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center min-w-0">
              <span className="text-2xl font-black text-gray-100 tabular-nums tracking-tight">
                {formatCmPtBr(hCur)}
              </span>
              <span className="text-sm text-gray-500 ml-1">cm</span>
            </div>
            <button
              type="button"
              aria-label="Aumentar altura"
              onClick={() => step(hKey, CM_STEP, hEmpty)}
              disabled={hCur >= CM_MAX}
              className="shrink-0 w-11 h-11 rounded-xl border border-stage-500 text-lg font-bold text-gray-200 hover:bg-stage-700 hover:border-gold-600/50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <p className="text-[11px] text-gray-600 mt-2 text-center">passo {CM_STEP} cm</p>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [data, setData] = useState<ArtistConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [templates, setTemplates] = useState<{ orcamento: TemplateInfo[]; contrato: TemplateInfo[] }>({
    orcamento: [],
    contrato: [],
  });

  useEffect(() => {
    fetch("/api/artist/me")
      .then((res) => res.json())
      .then((artist) => {
        setData({
          ...artist,
          address: typeof artist.address === "string" ? JSON.parse(artist.address) : artist.address || { rua: "", numero: "", bairro: "", cidade: "", estado: "" },
          bankInfo: typeof artist.bankInfo === "string" ? JSON.parse(artist.bankInfo) : artist.bankInfo || { titular: "", pix: "", banco: "", conta: "", agencia: "" },
          usarBasePdfOrcamento: artist.usarBasePdfOrcamento ?? true,
          usarBasePdfContrato: artist.usarBasePdfContrato ?? true,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((payload) => {
        setTemplates({
          orcamento: payload?.orcamento || [],
          contrato: payload?.contrato || [],
        });
      })
      .catch(() => {
        setTemplates({ orcamento: [], contrato: [] });
      });
  }, []);

  const handleChange = (field: string, value: string) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  const handleAddressChange = (field: string, value: string) => {
    if (!data) return;
    setData({
      ...data,
      address: { ...data.address, [field]: value } as any,
    });
  };

  const handleBankChange = (field: string, value: string) => {
    if (!data) return;
    setData({
      ...data,
      bankInfo: { ...data.bankInfo, [field]: value } as any,
    });
  };

  const patchPaper = (patch: Partial<ArtistConfig>) => {
    setData((prev) => (prev ? { ...prev, ...patch } : null));
  };

  const handleUpload = async (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    setUploading((prev) => ({ ...prev, [type]: true }));
    setMessage(null);

    try {
      const res = await fetch("/api/artist/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        let field = "";
        if (type === "logo") field = "logoUrl";
        if (type === "background") field = "backgroundUrl";
        if (type === "base-pdf") field = "basePdfUrl";
        if (type === "base-contrato-pdf") field = "baseContractPdfUrl";

        setData((prev) => (prev ? { ...prev, [field]: url } : prev));
        setMessage({ text: "Arquivo salvo com sucesso!", type: "success" });
      } else {
        setMessage({ text: "Erro ao enviar arquivo", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Erro na conexão", type: "error" });
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/artist/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMessage({ text: "Alterações salvas com sucesso!", type: "success" });
        router.refresh();
      } else {
        const err = await res.json();
        setMessage({ text: err.error || "Erro ao salvar", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Erro ao conectar", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Carregando...</div>;
  if (!data) return <div className="p-6 text-red-500">Erro ao carregar dados.</div>;

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* ── Header ── */}
      <div style={{ padding: "22px 0 18px" }}>
        <h1 style={{
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: "-0.02em",
          color: "#f1f5f9",
          lineHeight: 1.15,
        }}>Configurações do Artista</h1>
        <div style={{ marginTop: 4, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#6b7280" }}>
          Identidade visual e templates
        </div>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px",
          marginBottom: 14,
          borderRadius: 12,
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 500,
          background: message.type === "success" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
          color: message.type === "success" ? "#4ade80" : "#f87171",
          border: message.type === "success" ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(239,68,68,0.25)",
        }}>
          {message.text}
        </div>
      )}

      {/* ── Arquivos & Imagens ── */}
      <section style={{ background: "#141824", border: "1px solid #252d3d", borderRadius: 16, padding: 18, marginBottom: 14 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#f1f5f9", marginBottom: 16 }}>
          Arquivos & Imagens
        </div>

        {/* Logo */}
        <FileUploadRow
          label="Logo do Artista"
          preview={data.logoUrl ? <img src={data.logoUrl} alt="Logo" style={{ maxHeight: 56, maxWidth: "100%", objectFit: "contain" }} /> : undefined}
          uploaded={!!data.logoUrl}
          uploading={uploading["logo"]}
          accept="image/*"
          onChange={(e) => handleUpload("logo", e)}
        />

        {/* Background */}
        <FileUploadRow
          label="Imagem de Fundo"
          preview={data.backgroundUrl ? (
            <div style={{ height: 56, borderRadius: 8, overflow: "hidden", background: "#0e1118" }}>
              <img src={data.backgroundUrl} alt="Background" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : undefined}
          uploaded={!!data.backgroundUrl}
          uploading={uploading["background"]}
          accept="image/*"
          onChange={(e) => handleUpload("background", e)}
        />

        {/* PDFs */}
        <FileUploadRow
          label="PDF Base — Orçamento"
          pdfName={data.basePdfUrl ? "orcamento-base.pdf" : undefined}
          uploaded={!!data.basePdfUrl}
          uploading={uploading["base-pdf"]}
          accept="application/pdf"
          onChange={(e) => handleUpload("base-pdf", e)}
        />
        <FileUploadRow
          label="PDF Base — Contrato"
          pdfName={data.baseContractPdfUrl ? "contrato-base.pdf" : undefined}
          uploaded={!!data.baseContractPdfUrl}
          uploading={uploading["base-contrato-pdf"]}
          accept="application/pdf"
          onChange={(e) => handleUpload("base-contrato-pdf", e)}
        />
      </section>


      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Identidade ── */}
        <FSection title="Identidade">
          <FRow>
            <FFormField label="Nome Artístico">
              <input className="input-field" type="text" value={data.name || ""} onChange={(e) => handleChange("name", e.target.value)} required />
            </FFormField>
            <FFormField label="Cor Primária">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={data.primaryColor || "#e6b800"} onChange={(e) => handleChange("primaryColor", e.target.value)}
                  style={{ width: 40, height: 40, borderRadius: 8, border: "1px solid #252d3d", background: "#1a1f2e", cursor: "pointer", padding: 2 }} />
                <input className="input-field" type="text" value={data.primaryColor || ""} onChange={(e) => handleChange("primaryColor", e.target.value)} placeholder="#e6b800" style={{ flex: 1 }} />
              </div>
            </FFormField>
          </FRow>
          <FRow>
            <FFormField label="Website">
              <input className="input-field" type="url" value={data.website || ""} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://" />
            </FFormField>
            <FFormField label="Instagram">
              <input className="input-field" type="text" value={data.instagram || ""} onChange={(e) => handleChange("instagram", e.target.value)} placeholder="@" />
            </FFormField>
          </FRow>
        </FSection>

        {/* ── Dados Jurídicos ── */}
        <FSection title="Dados Jurídicos">
          <FFormField label="Razão Social">
            <input className="input-field" type="text" value={data.legalName || ""} onChange={(e) => handleChange("legalName", e.target.value)} />
          </FFormField>
          <FRow>
            <FFormField label="CNPJ">
              <input className="input-field" type="text" value={data.cnpj || ""} onChange={(e) => handleChange("cnpj", e.target.value)} />
            </FFormField>
            <FFormField label="Instrumentos da Banda">
              <input className="input-field" type="text" value={data.instruments || ""} onChange={(e) => handleChange("instruments", e.target.value)} placeholder="Baixo, Bateria, Teclado..." />
            </FFormField>
          </FRow>
        </FSection>

        {/* ── Endereço ── */}
        <FSection title="Endereço">
          <FFormField label="Rua">
            <input className="input-field" type="text" value={data.address?.rua || ""} onChange={(e) => handleAddressChange("rua", e.target.value)} />
          </FFormField>
          <FRow>
            <FFormField label="Número">
              <input className="input-field" type="text" value={data.address?.numero || ""} onChange={(e) => handleAddressChange("numero", e.target.value)} />
            </FFormField>
            <FFormField label="Bairro">
              <input className="input-field" type="text" value={data.address?.bairro || ""} onChange={(e) => handleAddressChange("bairro", e.target.value)} />
            </FFormField>
          </FRow>
          <FRow>
            <FFormField label="Cidade">
              <input className="input-field" type="text" value={data.address?.cidade || ""} onChange={(e) => handleAddressChange("cidade", e.target.value)} />
            </FFormField>
            <FFormField label="Estado (UF)">
              <input className="input-field" type="text" value={data.address?.estado || ""} onChange={(e) => handleAddressChange("estado", e.target.value)} maxLength={2} />
            </FFormField>
          </FRow>
        </FSection>

        {/* ── Dados Bancários ── */}
        <FSection title="Dados Bancários">
          <FFormField label="Titular">
            <input className="input-field" type="text" value={data.bankInfo?.titular || ""} onChange={(e) => handleBankChange("titular", e.target.value)} />
          </FFormField>
          <FRow>
            <FFormField label="Chave PIX">
              <input className="input-field" type="text" value={data.bankInfo?.pix || ""} onChange={(e) => handleBankChange("pix", e.target.value)} />
            </FFormField>
            <FFormField label="Banco">
              <input className="input-field" type="text" value={data.bankInfo?.banco || ""} onChange={(e) => handleBankChange("banco", e.target.value)} />
            </FFormField>
          </FRow>
          <FRow>
            <FFormField label="Conta c/ Dígito">
              <input className="input-field" type="text" value={data.bankInfo?.conta || ""} onChange={(e) => handleBankChange("conta", e.target.value)} />
            </FFormField>
            <FFormField label="Agência">
              <input className="input-field" type="text" value={data.bankInfo?.agencia || ""} onChange={(e) => handleBankChange("agencia", e.target.value)} />
            </FFormField>
          </FRow>
        </FSection>

        {/* ── Contato ── */}
        <FSection title="Contato">
          <FRow>
            <FFormField label="WhatsApp">
              <input className="input-field" type="text" value={data.whatsapp || ""} onChange={(e) => handleChange("whatsapp", e.target.value)} />
            </FFormField>
            <FFormField label="E-mail">
              <input className="input-field" type="email" value={data.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
            </FFormField>
          </FRow>
        </FSection>

        {/* ── PDF — tamanhos de papel ── */}
        <FSection title="Configurações de PDF">
          <PdfPaperControls
            data={data} title="Orçamento" hint="Tamanho do papel usado na geração do PDF de orçamento."
            wKey="paperWidth" hKey="paperHeight" wEmpty={21} hEmpty={29.7} onPatch={patchPaper}
          />
          <PdfPaperControls
            data={data} title="Contrato" hint="Tamanho do papel usado na geração do PDF de contrato."
            wKey="contractPaperWidth" hKey="contractPaperHeight" wEmpty={21} hEmpty={29.7} onPatch={patchPaper}
          />
        </FSection>

        <FSection title="Templates">
          <div className="space-y-5">
            <TemplatePicker
              title="Orçamento"
              items={templates.orcamento}
              selectedId={data.orcamentoTemplate || "orc-001"}
              primaryColor={data.primaryColor || "#e6b800"}
              onSelect={(id) => handleChange("orcamentoTemplate", id)}
            />
            <TemplatePicker
              title="Contrato"
              items={templates.contrato}
              selectedId={data.contratoTemplate || "ctr-001"}
              primaryColor={data.primaryColor || "#e6b800"}
              onSelect={(id) => handleChange("contratoTemplate", id)}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
              <FToggleRow 
                label="Usar PDF base no orçamento" 
                checked={data.usarBasePdfOrcamento} 
                onChange={(v) => setData({ ...data, usarBasePdfOrcamento: v })} 
              />
              <FToggleRow 
                label="Usar PDF base no contrato" 
                checked={data.usarBasePdfContrato} 
                onChange={(v) => setData({ ...data, usarBasePdfContrato: v })} 
              />
            </div>
          </div>
        </FSection>

        {/* ── Salvar ── */}
        <button type="submit" disabled={saving} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          height: 52, borderRadius: 12, border: "none",
          background: saving ? "#252d3d" : "linear-gradient(180deg, #f5c842 0%, #e6b800 100%)",
          color: saving ? "#6b7280" : "#1a1200",
          fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
          cursor: saving ? "not-allowed" : "pointer",
          boxShadow: saving ? "none" : "0 4px 14px rgba(230,184,0,0.25)",
          transition: "opacity 0.15s",
          width: "100%",
        }}>
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>
    </div>
  );
}

function FToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      style={{ 
        display: "flex", alignItems: "center", justifyContent: "space-between", 
        padding: "12px 14px", background: "#1a1f2e", border: "1px solid #252d3d", 
        borderRadius: 12, cursor: "pointer", transition: "border-color 0.15s"
      }}
    >
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: "#f1f5f9" }}>{label}</span>
      <div 
        style={{
          width: 44, height: 24, borderRadius: 99, background: checked ? "#e6b800" : "#0e1118",
          border: "1px solid", borderColor: checked ? "#e6b800" : "#252d3d",
          position: "relative", transition: "all 0.2s"
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: checked ? 22 : 2,
          width: 18, height: 18, borderRadius: "50%", background: checked ? "#1a1200" : "#6b7280",
          transition: "all 0.2s"
        }} />
      </div>
    </div>
  );
}

// ── Layout helpers ──
function FSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#141824", border: "1px solid #252d3d", borderRadius: 16, padding: 18 }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#f1f5f9", marginBottom: 16 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
        {children}
      </div>
    </section>
  );
}

function FRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
      gap: 12,
    }}>
      {children}
    </div>
  );
}

function FFormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#6b7280", marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function TemplatePicker({
  title,
  items,
  selectedId,
  primaryColor,
  onSelect,
}: {
  title: string;
  items: TemplateInfo[];
  selectedId: string;
  primaryColor: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.14em] text-gray-400 font-semibold mb-3">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((tpl) => {
          const isActive = tpl.id === selectedId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              className="text-left rounded-xl border p-3 transition-colors"
              style={{
                borderColor: isActive ? primaryColor : "#252d3d",
                background: "#141824",
                boxShadow: isActive ? `0 0 0 1px ${primaryColor}40` : "none",
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 160,
                  borderRadius: 10,
                  background: tpl.previewBg,
                  border: `1px solid ${tpl.previewAccent}33`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 20, background: tpl.previewAccent }} />
                <div style={{ position: "absolute", top: 34, left: 12, right: 12, height: 6, background: `${tpl.previewAccent}66`, borderRadius: 999 }} />
                <div style={{ position: "absolute", top: 48, left: 12, right: 22, height: 6, background: `${tpl.previewAccent}44`, borderRadius: 999 }} />
                <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, height: 8, background: `${tpl.previewAccent}66`, borderRadius: 999 }} />
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: primaryColor,
                      color: "#111",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <div className="mt-3">
                <div className="text-sm font-semibold text-gray-100">{tpl.name}</div>
                <div className="text-xs text-gray-500 mt-1">{tpl.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
