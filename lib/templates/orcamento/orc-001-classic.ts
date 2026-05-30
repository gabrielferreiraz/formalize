import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

export async function buildOrc001(
  artist: ArtistData,
  data: Record<string, any>,
  pageSize?: { width: string; height: string },
  logo?: AssetResult | null,
  background?: AssetResult | null,
): Promise<string> {
  const d = data;
  const primaryColor = artist.primaryColor || "#E8A045";
  const fontScale = (artist.orcamentoFontScale || 100) / 71;
  const logoScale = Number(artist.orcamentoLogoScale) || 100;
  const logoH = Math.round(64 * logoScale / 100);

  const valorCache = (parseFloat(d.cache) || 0) / 100;
  const valorCacheFormatado = valorCache.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  const valorCacheExtenso = valorPorExtenso(valorCache);

  const backlineRaw = d.backline;
  const backlineNumerico = (backlineRaw === "valor") ? (parseFloat(d.backlineValor) || 0) / 100 : 0;
  const backlineFormatado = (backlineRaw === "valor" && backlineNumerico > 0)
    ? backlineNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (backlineRaw === 'incluso' ? 'Incluso' : null);
  const backlineExtenso = (backlineNumerico > 0) ? valorPorExtenso(backlineNumerico) : null;

  const transporteRaw = d.transporte;
  const transporteNumerico = (transporteRaw === "valor") ? (parseFloat(d.transporteValor) || 0) / 100 : 0;
  const transporteFormatado = (transporteRaw === "valor" && transporteNumerico > 0)
    ? transporteNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (transporteRaw === 'incluso' ? 'Incluso' : null);
  const transporteExtenso = (transporteNumerico > 0) ? valorPorExtenso(transporteNumerico) : null;

  const alimentacaoRaw = d.alimentacao;
  const alimentacaoNumerico = (alimentacaoRaw === "valor") ? (parseFloat(d.alimentacaoValor) || 0) / 100 : 0;
  const alimentacaoFormatado = (alimentacaoRaw === "valor" && alimentacaoNumerico > 0)
    ? alimentacaoNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (alimentacaoRaw === 'incluso' ? 'Incluso' : null);
  const alimentacaoExtenso = (alimentacaoNumerico > 0) ? valorPorExtenso(alimentacaoNumerico) : null;

  const hospedagemRaw = d.hospedagem;
  const hospedagemNumerico = (hospedagemRaw === "valor") ? (parseFloat(d.hospedagemValor) || 0) / 100 : 0;
  const hospedagemFormatado = (hospedagemRaw === "valor" && hospedagemNumerico > 0)
    ? hospedagemNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (hospedagemRaw === 'incluso' ? 'Incluso' : null);
  const hospedagemExtenso = (hospedagemNumerico > 0) ? valorPorExtenso(hospedagemNumerico) : null;

  const total = valorCache + backlineNumerico + transporteNumerico + alimentacaoNumerico + hospedagemNumerico;
  const totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  const totalExtenso = valorPorExtenso(total);

  const fundoMime = background?.mime || 'image/png';
  const fundoBase64 = background?.base64 || '';
  const logoMime = logo?.mime || 'image/png';
  const logoBase64 = logo?.base64 || '';

  const pageWidth = pageSize?.width ?? '21.0';
  const pageHeight = pageSize?.height ?? '29.7';

  // fs = base sizes designed for A4 (21cm). No CSS transform scale needed.
  const fs = fontScale;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Open+Sans:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    @page { size: ${pageWidth}cm ${pageHeight}cm; margin: 0 !important; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { width: ${pageWidth}cm; height: ${pageHeight}cm; }
    body {
      width: ${pageWidth}cm;
      height: ${pageHeight}cm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      ${background ? `background-image: url('data:${fundoMime};base64,${fundoBase64}');` : 'background-color: #111111;'}
      background-size: cover;
      background-position: center top;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      position: relative;
    }

    .overlay {
      position: absolute; inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(0,0,0,0.58) 0%,
        rgba(0,0,0,0.28) 20%,
        rgba(0,0,0,0.62) 56%,
        rgba(0,0,0,0.90) 78%,
        rgba(0,0,0,1.00) 100%
      );
      z-index: 1;
    }

    /* ── Page shell (flex, sits over overlay) ── */
    .pg {
      position: relative; z-index: 2;
      display: flex; flex-direction: column;
      height: 100%;
    }

    /* ── Header ── */
    .hdr {
      text-align: center;
      padding: 20px 50px 14px;
      flex-shrink: 0;
    }
    .hdr-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: ${Math.round(38 * fs)}px;
      letter-spacing: 10px;
      color: ${primaryColor};
      text-transform: uppercase;
      line-height: 1;
    }

    /* ── Content card ── */
    .card {
      background: rgba(255,255,255,0.97);
      border-radius: 12px;
      margin: 0;
      padding: 16px 50px 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    /* Data rows */
    .row {
      display: flex;
      align-items: baseline;
      padding: 7px 0;
      gap: 10px;
      border-bottom: 1px solid #f0f0f0;
      flex-wrap: wrap;
    }
    .row:last-of-type { border-bottom: none; }

    .lbl {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: ${Math.round(12 * fs)}px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      min-width: 90px;
      flex-shrink: 0;
    }
    .val {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: ${Math.round(17 * fs)}px;
      color: #111;
    }
    .val.hi { color: ${primaryColor}; }
    .ext {
      font-family: 'Open Sans', sans-serif;
      font-size: ${Math.round(11 * fs)}px;
      color: #aaa;
      font-style: italic;
    }

    /* Spacer between rows and total */
    .spacer { flex: 1; min-height: 6px; }

    /* Total bar */
    .total {
      background: #111;
      border-radius: 8px;
      padding: 11px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
      flex-shrink: 0;
    }
    .total-lbl {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: ${Math.round(11 * fs)}px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #fff;
    }
    .total-r { text-align: right; }
    .total-val {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: ${Math.round(28 * fs)}px;
      color: ${primaryColor};
      line-height: 1;
    }
    .total-ext {
      font-family: 'Open Sans', sans-serif;
      font-size: ${Math.round(11 * fs)}px;
      color: #888;
      font-style: italic;
      margin-top: 2px;
    }

    /* Obs */
    .obs {
      margin-top: 9px;
      padding-top: 9px;
      border-top: 1px solid #eee;
      flex-shrink: 0;
    }
    .obs-lbl {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: ${Math.round(10 * fs)}px;
      color: #111;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 3px;
    }
    .obs-txt {
      font-family: 'Open Sans', sans-serif;
      font-size: ${Math.round(11 * fs)}px;
      color: #777;
      line-height: 1.6;
    }

    /* ── Footer ── */
    .ftr {
      flex-shrink: 0;
      background: #000;
      padding: 10px 50px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .ftr-logo { height: ${logoH}px; max-width: 280px; object-fit: contain; }
    .ftr-r { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
    .ftr-site {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: ${Math.round(12 * fs)}px;
      color: ${primaryColor};
      letter-spacing: 1px;
      text-decoration: none;
    }
    .redes { display: flex; gap: 10px; align-items: center; }
    .rede-link svg { width: 20px; height: 20px; display: block; }
  </style>
</head>
<body>
  <div class="overlay"></div>
  <div class="pg">

    <div class="hdr">
      <div class="hdr-title">Orçamento</div>
    </div>

    <div class="card">
      ${d.contratante ? `<div class="row"><span class="lbl">Para</span><span class="val">${escapeHtml(d.contratante)}</span></div>` : ''}
      <div class="row"><span class="lbl">Evento</span><span class="val">${escapeHtml(d.evento || '')}</span></div>
      <div class="row"><span class="lbl">Data</span><span class="val">${formatData(d.data)}</span></div>
      ${d.horario ? `<div class="row"><span class="lbl">Horário</span><span class="val">${escapeHtml(d.horario)}</span></div>` : ''}
      <div class="row"><span class="lbl">Local</span><span class="val">${escapeHtml(d.local || '')}</span></div>
      ${d.cidade ? `<div class="row"><span class="lbl">Cidade</span><span class="val">${escapeHtml(d.cidade)}</span></div>` : ''}
      <div class="row"><span class="lbl">Cachê ${d.horas || 2}h</span><span class="val hi">${valorCacheFormatado}</span><span class="ext">${valorCacheExtenso}</span></div>
      ${backlineFormatado ? `<div class="row"><span class="lbl">Backline</span><span class="val">${backlineFormatado}</span>${backlineExtenso ? `<span class="ext">${backlineExtenso}</span>` : ''}</div>` : ''}
      ${transporteFormatado ? `<div class="row"><span class="lbl">Transporte</span><span class="val">${transporteFormatado}</span>${transporteExtenso ? `<span class="ext">${transporteExtenso}</span>` : ''}</div>` : ''}
      ${alimentacaoFormatado ? `<div class="row"><span class="lbl">Alimentação</span><span class="val">${alimentacaoFormatado}</span>${alimentacaoExtenso ? `<span class="ext">${alimentacaoExtenso}</span>` : ''}</div>` : ''}
      ${hospedagemFormatado ? `<div class="row"><span class="lbl">Hospedagem</span><span class="val">${hospedagemFormatado}</span>${hospedagemExtenso ? `<span class="ext">${hospedagemExtenso}</span>` : ''}</div>` : ''}
      ${d.formaPagamento ? `<div class="row"><span class="lbl">Pagamento</span><span class="val">${escapeHtml(d.formaPagamento)}</span></div>` : ''}

      <div class="spacer"></div>

      <div class="total">
        <span class="total-lbl">Total</span>
        <div class="total-r">
          <div class="total-val">${totalFormatado}</div>
          <div class="total-ext">${totalExtenso}</div>
        </div>
      </div>

      <div class="obs">
        <div class="obs-lbl">OBS</div>
        <div class="obs-txt">Orçamento válido por 30 dias. A data ficará reservada por uma semana após o envio — após esse prazo, verificar disponibilidade.</div>
      </div>
    </div>

    <div class="ftr">
      <div>
        ${logo ? `<img class="ftr-logo" src="data:${logoMime};base64,${logoBase64}" />` : ''}
      </div>
      <div class="ftr-r">
        ${artist.website ? `<a href="${artist.website.startsWith('http') ? artist.website : 'https://' + artist.website}" class="ftr-site">${artist.website}</a>` : ''}
        <div class="redes">
          ${artist.instagram ? `<a href="${artist.instagram}" class="rede-link"><svg viewBox="0 0 24 24" fill="${primaryColor}"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>` : ''}
          ${artist.spotify ? `<a href="${artist.spotify}" class="rede-link"><svg viewBox="0 0 24 24" fill="${primaryColor}"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg></a>` : ''}
          ${artist.x ? `<a href="${artist.x}" class="rede-link"><svg viewBox="0 0 24 24" fill="${primaryColor}"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>` : ''}
          ${artist.youtube ? `<a href="${artist.youtube}" class="rede-link"><svg viewBox="0 0 24 24" fill="${primaryColor}"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>` : ''}
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
}
