"use client";

import { useState } from "react";

export function RequestForm() {
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", artistName: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/artist-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao enviar");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Solicitação enviada!</h3>
        <p className="text-gray-400 text-sm">Entraremos em contato em breve via WhatsApp ou e-mail.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Seu nome *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nome completo"
            className="w-full px-4 py-3 rounded-xl bg-[#0e1118] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Nome artístico / banda *</label>
          <input
            required
            value={form.artistName}
            onChange={(e) => set("artistName", e.target.value)}
            placeholder="Ex: Banda Forró do Norte"
            className="w-full px-4 py-3 rounded-xl bg-[#0e1118] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">WhatsApp *</label>
          <input
            required
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 rounded-xl bg-[#0e1118] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">E-mail *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-xl bg-[#0e1118] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-4 rounded-xl font-extrabold text-black text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{
          background: "linear-gradient(180deg, #f5c842 0%, #e6b800 100%)",
          boxShadow: "0 4px 24px rgba(230,184,0,0.3)",
        }}
      >
        {status === "loading" ? "Enviando..." : "Quero meu acesso →"}
      </button>
      <p className="text-center text-xs text-gray-600">
        Sem compromisso. Entraremos em contato em até 24h.
      </p>
    </form>
  );
}
