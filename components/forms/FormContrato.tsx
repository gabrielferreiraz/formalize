"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LoadingDocument } from "@/components/ui/LoadingDocument";
import AutocompleteInput from "./AutocompleteInput";
import { ClearButton } from "./icons";
import {
  formatarMoeda,
  formatarTelefone,
  formatarCpfCnpj,
  formatarCEP,
  hoje,
} from "@/utils/form";
import {
  LOCAIS_FIXOS,
  EVENTOS_FIXOS,
  carregarLocais,
  salvarLocal,
  removerLocal,
  buscarEnderecoLocal,
  carregarEventos,
  salvarEvento,
  removerEvento,
  carregarFrasesRodape,
  salvarFraseRodape,
  removerFraseRodape,
} from "@/utils/historico";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ContratoValues {
  contratanteNome: string;
  contratanteCpfCnpj: string;
  contratanteRg: string;
  contratanteOrgao: string;
  contratanteTelefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  evento: string;
  local: string;
  cidadeEvento: string;
  data: string;
  dataAssinatura: string;
  horario: string;
  horas: number;
  cache: string;
  formaPagamento: string;
  assinarDigitalmente: boolean;
  clausulasEspeciais: string;
  riderTecnico: string;
  fraseRodape: string;
}

export interface FormContratoProps {
  values: ContratoValues;
  onChange: (values: ContratoValues) => void;
  onSubmit: () => void;
  artistName: string;
  fromOrcamento?: boolean;
  loading?: boolean;
  fontScale?: number;
  onFontScaleChange?: (scale: number) => void;
  logoScale?: number;
  onLogoScaleChange?: (scale: number) => void;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const DEFINIR_VALOR = [
  { label: "1.5k", centavos: "150000" },
  { label: "2k", centavos: "200000" },
  { label: "2.5k", centavos: "250000" },
  { label: "3k", centavos: "300000" },
];

const AJUSTE_FINO = 10000; // ±R$100 em centavos

const FORMAS_PAGAMENTO = [
  "PIX à vista",
  "30% entrada + 70% no dia",
  "50% sinal + 50% no dia",
  "Transferência bancária",
  "Dinheiro",
  "A combinar",
];

const FRASES_POR_EVENTO: Record<string, string[]> = {
  Casamento: [
    "Que a trilha sonora deste dia eternize cada sorriso.",
    "Unindo corações com música e emoção.",
    "Cada nota é um brinde ao amor de vocês.",
    "A música celebra o início de uma nova história.",
  ],
  Aniversário: [
    "Mais um ano, mais uma festa inesquecível!",
    "A melhor trilha para celebrar a vida.",
    "Que cada acorde traga alegria ao seu dia.",
    "Parabéns ao som da melhor música!",
  ],
  Formatura: [
    "O palco é seu — comemore essa conquista!",
    "Anos de dedicação merecem uma festa à altura.",
    "Formou! Agora é hora de celebrar com música.",
    "Missão cumprida. A festa é por nossa conta.",
  ],
  "Evento Corporativo": [
    "Profissionalismo e entretenimento em harmonia.",
    "A trilha perfeita para o seu evento empresarial.",
    "Música que conecta pessoas e fortalece marcas.",
    "Elevando o padrão do seu evento corporativo.",
  ],
  Confraternização: [
    "Reunir pessoas é a melhor festa.",
    "Confraternizar com música de qualidade.",
    "O som perfeito para celebrar em equipe.",
    "Momentos especiais merecem trilha especial.",
  ],
  Festival: [
    "O palco está pronto. A energia é nossa!",
    "Festival é sinônimo de música e liberdade.",
    "Vamos fazer o público vibrar!",
    "A energia do festival começa aqui.",
  ],
  "Show Particular": [
    "Uma experiência musical exclusiva para você.",
    "Show privado, emoção garantida.",
    "Música sob medida para o seu momento.",
    "Exclusividade e talento no seu evento.",
  ],
  Reveillon: [
    "Ano novo com a melhor trilha sonora!",
    "Contagem regressiva ao som da música.",
    "Celebre a virada com estilo e emoção.",
    "Que o novo ano comece com muita música!",
  ],
  Carnaval: [
    "Bloco, axé e muita animação!",
    "O carnaval é nosso palco principal.",
    "Folia garantida com a melhor música.",
    "Esquenta pro carnaval mais animado!",
  ],
  "Festa Junina": [
    "Arraiá com forró da melhor qualidade!",
    "São João ao som de viola e zabumba.",
    "Quentão, fogueira e muita música boa.",
    "Festa junina com animação garantida!",
  ],
};

function nicho(evento: string): string {
  const lower = evento.toLowerCase();
  for (const key of Object.keys(FRASES_POR_EVENTO)) {
    if (lower.includes(key.toLowerCase())) return key;
  }
  return "Confraternização";
}

let ultimaFrase = "";
function fraseAleatoria(evento: string): string {
  const cat = nicho(evento);
  const frases = FRASES_POR_EVENTO[cat] ?? FRASES_POR_EVENTO["Confraternização"];
  const disponiveis = frases.filter((f) => f !== ultimaFrase);
  const escolhida = disponiveis[Math.floor(Math.random() * disponiveis.length)];
  ultimaFrase = escolhida;
  return escolhida;
}

function isCNPJ(cpfCnpj: string): boolean {
  return cpfCnpj.replace(/\D/g, "").length >= 12;
}

function formatarHoras(h: number): string {
  const inteiro = Math.floor(h);
  const frac = h - inteiro;
  if (frac === 0) return `${inteiro}h`;
  return `${inteiro}h30`;
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function Field({
  label,
  children,
  error,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card space-y-4">
      <div
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onClick={() => collapsible && setOpen(!open)}
        onKeyDown={(e) => collapsible && e.key === "Enter" && setOpen(!open)}
        className={`flex items-center justify-between w-full text-left ${
          collapsible ? "cursor-pointer" : ""
        }`}
      >
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h2>
        {collapsible && (
          <span className={`text-gray-500 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            ▼
          </span>
        )}
      </div>
      {open && <div className="animate-fade-in">{children}</div>}
    </section>
  );
}

// ── Formulário principal ─────────────────────────────────────────────────────

export default function FormContrato({
  values,
  onChange,
  onSubmit,
  artistName,
  fromOrcamento = false,
  loading = false,
  fontScale,
  onFontScaleChange,
  logoScale,
  onLogoScaleChange,
}: FormContratoProps) {
  const [locaisSalvos, setLocaisSalvos] = useState<string[]>([]);
  const [eventosSalvos, setEventosSalvos] = useState<string[]>([]);
  const [frasesSalvas, setFrasesSalvas] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [fraseMode, setFraseMode] = useState<"auto" | "manual">("auto");

  const valuesRef = useRef(values);
  useEffect(() => { valuesRef.current = values; }, [values]);

  useEffect(() => {
    setLocaisSalvos(carregarLocais());
    setEventosSalvos(carregarEventos());
    setFrasesSalvas(carregarFrasesRodape());
  }, []);

  useEffect(() => {
    if (fraseMode === "auto" && values.evento) {
      set("fraseRodape", fraseAleatoria(values.evento));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.evento, fraseMode]);

  function set<K extends keyof ContratoValues>(key: K, val: ContratoValues[K]) {
    onChange({ ...values, [key]: val });
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  const buscarCep = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const v = valuesRef.current;
        onChange({
          ...v,
          cep: formatarCEP(digits),
          logradouro: data.logradouro || v.logradouro,
          bairro: data.bairro || v.bairro,
          cidade: data.localidade || v.cidade,
          uf: data.uf || v.uf,
        });
      }
    } catch { /* silently fail */ } finally {
      setBuscandoCep(false);
    }
  }, [onChange]);

  const buscarCnpj = useCallback(async (cpfCnpj: string) => {
    const digits = cpfCnpj.replace(/\D/g, "");
    if (digits.length !== 14) return;
    setBuscandoCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      const data = await res.json();
      if (data.razao_social) {
        const v = valuesRef.current;
        const telefone = data.ddd_telefone_1 ? `${data.ddd_telefone_1}` : "";
        onChange({
          ...v,
          contratanteCpfCnpj: cpfCnpj,
          contratanteNome: data.razao_social,
          contratanteTelefone: telefone ? formatarTelefone(telefone) : v.contratanteTelefone,
          cep: data.cep ? formatarCEP(data.cep) : v.cep,
          logradouro: data.logradouro || v.logradouro,
          numero: data.numero || v.numero,
          complemento: data.complemento || v.complemento,
          bairro: data.bairro || v.bairro,
          cidade: data.municipio || v.cidade,
          uf: data.uf || v.uf,
        });
      }
    } catch { /* silently fail */ } finally {
      setBuscandoCnpj(false);
    }
  }, [onChange]);

  function handleLocalSelect(local: string) {
    const update: Partial<ContratoValues> = { local };
    const endereco = buscarEnderecoLocal(local);
    if (endereco) {
      const match = endereco.match(/,\s*([^,]+-\s*[A-Z]{2})/);
      if (match) update.cidadeEvento = match[1].trim();
    }
    onChange({ ...values, ...update });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const required: (keyof ContratoValues)[] = [
      "contratanteNome", "contratanteCpfCnpj", "evento", "local", "data", "cache", "formaPagamento",
    ];
    const newErrors: Record<string, string> = {};
    for (const k of required) {
      if (!values[k] || String(values[k]).trim() === "") {
        newErrors[k] = "Obrigatório";
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstKey);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
      }
      return;
    }
    setErrors({});
    onSubmit();
  }

  const cacheNum = values.cache ? parseInt(values.cache, 10) : 0;
  const cacheAtivo = (centavos: string) => values.cache === centavos;

  const ehCnpj = isCNPJ(values.contratanteCpfCnpj);

  return (
    <>
      {loading && <LoadingDocument documentType="contrato" />}
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Contratante ────────────────────────────────────────── */}
      <Section title="Contratante">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CPF / CNPJ" error={errors.contratanteCpfCnpj} className="sm:col-span-2">
            <div className="relative">
              <input
                id="contratanteCpfCnpj"
                className={`input-field ${errors.contratanteCpfCnpj ? "border-red-500" : ""}`}
                value={values.contratanteCpfCnpj}
                onChange={(e) => {
                  const formatted = formatarCpfCnpj(e.target.value);
                  set("contratanteCpfCnpj", formatted);
                  if (formatted.replace(/\D/g, "").length === 14) {
                    buscarCnpj(formatted);
                  }
                }}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
              />
              {buscandoCnpj && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold-400">
                  Buscando...
                </span>
              )}
            </div>
          </Field>

          <Field label="Nome / Razão Social" error={errors.contratanteNome}>
            <input
              id="contratanteNome"
              className={`input-field ${errors.contratanteNome ? "border-red-500" : ""}`}
              value={values.contratanteNome}
              onChange={(e) => set("contratanteNome", e.target.value)}
              placeholder="Nome completo ou razão social"
            />
          </Field>

          {!ehCnpj && (
            <>
              <Field label="RG">
                <input className="input-field" value={values.contratanteRg}
                  onChange={(e) => set("contratanteRg", e.target.value)} placeholder="Número do RG" />
              </Field>
              <Field label="Órgão expedidor">
                <input className="input-field" value={values.contratanteOrgao}
                  onChange={(e) => set("contratanteOrgao", e.target.value)} placeholder="SSP/MS" />
              </Field>
            </>
          )}

          <Field label="Telefone">
            <input className="input-field" value={values.contratanteTelefone}
              onChange={(e) => set("contratanteTelefone", formatarTelefone(e.target.value))}
              placeholder="(00) 00000-0000" />
          </Field>
        </div>
      </Section>

      {/* ── Endereço ───────────────────────────────────────────── */}
      <Section title="Endereço do contratante">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CEP">
            <div className="relative">
              <input className="input-field" value={values.cep}
                onChange={(e) => {
                  const formatted = formatarCEP(e.target.value);
                  set("cep", formatted);
                  if (formatted.replace(/\D/g, "").length === 8) buscarCep(formatted);
                }}
                placeholder="00000-000" maxLength={9} />
              {buscandoCep && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold-400">
                  Buscando...
                </span>
              )}
            </div>
          </Field>

          <Field label="Logradouro">
            <input className="input-field" value={values.logradouro}
              onChange={(e) => set("logradouro", e.target.value)} placeholder="Rua, Avenida..." />
          </Field>

          <Field label="Número">
            <input className="input-field" value={values.numero}
              onChange={(e) => set("numero", e.target.value)} placeholder="Nº" />
          </Field>

          <Field label="Complemento">
            <input className="input-field" value={values.complemento}
              onChange={(e) => set("complemento", e.target.value)} placeholder="Apto, Sala..." />
          </Field>

          <Field label="Bairro">
            <input className="input-field" value={values.bairro}
              onChange={(e) => set("bairro", e.target.value)} placeholder="Bairro" />
          </Field>

          <Field label="Cidade">
            <input className="input-field" value={values.cidade}
              onChange={(e) => set("cidade", e.target.value)} placeholder="Cidade" />
          </Field>

          <Field label="UF">
            <input className="input-field" value={values.uf}
              onChange={(e) => set("uf", e.target.value.toUpperCase())} placeholder="UF" maxLength={2} />
          </Field>
        </div>
      </Section>

      {/* ── Evento ─────────────────────────────────────────────── */}
      <Section title="Evento">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de evento" error={errors.evento}>
            <AutocompleteInput
              id="evento" value={values.evento}
              onChange={(v) => set("evento", v)} placeholder="Tipo do evento"
              error={errors.evento} opcoes={EVENTOS_FIXOS} opcoesExtras={eventosSalvos}
              onSalvar={(v) => { salvarEvento(v); setEventosSalvos(carregarEventos()); }}
              onDeletar={(v) => { removerEvento(v); setEventosSalvos(carregarEventos()); }}
            />
          </Field>

          <Field label="Local" error={errors.local}>
            <AutocompleteInput
              id="local" value={values.local}
              onChange={(v) => set("local", v)} onSelect={handleLocalSelect}
              placeholder="Nome do local" error={errors.local}
              opcoes={LOCAIS_FIXOS} opcoesExtras={locaisSalvos}
              onSalvar={(v) => { salvarLocal(v); setLocaisSalvos(carregarLocais()); }}
              onDeletar={(v) => { removerLocal(v); setLocaisSalvos(carregarLocais()); }}
            />
          </Field>

          <Field label="Cidade do evento">
            <input className="input-field" value={values.cidadeEvento}
              onChange={(e) => set("cidadeEvento", e.target.value)} placeholder="Cidade - UF" />
          </Field>

          <Field label="Data do evento" error={errors.data}>
            <input type="date" id="data"
              className={`input-field ${errors.data ? "border-red-500" : ""}`}
              value={values.data} onChange={(e) => set("data", e.target.value)} min={hoje()} />
          </Field>

          <Field label="Data de assinatura">
            <input type="date" className="input-field"
              value={values.dataAssinatura}
              onChange={(e) => set("dataAssinatura", e.target.value)} />
          </Field>

          <Field label="Horário">
            <input className="input-field" value={values.horario}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                const formatted = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
                set("horario", formatted);
              }}
              placeholder="HH:MM" maxLength={5} />
          </Field>

          <Field label="Duração (horas)">
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => set("horas", Math.max(1, values.horas - 0.5))}
                className="w-11 h-11 rounded-xl border border-stage-500 bg-stage-700 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors text-lg font-bold">
                −
              </button>
              <span className="bg-stage-700 border border-stage-500 rounded-xl px-5 py-2.5 text-xl font-mono font-semibold text-gold-400 min-w-[90px] text-center">
                {formatarHoras(values.horas)}
              </span>
              <button type="button"
                onClick={() => set("horas", Math.min(6, values.horas + 0.5))}
                className="w-11 h-11 rounded-xl border border-stage-500 bg-stage-700 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors text-lg font-bold">
                +
              </button>
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Cachê e Pagamento ──────────────────────────────────── */}
      <Section title="Cachê e Pagamento">
        <div className="space-y-4">
          <Field label="Cachê" error={errors.cache}>
            <div className="relative">
              <input id="cache"
                className={`input-field text-lg font-semibold ${errors.cache ? "border-red-500" : ""}`}
                value={values.cache ? formatarMoeda(values.cache) : ""}
                onChange={(e) => set("cache", e.target.value.replace(/\D/g, ""))}
                placeholder="R$ 0,00" />
              {cacheNum > 0 ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <ClearButton onClick={() => set("cache", "")} />
                </div>
              ) : null}
            </div>
          </Field>

          {/* Atalhos de valor */}
          <div className="grid grid-cols-4 gap-3">
            {DEFINIR_VALOR.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => set("cache", String(cacheNum + parseInt(d.centavos, 10)))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  cacheAtivo(d.centavos)
                    ? "bg-gold-500/20 border-gold-500 text-gold-400"
                    : "border-stage-500 bg-stage-700 text-gray-500 hover:border-gold-600 hover:text-gold-400"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Ajuste fino */}
          {cacheNum > 0 ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set("cache", String(Math.max(0, cacheNum - AJUSTE_FINO)))}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-stage-500 bg-stage-700 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors"
              >
                −R$100
              </button>
              <span className="text-sm font-mono text-gold-400">
                {formatarMoeda(values.cache)}
              </span>
              <button
                type="button"
                onClick={() => set("cache", String(cacheNum + AJUSTE_FINO))}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-stage-500 bg-stage-700 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors"
              >
                +R$100
              </button>
            </div>
          ) : null}

          <Field label="Forma de pagamento" error={errors.formaPagamento}>
            <div className="flex flex-wrap gap-2 mb-2">
              {FORMAS_PAGAMENTO.map((fp) => (
                <button
                  key={fp}
                  type="button"
                  onClick={() => set("formaPagamento", fp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    values.formaPagamento === fp
                      ? "bg-gold-500/20 border-gold-500 text-gold-400"
                      : "border-stage-500 bg-stage-700 text-gray-500 hover:border-gold-600 hover:text-gold-400"
                  }`}
                >
                  {fp}
                </button>
              ))}
            </div>
            <input
              id="formaPagamento"
              className={`input-field ${errors.formaPagamento ? "border-red-500" : ""}`}
              value={values.formaPagamento}
              onChange={(e) => set("formaPagamento", e.target.value)}
              placeholder="Ex: 30% entrada via PIX + saldo no dia em dinheiro"
            />
          </Field>
        </div>
      </Section>

      {/* ── Assinatura Digital ────────────────────────────────── */}
      <Section title="Assinatura">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => set("assinarDigitalmente", !values.assinarDigitalmente)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              values.assinarDigitalmente ? "bg-gold-500" : "bg-stage-500"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
              values.assinarDigitalmente ? "translate-x-5" : "translate-x-0"
            }`} />
          </div>
          <span className="text-sm text-gray-300">
            {values.assinarDigitalmente ? "Com carimbo de assinatura digital" : "Sem carimbo de assinatura digital"}
          </span>
        </label>
      </Section>

      {/* ── Cláusulas Especiais ────────────────────────────────── */}
      <Section title="Cláusulas Especiais" collapsible defaultOpen={false}>
        <textarea className="input-field min-h-[120px]" value={values.clausulasEspeciais}
          onChange={(e) => set("clausulasEspeciais", e.target.value)}
          placeholder={`Cláusulas adicionais ao contrato de ${artistName}...`} />
      </Section>

      {/* ── Rider Técnico ──────────────────────────────────────── */}
      <Section title="Rider Técnico" collapsible defaultOpen={false}>
        <textarea className="input-field min-h-[120px]" value={values.riderTecnico}
          onChange={(e) => set("riderTecnico", e.target.value)}
          placeholder="Equipamentos, requisitos técnicos..." />
      </Section>

      {/* ── Frase do Rodapé ────────────────────────────────────── */}
      <Section title="Frase do Rodapé">
        <div className="space-y-3">
          <div className="flex rounded-xl overflow-hidden border border-stage-500 w-fit">
            {(["auto", "manual"] as const).map((mode) => (
              <button key={mode} type="button"
                onClick={() => {
                  setFraseMode(mode);
                  if (mode === "auto" && values.evento) set("fraseRodape", fraseAleatoria(values.evento));
                }}
                className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                  fraseMode === mode
                    ? "bg-gold-500 text-stage-900 shadow-sm shadow-gold-500/20"
                    : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-stage-700/50"
                }`}>
                {mode === "auto" ? "Automática" : "Manual"}
              </button>
            ))}
          </div>

          {fraseMode === "auto" ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-300 italic flex-1">
                &ldquo;{values.fraseRodape || "Selecione um evento para gerar"}&rdquo;
              </p>
              {values.evento && (
                <button type="button"
                  onClick={() => set("fraseRodape", fraseAleatoria(values.evento))}
                  className="px-3 py-1.5 text-xs rounded-xl border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors">
                  Outra
                </button>
              )}
            </div>
          ) : (
            <AutocompleteInput
              id="fraseRodape" value={values.fraseRodape}
              onChange={(v) => set("fraseRodape", v)}
              placeholder="Digite uma frase para o rodapé do contrato..."
              opcoes={[]} opcoesExtras={frasesSalvas}
              onSalvar={(v) => { salvarFraseRodape(v); setFrasesSalvas(carregarFrasesRodape()); }}
              onDeletar={(v) => { removerFraseRodape(v); setFrasesSalvas(carregarFrasesRodape()); }}
            />
          )}
        </div>
      </Section>

      {/* ── Ações ──────────────────────────────────────────────── */}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Gerando PDF..." : "Gerar Contrato"}
      </button>
    </form>
    </>
  );
}

// ── Default values factory ───────────────────────────────────────────────────

export function defaultContratoValues(): ContratoValues {
  return {
    contratanteNome: "",
    contratanteCpfCnpj: "",
    contratanteRg: "",
    contratanteOrgao: "",
    contratanteTelefone: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    evento: "",
    local: "",
    cidadeEvento: "",
    data: "",
    dataAssinatura: hoje(),
    horario: "",
    horas: 2,
    cache: "",
    formaPagamento: "",
    assinarDigitalmente: true,
    clausulasEspeciais: "",
    riderTecnico: "",
    fraseRodape: "",
  };
}
