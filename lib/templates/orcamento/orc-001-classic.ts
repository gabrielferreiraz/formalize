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
  const designWidth = 34.44;
  const designHeight = 48.71;
  const scale = (parseFloat(pageWidth) / designWidth).toFixed(6);
  const fontScale = (artist.orcamentoFontScale || 100) / 100;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Open+Sans:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    @page { size: ${pageWidth}cm ${pageHeight}cm; margin: 0 !important; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { width: ${pageWidth}cm; height: ${pageHeight}cm; margin: 0; padding: 0; }
    body { width: ${pageWidth}cm; height: ${pageHeight}cm; margin: 0; padding: 0; overflow: hidden; background: #111111; }

    .page {
      width: ${designWidth}cm;
      height: ${designHeight}cm;
      transform-origin: top left;
      transform: scale(${scale});
      position: relative;
      overflow: hidden;
      ${background ? `background-image: url('data:${fundoMime};base64,${fundoBase64}');` : "background-color: #111111;"}
      background-size: cover;
      background-position: center top;
    }

    .overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: linear-gradient(
        to bottom,
        rgba(0,0,0,0.60) 0%,
        rgba(0,0,0,0.35) 25%,
        rgba(0,0,0,0.65) 55%,
        rgba(0,0,0,0.92) 75%,
        rgba(0,0,0,1.00) 100%
      );
      z-index: 1;
    }

    .conteudo {
      position: relative;
      z-index: 2;
      height: 100%;
    }

    .header {
      text-align: center;
      padding: 40px 0 25px;
      flex-shrink: 0;
    }

    .header h1 {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: ${60 * fontScale}px;
      letter-spacing: 15px;
      color: ${primaryColor};
      text-transform: uppercase;
    }

    .card {
      background: rgba(255,255,255,0.96);
      border-radius: 20px;
      margin: 0 20px;
      padding: 60px 40px 20px;
      flex-shrink: 0;
    }

    .linha {
      display: flex;
      align-items: baseline;
      margin-bottom: 20px;
      gap: 12px;
      flex-wrap: wrap;
    }

    .label {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: ${52 * fontScale}px;
      color: #111111;
      text-transform: uppercase;
      letter-spacing: 1px;
      white-space: nowrap;
    }

    .valor {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: ${52 * fontScale}px;
      color: ${primaryColor};
    }

    .extenso {
      font-family: 'Open Sans', sans-serif;
      font-size: ${24 * fontScale}px;
      color: #888888;
      font-style: italic;
    }

    .divisor {
      border: none;
      border-top: 2px solid #e0e0e0;
      margin: 20px 0 25px;
    }

    .obs-section {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #eeeeee;
    }

    .obs-label {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: ${32 * fontScale}px;
      color: #111111;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .obs-texto {
      font-family: 'Open Sans', sans-serif;
      font-size: ${24 * fontScale}px;
      color: #555555;
      line-height: 1.6;
    }

    .espacador { flex: 1; }

    .rodape {
      flex-shrink: 0;
      background: #000000;
      padding: 30px 0 35px;
      text-align: center;
    }

    .rodape img {
      height: 260px;
      display: block;
      margin: 0 auto 25px;
    }
    .site {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: ${40 * fontScale}px;
      color: ${primaryColor};
      letter-spacing: 2px;
    }
    .redes {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 15px;
    }
    .rede-link svg {
      width: 64px;
      height: 64px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="overlay"></div>
    <div class="conteudo">
      <div class="header"><h1>Orçamento</h1></div>
      <div class="card">
        ${d.contratante ? `<div class="linha"><span class="label">Para:</span><span class="valor">${escapeHtml(d.contratante)}</span></div>` : ''}
        <div class="linha"><span class="label">Evento:</span><span class="valor">${escapeHtml(d.evento || '')}</span></div>
        <div class="linha"><span class="label">Data:</span><span class="valor">${formatData(d.data)}</span></div>
        ${d.horario ? `<div class="linha"><span class="label">Horário:</span><span class="valor">${escapeHtml(d.horario)}</span></div>` : ''}
        <div class="linha"><span class="label">Local:</span><span class="valor">${escapeHtml(d.local || '')}</span></div>
        ${d.cidade ? `<div class="linha"><span class="label">Cidade:</span><span class="valor">${escapeHtml(d.cidade)}</span></div>` : ''}
        <div class="linha"><span class="label">Valor ${d.horas || '2'}h:</span><span class="valor">${valorCacheFormatado}</span><span class="extenso">(${valorCacheExtenso})</span></div>
        ${backlineFormatado ? `<div class="linha"><span class="label">Backline:</span><span class="valor">${backlineFormatado}</span>${backlineExtenso ? `<span class="extenso">(${backlineExtenso})</span>` : ''}</div>` : ''}
        ${transporteFormatado ? `<div class="linha"><span class="label">Transporte:</span><span class="valor">${transporteFormatado}</span>${transporteExtenso ? `<span class="extenso">(${transporteExtenso})</span>` : ''}</div>` : ''}
        ${alimentacaoFormatado ? `<div class="linha"><span class="label">Alimentação:</span><span class="valor">${alimentacaoFormatado}</span>${alimentacaoExtenso ? `<span class="extenso">(${alimentacaoExtenso})</span>` : ''}</div>` : ''}
        ${hospedagemFormatado ? `<div class="linha"><span class="label">Hospedagem:</span><span class="valor">${hospedagemFormatado}</span>${hospedagemExtenso ? `<span class="extenso">(${hospedagemExtenso})</span>` : ''}</div>` : ''}
        <hr class="divisor">
        <div class="linha"><span class="label">Total:</span><span class="valor">${totalFormatado}</span><span class="extenso">(${totalExtenso})</span></div>
        ${d.formaPagamento ? `<hr class="divisor"><div class="linha"><span class="label">Pagamento:</span><span class="valor" style="font-size:38px">${escapeHtml(d.formaPagamento)}</span></div>` : ''}
        <div class="obs-section">
          <div class="obs-label">OBS:</div>
          <div class="obs-texto">Orçamento válido para 30 dias, passando o prazo, solicitar outro.<br>A data ficará reservada até uma semana após envio do orçamento.<br>Após o prazo, verificar a disponibilidade da data.</div>
        </div>
      </div>
    </div>
    <div class="rodape">
      ${logo ? `<img src="data:${logoMime};base64,${logoBase64}" />` : ''}
      ${artist.website ? `<a href="${artist.website.startsWith('http') ? artist.website : 'https://' + artist.website}" class="site" style="text-decoration:none;">${artist.website}</a>` : ''}
      <div class="redes">
        ${artist.instagram ? `
        <a href="${artist.instagram}" class="rede-link">
          <svg width="150" height="150" viewBox="0 0 24 24" fill="${primaryColor}"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </a>` : ''}
        ${artist.spotify ? `
        <a href="${artist.spotify}" class="rede-link">
          <svg width="150" height="150" viewBox="0 0 24 24" fill="${primaryColor}"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        </a>` : ''}
        ${artist.x ? `
        <a href="${artist.x}" class="rede-link">
          <svg width="150" height="150" viewBox="0 0 24 24" fill="${primaryColor}"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>` : ''}
        ${artist.youtube ? `
        <a href="${artist.youtube}" class="rede-link">
          <svg width="150" height="150" viewBox="0 0 24 24" fill="${primaryColor}"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </a>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Contrato ─────────────────────────────────────────────────────────────────
