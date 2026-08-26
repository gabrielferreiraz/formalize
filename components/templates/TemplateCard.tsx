"use client";

import type { TemplateInfo } from "@/lib/templates/registry";
import { TemplateThumbnail } from "./TemplateThumbnail";

const STYLE_LABEL: Record<string, string> = {
  dark: "Escuro",
  light: "Claro",
  colorful: "Colorido",
};

interface Props {
  tpl: TemplateInfo;
  isActive: boolean;
  primaryColor: string;
  isLoadingPreview: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

export function TemplateCard({ tpl, isActive, primaryColor, isLoadingPreview, onSelect, onPreview }: Props) {
  return (
    <div style={{
      background: "#141824",
      border: `1px solid ${isActive ? primaryColor : "#252d3d"}`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: isActive ? `0 0 0 1px ${primaryColor}30` : "none",
      transition: "all 0.2s",
    }}>
      <TemplateThumbnail tpl={tpl} isActive={isActive} primaryColor={primaryColor} />

      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>
            {tpl.name}
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
            padding: "2px 8px", borderRadius: 6,
            background: "rgba(255,255,255,0.06)",
            color: "#6b7280", letterSpacing: "0.05em",
          }}>
            {STYLE_LABEL[tpl.style]}
          </div>
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#4b5563", lineHeight: 1.5, marginBottom: 14 }}>
          {tpl.description}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onPreview}
            disabled={isLoadingPreview}
            style={{
              flex: 1, height: 36, borderRadius: 8,
              border: "1px solid #252d3d",
              background: "#0e1118",
              color: isLoadingPreview ? "#4b5563" : "#94a3b8",
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: isLoadingPreview ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {isLoadingPreview ? (
              <>
                <span className="animate-spin" style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid #4b5563", borderTopColor: "#94a3b8", display: "inline-block" }} />
                Gerando...
              </>
            ) : (
              "Ver template"
            )}
          </button>

          <button
            onClick={onSelect}
            style={{
              flex: 1, height: 36, borderRadius: 8,
              border: isActive ? `1px solid ${primaryColor}` : "1px solid #252d3d",
              background: isActive ? `${primaryColor}15` : "#141824",
              color: isActive ? primaryColor : "#94a3b8",
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {isActive ? "Selecionado" : "Selecionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
