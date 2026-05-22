import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

function parseMoney(raw: string | number | undefined): number {
  if (!raw) return 0;
  return (parseFloat(String(raw)) || 0) / 100;
}

function valueBlock(
  label: string,
  raw: string | undefined,
  valor: string | undefined,
  primary: string,
  fontScale: number
): string {
  if (!raw || raw === "nao") return "";
  const n = raw === "valor" ? parseMoney(valor) : 0;
  const fmt =
    raw === "valor" && n > 0
      ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
      : raw === "incluso"
      ? "Incluso"
      : null;
  if (!fmt) return "";
  const isIncluso = fmt === "Incluso";
  return `
    <div class="item-row">
      <span class="item-label">${label}</span>
      <span class="item-val${isIncluso ? " incluso" : ""}">${fmt}</span>
    </div>`;
}

export async function buildOrc004(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  _background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const primary = artist.primaryColor || "#e6b800";
  const fontScale = (artist.orcamentoFontScale || 100) / 100;
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";

  const cache = parseMoney(d.cache);
  const cacheFmt = cache.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const cacheExt = valorPorExtenso(cache);

  const backlineN = d.backline === "valor" ? parseMoney(d.backlineValor) : 0;
  const transporteN = d.transporte === "valor" ? parseMoney(d.transporteValor) : 0;
  const alimentacaoN = d.alimentacao === "valor" ? parseMoney(d.alimentacaoValor) : 0;
  const hospedagemN = d.hospedagem === "valor" ? parseMoney(d.hospedagemValor) : 0;
  const total = cache + backlineN + transporteN + alimentacaoN + hospedagemN;
  const totalFmt = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const totalExt = valorPorExtenso(total);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&family=Open+Sans:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>
    @page { size: 21cm 29.7cm; margin: 0 !important; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { width: 21cm; }
    body { width: 21cm; min-height: 29.7cm; background: #0c0c0c; font-family: 'Open Sans', sans-serif; display: flex; flex-direction: column; }

    /* ── Accent cap ── */
    .cap { height: 6px; background: ${primary}; flex-shrink: 0; }

    /* ── Header ── */
    .header { background: #0c0c0c; padding: 22px 30px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e1e1e; flex-shrink: 0; }
    .header-logo { height: 44px; max-width: 150px; object-fit: contain; }
    .header-right { text-align: right; }
    .header-doc { font-family: 'Montserrat', sans-serif; font-weight: 300; font-size: ${Math.round(8*fontScale)}px; letter-spacing: 5px; text-transform: uppercase; color: #555; margin-bottom: 3px; }
    .header-name { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(13*fontScale)}px; color: ${primary}; letter-spacing: 1px; }

    /* ── Content ── */
    .content { flex: 1; padding: 22px 30px; display: flex; flex-direction: column; gap: 14px; }

    /* ── Section title ── */
    .section-title { font-family: 'Montserrat', sans-serif; font-weight: 300; font-size: ${Math.round(8*fontScale)}px; letter-spacing: 5px; text-transform: uppercase; color: #444; padding-bottom: 8px; border-bottom: 1px solid #1e1e1e; margin-bottom: 2px; }

    /* ── Event grid ── */
    .event-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; background: #141414; border-radius: 8px; overflow: hidden; border: 1px solid #1e1e1e; }
    .event-cell { padding: 12px 16px; border-bottom: 1px solid #1e1e1e; border-right: 1px solid #1e1e1e; }
    .event-cell:nth-child(even) { border-right: none; }
    .event-cell.full { grid-column: span 2; border-right: none; }
    .event-cell:nth-last-child(-n+2) { border-bottom: none; }
    .event-cell.full:last-child { border-bottom: none; }
    .cell-label { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: ${Math.round(8*fontScale)}px; letter-spacing: 2px; text-transform: uppercase; color: #555; margin-bottom: 4px; }
    .cell-val { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(13*fontScale)}px; color: #e8e8e8; }

    /* ── Value rows ── */
    .values-block { background: #141414; border-radius: 8px; border: 1px solid #1e1e1e; overflow: hidden; }
    .item-row { display: flex; align-items: center; justify-content: space-between; padding: 11px 16px; border-bottom: 1px solid #1a1a1a; }
    .item-row:last-child { border-bottom: none; }
    .item-label { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: ${Math.round(10*fontScale)}px; letter-spacing: 1px; text-transform: uppercase; color: #555; }
    .item-val { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(15*fontScale)}px; color: ${primary}; }
    .item-val.incluso { color: #555; font-weight: 600; font-size: ${Math.round(12*fontScale)}px; }

    /* ── Main cache highlight ── */
    .cache-row { display: flex; align-items: baseline; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #1a1a1a; }
    .cache-label { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: ${Math.round(10*fontScale)}px; letter-spacing: 1px; text-transform: uppercase; color: #555; }
    .cache-right { text-align: right; }
    .cache-val { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(18*fontScale)}px; color: ${primary}; }
    .cache-ext { font-family: 'Open Sans', sans-serif; font-size: ${Math.round(9*fontScale)}px; color: #444; font-style: italic; margin-top: 2px; }

    /* ── Total ── */
    .total-block { border-radius: 8px; overflow: hidden; border: 1px solid ${primary}33; }
    .total-inner { background: linear-gradient(135deg, #181818 0%, #111 100%); padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; }
    .total-label { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(9*fontScale)}px; letter-spacing: 4px; text-transform: uppercase; color: #555; }
    .total-right { text-align: right; }
    .total-val { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(26*fontScale)}px; color: ${primary}; line-height: 1; }
    .total-ext { font-family: 'Open Sans', sans-serif; font-size: ${Math.round(9*fontScale)}px; color: #444; font-style: italic; margin-top: 3px; }

    /* ── Payment ── */
    .payment-row { padding: 12px 16px; background: #141414; border-radius: 8px; border: 1px solid #1e1e1e; }
    .payment-label { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: ${Math.round(8*fontScale)}px; letter-spacing: 3px; text-transform: uppercase; color: #444; margin-bottom: 5px; }
    .payment-val { font-family: 'Open Sans', sans-serif; font-size: ${Math.round(12*fontScale)}px; color: #bbb; line-height: 1.6; }

    /* ── Obs ── */
    .obs { padding: 12px 16px; border-left: 3px solid ${primary}55; background: #141414; border-radius: 0 6px 6px 0; }
    .obs-text { font-family: 'Open Sans', sans-serif; font-size: ${Math.round(10*fontScale)}px; color: #555; line-height: 1.8; }

    /* ── Footer ── */
    .footer { background: #000; padding: 12px 30px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; border-top: 1px solid #1a1a1a; }
    .footer-name { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(10*fontScale)}px; color: #555; }
    .footer-web { font-family: 'Montserrat', sans-serif; font-size: ${Math.round(10*fontScale)}px; color: ${primary}; }
    .footer-logo { height: 28px; object-fit: contain; opacity: 0.6; }
  </style>
</head>
<body>
  <div class="cap"></div>

  <div class="header">
    ${logo ? `<img class="header-logo" src="data:${logoMime};base64,${logoBase64}" />` : `<div style="width:1px"></div>`}
    <div class="header-right">
      <div class="header-doc">Proposta Comercial</div>
      <div class="header-name">${escapeHtml(artist.name)}</div>
    </div>
  </div>

  <div class="content">
    <div>
      <div class="section-title">Detalhes do Evento</div>
      <div class="event-grid">
        ${d.contratante ? `<div class="event-cell full"><div class="cell-label">Para</div><div class="cell-val">${escapeHtml(d.contratante)}</div></div>` : ""}
        <div class="event-cell full"><div class="cell-label">Evento</div><div class="cell-val">${escapeHtml(d.evento || "")}</div></div>
        <div class="event-cell"><div class="cell-label">Data</div><div class="cell-val">${formatData(d.data)}</div></div>
        ${d.horario ? `<div class="event-cell"><div class="cell-label">Horário</div><div class="cell-val">${escapeHtml(d.horario)}h</div></div>` : `<div class="event-cell"><div class="cell-label">Duração</div><div class="cell-val">${d.horas || "2"}h</div></div>`}
        <div class="event-cell full"><div class="cell-label">Local</div><div class="cell-val">${escapeHtml(d.local || "")}${d.cidade ? ` — ${escapeHtml(d.cidade)}` : ""}</div></div>
      </div>
    </div>

    <div>
      <div class="section-title">Composição do Valor</div>
      <div class="values-block">
        <div class="cache-row">
          <span class="cache-label">Cachê · ${d.horas || "2"}h</span>
          <div class="cache-right">
            <div class="cache-val">${cacheFmt}</div>
            <div class="cache-ext">${cacheExt}</div>
          </div>
        </div>
        ${valueBlock("Backline", d.backline, d.backlineValor, primary, fontScale)}
        ${valueBlock("Transporte", d.transporte, d.transporteValor, primary, fontScale)}
        ${valueBlock("Alimentação", d.alimentacao, d.alimentacaoValor, primary, fontScale)}
        ${valueBlock("Hospedagem", d.hospedagem, d.hospedagemValor, primary, fontScale)}
      </div>
    </div>

    <div class="total-block">
      <div class="total-inner">
        <span class="total-label">Total</span>
        <div class="total-right">
          <div class="total-val">${totalFmt}</div>
          <div class="total-ext">${totalExt}</div>
        </div>
      </div>
    </div>

    ${d.formaPagamento ? `
    <div class="payment-row">
      <div class="payment-label">Pagamento</div>
      <div class="payment-val">${escapeHtml(d.formaPagamento)}</div>
    </div>` : ""}

    <div class="obs">
      <div class="obs-text">Proposta válida por 30 dias. Data reservada por até uma semana após o envio — passado o prazo, verificar disponibilidade.</div>
    </div>
  </div>

  <div class="footer">
    <span class="footer-name">${escapeHtml(artist.name)}</span>
    ${artist.website ? `<span class="footer-web">${escapeHtml(artist.website)}</span>` : ""}
    ${logo ? `<img class="footer-logo" src="data:${logoMime};base64,${logoBase64}" />` : ""}
  </div>
</body>
</html>`;
}
