"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [email, setEmail] = useState("");
  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setValid(false); return; }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.email) { setEmail(d.email); setValid(true); }
        else setValid(false);
      })
      .catch(() => setValid(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6) { setError("Mínimo 6 caracteres."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Erro ao redefinir."); return; }
      setDone(true);
      setTimeout(() => router.replace("/login"), 2500);
    } finally {
      setLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(13,17,28,0.85)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 22,
    padding: "32px 24px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
    textAlign: "center",
  };

  if (valid === null) return (
    <div style={cardStyle}>
      <p style={{ color: "#4b5563", fontSize: 14 }}>Validando link...</p>
    </div>
  );

  if (valid === false) return (
    <div style={cardStyle}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#e8edf5", marginBottom: 10 }}>Link inválido ou expirado</p>
      <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 24, lineHeight: 1.6 }}>
        Este link já foi usado ou expirou (válido por 2 horas). Solicite um novo.
      </p>
      <Link href="/forgot-password" style={{ fontSize: 13, color: "#e6b800", fontWeight: 600, textDecoration: "none" }}>
        Solicitar novo link
      </Link>
    </div>
  );

  if (done) return (
    <div style={cardStyle}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>✅</div>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#e8edf5", marginBottom: 10 }}>Senha redefinida!</p>
      <p style={{ fontSize: 13, color: "#4b5563" }}>Redirecionando para o login...</p>
    </div>
  );

  return (
    <div style={{ ...cardStyle, textAlign: "left" }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#e8edf5", letterSpacing: "-0.02em" }}>
        Nova senha
      </h1>
      <p style={{ margin: "0 0 24px", fontSize: 13, color: "#4b5563" }}>{email}</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(["Nova senha", "Confirmar senha"] as const).map((label, i) => (
          <div key={label}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#334155", marginBottom: 8 }}>
              {label}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={i === 0 ? password : confirm}
                onChange={(e) => i === 0 ? setPassword(e.target.value) : setConfirm(e.target.value)}
                required
                minLength={6}
                style={{
                  width: "100%",
                  height: 50,
                  borderRadius: 13,
                  border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#e2e8f0",
                  fontSize: 15,
                  padding: "0 48px 0 16px",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {i === 0 && (
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#475569", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              )}
            </div>
          </div>
        ))}

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
          }}
        >
          {loading ? "Salvando..." : "Definir nova senha"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <Image src="/icon-512.png" alt="Formalize" width={48} height={48} style={{ borderRadius: 12 }} priority />
        </div>
        <Suspense fallback={<div style={{ color: "#4b5563", textAlign: "center", fontSize: 14 }}>Carregando...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
