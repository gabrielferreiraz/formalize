"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export interface TutorialStep {
  icon: string;
  title: string;
  body: string;
  targetId: string;
}

interface Props {
  pageKey: string;
  steps: TutorialStep[];
  accentColor?: string;
}

const PREFIX = "tutorial_seen_";
const TOOLTIP_W = 300;
const PAD = 8;
const RETRY_INTERVAL_MS = 120;
const RETRY_MAX_MS = 2500;

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "230,184,0";
}

export function PageTutorial({ pageKey, steps, accentColor = "#e6b800" }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const rafRef = useRef<number | null>(null);
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRetry = () => {
    if (retryRef.current) { clearInterval(retryRef.current); retryRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  // Dismiss without marking as seen — try again next load
  const hide = useCallback(() => {
    stopRetry();
    setVisible(false);
    setRect(null);
  }, []);

  // Dismiss permanently
  const dismiss = useCallback(() => {
    localStorage.setItem(PREFIX + pageKey, "1");
    stopRetry();
    setVisible(false);
    setRect(null);
  }, [pageKey]);

  const snapRect = useCallback((targetId: string) => {
    stopRetry();

    const tryFind = () => {
      const el = document.getElementById(targetId);
      if (!el) return false;
      // Don't highlight if element is invisible
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Poll rect while scroll settles
      const start = performance.now();
      const poll = (now: number) => {
        setRect(el.getBoundingClientRect());
        if (now - start < 400) rafRef.current = requestAnimationFrame(poll);
      };
      rafRef.current = requestAnimationFrame(poll);
      return true;
    };

    if (tryFind()) return;

    // Element not in DOM yet — retry for up to RETRY_MAX_MS
    const started = Date.now();
    retryRef.current = setInterval(() => {
      if (tryFind()) { stopRetry(); return; }
      if (Date.now() - started > RETRY_MAX_MS) {
        stopRetry();
        // Element never appeared — skip tutorial silently (don't mark as seen)
        hide();
      }
    }, RETRY_INTERVAL_MS);
  }, [hide]);

  // Keep rect live on scroll/resize
  useEffect(() => {
    if (!visible || !rect) return;
    const id = steps[step]?.targetId;
    if (!id) return;
    const update = () => {
      const el = document.getElementById(id);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [visible, rect, step, steps]);

  // ESC to dismiss
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(PREFIX + pageKey)) return;

    const justOnboarded = sessionStorage.getItem("just_onboarded");
    if (justOnboarded) sessionStorage.removeItem("just_onboarded");

    // Delay longer to let page finish rendering and user settle
    const delay = justOnboarded ? 1800 : 1200;

    const t = setTimeout(() => {
      // Don't start if user is already interacting (has an input focused)
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) {
        return;
      }
      setVisible(true);
      snapRect(steps[0]?.targetId);
    }, delay);

    return () => clearTimeout(t);
  }, [pageKey, steps, snapRect]);

  // Cleanup on unmount
  useEffect(() => () => stopRetry(), []);

  function next() {
    const nextIdx = step + 1;
    if (nextIdx < steps.length) {
      setStep(nextIdx);
      snapRect(steps[nextIdx].targetId);
    } else {
      dismiss();
    }
  }

  // ── Critical: never render overlay without a valid rect ──
  // This prevents the "black screen with nothing to click" state
  if (!mounted || !visible || !rect) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const rgb = hexToRgb(accentColor);

  // Tooltip positioning
  let tooltipStyle: React.CSSProperties = {};
  let arrowStyle: React.CSSProperties = {};

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = rect.left + rect.width / 2;
  const left = Math.max(12, Math.min(cx - TOOLTIP_W / 2, vw - TOOLTIP_W - 12));
  const isTopHalf = rect.top + rect.height / 2 < vh / 2;

  if (isTopHalf) {
    tooltipStyle = { top: rect.bottom + PAD + 10, left };
    arrowStyle = {
      top: -8, left: Math.max(16, Math.min(cx - left - 8, TOOLTIP_W - 32)),
      borderBottom: `8px solid #1e2535`,
      borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
    };
  } else {
    tooltipStyle = { bottom: vh - rect.top + PAD + 10, left };
    arrowStyle = {
      bottom: -8, left: Math.max(16, Math.min(cx - left - 8, TOOLTIP_W - 32)),
      borderTop: `8px solid #1e2535`,
      borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
    };
  }

  return createPortal(
    <>
      {/* Dark overlay — click anywhere to dismiss */}
      <div
        onClick={dismiss}
        style={{ position: "fixed", inset: 0, zIndex: 9200, background: "rgba(0,0,0,0.62)" }}
      />

      {/* Spotlight ring — pointer-events none so the highlighted element stays clickable */}
      <div style={{
        position: "fixed",
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        borderRadius: 14,
        zIndex: 9201,
        pointerEvents: "none",
        boxShadow: `
          0 0 0 2.5px ${accentColor},
          0 0 0 5px ${accentColor}55,
          0 0 28px ${accentColor}70,
          0 0 0 9999px rgba(0,0,0,0.62)
        `,
        animation: "ringPulse 2s ease-in-out infinite",
      }} />

      {/* Floating tooltip */}
      <div style={{
        position: "fixed",
        width: TOOLTIP_W,
        zIndex: 9202,
        background: "#1e2535",
        border: `1px solid rgba(${rgb},0.3)`,
        borderRadius: 16,
        padding: "14px 16px 12px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(${rgb},0.1)`,
        animation: "tutFadeIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        fontFamily: "'Inter', sans-serif",
        ...tooltipStyle,
      }}>
        {/* Arrow */}
        <div style={{ position: "absolute", width: 0, height: 0, ...arrowStyle }} />

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              height: 3, width: i === step ? 16 : 3,
              borderRadius: 2,
              background: i <= step ? accentColor : "#2d3a4f",
              opacity: i < step ? 0.4 : 1,
              transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{current.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 3, letterSpacing: "-0.01em" }}>
              {current.title}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
              {current.body}
            </div>
          </div>
        </div>

        {/* Hint */}
        <p style={{ fontSize: 10, color: "#1e293b", marginBottom: 10, marginTop: -4 }}>
          Toque em qualquer lugar para fechar
        </p>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={dismiss} style={{
            background: "none", border: "none", color: "#334155",
            fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, padding: 0,
          }}>
            Pular
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} style={{
            height: 34, paddingLeft: 18, paddingRight: 18,
            borderRadius: 9, border: "none",
            background: accentColor,
            color: "#1a1000", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: `0 3px 10px rgba(${rgb},0.35)`,
          }}>
            {isLast ? "Entendi ✓" : "Próximo →"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ringPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.72; }
        }
        @keyframes tutFadeIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>,
    document.body
  );
}

export const TUTORIAL_KEYS = ["orcamento", "contrato", "documentos", "configuracoes"] as const;

export function clearAllTutorials() {
  TUTORIAL_KEYS.forEach(k => localStorage.removeItem(PREFIX + k));
}
