"use client";

import type { TemplateInfo } from "@/lib/templates/registry";
import { TemplateThumbnail } from "./TemplateThumbnail";

interface Props {
  items: TemplateInfo[];
  selectedId: string;
  primaryColor: string;
  onSelect: (id: string) => void;
  loading?: boolean;
}

// TemplateThumbnail usa posicionamento absoluto pensado pra um cartão de
// ~280px — encolher via width menor distorceria as proporções. Em vez
// disso, renderiza no tamanho nativo e aplica transform:scale, igual ao
// ScaledIframe faz com o documento inteiro.
const NATIVE_W = 280;
const NATIVE_H = 160;
const SCALE = 0.4;

/** Fileira horizontal de miniaturas de template — arraste/swipe pra comparar lado a lado. */
export function TemplateCarousel({ items, selectedId, primaryColor, onSelect, loading }: Props) {
  if (items.length === 0) {
    return (
      <div style={{ height: NATIVE_H * SCALE, display: "flex", alignItems: "center", color: "#3d5880", fontSize: 12 }}>
        {loading ? "Carregando modelos..." : "Nenhum modelo disponível."}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        overflowX: "auto",
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 4,
      }}
    >
      {items.map((tpl) => {
        const active = tpl.id === selectedId;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl.id)}
            style={{
              flexShrink: 0,
              scrollSnapAlign: "start",
              borderRadius: 12,
              overflow: "hidden",
              border: active ? "2px solid var(--accent-on-dark)" : "1px solid #1e3050",
              background: "#0d1422",
              padding: 0,
              cursor: "pointer",
              boxShadow: active ? "0 0 0 3px rgba(var(--accent-rgb), 0.22)" : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          >
            <div style={{ width: NATIVE_W * SCALE, height: NATIVE_H * SCALE, overflow: "hidden" }}>
              <div style={{ width: NATIVE_W, height: NATIVE_H, transform: `scale(${SCALE})`, transformOrigin: "top left" }}>
                <TemplateThumbnail tpl={tpl} isActive={false} primaryColor={primaryColor} />
              </div>
            </div>
            <div
              style={{
                width: NATIVE_W * SCALE,
                padding: "6px 8px",
                fontSize: 10.5,
                fontWeight: 600,
                color: active ? "#dde4f0" : "#5a7896",
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {tpl.name}
            </div>
          </button>
        );
      })}
    </div>
  );
}
