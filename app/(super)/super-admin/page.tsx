"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Artist {
  id: string;
  name: string;
  subdomain: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  createdAt: string;
  _count: { documents: number };
}

export default function SuperAdminPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArtists = async () => {
    setLoading(true);
    const res = await fetch("/api/super/artists");
    if (res.ok) {
      setArtists(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await fetch(`/api/super/artists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchArtists();
  };

  if (loading) return <div className="p-6 text-gray-400">Carregando...</div>;

  const total = artists.length;
  const actives = artists.filter(a => a.status === "ACTIVE").length;
  const suspended = artists.filter(a => a.status === "SUSPENDED").length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-stage-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Painel Super Admin</h1>
        <Link href="/super-admin/artistas/novo" className="btn-primary">
          + Novo Artista
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h3 className="text-gray-400 font-medium text-sm">Total de Artistas</h3>
          <p className="text-3xl font-bold text-gray-100 mt-2">{total}</p>
        </div>
        <div className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h3 className="text-green-400 font-medium text-sm">Ativos</h3>
          <p className="text-3xl font-bold text-gray-100 mt-2">{actives}</p>
        </div>
        <div className="bg-stage-800 p-6 rounded-xl border border-stage-700">
          <h3 className="text-red-400 font-medium text-sm">Suspensos</h3>
          <p className="text-3xl font-bold text-gray-100 mt-2">{suspended}</p>
        </div>
      </div>

      <div className="bg-stage-800 rounded-xl border border-stage-700 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stage-700 text-gray-400 text-sm">
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Subdomínio</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Documentos</th>
              <th className="p-4 font-medium">Criado em</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stage-700 text-sm text-gray-200">
            {artists.map((artist) => (
              <tr key={artist.id} className="hover:bg-stage-900/50">
                <td className="p-4 font-medium">{artist.name}</td>
                <td className="p-4">{artist.subdomain}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${artist.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {artist.status}
                  </span>
                </td>
                <td className="p-4">{artist._count.documents}</td>
                <td className="p-4">{new Date(artist.createdAt).toLocaleDateString("pt-BR")}</td>
                <td className="p-4 flex justify-end gap-3 font-semibold">
                  <button className="text-gray-400 hover:text-gold-400">Ver detalhes</button>
                  <button 
                    onClick={() => handleToggleStatus(artist.id, artist.status)}
                    className={artist.status === 'ACTIVE' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                  >
                    {artist.status === 'ACTIVE' ? 'Suspender' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
            {artists.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum artista encontrado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
