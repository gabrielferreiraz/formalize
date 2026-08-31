"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTemplatePreviewHtml } from "@/hooks/useTemplatePreviewHtml";
import type { TemplateInfo } from "@/lib/templates/registry";

interface Props {
  type: "orcamento" | "contrato";
  isOpen: boolean;
  onClose: () => void;
  /** Salva o template escolhido e dispara a geração do PDF. */
  onGenerate: (templateId: string) => void | Promise<void>;
  selectedId: string;
}

const TRANSITION_MS = 220;
const CARD_WIDTH = 260;
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const SWIPE_THRESHOLD = 40;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const bigint = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Preto ou branco — o que tiver mais contraste em cima da cor de fundo dada. */
function readableTextColor(bgHex: string): string {
  const [r, g, b] = hexToRgb(bgHex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000" : "#fff";
}

function A4MiniPreview({ html, title }: { html: string; title: string }) {
  const scale = CARD_WIDTH / A4_WIDTH;
  return (
    <div style={{ width: CARD_WIDTH, height: A4_HEIGHT * scale, position: "relative", overflow: "hidden", background: "#fff" }}>
      <iframe
        srcDoc={html}
        title={title}
        sandbox="allow-same-origin"
        style={{
          border: "none",
          display: "block",
          background: "#fff",
          width: A4_WIDTH,
          height: A4_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function FanCard({ tpl, type, offset, isSelected, onSelect }: {
  tpl: TemplateInfo;
  type: "orcamento" | "contrato";
  offset: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { html, error } = useTemplatePreviewHtml({ id: tpl.id, type });
  const isDark = tpl.style === "dark";
  const isFront = offset === 0;

  let transform: string;
  let zIndex: number;
  let opacity: number;
  if (offset === 0) {
    transform = "translateX(0px) rotate(0deg) scale(1.05)";
    zIndex = 30;
    opacity = 1;
  } else if (offset > 0) {
    transform = `translateX(${offset * 60}px) rotate(${offset * 6}deg) scale(${1 - offset * 0.05})`;
    zIndex = 30 - offset;
    opacity = offset > 3 ? 0 : 0.85;
  } else {
    transform = `translateX(${offset * 60}px) rotate(${offset * 6}deg) scale(${1 + offset * 0.05})`;
    zIndex = 30 + offset;
    opacity = 0;
  }

  return (
    <div
      className="fz-tpl-card"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: CARD_WIDTH,
        borderRadius: 16,
        background: isDark ? "#141414" : "#ffffff",
        border: `1px solid ${isDark ? tpl.previewAccent : "rgba(255,255,255,0.12)"}`,
        boxShadow: isSelected
          ? `0 0 0 3px ${tpl.previewAccent}, 0 15px 35px rgba(0,0,0,0.6)`
          : isDark
          ? `0 0 22px ${hexToRgba(tpl.previewAccent, 0.35)}`
          : "0 15px 35px rgba(0,0,0,0.5)",
        transform,
        transformOrigin: "bottom center",
        zIndex,
        opacity,
        pointerEvents: isFront ? "auto" : "none",
        transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, box-shadow 0.3s ease",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {error ? (
        <div style={{ width: CARD_WIDTH, height: A4_HEIGHT * (CARD_WIDTH / A4_WIDTH), display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
          Erro ao carregar
        </div>
      ) : html ? (
        <A4MiniPreview html={html} title={tpl.name} />
      ) : (
        <div style={{ width: CARD_WIDTH, height: A4_HEIGHT * (CARD_WIDTH / A4_WIDTH), display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
          Carregando...
        </div>
      )}

      <div style={{ padding: "12px 16px 0", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: isDark ? "#fff" : "#1a1a1a" }}>{tpl.name}</div>
        <div style={{
          fontSize: 11.5, marginTop: 4, lineHeight: 1.4,
          color: isDark ? "rgba(255,255,255,0.65)" : "rgba(26,26,26,0.6)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: "2.8em",
        }}>
          {tpl.description}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className="fz-select-btn"
        style={{
          display: "block",
          width: "calc(100% - 32px)",
          margin: "10px 16px 16px",
          padding: "10px 16px",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          transition: "background 0.2s, transform 0.1s",
          background: isSelected ? tpl.previewAccent : isDark ? "rgba(255,255,255,0.12)" : "#f1f1f1",
          color: isSelected ? readableTextColor(tpl.previewAccent) : isDark ? "#fff" : "#1a1a1a",
        }}
      >
        {isSelected ? "Selecionado ✓" : "Selecionar Template"}
      </button>
    </div>
  );
}

export function TemplateCarouselModal({ type, isOpen, onClose, onGenerate, selectedId }: Props) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [mounted, setMounted] = useState(false);
  const [render, setRender] = useState(isOpen);
  const [entered, setEntered] = useState(false);
  const [selected, setSelected] = useState(selectedId);
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const dragRef = useRef({ startX: 0, currentX: 0, dragging: false });

  useEffect(() => setMounted(true), []);

  // Controla montagem + animação de entrada/saída suave do modal
  useEffect(() => {
    let raf1 = 0, raf2 = 0, timeout: ReturnType<typeof setTimeout>;
    if (isOpen) {
      setRender(true);
      setSelected(selectedId);
      setGenerating(false);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setEntered(true));
      });
    } else {
      setEntered(false);
      timeout = setTimeout(() => setRender(false), TRANSITION_MS);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  // Abre o leque já com o template ativo na frente
  useEffect(() => {
    if (templates.length === 0) return;
    const idx = templates.findIndex((t) => t.id === selectedId);
    setCurrentIndex(idx >= 0 ? idx : 0);
  }, [templates, selectedId]);

  const changeSlide = useCallback((direction: number) => {
    setCurrentIndex((i) => Math.max(0, Math.min(templates.length - 1, i + direction)));
  }, [templates.length]);

  // Navegação por teclado
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") changeSlide(-1);
      else if (e.key === "ArrowRight") changeSlide(1);
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, changeSlide, onClose]);

  if (!render || !mounted) return null;

  async function handleGerarPdf() {
    if (!selected || generating) return;
    setGenerating(true);
    try {
      await onGenerate(selected);
    } finally {
      setGenerating(false);
      onClose();
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current.dragging = true;
    // currentX começa igual a startX: um clique sem nenhum movimento do
    // ponteiro precisa resultar em diff 0, senão qualquer clique (inclusive
    // no botão "Selecionar") é lido como um swipe e troca o card sozinho.
    dragRef.current.startX = e.clientX;
    dragRef.current.currentX = e.clientX;
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current.dragging) return;
    dragRef.current.currentX = e.clientX;
  }
  function handlePointerUp() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const diff = dragRef.current.startX - dragRef.current.currentX;
    if (diff > SWIPE_THRESHOLD) changeSlide(1);
    else if (diff < -SWIPE_THRESHOLD) changeSlide(-1);
    dragRef.current.startX = 0;
    dragRef.current.currentX = 0;
  }

  return createPortal(
    <div
      className="fz-tpl-modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(11, 15, 23, 0.97)",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        opacity: entered ? 1 : 0,
        transform: entered ? "scale(1)" : "scale(0.97)",
        transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
      }}
    >
      <style>{`
        .fz-select-btn:hover { filter: brightness(1.1); }
        .fz-nav-btn:hover { background: rgba(255,255,255,0.25); transform: translateY(-50%) scale(1.1); }
      `}</style>

      <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 style={{ color: "#fff", margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 20 }}>
          Revisar Templates ({type === "orcamento" ? "Orçamento" : "Contrato"})
        </h2>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: 24, cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <button
          className="fz-nav-btn"
          onClick={() => changeSlide(-1)}
          disabled={currentIndex === 0}
          style={{
            position: "absolute", left: "5%", top: "50%", transform: "translateY(-50%)",
            width: 50, height: 50, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", fontSize: 20, cursor: currentIndex === 0 ? "default" : "pointer",
            opacity: currentIndex === 0 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.3s, transform 0.2s, opacity 0.2s",
            zIndex: 100,
          }}
        >
          ‹
        </button>

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ position: "relative", width: CARD_WIDTH, height: A4_HEIGHT * (CARD_WIDTH / A4_WIDTH) + 130, cursor: "grab", touchAction: "pan-y" }}
        >
          {templates.map((tpl, index) => (
            <FanCard
              key={tpl.id}
              tpl={tpl}
              type={type}
              offset={index - currentIndex}
              isSelected={tpl.id === selected}
              onSelect={() => setSelected(tpl.id)}
            />
          ))}
        </div>

        <button
          className="fz-nav-btn"
          onClick={() => changeSlide(1)}
          disabled={currentIndex >= templates.length - 1}
          style={{
            position: "absolute", right: "5%", top: "50%", transform: "translateY(-50%)",
            width: 50, height: 50, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", fontSize: 20, cursor: currentIndex >= templates.length - 1 ? "default" : "pointer",
            opacity: currentIndex >= templates.length - 1 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.3s, transform 0.2s, opacity 0.2s",
            zIndex: 100,
          }}
        >
          ›
        </button>
      </div>

      <div style={{ padding: "20px 32px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "center" }}>
        <button
          onClick={handleGerarPdf}
          disabled={!selected || generating}
          style={{
            width: "100%",
            maxWidth: 420,
            height: 54,
            borderRadius: 16,
            border: "none",
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            fontWeight: "bold",
            cursor: !selected || generating ? "not-allowed" : "pointer",
            opacity: !selected || generating ? 0.6 : 1,
            background: "linear-gradient(180deg, #f5c842, #e6b800)",
            color: "#1a1200",
            boxShadow: "0 6px 20px rgba(230,184,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
            transition: `opacity ${TRANSITION_MS}ms ease, transform 120ms ease`,
          }}
        >
          {generating ? "Gerando..." : "Gerar PDF do template selecionado"}
        </button>
      </div>
    </div>,
    document.body
  );
}
