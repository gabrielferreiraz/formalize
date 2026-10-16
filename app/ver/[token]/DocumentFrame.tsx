"use client";

import { useEffect, useRef, useState } from "react";
import { ScaledIframe, type ScaledIframeHandle } from "@/components/documents/ScaledIframe";

interface Props {
  html: string;
  token: string;
  title: string;
  canSign: boolean;
}

export function DocumentFrame({ html, token, title, canSign }: Props) {
  const frameRef = useRef<ScaledIframeHandle>(null);
  const trackedRef = useRef(false);
  const [signerName, setSignerName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");

  const sign = async () => {
    const nomeAssinaturaContratante = signerName.trim();
    if (nomeAssinaturaContratante.length < 3) {
      setSignError("Digite seu nome completo para assinar digitalmente.");
      return;
    }
    setSigning(true);
    setSignError("");
    try {
      const response = await fetch(`/api/public/documents/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeAssinaturaContratante }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível assinar o contrato.");
      window.location.reload();
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Não foi possível assinar o contrato.");
      setSigning(false);
    }
  };

  // Registra a visualização uma única vez por carregamento de página.
  // sendBeacon entrega mesmo se a pessoa fechar a aba antes do JS terminar.
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    const url = `/api/public/documents/${token}/view`;
    try {
      if (!navigator.sendBeacon(url)) {
        fetch(url, { method: "POST", keepalive: true }).catch(() => {});
      }
    } catch {
      fetch(url, { method: "POST", keepalive: true }).catch(() => {});
    }
  }, [token]);

  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "calc(10px + env(safe-area-inset-top, 0px)) 16px 10px",
          borderBottom: "1px solid #1a1f2e",
          background: "#0e1118",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "#94a3b8",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => frameRef.current?.print()}
            style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 36,
            padding: "0 14px",
            borderRadius: 8,
            border: "none",
            background: "#e6b800",
            color: "#0e1118",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Baixar
          </button>
        </div>
      </header>

      {signError && <div style={{ padding: "9px 16px", background: "#3f1d25", color: "#fda4af", fontSize: 13 }}>{signError}</div>}

      <div style={{ flex: 1, minHeight: 0 }}>
        <ScaledIframe ref={frameRef} html={html} title={title} />
      </div>

      {canSign && (
        <form
          onSubmit={(event) => { event.preventDefault(); sign(); }}
          style={{ padding: "14px 16px calc(14px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid #1a1f2e", background: "#101722" }}
        >
          <label htmlFor="signer-name" style={{ display: "block", marginBottom: 8, color: "#e2e8f0", fontSize: 14, fontWeight: 700 }}>
            Digite seu nome para assinar digitalmente
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="signer-name"
              value={signerName}
              onChange={(event) => { setSignerName(event.target.value); setSignError(""); }}
              placeholder="Seu nome completo"
              autoComplete="name"
              style={{ flex: 1, minWidth: 0, height: 42, borderRadius: 8, border: "1px solid #334155", background: "#0b1019", color: "#f8fafc", padding: "0 12px", fontSize: 14 }}
            />
            <button type="submit" disabled={signing} style={{ height: 42, border: "none", borderRadius: 8, padding: "0 14px", background: "#22c55e", color: "#062b14", fontWeight: 800, cursor: signing ? "wait" : "pointer" }}>
              {signing ? "Salvando..." : "Assinar"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
