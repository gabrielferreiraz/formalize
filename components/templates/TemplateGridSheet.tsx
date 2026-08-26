"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { TemplateInfo } from "@/lib/templates/registry";
import { TemplateGrid } from "./TemplateGrid";
import { TemplatePreviewModal, type PreviewTarget } from "./TemplatePreviewModal";

interface Props {
  open: boolean;
  onClose: () => void;
  items: TemplateInfo[];
  selectedId: string;
  primaryColor: string;
  onSelect: (id: string) => void;
  type: "orcamento" | "contrato";
  title: string;
}

/**
 * Grade completa de templates num overlay — usada quando o usuário quer
 * comparar todas as opções, não só as que cabem no carrossel. Selecionar
 * já fecha a folha (decisão rápida, sem passo extra de "confirmar").
 */
export function TemplateGridSheet({ open, onClose, items, selectedId, primaryColor, onSelect, type, title }: Props) {
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  if (!open) return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "#07090e", display: "flex", flexDirection: "column", height: "100dvh" }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "calc(14px + env(safe-area-inset-top, 0px)) 20px 12px",
          borderBottom: "1px solid #1a1f2e", flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, color: "#e8edf5" }}>
          {title}
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

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 40px" }}>
        <TemplateGrid
          items={items}
          selectedId={selectedId}
          primaryColor={primaryColor}
          previewingId={null}
          onSelect={(id) => { onSelect(id); onClose(); }}
          onPreview={(id) => setPreview({ id, type, name: items.find((t) => t.id === id)?.name ?? id })}
        />
      </div>

      <TemplatePreviewModal open={preview} onClose={() => setPreview(null)} />
    </div>,
    document.body,
  );
}
