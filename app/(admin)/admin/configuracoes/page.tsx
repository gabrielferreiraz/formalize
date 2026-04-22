"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    fetch("/api/artist/me")
      .then((res) => res.json())
      .then((artist) => {
        setData({
          ...artist,
          address: typeof artist.address === "string" ? JSON.parse(artist.address) : artist.address || { rua: "", numero: "", bairro: "", cidade: "", estado: "" },
          bankInfo: typeof artist.bankInfo === "string" ? JSON.parse(artist.bankInfo) : artist.bankInfo || { titular: "", pix: "", banco: "", conta: "", agencia: "" },
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Configurações do Artista</h1>

      {message && (
        <div className={`p-4 mb-6 rounded-lg font-medium ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {message.text}
        </div>
      )}

      {/* UPLOADS (Fora do form principal para não misturar submits) */}
      <div className="space-y-8 mb-8">
        <section className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">Arquivos e Imagens</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="bg-stage-900 p-4 rounded-lg border border-stage-600">
              <label className="label">Logo do Artista</label>
              {data.logoUrl && (
                <div className="mb-2 w-32 h-16 relative flex items-center justify-center bg-stage-800 rounded">
                  <img src={data.logoUrl} alt="Logo" loading="lazy" decoding="async" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleUpload("logo", e)}
                disabled={uploading["logo"]}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-stage-700 file:text-gold-400 hover:file:bg-stage-600"
              />
              {uploading["logo"] && <p className="text-xs text-gray-400 mt-2">Enviando...</p>}
            </div>

            {/* Background */}
            <div className="bg-stage-900 p-4 rounded-lg border border-stage-600">
              <label className="label">Imagem de Fundo</label>
              {data.backgroundUrl && (
                <div className="mb-2 w-32 h-16 relative flex items-center justify-center bg-stage-800 rounded overflow-hidden">
                  <img src={data.backgroundUrl} alt="Background" loading="lazy" decoding="async" className="max-w-full max-h-full object-cover" />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleUpload("background", e)}
                disabled={uploading["background"]}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-stage-700 file:text-gold-400 hover:file:bg-stage-600"
              />
              {uploading["background"] && <p className="text-xs text-gray-400 mt-2">Enviando...</p>}
            </div>

            {/* PDF Base Orçamento */}
            <div className="bg-stage-900 p-4 rounded-lg border border-stage-600">
              <label className="label">PDF Base (Orçamento)</label>
              {data.basePdfUrl && (
                <div className="mb-2 text-sm text-green-400 truncate break-all">
                  PDF atual enviado!
                </div>
              )}
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => handleUpload("base-pdf", e)}
                disabled={uploading["base-pdf"]}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-stage-700 file:text-gold-400 hover:file:bg-stage-600"
              />
              {uploading["base-pdf"] && <p className="text-xs text-gray-400 mt-2">Enviando...</p>}
            </div>

            {/* PDF Base Contrato */}
            <div className="bg-stage-900 p-4 rounded-lg border border-stage-600">
              <label className="label">PDF Base (Contrato)</label>
              {data.baseContractPdfUrl && (
                <div className="mb-2 text-sm text-green-400 truncate break-all">
                  PDF atual enviado!
                </div>
              )}
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => handleUpload("base-contrato-pdf", e)}
                disabled={uploading["base-contrato-pdf"]}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-stage-700 file:text-gold-400 hover:file:bg-stage-600"
              />
              {uploading["base-contrato-pdf"] && <p className="text-xs text-gray-400 mt-2">Enviando...</p>}
            </div>
          </div>
        </section>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* IDENTIDADE */}
        <section className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">Identidade</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome Artístico</label>
              <input type="text" className="input-field" value={data.name || ""} onChange={(e) => handleChange("name", e.target.value)} required />
            </div>
            <div>
              <label className="label">Cor Primária</label>
              <div className="flex gap-2">
                <input type="color" className="h-10 w-10 rounded border border-stage-600 bg-stage-900 cursor-pointer" value={data.primaryColor || "#e6b800"} onChange={(e) => handleChange("primaryColor", e.target.value)} />
                <input type="text" className="input-field flex-1" value={data.primaryColor || ""} onChange={(e) => handleChange("primaryColor", e.target.value)} placeholder="#e6b800" />
              </div>
            </div>
            <div>
              <label className="label">Website</label>
              <input type="url" className="input-field" value={data.website || ""} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://" />
            </div>
            <div>
              <label className="label">Instagram</label>
              <input type="text" className="input-field" value={data.instagram || ""} onChange={(e) => handleChange("instagram", e.target.value)} placeholder="@" />
            </div>
          </div>
        </section>

        {/* JURÍDICO */}
        <section className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">Dados Jurídicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Razão Social</label>
              <input type="text" className="input-field" value={data.legalName || ""} onChange={(e) => handleChange("legalName", e.target.value)} />
            </div>
            <div>
              <label className="label">CNPJ</label>
              <input type="text" className="input-field" value={data.cnpj || ""} onChange={(e) => handleChange("cnpj", e.target.value)} />
            </div>
            <div>
              <label className="label">Instrumentos da Banda</label>
              <input type="text" className="input-field" value={data.instruments || ""} onChange={(e) => handleChange("instruments", e.target.value)} placeholder="Baixo, Bateria, Teclado..." />
            </div>
          </div>
        </section>

        {/* ENDEREÇO */}
        <section className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="label">Rua</label>
              <input type="text" className="input-field" value={data.address?.rua || ""} onChange={(e) => handleAddressChange("rua", e.target.value)} />
            </div>
            <div>
              <label className="label">Número</label>
              <input type="text" className="input-field" value={data.address?.numero || ""} onChange={(e) => handleAddressChange("numero", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Bairro</label>
              <input type="text" className="input-field" value={data.address?.bairro || ""} onChange={(e) => handleAddressChange("bairro", e.target.value)} />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input type="text" className="input-field" value={data.address?.cidade || ""} onChange={(e) => handleAddressChange("cidade", e.target.value)} />
            </div>
            <div>
              <label className="label">Estado (UF)</label>
              <input type="text" className="input-field" value={data.address?.estado || ""} onChange={(e) => handleAddressChange("estado", e.target.value)} maxLength={2} />
            </div>
          </div>
        </section>

        {/* DADOS BANCÁRIOS */}
        <section className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">Dados Bancários</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Titular</label>
              <input type="text" className="input-field" value={data.bankInfo?.titular || ""} onChange={(e) => handleBankChange("titular", e.target.value)} />
            </div>
            <div>
              <label className="label">Chave PIX</label>
              <input type="text" className="input-field" value={data.bankInfo?.pix || ""} onChange={(e) => handleBankChange("pix", e.target.value)} />
            </div>
            <div>
              <label className="label">Banco</label>
              <input type="text" className="input-field" value={data.bankInfo?.banco || ""} onChange={(e) => handleBankChange("banco", e.target.value)} />
            </div>
            <div>
              <label className="label">Conta c/ Dígito</label>
              <input type="text" className="input-field" value={data.bankInfo?.conta || ""} onChange={(e) => handleBankChange("conta", e.target.value)} />
            </div>
            <div>
              <label className="label">Agência</label>
              <input type="text" className="input-field" value={data.bankInfo?.agencia || ""} onChange={(e) => handleBankChange("agencia", e.target.value)} />
            </div>
          </div>
        </section>

        {/* CONTATO */}
        <section className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">WhatsApp</label>
              <input type="text" className="input-field" value={data.whatsapp || ""} onChange={(e) => handleChange("whatsapp", e.target.value)} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input-field" value={data.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
          </div>
        </section>

        {/* PDF — tamanhos de papel */}
        <section className="bg-stage-800 p-6 rounded-xl border border-stage-700 space-y-6">
          <h2 className="text-lg font-bold text-gray-200">Configurações de PDF</h2>

          <PdfPaperControls
            data={data}
            title="Orçamento"
            hint="Tamanho do papel usado na geração do PDF de orçamento."
            wKey="paperWidth"
            hKey="paperHeight"
            wEmpty={21}
            hEmpty={29.7}
            onPatch={patchPaper}
          />

          <PdfPaperControls
            data={data}
            title="Contrato"
            hint="Tamanho do papel usado na geração do PDF de contrato. Se nunca salvou, usa A4 (21 × 29,7 cm) até você alterar aqui."
            wKey="contractPaperWidth"
            hKey="contractPaperHeight"
            wEmpty={21}
            hEmpty={29.7}
            onPatch={patchPaper}
          />
        </section>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
