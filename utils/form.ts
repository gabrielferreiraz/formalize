// utils/form.ts — Utilitários de formulário (migrado de Givago)

/** Data de hoje no formato YYYY-MM-DD */
export function hoje(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Gera número sequencial por ano.
 * Ex: gerarNumeroDoc("ORC") → "ORC-2026-001"
 * Usa localStorage com prefixo `formalize_`.
 */
export function gerarNumeroDoc(prefix: string): string {
  const year = new Date().getFullYear();
  const key = `formalize_seq_${prefix}_${year}`;
  const seq = parseInt(localStorage.getItem(key) ?? "0", 10) + 1;
  localStorage.setItem(key, String(seq));
  return `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
}

/**
 * Formata centavos (string de dígitos) para BRL.
 * Ex: "350000" → "R$ 3.500,00"
 */
export function formatarMoeda(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const centavos = parseInt(digits, 10);
  const reais = centavos / 100;
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte string BRL para número (reais).
 * Ex: "R$ 3.500,00" → 3500
 */
export function limparMoeda(str: string): number {
  const cleaned = str.replace(/[R$\s.]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Máscara de telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatarTelefone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Máscara CPF/CNPJ.
 * CPF: 000.000.000-00
 * CNPJ: 00.000.000/0001-00
 */
export function formatarCpfCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    // CPF
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  // CNPJ
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Converte ISO (YYYY-MM-DD) para BR (DD/MM/YYYY).
 */
export function formatarDataBR(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Máscara de CEP: 00000-000
 */
export function formatarCEP(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Valida campos obrigatórios de um formulário.
 * Retorna objeto com campo → mensagem de erro (vazio se tudo ok).
 */
export function validarCampos(
  form: Record<string, unknown>,
  campos: string[],
): Record<string, string> {
  const erros: Record<string, string> = {};
  for (const campo of campos) {
    const val = form[campo];
    if (val === undefined || val === null || String(val).trim() === "") {
      erros[campo] = "Campo obrigatório";
    }
  }
  return erros;
}
