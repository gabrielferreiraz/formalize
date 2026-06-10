"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "pwa_install_dismissed";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

// ── Ícone Share do Safari (iOS) ──────────────────────────────────
function IosShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12 2 12 14" />
      <polyline points="8 6 12 2 16 6" />
      <path d="M8 12H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-3" />
    </svg>
  );
}

// ── Ícone "Adicionar à Tela de Início" (iOS — plus em quadrado) ──
function IosAddIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3.5" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

// ── Ícone três pontos do Chrome (Android) ───────────────────────
function AndroidMenuIcon() {
  return (
    <svg width="18" height="22" viewBox="0 0 6 22" fill="currentColor">
      <circle cx="3" cy="2.5" r="1.8" />
      <circle cx="3" cy="11" r="1.8" />
      <circle cx="3" cy="19.5" r="1.8" />
    </svg>
  );
}

// ── Ícone "Adicionar à tela" genérico ───────────────────────────
function AddScreenIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

// ── Ícone confirmar ─────────────────────────────────────────────
function ConfirmIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const IOS_STEPS = [
  {
    Icon: IosShareIcon,
    label: "Toque em Compartilhar",
    sub: "Barra inferior do Safari",
    color: "#3b9eff",
  },
  {
    Icon: IosAddIcon,
    label: "Adicionar à Tela de Início",
    sub: "Role a lista de opções",
    color: "#f5c842",
  },
  {
    Icon: ConfirmIcon,
    label: 'Toque em "Adicionar"',
    sub: "Canto superior direito",
    color: "#4ade80",
  },
];

const ANDROID_STEPS = [
  {
    Icon: AndroidMenuIcon,
    label: "Abra o menu do Chrome",
    sub: "Três pontos no canto superior direito",
    color: "#3b9eff",
  },
  {
    Icon: AddScreenIcon,
    label: "Adicionar à tela inicial",
    sub: "Selecione esta opção",
    color: "#f5c842",
  },
  {
    Icon: ConfirmIcon,
    label: "Confirme a instalação",
    sub: 'Toque em "Adicionar"',
    color: "#4ade80",
  },
];

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const plt = detectPlatform();
    setPlatform(plt);

    if (plt === "android" || plt === "other") {
      const pre = (window as any).__pwaPrompt;
      if (pre) {
        (window as any).__pwaPrompt = null;
        setDeferredPrompt(pre);
        setVisible(true);
        return;
      }
      const handler = (e: Event) => {
        e.preventDefault();
        (window as any).__pwaPrompt = null;
        setDeferredPrompt(e);
        setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler as any);
      return () => window.removeEventListener("beforeinstallprompt", handler as any);
    } else {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
    setShowSteps(false);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") dismiss();
      setDeferredPrompt(null);
    }
  }

  if (!visible) return null;

  const steps = platform === "ios" ? IOS_STEPS : ANDROID_STEPS;
  const hasNativePrompt = platform !== "ios" && !!deferredPrompt;

  return (
    <div style={{
      position: "fixed",
      bottom: "calc(70px + env(safe-area-inset-bottom, 0px))",
      left: 12, right: 12,
      zIndex: 8888,
      background: "#111827",
      border: "1px solid #1f2937",
      borderRadius: 18,
      padding: "14px 16px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(245,200,66,0.15), rgba(245,200,66,0.04))",
          border: "1px solid rgba(245,200,66,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#f5c842" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.2 }}>
            Instalar Formalize
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            Acesso rápido na tela inicial
          </div>
        </div>

        <button onClick={dismiss} style={{
          background: "none", border: "none", color: "#4b5563",
          cursor: "pointer", padding: 6, lineHeight: 0, flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Steps expandidos */}
      {showSteps && (
        <div style={{
          marginTop: 14, paddingTop: 14,
          borderTop: "1px solid #1f2937",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Ícone real do browser */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `${s.color}14`,
                border: `1px solid ${s.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: s.color,
              }}>
                <s.Icon />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 11, color: "#4b5563", marginTop: 1 }}>
                  {s.sub}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  marginLeft: "auto", flexShrink: 0,
                  color: "#374151", fontSize: 16, lineHeight: 1,
                }}>›</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ações */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {!hasNativePrompt && (
          <button
            onClick={() => setShowSteps(v => !v)}
            style={{
              flex: 1, height: 40, borderRadius: 10,
              border: "1px solid #1f2937", background: "transparent",
              color: showSteps ? "#94a3b8" : "#64748b",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {showSteps ? "Ocultar" : "Como instalar"}
          </button>
        )}
        {hasNativePrompt && (
          <button
            onClick={handleInstall}
            style={{
              flex: 1, height: 40, borderRadius: 10,
              border: "none", background: "#e6b800",
              color: "#1a1000", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Instalar agora
          </button>
        )}
      </div>
    </div>
  );
}
