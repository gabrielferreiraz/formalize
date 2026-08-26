"use client";

import React, { useRef } from "react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconUpload, IconCheck } from "@/components/ui/icons";
import { PageTutorial, clearAllTutorials, type TutorialStep } from "@/components/ui/PageTutorial";
import { LogoCropModal } from "@/components/ui/LogoCropModal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CFG_TUTORIAL: TutorialStep[] = [
  {
    icon: "🎨",
    title: "Logo e cor da sua marca",
    body: "Sua logo e cor principal aparecem em todos os PDFs. Toque para fazer upload ou trocar.",
    targetId: "tut-cfg-logo",
  },
  {
    icon: "📐",
    title: "Templates de documento",
    body: "Escolha o estilo visual dos PDFs. Toque em 'Gerenciar Templates' para ver as opções.",
    targetId: "tut-cfg-templates",
  },
  {
    icon: "💾",
    title: "Salve as alterações",
    body: "Tudo fica pendente até tocar em 'Salvar Alterações' no final da página.",
    targetId: "tut-cfg-save",
  },
];

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
  logoUrl: string | null;
  backgroundUrl: string | null;
  orcamentoTemplate: string | null;
  contratoTemplate: string | null;
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

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [data, setData] = useState<ArtistConfig | null>(null);
  const [initialData, setInitialData] = useState<ArtistConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [uploadTs, setUploadTs] = useState<Record<string, number>>({});

  const [cropFile, setCropFile] = useState<File | null>(null);

  const isDirty = data !== null && initialData !== null &&
    JSON.stringify(data) !== JSON.stringify(initialData);
  const [navHidden, setNavHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<{ orcamento: TemplateInfo[]; contrato: TemplateInfo[] }>({
    orcamento: [],
    contrato: [],
  });

  // SWR cacheia entre navegações — ao voltar pra essa página os dados já
  // aparecem na hora (do cache) enquanto revalida em segundo plano.
  const { data: artistRaw, error: artistErr } = useSWR("/api/artist/me", fetcher);
  const { data: templatesRaw } = useSWR("/api/templates", fetcher);

  useEffect(() => {
    if (!artistRaw || initialData) return; // já inicializado — nunca sobrescreve edição em andamento
    const normalized: ArtistConfig = {
      ...artistRaw,
      address: typeof artistRaw.address === "string" ? JSON.parse(artistRaw.address) : artistRaw.address || { rua: "", numero: "", bairro: "", cidade: "", estado: "" },
      bankInfo: typeof artistRaw.bankInfo === "string" ? JSON.parse(artistRaw.bankInfo) : artistRaw.bankInfo || { titular: "", pix: "", banco: "", conta: "", agencia: "" },
    };
    setData(normalized);
    setInitialData(normalized);
    setLoading(false);
  }, [artistRaw, initialData]);

  useEffect(() => {
    if (artistErr) { console.error(artistErr); setLoading(false); }
  }, [artistErr]);

  useEffect(() => {
    setTemplates({
      orcamento: templatesRaw?.orcamento || [],
      contrato: templatesRaw?.contrato || [],
    });
  }, [templatesRaw]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setNavHidden(document.body.classList.contains("nav-hidden"));
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
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

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    if (e.target) e.target.value = "";
  };

  const handleLogoCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    setUploading((prev) => ({ ...prev, logo: true }));
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", new File([blob], "logo.png", { type: "image/png" }));
      formData.append("type", "logo");
      const res = await fetch("/api/artist/me/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        const ts = Date.now();
        setData((prev) => (prev ? { ...prev, logoUrl: url } : prev));
        setInitialData((prev) => (prev ? { ...prev, logoUrl: url } : prev));
        setUploadTs((prev) => ({ ...prev, logo: ts }));
        setMessage({ text: "Logo salva com sucesso!", type: "success" });
        // Atualiza o header imediatamente via evento
        window.dispatchEvent(new CustomEvent("logo-updated", { detail: { url } }));
        // Persiste no banco para que router.refresh() e navegações futuras reflitam a mudança
        fetch("/api/artist/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logoUrl: url }),
        }).then(() => router.refresh()).catch(() => {});
      } else {
        setMessage({ text: "Erro ao enviar logo", type: "error" });
      }
    } catch {
      setMessage({ text: "Erro na conexão", type: "error" });
    } finally {
      setUploading((prev) => ({ ...prev, logo: false }));
    }
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
      const res = await fetch("/api/artist/me/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        let field = "";
        if (type === "logo") field = "logoUrl";
        if (type === "background") field = "backgroundUrl";

        setData((prev) => (prev ? { ...prev, [field]: url } : prev));
        setUploadTs((prev) => ({ ...prev, [type]: Date.now() }));
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

  const doSave = async () => {
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
        setInitialData(data);
        setMessage({ text: "Alterações salvas com sucesso!", type: "success" });
        router.refresh();
      } else {
        const err = await res.json();
        setMessage({ text: err.error || "Erro ao salvar", type: "error" });
      }
    } catch {
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

      <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {/* ── 1. Identidade Visual ── */}
        <AccordionSection
          id="tut-cfg-logo"
          title="Identidade Visual"
          defaultOpen
          filled={!!(data.logoUrl || data.backgroundUrl || data.primaryColor || data.name)}
        >
          <div style={{ padding: 14, background: "#1a1f2e", border: "1px solid #252d3d", borderRadius: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#94a3b8" }}>
                Logo do Artista
              </div>
              {data.logoUrl && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Inter', sans-serif", fontSize: 10.5, fontWeight: 600, color: "#4ade80", letterSpacing: "0.02em" }}>
                  <span style={{ width: 14, height: 14, borderRadius: 999, background: "rgba(74,222,128,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <IconCheck size={10} />
                  </span>
                  Enviada
                </div>
              )}
            </div>
            {data.logoUrl && (
              <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", border: "1px solid #252d3d", background: "#0e1118", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 68, padding: 8 }}>
                <img
                  src={uploadTs["logo"] ? `${data.logoUrl}?t=${uploadTs["logo"]}` : data.logoUrl}
                  alt="Logo"
                  style={{ maxHeight: 52, maxWidth: "100%", objectFit: "contain" }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <label style={{
                flex: 1, height: 40, borderRadius: 10,
                background: "#141824", border: "1px solid #252d3d",
                color: uploading["logo"] ? "#6b7280" : "#f1f5f9",
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: uploading["logo"] ? "not-allowed" : "pointer",
              }}>
                <IconUpload size={14} />
                {uploading["logo"] ? "Enviando..." : data.logoUrl ? "Trocar logo" : "Escolher arquivo"}
                <input type="file" accept="image/*" onChange={handleLogoFileSelect} disabled={uploading["logo"]} style={{ display: "none" }} />
              </label>
              {data.logoUrl && (
                <label style={{
                  height: 40, padding: "0 14px", borderRadius: 10,
                  background: "#141824", border: "1px solid rgba(230,184,0,0.25)",
                  color: "#e6b800",
                  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  cursor: uploading["logo"] ? "not-allowed" : "pointer",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Ajustar
                  <input type="file" accept="image/*" onChange={handleLogoFileSelect} disabled={uploading["logo"]} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>
          <FileUploadRow
            label="Imagem de Fundo"
            preview={data.backgroundUrl ? (
              <div style={{ height: 56, borderRadius: 8, overflow: "hidden", background: "#0e1118" }}>
                <img src={uploadTs["background"] ? `${data.backgroundUrl}?t=${uploadTs["background"]}` : data.backgroundUrl} alt="Background" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : undefined}
            uploaded={!!data.backgroundUrl}
            uploading={uploading["background"]}
            accept="image/*"
            onChange={(e) => handleUpload("background", e)}
          />
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
        </AccordionSection>

        {/* ── 2. Contato & Redes ── */}
        <AccordionSection
          title="Contato & Redes"
          filled={!!(data.whatsapp || data.email || data.website || data.instagram)}
        >
          <FRow>
            <FFormField label="WhatsApp">
              <input className="input-field" type="text" value={data.whatsapp || ""} onChange={(e) => handleChange("whatsapp", e.target.value)} />
            </FFormField>
            <FFormField label="E-mail">
              <input className="input-field" type="email" value={data.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
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
        </AccordionSection>

        {/* ── 3. Dados do Artista ── */}
        <AccordionSection
          title="Dados do Artista"
          filled={!!(data.legalName || data.cnpj || data.address?.rua || data.bankInfo?.pix)}
        >
          {/* Jurídico */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4b5563", margin: "0 0 10px", paddingBottom: 6, borderBottom: "1px solid #1e2535" }}>Jurídico</p>
          <FFormField label="Razão Social">
            <input className="input-field" type="text" value={data.legalName || ""} onChange={(e) => handleChange("legalName", e.target.value)} />
          </FFormField>
          <FRow>
            <FFormField label="CNPJ">
              <input className="input-field" type="text" value={data.cnpj || ""} onChange={(e) => handleChange("cnpj", e.target.value)} />
            </FFormField>
            <FFormField label="Instrumentos">
              <input className="input-field" type="text" value={data.instruments || ""} onChange={(e) => handleChange("instruments", e.target.value)} placeholder="Baixo, Bateria, Teclado..." />
            </FFormField>
          </FRow>

          {/* Endereço */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4b5563", margin: "18px 0 10px", paddingBottom: 6, borderBottom: "1px solid #1e2535" }}>Endereço</p>
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

          {/* Bancário */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4b5563", margin: "18px 0 10px", paddingBottom: 6, borderBottom: "1px solid #1e2535" }}>Dados Bancários</p>
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
        </AccordionSection>

        {/* ── 7. PDF & Templates ── */}
        <AccordionSection
          id="tut-cfg-templates"
          title="PDF & Templates"
        >
          <TemplateStatusRow label="Orçamento" templateId={data.orcamentoTemplate || "orc-001"} templates={templates.orcamento} />
          <TemplateStatusRow label="Contrato" templateId={data.contratoTemplate || "ctr-001"} templates={templates.contrato} />
          <Link href="/admin/templates" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            height: 44, borderRadius: 10, border: "1px solid #252d3d",
            background: "#0e1118", color: "#94a3b8",
            fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
            textDecoration: "none", marginTop: 4,
            transition: "border-color 0.15s, color 0.15s",
          }}>
            Gerenciar Templates
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </AccordionSection>

        {/* ── 8. Avançado ── */}
        <AccordionSection title="Avançado">
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#4b5563", margin: "0 0 14px" }}>
            Reinicia o formulário de configuração inicial e o tutorial de todas as páginas.
          </p>
          <button
            type="button"
            onClick={async () => {
              clearAllTutorials();
              await fetch("/api/artist/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onboardingDone: false }),
              });
              window.location.href = "/admin/onboarding";
            }}
            style={{
              width: "100%", height: 42, borderRadius: 10,
              border: "1px solid #3d1a1a", background: "rgba(239,68,68,0.06)",
              color: "#f87171", fontFamily: "'Inter', sans-serif",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Reiniciar configuração inicial
          </button>
        </AccordionSection>

      </form>

      {mounted && createPortal(
        <div
          id="tut-cfg-save"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: isMobile ? (navHidden ? 16 : 80) : 24,
            zIndex: 60,
            padding: "0 16px",
            opacity: isDirty ? 1 : 0,
            transform: isDirty ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1), bottom 0.3s cubic-bezier(0.4,0,0.2,1)",
            pointerEvents: isDirty ? "auto" : "none",
          }}
        >
          <div style={{
            maxWidth: 720,
            margin: "0 auto",
            background: "rgba(10,13,20,0.88)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderRadius: 20,
            border: "1px solid rgba(230,184,0,0.28)",
            padding: "10px 12px 10px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 0 28px rgba(230,184,0,0.1)",
          }}>
            <span style={{
              fontSize: 12, color: "#f5c842",
              fontFamily: "'Inter', sans-serif", fontWeight: 600, flexShrink: 0,
            }}>
              ● Alterações não salvas
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={doSave}
              style={{
                height: 44, paddingLeft: 24, paddingRight: 24,
                borderRadius: 14, border: "none",
                background: saving ? "#9a7a00" : "linear-gradient(180deg, #f5c842, #e6b800)",
                color: "#1a1200",
                fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 4px 18px rgba(230,184,0,0.38)",
                opacity: saving ? 0.7 : 1,
                transition: "opacity 0.15s",
                flexShrink: 0,
              }}
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>,
        document.body
      )}

      <PageTutorial pageKey="configuracoes" steps={CFG_TUTORIAL} />

      {mounted && cropFile && (
        <LogoCropModal
          file={cropFile}
          onConfirm={handleLogoCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  );
}

// ── Accordion section ──
function AccordionSection({
  id, title, filled, defaultOpen = false, children,
}: {
  id?: string;
  title: string;
  filled?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} style={{ background: "#141824", border: "1px solid #252d3d", borderRadius: 16, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", padding: "15px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "none", border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11,
            letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#f1f5f9",
          }}>
            {title}
          </span>
          {filled && (
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {children}
          </div>
        </div>
      </div>
    </section>
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

function TemplateStatusRow({ label, templateId, templates }: {
  label: string;
  templateId: string;
  templates: TemplateInfo[];
}) {
  const tpl = templates.find((t) => t.id === templateId);
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", background: "#1a1f2e",
      border: "1px solid #252d3d", borderRadius: 10,
    }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>
        {tpl?.name ?? templateId}
      </span>
    </div>
  );
}
