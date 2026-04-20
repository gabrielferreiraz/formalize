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
  logoUrl: string | null;
  backgroundUrl: string | null;
  basePdfUrl: string | null;
  baseContractPdfUrl: string | null;
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
                  <img src={data.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
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
                  <img src={data.backgroundUrl} alt="Background" className="max-w-full max-h-full object-cover" />
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

        {/* PDF */}
        <section className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h2 className="text-lg font-bold text-gray-200 mb-4">Configurações de PDF</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Largura do Documento Base (cm)</label>
              <input type="text" className="input-field" value={data.paperWidth || ""} onChange={(e) => handleChange("paperWidth", e.target.value)} placeholder="Ex: 21.0" />
            </div>
            <div>
              <label className="label">Altura do Documento Base (cm)</label>
              <input type="text" className="input-field" value={data.paperHeight || ""} onChange={(e) => handleChange("paperHeight", e.target.value)} placeholder="Ex: 29.7" />
            </div>
          </div>
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
