"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  not_registered: "Este e-mail Google não está cadastrado no sistema.",
  suspended: "Esta conta está suspensa ou cancelada.",
  OAuthSignin: "Erro ao iniciar login com Google. Tente novamente.",
  OAuthCallback: "Erro no retorno do Google. Tente novamente.",
  Default: "Erro ao fazer login. Tente novamente.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    ERROR_MESSAGES[searchParams.get("error") ?? ""] ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result?.ok) {
        setError(
          result?.error === "CredentialsSignin"
            ? "E-mail ou senha inválidos."
            : (ERROR_MESSAGES[result?.error ?? ""] ?? ERROR_MESSAGES.Default)
        );
        return;
      }

      const session = await getSession();
      router.replace(session?.user.role === "SUPER_ADMIN" ? "/super-admin" : "/admin/orcamento");
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/admin" });
  }

  const disabled = loading || googleLoading;

  return (
    <main style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#07090e",
      position: "relative",
      overflow: "hidden",
      padding: "24px 20px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Glow de fundo */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 560,
        height: 560,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,200,66,0.07) 0%, transparent 68%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-10%",
        right: "-10%",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>

        {/* Marca */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          {/* Ícone */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(245,200,66,0.14) 0%, rgba(245,200,66,0.04) 100%)",
            border: "1px solid rgba(245,200,66,0.22)",
            boxShadow: "0 0 40px rgba(245,200,66,0.10)",
            marginBottom: 18,
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#f5c842" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>

          <h1 style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#f1f5f9",
            lineHeight: 1.1,
          }}>
            Formalize
          </h1>
          <p style={{
            marginTop: 8,
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.5,
          }}>
            Bem-vindo de volta
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(13, 17, 28, 0.85)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 22,
          padding: "28px 24px 24px",
          backdropFilter: "blur(16px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={disabled}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              height: 50,
              borderRadius: 13,
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.04)",
              color: "#cbd5e1",
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            {googleLoading ? (
              <span style={{ fontSize: 13, color: "#475569" }}>Redirecionando...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </>
            )}
          </button>

          {/* Divisor */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            <span style={{ fontSize: 11, color: "#334155", letterSpacing: "0.06em", fontWeight: 600 }}>OU</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#7c8fa8",
                marginBottom: 7,
                letterSpacing: "0.03em",
              }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={disabled}
                required
                style={{
                  width: "100%",
                  height: 50,
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 13,
                  padding: "0 16px",
                  fontSize: 15,
                  color: "#f1f5f9",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                  opacity: disabled ? 0.6 : 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(245,200,66,0.35)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "#7c8fa8",
                marginBottom: 7,
                letterSpacing: "0.03em",
              }}>
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={disabled}
                  required
                  style={{
                    width: "100%",
                    height: 50,
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 13,
                    padding: "0 52px 0 16px",
                    fontSize: 15,
                    color: "#f1f5f9",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                    opacity: disabled ? 0.6 : 1,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(245,200,66,0.35)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    padding: 6,
                    cursor: "pointer",
                    color: "#475569",
                    lineHeight: 0,
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.22)",
                borderRadius: 11,
                padding: "10px 14px",
                fontSize: 13,
                color: "#fca5a5",
                lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={disabled}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 13,
                border: "none",
                background: disabled
                  ? "rgba(245,200,66,0.35)"
                  : "linear-gradient(135deg, #f5c842 0%, #dba000 100%)",
                color: "#1a1000",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: disabled ? "none" : "0 6px 24px rgba(245,200,66,0.22)",
                marginTop: 2,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p style={{
          textAlign: "center",
          marginTop: 28,
          fontSize: 12,
          color: "#1e293b",
        }}>
          Formalize © {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
