"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    Promise.all([
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/artist/me").then((r) => r.json()),
    ]).then(([tpl, artist]) => {
      setTemplates({ orcamento: tpl?.orcamento || [], contrato: tpl?.contrato || [] });
      setSelectedOrc(artist?.orcamentoTemplate || "orc-001");
      setSelectedCtr(artist?.contratoTemplate || "ctr-001");
      setPrimaryColor(artist?.primaryColor || "#e6b800");
    });
  }, []);

  const currentSelected = tab === "orcamento" ? selectedOrc : selectedCtr;
  const setSelected = tab === "orcamento" ? setSelectedOrc : setSelectedCtr;
  const items = templates[tab];

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
        setMessage({ text: "Templates salvos com sucesso!", type: "success" });
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
      // Clean up after a short delay
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
                  ) : tpl.id === "ctr-003" ? (
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
