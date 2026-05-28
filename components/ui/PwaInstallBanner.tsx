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
      // beforeinstallprompt dispara uma vez por sessão, muito cedo na carga da página.
      // O root layout captura e guarda em window.__pwaPrompt antes do React montar.
      const pre = (window as any).__pwaPrompt;
      if (pre) {
        (window as any).__pwaPrompt = null;
        setDeferredPrompt(pre);
        setVisible(true);
        return;
      }

      // Fallback: ouve normalmente caso ainda não tenha disparado
      const handler = (e: Event) => {
        e.preventDefault();
        (window as any).__pwaPrompt = null;
        setDeferredPrompt(e);
        setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler as any);
      return () => window.removeEventListener("beforeinstallprompt", handler as any);
    } else {
      // iOS — sempre mostra o banner manual
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

  const iosSteps = [
    { icon: "⬆️", text: 'Toque em "Compartilhar" (ícone de seta para cima)' },
    { icon: "➕", text: 'Role para baixo e toque em "Adicionar à Tela de Início"' },
    { icon: "✅", text: 'Toque em "Adicionar" para confirmar' },
  ];

  return (
    <div style={{
      position: "fixed", bottom: "calc(70px + env(safe-area-inset-bottom, 0px))",
      left: 12, right: 12,
      zIndex: 8888,
      background: "#141824",
      border: "1px solid #252d3d",
      borderRadius: 16,
      padding: "14px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(245,200,66,0.14) 0%, rgba(245,200,66,0.04) 100%)",
          border: "1px solid rgba(245,200,66,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5c842" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Instalar Formalize</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>Acesso rápido direto da tela inicial</div>
        </div>
        <button onClick={dismiss} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", padding: 4, lineHeight: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Steps (iOS ou "Mostrar mais") */}
      {showSteps && platform === "ios" && (
        <div style={{ marginTop: 14, borderTop: "1px solid #1e2535", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {iosSteps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 8, background: "#1a2030", border: "1px solid #252d3d",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, flexShrink: 0,
              }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, paddingTop: 3 }}>{s.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => setShowSteps((v) => !v)}
          style={{
            flex: 1, height: 38, borderRadius: 10,
            border: "1px solid #252d3d", background: "transparent",
            color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {showSteps ? "Ocultar" : "Mostrar como"}
        </button>
        {platform !== "ios" && deferredPrompt && (
          <button
            onClick={handleInstall}
            style={{
              flex: 1, height: 38, borderRadius: 10,
              border: "none", background: "#e6b800",
              color: "#1a1000", fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Instalar
          </button>
        )}
      </div>
    </div>
  );
}
