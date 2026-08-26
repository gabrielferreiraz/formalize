"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ScaledIframe } from "@/components/documents/ScaledIframe";
import { useTemplatePreviewHtml } from "@/hooks/useTemplatePreviewHtml";

export interface PreviewTarget {
  id: string;
  type: "orcamento" | "contrato";
  name: string;
}

interface Props {
  open: PreviewTarget | null;
  onClose: () => void;
}

/**
 * Preview de um template como página web (sem Gotenberg) — usado pelo
 * onboarding e por /admin/templates.
 */
export function TemplatePreviewModal({ open, onClose }: Props) {
  const { html, error } = useTemplatePreviewHtml(open);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0e1118", display: "flex", flexDirection: "column", height: "100dvh" }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "calc(10px + env(safe-area-inset-top, 0px)) 16px 10px",
          borderBottom: "1px solid #1a1f2e", flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
          {open.name}
        </span>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: "1px solid #252d3d", background: "#141824", color: "#94a3b8",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {error ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#6b7280", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
            Erro ao carregar o preview. Tente de novo.
          </div>
        ) : html ? (
          <ScaledIframe html={html} title={open.name} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <span className="animate-spin" style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #252d3d", borderTopColor: "#e6b800", display: "inline-block" }} />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
