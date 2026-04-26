"use client";

import { useState, useEffect, useCallback } from "react";
import { LoadingDocument } from "@/components/ui/LoadingDocument";
import AutocompleteInput from "./AutocompleteInput";
import { ClearButton } from "./icons";
import { Music, Truck, Utensils, Home, Check, ChevronRight } from "lucide-react";
import {
  formatarMoeda,
  formatarDataBR,
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
} from "@/utils/historico";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OrcamentoValues {
  contratante: string;
  evento: string;
  local: string;
  cidade: string;
  data: string;
  horarioDefinido: boolean;
  horario: string;
  horas: number;
  cache: string;        // centavos como string: "350000"
  backline: "vazio" | "incluso" | "valor";
  backlineValor: string;
  transporte: "vazio" | "incluso" | "valor";
  transporteValor: string;
  alimentacao: "vazio" | "incluso" | "valor";
  alimentacaoValor: string;
  hospedagem: "vazio" | "incluso" | "valor";
  hospedagemValor: string;
  formaPagamento: string;
}

export interface FormOrcamentoProps {
  values: OrcamentoValues;
  onChange: (values: OrcamentoValues) => void;
  onSubmit: () => void;
  onPreencherTudo?: () => void;
  onFazerContrato?: () => void;
  artistName: string;
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

const HORAS_MIN = 1;
const HORAS_MAX = 6;
const HORAS_STEP = 0.5;

// ── Helpers ──────────────────────────────────────────────────────────────────

function mascaraHorario(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function extrairCidade(endereco: string): string {
  const match = endereco.match(/,\s*([^,]+-\s*[A-Z]{2})/);
  return match ? match[1].trim() : "";
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
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function AdicionalRow({
  icon: Icon,
  title,
  hint,
  modo,
  valor,
  onModo,
  onValor,
}: {
  icon: any;
  title: string;
  hint: string;
  modo: "vazio" | "incluso" | "valor";
  valor: string;
  onModo: (m: "vazio" | "incluso" | "valor") => void;
  onValor: (v: string) => void;
}) {
  return (
    <div className="bg-stage-700 border border-stage-500 rounded-xl p-[14px] mb-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded bg-stage-800 flex items-center justify-center shrink-0 text-gray-400">
          <Icon size={18} />
        </div>
        <div>
          <div className="font-bold text-[14px] text-gray-100">{title}</div>
          <div className="text-[11.5px] text-gray-500 leading-tight">{hint}</div>
        </div>
      </div>
      
      <div className="flex rounded-full bg-stage-800 p-[3px]">
        {(["vazio", "incluso", "valor"] as const).map(m => {
          const isActive = modo === m;
          let activeClass = "";
          if (m === "vazio" && isActive) activeClass = "bg-stage-500 text-gray-200 shadow-[inset_0_0_0_1px_#252d3d]";
          else if (m === "incluso" && isActive) activeClass = "bg-[#4ade80]/12 text-[#4ade80] shadow-[inset_0_0_0_1px_#4ade80]";
          else if (m === "valor" && isActive) activeClass = "bg-gold-500/12 text-gold-400 shadow-[inset_0_0_0_1px_#e6b800]";
          
          let label = m === "vazio" ? "Não precisa" : m === "incluso" ? "Já incluso" : "À parte";
          
          return (
            <button
              key={m}
              type="button"
              onClick={() => onModo(m)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${isActive ? activeClass : "text-gray-500 hover:text-gray-300"}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      
      {modo === "valor" && (
        <div className="mt-3 flex items-center bg-[rgba(230,184,0,0.06)] border border-gold-500/25 rounded-xl overflow-hidden animate-fade-in px-3">
          <span className="text-gray-500 font-mono text-sm mr-2">R$</span>
          <input
            type="text"
            className="flex-1 bg-transparent py-3 text-[15px] font-bold text-gray-100 outline-none placeholder-stage-500 font-mono"
            value={valor ? formatarMoeda(valor) : ""}
            onChange={(e) => onValor(e.target.value.replace(/\D/g, ""))}
            placeholder="0,00"
          />
          <span className="text-[11px] text-gold-500/50 uppercase font-bold tracking-wider ml-2">editar</span>
        </div>
      )}
    </div>
  );
}

function HorasControl({
  horas,
  onChange,
}: {
  horas: number;
  onChange: (h: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(HORAS_MIN, horas - HORAS_STEP))}
        className="w-11 h-11 rounded-xl border border-stage-500 bg-stage-700 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors text-lg font-bold"
      >
        −
      </button>
      <span className="bg-stage-700 border border-stage-500 rounded-xl px-5 py-2.5 text-xl font-mono font-semibold text-gold-400 min-w-[90px] text-center">
        {formatarHoras(horas)}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(HORAS_MAX, horas + HORAS_STEP))}
        className="w-11 h-11 rounded-xl border border-stage-500 bg-stage-700 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors text-lg font-bold"
      >
        +
      </button>
    </div>
  );
}

function PinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
    </svg>
  );
}

// ── Formulário principal ─────────────────────────────────────────────────────

export default function FormOrcamento({
  values,
  onChange,
  onSubmit,
  onFazerContrato,
  artistName,
  loading = false,
  fontScale,
  onFontScaleChange,
  logoScale,
  onLogoScaleChange,
}: FormOrcamentoProps) {
  const [locaisSalvos, setLocaisSalvos] = useState<string[]>([]);
  const [eventosSalvos, setEventosSalvos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocaisSalvos(carregarLocais());
    setEventosSalvos(carregarEventos());
  }, []);

  function set<K extends keyof OrcamentoValues>(key: K, val: OrcamentoValues[K]) {
    onChange({ ...values, [key]: val });
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleLocalSelect(local: string) {
    const update: Partial<OrcamentoValues> = { local };
    const endereco = buscarEnderecoLocal(local);
    if (endereco) {
      const cidade = extrairCidade(endereco);
      if (cidade) update.cidade = cidade;
    }
    onChange({ ...values, ...update });
  }

  const buscarLocaisMaps = useCallback(async (query: string) => {
    const response = await fetch(`/api/maps/places-autocomplete?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data?.predictions) ? data.predictions : [];
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const required: (keyof OrcamentoValues)[] = [
      "contratante", "evento", "local", "data", "cache",
    ];
    const newErrors: Record<string, string> = {};
    for (const k of required) {
      if (!values[k] || String(values[k]).trim() === "") {
        newErrors[k] = "Obrigatório";
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit();
  }

  const cacheNum = parseInt(values.cache || "0", 10);
  const cacheAtivo = (centavos: string) => values.cache === centavos;

  const getAdicionalValor = (modo: string, valor: string) => modo === "valor" ? parseInt(valor || "0", 10) : 0;
  const extrasList = [
    { label: "Backline", modo: values.backline, valor: values.backlineValor },
    { label: "Transporte", modo: values.transporte, valor: values.transporteValor },
    { label: "Alimentação", modo: values.alimentacao, valor: values.alimentacaoValor },
    { label: "Hospedagem", modo: values.hospedagem, valor: values.hospedagemValor },
  ];
  const totalExtras = extrasList.reduce((acc, curr) => acc + getAdicionalValor(curr.modo, curr.valor), 0);
  const totalOrcamento = cacheNum + totalExtras;

  const PAY_OPTS = [
    { id: "30-70", title: "30% de entrada + 70% no dia", sub: "Mais seguro — a maioria dos artistas usa", sug: true },
    { id: "50-50", title: "50% sinal + 50% no dia", sub: "Para eventos maiores ou corporativos" },
    { id: "pix", title: "PIX à vista", sub: "Pagamento integral na confirmação" },
    { id: "custom", title: "Personalizar...", sub: "Descreva com suas palavras" },
  ];
  
  const normalizedForma = values.formaPagamento === "30% entrada + 70% no dia" ? "30% de entrada + 70% no dia" : values.formaPagamento;
  const isCustomPay = !PAY_OPTS.slice(0, 3).some(o => o.title === normalizedForma) && !!values.formaPagamento;

  let ent = 0, dia = 0;
  let labelEnt = "Entrada", labelDia = "No dia do show";
  if (normalizedForma === "30% de entrada + 70% no dia") {
    ent = Math.round(totalOrcamento * 0.3); dia = totalOrcamento - ent; labelEnt = "Entrada hoje (30%)"; labelDia = "No dia do show (70%)";
  } else if (normalizedForma === "50% sinal + 50% no dia") {
    ent = Math.round(totalOrcamento * 0.5); dia = totalOrcamento - ent; labelEnt = "Sinal hoje (50%)"; labelDia = "No dia do show (50%)";
  } else if (normalizedForma === "PIX à vista") {
    ent = totalOrcamento; dia = 0; labelEnt = "À vista hoje"; labelDia = "No dia do show";
  } else {
    ent = 0; dia = 0;
  }

  const filledCount = [
    values.contratante,
    values.evento,
    values.local,
    values.cidade,
    values.data,
    values.horas,
    values.cache,
    values.formaPagamento
  ].filter(f => {
    if (typeof f === "string") return f.trim() !== "";
    if (typeof f === "number") return f > 0;
    return !!f;
  }).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Dados do evento ─────────────────────────────────────── */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Dados do evento</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contratante" error={errors.contratante}>
            <input
              name="contratante"
              className={`input-field ${errors.contratante ? "border-red-500" : ""}`}
              value={values.contratante}
              onChange={(e) => set("contratante", e.target.value)}
              placeholder="Nome do contratante"
            />
          </Field>

          <Field label="Evento" error={errors.evento}>
            <AutocompleteInput
              id="evento"
              value={values.evento}
              onChange={(v) => set("evento", v)}
              placeholder="Tipo do evento"
              error={errors.evento}
              opcoes={EVENTOS_FIXOS}
              opcoesExtras={eventosSalvos}
              onSalvar={(v) => {
                salvarEvento(v);
                setEventosSalvos(carregarEventos());
              }}
              onDeletar={(v) => {
                removerEvento(v);
                setEventosSalvos(carregarEventos());
              }}
            />
          </Field>

          <Field label="Local" error={errors.local}>
            <AutocompleteInput
              id="local"
              value={values.local}
              onChange={(v) => set("local", v)}
              onSelect={handleLocalSelect}
              placeholder="Nome do local"
              error={errors.local}
              opcoes={LOCAIS_FIXOS}
              opcoesExtras={locaisSalvos}
              onSalvar={(v) => {
                salvarLocal(v);
                setLocaisSalvos(carregarLocais());
              }}
              onDeletar={(v) => {
                removerLocal(v);
                setLocaisSalvos(carregarLocais());
              }}
              buscarOnline={buscarLocaisMaps}
              rodapeInfo="Selecione um local fixo para preencher a cidade automaticamente"
            />
          </Field>

          <Field label="Cidade">
            <div className="relative">
              <input
                className="input-field pl-9"
                value={values.cidade}
                onChange={(e) => set("cidade", e.target.value)}
                placeholder="Cidade - UF"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <PinIcon />
              </span>
            </div>
          </Field>

          <Field label="Data" error={errors.data}>
            <input
              name="data"
              type="date"
              className={`input-field ${errors.data ? "border-red-500" : ""}`}
              value={values.data}
              onChange={(e) => set("data", e.target.value)}
              min={hoje()}
            />
          </Field>

          <div>
            <label className="label flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={values.horarioDefinido}
                onChange={(e) => {
                  onChange({
                    ...values,
                    horarioDefinido: e.target.checked,
                    horario: e.target.checked ? values.horario : "",
                  });
                }}
                className="w-4 h-4 rounded border-stage-500 bg-stage-700 accent-gold-500"
              />
              Horário definido
            </label>
            {values.horarioDefinido && (
              <input
                className="input-field mt-1 animate-fade-in"
                value={values.horario}
                onChange={(e) => set("horario", mascaraHorario(e.target.value))}
                placeholder="HH:MM"
                maxLength={5}
              />
            )}
          </div>
        </div>

        {/* Duração */}
        <Field label="Duração do show">
          <HorasControl
            horas={values.horas}
            onChange={(h) => set("horas", h)}
          />
        </Field>
      </section>

      {/* ── Cachê ──────────────────────────────────────────────── */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Cachê</h2>

        <Field label="Valor" error={errors.cache}>
          <div className="relative">
            <input
              name="cache"
              className={`input-field text-lg font-semibold ${errors.cache ? "border-red-500" : ""}`}
              value={values.cache ? formatarMoeda(values.cache) : ""}
              onChange={(e) => set("cache", e.target.value.replace(/\D/g, ""))}
              placeholder="R$ 0,00"
            />
            {values.cache && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <ClearButton onClick={() => set("cache", "")} />
              </div>
            )}
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
        {values.cache && (
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
        )}


      </section>

      {/* ── Top Sticky Bar ── */}
      <div className="sticky top-0 z-40 bg-[rgba(14,17,24,0.92)] backdrop-blur border-b border-stage-500 py-3 px-4 -mx-4 mb-4 flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">TOTAL DO ORÇAMENTO</div>
          <div className="text-[22px] font-bold text-gold-400 font-mono leading-none mt-1">
            {formatarMoeda(totalOrcamento.toString())}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex gap-1">
              <div className="w-6 h-1 bg-gold-400 rounded-full" />
              <div className="w-6 h-1 bg-gold-400 rounded-full" />
              <div className="w-6 h-1 bg-stage-500 rounded-full" />
           </div>
           <span className="font-mono text-xs text-gray-500">2/3</span>
        </div>
      </div>

      <div className="pb-8">
        {/* ── Opcionais ──────────────────────────────────────────── */}
        <section className="space-y-4 mb-8">
          <div>
            <h2 className="text-[20px] font-semibold text-gray-100">O que mais precisa pro show?</h2>
            <p className="text-[13px] text-gray-400 mt-1">Escolha se cada item já está no cachê ou se vai cobrar à parte.</p>
          </div>

          <AdicionalRow icon={Music} title="Backline" hint="Instrumentos e equipamento do palco" modo={values.backline} valor={values.backlineValor} onModo={(m) => set("backline", m)} onValor={(v) => set("backlineValor", v)} />
          <AdicionalRow icon={Truck} title="Transporte" hint="Deslocamento da banda até o local" modo={values.transporte} valor={values.transporteValor} onModo={(m) => set("transporte", m)} onValor={(v) => set("transporteValor", v)} />
          <AdicionalRow icon={Utensils} title="Alimentação" hint="Refeição para a equipe no dia" modo={values.alimentacao} valor={values.alimentacaoValor} onModo={(m) => set("alimentacao", m)} onValor={(v) => set("alimentacaoValor", v)} />
          <AdicionalRow icon={Home} title="Hospedagem" hint="Hotel e descanso da equipe" modo={values.hospedagem} valor={values.hospedagemValor} onModo={(m) => set("hospedagem", m)} onValor={(v) => set("hospedagemValor", v)} />

          <div className="bg-stage-800 border border-stage-500 rounded-xl p-[14px]">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-3">RESUMO</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-dashed border-stage-500">
                <span className="text-xs text-gray-300">Cachê do show</span>
                <span className="font-mono text-[12.5px] text-gray-200">{formatarMoeda(cacheNum.toString())}</span>
              </div>
              {extrasList.filter(e => e.modo !== "vazio").map((e, i) => (
                 <div key={i} className="flex justify-between items-center pb-2 border-b border-dashed border-stage-500">
                   <div className="flex items-center gap-1.5">
                     {e.modo === "valor" && <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />}
                     <span className="text-xs text-gray-300">{e.label}</span>
                   </div>
                   {e.modo === "incluso" ? (
                     <span className="text-[11px] italic text-[#4ade80]">incluso</span>
                   ) : (
                     <span className="font-mono text-[12.5px] text-gray-200">{formatarMoeda(e.valor)}</span>
                   )}
                 </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 mt-2">
              <span className="text-[13px] font-semibold text-gray-300">Total</span>
              <span className="text-[18px] font-bold text-gold-400 font-mono">{formatarMoeda(totalOrcamento.toString())}</span>
            </div>
          </div>
        </section>

        {/* ── Forma de Pagamento ─────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-[20px] font-semibold text-gray-100">Como você quer receber?</h2>
            <p className="text-[13px] text-gray-400 mt-1">Selecione uma das opções abaixo para o pagamento do show.</p>
          </div>
          
          <div className="space-y-2 mt-3">
            {PAY_OPTS.map(opt => {
               const isCustomOpt = opt.id === "custom";
               const active = isCustomOpt ? isCustomPay : values.formaPagamento === opt.title;
               return (
                 <div key={opt.id} onClick={() => {
                   if (!isCustomOpt) set("formaPagamento", opt.title);
                   else set("formaPagamento", " "); // dummy space to trigger custom
                 }} className={`cursor-pointer rounded-xl p-[14px] border transition-all flex items-start gap-3 ${active ? "bg-[rgba(230,184,0,0.08)] border-gold-500/50 shadow-[0_0_0_3px_rgba(230,184,0,0.1)]" : "bg-stage-800 border-stage-500 hover:border-stage-400"}`}>
                   <div className="mt-0.5 shrink-0 w-[20px] h-[20px] rounded-full border border-gold-500/50 flex items-center justify-center bg-stage-900">
                     {active && <div className="w-[8px] h-[8px] bg-gold-400 rounded-full" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 flex-wrap">
                       <div className="text-[14px] font-semibold text-gray-100 whitespace-nowrap">{opt.title}</div>
                       {opt.sug && <div className="bg-[#4ade80]/15 text-[#4ade80] text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">SUGERIDO</div>}
                     </div>
                     <div className="text-[11.5px] text-gray-500 mt-0.5 leading-snug">{opt.sub}</div>
                     {isCustomOpt && active && (
                       <input className="input-field mt-3 bg-stage-900 border-stage-500 text-sm py-2 px-3 w-full" placeholder="Ex: 30% sinal via PIX + saldo em dinheiro" value={values.formaPagamento.trim()} onChange={(e) => set("formaPagamento", e.target.value)} onClick={e=>e.stopPropagation()} />
                     )}
                   </div>
                 </div>
               );
            })}
          </div>

          {(!isCustomPay && totalOrcamento > 0) && (
            <div className="bg-[rgba(230,184,0,0.06)] border border-gold-500/30 rounded-xl p-[14px] mt-4">
              <div className="text-[10px] uppercase font-bold tracking-wider text-gold-400 mb-3">COMO FICA NA PRÁTICA</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stage-800 border border-stage-500 rounded-lg p-3 flex flex-col justify-between">
                  <div className="text-[10px] text-gray-500 mb-1 leading-tight">{labelEnt}</div>
                  <div className="text-[16px] font-bold text-gray-100 font-mono">{ent > 0 ? formatarMoeda(ent.toString()) : "—"}</div>
                </div>
                <div className="bg-stage-800 border border-stage-500 rounded-lg p-3 flex flex-col justify-between">
                  <div className="text-[10px] text-gray-500 mb-1 leading-tight">{labelDia}</div>
                  <div className="text-[16px] font-bold text-gold-400 font-mono">{dia > 0 ? formatarMoeda(dia.toString()) : "—"}</div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Bottom Sticky Bar ──────────────────────────────────────────────── */}
      <div className="bottom-sticky-bar sticky bottom-[72px] md:bottom-0 left-0 right-0 z-50 pt-8 pb-4 -mx-4 px-4 pointer-events-none transition-transform duration-300 ease-in-out" style={{ background: "linear-gradient(180deg, transparent, rgba(14,17,24,0.95) 30%, #0e1118 100%)" }}>
        <div className="pointer-events-auto">
           <div className="flex justify-between items-center mb-2 px-1">
             <div className="text-[11px] text-gray-500">
               <span className="text-gold-400 font-bold">{filledCount}</span> de <span className="text-gold-400 font-bold">8</span> campos preenchidos
             </div>
             <div className="text-[11px] text-gray-400 flex items-center gap-1 font-medium"><Check size={12}/> Salvo</div>
           </div>
           <button type="submit" disabled={loading} className="w-full h-[54px] rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98]" style={{ background: "linear-gradient(180deg, #f5c842, #e6b800)", color: "#1a1200", boxShadow: "0 6px 20px rgba(230,184,0,0.3), 0 2px 4px rgba(0,0,0,0.2)" }}>
             <span className="text-[15px] font-bold">{loading ? "Gerando..." : "Revisar e gerar PDF"}</span>
             {!loading && <ChevronRight size={18} strokeWidth={3} />}
           </button>
        </div>
      </div>
    </form>
  );
}

// ── Default values factory ───────────────────────────────────────────────────

export function defaultOrcamentoValues(): OrcamentoValues {
  return {
    contratante: "",
    evento: "",
    local: "",
    cidade: "",
    data: "",
    horarioDefinido: false,
    horario: "",
    horas: 2,
    cache: "",
    backline: "vazio",
    backlineValor: "",
    transporte: "vazio",
    transporteValor: "",
    alimentacao: "vazio",
    alimentacaoValor: "",
    hospedagem: "vazio",
    hospedagemValor: "",
    formaPagamento: "",
  };
}
