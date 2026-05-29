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
const PAD = 10;
const CARD_W = 320;
const CARD_H = 168;
const BEAM_GAP = 18;
const SAFE_TOP = 72;
const SAFE_BOTTOM = 20;
const RETRY_INTERVAL_MS = 120;
const RETRY_MAX_MS = 2500;

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "230,184,0";
}

function computeLayout(rect: DOMRect, vw: number, vh: number) {
  const spotCx = rect.left + rect.width / 2;
  const spotTop = rect.top - PAD;
  const spotBottom = rect.bottom + PAD;

  const cw = Math.min(CARD_W, vw - 32);

  // Try below first, then above, then clamp
  const belowTop = spotBottom + BEAM_GAP;
  const fitsBelow = belowTop + CARD_H <= vh - SAFE_BOTTOM;
  const aboveTop = spotTop - BEAM_GAP - CARD_H;
  const fitsAbove = aboveTop >= SAFE_TOP;

  let cardTop: number;
  let above: boolean;

  if (fitsBelow) {
    cardTop = belowTop;
    above = false;
  } else if (fitsAbove) {
    cardTop = aboveTop;
    above = true;
  } else {
    cardTop = Math.max(SAFE_TOP, Math.min(belowTop, vh - CARD_H - SAFE_BOTTOM));
    above = false;
  }

  const cardLeft = Math.max(16, Math.min(spotCx - cw / 2, vw - cw - 16));
  const cardCx = cardLeft + cw / 2;

  // Beam anchor points
  const bx1 = spotCx;
  const by1 = above ? spotTop : spotBottom;
  const bx2 = cardCx;
  const by2 = above ? cardTop + CARD_H : cardTop;

  // Bezier control points — curve outward
  const mid = (by1 + by2) / 2;
  const path = `M ${bx1} ${by1} C ${bx1} ${mid}, ${bx2} ${mid}, ${bx2} ${by2}`;

  return { cardTop, cardLeft, cw, above, path, bx2, by2 };
}

export function PageTutorial({ pageKey, steps, accentColor = "#e6b800" }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const rafRef = useRef<number | null>(null);
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elevatedElRef = useRef<{ el: HTMLElement; position: string; zIndex: string } | null>(null);

  const stopRetry = () => {
    if (retryRef.current) { clearInterval(retryRef.current); retryRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const restoreElevation = () => {
    if (!elevatedElRef.current) return;
    const { el, position, zIndex } = elevatedElRef.current;
    el.style.position = position;
    el.style.zIndex = zIndex;
    elevatedElRef.current = null;
  };

  const elevateEl = (el: HTMLElement) => {
    restoreElevation();
    elevatedElRef.current = {
      el,
      position: el.style.position,
      zIndex: el.style.zIndex,
    };
    // Bring element above the overlay so it appears sharp and in full color
    el.style.position = "relative";
    el.style.zIndex = "9205";
  };

  const hide = useCallback(() => {
    stopRetry();
    restoreElevation();
    setVisible(false);
    setRect(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback(() => {
    localStorage.setItem(PREFIX + pageKey, "1");
    stopRetry();
    restoreElevation();
    setVisible(false);
    setRect(null);
  }, [pageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const snapRect = useCallback((targetId: string) => {
    stopRetry();
    restoreElevation();

    const tryFind = () => {
      const el = document.getElementById(targetId);
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      elevateEl(el);
      const elOffset = el.getBoundingClientRect().top + window.scrollY;
      const halfPage = document.documentElement.scrollHeight / 2;
      window.scrollTo({ top: elOffset < halfPage ? 0 : document.documentElement.scrollHeight, behavior: "smooth" });
      const start = performance.now();
      const poll = (now: number) => {
        setRect(el.getBoundingClientRect());
        if (now - start < 500) rafRef.current = requestAnimationFrame(poll);
      };
      rafRef.current = requestAnimationFrame(poll);
      return true;
    };

    if (tryFind()) return;

    const started = Date.now();
    retryRef.current = setInterval(() => {
      if (tryFind()) { stopRetry(); return; }
      if (Date.now() - started > RETRY_MAX_MS) { stopRetry(); hide(); }
    }, RETRY_INTERVAL_MS);
  }, [hide]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const delay = justOnboarded ? 1800 : 1200;
    const t = setTimeout(() => {
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;
      setVisible(true);
      snapRect(steps[0]?.targetId);
    }, delay);
    return () => clearTimeout(t);
  }, [pageKey, steps, snapRect]);

  useEffect(() => () => { stopRetry(); restoreElevation(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    const nextIdx = step + 1;
    if (nextIdx < steps.length) {
      setAnimKey(k => k + 1);
      setStep(nextIdx);
      snapRect(steps[nextIdx].targetId);
    } else {
      dismiss();
    }
  }

  if (!mounted || !visible || !rect) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const rgb = hexToRgb(accentColor);
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const { cardTop, cardLeft, cw, above, path } = computeLayout(rect, vw, vh);
  const slideFrom = above ? "-14px" : "14px";

  const spotX = rect.left - PAD;
  const spotY = rect.top - PAD;
  const spotRight = rect.right + PAD;
  const spotBottom = rect.bottom + PAD;
  // SVG path: outer rect (CW) + inner rect (CCW) = hole where spotlight is
  const blurClipPath = `path('M 0 0 L ${vw} 0 L ${vw} ${vh} L 0 ${vh} Z M ${spotX} ${spotY} L ${spotX} ${spotBottom} L ${spotRight} ${spotBottom} L ${spotRight} ${spotY} Z')`;

  return createPortal(
    <>
      {/* Blur layer — covers everything EXCEPT the spotlight cutout */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9199,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        clipPath: blurClipPath,
        pointerEvents: "none",
      }} />

      {/* Dark overlay — dims outside, no blur */}
      <div onClick={dismiss} style={{
        position: "fixed", inset: 0, zIndex: 9200,
        background: "rgba(4,8,18,0.72)",
      }} />

      {/* Expanding pulse ring */}
      <div style={{
        position: "fixed",
        top: rect.top - PAD - 8,
        left: rect.left - PAD - 8,
        width: rect.width + (PAD + 8) * 2,
        height: rect.height + (PAD + 8) * 2,
        borderRadius: 18,
        zIndex: 9201,
        pointerEvents: "none",
        border: `1.5px solid ${accentColor}`,
        animation: "ringExpand 1.8s ease-out infinite",
      }} />

      {/* Spotlight ring */}
      <div style={{
        position: "fixed",
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        borderRadius: 14,
        zIndex: 9202,
        pointerEvents: "none",
        boxShadow: `
          0 0 0 2px ${accentColor},
          0 0 0 4px ${accentColor}44,
          0 0 24px ${accentColor}80,
          0 0 0 9999px rgba(4,8,18,0.72)
        `,
        animation: "ringGlow 2.2s ease-in-out infinite",
      }} />

      {/* SVG beam */}
      <svg style={{
        position: "fixed", inset: 0, width: "100%", height: "100%",
        zIndex: 9203, pointerEvents: "none", overflow: "visible",
      }}>
        <defs>
          <linearGradient
            id="beamGrad"
            gradientUnits="userSpaceOnUse"
            x1="0" y1={above ? String(rect.top) : String(rect.bottom)}
            x2="0" y2={above ? String(cardTop + CARD_H) : String(cardTop)}
          >
            <stop offset="0%" stopColor={accentColor} stopOpacity={above ? "0.25" : "0.8"} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={above ? "0.8" : "0.25"} />
          </linearGradient>
        </defs>
        <path
          d={path}
          stroke={`url(#beamGrad)`}
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="5 4"
          style={{ animation: "beamFlow 1s linear infinite" }}
        />
        {/* Dot at card connection */}
        <circle
          cx={above ? (cardLeft + cw / 2) : (cardLeft + cw / 2)}
          cy={above ? cardTop + CARD_H : cardTop}
          r="3"
          fill={accentColor}
          style={{ animation: "dotPulse 1.8s ease-in-out infinite" }}
        />
      </svg>

      {/* Tooltip card */}
      <div
        key={animKey}
        style={{
          position: "fixed",
          top: cardTop,
          left: cardLeft,
          width: cw,
          zIndex: 9204,
          background: "linear-gradient(145deg, #111827 0%, #0d1525 100%)",
          border: `1px solid rgba(${rgb},0.22)`,
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: `
            0 0 0 1px rgba(${rgb},0.08),
            0 20px 60px rgba(0,0,0,0.7),
            0 0 40px rgba(${rgb},0.08)
          `,
          fontFamily: "'Inter', sans-serif",
          animation: `tutIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both`,
          // @ts-expect-error CSS custom property
          "--slide-from": slideFrom,
        }}
      >
        {/* Accent top bar */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: 0.7,
        }} />

        <div style={{ padding: "16px 18px 14px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
            {/* Icon bubble */}
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `rgba(${rgb},0.12)`,
              border: `1px solid rgba(${rgb},0.2)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
              boxShadow: `0 0 16px rgba(${rgb},0.15)`,
            }}>
              {current.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: "#f1f5f9",
                letterSpacing: "-0.02em", marginBottom: 3, lineHeight: 1.3,
              }}>
                {current.title}
              </div>
              <div style={{ fontSize: 12, color: "#4b6180", lineHeight: 1.55 }}>
                {current.body}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 2, background: "#0d1525", borderRadius: 2,
            marginBottom: 12, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${((step + 1) / steps.length) * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})`,
              borderRadius: 2,
              transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={dismiss} style={{
              background: "none", border: "none", color: "#1e3050",
              fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              fontWeight: 500, padding: 0, letterSpacing: "0.01em",
            }}>
              Pular
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, color: "#1e3050", fontWeight: 500 }}>
                {step + 1}/{steps.length}
              </span>
              <button onClick={(e) => { e.stopPropagation(); next(); }} style={{
                height: 32, paddingLeft: 16, paddingRight: 16,
                borderRadius: 8, border: "none",
                background: accentColor,
                color: "#0d0800", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: `0 4px 16px rgba(${rgb},0.45), 0 1px 0 rgba(255,255,255,0.15) inset`,
                letterSpacing: "-0.01em",
              }}>
                {isLast ? "Entendi ✓" : "Próximo →"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ringGlow {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
        @keyframes ringExpand {
          0%   { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.18); }
        }
        @keyframes beamFlow {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -18; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.6); }
        }
        @keyframes tutIn {
          from { opacity: 0; transform: translateY(var(--slide-from, 12px)) scale(0.94); }
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
