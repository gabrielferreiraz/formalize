import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
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
  fs: number
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

export async function buildOrc005(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  _background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const primary = artist.primaryColor || "#c9a227";
  const fontScale = (artist.orcamentoFontScale || 100) / 71;
  const logoScale = Number(artist.orcamentoLogoScale) || 100;
  const logoH = Math.round(72 * logoScale / 100);
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";
  const fs = fontScale;

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
    artist.instagram ? `<span style="color:${primary};font-family:'Montserrat',sans-serif;font-size:${Math.round(13*fs)}px;font-weight:600;">IG</span>` : "",
    artist.spotify ? `<span style="color:${primary};font-family:'Montserrat',sans-serif;font-size:${Math.round(13*fs)}px;font-weight:600;">SP</span>` : "",
    artist.youtube ? `<span style="color:${primary};font-family:'Montserrat',sans-serif;font-size:${Math.round(13*fs)}px;font-weight:600;">YT</span>` : "",
  ].filter(Boolean).join('<span style="color:#444;margin:0 6px;">·</span>');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&family=Open+Sans:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>
    @page { size: 21cm 29.7cm; margin: 0 !important; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { width: 21cm; }
    body { width: 21cm; min-height: 29.7cm; background: #0e0e12; font-family: 'Open Sans', sans-serif; display: flex; flex-direction: column; }

    .wrap { flex: 1; padding: 24px 50px 16px; display: flex; flex-direction: column; gap: 12px; }

    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .header-logo { height: ${logoH}px; max-width: 280px; object-fit: contain; filter: brightness(1.1); }
    .header-right { text-align: right; }
    .header-doc { font-family: 'Montserrat', sans-serif; font-weight: 300; font-size: ${Math.round(11*fs)}px; letter-spacing: 4px; text-transform: uppercase; color: #555; margin-bottom: 4px; }
    .header-name { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: ${Math.round(17*fs)}px; color: #e8e8e8; letter-spacing: 0.5px; }
    .header-cnpj { font-size: ${Math.round(12*fs)}px; color: #444; margin-top: 2px; }
    .header-badge {
      display: inline-block; margin-top: 6px; padding: 4px 14px;
      border: 1px solid ${primary}66; border-radius: 3px;
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(11*fs)}px; color: ${primary}; letter-spacing: 3px;
      text-transform: uppercase;
    }

    .card { background: #17171e; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; }
    .card-head {
      padding: 8px 18px; background: #1f1f28;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-family: 'Montserrat', sans-serif; font-weight: 700;
      font-size: ${Math.round(11*fs)}px; letter-spacing: 3px;
      text-transform: uppercase; color: ${primary}88;
    }
    .row { display: flex; align-items: baseline; justify-content: space-between; padding: 10px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); gap: 12px; }
    .row:last-child { border-bottom: none; }
    .row-label { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: ${Math.round(12*fs)}px; letter-spacing: 0.5px; text-transform: uppercase; color: #555; flex-shrink: 0; }
    .row-right { display: flex; flex-direction: column; align-items: flex-end; }
    .row-val { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(16*fs)}px; color: #c8c8c8; }
    .row-val.money { color: ${primary}; }
    .row-ext { font-size: ${Math.round(11*fs)}px; color: #3a3a44; font-style: italic; margin-top: 1px; }

    .total-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, #1a1200 0%, #221800 50%, #1a1200 100%);
      border: 1px solid ${primary}33; border-radius: 8px;
    }
    .total-label { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(12*fs)}px; letter-spacing: 4px; text-transform: uppercase; color: ${primary}88; }
    .total-right { text-align: right; }
    .total-val { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${Math.round(28*fs)}px; color: ${primary}; }
    .total-ext { font-size: ${Math.round(11*fs)}px; color: #4a3a00; font-style: italic; margin-top: 2px; }

    .obs { background: #17171e; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); padding: 12px 18px; }
    .obs-label { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(11*fs)}px; letter-spacing: 3px; text-transform: uppercase; color: ${primary}66; margin-bottom: 6px; }
    .obs-text { font-size: ${Math.round(13*fs)}px; color: #555; line-height: 1.8; }

    .footer { background: #0a0a0d; border-top: 1px solid rgba(255,255,255,0.05); padding: 14px 50px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .footer-left { display: flex; flex-direction: column; gap: 2px; }
    .footer-name { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${Math.round(13*fs)}px; color: #444; }
    .footer-web { font-family: 'Montserrat', sans-serif; font-size: ${Math.round(11*fs)}px; color: ${primary}66; margin-top: 1px; }
    .footer-socials { display: flex; align-items: center; gap: 4px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      ${logoBase64 ? `<img class="header-logo" src="data:${logoMime};base64,${logoBase64}" />` : `<div style="width:1px"></div>`}
      <div class="header-right">
        <div class="header-doc">Proposta Comercial</div>
        <div class="header-name">${escapeHtml(artist.name)}</div>
        ${artist.cnpj ? `<div class="header-cnpj">CNPJ ${escapeHtml(artist.cnpj)}</div>` : ""}
        <div class="header-badge">Orçamento</div>
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
      ${moneyRow("Backline", d.backline, d.backlineValor, primary, fs)}
      ${moneyRow("Transporte", d.transporte, d.transporteValor, primary, fs)}
      ${moneyRow("Alimentação", d.alimentacao, d.alimentacaoValor, primary, fs)}
      ${moneyRow("Hospedagem", d.hospedagem, d.hospedagemValor, primary, fs)}
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
      <div class="row"><span class="row-label">Forma</span><div class="row-right"><span class="row-val" style="font-size:${Math.round(13*fs)}px">${escapeHtml(d.formaPagamento)}</span></div></div>
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
