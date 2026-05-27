"use client";

import { useState } from "react";

const CATEGORIAS = [
  { id: "cantor-solo",  label: "Cantor(a) solo",   icon: "🎤", desc: "Solo, sem banda fixa" },
  { id: "musico-solo",  label: "Músico(a) solo",    icon: "🎸", desc: "Instrumentista" },
  { id: "cantor-banda", label: "Com banda",          icon: "🎵", desc: "Cantor com conjunto fixo" },
  { id: "banda-grupo",  label: "Banda / grupo",      icon: "🥁", desc: "Grupo ou conjunto musical" },
  { id: "dupla",        label: "Dupla",              icon: "🎼", desc: "Dupla sertaneja ou vocal" },
  { id: "dj-produtor",  label: "DJ / produtor(a)",  icon: "🎧", desc: "Eventos ou produção" },
  { id: "outro",        label: "Outro",              icon: "✏️", desc: "Não me encaixo acima" },
];

export function RequestForm() {
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", artistName: "" });
  const [categoria, setCategoria] = useState("");
  const [outroTexto, setOutroTexto] = useState("");
  const [temContrato, setTemContrato] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const categoriaFinal = categoria === "outro" ? (outroTexto.trim() || "outro") : categoria;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/artist-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoria: categoriaFinal || undefined,
          temContrato: temContrato === true,
        }),
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
    <form onSubmit={handleSubmit} className="space-y-5">
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

      {/* Category selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-1">
          Que tipo de artista você é?
        </label>
        <p className="text-xs text-gray-600 mb-3">Ajuda a montar seu painel do jeito certo.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {CATEGORIAS.map((cat) => {
            const selected = categoria === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoria(selected ? "" : cat.id)}
                className="relative flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all"
                style={{
                  background: selected ? "rgba(245,200,66,0.07)" : "rgba(14,17,24,0.8)",
                  borderColor: selected ? "rgba(245,200,66,0.5)" : "rgba(255,255,255,0.08)",
                  boxShadow: selected ? "0 0 0 1px rgba(245,200,66,0.15)" : "none",
                }}
              >
                <span className="text-base leading-none mb-1">{cat.icon}</span>
                <span className="text-xs font-semibold text-gray-200 leading-tight">{cat.label}</span>
                <span className="text-[10px] text-gray-600 leading-tight">{cat.desc}</span>
                {selected && (
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "#f5c842" }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {categoria === "outro" && (
          <input
            value={outroTexto}
            onChange={(e) => setOutroTexto(e.target.value)}
            placeholder="Como você se define? Ex: Locutor, Coral, Orquestra..."
            className="mt-2 w-full px-4 py-3 rounded-xl bg-[#0e1118] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
          />
        )}
      </div>

      {/* Has contract toggle */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">
          Você já tem um orçamento ou contrato que usa?
        </label>
        <div className="flex gap-2">
          {([
            { value: false as boolean, label: "Não, vou criar do zero" },
            { value: true as boolean,  label: "Sim, já tenho um modelo" },
          ]).map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setTemContrato(opt.value)}
              className="flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all"
              style={{
                background: temContrato === opt.value ? "rgba(245,200,66,0.07)" : "rgba(14,17,24,0.8)",
                borderColor: temContrato === opt.value ? "rgba(245,200,66,0.5)" : "rgba(255,255,255,0.08)",
                color: temContrato === opt.value ? "#f5c842" : "#9ca3af",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {temContrato === true && (
          <div
            className="mt-2 rounded-xl border p-3 text-xs text-gray-400 leading-relaxed"
            style={{ background: "rgba(245,200,66,0.04)", borderColor: "rgba(245,200,66,0.15)" }}
          >
            <span className="font-semibold" style={{ color: "#f5c842" }}>Ótimo!</span>{" "}
            Depois que seu acesso for criado, você pode configurar seu modelo base no sistema — inclusive fazer upload do seu PDF como referência visual.
          </div>
        )}
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
