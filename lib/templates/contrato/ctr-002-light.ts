import crypto from "crypto";
import { escapeHtml, formatData, valorPorExtenso } from "@/lib/templates/utils";
import type { ArtistTemplateData, AssetResult } from "@/lib/templates/types";

type ArtistData = ArtistTemplateData & Record<string, any>;

const templateContratoLight = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { margin: 1mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: #f8f8f6; font-family: 'Inter', sans-serif; }

    .page {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8f8f6;
      position: relative;
    }

    /* ── Barra lateral colorida ── */
    .accent-bar {
      position: fixed;
      left: 0;
      top: 0;
      width: 6px;
      height: 100%;
      background: {{primaryColor}};
    }

    /* ── Marca d'água ── */
    .marca-dagua {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50%;
      opacity: 0.03;
      z-index: 0;
      pointer-events: none;
    }

    /* ── Header ── */
    .header {
      padding: 40px 52px 32px 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #111;
      position: relative;
      z-index: 1;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .logo-area img {
      height: 44px;
      object-fit: contain;
    }

    .logo-placeholder {
      font-size: 20px;
      font-weight: 800;
      color: #111;
      letter-spacing: -0.5px;
    }

    .header-divider {
      width: 1px;
      height: 36px;
      background: #ddd;
    }

    .header-info {}

    .header-subtitle {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 3px;
    }

    .header-title {
      font-size: 18px;
      font-weight: 700;
      color: #111;
      letter-spacing: -0.3px;
    }

    .header-right {
      text-align: right;
    }

    .header-number {
      font-size: 11px;
      font-weight: 600;
      color: #999;
      letter-spacing: 1px;
      margin-bottom: 3px;
    }

    .header-date {
      font-size: 12px;
      font-weight: 600;
      color: #333;
    }

    /* ── Corpo ── */
    .corpo {
      flex: 1;
      padding: 32px 52px 40px 60px;
      position: relative;
      z-index: 1;
    }

    /* ── Partes ── */
    .partes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
      padding-bottom: 28px;
      border-bottom: 1px solid #e0e0dc;
    }

    .parte-card {
      background: white;
      border-radius: 10px;
      padding: 18px 20px;
      border: 1px solid #e8e8e4;
    }

    .parte-role {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: {{primaryColor}};
      margin-bottom: 8px;
    }

    .parte-nome {
      font-size: 15px;
      font-weight: 700;
      color: #111;
      margin-bottom: 6px;
    }

    .parte-detalhe {
      font-size: 11px;
      color: #888;
      line-height: 1.6;
    }

    /* ── Evento info ── */
    .evento-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 28px;
      padding-bottom: 28px;
      border-bottom: 1px solid #e0e0dc;
    }

    .evento-item {}

    .evento-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 4px;
    }

    .evento-value {
      font-size: 13px;
      font-weight: 600;
      color: #222;
      line-height: 1.4;
    }

    /* ── Valor destaque ── */
    .valor-destaque {
      background: white;
      border: 1px solid #e8e8e4;
      border-left: 4px solid {{primaryColor}};
      border-radius: 8px;
      padding: 18px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .valor-destaque-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 4px;
    }

    .valor-destaque-num {
      font-size: 26px;
      font-weight: 800;
      color: {{primaryColor}};
      letter-spacing: -0.5px;
    }

    .valor-destaque-extenso {
      font-size: 11px;
      color: #aaa;
      font-style: italic;
    }

    .valor-destaque-pagamento {
      text-align: right;
    }

    .pagamento-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 6px;
    }

    .pagamento-value {
      font-size: 12px;
      font-weight: 600;
      color: #444;
    }

    /* ── Cláusulas ── */
    .clausulas-section {
      margin-bottom: 24px;
    }

    .clausulas-title {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e8e8e4;
    }

    .clausula {
      display: flex;
      gap: 14px;
      margin-bottom: 12px;
      break-inside: avoid;
    }

    .clausula-num {
      font-size: 10px;
      font-weight: 700;
      color: {{primaryColor}};
      min-width: 24px;
      padding-top: 1px;
    }

    .clausula-corpo {}

    .clausula-titulo {
      font-size: 11px;
      font-weight: 700;
      color: #111;
      margin-bottom: 3px;
    }

    .clausula-texto {
      font-size: 11px;
      color: #555;
      line-height: 1.7;
      text-align: justify;
    }

    .clausula-texto strong {
      font-weight: 700;
      color: #222;
    }

    .paragrafo {
      font-size: 10.5px;
      color: #777;
      line-height: 1.7;
      margin-top: 4px;
      padding-left: 12px;
      text-align: justify;
    }

    /* ── OBS ── */
    .obs {
      background: white;
      border: 1px solid #e8e8e4;
      border-left: 3px solid {{primaryColor}};
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 10px;
      font-size: 11px;
      color: #555;
      line-height: 1.7;
      break-inside: avoid;
    }

    .obs strong {
      font-weight: 700;
      color: {{primaryColor}};
    }

    /* ── Dados bancários ── */
    .banco-section {
      background: white;
      border: 1px solid #e8e8e4;
      border-radius: 10px;
      padding: 18px 22px;
      margin-bottom: 24px;
      break-inside: avoid;
    }

    .banco-title {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 12px;
    }

    .banco-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .banco-item {}

    .banco-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 2px;
    }

    .banco-value {
      font-size: 12px;
      font-weight: 600;
      color: #222;
    }

    /* ── Assinaturas ── */
    .assinaturas {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e0e0dc;
      break-inside: avoid;
    }

    .local-data {
      font-size: 11px;
      color: #888;
      text-align: center;
      font-style: italic;
      margin-bottom: 32px;
    }

    .assinaturas-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 28px;
    }

    .assinatura-bloco {
      text-align: center;
    }

    .assinatura-linha {
      border-top: 1.5px solid #333;
      margin-bottom: 8px;
    }

    .assinatura-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #999;
    }

    /* ── Assinatura digital ── */
    .ass-dig {
      border: 1px solid {{primaryColor}};
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 8px;
      background: white;
    }

    .ass-dig-titulo {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: {{primaryColor}};
      margin-bottom: 4px;
    }

    .ass-dig-info {
      font-size: 10px;
      color: #555;
      line-height: 1.6;
    }

    .ass-dig-codigo {
      font-size: 9px;
      color: #aaa;
      margin-top: 3px;
      font-family: monospace;
      letter-spacing: 1px;
    }

    /* ── Testemunhas ── */
    .testemunhas {
      break-inside: avoid;
    }

    .testemunhas-titulo {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 12px;
    }

    .testemunha-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .test-num {
      font-size: 10px;
      font-weight: 700;
      color: #333;
    }

    .test-linha {
      flex: 1;
      border-top: 1px solid #ccc;
    }

    /* ── Rodapé frase ── */
    .rodape-frase {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid #e8e8e4;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      font-style: italic;
      color: {{primaryColor}};
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="accent-bar"></div>
    {{#if logoBase64}}
    <img class="marca-dagua" src="data:{{logoMime}};base64,{{logoBase64}}" />
    {{/if}}

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="logo-area">
          {{#if logoBase64}}
          <img src="data:{{logoMime}};base64,{{logoBase64}}" />
          {{else}}
          <div class="logo-placeholder">{{artistName}}</div>
          {{/if}}
        </div>
        <div class="header-divider"></div>
        <div class="header-info">
          <div class="header-subtitle">Entretenimento Musical</div>
          <div class="header-title">Nota Contratual</div>
        </div>
      </div>
      <div class="header-right">
        <div class="header-number">{{numero}}</div>
        <div class="header-date">{{dataAssinatura}}</div>
      </div>
    </div>

    <!-- Corpo -->
    <div class="corpo">

      <!-- Partes -->
      <div class="partes-grid">
        <div class="parte-card">
          <div class="parte-role">Contratante</div>
          <div class="parte-nome">{{contratanteNome}}</div>
          <div class="parte-detalhe">
            CPF/CNPJ: {{contratanteCpfCnpj}}<br>
            {{#if contratanteRg}}RG: {{contratanteRg}} {{contratanteOrgao}}<br>{{/if}}
            {{#if contratanteTelefone}}Tel: {{contratanteTelefone}}<br>{{/if}}
            {{logradouro}}, {{numeroEndereco}} — {{bairro}}<br>
            {{cidade}}/{{uf}} — CEP {{cep}}
          </div>
        </div>
        <div class="parte-card">
          <div class="parte-role">Contratado</div>
          <div class="parte-nome">{{artistName}}</div>
          <div class="parte-detalhe">
            {{#if artistCnpj}}CNPJ: {{artistCnpj}}<br>{{/if}}
            {{artistAddress}}
          </div>
        </div>
      </div>

      <!-- Evento -->
      <div class="evento-grid">
        <div class="evento-item">
          <div class="evento-label">Evento</div>
          <div class="evento-value">{{evento}}</div>
        </div>
        <div class="evento-item">
          <div class="evento-label">Data</div>
          <div class="evento-value">{{dataEvento}}</div>
        </div>
        <div class="evento-item">
          <div class="evento-label">Local</div>
          <div class="evento-value">{{local}}</div>
        </div>
        <div class="evento-item">
          <div class="evento-label">Duração</div>
          <div class="evento-value">{{horas}}h de show{{#if horario}} às {{horario}}h{{/if}}</div>
        </div>
      </div>

      <!-- Valor destaque -->
      <div class="valor-destaque">
        <div>
          <div class="valor-destaque-label">Valor Total</div>
          <div class="valor-destaque-num">{{valorTotalFormatado}}</div>
          <div class="valor-destaque-extenso">{{valorTotalExtenso}}</div>
        </div>
        {{#if formaPagamento}}
        <div class="valor-destaque-pagamento">
          <div class="pagamento-label">Forma de Pagamento</div>
          <div class="pagamento-value">{{formaPagamento}}</div>
        </div>
        {{/if}}
      </div>

      <!-- Dados bancários -->
      <div class="banco-section">
        <div class="banco-title">Dados para Pagamento</div>
        <div class="banco-grid">
          <div class="banco-item">
            <div class="banco-label">Titular</div>
            <div class="banco-value">{{bankTitular}}</div>
          </div>
          <div class="banco-item">
            <div class="banco-label">PIX</div>
            <div class="banco-value">{{bankPix}}</div>
          </div>
          <div class="banco-item">
            <div class="banco-label">Banco</div>
            <div class="banco-value">{{bankBanco}}</div>
          </div>
          <div class="banco-item">
            <div class="banco-label">Conta / Agência</div>
            <div class="banco-value">{{bankConta}} / {{bankAgencia}}</div>
          </div>
        </div>
      </div>

      <!-- Cláusulas -->
      <div class="clausulas-section">
        <div class="clausulas-title">Cláusulas e Condições</div>

        <div class="clausula">
          <span class="clausula-num">01</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Data do Show</div>
            <div class="clausula-texto">O contratado se obriga a prestar seu serviço de show musical na seguinte data: <strong>{{dataEvento}}</strong>.</div>
          </div>
        </div>

        <div class="clausula">
          <span class="clausula-num">02</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Local e Duração</div>
            <div class="clausula-texto">O contratado desempenhará sua função, na duração de <strong>{{horas}}h de show</strong>{{#if horario}}, às <strong>{{horario}}h</strong>{{/if}}, no Local: <strong>{{local}}</strong>, <strong>{{cidadeEvento}}</strong>.</div>
          </div>
        </div>

        <div class="clausula">
          <span class="clausula-num">03</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Valor Contratado</div>
            <div class="clausula-texto">No valor do contrato estipula-se a importância de <strong>{{valorTotalFormatado}} ({{valorTotalExtenso}})</strong> para a apresentação de <strong>{{horas}} horas</strong> no local citado acima.</div>
          </div>
        </div>

        <div class="clausula">
          <span class="clausula-num">04</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Formato da Banda</div>
            <div class="clausula-texto">O artista se apresentará em seu formato de banda completa com os seguintes instrumentos: {{instruments}}.</div>
          </div>
        </div>

        <div class="clausula">
          <span class="clausula-num">05</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Transporte</div>
            <div class="clausula-texto">{{transporteTexto}}</div>
          </div>
        </div>

        <div class="obs"><strong>OBS.</strong> Água mineral e alimentação para <strong>{{pessoasBanda}}</strong> pessoas fica por conta do CONTRATANTE.</div>
        <div class="obs"><strong>OBS.</strong> Som profissional deverá ser fornecido pelo contratante ou espaço de eventos. Backline com técnico de som será fornecido pelo artista para uso próprio.</div>

        <div class="clausula">
          <span class="clausula-num">06</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Repertório</div>
            <div class="clausula-texto">A escolha do repertório ficará a critério do contratado, podendo incluir pedidos com antecedência de até 30 dias.</div>
          </div>
        </div>

        <div class="clausula">
          <span class="clausula-num">07</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Rescisão</div>
            <div class="clausula-texto">Em caso de rescisão, a parte infratora indenizará a parte prejudicada:</div>
            <div class="paragrafo">§ 1º — Multa de 10% do valor contratado, quando a rescisão se der até 15 dias antes do evento.</div>
            <div class="paragrafo">§ 2º — Multa de 50% do valor contratado, quando a rescisão se der no dia do evento.</div>
          </div>
        </div>

        <div class="clausula">
          <span class="clausula-num">08</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Pagamento</div>
            <div class="clausula-texto">{{#if formaPagamento}}O Contratante efetuará o pagamento da seguinte forma: <strong>{{formaPagamento}}</strong>.{{else}}O Contratante efetuará o pagamento de 30% na assinatura e o restante até a semana que antecede o evento.{{/if}}</div>
          </div>
        </div>

        <div class="clausula">
          <span class="clausula-num">09</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Comportamento do Público</div>
            <div class="clausula-texto">O espetáculo será interrompido se constatado comportamento inadequado do público, sendo o espetáculo considerado realizado sem multa ao CONTRATADO.</div>
          </div>
        </div>

        <div class="clausula">
          <span class="clausula-num">10</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Responsabilidades</div>
            <div class="clausula-texto">Ficam sob responsabilidade do CONTRATANTE os alvarás do juizado de menores, taxas de cobrança do ECAD e demais exigências legais.</div>
          </div>
        </div>

        <div class="clausula">
          <span class="clausula-num">11</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Foro</div>
            <div class="clausula-texto">As partes elegem o foro da Cidade de <strong>{{foro}}</strong> para questões judiciais originadas desta Nota Contratual.</div>
          </div>
        </div>

        {{#if clausulasEspeciais}}
        <div class="clausula">
          <span class="clausula-num">★</span>
          <div class="clausula-corpo">
            <div class="clausula-titulo">Cláusula Especial</div>
            <div class="clausula-texto">{{clausulasEspeciais}}</div>
          </div>
        </div>
        {{/if}}

        {{#if riderTecnico}}
        <div class="obs"><strong>Rider Técnico:</strong> {{riderTecnico}}</div>
        {{/if}}

        {{#if observacoes}}
        <div class="obs"><strong>OBS.</strong> {{observacoes}}</div>
        {{/if}}
      </div>

      <!-- Assinaturas -->
      <div class="assinaturas">
        <div class="local-data">{{foro}}, {{dataAssinatura}}</div>

        <div class="assinaturas-grid">
          <div class="assinatura-bloco">
            <div class="assinatura-linha"></div>
            <div class="assinatura-label">Contratante</div>
          </div>
          <div class="assinatura-bloco">
            {{#if assinarDigitalmente}}
            <div class="ass-dig">
              <div class="ass-dig-titulo">Assinado Digitalmente</div>
              <div class="ass-dig-info"><strong>{{artistLegalName}}</strong></div>
              <div class="ass-dig-info">CNPJ: {{artistCnpj}}</div>
              <div class="ass-dig-info">{{dataAssinaturaCompleta}}</div>
              <div class="ass-dig-codigo">Cód: {{hashContrato}}</div>
            </div>
            {{/if}}
            <div class="assinatura-linha"></div>
            <div class="assinatura-label">Contratado</div>
          </div>
        </div>

        <div class="testemunhas">
          <div class="testemunhas-titulo">Testemunhas</div>
          <div class="testemunha-row">
            <span class="test-num">1º</span>
            <div class="test-linha"></div>
          </div>
          <div class="testemunha-row">
            <span class="test-num">2º</span>
            <div class="test-linha"></div>
          </div>
        </div>

        {{#if fraseRodape}}
        <div class="rodape-frase">"{{fraseRodape}}"</div>
        {{/if}}
      </div>

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


export async function buildCtr002(
  artist: ArtistData,
  data: Record<string, any>,
  logo?: AssetResult | null,
): Promise<string> {
  const addr = (artist.address as any) || {};
  const bank = (artist.bankInfo as any) || {};
  const primaryColor = artist.primaryColor || "#E8A045";
  const logoMime = logo?.mime || "image/png";
  const logoBase64 = logo?.base64 || "";

  const valorCache = (parseFloat(data.cache) || 0) / 100;
  const backlineRaw = data.backline;
  const backlineNumerico = backlineRaw === "valor" ? (parseFloat(data.backlineValor) || 0) / 100 : 0;
  const transporteRaw = data.transporte;
  const transporteNumerico = transporteRaw === "valor" ? (parseFloat(data.transporteValor) || 0) / 100 : 0;
  const transporteFormatado = transporteNumerico > 0 ? transporteNumerico.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }) : null;
  const valorTotal = valorCache + backlineNumerico + transporteNumerico;
  const valorTotalFormatado = valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  const valorTotalExtenso = valorPorExtenso(valorTotal);

  const transporteTexto = (transporteRaw === "incluso" || !transporteRaw)
    ? "O deslocamento do artista e equipe já está incluso no valor do cachê, conforme combinado."
    : `O deslocamento do artista e equipe será cobrado à parte no valor de <strong>${transporteFormatado}</strong>, conforme combinado.`;

  const foro = addr.cidade ? `${addr.cidade}-${addr.estado}` : "Campo Grande-MS";
  const nomeSlug = (data.contratanteNome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const dataEventoBr = formatData(data.data);
  const hashContrato = crypto.createHash("sha256")
    .update(nomeSlug + dataEventoBr + valorTotalFormatado + Date.now().toString())
    .digest("hex").substring(0, 16).toUpperCase();

  const enderecoArtista = addr.rua
    ? `${addr.rua} Nº ${addr.numero || ""}, Bairro ${addr.bairro || ""}, ${addr.cidade || ""}/${addr.estado || ""}`
    : "—";

  const ctx = {
    primaryColor,
    primaryColorLight: primaryColor + "20",
    logoMime,
    logoBase64,
    artistName: escapeHtml(artist.name),
    numero: escapeHtml(data.numero || "CTR-" + Date.now().toString().slice(-6)),
    numeroEndereco: escapeHtml(data.numero),
    dataAssinatura: formatData(data.dataAssinatura || data.data),
    dataAssinaturaCompleta: new Date().toLocaleString('pt-BR', {timeZone: 'America/Campo_Grande'}),
    contratanteNome: escapeHtml(data.contratanteNome),
    contratanteCpfCnpj: escapeHtml(data.contratanteCpfCnpj),
    contratanteRg: escapeHtml(data.contratanteRg),
    contratanteOrgao: escapeHtml(data.contratanteOrgao),
    contratanteTelefone: escapeHtml(data.contratanteTelefone),
    logradouro: escapeHtml(data.logradouro),
    bairro: escapeHtml(data.bairro),
    cidade: escapeHtml(data.cidade),
    uf: escapeHtml(data.uf),
    cep: escapeHtml(data.cep),
    artistCnpj: escapeHtml(artist.cnpj),
    artistAddress: escapeHtml(enderecoArtista),
    artistLegalName: escapeHtml(artist.legalName || artist.name),
    bankTitular: escapeHtml(bank.titular || artist.legalName || artist.name),
    bankPix: escapeHtml(bank.pix || artist.pixKey),
    bankBanco: escapeHtml(bank.banco),
    bankConta: escapeHtml(bank.conta),
    bankAgencia: escapeHtml(bank.agencia),
    valorTotalFormatado,
    valorTotalExtenso,
    transporteTexto,
    pessoasBanda: data.pessoasBanda || 7,
    instruments: escapeHtml(artist.instruments || 'Bateria, Percussão, Guitarra, Baixo, Sanfona'),
    cidadeEvento: escapeHtml(data.cidadeEvento || foro),
    foro: escapeHtml(foro),
    clausulasEspeciais: escapeHtml(data.clausulasEspeciais),
    riderTecnico: escapeHtml(data.riderTecnico),
    observacoes: escapeHtml(data.observacoes),
    assinarDigitalmente: data.assinarDigitalmente !== false,
    hashContrato,
    fraseRodape: escapeHtml(data.fraseRodape),
    formaPagamento: escapeHtml(data.formaPagamento),
    evento: escapeHtml(data.evento),
    dataEvento: formatData(data.data),
    local: escapeHtml(data.local),
    horas: data.horas || 2,
    horario: escapeHtml(data.horario),
  };

  return renderLightTemplate(templateContratoLight, ctx);
}

// ── Wrapper Principal ────────────────────────────────────────────────────────
