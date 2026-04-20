"use client";

import { useState, useEffect } from "react";
import { LoadingDocument } from "@/components/ui/LoadingDocument";
import AutocompleteInput from "./AutocompleteInput";
import { ClearButton } from "./icons";
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

function CampoOpcional({
  label,
  modo,
  valor,
  onModo,
  onValor,
}: {
  label: string;
  modo: "vazio" | "incluso" | "valor";
  valor: string;
  onModo: (m: "vazio" | "incluso" | "valor") => void;
  onValor: (v: string) => void;
}) {
  const opcoes: { key: "vazio" | "incluso" | "valor"; text: string }[] = [
    { key: "vazio", text: "—" },
    { key: "incluso", text: "Incluso" },
    { key: "valor", text: "Valor" },
  ];

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex rounded-xl overflow-hidden border border-stage-500">
        {opcoes.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onModo(opt.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 ${
              modo === opt.key
                ? "bg-gold-500 text-stage-900 shadow-sm shadow-gold-500/20"
                : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-stage-700/50"
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>
      {modo === "valor" && (
        <input
          type="text"
          value={valor ? formatarMoeda(valor) : ""}
          onChange={(e) => onValor(e.target.value.replace(/\D/g, ""))}
          className="input-field mt-2 animate-fade-in"
          placeholder="R$ 0,00"
        />
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
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementsByName(firstKey)[0] || document.getElementById(firstKey);
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

  const currentFontScale = fontScale ?? 100;
  const currentLogoScale = logoScale ?? 100;

  return (
    <>
      {loading && <LoadingDocument documentType="orcamento" />}
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Dados do evento ─────────────────────────────────────── */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Dados do evento</h2>
          
          <div className="flex items-center gap-3">
            {/* Controle de Escala de Fonte */}
            {onFontScaleChange && (
              <div className="flex items-center gap-2 bg-stage-800 border border-stage-700 rounded-lg px-2 py-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Fonte</span>
                <button
                  type="button"
                  onClick={() => onFontScaleChange(Math.max(50, currentFontScale - 5))}
                  className="w-6 h-6 flex items-center justify-center bg-stage-700 hover:bg-stage-600 rounded text-gold-400 font-bold transition-colors"
                >
                  -
                </button>
                <span className="text-xs font-mono text-white w-8 text-center">{currentFontScale}%</span>
                <button
                  type="button"
                  onClick={() => onFontScaleChange(Math.min(200, currentFontScale + 5))}
                  className="w-6 h-6 flex items-center justify-center bg-stage-700 hover:bg-stage-600 rounded text-gold-400 font-bold transition-colors"
                >
                  +
                </button>
              </div>
            )}

            {/* Controle de Escala de Logo */}
            {onLogoScaleChange && (
              <div className="flex items-center gap-2 bg-stage-800 border border-stage-700 rounded-lg px-2 py-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Logo</span>
                <button
                  type="button"
                  onClick={() => onLogoScaleChange(Math.max(50, currentLogoScale - 5))}
                  className="w-6 h-6 flex items-center justify-center bg-stage-700 hover:bg-stage-600 rounded text-gold-400 font-bold transition-colors"
                >
                  -
                </button>
                <span className="text-xs font-mono text-white w-8 text-center">{currentLogoScale}%</span>
                <button
                  type="button"
                  onClick={() => onLogoScaleChange(Math.min(200, currentLogoScale + 5))}
                  className="w-6 h-6 flex items-center justify-center bg-stage-700 hover:bg-stage-600 rounded text-gold-400 font-bold transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </div>
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

      {/* ── Opcionais ──────────────────────────────────────────── */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Custos adicionais</h2>

        <CampoOpcional
          label="Backline"
          modo={values.backline}
          valor={values.backlineValor}
          onModo={(m) => set("backline", m)}
          onValor={(v) => set("backlineValor", v)}
        />

        <CampoOpcional
          label="Transporte"
          modo={values.transporte}
          valor={values.transporteValor}
          onModo={(m) => set("transporte", m)}
          onValor={(v) => set("transporteValor", v)}
        />

        <CampoOpcional
          label="Alimentação"
          modo={values.alimentacao}
          valor={values.alimentacaoValor}
          onModo={(m) => set("alimentacao", m)}
          onValor={(v) => set("alimentacaoValor", v)}
        />

        <CampoOpcional
          label="Hospedagem"
          modo={values.hospedagem}
          valor={values.hospedagemValor}
          onModo={(m) => set("hospedagem", m)}
          onValor={(v) => set("hospedagemValor", v)}
        />
      </section>

      {/* ── Forma de Pagamento ─────────────────────────────────── */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Forma de Pagamento</h2>
        <div className="flex flex-wrap gap-2">
          {["PIX à vista", "30% entrada + 70% no dia", "50% sinal + 50% no dia", "Transferência bancária", "Dinheiro", "A combinar"].map((fp) => (
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
          className="input-field"
          value={values.formaPagamento}
          onChange={(e) => set("formaPagamento", e.target.value)}
          placeholder="Ex: 30% entrada via PIX + saldo no dia em dinheiro"
        />
      </section>

      {/* ── Ações ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Gerando PDF..." : "Gerar Orçamento"}
        </button>

        {onFazerContrato && (
          <button
            type="button"
            onClick={onFazerContrato}
            className="w-full py-3 rounded-xl text-sm font-semibold border border-stage-500 text-gray-400 hover:border-gold-600 hover:text-gold-400 transition-colors"
          >
            Fazer Contrato
          </button>
        )}
      </div>
    </form>
    </>
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
