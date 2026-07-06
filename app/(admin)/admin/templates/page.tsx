"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TemplateInfo {
  id: string;
  type: "orcamento" | "contrato";
  name: string;
  description: string;
  style: "dark" | "light" | "colorful";
  previewBg: string;
  previewAccent: string;
}

type Tab = "orcamento" | "contrato";

const STYLE_LABEL: Record<string, string> = {
  dark: "Escuro",
  light: "Claro",
  colorful: "Colorido",
};

export default function TemplatesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orcamento");
  const [templates, setTemplates] = useState<{ orcamento: TemplateInfo[]; contrato: TemplateInfo[] }>({
    orcamento: [],
    contrato: [],
  });
  const [selectedOrc, setSelectedOrc] = useState<string>("orc-001");
  const [selectedCtr, setSelectedCtr] = useState<string>("ctr-001");
  const [primaryColor, setPrimaryColor] = useState<string>("#e6b800");
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [successModal, setSuccessModal] = useState<{ tab: Tab } | null>(null);
  const [customTemplates, setCustomTemplates] = useState<{
    orcamento: { id: string; name: string; pageCount: number } | null;
    contrato: { id: string; name: string; pageCount: number } | null;
  }>({ orcamento: null, contrato: null });

  useEffect(() => {
    const safe = (p: Promise<Response>) => p.then((r) => r.json()).catch(() => null);
    Promise.all([
      safe(fetch("/api/templates")),
      safe(fetch("/api/artist/me")),
      safe(fetch("/api/artist/pdf-templates")),
    ]).then(([tpl, artist, custom]) => {
      if (tpl) setTemplates({ orcamento: tpl?.orcamento || [], contrato: tpl?.contrato || [] });
      if (artist && !artist.error) {
        setSelectedOrc(artist.orcamentoTemplate || "orc-001");
        setSelectedCtr(artist.contratoTemplate || "ctr-001");
        setPrimaryColor(artist.primaryColor || "#e6b800");
      }
      if (custom && !custom.error) {
        setCustomTemplates({ orcamento: custom.orcamento ?? null, contrato: custom.contrato ?? null });
      }
    });
  }, []);

  const currentSelected = tab === "orcamento" ? selectedOrc : selectedCtr;
  const setSelected = tab === "orcamento" ? setSelectedOrc : setSelectedCtr;
  const items = templates[tab];
  const activeCustom = customTemplates[tab];

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/artist/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orcamentoTemplate: selectedOrc, contratoTemplate: selectedCtr }),
      });
      if (res.ok) {
        setSuccessModal({ tab });
      } else {
        const err = await res.json();
        setMessage({ text: err.error || "Erro ao salvar", type: "error" });
      }
    } catch {
      setMessage({ text: "Erro de conexão", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (templateId: string) => {
    if (templateId.startsWith("pdf:")) {
      const mappingId = templateId.slice(4);
      window.open(`/api/artist/pdf-templates/${mappingId}/preview`, "_blank");
      return;
    }
    setPreviewing(templateId);
    try {
      const url = `/api/templates/preview?id=${templateId}&type=${tab}`;
      const res = await fetch(url);
      if (!res.ok) {
        setMessage({ text: "Erro ao gerar preview", type: "error" });
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch {
      setMessage({ text: "Erro ao gerar preview", type: "error" });
    } finally {
      setPreviewing(null);
    }
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* ── Header ── */}
      <div style={{ padding: "22px 0 18px" }}>
        <button
          onClick={() => router.push("/admin/configuracoes")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginBottom: 14, padding: "6px 12px 6px 8px", borderRadius: 8,
            border: "1px solid #252d3d", background: "transparent",
            color: "#6b7280", fontFamily: "'Inter', sans-serif",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#374151"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#252d3d"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Configurações
        </button>
        <h1 style={{
          margin: 0, fontFamily: "'Inter', sans-serif", fontWeight: 600,
          fontSize: 26, letterSpacing: "-0.02em", color: "#f1f5f9", lineHeight: 1.15,
        }}>
          Templates
        </h1>
        <div style={{ marginTop: 4, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#6b7280" }}>
          Escolha o modelo visual para cada tipo de documento
        </div>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px", marginBottom: 14, borderRadius: 12,
          fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
          background: message.type === "success" ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
          color: message.type === "success" ? "#4ade80" : "#f87171",
          border: message.type === "success" ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(239,68,68,0.25)",
        }}>
          {message.text}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["orcamento", "contrato"] as Tab[]).map((t) => {
          const on = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                height: 38, paddingInline: 18, borderRadius: 10,
                border: on ? "1px solid #e6b800" : "1px solid #252d3d",
                background: on ? "rgba(230,184,0,0.08)" : "#141824",
                color: on ? "#e6b800" : "#6b7280",
                fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {t === "orcamento" ? "Orçamento" : "Contrato"}
            </button>
          );
        })}
      </div>

      {/* ── Custom PDF template card ── */}
      {activeCustom && (() => {
        const customId = `pdf:${activeCustom.id}`;
        const isCustomSelected = currentSelected === customId;
        return (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
              color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
            }}>
              Template Personalizado
            </div>
            <div
              style={{
                background: "#141824",
                border: `1px solid ${isCustomSelected ? primaryColor : "rgba(230,184,0,0.35)"}`,
                borderRadius: 14, overflow: "hidden",
                boxShadow: isCustomSelected ? `0 0 0 1px ${primaryColor}30` : "none",
                transition: "all 0.2s",
                maxWidth: 340,
              }}
            >
              {/* Thumbnail */}
              <div style={{ height: 160, background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div style={{
                    width: 52, height: 64, borderRadius: 6,
                    background: "#1e1e30", border: "1px solid rgba(230,184,0,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e6b800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="9" y1="13" x2="15" y2="13" />
                      <line x1="9" y1="17" x2="13" y2="17" />
                    </svg>
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, color: "rgba(230,184,0,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    PDF Customizado
                  </div>
                </div>
                {isCustomSelected && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 22, height: 22, borderRadius: "50%",
                    background: primaryColor, color: "#111",
                    fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>✓</div>
                )}
              </div>
              {/* Card body */}
              <div style={{ padding: "14px 16px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
                    {activeCustom.name}
                  </div>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600,
                    padding: "2px 8px", borderRadius: 6,
                    background: "rgba(230,184,0,0.08)", color: "#e6b800", letterSpacing: "0.05em",
                  }}>
                    Personalizado
                  </div>
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#4b5563", lineHeight: 1.5, marginBottom: 14 }}>
                  {activeCustom.pageCount} {activeCustom.pageCount === 1 ? "página" : "páginas"} · Seu PDF com campos posicionados pelo super admin
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handlePreview(customId)}
                    style={{
                      flex: 1, height: 36, borderRadius: 8,
                      border: "1px solid #252d3d", background: "#0e1118",
                      color: "#94a3b8",
                      fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    Ver PDF
                  </button>
                  <button
                    onClick={() => setSelected(customId)}
                    style={{
                      flex: 1, height: 36, borderRadius: 8,
                      border: isCustomSelected ? `1px solid ${primaryColor}` : "1px solid #252d3d",
                      background: isCustomSelected ? `${primaryColor}15` : "#141824",
                      color: isCustomSelected ? primaryColor : "#94a3b8",
                      fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {isCustomSelected ? "Selecionado" : "Selecionar"}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ borderBottom: "1px solid #1a2035", margin: "20px 0 16px" }} />
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
              color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
            }}>
              Templates Padrão
            </div>
          </div>
        );
      })()}

      {/* ── Template grid ── */}
      {items.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6b7280", padding: "40px 0", fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
          Carregando templates...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 14 }}>
          {items.map((tpl) => {
            const isActive = tpl.id === currentSelected;
            const isLoadingPreview = previewing === tpl.id;
            const accentColor = isActive ? primaryColor : "#e4e4de";

            return (
              <div
                key={tpl.id}
                style={{
                  background: "#141824",
                  border: `1px solid ${isActive ? primaryColor : "#252d3d"}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: isActive ? `0 0 0 1px ${primaryColor}30` : "none",
                  transition: "all 0.2s",
                }}
              >
                {/* Visual preview thumbnail */}
                <div
                  style={{
                    height: 160,
                    background: tpl.previewBg,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Simulated document layout */}
                  {tpl.style === "dark" ? (
                    <>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: tpl.previewAccent }} />
                      <div style={{ position: "absolute", top: 20, left: 20, right: 20 }}>
                        <div style={{ height: 28, width: "55%", background: `${tpl.previewAccent}22`, borderRadius: 4, marginBottom: 8 }} />
                        <div style={{ height: 10, width: "80%", background: "#ffffff12", borderRadius: 3, marginBottom: 5 }} />
                        <div style={{ height: 10, width: "65%", background: "#ffffff0d", borderRadius: 3, marginBottom: 5 }} />
                        <div style={{ height: 10, width: "70%", background: "#ffffff0d", borderRadius: 3, marginBottom: 14 }} />
                        <div style={{ height: 28, background: `${tpl.previewAccent}22`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
                          <div style={{ width: 60, height: 14, background: tpl.previewAccent, borderRadius: 2, opacity: 0.9 }} />
                        </div>
                      </div>
                      {isActive && (
                        <div style={{
                          position: "absolute", top: 10, right: 10,
                          width: 22, height: 22, borderRadius: "50%",
                          background: primaryColor, color: "#111",
                          fontSize: 12, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>✓</div>
                      )}
                    </>
                  ) : tpl.id === "ctr-003" || tpl.id === "orc-006" ? (
                    <>
                      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, background: tpl.previewAccent }} />
                      <div style={{ position: "absolute", top: 14, left: 18, right: 12 }}>
                        <div style={{ height: 10, width: "45%", background: "#11111120", borderRadius: 2, marginBottom: 6 }} />
                        <div style={{ height: 7, width: "90%", background: "#11111112", borderRadius: 2, marginBottom: 4 }} />
                        <div style={{ height: 7, width: "75%", background: "#11111112", borderRadius: 2, marginBottom: 4 }} />
                        <div style={{ height: 7, width: "85%", background: "#11111112", borderRadius: 2, marginBottom: 4 }} />
                        <div style={{ height: 7, width: "60%", background: "#11111112", borderRadius: 2, marginBottom: 4 }} />
                        <div style={{ height: 7, width: "80%", background: "#11111112", borderRadius: 2, marginBottom: 10 }} />
                        <div style={{ height: 20, background: "#f5f5f0", border: "1px solid #e5e5e0", borderRadius: 4, paddingLeft: 8, display: "flex", alignItems: "center" }}>
                          <div style={{ width: 40, height: 8, background: `${tpl.previewAccent}44`, borderRadius: 2 }} />
                        </div>
                      </div>
                      {isActive && (
                        <div style={{
                          position: "absolute", top: 10, right: 10,
                          width: 22, height: 22, borderRadius: "50%",
                          background: primaryColor, color: "#111",
                          fontSize: 12, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>✓</div>
                      )}
                    </>
                  ) : tpl.id === "orc-007" ? (
                    <>
                      <div style={{ position: "absolute", top: 8, left: 10, right: 10, height: 30, background: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`, borderRadius: 6, display: "flex", alignItems: "center", padding: "0 10px", justifyContent: "space-between" }}>
                        <div style={{ height: 12, width: 40, background: "#ffffff22", borderRadius: 2 }} />
                        <div style={{ height: 14, width: 34, background: tpl.previewAccent, borderRadius: 4 }} />
                      </div>
                      <div style={{ position: "absolute", top: 46, left: 10, right: 10 }}>
                        <div style={{ background: "#fff", borderRadius: 4, padding: "8px 10px", marginBottom: 4, borderLeft: `3px solid ${tpl.previewAccent}` }}>
                          <div style={{ height: 6, width: "70%", background: "#11111115", borderRadius: 2, marginBottom: 3 }} />
                          <div style={{ height: 6, width: "50%", background: "#11111110", borderRadius: 2 }} />
                        </div>
                        <div style={{ background: "#fff", borderRadius: 4, padding: "8px 10px", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <div style={{ fontSize: 12 }}>🎤</div>
                              <div style={{ height: 6, width: 50, background: "#11111115", borderRadius: 2 }} />
                            </div>
                            <div style={{ height: 8, width: 36, background: `${tpl.previewAccent}44`, borderRadius: 2 }} />
                          </div>
                        </div>
                        <div style={{ background: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`, borderRadius: 6, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ height: 8, width: 30, background: "#ffffff33", borderRadius: 2 }} />
                          <div style={{ height: 14, width: 60, background: "#fff", borderRadius: 3 }} />
                        </div>
                      </div>
                      {isActive && (
                        <div style={{
                          position: "absolute", top: 8, right: 8,
                          width: 22, height: 22, borderRadius: "50%",
                          background: primaryColor, color: "#111",
                          fontSize: 12, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>✓</div>
                      )}
                    </>
                  ) : tpl.id === "ctr-004" ? (
                    <>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 30, background: tpl.previewAccent, display: "flex", alignItems: "center", paddingLeft: 10 }}>
                        <div style={{ height: 12, width: "40%", background: "#00000033", borderRadius: 2 }} />
                      </div>
                      <div style={{ position: "absolute", top: 30, left: 0, right: 0, height: 14, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ height: 6, width: "50%", background: "#ffffff22", borderRadius: 2 }} />
                      </div>
                      <div style={{ position: "absolute", top: 56, left: 14, right: 14 }}>
                        <div style={{ height: 7, width: "90%", background: "#11111112", borderRadius: 2, marginBottom: 3 }} />
                        <div style={{ height: 7, width: "75%", background: "#11111112", borderRadius: 2, marginBottom: 3 }} />
                        <div style={{ height: 7, width: "80%", background: "#11111112", borderRadius: 2, marginBottom: 8 }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                          <div style={{ width: 16, height: 12, background: "#111", borderRadius: 2 }} />
                          <div style={{ height: 7, width: "50%", background: "#11111120", borderRadius: 2 }} />
                        </div>
                        <div style={{ height: 7, width: "85%", background: "#11111112", borderRadius: 2, marginBottom: 3, paddingLeft: 20 }} />
                      </div>
                      {isActive && (
                        <div style={{
                          position: "absolute", top: 44, right: 10,
                          width: 22, height: 22, borderRadius: "50%",
                          background: primaryColor, color: "#111",
                          fontSize: 12, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>✓</div>
                      )}
                    </>
                  ) : (
                    // Light default (orc-002, orc-003, ctr-001, ctr-002)
                    <>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: tpl.id === "orc-003" ? 36 : 22, background: tpl.id === "orc-003" ? "#f2f2ee" : "#fff", borderBottom: `2px solid ${tpl.previewAccent}`, display: "flex", alignItems: "center", paddingInline: 10, justifyContent: "space-between" }}>
                        <div style={{ height: 10, width: 40, background: `${tpl.previewAccent}44`, borderRadius: 2 }} />
                        <div style={{ height: 8, width: 60, background: "#11111115", borderRadius: 2 }} />
                      </div>
                      <div style={{ position: "absolute", top: tpl.id === "orc-003" ? 50 : 34, left: 12, right: 12 }}>
                        <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e8e8e2", padding: "6px 8px", marginBottom: 5 }}>
                          <div style={{ height: 6, width: "90%", background: "#11111110", borderRadius: 2, marginBottom: 3 }} />
                          <div style={{ height: 6, width: "70%", background: "#11111110", borderRadius: 2, marginBottom: 3 }} />
                          <div style={{ height: 6, width: "80%", background: "#11111110", borderRadius: 2 }} />
                        </div>
                        <div style={{ background: "#111", borderRadius: 4, padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ height: 6, width: 30, background: "#ffffff44", borderRadius: 2 }} />
                          <div style={{ height: 10, width: 50, background: tpl.previewAccent, borderRadius: 2, opacity: 0.9 }} />
                        </div>
                      </div>
                      {isActive && (
                        <div style={{
                          position: "absolute", top: 8, right: 8,
                          width: 22, height: 22, borderRadius: "50%",
                          background: primaryColor, color: "#111",
                          fontSize: 12, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>✓</div>
                      )}
                    </>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
                      {tpl.name}
                    </div>
                    <div style={{
                      fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600,
                      padding: "2px 8px", borderRadius: 6,
                      background: tpl.style === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.06)",
                      color: "#6b7280", letterSpacing: "0.05em",
                    }}>
                      {STYLE_LABEL[tpl.style]}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#4b5563", lineHeight: 1.5, marginBottom: 14 }}>
                    {tpl.description}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {/* Preview button */}
                    <button
                      onClick={() => handlePreview(tpl.id)}
                      disabled={isLoadingPreview}
                      style={{
                        flex: 1, height: 36, borderRadius: 8,
                        border: "1px solid #252d3d",
                        background: "#0e1118",
                        color: isLoadingPreview ? "#4b5563" : "#94a3b8",
                        fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                        cursor: isLoadingPreview ? "not-allowed" : "pointer",
                        transition: "all 0.15s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      {isLoadingPreview ? (
                        <>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #4b5563", borderTopColor: "#94a3b8", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                          Gerando...
                        </>
                      ) : (
                        "Ver PDF"
                      )}
                    </button>

                    {/* Select button */}
                    <button
                      onClick={() => setSelected(tpl.id)}
                      style={{
                        flex: 1, height: 36, borderRadius: 8,
                        border: isActive ? `1px solid ${primaryColor}` : "1px solid #252d3d",
                        background: isActive ? `${primaryColor}15` : "#141824",
                        color: isActive ? primaryColor : "#94a3b8",
                        fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {isActive ? "Selecionado" : "Selecionar"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Save button ── */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", height: 52, borderRadius: 12, border: "none",
            background: saving ? "#252d3d" : "linear-gradient(180deg, #f5c842 0%, #e6b800 100%)",
            color: saving ? "#6b7280" : "#1a1200",
            fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.02em",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 4px 14px rgba(230,184,0,0.25)",
            transition: "opacity 0.15s",
          }}
        >
          {saving ? "Salvando..." : "Salvar Templates"}
        </button>
      </div>

      {/* ── Success modal ── */}
      {successModal && (
        <div
          onClick={() => setSuccessModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#141824", borderRadius: 20,
              border: "1px solid #252d3d",
              padding: "32px 28px", width: "100%", maxWidth: 380,
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
            }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 18,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 700,
              fontSize: 18, color: "#f1f5f9", marginBottom: 8, textAlign: "center",
            }}>
              Template salvo!
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              color: "#6b7280", textAlign: "center", lineHeight: 1.6, marginBottom: 28,
            }}>
              O template de {successModal.tab === "orcamento" ? "orçamento" : "contrato"} foi atualizado.<br />
              Deseja gerar um agora para testar?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              <button
                onClick={() => {
                  setSuccessModal(null);
                  router.push(successModal.tab === "orcamento" ? "/admin/orcamento" : "/admin/contrato");
                }}
                style={{
                  width: "100%", height: 48, borderRadius: 12, border: "none",
                  background: "linear-gradient(180deg, #f5c842 0%, #e6b800 100%)",
                  color: "#1a1200",
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(230,184,0,0.25)",
                }}
              >
                Testar agora →
              </button>
              <button
                onClick={() => setSuccessModal(null)}
                style={{
                  width: "100%", height: 42, borderRadius: 12,
                  border: "1px solid #252d3d", background: "transparent",
                  color: "#6b7280",
                  fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
