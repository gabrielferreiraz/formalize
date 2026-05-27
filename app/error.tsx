"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  function handleRetry() {
    setRetrying(true);
    // Pequeno delay para mostrar a animação antes de tentar
    setTimeout(() => {
      reset();
      setRetrying(false);
    }, 600);
  }

  return (
    <main style={{
      minHeight: "100dvh",
      background: "#07090e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "24px 16px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#e8edf5", marginBottom: 10 }}>
          Algo deu errado
        </h1>
        <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 28, lineHeight: 1.6 }}>
          Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              padding: "11px 24px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#e2e8f0",
              fontWeight: 600,
              fontSize: 14,
              cursor: retrying ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: retrying ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {retrying && (
              <span style={{
                display: "inline-block",
                width: 14,
                height: 14,
                border: "2px solid rgba(255,255,255,0.2)",
                borderTopColor: "#e2e8f0",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }} />
            )}
            {retrying ? "Tentando..." : "Tentar novamente"}
          </button>
          <a
            href="/login"
            style={{
              padding: "11px 24px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #f5c842, #d4a017)",
              color: "#07090e",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Ir para o login
          </a>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
