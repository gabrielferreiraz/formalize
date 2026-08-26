"use client";

import { useEffect, useRef } from "react";
import { ScaledIframe, type ScaledIframeHandle } from "@/components/documents/ScaledIframe";

interface Props {
  html: string;
  token: string;
  title: string;
}

export function DocumentFrame({ html, token, title }: Props) {
  const frameRef = useRef<ScaledIframeHandle>(null);
  const trackedRef = useRef(false);

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
      </header>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ScaledIframe ref={frameRef} html={html} title={title} />
      </div>
    </>
  );
}
