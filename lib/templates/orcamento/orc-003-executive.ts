import { escapeHtml, formatData, valorPorExtenso, formatMoeda } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

function parseMoney(raw: string | number | undefined): number {
  if (!raw) return 0;
  return (parseFloat(String(raw)) || 0) / 100;
}

function moneyRow(
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
  const ext = n > 0 ? valorPorExtenso(n) : null;
  return `
    <div class="row">
      <span class="row-label">${label}</span>
      <div class="row-right">
        <span class="row-val${n > 0 ? " money" : ""}">${fmt}</span>
        ${ext ? `<span class="row-ext">${ext}</span>` : ""}
      </div>
    </div>`;
}

export async function buildOrc003(
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

  const socials = [
    artist.instagram ? `<a href="${artist.instagram}" style="text-decoration:none;color:${primary};font-family:'Montserrat',sans-serif;font-size:${Math.round(10*fontScale)}px;font-weight:600;">IG</a>` : "",
    artist.spotify ? `<a href="${artist.spotify}" style="text-decoration:none;color:${primary};font-family:'Montserrat',sans-serif;font-size:${Math.round(10*fontScale)}px;font-weight:600;">SP</a>` : "",
    artist.youtube ? `<a href="${artist.youtube}" style="text-decoration:none;color:${primary};font-family:'Montserrat',sans-serif;font-size:${Math.round(10*fontScale)}px;font-weight:600;">YT</a>` : "",
  ].filter(Boolean).join('<span style="color:#999;margin:0 6px;">·</span>');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&family=Open+Sans:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>
    @page { size: 21cm 29.7cm; margin: 0 !important; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { width: 21cm; }
    body { width: 21cm; min-height: 29.7cm; background: #f2f2ee; font-family: 'Open Sans', sans-serif; display: flex; flex-direction: column; }

    .wrap { flex: 1; padding: 28px 30px 20px; display: flex; flex-direction: column; gap: 12px; }

    /* ── Header ── */
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 2px solid ${primary}; }
    .header-logo { height: 48px; max-width: 160px; object-fit: contain; }
    .header-right { text-align: right; }
    .header-doc { font-family: 'Montserrat', sans-serif; font-weight: 300; font-size: ${Math.round(9*fontScale)}px; letter-spacing: 4px; text-transform: uppercase; color: #aaa; margin-bottom: 3px; }
    .header-name { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: ${Math.round(15*fontScale)}px; color: #111; letter-spacing: 0.5px; }
    .header-cnpj { font-family: 'Open Sans', sans-serif; font-size: ${Math.round(10*fontScale)}px; color: #aaa; margin-top: 2px; }

    /* ── Cards ── */
    .card { background: #fff; border-radius: 8px; border: 1px solid #e4e4de; overflow: hidden; }
    .card-head { padding: 8px 18px; background: #f8f8f4; border-bottom: 1px solid #e8e8e2; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(8*fontScale)}px; letter-spacing: 3px; text-transform: uppercase; color: #bbb; }
    .row { display: flex; align-items: baseline; justify-content: space-between; padding: 9px 18px; border-bottom: 1px solid #f2f2ee; gap: 12px; }
    .row:last-child { border-bottom: none; }
    .row-label { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: ${Math.round(10*fontScale)}px; letter-spacing: 0.5px; text-transform: uppercase; color: #999; flex-shrink: 0; }
    .row-right { display: flex; flex-direction: column; align-items: flex-end; }
    .row-val { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(14*fontScale)}px; color: #111; }
    .row-val.money { color: ${primary}; }
    .row-ext { font-family: 'Open Sans', sans-serif; font-size: ${Math.round(10*fontScale)}px; color: #bbb; font-style: italic; margin-top: 1px; }

    /* ── Total bar ── */
    .total-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: #111; border-radius: 8px; }
    .total-label { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(10*fontScale)}px; letter-spacing: 3px; text-transform: uppercase; color: #fff; }
    .total-right { text-align: right; }
    .total-val { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(22*fontScale)}px; color: ${primary}; }
    .total-ext { font-family: 'Open Sans', sans-serif; font-size: ${Math.round(10*fontScale)}px; color: #666; font-style: italic; margin-top: 2px; }

    /* ── Obs ── */
    .obs { background: #fff; border-radius: 8px; border: 1px solid #e4e4de; padding: 12px 18px; }
    .obs-label { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(8*fontScale)}px; letter-spacing: 3px; text-transform: uppercase; color: #bbb; margin-bottom: 6px; }
    .obs-text { font-size: ${Math.round(11*fontScale)}px; color: #777; line-height: 1.8; }

    /* ── Footer ── */
    .footer { background: #111; padding: 14px 30px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .footer-left { display: flex; flex-direction: column; gap: 2px; }
    .footer-name { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(11*fontScale)}px; color: #fff; }
    .footer-web { font-family: 'Montserrat', sans-serif; font-size: ${Math.round(10*fontScale)}px; color: ${primary}; margin-top: 1px; }
    .footer-socials { display: flex; align-items: center; gap: 4px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      ${logo ? `<img class="header-logo" src="data:${logoMime};base64,${logoBase64}" />` : `<div style="width:1px"></div>`}
      <div class="header-right">
        <div class="header-doc">Proposta Comercial</div>
        <div class="header-name">${escapeHtml(artist.name)}</div>
        ${artist.cnpj ? `<div class="header-cnpj">CNPJ ${escapeHtml(artist.cnpj)}</div>` : ""}
      </div>
    </div>

    <div class="card">
      <div class="card-head">Evento</div>
      ${d.contratante ? `<div class="row"><span class="row-label">Para</span><div class="row-right"><span class="row-val">${escapeHtml(d.contratante)}</span></div></div>` : ""}
      <div class="row"><span class="row-label">Evento</span><div class="row-right"><span class="row-val">${escapeHtml(d.evento || "")}</span></div></div>
      <div class="row"><span class="row-label">Data</span><div class="row-right"><span class="row-val">${formatData(d.data)}</span></div></div>
      ${d.horario ? `<div class="row"><span class="row-label">Horário</span><div class="row-right"><span class="row-val">${escapeHtml(d.horario)}h</span></div></div>` : ""}
      <div class="row"><span class="row-label">Local</span><div class="row-right"><span class="row-val">${escapeHtml(d.local || "")}</span></div></div>
      ${d.cidade ? `<div class="row"><span class="row-label">Cidade</span><div class="row-right"><span class="row-val">${escapeHtml(d.cidade)}</span></div></div>` : ""}
      <div class="row"><span class="row-label">Duração</span><div class="row-right"><span class="row-val">${d.horas || "2"}h de show</span></div></div>
    </div>

    <div class="card">
      <div class="card-head">Valores</div>
      <div class="row">
        <span class="row-label">Cachê (${d.horas || "2"}h)</span>
        <div class="row-right">
          <span class="row-val money">${cacheFmt}</span>
          <span class="row-ext">${cacheExt}</span>
        </div>
      </div>
      ${moneyRow("Backline", d.backline, d.backlineValor, primary, fontScale)}
      ${moneyRow("Transporte", d.transporte, d.transporteValor, primary, fontScale)}
      ${moneyRow("Alimentação", d.alimentacao, d.alimentacaoValor, primary, fontScale)}
      ${moneyRow("Hospedagem", d.hospedagem, d.hospedagemValor, primary, fontScale)}
    </div>

    <div class="total-bar">
      <span class="total-label">Total</span>
      <div class="total-right">
        <div class="total-val">${totalFmt}</div>
        <div class="total-ext">${totalExt}</div>
      </div>
    </div>

    ${d.formaPagamento ? `
    <div class="card">
      <div class="card-head">Pagamento</div>
      <div class="row"><span class="row-label">Forma</span><div class="row-right"><span class="row-val" style="font-size:${Math.round(12*fontScale)}px">${escapeHtml(d.formaPagamento)}</span></div></div>
    </div>` : ""}

    <div class="obs">
      <div class="obs-label">Observações</div>
      <div class="obs-text">Proposta válida por 30 dias. A data ficará reservada por até uma semana após o envio — passado esse prazo, verificar disponibilidade.</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-left">
      <div class="footer-name">${escapeHtml(artist.name)}</div>
      ${artist.website ? `<div class="footer-web">${escapeHtml(artist.website)}</div>` : ""}
    </div>
    <div class="footer-socials">${socials}</div>
  </div>
</body>
</html>`;
}
