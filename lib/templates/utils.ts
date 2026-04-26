import crypto from "crypto";

/**
 * Converte um valor numérico para sua representação por extenso em Reais.
 * @param valor Valor numérico (ex: 3500.00 para R$ 3.500,00)
 */
export function valorPorExtenso(valor: number): string {
  if (valor === 0) return "zero reais";
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function centena(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "cem";
    let r = centenas[Math.floor(n / 100)];
    const resto = n % 100;
    if (resto === 0) return r;
    if (resto < 20) return (r ? r + " e " : "") + unidades[resto];
    const d = dezenas[Math.floor(resto / 10)];
    const u = unidades[resto % 10];
    return (r ? r + " e " : "") + d + (u ? " e " + u : "");
  }

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  let partes: string[] = [];
  if (inteiro >= 1000000) {
    const m = Math.floor(inteiro / 1000000);
    partes.push(centena(m) + (m === 1 ? " milhão" : " milhões"));
  }
  if (inteiro >= 1000) {
    const m = Math.floor((inteiro % 1000000) / 1000);
    if (m > 0) partes.push(centena(m) + " mil");
  }
  const r = inteiro % 1000;
  if (r > 0) partes.push(centena(r));
  let resultado = partes.join(" e ");
  resultado += inteiro === 1 ? " real" : " reais";
  if (centavos > 0) resultado += " e " + centena(centavos) + (centavos === 1 ? " centavo" : " centavos");
  return resultado.charAt(0).toUpperCase() + resultado.slice(1);
}

export function formatData(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatMoeda(centavos: string | number): string {
  const n = typeof centavos === "string" ? parseInt(centavos, 10) : centavos;
  if (isNaN(n) || n === 0) return "—";
  return (n / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function generateHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 10);
}
