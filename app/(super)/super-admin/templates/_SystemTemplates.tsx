"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TemplateItem {
  slug: string;
  type: "orcamento" | "contrato";
  name: string;
  description: string;
  style: "dark" | "light" | "colorful";
  previewBg: string;
  previewAccent: string;
  isActive: boolean;
  hasCustomHtml: boolean;
  sortOrder: number;
  dbId: string | null;
}

// ── Icons ─────────────────────────────────────────────────────────
function IconEye({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function IconEdit({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconTrash({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function IconCode({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  );
}
function IconCopy({ s = 12 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}
function IconRefresh({ s = 13 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/>
    </svg>
  );
}
function IconExpand({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  );
}
function IconCollapse({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
      <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
    </svg>
  );
}
function IconDocument({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────
function ToggleSwitch({ active, onChange, disabled }: { active: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      title={active ? "Desativar template" : "Ativar template"}
      style={{
        flexShrink: 0,
        width: 44, height: 26,
        borderRadius: 13,
        border: "none",
        background: active ? "#22c55e" : "#1e293b",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.22s",
        padding: 0,
        outline: "none",
      }}
    >
      <span style={{
        position: "absolute",
        top: 3,
        left: active ? 21 : 3,
        width: 20, height: 20,
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.22s cubic-bezier(.4,0,.2,1)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        display: "block",
      }} />
    </button>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────
function ConfirmDialog({
  message,
  confirmLabel = "Confirmar",
  danger = true,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 20000, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#141824", border: "1px solid #252d3d", borderRadius: 16, padding: "24px 28px", maxWidth: 380, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 14, color: "#dde4f0", lineHeight: 1.7, marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ height: 36, padding: "0 18px", borderRadius: 8, border: "1px solid #252d3d", background: "transparent", color: "#6b7280", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ height: 36, padding: "0 18px", borderRadius: 8, border: "none", background: danger ? "#ef4444" : "#e6b800", color: danger ? "#fff" : "#07090e", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
function Spinner({ size = 20, color = "#e6b800" }: { size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid #1e293b`, borderTopColor: color, animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  );
}

// ── Template Card ─────────────────────────────────────────────────
function TemplateCard({
  t,
  onToggle,
  onEdit,
  onPreview,
  saving,
}: {
  t: TemplateItem;
  onToggle: () => void;
  onEdit: () => void;
  onPreview: () => void;
  saving: boolean;
}) {
  return (
    <div
      className="tmpl-card"
      style={{
        background: "#10141f",
        border: `1px solid ${t.isActive ? "#1e2a3a" : "#161a23"}`,
        borderRadius: 16,
        overflow: "hidden",
        opacity: t.isActive ? 1 : 0.55,
        transition: "opacity 0.2s, border-color 0.25s, box-shadow 0.25s",
        display: "flex",
        flexDirection: "column",
        ["--card-accent" as string]: t.previewAccent,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 100,
        background: `linear-gradient(145deg, ${t.previewBg} 0%, ${t.previewBg}bb 100%)`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
      }}>
        {/* Mini A4 silhouette */}
        <div style={{
          position: "absolute",
          right: 20, bottom: -10,
          width: 50, height: 66,
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${t.previewAccent}25`,
          borderRadius: 4,
          transform: "rotate(5deg)",
          overflow: "hidden",
        }}>
          <div style={{ height: 10, background: `${t.previewAccent}30`, margin: "6px 6px 0" }} />
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              height: 3, borderRadius: 2,
              background: `${t.previewAccent}22`,
              margin: `5px ${6 + (i % 2) * 4}px 0 6px`,
            }} />
          ))}
        </div>
        <div style={{
          position: "absolute",
          right: 28, bottom: -14,
          width: 50, height: 66,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${t.previewAccent}15`,
          borderRadius: 4,
          transform: "rotate(10deg)",
        }} />

        {/* Info */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: `${t.previewAccent}80`, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 5 }}>
            {t.type === "orcamento" ? "Orçamento" : "Contrato"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: t.previewAccent, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {t.name}
          </div>
          <code style={{ fontSize: 10, color: `${t.previewAccent}55`, marginTop: 5, display: "block" }}>
            {t.slug}
          </code>
        </div>

        {/* Top-right badges */}
        <div style={{ position: "absolute", top: 8, right: 10, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <span style={{
            background: t.isActive ? "#16a34a18" : "#1e293b",
            border: `1px solid ${t.isActive ? "#22c55e44" : "#334155"}`,
            borderRadius: 5,
            padding: "2px 7px",
            fontSize: 9,
            fontWeight: 700,
            color: t.isActive ? "#4ade80" : "#6b7280",
            letterSpacing: "0.1em",
          }}>
            {t.isActive ? "ATIVO" : "INATIVO"}
          </span>
          {t.hasCustomHtml && (
            <span style={{
              background: "#5b21b618",
              border: "1px solid #7c3aed44",
              borderRadius: 5,
              padding: "2px 7px",
              fontSize: 9,
              fontWeight: 700,
              color: "#a78bfa",
              letterSpacing: "0.1em",
            }}>
              HTML CUSTOM
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 12, color: "#4a6275", lineHeight: 1.6, marginBottom: 14, flex: 1, minHeight: 36 }}>
          {t.description || <em style={{ color: "#2d3d50" }}>Sem descrição</em>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            className="tmpl-btn-blue"
            onClick={onPreview}
            style={{
              flex: 1, height: 34, borderRadius: 8,
              border: "1px solid #1a2d4a",
              background: "#0a1628",
              color: "#60a5fa",
              fontSize: 12, fontWeight: 500,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontFamily: "inherit",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <IconEye /> Prévia
          </button>
          <button
            className="tmpl-btn"
            onClick={onEdit}
            style={{
              flex: 1, height: 34, borderRadius: 8,
              border: "1px solid #1e2a3a",
              background: "#0e1520",
              color: "#94a3b8",
              fontSize: 12, fontWeight: 500,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontFamily: "inherit",
              transition: "background 0.15s, border-color 0.15s",
            }}
          >
            <IconEdit /> Editar
          </button>
          <ToggleSwitch active={t.isActive} onChange={onToggle} disabled={saving} />
        </div>
      </div>
    </div>
  );
}

// ── Var Chip (copy on click) ──────────────────────────────────────
function VarChip({ name, label }: { name: string; label: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(`{{${name}}}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      title={`Copiar {{${name}}}`}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        background: copied ? "#1a2d1a" : "#0e1118",
        border: `1px solid ${copied ? "#22c55e44" : "#1e293b"}`,
        borderRadius: 6,
        padding: "5px 9px",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
        textAlign: "left",
      }}
    >
      <code style={{ color: copied ? "#4ade80" : "#a78bfa", fontSize: 11, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
        {`{{${name}}}`}
      </code>
      <span style={{ color: "#3d5066", fontSize: 10, flex: 1 }}>{label}</span>
      <span style={{ color: copied ? "#4ade80" : "#2d3d50", flexShrink: 0 }}>
        {copied ? "✓" : <IconCopy />}
      </span>
    </button>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────
function EditModal({
  t,
  onClose,
  onSave,
}: {
  t: TemplateItem;
  onClose: () => void;
  onSave: (fields: { name: string; description: string; customHtml: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(t.name);
  const [desc, setDesc] = useState(t.description);
  const [htmlMode, setHtmlMode] = useState(false);
  const [customHtml, setCustomHtml] = useState<string>("");
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"meta" | "html">("meta");
  const [confirm, setConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [autoPreviewPending, setAutoPreviewPending] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Ref always holds the latest HTML — avoids stale closure inside setTimeout
  const htmlRef = useRef("");
  useEffect(() => { htmlRef.current = customHtml; }, [customHtml]);

  // Ctrl+scroll to zoom preview
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setPreviewZoom(prev => Math.min(2.5, Math.max(0.25, prev - e.deltaY * 0.002)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // ESC closes
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !confirm) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [confirm, onClose]);

  useEffect(() => {
    if (tab === "html" && !customHtml && !loadingHtml) {
      loadStarterHtml();
    }
  }, [tab]);

  // Auto-preview with debounce — fires for any HTML change including initial load
  useEffect(() => {
    if (!customHtml) return;
    setAutoPreviewPending(true);
    const timer = setTimeout(() => {
      doRenderPreview();
      setAutoPreviewPending(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [customHtml]);

  function doRenderPreview() {
    if (!previewRef.current) return;
    const html = htmlRef.current;
    if (!html) return;
    previewRef.current.srcdoc = html;
  }

  function handlePrint() {
    const html = htmlRef.current;
    if (!html) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Wait for resources (fonts, images) to load before triggering print
    w.addEventListener("load", () => {
      w.focus();
      w.print();
    });
  }

  async function loadStarterHtml() {
    setLoadingHtml(true);
    try {
      const r = await fetch(`/api/super/templates/${t.slug}`);
      if (r.ok) {
        const json = await r.json();
        if (json.customHtml) {
          setCustomHtml(json.customHtml);
          setHtmlMode(true);
          setLoadingHtml(false);
          return;
        }
      }
      const r2 = await fetch(`/api/super/templates/${t.slug}/html`);
      if (r2.ok) setCustomHtml(await r2.text());
    } finally {
      setLoadingHtml(false);
    }
  }

  function handleTabKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = customHtml.substring(0, start) + "  " + customHtml.substring(end);
    setCustomHtml(next);
    setHtmlMode(true);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + 2;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        name: name.trim() || t.name,
        description: desc.trim(),
        customHtml: tab === "html" && htmlMode ? (customHtml || null) : undefined as any,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleResetHtml() {
    setSaving(true);
    try {
      await onSave({ name, description: desc, customHtml: null });
      setCustomHtml("");
      setHtmlMode(false);
      setConfirm(false);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const lineCount = customHtml.split("\n").length;
  const charCount = customHtml.length;

  const VARS: [string, string][] = [
    ["primaryColor","Cor principal"],["nomeArtista","Nome artístico"],["logoImg","Tag <img> do logo"],["instrumento","Instrumentos"],
    ["evento","Nome do evento"],["dataEvento","Data formatada"],["horario","Horário"],["local","Local do evento"],["cidadeEvento","Cidade/UF"],
    ["contratanteNome","Nome do contratante"],["formaPagamento","Forma de pagamento"],
    ["valorCache","Cachê (R$)"],["valorCacheExtenso","Cachê por extenso"],["backline","Backline"],["transporte","Transporte"],["alimentacao","Alimentação"],["hospedagem","Hospedagem"],
    ["valorTotal","Total (R$)"],["valorTotalExtenso","Total por extenso"],
    ["contratanteCpfCnpj","CPF/CNPJ contratante"],["artistaLegalNome","Razão social artista"],["artistaCnpj","CNPJ artista"],
    ["pix","Chave PIX"],["whatsapp","WhatsApp"],["email","E-mail"],["instagram","Instagram"],
    ["dataAssinatura","Data de assinatura"],["foro","Foro"],["hashContrato","Hash do contrato"],
  ];

  return (
    <>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: expanded ? "rgba(0,0,0,0.95)" : "rgba(0,0,0,0.75)",
          display: "flex", alignItems: expanded ? "stretch" : "center", justifyContent: expanded ? "stretch" : "center",
          padding: expanded ? "0" : "16px",
          backdropFilter: expanded ? "none" : "blur(4px)",
          transition: "padding 0.25s, background 0.2s",
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div style={{
          background: "#0e1520",
          border: expanded ? "none" : "1px solid #1e2a3a",
          borderRadius: expanded ? 0 : 20,
          width: "100%",
          maxWidth: expanded ? "100%" : tab === "html" ? 1180 : 520,
          maxHeight: expanded ? "100%" : "94vh",
          height: expanded ? "100%" : undefined,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "max-width 0.3s cubic-bezier(.4,0,.2,1), border-radius 0.25s",
          boxShadow: expanded ? "none" : "0 32px 80px rgba(0,0,0,0.6)",
        }}>
          {/* Header */}
          <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: "#60a5fa",
                    background: "#0a1628", border: "1px solid #1a2d4a",
                    borderRadius: 5, padding: "2px 8px", letterSpacing: "0.1em", textTransform: "uppercase",
                  }}>
                    {t.type === "orcamento" ? "Orçamento" : "Contrato"}
                  </span>
                  <code style={{ fontSize: 11, color: "#3d5066" }}>{t.slug}</code>
                  {t.hasCustomHtml && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "#a78bfa",
                      background: "#5b21b618", border: "1px solid #7c3aed44",
                      borderRadius: 5, padding: "2px 8px", letterSpacing: "0.1em",
                    }}>HTML CUSTOM</span>
                  )}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Editar Template</h2>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, marginTop: 2 }}>
                <button
                  onClick={() => setExpanded(v => !v)}
                  title={expanded ? "Recolher" : "Expandir tela cheia"}
                  style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #1e2a3a", background: "#0e1118", color: "#4a6888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {expanded ? <IconCollapse s={13} /> : <IconExpand s={13} />}
                </button>
                <button
                  onClick={onClose}
                  style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #1e2a3a", background: "#0e1118", color: "#4a6888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #1e2a3a" }}>
              {(["meta", "html"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setTab(v)}
                  style={{
                    height: 36, padding: "0 16px",
                    borderRadius: "8px 8px 0 0",
                    border: "none",
                    borderBottom: tab === v ? "2px solid #e6b800" : "2px solid transparent",
                    background: "transparent",
                    color: tab === v ? "#f1f5f9" : "#4a6888",
                    fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "color 0.15s",
                  }}
                >
                  {v === "meta" ? <><IconEdit s={12} /> Metadados</> : <><IconCode s={12} /> HTML / CSS</>}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {tab === "meta" ? (
              <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#3d5066", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Nome</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t.name}
                    style={{ width: "100%", background: "#0a0f1a", border: "1px solid #1e2a3a", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#3d5066", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Descrição</label>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    rows={3}
                    placeholder={t.description}
                    style={{ width: "100%", background: "#0a0f1a", border: "1px solid #1e2a3a", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ padding: "14px 16px", background: "#0a0f1a", borderRadius: 10, border: "1px solid #1a2333", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
                  {[
                    ["Slug", t.slug],
                    ["Tipo", t.type === "orcamento" ? "Orçamento" : "Contrato"],
                    ["Status", t.isActive ? "Ativo" : "Inativo"],
                    ["HTML custom", t.hasCustomHtml ? "Sim" : "Não (builder padrão)"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                      <span style={{ fontSize: 11, color: "#3d5066", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>{k}</span>
                      <span style={{ fontSize: 12, color: "#7a9ab8" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, display: "flex", padding: "14px 20px 0", gap: 14 }}>
                {/* Editor column */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                  {/* Editor toolbar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#3d5066", textTransform: "uppercase", letterSpacing: "0.1em", flex: 1 }}>
                      HTML do Template
                    </div>
                    {autoPreviewPending && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#4a6888" }}>
                        <Spinner size={10} color="#4a6888" /> Atualizando...
                      </div>
                    )}
                    <button
                      onClick={loadStarterHtml}
                      disabled={loadingHtml}
                      title="Recarregar HTML padrão do builder"
                      style={{ height: 26, padding: "0 10px", borderRadius: 6, border: "1px solid #1e2a3a", background: "#0a0f1a", color: "#6b7280", fontSize: 11, cursor: loadingHtml ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <IconRefresh s={11} /> Recarregar padrão
                    </button>
                  </div>

                  {loadingHtml ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1a", borderRadius: 10, border: "1px solid #1e2a3a", gap: 10, color: "#3d5066", fontSize: 13 }}>
                      <Spinner /> Carregando HTML...
                    </div>
                  ) : (
                    <textarea
                      ref={textareaRef}
                      value={customHtml}
                      onChange={e => { setCustomHtml(e.target.value); setHtmlMode(true); }}
                      onKeyDown={handleTabKey}
                      spellCheck={false}
                      style={{
                        flex: 1,
                        background: "#070b13",
                        border: "1px solid #1e2a3a",
                        borderRadius: 10,
                        padding: "14px 16px",
                        color: "#b8cfe8",
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                        lineHeight: 1.65,
                        resize: "none",
                        outline: "none",
                        boxSizing: "border-box",
                        width: "100%",
                        tabSize: 2,
                      }}
                    />
                  )}

                  {/* Status bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", flexShrink: 0 }}>
                    <details style={{ fontSize: 11, color: "#3d5066" }}>
                      <summary style={{ cursor: "pointer", color: "#4a6888", fontWeight: 600, userSelect: "none", outline: "none" }}>
                        Variáveis disponíveis — clique para copiar
                      </summary>
                      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 4, paddingBottom: 8 }}>
                        {VARS.map(([v, label]) => <VarChip key={v} name={v} label={label} />)}
                      </div>
                    </details>
                    <div style={{ fontSize: 10, color: "#2d3d50", flexShrink: 0, alignSelf: "flex-start", paddingTop: 2 }}>
                      {lineCount} linhas · {charCount.toLocaleString()} chars
                    </div>
                  </div>
                </div>

                {/* Preview column */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                  {/* Preview label + zoom controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#3d5066", textTransform: "uppercase", letterSpacing: "0.1em", flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                      Preview A4
                      {autoPreviewPending && <Spinner size={10} color="#4a6888" />}
                    </div>
                    {/* Zoom controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#0a0f1a", border: "1px solid #1e2a3a", borderRadius: 7, padding: "2px 4px" }}>
                      <button
                        onClick={() => setPreviewZoom(p => Math.max(0.25, +(p - 0.15).toFixed(2)))}
                        title="Diminuir zoom"
                        style={{ width: 22, height: 22, borderRadius: 5, border: "none", background: "transparent", color: "#6b7280", fontSize: 16, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                      >−</button>
                      <button
                        onClick={() => setPreviewZoom(1)}
                        title="Zoom 100%"
                        style={{ minWidth: 38, height: 22, borderRadius: 5, border: "none", background: "transparent", color: "#94a3b8", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: "0 2px" }}
                      >{Math.round(previewZoom * 100)}%</button>
                      <button
                        onClick={() => setPreviewZoom(p => Math.min(2.5, +(p + 0.15).toFixed(2)))}
                        title="Aumentar zoom"
                        style={{ width: 22, height: 22, borderRadius: 5, border: "none", background: "transparent", color: "#6b7280", fontSize: 16, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                      >+</button>
                    </div>
                  </div>

                  {/* A4 scroll container */}
                  <div
                    ref={scrollContainerRef}
                    style={{
                      flex: 1,
                      overflow: "auto",
                      background: "#12161f",
                      borderRadius: 10,
                      border: "1px solid #1e2a3a",
                      display: "flex",
                      justifyContent: "center",
                      padding: "20px 16px",
                    }}
                  >
                    <div style={{ zoom: previewZoom, transformOrigin: "top center", flexShrink: 0 }}>
                      <iframe
                        ref={previewRef}
                        style={{
                          width: 794,
                          height: 1123,
                          border: "none",
                          display: "block",
                          boxShadow: "0 6px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04)",
                        }}
                        title="Preview A4"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: 10, color: "#2d3d50", textAlign: "center", paddingBottom: 4, flexShrink: 0 }}>
                    Ctrl+scroll para zoom · clique em % para resetar
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #1a2333", display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
            {tab === "html" && t.hasCustomHtml && (
              <button
                onClick={() => setConfirm(true)}
                disabled={saving}
                style={{ height: 38, padding: "0 14px", borderRadius: 10, border: "1px solid #ef444430", background: "transparent", color: "#f87171", fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}
              >
                <IconTrash s={13} /> Remover HTML custom
              </button>
            )}
            <div style={{ flex: 1 }} />
            {tab === "html" && (
              <button
                onClick={handlePrint}
                disabled={!customHtml}
                title="Abre diálogo de impressão — use 'Salvar como PDF' para testar o layout"
                style={{ height: 38, padding: "0 16px", borderRadius: 10, border: "1px solid #22c55e40", background: "#0a1a0e", color: "#4ade80", fontSize: 13, fontWeight: 600, cursor: customHtml ? "pointer" : "not-allowed", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, opacity: customHtml ? 1 : 0.4 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
                Imprimir / PDF
              </button>
            )}
            <button
              onClick={onClose}
              style={{ height: 38, padding: "0 20px", borderRadius: 10, border: "1px solid #1e2a3a", background: "transparent", color: "#4a6888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ height: 38, padding: "0 24px", borderRadius: 10, border: "none", background: "#e6b800", color: "#07090e", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}
            >
              {saving && <Spinner size={13} color="#07090e" />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          message="Remover o HTML customizado e voltar ao template padrão do builder? Esta ação não pode ser desfeita."
          confirmLabel="Remover HTML"
          onConfirm={handleResetHtml}
          onCancel={() => setConfirm(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────
function PreviewModal({ slug, type, name, onClose }: { slug: string; type: string; name: string; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#0e1520", borderBottom: "1px solid #1e2a3a", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", background: "#0a1628", border: "1px solid #1a2d4a", borderRadius: 5, padding: "2px 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {type === "orcamento" ? "Orçamento" : "Contrato"}
        </span>
        <code style={{ fontSize: 11, color: "#3d5066" }}>{slug}</code>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#dde4f0" }}>{name}</span>
        <div style={{ flex: 1 }} />
        <a
          href={`/api/super/templates/${slug}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ height: 32, padding: "0 14px", borderRadius: 8, border: "1px solid #1e2a3a", background: "#0a0f1a", color: "#60a5fa", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}
        >
          <IconDocument s={12} /> Abrir PDF ↗
        </a>
        <button
          onClick={onClose}
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #1e2a3a", background: "#0a0f1a", color: "#4a6888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* PDF loading state */}
      {!loaded && (
        <div style={{ position: "absolute", inset: "53px 0 0 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "#070b13", zIndex: 1 }}>
          <Spinner size={28} />
          <div style={{ fontSize: 13, color: "#4a6888" }}>Gerando PDF...</div>
        </div>
      )}

      <iframe
        src={`/api/super/templates/${slug}/pdf`}
        style={{ flex: 1, border: "none", background: "#3a3d42" }}
        onLoad={() => setLoaded(true)}
        title={`Preview ${slug}`}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function SystemTemplatesSection() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orcamento" | "contrato">("orcamento");
  const [saving, setSaving] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<TemplateItem | null>(null);
  const [previewTarget, setPreviewTarget] = useState<TemplateItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/super/templates");
      if (r.ok) setTemplates(await r.json());
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function toggleActive(t: TemplateItem) {
    setSaving(t.slug);
    try {
      const r = await fetch(`/api/super/templates/${t.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      if (r.ok) {
        setTemplates(prev => prev.map(x => x.slug === t.slug ? { ...x, isActive: !x.isActive } : x));
        showToast(t.isActive ? "Template desativado" : "Template ativado");
      } else {
        showToast("Erro ao alterar", false);
      }
    } finally {
      setSaving(null);
    }
  }

  async function handleSave(
    t: TemplateItem,
    fields: { name: string; description: string; customHtml: string | null },
  ) {
    const body: Record<string, unknown> = { name: fields.name, description: fields.description };
    if (fields.customHtml !== undefined) body.customHtml = fields.customHtml;

    const r = await fetch(`/api/super/templates/${t.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      showToast("Salvo com sucesso");
      await load();
    } else {
      showToast("Erro ao salvar", false);
      throw new Error("save failed");
    }
  }

  const visible = templates.filter(t => t.type === tab);
  const stats = [
    { label: "Total", value: visible.length, color: "#60a5fa" },
    { label: "Ativos", value: visible.filter(t => t.isActive).length, color: "#4ade80" },
    { label: "Inativos", value: visible.filter(t => !t.isActive).length, color: "#6b7280" },
    { label: "HTML Custom", value: visible.filter(t => t.hasCustomHtml).length, color: "#a78bfa" },
  ];

  return (
    <div style={{ maxWidth: 1020, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#3d5066", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>
            Super Admin · Sistema
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            Templates do Sistema
          </h1>
          <p style={{ fontSize: 13, color: "#4a6275", margin: 0 }}>
            Templates HTML disponíveis para todos os artistas — ative, desative e personalize.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ height: 36, padding: "0 16px", borderRadius: 10, border: "1px solid #1e2a3a", background: "#0e1520", color: "#4a6888", fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
        >
          <IconRefresh s={12} /> Atualizar
        </button>
      </div>

      {/* Tabs + Stats row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "#0e1520", borderRadius: 12, padding: 4, border: "1px solid #1e2a3a" }}>
          {(["orcamento", "contrato"] as const).map(v => (
            <button
              key={v}
              onClick={() => setTab(v)}
              style={{
                height: 34, padding: "0 20px",
                borderRadius: 9, border: "none",
                background: tab === v ? "#1e2a3a" : "transparent",
                color: tab === v ? "#f1f5f9" : "#4a6888",
                fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <IconDocument s={13} />
              {v === "orcamento" ? "Orçamento" : "Contrato"}
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: tab === v ? "#252d3d" : "#0a0f1a",
                borderRadius: 5, padding: "1px 6px",
                color: tab === v ? "#94a3b8" : "#3d5066",
              }}>
                {templates.filter(t => t.type === v).length}
              </span>
            </button>
          ))}
        </div>

        {!loading && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {stats.map(s => (
              <div key={s.label} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "6px 14px",
                background: "#0e1520",
                borderRadius: 8,
                border: "1px solid #1a2333",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 11, color: "#3d5066" }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 220, color: "#3d5066", gap: 12, fontSize: 13 }}>
          <Spinner /> Carregando templates...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
          {visible.map(t => (
            <TemplateCard
              key={t.slug}
              t={t}
              saving={saving === t.slug}
              onToggle={() => toggleActive(t)}
              onEdit={() => setEditTarget(t)}
              onPreview={() => setPreviewTarget(t)}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%",
          transform: "translateX(-50%)",
          background: toast.ok ? "#0e1520" : "#1a0f0f",
          border: `1px solid ${toast.ok ? "#22c55e40" : "#ef444440"}`,
          borderRadius: 12,
          padding: "10px 20px",
          fontSize: 13, fontWeight: 600,
          color: toast.ok ? "#4ade80" : "#f87171",
          zIndex: 10000,
          animation: "fadeInUp 0.2s ease",
          whiteSpace: "nowrap",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>{toast.ok ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {editTarget && (
        <EditModal
          t={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(fields) => handleSave(editTarget, fields)}
        />
      )}
      {previewTarget && (
        <PreviewModal
          slug={previewTarget.slug}
          type={previewTarget.type}
          name={previewTarget.name}
          onClose={() => setPreviewTarget(null)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .tmpl-card:hover {
          border-color: var(--card-accent, #252d3d) !important;
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--card-accent, #252d3d) 20%, transparent),
                      0 12px 40px rgba(0,0,0,0.3);
        }
        .tmpl-btn:hover { background: #141e2e !important; border-color: #2a3a50 !important; }
        .tmpl-btn-blue:hover { background: #0d1f38 !important; border-color: #1e3a5a !important; }
      `}</style>
    </div>
  );
}
