"use client";

import { useEffect } from "react";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[onboarding]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#07090e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "24px 16px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#e8edf5",
            marginBottom: 8,
          }}
        >
          Erro ao carregar o onboarding
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#4b5563",
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          Aconteceu um problema ao inicializar sua conta. Tente novamente ou
          volte ao login.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 22px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#e2e8f0",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Tentar novamente
          </button>
          <a
            href="/login"
            style={{
              padding: "10px 22px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #f5c842, #d4a017)",
              color: "#07090e",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Ir para o login
          </a>
        </div>
      </div>
    </div>
  );
}
