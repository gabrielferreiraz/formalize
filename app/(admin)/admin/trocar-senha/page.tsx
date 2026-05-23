"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export default function TrocarSenhaPage() {
  const { data: session } = useSession();
  const isForced = session?.user?.forcePasswordChange ?? false;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (next !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (next.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: isForced ? undefined : current,
          newPassword: next,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao trocar senha.");
        return;
      }
      setDone(true);
      // Force re-login so the JWT is refreshed with forcePasswordChange = false
      setTimeout(() => signOut({ callbackUrl: "/login" }), 2500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {isForced && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-yellow-300">
            Por segurança, defina uma senha pessoal antes de continuar.
          </div>
        )}

        <div>
          <h1 className="text-xl font-bold text-gray-100">
            {isForced ? "Definir senha" : "Alterar senha"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isForced
              ? "Esta é sua primeira entrada. Crie uma senha para sua conta."
              : "Insira sua senha atual e escolha uma nova."}
          </p>
        </div>

        {done ? (
          <div className="card p-5 text-center space-y-2">
            <p className="text-green-400 font-semibold">Senha alterada com sucesso!</p>
            <p className="text-xs text-gray-500">Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isForced && (
              <div>
                <label className="label">Senha atual</label>
                <input
                  type="password"
                  className="input-field"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            )}

            <div>
              <label className="label">Nova senha</label>
              <input
                type="password"
                className="input-field"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="label">Confirmar nova senha</label>
              <input
                type="password"
                className="input-field"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm font-bold"
            >
              {loading ? "Salvando..." : isForced ? "Definir senha e entrar" : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
