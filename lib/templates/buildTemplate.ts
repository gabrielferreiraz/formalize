import crypto from "crypto";
import { valorPorExtenso } from "./utils";
import { fetchWithCache } from "@/lib/cache";

interface ArtistData {
  name: string;
  legalName: string | null;
  cnpj: string | null;
  logoUrl: string | null;
  backgroundUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  whatsapp: string | null;
  instagram: string | null;
  spotify: string | null;
  x: string | null;
  youtube: string | null;
  website: string | null;
  pixKey: string | null;
  bankInfo: any;
  address: any;
  instruments: string | null;
  orcamentoFontScale: number | null;
  contratoFontScale: number | null;
  orcamentoLogoScale: number | null;
  contratoLogoScale: number | null;
}


function formatMoeda(centavos: string | number): string {
  const n = typeof centavos === "string" ? parseInt(centavos, 10) : centavos;
  if (isNaN(n) || n === 0) return "—";
  return (n / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatData(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 10);
}

// ── Orçamento ────────────────────────────────────────────────────────────────

async function buildOrcamento(
  artist: ArtistData,
  data: Record<string, any>,
  pageSize?: { width: string; height: string },
  logo?: { base64: string; mime: string } | null,
  background?: { base64: string; mime: string } | null,
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

async function buildContrato(
  artist: ArtistData,
  data: Record<string, any>,
  _pageSize?: { width: string; height: string },
  logo?: { base64: string; mime: string } | null,
): Promise<string> {
  const d = data;
  const primaryColor = artist.primaryColor || "#E8A045";
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";

  const valorCache = (parseFloat(d.cache) || 0) / 100;
  const valorCacheFormatado = valorCache.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

  const backlineRaw = d.backline;
  const backlineNumerico = backlineRaw === "valor" ? (parseFloat(d.backlineValor) || 0) / 100 : 0;
  const backlineFormatado = backlineNumerico > 0
    ? backlineNumerico.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;

  const transporteRaw = d.transporte;
  const transporteNumerico = transporteRaw === "valor" ? (parseFloat(d.transporteValor) || 0) / 100 : 0;
  const transporteFormatado = transporteNumerico > 0
    ? transporteNumerico.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
    : null;

  const valorTotal = valorCache + backlineNumerico + transporteNumerico;
  const valorTotalFormatado = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const valorTotalExtenso = valorPorExtenso(valorTotal);

  const transporteTexto = (transporteRaw === "incluso" || !transporteRaw)
    ? "O deslocamento do artista e equipe já está incluso no valor do cachê, conforme combinado."
    : `O deslocamento do artista e equipe será cobrado à parte no valor de <strong>${transporteFormatado}</strong>, conforme combinado.`;

  const pessoasBanda = d.pessoasBanda || 7;

  const nomeSlug = (d.contratanteNome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const dataEventoBr = formatData(d.data);
  const hashContrato = crypto.createHash("sha256")
    .update(nomeSlug + dataEventoBr + valorTotalFormatado + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();
  const dataAssinaturaBr = d.dataAssinatura ? formatData(d.dataAssinatura) : dataEventoBr;
  const dataAssinatura = new Date().toLocaleString("pt-BR", { timeZone: "America/Campo_Grande" });

  const enderecoArtista = addr.rua
    ? `${addr.rua} Nº ${addr.numero || ""}, Bairro ${addr.bairro || ""}, ${addr.cidade || ""}/${addr.estado || ""}`
    : "—";
  const foro = addr.cidade ? `${addr.cidade}-${addr.estado}` : "Campo Grande-MS";
  const cidadeEstadoContratante = d.cidade && d.uf ? `${d.cidade}/${d.uf}` : "";
  const cidadeEstadoEvento = d.cidadeEvento || foro;
  const instruments = artist.instruments || "Bateria, Percussão, Guitarra, Baixo, Sanfona";
  const rgTexto = d.contratanteRg
    ? `${d.contratanteRg}${d.contratanteOrgao ? " " + d.contratanteOrgao : ""}`
    : "não informado";
  const horasNum = d.horas || 2;
  const horasFormatado = (horasNum % 1 !== 0) ? `${Math.floor(horasNum)}:30` : `${horasNum}:00`;
  const fontScale = (artist.contratoFontScale || 100) / 100;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page { margin: 1mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: #ffffff; font-family: 'Open Sans', sans-serif; }
    .pagina { width: 100%; min-height: 100vh; position: relative; display: flex; flex-direction: column; background: #ffffff; }
    .marca-dagua { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70%; opacity: 0.04; z-index: 0; pointer-events: none; }
    .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%); padding: 32px 50px 26px; text-align: center; flex-shrink: 0; position: relative; z-index: 1; }
    .header img { height: 100px; display: block; margin: 0 auto 12px; }
    .header-subtitulo { font-family: 'Montserrat', sans-serif; font-weight: 400; font-size: ${16 * fontScale}px; color: #888888; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 14px; }
    .header-linha { width: 60%; height: 2px; background: linear-gradient(to right, transparent, ${primaryColor}, transparent); margin: 0 auto; }
    .corpo { position: relative; z-index: 1; padding: 32px 55px 55px; flex: 1; }
    .titulo { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${34 * fontScale}px; color: #111111; text-align: center; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 26px; padding-bottom: 16px; position: relative; }
    .titulo::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 140px; height: 3px; background: linear-gradient(to right, transparent, ${primaryColor}, transparent); }
    .intro { font-size: ${19 * fontScale}px; color: #222222; line-height: 1.8; margin-bottom: 20px; text-align: justify; }
    .intro strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111111; }
    .clausula { margin-bottom: 18px; break-inside: avoid; }
    .clausula-titulo { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${19 * fontScale}px; color: ${primaryColor}; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .clausula-titulo::before { content: ''; width: 6px; height: 6px; background: ${primaryColor}; border-radius: 50%; flex-shrink: 0; }
    .clausula-texto { font-size: ${19 * fontScale}px; color: #333333; line-height: 1.8; text-align: justify; padding-left: 14px; }
    .clausula-texto strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111111; }
    .paragrafo { font-size: ${18 * fontScale}px; color: #444444; line-height: 1.8; margin-top: 6px; padding-left: 28px; text-align: justify; }
    .obs { font-size: ${19 * fontScale}px; color: #333333; line-height: 1.8; margin-bottom: 12px; text-align: justify; padding: 10px 14px; background: #fafafa; border-left: 3px solid ${primaryColor}; border-radius: 3px; break-inside: avoid; }
    .obs strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: ${primaryColor}; }
    .secao-bancaria { background: #f5f5f5; border-left: 5px solid ${primaryColor}; border-radius: 6px; padding: 18px 24px; margin: 18px 0; break-inside: avoid; }
    .banco-titulo { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: ${19 * fontScale}px; color: #111111; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
    .banco-linha { font-size: ${19 * fontScale}px; color: #333333; line-height: 1.9; }
    .banco-linha strong { font-family: 'Montserrat', sans-serif; font-weight: 700; color: #111111; }
    .assinaturas { margin-top: 36px; padding-top: 24px; border-top: 1px solid #eeeeee; break-inside: avoid; }
    .local-data { font-size: ${17 * fontScale}px; color: #444444; margin-bottom: 34px; text-align: center; font-style: italic; }
    .linha-assinatura { display: flex; justify-content: space-between; gap: 60px; margin-bottom: 34px; break-inside: avoid; align-items: flex-end; }
    .assinatura-bloco { flex: 1; text-align: center; }
    .assinatura-linha { border-top: 1.5px solid #333333; margin-bottom: 8px; }
    .assinatura-label { font-size: ${16 * fontScale}px; color: #777777; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px; }
    .testemunhas-titulo { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${17 * fontScale}px; color: #111111; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
    .testemunhas-linha { display: flex; align-items: center; gap: 12px; margin-top: 10px; break-inside: avoid; }
    .test-num { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${17 * fontScale}px; color: #111111; white-space: nowrap; }
    .test-linha { flex: 1; border-top: 1.5px solid #333333; }
    .rodape { padding: 20px 40px; text-align: center; position: relative; z-index: 1; }
    .rodape-linha { width: 60%; height: 2px; background: linear-gradient(to right, transparent, ${primaryColor}, transparent); margin: 0 auto 14px; }
    .rodape-frase { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${17 * fontScale}px; color: ${primaryColor}; letter-spacing: 3px; font-style: italic; }
    .ass-dig-bloco { margin-top: 8px; padding: 8px 10px; border: 1px solid ${primaryColor}; border-radius: 4px; background: #fffbf5; text-align: center; }
    .ass-dig-titulo { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: ${12 * fontScale}px; color: ${primaryColor}; letter-spacing: 2px; margin-bottom: 4px; }
    .ass-dig-info { font-size: ${12 * fontScale}px; color: #444444; line-height: 1.6; }
    .ass-dig-codigo { font-family: 'Montserrat', sans-serif; font-size: ${11 * fontScale}px; color: #888888; margin-top: 4px; letter-spacing: 1px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="pagina">
    ${logo ? `<img class="marca-dagua" src="data:${logoMime};base64,${logoBase64}" />` : ""}
    <div class="header">
      ${logo ? `<img src="data:${logoMime};base64,${logoBase64}" />` : ""}
      <div class="header-subtitulo">Entretenimento Musical</div>
      <div class="header-linha"></div>
    </div>
    <div class="corpo">
      <div class="titulo">Nota Contratual</div>
      <div class="intro">
        Pelo presente instrumento e na melhor forma de direito, de um lado doravante denominado
        simplesmente <strong>CONTRATANTE</strong>, <strong>${escapeHtml(d.contratanteNome || "")}</strong>,
        inscrita no CPF/CNPJ: <strong>${escapeHtml(d.contratanteCpfCnpj || "")}</strong>
        e RG: <strong>${escapeHtml(rgTexto)}</strong>,
        residente e domiciliado na Rua: <strong>${escapeHtml(d.logradouro || "")}</strong>,
        <strong>Nº ${escapeHtml(d.numero || "")}</strong>, <strong>${escapeHtml(d.bairro || "")}</strong>,
        CEP: <strong>${escapeHtml(d.cep || "")}</strong>, <strong>${escapeHtml(cidadeEstadoContratante)}</strong>${d.contratanteTelefone ? `, Tel: <strong>${escapeHtml(d.contratanteTelefone)}</strong>` : ""}
      </div>
      <div class="intro">
        De outro lado o <strong>"${escapeHtml(artist.name)}"</strong>, denominado <strong>CONTRATADO</strong>,
        <em>empresa brasileira com CNPJ: ${escapeHtml(artist.cnpj || "")},
        escritório localizado na ${escapeHtml(enderecoArtista)},</em>
        têm entre si, junto e contratado o seguinte:
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Primeira:</div>
        <div class="clausula-texto">O contratado se obriga a prestar seu serviço de show musical na seguinte data: <strong>${escapeHtml(dataEventoBr)}.</strong></div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Segunda:</div>
        <div class="clausula-texto">O contratado desempenhará sua função, na duração de <strong>${escapeHtml(horasFormatado)} hs de show</strong>${d.horario ? `, às <strong>${escapeHtml(d.horario)}h</strong>` : ""}, no Local: <strong>${escapeHtml(d.local || "")}</strong>, <strong>${escapeHtml(cidadeEstadoEvento)}</strong></div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Terceira:</div>
        <div class="clausula-texto">No valor do contrato estipula-se a importância de <strong>${escapeHtml(valorTotalFormatado)} (${escapeHtml(valorTotalExtenso)})</strong> para a apresentação de <strong>${escapeHtml(String(horasNum))}</strong> horas com local citado acima${backlineNumerico > 0 ? `, sendo <strong>${escapeHtml(valorCacheFormatado)}</strong> de cachê e <strong>${escapeHtml(backlineFormatado!)}</strong> de backline` : ""}.</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Quarta:</div>
        <div class="clausula-texto">O artista se apresentará em seu formato de banda completa com os seguintes instrumentos: ${escapeHtml(instruments)}, conforme o mapa de palco em anexo na última página.</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Quinta:</div>
        <div class="clausula-texto">${transporteTexto}</div>
      </div>
      ${backlineNumerico > 0 ? `
      <div class="clausula">
        <div class="clausula-titulo">Backline:</div>
        <div class="clausula-texto">Backline no valor de <strong>${escapeHtml(backlineFormatado!)}</strong> ficará por conta do CONTRATANTE.</div>
      </div>` : ""}
      <div class="obs"><strong>OBS.</strong> Água mineral durante a apresentação e alimentação para <strong>${pessoasBanda}</strong> pessoas fica por conta do CONTRATANTE.</div>
      <div class="obs"><strong>OBS.</strong> Som profissional para atender o evento, durante o tempo determinado de apresentação deverá ser fornecido pelo contratante ou pelo espaço de eventos, porém backline com técnico de som será fornecido pelo artista, para uso do próprio durante a sua apresentação.</div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Sexta:</div>
        <div class="clausula-texto">A escolha do repertório a ser executado ficará a critério do <strong><em>Contratado podendo incluir pedido da contratante com antecedência de até 30 dias da data prevista para o evento.</em></strong></div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Sétima:</div>
        <div class="clausula-texto">Em caso de rescisão desta Nota Contratual, a parte infratora indenizará a parte prejudicada da seguinte forma;</div>
        <div class="paragrafo">§ 1º - Multa de 10% (dez por cento) do valor contratado, quando a rescisão se der por escrito, até 15 (quinze) dias antes da data do referido serviço a ser prestado;</div>
        <div class="paragrafo">§ 2º - Multa de 50% (cinquenta por cento) do valor contratado, quando a rescisão se der por escrito, no dia do evento.</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Oitava:</div>
        <div class="clausula-texto">${d.formaPagamento
          ? `O Contratante efetuará o pagamento da seguinte forma: <strong>${escapeHtml(d.formaPagamento)}</strong>, em moeda corrente vigente neste país.`
          : "O Contratante efetuará o pagamento de 30% do valor de entrada na assinatura do contrato e o restante será pago até a semana que antecede o evento, em moeda corrente vigente neste país."
        }</div>
      </div>
      <div class="secao-bancaria">
        <div class="banco-titulo">Dados Bancários</div>
        <div class="banco-linha"><strong>Titular:</strong> ${escapeHtml(bank.titular || artist.legalName || artist.name || "")}</div>
        <div class="banco-linha"><strong>Pix:</strong> ${escapeHtml(bank.pix || artist.pixKey || "")}</div>
        <div class="banco-linha"><strong>Banco:</strong> ${escapeHtml(bank.banco || "")}</div>
        <div class="banco-linha"><strong>Conta:</strong> ${escapeHtml(bank.conta || "")} &nbsp;&nbsp; <strong>Agência:</strong> ${escapeHtml(bank.agencia || "")}</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Nona:</div>
        <div class="clausula-texto">O espetáculo será interrompido a qualquer momento se ficar constatado o comportamento inadequado do público presente para com o artista e sua banda, ficando bem evidenciado, neste caso, que o CONTRATADO não terá nenhuma responsabilidade ou multa, sendo o espetáculo considerado realizado.</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Décima:</div>
        <div class="clausula-texto">Ficam sob inteira responsabilidade do CONTRATANTE, os alvarás do juizado de menores, taxas de cobrança do ECAD, diversões Públicas e quaisquer outros que se fizeram necessário à realização do espetáculo.</div>
      </div>
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Décima Primeira:</div>
        <div class="clausula-texto">As partes aqui contratadas elegem desde já, o foro da Cidade de ${escapeHtml(foro)}, com exclusão de qualquer outro, por mais privilegiado que seja para questões judiciais que se originaram desta Nota Contratual.</div>
      </div>
      ${d.clausulasEspeciais ? `
      <div class="clausula">
        <div class="clausula-titulo">Cláusula Especial:</div>
        <div class="clausula-texto">${escapeHtml(d.clausulasEspeciais)}</div>
      </div>` : ""}
      ${d.riderTecnico ? `
      <div class="obs"><strong>Rider Técnico:</strong> ${escapeHtml(d.riderTecnico)}</div>` : ""}
      ${d.observacoes ? `
      <div class="obs"><strong>OBS.</strong> ${escapeHtml(d.observacoes)}</div>` : ""}
      <div class="assinaturas">
        <div class="local-data">${escapeHtml(foro)}, ${escapeHtml(dataAssinaturaBr)}</div>
        <div class="linha-assinatura">
          <div class="assinatura-bloco">
            <div class="assinatura-linha"></div>
            <div class="assinatura-label">Contratante</div>
          </div>
          <div class="assinatura-bloco">
            ${d.assinarDigitalmente !== false ? `
            <div class="ass-dig-bloco">
              <div class="ass-dig-titulo">Assinado Digitalmente</div>
              <div class="ass-dig-info"><strong>${escapeHtml(artist.legalName || artist.name)}</strong></div>
              <div class="ass-dig-info">CNPJ: ${escapeHtml(artist.cnpj || "")}</div>
              <div class="ass-dig-info">${escapeHtml(dataAssinatura)}</div>
              <div class="ass-dig-codigo">Cód: ${hashContrato}</div>
            </div>` : ""}
            <div class="assinatura-linha"></div>
            <div class="assinatura-label">Contratado</div>
          </div>
        </div>
        <div class="testemunhas-titulo">TESTEMUNHAS:</div>
        <div class="testemunhas-linha">
          <span class="test-num">1º</span>
          <div class="test-linha"></div>
          <span class="test-num">2º</span>
          <div class="test-linha"></div>
        </div>
      </div>
      <div class="rodape">
        <div class="rodape-linha"></div>
        <div class="rodape-frase">${escapeHtml(d.fraseRodape || "Depois do Sim, é hora do Show")}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

type AssetResult = { base64: string; mime: string } | null;

// ── Wrapper Principal ────────────────────────────────────────────────────────

export async function buildTemplate(
  type: "orcamento" | "contrato",
  artist: any,
  data: Record<string, any>,
  pageSize?: { width: string; height: string },
  preloaded?: { logo?: AssetResult; background?: AssetResult },
): Promise<string> {
  let logo: AssetResult = preloaded?.logo ?? null;
  let background: AssetResult = preloaded?.background ?? null;

  // Só busca os assets que não foram pré-carregados
  if (!preloaded) {
    const [logoResult, backgroundResult] = await Promise.all([
      artist.logoUrl ? fetchWithCache(artist.logoUrl) : Promise.resolve(null),
      artist.backgroundUrl ? fetchWithCache(artist.backgroundUrl) : Promise.resolve(null),
    ]);
    logo = logoResult ? { base64: logoResult.buffer.toString("base64"), mime: logoResult.mime } : null;
    background = backgroundResult ? { base64: backgroundResult.buffer.toString("base64"), mime: backgroundResult.mime } : null;
  }

  if (type === "orcamento") {
    return buildOrcamento(artist, data, pageSize, logo, background);
  } else {
    return buildContrato(artist, data, pageSize, logo);
  }
}
