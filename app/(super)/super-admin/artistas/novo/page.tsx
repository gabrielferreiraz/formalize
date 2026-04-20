"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovoArtistaPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", subdomain: "", email: "", password: "", primaryColor: "#e6b800" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/super/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      router.push("/super-admin");
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao criar artista");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 pb-24 bg-stage-900 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/super-admin" className="text-gray-400 hover:text-gray-200">← Voltar</Link>
        <h1 className="text-2xl font-bold text-gray-100">Novo Artista</h1>
      </div>

      {error && <div className="p-4 mb-6 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-stage-800 p-6 rounded-xl border border-stage-700 space-y-5">
        <div>
          <label className="label">Nome Artístico</label>
          <input type="text" required className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div>
          <label className="label">Subdomínio</label>
          <div className="flex rounded overflow-hidden">
            <input type="text" required className="input-field rounded-r-none flex-1 border-r-0" value={form.subdomain} onChange={e => setForm({...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} placeholder="minhabanda" />
            <span className="px-3 py-2 text-gray-500 bg-stage-900 border border-l-0 border-stage-600 rounded-r flex items-center">.formalize.com.br</span>
          </div>
        </div>
        <div>
          <label className="label">E-mail do Administrador</label>
          <input type="email" required className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div>
          <label className="label">Senha (Temporária)</label>
          <input type="text" required minLength={6} className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        </div>
        <div>
          <label className="label">Cor Primária</label>
          <div className="flex gap-2">
            <input type="color" className="h-10 w-10 border border-stage-600 rounded bg-stage-900 cursor-pointer" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})} />
            <input type="text" className="input-field flex-1" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})} />
          </div>
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Criando..." : "Criar Artista"}
          </button>
        </div>
      </form>
    </div>
  );
}
