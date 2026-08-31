"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useTemplatePreviewHtml } from "@/hooks/useTemplatePreviewHtml";
import type { TemplateInfo } from "@/lib/templates/registry";

interface Props {
  type: "orcamento" | "contrato";
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  selectedId: string;
}

function A4IframePreview({ html, title }: { html: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const availableWidth = entry.contentRect.width;
        setScale(availableWidth / A4_WIDTH);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100%", 
        position: "relative",
        // The container height adjusts to match the scaled A4 height
        height: A4_HEIGHT * scale,
        overflow: "hidden",
        borderRadius: "8px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        background: "white"
      }}
    >
      <iframe
        srcDoc={html}
        title={title}
        sandbox="allow-same-origin allow-modals"
        style={{
          border: "none",
          display: "block",
          background: "white",
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}

function PreviewCard({ tpl, type, isSelected, onSelect }: { tpl: TemplateInfo; type: "orcamento" | "contrato"; isSelected: boolean; onSelect: () => void }) {
  const { html, error } = useTemplatePreviewHtml({ id: tpl.id, type });
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontFamily: "'Inter', sans-serif" }}>{tpl.name}</h3>
          <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'Inter', sans-serif", marginTop: 2 }}>{tpl.description}</div>
        </div>
      </div>
      
      <div style={{ 
        padding: "16px", 
        background: "#1a1f2e", 
        borderRadius: 16, 
        border: `2px solid ${isSelected ? "#e6b800" : "transparent"}`,
        transition: "border-color 0.2s"
      }}>
        {error ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontFamily: "'Inter', sans-serif" }}>Erro ao carregar</div>
        ) : html ? (
          <A4IframePreview html={html} title={tpl.name} />
        ) : (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontFamily: "'Inter', sans-serif" }}>Carregando...</div>
        )}
      </div>

      <button 
        onClick={onSelect} 
        style={{ 
          background: isSelected ? "#e6b800" : "#252d3d", 
          color: isSelected ? "#000" : "#fff", 
          border: "none", 
          padding: "10px 16px", 
          borderRadius: 8, 
          fontWeight: "bold", 
          cursor: "pointer", 
          fontFamily: "'Inter', sans-serif",
          width: "100%",
          transition: "all 0.2s"
        }}
      >
        {isSelected ? "Selecionado" : "Selecionar"}
      </button>
    </div>
  );
}

export function TemplateCarouselModal({ type, isOpen, onClose, onSelect, selectedId }: Props) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetch("/api/templates")
        .then(res => res.json())
        .then(data => {
          setTemplates(data[type] || []);
        })
        .catch(err => console.error("Falha ao carregar templates", err));
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, type]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(14, 17, 24, 0.95)", display: "flex", flexDirection: "column", height: "100dvh" }}>
      <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 style={{ color: "#fff", margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 20 }}>
          Revisar Templates ({type === "orcamento" ? "Orçamento" : "Contrato"})
        </h2>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer" }}>✕</button>
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
          gap: "32px",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {templates.map((tpl) => (
            <PreviewCard 
              key={tpl.id} 
              tpl={tpl} 
              type={type} 
              isSelected={tpl.id === selectedId} 
              onSelect={() => onSelect(tpl.id)} 
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
