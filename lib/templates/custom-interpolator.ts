import { valorPorExtenso, escapeHtml } from "./utils";
import type { ArtistTemplateData, AssetResult } from "./types";

function fmt(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 2,
  });
}

function riderValue(raw: string | undefined, valRaw: string | undefined): string {
  if (raw === "incluso") return "Incluso";
  if (raw === "valor") {
    const n = (parseFloat(valRaw || "0") || 0) / 100;
    return n > 0 ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }) : "—";
  }
  return "—";
}

function logoTag(logo: AssetResult | null, alt: string, style = "max-height:60px;max-width:200px;"): string {
  if (!logo?.base64) return "";
  return `<img src="data:${logo.mime};base64,${logo.base64}" alt="${alt}" style="${style}" />`;
}

export interface InterpolateContext {
  artist: ArtistTemplateData & Record<string, any>;
  data: Record<string, any>;
  logo?: AssetResult | null;
}

/** Substitui placeholders {{varName}} num HTML customizado pelo super admin. */
export function interpolateTemplate(html: string, ctx: InterpolateContext): string {
  const { artist, data, logo } = ctx;
  const d = data;

  const cacheRaw  = parseFloat(d.cache || "0") / 100;
  const blRaw     = parseFloat(d.backlineValor || "0") / 100;
  const trRaw     = parseFloat(d.transporteValor || "0") / 100;
  const alRaw     = parseFloat(d.alimentacaoValor || "0") / 100;
  const hoRaw     = parseFloat(d.hospedagemValor || "0") / 100;

  const blNum  = d.backline   === "valor" ? blRaw : 0;
  const trNum  = d.transporte === "valor" ? trRaw : 0;
  const alNum  = d.alimentacao === "valor" ? alRaw : 0;
  const hoNum  = d.hospedagem === "valor" ? hoRaw : 0;
  const total  = cacheRaw + blNum + trNum + alNum + hoNum;

  const vars: Record<string, string> = {
    // Artista
    primaryColor: artist.primaryColor || "#e6b800",
    nomeArtista:  artist.name || "",
    logoImg:      logoTag(logo ?? null, artist.name || "Logo"),
    instrumento:  artist.instruments || "",
    whatsapp:     artist.whatsapp || "",
    email:        artist.email || "",
    instagram:    artist.instagram || "",
    pix:          artist.pixKey || "",
    artistaLegalNome: artist.legalName || artist.name || "",
    artistaCnpj:  artist.cnpj || "",

    // Evento
    evento:        d.evento || "",
    dataEvento:    d.data ? new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR") : "",
    horario:       d.horario || "",
    local:         d.local || "",
    cidadeEvento:  d.cidade || d.cidadeEvento || "",
    horas:         d.horas || "",

    // Contratante
    contratanteNome:     d.contratante || d.contratanteNome || "",
    contratanteCpfCnpj:  d.cpfCnpj || d.contratanteCpfCnpj || "",
    contratanteRg:       d.rg || d.contratanteRg || "",
    formaPagamento:      d.formaPagamento || "",

    // Financeiro
    valorCache:         fmt(cacheRaw * 100),
    valorCacheExtenso:  valorPorExtenso(cacheRaw),
    backline:           riderValue(d.backline, d.backlineValor),
    transporte:         riderValue(d.transporte, d.transporteValor),
    alimentacao:        riderValue(d.alimentacao, d.alimentacaoValor),
    hospedagem:         riderValue(d.hospedagem, d.hospedagemValor),
    valorTotal:         total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }),
    valorTotalExtenso:  valorPorExtenso(total),

    // Contrato
    dataAssinatura: d.dataAssinatura || d.data
      ? new Date((d.dataAssinatura || d.data) + "T00:00:00").toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR"),
    foro: d.foro || d.cidadeEvento || d.cidade || "",
    hashContrato: d.hashContrato || "",
  };

  return html.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key === "logoImg" ? (vars[key] ?? `{{${key}}}`) : escapeHtml(vars[key] ?? `{{${key}}}`)
  );
}
