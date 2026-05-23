"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao processar.");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100dvh",
      background: "#07090e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <Image src="/icon-512.png" alt="Formalize" width={48} height={48} style={{ borderRadius: 12 }} priority />
        </div>

        {done ? (
          <div style={{
            background: "rgba(13,17,28,0.85)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 22,
            padding: "32px 24px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📩</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#e8edf5", marginBottom: 10 }}>
              Solicitação registrada
            </p>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, marginBottom: 24 }}>
              Nossa equipe vai entrar em contato pelo WhatsApp cadastrado com o link de redefinição em breve.
            </p>
            <Link href="/login" style={{
              display: "block",
              textAlign: "center",
              fontSize: 13,
              color: "#e6b800",
              textDecoration: "none",
              fontWeight: 600,
            }}>
              Voltar ao login
            </Link>
          </div>
        ) : (
          <div style={{
            background: "rgba(13,17,28,0.85)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 22,
            padding: "32px 24px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          }}>
            <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#e8edf5", letterSpacing: "-0.02em" }}>
              Esqueci minha senha
            </h1>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#4b5563", lineHeight: 1.5 }}>
              Informe seu e-mail e nossa equipe enviará um link de redefinição pelo WhatsApp.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#334155", marginBottom: 8 }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="seu@email.com"
                  style={{
                    width: "100%",
                    height: 50,
                    borderRadius: 13,
                    border: "1px solid rgba(255,255,255,0.09)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#e2e8f0",
                    fontSize: 15,
                    padding: "0 16px",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 50,
                  borderRadius: 13,
                  border: "none",
                  background: "linear-gradient(135deg, #f5c842, #d4a017)",
                  color: "#07090e",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {loading ? "Enviando..." : "Solicitar redefinição"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Link href="/login" style={{ fontSize: 13, color: "#334155", textDecoration: "none", fontWeight: 500 }}>
                Voltar ao login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
