"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Save, AlertCircle, Check } from "lucide-react";
import { getPresetClausulas, PRESET_LABELS, type ClausulaContrato, type ContratoTipo } from "@/lib/contrato-clausulas";
import { useFormContext } from "@/context/FormContext";

interface SavedTemplate {
  id: string;
  nome: string;
  tipo: string;
  titulo: string;
  clausulas: ClausulaContrato[];
  isDefault: boolean;
}

const PRESET_OPTIONS: ContratoTipo[] = ["banda", "solo", "dj", "generico"];

function newClausula(ordem: number): ClausulaContrato {
  return {
    id: crypto.randomUUID(),
    ordem,
    titulo: "Nova Cláusula",
    corpo: "Texto da cláusula com {{variavel}} como placeholder.",
    tipo: "clausula",
    opcional: false,
    ativa: true,
  };
}

function validateClausulas(clausulas: ClausulaContrato[]): string | null {
  if (clausulas.length === 0) return "Adicione pelo menos uma cláusula.";
  for (let i = 0; i < clausulas.length; i++) {
    if (!clausulas[i].titulo.trim()) return `Cláusula ${i + 1}: título não pode estar vazio.`;
    if (!clausulas[i].corpo.trim()) return `Cláusula ${i + 1}: corpo não pode estar vazio.`;
  }
  return null;
}

const PRESET_DESCS: Record<string, string> = {
  banda: "Banda completa, riders e alimentação",
  solo: "Artista solo ou duo",
  dj: "DJ com cláusula de equipamentos",
  generico: "Minimalista, sem especificações",
};

const PRESET_TO_CATEGORIA: Record<string, string> = {
  banda: "banda", solo: "solo", dj: "dj", generico: "outros",
};

export default function ContratoTemplatesPage() {
  const { contrato, setContrato } = useFormContext();
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SavedTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [draftNome, setDraftNome] = useState("");
  const [draftTipo, setDraftTipo] = useState<ContratoTipo>("custom");
  const [draftTitulo, setDraftTitulo] = useState("Contrato de Prestação de Serviços");
  const [draftClausulas, setDraftClausulas] = useState<ClausulaContrato[]>([]);

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/contrato-templates");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTemplates(await res.json());
    } catch (err) {
      setLoadError("Não foi possível carregar os templates. Tente recarregar a página.");
    }
  }

  function openNew(basePreset?: ContratoTipo) {
    const clausulas = basePreset ? getPresetClausulas(basePreset) : [];
    setDraftNome(basePreset ? `${PRESET_LABELS[basePreset]} (cópia)` : "Novo Template");
    setDraftTipo("custom");
    setDraftTitulo("Contrato de Prestação de Serviços");
    setDraftClausulas(clausulas.map((c) => ({ ...c, id: crypto.randomUUID() })));
    setSelected(null);
    setCreating(true);
    setSaveError(null);
  }

  function openEdit(t: SavedTemplate) {
    setDraftNome(t.nome);
    setDraftTipo(t.tipo as ContratoTipo);
    setDraftTitulo(t.titulo);
    setDraftClausulas(Array.isArray(t.clausulas) ? t.clausulas : []);
    setSelected(t);
    setCreating(false);
    setSaveError(null);
  }

  function cancel() {
    setSelected(null);
    setCreating(false);
    setSaveError(null);
  }

  function updateClausula(idx: number, patch: Partial<ClausulaContrato>) {
    setDraftClausulas((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function moveClausula(idx: number, dir: -1 | 1) {
    setDraftClausulas((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((c, i) => ({ ...c, ordem: i + 1 }));
    });
  }

  function removeClausula(idx: number) {
    setDraftClausulas((prev) =>
      prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, ordem: i + 1 })),
    );
  }

  function addClausula() {
    setDraftClausulas((prev) => [...prev, newClausula(prev.length + 1)]);
  }

  async function save() {
    setSaveError(null);
    const nome = draftNome.trim();
    if (!nome) { setSaveError("Nome do template é obrigatório."); return; }

    const clausulaErr = validateClausulas(draftClausulas);
    if (clausulaErr) { setSaveError(clausulaErr); return; }

    setSaving(true);
    try {
      const payload = { nome, tipo: draftTipo, titulo: draftTitulo, clausulas: draftClausulas };
      const res = creating
        ? await fetch("/api/admin/contrato-templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/contrato-templates/${selected!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError((err as any).error || `Erro ${res.status}`);
        return;
      }
      await loadTemplates();
      cancel();
    } catch {
      setSaveError("Falha de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string, nome: string) {
    if (!window.confirm(`Excluir o template "${nome}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/contrato-templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as any).error || `Erro ${res.status} ao excluir.`);
        return;
      }
      await loadTemplates();
      if (selected?.id === id) cancel();
    } catch {
      alert("Falha de conexão ao excluir. Tente novamente.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSetPreset(preset: "banda" | "solo" | "dj" | "generico") {
    setContrato({ ...contrato, clausulasPreset: preset, clausulasTemplateId: undefined });
    await fetch("/api/artist/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria: PRESET_TO_CATEGORIA[preset] }),
    }).catch(() => {});
  }

  async function handleSetTemplateDefault(t: SavedTemplate) {
    setContrato({ ...contrato, clausulasTemplateId: t.id, clausulasPreset: undefined });
    await fetch(`/api/admin/contrato-templates/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    }).catch(() => {});
    await loadTemplates();
  }

  const isEditing = creating || !!selected;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-100">Templates de Contrato</h1>
        {!isEditing && (
          <button
            onClick={() => openNew()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold-500 text-stage-900 text-sm font-semibold hover:bg-gold-400 transition-colors"
          >
            <Plus size={15} /> Novo
          </button>
        )}
      </div>

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800 text-red-400 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {loadError}
        </div>
      )}

      {/* ── Modelo padrão ────────────────────────────────────── */}
      {!isEditing && (
        <div className="card space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Modelo padrão do contrato</p>

          <div className="grid grid-cols-2 gap-2">
            {(["banda", "solo", "dj", "generico"] as const).map((preset) => {
              const isActive = !contrato.clausulasTemplateId && contrato.clausulasPreset === preset;
              return (
                <button
                  key={preset}
                  onClick={() => handleSetPreset(preset)}
                  className={`text-left px-3 py-2.5 rounded-xl border transition-colors relative ${
                    isActive
                      ? "bg-gold-500/15 border-gold-500"
                      : "border-stage-500 bg-stage-700 hover:border-gold-600"
                  }`}
                >
                  <div className={`text-sm font-semibold ${isActive ? "text-gold-400" : "text-gray-300"}`}>
                    {PRESET_LABELS[preset]}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-snug">{PRESET_DESCS[preset]}</div>
                  {isActive && (
                    <Check size={12} className="absolute top-2.5 right-2.5 text-gold-400" />
                  )}
                </button>
              );
            })}
          </div>

          {contrato.clausulasPreset === "banda" && !contrato.clausulasTemplateId && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-gray-400 whitespace-nowrap">Integrantes na banda</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setContrato({ ...contrato, pessoasBanda: Math.max(1, (contrato.pessoasBanda ?? 7) - 1) })}
                  className="w-8 h-8 rounded-lg border border-stage-500 bg-stage-700 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors text-base font-bold"
                >−</button>
                <span className="bg-stage-700 border border-stage-500 rounded-lg px-3 py-1 text-sm font-mono font-semibold text-gold-400 min-w-[40px] text-center">
                  {contrato.pessoasBanda ?? 7}
                </span>
                <button
                  onClick={() => setContrato({ ...contrato, pessoasBanda: Math.min(30, (contrato.pessoasBanda ?? 7) + 1) })}
                  className="w-8 h-8 rounded-lg border border-stage-500 bg-stage-700 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors text-base font-bold"
                >+</button>
              </div>
            </div>
          )}

          {templates.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-stage-600">
              <p className="text-xs text-gray-600 uppercase tracking-wider pt-1">Templates personalizados</p>
              {templates.map((t) => {
                const isActive = contrato.clausulasTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSetTemplateDefault(t)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors relative ${
                      isActive
                        ? "bg-gold-500/15 border-gold-500 text-gold-400"
                        : "border-stage-500 bg-stage-700 text-gray-300 hover:border-gold-600"
                    }`}
                  >
                    <span className="font-medium">{t.nome}</span>
                    <span className="text-xs text-gray-500 ml-2">{t.tipo}</span>
                    {isActive && <Check size={12} className="absolute top-2.5 right-2.5 text-gold-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Preset starters */}
      {!isEditing && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Criar template a partir de preset</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => openNew(p)}
                className="py-2 rounded-xl border border-stage-500 bg-stage-700 text-gray-300 text-sm hover:border-gold-600 hover:text-gold-400 transition-colors"
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Saved list */}
      {!isEditing && !loadError && templates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Seus templates</p>
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-stage-500 bg-stage-800"
            >
              <div>
                <p className="text-sm font-semibold text-gray-200">{t.nome}</p>
                <p className="text-xs text-gray-500">
                  {t.tipo} · {Array.isArray(t.clausulas) ? t.clausulas.length : 0} cláusulas
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(t)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteTemplate(t.id, t.nome)}
                  disabled={deleting === t.id}
                  className="p-1.5 rounded-xl border border-stage-500 text-gray-500 hover:border-red-500 hover:text-red-400 disabled:opacity-40 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isEditing && !loadError && templates.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          Nenhum template salvo. Crie um a partir de um preset acima.
        </p>
      )}

      {/* Editor */}
      {isEditing && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              {creating ? "Novo Template" : "Editar Template"}
            </h2>
            <div>
              <label className="label">Nome do template</label>
              <input
                className="input-field"
                value={draftNome}
                onChange={(e) => setDraftNome(e.target.value)}
                placeholder="Ex: Contrato Banda Forró"
                maxLength={200}
              />
            </div>
            <div>
              <label className="label">Título no PDF</label>
              <input
                className="input-field"
                value={draftTitulo}
                onChange={(e) => setDraftTitulo(e.target.value)}
                placeholder="Contrato de Prestação de Serviços"
              />
            </div>
          </div>

          {/* Clausulas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Cláusulas ({draftClausulas.length})
              </p>
              <button
                type="button"
                onClick={addClausula}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stage-500 text-gray-400 text-xs hover:border-gold-600 hover:text-gold-400 transition-colors"
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>

            {draftClausulas.map((cl, idx) => (
              <div key={cl.id} className="card space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-0.5 mt-1">
                    <button
                      type="button"
                      onClick={() => moveClausula(idx, -1)}
                      disabled={idx === 0}
                      className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveClausula(idx, 1)}
                      disabled={idx === draftClausulas.length - 1}
                      className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        className="input-field text-sm flex-1"
                        value={cl.titulo}
                        onChange={(e) => updateClausula(idx, { titulo: e.target.value })}
                        placeholder="Título da cláusula"
                        maxLength={200}
                      />
                      <select
                        className="input-field text-xs w-28"
                        value={cl.tipo}
                        onChange={(e) =>
                          updateClausula(idx, { tipo: e.target.value as "clausula" | "obs" })
                        }
                      >
                        <option value="clausula">Cláusula</option>
                        <option value="obs">OBS</option>
                      </select>
                    </div>
                    <textarea
                      className="input-field text-sm min-h-[80px] font-mono"
                      value={cl.corpo}
                      onChange={(e) => updateClausula(idx, { corpo: e.target.value })}
                      placeholder="Texto com {{variavel}} como placeholder..."
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={cl.ativa}
                          onChange={(e) => updateClausula(idx, { ativa: e.target.checked })}
                          className="accent-gold-500"
                        />
                        Ativa
                      </label>
                      <button
                        type="button"
                        onClick={() => removeClausula(idx)}
                        className="text-xs text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Remover
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {saveError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-900/20 border border-red-800 text-red-400 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {saveError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={cancel}
              className="flex-1 py-2.5 rounded-xl border border-stage-500 text-gray-400 text-sm hover:border-gray-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gold-500 text-stage-900 text-sm font-bold flex items-center justify-center gap-2 hover:bg-gold-400 disabled:opacity-50 transition-colors"
            >
              <Save size={15} />
              {saving ? "Salvando..." : "Salvar Template"}
            </button>
          </div>

          <div className="card">
            <p className="text-xs text-gray-500 font-mono leading-relaxed">
              <strong className="text-gray-400">Variáveis disponíveis:</strong><br />
              {"{{"}<span className="text-gold-400">artistaNome</span>{"}}  "}
              {"{{"}<span className="text-gold-400">contratanteNome</span>{"}}  "}
              {"{{"}<span className="text-gold-400">contratanteCpfCnpj</span>{"}}  "}
              {"{{"}<span className="text-gold-400">rgTexto</span>{"}}  "}
              {"{{"}<span className="text-gold-400">evento</span>{"}}  "}
              {"{{"}<span className="text-gold-400">local</span>{"}}  "}
              {"{{"}<span className="text-gold-400">cidadeEvento</span>{"}}  "}
              {"{{"}<span className="text-gold-400">dataEventoBr</span>{"}}  "}
              {"{{"}<span className="text-gold-400">horario</span>{"}}  "}
              {"{{"}<span className="text-gold-400">horasFormatado</span>{"}}  "}
              {"{{"}<span className="text-gold-400">valorTotalFormatado</span>{"}}  "}
              {"{{"}<span className="text-gold-400">valorTotalExtenso</span>{"}}  "}
              {"{{"}<span className="text-gold-400">formaPagamento</span>{"}}  "}
              {"{{"}<span className="text-gold-400">pessoasBanda</span>{"}}  "}
              {"{{"}<span className="text-gold-400">transporteTexto</span>{"}}  "}
              {"{{"}<span className="text-gold-400">artistaInstrumentos</span>{"}}  "}
              {"{{"}<span className="text-gold-400">foro</span>{"}}"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
