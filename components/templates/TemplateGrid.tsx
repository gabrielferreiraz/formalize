"use client";

import type { TemplateInfo } from "@/lib/templates/registry";
import { TemplateCard } from "./TemplateCard";

interface Props {
  items: TemplateInfo[];
  selectedId: string;
  primaryColor: string;
  previewingId: string | null;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
  emptyLabel?: string;
}

/** Grid of selectable template cards — shared by /admin/templates and the onboarding flow. */
export function TemplateGrid({
  items,
  selectedId,
  primaryColor,
  previewingId,
  onSelect,
  onPreview,
  emptyLabel = "Carregando templates...",
}: Props) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#6b7280", padding: "40px 0", fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 14 }}>
      {items.map((tpl) => (
        <TemplateCard
          key={tpl.id}
          tpl={tpl}
          isActive={tpl.id === selectedId}
          primaryColor={primaryColor}
          isLoadingPreview={previewingId === tpl.id}
          onSelect={() => onSelect(tpl.id)}
          onPreview={() => onPreview(tpl.id)}
        />
      ))}
    </div>
  );
}
