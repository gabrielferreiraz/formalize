"use client";

import { useEffect } from "react";

export default function DocumentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
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
        <h1 style={{ fontSize: 19, fontWeight: 800, color: "#e8edf5", marginBottom: 10 }}>
          Não deu pra carregar
        </h1>
        <p style={{ fontSize: 13, color: "#4b6180", lineHeight: 1.6, marginBottom: 24 }}>
          Tivemos um problema pra abrir esse documento agora.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: "11px 24px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #f5c842, #d4a017)",
            color: "#07090e",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
      </div>
    </main>
  );
}
