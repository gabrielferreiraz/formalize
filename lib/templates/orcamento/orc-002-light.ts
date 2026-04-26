import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

const templateOrcamentoLight = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { size: 21cm 29.7cm; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 21cm; height: 29.7cm; background: #f8f8f6; font-family: 'Inter', sans-serif; }

    .page {
      width: 21cm;
      height: 29.7cm;
      display: flex;
      flex-direction: column;
      background: #f8f8f6;
      position: relative;
      overflow: hidden;
    }

    /* ── Barra lateral colorida ── */
    .accent-bar {
      position: absolute;
      left: 0;
      top: 0;
      width: 6px;
      height: 100%;
      background: {{primaryColor}};
    }

    /* ── Header ── */
    .header {
      padding: 48px 52px 36px 60px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 1px solid #e8e8e4;
    }

    .header-left {}

    .logo-area {
      margin-bottom: 16px;
    }

    .logo-area img {
      height: 52px;
      object-fit: contain;
    }

    .logo-placeholder {
      font-size: 22px;
      font-weight: 800;
      color: #111;
      letter-spacing: -0.5px;
    }

    .doc-type {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: {{primaryColor}};
      margin-bottom: 4px;
    }

    .doc-title {
      font-size: 36px;
      font-weight: 800;
      color: #111;
      letter-spacing: -1px;
      line-height: 1;
    }

    .header-right {
      text-align: right;
    }

    .doc-number {
      font-size: 13px;
      font-weight: 500;
      color: #999;
      letter-spacing: 1px;
    }

    .doc-date {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-top: 4px;
    }

    /* ── Corpo ── */
    .body {
      flex: 1;
      padding: 36px 52px 36px 60px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ── Para (contratante) ── */
    .para-section {
      display: flex;
      align-items: baseline;
      gap: 12px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e8e8e4;
    }

    .para-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #aaa;
      min-width: 60px;
    }

    .para-value {
      font-size: 20px;
      font-weight: 700;
      color: #111;
    }

    /* ── Grid de informações ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
    }

    .info-item {}

    .info-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 5px;
    }

    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #222;
    }

    /* ── Tabela de valores ── */
    .valores-section {
      flex: 1;
    }

    .valores-header {
      display: grid;
      grid-template-columns: 1fr auto;
      padding: 0 0 10px 0;
      border-bottom: 2px solid #111;
      margin-bottom: 4px;
    }

    .valores-header span {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #999;
    }

    .valor-row {
      display: grid;
      grid-template-columns: 1fr auto;
      padding: 12px 0;
      border-bottom: 1px solid #e8e8e4;
      align-items: baseline;
    }

    .valor-row-label {
      font-size: 14px;
      font-weight: 500;
      color: #444;
    }

    .valor-row-value {
      font-size: 14px;
      font-weight: 600;
      color: #222;
      font-variant-numeric: tabular-nums;
    }

    .valor-row-extenso {
      font-size: 10px;
      color: #aaa;
      font-style: italic;
      margin-top: 2px;
    }

    .valor-row.incluso .valor-row-value {
      color: #4ade80;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    /* ── Total ── */
    .total-row {
      display: grid;
      grid-template-columns: 1fr auto;
      padding: 18px 0 0;
      align-items: baseline;
      margin-top: 4px;
    }

    .total-label {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #111;
    }

    .total-value {
      font-size: 28px;
      font-weight: 800;
      color: {{primaryColor}};
      letter-spacing: -0.5px;
    }

    .total-extenso {
      font-size: 11px;
      color: #aaa;
      font-style: italic;
      margin-top: 2px;
      text-align: right;
    }

    /* ── Pagamento ── */
    .pagamento-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: {{primaryColorLight}};
      border: 1px solid {{primaryColor}};
      border-radius: 100px;
      padding: 8px 16px;
    }

    .pagamento-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: {{primaryColor}};
    }

    .pagamento-text {
      font-size: 12px;
      font-weight: 600;
      color: {{primaryColor}};
    }

    /* ── OBS ── */
    .obs-section {
      background: #f0f0ec;
      border-radius: 8px;
      padding: 16px 20px;
    }

    .obs-title {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 6px;
    }

    .obs-text {
      font-size: 11px;
      color: #666;
      line-height: 1.7;
    }

    /* ── Footer ── */
    .footer {
      padding: 24px 52px 28px 60px;
      border-top: 1px solid #e8e8e4;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .footer-contact {
      display: flex;
      gap: 24px;
    }

    .footer-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .footer-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #bbb;
    }

    .footer-value {
      font-size: 11px;
      font-weight: 500;
      color: #555;
    }

    .footer-right {
      font-size: 10px;
      color: #ccc;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="accent-bar"></div>

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="logo-area">
          {{#if logoUrl}}
          <img src="data:{{logoMime}};base64,{{logoBase64}}" />
          {{else}}
          <div class="logo-placeholder">{{artistName}}</div>
          {{/if}}
        </div>
        <div class="doc-type">Documento</div>
        <div class="doc-title">Orçamento</div>
      </div>
      <div class="header-right">
        <div class="doc-number">{{numero}}</div>
        <div class="doc-date">{{dataFormatada}}</div>
      </div>
    </div>

    <!-- Corpo -->
    <div class="body">

      <!-- Para -->
      {{#if contratante}}
      <div class="para-section">
        <span class="para-label">Para</span>
        <span class="para-value">{{contratante}}</span>
      </div>
      {{/if}}

      <!-- Info Grid -->
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Evento</div>
          <div class="info-value">{{evento}}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Local</div>
          <div class="info-value">{{local}}</div>
        </div>
        {{#if cidade}}
        <div class="info-item">
          <div class="info-label">Cidade</div>
          <div class="info-value">{{cidade}}</div>
        </div>
        {{/if}}
        <div class="info-item">
          <div class="info-label">Data</div>
          <div class="info-value">{{dataEvento}}</div>
        </div>
        {{#if horario}}
        <div class="info-item">
          <div class="info-label">Horário</div>
          <div class="info-value">{{horario}}</div>
        </div>
        {{/if}}
        <div class="info-item">
          <div class="info-label">Duração</div>
          <div class="info-value">{{horas}}h de show</div>
        </div>
      </div>

      <!-- Tabela de valores -->
      <div class="valores-section">
        <div class="valores-header">
          <span>Descrição</span>
          <span>Valor</span>
        </div>

        <div class="valor-row">
          <div>
            <div class="valor-row-label">Cachê — {{horas}}h de show</div>
            <div class="valor-row-extenso">{{valorCacheExtenso}}</div>
          </div>
          <div class="valor-row-value">{{valorCacheFormatado}}</div>
        </div>

        {{#if backlineFormatado}}
        <div class="valor-row {{#if backlineIncluso}}incluso{{/if}}">
          <div class="valor-row-label">Backline</div>
          <div class="valor-row-value">{{backlineFormatado}}</div>
        </div>
        {{/if}}

        {{#if transporteFormatado}}
        <div class="valor-row {{#if transporteIncluso}}incluso{{/if}}">
          <div class="valor-row-label">Transporte</div>
          <div class="valor-row-value">{{transporteFormatado}}</div>
        </div>
        {{/if}}

        {{#if alimentacaoFormatado}}
        <div class="valor-row {{#if alimentacaoIncluso}}incluso{{/if}}">
          <div class="valor-row-label">Alimentação</div>
          <div class="valor-row-value">{{alimentacaoFormatado}}</div>
        </div>
        {{/if}}

        {{#if hospedagemFormatado}}
        <div class="valor-row {{#if hospedagemIncluso}}incluso{{/if}}">
          <div class="valor-row-label">Hospedagem</div>
          <div class="valor-row-value">{{hospedagemFormatado}}</div>
        </div>
        {{/if}}

        <div class="total-row">
          <div class="total-label">Total</div>
          <div class="total-value">{{totalFormatado}}</div>
        </div>
        <div class="total-extenso">{{totalExtenso}}</div>
      </div>

      <!-- Pagamento -->
      {{#if formaPagamento}}
      <div class="pagamento-pill">
        <div class="pagamento-dot"></div>
        <span class="pagamento-text">{{formaPagamento}}</span>
      </div>
      {{/if}}

      <!-- OBS -->
      <div class="obs-section">
        <div class="obs-title">Observações</div>
        <div class="obs-text">
          Orçamento válido por 30 dias. A data ficará reservada até uma semana após o envio.<br>
          Após o prazo, verificar disponibilidade.
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-contact">
        {{#if whatsapp}}
        <div class="footer-item">
          <span class="footer-label">WhatsApp</span>
          <span class="footer-value">{{whatsapp}}</span>
        </div>
        {{/if}}
        {{#if instagram}}
        <div class="footer-item">
          <span class="footer-label">Instagram</span>
          <span class="footer-value">{{instagram}}</span>
        </div>
        {{/if}}
        {{#if website}}
        <div class="footer-item">
          <span class="footer-label">Site</span>
          <span class="footer-value">{{website}}</span>
        </div>
        {{/if}}
      </div>
      <div class="footer-right">{{artistName}}</div>
    </div>

  </div>
</body>
</html>`;


function renderLightTemplate(template: string, ctx: Record<string, any>): string {
  let result = template.replace(/\{\{\s*#if\s+([a-zA-Z0-9_]+)\s*\}\}([\s\S]*?)(?:\{\{\s*else\s*\}\}([\s\S]*?))?\{\{\s*\/if\s*\}\}/g, (match, key, truthyBlock, falsyBlock) => {
    return ctx[key] ? truthyBlock : (falsyBlock || "");
  });
  result = result.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return ctx[key] !== undefined && ctx[key] !== null ? String(ctx[key]) : "";
  });
  return result;
}


export async function buildOrc002(
  artist: ArtistData,
  data: Record<string, any>,
  logo?: AssetResult | null,
): Promise<string> {
  const primaryColor = artist.primaryColor || "#E8A045";
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";
  
  const valorCache = (parseFloat(data.cache) || 0) / 100;
  const valorCacheFormatado = valorCache.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  const valorCacheExtenso = valorPorExtenso(valorCache);

  const backlineRaw = data.backline;
  const backlineNumerico = (backlineRaw === "valor") ? (parseFloat(data.backlineValor) || 0) / 100 : 0;
  const backlineFormatado = (backlineRaw === "valor" && backlineNumerico > 0)
    ? backlineNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (backlineRaw === 'incluso' ? 'Incluso' : null);

  const transporteRaw = data.transporte;
  const transporteNumerico = (transporteRaw === "valor") ? (parseFloat(data.transporteValor) || 0) / 100 : 0;
  const transporteFormatado = (transporteRaw === "valor" && transporteNumerico > 0)
    ? transporteNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (transporteRaw === 'incluso' ? 'Incluso' : null);

  const alimentacaoRaw = data.alimentacao;
  const alimentacaoNumerico = (alimentacaoRaw === "valor") ? (parseFloat(data.alimentacaoValor) || 0) / 100 : 0;
  const alimentacaoFormatado = (alimentacaoRaw === "valor" && alimentacaoNumerico > 0)
    ? alimentacaoNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (alimentacaoRaw === 'incluso' ? 'Incluso' : null);

  const hospedagemRaw = data.hospedagem;
  const hospedagemNumerico = (hospedagemRaw === "valor") ? (parseFloat(data.hospedagemValor) || 0) / 100 : 0;
  const hospedagemFormatado = (hospedagemRaw === "valor" && hospedagemNumerico > 0)
    ? hospedagemNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    : (hospedagemRaw === 'incluso' ? 'Incluso' : null);

  const total = valorCache + backlineNumerico + transporteNumerico + alimentacaoNumerico + hospedagemNumerico;
  const totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  const totalExtenso = valorPorExtenso(total);

  const ctx = {
    primaryColor,
    primaryColorLight: primaryColor + "20",
    artistName: escapeHtml(artist.name),
    logoUrl: !!logo?.base64,
    logoMime,
    logoBase64,
    numero: escapeHtml(data.numero || "ORC-" + Date.now().toString().slice(-6)),
    dataFormatada: formatData(data.data),
    contratante: escapeHtml(data.contratante),
    evento: escapeHtml(data.evento),
    local: escapeHtml(data.local),
    cidade: escapeHtml(data.cidade),
    dataEvento: formatData(data.data),
    horario: escapeHtml(data.horario),
    horas: data.horas || 2,
    valorCacheFormatado,
    valorCacheExtenso,
    backlineFormatado,
    backlineIncluso: backlineRaw === 'incluso',
    transporteFormatado,
    transporteIncluso: transporteRaw === 'incluso',
    alimentacaoFormatado,
    alimentacaoIncluso: alimentacaoRaw === 'incluso',
    hospedagemFormatado,
    hospedagemIncluso: hospedagemRaw === 'incluso',
    totalFormatado,
    totalExtenso,
    formaPagamento: escapeHtml(data.formaPagamento),
    whatsapp: escapeHtml(artist.whatsapp),
    instagram: escapeHtml(artist.instagram),
    website: escapeHtml(artist.website)
  };

  return renderLightTemplate(templateOrcamentoLight, ctx);
}
